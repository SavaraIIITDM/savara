CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  google_sub text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS participant_type text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_changed_certificate_name boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET participant_type = CASE
  WHEN lower(email) LIKE '%@iiitdm.ac.in' THEN 'internal'
  ELSE 'external'
END
WHERE participant_type IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN participant_type SET NOT NULL;

INSERT INTO public.users (id, email, google_sub, full_name, avatar_url, created_at, updated_at)
SELECT
  p.id,
  lower(p.email),
  'legacy:' || p.id::text,
  p.full_name,
  NULL,
  COALESCE(p.created_at, now()),
  COALESCE(p.updated_at, now())
FROM public.profiles p
ON CONFLICT (id) DO UPDATE
SET
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = now();

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT conname, conrelid::regclass::text AS table_name
    FROM pg_constraint
    WHERE contype = 'f' AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', fk.table_name, fk.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.activation_codes
  DROP CONSTRAINT IF EXISTS activation_codes_created_by_fkey;

ALTER TABLE public.activation_codes
  ADD CONSTRAINT activation_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_created_by_fkey;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_added_by_fkey;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.event_checkins
  DROP CONSTRAINT IF EXISTS event_checkins_checked_in_by_fkey;

ALTER TABLE public.event_checkins
  ADD CONSTRAINT event_checkins_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.perk_checkins
  DROP CONSTRAINT IF EXISTS perk_checkins_checked_in_by_fkey;

ALTER TABLE public.perk_checkins
  ADD CONSTRAINT perk_checkins_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id) ON DELETE SET NULL;

DO $$
DECLARE
  policy_rec record;
BEGIN
  FOR policy_rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perk_checkins DISABLE ROW LEVEL SECURITY;
