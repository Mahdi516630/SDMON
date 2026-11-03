import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const db = getPool();
    const isClient = req.user.role === 'client';
    const sql = `SELECT q.id, q.quote_number, q.status, q.issue_date, q.valid_until,
                        q.currency, q.subtotal, q.tax_total, q.total,
                        c.contact_name, c.company_name
                 FROM quotes q JOIN clients c ON c.id = q.client_id
                 ${isClient ? 'WHERE c.user_id = $1' : ''}
                 ORDER BY q.issue_date DESC LIMIT 200`;
    const result = await db.query(sql, isClient ? [req.user.id] : []);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

export default router;
