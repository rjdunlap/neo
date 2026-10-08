# Puddle Island roadmap

What Puddle Island is aiming for, where it stands, and what to do next. Unchecked boxes are open work; anything marked a proposal is not a commitment. How the app works is in [DESIGN.md](DESIGN.md), what each game does in [GAMES.md](GAMES.md), the idea pool in [IDEAS.md](IDEAS.md), and what has been checked in [VERIFICATION.md](VERIFICATION.md). The roadmap as it stood before the 2026-10-07 cleanup, with its full list of completed milestones, is in [the archive](archive/ROADMAP-HISTORY.md).

## Direction

Puddle Island is an iPad learning game for the developer's daughter, who turns one in October 2026, in the spirit of JumpStart's playful learning, Neopets' companion and personal world, and the variety of classic arcade games. It should grow with her from lap play through elementary school, to about grade 5 (age eleven), on one familiar island where younger favorites never disappear. Four threads carry it:

1. **Many small, satisfying games with a clear learning purpose**, where the skill causes the fun: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Familiar games grow deeper modes; a new game earns its place with a new kind of decision or interaction.
2. **A personal world**: her pet, its treehouse, things she made, and a discovery journal. Nothing decays, expires or waits for her.
3. **Short stories that connect games**: a friend needs help, two or three activities change the scene, and there is a complete ending. Free play stays one tap away.
4. **Couch play for grown-ups**: a separate route on a computer with controllers, its own save, trips, face-offs and challenge courses. It never touches the child's island.

**How work gets judged right now.** She is not yet one and an iPad is not readily at hand, so the immediate feedback loop is grown-ups playing in a desktop browser. Device and child observations are listed below and never block building; equally, grown-up enjoyment is not evidence that a child is ready for something.

## Where we are

- **72 games** across five places on an age trail that climbs in band order: Puddle Lagoon (lap, 37 games), Daisy Meadow (toddler, 48), Bumpy Hills (preschool, 58), Starry Peak (pre-K, 68) and Wonder Woods (early school, ages 6–8, 50). Every game has rule tests, a grown-up how-to card and adaptive levels; the [README](../README.md#the-island-and-its-games) lists them.
- **The child's island:** pet hatching and customization, a sticker book, a gold twinkle on unplayed games, a favorites shelf of hearted games, and two place layouts (the swipe path and subject cards) still to compare on the iPad.
- **One story:** the Windy Picnic, with a journal, resumable steps and a keepsake.
- **The treehouse:** six free furnishings, a framed sticker, a picture board for a kept Stamp Studio picture, Rainbow Fingers painting or Pixel Pictures design, a tune plaque for a free Song Maker song, and a discovery journal of sixteen entries from Sink or Float and Animal Snack.
- **Couch play:** fourteen controller-ready games, six-stop trips in Together or Face-off mode, how-to screens with bot demos, games that open as trips are finished, a finale and keepsake, and three challenge courses (Pond Practice, the Five Ponds, Cloud Hopper) with per-player records.
- **Checked so far:** everything above has unit tests and recorded browser checks in headless Chrome. Nothing has been judged on an iPad, with real controllers on a TV, or with a child. What is deployed is whatever `origin/main` holds (`git log origin/main`).

## Next up

Most sessions should build from this list; it never waits for the one after it. Check effort follows the [verification budget](../AGENTS.md#verification-budget). Roughly in order:

- [ ] **Treehouse follow-ons.** Take a creation down altogether; journal entries from more games (Photo Safari, Seesaw Balance, Bouncy Launch); show where in a game an entry was found; offer the keep button before a session-timeout goodnight (today that round goes straight to goodnight and its creation cannot be kept).
- [ ] **New games from the shortlist:** Story Theater, Habitat Helpers or Shape Buddies ([candidates](IDEAS.md#candidates)). Choose by an observed gap; state the definition of ready first.
- [ ] **Couch games that can score on seeded boards**, so face-off trips are not mostly team stops: Garden Rows (seeded beds suit a twin face-off), Treasure Map and Quick Tricks. Block Tower's fixed boards would only make a team stop; Owl Walk Home was considered and set aside. Each needs `control()`, `autoplay`, a catalog entry and a tier slot; `BROWSER_SUITE=couchgames COUCH_ONLY=<id>` proves it.
- [ ] **Deepen short ladders** where a meaningful next decision exists: 26 games top out at four or five levels. Append levels without renumbering saved levels or pins.
- [ ] **A second lap level for favorites:** 22 of the 37 lap games have one. A new lap level has to be appended at the end of a ladder, so first decide whether a band's range may skip levels. Peg Garden's bloom level also needs a guaranteed finish (repeated taps on one spot cannot complete it) before it opens further to lap play.
- [ ] **Give Wonder Woods a zone identity:** a host on the place, a small errand, an identity separate from the `school` band, and launch/return context carried through game navigation, preserving the existing age-trail routes. This is the first step of [E1](#e1-early-elementary-roughly-ages-57).
- [ ] **A second story episode** with a distinct new consequence: a missing melody, a mixed-up delivery, or the Woodland Picnic using Mail Carrier's map. Use the [typed story result](DESIGN.md#proposed-story-results) only when the episode carries something she made.
- [ ] **Close two check gaps that need no person:** diagnose the flaky Peg Garden touch suite (`BROWSER_SUITE=batch BATCH_ONLY=pegs` fails on the development Mac at a different aimed level each run, on unmodified code too; a frame-timing difference between the simulation and the live game is a guess, not a finding), and extend `npm run test:offline` to reload a rearranged treehouse, a kept creation and the journal, which it does not open today.

## Needs a person or a device

Keep these open until someone actually does them. None of them blocks the list above.

**Grown-ups at the computer or TV**

- [ ] Play couch trips with real Pro Controllers on a TV and write down what is wrong: text size from the couch (pages scale to about 1.4 times at 1080p), how-to pacing (Secret Code's and Bumper Garden's demos run 30–40 seconds), whether the bots are a good example, how fast trips open new games (one tier per trip is a guess), how face-off feels to whoever loses, and whether the finale's four-second ceremony is a treat or a wait.
- [ ] Judge the challenge courses: whether Pond Practice is easy enough and the Five Ponds hard enough, whether Cloud Hopper's small clouds suit a stick, whether any of the three gives a reason to run again, whether a hint after three extra slides or two missed launches is too soon for a score chase, and whether the squashing spring reads well or the launcher wants to become a catapult. Five to ten minutes per course is a hypothesis, not a timer.
- [ ] Compare three versus four choices per stop, and the pacing of a whole trip, before adding a dice board or more party structure.

**On the iPad**

- [ ] Device basics: offline speech voices, first-touch audio, small-hand dragging, herding and pulling, orientation changes, Add to Home Screen, Guided Access, and that a new version arrives after the home-screen app is closed and reopened (how long iPadOS keeps a suspended app on the old one is unknown).
- [ ] Compare the swipe path with subject cards for reaching and returning from a wanted game (not for fitting more icons), and whether the favorites shelf and twinkles are found and used. Check that every game is reachable in every band it supports, in portrait too, as the catalog grows.

**With her now (lap and toddler)**

- [ ] Whether tapping the soil (Garden Grow), the singing flowers, saying goodnight (Goodnight Room), Animal Snack, Stop and Go and Opposites hold a one-year-old's attention; Block Tower's tumbling; Pet Says as co-play; Owl Walk Home's turn-taking; whether she notices the heart, the treehouse or the journal at all.

**Later, at three to five**

- [ ] Word Monsters, Photo Safari and Clap the Syllables: vocabulary, spoken prompts, answer clarity, and whether device speech produces usable letter sounds and clear words. Do not claim phonics coverage from letter-name playback alone.
- [ ] Physical play: Peg Garden and Egg Catch (reachable goals feel reachable, motion slow enough, forgiving catches); Bounce Back with two real hands and the pet taking over; Dot Link's line through dots for small fingers; Bumper Garden's half-screen flipping; Lasso Loops' loop gesture with small fingers.
- [ ] Clarity: Fluffy Salon and Sound Garden (satisfying free play, clear exits, guided modes that keep creative exploration); Little Helpers and Mail Carrier (visible quantities and unambiguous requests at viewing distance; whether a Little Helpers bunch reads as equal teams); Seesaw Balance's tipping as weight; Teddy Doctor's spoken-only clues; Quick Tricks' arrow between tricks; Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town (stamp moving, equal pieces, reply scoring, silhouette help); Peekaround Island (turning reads as looking from another side, "behind" the crown, drop spots easy to hit).
- [ ] The Windy Picnic: does she understand who needs help, what to try and what changed; are the blanket and request targets easy to hit; does the journal make sense.

**Later, at six to eight**

- [ ] The Wonder Woods games: Light Lab's mirrors as turning the beam, Penguin Slide's tap-the-ice direction, Secret Code's marks, Frog Hop's number line, Market Stall's coin sizes, Clock Tower's hand dragging, Inchworm Measure's worms and ruler, Block Tower's eighth-of-a-block dragging, Mail Carrier's map key, Chain Reaction (moving one piece at a time, predicting before running, discovering several designs), and whether Seesaw Balance 8–9 explains "do the same to both sides".
- [ ] The newer ladder steps with an older child: Robot Path loops, word families, make ten, leftovers, and Pixel Pictures' logic puzzles.

## Later horizons (elementary)

The long-term plan: a familiar island that grows from early play through roughly ages 5–11, by extending favorite games, adding new interactions where they help, and connecting them through places, characters and projects. These are development horizons, not dates or grade locks. Ages are rough planning guides; learning ranges overlap; and the horizons are not a proposal for one runtime band per school grade. Apart from Wonder Woods (the `school` band's place) and the steps marked built, everything in this section is a **proposal**.

| Horizon | What grows | Places and example experiences | A useful milestone |
| --- | --- | --- | --- |
| **E0 — Foundation** (now) | Reliable touch play, spoken support, finding favorites, completing and saving a round | The current trail; the Windy Picnic, treehouse and journal as first connecting projects (built) | The catalog is easy to find and comfortable on the iPad; a project resumes after a break; a creation can be revisited |
| **E1 — Early elementary**, roughly ages 5–7 | Combine small quantities, follow and explain short sequences, use word and picture clues, measure and compare, editable routes and maps | **Wonder Woods**: help set up a woodland picnic, balance supplies, program a delivery route, follow a narrated clue | One zone with two deeper familiar games, one new activity and a small optional adventure |
| **E2 — Middle elementary**, roughly grades 2–3, ages 7–9 | Equal groups and fractions, meaningful word parts, evidence in stories, loops and conditions, designing and testing, saved creations | **Maker Harbor** and **Storybook Square**, built in separate small expansions; organize a ferry fair or investigate mixed-up invitations | A project combines skills across games and produces something she can revisit or revise |
| **E3 — Upper elementary**, roughly grades 4–5, ages 9–11 | Fraction and decimal models, area and volume, interpreting data, fair tests, comparing explanations, longer programs and projects | **Discovery Marsh** and **Skywatch Isles**; design a visitor habitat, investigate a water route, build a model observatory | Several valid approaches work, results can be compared, and a saved project survives several sessions |

The 6–8 pilot (the `school` band, built) bridges E1 and E2.

### E1: early elementary, roughly ages 5–7

Built so far: the `school` band and Wonder Woods (where many games play their top levels), Seesaw Balance 8–9 (take the same off both sides), Robot Path loops with step-through playback (7–10), Mail Carrier's picture map and two planned stops (6–7), and Light Lab, Penguin Slide, Secret Code, Frog Hop, Market Stall and Clock Tower built to reach it.

- [ ] Wonder Woods as the first thematic zone: a host, an errand and a zone identity separate from the band, with launch/return context independent of the chosen difficulty (also in [next up](#next-up)).
- [ ] A woodland errand: the Woodland Picnic, or a delivery for a friend, using Mail Carrier's map; every participating game stays independently playable.
- [ ] Check that a child can use hints, revise a route, leave partway, and return without losing progress or changing other games' levels; test loading and restoring old saves with appropriate defaults (levels, pins, stickers and home place preserved), new-band navigation and offline play.
- [ ] Let the child ask for a worked example or an easier mode; longer reasoning must never require faster fingers.
- [ ] Seesaw Balance with two different unknown weights.
- [ ] Evaluate optional narrated word and sentence practice separately from reading-free navigation; review language content and the actual speech output before treating a mode as ready.

Exit milestone: a complete early-elementary place offers deeper decisions and accessible help, and visiting it changes neither the child's global band nor the younger activities.

### E2: middle elementary

- [ ] Choose **Maker Harbor** or **Storybook Square** first, by the next desired skill area; build the other in a later expansion.
- [ ] Add the matching extensions from the [family table](#how-familiar-games-keep-growing): equal groups, parts and design, or word meaning and evidence in stories.
- [ ] One new interaction and one project per expansion, with several valid solutions where appropriate.
- [ ] Save a work in progress (a construction, program or story) and return to it directly from the journal.
- [ ] Decide whether branching game modes need separate progress records before one linear level number carries unrelated skills.

Exit milestone: she can choose a subject or project, make a plan, change it after feedback, and revisit a saved creation. Progress in reading never forces harder number work, or the reverse.

### E3: upper elementary

- [ ] A small **Discovery Marsh** investigation before any broader habitat simulation, with explicit observations and a limited, explainable model.
- [ ] Upper-elementary number, geometry and story-evidence tasks where they fit existing families.
- [ ] Pilot **Skywatch Isles** with one reusable robot routine, one blueprint mode and Light Lab's older modes, in code-drawn 2D scenes.
- [ ] Projects with several short sessions of optional work, saved at meaningful steps; she can stop after any step.
- [ ] Compare two results, pick a useful piece of evidence, or explain a choice through pictures, word choices or optional writing, with spoken help.

Exit milestone: a project supports planning, testing, revising and showing the result; different valid approaches reach the ending; and her evidence can be revisited beside the creation.

### How familiar games keep growing

**Games grow through families of modes.** A counting game becomes equal sharing, then grouping, then a recipe or packing problem; a route game gains loops, conditions and reusable subroutes. Keep the original activity recognizable, with a deeper decision at each step. A mode earns its place through play, not bigger numbers or quicker responses. Some favorites (bubble popping, dressing the pet, free painting) can stay simple toys for an older child; not every game needs to reach grade 5. Avoid making every game teach arithmetic: language, music, spatial thinking, inquiry, coordination, creativity and cooperation all have a place.

Everything in the three right-hand columns is proposed; steps already built are in [GAMES.md](GAMES.md). Choose modes by readiness and interest, never by advancing the whole library at once.

| Family | Early elementary | Middle elementary | Upper elementary |
| --- | --- | --- | --- |
| **Duck Pond, Monster Munch, Little Helpers, Scoop Shop, Lasso Loops** | Compose and decompose small totals; explain how many more are needed | Arrays, division with visible leftovers, equal pieces of a whole | Equivalent fractions, decimal amounts, scaling a small order or recipe with visual models |
| **Word Monsters, Letter Trails** | Reviewed sound and word combinations; short labels that matter in a scene | Prefixes and suffixes; choosing a word that fits a clue or sentence | Word parts and context for unfamiliar words; compose or revise a short message with spoken support |
| **Story Steps, Photo Safari** | Retell a sequence; match a spoken clue to an event | Infer a cause; choose an ending supported by clues; organize a short narrative | Compare two accounts; select supporting details; revise an explanation or create a branching story |
| **Robot Path, Egg Catch, Mail Carrier** | Repair one wrong command; compare two routes | Simple conditions, reusable route chunks, debugging a visible trace | Small functions or nested loops, several constraints, explaining a revision |
| **Size Parade, Bug Builder, Puzzle Pals, Rainbow Fingers, Block Tower** | Measuring with equal units, rotation, symmetry, composing shapes | Area and perimeter, tiling, equivalent shapes, following and changing a blueprint | Packing unit cubes for volume, coordinate designs, relating a drawing to a construction |
| **Sink or Float, Peg Garden, Bouncy Launch, Ramp Race, Chain Reaction** | Predict and observe; compare two trials with obvious differences | Change one variable, repeat a test, record outcomes in a picture table | Read graphs, compare evidence, notice a model's limits, improve an experiment |
| **Jelly Drums, Song Maker, Sound Garden, Beat Builder** | Rhythm conversations, phrases, musical turn-taking | Contrasting sections and layered rhythms; a response to a phrase | Compose for a story or event; revise a piece after listening; keep the pentatonic pitch rules |
| **Duckling Parade, Roundup, Dot Link, Bounce Back** | Follow patterns, sort by a stated rule, cooperate toward a visible goal | Combine attributes, plan an order of actions, explain a partner strategy | Optional constraint puzzles or cooperative remixes where the controls still feel good; otherwise relaxing favorites |
| **Weather Wardrobe, Feelings Faces, community errands** | Plan a short outing; consider what a friend might need | Read a map or simple timetable, coordinate roles, compare plausible perspectives | Plan a shared event with several needs and explain a compromise; feelings and family routines never have one correct answer |

The presentation can grow too: the pet becomes a companion in planning and investigating; older modes can use quieter feedback, richer tools and optional explanations in the same art style; a saved project shelf lets her choose what to continue or show a grown-up. Keep narration replayable, help easy to request, and celebrations at meaningful stopping points.

### Zone concepts

Names and boundaries are working proposals. Each zone starts as one small place with a host and a few activities; it needs no separate engine, economy or complete curriculum. A zone can hold several subjects and more than one learning range, and the same game identity can appear in several zones with an appropriate mode and a clear return route.

| Zone | Identity and recurring host | First small expansion | Later growth |
| --- | --- | --- | --- |
| **Wonder Woods** (place built) | A trail of hollow trees, streams and signs; Hazel, the squirrel postkeeper from Mail Carrier's map | Seesaw Balance 8–9, Robot Path loops and Mail Carrier's map (built); **the Woodland Picnic** uses all three | Older Peekaround Island modes, listening clues, short stories, gentle classification puzzles |
| **Maker Harbor** | Floating workshops and a friendly ferry crew; a beaver builder | Little Helpers' equal groups into dock loads; Mail Carrier into dock routes; Chain Reaction and Ferry Jam (built) as harbor activities | Shape Buddies, Wobble Works, area and volume blueprints, a **Ferry Fair** project |
| **Storybook Square** | A library, puppet stage and post office; an owl storyteller | Story Steps into clue-based endings; Word Monsters into meaningful word parts; **Silly Describer** | Story Theater, alternative viewpoints, an illustrated newspaper saved locally, **the Mixed-Up Invitations** mystery |
| **Discovery Marsh** | Boardwalks, ponds and an observation hut; a patient heron naturalist | Photo Safari into observation records; Sink or Float into repeatable trials; a small **Habitat Helpers** model | Compare habitat needs, chart observations, test one variable, design a visitor garden with several valid solutions |
| **Skywatch Isles** | Hilltop observatories and model-building decks; a moth astronomer | A reusable Robot Path routine; a measured Bug Builder blueprint; Light Lab predictions and replays | Data stories, coordinate maps, a limited sun and shadow model, **the Lantern Observatory** project |

Every zone stays open. Neither birthdays, test results nor sticker counts become access gates, and returning to the original island stays easy. The treehouse and journal are shared destinations, so new zones enrich one personal world.

### What an expansion contains

A default scope, not a quota; a smaller release that deepens one favorite is useful too.

1. **Two extensions to familiar games**, each with a new decision or form of expression.
2. **At most one new interaction family**, such as cooperative shaping, beam routing or editable rules.
3. **One place, or a small addition to a place**, with a memorable host, clear landmarks and spoken navigation.
4. **One optional project** combining a few activities, with saved steps and a satisfying ending; free play stays directly available.
5. **One creation or known keepsake** to revisit in the treehouse or journal. Completed rounds keep the one-sticker reward; the project layer never duplicates it.
6. **Content review and verification**, including old-save behavior and regression checks for existing play.

Afterwards, decide what she wants to repeat, what confused her, and whether a fresh arrangement still makes sense. Expand the successful activity before filling out a whole zone.

### Shared systems to change only when a slice needs them

| System | Today | Proposed evolution and safeguard |
| --- | --- | --- |
| **Places and learning ranges** | A `Place` has one `band`; places and bands correspond one to one, and a place lists every game supporting its band | Give thematic zones their own stable identity and explicit activity entries, separate from band selection. Keep the original trail as the familiar start; never append one giant scrolling place per grade |
| **Routing and home** | A game returns to its launching band's place | Carry the launching zone and its position as navigation context, so one game can return to the harbor, the woods or the original place without duplicating its ID. Keep current routes until the migration is implemented and tested |
| **Difficulty and progress** | One level, pin and history per game, within the played band's range | Extend coherent ladders first. If branches teach different skills, give modes stable keys and define how old levels and pins map. Never silently renumber saved levels, award a grade, or infer a global age from performance |
| **Results and projects** | `RoundResult` carries misses and hints, plus optional `creation`, `discoveries` and couch scores; the shell saves the round and awards the sticker | Add typed results only for a concrete project need (a chosen route, a created pattern, an observation). Save project steps once so retries and reloads cannot duplicate awards. Never embed one game's scene inside another's lifecycle |
| **Creations and journal** | Bounded, versioned picture, painting, pixel design and tune slots; sixteen known journal entries | Add constructions, programs and observations the same way: limits, explicit replacement, migration, backup and restore, all local and offline |
| **Content and support** | Broad skill labels and spoken line IDs | For new modes, author a learning goal, prior concepts, examples, acceptable answers, misconceptions and graduated help: content guides, not mastery tests or prerequisite locks |

Resolve the place/band separation in E1, before several zones depend on it. Tests that assume one place per band must keep protecting the original trail and cover every new route; audit parent settings, birthdays, session behavior and backups in the same change. Longer puzzles never need faster fingers or mandatory reading. No currency grinding, timed access, online accounts, or care that deteriorates between visits.

### Educational reference points

The sequence borrows a few curriculum reference points, not a claim of alignment. Grade 3 math emphasizes multiplication and division, fractions, area and shape reasoning; grade 5 develops fraction and decimal operations and volume ([grade 3](https://www.thecorestandards.org/Math/Content/3/introduction/), [grade 5](https://www.thecorestandards.org/Math/Content/5/introduction/)). For stories, using details from a text to support an explanation and understanding word parts are useful goals; listening comprehension and independent decoding are different things to observe ([grade 5 literature](https://www.thecorestandards.org/ELA-Literacy/RL/5/), [foundational skills](https://www.thecorestandards.org/ELA-Literacy/RF/5/)). For investigations, plan fair comparisons, control relevant variables, and use observations as evidence; check the simulation's limits before presenting a game result as a fact about the world ([NGSS grades 3–5 engineering design](https://www.nextgenscience.org/topic-arrangement/3-5engineering-design)). Before calling a mode ready, review its facts, explanations, language, solvability, alternatives and behavior with help. Completion with hints is valuable play, not an assessment.

## Planning rules

**Ready to build** when you can state the **fun action**, the **specific skill**, the **smallest complete round**, the **starting support**, and **what deeper play changes**; which existing game could host it as a mode instead; and at least one example of a mistake or experiment and how the game explains it. Creative play is never forced into a single correct answer.

**Done** when authored or generated tasks are solvable and unambiguous (in rule tests), supported completion works, interruptions and resizing behave, prompts are spoken, rewards and saves are stable, the checks at the right tier of the [verification budget](../AGENTS.md#verification-budget) have run, and a fresh arrangement still makes sense beyond one memorized answer. Then update the README row, this file, [GAMES.md](GAMES.md) and the verification log. Assisted completion is worthwhile play but not evidence of mastery; content and device validation are separate from a passing build.

**Goals, scores and rewards** (carried over from the [play and progression review](archive/PLAY-AND-PROGRESSION.md)):

- Stickers stay predictable and repeatable: one per completed round, with help or without. Never delete duplicates or reinterpret old round history as an achievement.
- A unique achievement names a known condition, visible beforehand, and is earned once; repeating improves a record instead of adding copies.
- Personal bests come before any shared board, and scores keep their own units (slides, launches, guesses); never add them into one island ranking. Compare only the same course version and support category, with helped and unhelped runs kept apart.
- No daily resets, streaks, required returns or lost progress. Scores never go on creative or exploratory play, and optional challenges never withhold a story ending or the ordinary reward.
- The question for a grown-up prototype is whether the player would choose to play again because there is something to improve, discover or make; minutes played and stickers earned do not answer it.

## Parked or decided

- **Native Nintendo Switch port:** exploratory only. There is no browser on the Switch; a port needs Nintendo developer approval, development hardware and a rewrite of rendering, input, audio, speech and saves. Prove one controller-driven game on approved hardware before estimating more. Research: [Party and Switch](archive/PARTY-AND-SWITCH.md#running-a-game-on-the-original-switch).
- **A separate "Grown-up Play" launcher with its own adult save:** superseded by couch play, which has its own save and the challenge courses.
- **Leaderboards:** a local pass-and-play family board is a reasonable experiment once a second person wants to compare; public online rankings need a service, identity and score validation and are a later adult-only option.
- **More party structure:** a dice board, item economy, online matchmaking or controller support for every game is not needed. Simultaneous face-off boards and the daughter joining couch play as a co-pilot (any button cheers; a pet takes the other side) are proposals for later.
- **An opt-in "Keep playing" mode** for selected short games, replacing the blocking celebration with a small acknowledgment while still awarding one sticker per round and leaving goodnight to the session setting: a proposal to try on a few games first.
- **Parent-recorded voice lines:** needs an explicit decision against the no-audio-files rule, plus offline storage and consent behavior, before any work.
