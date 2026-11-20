# 2026-11-19 — Example Express upright on phones

**Changed:** Example Express plays upright (`upright: true`). `layout.ts` was already pure but its sideways 1024 plan centred with `dx=(w-1024)/2`, so on 768 the controls and slots ran off the edges. The upright branch uses `dx=w/2-550`, hangs the whole plan up from the bottom edge (controls 40 above the view bottom; a tall phone's spare height is sky), gives the controls a 146 pitch from x 160 clear of the guide corner, and moves the Hear-rule button and shelf caption in. Sideways plan unchanged.
**Ran:** typecheck; prettier and eslint; vitest example-express and registry tests; new per-panel upright test over five upright views (main, shelf, level-3 lesson, level-3 shelf, tray, check strip), which passed first time (the layout test first used non-upright 768x1024 views, which never took the upright branch).
**Ran:** `BROWSER_SUITE=uprightgames` filtered, school levels 1–3 passed (7, 10 and 14 touches, one sticker each); screenshots show content hung from the bottom. Headless Chrome only.
**Not run:** build, full unit suite, sweep, offline, `fingerdemo`, other suites.
