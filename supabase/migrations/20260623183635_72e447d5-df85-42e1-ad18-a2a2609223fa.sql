CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  insight_text text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_insights_client_id_created_at_idx ON public.ai_insights (client_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Clients (AAL2) can read their own insights.
CREATE POLICY "Clients read own ai_insights"
  ON public.ai_insights FOR SELECT
  TO authenticated
  USING (public.is_aal2() AND client_id = auth.uid());

-- Admins (AAL2) can read all insights.
CREATE POLICY "Admins read all ai_insights"
  ON public.ai_insights FOR SELECT
  TO authenticated
  USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'));

-- Admins (AAL2) can write insights for any client.
CREATE POLICY "Admins write ai_insights"
  ON public.ai_insights FOR ALL
  TO authenticated
  USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'));

-- Realtime so the dashboard refreshes when new insights are written.
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;