# 2026-11-19 — Pile Match upright on phones

**Changed:** Pile Match plays upright at levels 1–11 (`upright: true`, preschool and school). `pileLayout` gets an upright branch: the tray row (slots and basket) rests 186 units up from the bottom edge above the pet's corner and the heap uses the full width (20 to the view width minus 20) at scale 1; the sideways layout is unchanged. New per-level upright test (`upright.test.ts`): levels 1–11, every heap shape, five views, covering free-piece tap areas, tray targets and `uprightProblems`.
**Ran:** `npm run typecheck`; the registry and Pile Match unit tests (1650 passed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=pile-match` with `PHONE_SHOTS=1`: preschool levels 1 and 4 and school levels 5 and 10 played by real touches; screenshots viewed (fits, no clipping, heap centred in the space above the tray). Headless Chrome only.
**Not run:** build, sweep, full suites, offline, real device.
