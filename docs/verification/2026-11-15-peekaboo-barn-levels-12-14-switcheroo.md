# 2026-11-15 — Peekaboo Barn levels 12-14 Switcheroo (PR #1702)

**Changed:** `peekaboo-barn` levels 12–14 (`swap` mode: 1, 2 and 3 house swaps; two misses glow the right house, restore the start order and replay the swaps slowly; goal 5 at level 14 to keep a round near a minute); bands pre-K 6–13, school 9–14.
**Ran:** typecheck; `npx vitest run src/games/peekaboo-barn` (36 tests) and content, registry and lands tests; `originals` `ORIGINALS_ONLY=peekaboo PEEK_LEVELS=12,13,14` (two misses, hint, score 2/1, sticker each; asked house moved, all houses at rest in their places); `fingerdemo` `FINGER_ONLY=peekaboo-barn` levels 12 (47.3 s) and 14 (67.1 s); `scripts/abandon-cards.mjs` `GAME_ONLY=peekaboo-barn ROUNDS=12` (random levels 9–14 at school, 0 page errors); an 844x390 probe at level 14 (mid-arc screenshot, rotation to portrait mid-swap, houses rest in the new slots).
**Not run:** full `npm test`, `npm run build`, offline, other suites.
