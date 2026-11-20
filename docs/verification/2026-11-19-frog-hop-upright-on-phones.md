# 2026-11-19 — Frog Hop upright on phones (PR #1879)

**Changed:** Frog Hop plays upright at every level (`upright: true`). `hopLayout` (already pure) gained an upright branch: nine pads fold into rows of five and four at a 140 pitch, the six cards into two rows of three beside the guide, all hung up from the bottom edge; the scene's pad baseline became `padPos`/`frogY` so the frog's hops follow each pad's row.
**Ran:** `npm run typecheck`; eslint; the Frog Hop unit tests (37 passed), including a per-level upright test over all 13 plans and five views (768×1024, 390×844, 390×700, 430×932, 360×780) and a rows/ordering/bracket-gap test; the sideways test kept and also run over the upright views.
**Ran:** `BROWSER_SUITE=uprightgames`: preschool 1, 2, prek 1, 4 and school 3, 7, 12 played to completion by real touches, one sticker each; screenshots of levels 7 and 12 viewed, content hung low. Headless Chrome only.
**Not run:** build, full suites, offline.
