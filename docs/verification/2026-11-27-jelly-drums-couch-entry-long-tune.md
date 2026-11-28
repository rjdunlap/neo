# 2026-11-27 — Jelly Drums couch entry, Long tune (PR #2325)

**Changed:**
- `src/games/jelly-drums/logic.ts`: levels 19–22 (echo tunes of 6, 8, 12 and 16 notes; 3, 3, 2 and 1 tunes) in a new `grownup` window `[9, 11, 12, 13, 19, 20, 21, 22]` that no child's band reaches; `longTune` (a seeded walk, mostly neighbours, never one jelly twice in a row, at least four jellies) and `drawEchoRound` (every echo round's tunes drawn at the start, from the seed alone).
- `src/games/jelly-drums/index.ts`: `grownup` in `bands`; couch `control()` (a teal ring along the jellies, the bottom button plays it, the left button replays the tune), `autoplay()`, a public `finished` flag, the slips as the couch score; the progress dots pack closer for sixteen notes; `describeLevel` for long tunes. How-to lines for 19–22.
- `src/couch/catalog.ts` and `party.ts`: the Jelly Drums entry (twin face-off, fewer slips wins, `grownup` band, stops 19, 19, 20, 20, 21, 22, demo 19) in its own unlock tier after Pond Typing; `couch.how.jelly-drums` in the voice script.
- Docs: the game page, the dive's slice 10 (Long tune built; Pass the tune next), COUCH-PLAY.md.

**Ran:** `npm run typecheck`, `npm run lint`, Prettier on the changed files; `npx vitest run src/games/jelly-drums src/couch src/content/howto.test.ts src/content/barrels.test.ts src/content/game-docs.test.ts src/games/registry.test.ts src/content/lands.test.ts` (16 files, 356 passed, 1 skipped), including new rule tests for the long tunes (lengths, the grown-up-only window, the walk's properties over 200 seeds, no repeat in a round, the same round from the same seed); `BROWSER_SUITE=couchgames COUCH_ONLY=jelly-drums` passed (intro, controller lighting, the bot's round at level 19, save). Headless Chromium at 390×844 on the island, grown-up band, level 22: the how-to card and the round, sixteen progress dots on screen with three filled after three right jellies.

**Not run:** the full `npm test` (left to PR CI), `npm run build` (no assets), the full `couch` suite (no trip, face-off or finale code changed), `fingerdemo` (the touch demonstration is unchanged). Chrome emulation is not a real phone.
