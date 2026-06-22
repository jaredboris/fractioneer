
DROP POLICY IF EXISTS "Admins view all ai_usage" ON public.ai_usage;
CREATE POLICY "Admins view all ai_usage" ON public.ai_usage FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

DROP POLICY IF EXISTS "Clients read own client-documents" ON storage.objects;
CREATE POLICY "Clients read own client-documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'client-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.documents d WHERE d.file_path = objects.name AND d.client_id = auth.uid())
  AND public.is_aal2()
);
