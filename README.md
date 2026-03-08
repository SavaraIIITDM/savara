## Savara Ticketing Dashboard

This project now includes a Supabase-backed ticketing and event participation workflow for Savara:

- Google OAuth sign-in only
- Protected dashboard routes under `/dashboard/*`
- Admin purchase verification with activation-code generation
- Participant activation and e-ticket with QR
- Volunteer/admin event check-in with individual and team modes

## Environment Setup

Create `.env.local` using `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SITE_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Supabase Auth Setup

In Supabase dashboard:

1. Enable Google provider under Auth > Providers.
2. Set Site URL to your app URL.
3. Add redirect URL: `https://<your-domain>/auth/callback` and local `http://localhost:3000/auth/callback`.

## Database Setup

Schema and RLS were applied via Supabase MCP migrations in this branch, including:

- `profiles`, `roles`, `activation_codes`, `tickets`
- `events`, `teams`, `team_members`, `event_checkins`
- RPC functions for admin verification, activation redemption, and check-in workflows

## Role Management

Roles are email-based via `public.roles` table:

- default (no row): participant
- `is_volunteer = true`: volunteer
- `is_admin = true`: admin

Example SQL:

```sql
insert into public.roles (email, is_admin, is_volunteer)
values
  ('admin@example.com', true, false),
  ('volunteer@example.com', false, true)
on conflict (email) do update
set
  is_admin = excluded.is_admin,
  is_volunteer = excluded.is_volunteer;
```

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key Routes

- `/auth/login`
- `/dashboard`
- `/dashboard/ticket`
- `/dashboard/events/check-in`
- `/dashboard/admin/purchases`

## Activation Code Visibility

After admin verification:

- Activation code is generated.
- If purchaser account already exists and matches purchase type, one ticket is auto-assigned immediately.
- Remaining activation capacity (if any) is shown in purchaser `/dashboard/ticket` under "Assigned Activation Code".
- Admin can optionally notify purchaser via email using Gmail SMTP by checking "Notify via email".
