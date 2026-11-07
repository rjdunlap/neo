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

## 2026-11-07 — Fruit Sums slice 1, looks, the drop and a hint that follows through (PR #1362)

Changed: `src/games/fruit-sums` (three seeded looks, the drop, hopping fruit, `hintWay`/`hintGlow` follow-through, `fsums.hint` line and how-to notes), rule tests, the `fruitsums` suite. Ran: typecheck; `npm test` (322 files, 6026 tests); filtered `BROWSER_SUITE=fruitsums` (level 1: two misses and one hint glowing start fruit, partner, check; level 3 portrait 768×1024 in the cove look, screenshot `test-results/browser/fruitsums/fruit-sums-3-portrait-cove.png`).
Open: build not run (no shared files changed); `fingerdemo` not run (bot path unchanged); the level-3 hint is covered by unit tests, not a browser play; whether the drop and glow read on an iPad is a [device check](../DEVICE-CHECKS.md).

## 2026-11-07 — Lift It deep dive (docs only)

Changed: `docs/deep-dives/lift-it.md` and its tracker, READY, STUDY-BACKLOG and waiting-on-developer rows (PR #1364); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; two decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)); there was no IDEAS ladder-audit row for Lift It to point at.

## 2026-11-07 — Block Garden deep dive (docs only)

Changed: `docs/deep-dives/block-garden.md` and its tracker, READY, STUDY-BACKLOG and waiting-on-developer rows (PR #1366); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; one decision waits on the developer ([list](../WAITING-ON-DEVELOPER.md)); there was no IDEAS ladder-audit row for Block Garden to point at.

## 2026-11-07 — Gem Swap deep dive (docs only)

Changed: `docs/deep-dives/gem-swap.md` and its tracker, READY, STUDY-BACKLOG, ROADMAP and waiting-on-developer rows (PR #1367); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; three decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)); there was no IDEAS ladder-audit row for Gem Swap to point at.

## 2026-11-07 — Log Roll deep dive (docs only)

Changed: `docs/deep-dives/log-roll.md` and its tracker, READY, STUDY-BACKLOG, IDEAS and waiting-on-developer rows (PR #1368); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–5 are queued; three decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)).

## 2026-11-07 — Marble Jump deep dive (docs only)

Changed: `docs/deep-dives/marble-jump.md` and its tracker, READY, STUDY-BACKLOG, IDEAS and waiting-on-developer rows (PR #1369); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–4 are queued; three decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)).

## 2026-11-07 — Number Nook deep dive (docs only)

Changed: `docs/deep-dives/number-nook.md` and its tracker, READY, STUDY-BACKLOG, IDEAS and waiting-on-developer rows (PR #1370); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built or played; slices 1–6 are queued; two decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)).

## 2026-11-07 — Pile Match slice 1: looks, windy drop-in, more shapes, varied level 1

Changed: three seeded looks, the windy drop-in, ten shapes a level, a seeded second kind at level 1 (PR #1371). Ran: `npm run typecheck`; `npx vitest run src/games/pile-match src/games/registry` (51 pass, 16 pile-match rule tests); `BROWSER_SUITE=pilematch` (level 1 one wrong kind, level 8 full tray, put-backs and hint, level 4 portrait screenshot in the autumn look); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pile-match FINGER_LEVELS=1` (9.6 s). Open: build, other suites and offline not run; whether the drop-in makes "underneath" clearer to a three-year-old is a [device check](../DEVICE-CHECKS.md).

## 2026-11-07 — Number Trails slice 1: flying hint, four looks, rising tune (PR #1372)

Changed: the stuck hint flies the next stretch (Letter Trails' `showTheWay`/`hintDue`), four seeded ink looks via `pickLook` drawn last in `roundFor`, and a rising marimba (`tuneStep`) in `src/games/number-trails/`. Ran: `npm run typecheck`; 4 new rule tests; `npm test` (322 files, 6035 tests pass); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-trails FINGER_LEVELS=1,3` pass (5.2 s, 9.2 s). Open: build and a browser play of the hint flight not run; whether the flying hint reads as help on an iPad is a [device check](../DEVICE-CHECKS.md).

## 2026-11-07 — Generated game inventory docs (codebase item 3)

Changed: 175 pages `docs/games/<id>.md` split from README rows and GAMES.md entries (every cell and paragraph checked present); `src/content/game-docs.ts` and its test generate each page's block, the README tables and counts and the GAMES.md index; `npm run game-docs`; workflow pointers in AGENTS.md, SESSION-GUIDE, GAME-BATCHES and both agents. Ran: `npm run typecheck`; `npm test` (323 files, 6,034 tests); the stale check failed on a hand-edited Starts as line and passed once restored; `node scripts/check-links.mjs`; `git diff --check`. Open: no build or browser suite (no app code changed); the VERIFICATION.md split stays undone.

## 2026-11-07 — Puddle Gobble slice 1: more kinds and beach moods (PR #1374)

Changed: four tier 3–4 kinds (sun hat, sand spade, beach umbrella, rolled towel), sea glass and buttons for levels 6–8, and seeded morning/midday/evening moods in `src/games/puddle-gobble/` (art moved to `art.ts`). Ran: `npm run typecheck`; 25 rule tests; `BROWSER_SUITE=puddlegobble` pass (new level-5 step: seeded second launch, evening mood leaves the board unchanged, portrait screenshot, played to its sticker via hints). Open: `fingerdemo` (bot unchanged), build and offline not run; whether the evening look reads on an iPad is unchecked.
