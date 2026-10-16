# Verification 2026-10-16 (archived entries)

## 2026-10-16 — Critter Sort worked example

- [PR #418](https://github.com/rjdunlap/neo/pull/418), `claude/critter-sort-worked-example` (bff1137): a worked example at levels 1, 2, 3 and 5; two harness fixes (the `woods` sort loop plays `plan.rounds`; `fingerdemo` `FINGER_LEVELS` picks a band whose order has the level).
- Ran `npm run typecheck` and `npx vitest run src/games/critter-sort src/content` (87 passed; new rule test: examples in their own places, at least two loose, bot and hint never touch one, 200 seeds per level).
- Passed `GAME_URL=http://localhost:5961 BROWSER_SUITE=woods WOODS_ONLY=sort` levels 1–4, and level 5 with `FROM_LEVEL=5` after the loop fix; `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=1,2,3,5` clean (12.1, 12.1, 12.2 s at pre-K; 25.2 s at school for 5). One portrait screenshot at level 3 (768×1024) shows the bear in the middle.
- Not run: build (no shared assets), the full unit suite, the other suites. Device speech for the two new lines is open in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## 2026-10-16 — Woodland Picnic definition

- [PR #424](https://github.com/rjdunlap/neo/pull/424), `claude/woodland-picnic-definition`; docs only. Levels (Mail Carrier 6, Seesaw Balance 7, Beat Builder 3) checked against each game's school range in source at `562b97c`.
- Ran the link check and `git diff --check`. No code checks (docs only).
- Open: the build itself, with its story/navigation/save tier checks, is not started.

## 2026-10-15 — Data and AI literacy subject research

- Docs-only study on base `1dea66f` plus scoped working diff: [study](../deep-dives/subjects/data-ai-literacy.md), seven candidate/mode ideas, six-level first-game proposal, older/family cases, tracker/notebook/roadmap updates.
- Opened official standards, primary research and seven reference activities; failed full-paper/lesson-PDF extraction is explicit. No reference games played.
- Passed `node scripts/check-links.mjs` and `git diff --check`; older log entries archived with inbound links updated.
- Not run: typecheck, tests, build, browsers or hardware; no code changed. Audience appeal, independent understanding and transfer remain unestablished.
- [PR #431](https://github.com/rjdunlap/neo/pull/431); publication explicitly authorized on 2026-10-16 after the initial approval-review block. Integrated main `1dea66f`; checks apply to research commit `8384fbd` plus these publication-link edits.

## 2026-10-16 — Critter Sort level 8 A new sign

- [PR #428](https://github.com/rjdunlap/neo/pull/428), `codex/critter-sort-eight`, dispatch `critter-sort-eight-20261016T071003Z`: tested base `76e5cfd` plus implementation diff. School appends ID 8; same six sort twice under different pictured/spoken rules; one sticker after both passes. Existing IDs/pins and pre-K unchanged.
- Passed typecheck, 46 focused game/registry/how-to tests and build (existing chunk warning). The 300-seed level-8 test proves deterministic, distinct nontrivial splits, both-pass bot/hint selection and reachable hoop/mat answers.
- At `http://localhost:5188`, `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=8 TO_LEVEL=8` passed same-node/critters identity across both sorts, changed sign, free grass, two misses/one hint, no completion before mat placement, saved result/sticker and no page errors. Landscape and portrait screenshots reviewed.
- At the same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=8` sorted both passes cleanly in 30.0 s. Initial sandbox Chromium bootstrap blocked; isolated browser run with native permissions passed. Links and diff checked after closeout edits; owned Vite stopped.
- Not run: full units, other levels/suites, world/offline (no navigation/persistence changes), iPad speech/touch and child interpretation; device checks remain open.
