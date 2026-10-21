# Verification 2026-10-21 (archived entries)

## 2026-10-21 — Weather Wardrobe: every touch counts at level 1 and the level-7 card (slice 1)

- Built on `claude/weather-wardrobe-every-touch` ([PR #682](https://github.com/rjdunlap/neo/pull/682), commit `3f6e65dc`): level 1 grass answers per weather and worn items are wiggled and named (neither changes the weather or counts toward the finish), the pack step is `{ from: 6, to: 6 }`, the dead remove-phase line is gone; new rule test for item names and distinct grass answers.
- Ran `npm run typecheck` (clean) and `npm test` (189 files, 2032 tests pass).
- Dev server http://localhost:5534: `BROWSER_SUITE=fourth FOURTH_ONLY=weather` levels 1–6 passed (level 1 now taps the grass and a worn item and asserts both answered with the weather unchanged); `BROWSER_SUITE=wardrobe7` passed (undress path refactored); `BROWSER_SUITE=fingerdemo FINGER_ONLY=weather-wardrobe FINGER_LEVELS=1` clean in 10.8 s.
- Not run: build (no shared files or assets), the offline check, a portrait screenshot. The burst art (puddle, snow, flower) was asserted, not reviewed by eye.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): iPad touch feel, device speech for the named clothes, and whether a toddler tries the grass.

## 2026-10-21 — Peg Garden: every touch answers (slice 1)

- Built on `claude/peg-garden-every-touch` (tip `f2a4cfa1`): whole-screen touch on the island, bubbles on every touch at levels 1–3, a queued pearl at level 1, no drift and a stall guard plus ledge ring at level 3, hint reset, fixed 1/240 s steps for dropped pearls, a window `pointercancel` listener, and a true how-to card.
- Ran `npm run typecheck` (clean), `npx vitest run src/games/peg-garden src/content` (105 pass) and `npm run build`.
- Vite dev servers on random ports, at the tip minus its last couch-only hit-area guard: `BROWSER_SUITE=batch BATCH_ONLY=pegs` levels 1–5 passed twice (sea tap, queued pearl, ledge ring, cancelled aim asserted; it is the item-12 flaky case); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peg-garden FINGER_LEVELS=1,3` clean in 21.9 s and 8.2 s.
- Open: `BROWSER_SUITE=couchgames COUCH_ONLY=peg-garden` failed 1 of 3 runs on the branch (bot never finished: 1 hint, 44–57 misses) while origin/main's game code passed 4 of 4; cause not established, and the final guarded code's couchgames was not run. Not run: the offline check, device play.

## 2026-10-21 — Puddle Gobble levels 1–8

- Built on `claude/puddle-gobble` ([PR #687](https://github.com/rjdunlap/neo/pull/687), base origin/main `2a739fc9` plus the branch): new game `puddle-gobble` in Bubble Beach (now 8 games), levels 1–8; the accounting counts a miss only when aimed (a deliberate choice beyond the definition, recorded in the [definition](../definitions/puddle-gobble.md)).
- `npm run typecheck` clean; `npm test` 191 files, 2059 tests passed before the final tweaks, and after them 2058 of 2059 (one 5 s timeout in the untouched Penguin Slide level-8 test under load; it passes 21/21 alone); the game's 20 rule tests cover fit and growth, refusals, authored rounds, 500-seed generation without fallback, no dead end at levels 1–7, level 8 exact totals and a reachable dead end, the hint reaching the pail within 8 steps, a zero-refusal bot over 200 seeds per plan and layout at four views. `npm run build` passed.
- Dev server http://localhost:5436: `BROWSER_SUITE=puddlegobble` passed six runs in a row after two fixes the browser play found (a let-go thing landing back under the puddle stayed disarmed, so the hint looped; a game-moved target and pass-over soaks were counted as aimed misses): level 1 by taps, level 8 with a too-big touch (no miss), a refused overshoot and a requested hint, and a level 4 portrait screenshot (`test-results/browser/puddle-gobble-4-portrait.png`). `BROWSER_SUITE=fingerdemo FINGER_ONLY=puddle-gobble` passed at level 1 (14.0 s) and level 8 (11.1 s).
- Not run: the offline check, the `world` suite, any device or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): tap-to-lead without help for a toddler, tier 1 versus tier 2 with dots on an iPad, and whether the spoken "Too big yet" while steering feels like a scold.
