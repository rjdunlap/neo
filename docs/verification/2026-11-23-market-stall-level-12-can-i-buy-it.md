# 2026-11-23 — Market Stall level 12, Can I buy it?

**Changed:** Market Stall level 12 (`afford` plan: two choose orders then two spend orders, coins 1/2/5/10), its how-to card, voice lines and three new Kokoro clips.
**Ran:** typecheck; `npm test` (all passing after the clips were rendered; market-stall logic and upright tests include level 12); `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=12` passed (free coin tap, too-dear miss, nudge hint, free empty bell, refused third pick, wrong pair miss then swapped, score [2,1], sticker; screenshot `test-results/browser/woods/market-stall-12-upright.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=12` passed (15.1 s).
**Not run:** `npm run build` (only game files, tests and clips changed); offline check; other suites.
