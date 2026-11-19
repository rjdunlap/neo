# 2026-11-19 — Tangram Town upright on phones (PR #1849)

**Changed:** Tangram Town plays upright (`upright: true`). The layout moved into a pure `townLayout` in `layout.ts`. Held upright the tray pieces rest in rows of two (a row of four 150-unit touch circles did not fit between the guide corner and the 768-wide edge; the lowest row stays clear of the guide) and the cream tray panel grows to match; the board and the turn, help and check button column are unchanged. Sideways is unchanged.
**Ran:** `npm run typecheck`; vitest for Tangram Town (new `upright.test.ts` over all 8 levels on the five upright views plus 360 × 800 and 768 × 1024, and every picture's turned shapes over 12 seeds kept clear of the buttons and above the tray) and the registry (106 passed); prettier.
**Ran:** `BROWSER_SUITE=uprightgames` for Tangram Town, every level (toddler 1–2, preschool 3, pre-K 4–6, school 7–8), all completed with one sticker each; screenshots of levels 5 and 8 looked at. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other suites.
