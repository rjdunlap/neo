# 2026-11-24 — Puzzle Pals box lid at levels 5-7 (PR #2108)

**Changed:** levels 5–7 show a 170×119 box lid (`plan.lid`, `lidLayout`), a copy of the finished picture that takes no touches: sideways in the left strip under the `?` button, upright top right above the frame; the how-to step and level names say so.
**Ran:** typecheck; puzzle-pals and content vitest; eslint and prettier on the game folder; one hand-driven play in the browser pane (not a harness suite) at level 5 sideways (one off-frame drop was not a miss; completed with the lid still shown); screenshots at 1024×768 and a 375×812 upright phone at level 7 (lid clear of the buttons, frame and tray).
**Not run:** `npm run build`, the full test suite, offline.
