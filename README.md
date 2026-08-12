# Event Check-In

A single-page check-in kiosk: type a phone number, tap **Check in**, see
`Checked in: <name>` and a running total tick up. Unknown numbers prompt for
a name and are added as a new guest.

## Stack

- **Next.js 16** (App Router, static export) + TypeScript + Tailwind CSS
- **Supabase** (Postgres) as the backend — no localStorage involved
- **Vitest** + **React Testing Library** for tests
- **GitHub Actions** for CI and deployment to **GitHub Pages**

## How it works

All check-in logic lives in the database, behind a single RPC function:

```sql
check_in_guest(p_phone text, p_name text default null)
```

- Looks up `guests` by (normalized) phone number.
- If found: inserts a row into `check_ins` and returns the guest's name.
- If not found and `p_name` is null: raises `NAME_REQUIRED` — the client
  catches this, shows a name field, and resubmits with the name.
- If not found and `p_name` is supplied: creates the guest, then checks them
  in.
- Returns the running total (`count(*)` on `check_ins`) in the same
  round trip, so the counter and the "Checked in" message always agree.

The `guests` and `check_ins` tables have RLS enabled with **no policies** —
the anon key has zero direct table access. The only public surface is the
`check_in_guest` and `get_check_in_count` RPC functions (`SECURITY DEFINER`,
`EXECUTE` granted to `anon`). This keeps the guest list from being readable
or writable except through that one intentional path. See
`supabase/migrations/` for the full schema.

Schema/logic: [`src/lib/checkin.ts`](src/lib/checkin.ts) ·
UI: [`src/app/page.tsx`](src/app/page.tsx)

## Local development

```bash
npm install
npm run dev
```

The Supabase URL and anon key are public by design (protected by RLS, not
secrecy) and are baked into [`src/lib/supabase.ts`](src/lib/supabase.ts) as
defaults, so no `.env` file is required to run this. They can still be
overridden with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
if pointing at a different project.

## Testing

```bash
npm test        # vitest
npm run lint
npx tsc --noEmit
```

Covers phone-number normalization, the check-in RPC wrapper (known guest,
unknown guest → name prompt → new guest, error surfacing), and the full page
flow with a mocked Supabase client.

## Deployment

Deployed on **Vercel**, connected to this repo — every push to `main`
triggers a new production deployment via Vercel's own GitHub integration.
`.github/workflows/ci.yml` separately runs lint/typecheck/tests on every
push and PR.
