# X Autoposting I — Getting Started

A Node.js/TypeScript service to schedule and post content to X (Twitter) using OAuth 2.0, with Prisma as the ORM.

## Prerequisites

- Node.js 18+
- npm 9+

## Quick Start

1) Clone and install

```bash
npm install
```

2) Configure environment variables

- Copy `example.env` to `.env` and fill values:

```bash
cp example.env .env
```

- Required vars in `.env`:
  - `X_CLIENT_ID` — your X app client ID
  - `X_CLIENT_SECRET` — your X app client secret
  - `X_CALLBACK_URL` — must match your app callback in the X Developer Portal
  - `SESSION_SECRET` — any strong random string
  - `PORT` — server port (e.g., 4000)

3) Database (Prisma + SQLite by default)

- Schema lives in `prisma/schema.prisma`.
- Generate Prisma Client and sync the database:

```bash
npx prisma generate
npx prisma db push
```

4) Run the app

- Development (watch mode):

```bash
npm run dev
```

- Build and start:

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` — Start dev server with ts-node-dev.
- `npm run build` — Type-check and compile to `dist/`.
- `npm start` — Run compiled server (`dist/server.js`).
- `npm run prisma:push` — `prisma db push` helper.

## Project Structure

- `src/` — TypeScript source
  - `src/lib/prisma.ts` — Prisma client instance
  - `src/lib/env.ts` — Environment variable parsing/validation
  - `src/auth/` — Auth/OAuth related logic
  - `src/jobs/` — Schedulers and background jobs
  - `src/media/` — Media handling utilities
- `prisma/` — Prisma schema and migrations (SQLite `dev.db` is created at root by default)

## Environment & Secrets

- `.env` is ignored by git (see `.gitignore`). Do not commit real secrets.
- For production, set environment variables via your deployment platform.

## Changing the Database

To use Postgres or MySQL instead of SQLite:

1) Update `datasource` in `prisma/schema.prisma`, e.g. Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2) Set `DATABASE_URL` in `.env`.

3) Re-generate and push schema:

```bash
npx prisma generate
npx prisma db push
```

## Troubleshooting

- "Module '@prisma/client' has no exported member 'PrismaClient'":
  - Ensure `generator client { provider = "prisma-client-js" }` and a `datasource` are present in `prisma/schema.prisma`.
  - Run `npx prisma generate`.
  - Ensure `@prisma/client` is installed.

- OAuth callback mismatch:
  - Verify `X_CALLBACK_URL` in `.env` exactly matches your app config in the X Developer Portal.

## Notes

- This project uses TypeScript and aims for SOLID, maintainable structure.
- Contributions and issues are welcome.
