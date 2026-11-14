# 2026-11-13 — Pet Says more moves, tiers and counts (PR #1625)

**Changed:** `pet-says` slice 3: ten new moves in five tiers (base, social, walking, animal, calm), level 1 from base plus social, levels 3 and 4 from all 18, level 13 gains peekaboo and pat-a-cake; counted beats at level 3 (never above five); an `eyes` pair for peekaboo; ten `says.move.*` lines (device speech); how-to lines.
**Ran:** `npm run typecheck`; `pet-says` rule tests (12); full `npm test` (346 files passed, 5 failed only on timing tests in other games under machine load: block-topple, fluffy-salon, keep-house, number-nook, penguin-slide, secret-code; nothing in pet-says; CI reruns them); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says` at levels 1-5 (portrait screenshot at level 3; new assertions: every new move performs and the mittens rest, `perform('stomp', 2)` says 1, 2); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-says FINGER_LEVELS=1,3` passed.
**Not run:** `npm run build` (no shared files changed); offline.
