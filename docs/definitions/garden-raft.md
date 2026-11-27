# Garden Raft: a Sink or Float level (definition)

Built 2026-11-25 on `claude/sink-float-8` ([PR #2204](https://github.com/rjdunlap/neo/pull/2204)): `raft.ts`, the model in `logic.ts`, art, voice, how-to and the `FOURTH_ONLY=sink8` browser play; the level table above is what shipped. Defined 2026-11-25 as slice 3 of the [engineering-design study](../deep-dives/subjects/engineering-design.md#build-slices-in-order) and as the reserved row 8 of the [Sink or Float deep dive](../deep-dives/sink-float.md#new-levels-on-top). *Garden Raft* is **level 8** of Sink or Float (`src/games/sink-float/`), not a new game. The pond, the water and the splash stay the same. What is new is the first thing she **designs**: where to put floats under a pallet of garden pots so it crosses the pond.

**Fun action and purpose:** a pallet of pots (herbs, a pumpkin) has to cross the pond to the garden on the far bank. She taps floats in under the pallet, then taps Launch. The raft either glides across, sits too low and gets the pots wet, or tips to one side. Then she changes the floats and launches again. The learning goal is the engineering loop: build, test, see why it failed, revise. Two constraints matter, and she meets each one on its own: enough floats to hold the load up (level 7's idea of water pushing back), and floats spread so the load does not tip (Block Tower's balance idea). Anchors:
- NGSS K-2-ETS1-3, comparing two tests of an object to see which works better.
- NGSS 3-5-ETS1-2 and 3-5-ETS1-3, comparing solutions against criteria and improving a design from a test.
- It is the rework's pond-crossing project, kept small (the study's *Candidates* row for Sink or Float 8).

## The stated model (true, and simplified on purpose)

Two rules, each one spoken line and one picture. Every float is the same barrel, every pot shows its weight as 1 to 3 stones in its basket, and there are no numbers to read.
- **Holds up.** Each float holds up two stones. If the stones on the pallet outnumber what the floats hold, the raft sits too low and water comes over. (The level 7 idea: a float pushes aside water, and the water pushes back.)
- **Balances.** The raft tips toward the side that has too much weight to be held up. It stays level only when the pallet's balance point is strictly between the outermost floats. Exactly on the outer float's edge falls, as in Block Tower. The balance point is the weight-weighted average pot position, so a heavy pumpkin pulls it toward itself.

Spoken lines say "each float holds up two stones" and "the heavy side needs a float under it". The balance point is drawn as a small hanging plumb bob under the pallet, shown after a Try so she can see where the weight is. The words *centre of mass*, *buoyancy* and *torque* stay out of her lines.

The how-to card's grown-up note says what the model leaves out:
- Real floats hold different amounts depending on how deep they sink, and real pots slide. Here a float is one fixed size and pots never move on the pallet.
- The raft model checks the whole load's total and its balance point. It does not check each float on its own, so a float far from a heavy pot still counts.
- It is a good first engineering lesson (test, find the failing reason, change one thing). It is not a boat-design course. Build a Boat (level 11) owns load limits on a hull.

## Band, ID and order

School only, as **level 8**: `school: { min: 5, max: 10, order: [5, 6, 9, 7, 8, 10] }`. Level 8 goes after Make it float (7), whose idea it builds on, and before Salty or fresh (10), so the top of school stays 10. Pre-K stays `{ min: 4, max: 9, order: [4, 5, 9, 6] }` and the other bands are unchanged. ID 11 (Build a Boat) stays reserved and now shares this model. `SINK_PLANS` gains a keyed entry `8: { mode: 'raft', count: 3, surprises: false, name: 'Garden Raft: put floats under the pots so the raft crosses the pond' }`, where `count` is the number of rounds (pallets), and `SinkMode` gains `'raft'`. The clamp comment (`ID 8 is reserved`) and `sinkPlan`'s unbuilt-ID doc update: 8 is now built, so only 11 is reserved. Because 8 is now a plan key, `sinkPlan(8)` returns it, and the existing test that expects `sinkPlan(8)` to fall to 7 changes. Levels 1–7, 9, 10, 12, pins and saved levels are unchanged. A saved school level or pin of 8 was previously clamped to 7; it now plays Garden Raft, which is the intent of the reserved ID.

## The model in `logic.ts` (testable, exact integers)

- `RAFT_SLOTS = 6` (slots 0–5, left to right), `RAFT_HOLD = 2` stones per float, and `RaftPot = { slot: number; stones: 1 | 2 | 3 }`.
- `raftVerdict(pots, floats)` with `floats` a set of slot numbers, one float per slot. With `W = sum of stones` and `M = sum of stones × slot`:
  1. **low** if `floats.size × RAFT_HOLD < W`.
  2. otherwise **tip** if `floats.size < 2`, or `M <= min × W`, or `M >= max × W` (`min` and `max` are the outermost float slots). The side is **left** when `M <= min × W` and **right** otherwise (a single float counts as both `min` and `max`), so the report names the side the raft tips toward.
  3. otherwise **ok**.

  Low is checked first, so a raft with both faults reports the sitting-low reason, and the first Try tells her one thing at a time. Cross-multiplying keeps every comparison exact (no floats, no rounding), as Block Tower's eighths do.
- **Rounds** (`RAFT_ROUNDS`, a fixed table; the seed only mirrors a round left to right, `slot → 5 − slot`, so the pattern is not memorised and the verdict is symmetric):

  | Round | Name | Pots (slot: stones) | Floats at the start | Float tray | What it teaches |
  | --- | --- | --- | --- | --- | --- |
  | 1 | The herb tubs | 1:1, 2:1, 3:1, 4:1 | none | 4 | A load of 4 needs at least two floats; both floats on one end tip. |
  | 2 | The big pumpkin | 1:1, 2:1, 4:3 | none | 4 | A load of 5 needs three floats; the pumpkin pulls the balance point to 3, so the floats must reach past it. |
  | 3 | A new pumpkin | 0:1, 1:1, 2:1, then 5:3 arrives | slots 0 and 2, already launched and level for the three herbs | 2 more (4 in all) | Revise: the old raft now sits low and tips toward the pumpkin; add a float under the heavy end. |

  Round 1 has 42 accepted placements and a smallest of two floats. Round 2 has 29 and a smallest of three. Round 3 has 29 and a smallest of three (the start plus one more). The build's tests recompute these counts, so a changed table fails them.
- `raftFix(pots, floats, tray)` returns a smallest set of float changes (adds and moves) that reaches an accepted design, preferring changes that keep the floats she placed. It feeds the hint's glow and the bot. A raft that already passes returns an empty change.
- `raftRoundFor(plan, rng)` returns the three rounds with each mirrored by the seed.

Round 3 has a pre-built raft: slots 0 and 2 carry floats at the start, and the herbs on the pallet make it level. The first thing she sees is that raft crossing (unscored, a short glide), then the pumpkin arrives on the bank and is lifted onto the pallet. This is the **revise** beat the study asks for. She may remove, move or add floats from any slot.

## First round

Three pallets in one scene, in this order. The pond runs across the screen with the garden on the far bank (right in the unmirrored layout) and the pot shelf on the near bank.

1. **Pots on.** "Load the pots on the raft." The pots hop onto the pallet one by one with a soft thunk (not a task: it plays by itself). The pallet rests on the water at the near bank.
2. **Place floats.** "Put floats under the raft, then tap Launch." (`sink.raft-ask`, instructed). Six slots under the pallet each glow faintly. Tapping an empty slot drops a float barrel in from the tray with a bob and a splash. Tapping a float lifts it back out to the tray. This is free: no sound of failure, no cost.
3. **Launch.** Launch is a big button on the near bank. It is live once at least one float is placed, so she can always try. The Try ends one of three ways:
   - **Crosses.** The raft glides to the garden. A plumb bob swings under it and settles within the floats. "It crossed! The floats hold it up and the weight is balanced." (`sink.raft-ok`). The pots hop off into the garden bed and the next pallet starts.
   - **Sits low.** The raft sinks until water washes over the pots, then bobs back up. "The raft sits too low. Each float holds up two stones. Try more floats." (`sink.raft-low`). The stones and the floats stay as she left them.
   - **Tips.** The raft tilts toward the heavy end and the pots slide into the water, then the raft rights itself. The plumb bob shows where the weight is. "It tipped! The heavy side needs a float under it." (`sink.raft-tip-left` / `sink.raft-tip-right`, naming the side). The pots hop back on and she revises.
4. **Revise.** She changes anything and launches again. There is no limit on Tries.

The level finishes through `ctx.finish` after the third raft crosses: one sticker, help or no help.

## Mistakes, hints and accounting

- **A failed Try is an observation, never a miss** (the decided Try-is-free rule from Welcome Ways and Chain Reaction). It gets no boing, only the explanation line. The round always reports `misses: 0`.
- **The glow comes after two failed Tries in a row for the same reason.** The slot where `raftFix` would add or move a float glows (the existing yellow `glow` stroke) and the voice says "Try a float here." (`sink.raft-hint`). This counts as **one hint**, at most one per round.
- **Asking for help.** `askForHint()` (the pause sheet's Show a hint) shows the same glow and line, counting it if the round's hint has not been counted yet. Before any Try it glows the round's first fix; if the raft is already accepted it replays the instruction and counts nothing.
- **Adaptation.** There are no misses, so the coach reads hints only, as Chain Reaction does. A smooth round has no hints. A struggling round has two or more hints (at most one per pallet, so two pallets needed help). Two smooth rounds step her up to 10, the next level in school's `order`. Two struggling rounds step her down to 7.

## Layout and targets

The logical width is never below 1024. Landscape is about 1024×768 and portrait about 1024×1365.
- **Pallet slots.** The six slots span `l = 190` (clear of the bottom-left pet) to `v.w - 40`, each `(v.w - 230) / 6` wide, about 132 at 1024, and 200 tall. Each is a tap target with an explicit rectangular hit area, so every target is above the 100-unit minimum. The pots sit above the pallet, the float barrels hang below it in the water.
- **Launch.** A 170×150 button (the guess-button size) on the near bank, centred at `v.h - 85` in the corner clear of the pet. The tray of unplaced floats shows beside it as barrels with a count (dots, not a number), which is also its own tap target of the same size (tapping the tray places the next float in the next free slot, a forgiving shortcut).
- **Pond and garden.** The garden bank at the far side and the shelf at the near side are decoration. `resize()` lays them out from `view` in both orientations. In portrait the pond gets deeper and the slots keep their width, the extra height goes to sky and water rather than to larger or smaller targets.

## Controller and couch

`sinkFloat` sets `liveController`, so level 8 needs a controller path in island play, as 7 and 10 have. `control()` at level 8 moves a ring over the six slots and the Launch button: left and right move it, the action button toggles a float on a slot or launches. This reuses the `ring` field, widened to seven stops, and `autoplay()` places `raftFix`'s design and presses Launch.

Couch trips and courses name their levels and never use 8, so the couch catalog, `COUCH_IDS`, the unlock tiers and the courses do not change. As with levels 7 and 10, the island-key path is reached only through `controllerLevels`, which couch play never sets to 8. The build verifies the ring by calling `control()` directly and records that a real island key press was not run.

## Couplings the build must handle

- **Keep pots and floats out of `THINGS`.** A new `Thing` would change `ALL_THINGS`, the seeded pools for levels 1–6, the `SINK_LINES` journal record and the journal count. The level 7 clay, level 9 small members and level 10 egg set the precedent: the pot, pumpkin, float barrel and plumb bob get their own art in `art.ts`.
- **Discoveries.** Level 8 files none. A journal entry ("a raft needs floats under the heavy end") is a later candidate that needs its own journal line and test.
- **The constructor.** Raft mode skips `thingsFor`, `pairsFor` and the guess and sort buttons. The `thingsFor` plan loops already skip `'shape'`, `'pair'` and `'salt'`, and they add `'raft'`.
- **`order` and clamps.** Adding 8 to school's `order` changes the step-down target of level 10 from 7 to 8. The existing tests on `SINK_LEVELS`, `sinkPlan` and `rangeFor` change accordingly: `sinkPlan(8)` now returns the raft plan, and school's `order` is `[5, 6, 9, 7, 8, 10]`.
- **Cleanup.** Every float, pot and plumb bob is a stage child or tracked, and tween or timer chains use `ctx.tw` or are guarded against a destroyed scene, as the salt level's.
- **Shared model with Build a Boat.** `raftVerdict`'s low rule (stones against what floats hold) is the model level 11 reuses for marbles on a hull. Keep it a pure function so level 11's definition can call it.

## What the build adds

- Voice lines in `src/content/voice-script.ts`, all slot-free so a later clip render covers them:
  - `sink.raft-ask` (instructed, so the pet repeats it) and `sink.raft-hint`
  - `sink.raft-ok`, `sink.raft-low`, `sink.raft-tip-left` and `sink.raft-tip-right`
  - `sink.raft-next` ("Here comes a new pumpkin!") for round 3's arrival
- `describeLevel(8)` comes from the plan name.
- Sink or Float's how-to card in `src/content/howto.ts` gets lines scoped `{ from: 8, to: 8 }`:
  - steps: "Tap under the raft to put floats in. Tap Launch to see if it crosses." and "If it sits low or tips, move or add a float and launch again."
  - finish: "The round ends when three rafts have crossed."
  - note: "A failed launch is never a miss; after two the best slot glows (one hint). Each float holds up two stones, and the raft tips if the weight is not between the outer floats. This is simpler than a real raft: floats are one size and pots never slide. At home, a foil tray and a few pennies or a plastic tub with coins on one side shows the same two ideas."
- The ghost finger's `autotouch()` at level 8: places `raftFix`'s design, taps Launch, and repeats for each pallet.
- Art in `art.ts`, drawn with `Graphics` and `palette.ts` swatches: the pallet, three pots (one a pumpkin) with stone dots, the float barrel, the plumb bob, the pond banks.
- Sounds from the existing `sfx` set (splash, bob, thunk, sparkle). Music stays `STYLES.bubbles`.
- The README row, the GAMES.md entry and a VERIFICATION entry.

## Rule tests (`logic.test.ts`)

- `raftVerdict`: capacity first (a load of 4 on one float is `low`, not `tip`), a single float under a load it holds is `tip`, outermost-edge equality is `tip`, and a mirror of any float set gives the mirrored verdict.
- Each round has an accepted placement within its tray, and the counts above (42, 29, 29) and smallest sizes (2, 3, 3) hold.
- At least two distinct accepted placements exist in every round, and the naive placement "all floats on one end" fails each one (round 1 `{0,1}` tips, round 2 `{0,1,2}` tips, round 3's start fails with `low` first).
- `raftFix` from every non-accepted placement of every round reaches an accepted design, never needs more floats than the tray holds, and returns no change for an accepted one.
- Round 3's start is `ok` for the herbs alone and `low` for the herbs plus the pumpkin, and the first reported reason follows the precedence rule.
- Every `sink.raft-*` line the level names exists in the voice script.
- `sinkPlan(8).mode === 'raft'`, and `sinkPlan(11)` still clamps to 10. School's `order` is `[5, 6, 9, 7, 8, 10]` and lists only built IDs. The registry, lands and how-to tests pass.
- Levels 1–6: `thingsFor` still draws only from `THINGS`, and `ALL_THINGS` has fourteen entries.

## Check tier for the build

New interaction tier:
- Typecheck, then the unit tests: Sink or Float's rule tests, the registry, lands, how-to and voice tests.
- **One** scripted play at school level 8 through a filter: round 1 with one wrong Try (both floats on one end), a second failed Try for the same reason (the glow, one hint), then the fix, round 2 and round 3's revision to the sticker.
- One portrait screenshot (1024×1365) with a tipped raft, and one landscape screenshot (1024×768), because the pond layout is new.
- `fingerdemo` with `FINGER_ONLY=sink-float`, run at level 8 explicitly, because `fingerdemo` plays only a game's first and last level and 8 is neither.
- Call `control()` directly once for the seven-stop ring.
- `npm run build`, because the voice script and how-to are shared.
- Do not run `couchgames`, because the couch levels' `control()` paths must not change.

## Ownership and what is left out

- **Left out of this level:**
  - per-float limits, float sizes or depths, and pots that slide
  - numbers on stones or floats
  - a plank budget or cost (Build a Boat and the study's later Plaza Cases own budgets)
  - waves, wind or a second crossing
  - a "float count" score
- **Owned elsewhere:**
  - Marbles on a hull and which hull carries more belong to level 11, Build a Boat, which is defined next and reuses `raftVerdict`'s low rule.
  - Balance as a measured idea (a seesaw) belongs to Seesaw Balance and Block Tower.
