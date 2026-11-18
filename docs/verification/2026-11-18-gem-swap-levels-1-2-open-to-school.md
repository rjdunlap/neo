# 2026-11-18 — Gem Swap levels 1-2 open to school (PR #1787)

**Changed:** Gem Swap `LEVELS` gains `school: 1–2` (grown-up stays 1–8); four child-form voice lines, 150×100 buttons at school, a school caption and a level-scoped how-to note. Saves audit: the saved level and pin are per profile per game, a school profile had no Gem Swap save before, grown-up saves and pins are untouched, no level ID was renumbered, and a school child's level is clamped to 1–2.
**Ran:** `npm run typecheck`; full `npm test` (362 files, 8058 tests, including the new "school opening" rule tests, registry, lands and how-to tests); `BROWSER_SUITE=gemswap` (level 1 grown-up, level 2 at school with 19 targets of at least 100 units and a screenshot, level 8 grown-up) passed; the level 2 school screenshot was looked at (4×4 tray, 100-unit buttons, pet clear of the tray).
**Not run:** `npm run build` locally (CI builds the PR), `fingerdemo` (the demonstrated action and bot are unchanged), offline, `world`.
