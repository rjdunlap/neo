# Peg Garden deep dive

*ID `peg-garden` · bands lap, toddler, preschool, pre-K · levels 1–5 on 2026-10-17 · session `claude/dive-peg-garden` ([PR #541](https://github.com/rjdunlap/neo/pull/541))*

## The game today

A pearl falls through a sea garden of flower buds, after Peggle and pachinko. Every bud it touches blooms with a bell (higher on the board, higher the note) and a star burst; the pearl rolls away into the sand and nothing is lost. The learning purpose is cause and effect and tracking a falling object at the bottom, then colour, counting, numeral recognition and aiming at the top. The physics is `engine/ball.ts`: one ball, round pegs, side walls, gravity 900, bounce 0.62. Code: `src/games/peg-garden/index.ts`, `logic.ts`, `logic.test.ts`; land Bubble Beach (`src/content/lands.ts`).

| Level | Plan (`PLANS`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `drop`: 22 buds, 6 pearls | lap 1, toddler 1–2 | Where along the top to tap; the pearl falls from that spot with a random sideways drift of up to ±20. Nothing is wrong; the round ends after six pearls |
| 2 | `bloom`: 9 buds | toddler, preschool | Where to drop so the remaining buds bloom. Never wrong. After two pearls in a row that wake nothing new (`STALL_AT`), the next is let go over a waiting bud instead of the tapped spot, so the round always ends |
| 3 | `color`: 16 buds, 4 orange | preschool, pre-K | Where to drop to reach the orange buds, counted aloud as they bloom. A pearl that touches no orange bud is a miss |
| 4 | `number`: 14 buds, numerals 1–5 | preschool, pre-K | Drag to aim a launcher (±1.15 rad from straight down) and let go; three of the five numerals are asked in turn ("Hit 3!"). A shot that misses the asked bud is a miss |
| 5 | `order`: 14 buds, numerals 1–3 | pre-K | Hit 1, then 2, then 3 with the launcher |

**Content pools.** One board shape: `grid()` gives 39 places in six staggered rows and a round takes a seeded subset; six petal colours; one sea gradient with sand and seaweed. Specials and numerals sit away from the side walls. Every round looks alike apart from which places are filled.

**Accounting.** Levels 1–2 have no misses. Level 3 and levels 4–5: a shot without the wanted bud is a miss (`sfx.boing` and a spoken line); two misses in a row turn on the hint (`hints++`): at level 3 a bobbing arrow over a waiting orange bud; at 4–5 the arrow over the asked numeral plus the launcher's whole simulated path instead of its short dotted start. `shots` is the couch face-off score.

**Bots.** `autotouch()` taps along the ledge (fixed spread at 1, `dropAt()` over waiting buds at 2–3, reading the game's next drift draw) and drags the launcher to an angle from `aimAt()` at 4–5. `autoplay()` drives the couch launcher. Rule tests: specials and numerals placed, every numeral reachable by some aim, the bot finishes bloom levels in a few shots, the same-spot tapper still finishes level 2, and the ghost finger's aim touches the asked bud on every board.

**Couch.** In `COUCH_IDS` (unlock tier 4 with Bumper Garden), turns, twin face-off, fewer shots wins; stops 1–2 play level 4 and later stops level 5 (`demoLevel: 4`). The couch keeps those levels whatever this dive adds.

**Known gaps found reading the code.** Gaps 1–6, 8 and 9 are fixed (slice 1, built 2026-10-21), 7 and 10 are fixed (slices 2 and 3, built 2026-10-22); 11 and 12 stay open.

1. **Taps while a pearl falls do nothing.** `down()` returns while `this.ball` is set. A fall takes two to four seconds, so at lap level 1 most of a one-year-old's taps get no answer at all, which is the age where every touch should respond.
2. **Taps beside the board do nothing.** The touch layer's hit area is the board (`BOARD.w × BOARD.h`), and the board is scaled down and centred with the sea showing either side; the sea takes no input.
3. **No touch-down feedback on a drop.** The only sound is `sfx.pop` as the pearl appears; nothing marks where the finger landed.
4. **Level 3 cannot be guaranteed to finish, and luck counts as error.** The stall guard runs only in `bloom` mode, and every drop has random drift, so a well-placed tap can miss an orange bud by chance and be counted as a miss that lowers her level.
5. **The level 3 hint points at the wrong thing.** The arrow is over the orange bud, but her action is choosing a spot on the top ledge; the place to tap is never shown, although `dropAt(..., early = true)` already computes it for the bot.
6. **The level 3 hint never clears.** After an orange bloom only `wrongs` resets; `hinting` stays true, so the arrow stays for the rest of the round and later struggles count no second hint.
7. **Fixed (2026-10-22). Numbered buds bloom when any shot touches them.** At levels 4–5 a pearl that brushes 2 and 4 on the way to 3 blooms all three, so blooms stop showing what is done (Bumper Garden's out-of-order touch only chimes).
8. **No cancel handling.** There is no `pointercancel` listener: a cancelled aim (a system gesture, a palm) leaves `aiming` set and the guide drawn until the next pointer-up.
9. **The how-to card is wrong at level 1.** Its finish line says the round ends when the requested flowers have bloomed; level 1 ends after six pearls with nothing requested.
10. **Fixed (2026-10-22). One look.** One grid, one sea, one pearl; replay changes only which places are filled.
11. **The aiming jump.** Level 3 to level 4 changes the input (tap the ledge → drag a launcher) and the goal (any orange → one numeral) at once.
12. **A pearl can wedge on the original `rows` shape (found 2026-10-22, open).** Its seven-bud rows leave 27 units between the outer bud and the wall, less than a pearl's 30-unit width, so a pearl dropped near the wall can wedge there until the 10-second cutoff ends the shot; a pearl let go with zero drift exactly over a bud can also balance on it (same cutoff). Left alone because changing `rows` changes couch boards (the couch keeps `rows`); the newer shapes keep bud centres at least `EDGE` (64) from the side walls. A follow-up decides whether couch gets a new course version or a wider-wall fix.

**Separate from the rules:** the flaky `BROWSER_SUITE=batch BATCH_ONLY=pegs` touch case is [chunk-table item 12](../ROADMAP.md#chunks) on the roadmap; this dive does not make it a slice.

**Person checks.** [DEVICE-CHECKS](../DEVICE-CHECKS.md) lists physical play for Peg Garden (reachable goals feel reachable, motion slow enough). Journal, picnic: none.

## Similar games

*Opened* pages were read this session; *search summary* means seen only through search results; *recalled* was not re-checked at a source.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Peggle](https://en.wikipedia.org/wiki/Peggle) (opened) | Aimed peg shooter, PopCap 2007 | 55 levels in sets of five; a random 25 of ~100 pegs are orange and clearing them wins; green pegs give a master's power, one of which shows the ball's path with bounces; a moving catcher at the bottom gives a ball back | The aimed launcher and "clear the special pegs"; a path preview as a *power*, which is how the full-path hint already works; a catcher at the bottom as a target | The ten-ball budget and level restart, the score multiplier and style points, the Extreme Fever bins |
| [Peggle Blast](https://www.destructoid.com/reviews/review-peggle-blast/) (search summary of Destructoid and [Macworld](https://www.macworld.com/article/224780/freemium-field-test-peggle-blast-adds-too-many-barriers-to-popcaps-classic-peg-popping-game.html)) | Free-to-play mobile Peggle | Level maps gated by lives and energy; failing a level costs energy; waits or payment to continue | Nothing new; it is the counterexample | Lives, energy, waits, purchases: everything the island rules out |
| [Pachinko](https://en.wikipedia.org/wiki/Pachinko) (opened) | Japanese arcade gambling machine | Balls fired up a track fall through pins; pockets and machine-controlled "tulips" pay out more balls; modern machines add jackpots and "reach" sequences | The falling cascade of many small bounces; the sound of pins | Payout pockets, jackpots, "reach" anticipation, any odds that change: gambling mechanics (the article cites high problem-gambling rates) |
| Plinko, *The Price Is Right* ([fan wiki](https://priceisright.fandom.com/wiki/Plinko), search summary) | Game-show peg board | Earn chips, drop each from the top, win the value of the slot it lands in | Slots along the bottom as a visible result of a drop | Money values per slot, a $0 slot next to the jackpot: chance dressed as reward |
| [Galton board](https://en.wikipedia.org/wiki/Galton_board) (opened) | Probability demonstration | Many beads through rows of pegs pile into a bell shape in the bins | Many pearls dropped from one place piling into bins as a picture graph: an unscored "where do most land?" for school | Claiming one drop is predictable; the eugenics history the article notes is no part of a child's game |
| Sushi Cat ([MobyGames](https://www.mobygames.com/game/65672/sushi-cat/), [TouchArcade](https://toucharcade.com/games/sushi-cat), search summary) | Flash and iOS pachinko, 2009 | Move the cat along the top, drop it; it eats sushi on the way down and visibly swells; fill the belly in a few drops | A *character* that falls and changes as it collects (already named in IDEAS as Peg Garden's relative); the drop position chosen along the top, as levels 1–3 do | A limited number of tries per level, score bins, power-ups |
| Gorillas, QBasic (*recalled*; IDEAS' Toss Across) | Artillery game | Change angle and power; the last arc stays on screen | The **last shot's trail stays faint** so the next aim is a correction, not a guess | Throwing at a character |
| Hape Pound and Tap Bench ([Well.ca listing](https://well.ca/products/hape-toys-pound-and-tap-bench_67218.html?cat=4961), search summary) | Wooden toy, 12 months+ | Pound a ball through and it lands on a xylophone and plays a note | A falling ball that *plays notes* as it lands is a one-year-old's whole game; Peg Garden's bells already do this | — |
| Object permanence box (Montessori; [IFIT Montessori](https://ifitmontessori.ca/products/object-permanence-box-with-tray-plastic-ball), [Lovevery](https://babylist.com/gp/lovevery-hide-find-drop-box-baby-toy/46244/1861884), search summary) | Infant material, ~6–12 months | Drop a ball in a hole; it vanishes and rolls out into a tray | A pearl that disappears and comes *back* where she can see it: a tray along the sand that collects the round's pearls | Age labels are vendor guidance, not a developmental standard |
| GraviTrax, Ravensburger ([The Game: Flow listing](https://www.mightyape.co.nz/product/gravitrax-the-game-flow/35836697), search summary) | Marble-run construction, 8+ | Task cards of rising difficulty: a fixed start and goal, place given pieces so the marble reaches it | **Place one or two pieces, then run it, then revise**: the design loop for a pre-K/school level | Small parts; the 8+ precision |

**Learning references.** NGSS [K-PS2-1](https://www.nextgenscience.org/pe/k-ps2-1-motion-and-stability-forces-and-interactions) (opened): compare the effects of different strengths or directions of pushes and pulls on an object's motion, including "two objects colliding and pushing on each other". The roadmap's physics strand (later horizons) puts Peg Garden with Sink or Float and Bouncy Launch under *predict and observe; compare two trials*, then *change one variable*. A Galton board is a common probability demonstration; Common Core places probability in grade 7 (*recalled*), so any school use here is noticing and a picture graph, not probability. Off-screen: the game's marble-on-a-tray suggestion is flagged in the [off-screen companions study](subjects/off-screen-companions.md) because a marble is a choking hazard for the youngest players.

## What makes sense here

Peg Garden's distinct strengths among the island's ball games are the **cascade** (many bounces, many bells, from one touch) and the **aimed shot whose path is exact** (`simulate()` predicts it perfectly). Bumper Garden owns ball-in-play counting, patterns and colour negation; Bouncy Launch owns predicting a landing distance. So the ladder grows along three lines that only this game has:

- **For the youngest:** every touch makes a pearl, and the pearl's bells are the reward. The family review asked whether lap play finishes reliably: level 1 already ends after six pearls, so the real gap is the touches in between that get nothing (gaps 1–3), and a bigger, simpler board for lap.
- **For preschool and pre-K:** aiming should be *understood*, not guessed. The family review asked whether older players can tell what a shot will do. Answer: a gentler first aiming level with the whole path shown, the last shot's trail left faint on the board so the next shot is a correction, and a hint that shows where to act (the ledge spot or the full path), not only what to hit.
- **For later:** where the pearl *ends up* (cups at the bottom: Into the cup), and changing the board to steer it (plant a bud: GraviTrax's place-then-run loop). A school window would add "where do most land?" with many pearls (Galton) as an unscored picture graph; the game's bands end at pre-K by design (IDEAS' younger-ladder note), so that stays a decision.

Fits: every touch answered, bigger lap buds, board themes, a drop-spot hint, the faint last trail, cups, planting a bud, a tray where the pearls collect. Does not fit: ball budgets, restarts, scores and multipliers, payout slots or jackpots, any odds that change, timers or a moving catcher that has to be timed.

**Rework fit** ([creature-world brief](../rework/README.md)): a sea creature (a little octopus or crab) could live in the garden and ride the pearl, or a garden theme (coral, kelp, tide pool) could become a permanent unlock through play. Pearls must not become a currency: a falling ball with collectable payouts is exactly the pachinko loop. Both hooks need the rework's unlock and companion systems and are decisions, not ready slices.

## Experience and presentation

**First unsupported action.** Lap: touch anywhere on the screen and a pearl falls from above that spot and rings the buds. Toddler: drop pearls until every bud blooms. Preschool: choose a spot on the ledge that reaches the orange buds; then drag the launcher with the whole path shown.

**Pleasure and feedback.** Touch-down: a ring of bubbles where the finger lands (even beside the board: the nearest ledge point gets the pearl) and a soft `sfx.pop`; the pearl appears with a little squash. Consequence: each bud opens with a bell on a pentatonic step by height, a star burst, and a 1.35 scale-pop. Return to readiness: the pearl rolls into a shell tray in the sand, where the round's pearls sit in a row, visible, then pour back to the top at the finish (the object-permanence box's "it comes back").

**Art and feel example (code-drawn, existing tools).** A shell tray along the sand drawn with `Graphics` (two arcs and a scalloped edge in `swatch.pink`), each finished pearl sliding into its next notch with `ctx.tw`; and during a fall, taps make a `puffs()` bubble cluster rise from the touch point with a low `sfx.pop`, so a mashing hand still sees and hears every touch without a second pearl to track. No new rendering system.

**Variety on replay without changing the rule.** Board themes from a seeded pool (staggered rows as now, an arch, a heart, two kelp columns), backdrop (open sea, tide pool, coral), petal colours, and at the lap entry which friend sits in the middle. Every board shape is simulated in the rule tests.

**Reasoning versus memory and motor precision.** Levels 1–2 ask for no precision. Level 3's reasoning is "drop above it", which drift currently blurs; the hint makes it exact. Aiming is a cognitive judgement of an angle, not a timed act: nothing moves until she lets go, and she can drag as long as she likes. No reading: numerals are spoken on request (the instruction repeats) and drawn large.

**Supported completion and stopping.** Every level ends with help: the stall guard at 2 (and, proposed, at 3), the full path at 4–5, the drop-spot ring at 3. Stopping mid-round loses nothing.

**Co-play.** The coplay hint has a grown-up guess where the pearl will land before she lets go; Into the cup makes that guess concrete. Two people can share a round: one chooses the cup ("put it in the cup with four"), the other aims. Solo stays complete.

**Needs a person or device.** Whether a one-year-old notices the pearl's fall or only her own touch; whether bubble feedback during a fall is enough or she wants a second pearl; whether the faint last trail helps a four-year-old correct or reads as clutter; whether dragging the launcher on an iPad is comfortable for a preschool hand (the drag radius is the whole board); and the existing physical-play check.

## Proposed ladder

### Fresh content inside existing levels

- **Every touch answers (levels 1–3).** A touch anywhere on screen, including the sea beside the board, counts: beside the board it maps to the nearest ledge point. A touch while a pearl falls makes a bubble ring and pop at the finger, never a miss and never a second pearl at 2–3; at level 1 it queues the next pearl (at most one waiting) so a lap child's tap is never lost.
- **A fair colour level (3).** The stall guard extends to `color`: after two pearls in a row that wake no orange bud, the next is let go over the `dropAt()` spot for a waiting orange bud. Level 3 drops with no drift, so a tap above an orange bud is a fair test and a miss is her choice of spot, not chance; the miss accounting then stands. Coupling: the ghost finger reads the drift from `ctx.rng.clone()`, so when level 3 stops drawing it the bot passes zero drift too and the rng sequence of the other levels is unchanged.
- **A hint that shows where to act (3).** On the hint, a glowing ring sits on the ledge at the `dropAt(…, early = true)` spot, the arrow stays over the bud, and the pearl drops on it. `hinting` clears after an orange bloom, so a later struggle can earn another hint.
- **Numbered buds wait their turn (4–5).** A numbered bud that is not asked only chimes and wiggles; only the asked one blooms. Plain buds still bloom when touched.
- **The last shot stays faint (4–5).** After an aimed shot, its path stays as faint dots until the next shot starts, so she sees which way it went; the live guide stays short. This is feedback for every shot, not a hint, and counts nothing.
- **Cancel handling.** `pointercancel` ends an aim without firing and clears the guide.
- **The shell tray (all levels).** Finished pearls collect in a visible tray and pour back at the finish.
- **Board themes (all levels).** Four board shapes and three backdrops from a seeded pool; `makeBoard` takes a shape and the tests run every shape (numerals reachable, bloom levels finish, specials placed).
- **True card.** Level 1's finish: "The round ends after six pearls."

### New levels on top

Appended IDs; `planFor` must look plans up by ID (today it indexes `PLANS` by position, which works only while IDs are dense, so the first new level converts it to a table keyed by ID). Couch stops keep levels 4 and 5.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Into the cup | pre-K top (pre-K `min..max` grows to 6) | Four cups along the sand show 1–4 dots; the launcher; "Put the pearl in the cup with three!" Three asks per round, each a different cup | Which angle lands the pearl in the cup with that many dots (counting dots, then aiming at a result rather than a bud) | Another cup is a miss with its count said ("That cup has two"); two misses show the full path and glow the asked cup. The faint last trail helps correct | For every seeded board and every cup, some aim lands in it with ±0.012 rad margin (`simulate().landed.x`); the ghost finger lands each ask; asks are distinct | Cups art, three voice lines, `aimAt` extended to a landing predicate, how-to steps for 6, a browser case and `fingerdemo` at 6. Couch: not added (a decision; needs a course version) |
| 7 | Plant a bud | pre-K top, after 6 | One drop spot fixed at the top, a friend's cup at the bottom the pearl misses as the board stands; two bud seeds in a tray: "Plant a bud so the pearl reaches the cup." She drags a seed onto one of the marked empty places, then taps the drop | Where a new bud will push the pearl (K-PS2-1's direction of a push), then revise | A run that misses keeps the planted buds; she can drag them again. Each missed run counts a miss (a default the build uses, listed as a decision: the board is visible, so a run is a deduction, not a free experiment); two show one place that works with a faint seed outline. Tapping the drop with nothing planted is a free look, not a miss | Every board: the unplanted run misses the cup; at least one single-place planting reaches it; a hinted place reaches it; the bot plants and finishes | New drag on `engine/drag.ts` with nearest-place snapping (places at least 100 units apart on screen), deterministic drop (no drift), voice, how-to, bot, browser case |

### Younger-band openings

- **Lap entry, level 8 *Big buds*.** Four huge buds (each at least 110 units across on screen) and a friend critter in the middle row; the whole screen is the touch area, each touch drops a pearl straight above the nearest bud (no drift), so every touch blooms something; touches during a fall queue one. Bloomed buds close again after a moment so there is always something to open. Ends after eight pearls; no misses. Lap order `[8, 1]`, toddler order `[8, 1, 2]`, `entryLevels: [8]` so a child saved at 8 who turns toddler lands safely. A rule test asserts each of the four drop columns touches its bud on every seeded board and the round ends at eight.

### Easier entries and levels between existing ones

- **Preschool bridge, level 9 *Aim at the big flower* (proposed ID 9).** Between 3 and 4: one big golden bud (radius about 1.6× a plain bud) among plain ones, the launcher, and the **whole path always shown** while she drags. Three shots, each to a newly placed golden bud. A shot that misses is a gentle boing and no miss (she can see the path, so the miss is an experiment with the tool); two misses glow the bud. Preschool order `[2, 3, 9, 4]`, pre-K order `[3, 9, 4, 5, 6, 7]`, `entryLevels` unchanged (9 is not a band's lowest). A rule test asserts every golden bud is reachable with margin. Its no-miss accounting is a lean, recorded as a decision because the shot has a goal.
- Placing level 8 in the lap and toddler orders and 9 in the preschool and pre-K orders uses the built `order`/`entryLevels` support; no saved level is renumbered.

### Left out on purpose

- Ball budgets, level restarts, scores, multipliers, high scores (Peggle).
- Payout slots, jackpots, "reach" sequences, money values per slot, changing odds (pachinko, Plinko).
- Lives, energy and waits (Peggle Blast).
- A moving catcher that must be timed, faster pearls, shot clocks.
- Count on, count back, patterns, not-this-colour and make five: Bumper Garden's ladder owns them on a ball table.
- Predicting a landing distance: Bouncy Launch owns it.

## Decisions for the developer

1. **School window and *Where do most land?* (proposed level 10).** Ten pearls dropped from one chosen spot pile into four bins as a picture graph; she first taps the bin she thinks will get the most (unscored), then compares a drop from the left. Lean: wait for a school-band reason and the physics strand's *change one variable* work; the game's bands end at pre-K by design.
2. **Level 9's accounting.** Lean: a missed shot at the bridge level is not a miss, because the whole path is shown and it is the first time with the launcher; a goal with no misses departs from "a wrong answer is a gentle miss".
3. **Couch.** Whether Into the cup joins couch stops (a new course version) — lean: not until it has been played on the island.
4. **Defaults the build uses:** level 7 counts each missed run as a miss (a free look with nothing planted is never one); level 8 plays in lap and toddler (`[8, 1, 2]` for toddler) until a person watches a toddler with it.
5. **Rework hooks.** A garden creature that rides the pearl, and board themes unlocking permanently through play; never pearls as a currency. Lean: wait for RW05+ unlocks.

## Build slices, in order

**Routine batching (developer, 2026-10-21):** the numbered slices below are scope/dependency substeps. [READY](../READY.md) dispatches related substeps together using the [`peg-garden` batch plans](../GAME-BATCHES.md#batch-plans): one declared batch per worker/PR, prerequisite substeps first, with existing gates and special checks preserved. Do not create a new session for each numbered level in a claimed batch.

1. **Built (2026-10-21): Every touch answers, a fair colour level and a true card** (existing-game bug-fix tier: typecheck, `logic.test.ts`, one filtered regression play `BROWSER_SUITE=batch BATCH_ONLY=pegs` at levels 1 and 3, `fingerdemo` at 3 because the hint changes the bot's spot; that case is the known flake in [chunk-table item 12](../ROADMAP.md#chunks), so a failure is probed once and recorded, not looped). Gaps 1–6, 8 and 9: whole-screen touch, bubble feedback during a fall, the level-1 queue, no drift at 3 (the bot's drift read follows), the stall guard and drop-spot ring at 3, `hinting` reset, `pointercancel`, the card's level-1 finish. Rule tests: the colour level finishes when the same spot is tapped every time; the hinted spot touches a waiting orange bud on every board.
2. **Built (2026-10-22): Numbered buds wait their turn and the last shot stays faint** (batch `peg-garden 1`, with slice 3, PR #770; existing-game change: typecheck, rule tests, one filtered play at 4 and 5). Gap 7: only the asked numeral blooms (`blooms()` in `logic.ts`; any other numbered bud chimes and wiggles, plain buds still bloom), and each aimed shot's recorded path stays as faint dots until the next shot starts (feedback, counts nothing). Two new level-4+ steps on the how-to card.
3. **Built (2026-10-22): The shell tray and board themes** (content: typecheck, rule tests over every shape, one screenshot per backdrop). Gap 10: finished pearls roll into a scalloped shell tray (`TRAY`, `traySlot`, 12 visible slots) and pour back at the finish; four shapes (`SHAPES`: rows, diamond, hourglass, waves) and three backdrops (`BACKDROPS`: shallows, reef, kelp forest) drawn from the round's seed by `pickTheme`; `makeBoard(plan, rng, shape)`. Couch keeps the first look (rows, shallows) and draws nothing, so its boards are unchanged.
4. **Built (2026-10-23): Level 8 *Big buds*, the lap entry** (batch `peg-garden 2`; new interaction: typecheck, unit tests, one scripted play at 8, `fingerdemo` at 8, one portrait screenshot). Plans keyed by ID, `order` and `entryLevels`. Built as the `big` mode (`BIG_PLAN`, `BIG_SPOTS`, `planFor`): four buds of radius 60 in a diamond, every touch drops a pearl, no misses or hints; lap order `[8, 1]`, toddler `[8, 1, 2]`, `entryLevels [8]`. Portrait screenshot and a real toddler not yet checked.
5. **Level 6 *Into the cup*** (new interaction: as slice 4, at 6). Needs the plans-by-ID change from slice 4 or makes it itself.
6. **Level 7 *Plant a bud*** (new interaction, after slice 5: as slice 4, at 7).

**Findings for the aimed slices (4–7), from slice 1.** The couch bot cannot cope with exact physics: `bestAim` uses a margin of 0.012 and falls back to 0 (straight down), and `autoplay` fires anywhere within 0.015 of its chosen angle, so with exact fixed steps at an aimed level it can repeat one losing shot forever (frame jitter had hidden this). Slice 1 steps fixed 1/240 s only for dropped pearls (levels 1–3); aimed levels and couch keep frame-step physics. `BROWSER_SUITE=couchgames COUCH_ONLY=peg-garden` failed intermittently on the branch (the bot never finished: 1 hint, 44–57 misses; 1 in 3 runs) while origin/main's game code passed 4 of 4; the cause is not established, and the final guarded code's couchgames was not run. Probe it before changing aimed levels. Also: Pixi 8 never forwards DOM `pointercancel`, so Fruit Slice's `this.layer.on('pointercancel', …)` (`src/games/fruit-slice/index.ts:155`) is dead code; a follow-up is to listen on `window` as Peg Garden now does (not done).

Gated and not in the ready list: level 9's accounting (decision 2; the level is otherwise defined), level 10 and the school window, couch, rework hooks.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Checks run: `node scripts/check-links.mjs` and `git diff --check`.
