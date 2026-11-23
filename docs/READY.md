# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout remove the landed line (`git rm` its file in `docs/ready/next/`, or delete its Queued line here), add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (move the line into a file with `node scripts/ready.mjs add "…"` and delete it from Queued) (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Decisions made 2026-11-17: the developer delegated the calls the refill had skipped as gated, and the [record](archive/DECISIONS-2026-11-17.md) settles them; the lines they unblock are in Next ten and under *Unblocked by the decisions of 2026-11-17* below. Only the RW08 cutover still waits on the developer; the Portuguese review became the assistant's the same day.

Refilled 2026-11-17 after the queue ran nearly dry: every candidate was checked against `origin/main` (level tables, code and `git log`), because the [batch plans](GAME-BATCHES.md) turned out to be fully built and many dive slice lines still carry a "decision" label that each dive's own *Decided 2026-10-23* note settled. The [entry](verification/2026-11-17-ready-refill.md) lists what was skipped as gated.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number Queued lines by hand; Next ten's file numbers leave gaps on purpose (a playtest fix takes `node scripts/ready.mjs add --before=NNN`).

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line (`node scripts/ready.mjs add --before=<the first non-phone file's number> "…"`). iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

**One file per line, in [`ready/next/`](ready/next/), in filename order** (`010-…`, `020-…`): `node scripts/ready.mjs` prints them in pick order. Take the first file whose line no open PR, branch or worktree claims, exactly as you would take the first line of a list. Each file is one line, written the same way as the Queued lines below (links in it are relative to `docs/ready/next/`; `node scripts/ready.mjs add "…"` takes a line copied from Queued and adjusts them). A separate file per line means sessions landing neighbouring lines never conflict: this list held 37 of 41 READY conflicts when it was one list (2026-11-09 to 12). `scripts/ready.test.mjs` fails `npm test` if a line is written here instead.

## Queued









### Phone play

No phone-play line is queued; a playtest fix goes in Next ten under the phone lines.

### Puzzle-page follow-ups


### Unblocked by the decisions of 2026-11-17

Each was skipped as gated by the refill and is settled in the [record](archive/DECISIONS-2026-11-17.md). A slice that names a probe runs it first, in the same session, and stops with a note in the dive if it fails.
















- **`jar-clues` levels 3–4, batch `jar-clues 2`** (grown-up; after batch `jar-clues 1`; new interaction tier: typecheck and unit tests (the multiple, not-a-multiple, special and one-of-two clue truth tables, the generator and its required kinds at levels 3–4, the one-of-two explanations for both-true and neither-true numbers, the hint walk, voice coverage), one filtered play at level 4 with one wrong check on the one-of-two clue and one hint, one upright screenshot of a one-of-two clue card, `fingerdemo` at level 4, build). [Definition](definitions/jar-clues.md#build-batches)



### Game slices from the dives (refilled 2026-11-17)






- **`market-stall` level 12, Can I buy it?, then level 13, Trade up** (school; after levels 8–11; two sessions, 12 then 13; tier in the [definition](definitions/market-stall-12-13.md#build-and-check-tier)). [Dive](deep-dives/market-stall.md#build-slices-in-order)

- **`word-glue` level 8, Someone who, batch `word-glue 5`** (school; after batch `word-glue 4`, built; new interaction tier: typecheck and unit tests (`DOERS` meanings, the round with the right action in each place, level 3's join accounting with the person as head, school's order `[3, 5, 6, 7, 8, 9]`, layout and upright views, voice coverage), one filtered upright `wordglue` play at level 8 with one wrong action dropped twice and one Show a hint, one upright screenshot, `fingerdemo` at 8, the doers' capture strip, build). [Definition](definitions/word-glue-8-9.md#build-batches)

- **`word-glue` level 9, Full of or without, batch `word-glue 6`** (school; after batch `word-glue 5`; new interaction tier: typecheck and unit tests (`ENDINGS` with both forms real, the round's balance of endings and sides, the two-way tap accounting, layout and upright views, voice coverage), one filtered upright play at level 9 with one wrong cup and one Show a hint, one upright screenshot, `fingerdemo` at 9, the things' capture strip, build). [Definition](definitions/word-glue-8-9.md#build-batches)






One game per session; each line's placement or band was settled by its dive's *Decided 2026-10-23* note, so a "decision" label on the slice line is stale and is corrected at closeout. A new level takes the next free ID where the dive's number has since been used.



- **`splish-splash` This one!** (toddler, between levels 2 and 3; new levels on an existing interaction): "Wash my ears!" with the named part sparkling as it is said; a plan field `show: true`, nothing counts as a miss and the sparkle is not a hint. Expected files: `src/games/splish-splash/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/splish-splash.md#levels-below-level-1-waiting-on-the-level-order-decisions)

- **`critter-sort` and `critter-crossing` open to preschool** (two small band openings, one session each or together: new levels tier plus the registry and lands tests): Critter Sort's preschool row with `order [6, 1]` on its built three-critter entry; Critter Crossing's level 1 for preschool now that its visible "not" entry exists. Each needs the band row, how-to and voice lines and the saves audit. [Critter Sort dive](deep-dives/critter-sort.md#build-slices-in-order), [Critter Crossing dive](deep-dives/critter-crossing.md#build-slices-in-order)

- **`day-by-day` level 9, Three little skies** (a preschool entry; new levels plus the band, land and entry tests): three pictured observations matched to sunny, cloudy or rainy with the existing buttons, under a truthful observations title and with no weekday claim. Expected files: `src/games/day-by-day/{logic,index,voice,howto}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/day-by-day.md#build-slices-in-order)

- **`jelly-drums` sound sets and stages** (all its bands; existing-game content: typecheck, rule tests that every set maps steps 0–4 to the same five pitches, one portrait screenshot per set): a round's instrument comes from the seed (marimba, bells, a soft held tone) with a stage tinted to match. Expected files: `src/games/jelly-drums/{logic,index}.ts`, `logic.test.ts`, the game page. [Dive](deep-dives/jelly-drums.md#build-slices-in-order)

- **`goodnight-room` the yawn nudge** (lap to pre-K; existing-game change: typecheck, its rule tests, one filtered regression play): the last unbuilt part of dive slice 10, a sound-only "still ready, any time" yawn with no timer and no pressure. Expected files: `src/games/goodnight-room/index.ts`, the game page. [Dive](deep-dives/goodnight-room.md#build-slices-in-order)


- **`stamp-studio` Stamp a duck!** (toddler, between levels 2 and 3; new levels on an existing interaction): three animal stamps with sounds (the duck is new to the stamp kinds; the cat's meow and the fish's splash exist); the voice asks for one ("Stamp a duck!"), three asks in a round, then free; a wrong stamp still prints and is named ("That's a cat! Find the duck."), and the asked stamp's button glows after two such presses (a hint). It takes the next free level ID (11) with toddler `order [9, 10, 2, 11, 3]` and `entryLevels` unchanged. Expected files: `src/games/stamp-studio/{logic,index,voice,howto}.ts`, `logic.test.ts`, the browser case, the game page and dive. [Dive](deep-dives/stamp-studio.md#levels-below-level-1-waiting-on-the-level-order-decisions)

- **Reconcile stale slice lines in the dives** (docs only): the 2026-11-17 refill found built slices with no built mark (`critter-crossing` 2, `bounce-back` 1 and 3–5, `bubble-pop` 1, `mossy-path` 1 and 5, `tile-pairs` 1, `rainbow-fingers` 7, `treasure-map` 1, `domino-run` 4), level numbers since taken by lap entries (`jelly-drums` 5–7, `puzzle-pals` 3–6, `stamp-studio` 10–14, `song-maker` 4–9), and "(decision N)" or "waits on the level-order decisions" labels that each dive's *Decided 2026-10-23* note already settled (about thirty dives). One session checks each against the game page's level table and corrects the slice lines, the [tracker](deep-dives/README.md#tracker) rows that still say "queued" and the [backlog](STUDY-BACKLOG.md) rows, then queues what the corrected lists show as next.

- **`brain-break` the trail you made, a nudge on a wrong stone, and three pond looks** (already upright; grown-up; existing-game change: typecheck, its rule tests, one filtered `brainbreak` regression play of level 2 with one wrong stone, one upright screenshot; no `fingerdemo` since the bot does not change): a press squash on every tap, a side-to-side nudge on a wrong stone, a ribbon drawn from each lit stone to the next and replayed with pentatonic steps before the finishing line, three seeded pond looks; no rule or accounting change. Expected files: `src/games/brain-break/{index,logic,logic.test}.ts`, the game page. [Dive slice 1](deep-dives/brain-break.md#build-slices-in-order); slice 2 (levels 7–8 Count by) follows it.

### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](reviews/CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](reviews/CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### Docs structure (2026-11-18 review)

Left over from the [docs review](reviews/WORKFLOW-REVIEWS.md#docs-review-2026-11-18), which reorganized the session documents; each is docs only and touches a file many links point into, so it runs alone and merges quickly.

- **Archive the built batch plans** (docs only: links and `git diff --check`): move `docs/GAME-BATCHES.md` (240 KB, every plan built) to `docs/archive/`, with its line in the archive index, and repoint the links into it; READY, ROADMAP and STUDY-BACKLOG then name the [batch rules](SESSION-GUIDE.md#same-game-batches) instead. A READY line that still cites a plan section as its scope keeps that link, pointed at the archived file.
- **One coverage row per suite or area** (docs only: links and `git diff --check`): `docs/VERIFICATION.md` is 300 KB, most of it a coverage summary that gained a row per slice. Collapse it to one row per browser suite or area, each naming the latest passing entry file in `docs/verification/`, so the "never re-run a passing suite" rule can be checked by reading one short table; the per-slice detail is already in the entry files.

### UX review (2026-11-09)

From the [adversarial UX review](reviews/UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a–U7c are built, and U7d's [classification](definitions/never-swallow-a-tap-lines.md) of the upright-ready games is done, and its fix batch 1, `animal-snack` and `far-lights`, is built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).




### Pok Pok review (2026-11-10)

From the [Pok Pok review](reviews/POK-POK.md#proposals), queued at the developer's request the same day; one item per session, in this order. The review's two playtest questions (P2, P3) are in [what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now), P6 is an acceptance line in [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and P8 is under [RW14's later list](rework/POLISH.md#later-not-sliced-yet). A playtest note that names a sound or a drag still goes under the phone lines in Next ten, ahead of these.

**Lap openings from the toy test (P4).** All of P4's lines are built; see the [definition](definitions/toy-test-lap-openings.md).



### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-17 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows and dive slices whose next action is a definition with no person or device gate:


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains. Every game has a dive or a study row (Pyramid Solitaire's dive, 2026-11-11, was the last of the tracker's waves), but a game built from a definition can still have no plan for its next levels; those found 2026-11-17 are below; Brain Break's dive is done (2026-11-18, [dive](deep-dives/brain-break.md)):


- **A shared sliding-board helper** (restructuring, typecheck and unit tests plus one filtered play per game it moves; the [thumb-fix line](definitions/phone-portrait.md#thumb-sizes-of-the-upright-grown-up-games-measured-2026-11-18) left it): Word Search (`layout.ts`), Island Bridges (`touchLayout`, `slideToShow`, `inWindow` in `logic.ts`) and Logic Grid / Picture Logic each carry their own window, clamp, drag threshold and edge-arrow code; move what is common into one engine helper (check the [reuse map](DESIGN.md#reuse-map) first) and keep every game's layout test passing, without changing any size.

## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks. Translations are reviewed by the assistant ([how](definitions/additional-languages.md#assistant-review-of-the-portuguese-2026-11-17)), since the developer has no family reviewer to name (2026-11-17).
