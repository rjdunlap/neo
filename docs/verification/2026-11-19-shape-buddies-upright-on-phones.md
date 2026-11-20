# 2026-11-19 — Shape Buddies upright on phones (PR #1889)

**Changed:** Shape Buddies plays upright at every level (`upright: true`). The pure layout in `logic.ts` takes an upright branch: bridge dock at x 250 clear of Home (mirrored for level 6), pot at 390 along, tools in a row with the parks beneath, four level-6 buttons at a 160 pitch, the whole scene hung up from the bottom edge. The chute's far end stays cropped at the edge, by design.
**Ran:** typecheck; Shape Buddies unit tests (41) including the new per-level `upright.test.ts` (5 views x 8 levels) and the registry test.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=shape-buddies PHONE_BAND=school PHONE_LEVELS=1,3,4,6,8 PHONE_SHOTS=1`; screenshots viewed. Headless Chrome only.
**Not run:** build, other suites, a real phone.
