# 2026-11-19 — Marble Jump phone touch targets

**Changed:** Moved the holes farther apart and enlarged their hit circles from 78 to 88 units (44.7 CSS pixels at 390 wide). Both triangles fit without panning. The tall triangle uses closer rows in short views and keeps its groove above the buttons.

**Ran:** Typecheck and 40 focused rule, view and thumb-size tests, scoped lint and formatting, Markdown links and diff check. Browser regression used `/tmp/neo-ready-marble-jump-1860/phone.mjs` on Vite at `http://localhost:5186/classic/` (base `58e74b4b3` plus feature diff). Chromium touch at 390 × 630 completed levels 1 and 9 by tapping 41 units off the hole centres, with a sticker per round. Level 9 also checked one invalid jump, one hint, selected-marble retention during a 630 × 390 rotation, Undo and completion. Reviewed portrait and sideways screenshots. The sideways caption bubble can cover left holes while a hint is spoken and is queued separately in READY.

**Not run:** Local production build, offline, full `marblejump` suite or separate ghost-finger demonstration.
