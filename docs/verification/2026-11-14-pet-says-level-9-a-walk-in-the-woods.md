# 2026-11-14 — Pet Says level 9 A walk in the woods (PR #1663)

**Changed:** Pet Says level 9 picks a four-stop woods, beach or farm walk, with changing landmarks, a move at each stop and held replay. Pre-K reaches 3–9 and school reaches 6–9.
**Ran:** Base `60ba422b` plus the change. Typecheck, 43 Pet Says rule tests and 3 game-doc tests. At `http://127.0.0.1:5178/classic/`, `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says FROM_LEVEL=9 TO_LEVEL=9` checked the woods route, rotation before a new stop, free and held replay, one saved hint and one sticker. Reviewed 390×844 first-stop screenshots for woods, beach and farm. `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-says FINGER_LEVELS=9` completed in 12.4 s.
**Not run locally:** full unit suite and build (PR CI), offline checks, unrelated browser suites.
