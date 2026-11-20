# 2026-11-19 — Ferry Jam upright on phones (PR #1886)

**Changed:** Ferry Jam plays upright at every level (`upright: true`). The layout is now the pure `harborLayout` in `layout.ts` (sideways plan pinned identical by test): upright the harbor takes the width and hangs up from the bottom edge (bottom at least 190 above the view bottom, Home clearance y at least 235), a yellow-ferry harbor's lower dock included, undo bottom-right. The fault was the sideways-only x≥150 margin pushing 6-wide harbors off a 768 view.
**Ran:** typecheck; Ferry Jam and registry unit tests (948 tests) including the new per-level `upright.test.ts` (every level's harbors and the course harbors, five views).
**Ran:** `BROWSER_SUITE=uprightgames` by real touches at prek 9, 4, 10, 2, 3 and school 5 onward; a level 6 screenshot viewed (fits, hangs low). Headless Chrome only.
**Not run:** build, offline, full suites.
