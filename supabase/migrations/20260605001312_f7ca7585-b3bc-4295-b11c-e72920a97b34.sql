-- Endurecer SECURITY DEFINER: remover EXECUTE público nas funções que não são chamadas pelo cliente.
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role é usada nas policies (executa como invoker), precisa ficar acessível.
