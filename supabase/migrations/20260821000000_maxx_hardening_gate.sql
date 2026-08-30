-- Canonical Supabase hardening migration for Agent MAXX
-- 1. Ensure handle_updated_at() trigger function exists independently of legacy migrations.
-- 2. Harden is_control_tower_operator() function to SECURITY INVOKER.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_control_tower_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.control_tower_operators
    WHERE email = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_control_tower_operator() FROM public;
GRANT EXECUTE ON FUNCTION public.is_control_tower_operator() TO authenticated, service_role;
