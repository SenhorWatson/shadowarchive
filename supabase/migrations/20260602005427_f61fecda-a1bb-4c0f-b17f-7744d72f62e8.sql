REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none(uuid) TO service_role;