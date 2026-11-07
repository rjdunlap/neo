# Verification 2026-11-07 (archived entries)

## 2026-11-07 — Bolt Boards level 9 definition (docs only)

Changed: `docs/definitions/bolt-boards-put-it-back.md`, READY and the dive (PR #1348); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. The definition's figures (64 states/28 dead on the authored board, dead ends on all 40 level-3/4 boards, 2,561 dead states each with a covered unplaced bolt, max 256 states, `boardLayout` rectangles at the four views) came from a throwaway tsx probe against the real `logic.ts`, not a committed test. Open: no code checks run; nothing built.

## 2026-11-07 — Cut Along deep dive (docs only)

Changed: `docs/deep-dives/cut-along.md` and its tracker, READY, GAMES (typo), ROADMAP rows (PR #1351); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; no new decisions wait on the developer.

## 2026-11-07 — Voice lines and how-to cards split per game

Changed: each of the 175 games has `src/games/<id>/voice.ts` and `howto.ts`; `src/content/voice-script.ts` keeps 387 shared lines and gathers the rest, `src/content/howto.ts` gathers the cards, both through blocks `scripts/content-barrels.mjs` writes; new `src/content/barrels.test.ts`; `allowImportingTsExtensions` (Node's voice-clip renderer loads the `.ts` imports). Ran: sorted-JSON comparison of `SCRIPT` and `HOW_TO` before and after (identical, 5,746 lines and 175 cards); `npm run typecheck`; `npm test` (322 files, 6,002 tests); `npm run build`. Open: no browser suite run, since the runtime content is identical and the build passes.

## 2026-11-07 — Bolt Boards level 9, Put it back (PR #1354)

Changed: plan 9 in `src/games/bolt-boards/` (school order 4, 5, 8, 6, 7, 9): the reverse `place` rule, woodpile picker, picture card, covering-board voice lines (`bolt.instruct-build`, `bolt.covers.*`, `bolt.built`), how-to card, `sfx.ratchet` direction; the authored board's small-board bolts at y 254 and 345. Ran at the branch HEAD on base `origin/main` 037b4e26 (dev server http://localhost:5840): typecheck; `npm test` 321 files, 6011 tests pass (12 new level-9 rule and layout tests); `BROWSER_SUITE=boltboards` pass (levels 1, 7, 8, 6 portrait, and level 9 portrait: two covered-hole misses, the glow hint, a free dead end, undo, both scenes, one sticker); `fingerdemo FINGER_ONLY=bolt-boards FINGER_LEVELS=9` pass (36.8 s); `npm run build`. Not run: offline check (not needed by tier). Open: no iPad or child; whether a six-year-old reads the picture card and finds back-first without the glow is in DEVICE-CHECKS.

## 2026-11-07 — Domino Run deep dive (docs only)

Changed: `docs/deep-dives/domino-run.md` and its tracker, STUDY-BACKLOG and READY rows (PR #1357); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–4 are queued; no new decisions wait on the developer.
