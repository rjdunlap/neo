# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **`bolt-boards` level 9, *Put it back*** (new interaction: typecheck, unit tests, one scripted `boltboards` play of level 9 with one portrait screenshot, `fingerdemo` at 9, build): [definition](definitions/bolt-boards-put-it-back.md).
- **Dive `domino-run`** (Domino Run; toddler to school, 8 levels; docs only; the next unstarted game in the tracker's order, so the rest of waves 5–7 follow after it): [procedure](deep-dives/README.md#one-session-one-game).
- **`number-trails` slice 1, the flying hint, looks and a rising tune** (`letter-trails` helpers reused; preschool and pre-K; typecheck, rule tests, `fingerdemo` at 1 and 3): [build slices](deep-dives/number-trails.md#build-slices-in-order).
- **`puddle-gobble`, slices 1–4 in the dive's order** (`bubble-beach`; toddler to school; slice 1 more kinds and beach moods, slice 2 level 9 *Smallest number first*, slice 3 level 10 *Count the dots* after slice 2, slice 4 level 11 *Too full* after slice 2): [build slices](deep-dives/puddle-gobble.md#build-slices-in-order).
- **`mossy-path` slice 1, more mazes, coverage plans and looks** (toddler to school; typecheck, rule tests, one filtered `mossypath` play at level 6 with one portrait screenshot in the autumn look; no `fingerdemo`): [build slices](deep-dives/mossy-path.md#build-slices-in-order).
- **`fruit-slice` slice 1, more fruit, beach not-fruit and moods** (toddler to school; typecheck, rule tests, one filtered `fruitslice` play at level 3 with one portrait screenshot in the sunset mood, build, no `fingerdemo`): [build slices](deep-dives/fruit-slice.md#build-slices-in-order).
- **`cut-along` slice 1, picture themes and new shapes** (toddler to school; typecheck, rule tests, one filtered `cutalong` play at level 7 with a star or moon and one portrait screenshot in a new theme, build, no `fingerdemo`): [build slices](deep-dives/cut-along.md#build-slices-in-order).

## Queued

- **Phone held upright, after shell slice 1** (chunk 31; slice 1 and batch 1 landed, so all of these are ready now; one session each; after each batch the developer plays the upright six on the phone and the feedback picks the next batch): shell slice 2, the rest of the root upright (shell tier, a layout test and one screenshot per scene); batch 2 (`picture-logic`, `lantern-lights`, `block-garden`, `gem-swap`, `tile-pairs`, `pyramid-solitaire`); batch 3, the lap and toddler six (`bubble-pop`, `sing-along-barn`, `animal-snack`, `size-parade`, `far-lights`, `stamp-studio`); batch 4 (`log-roll`, `marble-jump`, `snowball-merge`, `species-comeback` and two early-school games from feedback). Batch tier: `upright: true`, layout tests at the upright fixture for first and top level, one upright screenshot per game: [definition](definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built).

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:



- **`fruit-slice`, slices 2–4 in the dive's order** (toddler to school; [build slices](deep-dives/fruit-slice.md#build-slices-in-order); slice 1 is in Next ten): slice 2 level 9 *Two lines clear it* (new level on the existing line interaction: typecheck, rule tests, one browser play of 9, `fingerdemo` at 9, build); slice 3 level 10 *Twos and threes* after slice 2 (new interaction, the put-back strip: layout probe, unit tests, one scripted play, one portrait screenshot, `fingerdemo` at 10, build); slice 4 level 11 *Just a few* (new level on the existing interaction: typecheck, rule and registry/how-to tests, one browser play of 11, `fingerdemo` at 11, build). Fractions closure and the journal wait on [decisions](WAITING-ON-DEVELOPER.md).
- **`cut-along`, slices 2–4 in the dive's order** (toddler to school; [build slices](deep-dives/cut-along.md#build-slices-in-order); slice 1 is in Next ten): slice 2 level 9 *Round and round* (new level on the existing cutting interaction: typecheck, rule tests, one browser play of level 9 with one stray, `fingerdemo` at 9, build), slice 3 level 10 *Cut it in two* after slice 2 (typecheck, rule tests, one scripted play with one wrong line and one hint, one portrait screenshot, `fingerdemo` at 10, build), slice 4 level 11 *My own picture* after slice 3 (new interaction: typecheck, unit tests, one scripted play with an off-picture drop, one portrait screenshot, `fingerdemo` at 11, build).
- **`mossy-path`, slices 2–5 in the dive's order** (toddler to school; [build slices](deep-dives/mossy-path.md#build-slices-in-order); slice 1 is in Next ten): slice 2 level 8 *A little patch* (new level on the existing tap interaction: typecheck, rule tests, one browser play of 8, `fingerdemo` at 8, build); slice 3 level 9 *Two snacks* after slice 1 (typecheck, rule tests, one browser play of 9, `fingerdemo` at 9, build); slice 4 level 10 *Plan, then go* after slice 3 (new interaction: unit tests, one scripted play, one portrait screenshot, `fingerdemo` at 10, build); slice 5 level 11 *Thick moss* (solver rewrite: rule tests including levels 1–3 and 8 unchanged, one browser play of 11, `fingerdemo` at 11, build).
- **`number-trails`, slices 1–6 in the dive's order** (`letter-trails` helpers; preschool and pre-K; [build slices](deep-dives/number-trails.md#build-slices-in-order)): slice 1 the flying hint, looks and a rising tune (typecheck, rule tests, `fingerdemo` at 1 and 3); slice 2 more things and arrangements (rule tests, one portrait screenshot); slice 3 check the digits against the HWT chart (`digits.test.ts`, `fingerdemo` at 2; once the chart is open); slice 4 level 4 *First numbers* (rule tests, browser play of 4, `fingerdemo` at 4); slice 5 level 5 *Write how many* (new interaction: unit tests, one scripted play, one portrait screenshot); slice 6 level 6 *Less help each time* (rule tests, one play, `fingerdemo` at 6, one screenshot; coordinate with Letter Trails level 9 if in flight). Level 7 and the journal wait on [decisions](WAITING-ON-DEVELOPER.md).
- **`bolt-boards`, remaining slices in the dive's order** (`tinker-lab`; toddler to school; [build slices](deep-dives/bolt-boards.md#build-slices-in-order)):

### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (1, 2, 5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Discover games with `import.meta.glob`** (item 1 is built; explicit order for the order-dependent tests; shell tier plus `world`): [item 2](CODEBASE-REVIEW-2026-11-07.md#2-discover-games-instead-of-listing-them).
- **Generate the README inventory and per-game GAMES.md pages** (after item 2; stale-check in CI; docs plus a script test): [item 3](CODEBASE-REVIEW-2026-11-07.md#3-generate-the-game-inventory-docs).
- **Trim AGENTS.md to contracts and pointers** (docs only; can go first, independent of the rest): [item 4](CODEBASE-REVIEW-2026-11-07.md#4-trim-agentsmd).
- **Move level ladders into `logic.ts`** (scripted sweep; typecheck, unit tests, a source-scan test): [item 5](CODEBASE-REVIEW-2026-11-07.md#5-move-level-ladders-into-logicts).
- **Promote shared code out of `letter-trails`, `word-search`, `pond-typing` and `critter-sort`** (typecheck, unit tests, build, `fingerdemo` filtered to two importing games): [item 6](CODEBASE-REVIEW-2026-11-07.md#6-promote-shared-code-out-of-game-folders).
- **Scene-owned cleanup helpers on `GameContext`** (shell tier; migrate 2–3 games, the rest as touched): [item 7](CODEBASE-REVIEW-2026-11-07.md#7-one-standard-way-to-clean-up-after-a-round).
- **A shared misses/hints coach** (pure module with tests; migrate 2–3 games, the rest as touched): [item 8](CODEBASE-REVIEW-2026-11-07.md#8-a-shared-helper-for-misses-hints-and-glows).
- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).
- **Prettier and a minimal ESLint** (one reformat commit in `.git-blame-ignore-revs`; typecheck, unit tests, build): [item 10](CODEBASE-REVIEW-2026-11-07.md#10-a-formatter-and-a-minimal-lint).
- **A new-game scaffold script or skill** (after items 1 and 2): [item 11](CODEBASE-REVIEW-2026-11-07.md#11-a-new-game-scaffold).

### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say they have played slices 1–2 on the iPad ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
