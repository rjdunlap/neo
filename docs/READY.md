# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **`block-topple`, level 5 *Count the basket*** (school 2–5; fruit on level 4's lines, a running total in the fruit tray, three number pads; existing interaction plus pads: typecheck, unit tests, one `TOPPLE_LEVELS=5` play with two wrong counts on one line then to the sticker, one portrait screenshot of the tray and pads, `fingerdemo` at 5): [redefinition](definitions/block-topple.md#level-5-redefined-2026-11-05-count-the-basket), [check tier](definitions/block-topple.md#check-tier).
- **`seed-travelers`, levels 1–3, a new game** (admitted 2026-11-05; see Queued) (toddler 1–2, preschool 1–3, pre-K 2–3; a seed sent by a puff of air or carried in a critter's fur; Rainbow Meadow, else Barnyard): [definition](definitions/seed-travelers.md#check-tier).
- **Dive `draw-the-pattern`** (Draw the Pattern; lap to pre-K, 8 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/draw-the-pattern.md).
- **Define Puddle Lens 5–6** (`cells-microbes`; docs only, with a session source check of the biology model): [definition so far](definitions/puddle-lens.md), [study](deep-dives/subjects/cells-microbes.md).
- **Define Sense Detective 3–5, B3 ambiguity** (`body-health`; docs only): [definition so far](definitions/sense-detective.md), [study](deep-dives/subjects/body-health.md).
- **`sink-float`, level 10 *Salty or fresh* (batch sink-float 3)**, after batch sink-float 2 (built; new-interaction tier: typecheck, unit tests including the registry, lands, how-to and voice tests, one play of school level 10 through part 1, two wrong tanks on one egg question (glow, one hint), the duck question, to the sticker, one portrait and one landscape screenshot, `fingerdemo` at 10, one direct `control()` call for the two-tank ring, one build; no `couchgames`): [definition](definitions/salty-or-fresh.md), [dive](deep-dives/sink-float.md#build-slices-in-order), [batch](GAME-BATCHES.md#sink-float-3-salty-or-fresh).
- **`word-search`, level 7 *Just the theme* (batch word-search 4)**, after batch word-search 3 (built; new-interaction tier: typecheck, rule tests, one play of level 7 with a free non-theme line and two hints on one word, then to the sticker, one portrait screenshot of the blanks, `fingerdemo` at 7): [dive](deep-dives/word-search.md#build-slices-in-order), [batch](GAME-BATCHES.md#word-search-4-just-the-theme).

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)

- **`sudoku-garden`, level 10 A 6 by 6 bed with sums in the cages (batch sudoku-garden 5)**, defined 2026-11-03; taken when no other Sudoku Garden batch is in flight (new-interaction tier: typecheck, rule tests, one play of level 10 with one wrong number and one cage hint, to the sticker, one landscape and one portrait screenshot, `fingerdemo` at 10, one build for the voice lines): [dive](deep-dives/sudoku-garden.md#build-slices-in-order), [definition](deep-dives/sudoku-garden.md#cage-beds-level-10-definition-2026-11-03), [batch](GAME-BATCHES.md#sudoku-garden-5-cage-beds).


- **`word-search`, school opening: level 8 four picture words (batch word-search 5)**, after batch word-search 2 (built) (new band entry with a layout change and a new list drawing: typecheck, rule tests, the registry, lands and how-to tests, one scripted school play of level 8 with two wrong lines (the second shows the ring without counting a hint), a tile tap, one Hint, to the sticker, one portrait screenshot, the logged 1024×768 and 1024×1365 sizes, `fingerdemo` at school 8, one build; no `couchgames`): [definition](definitions/word-search-school-opening.md), [dive](deep-dives/word-search.md#build-slices-in-order), [batch](GAME-BATCHES.md#word-search-5-school-opening).


- **`helper-house`, level 4 (RA3)**, defined with levels 1–3, which are built (new levels on an existing interaction: typecheck, rule tests, one play of level 4 with a day that misses the goal twice and one Show me, one portrait screenshot, `fingerdemo` at 4): [definition](definitions/helper-house.md#check-tier), [study](deep-dives/subjects/robots-automation.md).
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
