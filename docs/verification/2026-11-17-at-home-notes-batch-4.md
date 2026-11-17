# 2026-11-17 — At-home notes batch 4 (PR #1758)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for eight more games (Domino Run, Puddle Gobble, Beat Builder, Sing-Along Barn, Adventure Walk, Village Vote, Memory Match, Block Topple), so the table holds 32 games; no starter changed at any band. Strings tier: no game behaviour.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts src/content/offscreen.test.ts` (23 of 23 together); Prettier check on both files.
**Not run:** the `athome` browser case (no pinned starter changed), build, full `npm test` (CI runs both on the PR) and every other suite.
