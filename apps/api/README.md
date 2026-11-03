# SDMON API

Isolated Express API workspace. It does not replace or modify the existing root `server.js`.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Health endpoint: `GET http://localhost:4000/api/v1/health`.

## Development infrastructure

The initial schema in `migrations/001_initial_schema.sql` has been applied to the isolated Neon development project and its `development` branch. See `../../docs/NEON-DEV-CONFIG.md` for identifiers and non-secret Auth endpoints.

The API uses PostgreSQL through `pg` and expects a development-only pooled `DATABASE_URL`. Schema migrations should use a direct, non-pooled connection. Never commit `.env` or database credentials.

Neon Managed Better Auth is enabled on the development branch. `NEON_AUTH_JWKS_URL` and `NEON_AUTH_ISSUER` in `.env.example` are branch-specific public verification settings. Each authenticated Neon subject must have an active `app_users` row and one of the roles `admin`, `employee`, or `client`. The API fails closed when identity configuration or role mapping is missing. User-to-role provisioning and the complete portal sign-in flow are not yet finished.

## Initial endpoints

- `GET /api/v1/health` — public health check.
- `GET /api/v1/dashboard/summary` — admin only.
- `GET /api/v1/clients` — admin/employee only.
- `GET /api/v1/clients/me` — client self-profile only.
- `GET /api/v1/services` — authenticated users.
- `GET /api/v1/requests` — all requests for admins, assigned requests for employees, own requests for clients.
- `POST /api/v1/requests` — clients create service requests.
- `GET /api/v1/quotes`, `GET /api/v1/invoices`, `GET /api/v1/payments`, `GET /api/v1/delivery-notes` — role-scoped document views.
- `POST /api/v1/payments` — admin/employee manual payment entry with invoice locking, outstanding-balance validation and audit event.

This is an initial protected API foundation, not a production-ready business system. Sign-up, invitation and role assignment workflows, document lifecycle, payment recording and full authorization tests remain to be implemented and verified before real business data is used.
