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
