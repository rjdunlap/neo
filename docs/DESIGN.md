# Puddle Island: design and architecture

## Vision

Puddle Island is a home-made iPad learning game for the developer's daughter, who is about to turn one in October 2026. Its current activities grow from lap play through roughly age six. The longer-term direction reaches elementary school through roughly grade 5 / age eleven, starting with a 6–8 pilot. The inspiration is the discovery and playful learning of JumpStart, the companion and world of Neopets, and the variety of small games found on Kongregate.

The island is an age trail: each place contains the activities for its band. There are forty-three games. [ROADMAP.md](ROADMAP.md) separates completed milestones, work needing verification, and proposals. [ARCADE-IDEAS.md](ARCADE-IDEAS.md) holds the game and world concepts with their learning goals and inspiration. This document describes current behavior, with future direction explicitly labeled below.

The developer is not an artist. All game artwork is generated in code with PixiJS Graphics, and sounds and music are synthesized with Web Audio. The visual direction should be achievable with the shared shape, animal, scenery, and particle builders, without sprites or an external asset pipeline.

## Play principles

- Large touch targets (at least 100 logical units), immediate touch-down feedback, and forgiving dragging.
- Spoken instructions; reading is never required to play. Tapping the pet repeats the instruction.
- Gentle feedback for mistakes, hints, and a glow after two misses. No failure screens.
- Predictable rewards: one sticker for each completed round.
- No ads, purchases, streaks, or timers that end a round. Session length is a grown-up setting, with a gentle goodnight flow.
- Early play supports a grown-up and child playing together. Games can include co-play prompts and related off-screen activities.
- Difficulty changes quietly within a chosen age band. Grown-ups can pin a level.

## Current implementation

The table describes the app with 43 games: the follow-on batch is deployed, and the newest eight and the subject-card navigation prototype are in the working tree. Automated checks are recorded in [VERIFICATION.md](VERIFICATION.md). The verification log records checks performed, rather than a guarantee about every subsequent local edit; judgments of fun and real-iPad checks for the newest games are still open in the [roadmap](ROADMAP.md).

| Area | Current behavior |
| --- | --- |
| Platform | TypeScript, Vite, PixiJS 8; installable PWA with an offline asset cache |
| Navigation | Start screen, hatching, an age-trail island map of four places, place scenes with every game for that age laid out, game host, sticker book, goodnight scene |
| Games | All 43 are listed with modes and bands in the [README](../README.md#the-island-and-its-games); current registrations live in `src/games/registry.ts` |
| Progression | Per-game level ladders, automatic adjustment within age bands, grown-up level pins. Rainbow Fingers (6 levels) and Splish Splash (8) now reach pre-K with new modes rather than topping out early |
| Pet | Four-tap hatching, eight colors, spoken name choices and grown-up name entry; customized guide shared across scenes |
| Rewards | Five illustrated pages with free sticker placement and a paged tray; positions saved as page fractions |
| Saves | Version 2 local IndexedDB record with migration from version 1, pet and world state, sticker placement, backup and restore |
| Grown-up controls | Child name, pet name and color, age band (her pet's home place and where play starts), session length, place layout, sound settings, play history, and level settings |
| Audio | Synthesized sound effects and music, device speech driven by line IDs |

The current age bands in `src/progress/bands.ts` are lap (18–24 months), toddler (2–3 years), preschool (3–4 years), and pre-K (5–6 years). These are application groupings, not developmental assessments.

Each game supplies level ranges for the bands it supports. Two consecutive smooth rounds at the current level (at most one miss and no hints) move up; two struggling rounds (at least four misses or at least two hints per round) move down. Both changes stay within the selected band's range. Modes can change the task itself, rather than merely adding more objects.

## Proposed direction: a connected world that grows with her

These systems and older age ranges are proposals, not current app behavior. The [roadmap](ROADMAP.md) orders small pilots before broader infrastructure; the [elementary roadmap](ELEMENTARY-ROADMAP.md) develops the longer-term game families, zones, and milestones.

**Short adventures give familiar games a purpose.** A recurring island friend asks for help with a picnic, a delivery, or a tune. Two or three activities visibly change a small scene, followed by a complete ending. A picture journal replays requests and resumes after any break; free play stays available. The first pilot can advance on existing round completions. Passing specific creations or choices between activities needs a deliberate extension beyond the current `{ misses, hints }` result.

**A home and journal give play a lasting personal result.** Start with one room and free furnishings, then add a place to display a sticker or drawing and play a saved tune. Discoveries have known sources and narrated observations. Keep local storage bounded and include new data in migration, backup, restore, and offline checks. Nothing deteriorates while away; possessions are never spent to continue playing. Preserve one sticker per completed round and prevent the story layer from awarding it twice.

**Older play adds reasoning and expression.** Target 6–8 first: balancing quantities, equal sharing, clue-based stories, editable robot loops, and experiments with replay. Later modes can grow toward fractions/decimals, data, evidence in stories, reusable programs, and projects through upper elementary. Keep spoken support and large targets, and let children revise a plan, undo, or ask for a worked example. Reading can be practiced inside a game while navigation and explanations remain available aloud. No fifth band exists yet; a new selectable range needs support across levels, saves, parent controls, speech, and tests.

**Themed zones organize the growing world.** Wonder Woods, Maker Harbor, Storybook Square, Discovery Marsh, and Skywatch Isles are proposed places with different hosts, activities, and projects. Their identity should be separate from learning range so a place can welcome several levels and a game can appear in several places. Current `Place.band` and band-based return routes do not support this yet. Introduce explicit zone identity and launch/return context with the first elementary zone, preserving the original trail, stable game IDs, saved levels, and access to younger play.

The design test for an activity is whether the skill changes the play: quantities fill plates, a clue finds a friend, a revised route reaches a destination. Creative choices and experimental predictions should not become incorrect answers. Fun can come from making, discovering, caring, and trying another solution as well as finishing a puzzle. Optional personal challenges must not withhold the story ending or ordinary reward.

## Architecture

### Application and scenes

`src/app/App.ts` owns the Pixi application, scene transitions, logical view, and frame loop. `Scene.ts` provides content, particle, and UI layers plus tracked updates. `routes.ts` creates scenes, while `session.ts` handles the session timer. The 1024×768 design area fits the display; layouts respond to the available logical width and height.

The game shell in `GameScene.ts` owns navigation, the guide pet, instructions, co-play prompts, saving, difficulty progression, stickers, and celebrations. This lets a new minigame concentrate on its own activity.

### Minigame contract

Each `src/games/<id>/index.ts` exports a `GameModule`, registered in `src/games/registry.ts`. Metadata includes its subject (the `region` field, which groups it inside a place), supported bands, level ranges and descriptions, spoken title, music, hub icon, and sticker drawing. `create(ctx)` returns a game with `start`, `update`, `resize`, and `destroy` methods.

A game draws into `ctx.stage`, uses the shared input, drag, tween, particle, and voice helpers, and reports completion through `ctx.finish({ misses, hints })`. Spoken lines belong in `src/content/voice-script.ts`. Shared art and audio should be reused so new activities feel part of the same world.

### Art, input, and sound

- `src/art/`: palette, parametric critters, props, shapes, scenery, particles, and sticker framing.
- `src/engine/`: view scaling, random generation, tweens, touch filtering, dragging, and `ball.ts`, a small deterministic ball, peg and wall simulation (with an optional ceiling and springy "kick" pegs) whose `simulate()` previews a shot. A tween whose target is destroyed mid-flight ends instead of freezing the scene.
- `src/audio/`: audio unlock and buses, instruments, sound effects, generative music, and speech.

Use the shared palette and pentatonic note steps. Route taps through `onTap` and drags through `drag.ts` for consistent cooldown, palm rejection, and finger offset behavior.

### Persistence and grown-up UI

`src/progress/save.ts` defines the save record and `migrate()`, which repairs incomplete or invalid input. `store.ts` persists it through `idb-keyval`: most changes are batched for 300 ms and flushed when the page is hidden, but the shell writes a finished round and its sticker immediately, because a write that only starts as the page closes can be lost. New fields need defaults, migration behavior, and tests so existing progress survives updates.

The current save contains profile, settings, game statistics and recent round history, and earned sticker records. It also stores pet customization, the highest band celebrated on the map, and optional normalized sticker placements. (An earlier list of opened regions is dropped on load.) Invalid or unknown placement pages become unplaced stickers; legacy saves keep their progress and start with an unhatched pet.

Grown-up controls are plain HTML in `src/parent/panel.ts`. The parent gate is on the island map and requires holding both top corners for three seconds.

### Delivery and verification

Vite builds a static site; `vite-plugin-pwa` generates the manifest and offline cache. Pushes to `main` deploy through GitHub Actions. Commit and push only when asked.

Unit tests cover saves, difficulty, game registry constraints, view geometry, critters, and the musical scale. The dev-only `neo` and `kit` browser helpers support scripted play-throughs. New game verification should include a completed round, wrong answers, hints, and resizing. Production offline behavior must be checked with the built app, separately from the dev server.

## World and activities

### The age trail

The island map is the age selection. `src/content/places.ts` defines four places on a switchback trail, from the shore to the summit: Puddle Lagoon (lap), Daisy Meadow (toddler), Bumpy Hills (preschool) and Starry Peak (pre-K). Each place holds every game that supports its band, at that band's levels, so a game that grows with the child stands in several places. Within a place, games are grouped by subject using the ten stable IDs in `src/content/world.ts` (senses, music, art, animals, numbers, everyday life, colors and shapes, puzzles, stories, science); those IDs used to be map regions.

Every place is open to everyone. The grown-up's age band is the child's home: the pet waits beside that place on the map, and the play button goes straight there. Raising the band throws the pet a birthday and walks it up the trail once; the highest celebrated band is saved, so lowering and restoring a band does not replay it.

A place lays out its games in a zigzag of two rows along a sandy path. When they do not fit on one screen, the land swipes sideways, with momentum, and arrow buttons page it. Because a swipe may start on a game, a game opens when the finger lifts without having swiped; it still squishes on touch-down so the response is immediate. Each place remembers its scroll for the session, so coming home from a game lands where the child left.

The grown-up **Finding games** setting can instead select `SubjectPlaceScene`: four illustrated subject cards per page, then up to four game cards in the chosen subject. Arrows and horizontal swipes page both views; moving more than 24 logical units cancels selection. Card presses respond immediately, and release selects. Native cancellation/lost-release listeners are released when leaving. A picture-grid button returns to the subject choices, with separate subject-list and game-page memory per band for the session. Spoken names and the guide support navigation without reading. The original `PlaceScene` remains the default and retains its separate scroll memory. `settings.placeLayout` is `path` or `subjects`; missing or invalid values migrate to `path`, and backups preserve the choice. The iPad comparison remains open.


Pattern Train advances from AB through AAB/ABB and ABC, animal patterns, missing middle cars, bell patterns, and two-car gaps. Bell choices can be auditioned before confirming. Memory Match grows from four to sixteen cards, then teaches number/dot, two-attribute, and upper/lowercase matches. Exploring unseen cards does not count as a miss.

Letter Trails defines all 26 capitals as ordered strokes. A firefly and moving beacon guide the finger; successive checkpoints enforce the trail while tolerating imprecise motion. Each finished letter becomes a code-drawn illustration with a spoken association. Top levels spell short words and the child's name. Accented Latin names normalize to A–Z; names with no supported letters fall back to PIP. Additional scripts would need their own stroke data.

Robot Path uses a visible arrow program, a play button, and editable steps. Its six levels add turns, grid size, rocks, and longer routes. Every board has a tested solution within its program limit. The standard gentle mistake feedback and hint glow apply across the new games.

The second expansion broadens toddler play and introduces measurement, symmetry, and causal storytelling. Each new game supports toddler, preschool, and pre-K and uses the existing save, adaptive difficulty, and reward systems; no save migration is needed.

- **Size Parade:** four levels ask for the biggest or smallest friend across four short questions. Four later levels ask the child to drag three or five friends into an ascending or descending line. Friends share an appearance and baseline, so size determines the answer; positions are shuffled. A fixed large hit area keeps the smallest friend easy to select.
- **Bug Builder:** two guided levels show pale matching shape outlines; two copy levels use a separate small model; three mirror levels ask for matching wings, ending with two columns and six spots. Reusable stamps return to the tray. The final palette contains repeated shapes and colors, requiring both attributes to match. Drops outside a spot are exploration, not mistakes.
- **Story Steps:** seven levels progress from a shown beginning through three- and four-picture ordering, missing middles, and unrelated distractors. Four stories depict a flower, a block tower, a snow friend, and a butterfly. Completed pictures are narrated in sequence; the replay button reads only already placed pictures. Cards belong to a known story and stage, so every missing position has one answer.

These activities open Puzzle Peaks, Tinker Lab, and Story Grove at toddler. Band labels remain parent-selected starting points rather than assessments.

The third expansion adds two games that start at lap, because the child is youngest now and lap play had only six activities. Both support all four bands.

- **Feelings Faces (Cozy Village):** the critter gained `sad` and `calm` moods, with brows and a tear so feelings read even at sticker size. Lap play is cause and effect: four feeling bubbles change the big pet's face, with a matching sound, and tapping a sad pet gives it a hug. Later levels match the pet's face, find a named feeling, choose what helps a need (a hug, a pillow, an apple, or a scarf), watch a small event and choose how the pet feels (the pet stays `calm` until answered, so the event carries the answer), and find which of four friends feels a named feeling. The big pet replaces the corner guide and repeats the instruction when tapped.
- **Monster Munch (Counting Cove):** a code-drawn monster gapes, chews, burps, and shows eaten food in a tummy window. It complements Duck Pond rather than repeating it: lap levels feed by tapping, toddler levels count along and give one cookie to each monster, and preschool levels ask for an exact order (cookies, or cookies and apples) that the child completes by ringing a bell. A full monster refuses another of that food, which counts as a miss. Pre-K shares cookies fairly among two or three monsters; unequal shares hand the extras back to the tray, then the child says how many each monster got.

Pure rules live in each game's `logic.ts` with unit tests for answer uniqueness, tray sizes, refusals, and fair shares.

## Fourth expansion

Four more games, all starting at lap with cause and effect and growing to pre-K:

- **Song Maker (music):** a looping grid of jelly beads; higher rows sound higher (pentatonic steps), and the playhead follows the background music's beat (`music.beats()`). Free play at lap and toddler; then copying a song from shadow notes, then from a small card; continuing a repeating pattern (stairs, hops, zigzags); and finding a four-note tune by ear, where a wrong jelly is followed by the right note so the difference can be heard.
- **Puzzle Pals (puzzles):** six code-drawn scenes (a cow on the farm, a duck in the pond, and so on) are rendered once into a texture and cut into 2 to 12 pieces. Faint pictures guide the early levels; later ones show only an empty frame. Dropping off the frame is exploration; a wrong place is a gentle miss. The finished picture comes alive and the animal says hello.
- **Weather Wardrobe (everyday life):** sun, rain and snow fill the sky. At lap, tapping the sky changes the weather and the pet dresses itself; later the child picks one item, then every item that fits, then packs a suitcase for a two-weather trip. Each item belongs to exactly one weather, and a wrong choice says which weather it is for. Clothing is drawn in critter body coordinates and attached, so it hops with the pet.
- **Sink or Float (science):** things arc into a water tank; floaters bob and sinkers drift down trailing bubbles. Lap drops things in; then the voice names the result; then the child guesses before each test, and guesses never count as misses; then sorting into float and sink baskets, first with familiar things and then with surprises such as a floating apple and a sinking coin. A wrong sort is tested in the water before the thing goes to its basket.

## Arcade activities

The first arcade expansion adds Duckling Parade (steer a growing line), Scoop Shop (build an order), Roundup (guide a crowd), and Bouncy Launch (pull and release). They keep the motion and playful physical response of their inspirations while teaching quantities, patterns, sorting, memory, and comparison. All four span lap through pre-K; their rules live in each game's `logic.ts`, and their browser coverage is recorded in the verification log.

## Follow-on batch

Ten more games broaden language, listening, pretend play, catching, cooperation and number-as-quantity. All span lap through pre-K, keep their rules in `logic.ts` with unit tests, and are covered by the `batch` browser suite. Their original briefs are in [the arcade notebook](ARCADE-IDEAS.md#follow-on-batch-built).

- **Word Monsters (stories):** every letter is a little monster that says its sound. Tap to hear them, find a letter by name, then by its sound, match first sounds ("apple starts with aah"), then drag letters into slots to build three-letter words, at the top level from sounds alone with a spare letter. Lookalike letters are never neighbors. The sounds come from device speech (`sound.a`…`sound.z`), so they are stand-ins until checked on the iPad.
- **Peg Garden (senses):** a pearl drops through a sea garden; each flower bud it touches blooms and chimes, and nothing is lost. Later levels ask for every flower, the orange ones, then aiming a launcher at a numbered flower and at 1, 2, 3 in order. `ball.ts` simulates every board, so each numbered peg is reachable by some aim.
- **Fluffy Salon (art):** the pet sits in the chair with fluffy fur to grow, snip, comb, curl and color. Free play first, then one request at a time, two-part requests checked in the mirror ("short and blue"), then copying a pictured style. Requests never start already done, and the hint points to the tool for what to fix next.
- **Sound Garden (music):** garden creatures sing when touched. Listening questions follow: high or low (bird or frog), fast or slow (bunny or turtle), does the tune go up or down, then echoing a woodpecker's rhythm on a drum, judged forgivingly for wobble but not for the wrong rhythm.
- **Little Helpers (numbers):** tap a fruit and a helper runs to carry it; bigger fruit needs more helpers, shown by dots or a numeral. Later levels wait for a whistle so the child sends exactly enough: too few cannot lift, extras walk back. The top level asks how many more are needed when some are already helping.
- **Egg Catch (animals):** hens lay eggs that roll gently into a basket. Then the child slides the basket under slow falls, catches only brown eggs, and flips gates to route eggs down chutes. Missed eggs land in soft hay and hatch, so nothing breaks.
- **Mail Carrier (everyday life):** the pet delivers letters along a street. A letter shows a door color, a number of dots, or a numeral (1 to 9), and the child taps the matching mailbox; a wrong mailbox politely hands it back.
- **Photo Safari (stories):** animals are busy around the island; tap one to photograph it. Requests grow from the animal's name to what it is doing ("jumping") and where it is ("under the tree"), then both. Exactly one animal matches each request.
- **Bounce Back (senses):** a slow, giggly ball between two big paddles, with no score: bounces are counted together toward a goal. A grown-up takes the left paddle on the play-together level, and the pet steps in when no second finger is there. Later levels aim through stars and count a rally of ten.
- **Dot Link (colors and shapes):** tap dots to pop them, then drag a line through neighboring dots of one color; new dots drop in from the top. Later levels ask for one color, chains of four, and a closed square that clears every dot of that color. A move that counts always exists.

## Newest four (in the working tree)

Four more games: a 6–8-ready measurement game, pretend care, a pinball table, and the first microgame show. Each keeps its rules in `logic.ts` with unit tests and is covered by the `next` browser suite.

- **Seesaw Balance (science, toddler–pre-K):** friends, blocks, number weights and presents go on level trays at the ends of a springy seesaw, so only weight matters. Levels: make a little friend go up, choose a friend heavy enough, level it with blocks (one at a time, so it never tips too far), find the heaviest of three look-alike presents by testing pairs (testing is never a mistake) and put it in a wagon, make the same weight with different number weights (any combination counts), and weigh a mystery box with blocks then say how heavy it is.
- **Teddy Doctor (everyday life, lap–pre-K):** soft-toy patients (bear, cat, dog, bunny, pig) visit a little clinic; tools are reusable and dragged onto the body. Levels: tap boo-boos for bandages, bandage the part the patient names, choose what helps a symptom you can see (ice for a bump, a tissue for sniffles, a warm bottle for a tummy ache, socks for cold feet), then the same from a spoken clue alone, where the tool must also land on the right body part, and check-ups (heart, temperature, ears) in the order on a picture card or in the order the patient says. Where a tool lands is judged by the nearest body part, and a tap on boo-boos goes to the nearest one.
- **Bumper Garden (senses, lap–pre-K):** a ladybug ball bounces around flower bumpers on a garden table. It never drains: past the flippers a flower pot catches it and pops it back up. Tapping either half of the screen flips that side's flipper; young levels get a wider reach. Levels: launch for fun, flip until every flower blooms, bloom one color, bump numbered flowers in order. On goal levels a shot that blooms nothing wanted is a gentle miss; two in a row light the wanted flowers and aim the next launch at one (found by simulating the table).
- **Quick Tricks (puzzles, toddler–pre-K):** one show of three tricks, one sticker. Umbrella Up (hold a leaf above a bunny in the rain; at pre-K, choose the leaf big enough for two friends), Sock Gobbler (give the monster the partner sock, by color, then by color and pattern), and Bridge Stretch (stretch a springy plank to the far bank; at pre-K, choose the one plank long enough). An arrow appears after each trick's payoff and the child moves on when ready; misses are summed across the show, with at most one hint per trick.

## Document provenance

This local document maintains current design decisions from the original brief, implementation, and later planning. The local idea notebook consolidates future concepts; the roadmap is the active backlog.

The [historical design artifact](https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913) is retained only as a reference. Working on the project does not require access to that service. Keep current decisions and status in this repository.

## Creative and sharing expansion (working tree, 2026-10-06)

Four more games bring the local catalog to 43. Their complete briefs are in the arcade notebook and browser coverage is in the `creative` suite.

- **Stamp Studio (art, lap–pre-K):** two simple lap modes stamp stars or animals. Later modes offer colors, moving stamps, two sizes, quarter-turn rotation and spoken garden/story invitations. Any picture is valid; the green arrow can finish after the first stamp. Undo removes the latest stamp, and 24 stamps bound the scene. Coordinates stay normalized when resizing. Pictures last only for the round; saved creations remain a proposal.
- **Pet Kitchen (numbers, toddler–pre-K):** cut one or two sandwiches into halves or quarters, move equal pieces between plates, then serve. Both halves and quarters are accepted when they share the wholes equally. A round-arrow control restores the wholes to try another cut. The last two levels double two kinds of fruit on a picture recipe, with undo. Only unsuccessful serving checks count as misses; cutting, arranging and undo are exploration. Two misses highlight a useful next action.
- **Rhythm Neighbors (music, lap–pre-K):** two lap modes let taps make a bird call and frog chorus. Later levels alternate a bird call with a different pictured frog reply, add a second frog voice, then short/long rhythm gaps. The relative-gap judge is shared with Sound Garden. Explicit submission avoids any deadline; replay demonstrates both parts. After two misses, or when help is requested, guided play highlights the next frog and accepts the correct sequence at any pace. Three exchanges finish with a short duet and one sticker.
- **Tangram Town (colors/shapes, toddler–pre-K):** six authored house, boat, cottage and rocket puzzles use shuffled large pieces. Quarter-turn controls rotate the selected piece; identical triangles and symmetric rectangle/square rotations are accepted. Later silhouettes can reveal outlines and orient the next piece through help. Off-board drops and turning are exploration. Wrong placements on the picture get a spoken hint and a glow after two misses. Help affects hint accounting.

## Deeper familiar play (working tree, 2026-10-06)

Quick Tricks keeps levels 1–3 intact and appends levels 4–6: **Parcel Turn**, **Picnic Places**, and **Last Berry** in a second three-trick show. Rotate and fit parcels; give each friend a bowl (the top level begins partly set); add to a visible starting quantity and undo extras to make four, five or six berries. Each trick has its own gentle hint after two misses, and the green arrow moves on when ready. The whole show still awards one sticker.

Seesaw Balance appends level 7: two identical hidden weights balance together; the child divides the visible block total into two equal groups to name one box's weight. Wrong answers demonstrate the two groups aloud. Existing levels and saved pins keep their numbers. This is a supported pre-K bridge toward the proposed 6–8 pilot; no older band or zone was introduced.

Rainbow Fingers and Fluffy Salon widen lap play to include their existing second, unjudged free-play modes (color pots; all salon tools). Their first modes and later level numbers are unchanged. The two new lap-supporting games each also begin with two simple modes. Photo Safari and Teddy Doctor also open their level 2 to lap play: finding a named animal ("the pig") or body part ("on my ear"), the naming games a grown-up plays on the lap, with the usual boing, spoken hint and glow. Peg Garden stays at one lap level: its bloom level has no guaranteed finish if the same spot is tapped again and again.
