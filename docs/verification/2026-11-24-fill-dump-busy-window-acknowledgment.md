# 2026-11-24 — Fill Dump busy-window acknowledgment (PR #2116)

**Changed:** Fill Dump levels 1–2 answer touches on the basket, open grass and landed fruit during the tip-out (`busyTouch`); never feeds, scoops or counts.
**Ran:** typecheck; eslint and prettier on the game; fill-dump vitest (32 pass, new `busyTouch` test); `BROWSER_SUITE=originals ORIGINALS_ONLY=fill FILL_LEVELS=1,2` with a new rapid-tap regression (basket and landed fruit touched mid-tip, round state unchanged).
**Not run:** build; `fingerdemo` (bot action unchanged).
