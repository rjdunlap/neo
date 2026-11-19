# 2026-11-19 — Domino Run upright on phones (PR #1871)

**Changed:** Domino Run plays upright at every level (`upright: true`). Its layout was already the pure `dominoLayout`; new `upright.test.ts` over levels 1–11, six seeds and five views found the first slot column (top 200) covering Home and help (needs 210) at 768 × 1024, and the tray mid-screen on a tall phone. Upright the tray now hangs 100 units up from the bottom edge with the lanes standing over it (empty sky above by design).
**Ran:** `npm run typecheck`; Domino Run and registry unit tests (128 passed); prettier; eslint on the folder.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=domino-run PHONE_BAND=school PHONE_LEVELS=4,5,8,9,10,11 PHONE_SHOTS=1`: all six completed with one sticker each, screenshots of levels 4 and 8 viewed. Headless Chrome only.
**Not run:** `uprightsweep` before the flag (the per-level test was the proof), build, other suites, offline.
