# 2026-11-21 — Say why after a right answer: Pattern Train and Rhyme Time (PR #1950)

**Changed:** TotoLogic P7. Pattern Train levels 1–14 await one spoken reason line (`patternSaid`, `pieceName` in `logic.ts`; `pattern.why*` and `pattern.oddWhy` in `voice.ts`) before `ctx.finish`; Rhyme Time's last odd-one-out question says `rhyme.oddwhy` (`oddRhymes`); both games' rule tests; the `pattern` suite records the final answer's line.
**Ran:** typecheck; `npm test` (463 files, 17,394 passed, 1 skipped) before the final wording change, then both games' rule tests (50 passed) after; `BROWSER_SUITE=pattern PATTERN_LEVELS=7,11,12,13,14` passed (13,14 again after the wording change; asserts a why line with filled slots at levels 1–14); `BROWSER_SUITE=woods WOODS_ONLY=rhyme FROM_LEVEL=4 TO_LEVEL=4` passed (that suite does not assert the spoken line).
**Not run:** `npm run build` (no shared files or assets changed); `fingerdemo` (bot and demonstrated action unchanged); offline.
