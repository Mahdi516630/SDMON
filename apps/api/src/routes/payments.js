import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function toCents(value) {
  const text = String(value);
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

router.get('/', async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const sql = `SELECT p.id, p.payment_number, p.invoice_id, p.amount, p.currency,
                        p.payment_method, p.payment_date, p.reference,
                        i.invoice_number, c.contact_name
                 FROM payments p
                 JOIN invoices i ON i.id = p.invoice_id
                 JOIN clients c ON c.id = i.client_id
                 ${isClient ? 'WHERE c.user_id = $1' : ''}
                 ORDER BY p.payment_date DESC, p.created_at DESC LIMIT 200`;
    const result = await getPool().query(sql, isClient ? [req.user.id] : []);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('admin', 'employee'), async (req, res, next) => {
  const { invoiceId, amount, paymentMethod, paymentDate, reference = null, notes = null } = req.body ?? {};
  const cents = toCents(amount);
  const methods = ['cash', 'bank_transfer', 'cheque', 'mobile_money', 'other'];
  if (typeof invoiceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(invoiceId)) {
    return res.status(400).json({ error: 'A valid invoiceId is required' });
  }
  if (cents === null || cents <= 0n) return res.status(400).json({ error: 'A positive amount with at most two decimals is required' });
  if (!methods.includes(paymentMethod)) return res.status(400).json({ error: 'Unsupported payment method' });
  if (paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return res.status(400).json({ error: 'Invalid payment date' });
  if (reference !== null && (typeof reference !== 'string' || reference.length > 160)) return res.status(400).json({ error: 'Invalid reference' });
  if (notes !== null && (typeof notes !== 'string' || notes.length > 2000)) return res.status(400).json({ error: 'Invalid notes' });

  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const invoiceResult = await client.query(
      'SELECT id, total, status FROM invoices WHERE id = $1 FOR UPDATE',
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice || ['draft', 'cancelled'].includes(invoice.status)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found or not payable' });
    }

    const totalCents = toCents(invoice.total);
    const paidResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0)::numeric(14,2) AS paid FROM payments WHERE invoice_id = $1',
      [invoiceId],
    );
    const paidCents = toCents(paidResult.rows[0].paid) ?? 0n;
    if (paidCents + cents > totalCents) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Payment exceeds the outstanding invoice balance' });
    }

    const paymentNumber = `PAY-${randomUUID().slice(0, 8).toUpperCase()}`;
    const inserted = await client.query(
      `INSERT INTO payments (payment_number, invoice_id, amount, payment_method, payment_date, reference, received_by, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6, $7, $8)
       RETURNING id, payment_number, invoice_id, amount, currency, payment_method, payment_date, reference`,
      [paymentNumber, invoiceId, (Number(cents) / 100).toFixed(2), paymentMethod, paymentDate ?? null, reference, req.user.id, notes],
    );

    const newPaid = paidCents + cents;
    const nextStatus = newPaid === totalCents ? 'paid' : 'partially_paid';
    await client.query('UPDATE invoices SET status = $1, updated_at = now() WHERE id = $2', [nextStatus, invoiceId]);
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'record_payment', 'invoice', $2, $3::jsonb)`,
      [req.user.id, invoiceId, JSON.stringify({ paymentNumber, amount: (Number(cents) / 100).toFixed(2), paymentMethod })],
    );
    await client.query('COMMIT');
    res.status(201).json({ data: inserted.rows[0], invoiceStatus: nextStatus });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
