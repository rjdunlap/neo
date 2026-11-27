# Duck Pond level 16, *Every way* (definition)

*Game `duck-pond` · level 16 · school window · defined 2026-11-27 on `claude/define-duck-pond-every-way` · [deep dive](../deep-dives/duck-pond.md#new-levels-on-top) slice 9. Docs only; not built. The dive's decision 3 was settled 2026-10-23 (two non-empty sides, **ordered**: 3 and 2 is one way, 2 and 3 is another), so this page may be defined now. A child's play of it is a person check, not a gate.*

**Fun action and purpose.** Every other Duck Pond level asks one question with one right answer. This one has many right answers and she finds them all: five ducks wait on one side of the footbridge, she sends some across, and every new split she keeps sparkles into a row of cards ("4 and 1", "3 and 2", "2 and 3", "1 and 4"). The learning is *decomposing a number into two parts in every possible way* (K.OA.A.3), and, through the swapped cards, that the same ducks make the same total either way round (1.OA.B.3, the commutative property). Nothing is a wrong answer: a split she already found is welcome, and a pond with all the ducks on one side is just not a split yet.

**Overlap checked.** Level 10 (*Make ten*) asks for the one missing part of ten; level 11 (*Hiding ducks*) asks for the one hidden part of a total; level 14 (*Doubles*) uses the same bridge to add two sides she is shown. None lets her *choose* the split or asks for all of them. Number Bonds and Seesaw Balance own the one-answer partner questions, and Sorting Machine owns sorting into groups of a rule; this level is the open-ended complement in the pond she already knows. Bubble Pop's and Duck Pond's other sketches (pairs, who was here first) stay separate.

## Level ID and window

IDs are appended, never renumbered (12 and 13 are lap's and toddler's openings, 14 is Doubles, 15 is Ten and some more). A new mode `every` is added to `DuckMode`, and one entry to `PLANS`, as the sixteenth:

```ts
{ mode: 'every', rounds: 4, min: 3, max: 6, split: true }
```

`rounds` counts **totals**: the round's four totals are 3, 4, 5 and 6, in that order, so the first round has two ways to find, then three, four and five (fourteen finds in a level). `min` and `max` are the smallest and largest total. The school window becomes `{ min: 8, max: 16, order: [8, 9, 10, 11, 14, 15, 16] }`; lap, toddler, preschool and pre-K are unchanged. `describeLevel(16)` reads "Every way: send ducks across the bridge and find every way to share 3 to 6 ducks". If another level takes 16 first, this takes the next free ID and this page's numbers are read as names.

The dive's example was five ducks first; this page starts at three so the first discovery is quick (two ways) and the pattern, a row of cards that fills, is learned before the bigger totals.

## A round

1. **The pond.** The bridge stands across the middle as at level 14 (`split: true`, `splitSeats`). All *N* ducks start on the **left** side. The pet says "{n} ducks. Send some across the bridge!" and the first round adds "Find every way!" The sign over the pond reads the live split as numerals, **"N and 0"** at the start, and updates on every move ("4 and 1").
2. **Sending a duck.** Tapping a duck on the left sends it across the bridge (the existing hop) to the free seat on the right nearest the bridge; tapping a duck on the right sends it back. Every tap is allowed: it is how she tries splits. Touch-down feedback is immediate as everywhere, and a duck that is still hopping ignores a second tap (as level 4's ducks do).
3. **Keeping a split.** A **check** (the level 4–5 check, 140 units, lit only while both sides hold at least one duck) keeps the split on the pond. The first keep of a split makes the card: a sparkle, a chime from the pentatonic steps, and a card slides into the row ("3 and 2"). A card shows two small groups of ducks in five-frame order and the numerals, and is never a tap target. The check on "N and 0" or "0 and N" is dim and says nothing is wrong: the pet says "Send some ducks across first!" once and never counts it.
4. **A split already kept.** The pet says "We found that one!" and the card pulses. If the split is the mirror of a kept one ("2 and 3" when "3 and 2" is there), the new card still arrives, and the pet says "Same ducks, swapped sides!" and the mirrored cards glow together for a moment. No miss, no hint.
5. **The row.** Under the pond, **N − 1 faint card outlines** wait from the start, so she can see how many are still to find (never spoken as a count). The round ends when every outline is filled: "That's every way! {n} ducks, {ways} ways!" and the ducks splash. One sticker per completed level, as everywhere; the round's creation is not kept.
6. **No timer, no loss, no required order.** She may keep splits in any order. An empty or full side never counts against her.

## Stuck, hints and accounting

There are no misses to count, so this level reports **misses 0**. Being stuck is two keeps in a row of splits already found: the second one glows **one duck**, the one whose tap moves the pond a step toward the nearest unfound split (below), and counts **one hint for the round**, however often it glows again in that round. If she follows it, keeps, and finds a new way, the round continues unchanged. Level 16 tops the school window, so two smooth rounds (no hints) step nowhere, and two struggling rounds (two hints each, the coach's rule) step down to level 15. Finding all the ways is not mastery of number facts, and a round finished with the glow is supported completion, as at levels 4 and 5.

## The rule (`logic.ts`)

- `everyWay(total)` returns the ordered splits `{ left, right }` with `left + right = total` and both at least 1: exactly `total − 1` of them, `(total − 1, 1)` down to `(1, total − 1)`. A split's key is its right count.
- `keepVerdict(total, right, found)` returns `'none'` (right is 0 or total), `'new'`, `'swap'` (a new split whose mirror, `total − right`, is already found) or `'again'`. `'swap'` is a new split for every purpose except the line the pet says.
- `roundDone(total, found)` is true exactly when `found.size === total − 1`.
- `nextHintMove(total, right, found)` returns `'left'` (tap a left duck to send it across) or `'right'` (tap a right duck to bring it back) for the move that most reduces the distance from `right` to the nearest unfound right count, ties going to the move toward more ducks across. It never returns a move that is impossible (no duck on that side), and it returns null only when `roundDone`.
- `everyTotals(plan)` returns the ordered totals `min..max` (3, 4, 5, 6); there is no randomness in the totals, and the seed varies only which side of the pond the ducks start on (the left in the first round, mirrored by seed in the others, so the bridge crossing reads either way) and the duck's colour as at level 14.
- A pure `crossingSeats(total, left, right)` returns each duck's seat on its side's `splitSeats` rows: ducks sit in first-free-seat order from the bridge outwards, so a returned duck takes the first free seat on the other side and ducks never overlap.

## Voice, how-to and bot

- **Voice (`voice.ts`):** new lines `duck.every` ("{n} ducks. Send some across the bridge!"), `duck.everyFind` ("Find every way!"), `duck.way` ("{a} and {b}!"), `duck.wayAgain` ("We found that one!"), `duck.waySwap` ("Same ducks, swapped sides!"), `duck.wayFirst` ("Send some ducks across first!"), `duck.wayHint` ("Try this duck.") and `duck.wayAll` ("That's every way! {n} ducks, {ways} ways!"). The numbers are slots filled from the existing number words, as levels 14 and 15 do, so **no voice clip must be rendered**; a build session runs `node scripts/content-barrels.mjs`.
- **How-to (`howto.ts`):** a level-scoped card, `{ from: 16, to: 16 }`, that shows a duck crossing the bridge, the check, and a card arriving; the existing `{ from: 11 }` open-ended lines stay bounded to 14–15 as the dive's slice note requires.
- **Bot (`autotouch()` and `duckMove`):** for each total the ghost finger sends one left duck across, taps the check, and repeats until all *N − 1* right counts are kept (ascending, so every keep is one tap from the last): *2(N − 1)* taps a total and 28 over the level. The build session measures `fingerdemo` at level 16 against the 75 s limit and shortens the demonstration (the first two totals shown in full) if it is over.

## Screen and controls

Targets are at least 100 units after scaling: ducks at the level 14 hit radius (53 units, at the same 108-unit spacing), the check at 140. The cards sit in the row where the answer pads sit at other levels, so no new region is needed: five outlines at 120 units wide and 20 apart are 700 wide, inside the 768-wide upright phone and the pet's corner clear; a layout test at the four standard views (landscape and portrait, tablet and phone) asserts that the outlines, the check, the bridge seats and the pet corner never overlap. The cards are display only, so no tap handler is needed on them. Nothing else changes in the pond, the bank or the sticker flow, and a duck mid-hop at a restart or `destroy()` has its tween cleared as at level 14.

## Rule tests

In `logic.test.ts` and `upright.test.ts`: every total 3–6 has exactly `total − 1` ways, none with an empty side, and the ordered pairs (`3 and 2`, `2 and 3`) are distinct; `keepVerdict` returns the four verdicts for hand-built states; `roundDone` is true only when every way is found; `nextHintMove` always names a possible move and, applied, strictly reduces the distance to an unfound split (checked over every found-set of every total); a bot that steps `right` from 1 to `total − 1` finishes each round in exactly `total − 1` keeps; `crossingSeats` keeps seats distinct, inside the pond and clear of the bridge at all counts and views; the plan's `LEVELS.school` order contains 16 and the lower bound stays 8; registry and lands tests pass with the new `describeLevel`.

## Build slice and checks

One session, **new-interaction tier**: typecheck, the duck-pond unit tests above, **one** filtered scripted play (the first total and the last, one keep of "N and 0", one repeat, one swap, one glow, and the round ending on the last card), one portrait screenshot of the full row, `fingerdemo` at 16, and `npm run build` (voice and how-to change). Closeout: the game's page `docs/games/duck-pond.md` (`npm run game-docs`), the dive's slice 9 marked built, a verification entry and coverage row.

**Co-play and off-screen.** Co-play: "How many ways to share your five ducks? Try one more, and tell me which are the same ducks." Off-screen: two bowls and five crackers; share them every way, and lay a card of dots for each.

**Out of scope.** A split of more than six ducks (the seats are fine to eight, but the card row is not); zero as a part (`0 and 5` is deliberately not a way; a grown-up who wants it can ask the pet); counting the ways aloud for her; kept creations or a journal row (nothing here is a discovery about the world); couch play.
