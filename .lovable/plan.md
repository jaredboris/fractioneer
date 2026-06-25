Apply the diagonal gradient `linear-gradient(135deg, #040316 0%, #11184c 100%)` as the app-wide background on every page (portal + marketing), with `min-height: 100vh`. No other components are touched.

Implementation:
- In `src/styles.css`, add a global rule on `html, body`:
  - `background: linear-gradient(135deg, #040316 0%, #11184c 100%) fixed;`
  - `min-height: 100vh;`
- Remove the portal-only background logic from the `THEME_INIT_SCRIPT` in `src/routes/__root.tsx` so it no longer overrides the body background.
- Revert the portal wrapper in `src/routes/portal.tsx` line 1341 back to `bg-transparent` (already transparent in dark; will also be transparent in light) so the gradient shows through on both admin and client portal pages.
- Verify marketing routes (e.g. `src/routes/index.tsx`) do not set a competing `bg-background`/`bg-white` on the outermost wrapper; if they do, make that wrapper transparent so the gradient is visible.

No new dependencies, no schema changes.