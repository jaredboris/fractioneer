ALTER TABLE public.dashboard_data
  ADD COLUMN IF NOT EXISTS cash_balance numeric,
  ADD COLUMN IF NOT EXISTS total_ar numeric,
  ADD COLUMN IF NOT EXISTS total_ap numeric,
  ADD COLUMN IF NOT EXISTS net_revenue numeric,
  ADD COLUMN IF NOT EXISTS monthly_close_status text,
  ADD COLUMN IF NOT EXISTS period date;