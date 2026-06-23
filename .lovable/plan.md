## Diagnosis (no code changed yet)

I checked the database and the chart code paths directly. Here's what I found:

**1. The data is saved correctly.**
- `periods` table has **12 rows** for client `afba6a7c-5352-44ea-99ac-30915986dd48`, spanning `2025-04-30 → 2026-03-31`.
- Schema matches exactly what the charts read: `period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap`.

**2. The chart code is already correct.**
- `ClientDashboard` queries `periods` filtered by `effectiveId`, ordered by `period_end asc` (portal.tsx ~944).
- `mergeRows` keys by `period_end` and the chart widgets read `r.net_revenue`, `r.cash_balance`, `r.total_ar`, `r.total_ap` off the merged rows. All field names match.

**3. RLS is fine *for the right user*.**
- Policy: `is_aal2() AND auth.uid() = client_id` for clients, `is_aal2() AND has_role(...,'admin')` for admins. Both gated by MFA.
- Since you've completed 2FA and other widgets/KPIs load, `is_aal2()` is satisfied.

**4. The most likely cause: `effectiveId` is not that client's id.**
- Only **one** client has any periods data (`afba6a7c…`). If you're logged in as the **admin** and viewing your own dashboard (not impersonating that client), `effectiveId = your admin user.id`, which has **0 periods rows** → charts empty. KPIs would also be empty/blank in that case (which matches "completely empty").
- If you're impersonating, `effectiveId` comes from the impersonation context — needs to actually equal `afba6a7c…`.

**5. Notes widget still showing / no sidebar tab.**
- Confirmed: the prior "move Notes to sidebar" change did not land. Notes is still registered in `dashboard-widgets.tsx` and there's no `/portal/notes` route or sidebar entry.

## Proposed Plan

### A. Add a diagnostic log (one-time, easy to remove)
In `ClientDashboard`'s data-load effect, log:
```
[charts] effectiveId=<id> viewerRole=<…> impersonating=<bool>
[charts] periods rows=<n> dashboard rows=<n>
```
This will instantly distinguish: (a) wrong client id, (b) RLS blocking, (c) data present but render bug.

### B. Confirm the actual cause from the log, then:
- **If `periods rows = 0` and `effectiveId ≠ afba6a7c…`** → the issue is "admin viewing own dashboard". Fix by either: (i) auto-impersonating the most recent client when an admin opens `/portal`, or (ii) showing a clear "No client selected — pick a client to view their data" empty state with a client picker. I'd recommend option (ii) — explicit and matches the admin impersonation flow already in place.
- **If `periods rows = 0` and `effectiveId == afba6a7c…`** → RLS issue; we'll re-check the session's `aal` claim and policies. (Unlikely based on schema review.)
- **If `periods rows = 12`** → render bug in `mergeRows` / chart memo; we'll trace there.

### C. Re-apply the Notes → sidebar move (separately)
This was confirmed not applied. I'll redo it in the same pass:
- Remove `notes` from `dashboard-widgets.tsx` widget registry, defaults, and Add Widget menu.
- Add `/portal/notes` route with the thread UI (client view + admin client-selector).
- Add "Notes" item to `PortalSidebar` and `AdminSidebar` with unread badge backed by `notes_read_state`.

### D. Remove the diagnostic log once the root cause is confirmed and fixed.

Want me to proceed with A+C now so the next run produces the diagnostic output and the Notes move is in place?
