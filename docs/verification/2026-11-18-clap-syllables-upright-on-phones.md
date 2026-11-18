# 2026-11-18 — Clap Syllables upright on phones (PR #1816)

**Changed:** Clap the Syllables opens upright at all eight offered levels. Its pure layout separates sorting cards and fits the bins and train inside the view. Placed pictures and returning cards follow a resize, still taps on sorting cards are free, and a sorting hint outlines the bin face.

**Ran:** Typecheck and game-scoped lint and format passed on the final spacing. All 31 game tests passed on the final layout, including checks at six upright views and 1024 × 768 landscape. The checks cover all offered levels and their cards, pad and replay controls, sorting destinations and sorted slots, and loaded train bounds.

**Ran:** On `http://localhost:5196`, `BROWSER_SUITE=uprightsweep PHONE_BANDS=all PHONE_ONLY=clap-syllables` passed before the change. The eight screenshots showed overlapping sort cards and clipped bins and engine that the sweep missed. `BROWSER_SUITE=uprightgames PHONE_ONLY=clap-syllables` at 390 × 844 passed for `PHONE_BAND=prek PHONE_LEVELS=3,4` and `PHONE_BAND=school PHONE_LEVELS=5,6,8`. Chromium touch finished those rounds in 5, 4, 8, 9 and 4 touches respectively, one sticker each. All five screenshots were reviewed. The final spacing changes apply to other viewport sizes.

**Ran:** A focused Chromium level 5 test started at 844 × 390. It checked a free tray tap, two wrong drops and one hint on the correct bin face, then rotated during a rejected return with one card already sorted. The returned and accepted cards followed the new layout. At 390 × 844 the round finished with one sticker and the screenshot was reviewed.

**Not run locally:** Full `npm test`, production build, offline and `fingerdemo`.
