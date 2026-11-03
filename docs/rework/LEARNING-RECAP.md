# RW09: Learning evidence and family recap, the build packet (definition)

[Work item / issue #493](WORK-ITEMS.md#rw09-learning-evidence-and-family-recap) · [PR #1162](https://github.com/rjdunlap/neo/pull/1162) · 2026-11-03 · definition docs-only; slice 1 built 2026-11-03 ([PR #1163](https://github.com/rjdunlap/neo/pull/1163))

## Summary

The welcome project (RW07, [Welcome a New Friend](WELCOME-BUILD.md)) is the pilot. Today a grown-up cannot see what it involved. A finished step's misses and hints go only into that game's ten-round `history`. Nothing there ties a round to the project, and later free play pushes it out. The grown-ups' page has a Windy Picnic line but no project line. RW09's first slice adds three things:

1. **A small learning table** in a new `src/learning/`. For each pilot step and band it states the intention, the subject and whether the step is *checked* (it has a right answer) or *free* (it has none).
2. **One bounded evidence record per step** in `projects.welcome`. It says what happened the last time she played the step, and it is filled in when the step is launched and when it is finished.
3. **A plain-HTML recap** of the project on the grown-ups' page (`src/parent/panel.ts`). The page names what each step asked of her, what happened in words, and an off-screen idea for the family. World rewards appear only as rewards.

Not in the slice: a universal curriculum engine, other games or stories, cross-context claims, scores, and anything the child sees.

## What exists today (audit at `04dcd79f`)

| Fact | Where |
| --- | --- |
| `WelcomeProject` holds `band`, `steps`, `results` (`pretty` picture, `song` tune), `newcomer` and `ended`. It has no misses, hints or launches | `src/content/welcome.ts` |
| Launching a step calls `store.beginWelcome(band)`, which writes only the first time | `src/app/scenes/ProjectScene.ts` `play()` |
| A finished round records `{ level, misses, hints, seconds, at }` in the game's `history` without moving the level (`!this.story`), then calls `store.completeWelcomeStep(step, made)` | `src/app/scenes/GameScene.ts` `finish()` |
| A finished replay replaces a step's result; after `ended`, `completeWelcome` refuses | `completeWelcome` |
| Pet Kitchen counts the two-miss glow as a hint (`hints++` when the second wrong try lands), so "any hint" covers the glow | `src/games/pet-kitchen/index.ts` |
| Stamp Studio finishes with `misses: 0, hints: 0`. Song Maker 2 is free play, and its misses and hints only rise on copy levels | `src/games/stamp-studio/index.ts`, `src/games/song-maker/index.ts` |
| `store.reset()` keeps `profile`, `settings` and `creatures` and empties `projects`. Backup and restore carry the whole `SaveData` | `src/progress/store.ts` |
| The panel has `weekSummary()`, `picnicSummary()` and `offScreenIdeas()`. At the root, Home's held gear opens it (RW08 slice 2) | `src/parent/panel.ts`, `HomeScene.ts` |

## One vocabulary

RW09's acceptance and [WELCOME-ADVENTURE's evidence table](WELCOME-ADVENTURE.md#learning-intentions-and-evidence) name the same states in different words. The build uses these five, and only these:

| Class | Means | Was (WELCOME-ADVENTURE) | When |
| --- | --- | --- | --- |
| `independent` | Did it alone this time, in this task | independent | Checked step finished with 0 misses and 0 hints |
| `supported` | Finished with help | helped | Checked step finished with any miss or any hint (the glow counts as a hint) |
| `creative` | Took part in free making; there is no right answer | free creation | Free step finished |
| `encountered` | Opened the step but did not finish it | unknown (left unfinished) | Step launched, no finished record |
| `none` | Nothing to say | (not covered) | Never launched; shown as *not tried yet*, never stored |

`independent` and `supported` need one condition beyond the counts: the record's level must be the plan's level for the project's band. A record at any other level is dropped on load.

A miss without the glow still counts as `supported`. A wrong try followed by a right one is the boing and spoken hint doing its work. It is not independence.

## The learning table (`src/learning/`)

`src/learning/intentions.ts` is one small typed table keyed by step and band. It is not a mapping for every game:

| Step | Band | Game, level | Subject | Kind | Intention (grown-up wording) |
| --- | --- | --- | --- | --- | --- |
| `pretty` | both | Stamp Studio 3 (preschool), 4 (pre-K) | art | free | makes and arranges a picture by choice |
| `yummy` | preschool | Pet Kitchen 2 | number | checked | shares one whole into four equal parts |
| `yummy` | pre-K | Pet Kitchen 5 | number | checked | doubles each part of a pictured recipe |
| `song` | both | Song Maker 2 | music | free | explores high and low notes in a repeating loop |

A test pins each row's game and level to `WELCOME_PLAN`, so the two tables cannot drift apart. `subject` keeps number evidence apart from art and music. The recap groups by subject and never adds anything up. There are no reading rows, because the pilot has no reading step.

`src/learning/evidence.ts` holds `classify(record, kind, planLevel)` for the table above and nothing else. `src/learning/` imports nothing from the scenes.

## The saved record

`WelcomeProject` gains:

```ts
evidence: Partial<Record<WelcomeStep, StepEvidence>>;

interface StepEvidence {
  /** True once a round of the step finished; false while it has only been opened. */
  finished: boolean;
  /** The last finished round's counts (0 while unfinished). */
  misses: number;
  hints: number;
  /** The level that round played. */
  level: number;
  /** Finished rounds of this step, 0–9. */
  rounds: number;
  /** When it was last opened or finished. */
  at: number;
}
```

The class is derived on read and never stored, so a save cannot hold a class its counts do not support.

**Writes:**
- **Launch** (`store.beginWelcome`, now also given the step): if the step has no record, write `{ finished: false, …zeros, level: plan level, rounds: 0, at }`. A finished record is left alone, so an unfinished replay never downgrades it. The write is batched with the existing first-launch write, and later launches use an ordinary `save()`.
- **Finish** (`store.completeWelcomeStep`, now also given `{ misses, hints, level }` from `GameScene.finish`): write `finished: true`, the counts, the level and `at`, and set `rounds` to `min(rounds + 1, 9)`. This is the same write that completes the step.
- **Replay before the ending:** a finished replay replaces the counts, the same rule as `results`. The recap says "the last time" and how many times she finished the step. Keeping the first result as well would make the recap look like a progress chart, which this slice does not claim.
- **After `ended`:** no writes, as with `completeWelcome`.

**Repair** (`cleanWelcome`):
- Unknown steps are dropped.
- `misses` and `hints` are clamped to whole numbers from 0 to 99, `rounds` to 0–9, and `at` to a finite number that is not negative.
- `finished: true` is dropped unless the step is in `steps`.
- A record whose level is not the plan's level for the project's band is dropped.
- A missing `evidence` field becomes `{}`.

Under the [development-save exception](../../AGENTS.md), older development saves are not migrated. They load with no evidence, and their finished steps show as *finished before the recap existed*. A reset empties the record with the rest of `projects`. Backup and restore carry it, and it belongs to one profile's save.

## The recap

The recap is a **Welcome a New Friend** paragraph and table under **This week** on the grown-ups' page. It is built by a pure `projectRecap(save, name)` exported from a new `src/parent/recap.ts`, so tests can read its string without the DOM. The page is shared, so `classic/` shows it too.

**Who sees what:**
- A preschool or pre-K profile, or one that began the project, sees the table.
- Lap, toddler and school profiles that never began it see one line: "Welcome a New Friend is the first project for preschool and pre-K players. Nothing has been recorded for {name}." The table is never left blank.

**The table** has one row per step in `WELCOME_STEPS` order. Its columns are *What it asks* (the intention), *What happened* and *Subject*. Sample *What happened* lines, with her name filled in:

| Class | Line |
| --- | --- |
| `independent` | "Made four equal plates on her own the last time: no wrong tries, no help." |
| `supported` | "Made four equal plates with help the last time: 3 wrong tries and the glowing hint. Finishing with help is how this is practised; it does not yet show she can do it alone." |
| `creative` (picture) | "Made a picture with 7 stamps in 3 colours. Free making has no right answer, so this shows taking part, not a score." |
| `creative` (tune) | "Lit 9 notes on 4 pitches. Whether she meant a tune isn't known." With no tune kept: "Played the song step; fewer than two notes stayed lit, so no tune was kept." |
| `encountered` | "Opened, not finished yet. Nothing to say about it yet." |
| `none` | "Not tried yet." |
| finished, no record | "Finished before this recap existed; nothing was recorded about how." |

Each pre-K line uses its own intention ("made the recipe twice over"). A step finished more than once adds "(finished N times)". The pronoun comes from the name, never from an inferred gender: the build writes `{name}` wherever the samples say "she" or "her".

**Below the table:**
- "The new friend and the stickers are rewards for finishing, with or without help. They aren't evidence of learning. One round is one observation; doing it in other places and on other days is what would show more."
- One off-screen idea from `offScreenIdeas()` for the step's game at the project's band, or none if that game has no line there.
- The status line: "Project: 2 of 3 steps done" or "finished: {friend's name} joined".

**Wording rules:** AGENTS's grown-up wording rule applies. The recap names what a step asks. It never says mastery, "can now", "brain training", school readiness or an attention or behaviour benefit. Age appears only as the project's band. It shows no minutes or sticker totals, and nothing in it is a score.

## Build slice and checks

**RW09 slice 1** (shell and save tier, one session):

| | |
| --- | --- |
| **Files** | New: `src/learning/intentions.ts`, `src/learning/evidence.ts`, `src/parent/recap.ts` and their tests. Changed: `src/content/welcome.ts` (`evidence`, launch and finish writes, repair), `src/progress/store.ts` (`beginWelcome(band, step)`, `completeWelcomeStep(step, made, counts)`), `src/app/scenes/ProjectScene.ts` and `GameScene.ts` (pass the step and the counts), `src/parent/panel.ts` (place the recap), `scripts/browser-check.mjs` (`welcome` suite). Docs: DESIGN's save and parent rows, README's `welcome` row |
| **Done when** | A preschool profile's recap reads `independent` or `supported` for `yummy` exactly as the counts say, `creative` for `pretty` and `song`, `encountered` for a step left mid-round, and *not tried yet* for an untouched step. A toddler sees the one-line note. Nothing changes for the child |
| **Unit tests** | `classify` for every class and for a level that does not match the plan. Launch writes `encountered` but never downgrades a finished record. A finished replay replaces the counts and adds to `rounds` (capped at 9). Nothing is written after `ended`. Repair (clamps, unknown steps, `finished` without the step, a missing field). Two profiles keep separate records. A backup round trip keeps the record. Every intention row matches `WELCOME_PLAN`. Each `projectRecap` class line appears, and the recap holds none of "mastered", "can now", "brain", "ready for school" or "ADHD" |
| **Checks** | `npm run typecheck`, `npm test`, `npm run build`. Extend `BROWSER_SUITE=welcome`: finish `yummy` with one wrong cut, leave `pretty` mid-round, open the gear, and read the recap's `yummy` (`supported`) and `pretty` (`encountered`) rows. Take one portrait screenshot of the panel. Run the production offline check, because persistence changes. `world` is not needed, because no route changes |
| **Not established** | Whether grown-ups find the recap useful or read it as intended is a person check. Add it to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when the slice is built. No child learning or transfer is established by automation |

## Later, not sliced

- Records for the picnics and later projects, each with its own intention rows.
- Signals the shell does not record today, such as moved stamps or replayed tunes ([WELCOME-ADVENTURE](WELCOME-ADVENTURE.md#learning-intentions-and-evidence)).
- Cross-context observations (the same skill in two games or on two days).
- RW12's school project.

Each needs its own packet. None of them adds a global readiness score.
