# 2026-11-19 — Species Comeback sliding family tree (PR #1839)

**Changed:** Upright levels 2–4 use 88-unit turtle cards in a sideways-scrolling family tree. The nests, Spring and keeper choices stay in place. Help brings the suggested pair into view when possible.

**Ran:** On base `f70cdae66` plus the PR diff, typecheck, 33 focused tests, scoped lint and formatting, generated game docs, content barrels, links and diff passed. With Vite at `http://localhost:5194`, Chromium `BROWSER_SUITE=comeback COMEBACK_PHONE=1` passed at levels 1, 3 and 4. Touch checks at 390 × 640 and 390 × 844 covered a swipe from a turtle, cancellation, still taps, fixed nests and choices, help, rotation, wrong keeper choices and the release site. Each round awarded one sticker and screenshots were reviewed. `BROWSER_SUITE=uprightgames PHONE_ONLY=species-comeback PHONE_LEVELS=2` finished in seven touches with one sticker. `BROWSER_SUITE=fingerdemo FINGER_ONLY=species-comeback FINGER_LEVELS=3,4` passed.

**Not run:** Local production build, offline and broader browser suites.
