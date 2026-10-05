# Puddle Island (project Neo)

An iPad learning game for the developer's daughter (about 1 year old in Oct 2026), growing with her to age 6. TypeScript + Vite + PixiJS 8, installed as an offline PWA. Live at https://rjdunlap.github.io/neo/ (every push to `main` deploys via `.github/workflows/deploy.yml`). Design doc with vision, catalog of ~30 game ideas and roadmap: https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913 (a Claude Doc; read it with the docs tools, not web fetch). `README.md` has the game list and how to add a game.

## Commands

- `npm run dev` (port 5173), `npm test` (vitest), `npm run typecheck`, `npm run build`.
- `.claude/launch.json` has `neo` (dev) and `neo-build` (build + preview on 4173, for PWA/offline checks).

## Non-negotiables

- **No sprites or audio files.** Everything is drawn with Pixi `Graphics` and synthesized with Web Audio. Colors only from `art/palette.ts`. Pitched sounds use pentatonic steps (`audio/notes.ts`) so they're always in key with the music.
- **Toddler rules:** huge targets (≥100 units), respond on touch-down, no fail states (wrong = boing + gentle voice hint, then a glow after two misses), every instruction spoken (`content/voice-script.ts`), tapping the corner pet repeats it. Drags go through `engine/drag.ts`. Taps through `engine/input.ts` `onTap` (cooldown + palm rejection).
- No ads, purchases, streaks, timers that end play, or anything that guilt-trips. Rewards are predictable (one sticker per round).
- Kid-facing text is never required reading. Grown-up UI (parent zone) is plain HTML in `parent/panel.ts`.

## Architecture

- `app/`: `App` (Pixi app, logical-unit root, scene switching with a fade, frame loop), `Scene` base (layers `content` → `particles` → `ui`; `track(obj)` runs `obj.update(dt)`), `routes.ts`, `session.ts` (screen-time timer), scenes (`StartScene`, `HubScene`, `GameScene`, `StickerBookScene`, `GoodnightScene`).
- Logical units: the 1024×768 design area always fits (`engine/view.ts`); the spare side grows. Lay out from `view.w`/`view.h` in `resize()`. Keep rows clear of the pet in the bottom-left (use `spread(n, 150, view.w - 40, gap)`). Home button is top-left; parent gate is both top corners on the hub.
- **Games** (`games/<id>/index.ts`) export a `GameModule` (`games/types.ts`) and are listed in `games/registry.ts`. The shell (`GameScene`) owns the pet, home button, co-play tip, saving, stickers and the celebration; a game only draws into `ctx.stage`, uses `ctx.tw`/`ctx.particles`/`ctx.say`/`ctx.instruct`, and calls `ctx.finish({ misses, hints })`.
- **Level ladders:** each game has a `PLANS` array (one entry per level, usually changing *mode* as well as size) and a `LEVELS` record of `{min, max}` per age band (`lap`, `toddler`, `preschool`, `prek`). `describeLevel(level)` is shown to grown-ups. `progress/difficulty.ts`: two smooth rounds (≤1 miss, 0 hints) step up, two struggling rounds (≥4 misses or ≥2 hints) step down, clamped to the band. Grown-ups can pin a level (`store.pin`). `games/registry.test.ts` checks every ladder.
- **Hub:** places (meadow, farm, garden) are pages chosen by each game's `region`; only games whose `bands` include the current band appear. Up to three games per place: front-left, front-right, back-center, in registry order. Games open on a *tap that doesn't travel* (so swipes starting on them still swipe).
- Saves: `progress/save.ts` (versioned `SaveData` + `migrate()` that repairs anything) and `progress/store.ts` (IndexedDB via idb-keyval). Add fields with defaults in `migrate` and a test.
- Art kit: `art/critter.ts` (parametric animals; `CRITTERS` presets; `attach()` to put things on the body), `art/props.ts` (fruit etc.), `art/shapes.ts` (`shapePath`, `puffs` for bushes/trees), `art/scenery.ts` (`Backdrop`), `art/particles.ts`, `art/sticker.ts`.
- Audio: `audio/engine.ts` (unlock on first tap; buses), `audio/sfx.ts` (incl. synthesized animal voices), `audio/music.ts` (generative styles), `audio/voice.ts` (device speech for now; recorded parent voices are planned to slot in by line id).

## Testing in the browser

In dev, the console has `neo` (the `App`; `neo.scene`, `neo.go.game(id)`, `neo.view`) and `kit` (`src/dev/testkit.ts`, dev-only): `kit.tap(x, y)`, `kit.tapOn(obj, dx, dy)`, `kit.drag(points)`, `kit.dragTo(obj, point)`, `kit.line(a, b)`, `kit.until(fn)`, `kit.sleep(ms)`, `kit.store`. Typical check: start (tap the middle), wait ~3s, set `kit.store.data.profile.band` and `kit.store.stats(id).level`, `neo.go.game(id)`, then drive it and read game state (`neo.scene.game.*`). Screenshots are too slow to hit moving targets; drive with scripts, then screenshot to look.

Gotchas learned the hard way:
- Editing a file while a browser script runs triggers an HMR full reload and kills the script. Edit, *then* test. Re-check `neo.scene` after reloads.
- Navigation is ignored while a scene transition is in progress; wait ~3s after the start tap before `neo.go.*`.
- Synthetic `pointerup` must be dispatched on the canvas (the kit does this); dispatching it on `document` leaves Pixi thinking the finger is still down (hold buttons then fire).
- Dragged things ride 40 units above the finger (`LIFT` in `drag.ts`): aim drops ~40 units below the target.
- Pixi `Graphics.arc()` joins to the previous point: `moveTo` the arc's start first. Stroking several overlapping circles draws inner outlines: use `puffs()`.
- A container scaled to 0 has no inverse transform; `toLocal` gives NaN. `Critter` guards its eye tracking; guard anything similar.
- Rendering into a `RenderTexture` (painting, mud): render parentless containers with `renderer.render({ container, target, clear: false })`; erase with `blendMode = 'erase'`.
- Clear test progress when done: `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

## Git

Commit or push only when asked; a push deploys the live site. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repo).
