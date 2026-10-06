# Puddle Island (project Neo)

Shared project guidance for any coding assistant or human contributor. Code paths in the architecture notes are relative to `src/` unless stated otherwise; documentation paths are relative to the repository root.

An iPad learning game for the developer's daughter (about 1 year old in Oct 2026), growing with her to age 6. TypeScript + Vite + PixiJS 8, installed as an offline PWA. Live at https://rjdunlap.github.io/neo/ (every push to `main` deploys via `.github/workflows/deploy.yml`).

Read these repository-local documents for context; no particular AI provider or external document tool is required:

- `README.md`: setup, current game list, and how to add a game.
- `docs/DESIGN.md`: product vision, architecture, and current implementation status.
- `docs/ROADMAP.md`: implementation checklist and verification status for the island expansion. Treat unchecked items as remaining work.

## Commands

- `npm run dev` (port 5173), `npm test` (vitest), `npm run typecheck`, `npm run build`.
- `npm run build-and-preview` builds and serves the production app on port 4173 for PWA/offline checks.

## Non-negotiables

- **No sprites or audio files.** Everything is drawn with Pixi `Graphics` and synthesized with Web Audio. Colors only from `art/palette.ts`. Pitched sounds use pentatonic steps (`audio/notes.ts`) so they're always in key with the music.
- **Toddler rules:** huge targets (≥100 units), respond on touch-down, no fail states (wrong = boing + gentle voice hint, then a glow after two misses), every instruction spoken (`content/voice-script.ts`), tapping the corner pet repeats it. Drags go through `engine/drag.ts`. Taps through `engine/input.ts` `onTap` (cooldown + palm rejection).
- No ads, purchases, streaks, timers that end play, or anything that guilt-trips. Rewards are predictable (one sticker per round).
- Kid-facing text is never required reading. Grown-up UI (parent zone) is plain HTML in `parent/panel.ts`.

## Architecture

- `app/`: `App` (Pixi app, logical-unit root, scene switching with a fade, frame loop), `Scene` base (layers `content` → `particles` → `ui`; `track(obj)` runs `obj.update(dt)`), `routes.ts`, `session.ts` (screen-time timer), scenes (`StartScene`, `HatchScene`, `MapScene`, `RegionScene`, `GameScene`, `StickerBookScene`, `GoodnightScene`).
- Logical units: the 1024×768 design area always fits (`engine/view.ts`); the spare side grows. Lay out from `view.w`/`view.h` in `resize()`. Keep rows clear of the pet in the bottom-left (use `spread(n, 150, view.w - 40, gap)`). Home button is top-left and returns from a game to its region; region scenes have an island button. The parent gate is both top corners on the map.
- **Games** (`games/<id>/index.ts`) export a `GameModule` (`games/types.ts`) and are listed in `games/registry.ts`. The shell (`GameScene`) owns the pet, home button, co-play tip, saving, stickers and the celebration; a game only draws into `ctx.stage`, uses `ctx.tw`/`ctx.particles`/`ctx.say`/`ctx.instruct`, and calls `ctx.finish({ misses, hints })`.
- **Level ladders:** games define ordered level plans (usually changing *mode* as well as size) and expose `{min, max}` ranges per supported age band (`lap`, `toddler`, `preschool`, `prek`). `describeLevel(level)` is shown to grown-ups. `progress/difficulty.ts`: two smooth rounds (≤1 miss, 0 hints) step up, two struggling rounds (≥4 misses or ≥2 hints) step down, clamped to the band. Grown-ups can pin a level (`store.pin`). `games/registry.test.ts` checks every ladder.
- **World:** `content/world.ts` holds stable region IDs, pet colors, and sticker-page IDs. `content/regions.ts` holds ten map positions, generated landmarks, backdrops, and spoken names. `MapScene` checks game bands, shows clouds, and celebrates a newly reached band once. `RegionScene` pages games in registry order, two large landmarks per page (`app/region-pages.ts`), remembers each region's page for the session, and retains pokeable flowers. The parent panel lists clouded games with the band that opens them. `go.hub()` is the map route; `go.region(id)` enters a region. Registry tests ensure regions never close as bands increase.
- **Pet:** `art/pet.ts` builds the customized guide from the save. `GameContext.petSpec` lets activities share its look; `childName` supports Letter Trails. `{pet}` is available in voice lines. Hatching is four egg taps, eight colors, then spoken name choices or an optional HTML name form.
- **Stickers:** five scene pages plus a paged tray. `StickerRecord.placement` is optional `{ page, x, y }`, with normalized page coordinates. Drops back on the tray remove placement but retain the earned sticker. Drags use `engine/drag.ts`; Letter Trails uses its zero-lift option for fingertip tracing.
- **New games:** Pattern Train has nine mode levels; Memory Match has nine levels and only counts known-partner mistakes; Letter Trails has ordered capital stroke data plus word/name modes; Robot Path has six levels with tested solvable routes.
- **Second expansion:** Size Parade has eight comparison/order levels; Bug Builder has seven guided/copy/mirror levels; Story Steps has seven sequencing levels across four code-drawn picture stories. All three support toddler through pre-K, opening Puzzle Peaks, Tinker Lab, and Story Grove at toddler. Their pure puzzle rules live in each game's `logic.ts`; `games/expansion.test.ts` checks unique size order, mirror geometry, and story solvability. `BROWSER_SUITE=expansion npm run test:browser` exercises every new level plus mistakes, hints, portrait layouts, save reload, and region pages.
- **Third expansion:** Feelings Faces (Cozy Village) and Monster Munch (Counting Cove) both start at lap. Critters have `sad` and `calm` moods (brows and a tear are drawn for sad/surprised) and a `currentMood` getter. Feelings Faces hides the corner guide and its big pet repeats the instruction. Monster Munch's `Monster` (`games/monster-munch/art.ts`) gapes, chews, refuses, burps and shows eaten food in its tummy. Particles have a `heart` kind. `BROWSER_SUITE=third npm run test:browser` plays every level of both.
- Saves: `progress/save.ts` (version 2 `SaveData` + `migrate()`; upgrades version-one saves and repairs input) and `progress/store.ts` (IndexedDB via idb-keyval). Add fields with defaults in `migrate` and a test.
- Art kit: `art/critter.ts` (parametric animals; `CRITTERS` presets; `attach()` to put things on the body), `art/props.ts` (fruit etc.), `art/shapes.ts` (`shapePath`, `puffs` for bushes/trees), `art/scenery.ts` (`Backdrop`), `art/particles.ts`, `art/sticker.ts`.
- Audio: `audio/engine.ts` (unlock on first tap; buses), `audio/sfx.ts` (incl. synthesized animal voices), `audio/music.ts` (generative styles), `audio/voice.ts` (device speech for now; recorded parent voices are planned to slot in by line id).

## Testing in the browser

In dev, the console has `neo` (the `App`; `neo.scene`, `neo.go.game(id)`, `neo.view`) and `kit` (`src/dev/testkit.ts`, dev-only): `kit.tap(x, y)`, `kit.tapOn(obj, dx, dy)`, `kit.drag(points)`, `kit.dragTo(obj, point)`, `kit.line(a, b)`, `kit.until(fn)`, `kit.sleep(ms)`, `kit.store`. Typical check: start (tap the middle), wait ~3s, set `kit.store.data.profile.band` and `kit.store.stats(id).level`, `neo.go.game(id)`, then drive it and read game state (`neo.scene.game.*`). Screenshots are too slow to hit moving targets; drive with scripts, then screenshot to look. `npm run test:browser` uses Playwright against a running dev server; `npm run test:offline` targets the production preview. See the README for browser setup.

Gotchas learned the hard way:
- Editing a file while a browser script runs triggers an HMR full reload and kills the script. Edit, *then* test. Re-check `neo.scene` after reloads.
- Navigation is ignored while a scene transition is in progress; wait ~3s after the start tap before `neo.go.*`.
- Synthetic `pointerup` must be dispatched on the canvas (the kit does this); dispatching it on `document` leaves Pixi thinking the finger is still down (hold buttons then fire).
- Dragged things ride 40 units above the finger (`LIFT` in `drag.ts`): aim drops ~40 units below the target.
- Pixi `Graphics.arc()` joins to the previous point: `moveTo` the arc's start first. Stroking several overlapping circles draws inner outlines: use `puffs()`.
- A container scaled to 0 has no inverse transform; `toLocal` gives NaN. `Critter` guards its eye tracking; guard anything similar.
- Rendering into a `RenderTexture` (painting, mud): render parentless containers with `renderer.render({ container, target, clear: false })`; erase with `blendMode = 'erase'`.
- Use an isolated browser profile for testing. Clear only that profile's test progress when done: `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`. Do not clear a real player's save.

## Keeping context current

- Keep this file provider-neutral. Document shell commands and browser checks directly instead of requiring a particular assistant's tools or launch configuration.
- When implementing roadmap items, update `docs/ROADMAP.md`, the status in `docs/DESIGN.md`, the README, and any architecture guidance here that changed.
- For code changes, run `npm run typecheck`, `npm test`, and `npm run build`. Exercise new games in the browser, including wrong answers and hints; check the production PWA offline after changes affecting assets, navigation, or persistence. Report checks actually performed and any remaining gaps.

## Git

Commit or push only when asked; a push deploys the live site. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repo).
