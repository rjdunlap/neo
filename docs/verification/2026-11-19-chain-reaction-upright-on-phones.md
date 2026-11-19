# 2026-11-19 — Chain Reaction upright on phones (PR #1863)

**Changed:** Chain Reaction plays upright at levels 1–11 (`upright: true`, prek and school). Its layout is pulled into a pure `layout.ts` (`chainLayout`): upright, Run, Help and the loose ramps rest in one row 100 units up from the bottom edge and the board hangs above them, with rows spreading from 100 to 124 on a tall phone; the sideways right-edge column is unchanged. The ramp tap circle shrank from 58 to 50 radius so neighbouring sockets never overlap. New per-level upright test: every level, six board seeds, five views, plus a sideways pin.
**Ran:** `npm run typecheck`; the `chain-reaction` folder's unit tests (261 passed) and the registry upright list; prettier and eslint on the changed files.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=chain-reaction`: prek levels 7, 3 and 8, school 3, 9 and 11, completed; screenshots of levels 8 and 11 on a 390×844 phone viewed. Headless Chrome only.
**Not run:** build, offline, other suites, real device.
