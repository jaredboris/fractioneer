
-- Redesign notes_read_state to track read state per (thread, viewer) so admins can mark threads read.
DROP TABLE IF EXISTS public.notes_read_state CASCADE;

CREATE TABLE public.notes_read_state (
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT 'epoch',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes_read_state TO authenticated;
GRANT ALL ON public.notes_read_state TO service_role;

ALTER TABLE public.notes_read_state ENABLE ROW LEVEL SECURITY;

-- A viewer can read their own read-state rows (and admins can read any).
CREATE POLICY "Viewer or admin can read" ON public.notes_read_state
  FOR SELECT TO authenticated
  USING (
    public.is_aal2()
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

-- A viewer can insert/update only their own row, and only for a thread they
-- can see (their own thread, or any thread if admin).
CREATE POLICY "Viewer can insert own" ON public.notes_read_state
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_aal2()
    AND user_id = auth.uid()
    AND (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Viewer can update own" ON public.notes_read_state
  FOR UPDATE TO authenticated
  USING (public.is_aal2() AND user_id = auth.uid())
  WITH CHECK (
    public.is_aal2()
    AND user_id = auth.uid()
    AND (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER update_notes_read_state_updated_at
  BEFORE UPDATE ON public.notes_read_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
