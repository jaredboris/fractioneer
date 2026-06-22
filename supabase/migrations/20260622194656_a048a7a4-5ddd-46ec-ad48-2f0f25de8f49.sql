-- Enforce AAL2 on admin-facing leads policies
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

CREATE POLICY "Admins can view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

CREATE POLICY "Admins can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2())
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

-- Enforce AAL2 on user_roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2())
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_aal2());

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_aal2());

-- Enforce AAL2 on storage admin policy for client-documents
DROP POLICY IF EXISTS "Admins manage all client-documents" ON storage.objects;

CREATE POLICY "Admins manage all client-documents" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND public.has_role(auth.uid(), 'admin'::app_role)
    AND public.is_aal2()
  )
  WITH CHECK (
    bucket_id = 'client-documents'
    AND public.has_role(auth.uid(), 'admin'::app_role)
    AND public.is_aal2()
  );
