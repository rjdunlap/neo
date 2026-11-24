# 2026-11-24 — Monster Munch level 13 Even it out (PR #2121)

**Changed:** Monster Munch school level 13, Even it out (uneven tummies, take-out taps, drag between monsters, bell, then the pad), its voice lines `munch.even` and `munch.even-no` (clip rendered), how-to card and ghost finger.
**Ran:** `npx tsc --noEmit`; `npx vitest run src/games/monster-munch` (92 tests, including new level 13 rule tests); full `npm test` (all passed except the voice-clip freshness test, fixed afterwards by rendering the clip); `BROWSER_SUITE=third MUNCH_LEVELS=13` filtered (both rounds, two wrong bells giving 2 misses and 1 hint, take-out taps, drags, bell, pad, saved round and sticker) and one 1024x768 screenshot.
**Not run:** the voice-clip freshness test in full after the clip was rendered; an upright phone screenshot of level 13 (layout shared with levels 7 and 8); `fingerdemo`; build; offline.
