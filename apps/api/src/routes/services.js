import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await getPool().query('SELECT id, code, name_fr, name_en, description_fr, description_en, unit, default_unit_price, currency FROM services WHERE is_active = true ORDER BY name_fr');
    res.json({ data: rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  const { code, nameFr, nameEn = null, descriptionFr = null, descriptionEn = null, unit = 'forfait', unitPrice = 0, currency = 'DJF' } = req.body ?? {};
  const price = Number(unitPrice);
  if (typeof code !== 'string' || !/^[A-Z0-9_-]{2,30}$/.test(code) || typeof nameFr !== 'string' || nameFr.trim().length < 2 || nameFr.length > 160 || !Number.isFinite(price) || price < 0 || !['DJF', 'USD'].includes(currency)) return res.status(400).json({ error: 'Invalid service data' });
  try {
    const { rows } = await getPool().query(
      'INSERT INTO services (code, name_fr, name_en, description_fr, description_en, unit, default_unit_price, currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [code, nameFr.trim(), nameEn, descriptionFr, descriptionEn, unit, price, currency],
    );
    await getPool().query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'create_service', 'service', $2)", [req.user.id, rows[0].id]);
    return res.status(201).json({ data: rows[0] });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Service code already exists' }); return next(error); }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  const { nameFr, nameEn, descriptionFr, descriptionEn, unit, unitPrice, currency, isActive } = req.body ?? {};
  if (unitPrice !== undefined && (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0)) return res.status(400).json({ error: 'Invalid unit price' });
  if (currency !== undefined && !['DJF', 'USD'].includes(currency)) return res.status(400).json({ error: 'Invalid currency' });
  try {
    const { rows } = await getPool().query(
      `UPDATE services SET name_fr=COALESCE($1,name_fr), name_en=COALESCE($2,name_en), description_fr=COALESCE($3,description_fr),
       description_en=COALESCE($4,description_en), unit=COALESCE($5,unit), default_unit_price=COALESCE($6,default_unit_price),
       currency=COALESCE($7,currency), is_active=COALESCE($8,is_active), updated_at=now() WHERE id=$9 RETURNING *`,
      [nameFr ?? null, nameEn ?? null, descriptionFr ?? null, descriptionEn ?? null, unit ?? null, unitPrice ?? null, currency ?? null, isActive ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Service not found' });
    await getPool().query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'update_service', 'service', $2)", [req.user.id, req.params.id]);
    return res.json({ data: rows[0] });
  } catch (error) { return next(error); }
});
export default router;
