# Handoff: next session

Written 2026-10-05, late evening, at commit `9648f35` (pushed; GitHub Pages deploys from `main`). Read [AGENTS.md](../AGENTS.md) first, then the [roadmap](ROADMAP.md) and [verification log](VERIFICATION.md). This note covers what changed recently, what is true now, and what to do next. Delete or replace it once its tasks are absorbed into the roadmap.

## What happened in the last two sessions

1. **Deeper ladders for the first games.** Rainbow Fingers went from 2 to 6 levels (coloring pages, remembered colors, mixing paints) and Splish Splash from 5 to 8 (pairs, first-then directions). Suite: `BROWSER_SUITE=early`.
2. **Research into classic games**, collected in [ARCADE-IDEAS.md](ARCADE-IDEAS.md): Neopets, Kongregate, mobile, Atari 2600, arcade cabinets, Game Boy, Xbox Live Arcade, DS/Wii and 90s edutainment.
3. **Four arcade games:** Duckling Parade, Scoop Shop, Roundup and Bouncy Launch. Suite: `BROWSER_SUITE=arcade`.
4. **Ten more games:** Word Monsters, Peg Garden, Fluffy Salon, Sound Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, Bounce Back and Dot Link. Suite: `BROWSER_SUITE=batch`.
5. **Shared engine work:**
   - `engine/ball.ts`: deterministic ball and peg physics, with `simulate()` for previews.
   - A tweener guard: a target destroyed mid-tween no longer freezes the scene.
   - New sounds: `sfx.drum/knock/chirp/croak`.
   - 26 `sound.a`…`sound.z` letter-sound lines.
6. **A parallel session restructured the docs** while this work was underway:
   - The roadmap became an ordered backlog: verify, then navigation, then the Windy Picnic adventure, then a pet treehouse, then a 6–8 pilot.
   - The notebook gained JumpStart/Neopets lessons.
   - [MICROGAME-IDEAS.md](MICROGAME-IDEAS.md) was added.

   Everything is committed together in `9648f35`.

## Current state

- **35 games** in `src/games/registry.ts`, all lap to pre-K except the older originals with narrower bands. Games per place:

  | Place | Games |
  | --- | --- |
  | Puddle Lagoon | 26 |
  | Daisy Meadow | 31 |
  | Bumpy Hills | 34 |
  | Starry Peak | 35 |

- **Unit tests:** 100 tests across 34 files pass (`npm test`), and typecheck and build pass.
- **Browser runs that passed after the latest changes:**
  - `batch`: all 52 levels.
  - `world`: hatching, the trail, swiping, birthdays, the parent gate.
  - `arcade`, which also passed earlier.
  - `npm run test:offline`.
- **Not checked yet:**
  - **The combined `npm run test:browser` flow** since the ten new games: every suite in one run, about 45+ minutes.
  - **A real iPad.**
  - **Listening to the letter sounds.** Device speech can't really make phonics sounds, so "buh", "mmm" and the rest are stand-ins.
  - **Whether the new games are fun and clear.** The roadmap's §1 lists these judgment checks per game.

## Do first: reconcile the docs (small)

The parallel session's doc pass predates the batch finishing, so several statements are now stale.

- **README:** says "the recorded baseline has twenty-five games". The game table needs ten rows for the batch, the suite list needs `batch` (with `BATCH_ONLY=...`), and the "being developed… does not mean it has passed" sentence needs replacing.
- **ROADMAP:** the "Current position" section says the batch is "actively changing" and lists nine games; Dot Link is missing. In §1, tick or reword what the automated runs settled and keep the iPad and fun checks open.
- **ARCADE-IDEAS:**
  - "Current inventory…" and "Batch already in progress" should move the ten into "built".
  - Update the inventory by subject to 35.
  - The notebook calls Dot Link lower priority, but it is built.
  - The current inventory by subject:

  | Subject | Games |
  | --- | --- |
  | Barnyard | Peekaboo Barn, Duckling Parade, Roundup, Egg Catch |
  | Bubble Beach | Bubble Pop, Peg Garden, Bounce Back |
  | Counting Cove | Duck Pond, Monster Munch, Little Helpers |
  | Cozy Village | Feelings Faces, Scoop Shop, Splish Splash, Weather Wardrobe, Mail Carrier |
  | Music Mountain | Jelly Drums, Song Maker, Sound Garden |
  | Puzzle Peaks | Memory Match, Pattern Train, Puzzle Pals, Size Parade |
  | Rainbow Meadow | Color Garden, Shape Sorter, Dot Link |
  | Story Grove | Letter Trails, Story Steps, Word Monsters, Photo Safari |
  | Tinker Lab | Bouncy Launch, Bug Builder, Robot Path, Sink or Float |
  | Treehouse | Rainbow Fingers, Fluffy Salon |

- **DESIGN:** check that the games list and status table name all 35.

## Then, in roadmap order

1. **Finish §1 (verification):**
   - Run the combined browser flow and record it.
   - Add rule tests and play-throughs for the six originals that have none: Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, Color Garden.
   - Keep the iPad items open until someone actually checks on a device.
2. **§2, navigation, is now pressing.** A child at Daisy Meadow swipes past 31 games. The roadmap's plan: subject clusters with a few large choices visible, compared against the current swipe-and-arrow layout on the iPad. Saved game IDs and progress must not change.
3. **§3 Windy Picnic and §4 pet treehouse,** as specified in the roadmap. The roadmap notes the current `{ misses, hints }` round result can't carry an object or a tune into a story; that needs a new result contract.
4. **More games:** the user wants many more. The best-fit candidates are in ARCADE-IDEAS ("Games worth developing next", "Mechanic families") and MICROGAME-IDEAS ("A practical shortlist"). The ball helper makes Bumper Garden, Mini Golf, Pin Roll and Block Topple cheaper now.

## How to work here (lessons from these sessions)

- **Check servers before starting one.**
  - A dev server is often already running on 5173 and a production preview on 4173; check with `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/` before starting another.
  - Confirm the preview is serving the latest build by comparing `assets/index-*.js` between `curl http://127.0.0.1:4173/` and `dist/index.html`.
- **Browser tests need local Chrome.** Playwright's own browser isn't downloaded, so set `BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. Run suites one at a time; one-game filters are `ARCADE_ONLY=parade|scoop|roundup|launch` and `BATCH_ONLY=monsters|pegs|salon|garden|helpers|eggs|mail|safari|bounce|dots`.
- **One-off Playwright scripts go in `test-results/`** (git-ignored and inside the repo), so `import 'playwright'` resolves; the scratchpad can't resolve it.
- **Don't edit `src/` while a browser test runs.** Hot reload restarts the page and kills the run. Docs and `scripts/` are safe to edit.
- **The offline check taps by screen position.** Monster Munch is currently index 13 in Daisy Meadow, two arrow-pages in. Adding games to earlier subjects (Bubble Beach, Music Mountain, Treehouse, Barnyard, or earlier in Counting Cove) moves it; recompute with `gamesFor('toddler')` and update `scripts/offline-check.mjs`.
- **Pixi hit-testing traps** (recorded in AGENTS.md; each cost real debugging time):
  - The stage is interactive, so any drawing on top catches a tap, even an invisible flash or a decorative bush. Set `eventMode = 'none'` on decoration and put full-screen input layers last.
  - `onTap` radii and `hitArea` are in the object's own scaled units: give critters a body-centered `Circle` sized `/ scale`.
- **Tween arcs:** await an x-tween that runs alongside y-tweens before destroying the object.
- **Test what a child would do, not the happy path.** Several real bugs only showed up because the play-throughs drove a real finger: herding animals with a pointer kept behind them, physics-simulated shots, held fingers steering a basket. The bugs:
  - Pens whose fence padding blocked the gate.
  - Accidental misses when passing by.
  - A double lift.
  - A stuck pointer.
  - Taps swallowed by scenery.

  Keep writing play-throughs that way, and check screenshots for layout problems.
- **Another session may be editing.** A parallel session ("Puddle Island game development") edited docs in this same checkout. Before editing docs, check `git status` and file timestamps, and `ListAgents` if available. Build on the files rather than overwriting them.
- **Commits:** commit or push only when asked; pushing deploys. End commit messages with the attribution line the environment provides.

## Definition of done (unchanged)

Run `npm run typecheck`, `npm test`, `npm run build`, the relevant browser suites (wrong answers and hints included), and the offline check after navigation, persistence or asset changes. Record what actually ran in VERIFICATION.md and list what didn't. Update README, DESIGN, ROADMAP and AGENTS when behavior or architecture changes.
