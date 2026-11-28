# 2026-11-27 — Village Planner levels 1-3 (PR #2304)

**Changed:** new game `village-planner` (Lantern Lake; `school` levels 1–2, `grownup` levels 1–3; upright-ready): rules in `logic.ts`, layout, art, voice, how-to card, ghost finger, upright layout test, browser suite `villageplanner`, registry and README rows, game page, study and backlog lines. Test-harness change: `VILLAGE_PLANNER_PHONE=1` runs the suite in a touch phone context.

**Ran:**

- `npm run typecheck`, `npm run format:check`, `npm run lint`: clean.
- `npx vitest run src/games/village-planner src/content src/games/registry.test.ts scripts`: passed. Rule tests enumerate every plan and match the definition's counts (12; 50 as 36 + 14; 32 as 3 + 15 + 14), cover trips, prerequisites, seeded tray order and that following hints from sampled boards reaches a plan that runs; the upright test checks every target at five upright views and sideways.
- `BROWSER_SUITE=villageplanner` (sideways and `VILLAGE_PLANNER_PHONE=1`): passed. Real drags: a wrong-row drop (no miss), an incomplete Run plan (free), dough before its grain (one miss, board editable, same board again still one), one hint, a fix to finish; level 2's three-trip plan offers the Trace Card, Try fewer trips is free, Done finishes; level 3 by the ghost finger with no miss or hint. One portrait screenshot at 390 × 844 and one Trace Card screenshot read.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=village-planner`: passed (level 1 in 11.4 s, level 3 in 16.1 s).

**Not run:** `npm run build`, the full unit suite and offline (GitHub CI runs the build and the full suite on the PR). The Kokoro voice clips were not rendered: the title line is `village-planner.title` and every other line is outside the clip prefixes, so device speech speaks them. A real phone was not used.
