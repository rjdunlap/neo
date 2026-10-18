# Seesaw Balance level 11: Two boxes (definition)

Defined 2026-10-18 on `claude/define-seesaw-two-boxes` ([PR #595](https://github.com/rjdunlap/neo/pull/595)) for the roadmap's [short ladders](../ROADMAP.md#short-ladders-in-order) row *Seesaw Balance's unknowns*. Source: the longer-ladder audit's [extend-later row](../archive/IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md#round-two-the-longer-ladders-2026-10-10) ("two different unknown boxes: the first gives the square, then the second uses it") and the [Box Balance](../IDEAS.md#new-ideas-from-the-gap-review) idea, whose one-box and two-step halves are built as levels 8–10 ([GAMES](../GAMES.md#seesaw-balance)). **Not built.** Nothing gates it; the calls below have defaults.

**What it adds:** one appended level of `seesaw-balance` (`src/games/seesaw-balance/`), level 11 *Two boxes*, school only.
- Levels 1–10, their IDs, pins, the toddler–pre-K windows and the `same`/`share` rules do not change. School becomes `{ min: 6, max: 11 }`; no `order` is needed because 11 simply follows 10.
- It adds no band, land, tile, save field, journal entry, creation slot or couch entry. The `seesaw-balance` row in the [deep-dive tracker](../deep-dives/README.md) stays unclaimed: this is one level from the audit, not a full dive.
- Garden Rows' boxes, the other half of the roadmap row, stay undefined: they overlap the couch-only Sudoku Garden and the [island forms of couch puzzles](../WAITING-ON-DEVELOPER.md#decisions-that-block-work) decision.

## Fun action and learning goal

Two boxes that look different and weigh different amounts. First the **square box** is weighed on its own and gets a number tag. Then the square box, a **round box** and some blocks balance a pile of blocks, and she takes the same off both sides as on levels 8–10, with one new idea: the tagged square box is worth its number in blocks, so when it comes off one side, that many blocks come off the other. When the round box stands alone and the seesaw is level, the blocks across from it are its weight.

This is **substitution**, the step after "take the same off both sides": a known quantity stands in for its value inside a second relation (two unknowns, two weighings; in symbols, `s = 3` then `s + r + k = 3 + r + k`). It is the "two different unknowns" the audit left for later and the top of the game's algebra ladder, pitched at about 8–9 as the audit says, which is the school band's middle. The toy model is unchanged and stated plainly: only weight matters, every tray is level, whole blocks only.

## Bands and ranges

| Band | Levels | Change |
| --- | --- | --- |
| toddler | 1–2 | none |
| preschool | 2–4 | none |
| prek | 3–7 | none |
| school | 6–**11** | 11 appended |

A pre-K player carried to level 11 by a pin is clamped by `rangeFor` as today. No younger opening is proposed; the two-box reading alone is not the level's content.

## A round, step by step

`PLANS[10] = { mode: 'pair', rounds: 2, name: 'Two different boxes: read the square box, then take the same off both sides until the round box is alone' }`. One sticker round is **two pairs**; each pair is two `SeesawRound` entries that `makeRounds` pushes together, so `index.ts` walks four rounds through its existing `nextRound` loop.

**Weights, from the seeded RNG:** square `s` from 2 to 4 (fresh against the last pair's `s`), round `r` from 1 to 4 with `r ≠ s`, spare blocks `k` of 1 or 2, and the fixed side chosen as on levels 8–10.

**Step 1, the reading (`phase: 'read'`).** The square box stands alone on one tray and `s` blocks on the other; the seesaw is level and nothing drags. `ctx.instruct('seesaw.pair-first')`: *Two boxes today! First, the square box. It balances these blocks. How many blocks heavy is the square box?* The three answer pads appear at once (`numberChoices(rng, s)`), exactly as `balanced()` shows them on levels 6–10. The right pad writes `s` on the square box's sign (`seesaw.pair-tag`: *The square box weighs {n}. It wears its number now.*); the box keeps that tag for the rest of the pair.

**Step 2, the pair (`phase: 'pair'`).** The trays reload with the usual hop-on: the fixed side holds the tagged square box, the round box and `k` blocks; the other side holds `s + r + k` blocks (at most 10, the same tray capacity level 10 uses). `ctx.instruct('seesaw.pair')`: *Now the round box joins the square box. Take the same off both sides until the round box is alone. The square box counts as {n} blocks!* Then, as on levels 8–10, anything on a tray drags to the ground, with two differences:

- **The round box stays put.** It is the thing being weighed; its drag is disabled and a touch wiggles it and says `seesaw.round-stays` (*That is the box we are weighing. Leave it on, and take other things off.*). Free, never a miss.
- **The tagged square box weighs `s`.** When it leaves and the seesaw tips, the pet says `seesaw.swap-tipped` with `{ n: s }`: *The square box weighs {n} blocks. Take {n} blocks off the other side.* Each block that comes off the other side while the gap is still open says `seesaw.closer` (*Closer! Keep going.*), and the one that levels it says `seesaw.still-level` as today.

Any order works: the `k` block pairs first or the square box first. When the round box is alone on its tray and the other tray holds only blocks, the seesaw is level by construction and `aloneSide()` fires unchanged (the round box is the only box that can still be on a tray, so the lone box is always it). `ctx.instruct('seesaw.round-alone')`: *The round box is alone, and the seesaw is level. How many blocks heavy is the round box?* The pads offer `numberChoices(rng, r)`; the right pad writes `r` on the **round box only** (`answer()` today writes the answer on every box; in `pair` mode it must leave the square box's tag alone), says `seesaw.box` and the pair ends. The second pair follows; the round finishes after it with the shell's one sticker.

**What she decides:** which number the first seesaw shows; whether to clear the spare blocks or the square box first; how many blocks the square box is "worth" when it leaves; when the round box is finally alone; and its weight. Nothing is scored until a number pad is tapped.

## Misses, hints and glow

The levels 8–10 rule stays: **changing the seesaw is experimenting, not answering.** Only a number pad can miss.

| Event | Count | Response |
| --- | --- | --- |
| Wrong number for the square box (step 1) | 1 miss | `seesaw.count-again`, the `s` blocks counted aloud; a second wrong pad glows the right one and counts 1 hint (existing `answer()` behavior) |
| Wrong number for the round box | 1 miss | Same, counting the blocks across from it |
| A change that leaves the seesaw level | Free | `seesaw.still-level` |
| A change that **narrows** the tilt (the gap between the trays shrinks) | Free, and it resets the tip count | `seesaw.closer`; after the tagged box, the first such block says `seesaw.swap-tipped`'s count instead |
| A change that **widens** the tilt or tips a level seesaw | 1 tip, never a miss | `seesaw.tipped`, or `seesaw.swap-tipped` when the thing that left was the tagged square box |
| Two tips in a row | 1 hint, once per pair while the glow is up (existing `!this.hintItem` rule) | `pairHint()` glows one thing (below) and says `seesaw.same-hint` |
| Touching the round box | Free | `seesaw.round-stays` |

`progress(before, after)` in `logic.ts` classifies a change from the tilt before and after it: `'level'` when `after === 0`, `'closer'` when `0 < after < before`, else `'tip'`. Levels 8–10 keep their current rule (every unlevel result counts a tip): there a pair is one thing each side, so "closer" never happens on a right move, and the new classification is used only in `pair` mode. (Default 4 below.)

**The glow (`pairHint(sides, lastOff)`):** let `d` be the heavy side's excess. Among the heavy side's removable things (never the round box), glow the one whose weight equals `d`; otherwise glow a block (a block always narrows the gap). If the heavy side has nothing removable, glow the last thing taken off, on the grass, to put back (`suggest()` already returns the last thing when it should go back). The glow draws in the existing `glow` graphic and takes no touches. Most help in one pair: one glow and one pad glow per question, so 3 hints.

**Adaptation:** two pairs with at most one miss and no hint step up out of 11 (there is nothing above, so they only confirm); four misses or two hints step down to 10. Tips are not misses, so an explorer who tips a lot but reads correctly is not stepped down.

## Logic (`logic.ts`)

- `SeesawMode` gains `'pair'`; `Thing` gains an optional `shape?: 'square' | 'round'` for boxes (the drawing and the voice use it; levels 8–10 leave it unset) and `SeesawRound` gains `phase?: 'read' | 'pair'`.
- `makeRounds` for `pair`: for each of `plan.rounds` pairs, draw `s`, `r`, `k` and the fixed side, then push the reading round `{ fixed: [square(s)], fixedSide, offered: [], across: blocks(s), answer: s, phase: 'read' }` and the pair round `{ fixed: [square(s), round(r), ...blocks(k)], fixedSide, offered: [], across: blocks(s + r + k), answer: r, phase: 'pair' }`.
- `progress(before, after)` and `pairHint(sides, lastOff)` as above; `aloneSide` unchanged.
- `seesawTouch` for `pair`: with pads showing, tap `round.answer`. While tipped, take the heavy side's thing whose weight equals the difference, else **a block from the heavy side** (new fallback: after the tagged box leaves, the difference is `s` and only unit blocks face it). While level and not alone, take a block from the fixed side if one remains, else the tagged square box. So the finger shows the `k` block pairs, then the square box, then `s` blocks, then the pad: `2k + s + 1` drags and two taps per pair. It never touches the round box and never returns null before the pair is finished.

## Rule tests (`logic.test.ts`)

1. **Generation.** Over 300 seeds, every `pair` plan yields `2 × rounds` rounds alternating `read` and `pair`; `s ∈ 2..4`, `r ∈ 1..4`, `r ≠ s`, `k ∈ {1, 2}`; the reading round is level with the square box alone; the pair round is level with `s + r + k ≤ 10` blocks across; both answers are the stated weights and the round box is the only `round` thing.
2. **Every path has the same length.** The goal (round box alone, level) needs exactly `k + 1` removals from the fixed side and `s + k` from the other, `2k + s + 1` in all, in any order; no reachable state with fewer removals is a goal, and the goal is reached by the demonstration order and by the square-box-first order.
3. **Hints lead somewhere.** Enumerate every reachable state (which of the `k + 1` removable things are off, and how many of the `s + r + k` identical blocks are off): from each non-goal tipped state, `pairHint` names a removable thing on the heavy side or the thing to put back, and following hints from any state reaches the goal within `2k + s + 1 + (blocks over-removed)` moves, never widening the gap.
4. **Progress classification.** `progress` returns `tip` when a level seesaw tips or a gap widens, `closer` when it narrows and `level` at zero; taking the square box off then one block off the other side is `tip` then `closer`.
5. **The finger.** `seesawTouch` on every seeded pair plays `2k + s + 1` drags with exactly one `tip` (the square box) and no `tip` after a `closer`, never moves the round box, never returns null before the goal, then answers both pads correctly (extends the existing "demonstrates every mode" test).
6. **Unchanged below.** `PLANS[0..9]` and `makeRounds` for modes 1–10 produce the same rounds as before for a fixed seed (a short snapshot in the test), so the appended level renumbers nothing.
7. **How-to.** The existing `howto.test.ts` scope check passes with the level 10 line bounded `to: 10` and a level 11 line.

## Voice lines (`voice-script.ts`)

New IDs: `seesaw.pair-first`, `seesaw.pair-tag` (`{n}`), `seesaw.pair` (`{n}`), `seesaw.swap-tipped` (`{n}`), `seesaw.closer`, `seesaw.round-stays`, `seesaw.round-alone`. Reused: `seesaw.tipped`, `seesaw.same-hint`, `seesaw.still-level`, `seesaw.box`, `seesaw.count-again`, `count`, `seesaw.done`. "Square" and "round" are the only shape words; the boxes also differ in color, so nothing needs reading.

## How-to card (`howto.ts`)

- Change `{ from: 10, text: … }` to `{ from: 10, to: 10, text: … }`.
- Add `{ from: 11, text: 'First tap how heavy the square box is, and it wears its number. Then take the same off both sides, counting the square box as its number of blocks, until the round box is alone; then tap how heavy the round box is.' }`.
- The goal, finish (`from: 5`) and note hold at 11 unchanged. The card's ghost finger plays the demonstration order above at level 11.

## Layout, art, sound and couplings

- **Round box:** a new `drawRoundBox` in `index.ts`: an orange hatbox (a rounded cylinder with a lid band) from `src/art/palette.ts`, the same footprint as the square box so the tray stacking code is unchanged, with the existing `sign` label for its `?` and number. The square box is today's box with its sign.
- **Tag:** the existing `sign` text; after step 1 it shows `s` for the whole pair. No record card and no second seesaw (default 1): the tagged box is the record.
- **Trays:** at most four things on the fixed side and ten blocks across, both within what level 10 already lays out in portrait and landscape; targets stay at least 100 logical units. The pads and the bottom-left pet clearance are unchanged.
- **Sound:** existing bells and boing; no new synthesis. **Music:** unchanged (`STYLES.stickers`).
- **Journal:** the two balance observations file as today when a tray change shows them; no new entry (default 5).
- **Couch:** none; the game has no couch entry. **Rework:** none; a creature stands in for no friend here, since the level has no friends.

## Check tier

[New levels on an existing interaction](../../AGENTS.md#verification-budget): `npm run typecheck`, `npx vitest run src/games/seesaw-balance` and `src/content/howto.test.ts`, one browser play of level 11 through the Seesaw Balance suite filter (both pairs, one wrong pad, two widening tips to see the glow, the round box touched once) and `fingerdemo` filtered to `seesaw-balance` at level 11. `npm run build` because `voice-script.ts` and `howto.ts` are shared files. **Not established by any check:** whether an eight-year-old treats the tagged box as three blocks on her own, whether the orange hatbox reads as "a different box" and whether the "closer" line helps or chatters; these go to [DEVICE-CHECKS](../DEVICE-CHECKS.md) at the build.

## References

Read from store pages, teacher guides and search summaries on 2026-10-18; none played.

- [SolveMe Mobiles](https://apps.apple.com/app/id977720372) (Education Development Center): shapes hang from beams, and a weight found on one beam is carried into the next. Teachers describe it as building the intuition for subtraction, division and substitution. The two-weighing structure and the carried number come from here.
- [PhET Equality Explorer: Two Variables](https://phet.colorado.edu/files/teachers-guide/equality-explorer-two-variables-html-guide_en.pdf): a balance with `x` and `y`; the guide's challenge is to build a balanced situation, hide the values and have a partner find them. This is the two-unknowns goal, with a seesaw instead of symbols.
- [Hands-On Equations](https://apps.apple.com/us/app/hands-on-equations-1/id505948222) (Borenson): pawns and cubes on a scale, with "legal moves" that take the same off both sides. The level keeps that exact vocabulary of moves and adds one: a pawn whose value is known.
- [DragonBox Algebra 5+](https://dragonbox.com/): isolate the box; every operation happens on both sides. The round box staying put is its "box" rule made physical.
- [Imbalance Problems](https://nationalmathfestival.org/resources/imbalance-problems) (National Math Festival): mobile puzzles where one relation is read first and used in the next, the same two-step reasoning without a screen; a possible off-screen companion.
- [Mobius Academy, Balance Shapes with three beams](https://www.mobius.academy/math/topics/algebra-balance-3-beams-substitution-and-subtraction-compound-answer/2): substitution and subtraction across beams as a multiple-choice drill, which is what the level avoids by keeping every step a physical move.

## Developer decisions (defaults in [Waiting on the developer](../WAITING-ON-DEVELOPER.md#defaults-in-use-block-nothing))

Each has a default the build uses; a different answer changes this file, not the readiness.

1. **One seesaw and a tag** (default) rather than the audit's second seesaw on screen or a record card. The alternative needs a second plank and tray pair in the scene and a smaller layout in portrait.
2. **Step 1 is a reading**, not a level-8 take-off: the square box starts alone against its blocks and one pad tap tags it. The alternative (one block pair to clear first) lengthens the pair and blurs what the level checks.
3. **The round box cannot leave its tray.** The alternative, letting it come off with a put-back nudge, makes a second lone-box end state possible and is not specified here.
4. **"Closer" moves are free only at level 11.** Applying `progress` to levels 8–10 would also stop counting a narrowing move as a tip there; it is a small change to built levels, left for the developer.
5. **No new journal entry.** A candidate, "a known box can stand for its blocks", would need a picture and a line tested against the game's data; not in this slice.
