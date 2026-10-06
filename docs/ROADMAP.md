# Puddle Island roadmap

This is the ordered development backlog. Checked items describe completed implementation milestones; unchecked items are remaining work or proposals. A proposal is not a commitment to ship it. Test results belong in [VERIFICATION.md](VERIFICATION.md), current behavior in [DESIGN.md](DESIGN.md), and game concepts in [ARCADE-IDEAS.md](ARCADE-IDEAS.md).

## Current position

The latest recorded game expansion brings the documented baseline to **25 games**, with four age-trail places, pet hatching, adaptive levels, and a sticker book. A follow-on batch is actively changing in the local source: Word Monsters, Peg Garden, Fluffy Salon, Sound Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, and Bounce Back are present. Treat these as work in progress until their checks are recorded; use the registry for the current inventory, and do not infer deployment from source presence.

Current bands remain lap, toddler, preschool, and pre-K (through roughly age six). The proposed next reach is **6–8**, with selected **8–10** concepts held for later. Older play should add reasoning, expression, and connected adventures while retaining the younger child's simple activities.

Recommended sequence: **verify the current batch → improve finding games → one short adventure → one pet room → a small 6–8 pilot**. Do not build a new economy or a large quest framework before the small versions prove useful.

## 1. Finish and verify the current work

- [ ] Verify Word Monsters and Photo Safari: vocabulary, spoken prompts, answer clarity, replay, and whether device speech actually produces usable letter sounds. Avoid claiming phonics coverage from letter-name playback alone.
- [ ] Verify Peg Garden and Egg Catch: reachable goals, slow motion, forgiving catches/routes, orientation, and hints that teach the next action.
- [ ] Verify Fluffy Salon and Sound Garden: satisfying free play, clear exits, repeatable instructions, and guided modes that preserve creative exploration.
- [ ] Verify Little Helpers and Mail Carrier: visible quantities, unambiguous requests, and correct end-of-round accounting.
- [ ] Verify Bounce Back: multi-touch, one-player assist, soft returns, shared rally goals, and whether mistakes/hints fit cooperative play rather than penalizing exploration.
- [ ] Finish rule tests and browser play-throughs for the remaining original games: Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, and Color Garden.
- [ ] Run typecheck, unit tests, build, the relevant browser suites, and the combined browser flow; record actual results and any untested paths. Check production offline play after changes to navigation, persistence, or the cached app.
- [ ] Promote verified additions into the README inventory, DESIGN status, and the arcade notebook together. Update counts from the registry; do not infer a live release from local checks.
- [ ] Check the real iPad: offline speech, first-touch audio, small-hand dragging, herding and pulling, orientation, installation, and Guided Access. Preserve these as outstanding until performed on the device.

Done when each addition has verified rules, a completed round at every level, mistakes/hints where applicable, portrait layout, reward/save reload checks, and an honest verification entry. Existing round completion still awards one sticker, including with help.

## 2. Make the larger catalog easy to explore

- [ ] Prototype a place layout with clearly separated subject clusters and a few large choices visible at once; keep the age trail and every place open.
- [ ] Compare that layout with the current swipe-and-arrow path on the iPad. Choose based on reaching and returning from a desired game, not fitting more icons on screen.
- [ ] Retain spoken subject/game names, touch-down feedback, swipe cancellation, remembered position, and home returning to the launching place and band.
- [ ] Explore a small favorites shelf or a familiar host per subject if grouping alone does not solve discovery. Avoid daily recommendations or compulsory rotations.
- [ ] Verify every supported game is reachable in every supported band, including after a catalog grows and in portrait.

Done when a child and grown-up can find a known activity, discover another, and return without losing their place. Reorganizing subjects must not alter saved game IDs or reset progress.

## 3. Connect the games: Island Errands pilot

Design: [Island Errands in the idea notebook](ARCADE-IDEAS.md#island-errands-a-first-adventure-48-l). Target roughly 4–8 with support adjusted per activity.

- [ ] Write **The Windy Picnic**: one recurring character, one picnic scene, and three illustrated requests with a satisfying final scene. Start with existing activities where their rules fit.
- [ ] Make a picture journal that replays the request and recaps completed steps; point directly to the next destination. Keep free play available throughout.
- [ ] Prototype completing suitable rounds as story steps. Separately specify any new result data needed to carry an exact quantity, selected object, or tune into the picnic; the current `{ misses, hints }` result cannot express those details.
- [ ] Save after each step and resume after a goodnight or reload. Make step completion idempotent so replay cannot duplicate keepsakes or corrupt the next step.
- [ ] Give assisted completion the same story ending. Avoid expired requests, item loss, mandatory repeat quotas, and difficulty requirements that block the adventure.
- [ ] Finish with the prepared picnic and one known keepsake. Keep one sticker per completed game round; the story layer must not duplicate the shell's sticker award.
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

## 5. A small older-child pilot (proposed 6–8)

Start with **Seesaw Balance**, then one extension to **Robot Path**. They test concrete reasoning and debugging without requiring a large amount of authored story content. These are proposed starting points; play observations may favor a different pair.

- [ ] Define a support ladder for Seesaw Balance: compare visible weights → make equal totals → infer a hidden weight. Keep pan positions fixed so weight and lever distance are not confused.
- [ ] Prototype Robot Path loops with step-through playback, editable commands, and an obvious undo. Keep existing levels intact.
- [ ] Provide spoken explanations and large targets. Let the child ask for a worked example or easier mode; longer reasoning must not require faster fingers.
- [ ] Decide whether to add an `explorer` band/place after trying the activities. A possible name is **Wonder Woods**; neither the ID nor name is implemented or settled.
- [ ] If a band is adopted, audit `bands.ts`, place/trail layout, `GameModule` ranges, registry tests, difficulty, routes, parent controls, voice lines, and birthdays. Confirm exhaustive band mappings still behave correctly.
- [ ] Test loading and restoring old saves with appropriate defaults; preserve existing levels, pins, stickers, and home place. Verify new-band navigation and offline play. Existing games need not all support the new band.
- [ ] Evaluate optional narrated word/sentence practice separately from reading-required navigation. Review language content and the actual speech output before treating a mode as ready.

Done when the two activities offer meaningfully different decisions from pre-K, can be finished with support, and fit the same touch/offline/reward rules. Add the band only with the full surrounding support, not as a label that silently stretches existing ladders.

## 6. Candidate batches after the pilots

Choose one small batch based on an observed gap. Full loops and scope are in [the idea notebook](ARCADE-IDEAS.md#games-worth-developing-next).

| Candidate | Purpose and learning | Dependency / selection reason |
| --- | --- | --- |
| Pet Kitchen + Market Stall | Equal parts, measurement, combinations and change inside pretend play | Use a fresh pretend purse for each market round; no persistent economy required |
| Critter Crossing + Secret Code | Classification, deduction, comparing evidence and revising a guess | Shared visible history, explanatory feedback, and undo; appropriate for roughly 5–8 |
| Chain Reaction + deeper launch modes | Predict, test, adjust one variable; explore several solutions | Reuse only verified physics pieces; begin with a constrained construction set |
| Story Theater + Busy Picture | Listening/reading comprehension, sequencing, cause and effect, expression | Review each story's clues and acceptable endings; free theater accepts any creation |
| Habitat Helpers + discovery entries | Observation, classification, planning for compatible needs | Explicit stylized model and accurate facts; growth advances through play |
| Bounce Back + cooperative music | Turn-taking, shared plans, rhythmic listening | Multi-touch and one-player assist checked on the iPad |
| Stamp Studio + Tangram Town | Composition, rotation, shape decomposition, saved work | Reuse Rainbow Fingers/Bug Builder where practical; bounded creation storage |
| Quick Tricks + Rhythm Neighbors | Short physical jokes, spoken actions, listening, and rhythm conversations | [Microgame concepts](MICROGAME-IDEAS.md); try three drag-based scenes or one music extension before building a collection framework |
| Shape Buddies or Peekaround Island | Cooperative construction or spatial perspective | [New interaction ideas](MICROGAME-IDEAS.md#develop-these-into-complete-activities); choose one small prototype with predefined shapes or four drawn views |

- [ ] Select and specify the next batch after the adventure/home/older-play pilots are evaluated.
- [ ] Consider a Quick Tricks pilot with Umbrella Up, Sock Gobbler, and Bridge Stretch: replayable prompts, child-paced transitions, one sticker per complete show, and deliberate miss/hint accounting across scenes. This is an optional candidate, not a new prerequisite for the existing roadmap.
- [ ] Keep 8–10 extensions (nested programs, equivalent fractions, interacting habitat rules) in reserve until the 6–8 experience works.
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
- [x] Automated verification recorded for those expansions, including production offline checks where relevant. Physical iPad checks remain open above.
