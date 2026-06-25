Update the portal page background to a diagonal gradient from #040316 (top-left) to #11184c (bottom-right), applied at the outermost body/html wrapper. No other components (cards, sidebar, charts, nav) will be touched.

Technical details:
- Modify the inline theme init script in `src/routes/__root.tsx` so that when the current path is under `/portal`, it sets `document.body.style.background` to the diagonal gradient via `linear-gradient(135deg, #040316, #11184c)` and keeps `dark` mode class. For non-portal pages, behavior remains unchanged.
- This is a single-line change scoped strictly to the root shell theme initializer, ensuring it shows behind all portal content without affecting any card, sidebar, chart, or navigation styling.

No new dependencies, no schema changes, no server functions.