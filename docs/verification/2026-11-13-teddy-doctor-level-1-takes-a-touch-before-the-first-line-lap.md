# 2026-11-13 — teddy-doctor level 1 takes a touch before the first line; lap touch anywhere (PR #1600)

**Changed:** `teddy-doctor` level 1 opens input as each patient hops in (taps count while `doctor.play` plays; other modes unchanged); at lap a touch anywhere in the room bandages the nearest boo-boo left. How-to card adds a line for the littlest.
**Ran:** `npm run typecheck` (pass); `vitest src/games/teddy-doctor` (11 passed); `BROWSER_SUITE=next NEXT_ONLY=doctor` (levels 1–8 passed; at lap level 1 a tap on the empty room during the stretched second-patient line bandaged one boo-boo); `BROWSER_SUITE=fingerdemo FINGER_ONLY=teddy-doctor FINGER_LEVELS=1 FINGER_BAND=lap` (pass).
**Not run:** `npm run build` (no shared files or assets changed); other suites.
