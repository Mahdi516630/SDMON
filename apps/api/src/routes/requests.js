import { randomUUID } from 'node:crypto';
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
  if (serviceId !== null && (typeof serviceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(serviceId))) {
    return res.status(400).json({ error: 'Invalid serviceId' });
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
    if (serviceId) {
      const service = await client.query('SELECT id FROM services WHERE id = $1 AND is_active = true', [serviceId]);
      if (!service.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Selected service is unavailable' });
      }
    }
    const requestNumber = `REQ-${randomUUID().slice(0, 8).toUpperCase()}`;
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
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});


router.patch('/:id/status', async (req, res, next) => {
  const { status, assignedEmployeeId } = req.body ?? {};
  const allowedStatuses = ['new', 'reviewing', 'quoted', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid request status' });
  if (req.user.role === 'client' && status !== 'cancelled') return res.status(403).json({ error: 'Clients may only cancel their own requests' });
  if (req.user.role === 'employee' && assignedEmployeeId !== undefined) return res.status(403).json({ error: 'Employees cannot reassign requests' });
  const db = getPool();
  try {
    const ownership = req.user.role === 'client'
      ? await db.query('SELECT r.id FROM service_requests r JOIN clients c ON c.id = r.client_id WHERE r.id = $1 AND c.user_id = $2 AND r.status IN (\'new\', \'reviewing\')', [req.params.id, req.user.id])
      : req.user.role === 'employee'
        ? await db.query('SELECT r.id FROM service_requests r JOIN employees e ON e.id = r.assigned_employee_id WHERE r.id = $1 AND e.user_id = $2', [req.params.id, req.user.id])
        : await db.query('SELECT id FROM service_requests WHERE id = $1', [req.params.id]);
    if (!ownership.rows[0]) return res.status(404).json({ error: 'Request not found or not accessible' });
    if (assignedEmployeeId !== undefined && req.user.role === 'admin') {
      if (assignedEmployeeId !== null) {
        const employee = await db.query("SELECT id FROM employees WHERE id = $1 AND employment_status = 'active'", [assignedEmployeeId]);
        if (!employee.rows[0]) return res.status(400).json({ error: 'Active employee not found' });
      }
    }
    const updated = await db.query(
      'UPDATE service_requests SET status = $1, assigned_employee_id = CASE WHEN $2::boolean THEN $3::uuid ELSE assigned_employee_id END, updated_at = now() WHERE id = $4 RETURNING id, request_number, status, assigned_employee_id',
      [status, assignedEmployeeId !== undefined, assignedEmployeeId ?? null, req.params.id],
    );
    await db.query("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, 'update_request', 'service_request', $2, $3::jsonb)", [req.user.id, req.params.id, JSON.stringify({ status, assignedEmployeeId: assignedEmployeeId ?? null })]);
    return res.json({ data: updated.rows[0] });
  } catch (error) { return next(error); }
});

export default router;
