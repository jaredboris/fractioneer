ALTER TABLE public.ai_insights ADD COLUMN IF NOT EXISTS period_end date;

-- Backfill existing rows to each client's most recent period_end
UPDATE public.ai_insights ai
SET period_end = sub.max_pe
FROM (
  SELECT client_id, MAX(period_end) AS max_pe
  FROM public.periods
  GROUP BY client_id
) sub
WHERE ai.client_id = sub.client_id AND ai.period_end IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_client_period_category_uniq
  ON public.ai_insights (client_id, period_end, category)
  WHERE period_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS ai_insights_client_period_idx
  ON public.ai_insights (client_id, period_end DESC);

-- Strip removed chart widgets from saved prefs so users don't see broken slots
UPDATE public.widget_prefs
SET widget_ids = ARRAY(
  SELECT unnest(widget_ids)
  EXCEPT SELECT unnest(ARRAY['chart_rev_exp','chart_cash_flow','chart_ar_ap','period_summary','ar_ap']::text[])
)
WHERE widget_ids && ARRAY['chart_rev_exp','chart_cash_flow','chart_ar_ap','period_summary','ar_ap']::text[];