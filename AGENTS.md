# Puddle Island (project Neo)

Shared guidance for human contributors and coding assistants. Paths below are relative to the repository root unless stated otherwise.

## Project direction

Puddle Island is an iPad learning game for the developer's daughter (about one year old in October 2026). Build a varied library of small, satisfying minigames that grow with her and feel part of a familiar island. The inspirations are JumpStart's playful learning and adventures, Neopets' companion and personal world, and the variety of classic arcade games.

Current play spans `lap`, `toddler`, `preschool`, `prek`, and `school` (early school, roughly 6–8, at Wonder Woods). The long-term direction is elementary school through roughly grade 5 / age eleven; the 6–8 pilot has begun. Extend familiar game families alongside new themed zones and projects. One short adventure, the Windy Picnic, exists as a pilot. A pet treehouse, a discovery journal, more stories, and elementary zones are future directions; do not assume they or older age bands already exist.

Each activity should have a fun action and a clear learning purpose: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Add variety through different decisions, movement, creativity, listening, and pretend play. Extend an existing game when the meaningful action is the same; create a new game when the learning or interaction warrants it. Games can start at an older band without an artificial toddler mode.

A separate grown-up **couch play** route (controller or keyboard on a computer, its own save) lets two adults play trips of six games; its how-to screens, unlocks and face-off scoring belong only there. Follow the user's requested scope and the roadmap. Build complete, playable slices; introduce shared infrastructure when an implemented activity needs it. Keep standalone play available as future stories connect games.

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
5. **Build a coherent ladder.** Define ordered plans and `{ min, max }` ranges for each supported band (a `BandLevels` table read with `rangeFor`, listing only the bands the game supports), with a useful `describeLevel` for grown-ups. Register in `src/games/registry.ts` and add voice lines. Registry tests check IDs, titles, bands, descriptions, and subject/place coverage.
6. **Integrate with the island.** Check the icon, title, layout, place scrolling, return route, portrait/landscape, and pet clearance. More games must not mean smaller targets. Preserve stable IDs so saves and stickers survive catalog reorganization.
7. **Verify and document.** Verify at the lightest tier in [Verification budget](#verification-budget) that proves the change, then update the README inventory row and the roadmap checkbox, add a short verification entry, and add the game's how-to card in `src/content/howto.ts` (a test fails without one). Mark gaps explicitly; a registered game or passing build alone does not establish finished play.

Two smooth rounds (at most one miss, no hints) at the current level step up; two struggling rounds (at least four misses or two hints each) step down. `src/progress/difficulty.ts` clamps changes to the played band's range. Grown-ups can pin levels through `store.pin`. Miss/hint accounting affects adaptation, so define it deliberately; assisted completion is not evidence of independent mastery.

## Integration and persistence

| Area | Contract to preserve |
| --- | --- |
| App and scenes | `src/app/App.ts` owns Pixi, transitions, logical view, and the frame loop. `Scene` layers are `content` → `particles` → `ui`; `track(obj)` runs its update. `GameScene` owns the guide, home, co-play tip, saving, difficulty, stickers, and celebration. Once a scene is destroyed its tweens and the promises from `ctx.say`/`ctx.instruct` never resolve, so awaited chains stop there; timers and other callbacks a game starts itself still need guards. |
| Age trail | `src/content/places.ts` defines Puddle Lagoon, Daisy Meadow, Bumpy Hills, Starry Peak, and Wonder Woods (`school`), climbing in band order. Every place is open. `profile.band` sets the home place; advancing beyond saved `world.band` triggers the birthday walk once. |
| Routes | `go.hub()` opens the map; `go.place(band)` opens a place; `go.game(id, band?)` plays its levels, defaulting to the profile band. Home returns to the launching place; start goes to the child's home place. `go.picnic(step?)` opens the Windy Picnic; `go.game(id, band, { step, level })` plays a round as a picnic step at the story's level, leaves the game's adaptive level alone, completes the step on finishing (idempotently) and returns to the picnic. |
| Catalog layout | `GameModule.region` and `src/content/world.ts` `REGION_IDS` are subject IDs, not separate map destinations. `PlaceScene` is the default swipeable two-row path. The grown-up `settings.placeLayout` can select `SubjectPlaceScene`, with four subject/game cards per page. Both retain session position per band, touch-down feedback and swipe cancellation. Keep both layouts reachable for the iPad comparison. Both show a `Sparkle` on games with no finished round (`store.isNew`) and her hearted games (`save.favorites`, rules in `src/content/shelf.ts`): a `Shelf` of up to five in the path layout, a first Favorites card in the subject layout. The heart is set after a round, beside the sticker in `GameScene`; none of it gates, expires or rotates. |
| Logical layout | `src/engine/view.ts` fits a 1024×768 design area and expands the spare dimension. Use `view.w`/`view.h` in `resize()`. Keep the bottom-left pet clear, e.g. `spread(n, 150, view.w - 40, gap)`. Home/island is top-left, the place's book button top-right; the map's two top corners form the parent gate. |
| Save data | `src/progress/save.ts` defines version 2 data and `migrate()`; `src/progress/store.ts` persists through IndexedDB. Add defaults, repair behavior, and migration tests for new fields. Preserve old progress, level pins, and backup/restore. The retired `world.opened` list is not an unlock system. `favorites` is a bounded, oldest-first list of hearted game IDs (repaired by `cleanFavorites`; unknown IDs just never show). `stories.picnic` holds the picnic's done steps (known IDs only), whether this telling ended, and its keepsake. |
| Pet and stickers | `src/art/pet.ts` builds the saved companion; voice lines support `{pet}`. Sticker placement is optional `{ page, x, y }` with normalized coordinates. Returning a sticker to the tray removes placement, never ownership. |
| Pet treehouse | `RoomScene` (button on the map) with rules in `src/content/room.ts` and the saved `room` field (what she made hangs on the wall too: `RoundResult.creation` hands a picture or a free song to the shell, which offers a keep button; `src/content/creations.ts` and the saved `creations` field hold one on show and one earlier per kind, bounded and repaired on load; the discovery journal is `JournalScene` with `src/content/journal.ts` and the saved `journal` field, filled by `RoundResult.discoveries` from what a game actually showed, each entry with one known game and a spoken line a test checks against the game's data): always one of each of six `ROOM_ITEMS`, positions as fractions of the room clamped to the floor, and a frame that only references a sticker (`{ game, seed }`), never consumes it. Nothing there accrues, wears out or waits; keep it that way. A new furnishing or creation needs a `migrate()` default and test. |
| Grown-up how-to (touch) | `src/content/howto.ts` holds one card per game ID (goal, steps, how the round ends, an optional note); a test fails if a game has none. `GameScene` opens it from a quiet hold-to-open `?` under the home button (`src/ui/howto-card.ts`), adds the level's `describeLevel` line, and holds the round still while it is open. Reading it is not a hint and changes no progress. Couch how-tos live in `src/couch/catalog.ts` instead. |
| Couch play | `src/app/scenes/CouchScene.ts` hosts it as a DOM overlay; `src/couch/` holds `catalog.ts` (per game: spoken goal, control rows, face-off kind and scoring, demo level, level per stop, couch wording for touch lines), `party.ts` (pure rules: save v3 in `neo.couch.v1`, unlock tiers derived from completed trips, offers, two-turn face-off settlement, the once-only keepsake), `finale.ts`/`finale-stage.ts` (the trip's ending), `courses.ts`/`course.ts` (challenge courses: a registry, and generic pure rules for runs, per-player records and badges; the parts themselves are frozen data in `games/<game>/course.ts`, and a changed part needs a new course version), `demo.ts`, `controller-art.ts`, `focus.ts`; `style.css` lengths are all `calc(N px * var(--u))` so couch pages scale with the window. Optional contract additions: `Game.control`, `Game.autoplay`, `RoundResult.score/scores`, `GameContext.couch` (`versus`, or a `course` with a resume point and a `progress` callback); touch play never depends on them. Unlocks and scores exist only here, never in the child's save or island. A couch game needs seeded boards (`ctx.rng`) to be fair in a twin or shared face-off (a game with boards fixed per level can only be a team stop); add it to `COUCH_IDS`, `UNLOCK_TIERS` and the catalog, and its bot must finish a round through `control()`, with the game exposing a public `finished` flag, which `BROWSER_SUITE=couchgames` waits on. A game's how-to is reachable from its name card, the face-off turn card, the pause menu and the couch menu's guide, all through `CouchScene.intro`. |

Games must release their own drag handles, global listeners, timers, and render textures in `destroy()`. Stop or guard callbacks that could touch destroyed objects; untrack objects removed before the scene ends. Use scene-owned timing and update helpers rather than unmanaged loops.

The Windy Picnic advances on round completion; `{ misses, hints }` carries only round statistics, so a story that carries a chosen object, amount, or tune needs the typed result extension specified (unimplemented) in [docs/DESIGN.md](docs/DESIGN.md#proposed-story-results). Save story steps so resuming cannot award twice, and never award stickers from the story layer. New rooms, journals, and creations need bounded storage and migration/backup checks. An older selectable band requires auditing band mappings, levels, places, routes, parent controls, voice, birthdays, and old saves together.

The elementary plan separates future zone identity from learning range; current places still map one-to-one to bands. Introduce that separation with the first thematic zone and preserve existing return routes. Extend coherent game ladders without silently renumbering saved levels or pins; introduce separate mode progress only when branches need it. Older learning should not remove younger favorites or turn grades into access gates.

## Reuse before adding new helpers

| Need | Existing starting points |
| --- | --- |
| Characters, clothing, props | In `src/art/`: `critter.ts` (`CRITTERS`, `attach()`, moods including `sad`/`calm`, `currentMood`), `pet.ts`, `props.ts`, `shapes.ts`, `scenery.ts`, `particles.ts`, `sticker.ts` |
| Input, motion, physics | In `src/engine/`: `input.ts`, `drag.ts`, `tween.ts`, `random.ts`, `view.ts`; `ball.ts` supplies ball/peg/wall simulation, and its `simulate()` also drives physics rule tests (reachable targets, nothing trapped, flight times). Inspect current code and tests before reusing work in progress. |
| Music and speech | In `src/audio/`: `engine.ts` unlocks on first touch; `sfx.ts` includes synthesized animal voices; `music.beats()` supports beat-synced play; `voice.ts` speaks line IDs with device speech. Parent recordings remain a proposal. |
| Steering and aiming | Duckling Parade / Roundup for continuous steering; Bouncy Launch for a pull measured from pointer movement rather than an object snapped to the fingertip |
| Controller play | `src/engine/controller.ts` (semantic input for two players); `src/couch/focus.ts` (move a focus ring over scattered spots, with a route finder for bots); Memory Match for a grid ring and alternating turns; Light Lab and Secret Code for a ring plus confirm; Peg Garden for sweeping an aim; Bouncy Launch for holding a power; Bumper Garden for one flipper per player |
| Tracing, pictures, and reasoning | Letter Trails for zero-lift drags and ordered strokes; Puzzle Pals for code-drawn textures; Memory Match for known-partner mistakes; Robot Path for solvable programs; Sink or Float for unpenalized predictions; Block Tower for a stated balance rule with exact (eighth-unit) positions; Lasso Loops for drawn loops with custom pointer handling |

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

### Verification budget

Building playable things is the point; checks serve it. Earlier sessions spent most of their budget re-running browser suites on code they had not touched. Spend checks where they find real bugs, at the lightest tier that proves the change, and stop there.

| What changed | Run |
| --- | --- |
| Docs only | Link and `git diff --check`. No code checks. |
| Game rules, level plans or puzzle generation (`logic.ts`) | `npm run typecheck` and that game's rule tests. Nothing else. |
| New levels on an existing interaction | The above, plus one browser play of the new top level only. |
| New game or a new interaction | Typecheck, unit tests, then **one** scripted play of the new game through a filter (first and last level, one wrong answer, one hint) and one portrait screenshot. Run `npm run build` only if shared files or assets changed. |
| Shell, engine, save or navigation | Typecheck, unit tests, build, the one or two suites of the games that lean on the change most, `world` if navigation changed, offline only if persistence, assets or navigation changed. |
| Couch catalog or controls | `BROWSER_SUITE=couchgames` filtered to the new or changed games. The full `couch` and `couchcourse` suites only when trip, face-off, finale or course code changed. |
| Release candidate, before a push to `main` | Typecheck, unit tests, build, then `world`, `picnic`, `couch` and the offline check. The hour-long combined flow only when the grown-up asks for it. |

How to keep it light:

- **Unit tests are the main proof.** Put rules in `logic.ts` and test each property you would otherwise check by playing: solvable, fair, valid targets, a hint that leads somewhere. Do not drive the browser to learn something a test can assert.
- **Do not repeat what is already recorded.** If [docs/VERIFICATION.md](docs/VERIFICATION.md) records a suite passing and the area has not changed since, it counts. Never re-run a passing suite after a comment, docs or test-only edit, or "to be sure".
- **One suite at a time, always with a filter.** Never start `npm run test:browser` with no `BROWSER_SUITE`. Take one or two screenshots per new screen, not a gallery.
- **Do not loop on a failing check.** Probe once with a small script. If the failure also happens on unchanged code, or looks like timing (Peg Garden's touch suite), record it as a known flake and move on.
- **Cap it.** A feature's browser checking should stay within about ten minutes of wall time and a small fraction of the session. If it would run longer, write the remaining check down as "not run" and go on building.
- **Snapshots for slow suites.** The couch suites take five to eight minutes; run them on a copy of the tree on another port so edits continue (see the `rsync` note in the README).
- **Say what was skipped.** "Not run" is an acceptable entry. Hardware, an iPad, a real controller and a child's reaction are never established by Chrome automation.

Recheck production offline behavior only after asset, navigation or persistence changes, and then only the production offline check.

Couch changes: `BROWSER_SUITE=couch` plays a full trip and a face-off trip (about eight minutes); `BROWSER_SUITE=couchcourse` plays the challenge courses (about seven); `BROWSER_SUITE=couchgames` opens every couch game's how-to screen and plays a bot round in each (about five), which is the check to run when the couch catalog changes. Browser setup, suite names, and filters live in [README.md](README.md#browser-checks) and `scripts/browser-check.mjs`; add cases there for new games instead of maintaining a second suite inventory here. `BROWSER_SUITE=<suite> npm run test:browser` selects one suite. Browser scripts use isolated contexts; never clear a real player's save. Documentation-only edits need link/consistency and diff checks, not a game test run.

When a browser check fails, probe with a small logging script before changing the test: many failures here were real bugs, such as a hint glow swallowing touches, a destroyed drawing freezing a show, and overlapping tap targets. Prove a fix by briefly restoring the old rule and watching the check fail. Put one-off Playwright probes in `test-results/` so `import 'playwright'` resolves. Vite listens on IPv6 `localhost`, so use `GAME_URL=http://localhost:5173`. Before an offline run, confirm the preview serves the current build by comparing the `assets/index-*.js` name in the served page with `dist/index.html`.

Record only checks actually performed. Chrome automation does not establish physical iPad touch feel, offline device speech, first-touch audio, orientation, Guided Access, or Add to Home Screen behavior.

### Scripted play

Dev-only `neo` exposes the app (`neo.scene`, `neo.view`, `neo.go.game(id, band)`); `kit` in `src/dev/testkit.ts` provides `tap`, `tapOn`, `drag`, `dragTo`, `line`, `until`, `sleep`, and `store`. Start with a center tap and wait about three seconds for the transition before navigating. Set the test profile band and `kit.store.stats(id).level`, then drive the game and inspect `neo.scene.game`.

Use scripted input for moving targets, then screenshots for visual review. Finish edits before a play-through: HMR can reload and kill a running script. To keep editing during the hour-long combined flow, serve a detached `git worktree` of HEAD on another port (with its own Vite `cacheDir`) and point `GAME_URL` at it. Re-check `neo.scene` after reloads. To clear an isolated profile's test data only, use `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

### Input and rendering pitfalls

- Couch scenes sample controller and key input once per frame and ignore input for their first 0.35 s. Hold scripted keys at least ~120 ms (`page.keyboard.press(key, { delay: 120 })`) and wait out a new scene before pressing.
- Dispatch synthetic `pointerup` on the canvas (the kit does); using `document` leaves Pixi thinking the finger is down. Handle `pointercancel` and lost release in custom controls.
- Object drags ride 40 logical units above the finger; aim drops about 40 units below the target. Tracing can use `lift: 0`.
- Hit areas and `onTap` radii use local object units. A critter at 0.3 scale with radius 80 only has a 24-unit screen radius, centered on its feet. Give it a body-centered area such as `new Circle(0, -120, 85 / scale)`.
- Visible drawings can intercept hits even without listeners. Put full-screen input layers last, give them a `hitArea` only when they should catch taps, and set `eventMode = 'none'` on decorations over controls (bushes, flashes).
- A zero-scale container has no inverse transform; guard `toLocal` calls against NaN.
- Hit-testing uses the transforms from the last rendered frame. After a script moves or creates an object, wait a frame before tapping it (a round that has just become ready may not be drawn yet).
- When tap or drop targets sit close together, resolve the touch to the nearest target rather than whichever is drawn on top (Bubble Pop's overlapping bubbles, Teddy Doctor's boo-boos and body parts).
- Keep long-lived drawings (overlays, a bridge, a glow) out of containers a game clears between scenes, or they are destroyed while the frame loop still draws them.
- `Graphics.arc()` joins to the previous point: `moveTo` its start first. Use `puffs()` instead of stroking overlapping circles with visible inner outlines.
- Render parentless containers into textures: `renderer.render({ container, target, clear: false })`; erase with `blendMode = 'erase'`. Free game-owned textures when leaving.

## Documentation and Git

Keep this file provider-neutral and focused on durable contributor guidance. Game descriptions, historical expansions, counts, and detailed test results belong in the linked docs. When implementing roadmap work, update the README inventory row and the ROADMAP checkbox, and add a VERIFICATION entry of about six lines (what changed, which checks ran, what is unchecked). Touch the DESIGN doc only when architecture, a contract or behavior changed, and keep counts in the README and the ROADMAP's current position only. Update this file when a shared contract or workflow changes. Label new ideas as proposals and preserve remaining checks as unfinished.

Report briefly to the grown-up after each finished game or feature: what it does and which checks ran. Commit or push only when asked. The live site is [Puddle Island](https://rjdunlap.github.io/neo/); every push to `main` deploys through `.github/workflows/deploy.yml`. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repository).
