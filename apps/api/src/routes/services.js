import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, code, name_fr, name_en, description_fr, description_en, unit, default_unit_price, currency FROM services WHERE is_active = true ORDER BY name_fr',
    );
    res.json({ data: rows });
  } catch (error) { next(error); }
});

export default router;
