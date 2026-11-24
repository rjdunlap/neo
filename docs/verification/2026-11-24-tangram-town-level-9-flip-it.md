# 2026-11-24 — Tangram Town level 9: Flip it (PR #2100)

**Changed:** Tangram Town school level 9: a repair round whose one wrong shape is the new parallelogram, with a flip button and a mirror-aware `looksSame` rule; six new pictures; school band 5–9; new voice lines and how-to card.
**Ran:** typecheck; eslint and prettier; vitest `src/games` and `src/content` (new mirror-rule and level 9 round tests, upright layout tests with the flip button); `BROWSER_SUITE=creative CREATIVE_ONLY=tangram TANGRAM_TAP=skip FROM_LEVEL=8` (level 9: two wrong checks, free flip and back, bot finish, one sticker, portrait 768x1024 screenshot); `BROWSER_SUITE=fingerdemo` at level 9 school.
**Not run:** build, offline.
