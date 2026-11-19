# 2026-11-19 — Mossy Path upright on phones (PR #1852)

**Changed:** Levels 1–11 open upright. The seven-column mazes have 104-unit tiles. Undo, Hint and Start over sit beside the guide. The board stays above short-phone captions, and rotation cancels an in-progress press while keeping the plan.

**Ran:** Typecheck and 152 focused tests (one skipped), including layout tests across every board shape, both orientations of transposable coverage boards and six phone views. Generated game metadata, scoped Prettier and ESLint, links and diff checks passed. After integrating Penguin Slide (PR #1853), typecheck, links and 212 focused tests passed (one skipped).

**Ran:** The baseline sweep on `0afce67ff` flagged the guide overlap on all nine school levels. On the claim base `166249a29` plus the feature diff, `BROWSER_SUITE=mossypath MOSSY_ONLY=upright` at `http://127.0.0.1:5193/` opened level 10 at 390 × 630 in touch Chromium with the regular settings and words shown. A native touch made a short plan and sent the turtle along it, a wrong branch counted once, and Hint drew gold prints and counted once. Rotating while holding the turtle preserved the gold route, and play finished upright with one sticker. Reviewed the short-phone screenshot.

**Not run:** Local production build, offline, other browser suites or a separate ghost-finger run.
