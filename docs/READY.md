# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **`lift-it`, slices 4–5 in the dive's order** (preschool to school; [build slices](deep-dives/lift-it.md#build-slices-in-order); slices 1–3 are built, slice 4 next): slice 4 level 7 *Three ropes* (new interaction, the movable knot: layout probe at 768×1024 first, unit tests, one scripted play with one wrong rig and one hint, one portrait screenshot, `fingerdemo` at 7, build); slice 5 level 8 *Three ropes by the numbers* after slice 4 (typecheck, rule tests, one browser play of 8, `fingerdemo` at 8). Level 10 *One big pull* (toddler) waits on a [decision](WAITING-ON-DEVELOPER.md).

- **Phone held upright, shell slice 2: the rest of the root** (ready; shell tier): upright layout tests and one screenshot per root scene; `classic/` stays sideways-only. [Definition](definitions/phone-portrait.md#shell-slice-2-the-rest-of-the-root-ready).
- **`pile-match`, slices 2–4 in the dive's order** (preschool to school; [build slices](deep-dives/pile-match.md#build-slices-in-order); slice 1 is built).

- **`block-garden` slice 5, level 12 *Mind the snails*** (pre-K to grown-up; [build slices](deep-dives/block-garden.md#build-slices-in-order); slices 1–4 are built, so it is ready; typecheck, rule tests, one browser play of 12, `fingerdemo` at 12). Level 14 *One little gap* (preschool) waits on a [decision](WAITING-ON-DEVELOPER.md); box clears stay a proposal.

- **Study `fractions`: define Fraction Landings within Frog Hop (R3)** (docs only): define the first bounded fractional-number-line packet, using intervals and equivalent landing positions. [Source](deep-dives/subjects/fractions.md#build-slices-in-order).
- **Study `nature-sustainability`: define Picnic Loop 7–8 (N4)** (docs only): specify the cup schedule, wash-tub capacity and accepted plans for Second Chance Shed. [Source](deep-dives/subjects/nature-sustainability.md#build-slices-in-order).
- **Study `earth-materials`: define Sand Table sediment evidence (E3)** (docs only): source-check one breeze transport table and define the before-and-after trace and observation answers for rung 4. [Source](deep-dives/subjects/earth-materials.md#build-slices-in-order).
- **Research game `snowball-merge`** (docs only): review the current game and couch scope, plan its touch ladder and queue its first eligible build slice. [Procedure](deep-dives/README.md#one-session-one-game).

## Queued

- **Phone held upright: grown-up batches and the early-school sweep** (chunk 31; all ready now, one session each, in this order; the two players' playtest notes pick what follows): batch 2 (`hat-band`, `crossword`, `picture-logic`, `tile-pairs`, `gem-swap`, `lantern-lights`); batch 3 (`block-garden`, `logic-grid`, `species-comeback`, `pyramid-solitaire`); the upright sweep of the early-school games (a development-only switch and a contact sheet at 390 × 844); batch 4 (`log-roll`, `marble-jump`, `snowball-merge`); batch 5, the lap and toddler six (`bubble-pop`, `sing-along-barn`, `animal-snack`, `size-parade`, `far-lights`, `stamp-studio`). Batch tier: `upright: true`, layout tests at the upright fixture for first and top level with the smallest target recorded in pixels, one upright screenshot per game: [recommendations](ROADMAP.md#upright-games-for-grown-ups-recommendations-2026-11-09), [definition](definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built).

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:



- **`fruit-sums`, slice 5 in the dive's order** (school; [build slices](deep-dives/fruit-sums.md#build-slices-in-order); slices 1–4 are built, so it is ready): level 7 *A times leaf*, only if the leaves row needs layout work (typecheck, rule tests, one browser play of 7, `fingerdemo` at 7).
- **`mossy-path`, slices 2–5 in the dive's order** (toddler to school; [build slices](deep-dives/mossy-path.md#build-slices-in-order); slice 1 is in Next ten): slice 2 level 8 *A little patch* (new level on the existing tap interaction: typecheck, rule tests, one browser play of 8, `fingerdemo` at 8, build); slice 3 level 9 *Two snacks* (typecheck, rule tests, one browser play of 9, `fingerdemo` at 9, build); slice 4 level 10 *Plan, then go* after slice 3 (new interaction: unit tests, one scripted play, one portrait screenshot, `fingerdemo` at 10, build); slice 5 level 11 *Thick moss* (solver rewrite: rule tests including levels 1–3 and 8 unchanged, one browser play of 11, `fingerdemo` at 11, build).
- **`number-trails`, slices 2–6 in the dive's order** (`letter-trails` helpers; preschool and pre-K; [build slices](deep-dives/number-trails.md#build-slices-in-order); slice 1 is built): slice 2 more things and arrangements (rule tests, one portrait screenshot); slice 3 check the digits against the HWT chart (`digits.test.ts`, `fingerdemo` at 2; once the chart is open); slice 4 level 4 *First numbers* (rule tests, browser play of 4, `fingerdemo` at 4); slice 5 level 5 *Write how many* (new interaction: unit tests, one scripted play, one portrait screenshot); slice 6 level 6 *Less help each time* (rule tests, one play, `fingerdemo` at 6, one screenshot; coordinate with Letter Trails level 9 if in flight). Level 7 and the journal wait on [decisions](WAITING-ON-DEVELOPER.md).
- **`bolt-boards`, remaining slices in the dive's order** (`tinker-lab`; toddler to school; [build slices](deep-dives/bolt-boards.md#build-slices-in-order)):

### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say they have played slices 1–2 on the iPad ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
