-- Make access intent explicit on public.leads.
-- All client access is denied; lead submissions go through a server function
-- using the service role, which bypasses RLS.
REVOKE ALL ON public.leads FROM anon, authenticated;
GRANT ALL ON public.leads TO service_role;

CREATE POLICY "Deny all client select on leads"
ON public.leads FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny all client insert on leads"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny all client update on leads"
ON public.leads FOR UPDATE
TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Deny all client delete on leads"
ON public.leads FOR DELETE
TO anon, authenticated
USING (false);