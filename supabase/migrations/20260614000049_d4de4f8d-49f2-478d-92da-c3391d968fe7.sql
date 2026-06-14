ALTER TABLE public.pastes
  ADD COLUMN IF NOT EXISTS theory_id uuid REFERENCES public.theories(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS pastes_theory_id_key ON public.pastes(theory_id) WHERE theory_id IS NOT NULL;