# Puddle Island (project Neo)

Shared rules for human contributors and coding assistants. Paths are relative to the repository root. This file holds rules and pointers only: put new detail, reasons and history in the doc that owns it (below) and link to it, rather than growing this file. Operational how-to is in the [session guide](docs/SESSION-GUIDE.md).

## Project direction

Puddle Island is an iPad learning game for the developer's daughter (about one year old in October 2026): many small, satisfying games on a familiar island, after JumpStart, Neopets and classic arcades. Bands are `lap`, `toddler`, `preschool`, `prek`, `school` (about 6–8, up to 12; Wonder Woods) and `grownup` (13 and up; Lantern Lodge); each band's home spot on the map is an age place. Built today: the games on a map of themed lands, a pet with its treehouse (saved creations, a discovery journal), two stories, and a separate grown-up **couch play** route. The [roadmap](docs/ROADMAP.md) holds the direction and what is only proposed; do not assume a proposed zone, story or band exists.

**Current focus (the developer, 2026-11-09):** a good phone experience, so the developer and their wife can play on their own phones and give gameplay feedback. There is no iPad yet and their daughter is not old enough to play yet, so iPad, child, TV and controller checks are [parked](docs/DEVICE-CHECKS.md): do not list them as open, add them to docs or repeat them, or the [waiting list](docs/WAITING-ON-DEVELOPER.md), in reports. Phone work and what [playtest notes](docs/OBSERVATIONS.md) ask for come first in [READY](docs/READY.md).

Each activity needs a fun action and a clear learning purpose: sharing fills plates, a pattern moves a train, a revised route reaches a friend. Extend an existing game when the meaningful action is the same; make a new one when the learning or interaction warrants it. Follow the requested scope and the roadmap; build complete, playable slices, and add shared infrastructure only when an implemented activity needs it.

**Rework (2026-10-16):** the app grows in place into an educational creature world with collecting, customization, permanent unlocks through play, meaningful projects and manageable navigation. The [rework brief](docs/rework/README.md) and [work items](docs/rework/WORK-ITEMS.md) define it; the title and final cast/style are still explorations. Reuse its games and research, archive superseded docs only as replacements ship, and treat current contracts as descriptions of what exists, not a veto on the brief; older no-unlocks and single-companion proposals yield to it. The site root is the rework; the island game is served at `classic/`. **Saves are development data:** rework slices may reset or reject old saves instead of migrating them, but keep current-format validation, reliable writes, profile isolation, backup/restore and offline checks, and a clear reset path at cutover.

## Where things are written down

| Document / source | Role |
| --- | --- |
| [README.md](README.md) | Setup, the game inventory and count, browser suites |
| [docs/ROADMAP.md](docs/ROADMAP.md), [docs/READY.md](docs/READY.md) | Direction and chunks; the pick list (**Next ten**, one file per line in `docs/ready/next/`, `node scripts/ready.mjs`; then **Queued**) |
| [docs/rework/](docs/rework/README.md) | Creature-world target and work items (proposed until delivered) |
| [docs/WAITING-ON-DEVELOPER.md](docs/WAITING-ON-DEVELOPER.md), [docs/DEVICE-CHECKS.md](docs/DEVICE-CHECKS.md) | The few calls only the developer can make (not repeated to them); parked device and child checks, and what a phone playtest can answer |
| [docs/OBSERVATIONS.md](docs/OBSERVATIONS.md) | What people said after real play: the phone playtest notes |
| [docs/DESIGN.md](docs/DESIGN.md) | Architecture, systems, [integration contracts](docs/DESIGN.md#integration-contracts), [reuse map](docs/DESIGN.md#reuse-map) |
| [docs/games/](docs/GAMES.md) (one page per game), [docs/IDEAS.md](docs/IDEAS.md) | What each game does, indexed in GAMES.md; the idea notebook (not a mandate) |
| [docs/deep-dives/](docs/deep-dives/README.md) | Each game's researched ladder and the research tracker |
| [docs/VERIFICATION.md](docs/VERIFICATION.md), `docs/verification/` | The coverage summary per suite; checks performed, one dated file per entry |
| [docs/SESSION-GUIDE.md](docs/SESSION-GUIDE.md), [docs/DEVELOPMENT-WORKFLOW.md](docs/DEVELOPMENT-WORKFLOW.md) | How a session works here; the reasons behind the workflow |
| [docs/COUCH-PLAY.md](docs/COUCH-PLAY.md) | Player guide for couch play |
| `docs/archive/` | History, not instructions |
| `src/games/types.ts` | The minigame contract |

Check the working tree before editing. Local work, recorded verification and deployed features are distinct states; `origin/main` is what is deployed. Preserve unrelated work in progress.

## Rules for every activity

- **Generated art and sound.** Pixi `Graphics` or prepared sprite/texture assets, colors from `src/art/palette.ts`. Generated or imported sprites and layered creature art are allowed, made and prepared by the assistant, with source art and reproducible preparation steps kept in the repository ([RW02b](docs/rework/GENERATED-CREATURE-PILOT.md)). No imported or recorded audio: spoken clips are generated at build time from the voice lines by a repository script (Kokoro, run locally), with device speech as fallback. Synthesize sound with Web Audio; pitched sounds use pentatonic steps from `src/audio/notes.ts` (one test-guarded exception: Sing-Along Barn's known tunes). A game where she makes the music sets `music: silenced(STYLES.x)` (or `STYLES.quiet`), never `music.stop()`.
- **Large, forgiving controls.** Targets at least 100 logical units on screen after scaling (`grownup` band only: 64, zooming or scrolling a board that cannot fit). Immediate touch-down feedback. Taps use `onTap` (`src/engine/input.ts`), drags `src/engine/drag.ts`; custom pointer handling keeps palm rejection and handles cancellation, leaving the screen and cleanup.
- **Spoken support.** Instructions and feedback live in the game's `voice.ts`: `ctx.instruct` for the instruction the pet repeats, `ctx.say` otherwise. A game with a large pet instead of the corner guide repeats the instruction itself. Navigation never requires reading; check real device speech before claiming a phonics skill.
- **Mistakes teach; exploration stays welcome.** A wrong answer gets a gentle boing and spoken hint, and a glow after two misses; retries and supported completion stay available. Free creative choices, unseen-card exploration and experimental predictions are never wrong answers. Older puzzles may require revision, with undo or replay and an explanation.
- **Predictable rewards and comfortable stopping.** One sticker per completed round, including with help. No lives, game-over screens, ads, purchases, streaks, round-ending timers or guilt. No in-app timer or bedtime scene: limits belong to the device (Screen Time, Guided Access), and the grown-ups' page says so. The pet, treehouse and journal never create neglect, loss or obligations.
- **Depth before pressure.** Grow through new modes and meaningful choices before speed, clutter or memory load; keep younger modes simple. Include co-play and an off-screen activity where useful. Grown-up UI stays plain HTML in `src/parent/panel.ts`; its wording names what a game asks of her and never claims "brain training" or an attention, behaviour, school or ADHD benefit.

## Adding or extending a minigame

Start a claimed new game with the [scaffold command](docs/NEW-GAME.md); its placeholders still need the implementation and checks below.

1. **Define a small complete experience:** fun action, learning goal, bands, first round, deeper modes, completion and response to mistakes (for creative play, a gentle finish without one correct creation). Check [GAMES.md](docs/GAMES.md) and [IDEAS.md](docs/IDEAS.md) for overlap.
2. **Keep rules inspectable** in the game's `logic.ts`, using the seeded RNG, with tests of meaningful properties: solvable, valid targets, fair quantities, accepted alternatives, hints that lead somewhere (subagent `rules-tester` where available).
3. **Implement the contract:** `src/games/<id>/index.ts` exports a `GameModule` (stable ID, grown-up name, spoken title, `region`, `challenge`, skills, bands, levels and descriptions, music, hub icon, sticker art, co-play/off-screen suggestions, and `create(ctx)` with `start`, `update`, `resize`, `destroy`). The folder is named by the ID; the registry finds it.
4. **Use the shell:** draw into `ctx.stage`; use `ctx.rng`, `ctx.tw`, `ctx.particles`, `ctx.track`/`untrack`, voice helpers, `ctx.companion()` and `ctx.childName`. Finish through `ctx.finish({ misses, hints })`; the game never awards stickers, saves history or draws its own home or celebration.
5. **Build a coherent ladder:** a `BandLevels` table read with `rangeFor` (`order` only if the ladder is not simply `min..max`) and a useful `describeLevel`. Give it one land in `LANDS` (`src/content/lands.ts`) and voice lines in `voice.ts`, then run `node scripts/content-barrels.mjs`. Registry and lands tests check the folder, IDs, bands, descriptions, `challenge`, one land per game, and that every land page fits one screen at every band.
6. **Integrate with the island:** icon, title, land, return route, portrait and landscape, pet clearance. More games never mean smaller targets; keep IDs stable so saves and stickers survive.
7. **Verify and document** at the lightest [tier](#verification-budget). Add a level-scoped how-to card in `howto.ts` and, for a touch game, a ghost-finger `autotouch()`; then its page `docs/games/<id>.md` (the Starts as and Grows into lines and design notes below the generated block; `npm run game-docs` writes the block, the README tables and the GAMES.md index, and `npm test` fails when they are stale), roadmap update and a verification entry. Where subagents exist, `game-reviewer` reviews the diff first and `docs-keeper` does the doc closeout. A registered game or passing build alone is not finished play.

Two smooth rounds (at most one miss, no hints) step up; two struggling rounds (at least four misses or two hints each) step down, clamped to the band's range by `src/progress/difficulty.ts`. Grown-ups pin levels with `store.pin`. Define miss/hint accounting deliberately (count with `src/progress/coach.ts`): assisted completion is not independent mastery.

## Integration and persistence

Read the area's row in the [integration contracts](docs/DESIGN.md#integration-contracts) before changing it. In short: `App` owns Pixi, transitions, the view and the frame loop; `GameScene` owns the guide, how-to card, saving, difficulty, stickers and celebration; a destroyed scene's tweens and speech promises never resolve, so guard a game's own timers. Esc and a pad's Start go through `App.escape()`. Every game is in exactly one land; a land shows her age and younger plus a signpost, a full land pages rather than shrinks (`landLayout` returns null rather than shrink a target), every launch plays at `playBand`, and nothing gates, expires or rotates. Navigate only through `go.*`, keep each route's origin, and change players only through `selectPlayer`. Lay out from `view` in `resize()`, never from `window`. Every `SaveData` field is bounded and repaired on load, with defaults and tests; keep pins, backup/restore and profile isolation; birth month or start band lives in the profile index. A sticker returned to the tray keeps its ownership; a round's creation is kept only on request, discoveries file only what it showed, and nothing accrues, wears out or waits. Couch play (`CouchScene`, `src/couch/`) has its own save and never affects touch play.

Games release their own drag handles, listeners, timers and render textures in `destroy()`, untrack objects removed early, and use scene-owned timing rather than unmanaged loops. Stories never award stickers and save steps so resuming cannot award twice. Never turn grades into gates, and never silently renumber saved levels or pins. Before writing a helper, check the [reuse map](docs/DESIGN.md#reuse-map).

## Verification workflow

TypeScript + Vite + PixiJS 8, an offline PWA. From the repository root: `npm run dev` (port 5173), `npm run typecheck`, `npm test`, `npm run build`, `npm run test:browser` (dev server running, always with `BROWSER_SUITE`), `npm run build-and-preview` (port 4173), `npm run test:offline` (preview running).

### Verification budget

Spend checks where they find real bugs, at the lightest tier that proves the change, and stop there.

| What changed | Run |
| --- | --- |
| Docs only | Links (`node scripts/check-links.mjs`) and `git diff --check`. No code checks. |
| Game rules, level plans or puzzle generation (`logic.ts`) | `npm run typecheck` and that game's rule tests. |
| New levels on an existing interaction | The above, one browser play of the new top level, and `fingerdemo` at it. |
| New game or a new interaction | Typecheck, unit tests, **one** filtered scripted play (first and last level, one wrong answer, one hint) and one portrait screenshot; `npm run build` only if shared files or assets changed. |
| Shell, engine, save or navigation | Typecheck, unit tests, build, the one or two suites that lean on it most, `world` if navigation changed, offline only if persistence, assets or navigation changed. |
| Couch catalog or controls | `BROWSER_SUITE=couchgames` filtered; full `couch`/`couchcourse` only for trip, face-off, finale or course code. |
| Existing-game bug fix | Typecheck, its rule tests, one filtered regression play (`fingerdemo` if the bot or demonstrated action changed); build only if shared files or assets changed. |
| Publishing to `main` | The change's tier; publishing adds no checks. Reuse passing evidence for unchanged code. |
| Full release check (grown-up asks) | Typecheck, unit tests, build, `world`, `picnic`, `couch`, offline. The hour-long flow only on request. |

Hard rules: unit tests are the main proof; never start `npm run test:browser` without a `BROWSER_SUITE` filter; never re-run a suite the [coverage summary](docs/VERIFICATION.md#coverage-summary) records passing on unchanged code; probe a failing check once, then record a flake and move on; keep browser checking to about ten minutes; read big docs by section with `node scripts/peek.mjs`; pipe test output through `tail`; say which checks were not run. Chrome automation never establishes hardware, a real phone, iPad or controller, or a child's reaction: never claim it did, and do not list those as open either ([parked](docs/DEVICE-CHECKS.md)). Details: [keeping checks light](docs/SESSION-GUIDE.md#keeping-checks-light).

One same-game batch (usually 2–4 related subtasks from [the batch plans](docs/GAME-BATCHES.md)) per session, in one worker, branch and PR; start fresh after it merges, and checkpoint a draft PR past about 150K tokens of context. Worktree setup, ports, scripted play and servers: [session guide](docs/SESSION-GUIDE.md#session-setup-and-closeout).

### Input and rendering pitfalls

Before writing pointer input, hit areas, couch controls, textures or long-lived drawings, read the [input and rendering pitfalls](docs/DESIGN.md#input-and-rendering-pitfalls).

## Documentation and Git

**Scheduled roadmap work** follows [the execution queue](docs/EXECUTION-QUEUE.md): one slice per run, in a fresh chat. Never bind a recurring Routine to a long-lived chat. Usage limits never justify reporting unfinished work as complete.

**Before choosing a slice or editing:** run `scripts/overlap.sh <game-id> <path>…` (fetch, how far behind, matching PRs, worktrees and unmerged branches). If another branch implements the slice, reconcile with it or pick another. Start a named feature branch from the latest `origin/main`, then publish a small docs-only claim commit and draft PR naming the game ID, subtasks and expected files, and put it on the roadmap or deep-dive row. Recheck overlap before each follow-up push and before merging; integrate a moved `origin/main` and rerun proportionate checks. Never push a stale local `main`. Full steps: [avoiding duplicate parallel work](docs/SESSION-GUIDE.md#avoiding-duplicate-parallel-work).

**Doc updates** go to their owning doc: a game's page in `docs/games/` and how-to card (rerun `npm run game-docs` rather than hand-merging a conflict in README, GAMES.md or a generated block); roadmap lines in ROADMAP.md (a landed READY line is removed, a Next ten line by `git rm` of its file in `docs/ready/next/`, and its note archived; plan docs keep no running counts or PR lists); a short entry file in `docs/verification/` (`node scripts/verification.mjs new`) plus its VERIFICATION.md coverage row; contract changes in DESIGN.md only; superseded docs to `docs/archive/`. Routing in full: [where each doc update goes](docs/SESSION-GUIDE.md#where-each-doc-update-goes). Keep this file provider-neutral and durable.

**Publishing.** When a requested task is complete and verified, commit it on its feature branch, push, and create or update its one pull request. Every PR runs `npm test` and `npm run build` on its merge with `main` (`.github/workflows/ci.yml`); merge only when that passes for the head commit, then push `main`, which deploys to [Puddle Island](https://rjdunlap.github.io/neo/). **Standing authorization (the developer, 2026-10-12): merge and deploy completed, verified changes this way without asking again**, unless a later instruction says to leave work unmerged. Report briefly to the grown-up what each finished change does and which checks ran. Repo identity is `rjdunlap` with the GitHub no-reply email.
