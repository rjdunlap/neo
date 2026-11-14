# 2026-11-14 — Pet Says level 8 More opposites (PR #1660)

**Changed:** `pet-says` level 8 More opposites (six pairs, three a round, each asked twice; one sun then five moons; six manner moves outside the tiers; stomp squat and clap loudness; held "once more" counts a hint); pre-K window 3-8, school 6-8.
**Ran:** typecheck; the Pet Says rule tests (40); full `npm test` (6998 passed); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says FROM_LEVEL=8 TO_LEVEL=8` (passed, screenshot `pet-says-8-moon-portrait`, 390x844 with the moon sign shown); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-says FINGER_LEVELS=8` (passed).
**Not run:** `npm run build` (CI runs it on the PR), other suites, levels 1-7 again. Device speech for the new `says.opp.more` line is unchecked.
