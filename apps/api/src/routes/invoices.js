import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const role = req.user.role;
    const where = role === 'client' ? 'WHERE c.user_id = $1' : role === 'employee' ? 'WHERE e.user_id = $1' : '';
    const result = await getPool().query(
      `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.currency, i.subtotal, i.tax_total, i.total,
              COALESCE(SUM(p.amount), 0)::numeric(14,2) AS amount_paid, c.contact_name, c.company_name
       FROM invoices i JOIN clients c ON c.id = i.client_id
       LEFT JOIN payments p ON p.invoice_id = i.id
       LEFT JOIN quotes q ON q.id = i.quote_id
       LEFT JOIN service_requests r ON r.id = q.request_id
       LEFT JOIN employees e ON e.id = r.assigned_employee_id
       ${where} GROUP BY i.id, c.contact_name, c.company_name, e.user_id
       ORDER BY i.issue_date DESC LIMIT 200`,
      where ? [req.user.id] : [],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('admin', 'employee'), async (req, res, next) => {
  const { quoteId, dueDate = null, notes = null } = req.body ?? {};
  if (typeof quoteId !== 'string' || !/^[0-9a-f-]{36}$/i.test(quoteId)) return res.status(400).json({ error: 'A valid quoteId is required' });
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return res.status(400).json({ error: 'Invalid due date' });
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const quoteResult = await client.query(
      `SELECT q.* FROM quotes q LEFT JOIN service_requests r ON r.id = q.request_id LEFT JOIN employees e ON e.id = r.assigned_employee_id
       WHERE q.id = $1 AND q.status = 'accepted' AND ($2::text = 'admin' OR e.user_id = $3) FOR UPDATE OF q`,
      [quoteId, req.user.role, req.user.id],
    );
    const quote = quoteResult.rows[0];
    if (!quote) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Accepted quote not found or not assigned to this employee' }); }
    const existing = await client.query('SELECT id FROM invoices WHERE quote_id = $1 AND status <> $2', [quoteId, 'cancelled']);
    if (existing.rows[0]) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'An invoice already exists for this quote' }); }
    const number = `FAC-${randomUUID().slice(0, 8).toUpperCase()}`;
    const created = await client.query(
      `INSERT INTO invoices (invoice_number, client_id, quote_id, status, due_date, currency, subtotal, tax_total, total, notes, created_by)
       VALUES ($1,$2,$3,'issued',$4,$5,$6,$7,$8,$9,$10) RETURNING id, invoice_number, status, due_date, currency, subtotal, tax_total, total`,
      [number, quote.client_id, quote.id, dueDate, quote.currency, quote.subtotal, quote.tax_total, quote.total, notes ?? quote.notes, req.user.id],
    );
    await client.query(
      `INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, tax_rate, line_total, position)
       SELECT $1, service_id, description, quantity, unit_price, tax_rate, line_total, position FROM quote_items WHERE quote_id = $2`,
      [created.rows[0].id, quoteId],
    );
    await client.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'create_invoice', 'invoice', $2)", [req.user.id, created.rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); }
  finally { client.release(); }
});

export default router;
