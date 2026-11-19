# 2026-11-19 — Jar Sort upright on phones (PR #1867)

**Changed:** Jar Sort levels 1–12 play upright with full-size targets, one or two shelves clear of the short-phone caption and Undo, and the picture aligned above its jars. The board uses the latest view when rebuilt.
**Ran:** Typecheck, scoped lint and format, generated game metadata, links and diff checks, and 59 focused tests (1 skipped) after integrating Duck Pond (#1865). The layout test caught the level 4 caption overlap at 390 × 625 before the fix.
**Ran:** `BROWSER_SUITE=uprightsweep PHONE_BANDS=all PHONE_ONLY=jar-sort` classified all 12 openings as “look” because it measured only Undo. `uprightgames` at 390 × 844 completed all 12 with one sticker each (preschool 1, 2, 9, 3 and school 4–8, 10–12) before the view-cache fix. Verified the final openings and reviewed screenshots of all 12 levels at 390 × 844.
**Ran:** Final Chromium touch at 390 × 625 verified level 7 caption clearance, a cancelled drag, two misses and one hint, rotation, a successful drag, Undo and one sticker. Checked level 11 picture alignment upright and reviewed screenshots of both short-phone levels.
**Not run locally:** Production build, offline or a separate `fingerdemo`.
