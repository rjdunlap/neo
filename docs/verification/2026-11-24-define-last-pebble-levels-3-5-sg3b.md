# 2026-11-24 — Define Last Pebble levels 3–5, SG3b (PR #2149)

**Changed:**
- New definition [docs/definitions/last-pebble-3-5.md](../definitions/last-pebble-3-5.md): going first or second (level 3), bigger steps with take 3 or 4 (level 4) and misère as its own level 5, with the model changes in `logic.ts` (misère as normal play on `T - 1`, `goFirstWins`, a choice-aware turning point), the choice screen, a four-row board, accounting, voice lines, cards, ghost finger and two build batches (`last-pebble 2` levels 3–4, `last-pebble 3` level 5).
- Linked from the docs map, the levels 1–2 definition and game page, the strategy-games study and the roadmap row; removed the `900` READY file and queued `930` and `940`.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`.

**Not run:** typecheck, unit tests, build and browser checks (docs only; nothing built or played).
