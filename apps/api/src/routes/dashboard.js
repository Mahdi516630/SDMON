import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const db = getPool();
    const [clients, employees, requests, invoices, payments] = await Promise.all([
      db.query('SELECT count(*)::int AS count FROM clients'),
      db.query("SELECT count(*)::int AS count FROM employees WHERE employment_status = 'active'"),
      db.query("SELECT count(*)::int AS count FROM service_requests WHERE status NOT IN ('completed', 'rejected', 'cancelled')"),
      db.query("SELECT count(*)::int AS count, COALESCE(sum(total), 0)::numeric(14,2) AS total FROM invoices WHERE status NOT IN ('draft', 'cancelled')"),
      db.query("SELECT COALESCE(sum(amount), 0)::numeric(14,2) AS total FROM payments"),
    ]);

    res.json({
      clients: clients.rows[0].count,
      activeEmployees: employees.rows[0].count,
      openRequests: requests.rows[0].count,
      issuedInvoices: invoices.rows[0].count,
      invoicedAmountDJF: invoices.rows[0].total,
      recordedPaymentsDJF: payments.rows[0].total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
