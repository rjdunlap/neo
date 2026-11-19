# 2026-11-19 — Trackway Tales upright on phones (PR #1861)

**Changed:** Trackway Tales plays upright at every level (`upright: true`). Its layout was already a pure `trackLayout` in `logic.ts`, so an upright branch was added there: strips narrow from 900 to 700 and sit below the Home column, so 8 columns keep 70-unit prints; cards, the study board and Check stand up from the bottom edge. New per-level upright test over levels 1–3 and four views.
**Ran:** `npm run typecheck`, prettier and eslint on the game folder; vitest on Trackway Tales and `src/games/registry` (89 passed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=trackway-tales PHONE_BAND=school PHONE_LEVELS=1,2,3 PHONE_SHOTS=1`: all three levels completed, one sticker each; screenshots viewed. Headless Chrome only.
**Not run:** full `npm test`, build, `uprightsweep`, other suites, real device.
