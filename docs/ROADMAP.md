# Puddle Island roadmap

This is the ordered development backlog for growing Puddle Island from early play through **elementary school, roughly kindergarten–grade 5 (ages 5–11)**. Checked items describe completed implementation milestones; unchecked items are remaining work or proposals. A proposal is not a commitment to ship it. Test results belong in [VERIFICATION.md](VERIFICATION.md), current behavior in [DESIGN.md](DESIGN.md), and game concepts in [ARCADE-IDEAS.md](ARCADE-IDEAS.md).

## Current position

The island has **72 games** in five age-trail places, with pet hatching, adaptive levels, a sticker book, and a first short story, **the Windy Picnic**. Everything through Tangram Town (43 games) was pushed to `main` in `17124e8`. The early-school band and its place, **Wonder Woods** (ages 6–8), Peekaround Island and nineteen more games (Light Lab, Penguin Slide, Secret Code, Frog Hop, Market Stall, Garden Grow, Clock Tower, Pixel Pictures, Goodnight Room, Animal Snack, Beat Builder, Rhyme Time, Stop and Go, Ramp Race, Critter Sort, Treasure Map, Opposites, Picture Graph and Inchworm Measure), with longer ladders (Robot Path loops, Word Monsters word families, Duck Pond make-ten, Monster Munch leftovers), were committed in `dfe08a3`. Each has rule tests and a recorded browser play-through of every level. The Windy Picnic pilot (§3), Mail Carrier's picture map and two planned stops and Seesaw Balance's take-the-same-off levels in Wonder Woods (§5), and four games from the gap review's shortlist, Block Tower, Lasso Loops, Pet Says and Owl Walk Home (§6), were committed in `cecac4c` and merged to `main` in `7066d5b`, which deployed. Each has rule tests and recorded browser play-throughs. No one has yet judged the newer games or the picnic on an iPad or watched a child play them; §1 keeps those checks open. Puddle Lagoon offers 37 games, Daisy Meadow 48, Bumpy Hills 58, Starry Peak 68 and Wonder Woods 50. **Couch play** (a separate grown-up route with controller or keyboard support) is built with fourteen games, a how-to screen before each (reachable again from the name card, the turn card, the pause menu and a menu guide), games that open as trips are finished, a face-off mode, a finale with one keepsake, text that scales for a TV, and three challenge courses, Penguin Slide's Pond Practice and Five Ponds and Bouncy Launch's Cloud Hopper, with per-player records; see §0 and [Couch play in the design doc](DESIGN.md#couch-play-2026-10-07). It has been checked in headless Chrome with synthetic controllers only; real controllers, a TV and real play remain open. Every touch game now has a grown-up **how-to card** (a quiet hold-to-open `?` under the home button; goal, steps, how the round ends and the level's own description). **Chain Reaction** is the newest game: drag loose ramps into a constrained machine, run its marble, watch where it goes and revise until it touches the chime and bell; early boards have one solution and the top level several. The pet's **treehouse** (a room with six free furnishings and a frame for one sticker) is reached from the map. Places also twinkle on games not yet played and keep a **favorites shelf** of hearted games (a heart after a round), with no gating.

Current bands are lap, toddler, preschool, pre-K and early school (`school`, roughly 6–8, at Wonder Woods). Elementary work has started as a **6–8 pilot**; then grow toward upper-elementary play through about age eleven. Learning ranges overlap; older modes and new zones remain proposals. Keep younger favorites available as reasoning, expression, investigations, and connected adventures grow.

Recommended sequence for the current prototype phase: ~~three-choice Island Party~~ (built as couch trips, 2026-10-07) → (whenever a person is free, not a blocker: try couch play on a TV with real controllers and adjust) → ~~the child's island (NEW sparkle, favorites)~~ (built 2026-10-07) → ~~deeper challenge with personal records (Penguin Slide course)~~ (built as the couch's Five Ponds challenge) → ~~a second scored game (Bouncy Launch's target course)~~ (built as Cloud Hopper) and more couch games → small pet room/creation → connected project or deeper elementary play. The developer's daughter is not yet one and an iPad is not readily available, so desktop play by the grown-ups is the immediate feedback loop. Keep device and child observations open; they do not block browser proofs of concept. The [play and progression review](PLAY-AND-PROGRESSION.md) and [party/Switch follow-up](PARTY-AND-SWITCH.md) give the research, tradeoffs, and proposed slices. A native Switch port is exploratory. Avoid making a large world framework a prerequisite for a small playable addition.

## 0. Prove longer play and meaningful goals in the browser

Checked items here are built (see the verification log); unchecked items are proposals. This is the immediate work order; the numbered sections below retain the broader backlog and outstanding validation.

**Where to pick up next session.** Most of a session should build something playable from the first list; the second needs a person or a device and never blocks the first. Check effort follows the [verification budget](../AGENTS.md#verification-budget): rule tests first, one filtered browser pass for what is new, the long suites only before a release.

*Build next (no person needed), in rough order:*

1. The pet room is built out (room, picture board, tune plaque, discovery journal), and Rainbow Fingers paintings can now share the picture board with Stamp Studio work. Small follow-ons: Pixel Pictures as another creation medium, taking a creation down, and journal entries from more games. (The child's island is done: how-to cards, a NEW twinkle and a favorites shelf.)
2. Chain Reaction is built. More games from the shortlist (§6): Story Theater, Habitat Helpers or Shape Buddies.
3. Grow the couch catalog with games that can score on seeded boards (Block Tower's fixed boards make it a team game at best; Quick Tricks and Treasure Map are candidates; Garden Rows' seeded beds would suit a twin face-off). Each is `control()`, `autoplay`, a catalog entry and a tier slot; `BROWSER_SUITE=couchgames COUCH_ONLY=<id>` proves it.
4. Deepen short ladders (§6) and give favorites a second lap level; a second picnic episode or a woodland errand (§3, §5).

*Needs a person or a device (do not wait for these):*

1. Play the couch with real Pro Controllers on a TV and write down what is wrong: text size from the couch, how long the how-to demos feel, whether the bots are a good example, how fast trips open new games, and how face-off feels to the person who loses. Everything so far was checked with synthetic controllers in headless Chrome.
2. Judge the three challenges in play (is Cloud Hopper's cloud size right for a stick? is Pond Practice easy enough and the Five Ponds hard enough? does any have a reason to run again?).
3. The iPad and child checks in §1.

Known tooling issue: `BROWSER_SUITE=batch BATCH_ONLY=pegs` (Peg Garden touch play) fails on the development Mac in most runs, on unmodified code too, at a different level each time; diagnose it before relying on it (§1). As of 2026-10-07 the couch work was pushed on the branch `couch-howto-unlocks-faceoff`, not merged to `main` (and so not deployed); check `git branch --contains 44cfbd0` before assuming either.

- [ ] Build a desktop-friendly **Grown-up Play** entry with party/course selection and a separate local adult save slot. Adult play must not change the child's level history, pins, stickers, story, or band.
- [x] Build **Island Party** (built as **couch trips**): six stops, three varied next-game choices from the opened games (a free shuffle, avoiding the last two), alternating choosers, a shared lantern goal, compact results on the chooser between stops, saved offers and progress with no duplicate awards, and ordinary couch stickers kept per stop in a separate save. The finale (a night sky, lanterns in the color of whoever took each stop, a scoreboard, the recap and what opened) and the one known keepsake (Lantern Night, from the first finished trip) are built.
- [ ] Evaluate three versus four choices, pacing, repeat avoidance, and the desire to play together in the browser before adding a dice board or more minigames. Candidate references and new cooperative ideas are in [Party and Switch](PARTY-AND-SWITCH.md).
- [x] As a separate couch-play milestone, support controller navigation and selected game actions, then two paddles in Bounce Back (built; keyboard works too). Fourteen games now have controller controls and a bot (Penguin Slide, Bouncy Launch, Bounce Back, Memory Match, Rhythm Neighbors, Light Lab, Secret Code, Peg Garden, Bumper Garden, then Pattern Train, Egg Catch, Robot Path, Frog Hop and Sink or Float).
- [x] Add a **how-to-play screen** before a couch game's first play (name, spoken goal, drawn controller, and a bot demo of a real round), a short name card afterwards, and "How to play" in the pause menu. Couch wording replaces spoken lines that tell a touch player to tap or pull.
- [x] Make How to play reachable even for a game already explained: the name card and a face-off turn card have a How to play button (moving to it makes the name card wait instead of starting the round), and a **How to play** guide on the couch menu lists every open game and plays its demo without starting a round or touching the trip.
- [x] **Earn games by finishing trips**: three games at the start, then two per completed trip (either mode), derived from the trip count so reloads and restored backups cannot award twice; a NEW mark until explained; the next group announced by size, not by name. Nothing locks again or expires, and the child's island is untouched.
- [x] **Face-off trips** beside Together trips: each player on their own fresh board scored against its own best (slides over the best route, extra turns, guesses, shots, distance from cloud centres), one shared board with alternating turns (Memory Match), or a team stop. Ties and team stops score for both; no loser screen. The first turn is saved so leaving between turns changes nothing.
- [ ] Try the couch on a TV with real Pro Controllers: text size across the room (couch pages now scale to about 1.4 times at 1080p, untried on a real TV), how-to pacing and demo length (the longest, Secret Code and Bumper Garden, run about 30–40 seconds), whether the bots feel like a good example, how many trips per unlocked group feels right (two per trip now; a tier per trip is a guess), whether the finale's four-second ceremony is a treat or a wait, whether Pond Practice, the Five Ponds and Cloud Hopper each give a reason to play again (and whether a hint after three extra slides, or two missed launches, is too soon for a score chase), whether Cloud Hopper's small clouds suit a stick, and whether the spring that squashes straight down reads well or the launcher wants to become a catapult.
- [x] Grow the couch catalog past nine so unlocks stay meaningful: Pattern Train, Egg Catch, Robot Path, Frog Hop and Sink or Float, in three more tiers (2, 2, then 1 game). All five are team games: Robot Path's boards are fixed per level and Egg Catch would mostly tie, so neither could be a fair twin face-off, and the other three are gentle by design (guesses are never wrong in Sink or Float). Coverage: the catalog tests and `BROWSER_SUITE=couchgames` (written, not yet run: see the verification log).
- [ ] Grow it further with games that can score on seeded boards, so face-off trips are not mostly team stops: candidates are Garden Rows, Treasure Map, Quick Tricks and Block Tower. Owl Walk Home (a cooperative child's game) was considered and set aside.
- [x] The child's island, a grown-up **How to play** card for every touch game (`src/content/howto.ts`, opened by holding a quiet `?` under the home button; adds the level's own description, holds the round still, changes no progress). The NEW twinkle on unplayed games and the favorites shelf (a heart after a round; §2) are built too.
- [ ] Let the daughter join couch play as a co-pilot (any button cheers; a pet takes the other side), and consider simultaneous face-off boards.
- [x] Build **Penguin Slide's five-board course** as one complete round (built as **The Five Ponds** on the couch): five fixed boards chosen with the solver (each with one shortest route; 3, 5, 6, 7 and 9 slides, 30 in all), a short score for each pond and straight on to the next, visible progress, pause/leave, one result and one sticker. The child's levels are untouched.
- [x] Show total slides and a local personal best for the same versioned course, with explicit undo and assistance rules (a slide you undo still counts; a shown hint marks the run helped). Helped and unhelped bests are kept apart, per player. Two badges, each earned once per player: Finished, and Perfect route (the minimum, no hint).
- [x] Save course progress, records and achievements with bounded storage (one run, one best per category per player, ten recent runs, three retired versions), migration (couch save version 3), the couch backup, and no duplicate awards after reload; child-save isolation is checked. Still open: the production offline check does not exercise couch play, so it has not been run for the course.
- [ ] Play the slice on desktop and judge pacing, the desire to try another strategy, and clarity of the goal. Five to ten minutes is a hypothesis, not a timer. If five easy boards feel repetitive, deepen the decisions before adding quantity.
- [x] Extend scoring to **Bouncy Launch** with a longer target course and a personal attempt record (built as **Cloud Hopper** on the couch): twelve small clouds in a row, every launch counted (a miss included), a hint after two misses at one cloud, the same per-player records, badges and one-sticker-per-run rules as the Five Ponds. The rules module turned out generic (`src/couch/course.ts`, with `src/couch/courses.ts` as the registry), so the shared helpers are extracted; competitive scoring on the party route is still open.
- [x] Build the small pet room in §4, beginning with free furnishings and one display (built); a saved picture and song are built too. Use known achievements/keepsakes for lasting goals, with ordinary stickers remaining repeatable decorations.

Local personal records come before an optional family board; public leaderboards remain a later adult-mode option. A later opt-in Keep playing mode can reduce celebration interruptions in selected ordinary games while preserving one sticker per completed round and the session setting's goodnight flow. Do not force scores onto creative or exploratory play. Full proposal and acceptance checks: [Longer play and personal goals](PLAY-AND-PROGRESSION.md).

## Elementary horizons

The detailed [elementary roadmap](ELEMENTARY-ROADMAP.md) covers game families, zone concepts, project ideas, dependencies, and completion milestones. These are development horizons, not dates or grade locks.

| Horizon | Main work | Proposed places |
| --- | --- | --- |
| **E0 — Foundation** | Reliable current catalog, easier discovery, Windy Picnic, pet room and journal beginnings | Existing island |
| **E1 — Early elementary** | Balancing, editable routes, maps, short clues; initial 6–8 pilot | Wonder Woods |
| **E2 — Middle elementary** | Equal groups/fractions, word meaning, evidence in stories, construction and saved creations | Maker Harbor and Storybook Square, one expansion at a time |
| **E3 — Upper elementary** | Fraction/decimal models, area/volume, data, fair tests, longer programs and projects | Discovery Marsh and Skywatch Isles |

Use a small expansion pattern: deepen two familiar games, add at most one new interaction, and connect them with a place or optional project. Not every expansion needs a new zone. New zones should have stable identities independent of learning bands; preserve the current trail and return behavior while that separation is introduced in E1.

## 1. Finish and verify the current work

The automated checks for the ten newest games are done; what remains for them needs a person, the iPad, and ideally the child. These are validation obligations when the device and appropriate players are available, not a gate on §0's desktop prototypes. New implementation still needs its applicable automated/browser checks.

- [x] Rule tests for the ten newest games, and browser play-throughs of all 52 of their levels with gentle misses, hints, saved miss/hint counts and stickers (`BROWSER_SUITE=batch`), driven like a finger would.
- [ ] Judge Word Monsters and Photo Safari: vocabulary, spoken prompts, answer clarity, replay, and whether device speech actually produces usable letter sounds. Avoid claiming phonics coverage from letter-name playback alone.
- [ ] Judge Peg Garden and Egg Catch on the device: reachable goals feel reachable, motion is slow enough, catches and routes feel forgiving, orientation, and hints that teach the next action.
- [ ] Judge Fluffy Salon and Sound Garden: satisfying free play, clear exits, repeatable instructions, and guided modes that preserve creative exploration.
- [ ] Judge Little Helpers and Mail Carrier: visible quantities and unambiguous requests at a child's viewing distance. (End-of-round accounting is covered by the play-throughs.)
- [ ] Judge Bounce Back on the device: two real hands at once, the pet taking over the paddle, soft returns, shared rally goals, and whether mistakes/hints fit cooperative play rather than penalizing exploration.
- [ ] Judge Dot Link: whether drawing a line through dots is easy for small fingers and whether chains and squares read clearly.
- [ ] Judge the earlier four on the device: whether seesaw tipping reads as weight, whether Teddy Doctor's clues are clear when only spoken, whether Bumper Garden's half-screen flipping feels natural to small hands, and whether Quick Tricks' arrow between tricks is understood.
- [ ] Judge the Wonder Woods games on the iPad: whether Light Lab's mirrors read as turning the beam, Penguin Slide's tap-the-ice direction, Secret Code's marks, Frog Hop's number line, Market Stall's coin sizes, Clock Tower's hand dragging (outer ring for the long hand), and dragging Inchworm Measure's worms and reading its ruler. Judge Garden Grow, Goodnight Room, Animal Snack, Stop and Go and Opposites with her now: whether tapping the soil, the singing flowers, and saying goodnight hold a one-year-old's attention. Judge the new ladder steps (Robot Path loops, word families, make ten, leftovers) and Pixel Pictures' logic puzzles with an older child.
- [ ] Judge Peekaround Island: whether turning reads as looking from another side, whether a friend disappearing behind the crown reads as "behind", and whether the island's drop spots are easy to hit. Judge whether the Little Helpers bunch reads as equal teams.
- [ ] Judge Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town on the iPad: stamp selection and moving, visible equal wholes/pieces, understanding the reply score and finish controls, and silhouette/rotation help. Judge the second Quick Tricks show and paired mystery boxes too.
- [x] Rule tests and browser play-throughs for the remaining original games: Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, and Color Garden (`BROWSER_SUITE=originals`, 48 levels), plus rule tests for Pattern Train. Every game now has rule tests.
- [x] Run the combined browser flow (every suite in one run) and record it: passed at `da6860b`. Later changes are checked with the suites they touch; save the full run for occasional release checks.
- [x] Promote the ten into the README inventory, DESIGN status, and the arcade notebook, with counts taken from the registry.
- [ ] Judge the newest additions with her and on the iPad: the Windy Picnic (does she understand who needs help, what to try and what changed; are the blanket and request targets easy to hit; does the journal make sense), Block Tower's tumbling for her now and its eighth-of-a-block dragging for an older child, Lasso Loops' loop gesture with small fingers, Pet Says as co-play, Owl Walk Home's turn-taking, Mail Carrier's key at a child's viewing distance, and whether Seesaw Balance's tipping explains "do the same to both sides".
- [ ] Diagnose the flaky Peg Garden touch suite (`BROWSER_SUITE=batch BATCH_ONLY=pegs`): aimed levels 2–5 failed at different levels in four runs on the development Mac, on the original code as well. It computes shots by simulation and drives them with synthetic touches; a frame-timing difference between the simulation and the live game is a guess, not a finding.
- [ ] Check the real iPad: offline speech, first-touch audio, small-hand dragging, herding and pulling, orientation, installation, and Guided Access. Preserve these as outstanding until performed on the device.

Done when each addition has verified rules, a completed round at every level, mistakes/hints where applicable, portrait layout, reward/save reload checks, and an honest verification entry. Existing round completion still awards one sticker, including with help.

## 2. Make the larger catalog easy to explore

- [x] Prototype a place layout with clearly separated subject clusters and a few large choices visible at once: grown-up Finding games → Subject cards. Four choices per page; all places remain open.
- [ ] Compare that layout with the current swipe-and-arrow path on the iPad. Choose based on reaching and returning from a desired game, not fitting more icons on screen.
- [x] Retain spoken subject/game names, touch-down feedback, swipe cancellation, remembered position, and home returning to the launching place and band in both layouts.
- [x] A small favorites shelf (built 2026-10-07): a heart beside the sticker after a round keeps the game; a place shows up to five on a shelf above its games, and the subject layout leads with a Favorites card. A gold twinkle marks games she has not finished a round of. Nothing gates, rotates or expires. Still open: a familiar host per subject, and whether the iPad comparison says the shelf is found and used.
- [ ] Verify every supported game is reachable in every supported band, including after a catalog grows and in portrait.

Done when a child and grown-up can find a known activity, discover another, and return without losing their place. Reorganizing subjects must not alter saved game IDs or reset progress.

## 3. Connect the games: Island Errands pilot

Design: [Island Errands in the idea notebook](ARCADE-IDEAS.md#island-errands-a-first-adventure-48-l). Target roughly 4–8 with support adjusted per activity.

- [x] Write **The Windy Picnic**: one recurring character (Juniper the gardener bunny), one picnic scene on the island map, and three illustrated requests (a blanket found in the scene, sandwiches shared in a Pet Kitchen round, an invitation played in a Jelly Drums round) with a final picnic.
- [x] Make a picture journal that replays each request, recaps completed steps with a picture of what changed, and points straight to the next one with a green arrow. Free play stays available throughout.
- [x] Prototype completing suitable rounds as story steps (at a level chosen per band, without moving the game's own level). The extra result data needed to carry an exact quantity or tune into the picnic is specified, unimplemented, in [DESIGN.md](DESIGN.md#proposed-story-results).
- [x] Save after each step and resume after a goodnight or reload. Step completion and the ending are idempotent; replaying a round or retelling the story never duplicates the keepsake.
- [x] Give assisted completion the same story ending. Nothing expires or is lost, and no level or repeat quota blocks the story.
- [x] Finish with the prepared picnic and one known keepsake (Juniper's photo, kept in the journal). Each completed game round still gives exactly one sticker; the story adds none.
- [ ] When an appropriate child playtest is possible, observe whether the child understands who needs help, what to try, and what changed. Meanwhile, use adult browser play to refine the pilot or prototype a small episode with a distinct new consequence; label child comprehension unverified.

Done when the whole adventure can be played, left halfway, resumed offline, and finished with help; all original games remain independently playable. Child comprehension is a separate validation milestone. Consider a second episode (a missing melody or a mixed-up delivery) after adult evaluation of the pilot; introduce a reusable story format only when that episode needs it.

## 4. Give the pet a home and the child a collection

Design: [Pet Treehouse and Discovery Journal](ARCADE-IDEAS.md#pet-treehouse-and-discovery-journal-all-ages-with-support-l).

- [x] Build one treehouse room with six free furnishings, move/turn controls, and a place to display an earned sticker. Displaying never consumes the sticker. (Built 2026-10-07: `RoomScene`, reached from the map; see [DESIGN](DESIGN.md#pet-treehouse-built-2026-10-07).)
- [x] Let the pet use its room in small, playful ways. Care happens during play; hunger, dirt, sadness, or construction waits never accrue while away. (A nap in the bed, a dance on the rug, reading, watering the plant, a tune from the music box, the lamp; nothing accrues.)
- [x] Bounded, locally saved creations (built 2026-10-07): the picture board holds either a Stamp Studio picture or an open-ended Rainbow Fingers painting, and the tune plaque holds a free Song Maker song. Each is kept only when she taps the tree house button after the round, each has the one before it to bring back with an undo arrow, and paintings are bounded normalized marks rather than bitmap blobs. Code-drawn, synthesized playback. Still open: Pixel Pictures as another medium, taking a creation down altogether, and a round that ends because the session's time is up goes straight to goodnight, so there is no chance to keep that one.
- [x] A small discovery journal (built 2026-10-07): sixteen known entries, nine Sink or Float things and seven Animal Snack animals, filed when a round actually shows them, each with a picture, a spoken observation and (found or not) a green arrow to the game that shows it. No random rare items or calendar availability. Still open: entries from more games (Photo Safari, Seesaw Balance, Bouncy Launch), notes she can add herself, and showing where in a game an entry was found rather than only which game.
- [ ] Add deterministic keepsakes only where they represent a story/discovery; provide the starter room without earning anything. Keep the existing sticker reward predictable.
- [ ] Define save defaults, limits, backup/restore behavior, and migration tests for room placements, creations, journal entries, and story progress. Check placement after resizing and offline reload. (Done for the room's placements, frame, picture, song and journal: bounded, repaired on load, round-tripped through a backup; still open: the offline reload of a rearranged room, a kept creation or a journal.)

Done when the room feels personal with its starter kit, creations can be revisited, and taking a long break has no adverse consequence. A currency, marketplace, trading, and online social layer are outside this pilot.

## 5. First elementary zone (initial 6–8 pilot)

Start with **Seesaw Balance**, a **Robot Path** loop mode, and a small **Mail Carrier** map mode. Bring them together in **Wonder Woods**, the E1 pilot in the [elementary roadmap](ELEMENTARY-ROADMAP.md#e1--prove-an-early-elementary-zone). They test concrete reasoning and planning while keeping the first zone small. Names and exact scope can change with play observations.

- [x] Define a support ladder for Seesaw Balance: compare visible weights → make equal totals → infer a hidden weight, with fixed trays so weight and lever distance are not confused. Built for toddler–pre-K (seven levels, up to finding one of two identical mystery boxes), then levels 8–9 for 6–8: take the same off both sides until a box is alone (boxes on both sides at the top), where one-sided changes tip it without counting as misses. Two different unknown weights remain open.
- [x] Prototype Robot Path loops with step-through playback, editable commands, and an obvious undo. Keep existing levels intact. (Levels 7–10: counted steps, then a loop button; playback lights the running slot; tapping a slot removes it and what follows.)
- [x] Extend Mail Carrier with a picture-map legend and two planned stops: levels 6–7, Hazel the squirrel postkeeper's map of the woods with a picture key, then two numbered letters planned in order and walked along the paths.
- [ ] Use the map in a small woodland errand ([the Woodland Picnic](ELEMENTARY-ROADMAP.md#zone-concepts), or a delivery for a friend).
- [ ] Provide spoken explanations and large targets. Let the child ask for a worked example or easier mode; longer reasoning must not require faster fingers.
- [x] First older supported ranges: the `school` band ("Early school", 6–8) with 35 games at first (44 now), 29 of them at the top of existing ladders. Revisit the ranges after trying the activities.
- [ ] Give Wonder Woods a stable zone identity and explicit activities, with a supported range for each. (Started: Wonder Woods is the `school` band's trail place, still one place per band; a host, an errand and zone identity separate from the band remain.) Carry the launching zone/position through game navigation while preserving the existing age-trail routes.
- [x] Audit `bands.ts`, place/trail layout, `GameModule` ranges, registry tests, difficulty, routes, parent controls, voice lines, and birthdays. Done for `school`: games now list only supported bands (`BandLevels`/`rangeFor`), the trail has five places, and the band list in the world suite includes it. Update the current one-place-per-band assumption deliberately; retain coverage for every original place and new route.
- [ ] Test loading and restoring old saves with appropriate defaults; preserve existing levels, pins, stickers, and home place. Verify new-band navigation and offline play. Existing games need not all support the new band.
- [ ] Evaluate optional narrated word/sentence practice separately from reading-required navigation. Review language content and the actual speech output before treating a mode as ready.

Done when one small elementary zone offers deeper decisions, supported completion, and an optional connected errand while retaining the same touch/offline/reward rules. Visiting it must not change the child's global band or remove younger activities. Add an older band only with the full surrounding support.

## 6. Candidate batches after the pilots

Choose one small batch based on an observed gap. Full loops and scope are in [the idea notebook](ARCADE-IDEAS.md#games-worth-developing-next).

| Candidate | Purpose and learning | Dependency / selection reason |
| --- | --- | --- |
| Sorting Machine (Critter Crossing is built) | Hidden rules, combining attributes, comparing evidence and revising a guess | Critter Sort, Secret Code and Critter Crossing are built; the machine would add AND, OR and NOT tiles with a visible history; roughly 8–11 |
| Chain Reaction (built) + deeper launch modes | Predict, test, adjust one variable; explore several solutions | The constrained construction set is built: large ramps, deterministic replay, one-placement help and several valid designs at the top; physical feel remains to be judged |
| Story Theater + Busy Picture | Listening/reading comprehension, sequencing, cause and effect, expression | Review each story's clues and acceptable endings; free theater accepts any creation |
| Habitat Helpers + discovery entries | Observation, classification, planning for compatible needs | Explicit stylized model and accurate facts; growth advances through play |
| Bounce Back + cooperative music | Turn-taking, shared plans, rhythmic listening | Multi-touch and one-player assist checked on the iPad |
| Shape Buddies | Cooperative construction | [New interaction ideas](MICROGAME-IDEAS.md#develop-these-into-complete-activities); start with predefined shapes. Peekaround Island, the other half of this pair, is built |
| Clap the Syllables (built) | Syllables through rhythm | The rest of the [gap review shortlist](ARCADE-IDEAS.md#a-shortlist-from-this-review) (Garden Rows, Ferry Jam, Block Tower, Pet Says, Owl Walk Home, Lasso Loops and Clap the Syllables are built); try crank and pour gestures in [a third Quick Tricks show](MICROGAME-IDEAS.md#a-third-show-new-gestures) before Gear Garden or Pour and Fill |

- [x] Select and specify the next batch after the relevant play/home/older-play prototype is evaluated in the browser: Chain Reaction is built as a six-level pre-K–school ladder with two small machines per round. Retain later child/device evaluation as a separate check.
- [ ] Deepen short ladders where a meaningful next decision exists: 24 games top out at four or five levels, including most of the newest batches. Append levels without renumbering saved levels or pins.
- [ ] Give more favorites a second lap level: 22 of the 37 lap games have one. A new lap level has to be appended at the end of a ladder, so first decide whether a band's range may skip levels. Peg Garden's bloom level also needs a guaranteed finish (repeated taps on one spot can't complete it) before it opens to lap play.
- [x] A Quick Tricks pilot with Umbrella Up, Sock Gobbler, and Bridge Stretch, plus appended Parcel Turn, Picnic Places and Last Berry shows: one show per round with one sticker, an arrow the child taps between tricks, misses summed across the show and at most one hint per trick. Watch whether a medley adds delight before adding more tricks or a framework.
- [ ] Progress from E1 into middle- and upper-elementary expansions using the [game-family progression](ELEMENTARY-ROADMAP.md#how-familiar-games-could-keep-growing); choose one zone or family at a time, preserving original levels and stable save IDs.
- [ ] Revisit optional parent-recorded voice lines as a separate design decision. The current no-audio-files constraint and offline storage/consent behavior need an explicit resolution before implementation.

## Definition of ready and done for future activities

Before building, state the **fun action**, **specific skill**, **smallest complete round**, **starting support**, and **what deeper play changes**. Identify existing games that could host the mode. Give at least one example of a mistake or experiment and how the game explains it. Creative play must not be forced into a single correct answer.

Before marking done, verify solvable and unambiguous authored/generated tasks (in rule tests), supported completion, interruptions and resizing, spoken prompts, stable reward/save behavior, and the checks that apply at the lightest tier of the [verification budget](../AGENTS.md#verification-budget). Try a fresh arrangement to see whether the learning action still makes sense beyond one memorized answer. Assisted completion is worthwhile play, but is not evidence of independent mastery. Content and device validation are separate from a passing build. Record what was actually run in the verification log.

## Completed implementation milestones

This replaces the historical continuation checklist. The original ten-region map, cloud unlocks, region pages, and saved `world.opened` list were superseded by the age trail; they are not active requirements. Details of the current architecture are in [DESIGN.md](DESIGN.md), and dated checks remain in [VERIFICATION.md](VERIFICATION.md).

- [x] Shared game shell, generated art/audio, local saves, age-band difficulty, and grown-up controls.
- [x] Pet hatching and customization, shared pet appearance, spoken name support.
- [x] Five sticker scenes with a paged tray, drag placement/removal, and normalized saved coordinates.
- [x] Pattern Train, Memory Match, Letter Trails (all 26 capitals plus words/name), and Robot Path.
- [x] Size Parade, Bug Builder, and Story Steps, including earlier toddler access.
- [x] Feelings Faces and Monster Munch, expanding lap play.
- [x] Four open age-trail places; play at the selected place's band; return to that place; birthday walk; swipe/arrow paging and remembered scroll.
- [x] Song Maker, Puzzle Pals, Weather Wardrobe, and Sink or Float.
- [x] Deeper Rainbow Fingers (6 levels) and Splish Splash (8 levels).
- [x] Duckling Parade, Scoop Shop, Roundup, and Bouncy Launch, reaching the 25-game baseline.
- [x] Word Monsters, Peg Garden, Fluffy Salon, Sound Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, Bounce Back and Dot Link (35 games), with shared ball and peg physics (`engine/ball.ts`).
- [x] Rule tests for every game, and play-throughs for the six earliest games (`originals`).
- [x] Seesaw Balance, Teddy Doctor, Bumper Garden and Quick Tricks (39 games); the ball helper gained an optional ceiling and springy bumpers. Pushed in `17124e8`.
- [x] Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town (43 games), with six levels each; Quick Tricks 4–6 and Seesaw Balance 7 appended without renumbering, two existing free-play modes opened to lap play, and Photo Safari's and Teddy Doctor's naming levels opened to lap play. Pushed in `17124e8`.
- [x] Peekaround Island (44 games; toddler–pre-K, five levels) and Little Helpers level 6 (equal groups). Committed in `dfe08a3`.
- [x] The early-school band and Wonder Woods, with Light Lab, Penguin Slide, Secret Code, Frog Hop, Market Stall, Garden Grow and Clock Tower (51 games) and the `woods` browser suite. Committed in `dfe08a3`.
- [x] Animal Snack, Beat Builder, Rhyme Time, Stop and Go, Ramp Race, Critter Sort, Treasure Map, Opposites and Picture Graph (62 games), then Inchworm Measure (63 games; pre-K–school: lay worms end to end, measure, compare, read a ruler). Committed in `dfe08a3`.
- [x] Pixel Pictures and Goodnight Room (53 games); Robot Path 7–10 (counted steps, loops), Word Monsters 7 (word families), Duck Pond 10 (make ten), Monster Munch 8 (leftovers), Bubble Pop 10–11 (pairs that make 5 and 10), Photo Safari 6 (not), Egg Catch 6 (predict the path). Committed in `dfe08a3`.
- [x] Automated verification recorded for those expansions, including production offline checks where relevant. Physical iPad checks and judgments of fun remain open above.
- [x] The Windy Picnic pilot (a map destination, the in-scene blanket, two story rounds, the journal, the finale and keepsake, retelling, a `stories` save field with migration tests), Mail Carrier 6–7, Seesaw Balance 8–9, and Block Tower, Lasso Loops, Pet Says and Owl Walk Home (67 games), with rule tests, the `picnic` and `shortlist` browser suites, the world suite and the production offline check. Merged to `main` in `7066d5b` and deployed.
- [x] Garden Rows, Ferry Jam, Critter Crossing, Clap the Syllables and Chain Reaction bring the catalog to 72 games. Chain Reaction is the first candidate-batch activity after the home/play prototypes: a six-level constrained construction ladder with deterministic replay, solver-checked boards and a filtered browser play of its first and top levels. Device and child judgment remain open.
