
-- dashboard_data: one row per client
CREATE TABLE public.dashboard_data (
  client_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_close text NOT NULL DEFAULT 'On track',
  monthly_close_detail text,
  cash_position text NOT NULL DEFAULT '$0',
  cash_position_detail text,
  ap_ar_status text NOT NULL DEFAULT 'Current',
  ap_ar_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_data TO authenticated;
GRANT ALL ON public.dashboard_data TO service_role;

ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all dashboard_data"
  ON public.dashboard_data FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own dashboard_data"
  ON public.dashboard_data FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE TRIGGER trg_dashboard_data_updated_at
  BEFORE UPDATE ON public.dashboard_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- documents: file metadata per client
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_client_id ON public.documents(client_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all documents"
  ON public.documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own documents"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

-- Allow admins to view all profiles (so admin page can list clients)
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for client-documents bucket
-- Path convention: {client_id}/{filename}
CREATE POLICY "Admins manage all client-documents"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'client-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'client-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own client-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
