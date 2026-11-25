# 2026-11-25 — Jelly Drums journal entries (PR #2165)

**Changed:** Jelly Drums files two journal entries, `jelly-drums:low-high` (the biggest and the littlest jelly both tapped in a round) and `jelly-drums:scale` (the three-neighbours sparkle actually played, level 3), through `JournalWatch` in `logic.ts` and `discoveries` on `ctx.finish`; `JournalGame` gained `jelly-drums`, with two voice lines and a journal card picture drawn from the game's own jellies.
**Ran:** typecheck; lint; format check; `npx vitest run src/games/jelly-drums src/content` (rule tests for what each round files, journal tests that the spoken lines and card wording match the rules); `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` (levels 1 and 2 file low and high but no scale, level 3 files both; all 13 levels still pass).
**Not run:** full `npm test`, build, `fingerdemo` (bot unchanged), a journal-scene screenshot of the two new cards, offline.
