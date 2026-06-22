CREATE TABLE public.periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_end date NOT NULL,
  net_revenue numeric,
  net_income numeric,
  gross_margin numeric,
  cash_balance numeric,
  total_ar numeric,
  total_ap numeric,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_end)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.periods TO authenticated;
GRANT ALL ON public.periods TO service_role;

ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own periods" ON public.periods
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins manage all periods" ON public.periods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_periods_client_period ON public.periods (client_id, period_end DESC);

CREATE TRIGGER trg_periods_updated_at
  BEFORE UPDATE ON public.periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();