# 2026-11-17 — At-home notes batch 5 (PR #1759)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for eight more games (Pile Match, Bolt Boards, Robot Path, Secret Code, Garden Rows, Penguin Slide, Sense Detective, Ready for Adventure), so the table holds 40 games; no starter changed at any band. Strings tier: no game behaviour.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts src/content/offscreen.test.ts` (23 of 23 together; the pinned-starter tests pass).
**Not run:** the `athome` browser case (no pinned starter changed), build, any browser suite and offline (none needed at the strings tier).
