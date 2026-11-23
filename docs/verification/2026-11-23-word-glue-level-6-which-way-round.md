# 2026-11-23 — Word Glue level 6 Which way round (PR #2028)

**Changed:** Four reversible compound pairs, eight animated drawings, shared tap scoring, a two-row shelf and 32 generated lines. Pointer cancellation and rotation release held choices on levels 5–6.
**Ran:** Typecheck; 258 focused checks (one skipped), including 500 seeded schedules, art poses, shell layout and voice coverage; format, lint, game docs, links, diff, production build and all 32 clip entries in its precache. Chromium on `http://127.0.0.1:5296/`: `BROWSER_SUITE=wordglue WORDGLUE_ONLY=reversed` at 390 × 625 with captions passed free slide-off and cancel, one wrong tap, one hint, rotation, all four pairs and one sticker; reviewed the upright screenshot and eight-drawing strip. `WORDGLUE_ONLY=kind` passed the level 5 regression. `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-glue FINGER_LEVELS=6 FINGER_BAND=school` finished in 18.1 s.
**Not run:** Wider browser suites or a standalone offline round.
