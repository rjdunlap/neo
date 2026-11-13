# 2026-11-12 — Stamp Studio level 7, a touch anywhere presses a star (PR #1587)

**Changed:** `stamp-studio` level 7 (lap): a pat on the teal around the paper presses a star at the nearest place on it (no cooldown); the star button, green arrow and back arrow are not shown at level 7; the how-to card's lines follow; one new unit test.
**Ran:** `npm run typecheck`; `npx vitest run src/games/stamp-studio src/content` (23 files, 243 passed, 1 skipped); `BROWSER_SUITE=creative CREATIVE_ONLY=stamps STAMP_LEVELS=7` on a `VITE_SPEECH=off` dev server (two pats off the paper, buttons hidden; screenshot shows stars at the paper's edges).
**Not run:** `fingerdemo` (the demonstrated action is unchanged), `npm run build` (no shared files or assets), other suites.
