ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS is_event_volunteer boolean NOT NULL DEFAULT false;

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS is_perk_volunteer boolean NOT NULL DEFAULT false;
