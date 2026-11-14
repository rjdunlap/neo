# 2026-11-14 — Pet Says level 7 Quiet dance (PR #1657)

**Changed:** `pet-says` level 7 Quiet dance (four dances of a quiet stretch then a music stretch; the pet freezes in the music and holds still for the arrow), with a review fix so freeze snaps scale to full width and a long frame never skips a stretch; school window now 6-7, pre-K 3-7.
**Ran:** typecheck; full `npm test` (351 files, passed); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says FROM_LEVEL=7` at phone portrait (pass, screenshot `pet-says-7-portrait`, asserts the pet is still when "Music! Freeze!" is said), rerun after the review fix (pass); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-says FINGER_LEVELS=7` (passed, 33.6 s).
**Not run:** build (no shared files or assets changed), other suites, levels 1-6 again. Device speech for the new `says.quiet`, `says.quiet.go` and `says.music` lines is unchecked.
