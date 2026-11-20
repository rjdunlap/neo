# 2026-11-20 — Rain Garden upright on phones (PR #1897)


**Changed:** Rain Garden plays upright (`upright: true`). `rainLayout` (levels 1-3) and a new `uprightRouteLayout` (level 4) stack cloud, bed(s) and pond hung up from the bottom edge, because both layouts returned null on 768 wide. Sideways plan unchanged; no scene change.
**Ran:** typecheck; `npm test` (all passing after `npm run game-docs` refreshed the generated docs), including the new upright layout tests (levels 1-4, four upright views, 205-tall pet corner, hang from the bottom).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=rain-garden PHONE_SHOTS=1` at preschool (levels 1, 2), prek (2, 3) and school (3, 4): every level completed with one sticker; screenshots at 390 x 844 looked right. Headless Chrome only.
**Not run:** build, offline, other suites (shared files unchanged).

