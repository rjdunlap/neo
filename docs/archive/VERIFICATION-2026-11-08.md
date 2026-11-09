# Verification 2026-11-08 (archived entries)

## 2026-11-08 — Number Nook slice 2: line slides (PR #1415)

Changed: `lineSlide` in `logic.ts`; a tap in the gap's row or column slides every tile between it and the gap, glides them together, counts one slide per tile and is one Undo step; other taps still miss; `nook.miss` and how-to steps 1 and Undo reworded. Bot, Hint, levels and range 1–3 unchanged.
Ran: `npm run typecheck`; number-nook rule tests (line slide equals its single slides over 400 boards per shape, step count equals distance, refused taps return null and leave the board alone) plus `src/content` and registry tests (226 passed, how-to card fit); `BROWSER_SUITE=numbernook` (diagonal refused tap; level 3 two-tile line slide, two slides, not a miss, Undo restores the line; levels 1 and 3 finished, one sticker each; 768×1024 portrait at level 1, driftwood).
Not run: `fingerdemo` (bot unchanged), build (no shared files), offline, device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-08 — Log Roll slice 3: level 5 Lay it in the cradle (PR #1416)

Changed: level 5 (grown-up range 1–5): four frozen 6×5 floors at depth 10 (3, 4, 3, 4 upright starts; cradles across and along) finishing lying across two cradle stones; standing on one says `log.cradle` with no miss; four new voice lines, level-scoped how-to step and finish; levels 1–4 regenerate byte-identical.
Ran: `npm run typecheck`; `npm test` (329 files); `BROWSER_SUITE=logroll` (levels 1, 4 and 5, upright stop on a cradle at 5, landscape screenshot `log-roll-cradle-stand`); `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=5` (14.4 s).
Not run: build (CI), offline, portrait screenshot at 5. Open: depth 10 is a choice for a person to judge; device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).
