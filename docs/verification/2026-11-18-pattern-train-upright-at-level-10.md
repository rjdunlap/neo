# 2026-11-18 — Pattern Train upright at level 10 (PR #1810)

**Changed:** `pattern-train` level 10's tunnel arch (the 88-unit target the phone sweep found) is 100 units wide in every view, sized from `TUNNEL_SIZE` in `logic.ts` with a rule test; `uprightLevels` is now levels 8–16 (levels below 8 are still not upright).
**Ran:** `npm run typecheck`; `npx vitest run src/games/pattern-train` (16 tests); `BROWSER_SUITE=uprightsweep PHONE_ONLY=pattern-train PHONE_LEVELS=all` on a 390 × 844 touch phone: levels 8–16 all fit, level 10 with 12 targets, 0 wrong, smallest 100 units; the level 10 screenshot looked at (tunnel between the sixth car and the empty car, every symbol visible).
**Not run:** `npm run build` and the full unit suite locally (CI runs both), the `pattern` regression play, offline, any other browser suite; no real phone.
