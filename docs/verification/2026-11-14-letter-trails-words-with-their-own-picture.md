# 2026-11-14 — Letter Trails words with their own picture (PR #1676)

**Changed:** Letter Trails level 7 draws from 19 pictured words and ends on the word's picture; level 8 caps the name at eight letters and ends on a sign; levels 7–8 count at most one miss and one hint per letter; short unspoken letter pictures at 7–8; how-to lines; sign scales wide capitals (review fix).
**Ran:** `npm run typecheck`; `npx vitest run src/games/letter-trails src/content` (222 passed, 1 skipped); `BROWSER_SUITE=letters` (5 checks, run twice, before and after the review fixes; level 7 at 390x844 portrait, closing picture and eight-letter cap); `BROWSER_SUITE=fingerdemo FINGER_ONLY=letter-trails FINGER_LEVELS=7,8` (both finished, 22.9 s and 54.0 s); a game-reviewer pass (no blockers, three low notes, fixed).
**Not run:** `npm run build` (no shared files or assets changed); the full `npm test` (CI runs it).
