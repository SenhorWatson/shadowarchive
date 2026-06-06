
-- 1. Remove reivindicar admin
DROP FUNCTION IF EXISTS public.claim_admin_if_none(uuid);

-- 2. Revoga EXECUTE público de SECURITY DEFINER (mantém service_role)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role precisa ficar disponível para authenticated porque é referenciada em policies;
-- na verdade policies rodam como definer da query, então podemos revogar também:
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 3. UPDATE policy no bucket documents (replace existente se houver)
DROP POLICY IF EXISTS "Editors update documents" ON storage.objects;
CREATE POLICY "Editors update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'editor'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'editor'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Editors insert documents" ON storage.objects;
CREATE POLICY "Editors insert documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'editor'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Editors read documents" ON storage.objects;
CREATE POLICY "Editors read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'editor'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Admins delete documents" ON storage.objects;
CREATE POLICY "Admins delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 4. auth_attempts: bloquear escrita por authenticated (RLS já bloqueia, mas explicitamos GRANTs)
REVOKE INSERT, UPDATE, DELETE ON public.auth_attempts FROM authenticated, anon;
GRANT SELECT ON public.auth_attempts TO authenticated;
GRANT ALL ON public.auth_attempts TO service_role;
