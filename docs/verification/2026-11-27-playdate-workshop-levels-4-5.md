# 2026-11-27 — Playdate Workshop levels 4-5 (PR #2281)

**Changed:** Playdate Workshop gains school levels 4 (the smudged banner) and 5 (a new idea): new plans, requests, a changed-request stage, art and voice lines, the Try the other way button, the school band, and the how-to card.
**Ran:** `npm run typecheck`; `src/games/playdate-workshop`, `src/content` and `src/games` unit tests (rule tests for both levels plus layout at four views, 19,298 passing, with only the stale generated docs failing until `npm run game-docs` was run); `BROWSER_SUITE=fingerdemo` at levels 4 and 5 (ghost finger finishes both); extended `BROWSER_SUITE=playdateworkshop` (levels 1, 3, 4, 5 with previews, the pet's hints, Try the other way, the changed request, a portrait screenshot of level 5). Format and lint run in CI.
**Not run:** full `npm test` before pushing (left to PR CI); build; offline; level 6 is not built.
