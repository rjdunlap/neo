# 2026-11-26 — Define Meadow Pens levels 6-7 (docs only, PR #2227)

**Changed:** `docs/definitions/meadow-pens.md` gains the levels 6–7 packet (*How long is the side?* with nine missing-side cases, *Fill the loft* with seven floor-and-layer cases, accounting, speech, how-to, ghost finger, layout and source-check gates); the area-volume-space dive's slice 4 line; READY (the define line removed, the build line added to Next ten).
**Ran:** a throwaway Python check of both case tables (`A = h x L`, three distinct cards each, sizes inside the 6 x 4 grid), `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** code checks and browser plays (nothing built; the packet is a definition).
