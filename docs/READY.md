# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout remove the landed line (`git rm` its file in `docs/ready/next/`, or delete its Queued line here), add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a playtest, a reviewer or the developer), refill it in the same closeout from Queued (move the line into a file with `node scripts/ready.mjs add "…"` and delete it from Queued) (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Decisions made 2026-11-17: the developer delegated the calls the refill had skipped as gated, and the [record](archive/DECISIONS-2026-11-17.md) settles them; the lines they unblock are in Next ten and under *Unblocked by the decisions of 2026-11-17* below. Only the RW08 cutover still waits on the developer; the Portuguese review became the assistant's the same day.

Refilled 2026-11-17 after the queue ran nearly dry: every candidate was checked against `origin/main` (level tables, code and `git log`), because the [batch plans](GAME-BATCHES.md) turned out to be fully built and many dive slice lines still carry a "decision" label that each dive's own *Decided 2026-10-23* note settled. The [entry](verification/2026-11-17-ready-refill.md) lists what was skipped as gated.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number Queued lines by hand; Next ten's file numbers leave gaps on purpose (a playtest fix takes `node scripts/ready.mjs add --before=NNN`).

**Current focus (the developer, 2026-11-09):** a good phone experience for the two grown-ups who are playing now, so the phone lines lead Next ten and stay there; a fix or wish from a [playtest note](OBSERVATIONS.md) goes in directly under them, ahead of other content, as one bounded line (`node scripts/ready.mjs add --before=<the first non-phone file's number> "…"`). iPad, child and controller checks are [parked](DEVICE-CHECKS.md): no line waits on one, and no line or closeout repeats them.

## Next ten

**One file per line, in [`ready/next/`](ready/next/), in filename order** (`010-…`, `020-…`): `node scripts/ready.mjs` prints them in pick order. Take the first file whose line no open PR, branch or worktree claims, exactly as you would take the first line of a list. Each file is one line, written the same way as the Queued lines below (links in it are relative to `docs/ready/next/`; `node scripts/ready.mjs add "…"` takes a line copied from Queued and adjusts them). A separate file per line means sessions landing neighbouring lines never conflict: this list held 37 of 41 READY conflicts when it was one list (2026-11-09 to 12). `scripts/ready.test.mjs` fails `npm test` if a line is written here instead.

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script in batches** (assets tier, offline check; [decided 2026-11-17](archive/DECISIONS-2026-11-17.md#phone-play), no longer waiting on the listen): add line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally, the lines of the upright games first, one batch a session, each recording the size it adds to the offline cache; device speech stays the fallback, slotted lines (V3) stay on device speech and nothing is stitched until someone has listened. A listen can roll a batch back. [Roadmap](ROADMAP.md#a-better-voice)

- **P5, the other residents follow** (content; [decided 2026-11-17](archive/DECISIONS-2026-11-17.md#phone-play), the session judges it): first take a scripted capture strip of Trill's walk, chime and return and judge whether it reads as alive, recording the strip and the judgement; if it does, give the other five second-wave residents a route and one thing to use in their locations through `ResidentSpec.carriesOn` and `wanderRoute`, with the pilot's rules. A phone look can roll it back. [Pok Pok P5](reviews/POK-POK.md), [POLISH](rework/POLISH.md)



- **RW14 slice 10, the other ten backdrops** (images only; [decided 2026-11-17](archive/DECISIONS-2026-11-17.md#rework)): the session first does the screenshot review of slices 4 and 6 beside the untouched lands itself and records it; if it passes, R26's ten backdrops follow through `scripts/codex-image.sh`. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)






### Phone play

- **`pixel-pictures` upright at levels 3–8** (small fix; existing-game tier: typecheck, `src/games/upright-batch-6.test.ts` with those levels added to its list, `PHONE_LEVELS=all` sweep screenshots): the board overflows the right edge by about 5 units at 768 wide, so lower its x minimum of 160 in `resize` in `index.ts`, then widen `uprightLevels` to every level.

- **`pattern-train` upright at level 10** (small fix; same tier): one target is 88 units wide, under the 100 minimum; widen it and its neighbours at level 10, then add 10 to `uprightLevels`.

- **Upright batch 8 onward: the rest of the fits-as-is games, six at a time** (chunk 31; the existing-game tier six times over, as batches 6 and 7): after batch 7 (built), the next six from the sweep's measured fits-as-is list, one kind of challenge each where the list allows, measured games before by-eye ones; then the small-fix games, music first (`jelly-drums`, `rhythm-neighbors`, `movie-night`), each batch rerunning `BROWSER_SUITE=uprightsweep PHONE_ONLY=…` for its games first. Each closeout queues the next six as a Next ten line while the list lasts. [Game batches](definitions/phone-portrait.md#game-batches), [the sweep](definitions/phone-portrait.md#the-upright-sweep-built-2026-11-09)


- **`market-stall`, a total she can see on the counter** (existing-game change: typecheck, its rule tests, one filtered regression play): draw the running total on the counter in the modes where the game already counts on aloud, and not in the pair and change modes, so a round can be played with the phone muted; a note in the dive says which levels, then the change. Expected files: `src/games/market-stall/index.ts`, its dive and game page. [TotoLogic P8](reviews/TOTOLOGIC.md#p8-a-total-she-can-see-on-market-stalls-counter-a-dive-note-then-s)

- **A read-through of how drag games count a miss** (docs only): one table across the drag games (which wrong drops count, which use `src/progress/coach.ts`), since two smooth rounds step a level up and no test looks across games; closeout queues a fix line for any game whose wrong drop is uncounted. Expected files: a new page under `docs/definitions/`. [TotoLogic P9](reviews/TOTOLOGIC.md#p9-a-read-through-of-how-drag-games-count-a-miss-docs-s)

### Unblocked by the decisions of 2026-11-17

Each was skipped as gated by the refill and is settled in the [record](archive/DECISIONS-2026-11-17.md). A slice that names a probe runs it first, in the same session, and stops with a note in the dive if it fails.

- **WL2, the pet says the word in European Portuguese** (save and shell tier: typecheck, unit tests, build, the filtered host suites the definition names and production offline): the building session first writes the 20 entries and has a separate pass check each against European Portuguese dictionaries, filling one evidence row per key ([assistant review](definitions/additional-languages.md#assistant-review-of-the-portuguese-2026-11-17)); then `ctx.sayWord`, the exact-`pt-PT` voice rule, the per-profile setting and the grown-ups' select and status in Peekaboo Barn, Animal Snack and Bubble Pop. Read the [definition](definitions/additional-languages.md) by section; an entry that cannot be settled is left out.

- **Thumb sizes of the upright grown-up games, in pixels** (docs and a test helper: typecheck and the upright layout tests): measure the smallest target of each upright `grownup` game in CSS pixels at 390 × 844, list them in the phone-portrait definition, and queue a fix line for any under about 44 that does not zoom or scroll. [Roadmap 6](ROADMAP.md#upright-games-for-grown-ups-recommendations-2026-11-09)

- **The scaffold starts a grown-up game upright** (tooling: typecheck and the scaffold's own test): `npm run new-game` with `--band grownup` writes `upright: true` and an upright layout test stub, as [NEW-GAME](NEW-GAME.md) now asks.

- **Define play first, set up after** (TotoLogic P1; docs only; the [question-on-screen definition](definitions/question-on-screen.md) it waited on now exists): the first visit on a device with no players is one picture choice and a round on the blank profile, which awards nothing until it is adopted; adoption is a rename, not a copy. [P1](reviews/TOTOLOGIC.md#p1-play-first-set-up-after-a-definition-then-shell-and-save-m)

- **Say why after a right answer** (TotoLogic P7; two dive notes, then voice lines: the existing-game tier for each): one short line at the answer that ends the round in `pattern-train` and `rhyme-time`. [TotoLogic](reviews/TOTOLOGIC.md#proposals)

- **This week says what the games asked** (TotoLogic P4; a few lines in the grown-ups' page definition, then the panel: typecheck, unit tests, build). [TotoLogic](reviews/TOTOLOGIC.md#proposals), [definition](definitions/grownups-page.md)

- **`lift-it` level 10, One big pull** (a toddler entry; new levels plus the band, land and entry tests): as the dive specifies it. [Dive](deep-dives/lift-it.md#decisions-for-the-developer)

- **`puddle-gobble` level 13, Splash** (a lap entry; new levels plus the band, land and entry tests): the puddle splashes toward any touch, three shells, no growth. [Dive](deep-dives/puddle-gobble.md#decisions-for-the-developer)

- **`mossy-path` level 12, Turtle walk** (a lap entry; the same tier): any touch steps the turtle along a straight corridor. [Dive](deep-dives/mossy-path.md#decisions-for-the-developer)

- **`bolt-boards` lap entry** (the same tier): one huge bolt that turns for a tap anywhere, at the next free level ID. [Dive](deep-dives/bolt-boards.md#decisions-for-the-developer)

- **`draw-the-pattern` level 11, Spiral and eight** (a school window; probe first: a rule test that the rings and lobes stay two corridors apart, then new levels plus the band and land tests). [Dive](deep-dives/draw-the-pattern.md#decisions-for-the-developer)

- **`number-trails` level 7, Ten, and some more** (a school window, school 5–7; layout probe first, then new levels plus the band and land tests): a ten-frame and the teens. [Dive](deep-dives/number-trails.md#decisions-for-the-developer)

- **`swing-pals` files a discovery** (existing-game change plus the journal tests): "a longer rope swings slower", filed the first time a round shows it. [Dive](deep-dives/swing-pals.md#decisions-for-the-developer)

- **`paint-mixer` 4, the hatch colour step** (the batch as planned, without the dress or collection-book recolour, which waits for RW10's packet). [Batch](GAME-BATCHES.md#paint-mixer-4-palette-unlock), [definition](definitions/paint-mixer-5-6.md)

- **Definitions, one docs-only session each, in this order where a study gives one:** Word Code (PP9), Bunny Patches (PP3) and Garden Rows' tall flowers (PP4) from the [puzzle-pages study](deep-dives/subjects/puzzle-pages.md#decisions-for-the-developer); Swing Pals *Paint the beat*, then its level 9 after a `swingLayout` probe ([dive](deep-dives/swing-pals.md#decisions-for-the-developer)); Draw the Pattern level 12 *Your pattern* ([dive](deep-dives/draw-the-pattern.md#decisions-for-the-developer)); and RW10 ([work items](rework/WORK-ITEMS.md#sequence)). [Record](archive/DECISIONS-2026-11-17.md#games)

- **Definitions of levels that waited on play** (one docs-only session each, on the study's lean): Not Always 4–6 ([study](deep-dives/subjects/philosophy-reasoning.md)), Notice Board 4–5 ([study](deep-dives/subjects/media-literacy.md)), Shell Rows 4–5 ([study](deep-dives/subjects/strategy-games.md)), Swap Meet 5–6 ([study](deep-dives/subjects/money-economy.md)), Village Vote 4–6 ([study](deep-dives/subjects/community-civics.md)), Look It Up 4–6 ([study](deep-dives/subjects/informational-reading.md)), Lasso Loops 7 ([study](deep-dives/subjects/estimation.md)), then Word Glue 4–5 and Thought Bubbles 4 ([backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build)). [Record](archive/DECISIONS-2026-11-17.md#games)

- **Definitions of the grown-up Lantern Lake games** (one docs-only session each; the land pages, so no capacity test is owed): Tide Tables ([oceans](deep-dives/subjects/oceans.md)), Truth Bridge ([philosophy](deep-dives/subjects/philosophy-reasoning.md)), Fence the Field ([strategy games](deep-dives/subjects/strategy-games.md)), Shadow Play ([theatre](deep-dives/subjects/theatre-puppetry.md)), Key It Out ([informational reading](deep-dives/subjects/informational-reading.md)), Jar Clues ([estimation](deep-dives/subjects/estimation.md)), Harbor Orders ([money](deep-dives/subjects/money-economy.md)). [Record](archive/DECISIONS-2026-11-17.md#games)

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

- **`stamp-studio` Stamp a duck!** (toddler, between levels 2 and 3; new levels on an existing interaction): three animal stamps with sounds (the duck is new to the stamp kinds; the cat's meow and the fish's splash exist); the voice asks for one ("Stamp a duck!"), three asks in a round, then free; a wrong stamp still prints and is named ("That's a cat! Find the duck."), and the asked stamp's button glows after two such presses (a hint). It takes the next free level ID (11) with toddler `order [9, 10, 2, 11, 3]` and `entryLevels` unchanged. Expected files: `src/games/stamp-studio/{logic,index,voice,howto}.ts`, `logic.test.ts`, the browser case, the game page and dive. [Dive](deep-dives/stamp-studio.md#levels-below-level-1-waiting-on-the-level-order-decisions)

- **Reconcile stale slice lines in the dives** (docs only): the 2026-11-17 refill found built slices with no built mark (`critter-crossing` 2, `bounce-back` 1 and 3–5, `bubble-pop` 1, `mossy-path` 1 and 5, `tile-pairs` 1, `rainbow-fingers` 7, `treasure-map` 1, `domino-run` 4), level numbers since taken by lap entries (`jelly-drums` 5–7, `puzzle-pals` 3–6, `stamp-studio` 10–14, `song-maker` 4–9), and "(decision N)" or "waits on the level-order decisions" labels that each dive's *Decided 2026-10-23* note already settled (about thirty dives). One session checks each against the game page's level table and corrects the slice lines, the [tracker](deep-dives/README.md#tracker) rows that still say "queued" and the [backlog](STUDY-BACKLOG.md) rows, then queues what the corrected lists show as next.

- **`brain-break` the trail you made, a nudge on a wrong stone, and three pond looks** (already upright; grown-up; existing-game change: typecheck, its rule tests, one filtered `brainbreak` regression play of level 2 with one wrong stone, one upright screenshot; no `fingerdemo` since the bot does not change): a press squash on every tap, a side-to-side nudge on a wrong stone, a ribbon drawn from each lit stone to the next and replayed with pentatonic steps before the finishing line, three seeded pond looks; no rule or accounting change. Expected files: `src/games/brain-break/{index,logic,logic.test}.ts`, the game page. [Dive slice 1](deep-dives/brain-break.md#build-slices-in-order); slice 2 (levels 7–8 Count by) follows it.

- **`down-we-go` levels 1–2: Down we go and Measure first** (a new game; oceans study slice 5 build; new-game tier, as the [definition's check tier](definitions/down-we-go.md#check-tier) sets it): batch `down-we-go 1` as defined: the lantern on a knotted rope, the sun dial, the ledges and the deepest-ledge question; pre-K 1–2 and school 2; Bubble Beach as its 15th game (the lands test decides; fallback Tinker Lab); the build session redoes the S1 source check of the speech lines. Expected files: `src/games/down-we-go/`, `src/content/lands.ts`, generated barrels, a browser-check case, game docs. Levels 3–4 (batch `down-we-go 2`) follow as a later line when 1–2 land. [Definition](definitions/down-we-go.md), [study](deep-dives/subjects/oceans.md#build-slices-in-order)

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

Refilled 2026-11-17 from the [study backlog](STUDY-BACKLOG.md#completed-studies-next-definition-or-existing-build) rows and dive slices whose next action is a definition with no person or device gate (three more are in Next ten):

- **Define Memory Match's toddler opening** (`memory-match`; its dive calls it ready to define, decided as the hidden level 1 only): the toddler window, its how-to and the audits. [Dive](deep-dives/memory-match.md#build-slices-in-order)

- **Define Robot Path level 15, A routine** (`robot-path`, the last school level; the slice asks for the two-row UI, the call button and the bot to be defined first). [Dive](deep-dives/robot-path.md#build-slices-in-order)

- **Define Market Stall levels 12–13, Can I buy it? and Trade up** (`market-stall`; decided as "define now"). [Dive](deep-dives/market-stall.md#build-slices-in-order)

- **Define Egg Catch level 13, the sorting gate** (`egg-catch`; dive slice 9 is the definition itself). [Dive](deep-dives/egg-catch.md#build-slices-in-order)

- **Define Block Tower's Mend the leaning tower** (`block-tower`, school; the slice asks for the editable-top domain, release, undo and replay, and two seeded tasks to be defined first). [Dive](deep-dives/block-tower.md#build-slices-in-order)


### Subject research (docs only)

### Game research (docs only)

Added 2026-11-05: 21 games built from definitions have no dive and no study row that plans their next levels ([tracker waves 5–7](deep-dives/README.md#suggested-order-non-binding), [backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). Her own band first; one game per docs-only session, queuing its first build slice at closeout. No unstarted subject research remains. Every game has a dive or a study row (Pyramid Solitaire's dive, 2026-11-11, was the last of the tracker's waves), but a game built from a definition can still have no plan for its next levels; those found 2026-11-17 are below; Brain Break's dive is done (2026-11-18, [dive](deep-dives/brain-break.md)):

- **Research: a Vine Snip dive** (`vine-snip`, lap to school, levels 1–5; its later ideas are proposals only in its [definition](definitions/vine-snip.md)).


## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say go ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks. Translations are reviewed by the assistant ([how](definitions/additional-languages.md#assistant-review-of-the-portuguese-2026-11-17)), since the developer has no family reviewer to name (2026-11-17).
