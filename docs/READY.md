# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line. iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

- **P4 (the rest), the toy test for lap openings** (claimed 2026-11-11, `claude/p4-toy-test-painted-canyon`: Painted Canyon's five games; docs only; a land at a time, as U7d does): Bubble Beach's eight and Music Mountain's five games are read ([Bubble Beach](definitions/toy-test-lap-openings.md#bubble-beach), [Music Mountain](definitions/toy-test-lap-openings.md#music-mountain)); read the next land in [the list](definitions/toy-test-lap-openings.md#the-other-lands-not-read) (Painted Canyon first), 44 games to go. For each game that lists `lap`, read its first lap level from the code, how-to card and `describeLevel`, answer the page's [five questions](definitions/toy-test-lap-openings.md#the-five-questions) in a row, add the land's words-off list (P7), and give a game that fails the first or fourth question a line under [Pok Pok review](#pok-pok-review-2026-11-10), at the new-level tier. No device or child check is part of it. [P4](POK-POK.md#p4-the-toy-test-for-lap-openings-docs-s-then-one-game-at-a-time)
- **P3, tap the piece, then the place: a definition** (docs only; sooner if a playtest note names a drag): define one shared path beside `src/engine/drag.ts` so a drag game gains a tap alternative without its own pointer code: how a tapped piece shows it is held, how it is put down or cancelled, palm rejection, what the ghost finger demonstrates, and that couch controls are untouched. Name the first three games that take it (an upright-ready drag game first; [Tangram Town's youngest level](deep-dives/tangram-town.md) and Rainbow Fingers have already asked) and queue the engine slice. [P3](POK-POK.md#p3-a-tap-can-do-what-a-drag-does-a-question-now-a-definition-later)
- **`tile-pairs`, batch 1, a fresh pairing and a visible uncovering** (existing-game tier: typecheck, the rule tests, one filtered `tilepairs` play at level 3 with a portrait screenshot; no `fingerdemo`; build only if a shared file changes): the same layouts clear by a different seeded pairing each round, and a removed pair lifts away, pulses the tiles it uncovers and shows "pairs open" in the tally. [Dive](deep-dives/tile-pairs.md#build-slices-in-order), [batch plan](GAME-BATCHES.md#tile-pairs-1-a-fresh-pairing-and-a-visible-uncovering)
- **Game research: Pyramid Solitaire** (`pyramid-solitaire`, docs only; built from a definition, no dive yet, the last game without one; [tracker](deep-dives/README.md#tracker), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)): write its dive (ladder, decisions, build slices) and queue the first unblocked batch.
- **U7d (the rest)**: classify the other 133 games' awaited lines, a land at a time (docs only; [the candidates](definitions/never-swallow-a-tap-lines.md#the-other-games-candidates-not-read)): each session reads one land's games and adds rows, plus a fix-batch line above for any game that holds a cut line.
- **P5, a resident that carries on: a pilot** (rework; shell tier, as [RW14 slice 2](rework/POLISH.md#slice-2-residents-in-six-locations-and-her-own-friend-at-home) was: typecheck, unit tests, build, one filtered root probe in both orientations; no new art, so no offline check): one resident in one location (`src/creatures/resident.ts`, `LocationScene`) walks or flies between two or three marked spots on its own, uses one thing in the scene when it arrives, and turns toward her last touch. Nothing is hungry, owed or changed while she is away, and its touch circle still clears every spot, the signpost, the guide corner and the heading at each stop (the location's test checks every stop). Judged from a short capture before any other resident follows. [P5](POK-POK.md#p5-residents-that-carry-on-a-note-for-rw13-and-rw14-m)

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): once someone has listened to the first 215 clips on a phone ([what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






- **New games admitted 2026-11-05** (the developer asked for the recommendations to be made without waiting; identity, bands, land and accounting use the defaults settled in the [October 23 record](archive/DECISIONS-2026-10-23.md#decisions)). Each building session still does its own source check and the lands test at build time, since a full land pages rather than shrinks. They are in order of her age first, one game per session, new-game tier as each definition's check tier sets it:


- **`tile-pairs`, batch 2, Peek under the stack** (after batch 1; new-interaction tier: typecheck, unit tests, one filtered `tilepairs` play at level 5 that peeks, pairs, takes a wrong answer and a hint, a portrait screenshot of the see-through view, `fingerdemo` only if the card's demonstrated action changes, `couchgames` filtered to Tile Pairs if a pad button is mapped, build): a Peek button fades the covering tiles so the pictures below show, uncounted; the two more looks may ride with it. [Dive](deep-dives/tile-pairs.md#build-slices-in-order), [batch plan](GAME-BATCHES.md#tile-pairs-2-peek-under-the-stack)





### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### UX review (2026-11-09)

From the [adversarial UX review](UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a–U7c are built, and U7d's [classification](definitions/never-swallow-a-tap-lines.md) of the upright-ready games is done, and its fix batch 1, `animal-snack` and `far-lights`, is built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).




### Pok Pok review (2026-11-10)

From the [Pok Pok review](POK-POK.md#proposals), queued at the developer's request the same day; one item per session, in this order. The review's two playtest questions (P2, P3) are in [what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now), P6 is an acceptance line in [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and P8 is under [RW14's later list](rework/POLISH.md#later-not-sliced-yet). A playtest note that names a sound or a drag still goes under the phone lines in Next ten, ahead of these.

**Lap openings from the toy test (P4).** One game per session, in this order; each is a lap level or opening in the *One big jelly* shape (Jelly Drums level 10), read against the tables for [Bubble Beach](definitions/toy-test-lap-openings.md#bubble-beach) and [Music Mountain](definitions/toy-test-lap-openings.md#music-mountain). A new level goes at the end of the ladder and first in lap's `order`, so no saved level or pin is renumbered. None waits on a device or a child.

- **`bounce-back`, a lap level that cannot miss** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): the only Bubble Beach game where a lap player can be wrong, and where touching turns the paddle's help off. One huge paddle that a touch anywhere on the screen brings to the ball with a sound at the finger; a ball that gets past comes back without a boing, a "Whoops!" or a counted miss; lap plays it first.
- **`bubble-pop`, level 15 opens with one big bubble** (existing-game tier: typecheck, the rule tests, one filtered play of level 15, `fingerdemo` at it): one large bubble stands on screen when Play is pressed, so the first touch anywhere pops something, and the others rise in after her first pops rather than on a timer into an empty screen. Fix `inReach`'s comment with it.
- **`sink-float`, a lap level with one big thing** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): one large thing held over the water; a touch anywhere drops it with a sound at once, and the next thing arrives because she touched; a touch on the water splashes.
- **`tide-line`, a touch anywhere sends the wave at lap** (existing-game tier, with `fingerdemo` at lap since the demonstrated action changes): at lap, sand and sky send the wave as the sea does, a tap during a wave gets an answer, the card's ghost finger shows the tap, and the lap line says "tap" rather than "pull". Check the wave's start height when a tap lands while the sea slides back.
- **`melt-freeze`, a lap level with one big ice cube** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): one big cube and no tools; a touch anywhere warms it with a sound, it melts after a few touches, and the snowflake arrives only then to freeze it again.
- **`puddle-lens`, a touch anywhere swells the lens at lap** (existing-game tier, one filtered play of level 1 at lap): at lap, a touch outside the lens swells it too, a touch while it moves gets a sound, the next thing comes on her touch rather than a timer, and the pause sheet's hint is not counted.
- **`bumper-garden`, a lap level with one big flower** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): one big flower and the ladybug; any touch launches, and the other flowers wake as she launches. It passes question 1 already, so it is last.
- **`rhythm-neighbors`, a touch anywhere knocks at level 7** (existing-game tier: typecheck, the rule tests, one filtered play of level 7; `fingerdemo` at it only if the card's demonstrated action changes): at level 7 (lap's first) a touch on the pond, grass or sky knocks the tree as a touch on the tree does, with the knock sound at once; a tap on the frog still just croaks; a knock after the eighth still sounds while the ending waits; and the six-second idle invitation moves the tree (a knock and a bump), not the frog, since only knocks move the round on. [the table](definitions/toy-test-lap-openings.md#music-mountain)
- **`song-maker`, a lap level that answers anywhere** (new-level tier: typecheck, the rule tests, one browser play of the lap level, `fingerdemo` at it): a new level at the end of the ladder and first in lap's `order` (no saved level or pin renumbered): one big spot on a four-beat loop to start; a touch anywhere lights the spot nearest her finger with its note at once, more spots and the higher rows wake as she lights them, and putting a jelly out does not use up the round's taps. [the table](definitions/toy-test-lap-openings.md#music-mountain)


### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-05 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains.


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
