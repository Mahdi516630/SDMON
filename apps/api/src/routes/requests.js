import { Router } from 'express';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const db = getPool();
    let result;
    if (req.user.role === 'client') {
      result = await db.query(
        `SELECT r.id, r.request_number, r.title, r.description, r.status,
                r.requested_at, r.due_date, s.name_fr AS service_name
         FROM service_requests r
         JOIN clients c ON c.id = r.client_id
         LEFT JOIN services s ON s.id = r.service_id
         WHERE c.user_id = $1
         ORDER BY r.requested_at DESC LIMIT 200`,
        [req.user.id],
      );
    } else if (req.user.role === 'employee') {
      result = await db.query(
        `SELECT r.id, r.request_number, r.title, r.description, r.status,
                r.requested_at, r.due_date, s.name_fr AS service_name,
                c.contact_name, c.company_name
         FROM service_requests r
         JOIN clients c ON c.id = r.client_id
         LEFT JOIN services s ON s.id = r.service_id
         JOIN employees e ON e.id = r.assigned_employee_id
         WHERE e.user_id = $1
         ORDER BY r.requested_at DESC LIMIT 200`,
        [req.user.id],
      );
    } else {
      result = await db.query(
        `SELECT r.id, r.request_number, r.title, r.description, r.status,
                r.requested_at, r.due_date, s.name_fr AS service_name,
                c.contact_name, c.company_name
         FROM service_requests r
         JOIN clients c ON c.id = r.client_id
         LEFT JOIN services s ON s.id = r.service_id
         ORDER BY r.requested_at DESC LIMIT 200`,
      );
    }
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('client'), async (req, res, next) => {
  const { title, description = null, serviceId = null } = req.body ?? {};
  if (typeof title !== 'string' || title.trim().length < 3 || title.length > 180) {
    return res.status(400).json({ error: 'A valid request title is required' });
  }
  if (description !== null && (typeof description !== 'string' || description.length > 5000)) {
    return res.status(400).json({ error: 'Invalid request description' });
  }

  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const profile = await client.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!profile.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Client profile not configured' });
    }
    const requestNumber = `REQ-${Date.now()}`;
    const created = await client.query(
      `INSERT INTO service_requests (request_number, client_id, service_id, title, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, request_number, title, status, requested_at`,
      [requestNumber, profile.rows[0].id, serviceId, title.trim(), description],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
       VALUES ($1, 'create', 'service_request', $2)`,
      [req.user.id, created.rows[0].id],
    );
    await client.query('COMMIT');
    res.status(201).json({ data: created.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
