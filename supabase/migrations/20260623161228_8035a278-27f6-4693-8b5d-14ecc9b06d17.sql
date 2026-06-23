CREATE POLICY "Admins can manage all widget prefs"
  ON public.widget_prefs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));