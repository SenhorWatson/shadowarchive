-- Pastes (relatórios investigativos)
CREATE TABLE public.pastes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  author text NOT NULL DEFAULT 'shadow_archive',
  published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pastes TO anon, authenticated;
GRANT ALL ON public.pastes TO service_role;

ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastes publicados são públicos"
  ON public.pastes FOR SELECT
  USING (published = true);

CREATE POLICY "Editores veem todos os pastes"
  ON public.pastes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Editores inserem pastes"
  ON public.pastes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Editores atualizam pastes"
  ON public.pastes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins removem pastes"
  ON public.pastes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER pastes_updated_at
  BEFORE UPDATE ON public.pastes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rate limiting de tentativas (camada extra)
CREATE TABLE public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_attempts_identifier_idx ON public.auth_attempts(identifier, created_at DESC);
GRANT ALL ON public.auth_attempts TO service_role;
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem tentativas" ON public.auth_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
