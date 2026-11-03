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
      db.query("SELECT count(*)::int AS count FROM invoices WHERE status NOT IN ('draft', 'cancelled')"),
      db.query("SELECT count(*)::int AS count FROM payments"),
    ]);
    res.json({
      clients: clients.rows[0].count,
      activeEmployees: employees.rows[0].count,
      openRequests: requests.rows[0].count,
      issuedInvoices: invoices.rows[0].count,
      recordedPayments: payments.rows[0].count,
    });
  } catch (error) { next(error); }
});

router.get('/financial-report', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const db = getPool();
    const [invoiced, collected, outstanding, monthly] = await Promise.all([
      db.query("SELECT currency, COALESCE(SUM(total), 0)::numeric(14,2) AS total FROM invoices WHERE status NOT IN ('draft', 'cancelled') GROUP BY currency ORDER BY currency"),
      db.query('SELECT currency, COALESCE(SUM(amount), 0)::numeric(14,2) AS total FROM payments GROUP BY currency ORDER BY currency'),
      db.query("SELECT i.currency, COALESCE(SUM(i.total - COALESCE(p.paid, 0)), 0)::numeric(14,2) AS total FROM invoices i LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id) p ON p.invoice_id = i.id WHERE i.status NOT IN ('draft', 'cancelled', 'paid') GROUP BY i.currency ORDER BY i.currency"),
      db.query("SELECT to_char(date_trunc('month', payment_date), 'YYYY-MM') AS month, currency, SUM(amount)::numeric(14,2) AS total FROM payments WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months' GROUP BY 1, 2 ORDER BY 1, 2"),
    ]);
    res.json({ invoiced: invoiced.rows, collected: collected.rows, outstanding: outstanding.rows, monthlyCollections: monthly.rows });
  } catch (error) { next(error); }
});

export default router;
