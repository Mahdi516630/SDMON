import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const role = req.user.role;
    const where = role === 'client' ? 'WHERE c.user_id = $1'
      : role === 'employee' ? 'WHERE e.user_id = $1' : '';
    const result = await getPool().query(
      `SELECT q.id, q.quote_number, q.status, q.issue_date, q.valid_until,
              q.currency, q.subtotal, q.tax_total, q.total,
              c.contact_name, c.company_name
       FROM quotes q
       JOIN clients c ON c.id = q.client_id
       LEFT JOIN service_requests r ON r.id = q.request_id
       LEFT JOIN employees e ON e.id = r.assigned_employee_id
       ${where}
       ORDER BY q.issue_date DESC LIMIT 200`,
      where ? [req.user.id] : [],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

export default router;
