# 2026-11-20 — Memory Match toddler opening, hidden level 1 (PR #1914)

**Changed:** `memory-match` gains `toddler: { min: 1, max: 1 }` (hidden level 1, four cards, two picture pairs) and `bands` includes toddler; level 1's how-to finishes with "Find both picture pairs to finish."; rule test updated; `memory` browser suite gained a toddler-band 390x844 four-card play; game docs regenerated.
**Ran:** typecheck; `npx vitest run src/games src/content` (all passed, including lands and registry tests with no paging change); `BROWSER_SUITE=memory MEMORY_LEVELS=1` passed (toddler, 390x844 portrait: four hidden cards at least 100 units and on screen, both pairs found, one sticker).
**Not run:** build, `fingerdemo` (no bot or demo change), a real phone.
**Observation:** on a 390-wide phone the 2x2 board sits at the top with cards about 66 CSS px and empty space below (existing `boardLayout`, unchanged).
