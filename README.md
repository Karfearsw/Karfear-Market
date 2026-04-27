# KSW Dashboard (Next.js)

Admin dashboard UI for KSW monitoring + task engine + inventory catalog, built with Next.js (App Router) + Tailwind + shadcn/ui.

## Local Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Supabase Setup (No Login / Server-Key Mode)

This build is designed for private/admin deployments. It can run with:
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (required for server route handlers)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optional, only needed if you later add client-side Supabase usage)

1) Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

2) Fill in:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optional)

3) In Supabase SQL editor:

- Run `supabase/schema.sql`
- Run `supabase/seed.sql`

Alternatively, run the SQL migrations in order:

- `supabase/migrations/001_initial.sql`
- `supabase/migrations/002_adapters_engine_state.sql`
- `supabase/migrations/003_tasks_pinned.sql`

## Notes

- No secrets are committed; `.env.local` is ignored by git.
- If Supabase env vars are not set, the API returns `SUPABASE_NOT_CONFIGURED` and the UI will not load data.
- Proxy health checks run server-side via `undici` and rely on outbound connectivity from your deployment environment.
