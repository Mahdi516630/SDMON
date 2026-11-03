# SDMON API

Isolated Express API workspace. It does not replace or modify the existing root `server.js`.

## Local setup

```bash
cd apps/api
npm install
cp .env.example .env
npm run dev
```

Health endpoint: `GET http://localhost:4000/api/v1/health`.

No database connection, authentication, or business write endpoints are enabled yet. Add these only after the Neon project and development database have been inspected and approved. Never commit `.env`.
