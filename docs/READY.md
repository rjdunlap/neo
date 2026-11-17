# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout remove the landed line (`git rm` its file in `docs/ready/next/`, or delete its Queued line here), add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (move the line into a file with `node scripts/ready.mjs add "…"` and delete it from Queued) (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Refilled 2026-11-17 after the queue ran nearly dry: every candidate was checked against `origin/main` (level tables, code and `git log`), because the [batch plans](GAME-BATCHES.md) turned out to be fully built and many dive slice lines still carry a "decision" label that each dive's own *Decided 2026-10-23* note settled. The [entry](verification/2026-11-17-ready-refill.md) lists what was skipped as gated.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number Queued lines by hand; Next ten's file numbers leave gaps on purpose (a playtest fix takes `node scripts/ready.mjs add --before=NNN`).

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line (`node scripts/ready.mjs add --before=<the first non-phone file's number> "…"`). iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

**One file per line, in [`ready/next/`](ready/next/), in filename order** (`010-…`, `020-…`): `node scripts/ready.mjs` prints them in pick order. Take the first file whose line no open PR, branch or worktree claims, exactly as you would take the first line of a list. Each file is one line, written the same way as the Queued lines below (links in it are relative to `docs/ready/next/`; `node scripts/ready.mjs add "…"` takes a line copied from Queued and adjusts them). A separate file per line means sessions landing neighbouring lines never conflict: this list held 37 of 41 READY conflicts when it was one list (2026-11-09 to 12). `scripts/ready.test.mjs` fails `npm test` if a line is written here instead.

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): once someone has listened to the first 215 clips on a phone ([what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)

- **P5, the other residents follow** (content, status `person`: waits on a look at a short capture of Trill's walk, chime and return, and whether it reads as alive, during the phone playtest; the pilot is built, nothing else is queued until then): if it does, give the other five second-wave residents a route and one thing to use in their locations through `ResidentSpec.carriesOn` and `wanderRoute`, with the pilot's rules (nothing hungry, owed or changed while she is away; every stop clears the spots, the signpost, the guide corner and the heading). [P5](POK-POK.md#p5-residents-that-carry-on-a-note-for-rw13-and-rw14-m)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






### Phone play

- **`pixel-pictures` upright at levels 3–8** (small fix; existing-game tier: typecheck, `src/games/upright-batch-6.test.ts` with those levels added to its list, `PHONE_LEVELS=all` sweep screenshots): the board overflows the right edge by about 5 units at 768 wide, so lower its x minimum of 160 in `resize` in `index.ts`, then widen `uprightLevels` to every level.

- **`pattern-train` upright at level 10** (small fix; same tier): one target is 88 units wide, under the 100 minimum; widen it and its neighbours at level 10, then add 10 to `uprightLevels`.

- **`beat-builder` upright at levels 4–5** (real layout; same tier): eight steps of 100 units are 800+ wide, so the grid needs two rows or a scaled container (as Ribbon Workshop's `frame.ts`) at those levels; its layout is inline in `index.ts`, so lift it into a testable function with a layout test, then add 4 and 5 to `uprightLevels`.

- **`orchard-rows` upright at levels 1–6 and 8** (real layout; same tier): the sweep measured its targets too small or outside the view at those levels; give them an upright layout with a layout test, then widen `uprightLevels`.

- **Upright batch 8 onward: the rest of the fits-as-is games, six at a time** (chunk 31; the existing-game tier six times over, as batches 6 and 7): after batch 7 (built), the next six from the sweep's measured fits-as-is list, one kind of challenge each where the list allows, measured games before by-eye ones; then the small-fix games, music first (`jelly-drums`, `rhythm-neighbors`, `movie-night`), each batch rerunning `BROWSER_SUITE=uprightsweep PHONE_ONLY=…` for its games first. Each closeout queues the next six as a Next ten line while the list lasts. [Game batches](definitions/phone-portrait.md#game-batches), [the sweep](definitions/phone-portrait.md#the-upright-sweep-built-2026-11-09)

- **`market-stall`, a total she can see on the counter** (existing-game change: typecheck, its rule tests, one filtered regression play): draw the running total on the counter in the modes where the game already counts on aloud, and not in the pair and change modes, so a round can be played with the phone muted; a note in the dive says which levels, then the change. Expected files: `src/games/market-stall/index.ts`, its dive and game page. [TotoLogic P8](TOTOLOGIC.md#p8-a-total-she-can-see-on-market-stalls-counter-a-dive-note-then-s)

- **A read-through of how drag games count a miss** (docs only): one table across the drag games (which wrong drops count, which use `src/progress/coach.ts`), since two smooth rounds step a level up and no test looks across games; closeout queues a fix line for any game whose wrong drop is uncounted. Expected files: a new page under `docs/definitions/`. [TotoLogic P9](TOTOLOGIC.md#p9-a-read-through-of-how-drag-games-count-a-miss-docs-s)

### Game slices from the dives (refilled 2026-11-17)

One game per session; each line's placement or band was settled by its dive's *Decided 2026-10-23* note, so a "decision" label on the slice line is stale and is corrected at closeout. A new level takes the next free ID where the dive's number has since been used.

- **`duck-pond` real stopping at levels 4–5** (toddler, preschool; a new interaction on existing levels: typecheck, rule tests, one filtered play at 4 and 5 with one wrong count, `fingerdemo`, one portrait screenshot): a "That's enough!" check ends the round, too few or too many is a gentle miss with the spoken count (the unused `duck.extra` line), and a duck tapped on the pond hops back as a free undo; level 3 stays as it is. Expected files: `src/games/duck-pond/{logic,index,howto,voice}.ts`, `logic.test.ts`, the browser case, the game page. [Dive slice 3](deep-dives/duck-pond.md#build-slices-in-order)

- **`peekaboo-barn` Who says moo?, then Hide it yourself** (toddler, preschool; two sessions' worth if the second runs long: *Who says moo?* is new levels on the find interaction, *Hide it yourself* is a new interaction with `drag.ts`): the two entries dive slice 9 still lists as to build. Two animals peek and a sound asks who makes it (a wrong animal names itself, glow after two); she drags an animal to a house and the pet looks in the wrong houses first (three hides, never wrong). Expected files: `src/games/peekaboo-barn/{logic,index,voice,howto}.ts`, `logic.test.ts`, the browser case, the game page. [Dive](deep-dives/peekaboo-barn.md#earlier-play-entries-in-level-order)

- **`splish-splash` This one!** (toddler, between levels 2 and 3; new levels on an existing interaction): "Wash my ears!" with the named part sparkling as it is said; a plan field `show: true`, nothing counts as a miss and the sparkle is not a hint. Expected files: `src/games/splish-splash/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/splish-splash.md#levels-below-level-1-waiting-on-the-level-order-decisions)

- **`owl-walk` level 5, Stepping stones, and the lap band** (lap, toddler; new levels on an existing interaction, plus the registry and lands tests because `bands` gains `lap`): five fat stones and a nest with no cards; a tap on a stone ahead hops the owl there with a note per stone, and nothing is wrong. Expected files: `src/games/owl-walk/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/owl-walk.md#build-slices-in-order)

- **`stop-and-go` level 10, Wait for green** (toddler, between levels 1 and 2; new levels on an existing interaction): one car and a two-lamp light that changes by itself with long phases; a red tap is a rumble and "wait!", a nudge and not a miss; toddler `order [1, 10, 2]`, `entryLevels [10]`. Expected files: `src/games/stop-and-go/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/stop-and-go.md#build-slices-in-order)

- **`word-monsters` My letter** (toddler, preschool; new levels on an existing interaction): three monsters, one wearing the first letter of her name (`nameLetters(ctx.childName)`, with the dive's fallback), asked by letter name only, so it makes no phonics claim; a lookalike guard in the rule tests. Expected files: `src/games/word-monsters/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/word-monsters.md#levels-below-level-1-waiting-on-the-level-order-decisions)

- **`critter-sort` and `critter-crossing` open to preschool** (two small band openings, one session each or together: new levels tier plus the registry and lands tests): Critter Sort's preschool row with `order [6, 1]` on its built three-critter entry; Critter Crossing's level 1 for preschool now that its visible "not" entry exists. Each needs the band row, how-to and voice lines and the saves audit. [Critter Sort dive](deep-dives/critter-sort.md#build-slices-in-order), [Critter Crossing dive](deep-dives/critter-crossing.md#build-slices-in-order)

- **`day-by-day` level 9, Three little skies** (a preschool entry; new levels plus the band, land and entry tests): three pictured observations matched to sunny, cloudy or rainy with the existing buttons, under a truthful observations title and with no weekday claim. Expected files: `src/games/day-by-day/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/day-by-day.md#build-slices-in-order)

- **`jelly-drums` sound sets and stages** (all its bands; existing-game content: typecheck, rule tests that every set maps steps 0–4 to the same five pitches, one portrait screenshot per set): a round's instrument comes from the seed (marimba, bells, a soft held tone) with a stage tinted to match. Expected files: `src/games/jelly-drums/{logic,index}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/jelly-drums.md#build-slices-in-order)

- **`goodnight-room` the yawn nudge** (lap to pre-K; existing-game change: typecheck, its rule tests, one filtered regression play): the last unbuilt part of dive slice 10, a sound-only "still ready, any time" yawn with no timer and no pressure. Expected files: `src/games/goodnight-room/index.ts`, the game page. [Dive](deep-dives/goodnight-room.md#build-slices-in-order)

- **`bubble-pop` level 18, Dots and numbers together** (preschool; new level on an existing interaction: typecheck, the rule tests, one browser play with one wrong pop, `fingerdemo` at it, one upright screenshot): the last piece of the dive's *Which one has the dots?* (level 17 is built): a later round where numerals and dot patterns are mixed and she pops the matching pair, reusing level 17's dice art and the bonds levels' hold-then-partner handling, placed by the preschool `order`. [Dive](deep-dives/bubble-pop.md#levels-below-level-1), [slices](deep-dives/bubble-pop.md#build-slices-in-order)

- **Reconcile stale slice lines in the dives** (docs only): the 2026-11-17 refill found built slices with no built mark (`critter-crossing` 2, `bounce-back` 1 and 3–5, `bubble-pop` 1, `mossy-path` 1 and 5, `tile-pairs` 1, `rainbow-fingers` 7, `treasure-map` 1, `domino-run` 4), level numbers since taken by lap entries (`jelly-drums` 5–7, `puzzle-pals` 3–6, `stamp-studio` 10–14, `song-maker` 4–9), and "(decision N)" or "waits on the level-order decisions" labels that each dive's *Decided 2026-10-23* note already settled (about thirty dives). One session checks each against the game page's level table and corrects the slice lines, the [tracker](deep-dives/README.md#tracker) rows that still say "queued" and the [backlog](STUDY-BACKLOG.md) rows, then queues what the corrected lists show as next.

### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### UX review (2026-11-09)

From the [adversarial UX review](UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a–U7c are built, and U7d's [classification](definitions/never-swallow-a-tap-lines.md) of the upright-ready games is done, and its fix batch 1, `animal-snack` and `far-lights`, is built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).




### Pok Pok review (2026-11-10)

From the [Pok Pok review](POK-POK.md#proposals), queued at the developer's request the same day; one item per session, in this order. The review's two playtest questions (P2, P3) are in [what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now), P6 is an acceptance line in [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and P8 is under [RW14's later list](rework/POLISH.md#later-not-sliced-yet). A playtest note that names a sound or a drag still goes under the phone lines in Next ten, ahead of these.

**Lap openings from the toy test (P4).** All of P4's lines are built; see the [definition](definitions/toy-test-lap-openings.md).



### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-17 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows and dive slices whose next action is a definition with no person or device gate (three more are in Next ten):

- **Define Down We Go** (a new game, pre-K to school; oceans study slice 5, whose condition, the shore art, is built): a lantern on a rope, the light dimming by stops, the seaweed question; the packet does its own land capacity and source checks. [Study](deep-dives/subjects/oceans.md#build-slices-in-order)

- **Define Who Am I? level 8, the platypus** (`who-am-i`; zoo-animals ladder row 8; levels 1–7 are built): a friend that lays eggs and feeds milk, as the case the group rule has to stretch for. [Definition](definitions/who-am-i.md), [study](deep-dives/subjects/zoo-animals.md)

- **Define Memory Match's toddler opening** (`memory-match`; its dive calls it ready to define, decided as the hidden level 1 only): the toddler window, its how-to and the audits. [Dive](deep-dives/memory-match.md#build-slices-in-order)

- **Define Robot Path level 15, A routine** (`robot-path`, the last school level; the slice asks for the two-row UI, the call button and the bot to be defined first). [Dive](deep-dives/robot-path.md#build-slices-in-order)

- **Define Market Stall levels 12–13, Can I buy it? and Trade up** (`market-stall`; decided as "define now"). [Dive](deep-dives/market-stall.md#build-slices-in-order)

- **Define Egg Catch level 13, the sorting gate** (`egg-catch`; dive slice 9 is the definition itself). [Dive](deep-dives/egg-catch.md#build-slices-in-order)

- **Define Block Tower's Mend the leaning tower** (`block-tower`, school; the slice asks for the editable-top domain, release, undo and replay, and two seeded tasks to be defined first). [Dive](deep-dives/block-tower.md#build-slices-in-order)


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains. Every game has a dive or a study row (Pyramid Solitaire's dive, 2026-11-11, was the last of the tracker's waves), but a game built from a definition can still have no plan for its next levels; those found 2026-11-17 are below, with Brain Break's in Next ten:

- **Research: a Little Conductor dive** (`little-conductor`, toddler to pre-K, levels 1–3; its later plans for strength, cueing and a baton are one line in its [definition](definitions/little-conductor.md)).

- **Research: a Vine Snip dive** (`vine-snip`, lap to school, levels 1–5; its later ideas are proposals only in its [definition](definitions/vine-snip.md)).


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
