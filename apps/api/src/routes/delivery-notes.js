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
      `SELECT d.id, d.delivery_number, d.status, d.delivery_date, d.delivered_to, d.invoice_id, c.contact_name, c.company_name
       FROM delivery_notes d JOIN clients c ON c.id = d.client_id
       LEFT JOIN service_requests r ON r.id = d.request_id
       LEFT JOIN employees e ON e.id = r.assigned_employee_id
       ${where} ORDER BY d.created_at DESC LIMIT 200`,
      where ? [req.user.id] : [],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('admin', 'employee'), async (req, res, next) => {
  const { clientId, requestId = null, invoiceId = null, deliveredTo = null, deliveryDate = null, notes = null, items } = req.body ?? {};
  if (typeof clientId !== 'string' || !/^[0-9a-f-]{36}$/i.test(clientId) || !Array.isArray(items) || items.length < 1 || items.length > 50) return res.status(400).json({ error: 'Client and 1-50 delivery items are required' });
  if (req.user.role === 'employee' && !requestId) return res.status(403).json({ error: 'Employees may only create delivery notes for requests assigned to them' });
  if (deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) return res.status(400).json({ error: 'Invalid delivery date' });
  for (const item of items) if (typeof item.description !== 'string' || !item.description.trim() || item.description.length > 500 || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || Number(item.quantity) > 100000) return res.status(400).json({ error: 'Invalid delivery item' });
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const customer = await client.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (!customer.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Client not found' }); }
    if (requestId) {
      const request = await client.query(`SELECT r.id FROM service_requests r LEFT JOIN employees e ON e.id = r.assigned_employee_id WHERE r.id = $1 AND r.client_id = $2 AND ($3::text = 'admin' OR e.user_id = $4)`, [requestId, clientId, req.user.role, req.user.id]);
      if (!request.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found or not assigned to this employee' }); }
    }
    if (invoiceId) {
      const invoice = req.user.role === 'employee'
        ? await client.query(`SELECT i.id FROM invoices i JOIN quotes q ON q.id = i.quote_id JOIN service_requests r ON r.id = q.request_id JOIN employees e ON e.id = r.assigned_employee_id WHERE i.id = $1 AND i.client_id = $2 AND i.status <> $3 AND r.id = $4 AND e.user_id = $5`, [invoiceId, clientId, 'cancelled', requestId, req.user.id])
        : await client.query('SELECT id FROM invoices WHERE id = $1 AND client_id = $2 AND status <> $3', [invoiceId, clientId, 'cancelled']);
      if (!invoice.rows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invoice does not belong to this client or is cancelled' }); }
    }
    const number = `BL-${randomUUID().slice(0, 8).toUpperCase()}`;
    const created = await client.query(
      `INSERT INTO delivery_notes (delivery_number, client_id, invoice_id, request_id, status, delivery_date, delivered_to, notes, created_by)
       VALUES ($1,$2,$3,$4,'issued',COALESCE($5::date,CURRENT_DATE),$6,$7,$8) RETURNING id, delivery_number, status, delivery_date`,
      [number, clientId, invoiceId, requestId, deliveryDate, deliveredTo, notes, req.user.id],
    );
    for (let i = 0; i < items.length; i++) await client.query('INSERT INTO delivery_note_items (delivery_note_id, description, quantity, unit, position) VALUES ($1,$2,$3,$4,$5)', [created.rows[0].id, items[i].description.trim(), Number(items[i].quantity), items[i].unit || 'unité', i]);
    await client.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'create_delivery_note', 'delivery_note', $2)", [req.user.id, created.rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); }
  finally { client.release(); }
});

export default router;
