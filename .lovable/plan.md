# Add AI Insights card to client dashboard

## What

A new "AI Insights" card on the client dashboard that cycles through 4–6 plain-English, descriptive-only insights generated from each client's financials. Styled like the reference (dark panel, soft blue glow, insight text, carousel dots at the bottom). Generated once when financials are uploaded — cached in the database, not regenerated on page loads.

## Insight types (descriptive only — never advice)

1. **Payment speed** — slowest / fastest customers + average collection period (from invoice/payment dates in the source file, if present).
2. **Revenue concentration** — % from top customer and top 5 (from the source file, if present).
3. **Cash runway** — months of coverage at average burn in down months (from `periods`).
4. **Overdue AR** — total $ and customer count in 91+ day aging bucket (from the source file, if present).
5. **Trend / seasonality** — highest and lowest revenue months (from `periods`).
6. **Margin trend** — gross margin direction MoM (from `periods`).

Guardrail enforced in the system prompt and a post-generation regex: no advisory language ("should", "recommend", "consider", "we suggest"). Statements are facts only.

If a given insight has insufficient data (e.g. no invoice-level rows in the source file), the model omits it rather than fabricating. Minimum 3 insights to render the card.

## Where it lives in the UI

- New entry in `WIDGET_CATALOG` in `src/lib/dashboard-widgets.tsx`: `id: "ai_insights"`, `kind: "wide"`, `defaultOn: true`. Renders on the dashboard alongside the existing widgets — user can hide/show like any other widget.
- Card matches the reference image: dark surface, subtle blue radial glow background, "AI Insights" label top-left with a small sparkle icon, large insight text, carousel dots bottom-left, auto-advance every 6s with manual click-to-jump. Tiny footer text: "AI-generated, may contain errors."

## Data model

New table `public.ai_insights`:

```text
id           uuid pk
client_id    uuid  → references the client user
insight_text text
category     text  (payment_speed | concentration | runway | overdue_ar | seasonality | margin)
created_at   timestamptz
```

Indexed on `client_id`. RLS:
- Clients can SELECT their own rows.
- Admins can SELECT all.
- Only admin-side server functions (service role) INSERT/DELETE. Same AAL2 gating as the other client-data tables.
- GRANTs to `authenticated` and `service_role`.

## Generation flow

Extend the existing extraction path in `src/lib/portal.functions.ts`:

1. After `saveExtractedFinancials` writes the new periods, kick off a new server function `generateAiInsights({ client_id, source_rows })`.
2. That function:
   - Loads the client's full `periods` history (for runway / seasonality / margin trend).
   - Receives the original Excel row JSON (already in scope at upload time) for customer-level insights.
   - Calls Lovable AI (`google/gemini-2.5-pro`, same setup as extraction) with a strict system prompt: "Return 4–6 short factual insight strings. Each ≤ 140 chars. Descriptive only — never advice. Omit any category lacking data. JSON: `{ insights: [{ category, text }] }`."
   - Validates with Zod, scrubs anything containing advisory keywords.
   - Deletes existing rows for that `client_id`, inserts the new set.
   - Logs the call in `ai_usage` (same pattern as extraction).
3. The admin upload UI calls this right after save; the dashboard re-reads on focus/realtime.

## Dashboard read

`ClientDashboard` (in `src/routes/portal.tsx`) gains a small query: `select * from ai_insights where client_id = effectiveId order by created_at desc`. Passed into `WidgetContext` as `aiInsights: { text, category }[]`. The new widget reads this array; if empty, shows a quiet empty state ("No insights yet — upload financials to generate.").

## Technical notes

- Reuses the existing `LOVABLE_API_KEY` + `ai.gateway.lovable.dev` setup — no new secrets.
- Generation runs server-side only; never from the client.
- Insights are cached in `ai_insights` — page loads never trigger model calls.
- Carousel uses simple `useState` index + `setInterval`, no extra dependency.
- Style uses existing semantic tokens; the blue glow is a CSS radial-gradient overlay matching the reference.

## Out of scope

- Editing or rating insights.
- Per-insight drill-through.
- Streaming generation UI (it runs in the background after upload).
