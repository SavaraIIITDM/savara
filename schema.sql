-- Savara PostgreSQL schema (custom OAuth2 + app-side authorization)
-- This schema does not enable RLS. All authorization is enforced server-side.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Core auth tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ---------------------------------------------------------------------------
-- Role/profile
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  participant_type text NOT NULL CHECK (participant_type IN ('internal', 'external')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  email text PRIMARY KEY,
  is_volunteer boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Ticketing and activation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  purchaser_email text NOT NULL,
  ticket_quota integer NOT NULL CHECK (ticket_quota > 0),
  redeemed_count integer NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),
  purchase_type text NOT NULL CHECK (purchase_type IN ('internal', 'external')),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_purchaser_email ON public.activation_codes(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_activation_codes_verified_at ON public.activation_codes(verified_at DESC);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  activation_code_id uuid NOT NULL REFERENCES public.activation_codes(id) ON DELETE RESTRICT,
  participant_type text NOT NULL CHECK (participant_type IN ('internal', 'external')),
  qr_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_activation_code_id ON public.tickets(activation_code_id);

-- ---------------------------------------------------------------------------
-- Events, teams, and check-ins
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  team_min_size integer NOT NULL DEFAULT 1 CHECK (team_min_size >= 1),
  team_max_size integer NOT NULL DEFAULT 1 CHECK (team_max_size >= team_min_size),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  leader_ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams(event_id);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_ticket_id ON public.team_members(ticket_id);

CREATE TABLE IF NOT EXISTS public.event_checkins (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  checked_in_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_ticket_id ON public.event_checkins(ticket_id);

-- ---------------------------------------------------------------------------
-- Perks and attendance
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perk_checkins (
  id bigserial PRIMARY KEY,
  perk_id uuid NOT NULL REFERENCES public.perks(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  checked_in_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (perk_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_perk_checkins_perk_id ON public.perk_checkins(perk_id);
CREATE INDEX IF NOT EXISTS idx_perk_checkins_ticket_id ON public.perk_checkins(ticket_id);
