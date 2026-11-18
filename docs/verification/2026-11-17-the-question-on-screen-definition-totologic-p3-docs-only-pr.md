# 2026-11-17 — The question on screen definition (TotoLogic P3, docs only; PR #1773)

**Changed:** new definition `docs/definitions/question-on-screen.md` (who sees the caption, one wording shown and said through `voice.line`, a length budget, how it changes in a round, what stands beside a sound, a strip or rail outside the board) and its closeout: TotoLogic P3 marked defined, the roadmap's `lineText(id)` item pointed at `voice.line`, the landed Next ten line removed, one Next ten line (slice 1) and two Queued lines (slices 2 and 3) added.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The line-length figures come from a regex count over the voice files and the question-in-`say` figure from a text search, not from reading the games.
**Not run:** Typecheck, unit tests, build, browser and offline checks (docs-only change; nothing played; no `node_modules` in the worktree).
