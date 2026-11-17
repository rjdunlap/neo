# 2026-11-17 — At-home notes batch 6 (PR #1760)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for eight more games (Thought Bubbles, Logic Grid, Ramp Race, Inchworm, Chain Reaction, Not Always, Critter Crossing, Ferry Jam), so the table holds 48 games; the table-size floor in `athome.test.ts` rose from 32 to 48; no starter changed at any band. Strings tier: no game behaviour.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts src/content/offscreen.test.ts` (23 of 23 together; the pinned-starter tests pass).
**Not run:** the `athome` browser case (no pinned starter changed), build, any browser suite and offline (none needed at the strings tier).
