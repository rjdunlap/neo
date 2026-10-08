# Puddle Island (project Neo)

A home-made iPad learning game in the spirit of JumpStart and Neopets: playful learning, a familiar pet, and an island to explore. Current age bands run from lap play through early school (ages 6–8); the long-term roadmap grows through elementary school, roughly grade 5 / age eleven. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)

[Design and architecture](docs/DESIGN.md) · [Roadmap](docs/ROADMAP.md) · [Game and world ideas](docs/ARCADE-IDEAS.md) · [Verification log](docs/VERIFICATION.md) · [Contributor guidance](AGENTS.md)

**Couch play** for two grown-ups, with a controller or keyboard, is built: a separate trip of six stops with a how-to-play screen before each game, games that open as trips are finished, and a face-off mode. See [Couch play](#couch-play). A trip now ends with a finale and a keepsake, and three challenge courses (Penguin Slide's Pond Practice and Five Ponds, and Bouncy Launch's Cloud Hopper) keep personal bests and badges. Still proposals: [further courses and the small room](docs/PLAY-AND-PROGRESSION.md), and the rest of [the wider Island Party](docs/PARTY-AND-SWITCH.md). The child's island is unchanged: it still uses short rounds and sticker celebrations, and every game stays open.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: saves, difficulty, the age trail, every game's rules, tracing, matching
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** open <https://rjdunlap.github.io/neo/> in Safari on the iPad → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off. New versions arrive the next time it's opened online.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

## The island and its games

The island is an **age trail**. It climbs from **Puddle Lagoon** (lap, 18–24 months) on the shore through **Daisy Meadow** (toddler) and **Bumpy Hills** (preschool) to **Starry Peak** (pre-K), and over the top to **Wonder Woods** (early school, ages 6–8). Each place lays out every game for that age, at that age's levels. A game that grows with her, like Bubble Pop, stands in each place it supports. The play button goes straight to her own place; the island button there opens the trail, where her pet waits by her place and every place is open to explore. When there are more games than fit, swipe the land sideways or tap the arrows. When a grown-up moves her up an age band, the pet has a birthday and walks up the trail.

There are seventy games, listed below. "Ages" lists the places each game appears in; "school" is the early-school band at Wonder Woods (ages 6–8), where 49 games play their most demanding levels. The [verification log](docs/VERIFICATION.md) records which checks each one has passed; judgments of fun and clarity, and real-iPad checks, are still open for the newest games (see the [roadmap](docs/ROADMAP.md#1-finish-and-verify-the-current-work)).

| Game | Ages | Starts as | Grows into |
| --- | --- | --- | --- |
| Bubble Pop | lap–school | pop anything | pop one color, then numbers in order, then pairs of bubbles that make 5 and 10 |
| Rainbow Fingers | lap–school | rainbow or color-pot finger painting | paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl |
| Jelly Drums | lap–school | free play on five notes | copy a tune of 2 to 5 notes |
| Song Maker | lap–school | tap jellies on a looping beat | copy songs by shadows or a card, continue a pattern, find a tune by ear |
| Peekaboo Barn | lap–pre-K | tap to find who's hiding | find an animal, then remember hiding places |
| Splish Splash | lap–pre-K | scrub mud off the pet | named body parts in a shuffled order, two at once, then "first … then …" |
| Feelings Faces | lap–pre-K | tap bubbles to see the pet feel happy, sad, sleepy or surprised | match and name faces, choose what helps, say why a feeling happened, find a friend's feeling |
| Weather Wardrobe | lap–pre-K | tap the sky to change the weather | dress the pet for sun, rain or snow, then pack for a two-weather trip |
| Duck Pond | lap–school | count along as ducks hop in | put N in, how many?, adding and taking away, how many more make ten |
| Monster Munch | lap–school | tap cookies into a hungry monster | count along, one cookie each, feed exactly N then ring the bell, cookies and apples, fair sharing, sharing with leftovers |
| Puzzle Pals | lap–school | finish a two-piece picture | three to twelve pieces, first over a faint picture, then an empty frame |
| Sink or Float | lap–school | drop things in the water and watch | guess and test, sort into baskets, surprises like a floating apple |
| Duckling Parade | lap–pre-K | tap the grass to walk Mama Duck; ducklings fall in behind | lead them to the pond, bring exactly N, find one color, build a color pattern in line |
| Scoop Shop | lap–school | tap tubs to pile scoops on a cone for a customer | one color, two scoops, "four blue scoops", three flavors stacked in order, then from memory |
| Roundup | lap–pre-K | tap an animal and it hops into its pen | shoo animals through the gate with a finger, sort pigs and bunnies, put exactly N in and ring the bell |
| Bouncy Launch | lap–school | tap the spring and the pet boings onto a cloud | pull back farther to fly farther, land on the star cloud, then a numbered cloud, farther or nearer than last time |
| Word Monsters | lap–school | tap letter monsters to hear their sounds | find a letter by name, then by its sound, first sounds, build three-letter words, then word families (hat, cat, bat) |
| Peg Garden | lap–pre-K | tap the top and a pearl tumbles through flower pegs | bloom every flower, the four orange ones, aim for a numbered flower, then 1, 2, 3 in order |
| Fluffy Salon | lap–pre-K | grow and color fur, then freely snip and curl | every tool (grow, snip, comb, curl, color), then requests like "short and blue", then copy a pictured style |
| Sound Garden | lap–pre-K | tap garden friends to hear them sing | high or low, fast or slow, does the tune go up or down, echo a rhythm on the drum |
| Little Helpers | lap–school | tap a fruit and a helper carries it home | send enough helpers to lift it, exactly the number shown, "how many more?", then equal groups (a bunch where every fruit needs the same team) |
| Egg Catch | lap–school | tap a hen and her egg rolls into the basket | slide the basket to catch, catch only brown eggs, flip gates to route eggs, then predicting where an egg will land from gates already set |
| Mail Carrier | lap–school | tap any mailbox to post a letter | match colors, then dots, then house numbers 1 to 9; in Wonder Woods, read a picture map's key to find who lives where, then plan two deliveries in order |
| Photo Safari | lap–school | tap any animal to take its photo | photograph the animal named, then "the bunny jumping", "the duck under the tree", and both, then "the animal that is not sleeping" |
| Bounce Back | lap–pre-K | bounce a slow ball back to the pet with a huge paddle | keep a rally going, play with a grown-up on the other paddle, aim through stars, count to ten |
| Dot Link | lap–pre-K | tap dots to pop them | join two dots of one color, pop one color, chains of four, then close a square |
| Teddy Doctor | lap–school | tap boo-boos to put on bandages | bandage the part a patient names, choose what helps a bump or sniffles, then what helps from a spoken clue, check-ups in order from a card or from what the patient says |
| Bumper Garden | lap–pre-K | tap to launch a ladybug through flower bumpers | flip it back up until every flower blooms, bloom one color, bump numbered flowers in order |
| Shape Sorter | toddler–pre-K | one circle hole | six plain holes, one color, tilted pieces |
| Seesaw Balance | toddler–school | put a big friend on the seesaw so a little one goes up | which friend is heavy enough, level it with blocks, find the heaviest look-alike present, match a weight two ways, weigh one mystery box, infer one of two identical boxes, then take the same off both sides until a box is alone (boxes on both sides at the top) |
| Quick Tricks | toddler–school | a little show: hold a leaf over a bunny in the rain, find a sock's partner, stretch a bridge for a beetle | which leaf covers two friends, matching socks and bridge lengths; a second show turns parcels, sets picnic places and completes berry totals |
| Color Garden | toddler–pre-K | one basket | six colors with balloons and flowers |
| Size Parade | toddler–school | tap the bigger or smaller friend | order three, then five friends in either direction |
| Bug Builder | toddler–school | decorate matching shape outlines | copy a model, then mirror six spots using shape and color |
| Story Steps | toddler–school | finish a two-picture story | order four pictures, fill missing middles, leave out unrelated pictures |
| Pattern Train | preschool–school | AB patterns | AAB, ABB, ABC, animals, missing cars, bells, two gaps |
| Memory Match | preschool–school | four picture cards | sixteen cards, number↔dots, shape + color, A↔a |
| Letter Trails | preschool–school | follow a firefly along capital strokes | all 26 capitals, short words, the child's name |
| Stamp Studio | lap–school | press stars or animal stamps onto a picture | choose colors, arrange stamps, change size and orientation, tell a picture story; any creation can finish |
| Pet Kitchen | toddler–school | cut a sandwich in halves and share | quarters, sharing multiple wholes with alternative equal cuts, doubling a picture recipe |
| Rhythm Neighbors | lap–school | tap a bird and a frog chorus | trade different musical parts, follow two frog voices, play long/short replies with a guided option |
| Tangram Town | toddler–school | fit two big shapes into a house or boat | quarter-turn snaps, two triangles making a wall, a four-piece rocket, silhouettes with optional help |
| Peekaround Island | toddler–school | turn a little island to find who is hiding behind the tree | find a named friend, work out who is hiding from a picture card, put friends behind / in front of / next to the tree, two directions and then a half turn |
| Robot Path | pre-K–school | two steps to a star | turns, rocks, programs of up to eight steps, counted steps ("right ×4"), then loops that repeat the program |
| Light Lab | pre-K–school | tap mirrors to turn a sunbeam onto a sleeping flower | plan first and tap the sun to shine, rocks, two flowers on one beam, colored glass, four-mirror paths |
| Penguin Slide | preschool–school | tap the ice: the penguin slides until something stops it | plan two to six slides, two fish, soft snow that stops the penguin; undo and a hint arrow |
| Secret Code | pre-K–school | fill a door's slots with stones; each slot says yes or no | yellow "wrong place" marks, more slots and colors, codes with a repeated color |
| Frog Hop | preschool–school | hop to a number on the lily pads | one more and one less, adding and taking away as hops, how many hops between two numbers, a line to 20 |
| Market Stall | preschool–school | count out shell coins for the price | ones and twos, fives, adding two prices, paying two different ways, giving change from 10 |
| Garden Grow | lap–preschool | tap the soil: a seed grows into a singing flower | rain from a cloud, planting the color asked for, exactly so many seeds, two colors with a number of each |
| Clock Tower | pre-K–school | turn the short hand to an o'clock time | both hands, half past, quarter past and to, reading the clock for the time of day, one hour later |
| Garden Rows | pre-K–school | plant a 3 by 3 flower bed so each row has one of every flower | rows and columns, 4 by 4 beds with fewer flowers to start, a 5 by 5 bed; every bed has exactly one way to finish, and a flower that repeats will not stay |
| Ferry Jam | pre-K–school | drag boats along their lanes in a small harbor so the red ferry can reach the dock; nothing is a mistake, and undo is always there | bigger harbors (4 by 4, 5 by 5, 6 by 6) that need more slides in a planned order, with a glowing next slide after a long wander |
| Critter Crossing | pre-K–school | critters line up at a bridge gate; at first its rule is on the sign, then it is a secret: try critters one at a time, watch who crosses and who waits, then guess the rule | rules of one picture, "not" a picture, or two pictures together; a guess only counts as a mistake if it disagrees with something you saw |
| Pixel Pictures | preschool–school | copy a small picture square by square | two colors, finishing a mirror half, picture-logic puzzles with row and column numbers |
| Goodnight Room | lap–preschool | tap each friend to say goodnight until the room goes dark | say goodnight to the one named, then two in order |
| Animal Snack | lap–preschool | tap an animal and it munches its favorite snack | snacks float to their eaters, "who eats the carrot?", drag each snack to its animal, give 2 to 4 |
| Stop and Go | lap–preschool | tap the traffic light: red stops the car, green makes it go | send a car only on green, red light, green light with the pet, a two-road crossing that takes turns |
| Ramp Race | pre-K–school | tap the ramp to make it taller and roll a toy car | stop on a star, choose height and floor (carpet, wood, ice), fair tests comparing two lanes |
| Critter Sort | pre-K–school | drag critters into a hoop: "wearing a hat" | two hoops, overlapping hoops where the middle is both, guess the rule |
| Treasure Map | pre-K–school | dig where the apple row meets the red column | grid names like B3, putting things at named squares, following directions ("2 left, then 3 up") |
| Opposites | lap–pre-K | tap a picture: it flips to its opposite (big, small; open, closed) | find the one named, find the opposite among three, match opposite pairs |
| Picture Graph | pre-K–school | count critters and build their bars, one block each | which has the most and fewest, how many more, reading a finished graph (how many in all, which two are the same) |
| Rhyme Time | pre-K–school | which picture rhymes with "cat"? | four choices, find the rhyming pair, odd one out |
| Beat Builder | preschool–school | tap squares on a beat grid; the playhead loops | copy a beat you can see, copy one by ear, make a pattern repeat, a longer three-instrument beat |
| Inchworm Measure | pre-K–school | lay inchworms end to end along a leaf and count them | say how many worms long, compare two lengths, read a ruler even when the thing doesn't start at 0 |
| Block Tower | lap–school | tap to stack blocks, then knock the tower down | as tall as a friend, up to the flag, as tall as Bear's (or one taller or shorter), which leaning tower will stand, then stacking out past a table edge to touch a star |
| Lasso Loops | preschool–school | draw a loop around fireflies: they fly into a jar | loop exactly 2 or 3, jars of five and ten with the ones left over (34 is three tens and four), equal groups ("3 groups of 4") |
| Pet Says | lap–pre-K | the pet claps, stomps and waves; copy it, and a grown-up taps the arrow | body words ("touch your nose"), two moves in order, "Pet says" (move only when you hear it), freeze dance |
| Owl Walk Home | toddler–pre-K | turn over a color card and hop the owl to the next stone of that color | take turns with the pet to bring two, then three owls home together, then choose the owl a card carries farthest |

Within a place, games are grouped by subject: senses, music, art, animals, numbers, everyday life, colors and shapes, puzzles, stories, and science. Grown-ups → Finding games offers **Subject cards**, an optional prototype showing four large subject choices, then four games at a time. The original swiping path remains the default. Each layout remembers its own position for the session; returning from a game keeps the launching place and subject/page. Compare both on the iPad before choosing a default. A small gold **twinkle** marks every game she has not finished a round of yet (a subject card twinkles while it holds one), and after a round a **heart** beside the new sticker keeps the game on a **favorites shelf** of up to five above that place's games (or a first **Favorites** card in the subject layout). Neither gates anything: a second tap on the heart takes it back, and nothing expires or rotates.

### The Windy Picnic

Beside Daisy Meadow on the island map stands a picnic blanket: **the Windy Picnic**, the first island story (a pilot for roughly 4–8, open to every age). The wind has blown Juniper the gardener bunny's picnic into a muddle, and three picture requests along the top put it right, in any order: find the striped blanket the wind dropped in the tree, on the clothesline or on the bush (at early school two blankets are striped, so where it landed matters too); share the sandwiches fairly (a Pet Kitchen round); and play the invitation song (a Jelly Drums round) so the friends come. Each request changes the picnic, and when all three are done the friends eat to Juniper's song and she takes a photo to keep. The journal (top right) replays each request, shows what changed, and its green arrow goes straight to the next one; once the picnic is over it holds the photo and can tell the story again. Steps are saved as they're done, so the story picks up after a reload or a goodnight. The game rounds play at a level chosen for her age band, give their usual one sticker each, and leave those games' own levels where they were; the story adds no stickers. Help reaches the same ending.

A few notes on the newer games. In Memory Match, an incorrect pair counts as a miss only if the matching card was already known. Story Steps has four illustrated stories; its music-note button narrates the pictures already placed. In Feelings Faces and Weather Wardrobe the pet is the star, so tapping the big pet repeats the instruction. Monster Munch asks for a number, then lets her decide when to ring the bell; a full monster politely refuses more, and unfair shares come back to the tray. Song Maker's jellies sing on the music's beat, and the top level plays a tune to find by ear. Puzzle Pals pictures come alive when finished. In Sink or Float, guesses are never wrong answers: the water shows what happens. Word Monsters speaks letter sounds ("buh", "mmm") through device speech, which approximates phonics sounds at best; listen on the iPad before relying on them. On Bounce Back's play-together level a grown-up takes the second paddle; when no grown-up finger is on it, the pet plays it. In Bumper Garden the ladybug never drains: past the flippers a flower pot pops it back up, and tapping either half of the screen flips that side. Quick Tricks is one show of three tricks with one sticker; the arrow moves on when she is ready. In Seesaw Balance, testing presents on the seesaw is never a wrong answer, and on the top levels taking something off one side only tips it over, which is explained but never counted. In Block Tower, a block stays up when the middle of it and everything on top is over the block below (not on its edge), the one rule its balance levels use, and guessing which tower will stand is never wrong. Lasso Loops closes any loop for her, so a nearly closed loop still counts. Pet Says judges nothing: a grown-up moves it on. In Owl Walk Home everyone wins together; there is no clock, and the sun only comes up when the owls are home.

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for the place it was played in. In the grown-up zone you can see each game's current level and pin one.

## Your island friend and sticker book

On the first visit, tap the egg four times, choose one of eight colors, then hear three pet names and pick one. A grown-up can type another name. The green arrow confirms each choice. The customized pet joins the trail, games, bath time, celebrations, and goodnight.

The book button on the map or any place opens five scenes: meadow, beach, farm, under the sea, and space. Drag earned stickers from the tray onto a scene; return one to the tray to remove its placement. Scene arrows and tray arrows browse independently. Placements survive resizing, closing the app, and backups.

The treehouse button at the bottom-left of the map opens the pet's **treehouse**: one cozy room with six free furnishings (a bed, a lamp, a rug, a bookshelf, a plant and a music box) already in place, a window, and a frame for one sticker. Touch a furnishing and the pet uses it (a nap, a dance, reading, watering the plant, a little tune; the lamp dims the room); drag one to move it along the floor and use the turn-around arrows to face it the other way; the round arrow puts everything back. Touch the frame to hang one of the stickers she has won (it stays in the book too) or to empty the frame. Nothing is earned, nothing wears out and nothing waits for her: the room is exactly as she left it. Two more things hang on the wall for what she makes: after a **Stamp Studio** round or a free **Song Maker** round (not a copied song), a little tree house button beside the sticker hangs the picture on a board or the song on a plaque, and nothing is kept unless she taps it. Touch the board and the pet admires the picture; touch the plaque and the pet sings the song, lighting each beat. A newer one replaces what hung there, and a small back arrow above it brings the earlier one back (and swaps again), so nothing is lost; only one earlier picture and one earlier song are kept. The arrangement, the hung sticker, the picture and the song are saved, repaired when loaded (always six items, always on the floor, at most 24 stamps, a song only on a grid Song Maker can draw) and included in backups.

Letter Trails uses capital A–Z stroke data. Accented Latin names are normalized to those letters; a name without supported letters falls back to PIP. No reading is needed to follow the spoken instructions and firefly.

## Grown-up zone

Press and hold **both top corners** of the island map for three seconds. Set her name (the voice says it), pet name and color, age band (her pet's home on the trail, and where play starts), session length, place layout, volume, and see what she played this week. Backups save to Files.

## Couch play

A separate route for grown-ups, from **Couch play** on the title screen (or the **C** key, or a controller button). It has its own save (`neo.couch.v1`), so it never touches the child's profile, levels, stickers or story. Setup, controls and pairing a Pro Controller are in [docs/CONTROLLER-SETUP.md](docs/CONTROLLER-SETUP.md).

- **A trip** is six stops. Choose **Together** (light six lanterns as a team) or **Face-off** (each stop has a winner). Players take turns choosing; three games are offered each time, with a free Shuffle once more than three are open.
- **How to play.** The first time a game is chosen, a screen shows its name, a one-sentence goal (spoken), a drawn controller with the buttons it uses, and a window where a bot plays a real round with the same controls you will use. Later plays show a short name card with **Play** and **How to play** (move right or down to reach it and the card waits for you instead of starting). **How to play** is also in the pause menu, on a face-off turn card, and as a guide on the couch menu that lists every open game and plays its demo without starting a round.
- **Earning games.** Three games are open at the start. Each finished trip, in either mode, opens the next group (Memory Match and Rhythm Neighbors; then Light Lab and Secret Code; then Peg Garden and Bumper Garden; then Pattern Train and Egg Catch; then Frog Hop and Sink or Float; then Robot Path). Nothing locks again and nothing expires. New games carry a NEW mark until they have been explained. The child's island has no such gates.
- **Face-off.** Each player plays their own fresh board in turn, scored against that board's own best (slides over the best route, extra turns, guesses, shots), or one shared board where turns alternate (Memory Match). Ties and team games score for both players. The trip always ends with everyone having lit every lantern.
- **The finale.** The sixth lantern ends a trip with a night sky: six lanterns rise and light, each in the color of whoever took that stop (blue for Player 1, pink for Player 2, gold when shared), with a face-off scoreboard, a recap of the six stops, the games the trip opened, and, the first time, the **Lantern Night** keepsake (a postcard dated with that first trip, shown on the couch start page from then on).
- **Challenges.** From the mode screen (or the start page): a fixed run in one game as one round, scored by how few tries it takes. **Pond Practice** is five gentle Penguin Slide puzzles with no dead ends (the fewest possible is 18), a warm-up or an easy game; **The Five Ponds** is five that take real planning, where a slide you undo still counts (the fewest is 30). **Cloud Hopper** is twelve small clouds in a row in Bouncy Launch, where every launch counts, even a miss (the fewest is 12). Each player has their own best, kept apart for runs with and without a hint, and two badges per course (Finished; and a perfect run, the fewest tries possible with no hint). A run left halfway resumes after a reload with its tries kept. One run is one sticker.
- **Names.** Optional: type a name for each player on the Controller setup page (a keyboard, once). It replaces Player 1 and Player 2 on every screen, in what is spoken, and in the finale.
- **Readable from a couch.** Couch screens scale with the window (about 1.4 times at 1080p), so text stays legible on a TV.

| Game | Together | Face-off |
| --- | --- | --- |
| Penguin Slide, Bouncy Launch, Light Lab, Secret Code, Peg Garden | take turns | each on their own board, fewest wins |
| Memory Match | take turns | one board, most pairs wins, a match earns another turn |
| Bounce Back, Rhythm Neighbors, Bumper Garden | together | team: both score |
| Pattern Train, Frog Hop, Sink or Float, Robot Path | together: talk it over, either of you can press | team: both score |
| Egg Catch | together: with two controllers you both steer one basket | team: both score |

## Where it could grow

The [elementary roadmap](docs/ELEMENTARY-ROADMAP.md) plans a world that grows through kindergarten–grade 5. **Wonder Woods** now exists as the early-school place on the trail (its host, project and keepsake are still to come); later come **Maker Harbor** and **Storybook Square** for building and stories, and **Discovery Marsh** and **Skywatch Isles** for investigations and longer projects. Familiar games gain deeper modes—counting becomes sharing and fractions, routes become programs, and picture stories become evidence-based mysteries. Younger favorites remain available.

Apart from the Wonder Woods place and the Windy Picnic pilot, these are future concepts, not features currently available. The [active roadmap](docs/ROADMAP.md) starts with current verification and easier navigation, then judging the Windy Picnic with her, a small **pet room** pilot, and the first elementary zone. Each later expansion can deepen a few games, add one new interaction, and connect them through an optional project; it need not add an entire new zone.

## How it's built

TypeScript + Vite + PixiJS 8, installed as a PWA. See the [design doc](docs/DESIGN.md) for the why. Shared instructions for human contributors and coding assistants live in [AGENTS.md](AGENTS.md).

```text
src/
  app/        boot, scene switching, session timer, routes, scenes/ (start, hatch, map, place, game host, picnic, stickers, goodnight, couch)
  engine/     view scaling, tweens, seeded random, toddler input rules
  art/        palette, shapes, critter builder, particles, scenery, sticker frame
  audio/      Web Audio engine, instruments, sound effects, generative music, voice
  games/      one folder per minigame + the contract (types.ts) and registry
  progress/   age bands, save format + migration, difficulty, IndexedDB store
  couch/      grown-up couch play: the catalog of how-to data, trips, unlocks and face-off rules, its own save, the demo runner, the controller diagram
  parent/     the grown-up panel (plain HTML)
  ui/         buttons, icons, parent gate, text
  content/    voice script, the age-trail places, stable world IDs, and the Windy Picnic's story rules
```

### Adding a minigame

1. Make `src/games/<id>/index.ts` exporting a `GameModule` (see `games/types.ts`): metadata, a subject (`region`) ID from `content/world.ts` that groups it inside each place, level ranges per band (each band it supports puts it in that place on the trail), `describeLevel` for the grown-up zone, a hub icon, a sticker drawing, and `create(ctx)` returning a `Game`. Most games keep a `PLANS` array, one entry per level.
2. Add any new spoken lines to `content/voice-script.ts`, and the grown-up how-to card (goal, steps, how the round ends) to `content/howto.ts`; a test fails if a game has no card. The card opens from the quiet `?` under the home button when it is held, and adds the current level's `describeLevel` line.
3. Register it in `games/registry.ts`. `npm test` checks every game's level ladder.

Shared pieces worth reusing: `engine/drag.ts` (toddler-proof dragging), `art/critter.ts` (any animal), `art/props.ts` (fruit and things to sort), `art/shapes.ts`, and `engine/view.ts` `spread()` for rows that stay clear of the pet.

In `npm run dev`, the browser console has `neo` (the app) and `kit` (synthetic taps and drags, the store) for poking at the game.

The shell handles everything else: transitions, the home button, the pet guide, co-play tips, saving the result, difficulty, stickers and the celebration. A game draws into `ctx.stage`, listens with `onTap`, and calls `ctx.finish({ misses, hints })`.

### Making a game playable on the couch

A game becomes a couch game by implementing the optional `control(input, dt)` and `autoplay(dt)` on its `Game`, and adding one entry to `src/couch/catalog.ts` (goal line, control rows, face-off kind, demo level, the level of each stop) and one tier slot in `src/couch/party.ts`. The how-to screen, name card, offers, NEW mark and unlock then follow. `autoplay` is a bot that returns the input a capable player would press; it drives the how-to demo and is the browser check that the controls can complete a round (`BROWSER_SUITE=couchgames`, which waits on the game's public `finished` flag). A face-off game reports `score` (or `scores` for a shared board) through `ctx.finish`; fairness needs boards drawn from `ctx.rng`, never fixed per level.

### Adding a challenge course

A challenge is a fixed run of parts in one couch game, scored by how few tries it takes. Put the parts in a frozen data file beside the game (`src/games/<game>/course.ts`, with a `version` that must change if a part does, and the fewest tries worked out by the game's own solver where there is one). Make the game play it when `ctx.couch.course.id` names it: start at `resume.board` with `resume.attempts` already spent, count every try (a slide you undo and a launch that misses still count), call `progress({ board, boards, done, attempts, par, minimum, assisted })` after every try, finished part and shown hint, and call `ctx.finish` once at the end. Then add an entry to `COURSE_IDS` and `build` in `src/couch/courses.ts` (the game, level, names, the fewest tries per part, the text for the page and the badges). The runs, per-player records, badges, versioning and save repair in `src/couch/course.ts` are generic, so they need no change; the Challenges menu, the course page and the result pick the course up. Add the data's own tests (every part valid, the minimum right, the way a player could get stuck) and extend `BROWSER_SUITE=couchcourse`.

### Rules every game follows

Huge touch targets, responses on touch-down, no fail states (a wrong tap gets a boing and a hint), every instruction spoken, and tapping the pet repeats it. Colors come only from `art/palette.ts`, and pitched sounds use `audio/notes.ts` steps so everything stays in key with the music.

## Browser checks

The checks create isolated browser contexts and never touch a real player's save. Install the test browser once with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to a local Chrome executable.

With `npm run dev` running in another terminal, run **one suite at a time** (the list below), not everything:

```bash
BROWSER_SUITE=smoke SMOKE_ONLY=my-new-game npm run test:browser   # a new game: loads, taps, how-to card, portrait (about 7 s a game)
BROWSER_SUITE=woods WOODS_ONLY=penguin npm run test:browser       # one game's own play-through
npm run test:browser                                              # everything: about an hour, for release checks only
```

The [verification budget in AGENTS.md](AGENTS.md#verification-budget) says how much to run for which change. To keep editing while a slow suite runs, `scripts/snapshot-serve.sh` serves a frozen copy of the tree on port 5180 (`GAME_URL=http://localhost:5180`).

The full script exercises hatching, navigation and the parent gate; game levels including all 26 capital letter trails and word/name modes; and sticker placement, removal, paging, and portrait resizing. Scenarios include wrong answers, hints, saved rewards, reload persistence, and place scrolling. The [verification log](docs/VERIFICATION.md) records which runs passed and their limits.

Single suites: `smoke` (every game, or `SMOKE_ONLY=id,id`: opens at its lowest, middle and highest level, takes stray taps, opens the grown-up how-to card, and resizes to portrait; it proves a game loads and survives touches, not that its rules are right or a round can be finished), `couch` (the full couch trip: how-to screens, name cards, the finale, unlock announcement, NEW marks, shuffle, face-off turns with How to play on the turn card, reload between turns, ties and team stops, backup), `couchcourse` (both challenges: controller play, undone slides and missed launches counted, resume after a reload, hints, records and badges per player, one sticker per run), `couchgames` (every couch game's intro and a bot-played round, then the How to play guide and a name card's How to play; `COUCH_ONLY=peg-garden,bumper-garden` limits the games it plays), `creations` (a Stamp Studio picture and a free Song Maker song kept from the end-of-round screen, shown in the treehouse, replaced and brought back, kept through a reload), `island` (the NEW twinkle, the heart after a round, the shelf and Favorites card, a reload, a portrait shelf), `world` (hatching, the map, both place layouts, every subject/game card in all bands and both orientations, return memory, cancellation, birthdays, the parent gate), `picnic` (the Windy Picnic from the map: the blanket, story rounds, resuming, the journal, the finale and keepsake, retelling), `shortlist` (Block Tower, Lasso Loops, Pet Says, Owl Walk Home; `SHORTLIST_ONLY=tower|lasso|says|owls`), `expansion` (Size Parade, Bug Builder, Story Steps), `third` (Feelings Faces, Monster Munch), `fourth` (Song Maker, Puzzle Pals, Weather Wardrobe, Sink or Float), `early` (Rainbow Fingers and Splish Splash; `EARLY_ONLY=paint|bath`), `arcade` (Duckling Parade, Scoop Shop, Roundup, Bouncy Launch; `ARCADE_ONLY=parade|scoop|roundup|launch` runs one), `batch` (the follow-on ten games; `BATCH_ONLY=monsters|pegs|salon|garden|helpers|eggs|mail|safari|bounce|dots` runs one), `originals` (Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, Color Garden; `ORIGINALS_ONLY=bubbles|jelly|peekaboo|ducks|shapes|garden` runs one), `next` (Seesaw Balance, Teddy Doctor, Bumper Garden, Quick Tricks; `NEXT_ONLY=seesaw|doctor|bumper|tricks` runs one), `creative` (Stamp Studio, Pet Kitchen, Rhythm Neighbors, Tangram Town; `CREATIVE_ONLY=stamps|kitchen|rhythm|tangram`), `woods` (Light Lab, Penguin Slide, Peekaround Island, Secret Code, Frog Hop, Market Stall, Garden Grow, Clock Tower, the other Wonder Woods games, Inchworm Measure and Little Helpers' equal groups; `WOODS_ONLY=light|penguin|peek|code|hop|shop|grow|clock|pixels|night|snack|beat|rhyme|go|ramp|sort|map|opp|graph|worm|bonds|predict|families|helpers|boxes|mailmap`; Seesaw Balance 8–9 is `boxes` and Mail Carrier 6–7 is `mailmap`; Egg Catch 6 is `predict` and Photo Safari 6 is in `batch`; Bubble Pop 10–11 is `bonds`; Word Monsters 7 is `families`), with Robot Path 7–10 in `robot`, Duck Pond 10 in `originals` and Monster Munch 8 in `third`, plus `pattern`, `memory`, `letters`, `robot` and `stickers`, e.g. `BROWSER_SUITE=fourth npm run test:browser`. `FROM_LEVEL=n` starts `next`, `creative`, `woods` and `shortlist` at a later level. `TO_LEVEL=n` can limit the paint or salon loop for lap checks. Screenshots go into ignored `test-results/`.

With `npm run build-and-preview` running in another terminal:

```bash
npm run test:offline
```

The production check installs the service worker, disconnects the browser, reloads, starts in her place using subject cards, opens Counting Cove, plays Monster Munch, earns a sticker, and verifies the save survives another offline reload. It then opens the Windy Picnic from the map, finds the blanket, and checks that the step survives an offline reload; its seeded save predates stories, so it also checks that loading an older save adds the untold picnic. It also checks cached fonts and that the dev helpers are absent. Set `GAME_URL` to test another local port.

A real iPad check is still needed for device speech, touch feel, Guided Access, and Add to Home Screen behavior.
