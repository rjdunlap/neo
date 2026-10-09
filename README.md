# Puddle Island (project Neo)

A home-made iPad learning game in the spirit of JumpStart and Neopets: playful learning, a familiar pet, and an island to explore. Current age bands run from lap play through early school (ages 6–8); the long-term plan grows through elementary school, roughly grade 5 / age eleven. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)

[Roadmap](docs/ROADMAP.md) · [Design and architecture](docs/DESIGN.md) · [Games](docs/GAMES.md) · [Ideas](docs/IDEAS.md) · [Couch play guide](docs/COUCH-PLAY.md) · [Verification log](docs/VERIFICATION.md) · [Contributor guidance](AGENTS.md)

What's in it:

- **73 small games** on an age trail of five places, each with spoken instructions, gentle hints, adaptive levels and one sticker per round.
- **A pet** she hatches and names, a **sticker book**, and the pet's **treehouse**, where things she made hang on the wall and a discovery journal fills up.
- **The Windy Picnic**, a short story that connects three activities.
- **Couch play** for two grown-ups with controllers or a keyboard on a computer: trips, face-offs and challenge courses, with its own save.
- A **grown-up zone** behind a parent gate, and offline play once installed.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: saves, difficulty, the age trail, every game's rules, tracing, matching
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** open <https://rjdunlap.github.io/neo/> in Safari on the iPad → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off. A new version downloads in the background while she plays and takes over the next time the app is opened after being closed (swiped away), so an update never interrupts a game.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

## Try it on a phone

A phone is a good way to look at the island before the iPad arrives. It differs from the iPad in four ways:

- **Hold it sideways.** The islands are drawn wide. An upright phone shows a picture asking to turn it, and the game waits behind it; turn off the rotation lock (iPhone: Control Center; Android: quick settings). An installed Android app is locked to landscape; an iPhone cannot be locked by a web app.
- **Everything is about half the iPad's size.** At 844 × 390 the island is drawn at about 0.5 scale, so a 100-unit target is about 50 points across, against about 110 on an 11-inch iPad. The phone shows whether the games flow, read and sound right; it cannot show whether a small hand can drag, herd or pull. Judge those on the iPad.
- **The notch and rounded corners are respected.** The island sits inside the safe area, so a phone with a notch shows a cream strip at each side, and the buttons in the corners (and the grown-up gate's two top corners) stay reachable.
- **It has its own save.** A phone browser, and the home-screen app made from it, each keep a separate save from the iPad's. To carry one over, use Save a backup and Restore from a backup in the grown-up zone.

To get it there:

- **Live site (the merged `main`):** open <https://rjdunlap.github.io/neo/> in Safari (iPhone) or Chrome (Android). Share → Add to Home Screen on iPhone, or ⋮ → Install app on Android, runs it full screen and offline; in a plain Safari or Chrome tab the browser's own bars take some of the screen.
- **A branch not yet merged:** with the phone on the same Wi-Fi, run `npm run dev:lan` and open the "Network" address it prints. That page is plain HTTP, so there is no install and no offline mode; it is for looking and playing.
- **On the computer:** Chrome's device toolbar (⌥⌘I, then ⇧⌘M) with an iPhone preset, rotated sideways, shows the layout. It does not fake a notch: to see the safe-area handling, set `--safe-left`, `--safe-right` and `--safe-bottom` on `<html>` in the console (for example `document.documentElement.style.setProperty('--safe-left', '47px')`).

Couch play is for a computer or TV with a keyboard or controller and is not a phone feature. Sound should play through an iPhone's silent switch (iOS 16.4 and later, as on the iPad) and speech uses the phone's own voices; neither has been heard on a phone yet (see the [roadmap](docs/ROADMAP.md#needs-a-person-or-a-device)).

## The island and its games

The island is an **age trail**. It climbs from **Puddle Lagoon** (lap, 18–24 months) on the shore through **Daisy Meadow** (toddler) and **Bumpy Hills** (preschool) to **Starry Peak** (pre-K), and over the top to **Wonder Woods** (early school, ages 6–8). Each place lays out every game for that age, at that age's levels. A game that grows with her, like Bubble Pop, stands in each place it supports. The play button goes straight to her own place; the island button there opens the trail, where her pet waits by her place and every place is open to explore. When there are more games than fit, swipe the land sideways or tap the arrows. When a grown-up moves her up an age band, the pet has a birthday and walks up the trail.

There are seventy-three games, listed below. "Ages" lists the places each game appears in; "school" is the early-school band at Wonder Woods (ages 6–8), where 51 games play their most demanding levels. The [verification log](docs/VERIFICATION.md) records which checks each one has passed; judgments of fun and clarity, and real-iPad checks, are still open for the newest games (see the [roadmap](docs/ROADMAP.md#needs-a-person-or-a-device)).

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
| Lemonade Stand | school | read the weather sign, choose how many cups to make, and watch friends buy; each day adds a row to a picture table | an event on the forecast (a ferry, a quiet day), a price in shells, then a five-day market week where a lemon (one shell, two cups) is a cost and the purse carries from day to day; running out or having cups left is a result, never a mistake |
| Garden Grow | lap–preschool | tap the soil: a seed grows into a singing flower | rain from a cloud, planting the color asked for, exactly so many seeds, two colors with a number of each |
| Clock Tower | pre-K–school | turn the short hand to an o'clock time | both hands, half past, quarter past and to, reading the clock for the time of day, one hour later |
| Garden Rows | pre-K–school | plant a 3 by 3 flower bed so each row has one of every flower | rows and columns, 4 by 4 beds with fewer flowers to start, a 5 by 5 bed; every bed has exactly one way to finish, and a flower that repeats will not stay |
| Ferry Jam | pre-K–school | drag boats along their lanes in a small harbor so the red ferry can reach the dock; nothing is a mistake, and undo is always there | bigger harbors (4 by 4, 5 by 5, 6 by 6) that need more slides in a planned order, with a glowing next slide after a long wander |
| Critter Crossing | pre-K–school | critters line up at a bridge gate; at first its rule is on the sign, then it is a secret: try critters one at a time, watch who crosses and who waits, then guess the rule | rules of one picture, "not" a picture, or two pictures together; a guess only counts as a mistake if it disagrees with something you saw |
| Chain Reaction | pre-K–school | drag a loose ramp into a large socket, run the machine and watch the marble ring a bell | fixed and loose ramps together, two-piece revisions, touching a little chime before the bell, then several valid designs; failed runs are experiments, and the light bulb shows one useful placement |
| Pixel Pictures | preschool–school | copy a small picture square by square | two colors, finishing a mirror half, picture-logic puzzles with row and column numbers; keep the last finished design in the treehouse |
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
| Clap the Syllables | preschool–pre-K | the pet claps the beats in a word ("but-ter-fly") with beads lighting up, and you clap along on big hands | clap a word yourself (a wrong count brings the pet's demonstration), sort pictures into 1-, 2- and 3-clap bins, hear some claps and find the picture with that many beats |

Within a place, games are grouped by subject: senses, music, art, animals, numbers, everyday life, colors and shapes, puzzles, stories, and science. Grown-ups → Finding games offers **Subject cards**, an optional prototype showing four large subject choices, then four games at a time. The original swiping path remains the default. Each layout remembers its own position for the session; returning from a game keeps the launching place and subject/page. Compare both on the iPad before choosing a default. A small gold **twinkle** marks every game she has not finished a round of yet (a subject card twinkles while it holds one), and after a round a **heart** beside the new sticker keeps the game on a **favorites shelf** of up to five above that place's games (or a first **Favorites** card in the subject layout). Neither gates anything: a second tap on the heart takes it back, and nothing expires or rotates.

Every time a game is opened, it explains itself: a card with the game's picture and name (spoken), what the game is for, how to play this level (a pair of held arrows beside "this level" lets a grown-up pick another level in her band, and the steps and demonstration follow), and how the round ends, with a big green **Play** and a **Back**. A **demonstration window** beside the text plays a real round with the input the person is using: a **ghost finger** (a drawn hand that taps and drags the game's own objects) on a touch screen, a **mouse pointer** on a desktop, at the child's current level. That is built for 24 of the 72 games so far: Bubble Pop, Shape Sorter, Duckling Parade, Memory Match, Frog Hop, Pattern Train, Light Lab, Penguin Slide, Secret Code, Robot Path, Rhythm Neighbors, Sink or Float, Ferry Jam, Jelly Drums, Song Maker, Beat Builder, Rhyme Time, Opposites, Pet Says, Goodnight Room, Peekaboo Barn, Weather Wardrobe, Duck Pond and Photo Safari (the [roadmap](docs/ROADMAP.md) keeps the count and the order). Until the five other games the couch can also play (Egg Catch, Bounce Back, Peg Garden, Bouncy Launch, Bumper Garden) get one, they show the couch bot's controller-style highlight instead; the rest are text alone. Nothing has started behind the card, and Back leaves the game. After Play the game starts at once, tapping **again** after a round skips the card (it has just been seen), and holding the small **?** under the home button opens the card during a round. A grown-up can turn the cards off in the grown-up zone (a game started by a story request never shows one).

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for the place it was played in. In the grown-up zone you can see each game's current level and pin one. How each game handles mistakes and hints, and what it grows into, is in [GAMES.md](docs/GAMES.md).

### The Windy Picnic

Beside Daisy Meadow on the island map stands a picnic blanket: **the Windy Picnic**, the first island story (a pilot for roughly 4–8, open to every age). The wind has blown Juniper the gardener bunny's picnic into a muddle, and three picture requests along the top put it right, in any order: find the striped blanket the wind dropped in the tree, on the clothesline or on the bush (at early school two blankets are striped, so where it landed matters too); share the sandwiches fairly (a Pet Kitchen round); and play the invitation song (a Jelly Drums round) so the friends come. Each request changes the picnic, and when all three are done the friends eat to Juniper's song and she takes a photo to keep. The journal (top right) replays each request, shows what changed, and its green arrow goes straight to the next one; once the picnic is over it holds the photo and can tell the story again. Steps are saved as they're done, so the story picks up after a reload or a goodnight. The game rounds play at a level chosen for her age band, give their usual one sticker each, and leave those games' own levels where they were; the story adds no stickers. Help reaches the same ending.

## Your island friend and sticker book

On the first visit, tap the egg four times, choose one of eight colors, then hear three pet names and pick one. A grown-up can type another name. The green arrow confirms each choice. The customized pet joins the trail, games, bath time, celebrations, and goodnight.

The book button on the map or any place opens five scenes: meadow, beach, farm, under the sea, and space. Drag earned stickers from the tray onto a scene; return one to the tray to remove its placement. Scene arrows and tray arrows browse independently. Placements survive resizing, closing the app, and backups.

The treehouse button at the bottom-left of the map opens the pet's **treehouse**: one cozy room with six free furnishings already in place, a window, and a frame for one sticker. Touch a furnishing and the pet uses it; drag one to move it, flip it with the turn-around arrows, or put everything back with the round arrow. A sticker hung in the frame stays in the book too. After a **Stamp Studio** round, an open-ended **Rainbow Fingers** painting, a **Pixel Pictures** round or a free **Song Maker** song, a little tree house button beside the sticker hangs the work on the wall (only if she taps it); a back arrow brings the earlier one back, and an **X** leaves that wall place empty without losing the work (the back arrow restores it). A magnifying-glass button opens her **discovery journal**: sixteen things found by watching them happen in Sink or Float and Animal Snack. Nothing is earned, nothing wears out and nothing waits for her. Details are in [DESIGN](docs/DESIGN.md#pet-treehouse).

## Grown-up zone

Press and hold **both top corners** of the island map for three seconds. Set her name (the voice says it), pet name and color, age band (her pet's home on the trail, and where play starts), session length, whether each game shows how to play before it starts, place layout, volume, and see what she played this week. Backups save to Files.

## Couch play

A separate route for grown-ups (two taking turns, or **Just me** with a puzzle shelf), from **Couch play** on the title screen (or the **C** key, or a controller button), with its own save (`neo.couch.v1`) that never touches the child's profile, levels, stickers or story. Trips of six stops in **Together** or **Face-off** mode, a how-to screen with a bot demo before each game, games that open as trips are finished, a finale with a keepsake, thirteen **challenge courses** with personal bests (for one player, a **puzzle shelf** showing each best against par, and a replay of the best route), and a **Settings** page. Twenty-one games play on the couch: fifteen from the island (Ferry Jam is the newest, as **Harbor Rush**), and **Sudoku Garden**, **Lantern Lights**, **Picture Logic**, **Word Search**, **Island Bridges** and **Pond Conga**, made for grown-ups and not on the island at all (below). Pairing controllers, the rules, the controls and the order games open in are in the [couch play guide](docs/COUCH-PLAY.md).

### Grown-up games (couch only)

Games in `GROWNUP_GAMES` appear only on the couch route, with a controller or the keyboard. They are not counted in the island's seventy-two. What each one does is in [GAMES.md](docs/GAMES.md#grown-up-puzzles-couch-only).

| Game | Starts as | Grows into |
| --- | --- | --- |
| Pond Conga | a line of ducklings paddles on at a steady pace and is steered to each crumb of bread in turn, round lily pads | six levels from a small open pond with five crumbs to a crowded one with twelve; a bump turns the whole line about and counts a step, so nothing can be lost or stuck; an exact fewest steps for every pond; one puzzle-shelf course scored in steps against par (Crumb Trail) |
| Island Bridges | a 7 by 7 sea of numbered islands joined by plank bridges, laid by arming an island and pushing toward a neighbor | 9 by 9 and 11 by 11 seas with a proved single answer; hints that name the plank or the island that decides it; one puzzle-shelf course scored in planks against par (Island Hopping) |
| Word Search | an 8 by 8 grid hiding five words from a themed list, marked first letter to last | 10 by 10, 12 by 12 and 14 by 14 grids with slants and backwards words; a hint that names a word; the found word is spoken; two puzzle-shelf courses scored in guesses against par (Pond Words, The Big Hunt) |
| Picture Logic | a 6 by 6 picture found from the run numbers beside its rows and columns, painted by holding the fill button | 10 by 10 and 15 by 15 pictures solvable by line logic alone; hints that name the line and its clue; the finished picture takes its colors and says what it is; two puzzle-shelf courses scored in fills against par (Pond Pictures, The Big Pictures) |
| Lantern Lights | a 3 by 3 pond of paper lanterns: press one to flip it and its four neighbours, and light them all | 4 by 4 and 5 by 5 ponds that take planning; a hint that always brings the fewest presses down by one; one puzzle-shelf course scored in presses against an exactly worked-out par (Dusk on the Pond) |
| Sudoku Garden | a 6 by 6 bed with a few numbers to find, placed from a tray with a controller | half the bed to find, the only-place-left trick, then 9 by 9 beds up to a pair or pointing line; hints on request that name the reason; two puzzle-shelf courses scored in entries against par (Six Beds, Three Big Beds) |

## Where it's going

The [roadmap](docs/ROADMAP.md) says what comes next and where the island is heading: deeper modes for familiar games, a few new ones, the next story, and themed zones for elementary school (Wonder Woods first, then Maker Harbor, Storybook Square, Discovery Marsh and Skywatch Isles), with younger favorites always staying available.

## How it's built

TypeScript + Vite + PixiJS 8, installed as a PWA. See the [design doc](docs/DESIGN.md) for the why. Shared instructions for human contributors and coding assistants live in [AGENTS.md](AGENTS.md).

```text
src/
  app/        boot, scene switching, session timer, routes, scenes/ (start, hatch, map, place, game host, picnic, stickers, treehouse room, journal, goodnight, couch)
  engine/     view scaling, tweens, seeded random, toddler input rules
  art/        palette, shapes, critter builder, particles, scenery, sticker frame
  audio/      Web Audio engine, instruments, sound effects, generative music, voice
  games/      one folder per minigame + the contract (types.ts) and registry
  progress/   age bands, save format + migration, difficulty, IndexedDB store
  couch/      grown-up couch play: the catalog of how-to data, trips, unlocks and face-off rules, its own save, the demo runner, the controller diagram
  parent/     the grown-up panel (plain HTML)
  ui/         buttons, icons, parent gate, text
  content/    voice script, how-to cards, the age-trail places, stable world IDs, the Windy Picnic's story rules, and the treehouse's room, creations and journal rules
```

To add a minigame, follow the checklist in [AGENTS.md](AGENTS.md#adding-or-extending-a-minigame): a `GameModule` in `src/games/<id>/index.ts` with its rules in `logic.ts`, voice lines in `content/voice-script.ts`, a how-to card in `content/howto.ts`, and a registry entry. The shell handles transitions, the home button, the pet guide, saving, difficulty, stickers and the celebration; a game draws into `ctx.stage` and calls `ctx.finish({ misses, hints })`. Making a game playable on the couch, or adding a challenge course, is described in [DESIGN](docs/DESIGN.md#extending-couch-play).

In `npm run dev`, the browser console has `neo` (the app) and `kit` (synthetic taps and drags, the store) for poking at the game.

### Rules every game follows

Huge touch targets, responses on touch-down, no fail states (a wrong tap gets a boing and a hint), every instruction spoken, and tapping the pet repeats it. Colors come only from `art/palette.ts`, and pitched sounds use `audio/notes.ts` steps so everything stays in key with the music.

## Browser checks

The checks create isolated browser contexts and never touch a real player's save. Install the test browser once with `npx playwright install chromium-headless-shell`. It is a plain command-line binary, so it runs inside a coding assistant's sandbox. Avoid `BROWSER_EXECUTABLE` pointing at the Google Chrome app: that is a Mac app, and when a sandbox blocks its window-server access it aborts on launch and macOS shows a "Google Chrome quit unexpectedly" dialog.

With `npm run dev` running in another terminal, run **one suite at a time**, with a filter where there is one:

```bash
BROWSER_SUITE=smoke SMOKE_ONLY=my-new-game npm run test:browser   # a new game: loads, taps, how-to card, portrait (about 7 s a game)
BROWSER_SUITE=woods WOODS_ONLY=penguin npm run test:browser       # one game's own play-through
```

Running `npm run test:browser` with no suite runs everything (about an hour); keep that for release checks a grown-up asks for. The [verification budget in AGENTS.md](AGENTS.md#verification-budget) says how much to run for which change, and the [verification log](docs/VERIFICATION.md) records which runs passed. To keep editing while a slow suite runs, `scripts/snapshot-serve.sh` serves a frozen copy of the tree on port 5180 (`GAME_URL=http://localhost:5180`). Screenshots go into ignored `test-results/`.

| Suite | What it plays | Filter |
| --- | --- | --- |
| `smoke` | Every game at its lowest, middle and highest level: stray taps, the how-to card, portrait. Proves a game loads and survives touches, not that a round can finish; fails if anything touchable is stranded at the origin | `SMOKE_ONLY=id,id` |
| `howto` | The how-to card every time a game opens: every game's card fits in landscape and portrait with large Play and Back, a demonstration window exactly for the games with a bot (playing, touch-proof, destroyed with the card; a hand for a game with a ghost finger, the controller highlight for a couch game without one yet), the ghost finger (a mouse pointer until a touch, effects lowered while it plays, a real drag working after Play), stray taps, Back, Play, "again", a story request and the grown-up switch (about three minutes) | `HOWTO_ONLY=id,id` |
| `howtolevel` | The level arrows on the intro card: held to step (a tap does nothing), within her band, the "this level" line, steps and demonstration follow, the arrow at an end is dimmed, Play builds the chosen level and finishing it keeps it, a grown-up's pin stays, no arrows for a one-level band or on the "?" card (about 10 seconds) | |
| `fingerdemo` | The ghost finger's bot plays each game's demonstration to the end at the game's first and last level, with no wrong move and no hint, inside the 75 seconds a finger demonstration gets (a few seconds to about a minute a play) | `FINGER_ONLY=id,id`, `FINGER_LEVELS=3,4` (play these levels instead, to time the ones between) |
| `phonefit` | A phone's needs: a faked notch and home indicator through the `--safe-*` properties (island inside them, the strips left plain cream, nothing on a scene's UI layer covered, a tap on a button, the parent gate and panel reachable), the turn prompt for an upright phone (390 × 844, with couch play's button hidden under it) and not for a sideways phone, any tablet shape or a mouse (about 20 seconds) | |
| `phone` | `phonefit`, then every game's middle level at 844 × 390: stray taps, nothing stranded at the origin or off the window on the UI layer, and a screenshot of each in `test-results/browser/phone/` (about 3 seconds a game) | `PHONE_ONLY=id,id` |
| `world` | Hatching, the map, both place layouts, every subject and game card in all bands and both orientations, return memory, cancellation, birthdays, the parent gate (about 4½ minutes) | |
| `island` | The NEW twinkle, the heart after a round, the shelf and Favorites card, a reload, a portrait shelf | |
| `room` | The treehouse: moving, flipping and using furnishings, hanging a sticker, tidy, a reload | |
| `creations` | Stamp Studio pictures, a free Rainbow Fingers painting, Pixel Pictures designs and a free Song Maker song kept from the end-of-round screen, shown in the treehouse, swapped, taken down and brought back, kept through a reload | |
| `journal` | Sink or Float and Animal Snack rounds fill the journal: the twinkle, unfound and found cards, the green arrow, a reload, portrait | |
| `picnic` | The Windy Picnic from the map: the blanket, story rounds, resuming, the journal, the finale and keepsake, retelling | |
| `couch` | A full couch trip and a face-off trip: how-to screens, name cards, the finale, unlocks, NEW marks, shuffle, turns, reloads, ties and team stops, backup (about 8 minutes) | |
| `couchgames` | Every couch game's how-to screen and a bot-played round, then the How to play guide and a name card's How to play (about 5 minutes) | `COUCH_ONLY=peg-garden,sudoku-garden` |
| `couchcourse` | The challenge courses with controller presses: undone slides and missed launches counted, resume after a reload, hints, records and badges per player, one sticker per run (about 7 minutes) | |
| `couchnames` | Typing player names on the Settings page, kept in the couch save and used on every screen | |
| `couchbeds` | Sudoku Garden's Six Beds course played Just me with controller presses: the tray, a wrong entry counted and taken back free, pencil marks, a hint that names a wrong number first, restart, a reload that resumes, then a perfect bot run with one sticker and both badges (about 4 minutes) | |
| `couchconga` | Pond Conga's Crumb Trail course played Just me with controller presses: a line that waits for the first turn, a bonk that turns the whole line about and counts a step, straight back ignored, a hint with dots, restart keeping the steps, a reload that resumes, then a perfect bot run with one sticker and both badges and the best routes replayed (about 2 minutes) | |
| `couchbridges` | Island Bridges' Island Hopping course played Just me with controller presses: arming an island and laying planks (two at most, a third bumping), planks taken off for free, a wrong plank named first by the hint, clear, a reload that resumes, then a perfect bot run with one sticker and both badges (about 5 minutes) | |
| `couchwords` | Word Search's Pond Words course played Just me with controller presses: a crooked mark costing nothing, letting go free, a wrong line counted, a word found both ways, a hint naming a word, restart, a reload that resumes, then a perfect bot run with one sticker and both badges (about 3 minutes) | |
| `couchharbors` | Ferry Jam on the couch, in its Busy Harbors course, played Just me with controller presses: the highlight between boats, pick up, slide and set down, a held boat put back for free, a taken-back slide still counted, the solver's hint, restart, a reload that resumes, a perfect bot run with one sticker and both badges, and the best routes replayed (about 5 minutes) | |
| `couchpictures` | Picture Logic's Pond Pictures course played Just me with controller presses: a wrong fill counted and not refused, free emptying and crosses, a held button painting a run, clues grey when done and red when impossible, a hint naming a wrong mark first and then a line, restart, a reload that resumes, then a perfect bot run with one sticker and both badges (about 3 minutes) | |
| `couchlanterns` | Lantern Lights' Dusk on the Pond course played Just me with controller presses: a press and its neighbours, a taken-back press still counted, a hint into a fewest-press way, restart, a reload that resumes, then a perfect bot run with one sticker and both badges (about 2 minutes) | |
| `couchsolo` | Couch play for one: the Who is playing? choice, the Just me start page and puzzle shelf with par standings and no Player 2, a one-card course page, Watch the best routes (the solver's route replayed per pond, not offered mid-run), a Together-only trip, back to two players (about 40 seconds) | |
| `couchsettings` | The couch Settings page: reached with a controller alone, prompts following what is connected (key caps and a keyboard diagram, or controller pictures), text size and volume applied and kept through a reload and a backup, the pause menu row, the island's volume given back, old saves opening with defaults (about 30 seconds) | |
| `machines` | Chain Reaction's first and top levels: drags, an incomplete run, a failed experiment that is not a miss, a hint, the chime, completion, portrait | |
| `clap` | Clap the Syllables: all four levels, a wrong count, wrong bins, a hint, a portrait tray | |
| `shortlist` | Block Tower, Lasso Loops, Pet Says, Owl Walk Home | `SHORTLIST_ONLY=tower\|lasso\|says\|owls` |
| `woods` | Light Lab, Penguin Slide, Peekaround Island, Secret Code, Frog Hop, Market Stall, Lemonade Stand, Garden Grow, Clock Tower, the other Wonder Woods games, Inchworm Measure, and these ladder steps: Little Helpers' equal groups (`helpers`), Seesaw Balance 8–9 (`boxes`), Mail Carrier 6–7 (`mailmap`), Egg Catch 6 (`predict`), Bubble Pop 10–11 (`bonds`), Word Monsters 7 (`families`) | `WOODS_ONLY=light\|penguin\|peek\|code\|hop\|shop\|grow\|clock\|pixels\|night\|snack\|beat\|rhyme\|go\|ramp\|sort\|map\|opp\|graph\|worm\|bonds\|predict\|families\|helpers\|boxes\|mailmap\|lemon` |
| `creative` | Stamp Studio, Pet Kitchen, Rhythm Neighbors, Tangram Town | `CREATIVE_ONLY=stamps\|kitchen\|rhythm\|tangram` |
| `next` | Seesaw Balance, Teddy Doctor, Bumper Garden, Quick Tricks | `NEXT_ONLY=seesaw\|doctor\|bumper\|tricks` |
| `originals` | Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond (with level 10), Shape Sorter, Color Garden | `ORIGINALS_ONLY=bubbles\|jelly\|peekaboo\|ducks\|shapes\|garden` |
| `batch` | The follow-on ten (Photo Safari 6 too). `pegs` is flaky on the development Mac | `BATCH_ONLY=monsters\|pegs\|salon\|garden\|helpers\|eggs\|mail\|safari\|bounce\|dots` |
| `arcade` | Duckling Parade, Scoop Shop, Roundup, Bouncy Launch | `ARCADE_ONLY=parade\|scoop\|roundup\|launch` |
| `early` | Rainbow Fingers and Splish Splash | `EARLY_ONLY=paint\|bath` |
| `third`, `fourth`, `expansion` | Feelings Faces and Monster Munch (with level 8); Song Maker, Puzzle Pals, Weather Wardrobe, Sink or Float; Size Parade, Bug Builder, Story Steps | |
| `pattern`, `memory`, `letters`, `robot`, `stickers` | Pattern Train; Memory Match; all 26 letter trails and the word and name modes; Robot Path 1–10; sticker placement, removal, paging and portrait | |

`scripts/abandon-cards.mjs` is not a suite: it opens each ghost-finger game's card and leaves it at a random moment (by the map, Back or Play), over and over, and fails on any page error; it found a rare fault where a game's `await` is ready in the frame its objects are destroyed (`GAME_URL=… GAME_ONLY=id,id ROUNDS=n`).

`FROM_LEVEL=n` starts `next`, `creative`, `woods` and `shortlist` at a later level; `TO_LEVEL=n` can limit the paint or salon loop for lap checks.

With `npm run build-and-preview` running in another terminal:

```bash
npm run test:offline
```

The production check installs the service worker, disconnects the browser, reloads, starts in her place using subject cards, opens Counting Cove, plays Monster Munch, earns a sticker, and verifies the save survives another offline reload. It then opens the Windy Picnic from the map, finds the blanket, and checks that the step survives an offline reload; its seeded save predates stories, so it also checks that loading an older save adds the untold picnic. It also checks cached fonts and that the dev helpers are absent. Set `GAME_URL` to test another local port.

A real iPad check is still needed for device speech, touch feel, Guided Access, and Add to Home Screen behavior.
