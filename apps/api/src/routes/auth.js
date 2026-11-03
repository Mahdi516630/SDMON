import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireIdentity, requireRole } from '../middleware/auth.js';
const router = Router();

router.post('/register-client', requireIdentity, async (req, res, next) => {
  const fullName = String(req.body?.fullName ?? req.authIdentity.name ?? '').trim();
  const email = String(req.body?.email ?? req.authIdentity.email ?? '').trim().toLowerCase();
  const companyName = String(req.body?.companyName ?? '').trim() || null;
  const phone = String(req.body?.phone ?? '').trim() || null;
  if (fullName.length < 2 || fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid full name and email are required' });
  if (req.authIdentity.email && email !== req.authIdentity.email) return res.status(400).json({ error: 'Email must match the verified identity' });
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM app_users WHERE auth_subject = $1 OR email = $2 FOR UPDATE', [req.authIdentity.subject, email]);
    if (existing.rows[0]) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'An application account already exists for this identity or email' }); }
    const user = await client.query("INSERT INTO app_users (auth_subject, email, full_name, role) VALUES ($1, $2, $3, 'client') RETURNING id, email, full_name, role", [req.authIdentity.subject, email, fullName]);
    await client.query('INSERT INTO clients (user_id, client_number, company_name, contact_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6)', [user.rows[0].id, `CLI-${Date.now().toString(36).toUpperCase()}`, companyName, fullName, email, phone]);
    await client.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'self_register', 'client', $2)", [user.rows[0].id, user.rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ data: user.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); }
  finally { client.release(); }
});

router.get('/me', requireAuth, (req, res) => res.json({ data: { id: req.user.id, email: req.user.email, fullName: req.user.full_name, role: req.user.role, active: req.user.is_active } }));

router.get('/unlinked-identity', requireIdentity, async (req, res, next) => {
  try {
    const result = await getPool().query('SELECT id, role FROM app_users WHERE auth_subject = $1', [req.authIdentity.subject]);
    return res.json({ data: result.rows[0] ? { linked: true, role: result.rows[0].role } : { linked: false, email: req.authIdentity.email, name: req.authIdentity.name } });
  } catch (error) { return next(error); }
});

router.post('/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  const { authSubject, email, fullName, role, phone = null, jobTitle = null, companyName = null } = req.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (typeof authSubject !== 'string' || authSubject.length < 3 || authSubject.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 160 || !['employee', 'client'].includes(role)) return res.status(400).json({ error: 'Valid authSubject, email, fullName and employee/client role are required' });
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const created = await client.query('INSERT INTO app_users (auth_subject, email, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role', [authSubject, normalizedEmail, fullName.trim(), role]);
    if (role === 'employee') await client.query('INSERT INTO employees (user_id, employee_number, job_title, phone) VALUES ($1, $2, $3, $4)', [created.rows[0].id, `EMP-${Date.now().toString(36).toUpperCase()}`, jobTitle, phone]);
    else await client.query('INSERT INTO clients (user_id, client_number, company_name, contact_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6)', [created.rows[0].id, `CLI-${Date.now().toString(36).toUpperCase()}`, companyName, fullName.trim(), normalizedEmail, phone]);
    await client.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, 'provision_user', 'app_user', $2, $3::jsonb)", [req.user.id, created.rows[0].id, JSON.stringify({ role })]);
    await client.query('COMMIT');
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return res.status(409).json({ error: 'This identity or email is already registered' }); return next(error); }
  finally { client.release(); }
});
export default router;
