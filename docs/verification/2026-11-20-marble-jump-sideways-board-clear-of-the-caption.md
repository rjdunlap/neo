# 2026-11-20 — Marble Jump sideways board clear of the caption

**Changed:** Sideways (wider than tall), `boardLayout` moves the triangle as far right as the view allows, 24 units from the edge, so the caption bubble over the left of the view no longer covers the left holes while a hint is spoken. At a phone held sideways (1,241 × 768 units) the bottom row's left hole edge sits about 595 units across, clear of all but the last 35 units of a full-width bubble, and the 88-unit holes and buttons are unchanged. Upright views stay centred.

**Ran:** Typecheck (only the unrelated `src/dev/art-lab` errors, present before this change), the Marble Jump rule and layout tests with a new sideways case, and the upright batch 4 layout test (37 tests).

**Not run:** Browser play, screenshots, build and offline. The change is a pure layout offset covered by unit tests; no real phone was used.
