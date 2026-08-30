-- Canonical prerequisite: Ensure handle_updated_at() trigger function exists
-- before any MAXX control tower migrations execute.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
