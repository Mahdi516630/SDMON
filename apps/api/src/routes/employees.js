import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin'), async (_req, res, next) => {
  try {
    const { rows } = await getPool().query(
      `SELECT e.id, e.employee_number, e.job_title, e.phone, e.start_date,
              e.employment_status, u.full_name, u.email
       FROM employees e
       JOIN app_users u ON u.id = e.user_id
       ORDER BY u.full_name
       LIMIT 200`,
    );
    res.json({ data: rows });
  } catch (error) { next(error); }
});

export default router;
