# Puddle Island (project Neo)

Shared guidance for human contributors and coding assistants. Paths are relative to the repository root.

## Project direction

Puddle Island is an iPad learning game for the developer's daughter (about one year old in October 2026): many small, satisfying games on a familiar island, after JumpStart, Neopets and classic arcades. Bands are `lap`, `toddler`, `preschool`, `prek`, `school` (about 6–8, up to 12; Wonder Woods) and `grownup` (13 and up; Lantern Lodge); each band's home spot on the map is an age place; the long-term direction reaches about age eleven. Built today: the games, on a map of themed lands, a pet with its treehouse (saved creations, a discovery journal), two stories (the Windy Picnic and Woodland Picnic), and a separate grown-up **couch play** route. The [roadmap](docs/ROADMAP.md) holds the direction and what is only proposed; do not assume a proposed zone, story or band exists.

Each activity needs a fun action and a clear learning purpose: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Extend an existing game when the meaningful action is the same; make a new one when the learning or interaction warrants it, at whatever band fits. Follow the requested scope and the roadmap; build complete, playable slices, and add shared infrastructure only when an implemented activity needs it.

**Rework direction (the developer, 2026-10-16):** grow into an educational creature world with collecting, customization, permanent unlocks through play, meaningful projects and manageable navigation. [The rework brief](docs/rework/README.md) and [work items](docs/rework/WORK-ITEMS.md) define the staged target; the title and final cast/style are still explorations. Change the app in place, reuse its games and research, and archive only superseded documents as replacements ship. Current implementation contracts below remain descriptions of what exists, not a veto on the rework's approved direction; older blanket no-unlocks and single-companion proposals yield to the brief.

**Development-save exception:** the developer clarified that all of this is development and saves are not an issue. Rework slices may reset or reject old development saves/backups instead of building compatibility or migration layers. This overrides legacy-save preservation requirements for this rework; keep current-format validation, reliable writes, profile isolation, backup/restore and offline checks, and define a clear reset/reseed path at cutover. This planning change resets nothing.

## Where things are written down

| Document / source | Role |
| --- | --- |
| [README.md](README.md) | Setup, the game inventory and count, browser suites |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Direction, current position, next up (how to pick a slice, then chunks with a status, a next slice and a check tier), elementary horizons, planning rules |
| [docs/READY.md](docs/READY.md) | The pick list: **Next ten** in priority order (eligible creature-world explorations first), then **Queued** slices grouped by game, unnumbered; a landed slice's line is deleted at closeout |
| [docs/rework/](docs/rework/README.md) | Creature-world target, incremental structure and dependency-ordered exploration/implementation work items; proposed behavior until delivered |
| [docs/WAITING-ON-DEVELOPER.md](docs/WAITING-ON-DEVELOPER.md), [docs/DEVICE-CHECKS.md](docs/DEVICE-CHECKS.md) | Decisions only the developer can make; checks that need a person or a device (both were roadmap sections until 2026-10-13) |
| [docs/DESIGN.md](docs/DESIGN.md) | Current architecture, systems and contracts |
| [docs/GAMES.md](docs/GAMES.md) | What each game does: rules, misses, hints, level steps |
| [docs/IDEAS.md](docs/IDEAS.md) | The idea notebook: candidates, modes for existing games, gestures, references, overlaps. Not a mandate |
| [docs/COUCH-PLAY.md](docs/COUCH-PLAY.md) | Player guide for couch play: pairing controllers, rules, controls |
| [docs/deep-dives/](docs/deep-dives/README.md) | One session per game: the tracker of which games are researched and planned, the procedure, and each game's researched ladder (`<game-id>.md`) |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | Checks actually performed, with a coverage summary of each suite's last pass |
| `docs/archive/` | History, not instructions: superseded proposals, the old roadmap, finished roadmap items and idea rows, older verification entries |
| `src/games/registry.ts`, `src/games/types.ts` | Current registrations and the minigame contract |

Check the working tree before editing. Local implementations, recorded verification and deployed features are distinct states; `origin/main` is what is deployed. Preserve unrelated work in progress.

## Rules for every activity

- **Generated art and sound.** Use Pixi `Graphics` or prepared sprite/texture assets, with `src/art/palette.ts` as the color guide. **Decided 2026-10-17:** generated/imported sprites and layered creature art are allowed; the assistant owns asset creation and preparation, and the developer is not expected to draw them. Keep accepted source art and reproducible preparation instructions in the repository; the first illustrated-creature pilot is [RW02b](docs/rework/GENERATED-CREATURE-PILOT.md). No imported or recorded audio files; spoken clips generated at build time from `src/content/voice-script.ts` by a repository script (Kokoro, run locally) are allowed, cached offline, with device speech as the fallback for any line without a clip (decided 2026-10-23). Rendering code-drawn art into a `RenderTexture`, as Puzzle Pals does, is supported. Synthesize sound with Web Audio; pitched sounds use pentatonic steps from `src/audio/notes.ts` (one test-guarded exception: a known tune played tap by tap in Sing-Along Barn uses its own notes, decided 2026-10-23). A game where she makes the music sets `music: silenced(STYLES.x)` (or `STYLES.quiet`) so the island's loop does not compete, and a registry test lists those games; keep a style playing rather than calling `music.stop()`, since playheads read its clock.
- **Large, forgiving controls.** Targets are at least 100 logical units on screen, including after scaling (grown-up games, on the `grownup` band only: at least 64, zooming or scrolling a board that cannot fit). Give immediate touch-down feedback. Taps use `onTap` from `src/engine/input.ts`; object drags use `src/engine/drag.ts`. Continuous steering, slingshots, drawn loops and deliberate multi-touch may need custom pointer handling; retain palm rejection and handle cancellation, leaving the screen, and cleanup.
- **Spoken support.** Instructions and feedback belong in `src/content/voice-script.ts`. Use `ctx.instruct` for the instruction the pet repeats and `ctx.say` for other speech. If the game uses a large pet instead of the corner guide, it must repeat the instruction. Navigation never requires reading. Literacy activities may practice reading with replayable spoken support; check actual device speech before claiming a phonics skill.
- **Mistakes teach; exploration stays welcome.** A wrong answer gets a gentle boing and spoken hint, with a glow after two misses. Keep retries and supported completion available. Do not count free creative choices, unseen-card exploration, or experimental predictions as wrong answers. Older puzzles can require revision, with undo or replay and an explanation of what happened.
- **Predictable rewards and comfortable stopping.** One sticker per completed round, including with help. No lives, game-over screens, ads, purchases, streaks, round-ending timers, or guilt. The app has no timer or bedtime scene: play limits belong to the device (Screen Time app limits, Guided Access), and the grown-ups' page says so. The pet, treehouse and journal never create neglect, lost possessions, or obligations while away.
- **Depth before pressure.** Grow levels through new modes and meaningful choices before adding speed, clutter, or memory load. Keep younger modes simple. Include co-play and an off-screen activity where useful; grown-up UI stays plain HTML in `src/parent/panel.ts`. Grown-up wording names what a game asks of her; it never says "brain training" or claims an attention, behaviour, school or ADHD benefit (decided 2026-10-23).

## Adding or extending a minigame

1. **Define a small complete experience.** State the fun action, learning goal, supported bands, first round, deeper modes, completion condition, and response to mistakes. For creative play, define a gentle way to finish without imposing one correct creation. Check [GAMES.md](docs/GAMES.md) and the [idea notebook](docs/IDEAS.md) for overlap.
2. **Keep rules inspectable.** Put level plans, puzzle generation, and answer/solution rules in the game's `logic.ts` where practical. Use the supplied seeded RNG for puzzle generation. Test meaningful properties such as solvability, valid targets, fair quantities, acceptable alternative solutions, and hints that lead somewhere useful. Where the assistant can name subagents, hand these tests to `rules-tester` (`.claude/agents/`).
3. **Implement the contract.** Export a `GameModule` from `src/games/<id>/index.ts`: stable ID, grown-up name, spoken title, subject (`region`), skills, supported bands, level ranges/descriptions, music, hub icon, seeded sticker art, and `create(ctx)`. Supply co-play/off-screen suggestions where appropriate. Implement `start`, `update`, `resize`, and `destroy`.
4. **Use the shell.** Draw into `ctx.stage`; reuse `ctx.rng`, `ctx.tw`, `ctx.particles`, `ctx.track`/`untrack`, and voice helpers. Use `ctx.companion()` (the `CompanionRig`) for the customized companion and `ctx.childName` where appropriate. Finish through `ctx.finish({ misses, hints })`; the game does not award stickers, save round history, or create its own home/celebration UI.
5. **Build a coherent ladder.** Define ordered plans and `{ min, max }` ranges for each supported band (a `BandLevels` table read with `rangeFor`, listing only the bands the game supports; add `order`, the IDs easiest first, only if the ladder is not simply `min..max`), with a useful `describeLevel` for grown-ups. Register in `src/games/registry.ts`, give it a home land in `LANDS` (`src/content/lands.ts`), and add voice lines. Registry and lands tests check IDs, titles, bands, descriptions, subject coverage, that every game is in exactly one land, and that every land still fits on one screen at every band.
6. **Integrate with the island.** Check the icon, title, its land and the home spot's path, return route, portrait/landscape, and pet clearance. More games must not mean smaller targets. Preserve stable IDs so saves and stickers survive catalog reorganization.
7. **Verify and document.** Verify at the lightest tier in [Verification budget](#verification-budget) that proves the change. Add the game's how-to card in `src/content/howto.ts` with steps scoped to the levels they hold at (a test fails without a card or on level-relative wording) and, for a touch game, a ghost-finger `autotouch()` for its demonstration (decided 2026-10-12; a couch-only game uses the controller demo; see [DESIGN.md](docs/DESIGN.md#application-and-scenes)); then its README inventory row, its [GAMES.md](docs/GAMES.md) entry, the roadmap update and a short verification entry. Where the assistant can name subagents, first have `game-reviewer` review the diff in a fresh context and fix what it finds, then, once code and checks are done, hand the doc closeout to `docs-keeper` (`.claude/agents/`) so it stays out of the build session's context. Mark gaps explicitly; a registered game or passing build alone does not establish finished play.

Two smooth rounds (at most one miss, no hints) at the current level step up; two struggling rounds (at least four misses or two hints each) step down. `src/progress/difficulty.ts` clamps changes to the played band's range. Grown-ups can pin levels through `store.pin`. Miss/hint accounting affects adaptation, so define it deliberately; assisted completion is not evidence of independent mastery.

## Integration and persistence

Details of each system are in [DESIGN.md](docs/DESIGN.md); these are the contracts to preserve. Read the area's full row in the [integration contracts](docs/DESIGN.md#integration-contracts) before changing it.

| Area | Contract to preserve (full text: [integration contracts](docs/DESIGN.md#integration-contracts)) |
| --- | --- |
| App and scenes | `App` owns Pixi, transitions, the view and the frame loop; `GameScene` owns the guide, how-to card, saving, difficulty, stickers and celebration. A destroyed scene's tweens and `ctx.say`/`ctx.instruct` promises never resolve; guard a game's own timers and callbacks. Esc and a pad's Start go through `App.escape()`. |
| Island lands | `LANDS` (`src/content/lands.ts`) puts every game in exactly one land; a land shows her age and younger plus a signpost to older games, every launch plays at `playBand`, and the home spot is her age place. Nothing gates. |
| Routes | Navigate only through `go.*` and keep each route's origin so Home returns where she came from; a different player becomes active only through `selectPlayer`. |
| Catalog layout | `GameModule.region` is a subject; a game's destination is its land. `landLayout` returns null rather than shrink a target. Nothing gates, expires or rotates. |
| Logical layout | Lay out from `view` (`src/engine/view.ts`, inside the safe-area insets) in `resize()`, never from `window` sizes; keep the bottom-left pet and the corner buttons clear. |
| Save data | Every field in `src/progress/save.ts` is bounded and repaired on load; new fields get defaults, repair and tests; keep pins, backup/restore and profile isolation. Birth month or start band lives in the profile index, never in `SaveData`. |
| Pet, stickers and treehouse | Returning a sticker to the tray removes its placement, never ownership; a round's creation is kept only on request and its discoveries file only what it showed. Nothing accrues, wears out or waits. |
| Grown-up how-to (touch) | One level-scoped card per game ID in `src/content/howto.ts` (a test fails without one or on "later levels" wording); a game with a bot demonstrates its input on the card; a scripted check that opens a game directly turns `settings.howToCards` off or presses Play. |
| Couch play | `CouchScene` and `src/couch/` own couch play and its separate save; its additions never affect touch play. A couch game needs seeded boards, `COUCH_IDS`/`UNLOCK_TIERS`/catalog entries and a bot that finishes through `control()`; a grown-up-only game is a `GAMES` entry with `bands: ['grownup']`. |

Games must release their own drag handles, global listeners, timers, and render textures in `destroy()`. Stop or guard callbacks that could touch destroyed objects; untrack objects removed before the scene ends. Use scene-owned timing and update helpers rather than unmanaged loops.

Stories: a story that carries a chosen object, amount or tune needs the typed result specified (unimplemented) in [DESIGN.md](docs/DESIGN.md#proposed-story-results); save steps so resuming cannot award twice, and never award stickers from the story layer. Zones and bands: separate zone identity from learning band, preserve return routes, never turn grades into access gates, and audit band mappings, levels, places, routes, parent controls, voice, birthdays and old saves together before adding a band. Never silently renumber saved levels or pins.

## Reuse before adding new helpers

Before writing a helper, check the [reuse map](docs/DESIGN.md#reuse-map): characters and props in `src/art/`, input, motion and physics (`ball.ts` `simulate()` also drives rule tests) in `src/engine/`, music and speech in `src/audio/`, and the games that already solve steering, aiming, controller play, tracing, code-drawn pictures, reasoning and keeping what she made. Choose examples by the mechanic being built. Do not copy a game's assumptions about age, scoring, geometry, or cleanup without checking them.

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
| New levels on an existing interaction | The above, plus one browser play of the new top level only, and `fingerdemo` at it: every game has a ghost-finger bot, so the bot has to be able to play a new level. |
| New game or a new interaction | Typecheck, unit tests, then **one** scripted play of the new game through a filter (first and last level, one wrong answer, one hint) and one portrait screenshot. Run `npm run build` only if shared files or assets changed. |
| Shell, engine, save or navigation | Typecheck, unit tests, build, the one or two suites of the games that lean on the change most, `world` if navigation changed, and the production offline check only if persistence, assets or navigation changed. |
| Couch catalog or controls | `BROWSER_SUITE=couchgames` filtered to the new or changed games. The full `couch` and `couchcourse` suites only when trip, face-off, finale or course code changed. |
| Existing-game bug fix on an unchanged interaction | Typecheck, that game's rule tests, and one filtered regression play. Run its `fingerdemo` if the fix affects the bot or its demonstrated action. Build only if shared files or assets changed. |
| Publishing a verified change to `main` | Use the change's tier above; publication adds no extra checks. Reuse passing evidence for unchanged code. |
| Full release check, explicitly requested by the grown-up | Typecheck, unit tests, build, then `world`, `picnic`, `couch` and the offline check. The hour-long combined flow only when the grown-up asks for it. |

How to keep it light:

- **Publishing does not widen the check scope.** A one-game fix or level keeps its filtered checks when pushed to `main`; broader suites follow only the shared behavior a change touches (the table above, plus `picnic` for story flow).

- **Unit tests are the main proof.** Put rules in `logic.ts` and test each property you would otherwise check by playing: solvable, fair, valid targets, a hint that leads somewhere. Do not drive the browser to learn something a test can assert.
- **Do not repeat what is already recorded.** If the [coverage summary](docs/VERIFICATION.md#coverage-summary) records a suite passing and the area has not changed since, it counts. Never re-run a passing suite after a comment, docs or test-only edit, or "to be sure".
- **One suite at a time, always with a filter.** Never start `npm run test:browser` with no `BROWSER_SUITE`. Take one or two screenshots per new screen, not a gallery.
- **Do not loop on a failing check.** Probe once with a small script. If the failure also happens on unchanged code, or looks like timing (Peg Garden's touch suite), record it as a known flake and move on.
- **Cap it.** A feature's browser checking should stay within about ten minutes of wall time and a small fraction of the session. If it would run longer, write the remaining check down as "not run" and go on building.
- **Snapshots for slow suites.** The couch suites take five to eight minutes; run them on a frozen copy of the tree on another port (`scripts/snapshot-serve.sh`) so edits continue.
- **Keep sessions and output small.** A turn re-reads the whole conversation, so context built up inside a session is most of what a slice costs. Take one declared same-game batch per session (usually 2–4 related level/content subtasks; [batch plans](docs/GAME-BATCHES.md)), keep that worker through every included substep and usage-window checkpoint, then start fresh after the whole batch merges; do not chain unrelated work. Past about 150K tokens of context, push a checkpoint (draft PR: what is done, what remains) and finish in a fresh session. Delegate verbose work (a long suite log, a broad search) to a subagent that returns only the conclusion. Pipe test and suite output through `tail` or `grep` (`npm test 2>&1 | tail -15`, `npx vitest run <file> 2>&1 | tail -20`); on a failure, re-run once for the part that failed.
- **Read big documents by section.** `docs/ROADMAP.md`, `VERIFICATION.md`, `IDEAS.md`, `GAMES.md`, `GAME-BATCHES.md` and `DESIGN.md` are each too large to read whole (the Read tool cuts a file off near 70 KB). `grep -n` for the heading, game ID or PR, then read that range with an offset and limit; never open one from the top to look around.
- **Say what was skipped.** "Not run" is an acceptable entry. Hardware, an iPad, a real controller and a child's reaction are never established by Chrome automation.

Suite names, filters and durations are in the [README](README.md#browser-checks); add cases for new games to `scripts/browser-check.mjs` and the README table rather than keeping a second inventory here. Browser scripts use isolated contexts; never clear a real player's save.

When a browser check fails, probe with a small logging script before changing the test: many failures here were real bugs, such as a hint glow swallowing touches, a destroyed drawing freezing a show, and overlapping tap targets. Prove a fix by briefly restoring the old rule and watching the check fail. Put one-off Playwright probes in `test-results/` so `import 'playwright'` resolves. Vite listens on IPv6 `localhost`, so use `GAME_URL=http://localhost:5173`. The island game is served at `classic/` and the site root is the creature-world rework (2026-10-19); the browser and offline harnesses add `classic/` to a bare origin. Before an offline run, confirm the preview serves the current build by comparing the `assets/index-*.js` name in the served page with `dist/index.html`.

### Same-game batches

Developer direction, 2026-10-21: an implementation slice is a predeclared same-game batch of usually 2–4 related level/content subtasks, dispatched by [READY](docs/READY.md) from the [batch plans](docs/GAME-BATCHES.md). Claim every included ID and file in one worker, branch and PR; read the game and set up its checks once; the shared final checks still cover every distinct interaction, new entry layout and bot level, within the verification budget and existing gates. A larger new interaction may stay standalone, and research stays one game or subject per session. The coordinator admits a batch only if the whole of it fits, otherwise splits it into named complete parts; unfinished batches resume in their existing worker. Full rules: [workflow guidance](docs/DEVELOPMENT-WORKFLOW.md#same-game-batches-2026-10-21).

### Session setup and closeout

Use the [development workflow review](docs/DEVELOPMENT-WORKFLOW.md) for the reasons behind these steps. In a fresh worktree, use `npm ci` for its own dependencies; do not borrow another disposable worktree's `node_modules`. Choose an explicit available port, start Vite with `--strictPort`, and set `GAME_URL` to exactly that URL. Keep any custom Vite cache within that worktree; concurrent worktrees must not share a mutable cache. Stop the session's dev, preview and snapshot servers when its checks finish.

After publication and merge, remove a finished worktree only after checking its owning session is complete, its tip is in current `origin/main`, it has no uncommitted or untracked work, and no live PR still uses its branch. Preserve needed ignored screenshots, probes and local settings before removal. Use the app's recoverable archive for a managed worktree when available; otherwise keep a recovery manifest with its path and commit, and back up needed artifacts before `git worktree remove`. Delete only merged feature branches after their worktree is released; preserve `main`, active branches and unmerged research. Do not force removal of a dirty worktree. Cleanup does not require closing the historical chat.

### Scripted play

Dev-only `neo` exposes the app (`neo.scene`, `neo.view`, `neo.go.game(id, band)`); `kit` in `src/dev/testkit.ts` provides `tap`, `tapOn`, `drag`, `dragTo`, `line`, `until`, `sleep`, and `store`. Start on "Who's playing?" by clicking the first card (`.chooser__play`; the browser harness does it in `pickFirst()`) and wait about three seconds for the transition before navigating. Set the test profile band and `kit.store.stats(id).level`, then drive the game and inspect `neo.scene.game`.

Use scripted input for moving targets, then screenshots for visual review. Finish edits before a play-through: HMR can reload and kill a running script. To keep editing during a long run, serve a detached `git worktree` of HEAD on another port (with its own Vite `cacheDir`) and point `GAME_URL` at it. Re-check `neo.scene` after reloads. To clear an isolated profile's test data only, use `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

### Input and rendering pitfalls

Before writing pointer input, hit areas, couch controls, textures or long-lived drawings, read the [input and rendering pitfalls](docs/DESIGN.md#input-and-rendering-pitfalls): Pixi 8 never forwards `pointercancel`; synthetic `pointerup` goes on the canvas; drags ride 40 units above the finger; hit areas use local units; decorations can steal taps; hit-testing uses the last frame; resolve close targets to the nearest; couch stages take no pointer input; free textures you own.

## Documentation and Git

### Scheduled roadmap work

For scheduled roadmap continuation, follow [the execution queue](docs/EXECUTION-QUEUE.md) before claiming work. The coordinator admits one slice per run after checking both usage windows, then creates a fresh project chat for that slice. Resume an unfinished owned worker before dispatching another; defer while another implementation is active. Workers receive a concise handoff and repository pointers, not the coordinator conversation. Admission uses actual five-hour/weekly allowance, with no daily cap or percentage reserve. Preserve the queue checkpoint when stopping; usage limits never justify reporting unfinished work as complete.

### Avoid duplicate parallel work

Before choosing a roadmap slice or making edits:

1. Fetch `origin` with pruning and make sure the new feature branch starts at the latest `origin/main`; fast-forward a clean local `main` first when needed. Never pull blindly into a dirty worktree.
2. Inspect active worktrees, unmerged local and remote branches, and open pull requests for the same roadmap chunk, game IDs or files. `scripts/overlap.sh <game-id> <path>…` does steps 1–2 in one compact printout (fetch, how far behind, then the matching pull requests, worktrees and unmerged branches); run it for each recheck below instead of separate `git fetch`, `gh pr list` and `git worktree list` calls. Work that is in flight counts even when it has not reached `main` yet.
3. If another branch is already implementing the slice, do not build a second version. Reconcile with that branch, help finish it, or choose the next non-overlapping ready slice unless the grown-up explicitly wants competing approaches.
4. Create a clearly named feature branch before substantial edits. Before coding, publish a small docs-only claim commit and draft pull request naming the game ID, exact batched level/content subtasks and dependencies, and expected files; put the branch/PR on the existing roadmap or deep-dive row. An uncommitted implementation in another worktree also claims that slice. Update that same PR as the playable work becomes coherent.

Fetch and inspect for overlap again immediately before publishing a follow-up commit, and once more before merging or pushing `main`. If `origin/main` moved or overlapping work landed, integrate the current remote version and rerun the proportionate checks before publishing. Never push a local `main` whose view of `origin/main` is stale. Do the upstream integration before the final feature checks when practical. After integration, rerun checks for changed dependencies; a docs-only integration does not invalidate a passing game play-through. Record the tested commit (or base commit plus working diff), exact filters and server URL so reuse is inspectable.

Keep this file provider-neutral and durable; update it when a shared contract or workflow changes. Where an update goes:

- **A game added or changed:** its README row, [GAMES.md](docs/GAMES.md) entry and how-to card.
- **Roadmap work:** edit its line in [ROADMAP.md](docs/ROADMAP.md) (counts live only there and in the README). When a slice from [READY.md](docs/READY.md) lands, delete its line there, mark the slice built in its deep dive and put the build note in the archive; never add "built … PR" history to that list or the chunk table. Refills follow READY’s study cadence (three follow-up definitions and one research slot per ten when eligible); update [the study backlog](docs/STUDY-BACKLOG.md) and promote the first resulting unblocked build into a content slot. When an item is finished, move it and its build notes to the newest completed-work file in `docs/archive/` instead of leaving it checked off, and leave a one-line "built" mention only where a reader needs it. Give each open item a status (ready, sketch, define, decision, person), and add a call that only the developer can make to [WAITING-ON-DEVELOPER.md](docs/WAITING-ON-DEVELOPER.md). Move a built idea out of [IDEAS.md](docs/IDEAS.md); label new ideas as proposals.
- **Checks run:** a ~six-line [VERIFICATION.md](docs/VERIFICATION.md) entry (what changed, what ran, what is open) and its coverage-summary row: one row per suite or area, overwritten with the latest pass and its caveats, never a new row per slice (the dated entry holds the history). Keep about fifteen dated entries live: when the file holds more than that at closeout, run `node scripts/archive-verification.mjs` (`--keep=15` to trim to the newest fifteen; `--dry-run` to preview), which moves older entries into `docs/archive/VERIFICATION-<entry date>.md`, repoints links to the moved anchors and checks every Markdown link (plain `node scripts/check-links.mjs` does the check alone). Execution-queue dispatch notes do not belong in this file. Checks needing a person or device go in [DEVICE-CHECKS.md](docs/DEVICE-CHECKS.md) and stay open until done.
- **A contract or system behavior changed:** [DESIGN.md](docs/DESIGN.md), and only then.
- **Superseded documents:** move to `docs/archive/` with a line in its index, rather than leaving stale status in a live doc.

Report briefly to the grown-up after each finished game or feature: what it does and which checks ran. When a requested task is complete and verified, commit it on a feature branch and merge that branch into local `main`, unless the grown-up asks to leave it uncommitted or unmerged. After every commit, push the feature branch and create or update its pull request so the commit is published for review; do not create a new pull request for each follow-up commit on the same branch. After merging a verified feature into local `main`, push `main` so it is published and deployed, unless the grown-up explicitly asks not to push. **Standing authorization (the developer, 2026-10-12): merge and deploy completed, verified changes through this repository workflow without asking for confirmation again.** This covers future requested work in this repository; it does not change platform approval controls, and a later instruction to leave work unmerged or undeployed takes precedence. The live site is [Puddle Island](https://rjdunlap.github.io/neo/) (the rework at the root, the island game at [`classic/`](https://rjdunlap.github.io/neo/classic/)); every push to `main` deploys through `.github/workflows/deploy.yml`. Every pull request runs `npm test` and `npm run build` on its merge with `main` (`.github/workflows/ci.yml`): wait for it (`gh pr checks <n> --watch`) and merge only when it passes, since a test that passed on a stale base can fail the deploy once another slice lands. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repository).
