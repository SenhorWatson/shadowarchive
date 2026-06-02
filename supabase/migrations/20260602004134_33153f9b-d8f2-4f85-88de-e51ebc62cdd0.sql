-- has_role: only authenticated users (needed inside RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

-- handle_new_user: only the trigger should call it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- update_updated_at_column: only triggers should call it
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;