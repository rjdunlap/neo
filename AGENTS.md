# Puddle Island (project Neo)

Shared guidance for human contributors and coding assistants. Paths are relative to the repository root.

## Project direction

Puddle Island is an iPad learning game for the developer's daughter (about one year old in October 2026): many small, satisfying games on a familiar island, after JumpStart, Neopets and classic arcades. Bands are `lap`, `toddler`, `preschool`, `prek` and `school` (about 6–8, at Wonder Woods); the long-term direction reaches about age eleven. Built today: the games, a pet with its treehouse (saved creations, a discovery journal), one story (the Windy Picnic), and a separate grown-up **couch play** route. The [roadmap](docs/ROADMAP.md) holds the direction and what is only proposed; do not assume a proposed zone, story or band exists.

Each activity needs a fun action and a clear learning purpose: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Extend an existing game when the meaningful action is the same; make a new one when the learning or interaction warrants it, at whatever band fits. Follow the requested scope and the roadmap; build complete, playable slices, and add shared infrastructure only when an implemented activity needs it.

## Where things are written down

| Document / source | Role |
| --- | --- |
| [README.md](README.md) | Setup, the game inventory and count, browser suites |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Direction, current position, next up (chunks with a status, a next slice and a check tier), decisions waiting on the developer, checks that need a person or device, elementary horizons, planning rules |
| [docs/DESIGN.md](docs/DESIGN.md) | Current architecture, systems and contracts |
| [docs/GAMES.md](docs/GAMES.md) | What each game does: rules, misses, hints, level steps |
| [docs/IDEAS.md](docs/IDEAS.md) | The idea notebook: candidates, modes for existing games, gestures, references, overlaps. Not a mandate |
| [docs/COUCH-PLAY.md](docs/COUCH-PLAY.md) | Player guide for couch play: pairing controllers, rules, controls |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | Checks actually performed, with a coverage summary of each suite's last pass |
| `docs/archive/` | History, not instructions: superseded proposals, the old roadmap, finished roadmap items and idea rows, older verification entries |
| `src/games/registry.ts`, `src/games/types.ts` | Current registrations and the minigame contract |

Check the working tree before editing. Local implementations, recorded verification and deployed features are distinct states; `origin/main` is what is deployed. Preserve unrelated work in progress.

## Rules for every activity

- **Generated art and sound.** Draw with Pixi `Graphics`; use `src/art/palette.ts` colors. No imported sprite or audio files. Rendering code-drawn art into a `RenderTexture`, as Puzzle Pals does, is supported. Synthesize sound with Web Audio; pitched sounds use pentatonic steps from `src/audio/notes.ts`. A game where she makes the music sets `music: silenced(STYLES.x)` (or `STYLES.quiet`) so the island's loop does not compete, and a registry test lists those games; keep a style playing rather than calling `music.stop()`, since playheads read its clock.
- **Large, forgiving controls.** Targets are at least 100 logical units on screen, including after scaling. Give immediate touch-down feedback. Taps use `onTap` from `src/engine/input.ts`; object drags use `src/engine/drag.ts`. Continuous steering, slingshots, drawn loops and deliberate multi-touch may need custom pointer handling; retain palm rejection and handle cancellation, leaving the screen, and cleanup.
- **Spoken support.** Instructions and feedback belong in `src/content/voice-script.ts`. Use `ctx.instruct` for the instruction the pet repeats and `ctx.say` for other speech. If the game uses a large pet instead of the corner guide, it must repeat the instruction. Navigation never requires reading. Literacy activities may practice reading with replayable spoken support; check actual device speech before claiming a phonics skill.
- **Mistakes teach; exploration stays welcome.** A wrong answer gets a gentle boing and spoken hint, with a glow after two misses. Keep retries and supported completion available. Do not count free creative choices, unseen-card exploration, or experimental predictions as wrong answers. Older puzzles can require revision, with undo or replay and an explanation of what happened.
- **Predictable rewards and comfortable stopping.** One sticker per completed round, including with help. No lives, game-over screens, ads, purchases, streaks, round-ending timers, or guilt. The app has no timer or bedtime scene: play limits belong to the device (Screen Time app limits, Guided Access), and the grown-ups' page says so. The pet, treehouse and journal never create neglect, lost possessions, or obligations while away.
- **Depth before pressure.** Grow levels through new modes and meaningful choices before adding speed, clutter, or memory load. Keep younger modes simple. Include co-play and an off-screen activity where useful; grown-up UI stays plain HTML in `src/parent/panel.ts`.

## Adding or extending a minigame

1. **Define a small complete experience.** State the fun action, learning goal, supported bands, first round, deeper modes, completion condition, and response to mistakes. For creative play, define a gentle way to finish without imposing one correct creation. Check [GAMES.md](docs/GAMES.md) and the [idea notebook](docs/IDEAS.md) for overlap.
2. **Keep rules inspectable.** Put level plans, puzzle generation, and answer/solution rules in the game's `logic.ts` where practical. Use the supplied seeded RNG for puzzle generation. Test meaningful properties such as solvability, valid targets, fair quantities, acceptable alternative solutions, and hints that lead somewhere useful.
3. **Implement the contract.** Export a `GameModule` from `src/games/<id>/index.ts`: stable ID, grown-up name, spoken title, subject (`region`), skills, supported bands, level ranges/descriptions, music, hub icon, seeded sticker art, and `create(ctx)`. Supply co-play/off-screen suggestions where appropriate. Implement `start`, `update`, `resize`, and `destroy`.
4. **Use the shell.** Draw into `ctx.stage`; reuse `ctx.rng`, `ctx.tw`, `ctx.particles`, `ctx.track`/`untrack`, and voice helpers. Use `ctx.petSpec` for the customized companion and `ctx.childName` where appropriate. Finish through `ctx.finish({ misses, hints })`; the game does not award stickers, save round history, or create its own home/celebration UI.
5. **Build a coherent ladder.** Define ordered plans and `{ min, max }` ranges for each supported band (a `BandLevels` table read with `rangeFor`, listing only the bands the game supports), with a useful `describeLevel` for grown-ups. Register in `src/games/registry.ts` and add voice lines. Registry tests check IDs, titles, bands, descriptions, and subject/place coverage.
6. **Integrate with the island.** Check the icon, title, layout, place scrolling, return route, portrait/landscape, and pet clearance. More games must not mean smaller targets. Preserve stable IDs so saves and stickers survive catalog reorganization.
7. **Verify and document.** Verify at the lightest tier in [Verification budget](#verification-budget) that proves the change. Add the game's how-to card in `src/content/howto.ts`, with its steps scoped to the levels they hold at (a test fails without a card, or with level-relative wording; a ghost-finger `autotouch()` for its demonstration window is a welcome extra, see [DESIGN.md](docs/DESIGN.md#application-and-scenes) and the roadmap's count), its README inventory row, its [GAMES.md](docs/GAMES.md) entry, the roadmap update, and a short verification entry. Mark gaps explicitly; a registered game or passing build alone does not establish finished play.

Two smooth rounds (at most one miss, no hints) at the current level step up; two struggling rounds (at least four misses or two hints each) step down. `src/progress/difficulty.ts` clamps changes to the played band's range. Grown-ups can pin levels through `store.pin`. Miss/hint accounting affects adaptation, so define it deliberately; assisted completion is not evidence of independent mastery.

## Integration and persistence

Details of each system are in [DESIGN.md](docs/DESIGN.md); these are the contracts to preserve.

| Area | Contract to preserve |
| --- | --- |
| App and scenes | `src/app/App.ts` owns Pixi, transitions, logical view, and the frame loop. `Scene` layers are `content` → `particles` → `ui`; `track(obj)` runs its update. `GameScene` owns the guide, home, co-play tip, how-to card and intro, saving, difficulty, stickers, hearts and celebration. Once a scene is destroyed its tweens and the promises from `ctx.say`/`ctx.instruct` never resolve, so awaited chains stop there. A continuation whose promise had already resolved in that same frame still runs once; `App` removes the old scene at once, and `Scene.destroy()` releases its display tree a task later so that continuation can finish safely. Demonstrations follow the same rule. Timers and other callbacks a game starts itself still need guards. Esc on an island scene holds it still behind the pause sheet (`App.paused`, `escapeAction` in `src/app/pause.ts`, `Scene.canPause`; the chooser, hatching and couch play opt out, couch play keeping its own Esc); the sheet and the grown-ups' page are plain HTML over the canvas. |
| Age trail | `src/content/places.ts` defines Puddle Lagoon, Daisy Meadow, Bumpy Hills, Starry Peak and Wonder Woods, climbing in band order; places map one to one to bands and every place is open. `profile.band` sets the home place; advancing beyond saved `world.band` triggers the birthday walk once. |
| Routes | `go.start()` (the "Who's playing?" chooser, the front door), `go.couch()`, `go.hatch(quick?)`, `go.hub()`, `go.place(band)`, `go.game(id, band?)` (defaults to the profile band), `go.picnic(step?)`, `go.journal()`. A different player becomes active only through `selectPlayer` (`src/app/players.ts`), which clears what scenes remember per band. The input that picks a card on the chooser picks the mode: a tap opens the island, Enter or a controller button opens couch play with that person as Player 1 (`src/app/chooser.ts`). Home returns to the launching place. `go.game(id, band, { step, level })` plays a picnic step at the story's level without moving the game's adaptive level, completes the step idempotently and returns to the picnic. |
| Catalog layout | `GameModule.region` (`REGION_IDS` in `src/content/world.ts`) is a subject, not a map destination. `PlaceScene` (default) and `SubjectPlaceScene` (`settings.placeLayout`) both stay reachable for the iPad comparison, keep session position per band, and show the new-game `Sparkle` and hearted favorites (`src/content/shelf.ts`). Nothing there gates, expires or rotates. |
| Logical layout | `src/engine/view.ts` fits a 1024×768 design area and expands the spare dimension. Use `view.w`/`view.h` in `resize()`. Keep the bottom-left pet clear, e.g. `spread(n, 150, view.w - 40, gap)`. Home/island is top-left, the place's book button top-right; the grown-ups' gear (`src/ui/grownups.ts`, plain HTML, held two seconds) is top-right on the chooser and the map (the map's top-left button is "Who's playing?"). On a phone `App` places the root inside the safe-area insets (`--safe-*` properties, read from `#safe-area`) and computes the view inside them, so `view` is the usable rectangle: lay out from `view`, never from `window.innerWidth` or `innerHeight`, and use `--safe-*` for any new DOM overlay at the window's edge. A touch screen held upright and taller than 1.6 times its width (`needsTurn`) gets the `TurnPrompt` over a paused scene; a plain-HTML scene that suits it sets `upright`. |
| Save data | `src/progress/save.ts` defines version 2 data and `migrate()`; `src/progress/store.ts` persists through IndexedDB. Every field (including `favorites`, `stories.picnic`, `room`, `creations` and `journal`) is bounded and repaired on load. Add defaults, repair behavior and migration tests for new fields; preserve old progress, level pins, and backup/restore. The retired `world.opened` list is not an unlock system. `settings.sessionMinutes` is retired and always 0, kept only so an older cached build never starts a timer. `store.data` is the **active profile's** save: `neo.profiles` (`src/progress/profiles.ts`) indexes who has one, the first profile's save stays `neo.save`, others are `neo.save.<id>`, and a person's birth month and year or chosen start band live in the index entry, never in `SaveData` (an older build re-saving `neo.save` would strip them; see [DESIGN.md](docs/DESIGN.md#persistence-and-grown-up-ui)). One undo snapshot per profile (`neo.save.previous` for the first, `PreviousSave`) is set aside before a reset or restore; it is repaired by `migrate` on read and is not part of a backup. |
| Pet, stickers and treehouse | `src/art/pet.ts` builds the saved companion; voice lines support `{pet}`. Sticker placement is optional normalized `{ page, x, y }`; returning a sticker to the tray removes placement, never ownership. In the treehouse (`RoomScene`, `JournalScene`; `src/content/room.ts`, `creations.ts`, `journal.ts`) the frame only references a sticker, a `RoundResult.creation` is kept only on request, and `RoundResult.discoveries` files only what a round actually showed. Nothing accrues, wears out or waits. |
| Grown-up how-to (touch) | `src/content/howto.ts` holds one card per game ID; a test fails if a game has none. A card is written per level: the goal is whole-ladder, and each step, finish and note is a plain string (true at every level) or a `LevelLine` (`{ from, to, text }`, inclusive) that holds only at the levels it names; `howToFor(mod, level)` resolves them, so the card says only what the level on it asks and a test fails on "later levels" wording. `GameScene` shows it by itself every time a game opens (a full-screen intro: the round is not built until Play; `settings.howToCards` is the grown-up's switch, `shouldExplain()` the rule), and during a round from the hold-to-open `?`. A game with a bot also plays a demonstration in a window on the card, showing the input the person uses (`islandDemo()` in `src/content/demos.ts`): a **ghost finger** (a mouse pointer on a desktop) for a game that sets `touchDemo` and implements `Game.autotouch()`, at her current level, via `Demo` and `GhostFinger` (`src/engine/ghost.ts`); a couch game with no touch bot would show the couch's controller demo (`demoFor()`) as a stopgap (none now); the rest are text alone. The card runs, places and destroys it, and it takes no touches. A story request, "again" straight after a round (`go.game`'s fourth argument), a game with no card and the grown-up switch skip the intro. On the intro, a pair of held arrows beside "this level" (a short hold, so a small hand's tap does nothing; within her band's levels, like the grown-up zone's picker) chooses the level the round is built at, and the text, steps and demonstration follow; looking or leaving changes nothing, and finishing that round moves her saved level there (a grown-up's pin stays put). The "?" card in a round shows its level without arrows. Reading it is not a hint and changes no progress. A scripted check that opens a game directly must turn `settings.howToCards` off (the browser harness does in `ready()`) or press Play. Couch how-tos live in `src/couch/catalog.ts` instead. |
| Couch play | `CouchScene` (a DOM overlay) and `src/couch/` own couch play and its separate save (`neo.couch.v1`); unlocks and scores never reach the child's save. Its contract additions (`Game.control`, `Game.autoplay`, `RoundResult.score/scores`, `GameContext.couch`) never affect touch play. A couch game needs seeded boards for a fair face-off, entries in `COUCH_IDS`, `UNLOCK_TIERS` and the catalog, and a bot that finishes a round through `control()` with a public `finished` flag; a changed course part needs a new course version. A game made only for grown-ups goes in `GROWNUP_GAMES` (`src/games/registry.ts`), never in `GAMES`, so the child's island cannot list or open it, and couch code looks games up with `couchGameById`; help she asks for rather than help that follows misses is `Game.askForHint` with a `hint` label in `COUCH_INFO`, shown in the pause menu. Couch lengths are `calc(N px * var(--u))`. Name controls with `prompts(parts, place)` (`src/couch/controller-art.ts`) so a laptop shows key caps; where she plays, couch volume and text size are the couch save's `settings` (`src/couch/settings.ts`). See [Extending couch play](docs/DESIGN.md#extending-couch-play). |

Games must release their own drag handles, global listeners, timers, and render textures in `destroy()`. Stop or guard callbacks that could touch destroyed objects; untrack objects removed before the scene ends. Use scene-owned timing and update helpers rather than unmanaged loops.

Stories: a story that carries a chosen object, amount or tune needs the typed result specified (unimplemented) in [DESIGN.md](docs/DESIGN.md#proposed-story-results); save steps so resuming cannot award twice, and never award stickers from the story layer. Zones and bands: separate zone identity from learning band, preserve return routes, never turn grades into access gates, and audit band mappings, levels, places, routes, parent controls, voice, birthdays and old saves together before adding a band. Never silently renumber saved levels or pins.

## Reuse before adding new helpers

| Need | Existing starting points |
| --- | --- |
| Characters, clothing, props | In `src/art/`: `critter.ts` (`CRITTERS`, `attach()`, moods including `sad`/`calm`, `currentMood`), `pet.ts`, `props.ts`, `shapes.ts`, `scenery.ts`, `particles.ts`, `sticker.ts` |
| Input, motion, physics | In `src/engine/`: `input.ts`, `drag.ts`, `tween.ts`, `random.ts`, `view.ts`; `ball.ts` supplies ball/peg/wall simulation, and its `simulate()` also drives physics rule tests (reachable targets, nothing trapped, flight times). Inspect current code and tests before reusing work in progress. |
| Music and speech | In `src/audio/`: `engine.ts` unlocks on first touch; `sfx.ts` includes synthesized animal voices; `music.beats()` supports beat-synced play; `voice.ts` speaks line IDs with device speech. Parent recordings remain a proposal. |
| Steering and aiming | Duckling Parade / Roundup for continuous steering; Bouncy Launch for a pull measured from pointer movement rather than an object snapped to the fingertip |
| Controller play | `src/engine/controller.ts` (semantic input for two players); `src/couch/focus.ts` (move a focus ring over scattered spots, with a route finder for bots); Memory Match for a grid ring and alternating turns; Light Lab and Secret Code for a ring plus confirm; Peg Garden for sweeping an aim; Bouncy Launch for holding a power; Bumper Garden for one flipper per player |
| Tracing, pictures, and reasoning | Letter Trails for zero-lift drags and ordered strokes; Puzzle Pals for code-drawn textures; Memory Match for known-partner mistakes; Robot Path for solvable programs; Sink or Float for unpenalized predictions; Block Tower for a stated balance rule with exact (eighth-unit) positions; Lasso Loops for drawn loops with custom pointer handling; Chain Reaction for sockets and deterministic replay |
| Keeping what she made | `src/content/creations.ts` (bounded picture and tune slots), `src/content/journal.ts` (known entries with spoken lines a test checks against the game's data) |

Choose examples by the mechanic being built. Do not copy a game's assumptions about age, scoring, geometry, or cleanup without checking them.

## Verification workflow

TypeScript + Vite + PixiJS 8, installed as an offline PWA. Run from the repository root:

```bash
npm run dev                 # development server, port 5173
npm run typecheck
npm test
npm run build
npm run test:browser         # with the dev server running; always with BROWSER_SUITE
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
| Shell, engine, save or navigation | Typecheck, unit tests, build, the one or two suites of the games that lean on the change most, `world` if navigation changed, and the production offline check only if persistence, assets or navigation changed. |
| Couch catalog or controls | `BROWSER_SUITE=couchgames` filtered to the new or changed games. The full `couch` and `couchcourse` suites only when trip, face-off, finale or course code changed. |
| Release candidate, before a push to `main` | Typecheck, unit tests, build, then `world`, `picnic`, `couch` and the offline check. The hour-long combined flow only when the grown-up asks for it. |

How to keep it light:

- **Unit tests are the main proof.** Put rules in `logic.ts` and test each property you would otherwise check by playing: solvable, fair, valid targets, a hint that leads somewhere. Do not drive the browser to learn something a test can assert.
- **Do not repeat what is already recorded.** If the [coverage summary](docs/VERIFICATION.md#coverage-summary) records a suite passing and the area has not changed since, it counts. Never re-run a passing suite after a comment, docs or test-only edit, or "to be sure".
- **One suite at a time, always with a filter.** Never start `npm run test:browser` with no `BROWSER_SUITE`. Take one or two screenshots per new screen, not a gallery.
- **Do not loop on a failing check.** Probe once with a small script. If the failure also happens on unchanged code, or looks like timing (Peg Garden's touch suite), record it as a known flake and move on.
- **Cap it.** A feature's browser checking should stay within about ten minutes of wall time and a small fraction of the session. If it would run longer, write the remaining check down as "not run" and go on building.
- **Snapshots for slow suites.** The couch suites take five to eight minutes; run them on a frozen copy of the tree on another port (`scripts/snapshot-serve.sh`) so edits continue.
- **Say what was skipped.** "Not run" is an acceptable entry. Hardware, an iPad, a real controller and a child's reaction are never established by Chrome automation.

Suite names, filters and durations are in the [README](README.md#browser-checks); add cases for new games to `scripts/browser-check.mjs` and the README table rather than keeping a second inventory here. Browser scripts use isolated contexts; never clear a real player's save.

When a browser check fails, probe with a small logging script before changing the test: many failures here were real bugs, such as a hint glow swallowing touches, a destroyed drawing freezing a show, and overlapping tap targets. Prove a fix by briefly restoring the old rule and watching the check fail. Put one-off Playwright probes in `test-results/` so `import 'playwright'` resolves. Vite listens on IPv6 `localhost`, so use `GAME_URL=http://localhost:5173`. Before an offline run, confirm the preview serves the current build by comparing the `assets/index-*.js` name in the served page with `dist/index.html`.

### Scripted play

Dev-only `neo` exposes the app (`neo.scene`, `neo.view`, `neo.go.game(id, band)`); `kit` in `src/dev/testkit.ts` provides `tap`, `tapOn`, `drag`, `dragTo`, `line`, `until`, `sleep`, and `store`. Start on "Who's playing?" by clicking the first card (`.chooser__play`; the browser harness does it in `pickFirst()`) and wait about three seconds for the transition before navigating. Set the test profile band and `kit.store.stats(id).level`, then drive the game and inspect `neo.scene.game`.

Use scripted input for moving targets, then screenshots for visual review. Finish edits before a play-through: HMR can reload and kill a running script. To keep editing during a long run, serve a detached `git worktree` of HEAD on another port (with its own Vite `cacheDir`) and point `GAME_URL` at it. Re-check `neo.scene` after reloads. To clear an isolated profile's test data only, use `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

### Input and rendering pitfalls

- In couch play the game's stage takes no pointer input, so a touch game's on-screen buttons are dead there: hide them when `ctx.couch` is set and put the action on `control()` or the pause menu (`Game.restart`).
- Couch scenes sample controller and key input once per frame and ignore input for their first 0.35 s. Hold scripted keys at least ~120 ms (`page.keyboard.press(key, { delay: 120 })`) and wait out a new scene before pressing.
- Dispatch synthetic `pointerup` on the canvas (the kit does); using `document` leaves Pixi thinking the finger is down. Handle `pointercancel` and lost release in custom controls.
- Object drags ride 40 logical units above the finger; aim drops about 40 units below the target. Tracing can use `lift: 0`.
- Hit areas and `onTap` radii use local object units. A critter at 0.3 scale with radius 80 only has a 24-unit screen radius, centered on its feet. Give it a body-centered area such as `new Circle(0, -120, 85 / scale)`.
- Visible drawings can intercept hits even without listeners. Put full-screen input layers last, give them a `hitArea` only when they should catch taps, and set `eventMode = 'none'` on decorations over controls (bushes, flashes).
- A zero-scale container has no inverse transform; guard `toLocal` calls against NaN.
- Hit-testing uses the transforms from the last rendered frame. After a script moves or creates an object, wait a frame before tapping it (a round that has just become ready may not be drawn yet).
- When tap or drop targets sit close together, resolve the touch to the nearest target rather than whichever is drawn on top (Bubble Pop's overlapping bubbles, Teddy Doctor's boo-boos and body parts).
- Keep long-lived drawings (overlays, a bridge, a glow) out of containers a game clears between scenes, or they are destroyed while the frame loop still draws them.
- Lay out every touchable object when a round creates it; the `smoke` suite fails if one is stranded at the origin (Animal Snack's first level once was).
- `Graphics.arc()` joins to the previous point: `moveTo` its start first. Use `puffs()` instead of stroking overlapping circles with visible inner outlines.
- Render parentless containers into textures: `renderer.render({ container, target, clear: false })`; erase with `blendMode = 'erase'`. Free game-owned textures when leaving.

## Documentation and Git

### Avoid duplicate parallel work

Before choosing a roadmap slice or making edits:

1. Fetch `origin` with pruning and make sure the new feature branch starts at the latest `origin/main`; fast-forward a clean local `main` first when needed. Never pull blindly into a dirty worktree.
2. Inspect active worktrees, unmerged local and remote branches, and open pull requests for the same roadmap chunk, game IDs or files. Work that is in flight counts even when it has not reached `main` yet.
3. If another branch is already implementing the slice, do not build a second version. Reconcile with that branch, help finish it, or choose the next non-overlapping ready slice unless the grown-up explicitly wants competing approaches.
4. Create a clearly named feature branch before substantial edits, and publish its first coherent commit and pull request promptly so later sessions can see that the slice is claimed.

Fetch and inspect for overlap again immediately before publishing a follow-up commit, and once more before merging or pushing `main`. If `origin/main` moved or overlapping work landed, integrate the current remote version and rerun the proportionate checks before publishing. Never push a local `main` whose view of `origin/main` is stale.

Keep this file provider-neutral and durable; update it when a shared contract or workflow changes. Where an update goes:

- **A game added or changed:** its README row, [GAMES.md](docs/GAMES.md) entry and how-to card.
- **Roadmap work:** edit its line in [ROADMAP.md](docs/ROADMAP.md) (counts live only there and in the README). When an item is finished, move it and its build notes to the newest completed-work file in `docs/archive/` instead of leaving it checked off, and leave a one-line "built" mention only where a reader needs it. Give each open item a status (ready, sketch, define, decision, person), and add a call that only the developer can make to "Waiting on the developer". Move a built idea out of [IDEAS.md](docs/IDEAS.md); label new ideas as proposals.
- **Checks run:** a ~six-line [VERIFICATION.md](docs/VERIFICATION.md) entry (what changed, what ran, what is open) and its coverage-summary row. Checks needing a person or device go in the roadmap and stay open until done.
- **A contract or system behavior changed:** [DESIGN.md](docs/DESIGN.md), and only then.
- **Superseded documents:** move to `docs/archive/` with a line in its index, rather than leaving stale status in a live doc.

Report briefly to the grown-up after each finished game or feature: what it does and which checks ran. When a requested task is complete and verified, commit it on a feature branch and merge that branch into local `main`, unless the grown-up asks to leave it uncommitted or unmerged. After every commit, push the feature branch and create or update its pull request so the commit is published for review; do not create a new pull request for each follow-up commit on the same branch. After merging a verified feature into local `main`, push `main` so it is published and deployed, unless the grown-up explicitly asks not to push. The live site is [Puddle Island](https://rjdunlap.github.io/neo/); every push to `main` deploys through `.github/workflows/deploy.yml`. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repository).
