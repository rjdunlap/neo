# 2026-11-18 — Water Road upright on phones (PR #1826)

**Changed:** Water Road plays upright at every level 1–5. Its layout moved from `logic.ts` into a pure `layout.ts`; held upright the scene sits lower on the tall screen (`anchorLine`: the springing line and the level-4 ground at 0.55 of the height, the level-5 deck at 0.45, pulled up on a short screen so everything under it stays 200 units clear of the bottom). Sideways is unchanged, pinned by a test. Fixed a level-2 fault: the two stacked frames on a 768-wide view shared one ground line, so the lower arch stood in the earth, its stones fell upward and the pet walked the upper line; each frame now carries its own `ground`. `upright: true` is set and the registry list holds 63 games.

**Ran:** `npm run typecheck`; `npm run game-docs` then the full `npm test` (389 files); eslint and prettier on the changed files. The new `upright.test.ts` covers every level of every band (toddler 1, preschool 1–2, pre-K 2–4, school 3–5), rings of 3, 5 and 7 stones, the pre-K channel cards, the school pier arrows at level 4 and valleys of 3 and 4 spans at level 5, on three upright phone views, the captioned one and a short 375 × 601 one.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=water-road PHONE_SHOTS=1` at 390 × 844 with real touches by the ghost-finger bot: school levels 3, 4, 5, pre-K levels 2, 4, preschool level 1 and toddler level 1; every level finished with one sticker, and a screenshot after every touch was looked at.

**Not run:** the uprightsweep (the per-level test is the proof and the game is now flagged), `fingerdemo` (the bot is unchanged), a sideways browser play (the sideways layout is pinned unchanged by unit tests), `npm run build` (CI runs it), the offline suite, `world`.
