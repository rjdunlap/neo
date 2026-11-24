# 2026-11-23 — Pet Says level 12: This hand (PR #2089)

**Changed:** Pet Says level 12, This hand (new `hand` mode, school window 6-12): three lit mitten turns, a "like a mirror" line, three named left/right turns; held "once more" counts one hint. Rule tests added.
**Ran:** typecheck; unit tests for pet-says, content and progress; `npm run game-docs`; `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says FROM_LEVEL=12` (events asserted per turn, two portrait screenshots).
**Not run:** build; `fingerdemo` at level 12 (the bot only taps the arrow, unchanged); landscape screenshot.
