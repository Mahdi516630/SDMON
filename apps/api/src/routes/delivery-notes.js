import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const sql = `SELECT d.id, d.delivery_number, d.status, d.delivery_date,
                        d.delivered_to, d.invoice_id, c.contact_name, c.company_name
                 FROM delivery_notes d
                 JOIN clients c ON c.id = d.client_id
                 ${isClient ? 'WHERE c.user_id = $1' : ''}
                 ORDER BY d.created_at DESC LIMIT 200`;
    const result = await getPool().query(sql, isClient ? [req.user.id] : []);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

export default router;
