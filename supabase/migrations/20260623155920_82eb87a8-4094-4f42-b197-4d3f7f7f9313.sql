CREATE TABLE public.widget_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_ids text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_prefs TO authenticated;
GRANT ALL ON public.widget_prefs TO service_role;

ALTER TABLE public.widget_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own widget prefs"
  ON public.widget_prefs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all widget prefs"
  ON public.widget_prefs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_widget_prefs_updated_at
  BEFORE UPDATE ON public.widget_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();