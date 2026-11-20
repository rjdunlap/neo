# 2026-11-19 — Light Lab upright on phones (PR #1892)

**Changed:** Light Lab plays upright at levels 1–12 (`upright: true`). A new pure `layout.ts` (`boardOrigin`, `cardsShift`, constants moved out of `index.ts`) hangs the board up from the bottom edge (a bare board stops 215 above it, boards with a tray or level 11's cards row 24 above, centred); level 11's cards row shifts right 60 upright because card 0 covered the guide, and `resize` repositions the cards. Sideways plan pinned by test.
**Ran:** typecheck; prettier check; vitest light-lab and registry tests; new per-level `upright.test.ts` (levels 1–10 and 12, 30 level-11 seeds, five views), which failed only on the level 11 cards over the guide before any browser run.
**Ran:** `BROWSER_SUITE=uprightgames` by real touches at prek 1, 3, 4, 11 and school 5, 8, 9, 10, 12, each finishing with one sticker; screenshots of 9, 11, 12 viewed. Headless Chrome only.
**Not run:** build, offline, `fingerdemo`, other suites.
