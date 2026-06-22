## Plan: Resize homepage header logo

### Current state
- `src/components/site/Navbar.tsx` now renders the Fractioneer dark SVG logo inside a `h-12 w-56` wrapper with `scale-[1.55]`, which is visibly too large.
- The SVG asset (`fractioneer-logo-dark.svg`) is a 3000×3000 square with internal padding, so the previous `h-7 w-auto` approach no longer produces the right visual size.

### Proposed change
Set the rendered logo height to roughly 36–40 px (user-confirmed target) while keeping the rest of the navbar unchanged.

### Steps
1. In `src/components/site/Navbar.tsx`:
   - Replace the oversized wrapper/scaling approach with a simpler container sized for the desired logo height (e.g., `h-9` or `h-10` with a matching width constraint like `w-44`).
   - Apply `h-full w-auto object-contain` to the `<img>` so the square SVG fills the height cleanly without overflow/scale transforms.
2. Verify visually in the preview that:
   - The logo sits well inside the `h-16` navbar.
   - It matches the scale shown in the user-provided reference image.
   - Mobile menu/hamburger layout is unaffected.
3. If needed, fine-tune the height class one step (`h-9` → `h-10`) based on the preview.

### Scope
- Only the homepage/site navbar logo (`src/components/site/Navbar.tsx`).
- The portal sidebar logo is not affected by this change.

### Validation
- Screenshot the live preview at desktop width and compare to the reference image before marking complete.