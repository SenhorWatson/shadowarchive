
-- Storage bucket for investigative documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only authenticated can read; only admin/editor can upload/delete
CREATE POLICY "Authenticated can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Editors can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

-- Add file_path to sources to link uploaded documents
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS file_path text;

-- Bootstrap: claim admin if no admin exists yet (first operator)
CREATE OR REPLACE FUNCTION public.claim_admin_if_none(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_any_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_any_admin;
  IF has_any_admin THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_if_none(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none(uuid) TO authenticated;
