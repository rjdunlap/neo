# 2026-11-20 — Down We Go levels 1-2 (PR #1909)

**Changed:** new game `down-we-go` levels 1-2 (the lantern on a knotted rope, the sun dial, the deepest-ledge question; pre-K 1-2, school 2), in Bubble Beach (lands test passed; the pre-K side now pages), region tinker-lab; rules, layout, art, voice, how-to, ghost finger, browser case and a Kokoro-rendered spoken title clip.
**Ran:** typecheck; full unit tests (all pass after the title clip was rendered); `npm run build`; `BROWSER_SUITE=downwego` (level 1 and 2 scripted play: ledge before the ride is free, two counted misses then one glow hint, a shallow lit ledge is free, an unmeasured ledge is free, a requested hint); `fingerdemo` with `FINGER_ONLY=down-we-go` (both levels finish); layout test at the sideways and upright views; one sideways 1024x768 screenshot at the darkest knot (reads well).
**Not run:** a portrait browser screenshot (the layout test covers portrait), the offline suite.
