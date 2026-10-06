# Puddle Island (project Neo)

A home-made iPad learning game in the spirit of JumpStart and Neopets: playful learning, a familiar pet, and an island to explore. Current age bands run from lap play through pre-K; the long-term roadmap grows through elementary school, roughly grade 5 / age eleven. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)

[Design and architecture](docs/DESIGN.md) · [Roadmap](docs/ROADMAP.md) · [Game and world ideas](docs/ARCADE-IDEAS.md) · [Verification log](docs/VERIFICATION.md) · [Contributor guidance](AGENTS.md)

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

The island is an **age trail**. It climbs from **Puddle Lagoon** (lap, 18–24 months) on the shore through **Daisy Meadow** (toddler) and **Bumpy Hills** (preschool) up to **Starry Peak** (pre-K). Each place lays out every game for that age, at that age's levels. A game that grows with her, like Bubble Pop, stands in each place it supports. The play button goes straight to her own place; the island button there opens the trail, where her pet waits by her place and every place is open to explore. When there are more games than fit, swipe the land sideways or tap the arrows. When a grown-up moves her up an age band, the pet has a birthday and walks up the trail.

There are forty-three games, listed below. "Ages" lists the places each game appears in. The [verification log](docs/VERIFICATION.md) records which checks each one has passed; judgments of fun and clarity, and real-iPad checks, are still open for the newest eighteen (see the [roadmap](docs/ROADMAP.md#1-finish-and-verify-the-current-work)).

| Game | Ages | Starts as | Grows into |
| --- | --- | --- | --- |
| Bubble Pop | lap–pre-K | pop anything | pop one color, then numbers in order |
| Rainbow Fingers | lap–pre-K | rainbow or color-pot finger painting | paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl |
| Jelly Drums | lap–pre-K | free play on five notes | copy a tune of 2 to 5 notes |
| Song Maker | lap–pre-K | tap jellies on a looping beat | copy songs by shadows or a card, continue a pattern, find a tune by ear |
| Peekaboo Barn | lap–pre-K | tap to find who's hiding | find an animal, then remember hiding places |
| Splish Splash | lap–pre-K | scrub mud off the pet | named body parts in a shuffled order, two at once, then "first … then …" |
| Feelings Faces | lap–pre-K | tap bubbles to see the pet feel happy, sad, sleepy or surprised | match and name faces, choose what helps, say why a feeling happened, find a friend's feeling |
| Weather Wardrobe | lap–pre-K | tap the sky to change the weather | dress the pet for sun, rain or snow, then pack for a two-weather trip |
| Duck Pond | lap–pre-K | count along as ducks hop in | put N in, how many?, adding and taking away |
| Monster Munch | lap–pre-K | tap cookies into a hungry monster | count along, one cookie each, feed exactly N then ring the bell, cookies and apples, fair sharing |
| Puzzle Pals | lap–pre-K | finish a two-piece picture | three to twelve pieces, first over a faint picture, then an empty frame |
| Sink or Float | lap–pre-K | drop things in the water and watch | guess and test, sort into baskets, surprises like a floating apple |
| Duckling Parade | lap–pre-K | tap the grass to walk Mama Duck; ducklings fall in behind | lead them to the pond, bring exactly N, find one color, build a color pattern in line |
| Scoop Shop | lap–pre-K | tap tubs to pile scoops on a cone for a customer | one color, two scoops, "four blue scoops", three flavors stacked in order, then from memory |
| Roundup | lap–pre-K | tap an animal and it hops into its pen | shoo animals through the gate with a finger, sort pigs and bunnies, put exactly N in and ring the bell |
| Bouncy Launch | lap–pre-K | tap the spring and the pet boings onto a cloud | pull back farther to fly farther, land on the star cloud, then a numbered cloud, farther or nearer than last time |
| Word Monsters | lap–pre-K | tap letter monsters to hear their sounds | find a letter by name, then by its sound, first sounds, then build three-letter words |
| Peg Garden | lap–pre-K | tap the top and a pearl tumbles through flower pegs | bloom every flower, the four orange ones, aim for a numbered flower, then 1, 2, 3 in order |
| Fluffy Salon | lap–pre-K | grow and color fur, then freely snip and curl | every tool (grow, snip, comb, curl, color), then requests like "short and blue", then copy a pictured style |
| Sound Garden | lap–pre-K | tap garden friends to hear them sing | high or low, fast or slow, does the tune go up or down, echo a rhythm on the drum |
| Little Helpers | lap–pre-K | tap a fruit and a helper carries it home | send enough helpers to lift it, exactly the number shown, then "how many more?" |
| Egg Catch | lap–pre-K | tap a hen and her egg rolls into the basket | slide the basket to catch, catch only brown eggs, flip gates to route eggs |
| Mail Carrier | lap–pre-K | tap any mailbox to post a letter | match colors, then dots, then house numbers 1 to 9 |
| Photo Safari | lap–pre-K | tap any animal to take its photo | photograph the animal named, then "the bunny jumping", "the duck under the tree", and both |
| Bounce Back | lap–pre-K | bounce a slow ball back to the pet with a huge paddle | keep a rally going, play with a grown-up on the other paddle, aim through stars, count to ten |
| Dot Link | lap–pre-K | tap dots to pop them | join two dots of one color, pop one color, chains of four, then close a square |
| Teddy Doctor | lap–pre-K | tap boo-boos to put on bandages | bandage the part a patient names, choose what helps a bump or sniffles, then what helps from a spoken clue, check-ups in order from a card or from what the patient says |
| Bumper Garden | lap–pre-K | tap to launch a ladybug through flower bumpers | flip it back up until every flower blooms, bloom one color, bump numbered flowers in order |
| Shape Sorter | toddler–pre-K | one circle hole | six plain holes, one color, tilted pieces |
| Seesaw Balance | toddler–pre-K | put a big friend on the seesaw so a little one goes up | which friend is heavy enough, level it with blocks, find the heaviest look-alike present, match a weight two ways, weigh one mystery box, then infer one of two identical boxes |
| Quick Tricks | toddler–pre-K | a little show: hold a leaf over a bunny in the rain, find a sock's partner, stretch a bridge for a beetle | which leaf covers two friends, matching socks and bridge lengths; a second show turns parcels, sets picnic places and completes berry totals |
| Color Garden | toddler–pre-K | one basket | six colors with balloons and flowers |
| Size Parade | toddler–pre-K | tap the bigger or smaller friend | order three, then five friends in either direction |
| Bug Builder | toddler–pre-K | decorate matching shape outlines | copy a model, then mirror six spots using shape and color |
| Story Steps | toddler–pre-K | finish a two-picture story | order four pictures, fill missing middles, leave out unrelated pictures |
| Pattern Train | preschool–pre-K | AB patterns | AAB, ABB, ABC, animals, missing cars, bells, two gaps |
| Memory Match | preschool–pre-K | four picture cards | sixteen cards, number↔dots, shape + color, A↔a |
| Letter Trails | preschool–pre-K | follow a firefly along capital strokes | all 26 capitals, short words, the child's name |
| Stamp Studio | lap–pre-K | press stars or animal stamps onto a picture | choose colors, arrange stamps, change size and orientation, tell a picture story; any creation can finish |
| Pet Kitchen | toddler–pre-K | cut a sandwich in halves and share | quarters, sharing multiple wholes with alternative equal cuts, doubling a picture recipe |
| Rhythm Neighbors | lap–pre-K | tap a bird and a frog chorus | trade different musical parts, follow two frog voices, play long/short replies with a guided option |
| Tangram Town | toddler–pre-K | fit two big shapes into a house or boat | quarter-turn snaps, two triangles making a wall, a four-piece rocket, silhouettes with optional help |
| Robot Path | pre-K | two steps to a star | turns, rocks, and programs of up to eight steps |

Within a place, games are grouped by subject: senses, music, art, animals, numbers, everyday life, colors and shapes, puzzles, stories, and science. Grown-ups → Finding games offers **Subject cards**, an optional prototype showing four large subject choices, then four games at a time. The original swiping path remains the default. Each layout remembers its own position for the session; returning from a game keeps the launching place and subject/page. Compare both on the iPad before choosing a default.

A few notes on the newer games. In Memory Match, an incorrect pair counts as a miss only if the matching card was already known. Story Steps has four illustrated stories; its music-note button narrates the pictures already placed. In Feelings Faces and Weather Wardrobe the pet is the star, so tapping the big pet repeats the instruction. Monster Munch asks for a number, then lets her decide when to ring the bell; a full monster politely refuses more, and unfair shares come back to the tray. Song Maker's jellies sing on the music's beat, and the top level plays a tune to find by ear. Puzzle Pals pictures come alive when finished. In Sink or Float, guesses are never wrong answers: the water shows what happens. Word Monsters speaks letter sounds ("buh", "mmm") through device speech, which approximates phonics sounds at best; listen on the iPad before relying on them. On Bounce Back's play-together level a grown-up takes the second paddle; when no grown-up finger is on it, the pet plays it. In Bumper Garden the ladybug never drains: past the flippers a flower pot pops it back up, and tapping either half of the screen flips that side. Quick Tricks is one show of three tricks with one sticker; the arrow moves on when she is ready. In Seesaw Balance, testing presents on the seesaw is never a wrong answer.

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for the place it was played in. In the grown-up zone you can see each game's current level and pin one.

## Your island friend and sticker book

On the first visit, tap the egg four times, choose one of eight colors, then hear three pet names and pick one. A grown-up can type another name. The green arrow confirms each choice. The customized pet joins the trail, games, bath time, celebrations, and goodnight.

The book button on the map or any place opens five scenes: meadow, beach, farm, under the sea, and space. Drag earned stickers from the tray onto a scene; return one to the tray to remove its placement. Scene arrows and tray arrows browse independently. Placements survive resizing, closing the app, and backups.

Letter Trails uses capital A–Z stroke data. Accented Latin names are normalized to those letters; a name without supported letters falls back to PIP. No reading is needed to follow the spoken instructions and firefly.

## Grown-up zone

Press and hold **both top corners** of the island map for three seconds. Set her name (the voice says it), pet name and color, age band (her pet's home on the trail, and where play starts), session length, place layout, volume, and see what she played this week. Backups save to Files.

## Where it could grow

The [elementary roadmap](docs/ELEMENTARY-ROADMAP.md) plans a world that grows through kindergarten–grade 5: **Wonder Woods** for early exploration, **Maker Harbor** and **Storybook Square** for building and stories, then **Discovery Marsh** and **Skywatch Isles** for investigations and longer projects. Familiar games gain deeper modes—counting becomes sharing and fractions, routes become programs, and picture stories become evidence-based mysteries. Younger favorites remain available.

These are future concepts, not features currently available. The [active roadmap](docs/ROADMAP.md) starts with current verification and easier navigation, small **Windy Picnic** and **pet room** pilots, then the first elementary zone. Each later expansion can deepen a few games, add one new interaction, and connect them through an optional project; it need not add an entire new zone.

## How it's built

TypeScript + Vite + PixiJS 8, installed as a PWA. See the [design doc](docs/DESIGN.md) for the why. Shared instructions for human contributors and coding assistants live in [AGENTS.md](AGENTS.md).

```text
src/
  app/        boot, scene switching, session timer, routes, scenes/ (start, hatch, map, place, game host, stickers, goodnight)
  engine/     view scaling, tweens, seeded random, toddler input rules
  art/        palette, shapes, critter builder, particles, scenery, sticker frame
  audio/      Web Audio engine, instruments, sound effects, generative music, voice
  games/      one folder per minigame + the contract (types.ts) and registry
  progress/   age bands, save format + migration, difficulty, IndexedDB store
  parent/     the grown-up panel (plain HTML)
  ui/         buttons, icons, parent gate, text
  content/    voice script, the age-trail places, and stable world IDs
```

### Adding a minigame

1. Make `src/games/<id>/index.ts` exporting a `GameModule` (see `games/types.ts`): metadata, a subject (`region`) ID from `content/world.ts` that groups it inside each place, level ranges per band (each band it supports puts it in that place on the trail), `describeLevel` for the grown-up zone, a hub icon, a sticker drawing, and `create(ctx)` returning a `Game`. Most games keep a `PLANS` array, one entry per level.
2. Add any new spoken lines to `content/voice-script.ts`.
3. Register it in `games/registry.ts`. `npm test` checks every game's level ladder.

Shared pieces worth reusing: `engine/drag.ts` (toddler-proof dragging), `art/critter.ts` (any animal), `art/props.ts` (fruit and things to sort), `art/shapes.ts`, and `engine/view.ts` `spread()` for rows that stay clear of the pet.

In `npm run dev`, the browser console has `neo` (the app) and `kit` (synthetic taps and drags, the store) for poking at the game.

The shell handles everything else: transitions, the home button, the pet guide, co-play tips, saving the result, difficulty, stickers and the celebration. A game draws into `ctx.stage`, listens with `onTap`, and calls `ctx.finish({ misses, hints })`.

### Rules every game follows

Huge touch targets, responses on touch-down, no fail states (a wrong tap gets a boing and a hint), every instruction spoken, and tapping the pet repeats it. Colors come only from `art/palette.ts`, and pitched sounds use `audio/notes.ts` steps so everything stays in key with the music.

## Browser checks

The checks create isolated browser contexts and never touch a real player's save. Install the test browser once with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to a local Chrome executable.

With `npm run dev` running in another terminal:

```bash
npm run test:browser
```

The script exercises hatching, navigation and the parent gate; game levels including all 26 capital letter trails and word/name modes; and sticker placement, removal, paging, and portrait resizing. Scenarios include wrong answers, hints, saved rewards, reload persistence, and place scrolling. The [verification log](docs/VERIFICATION.md) records which runs passed and their limits.

Single suites: `world` (hatching, both place layouts, every subject/game card in all bands and both orientations, return memory, cancellation, birthdays, the parent gate), `expansion` (Size Parade, Bug Builder, Story Steps), `third` (Feelings Faces, Monster Munch), `fourth` (Song Maker, Puzzle Pals, Weather Wardrobe, Sink or Float), `early` (Rainbow Fingers and Splish Splash; `EARLY_ONLY=paint|bath`), `arcade` (Duckling Parade, Scoop Shop, Roundup, Bouncy Launch; `ARCADE_ONLY=parade|scoop|roundup|launch` runs one), `batch` (the follow-on ten games; `BATCH_ONLY=monsters|pegs|salon|garden|helpers|eggs|mail|safari|bounce|dots` runs one), `originals` (Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, Color Garden; `ORIGINALS_ONLY=bubbles|jelly|peekaboo|ducks|shapes|garden` runs one), `next` (Seesaw Balance, Teddy Doctor, Bumper Garden, Quick Tricks; `NEXT_ONLY=seesaw|doctor|bumper|tricks` runs one), `creative` (Stamp Studio, Pet Kitchen, Rhythm Neighbors, Tangram Town; `CREATIVE_ONLY=stamps|kitchen|rhythm|tangram`), plus `pattern`, `memory`, `letters`, `robot` and `stickers`, e.g. `BROWSER_SUITE=fourth npm run test:browser`. `FROM_LEVEL=n` starts `next` and `creative` at a later level. `TO_LEVEL=n` can limit the paint or salon loop for lap checks. Screenshots go into ignored `test-results/`.

With `npm run build-and-preview` running in another terminal:

```bash
npm run test:offline
```

The production check installs the service worker, disconnects the browser, reloads, starts in her place using subject cards, opens Counting Cove, plays Monster Munch, earns a sticker, and verifies the save survives another offline reload. It also checks cached fonts and that the dev helpers are absent. Set `GAME_URL` to test another local port.

A real iPad check is still needed for device speech, touch feel, Guided Access, and Add to Home Screen behavior.
