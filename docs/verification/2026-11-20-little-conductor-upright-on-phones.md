# 2026-11-20 — Little Conductor upright on phones (PR #1900)

**Changed:** Little Conductor levels 1-3 play upright (`upright: true`). `conductorLayout` hangs the pads up from the bottom edge in upright views; level 3's sign moves to a right-hand column beside a narrower bandstand (friends spacing 140). No rule or accounting change.
**Ran:** typecheck; vitest little-conductor + registry (81 passed), including the layout test over four upright views (390x844, 390x900, 768x1024, 430x700); prettier; eslint.
**Ran:** `BROWSER_SUITE=conductor` with `CONDUCTOR_UPRIGHT=1` (new mode; levels 1-2 landscape, level 3 upright at 390x844 with sign and Done on screen) passed, plus a portrait screenshot. Headless Chrome only.
**Not run:** `fingerdemo`, build, full unit suite, other browser suites.
