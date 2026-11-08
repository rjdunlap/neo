# Codebase structure review (2026-11-07)

A review of how the game code is split up, focused on what makes AI sessions slow or conflict-prone. Each section is one [READY](READY.md#codebase-structure-2026-11-07-review) item. Measured on `origin/main` at `07d7ac06`; the unit suite was not run during the review.

Baseline: about 245K source lines and 74K test lines across 181 game folders. Every game has `logic.ts` and `logic.test.ts`, 174 have an `autotouch()` bot, and the engine is small and tested. The basics are sound; the problems are about scale.

## 1. Co-locate each game's voice lines and how-to card

**Built 2026-11-07** (the developer chose the split over the counterpoint below). All 175 games have `voice.ts` and `howto.ts`; 5,349 of 5,746 lines moved, the 387 left in `src/content/voice-script.ts` (`SHARED`) are used by the shell, journal, couch play, stories or several games. `node scripts/content-barrels.mjs` writes the gathering blocks; `src/content/barrels.test.ts` fails when they are stale, a game lacks either file or a line is defined twice. `SCRIPT` and `HOW_TO` were compared before and after as sorted JSON and are identical. The original analysis follows.

A new game touches about 14 files in 6 places (the Measuring Post commit `1c4b140b`: `registry.ts`, `lands.ts`, `voice-script.ts`, `howto.ts`, `voice-clips.json`, the browser registry and a suite, `land-pages.test.ts`, another game's test). Since 2026-10-01, `voice-script.ts` (435 KB) changed in 588 commits and `howto.ts` (341 KB) in 576. These files cause merge conflicts between parallel worktrees, and agents read sections of half-megabyte files to find one game's lines.

Target:
- `src/games/<id>/voice.ts` exports that game's lines `as const`; `src/games/<id>/howto.ts` exports its `GameHowTo`.
- `src/content/voice-script.ts` becomes a generated barrel that spreads every game's lines plus the shared ones (`game.*` titles, pet, UI), so `LineId = keyof typeof SCRIPT` stays exact and `scripts/voice-clips/render.mjs` keeps importing `SCRIPT`. `HOW_TO` is generated the same way.
- One completeness test: every game folder has each required piece and the barrels are current.

Mechanical, so a script does it. Pilot on 2–3 games, then sweep in one PR while no game work is in flight.

Counterpoint: the [2026-11-06 token review](DEVELOPMENT-WORKFLOW.md#token-review-2026-11-06) left this split undone on purpose, because sessions reach these files by `grep` at about 1.5 KB a call and the move itself conflicts with every open slice. This review weighs the merge conflicts (about 580 commits each since 2026-10-01) more heavily. The session that picks this item should confirm with the developer which view wins before sweeping.

## 2. Discover games instead of listing them

**Built 2026-11-07** (PR #1356). `GAMES` comes from `import.meta.glob('./*/index.ts', { eager: true })`: each folder's one export with an `id` and `create` (it throws on zero or several, or when the id differs from the folder name). Order comes from `LANDS` (land by land, each land's game order; a game in no land goes last by id), not an `order` field; 135 of the 175 positions changed, so the home spot's within-subject order, the grown-ups' table, daily picks and mix pools follow land order. `registry.test.ts` checks one game per folder, named by its id, in island order. Analysis kept below.

`registry.ts` imports all 176 modules by hand, and new games are added at the top. Build `GAMES` with `import.meta.glob('./*/index.ts', { eager: true })`. Order matters: `lands.test.ts`, `arcade.test.ts` and `welcome-ways/logic.test.ts` index into `GAMES`, so either sort explicitly (by id, or an `order` field) or make those tests independent of order. Do this after item 1.

## 3. Generate the game inventory docs

**Built 2026-11-07.** Each game has a page, `docs/games/<id>.md` (175 pages): a generated block (ID, land, ages, challenge, inputs, skills, each band's levels and every level's `describeLevel`), then by hand its **Starts as** and **Grows into** lines (the old README cells) and its design notes (the old GAMES.md entry; a leading bands-only italic was dropped as generated, an inspiration kept). `npm run game-docs` writes those blocks, the README's two inventory tables and counts and the GAMES.md index (by land, keeping each `### <Name>` anchor); `src/content/game-docs.test.ts` fails `npm test`, so CI, when any is stale. A one-off split checked that every old row cell and every old entry paragraph landed in its page. README went from 213 KB to about 141 KB, GAMES.md from 611 KB to about 16 KB; the counts it fixed were stale (131 games play school levels, not 119; 19 play grown-up levels, not 16). The VERIFICATION.md split was left out. The original analysis follows.

The README inventory (213 KB, 672 commits since 2026-10-01) and GAMES.md (609 KB, 641 commits) restate what the registry and how-to cards already hold: name, bands, levels, `describeLevel`, rules. Generate a per-game page and the inventory from the modules, keep only the hand-written design notes by hand, and have CI fail when the generated files are stale. VERIFICATION.md (1,277 commits) would also conflict less as one small file per dated entry.

## 4. Trim AGENTS.md

**Built 2026-11-07:** 32,766 bytes to about 16 KB of rules and pointers. The operational how-to moved word for word, and the decisions and dated specifics moved, to [the session guide](SESSION-GUIDE.md); every linked heading was kept. `scripts/agent-guard.test.mjs` keeps the 32 KiB hard test and adds a 24 KiB budget whose message says to move detail out rather than trim words. The original analysis follows.

It is 32,758 bytes against the 32 KiB test in `scripts/agent-guard.test.mjs`, and every session reads it on every turn. About half is rationale and dated history. Cut it to contracts, commands and pointers, about 10–15 KB, and move the reasons to `DEVELOPMENT-WORKFLOW.md` and DESIGN.md. Items 1–3 shrink the "Adding a minigame" steps further.

## 5. Move level ladders into `logic.ts`

**Built 2026-11-07 ([PR #1379](https://github.com/rjdunlap/neo/pull/1379)).** After the three-game pilot [PR #1377](https://github.com/rjdunlap/neo/pull/1377), all remaining 133 tables and ten inline ladders now live in `logic.ts`; the source scan has no allowlists. Supported-band ranges and order are unchanged; unsupported inline bands use the standard `rangeFor` fallback. [Build note](archive/COMPLETED-2026-10-09.md#level-ladders-into-logicts-codebase-item-5-2026-11-07). The original analysis follows.

AGENTS.md puts ladders in `logic.ts`, but 129 games define `const LEVELS: BandLevels` in `index.ts` and 26 in `logic.ts`. In `index.ts` the ladder can't be tested without loading Pixi, and agents copy the majority pattern. Move `LEVELS` and each `describe…` with a script, then add a source-scan test so it can't drift back.

## 6. Promote shared code out of game folders

**Complete 2026-11-07 ([PR #1383](https://github.com/rjdunlap/neo/pull/1383), after pilot [#1381](https://github.com/rjdunlap/neo/pull/1381)).** Shared tracing and feedback live in `src/learning/tracing/`, sorting predicates/types in `src/learning/sorting/rules.ts`, and name normalization and letter vocabulary in `src/learning/words/`. Letter-picture, sorting-sign and plant art live in `src/art/`. Importers, including the woods browser harness, use the promoted modules; game-specific plans and rules stay local. The nine moved bodies/data are unchanged. [Build note](archive/COMPLETED-2026-10-09.md#shared-tracing-and-sorting-helpers-codebase-item-6-complete-2026-11-07).

**Pilot built 2026-11-07 ([PR #1381](https://github.com/rjdunlap/neo/pull/1381)).** Word Search, Pond Typing and Crossword share `src/learning/words/themes.ts`, `blocked.ts` and the Pixi-free `picture-words.ts`; their picture renderer is `src/art/word-pictures.ts`. Data and behavior are unchanged; the remaining dependencies were promoted in the completion above. [Build note](archive/COMPLETED-2026-10-09.md#shared-word-learning-helpers-pilot-codebase-item-6-2026-11-07).

Files from other games import `letter-trails/` 18 times, `word-search/` 5, `pond-typing/` 4 and `critter-sort/` 4. That code is shared: move it to `src/learning/…` or `src/art/…` and list it in the [reuse map](DESIGN.md#reuse-map), so refactoring one game cannot break others and agents can find the helpers.

## 7. One standard way to clean up after a round

**Follow-up built 2026-11-07 ([PR #1387](https://github.com/rjdunlap/neo/pull/1387)).** All 92 remaining native global-listener registrations in 42 game files use `ctx.listen`; five scene-only liveness flags use `ctx.alive`. Board-generation guards and shorter-lived resources remain local. Rainbow Fingers’ wrong-stroke browser check now waits on its game clock. [Build note](archive/COMPLETED-2026-10-09.md#scene-owned-cleanup-migration-codebase-item-7-follow-up-2026-11-07).

**Built 2026-11-07 ([PR #1385](https://github.com/rjdunlap/neo/pull/1385)).** `GameContext` has `alive`, `own(cleanup)` and `listen(...)`, backed by one `Lifetime` per touch round, couch round or demonstration replay. Pilots are Rainbow Fingers’ global listeners and Puzzle Pals’ drag handles; the global-listener follow-up is recorded above. [Build note](archive/COMPLETED-2026-10-09.md#scene-owned-cleanup-helpers-codebase-item-7-2026-11-07). The original analysis follows.

Games use four idioms for "this round is gone": `gone` (6 files), `epoch` (14), `destroyed` (18) and hand-rolled `releaseDrags` (5); 37 game files call `addEventListener` directly. Add scene-owned helpers to `GameContext` (`ctx.alive` or an `AbortSignal`, `ctx.listen(target, type, fn)`, `ctx.own(disposable)` for drags, textures and timers) that the shell disposes on destroy. `game-reviewer` can then flag raw listeners. Migrate games as they are touched, no sweep needed. Shell tier.

## 8. A shared helper for misses, hints and glows

**Built 2026-11-07.** `src/progress/coach.ts` holds the counts as plain fields on a game's own state (`Tally`: `misses`, `hints`; `RequestTally` adds `roundMisses`, `helped`), so rule tests keep reading them: `missEvery` (a hint due on misses 2, 4, 6…), `missOnRequest` (due once per request at its second miss), `hinted` (one hint, whatever brought it), `nextRequest` and `tally` for `ctx.finish`. A due hint counts only when the game shows it. Piloted with behaviour unchanged on Fill and Dump (all four cadences in `logic.ts`), Sorting Machine's `Tally` and Rainbow Fingers; the rest migrate as touched. The original analysis follows.

Each game writes the "boing, spoken hint, glow after two misses" rule itself: Fill and Dump hints on `misses % 2 === 0`, while Rainbow Fingers counts `wrongs === 2` separately from `misses` and also hints after 12 seconds idle. Both look intentional, but no test checks the shared contract, and miss accounting drives difficulty changes. A small pure `Coach` (counters, hint cadence, the `finish({ misses, hints })` tally) in a testable module would let games keep their own visuals. Migrate as games are touched.

## 9. Split the largest files

Game files of 40–68 KB (Caravan Days, River Tablets, Logic Grid, Keep House, Light Lab and others) often hold several modes as separate classes. Fill and Dump has four game classes in one file, chosen in `create()`. Split by mode (`modes/<mode>.ts`) and art (`art.ts`, as Caravan Days and Measuring Post do). The shell scenes `GameScene.ts` (49 KB) and `CouchScene.ts` (63 KB) are next. Do it when each file next comes up for work, not as a sweep.

## 10. A formatter and a minimal lint

**Built 2026-11-07 ([PR #1405](https://github.com/rjdunlap/neo/pull/1405)).** Prettier formats maintained code/configuration in a separate commit recorded in `.git-blame-ignore-revs`; generated barrels/manifests, npm locks and Markdown keep their own layout. Pull-request CI runs formatting and minimal typed ESLint checks for assertions to `any`, floating promises and direct native game listeners. A per-file/rule baseline records 32 pre-existing floating promises across 11 files; increases fail. Lint uses an isolated supported TypeScript 6 dependency while the app retains TypeScript 7. [Tooling guide](../tooling/lint/README.md). The original analysis follows.

There is no formatter or linter. `howto.ts` is written as `{from:2,to:2,text:…}` while game code uses normal spacing, so AI edits produce noisy diffs. Add Prettier, with one reformat commit listed in `.git-blame-ignore-revs`. Add a minimal ESLint covering `as any` (43 files), floating promises and raw listeners.

## 11. A new-game scaffold

**Built 2026-11-07 ([PR #1399](https://github.com/rjdunlap/neo/pull/1399)).** `npm run new-game -- …` creates the colocated starter, rule-test placeholders, voice/how-to, browser-suite stub, game page and land entry, then refreshes both content barrels. Dry-run and preflight protect existing work; implementation and suite registration remain explicit. [Usage](NEW-GAME.md), [build note](archive/COMPLETED-2026-10-09.md#new-game-scaffold-codebase-item-11-2026-11-07). The original analysis follows.

`.claude/skills/` has only `codex-image`. A scaffold script or skill that creates the item 1 layout (module, logic, tests, voice, how-to, suite stub, land entry) would replace much of the "Adding or extending a minigame" prose with one command. Do it after items 1 and 2.

## 12. Repository weight

The git pack is 177 MB, 151 MB of it `docs/rework/concepts` images, which every fresh worktree and cloud session downloads. **Decided and built 2026-11-07:** the developer chose to have code sessions skip the images rather than use Git LFS or a separate repository. `scripts/concept-art.sh skip` applies a per-worktree sparse checkout; the link checker and the art scripts handle it. How to use it: [concept art out of code checkouts](DEVELOPMENT-WORKFLOW.md#concept-art-out-of-code-checkouts-2026-11-07).

## Done during the review

The `agent-guard` hook blocked any command that only mentioned the browser harness, such as `wc -c` on its script or a heredoc naming it. It now matches only commands that run it (`npm run test:browser`, `node …browser-check.mjs`), with tests for the false positives.
