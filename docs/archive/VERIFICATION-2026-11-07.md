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

## 2026-11-07 — Games discovered from their folders (PR #1356)

Changed: `src/games/registry.ts` builds `GAMES` with `import.meta.glob`, in `LANDS` order (same 175 IDs as sorted sets; 135 positions moved); new registry test (fails when the sort is removed). Ran (ff996ade): `npm run typecheck`; `npm test` (322 files, 6,003 tests, run before the new test was added; registry and `src/content` re-run after, 20 files, 214 tests); `npm run build`; `BROWSER_SUITE=world` at http://localhost:5197 (2 checks). Open: offline check not run (persistence and assets unchanged); no device check.

## 2026-11-07 — AGENTS.md trimmed to rules and pointers (PR #1359)

Changed: AGENTS.md (32,766 to about 16 KB), new `docs/SESSION-GUIDE.md`, the docs-keeper and game-reviewer agents, the comments in `peek.mjs` and `overlap.sh`, and `scripts/agent-guard.test.mjs` (adds a 24 KiB budget test under the 32 KiB hard test). No game or app code. Ran: `node scripts/check-links.mjs`, `git diff --check`, `npx vitest run scripts/agent-guard.test.mjs` (6 pass). Open: nothing.

## 2026-11-07 — Fruit Sums deep dive (docs only)

Changed: `docs/deep-dives/fruit-sums.md` and its tracker, READY, STUDY-BACKLOG, IDEAS, algebra-balance study, RECOMMENDATIONS and WAITING-ON-DEVELOPER rows (PR #1358); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; two calls (pre-K Partners to five, a grown-up make 24) wait on the developer.

## 2026-11-07 — Jar Sort deep dive (docs only)

Changed: `docs/deep-dives/jar-sort.md` and its tracker, READY and STUDY-BACKLOG rows (PR #1361); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; no new decisions.

## 2026-11-07 — Jar Sort slice 1: pantry looks, two fruits, more boards

Changed: pantry backdrop in three looks, cherries and lemon, four authored level 1 pairs, 20 boards a level at 2–8 (PR #1365). Ran: `npm run typecheck`; `npx vitest run src/games/jar-sort` (13 tests); `npm test` (322 files, 6028 tests); `BROWSER_SUITE=jarsort` once (level 1 pair, level 3 rain-look portrait screenshot, level 7 upright); `npm run build`. A game-reviewer pass found no blocking defects; two cosmetic fixes after the suite were covered by a typecheck rerun only. Open: `fingerdemo`, offline and other suites not run; the two new fruits' lines use device speech; no iPad check.

## 2026-11-07 — Pile Match deep dive (docs only)

Changed: `docs/deep-dives/pile-match.md` and its tracker, READY and STUDY-BACKLOG rows (PR #1363); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–4 are queued; no new decisions (the toddler entry needs a person watching a child, a device check).

## 2026-11-07 — Domino Run slice 1, puddles, beach moods and more ends (PR #1360)

Changed: `src/games/domino-run` (puddles, three moods, five end looks, three voice ids), four rule tests, the `dominorun` suite. Ran: typecheck; `vitest run src/games/domino-run src/content` (196 tests); filtered `BROWSER_SUITE=dominorun` (levels 1, 8, 5, plus 6 upright in sunset with a drop on a puddle: misses 0, hints 0); `npm run build`; an ad hoc screenshot check of all five end looks and the morning and low-tide moods (no page errors).
Open: `fingerdemo` not run (bot unchanged); no other suites, offline or full `npm test` (CI); whether a puddle reads without speech on an iPad is a [device check](../DEVICE-CHECKS.md).
