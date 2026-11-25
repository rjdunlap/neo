# 2026-11-25 — Little Conductor level 4, soft or loud (PR #2159)

**Changed:** Little Conductor level 4 for preschool and pre-K: a small drum and a big drum play the same tune at one steady 75 beats a minute, gain 0.45 against 1, heard gate as level 2, never a miss.
**Ran:** `npm run typecheck`, `npm run lint`, `npm run format:check`; `npx vitest run src/games/little-conductor src/content/barrels.test.ts src/content/game-docs.test.ts` (new tests: identical pitch, order, bass, drum and timing on both pads for all six tunes, gain table bounds, gate follows the latest change, ghost finger finishes); `BROWSER_SUITE=conductor CONDUCTOR_LEVELS=4` (768 × 1024: early Done, a change inside a beat, the gate, the bow, one sticker with 0 misses and 0 hints) and a portrait screenshot checked by eye.
**Not run:** the full `npm test` (left to PR CI), the build, `fingerdemo`, the Kokoro voice clips (the new instruction line uses device speech until rendered), real phone speaker checks.
