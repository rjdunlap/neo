# 2026-11-17 — Upright batch 6: six early-school games (chunk 31, PR #1765)

**Built in part.** `drift-cards` (levels 1–3) and `word-glue` (levels 1–4) are `upright: true`, with `src/games/upright-batch-6.test.ts` checking every level on the three upright phone views and a short 375 × 601 one; drift-cards' `cornerButtons` keeps a 120 × 210 left column clear upright (a real overlap on the short view at level 3). `beat-builder` [3, 6–9], `pattern-train` [8, 9, 11–16], `pixel-pictures` [10–12] and `orchard-rows` [7, 9] use `uprightLevels` (the turn prompt still shows at their other levels). The sweep gained `PHONE_LEVELS=all` and a `culprits` list.

**Left over, now queued in [READY](../READY.md#phone-play):** pixel-pictures levels 3–8 (about 5 units over the right edge at 768 wide), pattern-train level 10 (an 88-unit target), beat-builder levels 4–5 (eight 100-unit steps need a layout), orchard-rows levels 1–6 and 8.
