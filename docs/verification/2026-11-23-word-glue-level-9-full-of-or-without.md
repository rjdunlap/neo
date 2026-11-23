# 2026-11-23 — Word Glue level 9: full of or without

**Changed:** Word Glue school level 9 in [PR #2066](https://github.com/rjdunlap/neo/pull/2066). Five word pairs use the full and empty cups to change a tree, fish, lamp, room and bear. The picture and cups can be heard without answering. The existing tap-choice accounting handles hints and assisted completion.

**Ran:** Typecheck, scoped lint and format, links, diff, and 296 focused tests across Word Glue rules and layouts, school upright layouts, registry, lands, how-to and generated clips. The tests include authored order, 500 seeded balances and the supported completion count. Production build passed and included all 37 new Kokoro clips in the service worker precache.

**Played:** Against the branch based on `ffb36c183`, `GAME_URL=http://localhost:52166 BROWSER_SUITE=wordglue WORDGLUE_ONLY=ending` passed in Chromium at 390 × 844. A slid-off cup and a base-tile tap counted zero, the wrong cup and Show a hint recorded 1/1, and five pictured changes earned one sticker. Reviewed the portrait and the strip showing all 15 states. `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-glue FINGER_LEVELS=9 FINGER_BAND=school` finished in 22.3 seconds against the same server.

**Not run:** Other browser suites and standalone offline play.
