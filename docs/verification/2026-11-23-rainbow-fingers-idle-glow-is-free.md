# 2026-11-23 — Rainbow Fingers idle glow is free

**Changed:** Rainbow Fingers: the glow after twelve quiet seconds (`IDLE_GLOW_AFTER`) no longer counts a hint; only the glow that follows two misses does (`glowCounts` in `logic.ts`, used by `showHint`). Settles the open part of decision 5.
**Ran:** typecheck; Rainbow Fingers unit tests (139 passed, including the new `glowCounts` test); `BROWSER_SUITE=early EARLY_ONLY=paint FROM_LEVEL=3 TO_LEVEL=3` passed (level 3 painting, wrong colors, hint, every picture and sticker).
**Not run:** build, offline.
