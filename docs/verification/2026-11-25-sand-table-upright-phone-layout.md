# 2026-11-25 — Sand Table upright phone layout (PR #2154)

**Changed:** Sand Table is upright-ready at every level of every band. On the 768 × 1024 upright area the tray now starts at y 226 so its bays' tap areas clear the Home and help column; `upright: true` lifts the turn prompt.
**Ran:** `src/games/sand-table/upright.test.ts` (every level of every band, five phone views: the bays, scoop paddles, pail and flag are at least 100 units, in view, apart and clear of Home and the guide); the game's existing logic and layout tests; typecheck, format check and lint on the folder; `SAND_TABLE_PHONE=1 BROWSER_SUITE=sandtable` (level 3 on a 390 × 844 touch phone: no turn prompt, a pour, a scoop, the flag, saved 0 misses and 0 hints, one screenshot looked at).
**Not run:** the full sideways Sand Table play (layout there is unchanged), the full `npm test` (left to PR CI), build, offline, real phone.
