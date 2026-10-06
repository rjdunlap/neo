# Puddle Island (project Neo)

A home-made iPad learning game for little kids, in the spirit of Jumpstart. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)

[Design and architecture](docs/DESIGN.md) · [Continuation plan](docs/ROADMAP.md) · [Contributor and AI guidance](AGENTS.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: saves, difficulty, region access, tracing, matching, routes
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** open <https://rjdunlap.github.io/neo/> in Safari on the iPad → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off. New versions arrive the next time it's opened online.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

## The games

The island has seventeen games in ten regions. Tap a landmark and your pet hops over, then enters that region. Region arrows show more games, two large choices at a time. Clouds cover places that do not have games for the chosen age band yet; they are still fun to poke. Newly available regions get a birthday reveal when the band increases, and no region closes as she grows.

| Region | Game | Starts as | Grows into |
| --- | --- | --- | --- |
| Bubble Beach | Bubble Pop | pop anything | pop one color, then numbers in order |
| Treehouse | Rainbow Fingers | rainbow finger painting | paint pots that say their color |
| Music Mountain | Jelly Drums | free play on five notes | copy a tune of 2 to 5 notes |
| Barnyard | Peekaboo Barn | tap to find who's hiding | find an animal, then remember hiding places |
| Cozy Village | Splish Splash | scrub mud off the pet | named body parts, then a shuffled order at pre-K |
| Counting Cove | Duck Pond | count along as ducks hop in | put N in, how many?, adding and taking away |
| Rainbow Meadow | Shape Sorter | one circle hole | six plain holes, one color, tilted pieces |
| Rainbow Meadow | Color Garden | one basket | six colors with balloons and flowers |
| Puzzle Peaks | Pattern Train | AB patterns | AAB, ABB, ABC, animals, missing cars, bells, two gaps |
| Puzzle Peaks | Memory Match | four picture cards | sixteen cards, number↔dots, shape + color, A↔a |
| Story Grove | Letter Trails | follow a firefly along capital strokes | all 26 capitals, short words, the child's name |
| Tinker Lab | Robot Path | two steps to a star | turns, rocks, and programs of up to eight steps |
| Puzzle Peaks | Size Parade | tap the bigger or smaller friend | order three, then five friends in either direction |
| Tinker Lab | Bug Builder | decorate matching shape outlines | copy a model, then mirror six spots using shape and color |
| Story Grove | Story Steps | finish a two-picture story | order four pictures, fill missing middles, leave out unrelated pictures |
| Cozy Village | Feelings Faces | tap bubbles to see the pet feel happy, sad, sleepy or surprised | match and name faces, choose what helps, say why a feeling happened, find a friend's feeling |
| Counting Cove | Monster Munch | tap cookies into a hungry monster | count along, one cookie each, feed exactly N then ring the bell, cookies and apples, fair sharing |

Pattern Train, Memory Match, and Letter Trails support preschool and pre-K. Robot Path starts at pre-K. In Memory Match, an incorrect pair counts as a miss only if the matching card was already known.

Size Parade, Bug Builder, and Story Steps start at toddler and continue through pre-K. They bring Puzzle Peaks, Tinker Lab, and Story Grove into the toddler map. Story Steps has four illustrated stories: growing a flower, building a tower, making a snow friend, and a butterfly's life cycle. The music-note button narrates the pictures already placed; finishing tells the whole story aloud.

Feelings Faces and Monster Munch start at lap and continue through pre-K, giving Cozy Village and Counting Cove two games each from the first band. In Feelings Faces the pet is the star: tapping a sad pet gives it a hug, and in the later levels the big pet repeats the instruction. Monster Munch asks for a number, then lets the child decide when to ring the bell; a full monster politely refuses more, and unfair shares come back to the tray.

The grown-up zone lists games still waiting under the clouds and the band that opens each one.

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for her age band. In the grown-up zone you can see each game's current level and pin one.

## Your island friend and sticker book

On the first visit, tap the egg four times, choose one of eight colors, then hear three pet names and pick one. A grown-up can type another name. The green arrow confirms each choice. The customized pet joins the map, games, bath time, celebrations, and goodnight.

The book button on the map opens five scenes: meadow, beach, farm, under the sea, and space. Drag earned stickers from the tray onto a scene; return one to the tray to remove its placement. Scene arrows and tray arrows browse independently. Placements survive resizing, closing the app, and backups.

Letter Trails uses capital A–Z stroke data. Accented Latin names are normalized to those letters; a name without supported letters falls back to PIP. No reading is needed to follow the spoken instructions and firefly.

## Grown-up zone

Press and hold **both top corners** of the island map for three seconds. Set her name (the voice says it), pet name and color, age band, session length, volume, and see what she played this week. Backups save to Files.

## How it's built

TypeScript + Vite + PixiJS 8, installed as a PWA. See the [design doc](docs/DESIGN.md) for the why. Shared instructions for human contributors and coding assistants live in [AGENTS.md](AGENTS.md).

```text
src/
  app/        boot, scene switching, session timer, routes, scenes/ (start, hatch, map, region, game host, stickers, goodnight)
  engine/     view scaling, tweens, seeded random, toddler input rules
  art/        palette, shapes, critter builder, particles, scenery, sticker frame
  audio/      Web Audio engine, instruments, sound effects, generative music, voice
  games/      one folder per minigame + the contract (types.ts) and registry
  progress/   age bands, save format + migration, difficulty, IndexedDB store
  parent/     the grown-up panel (plain HTML)
  ui/         buttons, icons, parent gate, text
  content/    voice script, region definitions and stable world IDs
```

### Adding a minigame

1. Make `src/games/<id>/index.ts` exporting a `GameModule` (see `games/types.ts`): metadata, a region ID from `content/world.ts`, level ranges per band, `describeLevel` for the grown-up zone, a hub icon, a sticker drawing, and `create(ctx)` returning a `Game`. Most games keep a `PLANS` array, one entry per level.
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

This exercises hatching, region navigation and the parent gate; every Pattern Train, Memory Match, Robot Path, Size Parade, Bug Builder, Story Steps, Feelings Faces, and Monster Munch level; all 26 letter trails plus word/name modes; and sticker placement, removal, paging, and portrait resizing. It includes wrong answers, hints, saved rewards, reload persistence, and region paging. Use `BROWSER_SUITE=expansion npm run test:browser` for Size Parade, Bug Builder and Story Steps, and `BROWSER_SUITE=third npm run test:browser` for Feelings Faces and Monster Munch. Screenshots go into ignored `test-results/`.

With `npm run build-and-preview` running in another terminal:

```bash
npm run test:offline
```

The production check installs the service worker, disconnects the browser, reloads, navigates into a new game, earns a sticker, and verifies the save survives another offline reload. It also checks cached fonts and that the dev helpers are absent. Set `GAME_URL` to test another local port.

A real iPad check is still needed for device speech, touch feel, Guided Access, and Add to Home Screen behavior.
