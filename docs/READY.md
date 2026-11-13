# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout remove the landed line (`git rm` its file in `docs/ready/next/`, or delete its Queued line here), add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (move the line into a file with `node scripts/ready.mjs add "…"` and delete it from Queued) (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number Queued lines by hand; Next ten's file numbers leave gaps on purpose (a playtest fix takes `node scripts/ready.mjs add --before=NNN`).

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line (`node scripts/ready.mjs add --before=<the first non-phone file's number> "…"`). iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

**One file per line, in [`ready/next/`](ready/next/), in filename order** (`010-…`, `020-…`): `node scripts/ready.mjs` prints them in pick order. Take the first file whose line no open PR, branch or worktree claims, exactly as you would take the first line of a list. Each file is one line, written the same way as the Queued lines below (links in it are relative to `docs/ready/next/`; `node scripts/ready.mjs add "…"` takes a line copied from Queued and adjusts them). A separate file per line means sessions landing neighbouring lines never conflict: this list held 37 of 41 READY conflicts when it was one list (2026-11-09 to 12). `scripts/ready.test.mjs` fails `npm test` if a line is written here instead.

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): once someone has listened to the first 215 clips on a phone ([what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)

- **P5, the other residents follow** (content, status `person`: waits on a look at a short capture of Trill's walk, chime and return, and whether it reads as alive, during the phone playtest; the pilot is built, nothing else is queued until then): if it does, give the other five second-wave residents a route and one thing to use in their locations through `ResidentSpec.carriesOn` and `wanderRoute`, with the pilot's rules (nothing hungry, owed or changed while she is away; every stop clears the spots, the signpost, the guide corner and the heading). [P5](POK-POK.md#p5-residents-that-carry-on-a-note-for-rw13-and-rw14-m)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:







### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### UX review (2026-11-09)

From the [adversarial UX review](UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a–U7c are built, and U7d's [classification](definitions/never-swallow-a-tap-lines.md) of the upright-ready games is done, and its fix batch 1, `animal-snack` and `far-lights`, is built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).




### Pok Pok review (2026-11-10)

From the [Pok Pok review](POK-POK.md#proposals), queued at the developer's request the same day; one item per session, in this order. The review's two playtest questions (P2, P3) are in [what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now), P6 is an acceptance line in [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and P8 is under [RW14's later list](rework/POLISH.md#later-not-sliced-yet). A playtest note that names a sound or a drag still goes under the phone lines in Next ten, ahead of these.

**Lap openings from the toy test (P4).** One game per session, in this order; each is a lap level or opening in the *One big jelly* shape (Jelly Drums level 10), read against the tables for [Bubble Beach](definitions/toy-test-lap-openings.md#bubble-beach), [Music Mountain](definitions/toy-test-lap-openings.md#music-mountain), [Painted Canyon](definitions/toy-test-lap-openings.md#painted-canyon), [Barnyard](definitions/toy-test-lap-openings.md#barnyard), [Counting Cove](definitions/toy-test-lap-openings.md#counting-cove), [Cozy Village](definitions/toy-test-lap-openings.md#cozy-village), [Rainbow Meadow](definitions/toy-test-lap-openings.md#rainbow-meadow), [Puzzle Peaks](definitions/toy-test-lap-openings.md#puzzle-peaks), [Story Grove](definitions/toy-test-lap-openings.md#story-grove) and [Tinker Lab](definitions/toy-test-lap-openings.md#tinker-lab). A new level goes at the end of the ladder and first in lap's `order`, so no saved level or pin is renumbered. None waits on a device or a child.

- **`attic-finds`, level 3 finishes after the third half turn** (existing-game tier: typecheck, the rule tests, one filtered play of level 3; `fingerdemo` at it only if the demonstrated action changes): at level 3 the round finishes after the third half turn without a tap on the Finish picture, as `sand-table`'s line asks of its flag, so a child who only pats the background finishes; the bell and line stay. It is the small change, so it is last. [the table](definitions/toy-test-lap-openings.md#story-grove)
- **`far-lights`, a lap level with one big light** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): a lap-only level at the end of the ladder (9; the ladder is 1–8) and first in lap's `order` (level 1 stays toddler's first): one big light in the window; a touch anywhere floats it close and its halo grows, and a second and a third light wake because she touched. Show a hint stops counting at level 1 with it. It is the land's only upright-ready game, so it is first. [the table](definitions/toy-test-lap-openings.md#tinker-lab)
- **`bouncy-launch`, a lap level where a touch anywhere bounces the pet** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): a lap-only level at the end of the ladder (13: levels 1–9 and 12 are used, and 10 and 11 are unused ids that fall back to level 1, so 13 is the next clear one) and first in lap's `order` (lap is 1..1 today, so lap gains an `order`; level 1 stays toddler's first): a touch anywhere bounces the pet, and each landing leaves a flower on the grass, so the meadow fills because she touched. [the table](definitions/toy-test-lap-openings.md#tinker-lab)
- **`moon-window`, a lap level where the window is the big thing to touch** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): a lap-only level at the end of the ladder (4) and first in lap's `order` (level 1 stays toddler's first): a touch anywhere turns the window to the next view, and each view seen joins the row along the bottom. [the table](definitions/toy-test-lap-openings.md#tinker-lab)
- **`seesaw-balance`, level 12's touch areas cover the whole view** (existing-game tier: typecheck, the rule tests, one filtered play of level 12; `fingerdemo` at it only if the demonstrated action changes): at level 12 the two touch areas cover the whole view and input opens before the instruction line has finished, at each round, so a child patting the top or bottom of the screen, or early, gets an answer. [the table](definitions/toy-test-lap-openings.md#tinker-lab)
- **`vine-snip`, Show a hint counts nothing at levels 1 and 2** (existing-game tier: typecheck, the rule tests, one filtered play of level 1): Show a hint at levels 1 and 2 glows the vine and counts nothing, as the card says. It already passes question 1, so it is last. [the table](definitions/toy-test-lap-openings.md#tinker-lab)


### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains. Every game now has a dive (Pyramid Solitaire's, 2026-11-11, was the last).


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
