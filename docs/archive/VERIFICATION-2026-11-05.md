# Verification 2026-11-05 (archived entries)

## 2026-11-05 — Treasure Map level 7 How far? (treasure-map batch 3)

- [PR #1245](https://github.com/rjdunlap/neo/pull/1245) (tested commit 29fec660 `claude/treasure-map-how-far`; Vite `http://localhost:5794`, `VITE_SPEECH=off`): school level 7, a hidden chest on a 4 by 4 map found from footprint-stack distances; ruled-out digs are misses with a reason; 5 new voice lines, level-scoped how-to step.
- Ran: typecheck; full `npm test` 304 files, 5,021 tests pass (before the review fix; after it vitest on `src/games/treasure-map` and `src/content`, 193 pass); `BROWSER_SUITE=woods WOODS_ONLY=map FROM_LEVEL=7 TO_LEVEL=7` pass (two fitting digs, a ruled-out miss, its free re-tap, a free re-dig, second miss and the glow, score [2,1], sticker; portrait screenshot `test-results/browser/woods/treasure-map-7-footprints-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=7` pass in 14.5 s; `npm run build`.
- Not run: levels 1–6 regression play, `couchgames` (couch unchanged), offline check, an iPad or a child ([device check](../DEVICE-CHECKS.md): whether footprint stacks read as distance).

## 2026-11-05 — Treasure Map level 8 Slide it (treasure-map batch 4)

- [PR #1250](https://github.com/rjdunlap/neo/pull/1250) (tested commits b08654a5, then 8a462140 `claude/treasure-map-slide-it`; Vite `http://localhost:5818`): school level 8, a three-square raft slides by a vector on a 5 by 5 map; she taps the flag's landing, then picks the slid outline among three cards; named reasons for misses.
- Ran: typecheck; full `npm test` 304 files, 5,046 tests pass (before the hint-glow fix; treasure-map rule tests rerun after); `BROWSER_SUITE=woods WOODS_ONLY=map FROM_LEVEL=8 TO_LEVEL=8` pass, rerun after the fix (wrong square, free map tap, turned-over card miss and hint, free re-tap, three rafts, score [2,1]; portrait screenshot `treasure-map-8-outline-cards-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=8` pass in 12.3 s.
- Not run: `npm run build` (no shared assets), levels 1-7 regression play, `couchgames` (couch unchanged), offline check, an iPad or a child ([device check](../DEVICE-CHECKS.md): whether the outline cards read as the same shape slid).
