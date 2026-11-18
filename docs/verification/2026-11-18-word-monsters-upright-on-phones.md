# 2026-11-18 — Word Monsters upright on phones (PR #1819)

**Changed:** Word Monsters plays upright at every level 1–14. Its layout moved out of the scene into pure functions in `layout.ts`: four loose monsters two by two, five as three over two, lifted clear of the guide, the picture and boxes above them. Sideways numbers are unchanged. `upright: true` is set and the registry list now holds 58 games.

**Ran:** `npm run typecheck`; eslint on the game folder; `npm test` passed except the generated-docs staleness test, fixed by `npm run game-docs`. The new `upright.test.ts` covers every level, every question of three seeds, on five views (390 × 844, 375 × 667, 430 × 932 with insets, the captioned small phone, 375 × 601): targets at least 100 units, apart, in view, clear of Home/help and the guide, a mid-word screen turn, and sideways unchanged.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=word-monsters` on a 390 × 844 touch phone in headless Chromium, real touches by the game's own bot, one sticker per level: school 6, 7, 10, 12, 13, 14 and lap 9 and 1; a screenshot of each of 6, 7, 9, 10, 12, 13, 14 was looked at.

**Not run:** `npm run build` (no shared files or assets changed; CI runs it), `fingerdemo`, `uprightsweep`, the offline suite, and levels 2–5, 8 and 11 in the browser (they share the layouts of the levels played and are covered by the layout test).
