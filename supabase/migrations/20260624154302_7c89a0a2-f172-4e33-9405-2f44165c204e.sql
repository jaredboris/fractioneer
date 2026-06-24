
-- 1. periods review/publish workflow
ALTER TABLE public.periods
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.periods
  DROP CONSTRAINT IF EXISTS periods_status_check;
ALTER TABLE public.periods
  ADD CONSTRAINT periods_status_check CHECK (status IN ('pending_review','published'));

-- Backfill existing rows so current clients keep visibility
UPDATE public.periods
  SET status = 'published', published_at = COALESCE(published_at, created_at)
  WHERE status = 'pending_review' AND published_at IS NULL;

-- Tighten client RLS to only show published periods
DROP POLICY IF EXISTS "Clients view own periods" ON public.periods;
CREATE POLICY "Clients view own periods" ON public.periods
  FOR SELECT TO authenticated
  USING (is_aal2() AND auth.uid() = client_id AND status = 'published');

-- 2. Urgent client alerts
CREATE TABLE IF NOT EXISTS public.client_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_client_alerts_client_active
  ON public.client_alerts(client_id) WHERE cleared_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_alerts TO authenticated;
GRANT ALL ON public.client_alerts TO service_role;

ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own active alerts" ON public.client_alerts
  FOR SELECT TO authenticated
  USING (is_aal2() AND auth.uid() = client_id AND cleared_at IS NULL);

CREATE POLICY "Admins manage all client alerts" ON public.client_alerts
  FOR ALL TO authenticated
  USING (is_aal2() AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_aal2() AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Admin-shared documents (polished deliverables)
CREATE TABLE IF NOT EXISTS public.shared_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_documents_client_created
  ON public.shared_documents(client_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_documents TO authenticated;
GRANT ALL ON public.shared_documents TO service_role;

ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own shared documents" ON public.shared_documents
  FOR SELECT TO authenticated
  USING (is_aal2() AND auth.uid() = client_id);

CREATE POLICY "Admins manage all shared documents" ON public.shared_documents
  FOR ALL TO authenticated
  USING (is_aal2() AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_aal2() AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for client-documents bucket: shared/{client_id}/* prefix
DROP POLICY IF EXISTS "Admins manage all client-documents" ON storage.objects;
CREATE POLICY "Admins manage all client-documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-documents' AND is_aal2() AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'client-documents' AND is_aal2() AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients read own shared files" ON storage.objects;
CREATE POLICY "Clients read own shared files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND is_aal2()
    AND (storage.foldername(name))[1] = 'shared'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
