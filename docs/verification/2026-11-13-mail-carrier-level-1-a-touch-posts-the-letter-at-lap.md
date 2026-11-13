# 2026-11-13 — Mail Carrier level 1, a touch posts the letter at lap (PR #1604)

**Changed:** `mail-carrier` level 1 at the lap band only: a touch off the houses (the full-screen layer) posts the letter to the nearest mailbox with its whoosh, free (no miss, no hint); a touch while a letter is on its way still waves the nearest flag. Toddler's level 1 keeps the wiggle and wave. New logic helper `offHouseTouch(mode, band)`; the level 1 how-to step names both cases.
**Ran:** `npm run typecheck`; mail-carrier and content vitest (22 files, 233 passed, 1 skipped); `BROWSER_SUITE=batch BATCH_ONLY=mail MAIL_LEVELS=1` passed at lap, 1024x768 (off-house touch posts, a touch during the post waves, index advances, score [0,0], idle invitation at letter 2); `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=1 FINGER_BAND=lap` passed (16.7 s).
**Not run:** `npm run build` (no shared files or assets), offline, a toddler browser play (the logic test covers the toddler branch).
