
-- Helper: read AAL claim from the current JWT.
CREATE OR REPLACE FUNCTION public.is_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb) ->> 'aal',
    ''
  ) = 'aal2'
$$;

GRANT EXECUTE ON FUNCTION public.is_aal2() TO authenticated, anon, service_role;

-- dashboard_data
DROP POLICY IF EXISTS "Admins manage all dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Clients view own dashboard_data" ON public.dashboard_data;

CREATE POLICY "Admins manage all dashboard_data"
ON public.dashboard_data
FOR ALL
TO authenticated
USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients view own dashboard_data"
ON public.dashboard_data
FOR SELECT
TO authenticated
USING (public.is_aal2() AND auth.uid() = client_id);

-- documents
DROP POLICY IF EXISTS "Admins manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Clients view own documents" ON public.documents;

CREATE POLICY "Admins manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (public.is_aal2() AND auth.uid() = client_id);

-- periods
DROP POLICY IF EXISTS "Admins manage all periods" ON public.periods;
DROP POLICY IF EXISTS "Clients view own periods" ON public.periods;

CREATE POLICY "Admins manage all periods"
ON public.periods
FOR ALL
TO authenticated
USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients view own periods"
ON public.periods
FOR SELECT
TO authenticated
USING (public.is_aal2() AND auth.uid() = client_id);

-- profiles (the "clients" data table in this schema): admin reads/writes require aal2.
-- Self-read/insert/update remain at aal1 so the portal can bootstrap a profile
-- and the verify-2fa screen can show the user's email before the challenge.
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_aal2() AND public.has_role(auth.uid(), 'admin'::app_role));
