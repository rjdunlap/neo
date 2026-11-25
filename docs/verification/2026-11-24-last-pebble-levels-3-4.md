# 2026-11-24 — Last Pebble levels 3-4 (PR #2152)

**Changed:** `last-pebble` levels 3 (*Who goes first?*) and 4 (*Bigger steps*): takes of `1..4`, the first-or-second choice, the choice rewind, a four-row stream, voice lines, how-to card, rule and layout tests, and the browser suite.
**Ran:** `npm run typecheck`; `npx vitest run src/games/last-pebble src/content/barrels.test.ts` (168 passed, including an exhaustive solve for `T` 6–16 and takes 2–4, and the choice layout in every upright, short and landscape view); `BROWSER_SUITE=lastpebble` on a `390 × 844` phone (level 3: wrong pick twice, rewind to the choice, glow, finish; level 4: *Show me* on the choice screen, second tap plays it, finish; portrait screenshots read); `BROWSER_SUITE=fingerdemo FINGER_ONLY=last-pebble FINGER_LEVELS=3,4` (both finished).
**Not run:** full `npm test` (left to PR CI), `npm run build`, a real phone, and Kokoro voice clips (device speech is the fallback).
