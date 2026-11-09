# Verification 2026-11-08 (archived entries)

## 2026-11-08 — Number Nook slice 2: line slides (PR #1415)

Changed: `lineSlide` in `logic.ts`; a tap in the gap's row or column slides every tile between it and the gap, glides them together, counts one slide per tile and is one Undo step; other taps still miss; `nook.miss` and how-to steps 1 and Undo reworded. Bot, Hint, levels and range 1–3 unchanged.
Ran: `npm run typecheck`; number-nook rule tests (line slide equals its single slides over 400 boards per shape, step count equals distance, refused taps return null and leave the board alone) plus `src/content` and registry tests (226 passed, how-to card fit); `BROWSER_SUITE=numbernook` (diagonal refused tap; level 3 two-tile line slide, two slides, not a miss, Undo restores the line; levels 1 and 3 finished, one sticker each; 768×1024 portrait at level 1, driftwood).
Not run: `fingerdemo` (bot unchanged), build (no shared files), offline, device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).
