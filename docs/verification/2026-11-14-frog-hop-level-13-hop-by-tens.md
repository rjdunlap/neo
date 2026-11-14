# 2026-11-14 — Frog Hop level 13 Hop by tens (PR #1662)

**Changed:** Frog Hop school level 13, mode `tens` (pads 0, 10 … 100; starts 10–70, 1–4 tens on or back; tens said on counted hops; the line shows 100 each round); school window 3–13; voice lines `hop.tens*`, how-to step 13.
**Ran:** `npm run typecheck`; full `npm test` (351 files, 7004 passed, 1 skipped); `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=13` (score [2,1], R4, landings said, "100" on screen at 1024×768, 768×1024, 390×844 and 844×390); `BROWSER_SUITE=fingerdemo FINGER_ONLY=frog-hop FINGER_LEVELS=13` (19.7 s); game-reviewer found no defects.
**Not run:** `npm run build` (no shared files or assets changed), other suites, offline. Device speech of the tens words is unchecked.
