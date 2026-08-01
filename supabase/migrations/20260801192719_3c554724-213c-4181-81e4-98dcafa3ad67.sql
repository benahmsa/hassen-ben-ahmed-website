CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

ALTER FUNCTION public.update_updated_at_column() SET SCHEMA private;
ALTER FUNCTION private.update_updated_at_column() SET search_path = public;
GRANT EXECUTE ON FUNCTION private.update_updated_at_column() TO anon, authenticated, service_role;