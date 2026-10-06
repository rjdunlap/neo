# Handoff: next session

Written 2026-10-06, updated at midday after a Codex session ran out of usage partway through the prompt below. Read [AGENTS.md](../AGENTS.md) first, then the [roadmap](ROADMAP.md), the [elementary roadmap](ELEMENTARY-ROADMAP.md) and the [verification log](VERIFICATION.md). The last section is a ready-to-use prompt for the next round of expansion; its steps 1 and 2 are now done. Delete or replace this note once its points are absorbed.

## State of the tree

- **The last commit is `da6860b`.** Everything below is in the working tree only: not committed and not deployed. Run `git status` before starting. Commit or push only when the grown-up asks; pushing to `main` deploys.
- **Two sessions have worked in this checkout.** Claude added Seesaw Balance, Teddy Doctor, Bumper Garden and Quick Tricks (39 games). Codex then worked from the prompt below and added:
  - **Subject cards:** an optional place layout, chosen in grown-up Finding games.
  - **Four games:** Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town (43 games).
  - **Longer ladders:** Quick Tricks levels 4–6 and Seesaw Balance level 7.
  - **More lap play:** Rainbow Fingers and Fluffy Salon open their second free-play modes to lap.

  A Claude session then opened Photo Safari's and Teddy Doctor's naming levels (level 2) to lap play. README, DESIGN, ROADMAP and ARCADE-IDEAS already describe all of it.
- **Checked:** typecheck and 142 unit tests across 50 files pass. The `creative` suite and Quick Tricks 1–6 pass.
- **Do first after the usage reset:** finish the unchecked items in the newest [verification entry](VERIFICATION.md):
  1. `npm run build`.
  2. `BROWSER_SUITE=world`. It last failed the subject-card cancellation step: after a pointer cancel, the next card tap did not open the subject. `SubjectPlaceScene.ts` was edited right after the probe, but the suite was not rerun.
  3. `npm run test:offline` against a fresh build; it now starts through subject cards.
  4. `BROWSER_SUITE=next NEXT_ONLY=seesaw FROM_LEVEL=7`.

  Then record the results.

## Catalog snapshot

- **Totals:** 43 games. Puddle Lagoon (lap) lays out 30, Daisy Meadow 39, Bumpy Hills 42 and Starry Peak 43. The original swiping path is still the default; subject cards await the iPad comparison (roadmap §2).
- **Games per subject:** Treehouse 3, Counting Cove 4, Music Mountain 4, Rainbow Meadow 4, Barnyard 4, Bubble Beach 4, Story Grove 4, Puzzle Peaks 5, Tinker Lab 5, Cozy Village 6.
- **Shortest ladders:**
  - Ten games stop at 5 levels, including Bouncy Launch, Peg Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, Bounce Back, Dot Link and Bumper Garden.
  - Robot Path is pre-K only.
  - Pattern Train, Memory Match and Letter Trails start at preschool.
- **Lap play:** 30 games support lap; 17 have more than one lap level, and 13 still have one.
  - The remaining level 2s are too hard for a one-year-old: steering, pulling, sliding, colors, numbers, letters or rallies.
  - Peg Garden's bloom level can't finish if the same spot is tapped repeatedly (deterministic physics). It needs a gentle completion before it opens to lap.
  - New lap levels must be appended at the end of a ladder, so another lap step means an easy mode outside the usual ladder order. That needs a decision about non-contiguous ranges first.
- **Remaining from step 3 of the prompt:** the 6–8 steps (Robot Path loops with step-through and undo, a Mail Carrier two-stop map, Little Helpers equal groups, Word Monsters blending) and the 5-level ladders. Step 4 (Windy Picnic or the pet treehouse) has not started.

## The grown-up's preferences

- **More games, wider and deeper.** The grown-up wants many more games, deeper levels and new features.
- **Proportionate checks.** Run typecheck, unit tests and the browser suite (or one-game filter) for what changed. Add `world` when places change, and the offline check after navigation, persistence or asset changes. The hour-long combined flow is for occasional release checks only.
- **Report as you go.** Say briefly what each finished game or feature does and which checks ran.

## Still open

- **The real iPad (the grown-up's job):**
  - Device speech and first-touch audio.
  - Touch feel: herding, pulling, drawing and flipping.
  - Bounce Back with two hands.
  - Orientation, Add to Home Screen and Guided Access.
  - Judging fun and clarity for the newest eighteen games (roadmap §1).
- **§2 navigation:** compare the swiping path and subject cards on the iPad, then choose the default.
- **Larger pilots:** §3 Windy Picnic, §4 pet treehouse and discovery journal, and the elementary horizons (E1 Wonder Woods first).

## How to work here

- **Servers.**
  - Check before starting one: `lsof -nP -iTCP -sTCP:LISTEN | grep -E "5173|4173"`; start with the preview tool's `neo` (dev) and `neo-build` (build and preview) configurations.
  - Use `GAME_URL=http://localhost:5173`; Vite listens on IPv6 `localhost`.
  - Before an offline run, compare `assets/index-*.js` in `curl http://localhost:4173/` and `dist/index.html`.
- **Browser tests.**
  - Set `BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
  - `FROM_LEVEL=n` starts the `next` suite's game loops at a level.
  - Put one-off Playwright probes in `test-results/` so `import 'playwright'` resolves.
- **Don't edit `src/` during a browser run:** hot reload kills it. For a long run, serve a detached `git worktree` of HEAD on another port (see AGENTS.md).
- **Probe before changing a failing test.** A small Playwright script that logs state step by step found this session's real bugs:
  - a hint glow swallowing touches;
  - a destroyed drawing freezing a show;
  - overlapping tap targets.

  Prove a fix by briefly restoring the old rule and watching the check fail.
- **Physics games:** use `simulate()` for rule tests (reachability, never trapped, flight times) and to steer test shots.
- **The offline check taps Monster Munch by position** (index 14 in Daisy Meadow). New games in Bubble Beach, Music Mountain, Treehouse, Barnyard, or early in Counting Cove move it; recompute with `gamesFor('toddler')`.

## Prompt for the next expansion

Paste this into a new session (Claude Code or Codex) working in this repository.

```text
You are continuing work on Puddle Island (project Neo), an iPad learning game for the developer's
daughter, who is about one year old. The goal of this session is to expand the island: more games,
deeper levels, and new features, built as complete, playable, tested slices.

Read first: AGENTS.md (the rules every activity follows), docs/HANDOFF.md (current state and working
lessons), docs/ROADMAP.md, docs/ELEMENTARY-ROADMAP.md, and the idea notebooks docs/ARCADE-IDEAS.md
and docs/MICROGAME-IDEAS.md. Check `git status` and `git log`: earlier work may still be uncommitted.
Another session may be editing docs at the same time; build on files rather than overwriting them.

Work in this order, reporting briefly to the grown-up after each finished piece:

1. Make 39+ games findable (roadmap §2). Prototype a place layout with clearly separated subject
   clusters and a few large choices visible at once, behind a grown-up setting so the current
   swipe-and-arrow path stays available for comparison on the iPad. Keep spoken names, touch-down
   feedback, swipe cancellation, remembered position, home returning to the launching place, stable
   game IDs and saved progress. Update scripts/offline-check.mjs if tap positions change, and run the
   world suite and the offline check.

2. Add a batch of four new games, favoring the thinnest subjects (Treehouse has 2; Counting Cove,
   Music Mountain and Rainbow Meadow have 3) and kinds of interaction the island lacks. Good
   defaults, all from the notebooks:
   - Stamp Studio (Treehouse): stamp and arrange a picture, a gentle finish without one right answer.
   - Pet Kitchen (Counting Cove): share and cut snacks into equal parts; doubling a picture recipe at pre-K.
   - Rhythm Neighbors (Music Mountain): call-and-response rhythms with a woodpecker and a frog
     chorus. Reuse Sound Garden's forgiving echo judge, and keep it different from that game's echo level.
   - Tangram Town or Shape Buddies (Rainbow Meadow): fit large shapes to silhouettes, rotation by snaps.
   Cheaper alternates: Pin Roll or Mini Golf (reuse engine/ball.ts), Number Merge, Critter Crossing,
   a second Quick Tricks show (Parcel Turn, Picnic Places, Last Berry). Before coding each game,
   write its brief: fun action, learning goal, bands, first round, deeper levels, completion, and
   what a mistake or experiment does (never punish exploration or creative choices).

3. Deepen levels where ladders are short:
   - Lap: 17 of the 28 lap games have a single lap level. She is about one, so add a second simple
     cause-and-effect level to the favorites where it makes sense.
   - Quick Tricks has only 3 levels.
   - Ten games stop at 5 levels.
   - Next steps toward 6–8 from the roadmap and elementary roadmap: Seesaw Balance (comparing totals,
     two unknowns), Robot Path loops with step-through and undo, a Mail Carrier picture-map with two
     stops, Little Helpers equal groups, Word Monsters blending reviewed word families.
   Extend existing ladders without renumbering saved levels; append new levels at the end and
   update each band's range and describeLevel.

4. If time remains, start the smallest version of a connected feature: the Windy Picnic adventure
   (roadmap §3; it needs a deliberate extension of the { misses, hints } round result, resumable
   and idempotent steps, and no duplicate stickers) or the pet treehouse (§4; bounded saves with
   migration and backup tests). Do not build a large framework before one small slice works.

How to build each game or level (details in AGENTS.md):
- Code-drawn art (Pixi Graphics, palette colors) and synthesized sound (pentatonic steps); no
  image or audio files. Targets at least 100 logical units, touch-down feedback, onTap and drag.ts.
- Every instruction in src/content/voice-script.ts; ctx.instruct for the repeatable instruction.
- Wrong answer: gentle boing and a spoken hint; a glow after two misses; supported completion.
  One sticker per round via ctx.finish({ misses, hints }). No lives, timers, streaks or guilt.
- Rules in the game's logic.ts using ctx.rng, with unit tests for meaningful properties
  (solvable, one right answer where intended, fair quantities, hints that lead somewhere,
  no traps in physics). Register in src/games/registry.ts with a stable ID.
- A browser play-through of every level in scripts/browser-check.mjs (a new suite or the `next`
  suite) that drives input like a finger, including two misses and the hint, and checks the saved
  score and the sticker. Review mid-round screenshots, including portrait, for layout problems.

Verification is proportionate (the grown-up's preference): typecheck, unit tests, build, the
suite for what changed, plus `world` when places change and the offline check after navigation,
persistence or asset changes. Do not run the hour-long combined flow unless asked. When a check
fails, probe with a small logging script before changing the test; many failures this project has
seen were real bugs (overlays catching touches, overlapping targets, destroyed objects still drawn).

Finish by updating the README game table and suite list, the DESIGN game sections, the ROADMAP
(position, §1 judge items, milestones), the ARCADE-IDEAS inventory and families, a dated
VERIFICATION entry that records only checks actually run and lists what was not checked, and
docs/HANDOFF.md. Commit or push only when the grown-up asks; pushing to main deploys.
```
