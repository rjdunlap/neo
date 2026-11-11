# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line. iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

- **`mossy-path`, slice 5** (toddler to school; [build slices](deep-dives/mossy-path.md#build-slices-in-order)): level 11 *Thick moss* (solver rewrite: rule tests including levels 1–3 and 8 unchanged, one browser play of 11, `fingerdemo` at 11, build).
- **`number-trails`, slices 3 and 5–6 in the dive's order** (`letter-trails` helpers; preschool and pre-K; [build slices](deep-dives/number-trails.md#build-slices-in-order); slices 1–2 and 4 are built): slice 3 check the digits against the HWT chart (`digits.test.ts`, `fingerdemo` at 2; once the chart is open); slice 5 level 5 *Write how many* (claimed 2026-11-10 by `claude/number-trails-write-how-many`; new interaction: unit tests, one scripted play, one portrait screenshot); slice 6 level 6 *Less help each time* (rule tests, one play, `fingerdemo` at 6, one screenshot; coordinate with Letter Trails level 9 if in flight). Level 7 and the journal are optional calls in the [dive](deep-dives/number-trails.md#decisions-for-the-developer).
- **`snowball-merge`, slices 1–5 in the dive's order** (`lantern-lake`; grown-up; [build slices](deep-dives/snowball-merge.md#build-slices-in-order)): slice 1 boards, looks, the join moment, the glow and a par line (existing-game change: typecheck, rule tests, one filtered `BROWSER_SUITE=snowball` play at level 3 with one portrait screenshot in a new look, `fingerdemo` at 3; build only if shared files change); slice 2 level 4 *Make 128* after slice 1 (new level: typecheck, rule tests, one browser play of 4, `fingerdemo` at 4); slice 3 level 5 *The ice rock* (model change: typecheck, rule tests with levels 1–4 unchanged, one browser play of 5 with one slide against the rock, one portrait screenshot, `fingerdemo` at 5, build); slice 4 level 6 *Build a snowman* (typecheck, rule tests with levels 1–5 unchanged, one browser play of 6 with one overshoot and Undo, one portrait screenshot, `fingerdemo` at 6); slice 5 level 7 *A wider field* only after phone-upright batch 4 (unit tests, one scripted play, one portrait screenshot, `fingerdemo` at 7, build). The school opening, couch course and swipes are optional calls in the [dive](deep-dives/snowball-merge.md#decisions-for-the-developer).
- **U7c–U7d, never swallow a tap** ([definition](definitions/never-swallow-a-tap.md#slices-and-check-tier)): U7c the tablet root's pressed picture and quick change, moving Home, Explore, the Arcade, the library and creature play onto U7a's `WayOut` (`src/app/leave.ts`) (after U6a and U6b: `BROWSER_SUITE=home`, `scripts/tap-timing.mjs`, build); U7d classify other games' awaited name lines (docs only).
- **Study follow-up: Festival Signals (H4), a definition** (docs only; [how-computers-work study](deep-dives/subjects/how-computers-work.md#build-slices-in-order), [packet](deep-dives/subjects/RECOMMENDATIONS.md#how-computers-work-recommendations); Sorting Machine 1–2 is built): freeze one playable slice and queue its first batch. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout)
- **Study follow-up: AB2, Rule Machine levels 5–6, a definition** (docs only; [algebra-balance study](deep-dives/subjects/algebra-balance.md), [packet](deep-dives/subjects/RECOMMENDATIONS.md#algebra-and-balance-recommendations); levels 1–4 are built): extend [the Rule Machine definition](definitions/rule-machine.md) or add a packet and queue its first batch.
- **Study follow-up: Picture Bytes (H6), a definition** (docs only; [how-computers-work study](deep-dives/subjects/how-computers-work.md#build-slices-in-order)): freeze one playable slice and queue its first batch.
- **Game research: Tile Pairs** (`tile-pairs`, docs only; built from a definition, no dive yet; [tracker](deep-dives/README.md#tracker), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)): write its dive (ladder, decisions, build slices) and queue the first unblocked batch.

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): once someone has listened to the first 215 clips on a phone ([what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:





### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### UX review (2026-11-09)

From the [adversarial UX review](UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a and U7b are built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).



### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
