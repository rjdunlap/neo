# 2026-11-17 — At-home notes batch 7 (PR #1761)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for the last seven eligible games (Memory Desk, Sorting Machine, Orchard Rows, Welcome Ways, Shape Buddies, Playdate Workshop, Read & Do), so the table holds 55 games; the table-size floor in `athome.test.ts` rose from 48 to 55; no starter changed at any band. Strings tier: no game behaviour.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts src/content/offscreen.test.ts` (23 of 23 together; the pinned-starter tests pass).
**Not run:** the `athome` browser case (no pinned starter changed), build, any browser suite and offline (none needed at the strings tier).
