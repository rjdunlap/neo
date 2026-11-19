# 2026-11-19 — Village Vote upright on phones (PR #1876)

**Changed:** Village Vote plays upright at every level (`upright: true`). Its pure layout in `logic.ts` gained an upright branch (three toys at x 144/384/624, two at 290/558, tallies and paws beneath, help button bottom right, the whole scene hung up from the bottom edge) and a pure `playLayout` for the sharing scene (a row of four centred on 768); the sideways layout is unchanged and pinned by `upright.test.ts`.
**Ran:** `npm run typecheck`; the Village Vote unit tests, including the new per-level `upright.test.ts` (41 tests over every level, vote family, pet choice and five views); eslint and prettier clean.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=village-vote PHONE_BAND=prek PHONE_LEVELS=1,2,3 PHONE_SHOTS=1`: levels 1–3 completed, screenshots viewed. Headless Chrome only.
**Not run:** build, full suites, the upright sweep, offline.
