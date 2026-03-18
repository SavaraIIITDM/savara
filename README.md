## Savara Ticketing Dashboard

This project includes a custom Google OAuth2 and PostgreSQL (Drizzle ORM) ticketing and event participation workflow for Savara:

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
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_COOKIE_NAME` (optional, defaults to `savara_session`)
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Google OAuth Setup

In Google Cloud Console:

1. Create OAuth client credentials for a web application.
2. Add Authorized redirect URI: `https://<your-domain>/auth/callback`.
3. Add local redirect URI: `http://localhost:3000/auth/callback`.

## Database Setup

Schema is managed through Drizzle. Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Core tables include:

- `profiles`, `roles`, `activation_codes`, `tickets`
- `events`, `teams`, `team_members`, `event_checkins`
- `users`, `sessions` for custom auth

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
