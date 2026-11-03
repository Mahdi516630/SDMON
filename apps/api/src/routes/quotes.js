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
      `SELECT q.id, q.quote_number, q.status, q.issue_date, q.valid_until, q.currency, q.subtotal, q.tax_total, q.total, c.contact_name, c.company_name
       FROM quotes q JOIN clients c ON c.id = q.client_id
       LEFT JOIN service_requests r ON r.id = q.request_id
       LEFT JOIN employees e ON e.id = r.assigned_employee_id
       ${where} ORDER BY q.issue_date DESC LIMIT 200`,
      where ? [req.user.id] : [],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('admin', 'employee'), async (req, res, next) => {
  const { clientId, requestId = null, currency = 'DJF', validUntil = null, notes = null, items } = req.body ?? {};
  if (!/^[0-9a-f-]{36}$/i.test(clientId || '') || !['DJF', 'USD'].includes(currency) || !Array.isArray(items) || items.length < 1 || items.length > 50) return res.status(400).json({ error: 'Client, currency and 1-50 quote items are required' });
  if (validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return res.status(400).json({ error: 'Invalid validity date' });
  let subtotal = 0; let taxTotal = 0;
  const normalized = [];
  for (const item of items) {
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    const quantity = Number(item.quantity); const unitPrice = Number(item.unitPrice); const taxRate = Number(item.taxRate ?? 0);
    if (!description || description.length > 500 || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) return res.status(400).json({ error: 'Invalid quote item' });
    const line = Math.round(quantity * unitPrice * 100) / 100;
    const tax = Math.round(line * taxRate) / 100;
    subtotal += line; taxTotal += tax;
    normalized.push({ description, quantity, unitPrice, taxRate, line });
  }
  subtotal = Math.round(subtotal * 100) / 100; taxTotal = Math.round(taxTotal * 100) / 100;
  const db = getPool(); const client = await db.connect();
  try {
    await client.query('BEGIN');
    const customer = await client.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (!customer.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Client not found' }); }
    if (requestId) {
      const request = await client.query(`SELECT r.id FROM service_requests r LEFT JOIN employees e ON e.id = r.assigned_employee_id WHERE r.id = $1 AND r.client_id = $2 AND ($3::text = 'admin' OR e.user_id = $4)`, [requestId, clientId, req.user.role, req.user.id]);
      if (!request.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found or not assigned to this employee' }); }
    }
    const number = `DEV-${randomUUID().slice(0, 8).toUpperCase()}`;
    const created = await client.query(`INSERT INTO quotes (quote_number, client_id, request_id, valid_until, currency, subtotal, tax_total, total, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, quote_number, status, subtotal, tax_total, total, currency`, [number, clientId, requestId, validUntil, currency, subtotal, taxTotal, subtotal + taxTotal, notes, req.user.id]);
    for (const item of normalized) await client.query('INSERT INTO quote_items (quote_id, description, quantity, unit_price, tax_rate, line_total) VALUES ($1,$2,$3,$4,$5,$6)', [created.rows[0].id, item.description, item.quantity, item.unitPrice, item.taxRate, item.line]);
    await client.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'create_quote', 'quote', $2)", [req.user.id, created.rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); }
  finally { client.release(); }
});

router.patch('/:id/status', async (req, res, next) => {
  const { status } = req.body ?? {};
  if (!['sent', 'accepted', 'rejected', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid quote status' });
  try {
    const allowed = req.user.role === 'client' ? ['accepted', 'rejected'] : ['sent', 'accepted', 'rejected', 'cancelled'];
    if (!allowed.includes(status)) return res.status(403).json({ error: 'Insufficient permissions' });
    const ownership = req.user.role === 'client'
      ? await getPool().query('SELECT q.id FROM quotes q JOIN clients c ON c.id = q.client_id WHERE q.id = $1 AND c.user_id = $2', [req.params.id, req.user.id])
      : req.user.role === 'employee'
        ? await getPool().query('SELECT q.id FROM quotes q JOIN service_requests r ON r.id = q.request_id JOIN employees e ON e.id = r.assigned_employee_id WHERE q.id = $1 AND e.user_id = $2', [req.params.id, req.user.id])
        : await getPool().query('SELECT id FROM quotes WHERE id = $1', [req.params.id]);
    if (!ownership.rows[0]) return res.status(404).json({ error: 'Quote not found' });
    const updated = await getPool().query('UPDATE quotes SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, quote_number, status', [status, req.params.id]);
    await getPool().query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, 'update_quote_status', 'quote', $2, $3::jsonb)", [req.user.id, req.params.id, JSON.stringify({ status })]);
    return res.json({ data: updated.rows[0] });
  } catch (error) { return next(error); }
});

export default router;
