# Puddle Island (project Neo)

A home-made iPad learning game for little kids, in the spirit of Jumpstart. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)

[Design and architecture](docs/DESIGN.md) · [Continuation plan](docs/ROADMAP.md) · [Contributor and AI guidance](AGENTS.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: saves, difficulty, the age trail, game rules, tracing, matching
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** open <https://rjdunlap.github.io/neo/> in Safari on the iPad → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off. New versions arrive the next time it's opened online.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

## The island and its games

The island is an **age trail**. It climbs from **Puddle Lagoon** (lap, 18–24 months) on the shore through **Daisy Meadow** (toddler) and **Bumpy Hills** (preschool) up to **Starry Peak** (pre-K). Each place lays out every game for that age, at that age's levels. A game that grows with her, like Bubble Pop, stands in each place it supports. The play button goes straight to her own place; the island button there opens the trail, where her pet waits by her place and every place is open to explore. When there are more games than fit, swipe the land sideways or tap the arrows. When a grown-up moves her up an age band, the pet has a birthday and walks up the trail.

There are twenty-one games. "Ages" lists the places each one appears in.

| Game | Ages | Starts as | Grows into |
| --- | --- | --- | --- |
| Bubble Pop | lap–pre-K | pop anything | pop one color, then numbers in order |
| Rainbow Fingers | lap–pre-K | rainbow finger painting | paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl |
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
| Shape Sorter | toddler–pre-K | one circle hole | six plain holes, one color, tilted pieces |
| Color Garden | toddler–pre-K | one basket | six colors with balloons and flowers |
| Size Parade | toddler–pre-K | tap the bigger or smaller friend | order three, then five friends in either direction |
| Bug Builder | toddler–pre-K | decorate matching shape outlines | copy a model, then mirror six spots using shape and color |
| Story Steps | toddler–pre-K | finish a two-picture story | order four pictures, fill missing middles, leave out unrelated pictures |
| Pattern Train | preschool–pre-K | AB patterns | AAB, ABB, ABC, animals, missing cars, bells, two gaps |
| Memory Match | preschool–pre-K | four picture cards | sixteen cards, number↔dots, shape + color, A↔a |
| Letter Trails | preschool–pre-K | follow a firefly along capital strokes | all 26 capitals, short words, the child's name |
| Robot Path | pre-K | two steps to a star | turns, rocks, and programs of up to eight steps |

Within a place, games are grouped by subject: senses, music, art, animals, numbers, everyday life, colors and shapes, puzzles, stories, and science.

A few notes on the newer games. In Memory Match, an incorrect pair counts as a miss only if the matching card was already known. Story Steps has four illustrated stories; its music-note button narrates the pictures already placed. In Feelings Faces and Weather Wardrobe the pet is the star, so tapping the big pet repeats the instruction. Monster Munch asks for a number, then lets her decide when to ring the bell; a full monster politely refuses more, and unfair shares come back to the tray. Song Maker's jellies sing on the music's beat, and the top level plays a tune to find by ear. Puzzle Pals pictures come alive when finished. In Sink or Float, guesses are never wrong answers: the water shows what happens.

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for the place it was played in. In the grown-up zone you can see each game's current level and pin one.

## Your island friend and sticker book

On the first visit, tap the egg four times, choose one of eight colors, then hear three pet names and pick one. A grown-up can type another name. The green arrow confirms each choice. The customized pet joins the trail, games, bath time, celebrations, and goodnight.

The book button on the map or any place opens five scenes: meadow, beach, farm, under the sea, and space. Drag earned stickers from the tray onto a scene; return one to the tray to remove its placement. Scene arrows and tray arrows browse independently. Placements survive resizing, closing the app, and backups.

Letter Trails uses capital A–Z stroke data. Accented Latin names are normalized to those letters; a name without supported letters falls back to PIP. No reading is needed to follow the spoken instructions and firefly.

## Grown-up zone

Press and hold **both top corners** of the island map for three seconds. Set her name (the voice says it), pet name and color, age band (her pet's home on the trail, and where play starts), session length, volume, and see what she played this week. Backups save to Files.

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

This exercises hatching, the age trail and the parent gate; every level of Pattern Train, Memory Match, Robot Path and the nine games added after them; all 26 letter trails plus word/name modes; and sticker placement, removal, paging, and portrait resizing. It includes wrong answers, hints, saved rewards, reload persistence, and place scrolling. Single suites: `world` (hatching, the age trail, swiping, birthdays, the parent gate), `expansion` (Size Parade, Bug Builder, Story Steps), `third` (Feelings Faces, Monster Munch), `fourth` (Song Maker, Puzzle Pals, Weather Wardrobe, Sink or Float), `early` (every level of Rainbow Fingers and Splish Splash), plus `pattern`, `memory`, `letters`, `robot` and `stickers`, e.g. `BROWSER_SUITE=fourth npm run test:browser`. Screenshots go into ignored `test-results/`.

With `npm run build-and-preview` running in another terminal:

```bash
npm run test:offline
```

The production check installs the service worker, disconnects the browser, reloads, starts in her place on the trail, plays Monster Munch, earns a sticker, and verifies the save survives another offline reload. It also checks cached fonts and that the dev helpers are absent. Set `GAME_URL` to test another local port.

A real iPad check is still needed for device speech, touch feel, Guided Access, and Add to Home Screen behavior.
