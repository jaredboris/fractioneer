
-- Allow admins to view and manage leads via RLS (inserts still go through service-role server fn)
CREATE POLICY "Admins can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Harden client-documents storage read: must match a documents row owned by the caller
DROP POLICY IF EXISTS "Clients read own client-documents" ON storage.objects;

CREATE POLICY "Clients read own client-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name
      AND d.client_id = auth.uid()
  )
);
