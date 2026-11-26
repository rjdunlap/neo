# Owl Walk Home, levels 7 *Our two cards* and 8 *Check the helper* (definition)

*Game `owl-walk` · levels 7 and 8 · school window (level 7 also reaches pre-K) · defined 2026-11-26 on `claude/define-owl-walk-7-8` · [deep dive](../deep-dives/owl-walk.md#proposed-ladder) slice 8. Docs only; **levels 7 and 8 built 2026-11-26**. The dive's sketches are decided: levels 7 and 8 may be defined now, and the pre-K play of level 4 is a person check, not a gate ([decision 8](../deep-dives/owl-walk.md#decisions-for-the-developer), settled 2026-10-23).*

**Fun action and purpose.** Both levels keep the game's goal, *choose the move that helps all of us*, and make the choice a bigger one than level 4's. At level 4 she compares one card across three owls. **Level 7** gives the team two cards at once and asks which card goes to which owl so that together we get the most stones. **Level 8** turns it round: the pet proposes a move ("I will hop pink with the purple owl") and she decides whether to trust it, checking the proposal against the other owls. The learning is comparing and summing distances (K.MD.A.2, 1.OA.B.3, 2.OA.B.2: adding two small hop lengths and comparing totals) and **checking a proposal rather than accepting it**, in the spirit of "the pet is learning too". There is still no clock, no race and no owl that wins.

**Overlap checked.** Level 4 picks the owl for one card, so it never asks for a sum or for a plan across two cards; level 7 does. Frog Hop and Number Bonds add numbers, but not from a board whose distances change with every card. Sink or Float and Seesaw Balance own the "guess, then see" pattern; level 7 borrows only its unscored first guess. Level 8's pet-as-learner voice is the same helper idea as Helper House, with no shared code.

## Level IDs and play order

IDs are appended, never renumbered (5 and 6 are built). Two new modes, `pairs` (level 7) and `check` (level 8), are added to `OwlMode`, and two entries to `PLANS`:

- **Level 7:** `{ mode: 'pairs', owls: 3, colors: 4, stones: 16, twinkle: false, safeCards: false, name: 'Our two cards: give each card to a different owl so that together we hop the most stones' }`.
- **Level 8:** `{ mode: 'check', owls: 3, colors: 4, stones: 16, twinkle: false, safeCards: false, name: 'Check the helper: the pet says a move; tap the check if it hops the farthest, or the owl that does' }`.

Both use level 4's board (three owls, sixteen stones, four colors) so the path, art, counted hops and fly-home rule are all reused. `LEVELS` gains a `school` window, placed with the built `order`: `school: { min: 4, max: 8, order: [4, 7, 8] }`, and pre-K becomes `prek: { min: 2, max: 7, order: [2, 3, 6, 4, 7] }`, so level 7 is the new top of pre-K and level 8 is school only. `bands` gains `'school'` (the lands test checks every land page still fits one screen at every band: run it). No saved level or pin moves, and neither new level is an `entryLevels` entry. Both are not couch levels (Owl Walk has no couch route).

If another level takes 7 or 8 first, these take the next free IDs and this page's numbers are read as names.

## Level 7: Our two cards

1. **The board.** As level 4: three owls on different stones (never all home), the path, and the nest. Two cards are turned face up in a row at the top, each at least 120 by 160 units, drawn as the color card is drawn today (the existing card art). The pet says "Two cards. Give each one to a different owl."
2. **Giving a card.** She taps a card (it lifts and glows) and then an owl. The card's small copy sits beside that owl, and a **preview** appears at once: a dashed arc from the owl to the stone it would reach with that card, with the count ("3") beside it. Touch-down gives feedback immediately. Tapping the other card and the other owl does the same. Tapping a placed card, or giving it to a different owl, moves it, and nothing is ever lost or charged for rearranging. Both cards cannot go to one owl: tapping an owl that already holds the other card swaps them.
3. **The sum.** Once both cards are placed, a total appears over the board ("5 stones together") and a green **go** lily (140 by 140) pulses. Until then it is dim.
4. **Go.** If the total is the best (below), the two owls hop one after the other, each counted aloud (the existing counted hops; the first card's owl hops first, so a second owl whose preview was a stone the first now stands on lands on the next free stone, and the preview already shows this). The pair is then done, and two new cards turn. A round is complete when all three owls are home (as level 4); a pair is drawn only while at least two owls are still walking (with one owl left, the cards turn singly and the owl takes the first, the same rule as the last-owl case in level 4).
5. **Not the best.** A pair that is not best does not hop. The pet says both totals ("That is 4 together. Purple and brown can get 7") and the cards stay on the table, free to move. That is one miss. After two misses in a pair the best assignment glows (one hint, below); a third go is accepted as the best by the pet (the pet places the cards where the glow was, and the hop plays, assisted).
6. **Unscored first guess.** The first pair of the round is **unscored**: its go always hops what she placed, the pet says the totals for her pair and for the best ("You got 5. The best was 7, with purple and brown"), and no miss or hint is charged. From the second pair on the judging above applies. A round can hold only that one pair (if both owls fly home and the third walks on alone), so a round with no scored pair reports 0 misses and 0 hints, which steps up on two such rounds; only the first pair of the level's first round of a play session is unscored, and every later pair is scored, so that cannot repeat for long. (Accepted, as Light Lab 7.)

## The rule (`logic.ts`)

- `assignTotal(path, spots, [cardA, cardB], [owlA, owlB])` applies `hop` for A's owl and then B's owl with the first hop's landing already in `spots`, and returns the stones forward of both (an owl that flies home counts the stones to the nest, as `hops()` already does).
- `bestPairs(path, spots, cards)` is the set of assignments of the two cards to two different walking owls that reach the greatest total, over all ordered assignments (at most 6 with three owls). **Every best pair is accepted.** Ties count the same, so the decision is a sum, never a guess at the game's order.
- `pairCards(plan, rng, path, spots)` draws two **distinct** cards such that the best total beats the worst total by **at least 2** stones (so the choice matters) and the best pair is not obvious from one owl alone (the best pair does not hand both cards to the same owl; if no owl pair meets this, it redraws up to ten times, then falls back to any distinct pair, as `drawCardFor` falls back). It uses the seeded `rng`, and a redraw never uses unseeded randomness.
- Every card is a color card (as level 4); shapes belong to level 6.
- `previewFor(path, spots, card, owl)` returns the landing stone for the dashed arc and its count, and equals `hop()` (tested).

## Level 8: Check the helper

1. **The proposal.** A card turns. The pet (drawn large, as the helper) lifts one owl and says "I will hop pink with the purple owl." The proposed owl glows and a small speech bubble shows the card and the owl. At the bottom: a green **check** lily (140 square, reads as an agreement, never as a score) and, on the board, the other owls remain tappable.
2. **She decides.** Tapping the **check** agrees. Tapping a different owl says "Better with this owl" (no more steps). There is no timer, and the choice is free until she commits with either tap.
3. **What follows.** The chosen owl then needs its stone as in level 4: tap its stone or the nest (the same stone judgment as level 4 and its counted hop). The proposal changes only who is chosen.
4. **Proposals.** The pet proposes the **best** owl in about half the turns and a **not-best** owl in the others, with at least one of each in a round and never the same kind four times in a row (the proposer is `proposalFor(plan, rng, path, spots, card, wantBest)`, seeded).
5. **Judgment.** The final owl is judged exactly as level 4 judges the owl step: it is a miss unless it is in `farthest()` (ties accept any). So: agreeing to a best proposal, or changing to another best owl, is right; agreeing to a worse proposal is a miss, and so is changing a best proposal to a worse owl. After a miss nothing hops: the pet says both numbers ("Oops, purple goes 2. Brown goes 5. Check again."), and her choice stays open. The words differ by what she did, so each says what the helper learned: "Ooh, I was wrong, purple only goes 2" (she agreed with a worse move, then sees it) or "Good checking! Mine goes 4 and yours goes 5" (she corrected the helper and was right; this turn is never a miss) or "Mine was the best this time, purple goes 5; yours goes 3" (she changed a best proposal; one miss).
6. **Hints and accounting.** Two misses in a turn glow the best owl (one hint, `hintCharge` as everywhere); a third makes the pet take the best owl's hop itself, assisted. Reaching the nest by any accepted route is independent success when no hint was charged; assisted completion is as everywhere.

## Misses, hints and stepping

Both levels count misses and hints deliberately through `src/progress/coach.ts`: the unscored first pair of level 7 reports nothing; a pet-chosen hop after the third miss is `hints += 1`, never mastery. They are the top of their windows, so two smooth rounds step nowhere and two struggling rounds step down to level 4 (school) or level 4 (pre-K, from 7). A round's sticker is the usual one per round, with help or without.

## Voice, how-to and bot

- **Voice (`voice.ts`):** the new fixed lines ("Two cards. Give each one to a different owl.", "That is {n} together. {names} can get {m}.", "I will hop {card} with the {owl} owl.", "Good checking!", "Oops, {owl} goes {n}.", "Check again.") carry their color, owl and number words through the existing slot approach (the numbers 1 to 16 are already spoken for counted hops), so **no voice clip must be rendered** in the build; fixed lines that cannot be slotted are spoken by device speech until a render run. `howto.ts` adds a level-scoped step for each (`from: 7`, `from: 8`) and the existing steps stay scoped `to: 6`. `describeLevel` reads the plan names.
- **Bots:** `autotouch()` for level 7 places the best pair from `bestPairs` (the first by order), taps go, and for level 8 taps the check when the proposal is in `farthest()` and the best owl otherwise, then the stone, as level 4 does. The demonstration budget is 75 s: level 7's four to six pairs at two cards each fit a round of at most 14 taps per pair; the build session names the measured time and shortens the pause between hops if it is over.

## Screen and controls

Every control is at least 100 units after scaling: cards 120 by 160, lilies 140 square, owls at their existing level 4 reach, stones at their existing reach. Portrait phone: the two cards sit in a row above the board, the **go** or **check** lily bottom centre, the guide and pet clear of the owls. Previews are `Graphics`, tracked and destroyed with the pair and in `destroy()`. A tap that misses every target is a soft tick, never a miss.

## Rule tests

- Over 200 seeds of every kind of board: `bestPairs` is non-empty and equals a brute-force check of every ordered assignment; every pair it returns reaches `max assignTotal`, and no other assignment does; a pair that is not in `bestPairs` has a lower total.
- `pairCards` always returns two distinct color cards whose best total beats the worst by at least 2 (when the board allows it, else the documented fallback), is deterministic for a seed, and never draws a pair with no walking owl for either card.
- `previewFor` equals `hop()`; `assignTotal` with one card equals the `hops()` entry for that owl; a swap of the two owls' cards gives the totals that `assignTotal` reports.
- `proposalFor(…, true)` is always in `farthest()`, `proposalFor(…, false)` never is, and a board with no non-best owl (every walking owl ties) says so (the plan then proposes the best, and the test pins it).
- A round of level 8 contains at least one best and one non-best proposal when the board allows it; a final owl in `farthest()` is never a miss and one outside always is.

## Check tier

Each build is a new interaction on an existing game: typecheck, the rule tests (subagent `rules-tester` where available), `BROWSER_SUITE=shortlist` filtered to Owl Walk (the build session names the filter) with one wrong answer and one hint per level, one portrait phone screenshot each, and `fingerdemo` at the new level. `npm run build` only if shared files change; the lands test runs because `bands` gains `school`. No couch, no offline run.

## Open decisions and defaults

1. **Which level first.** Default: level 7, then level 8 in its own session (they share the board and `bestPairs`-style helpers, but level 8's new interaction is small once level 7 exists). Alternative: one session for both; it would exceed a bounded slice.
2. **Pre-K reach of level 7.** Default: level 7 is also the top of pre-K, so a child who has mastered level 4 sees it. Alternative: school only. A person check on a pre-K child's play of 4 and 7 (never a gate) is [parked](../DEVICE-CHECKS.md).
3. **Whether the unscored first pair reports nothing.** Default: yes, as Light Lab 7 and Sink or Float. Alternative: score every pair; it would punish the first look.
4. **Pet proposing wrong on purpose.** Default: about half the time, with the pet's words saying it is learning, never mocking her answer. This is the point of the level; a phone playtest note on how it feels is welcome, never a blocker.
