# 2026-11-24 — Brain Break levels 11-12, Two trails (PR #2103)

**Changed:** Brain Break alternates numbers and letters on levels 11–12, with the letter trail running back from L on level 12. The sign and speech cue whose turn it is. Co-play gives each player one trail.
**Ran:** On base `f5bedbd981` plus the PR diff, typecheck, 24 rule tests (500 existing seeded rounds and 200 new boards), four voice clip tests, scoped lint and format, and the production build passed. Both Kokoro clips are in the service worker precache.
**Played:** At `GAME_URL=http://127.0.0.1:5194`, `BROWSER_SUITE=brainbreak BRAINBREAK_ONLY=two-trails` passed level 12 at 390×844 with a wrong tap on the first letter turn, a hint, a free checked-stone tap, and one sticker. The upright screenshot was reviewed. `BROWSER_SUITE=fingerdemo FINGER_ONLY=brain-break FINGER_LEVELS=12 FINGER_BAND=grownup` passed in 45.8 s.
**Not run locally:** Broader browser and offline suites.
