# 2026-11-24 — Word Monsters Told, then asked (PR #2135)

**Changed:** Word Monsters levels 7 and 8 say the sounds only in a round's first question; later questions say just the word ("Make hat!"), the picture says the word again when tapped (free), and a wrong drop still says the sound. New lines `monster.family.word` and `monster.end.word`, `toldLine` in `logic.ts`, how-to text, and a batch-suite branch for levels 7 and 8.
**Ran:** Typecheck; Word Monsters, barrels and game-docs unit tests (110 passed, including a test that only the first question carries a sound); `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=7,8` (first-question line, picture tap free at question 2, two misses and hint, saved score); `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=7,8` (34.0 s and 17.3 s).
**Not run:** Full `npm test` and build (PR CI runs them); real device speech; a portrait screenshot of the new picture tap.
