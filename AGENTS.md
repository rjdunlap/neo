# Puddle Island (project Neo)

Shared guidance for human contributors and coding assistants. Paths below are relative to the repository root unless stated otherwise.

## Project direction

Puddle Island is an iPad learning game for the developer's daughter (about one year old in October 2026). Build a varied library of small, satisfying minigames that grow with her and feel part of a familiar island. The inspirations are JumpStart's playful learning and adventures, Neopets' companion and personal world, and the variety of classic arcade games.

Current play spans `lap`, `toddler`, `preschool`, and `prek` (roughly through age six). The long-term direction is elementary school through roughly grade 5 / age eleven, beginning with a 6–8 pilot. Extend familiar game families alongside new themed zones and projects. Short adventures, a pet treehouse, a discovery journal, and elementary zones are future directions; do not assume they or older age bands already exist.

Each activity should have a fun action and a clear learning purpose: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Add variety through different decisions, movement, creativity, listening, and pretend play. Extend an existing game when the meaningful action is the same; create a new game when the learning or interaction warrants it. Games can start at an older band without an artificial toddler mode.

Follow the user's requested scope and the roadmap. Build complete, playable slices; introduce shared infrastructure when an implemented activity needs it. Keep standalone play available as future stories connect games.

## Project references

Read the README, design, and roadmap for context; consult the idea notebook when choosing or developing concepts. No external document service is required.

| Document / source | Role |
| --- | --- |
| [README.md](README.md) | Setup, documented game inventory, navigation, browser commands |
| [docs/DESIGN.md](docs/DESIGN.md) | Current architecture, behavior, and explicitly labeled future direction |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Priorities, unfinished work, and completed milestones |
| [docs/ELEMENTARY-ROADMAP.md](docs/ELEMENTARY-ROADMAP.md) | Long-term learning progression, game-family extensions, themed zones, and small expansion milestones through elementary school |
| [docs/ARCADE-IDEAS.md](docs/ARCADE-IDEAS.md) | Game concepts, learning goals, inspiration, and overlaps; not a mandate to build every idea |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | Checks actually performed and remaining gaps |
| `src/games/registry.ts`, `src/games/types.ts` | Current registrations and the minigame contract |

Check the working tree before editing. Local implementations, recorded verification, and deployed features are distinct states. Preserve unrelated work in progress. Keep game counts and expansion history in the docs above rather than duplicating them here.

## Rules for every activity

- **Generated art and sound.** Draw with Pixi `Graphics`; use `src/art/palette.ts` colors. No imported sprite or audio files. Rendering code-drawn art into a `RenderTexture`, as Puzzle Pals does, is supported. Synthesize sound with Web Audio; pitched sounds use pentatonic steps from `src/audio/notes.ts`.
- **Large, forgiving controls.** Targets are at least 100 logical units on screen, including after scaling. Give immediate touch-down feedback. Taps use `onTap` from `src/engine/input.ts`; object drags use `src/engine/drag.ts`. Continuous steering, slingshots, and deliberate multi-touch may need custom pointer handling; retain palm rejection and handle cancellation, leaving the screen, and cleanup.
- **Spoken support.** Instructions and feedback belong in `src/content/voice-script.ts`. Use `ctx.instruct` for the instruction the pet repeats and `ctx.say` for other speech. If the game uses a large pet instead of the corner guide, it must repeat the instruction. Navigation never requires reading. Literacy activities may practice reading with replayable spoken support; check actual device speech before claiming a phonics skill.
- **Mistakes teach; exploration stays welcome.** A wrong answer gets a gentle boing and spoken hint, with a glow after two misses. Keep retries and supported completion available. Do not count free creative choices, unseen-card exploration, or experimental predictions as wrong answers. Older puzzles can require revision, with undo or replay and an explanation of what happened.
- **Predictable rewards and comfortable stopping.** One sticker per completed round, including with help. No lives, game-over screens, ads, purchases, streaks, round-ending timers, or guilt. The grown-up session setting owns the gentle goodnight flow. Future pet/world systems must not create neglect, lost possessions, or obligations while away.
- **Depth before pressure.** Grow levels through new modes and meaningful choices before adding speed, clutter, or memory load. Keep younger modes simple. Include co-play and an off-screen activity where useful; grown-up UI stays plain HTML in `src/parent/panel.ts`.

## Adding or extending a minigame

1. **Define a small complete experience.** State the fun action, learning goal, supported bands, first round, deeper modes, completion condition, and response to mistakes. For creative play, define a gentle way to finish without imposing one correct creation. Check existing games and the idea notebook for overlap.
2. **Keep rules inspectable.** Put level plans, puzzle generation, and answer/solution rules in the game's `logic.ts` where practical. Use the supplied seeded RNG for puzzle generation. Test meaningful properties such as solvability, valid targets, fair quantities, acceptable alternative solutions, and hints that lead somewhere useful.
3. **Implement the contract.** Export a `GameModule` from `src/games/<id>/index.ts`: stable ID, grown-up name, spoken title, subject (`region`), skills, supported bands, level ranges/descriptions, music, hub icon, seeded sticker art, and `create(ctx)`. Supply co-play/off-screen suggestions where appropriate. Implement `start`, `update`, `resize`, and `destroy`.
4. **Use the shell.** Draw into `ctx.stage`; reuse `ctx.rng`, `ctx.tw`, `ctx.particles`, `ctx.track`/`untrack`, and voice helpers. Use `ctx.petSpec` for the customized companion and `ctx.childName` where appropriate. Finish through `ctx.finish({ misses, hints })`; the game does not award stickers, save round history, or create its own home/celebration UI.
5. **Build a coherent ladder.** Define ordered plans and `{ min, max }` ranges for each supported band, with a useful `describeLevel` for grown-ups. Register in `src/games/registry.ts` and add voice lines. Registry tests check IDs, titles, bands, descriptions, and subject/place coverage.
6. **Integrate with the island.** Check the icon, title, layout, place scrolling, return route, portrait/landscape, and pet clearance. More games must not mean smaller targets. Preserve stable IDs so saves and stickers survive catalog reorganization.
7. **Verify and document.** Use the checks below, then update the inventory, implementation status, roadmap, and verification log. Mark gaps explicitly; a registered game or passing build alone does not establish finished play.

Two smooth rounds (at most one miss, no hints) at the current level step up; two struggling rounds (at least four misses or two hints each) step down. `src/progress/difficulty.ts` clamps changes to the played band's range. Grown-ups can pin levels through `store.pin`. Miss/hint accounting affects adaptation, so define it deliberately; assisted completion is not evidence of independent mastery.

## Integration and persistence

| Area | Contract to preserve |
| --- | --- |
| App and scenes | `src/app/App.ts` owns Pixi, transitions, logical view, and the frame loop. `Scene` layers are `content` → `particles` → `ui`; `track(obj)` runs its update. `GameScene` owns the guide, home, co-play tip, saving, difficulty, stickers, and celebration. |
| Age trail | `src/content/places.ts` defines Puddle Lagoon, Daisy Meadow, Bumpy Hills, and Starry Peak. Every place is open. `profile.band` sets the home place; advancing beyond saved `world.band` triggers the birthday walk once. |
| Routes | `go.hub()` opens the map; `go.place(band)` opens a place; `go.game(id, band?)` plays its levels, defaulting to the profile band. Home returns to the launching place; start goes to the child's home place. |
| Catalog layout | `GameModule.region` and `src/content/world.ts` `REGION_IDS` are subject IDs, not separate map destinations. `PlaceScene` is the default swipeable two-row path. The grown-up `settings.placeLayout` can select `SubjectPlaceScene`, with four subject/game cards per page. Both retain session position per band, touch-down feedback and swipe cancellation. Keep both layouts reachable for the iPad comparison. |
| Logical layout | `src/engine/view.ts` fits a 1024×768 design area and expands the spare dimension. Use `view.w`/`view.h` in `resize()`. Keep the bottom-left pet clear, e.g. `spread(n, 150, view.w - 40, gap)`. Home/island is top-left, the place's book button top-right; the map's two top corners form the parent gate. |
| Save data | `src/progress/save.ts` defines version 2 data and `migrate()`; `src/progress/store.ts` persists through IndexedDB. Add defaults, repair behavior, and migration tests for new fields. Preserve old progress, level pins, and backup/restore. The retired `world.opened` list is not an unlock system. |
| Pet and stickers | `src/art/pet.ts` builds the saved companion; voice lines support `{pet}`. Sticker placement is optional `{ page, x, y }` with normalized coordinates. Returning a sticker to the tray removes placement, never ownership. |

Games must release their own drag handles, global listeners, timers, and render textures in `destroy()`. Stop or guard callbacks that could touch destroyed objects; untrack objects removed before the scene ends. Use scene-owned timing and update helpers rather than unmanaged loops.

Future stories that carry a chosen object, amount, or tune need an explicit extension to the result contract; `{ misses, hints }` carries only round statistics. Save story steps so resuming cannot award twice. New rooms, journals, and creations need bounded storage and migration/backup checks. An older selectable band requires auditing band mappings, levels, places, routes, parent controls, voice, birthdays, and old saves together.

The elementary plan separates future zone identity from learning range; current places still map one-to-one to bands. Introduce that separation with the first thematic zone and preserve existing return routes. Extend coherent game ladders without silently renumbering saved levels or pins; introduce separate mode progress only when branches need it. Older learning should not remove younger favorites or turn grades into access gates.

## Reuse before adding new helpers

| Need | Existing starting points |
| --- | --- |
| Characters, clothing, props | In `src/art/`: `critter.ts` (`CRITTERS`, `attach()`, moods including `sad`/`calm`, `currentMood`), `pet.ts`, `props.ts`, `shapes.ts`, `scenery.ts`, `particles.ts`, `sticker.ts` |
| Input, motion, physics | In `src/engine/`: `input.ts`, `drag.ts`, `tween.ts`, `random.ts`, `view.ts`; `ball.ts` supplies ball/peg/wall simulation. Inspect current code and tests before reusing work in progress. |
| Music and speech | In `src/audio/`: `engine.ts` unlocks on first touch; `sfx.ts` includes synthesized animal voices; `music.beats()` supports beat-synced play; `voice.ts` speaks line IDs with device speech. Parent recordings remain a proposal. |
| Steering and aiming | Duckling Parade / Roundup for continuous steering; Bouncy Launch for a pull measured from pointer movement rather than an object snapped to the fingertip |
| Tracing, pictures, and reasoning | Letter Trails for zero-lift drags and ordered strokes; Puzzle Pals for code-drawn textures; Memory Match for known-partner mistakes; Robot Path for solvable programs; Sink or Float for unpenalized predictions |

Choose examples by the mechanic being built. Do not copy a game's assumptions about age, scoring, geometry, or cleanup without checking them.

## Verification workflow

TypeScript + Vite + PixiJS 8, installed as an offline PWA. Run from the repository root:

```bash
npm run dev                 # development server, port 5173
npm run typecheck
npm test
npm run build
npm run test:browser         # with the dev server running
npm run build-and-preview   # production build/preview, port 4173
npm run test:offline         # with the production preview running
```

For code changes, run typecheck, unit tests, and build. Exercise every new/changed game level in the browser, including wrong answers and hints where applicable, supported completion, saved results/rewards, reload, orientation, and reaching/returning from its place. Recheck production offline behavior after asset, navigation, or persistence changes. Shared engine or shell changes also need affected existing games checked. Keep the checks proportionate: run the suite (or one-game filter) for what changed, not every suite. The combined flow takes about an hour; save it for occasional release checks.

Browser setup, suite names, and filters live in [README.md](README.md#browser-checks) and `scripts/browser-check.mjs`; add cases there for new games instead of maintaining a second suite inventory here. `BROWSER_SUITE=<suite> npm run test:browser` selects one suite. Browser scripts use isolated contexts; never clear a real player's save. Documentation-only edits need link/consistency and diff checks, not a game test run.

Record only checks actually performed. Chrome automation does not establish physical iPad touch feel, offline device speech, first-touch audio, orientation, Guided Access, or Add to Home Screen behavior.

### Scripted play

Dev-only `neo` exposes the app (`neo.scene`, `neo.view`, `neo.go.game(id, band)`); `kit` in `src/dev/testkit.ts` provides `tap`, `tapOn`, `drag`, `dragTo`, `line`, `until`, `sleep`, and `store`. Start with a center tap and wait about three seconds for the transition before navigating. Set the test profile band and `kit.store.stats(id).level`, then drive the game and inspect `neo.scene.game`.

Use scripted input for moving targets, then screenshots for visual review. Finish edits before a play-through: HMR can reload and kill a running script. To keep editing during the hour-long combined flow, serve a detached `git worktree` of HEAD on another port (with its own Vite `cacheDir`) and point `GAME_URL` at it. Re-check `neo.scene` after reloads. To clear an isolated profile's test data only, use `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

### Input and rendering pitfalls

- Dispatch synthetic `pointerup` on the canvas (the kit does); using `document` leaves Pixi thinking the finger is down. Handle `pointercancel` and lost release in custom controls.
- Object drags ride 40 logical units above the finger; aim drops about 40 units below the target. Tracing can use `lift: 0`.
- Hit areas and `onTap` radii use local object units. A critter at 0.3 scale with radius 80 only has a 24-unit screen radius, centered on its feet. Give it a body-centered area such as `new Circle(0, -120, 85 / scale)`.
- Visible drawings can intercept hits even without listeners. Put full-screen input layers last, give them a `hitArea` only when they should catch taps, and set `eventMode = 'none'` on decorations over controls (bushes, flashes).
- A zero-scale container has no inverse transform; guard `toLocal` calls against NaN.
- Hit-testing uses the transforms from the last rendered frame. After a script moves an object, wait a frame before tapping it.
- When tap or drop targets sit close together, resolve the touch to the nearest target rather than whichever is drawn on top (Bubble Pop's overlapping bubbles, Teddy Doctor's boo-boos and body parts).
- Keep long-lived drawings (overlays, a bridge, a glow) out of containers a game clears between scenes, or they are destroyed while the frame loop still draws them.
- `Graphics.arc()` joins to the previous point: `moveTo` its start first. Use `puffs()` instead of stroking overlapping circles with visible inner outlines.
- Render parentless containers into textures: `renderer.render({ container, target, clear: false })`; erase with `blendMode = 'erase'`. Free game-owned textures when leaving.

## Documentation and Git

Keep this file provider-neutral and focused on durable contributor guidance. Game descriptions, historical expansions, counts, and detailed test results belong in the linked docs. When implementing roadmap work, update the README, DESIGN status, ROADMAP, and VERIFICATION; update this file when a shared contract or workflow changes. Label new ideas as proposals and preserve remaining checks as unfinished.

Commit or push only when asked. The live site is [Puddle Island](https://rjdunlap.github.io/neo/); every push to `main` deploys through `.github/workflows/deploy.yml`. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repository).
