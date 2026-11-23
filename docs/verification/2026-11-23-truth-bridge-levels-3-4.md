# 2026-11-23 — Truth Bridge levels 3–4 (PR #2034)

**Changed:** Level 3 teaches supposition through a sentence that breaks. Level 4 adds three selectable planks, plank clues, and a crossing on the chosen plank.

**Ran:** Typecheck, scoped lint and format, 111 focused tests with one skip (rules, voice and clips, upright layout, registry, lands, generated docs), build, links and diff. The rules reproduce 404 supposition boards and 372 plank boards and walk Help from every partial answer. All 125 new Kokoro clips are in the production precache. Code checked at `738f01af2`, with Lasso Loops merged from `origin/main`.

**Chromium:** `TRUTH_BRIDGE_BATCH=2 BROWSER_SUITE=truthbridge` at `http://127.0.0.1:5234/classic/` played levels 3–4 from Lantern Lake at 390 × 625 with captions. It covered the supposition hint, a free blank plank, deselection, a repeated wrong plank for one miss, repeated Help for one hint, rotation with the choice and during the crossing, and one sticker per round. Reviewed the level 4 upright screenshot. `BROWSER_SUITE=fingerdemo FINGER_ONLY=truth-bridge FINGER_LEVELS=4 FINGER_BAND=grownup` finished in 12.6 s.

**Not run:** Other browser suites, levels 1–2 in Chromium, or standalone offline play. See the [levels 1–2 entry](2026-11-23-truth-bridge-levels-1-2.md) for the earlier browser run.
