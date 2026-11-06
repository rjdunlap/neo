# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **Define Far Lights 5–8** (`astronomy`; docs only, with the parallax wording reviewed or held and levels 7–8 placed at the top of `school`): [Far Lights 1–4 as built](definitions/far-lights.md#what-comes-next), [study](deep-dives/subjects/astronomy.md#build-slices-in-order).
- **Define Puddle Lens 7–8** (`cells-microbes`; the wall clue and *Why green?* with enumerated candidate views, coordinated with ecosystems producers and chemistry dissolving; docs only): [Puddle Lens 5–6 as built](definitions/puddle-lens.md#what-comes-next), [study](deep-dives/subjects/cells-microbes.md#build-slices-in-order).
- **Define Hat Band 4+ (M6)** (`music-instruments`; the older three-role, three-phrase arrangement brief with all accepted states, trace, undo and truthful repair, older placement resolved; docs only): [Hat Band 1–3 as built](definitions/hat-band.md), [study](deep-dives/subjects/music-instruments.md#build-slices-in-order).
- **`playdate-workshop`, levels 1–3** (preschool 1, pre-K 1–3; taking turns and sharing, with the materials carrying the rule; Story Grove, else Painted Canyon): [definition](definitions/playdate-workshop.md#check-tier).
- **`gadget-bench`, level 4 *Fix-It Day*** (`inventions`; school; the first conflict: paddle wheels do two jobs; new level on the existing interaction, `fingerdemo` at 4): [definition](definitions/gadget-bench.md#level-4-fix-it-day-definition), [check tier](definitions/gadget-bench.md#check-tier-level-4).
- **Dive `bolt-boards`** (Bolt Boards; toddler to school, 7 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/bolt-boards.md).
- **`swing-pals`, more friends and leaf goals** (riders cat, dog, pig and, if it clears the short hook, cow; seeded leaf goals beside the bell; fresh-content tier, no `fingerdemo`): [fresh content inside existing levels](deep-dives/swing-pals.md#fresh-content-inside-existing-levels).

## Queued

- **Phone held upright, after shell slice 1** (chunk 31; slice 1 and batch 1 landed, so all of these are ready now; one session each; after each batch the developer plays the upright six on the phone and the feedback picks the next batch): shell slice 2, the rest of the root upright (shell tier, a layout test and one screenshot per scene); batch 2 (`picture-logic`, `lantern-lights`, `block-garden`, `gem-swap`, `tile-pairs`, `pyramid-solitaire`); batch 3, the lap and toddler six (`bubble-pop`, `sing-along-barn`, `animal-snack`, `size-parade`, `far-lights`, `stamp-studio`); batch 4 (`log-roll`, `marble-jump`, `snowball-merge`, `species-comeback` and two early-school games from feedback). Batch tier: `upright: true`, layout tests at the upright fixture for first and top level, one upright screenshot per game: [definition](definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built).

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:
  - **`circuit-garden`, levels 1–2, then 3** (pre-K and school; a visible way back closes the loop; Tinker Lab): [definition](definitions/circuit-garden.md).
  - **`measuring-post`, levels 1–4** (school; choose the tool for the question, and compare counts only in the same unit; Tinker Lab or Cozy Village): [definition](definitions/measuring-post.md).

- **`swing-pals`, three slices in the dive's order** (`physics`; lap to school; [build slices](deep-dives/swing-pals.md#build-slices-in-order)):
  - **`swing-pals`, level 7 *Who comes back first?*** (pre-K between 3 and 4 and school after 6, on decision 1's default; new-interaction tier with `fingerdemo` at 7): [new levels on top](deep-dives/swing-pals.md#new-levels-on-top).
  - **`swing-pals`, level 8 *Twice as quick*** (after level 7; new level on the existing hook interaction, `fingerdemo` at 8): [new levels on top](deep-dives/swing-pals.md#new-levels-on-top).

### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.

- **Dive `puddle-gobble`** (Puddle Gobble; toddler to school, 8 levels; docs only): [procedure](deep-dives/README.md#one-session-one-game), [definition](definitions/puddle-gobble.md).
- **Dive `number-trails`** (Number Trails; preschool and pre-K, 3 levels, numeral writing; docs only): [procedure](deep-dives/README.md#one-session-one-game). The rest of waves 5–7 follow in the tracker's order.

## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say they have played slices 1–2 on the iPad ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
