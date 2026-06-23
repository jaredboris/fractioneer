
-- notes
DROP POLICY IF EXISTS "Client posts on own dashboard" ON public.notes;
DROP POLICY IF EXISTS "Read own or admin all" ON public.notes;

CREATE POLICY "Read own or admin all"
ON public.notes
FOR SELECT
USING (
  is_aal2() AND (
    client_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Client posts on own dashboard"
ON public.notes
FOR INSERT
WITH CHECK (
  is_aal2()
  AND author_id = auth.uid()
  AND (
    (author_role = 'client' AND client_id = auth.uid())
    OR (author_role = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
  )
);

-- notes_read_state
DROP POLICY IF EXISTS "Owner can insert own" ON public.notes_read_state;
DROP POLICY IF EXISTS "Owner can update own" ON public.notes_read_state;
DROP POLICY IF EXISTS "Owner or admin can read" ON public.notes_read_state;

CREATE POLICY "Owner or admin can read"
ON public.notes_read_state
FOR SELECT
USING (
  is_aal2() AND (
    client_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Owner can insert own"
ON public.notes_read_state
FOR INSERT
WITH CHECK (is_aal2() AND client_id = auth.uid());

CREATE POLICY "Owner can update own"
ON public.notes_read_state
FOR UPDATE
USING (is_aal2() AND client_id = auth.uid())
WITH CHECK (is_aal2() AND client_id = auth.uid());

-- widget_prefs
DROP POLICY IF EXISTS "Admins can manage all widget prefs" ON public.widget_prefs;
DROP POLICY IF EXISTS "Admins can view all widget prefs" ON public.widget_prefs;
DROP POLICY IF EXISTS "Users manage their own widget prefs" ON public.widget_prefs;

CREATE POLICY "Users manage their own widget prefs"
ON public.widget_prefs
FOR ALL
USING (is_aal2() AND auth.uid() = user_id)
WITH CHECK (is_aal2() AND auth.uid() = user_id);

CREATE POLICY "Admins can view all widget prefs"
ON public.widget_prefs
FOR SELECT
USING (is_aal2() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all widget prefs"
ON public.widget_prefs
FOR ALL
USING (is_aal2() AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_aal2() AND has_role(auth.uid(), 'admin'::app_role));
