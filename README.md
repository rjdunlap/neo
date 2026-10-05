# Puddle Island (project Neo)

A home-made iPad learning game for little kids, in the spirit of Jumpstart. Every picture and sound is generated in code: no sprites, no audio files.

**Play it:** <https://rjdunlap.github.io/neo/> (every push to `main` redeploys via GitHub Actions)
Design doc: <https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913>

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (difficulty, saves, music scale)
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** open <https://rjdunlap.github.io/neo/> in Safari on the iPad → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off. New versions arrive the next time it's opened online.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

## The games

The hub has three places; swipe or tap the big arrows to move between them. Only games for the chosen age band appear.

| Place | Game | Starts as | Grows into |
| --- | --- | --- | --- |
| Meadow | Bubble Pop | pop anything | pop one color, then numbers in order |
| Meadow | Rainbow Fingers | rainbow finger painting | paint pots that say their color |
| Meadow | Jelly Drums | free play on five notes | copy a tune of 2 to 5 notes |
| Farm | Peekaboo Barn | tap to find who's hiding | "where's the cow?", then remember who hid where |
| Farm | Splish Splash | scrub the mud off Pip | "wash my ears!" one body part at a time |
| Farm | Duck Pond | count along as ducks hop in | put N in, how many?, adding and taking away |
| Garden | Shape Sorter | one circle hole | six plain holes, one color, tilted pieces |
| Garden | Color Garden | one basket | six colors with balloons and flowers |

Each game moves up a level after two easy rounds and down after two hard ones, inside the range for her age band. In the grown-up zone you can see each game's current level and pin one.

## Grown-up zone

Press and hold **both top corners** of the home screen for three seconds. Set her name (the voice says it), age band, session length, volume, and see what she played this week. Backups save to Files.

## How it's built

TypeScript + Vite + PixiJS 8, installed as a PWA. See the design doc for the why.

```text
src/
  app/        boot, scene switching, session timer, routes, scenes/ (start, hub, game host, stickers, goodnight)
  engine/     view scaling, tweens, seeded random, toddler input rules
  art/        palette, shapes, critter builder, particles, scenery, sticker frame
  audio/      Web Audio engine, instruments, sound effects, generative music, voice
  games/      one folder per minigame + the contract (types.ts) and registry
  progress/   age bands, save format + migration, difficulty, IndexedDB store
  parent/     the grown-up panel (plain HTML)
  ui/         buttons, icons, parent gate, text
  content/    voice script (every spoken line, by id)
```

### Adding a minigame

1. Make `src/games/<id>/index.ts` exporting a `GameModule` (see `games/types.ts`): metadata, a region (which decides its hub place), level ranges per band, `describeLevel` for the grown-up zone, a hub icon, a sticker drawing, and `create(ctx)` returning a `Game`. Most games keep a `PLANS` array, one entry per level.
2. Add any new spoken lines to `content/voice-script.ts`.
3. Register it in `games/registry.ts`. `npm test` checks every game's level ladder.

Shared pieces worth reusing: `engine/drag.ts` (toddler-proof dragging), `art/critter.ts` (any animal), `art/props.ts` (fruit and things to sort), `art/shapes.ts`, and `engine/view.ts` `spread()` for rows that stay clear of the pet.

In `npm run dev`, the browser console has `neo` (the app) and `kit` (synthetic taps and drags, the store) for poking at the game.

The shell handles everything else: transitions, the home button, the pet guide, co-play tips, saving the result, difficulty, stickers and the celebration. A game draws into `ctx.stage`, listens with `onTap`, and calls `ctx.finish({ misses, hints })`.

### Rules every game follows

Huge touch targets, responses on touch-down, no fail states (a wrong tap gets a boing and a hint), every instruction spoken, and tapping the pet repeats it. Colors come only from `art/palette.ts`, and pitched sounds use `audio/notes.ts` steps so everything stays in key with the music.
