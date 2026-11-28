# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout remove the landed line (`git rm` its file in `docs/ready/next/`, or delete its Queued line here), add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (move the line into a file with `node scripts/ready.mjs add "…"` and delete it from Queued) (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Decisions made 2026-11-17: the developer delegated the calls the refill had skipped as gated, and the [record](archive/DECISIONS-2026-11-17.md) settles them; the lines they unblock are in Next ten and under *Unblocked by the decisions of 2026-11-17* below. Only the RW08 cutover still waits on the developer; the Portuguese review became the assistant's the same day.

Refilled 2026-11-17 after the queue ran nearly dry: every candidate was checked against `origin/main` (level tables, code and `git log`), because the [batch rules](SESSION-GUIDE.md#same-game-batches) turned out to be fully built and many dive slice lines still carry a "decision" label that each dive's own *Decided 2026-10-23* note settled. The [entry](verification/2026-11-17-ready-refill.md) lists what was skipped as gated.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [same-game batches](SESSION-GUIDE.md#same-game-batches) (the built plans are [archived](archive/GAME-BATCHES-2026-11-23.md)). Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number Queued lines by hand; Next ten's file numbers leave gaps on purpose (a playtest fix takes `node scripts/ready.mjs add --before=NNN`).

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line (`node scripts/ready.mjs add --before=<the first non-phone file's number> "…"`). iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

**One file per line, in [`ready/next/`](ready/next/), in filename order** (`010-…`, `020-…`): `node scripts/ready.mjs` prints them in pick order. Take the first file whose line no open PR, branch or worktree claims, exactly as you would take the first line of a list. Each file is one line, written the same way as the Queued lines below (links in it are relative to `docs/ready/next/`; `node scripts/ready.mjs add "…"` takes a line copied from Queued and adjusts them). A separate file per line means sessions landing neighbouring lines never conflict: this list held 37 of 41 READY conflicts when it was one list (2026-11-09 to 12). `scripts/ready.test.mjs` fails `npm test` if a line is written here instead.

## Queued










### Phone play

A playtest fix goes in Next ten under the phone lines.


### Puzzle-page follow-ups


### Unblocked by the decisions of 2026-11-17

Each was skipped as gated by the refill and is settled in the [record](archive/DECISIONS-2026-11-17.md). A slice that names a probe runs it first, in the same session, and stops with a note in the dive if it fails.



















### Game slices from the dives (refilled 2026-11-17)

From the 2026-11-23 reconciliation of the dives' slice lists (each checked against the game's level table and `git log origin/main`); the tier is the dive's where it states one.

(Refilled into Next ten 2026-11-26.)

Refilled 2026-11-27 from the dives' slice lists, each checked against the game's `LEVELS` table on `origin/main` and the open PRs (`day-by-day` level 8 moved to Next ten 2026-11-27; `clock-tower` level 11 and `letter-trails` level 16 moved there the same day):


Refilled 2026-11-28 from the dives' slice lists, each checked against the game's level table in `docs/games/` and `LEVELS` on `origin/main` and the open pull requests (stale slice lines in the dives were marked built the same day). A line that follows another of the same game waits for that one to merge, since both take the next free ID:

- **`frog-hop`, level 18 *Which pad lost its number?*** (new-interaction tier): after level 17 merges; build its section of the [definition](definitions/frog-hop-entries-and-g1.md#18-which-pad-lost-its-number-pre-k) (pre-K order 1, 2, 18, 3, 4). [Dive slice 9](deep-dives/frog-hop.md#build-slices-in-order).
- **`frog-hop`, level 19 *Who is further along?*** (new-levels tier): after level 18 merges; build its section of the [definition](definitions/frog-hop-entries-and-g1.md#19-who-is-further-along-pre-k) (pre-K order 1, 2, 18, 19, 3, 4). [Dive slice 9](deep-dives/frog-hop.md#build-slices-in-order).
- **`bubble-pop`, level 20 *Make 20*** (new-levels tier): build the [definition](definitions/bubble-pop-make-20.md): a five-pair bonds plan with `sum: 20` at ID 20, school `order` `[10, 11, 12, 13, 14, 20]`; the hint glows the first bubble of her try and its partner and says how making 10 gets to 20 (`tenFor`, `bubble.ten20`); mode card, how-to steps, finish and note. [Dive slice 8](deep-dives/bubble-pop.md#build-slices-in-order).
- **`frog-hop`, level 20 G1 *Hops of a hundred*** (new-levels tier plus the `grownup` band audit): after level 19 merges; build its section of the [definition](definitions/frog-hop-entries-and-g1.md#20-g1-hops-of-a-hundred-grown-up) (grown-up 13, 14, 15, 20; `padValue` gains the question's offset). [Dive slice 11](deep-dives/frog-hop.md#build-slices-in-order).
- **`market-stall`, G1 *Odd coins*** (new-levels tier plus the `grownup` band audit): after *Which costs more?*; coins 1, 3 and 4 with a true-minimum (dynamic programming) `fewest` (gap 8); rounds include prices where greedy is not minimal. [Dive slice 11](deep-dives/market-stall.md#build-slices-in-order).
- **`market-stall`, the bakery stall** (shared-art tier): build its section of the [definition](definitions/market-stall-sell-and-bakery.md#the-bakery-stall-a-skin-every-level): a fourth stall skin (orange awning, dog keeper) with four code-drawn props in `src/art/props.ts` (loaf, bun, cupcake, cookie); the sticker snapshot unchanged; fixes "A orange" / "and a orange" on the pair levels with an article chosen for both `{a}` and `{b}`, tested. [Dive slice 12](deep-dives/market-stall.md#build-slices-in-order).
- **`market-stall`, *Is it enough?* (the sell stall)** (new-interaction tier): build the [definition](definitions/market-stall-sell-and-bakery.md#level-is-it-enough-a-round-step-by-step) at the next free ID: a customer pays, she sells or taps *More, please* and the customer counts on; school, after level 8 in `order`. [Dive slice 12](deep-dives/market-stall.md#build-slices-in-order).
- **`memory-match`, level 14 *Same share*** (new-levels tier): after 13; three equivalent-fraction pairs (1/2 with 2/4, 1/3 with 2/6, 2/3 with 4/6) on same-size rectangles, the subdivision overlay after two misses. [Dive slice 6](deep-dives/memory-match.md#build-slices-in-order).
- **`stamp-studio`, *Next to, between, above*** (new-levels tier): after *Where does it go?*, at the next free ID. [Dive slice 11](deep-dives/stamp-studio.md#build-slices-in-order).
- **`stamp-studio`, *The pet tells it back*** (existing-game tier: rule tests that every sentence is true of its picture, one scripted play; decision 6 settled 2026-10-23). [Dive slice 9](deep-dives/stamp-studio.md#build-slices-in-order).
- **`story-steps`, level 0b *Press the picture to watch*** (new-levels tier): after 0a, at the next free ID, lap; three cards that play in order when tapped, a story told, not asked. [Dive slice 7](deep-dives/story-steps.md#build-slices-in-order).
- **`tangram-town`, *One piece home*, then *Pick the missing piece*** (new-levels tier, one per session): the next free stable IDs (currently 10), toddler placed with `order`; one shadow, one piece, a snap radius of about 110 and no miss; then a built picture with one empty slot and a wrong piece that never fits. [Dive slice 8](deep-dives/tangram-town.md#build-slices-in-order).
- **`clock-tower`, preschool 1–1** (younger-band opening tier): after level 11's pull request merges; copy a visible model with one hand (decided 2026-10-23), band and inventory counts, a scoped card, registry and lands rules. [Dive slice 8](deep-dives/clock-tower.md#build-slices-in-order).
- **Define Critter Crossing *Be the gate*** (docs only): the second-seat level at the next free ID (currently 9), an anonymous, uncredited seat and a role-swapped round as supported completion (decided 2026-10-23); queue its build. [Dive slice 7](deep-dives/critter-crossing.md#build-slices-in-order).
- **Define Critter Sort level 10 *Pick the signs*** (docs only): play only, nothing kept (decided 2026-10-23); ID 10 is reserved for it; queue its build. [Dive slice 9](deep-dives/critter-sort.md#build-slices-in-order).
- **Define Pattern Train level 21 *Add three, add four*** (docs only; Wonder Woods may define it now, decided 2026-10-23; a child's play of 19–20 is a person check, not a gate); queue its build. [Dive slice 9](deep-dives/pattern-train.md#build-slices-in-order).
- **Define Duckling Parade level 12, the continuation** (docs only): the reference and progress card, the one-step reveal counted as help, completion and the bot (approved 2026-10-23); queue its build. [Dive slice 5](deep-dives/duckling-parade.md#build-slices-in-order).
- **Define Garden Rows *Two-flower beds* (4×4)** (docs only): a new level ID, its rules, layout at the four views and rule tests; queue its build. [Dive slice 5](deep-dives/garden-rows.md#build-slices-in-order).
- **Define Duck Pond *Pairs* and *Who was here first?*** (docs only): evens and odds by ducks swimming two by two (Duck Pond owns them, decided 2026-10-23) and the unknown-start story (1.OA.A.1); IDs, bands, accounting and rule tests; queue the builds. [Dive slice 11](deep-dives/duck-pond.md#build-slices-in-order).














One game per session; each line's placement or band was settled by its dive's *Decided 2026-10-23* note, so a "decision" label on the slice line is stale and is corrected at closeout. A new level takes the next free ID where the dive's number has since been used.
















### Codebase structure (2026-11-07 review)

Requested by the developer 2026-11-07 to make the code cheaper for AI to write and maintain; evidence and targets are in the [review](reviews/CODEBASE-REVIEW-2026-11-07.md). One item per session, in this order unless an item says otherwise. The sweeps (5, 6) touch every game folder, so each pilots on 2–3 games first and merges while no game PR is open on those files.

- **Split the largest game and shell files by mode and art** (one file per session, when it next comes up for work; that game's tier): [item 9](reviews/CODEBASE-REVIEW-2026-11-07.md#9-split-the-largest-files).

### Docs structure (2026-11-18 review)

Left over from the [docs review](reviews/WORKFLOW-REVIEWS.md#docs-review-2026-11-18), which reorganized the session documents; each is docs only and touches a file many links point into, so it runs alone and merges quickly.


### UX review (2026-11-09)

From the [adversarial UX review](reviews/UX-REVIEW-2026-11-09.md#recommendations-in-priority-order); U1 to U5 are built ([definition](definitions/todays-six.md#u5-a-first-six-she-can-start-status-built-2026-11-10)); U6a and U6b are built ([one way to browse](definitions/one-way-to-browse.md)), U7 is defined ([never swallow a tap](definitions/never-swallow-a-tap.md); U7a–U7c are built, and U7d's [classification](definitions/never-swallow-a-tap-lines.md) of the upright-ready games is done, and its fix batch 1, `animal-snack` and `far-lights`, is built) and U8 is built ([the grown-ups' page](definitions/grownups-page.md)) (one item per session); shell tier (typecheck, unit tests, build, the one or two suites that lean on it, `world` if navigation changed).




### Pok Pok review (2026-11-10)

From the [Pok Pok review](reviews/POK-POK.md#proposals), queued at the developer's request the same day; one item per session, in this order. The review's two playtest questions (P2, P3) are in [what the phone playtest can answer](DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now), P6 is an acceptance line in [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and P8 is under [RW14's later list](rework/POLISH.md#later-not-sliced-yet). A playtest note that names a sound or a drag still goes under the phone lines in Next ten, ahead of these.

**Lap openings from the toy test (P4).** All of P4's lines are built; see the [definition](definitions/toy-test-lap-openings.md).



### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

Refilled 2026-11-17 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows and dive slices whose next action is a definition with no person or device gate (refilled into Next ten 2026-11-26).


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains. Every game has a dive or a study row (Pyramid Solitaire's dive, 2026-11-11, was the last of the tracker's waves), but a game built from a definition can still have no plan for its next levels; those found 2026-11-17 are below; Brain Break's dive is done (2026-11-18, [dive](deep-dives/brain-break.md)):



## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks. Translations are reviewed by the assistant ([how](definitions/additional-languages.md#assistant-review-of-the-portuguese-2026-11-17)), since the developer has no family reviewer to name (2026-11-17).
