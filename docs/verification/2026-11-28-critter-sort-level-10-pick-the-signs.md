# 2026-11-28 — Critter Sort level 10, Pick the signs (PR #2371)

**Changed:** Critter Sort level 10 (school only): choose two of three signs for the overlapping hoops, then sort six critters in two rounds; how-to card, voice lines and a woods browser case.
**Ran:** `npm run typecheck`; `npx vitest run src/games/critter-sort` 40/40 passed; `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=10 TO_LEVEL=10` passed at 1024x768 and on a 390x844 touch phone viewport (pick two signs, take one back and pick again, signs lock at the first drop, two wrong drops and the glow hint, both rounds, saved score [2,1] and sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=10 FINGER_BAND=school` passed (38 s).
**Not run:** `npm run build` (no shared files or assets changed); world, couch and offline suites.
