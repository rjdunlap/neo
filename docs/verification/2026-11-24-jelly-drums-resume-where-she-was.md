# 2026-11-24 — Jelly Drums resume where she was

**Changed:** four- and five-note tunes keep her place after a miss and on listen again (`RESUME_FROM_LENGTH`, `placeAfterMiss` in `logic.ts`); a row of dots ticks the notes she has right and the help glow goes to the next jelly; a miss still counts once. Two new rule tests.
**Ran:** typecheck, vitest `src/games/jelly-drums` (95 passed), and `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` (levels 1–10 pass, score still `[2, 1]`; that script only misses on the first note, so it does not exercise a mid-tune resume).
**Not run:** `npm run build`, a portrait screenshot of the dots, a scripted mid-tune miss in the browser, `fingerdemo` and offline.
