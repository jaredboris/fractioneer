ALTER TABLE public.widget_prefs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.widget_prefs;