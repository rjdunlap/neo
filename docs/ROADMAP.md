# Puddle Island roadmap

This is the ordered development backlog for growing Puddle Island from early play through **elementary school, roughly kindergarten–grade 5 (ages 5–11)**. Checked items describe completed implementation milestones; unchecked items are remaining work or proposals. A proposal is not a commitment to ship it. Test results belong in [VERIFICATION.md](VERIFICATION.md), current behavior in [DESIGN.md](DESIGN.md), and game concepts in [ARCADE-IDEAS.md](ARCADE-IDEAS.md).

## Current position

The island has **67 games** in five age-trail places, with pet hatching, adaptive levels, a sticker book, and a first short story, **the Windy Picnic**. Everything through Tangram Town (43 games) was pushed to `main` in `17124e8`. The early-school band and its place, **Wonder Woods** (ages 6–8), Peekaround Island and nineteen more games (Light Lab, Penguin Slide, Secret Code, Frog Hop, Market Stall, Garden Grow, Clock Tower, Pixel Pictures, Goodnight Room, Animal Snack, Beat Builder, Rhyme Time, Stop and Go, Ramp Race, Critter Sort, Treasure Map, Opposites, Picture Graph and Inchworm Measure), with longer ladders (Robot Path loops, Word Monsters word families, Duck Pond make-ten, Monster Munch leftovers), were committed in `dfe08a3`. Each has rule tests and a recorded browser play-through of every level. The working tree (not yet committed) adds the Windy Picnic pilot (§3), Mail Carrier's picture map and two planned stops and Seesaw Balance's take-the-same-off levels in Wonder Woods (§5), and four games from the gap review's shortlist: Block Tower, Lasso Loops, Pet Says and Owl Walk Home (§6), each with rule tests and recorded browser play-throughs. No one has yet judged the newer games or the picnic on an iPad or watched a child play them; §1 keeps those checks open. Puddle Lagoon offers 37 games, Daisy Meadow 48, Bumpy Hills 57, Starry Peak 63 and Wonder Woods 46.

Current bands are lap, toddler, preschool, pre-K and early school (`school`, roughly 6–8, at Wonder Woods). Elementary work has started as a **6–8 pilot**; then grow toward upper-elementary play through about age eleven. Learning ranges overlap; older modes and new zones remain proposals. Keep younger favorites available as reasoning, expression, investigations, and connected adventures grow.

Recommended sequence: **finish current verification → improve finding games → small adventure/home pilots → first elementary zone → repeatable themed expansions**. New minigames and extensions can proceed alongside that work when requested. Avoid making a large world framework a prerequisite for a small playable addition.

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

The automated checks for the ten newest games are done; what remains for them needs a person, the iPad, and ideally the child.

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
- [ ] Check the real iPad: offline speech, first-touch audio, small-hand dragging, herding and pulling, orientation, installation, and Guided Access. Preserve these as outstanding until performed on the device.

Done when each addition has verified rules, a completed round at every level, mistakes/hints where applicable, portrait layout, reward/save reload checks, and an honest verification entry. Existing round completion still awards one sticker, including with help.

## 2. Make the larger catalog easy to explore

- [x] Prototype a place layout with clearly separated subject clusters and a few large choices visible at once: grown-up Finding games → Subject cards. Four choices per page; all places remain open.
- [ ] Compare that layout with the current swipe-and-arrow path on the iPad. Choose based on reaching and returning from a desired game, not fitting more icons on screen.
- [x] Retain spoken subject/game names, touch-down feedback, swipe cancellation, remembered position, and home returning to the launching place and band in both layouts.
- [ ] Explore a small favorites shelf or a familiar host per subject if grouping alone does not solve discovery. Avoid daily recommendations or compulsory rotations.
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
- [ ] Observe whether the child understands who needs help, what to try, and what changed. Simplify the pilot before authoring more stories.

Done when the whole adventure can be played, left halfway, resumed offline, and finished with help; all original games remain independently playable. Only then consider a reusable story format or a second episode (a missing melody or a mixed-up delivery).

## 4. Give the pet a home and the child a collection

Design: [Pet Treehouse and Discovery Journal](ARCADE-IDEAS.md#pet-treehouse-and-discovery-journal-all-ages-with-support-l).

- [ ] Build one treehouse room with six free furnishings, move/rotate controls, and a place to display an earned sticker. Displaying never consumes the sticker.
- [ ] Let the pet use its room in small, playful ways. Care happens during play; hunger, dirt, sadness, or construction waits never accrue while away.
- [ ] Add bounded, locally saved creations: one drawing display and one tune player first, with explicit replace/undo behavior. Use code-drawn art and synthesized playback.
- [ ] Add a small discovery journal with known entries, spoken observations, and a clear way to revisit where each was found. No random rare items or calendar availability.
- [ ] Add deterministic keepsakes only where they represent a story/discovery; provide the starter room without earning anything. Keep the existing sticker reward predictable.
- [ ] Define save defaults, limits, backup/restore behavior, and migration tests for room placements, creations, journal entries, and story progress. Check placement after resizing and offline reload.

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
| Critter Crossing + Sorting Machine | Hidden rules, combining attributes, comparing evidence and revising a guess | Critter Sort's guess-the-rule level and Secret Code are built; keep a visible history, explanatory feedback and undo; roughly 5–11 |
| Chain Reaction + deeper launch modes | Predict, test, adjust one variable; explore several solutions | Reuse only verified physics pieces; begin with a constrained construction set |
| Story Theater + Busy Picture | Listening/reading comprehension, sequencing, cause and effect, expression | Review each story's clues and acceptable endings; free theater accepts any creation |
| Habitat Helpers + discovery entries | Observation, classification, planning for compatible needs | Explicit stylized model and accurate facts; growth advances through play |
| Bounce Back + cooperative music | Turn-taking, shared plans, rhythmic listening | Multi-touch and one-player assist checked on the iPad |
| Shape Buddies | Cooperative construction | [New interaction ideas](MICROGAME-IDEAS.md#develop-these-into-complete-activities); start with predefined shapes. Peekaround Island, the other half of this pair, is built |
| Garden Rows, Ferry Jam, Clap the Syllables | Grid logic with unique solutions, planning, syllables through rhythm | The rest of the [gap review shortlist](ARCADE-IDEAS.md#a-shortlist-from-this-review) (Block Tower, Pet Says, Owl Walk Home and Lasso Loops are built); try crank and pour gestures in [a third Quick Tricks show](MICROGAME-IDEAS.md#a-third-show-new-gestures) before Gear Garden or Pour and Fill |

- [ ] Select and specify the next batch after the adventure/home/older-play pilots are evaluated.
- [ ] Deepen short ladders where a meaningful next decision exists: 24 games top out at four or five levels, including most of the newest batches. Append levels without renumbering saved levels or pins.
- [ ] Give more favorites a second lap level: 22 of the 37 lap games have one. A new lap level has to be appended at the end of a ladder, so first decide whether a band's range may skip levels. Peg Garden's bloom level also needs a guaranteed finish (repeated taps on one spot can't complete it) before it opens to lap play.
- [x] A Quick Tricks pilot with Umbrella Up, Sock Gobbler, and Bridge Stretch, plus appended Parcel Turn, Picnic Places and Last Berry shows: one show per round with one sticker, an arrow the child taps between tricks, misses summed across the show and at most one hint per trick. Watch whether a medley adds delight before adding more tricks or a framework.
- [ ] Progress from E1 into middle- and upper-elementary expansions using the [game-family progression](ELEMENTARY-ROADMAP.md#how-familiar-games-could-keep-growing); choose one zone or family at a time, preserving original levels and stable save IDs.
- [ ] Revisit optional parent-recorded voice lines as a separate design decision. The current no-audio-files constraint and offline storage/consent behavior need an explicit resolution before implementation.

## Definition of ready and done for future activities

Before building, state the **fun action**, **specific skill**, **smallest complete round**, **starting support**, and **what deeper play changes**. Identify existing games that could host the mode. Give at least one example of a mistake or experiment and how the game explains it. Creative play must not be forced into a single correct answer.

Before marking done, verify solvable and unambiguous authored/generated tasks, supported completion, interruptions and resizing, spoken prompts, stable reward/save behavior, and all applicable code/browser/offline checks. Try a fresh arrangement to see whether the learning action still makes sense beyond one memorized answer. Assisted completion is worthwhile play, but is not evidence of independent mastery. Content and device validation are separate from a passing build. Record what was actually run in the verification log.

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
- [x] The Windy Picnic pilot (a map destination, the in-scene blanket, two story rounds, the journal, the finale and keepsake, retelling, a `stories` save field with migration tests), Mail Carrier 6–7, Seesaw Balance 8–9, and Block Tower, Lasso Loops, Pet Says and Owl Walk Home (67 games), with rule tests, the `picnic` and `shortlist` browser suites, the world suite and the production offline check. Not yet committed.
