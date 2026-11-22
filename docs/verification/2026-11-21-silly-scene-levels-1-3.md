# 2026-11-21 — Silly Scene levels 1–3 (PR #1964)

**Changed:** Puzzle Peaks gains three upright tap-to-spot rounds, spoken reasons, repairs and an ordinary sticker. Checked [the sources for the spoken reasons](../games/silly-scene.md#sources-for-spoken-reasons), including fish fins and rain falling from a cloud.
**Ran:** Typecheck, 119 focused tests (one skipped), lint on the game and browser files, generated docs, Markdown links, diff check and a production build at `e53ea1bb5` (integrates voice batch 18). The new 11,053-byte Kokoro title is in the service worker precache.
**Played:** `GAME_URL=http://127.0.0.1:5297 BROWSER_SUITE=sillyscene` passed with Chromium touch at 390 × 844. Level 1 saved 0 misses/0 hints. Level 3 checked the ordinary prop, a repeat, the possible decoy, two misses and one glow, and rotation during a repair. Both earned one sticker. Reviewed the level 3 portrait image with captions. Filtered `fingerdemo` passed at preschool level 1.
**Not run:** broader browser suites and a separate offline play-through.
