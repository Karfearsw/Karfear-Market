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
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (server uses it to query Supabase), or
- `SUPABASE_SERVICE_ROLE_KEY` (optional, higher privileges).

1) Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

2) Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

3) In Supabase SQL editor:

- Run `supabase/schema.sql`
- Run `supabase/seed.sql`

## Notes

- No secrets are committed; `.env.local` is ignored by git.
- If Supabase env vars are not set, the API returns `SUPABASE_NOT_CONFIGURED`.
