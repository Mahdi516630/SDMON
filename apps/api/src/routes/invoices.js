import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const db = getPool();
    const isClient = req.user.role === 'client';
    const sql = `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date,
                        i.currency, i.subtotal, i.tax_total, i.total,
                        COALESCE(SUM(p.amount), 0)::numeric(14,2) AS amount_paid,
                        c.contact_name, c.company_name
                 FROM invoices i
                 JOIN clients c ON c.id = i.client_id
                 LEFT JOIN payments p ON p.invoice_id = i.id
                 ${isClient ? 'WHERE c.user_id = $1' : ''}
                 GROUP BY i.id, c.contact_name, c.company_name
                 ORDER BY i.issue_date DESC LIMIT 200`;
    const result = await db.query(sql, isClient ? [req.user.id] : []);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

export default router;
