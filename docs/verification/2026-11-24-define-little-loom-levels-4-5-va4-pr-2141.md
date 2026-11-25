# 2026-11-24 — Define Little Loom levels 4–5 (VA4, PR #2141)

**Changed:** docs only: the levels 4–5 definition in `docs/definitions/little-loom.md`, the study's build-slice line, the study backlog row, and READY's Next ten (the define line removed, the VA5 build line added).
**Ran:** a script that enumerated every pedal and yarn plan against the island rule for the three level 4 samples and three level 5 samples (exactly one accepted plan each; all three level 5 plans pass the rule; P1 P2 P1 P2 is rejected as a long float at the fourth row; no level 4 weft plan equals a sample column); `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** no code, browser, layout, palette contrast or device check (nothing is built); the landscape and portrait rectangles are unmeasured design proposals.
