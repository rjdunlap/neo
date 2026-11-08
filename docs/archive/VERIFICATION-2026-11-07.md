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

## 2026-11-07 — Puddle Gobble slice 2: level 9 Smallest number first (PR #1378)

Changed: level 9 (school 5–9; numerals soaked smallest first into a puddle that stays 20), `gobble.smaller-first-number` and `gobble.instruct-order-number`; `order` mode soaks re-arm every thing; the ghost finger taps the goal when no detour is clear. Ran: `npm run typecheck`; `npm test` (325 files, 6061 passed, 1 skipped); `BROWSER_SUITE=puddlegobble` pass (levels 1, 8, 9 with one aimed bigger-number miss then its sticker, 4 upright, 5 evening upright); `fingerdemo` `FINGER_ONLY=puddle-gobble` at 4, 5, 8, 9 clean (9 in 14.0 s); `npm run build`. Open: offline, `world` and any iPad check not run; no screenshot.

## 2026-11-07 — Puddle Gobble slices 3–4: levels 10 Count the dots and 11 Too full (PR #1384)

Changed: level 10 (dot cards, `dotSpots`; pre-K 3–10, school 5–11 with `order`), level 11 (`pail` mode with `Board.held`, `gobble.under-pail`, `gobble.instruct-too-full`; a let-go that hits the pail finishes the round), strip geometry in logic. Ran: `npx tsc --noEmit`; `npm test` (325 files, 6081 passed, 1 skipped; 41 rule tests); `BROWSER_SUITE=puddlegobble` pass (10: too-big touch no miss, played clean, 5→10→6 step; 11: let-go under the pail, requested hint counts one, finish at 14; landscape screenshots reviewed); `fingerdemo FINGER_ONLY=puddle-gobble FINGER_LEVELS=10,11` pass (19.0 s, 5.4 s); `npm run build`. Open: offline, `world` and any iPad check not run; no portrait screenshot of 10 or 11.

## 2026-11-07 — Shared misses/hints coach (codebase item 8)

Changed: `src/progress/coach.ts` and its test (8 tests: threshold two, every-second and once-per-request cadences, request reset keeps totals, Help/idle hints alone, `ctx.finish` shape); Fill and Dump's four cadences, Sorting Machine's `Tally` and Rainbow Fingers' counting moved onto it with behaviour unchanged. Ran: `npm run typecheck`; the pilots' rule tests unedited (88 with the coach's); `npm test` (324 files, 6,046 tests); `npm run build`; `BROWSER_SUITE=early EARLY_ONLY=paint FROM_LEVEL=3 TO_LEVEL=7` on port 5191 (2 misses/1 hint saved on each coloring level). Open: no browser play of Fill and Dump or Sorting Machine (their rule tests read the same fields); other games migrate as touched.

## 2026-11-07 — Level ladders into `logic.ts`, pilot (codebase item 5)

Changed: `scripts/ladders-into-logic.mjs` (moves a game's `LEVELS` table into `logic.ts`); Animal Snack, Frog Hop and Pond Typing moved with values unchanged; `src/games/ladders.test.ts` (2 tests: no table or inline ladder in an `index.ts` outside its lists, and the lists only shrink). Ran: `npm run typecheck`; `npm test` (325 files, 6,053 tests; the game-docs staleness check passed, so the pilots' level ranges are unchanged); a dry run of the codemod on all 133 remaining tables (132 move, `playdate-workshop` skipped). Not run: build (no shared runtime file changed) and browser play (no behaviour changed). Open: the sweep, `playdate-workshop` and the ten inline ladders.

## 2026-11-07 — Mossy Path slice 1: more mazes, coverage plans and looks

Changed: six mazes per level at 4–7; three coverage plans per level at 1–3 (open 3 × 3 instead of the dive's 2 × 5); seeded season and berry looks in `src/games/mossy-path/`; `MOSSY_ONLY=look` mode in the `mossypath` suite. Ran: `npm run typecheck`; `npx vitest run src/games/mossy-path src/games/registry.test.ts` 55 passed; `BROWSER_SUITE=mossypath MOSSY_ONLY=look` pass (level 6 forced autumn, one wrong branch, one hint, portrait 768×1024 with cells ≥ 100, one sticker; level-7 snow and strawberry screenshot). Open: `fingerdemo` (bot unchanged), build, offline and the full `mossypath` suite (levels 1, 3, 4, 7) not run; how the looks read on an iPad is unchecked.

## 2026-11-07 — Level ladders into `logic.ts`, complete (codebase item 5, PR #1379)

Changed: 133 remaining tables and ten inline ladders moved to `logic.ts`; Playdate Workshop's internal plans renamed `PLANS`; source-scan allowlists removed; codemod handles tightly spaced imports.
Tested: base `566ad6be` plus working diff. Ran: `npm run typecheck`; `npm test` (325 files, 6,057 passed, 5 skipped; 6,062 total), including both source guards and game-docs staleness.
Direct probes (`test-results/check-ladders.mjs` and `test-results/check-inline-ladders.mjs`, ignored and retained in the worktree): all 133 table initializers byte-identical; all ten inline tables match original supported-band ranges and order. Unsupported inline bands now use the standard `rangeFor` fallback. Fresh-context reviewer found no issues.
Not run: browser play, build or offline (no shared runtime change). No new device check.

## 2026-11-07 — Cut Along slice 1: picture themes and new shapes (PR #1380)

Changed: seeded picture themes at levels 1–5 and 7, level 6 as three of four shapes (door, kite; flag retired), level 7 as three of seven (star, moon), `cut.piece.<theme>.<piece>` lines; slots, colours and themes moved into `logic.ts`; the `cutalong` suite's level-6 portrait shot became a level-7 garland play. Ran: typecheck; `npm test` (325 files, 6,067 passed, 1 skipped; new theme, slot, line, colour and cuttability tests); `npm run build`; `BROWSER_SUITE=cutalong` (pass); a probe screenshot of each new theme. Not run: `fingerdemo` (bot unchanged), world, offline, any device. Open: level 8 themes; iPad checks.

## 2026-11-07 — Shared word-learning helpers pilot (codebase item 6, PR #1381)

Changed: shared themes, blocked-word list and picture vocabulary in `src/learning/words/`; picture-clue renderer in `src/art/word-pictures.ts`; Word Search, Pond Typing and Crossword callers updated with data and behavior unchanged. Tested base `42de1cb3` plus working diff.
Ran: `npm run typecheck`; `npm test` (6,056 passed, 5 skipped; one unchanged Secret Code timing assertion failed at 277 ms against 250 ms during concurrent browser checking); that unchanged file passed alone (24 tests, 17.19 s); `npm run build`; source review clean.
Browser: `GAME_URL=http://localhost:5196 BROWSER_SUITE=fingerdemo FINGER_ONLY=word-search,crossword FINGER_LEVELS=1` passed (Crossword pre-K 12.5 s; Word Search grown-up 11.3 s). Server stopped.
Open: Letter Trails/tracing and Critter Sort remain queued. Offline, `world`, device and child play not run; no assets, persistence or navigation changed.

## 2026-11-07 — Fruit Slice slice 1: more fruit, beach not-fruit and moods (PR #1382)

Changed: strawberry, banana and plum (drawn by `smallFruit()` in `src/art/props.ts`, moved from Bolt Boards), beach ball and shell as not-fruit, a seeded morning, picnic or sunset look, six voice lines. Ran: typecheck; vitest for fruit-slice, bolt-boards and art (350 passed); `BROWSER_SUITE=fruitslice` (levels 1, 3 with misses and glow, 7 upright, new 3 upright at sunset with a banana, 8); `BROWSER_SUITE=boltboards` (regression, its fruit drawing moved); `npm run build`; a one-off picnic level 4 screenshot. Not run: `fingerdemo` (bot unchanged), full `npm test` (CI), offline, any device. Open: iPad checks.

## 2026-11-07 — Shared tracing and sorting helpers (codebase item 6 complete, PR #1383)

Changed: shared tracing/feedback, sorting predicates/types, name normalization and letter vocabulary in `src/learning/`; letter-picture, sorting-sign and plant art in `src/art/`; game/journal callers and woods harness imports updated. The nine moved bodies/data match exactly; game-specific rules remain local. Tested base `dcc001e4` plus working diff.
Ran: `npm run typecheck`; `npm test` (325 files, 6,068 passed, 5 skipped, 67.51 s); `npm run build`; source review (caught and fixed the woods level-9 dynamic predicate import).
Browser: `GAME_URL=http://localhost:5196 BROWSER_SUITE=fingerdemo FINGER_ONLY=number-trails,critter-crossing FINGER_LEVELS=1` passed (Number Trails preschool 5.0 s; Critter Crossing pre-K 7.1 s). Same URL: `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=9 TO_LEVEL=9` passed (both/neither predicates, free bare grass, misses/glow, saved score and sticker). Server stopped.
Not run: offline, `world`, device and child play; no behavior, assets, persistence or navigation changed.

## 2026-11-07 — Scene-owned cleanup helpers (codebase item 7, PR #1385)

Changed: `Lifetime` and `GameContext.alive`/`own`/`listen`, owned by touch/couch rounds and each demo replay; Rainbow Fingers listeners and Puzzle Pals drag handles migrated without gameplay changes. Fresh-context review found no defects.
Tested: `a08d04de` plus working diff, full `npm test` (326 files, 6,074 passed, 5 skipped); seven helper/demo tests passed after adding replay integration coverage. After integrating `a800c6ee` as `230d6975`, typecheck, seven targeted files (81 passed, 1 skipped) and production build passed.
Browser at `http://localhost:5187`: `BROWSER_SUITE=fourth FOURTH_ONLY=puzzle PUZZLE_LEVELS=4` passed exploration, two misses, hint, completion and sticker. `early EARLY_ONLY=paint FROM_LEVEL=3 TO_LEVEL=3` initially missed its second wrong stroke (1/0); original game baseline passed. The logging probe paced the four-second hint cooldown by game clock instead of a 4,200 ms wall wait and passed two misses, hint, all pictures and sticker.
The same ignored `test-results/cleanup-probe.mjs` verified `alive`/owned cleanup/listener release on leaving a round and real paint demo listeners across replay/destruction (2→0→2→0); no page errors. Server stopped.
Not run: `world`, offline, device or child play (no navigation, persistence or assets changed); bot gestures unchanged. The wall-time paint harness remains timing-sensitive.

## 2026-11-07 — Domino Run slice 2: level 9 Where will it stop? (PR #1386)

Changed: school range now 4–9; predict-then-fix level (guess flag, ring on the real stop, one-piece fix), `stopsAt`/`standing`, three voice ids, how-to step, four rule tests.
Ran: `npm run typecheck`; `npm test` (325 files, 6,085 passed); `npm run build`; `BROWSER_SUITE=dominorun` passed (also level 9 upright: wrong guess, waiting hint, 0 misses, 1 hint, sticker; portrait screenshot kept); `FINGER_ONLY=domino-run FINGER_LEVELS=9` `fingerdemo` passed (11.5 s).
Not run: iPad reading of the flag and ring (open in DEVICE-CHECKS), other suites, offline, `world`.

## 2026-11-07 — Scene-owned cleanup migration (codebase item 7 follow-up, PR #1387)

Changed: 92 native global-listener registrations in 42 game files now use `ctx.listen` with identical target/callback/options tuples; five scene-only guards use `ctx.alive`, two test fixtures use real lifetimes, and the paint harness waits for its game-clock cooldown. Branches, board-generation guards, short-lived cleanup and bot actions are unchanged. Fresh-context review found no concrete issues.
Tested: base `88da9a39` plus diff, full `npm test` (327 files, 6,084 passed, 5 skipped); after integrating `5b3d39b2` as `0feda6bf`, typecheck, six targeted files (61 passed, 1 skipped) and production build passed.
Browser at `http://localhost:5188`: `BROWSER_SUITE=early EARLY_ONLY=paint FROM_LEVEL=3 TO_LEVEL=3` passed two misses, hint, all pictures and sticker; `BROWSER_SUITE=blocktopple TOPPLE_LEVELS=3` passed portrait wrong/hill shots, two misses, hint, three tips and saved 2/1.
The retained ignored `test-results/cleanup-sweep.mjs`, its results JSON and `migrated-listener-files.txt` record 296 level/mode demo restart/destruction checks across 46 games, with no retained native listeners or page errors in those checks. Draw the Pattern level 5 separately fails in its demo constructor reading an undefined piece; unchanged HEAD’s game module reproduces it (baseline script retained), so it remains a pre-existing gap outside this migration.
Not run: `world`, offline, device or child play; no navigation, persistence or assets changed. Server stopped. No new gameplay or bot actions.

## 2026-11-07 — Fruit Slice slice 2: level 9 Two lines clear it (PR #1388)

Changed: level 9 (two straight lines cover every fruit of a still board; `coverLines`, `coverHint` and friends in `logic.ts`), five voice lines, a how-to step, a level 9 segment in `fruitslice`. Ran: typecheck; 45 fruit-slice rule tests (six new); `npm test` (327 files, 6,098 passed); `BROWSER_SUITE=fruitslice` (level 9 upright: one stranding first line = 1 miss, one requested hint, portrait screenshot, four boards, sticker); `fingerdemo` `FINGER_ONLY=fruit-slice FINGER_LEVELS=9` (5.3 s); build.
Late follow-up (0.8 s wait before the next level 9 board): only typecheck and the rule tests were rerun. Not run: offline, `world`, couch, device; a six-year-old drawing two lines is open.

## 2026-11-07 — Lift It slice 1: looks, parcels, three more friends, varied lines at 1–3

Changed: four seeded looks, six parcels by weight, cat/dog/pig friends, widened lines at levels 1–3, `pawSpots` for paw prints, two level-2 voice lines. Ran: typecheck; 21 lift-it rule tests (authored lines unchanged, parcel group matches stones, all values appear over 500 seeds, paw prints clear at four views); `BROWSER_SUITE=liftit` (level 1 by strokes, level 6 wrong rig + hint, level 3 portrait screenshot in the autumn look with two wheels). Not run: `fingerdemo` (bot unchanged), build, offline, `world`, device; whether the parcels read as apples and pumpkins to a child is open.

## 2026-11-07 — Block Garden slice 1: looks, flower kinds, 24 gardens, three-garden pre-K rounds (PR #1390)

Changed: four seeded looks, four flower kinds with flowers kept in the basket, frozen gardens at 5–8 raised from 14 to 24 each, levels 1–2 rounds of three gardens. Ran: typecheck; 36 block-garden rule tests (minimum now 24); `npm test` (327 files, 6104 tests); `npm run game-docs` (no changes); `BROWSER_SUITE=blockgarden` (levels 1, 3, 6 upright, 5 upright in autumn, 8) with a visual check of rain and evening at level 5 and evening stripes at level 2. Not run: build (no shared files or assets changed), `fingerdemo` (bot unchanged), offline, `world`, iPad; whether the looks read well to a child is open.

## 2026-11-07 — Block Garden slice 2: level 9 Corner with stripes

Changed: level 9 is level 3's corner gardens (`like: 3`, `kindOf`) with stripes on and refused drops free; pre-K order [1, 2, 9, 3], school [2, 9, 3, 4, 5, 6], `entryLevels: [9]`; how-to lines; a level-9 section in the `blockgarden` suite. Ran: `npm run typecheck`; `npm test` (327 files, 6175 tests); `BROWSER_SUITE=blockgarden` (a free refused drop, planted by drags, no misses, one sticker; the first attempt hit a TimeoutError right after Vite started, the immediate rerun passed, recorded as a cold-start flake); `fingerdemo` with `FINGER_ONLY=block-garden FINGER_LEVELS=9 FINGER_BAND=prek` (10.0 s); landscape screenshot of the striped 6×6 corner garden reviewed; `npm run game-docs`. Not run: build (no shared files or assets changed), iPad or child check.

## 2026-11-07 — Cut Along slice 2: level 9 Round and round (PR #1391)

Changed: school's range is now 6–9; level 9 is a spiral cut (snail shell, snake, then a cat's tail or a mirrored snake) with a lead-in from the bottom edge and a `garden` picture; `cut.instruct.round` and `cut.piece.*` lines, how-to step, `CUT_LEVELS` filter and level-9 block in the `cutalong` suite. Ran: typecheck; `npm test` (327 files, 6,110 passed; rule tests for ring spacing, a swipe never over 135° of a turn, fit, completion by hand and bot, mirrored turning, corridor ≥ 30 units); `npm run build`; `BROWSER_SUITE=cutalong CUT_LEVELS=9` at 768×1024 (one stray = one miss, progress kept, 1 miss 0 hints, portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=cut-along FINGER_LEVELS=9` (17.4 s). `game-reviewer`: no blocking findings. Not run: the full `cutalong` suite at levels 1–8 (unchanged), offline, world, any device. Open: iPad check that a toddler-to-school finger follows the inner curl.

## 2026-11-07 — Domino Run slice 3: level 10 Over the puddle (PR #1392)

Changed: school range now 4–10; puddle-first level (a two-wide puddle only a giant reaches over), `puddleGiantSlot`, `lane()` reads `~`, one voice id, how-to step, six rule tests (27); `dominorun` gained a `DOMINO_LEVELS` filter.
Ran: `npm run typecheck`; domino-run rule tests 27/27; `npm test` (327 files, 6,116 passed, 1 skipped); `npm run build`; `BROWSER_SUITE=dominorun DOMINO_LEVELS=10` passed (level 10 upright: stall not a miss, hint, fix, 0 misses, 1 hint, sticker; portrait screenshot); `FINGER_ONLY=domino-run FINGER_LEVELS=10` `fingerdemo` passed (10.0 s).
Not run: levels 1, 5, 6, 8, 9 of `dominorun` (unchanged), offline, `world`, other suites; no iPad or child check.

## 2026-11-07 — Fruit Slice slice 3: level 10 Twos and threes (PR #1393)

Changed: level 10 (apples 2 pieces, oranges 3; put-back strip of fruit tokens; `piecesFor`, `stuck`, `putBack`, `mixedHint`, `tokenAt` and friends in `logic.ts`), four voice lines, how-to steps, a level 10 segment and `FRUIT_LEVELS` filter in `fruitslice`. Ran: typecheck; 55 fruit-slice rule tests (ten new); `npm test` (6,126 passed); `BROWSER_SUITE=fruitslice` at level 10 (stuck total, bowl tap, requested hint on a token, put-back, overshoot miss, finish, portrait screenshot); `fingerdemo` at 10 (11.2 s); build. game-reviewer findings applied (double-tap lock, slot order, strip cleared on send).
Not run: offline, `world`, couch, device; whether a seven-year-old finds the put-back unaided is open.

## 2026-11-07 — Fruit Slice slice 4: level 11 Just a few (PR #1396)

Changed: level 11 (plan on level 5's path: two aloft, signs 2, 3, 3; `FEW`), preschool 2–11 and pre-K 3–11 with new `order`s, `entryLevels: [11]`, how-to steps, five rule tests, a level 11 segment in `fruitslice`. Ran: typecheck; vitest fruit-slice (60), registry, content, progress; `BROWSER_SUITE=fruitslice FRUIT_LEVELS=11` (two aloft, sign 2, free early bowl tap, overshoot miss, signs 3 and 3, portrait screenshot); `fingerdemo` at 11 in preschool (11.1 s); build. game-reviewer: no blocking issues.
Not run: full `npm test` locally (CI runs it), offline, `world`, device; whether a preschooler stops at 2 unprompted is open.

## 2026-11-07 — Cut Along slice 3: level 10 Cut it in two (PR #1394)

Changed: school's range is now 6–10; level 10 (mode `two`) is choose-then-cut on a sheet with crossing lines, a ring at both ends of each, a wrong pair costing one miss per line, a `twos` picture, `cut.instruct.two.*`, `cut.makes.*` and `cut.piece.twos.*` lines, how-to step, level-10 block in `cutalong`. Ran: typecheck; `npm test` (327 files, 6,138 passed, 1 skipped; rule tests for piece kinds, one working line, rings apart, one track per drag, 20 % rule, orders); `npm run build`; `BROWSER_SUITE=cutalong CUT_LEVELS=10` at 768×1024 (one wrong line = one miss, both ends closed, hint glows the working line, 1 miss 1 hint, portrait screenshot); `fingerdemo` `FINGER_ONLY=cut-along FINGER_LEVELS=10` (6.5 s). `game-reviewer`: no findings. Not run: `cutalong` at levels 1–9, offline, world, any device. Open: iPad check that crossing lines and two rings per line read clearly to a finger.

## 2026-11-07 — Domino Run slice 4: level 11 Under the pier (PR #1395)

Changed: school range now 4–11; low pier sockets (`Lane.low`, `fits`, `P` in pictures) that only a small fits, pier-first generator, `passes` case 11, drop handler that knocks and springs back a tall or giant (never a miss), pier art, voice ids `domino-run.pier` and `too-tall`, how-to steps, eight rule tests (35).
Ran: `npm run typecheck`; `npm test` (327 files, 6,146 passed, 1 skipped); `npm run build`; `BROWSER_SUITE=dominorun DOMINO_LEVELS=11` passed (tall under the pier springs back, 0 misses, 0 hints, 0 stalls; hint to the gong; sticker; portrait screenshot); `FINGER_ONLY=domino-run FINGER_LEVELS=11` `fingerdemo` passed (12.5 s).
Not run: other `dominorun` levels (unchanged), offline, `world`; no iPad check (the pier reading as "too low" is open in DEVICE-CHECKS).

## 2026-11-07 — Cut Along slice 4: level 11 My own picture (PR #1397)

Changed: pre-K gains level 11 after 7 (`order` 4, 5, 6, 7, 11) and school's range is 6–11; mode `own` chooses one of three small tiles, cuts that shape at level 7's size, then she carries the piece anywhere into an empty picture (`placeIn`, off-picture drop floats to the middle); `cut.instruct.own`, `cut.place`, how-to step, bot drag, level-11 block in `cutalong`. The routes bundle passed 6 MiB, so the precache bound in `vite.config.ts` is now 8 MiB. Ran: typecheck; `npm test` (327 files, 6,169 passed, 1 skipped); `npm run build` (precache 435 entries, 17,660.77 KiB); `BROWSER_SUITE=cutalong CUT_LEVELS=11` at 768×1024 (tap between tiles chooses nothing, one stray = 1 miss, hint = 1 hint, off-picture drop lands at the middle, two drops kept within 0.06, finish 1 miss 1 hint, screenshot); `fingerdemo` `FINGER_ONLY=cut-along FINGER_LEVELS=11` (16.7 s); `npm run test:offline` pass. `game-reviewer`: no blocking findings. Not run: `cutalong` at levels 1–10, world, couch, any device. Open: iPad check that a pre-K child can carry the piece and that the 280 picture reads as hers to fill.

## 2026-11-07 — Gem Swap slice 1: 20 trays a level, three looks, a visible fall (PR #1398)

Changed: `scripts/gem-swap-trays.mjs` writes `boards.ts` (20 exact-par trays a level at 1–4; generated ones are distinct, settled, match-free and, above level 1, have a dead-end first swap and a falling line on a shortest route); three seeded looks; `drops()` and the fall tween with landing squash; cascade pops on rising steps. Ran: `npm run typecheck`; `npx vitest run src/games/gem-swap` (8/8); `BROWSER_SUITE=gemswap` filtered (levels 1 and 4, rejected swaps, hint, undo/restart, portrait 768×1024 screenshot at level 4 in first snow); `game-reviewer` (autumn cell tint changed to yellow.light afterwards).
Not run: `fingerdemo` (bot actions unchanged), build (no shared files), full `npm test` (CI). Open: whether the fall reads at a glance and the looks stay legible ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-07 — Gem Swap slice 2: level 5 Six by six (PR #1401)

Changed: level 5 (`PLANS` 6×6, 24 gems, par 5; grown-up 1–5) with 20 generated 6×6 trays from `scripts/gem-swap-trays.mjs` (levels 1–4 unchanged byte for byte; each level-5 tray has a dead-end first swap, a falling line on a shortest route and a gem in all six columns); `solve` counts visited trays and a test holds the hint search under 2000 nodes from every state on the stored route (worst 251, about 3 ms). Layout unchanged (cells about 80 at 1024×768, about 98 portrait).
Ran: `npm run typecheck`; `npm test` (328 files, 6,196 passed, 1 skipped); `BROWSER_SUITE=gemswap` (levels 1 and 5, two rejected swaps, hint once, Undo/Restart accounting, portrait targets at least 64, sticker, leave mid-clear; screenshot `gem-swap-5-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=gem-swap FINGER_LEVELS=5` (13.9 s).
Not run: build (no shared files or assets), offline, other suites. Open: no device or person check; whether the six-by-six tray reads comfortably on an iPad ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-07 — New-game scaffold (codebase item 11, PR #1399)

Changed: `npm run new-game` and templates create colocated starters, a browser stub/page and land entry; content barrels accept an optional repository root for isolated generation. No production game added.
Ran on `13b4871d` plus the feature diff: 20 focused generator safety/CLI/formatting tests; temporary `scaffold-check` typecheck, `npm run game-docs`, six content barrel/docs checks; temporary game and its generated inventory changes removed afterwards.
Full `npm test`: 328 files, 6,187 passed / 5 skipped (before the final two generator tests); `npm run build` passed. Final focused generator checks cover the last CLI/formatting/rollback edits. Links and diff whitespace checked at closeout.
Not run: browser, ghost finger, offline or device checks; this changes developer tooling only. Generated starters remain unfinished until their game-specific implementation and checks are done.

## 2026-11-07 — Log Roll slice 1: four floors a level, three looks, a visible tip (PR #1402)

Changed: `scripts/log-roll-floors.mjs` writes `floors.ts` (four frozen floors a level with `G` hollows, at least two exact-depth upright starts each; level 3 went from 2 starts to 15) with a seeded mirror; layout from floor size; three seeded looks; 0.22 s tip with one queued tap, refusal lean, finish ripples and a par line; a glowing hint counts once (`countsAsHint`); the bot waits for the tip. Levels and range unchanged.
Ran: `npm run typecheck`; `npm test` (328 files); `BROWSER_SUITE=logroll` (levels 1 and 3, refused roll, double hint counted once, undo, restart, one sticker each, portrait screenshot at level 3 on a mirrored floor, landscape screenshot); `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=3` (17.2 s); game-reviewer found no defects.
Not run: build (no shared files or assets), offline, other suites. Open: no device or person check; whether the tip makes the rule obvious ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-07 — Marble Jump slice 1: board pool, colours that follow marbles, a visible jump, looks (PR #1403)

Changed: `makeBoard` draws from every clearable reachable board (level 1 72 boards, levels 2–5 trap-first pools 378/933/723/177, level 6 the 15 starts); per-marble colours; 0.3 s arcing jump into a pocket groove with one queued tap, refusal tilt, rising jump notes, three seeded looks, repeated hint line counted once; layout from the row count. Levels and range unchanged.
Ran: `npm run typecheck`; `npm test` (328 files, 6201 passed, 1 skipped); `BROWSER_SUITE=marblejump` (levels 1, 2 and 6, colour carry, pocket, portrait screenshot at level 2 in slate); `fingerdemo` with `FINGER_ONLY=marble-jump FINGER_LEVELS=1` (4.3 s). After the game-reviewer pass, one fix (tilt survives the miss that brings the hint) was rechecked with typecheck and the rule and registry tests only.
Not run: build (no shared files or assets), offline. Open: interrupting a jump with Undo, Hint or Start over skips the landing sparkle; no device or person check ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).
