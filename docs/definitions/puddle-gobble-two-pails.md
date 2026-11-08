# Puddle Gobble, level 12 *Two pails* (definition)

Defined 2026-11-07 as slice 5 of the [Puddle Gobble dive](../deep-dives/puddle-gobble.md#build-slices-in-order), after its layout probe. **Built:** level 12 (PR #1409, 2026-11-07); this is the only level the definition covers, so a later builder reads nothing further here. Build choices beyond it are in the [game page](../games/puddle-gobble.md#design-notes). It extends the game's [first definition](puddle-gobble.md) and the level 8 and 11 rules described in the [dive](../deep-dives/puddle-gobble.md#the-game-today).

**Fun action and purpose:** the beach has two pails, each with its own number. She soaks numbers until the puddle matches one pail, leads it onto that pail to pour it in, and then fills the other pail from what is left. The learning purpose is **planning two exact totals from one set** (1.OA.C.6, adding and taking away within 20, and early partitioning): the first pail can be filled in a way that leaves the second impossible, so the choice now affects what she can do later. That is level 8's Shut the Box dead end ([Similar games](../deep-dives/puddle-gobble.md#similar-games)) spread across two totals. The action is the same steering, soaking and letting go as level 8, plus one new action: pouring into a pail, and tipping a full pail back out.

## The layout probe

`logic.test.ts` › *the beach layout* › *two pails probe* places things the way `beachLayout` does (biggest first, 40 attempts of 400 tries, clear of the pet corner, the puddle's start and each other by 30 units). It adds a second 170-unit pail box directly left of the first, so the two boxes cover `x > f.x1 − 340`, `y < f.y0 + 170`. On 300 seeds, **eight** numbered things (120 across) are placed every time, and every placement still passes the four-view checks (1024×768, 1024×1365, 1366×768, 1180×768). The strip of five 100-unit tokens fits between `STRIP.left` and 40 from the right edge on every view, and its tokens end above the field, so the strip never meets either pail. Both boxes stay in the right half of every view.

The candidates tried while probing (500 seeds each, on the design view; the test keeps only the chosen one):

| Second pail | 6 things | 7 | 8 | 9 |
| --- | --- | --- | --- | --- |
| none (level 8 today) | all placed, 1 attempt at worst | 1 | 2 | 4 |
| **left of the first (chosen)** | 1 | 2 | 3 | 6 |
| below the first | 1 | 2 | 4 | 7 |
| top-left corner of the field | 1 | 1 | 3 | 8 |

All placed every board, so the choice is about reading, not room. Side by side reads as a pair and keeps the left of the field free for steering. The level uses 6 or 7 things, which leaves headroom below the 8 the probe proves.

## The model

- **Board.** `Board` gains `pails?: [number, number]` in place of `pail` at this level (left pail first; distinct, 8–16, at least 2 apart). Things are 6 or 7 distinct numbers 1–9 on the `NUMBER_KINDS`; the puddle starts at 3 or 4. Nothing is held at the start (`held` stays level 11's).
- **State.** `State` gains `filled: (number[] | null)[]`, one entry per pail: the ids poured into it, or `null` while it is open. `soaked` is what the puddle holds now; `left` is what is on the sand.
- **Soak.** The fit rule holds as at level 8 (a number bigger than the puddle is too big yet, never a miss). A soak that would pass the **bigger open pail's** number is refused as `too-much` (an aimed miss, as at 8). The puddle may pass the smaller pail's number on the way to the bigger one.
- **Pour (new).** Leading the puddle onto an open pail (the pail's centre inside the puddle's circle, the same contact rule as things) pours it when the puddle's number equals the pail's: the strip's tokens slide into the pail, the pail fills and shows its number with a tick, and the puddle drops back to its start number with an empty strip. If the numbers differ, nothing moves and the pet says "The puddle is {p}. This pail wants {t}." This is a check she makes, so it is never a miss, and it re-arms only after the puddle has left the pail by 30 units, so steering past never nags. Pouring is explicit rather than automatic at the matching number: with pails of 9 and 11, an automatic pour at 9 would take a puddle she was building towards 11.
- **Let go.** Tapping a strip token lets that thing go back to its place on the sand, free, as at 8.
- **Tip back (new).** Tapping a full pail tips its things back to their places on the sand and reopens it, free and never a miss. This is the undo for a first pail that left the second impossible. A full pail is a tap target that consumes the touch (it does not steer); an open pail's box steers like the sand.
- **Done** when both pails are full. Then the finish line, the tidy row and the sticker run as at level 8.
- **Tokens.** The puddle never passes the bigger pail (at most 16) and starts at 3 or more, so it holds at most 13 more. The four smallest distinct numbers already sum to 10 and the five smallest to 15, so the strip shows at most four tokens, within the probe's five.

## Level 12 and its window

| Level | Name | Band window | What she decides |
| --- | --- | --- | --- |
| 12 | *Two pails* | school (school 5–12, `order` 5, 10, 6, 7, 8, 9, 11, 12) | which numbers go to which pail, so both totals can be made from one beach |

The level is appended, so no saved level or pin is renumbered. Pre-K's window is unchanged. The dive's proposed lap entry, *Splash*, takes the next free number (13) if it is ever approved.

**Authored first round:** start 3; pails **9** (left) and **11** (right); pebbles and shells showing 1, 2, 3, 4, 5, 7. The only way to fill both is 2 + 4 into the 9 and 3 + 5 into the 11. The natural first tries dead-end on sums alone, not on the fit rule: smallest first (1 + 2 + 3) fills the 9 and leaves 4, 5, 7, where no set makes the 8 the 11 needs; 1 + 3 + 4 or 1 + 2 + 5 fills the 11 and leaves 2, 5, 7 or 3, 4, 7, where nothing makes the 9's 6. The 1 is in no way to finish. The 7 can never be soaked: it fits only once the puddle is 7 or more, and then it passes 11, so touching it is the round's `too-much` miss.

**Seeded rounds (the plan filter):** 6 or 7 distinct numbers 1–9, start 3–4, pails as above; every number of a solution fits in smallest-first order when soaked (level 8's `exactSolutions` check, run per pail); **one or two** ways to fill both pails (an unordered split of the things); and **at least one** way to fill one pail that leaves the other impossible. An exhaustive count over 6-number boards at start 3 finds 138 such boards, and 192 with 7 numbers, so 50 tries should never need the fallback (the build's test asserts it over 500 seeds). A build may prefer boards whose dead ends fail on sums alone, as the authored one does; at start 3, 10 of the 6-number boards have one split and two or more dead ends that all fail on sums.

## Accounting, help and finishing

- **Never a miss:** steering anywhere, touching a too-big number, leading the puddle onto a pail with a different number, letting a thing go, tipping a pail back.
- **A miss:** a soak refused as `too-much` (one per thing per round, as at 8).
- **`hintTarget` (two pails).** It searches the state for some way to finish: assign what is on the sand and in the puddle to the open pails so that each fills exactly. In order: if the puddle matches an open pail and the rest can still fill the other, the hint is the pail (`{ pour: i }`). If some finish keeps everything now in the puddle, the hint is the next soak of it, smallest first. If none does, it is the strip token to let go that reopens one with the fewest let-gos (as at 8). If nothing on the strip helps, it is the full pail to tip back (`{ tip: i }`). The glow lands on a pail for `pour` and `tip`.
- **The glow** after two misses or two too-big touches, and **Show a hint** on the pause sheet, are level 8's: each glow counts one hint, once.
- **Finish:** `ctx.finish({ misses, hints })`, one sticker with or without help.

## Rule tests a build adds (`logic.test.ts`)

- The authored board: exactly one split; 1 + 2 + 3 into the 9, and 1 + 3 + 4 or 1 + 2 + 5 into the 11, each leave the other pail impossible; the 7 is never soakable (too big, then `too-much`).
- `pour` happens only when the puddle equals that open pail. It resets the puddle to its start, empties the strip and fills that pail. A mismatched pour leaves the state unchanged.
- `tip` returns exactly that pail's things to `left` and reopens it. `too-much` is measured against the bigger open pail.
- Over 500 seeds: the board is well formed and passes its filter, the same seed gives the same board, the fallback is never used, and the strip never needs more than four tokens.
- From **every reachable state** (enumerable: each of 6–7 things on the sand, in the puddle or in one of two pails, about 16 thousand states at most) on the authored board and 200 seeds, following `hintTarget` (soaks, let-gos, pours, tips) reaches done within 12 steps.
- Levels 1–11 unchanged: their boards for fixed seeds, and the existing filter and hint tests, stay green.
- The layout: the probe becomes the real check, with `inPailBox` covering both boxes at level 12 and `beachLayout` placing 7 things at the four views. The registry, lands and how-to tests pass with the new window and `order`.

## Screen, voice, how-to and ghost finger

- **Pails:** `drawPail` draws the right pail where it is now and the left one 170 units left of it, both with the same art. The open pail the puddle is building towards is not marked, since the choice is hers. A full pail shows a water line, its number and a tick, and lifts slightly on touch-down as its tap feedback.
- **Voice** (`voice.ts`): instruction `gobble.instruct-two-pails`, "Fill both pails. Each pail wants its own number."; `gobble.pail-wants`, "The puddle is {p}. This pail wants {t}." (slotted, so it uses device speech until slotted clips exist); `gobble.pail-full`, "That pail is full!"; `gobble.tip-back`, "Back on the sand." No line ever announces a dead end, since that would answer the planning question.
- **How-to card** (`howto.ts`), scoped `{ from: 12, to: 12 }`: steps "Lead the puddle onto a pail with the same number to pour it in" and "Tap a full pail to tip it back out"; finish "Both pails are full"; note "Going past the bigger pail's number counts as a miss; pouring, letting go and tipping back never do."
- **Ghost finger:** `autotouch()` follows the new hint kinds. It drags the puddle onto the pail for `pour` (a tap on the pail if the straight way is blocked, as now) and taps the pail for `tip`.
- **Co-play:** one person says the number one pail still needs, and the other finds it on the sand. **Off-screen:** share 12 buttons into two cups so that one holds 5.

## Check tier

New interaction (pour and tip back): typecheck, unit tests (the rule tests above, plus registry, lands and how-to), one scripted play of level 12 through `BROWSER_SUITE=puddlegobble` with one refused overshoot, one lead onto the wrong pail, one tip back and one requested hint, played to its sticker; one portrait screenshot at 1024×1365; `fingerdemo` at 12; `npm run build` (voice and how-to change). Device checks to open: whether tipping a full pail back is found without help, and whether an accidental tip while steering past a pail happens on an iPad.

## Open choices (defaults the build uses)

None needs the developer. Each follows the [October 23 defaults](../archive/DECISIONS-2026-10-23.md#decisions): school only, no new land, ordinary accounting.

1. **Pour by leading, not automatically.** Default as above. The alternative, an automatic pour at a matching number, takes a puddle she was building towards the bigger pail.
2. **Either pail first.** Default: either. The alternative, filling the left pail first, removes half the planning.
3. **Tip back by tapping a full pail.** Default as above. If the device check finds accidental tips, the alternative is a small tip button under a full pail (at least 100 units).
