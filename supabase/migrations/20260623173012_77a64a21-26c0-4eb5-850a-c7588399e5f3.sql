
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('admin','client')),
  author_name text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notes_client_id_created_at_idx ON public.notes (client_id, created_at DESC);

GRANT SELECT, INSERT ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own or admin all" ON public.notes
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Client posts on own dashboard" ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (author_role = 'client' AND client_id = auth.uid())
      OR (author_role = 'admin' AND public.has_role(auth.uid(), 'admin'))
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

CREATE TABLE public.notes_read_state (
  client_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT 'epoch',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notes_read_state TO authenticated;
GRANT ALL ON public.notes_read_state TO service_role;

ALTER TABLE public.notes_read_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can read" ON public.notes_read_state
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert own" ON public.notes_read_state
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Owner can update own" ON public.notes_read_state
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE TRIGGER update_notes_read_state_updated_at
  BEFORE UPDATE ON public.notes_read_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
