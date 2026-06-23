# Bento dashboard layout + darker background

Restyle the portal dashboard to feel like the reference: a single mosaic grid with intentionally different tile sizes, plus a near-black page background that makes the navy cards pop.

## 1. Darker page background (dark mode only)

In `src/components/portal/PortalSidebar.tsx` and `src/routes/portal.tsx`:
- Replace the page background `dark:bg-[#0A0F1E]` with a near-black `dark:bg-[#05070D]`.
- Sidebar shell background matches the page (`dark:bg-[#05070D]`).
- Keep card backgrounds at `dark:bg-[#111827]` and bump borders slightly (`dark:border-[#1F2A3D]`) so cards sit clearly above the darker page.
- Update `document.body.style.backgroundColor` in `PortalSidebar.tsx` to `#05070D` for dark.
- Light mode untouched.

No changes to chart palettes — current axis/grid/tooltip colors already read fine on the darker page since charts live inside the lighter card.

## 2. Unified 12-column bento grid

In `src/routes/portal.tsx` around lines 1371–1424, replace the three separate sections (stat 4-col / chart 2-col / wide 1-col) with a single `grid-cols-12` mosaic. Each widget gets a `col-span` derived from its `kind`:

```text
kind === "stat"  → col-span-12  sm:col-span-6  lg:col-span-3   (4 across)
kind === "chart" → col-span-12                 lg:col-span-6   (2 across, medium height)
kind === "wide"  → col-span-12                                  (full-width banner)
```

Render order stays: stats first, then charts, then wides — so stat rows fill cleanly, charts pair up, and AI Insights / Period Summary span the full banner width like the reference.

Drop the gradient divider between stat and chart rows (the unified grid + spacing makes it redundant). Gap goes to `gap-4`.

Drag-and-drop keeps working: `SortableContext` still wraps every item; only the wrapping section changes from three grids to one.

## 3. Consistent medium chart height

In `src/lib/dashboard-widgets.tsx`, `ChartShell` currently uses `height: 240`. Bump to `height: 260` and ensure the card body uses a fixed inner height so all chart tiles align visually in the bento.

## 4. Stat card density

Stat widgets render fine at `col-span-3` but verify padding stays compact (no change expected). If any stat card looks too tall vs. the reference, tighten vertical padding inside the stat render in `dashboard-widgets.tsx` to keep the row tight.

## Technical notes

- Files touched: `src/routes/portal.tsx`, `src/components/portal/PortalSidebar.tsx`, `src/lib/dashboard-widgets.tsx`.
- No data, query, or widget-definition changes. Pure layout + color-token swaps.
- The widget catalog already classifies each widget by `kind` (`stat | chart | wide`), so the new grid uses that field directly — no per-widget config needed.
- AI Insights and Period Summary are already `kind: "wide"`, so they automatically become full-width banners under the new rule.
- Verify after build by loading `/portal` in dark mode and confirming: 4 stat tiles per row, 2 chart tiles per row at lg, full-width AI Insights banner, and visible contrast between page bg and cards.
