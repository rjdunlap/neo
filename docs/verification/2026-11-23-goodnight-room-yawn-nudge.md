# 2026-11-23 — Goodnight Room yawn nudge (PR #2076)

**Changed:** Goodnight Room's yawn nudge (levels 1–2 and the level 10 tour; 10 s quiet, then every 15 s, at most two per quiet).
**Ran:** `npm run typecheck`; goodnight-room rule tests (18 passed, 3 new yawn tests); prettier and eslint on the game folder; `BROWSER_SUITE=woods WOODS_ONLY=night` at levels 1–2 (a friend awake yawned after the quiet: bunny) and at level 10 (tour, regression), both passed.
**Not run:** full `npm test` (CI), build, offline, `fingerdemo` (autotouch unchanged). The yawn sound was exercised by code only, not heard.
