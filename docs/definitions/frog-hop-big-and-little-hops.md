# Frog Hop, level 14 *Big hops and little hops* (definition)

*Game `frog-hop` · level 14 · school · defined 2026-11-26 on `claude/define-frog-hop-big-little` · [deep dive](../deep-dives/frog-hop.md#build-slices-in-order) slice 10 (the row 12 of its [new levels table](../deep-dives/frog-hop.md#new-levels-on-top), which was numbered before levels 12 and 13 took their IDs). Docs only; the build is the line in Next ten (claimed 2026-11-26, `claude/frog-hop-big-little`).*

**Fun action and purpose.** The frog is on 47 and a flag stands on 72. Two lily buttons wait at the bottom: a big lily that hops ten and a small lily that hops one. She taps hops until the frog stands on the flag, hearing each landing ("57, 67, 68…"). The learning goal is **how many tens and how many ones make a difference** (1.NBT.C.4 and 2.NBT.B.5: adding within 100 by jumping tens and then ones, the empty-number-line method). Every route that lands exactly is welcome (two big hops and five little ones, or twenty-five little ones); the shortest route is the one the hint shows.

**Overlap checked.** Level 13 *Hop by tens* hops tens along labelled pads and never leaves the tens. Level 6 and the `big` mode hop one number along a labelled line. Here the line has no pads: only the frog's number and the flag are labelled, so the tens are hop lengths, not places. Bubble Pop 14 counts by tens without a line. Ribbon Workshop composes lengths from pieces but not from a start to a target.

## Level ID and play order

`mode: 'hops'`, appended to `PLANS` as **level 14**: `{ mode: 'hops', top: 100, questions: 4, name: 'Big hops and little hops: tens and ones from one number to another, on a line with no pads' }`. If another level takes 14 first, this takes the next free ID and this page's number is read as a name. `LEVELS.school` becomes `{ min: 3, max: 14 }` (it is `PLANS.length`, so it follows), with no `order` and no `entryLevels`: it is the top of the ladder. `describeLevel` reads the plan name. It is not a couch level (the couch catalog skips it, as it skips any level without a `control()` mapping). `hops` is added to `HopMode`; `answerSlot` has no case for it, because its answer is a route, not a pad or a card (see the bot below).

Four questions a round, not five, because a route has up to thirteen taps. `finish` in `howto.ts` becomes "Answer the questions to bring the frog home." (one word changed, no number).

## A round, step by step

1. **The line.** An open line with no pads. It shows a window of the line from the ten at or below the start to the ten above the target, at **12 units per number** (the longest window is 60 numbers, 720 units, the board width; a narrower upright board scales the window by `view` as the other levels do). Marks every ten, unlabelled except by the two labels below. The frog stands on its number with the number written under it; a flag stands at the target with the target written under it. These are the only two numbers on the line.
2. **Two lilies.** At the bottom, a **big lily** (+10) and a **small lily** (+1), each at least 140 by 140 units, side by side, and a **back** lily (an arrow, 110 by 110) beside them. The pet says "Get the frog to 72. Big hops are ten, little hops are one."
3. **A hop.** Touch-down presses a lily at once. The frog hops: a big hop is drawn as a long arc (120 units) and a little hop as a short one (12 units), both to scale on the line, each leaving a faint arc behind so the route stays visible. The voice says the landing number as a numeral ("fifty-seven"). Hops are free and unlimited until the frog lands exactly on the flag.
4. **Back.** The back lily (or a tap on the frog) takes back the last hop: the frog slides to where it was and the arc is rubbed out. It never charges anything and works at any time.
5. **Overshoot.** If a hop lands **above** the target, the frog still lands there (the voice says "Oops, seventy-seven!"), the flag wobbles, and that overshoot is one miss. The pet says "Too far. Tap back." The back lily glows. The next hops from past the flag are allowed, so she can recover with back or by tapping on; a second overshoot in the same question is another miss. Landing below the flag is never wrong.
6. **Landing.** The frog on the flag: the flag waves, the pet says the route by what she did ("Two big hops and five little hops: 47 and 25 more is 72"), counted from the hops still standing, not from a model route. The next question follows. After the fourth, the round ends as every round does.

**Free nudge.** After ten little hops on a question, the big lily pulses once, free (no hint is charged), and the pet says "Big hops are quicker." It pulses once per question and never blocks the small lily.

## Questions (`logic.ts`)

A `HopQuestion` gains no new fields beyond what a route needs: `start`, `target`, `hops` (the distance), `bigs` and `smalls` (the fewest-hops route, so `bigs = floor(hops / 10)` and `smalls = hops % 10`), and a `route` state kept by the scene, not the question.

- `start` 12 to 58 and **not a multiple of 10**; `hops` 11 to 45 and **not a multiple of 10** (so both sizes are needed on the shortest route); `target = start + hops` and at most 100 (a draw above 100 is redrawn with the questions' seeded `rng`).
- The first question is authored: 47 to 72 (`hops` 25: two bigs, five smalls).
- The other three are seeded, distinct in `hops`, with at least one whose ones digit would pass the next ten (for example 47 + 18 = 65, which cross 50 and 60 on the way), so the ones are not always safe. No question repeats the previous question's `bigs`.
- Pure helpers: `routeLanding(start, route)` (the landing after an ordered list of `+10` and `+1` hops), `overshoots(route, target)` (how many hops in the route land above the target), `shortestRoute(q)` (the `bigs` and `smalls` above), `routeWords(bigs, smalls)` for the pet's closing line. Nothing is compared in pixels.
- `padValue` is not used: this level has no pads. The window helper `windowFor` is not used either; a new `openLine(q)` returns `{ lo, hi, scale }` for the shown window.

## Misses, hints and accounting

- **A miss** is an overshoot (above), one per overshooting hop, at most two charged per question (a third overshoot is spoken but not charged, so one wild question cannot bury a round).
- **Show a hint** (the pause sheet's existing `askForHint`) or **two overshoots** in a question makes the big lily glow and plays the shortest route as demonstration hops from the frog's current place ("Two big hops, then five little ones"), without moving her hops. `hintCharge(wrongs, glowing, helped)` is used unchanged with `wrongs` the number of overshoots (so two overshoots charge one hint on the first demonstration, exactly as the other levels). If she is already past the flag, the demonstration starts with a back-up to the start.
- **Back, an unused route and a long route cost nothing.** Reaching the flag by any route is independent success when it took no demonstration; assisted completion is as everywhere (a sticker, no mastery).
- Two smooth rounds step up (nowhere, this is the top of the ladder); two struggling rounds step down to level 13 in the school window.

## Voice, how-to and bot

- **Voice:** landing numbers by the existing numeral speech path (`landingNumbers`-style, as level 13 says tens; the tens and the numbers to 100 are an unchecked device speech item already in [DEVICE-CHECKS](../DEVICE-CHECKS.md)). The fixed lines ("Get the frog to {target}. Big hops are ten, little hops are one.", "Too far. Tap back.", "Big hops are quicker.", the closing route line) carry their numbers through the existing name-slot approach, so **no voice clip must be rendered** (the recent builds did the same; a fixed line that cannot carry its numbers is spoken by device speech until a render run). The how-to line: "Tap the big lily to hop ten and the little lily to hop one. Land the frog on the flag." Its entry is `{ from: 14 }`, and level 13's open `{ from: 13 }` entry is bounded to `{ from: 13, to: 13 }`.
- **Bot (ghost finger and `fingerdemo`):** a new `autotouch` stage reads the question and taps the big lily `bigs` times and the small lily `smalls` times, with the usual 0.8 second gap, then waits for the landing. Its worst case is 13 taps a question and 4 questions, about 45 seconds, inside the 75 second demo budget. `answerSlot` is unchanged.

## Screen and controls

Three buttons in one row under the line, each a real touch target (the big and small lilies 140 square, back 110 square, all above the 100 unit floor after scaling). Upright phone: the line and its window sit in the upper two thirds at the width of the board, the frog and flag large, the lilies in one row at the bottom at the same pitch as the number cards (`CARD_HIT`) on the other levels, with the guide beside them as on levels 5, 7 and 11. The route's faint arcs are `Graphics` drawn once per hop and removed with the hop on back (tracked, destroyed on `destroy()`).

## Rule tests

- Every seeded question: `start` 12–58 and not a multiple of 10, `hops` 11–45 and not a multiple of 10, `target ≤ 100`, `bigs * 10 + smalls = hops`, and the shortest route has `bigs ≥ 1` and `smalls ≥ 1`.
- The first question is 47 to 72.
- `routeLanding` agrees with `start + 10 * bigs + smalls` for any ordering of the hops; `overshoots` of the shortest route in any order is 0; `overshoots` of one extra big hop is 1.
- No question repeats the previous `bigs`; the four `hops` are distinct.
- The window `openLine` always contains `start`, `target` and the ten above `target` (or 100), with width at most 60 numbers.

## Check tier

New interaction: typecheck, the rule tests, **one** filtered scripted play of level 14 (the existing Frog Hop play in the browser suites, filtered to level 14; the build session names it) with one overshoot, one back and one hint, one portrait phone screenshot, `fingerdemo` at level 14, and `npm run build` only if shared files change. No couch run, no offline run.

## Open decisions and defaults

1. **A route that overshoots once more.** Default: a second overshoot is another miss, at most two charged per question (above). Alternative: only the first. Default stands.
2. **Voice for numbers past 20.** Default: numerals through the device speech path, as level 13. A device check on tens words already covers it ([parked](../DEVICE-CHECKS.md)).
3. **Whether small hops at 12 units are readable.** Default: yes at 12 units, thanks to the long arc/short arc contrast; an open person item on the phone, never a blocker.
