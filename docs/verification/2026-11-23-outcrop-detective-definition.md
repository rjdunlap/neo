# 2026-11-23 — Outcrop Detective definition (PR #2064)

**Changed:**
- `docs/definitions/outcrop-detective.md` (new): earth-materials slice E6 as its own game `outcrop-detective`, levels 1–2, school and grownup, Lantern Lake, upright: the cliff, the story frame and Play, the four-card story ribbon, for-sure and look steps, the hint walk, one build batch.
- The earth-materials study (E6 marked defined, E7 named, placement defaulted), the study backlog, recommendations and IDEAS rows, and the docs map.
- READY: Next ten line 340 (this definition) replaced by the `outcrop-detective 1` build line (345).

**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The 24 ribbons were enumerated in a scratch script: level 1 has 1 fitting ribbon; level 2 with sand in place has 2; each sand-off outcome has 1; the hint walk closes in at most 3 hints (level 1: 1, 6, 11, 6 ribbons need 0, 1, 2, 3; level 2 with sand: 2, 9, 10, 3; each sand-off state: 1, 6, 11, 6).

**Not run:** code checks (docs only; nothing built) and any browser. No new source was opened (the building session does the model-wording check).
