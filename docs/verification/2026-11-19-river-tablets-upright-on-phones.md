# 2026-11-19 — River Tablets upright on phones

**Changed:** River Tablets plays upright at levels 1–6 (`upright: true`). `tabletLayout` in `logic.ts` has an upright branch that hangs the whole scene up from the bottom edge (floor 24); levels 4–6 stack: tablet centred with the lineup under it and stamps/Hand in in a row (4), a verdict row with each number under it (5), two tablets side by side with the lineup and "this one" under each (6). Sideways plan unchanged.
**Ran:** typecheck; prettier and eslint; vitest river-tablets and registry tests (141); new per-level `upright.test.ts` (levels 1–6, five views), which failed first on floating (all levels) and null layouts (4–6) before any browser run.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=river-tablets PHONE_BAND=school PHONE_LEVELS=3,4,5,6` passed; screenshots of 4 and 6 viewed. Headless Chrome only.
**Not run:** levels 1–2 (preschool band) in a browser, build, offline, `fingerdemo`, other suites.
