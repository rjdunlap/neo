# 2026-11-14 — Frog Hop scenes: brook, flower path, evening (PR #1665)

**Changed:** each round draws one of four scenes (lily pond, brook stones, flower path, evening pond) with `sceneFor(ctx.rng)` after `makeQuestions`, so a seed's questions are unchanged; art only. New pure `hopLayout(view, mode, corner)` places pads, sign and number cards; the card row now starts right of the guide corner (it overlapped by about 6 units).
**Ran:** `npm run typecheck`; Frog Hop rule tests (34 pass), including "Scenes (slice 6)": all four scenes occur over seeds 0–99, questions unchanged, and every level at 1024×768, 768×1024, 390×844 and 844×390 has pads, sign and cards on screen, apart, at least 100 targets and clear of the guide corner; `BROWSER_SUITE=smoke SMOKE_ONLY=frog-hop` (levels 1, 7, 13 and portrait); one screenshot per scene at 1024×768 (not committed).
**Not run:** full `npm test` (CI runs it), build, the woods `hop` suite, `fingerdemo` (no bot or demonstrated action changed).
