# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **`crossword`, levels 1–2, a new Story Grove game** (new-game tier: typecheck and unit tests including registry, lands and how-to; one scripted play of levels 1 and 2 with one wrong tile and one Help; one portrait screenshot; `fingerdemo` at 1 and 2; `npm run build`): the placer and the drag interaction for pre-K's whole range, from the [definition](definitions/crossword.md#check-tier) and the [study](deep-dives/subjects/puzzle-pages.md#crossword); levels 3, 4 and 5–6 follow as later builds.
- **Define `logic-grid`, a logic-grid whodunit after Murdle** (claimed 2026-11-05, branch `claude/define-logic-grid`; added by the developer 2026-11-05; docs only: links and `git diff --check`): clues mark a grid of yes and no squares until one answer is left: who took it, where and with what. The mystery stays gentle (a missing snack or toy, never a crime). The definition sets the bands (a 2 by 3 picture grid with spoken clues as the younger opening, then 3 by 3, up to grown-up grids with three categories and written clues), the land, input by touch (and the couch, if it fits), misses and hints (marking a square an open clue already rules out is a gentle miss, as Secret Code counts an ignored clue; a hint points at the clue that decides a square next) and a level ladder in which **each level names its own cast, categories and clue kinds**. Puzzles come from a seeded generator whose solver proves one answer and that each clue is needed, so the per-level content is the picture cast and the clue wording, written and reviewed in that level's build session. Reuse Picture Logic's marks and Sudoku Garden's grid before adding anything. Design notes: the [puzzle-pages study](deep-dives/subjects/puzzle-pages.md#logic-grid-whodunit). At closeout queue the first level's build here: [Picture Logic](GAMES.md#picture-logic), [Secret Code](GAMES.md#secret-code), [idea](IDEAS.md#grown-up-play-candidates-couch-route).
- **`sense-detective`, level 5 *Can't tell yet* (B4b)** (unblocked, B4a built; new interaction on an existing game: typecheck and unit tests including the layout with `cantTell`, one scripted play of level 5 (both fit, *Can't tell yet*, the eye miss, the ear, then the rattle parcel to the sticker), one portrait and one landscape screenshot with the *Can't tell yet* card, `fingerdemo` at 5, `npm run build`): [definition](definitions/sense-detective.md#levels-35-definition-2026-11-05).
- **`draw-the-pattern`, slice 2 level 9 *Slanting lines***, unblocked (new levels on an existing interaction: typecheck, rule tests, one play of level 9 with one stray and one hint, `fingerdemo` at 9): [dive](deep-dives/draw-the-pattern.md#build-slices-in-order).
- **Define `helper-house` levels 5–7 (RA4: sensor placement, the comfy line, two lines)** (levels 1–4 built; docs only: links and `git diff --check`): [definition](definitions/helper-house.md), [study](deep-dives/subjects/robots-automation.md#build-slices-in-order). Settles the open parts of levels 5–7 (a frozen switch bound for the calm heater); the first build follows at closeout.

## Queued

- **`draw-the-pattern`, slice 3 level 10 *Dot to dot***, on decision 1's default (lap plays 1 and 10) (new interaction: typecheck, unit tests, one scripted play at lap and of toddler's order step from 10 to 2, one portrait screenshot, `fingerdemo` at 10): [dive](deep-dives/draw-the-pattern.md#build-slices-in-order).

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)





- **`hat-band`, levels 1–3, a new Music Mountain game** (defined 2026-10-22 as M5; identity and placement settled 2026-10-23, Music Mountain holds 8 games). The building session does the source check and the actual Music Mountain capacity check first (new-game tier with a build, as the definition's check tier sets it): [definition](definitions/hat-band.md#check-tier), [study](deep-dives/subjects/music-instruments.md).

- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:
  - **`rain-garden`, levels 1–3** (toddler 1, preschool 1–2, pre-K 2–3, school 3; stone or soil changes where the drops go; Tinker Lab, else Rainbow Meadow): [definition](definitions/rain-garden.md#check-tier).
  - **`playdate-workshop`, levels 1–3** (preschool 1, pre-K 1–3; taking turns and sharing, with the materials carrying the rule; Story Grove, else Painted Canyon): [definition](definitions/playdate-workshop.md#check-tier).
  - **`circuit-garden`, levels 1–2, then 3** (pre-K and school; a visible way back closes the loop; Tinker Lab): [definition](definitions/circuit-garden.md).
  - **`measuring-post`, levels 1–4** (school; choose the tool for the question, and compare counts only in the same unit; Tinker Lab or Cozy Village): [definition](definitions/measuring-post.md).

### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:

- **Define Bond Beads 5–8** (`chemistry`; docs only, with a session source check of the molecule list): [definition so far](definitions/bond-beads.md), [study](deep-dives/subjects/chemistry.md).
- **Define Welcome Ways 5–7** (`engineering-design`; space limits, a conflict and a repair for a new friend; docs only): [definition so far](definitions/welcome-ways.md), [study](deep-dives/subjects/engineering-design.md).
- **Define Gadget Bench 4** (`inventions`; a three-condition path with a conflict, revise one part; docs only): [definition so far](definitions/gadget-bench.md#what-comes-next), [study](deep-dives/subjects/inventions.md).
- **Define Far Lights 5–8** (`astronomy`; docs only, with the parallax wording reviewed or held and levels 7–8 placed at the top of `school`): [Far Lights 1–4 as built](definitions/far-lights.md#what-comes-next), [study](deep-dives/subjects/astronomy.md#build-slices-in-order).
- **Define Puddle Lens 7–8** (`cells-microbes`; the wall clue and *Why green?* with enumerated candidate views, coordinated with ecosystems producers and chemistry dissolving; docs only): [Puddle Lens 5–6 as built](definitions/puddle-lens.md#what-comes-next), [study](deep-dives/subjects/cells-microbes.md#build-slices-in-order).
- **Define Mossy Path 4–7 *find the way*, a maze opening (PP1)** (`puzzle-pages`; toddler to school; docs only, with the session's source check of the maze-planning studies): [ladder](deep-dives/subjects/puzzle-pages.md#a-first-games-ladder-mossy-path-find-the-way), [study](deep-dives/subjects/puzzle-pages.md), [Mossy Path](GAMES.md#mossy-path).

### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.

- **Dive `swing-pals`** (Swing Pals; lap to school, 6 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/swing-pals.md).
- **Dive `bolt-boards`** (Bolt Boards; toddler to school, 7 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/bolt-boards.md).
- **Dive `puddle-gobble`** (Puddle Gobble; toddler to school, 8 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/puddle-gobble.md).
- **Dive `number-trails`** (Number Trails; preschool and pre-K, 3 levels, numeral writing; docs only): [procedure](deep-dives/README.md#one-session-one-game). The rest of waves 5–7 follow in the tracker's order.

## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say they have played slices 1–2 on the iPad ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
