# Puddle Island (project Neo)

A home-made iPad learning game for little kids, in the spirit of Jumpstart. Every picture and sound is generated in code: no sprites, no audio files. Design doc: <https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913>

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (difficulty, saves, music scale)
npm run build      # type-check + production build into dist/
```

## Try it on the iPad

- **Quick look, same Wi-Fi:** `npm run dev:lan`, then open the "Network" URL it prints in Safari on the iPad. Fine for playing; offline mode and "Add to Home Screen" as a full app need HTTPS (below).
- **The real thing:** put `dist/` on any static HTTPS host (GitHub Pages, Netlify, Cloudflare Pages). Paths are relative, so a sub-folder works. On the iPad, open it in Safari → Share → Add to Home Screen. It then runs full screen and works with Wi-Fi off.
- **Lock her in:** Settings → Accessibility → Guided Access, then triple-click the top button inside the app.

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

1. Make `src/games/<id>/index.ts` exporting a `GameModule` (see `games/types.ts`): metadata, level ranges per band, a hub icon, a sticker drawing, and `create(ctx)` returning a `Game`.
2. Add any new spoken lines to `content/voice-script.ts`.
3. Register it in `games/registry.ts`.

The shell handles everything else: transitions, the home button, the pet guide, co-play tips, saving the result, difficulty, stickers and the celebration. A game draws into `ctx.stage`, listens with `onTap`, and calls `ctx.finish({ misses, hints })`.

### Rules every game follows

Huge touch targets, responses on touch-down, no fail states (a wrong tap gets a boing and a hint), every instruction spoken, and tapping the pet repeats it. Colors come only from `art/palette.ts`, and pitched sounds use `audio/notes.ts` steps so everything stays in key with the music.
