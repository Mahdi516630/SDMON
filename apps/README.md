# SDMON application workspaces

This directory contains the new application without replacing the public website at the repository root.

## Structure

- `api/`: isolated Express API, currently exposing only a health endpoint.
- `portal/`: isolated React + Vite portal starter for administration, employees and clients.

## Local development

Terminal 1:

```bash
cd apps/api
npm install
cp .env.example .env
npm run dev
```

Terminal 2:

```bash
cd apps/portal
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Current boundaries

- The existing root website, root Express server and GitHub Pages workflow are unchanged.
- No authentication, customer data, invoicing operations or database writes are implemented yet.
- Do not connect production credentials. Use a dedicated development database and preproduction service only after their environments have been verified.
