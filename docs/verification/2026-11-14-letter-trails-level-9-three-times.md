# 2026-11-14 — Letter Trails level 9 Three times (PR #1679)

**Changed:** Letter Trails level 9 traces one capital three times (solid trail, dots, then only the start ring and arrow) with three try pips, a wander restoring the solid trail, at most one hint per try and one sticker for the three; new lines `trails.dots` and `trails.alone`; level-9 how-to lines.
**Ran:** `npm run typecheck`; full `npm test` (one how-to card length failure fixed, then `npx vitest run src/content src/games/letter-trails` passed, 7,073 others passed); `BROWSER_SUITE=letters` (6 checks; level 9 at 390x844 portrait with screenshots of the dotted and start-only tries, one wander restores the solid trail, no hint counted); `BROWSER_SUITE=fingerdemo FINGER_ONLY=letter-trails FINGER_LEVELS=9` (24.9 s); a game-reviewer pass (no blockers; how-to wording fixed).
**Not run:** `npm run build` (no shared files or assets changed).
**Observation:** on an upright phone the tracing canvas is small at every level (the existing `resize` formula); not changed here.
