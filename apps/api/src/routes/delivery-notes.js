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
      `SELECT d.id, d.delivery_number, d.status, d.delivery_date,
              d.delivered_to, d.invoice_id, c.contact_name, c.company_name
       FROM delivery_notes d
       JOIN clients c ON c.id = d.client_id
       LEFT JOIN service_requests r ON r.id = d.request_id
       LEFT JOIN employees e ON e.id = r.assigned_employee_id
       ${where}
       ORDER BY d.created_at DESC LIMIT 200`,
      where ? [req.user.id] : [],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

export default router;
