import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin', 'employee'), async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, client_number, company_name, contact_name, email, phone, created_at FROM clients ORDER BY created_at DESC LIMIT 200',
    );
    res.json({ data: rows });
  } catch (error) { next(error); }
});

router.get('/me', requireRole('client'), async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, client_number, company_name, contact_name, email, phone, address FROM clients WHERE user_id = $1',
      [req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Client profile not found' });
    res.json({ data: rows[0] });
  } catch (error) { next(error); }
});

export default router;
