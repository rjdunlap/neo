# Ribbon Workshop, Ribbon Cases: level 7 (definition)

**Status: ready to build** as one new-interaction slice on the existing game. To build it, read "The model", "The level" and "Screen and controls"; this is the only level this definition adds.

Defined 2026-11-17 as slice **R5** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order), from its [candidates row](../deep-dives/subjects/fractions.md#candidates-and-fit) and [proposed ladder](../deep-dives/subjects/fractions.md#first-games-proposed-ladder-ribbon-workshop) (the study's "8", renumbered to **7** by the [Ribbon Workshop definition](ribbon-workshop.md#levels)). It is one new level of the existing game `ribbon-workshop`, not a new game. Every [open decision](#open-decisions) has a default the build uses. Docs only: no code, voice line or save field exists yet.

**Fun action and purpose:** two gifts wait on two benches, and one tray of ribbon pieces has to do for both. She taps a gift to work on it, taps pieces onto its bench, and taps the bow when both ribbons are ready. The tray holds exactly enough: one half and four quarters, for two gifts that each ask for three quarters. Then the order changes. One gift now needs a whole and the other a half, the tray is empty, and the only way is to move a piece from one gift to the other. The learning goal is **adding and comparing fractions of one whole under a shared, limited supply**: ¾ + ¾ and 1 + ½ are the same amount of ribbon, the same pieces can be shared out in more than one way, and a plan can be repaired rather than started again (CCSS 4.NF.B.3a–b, adding fractions as joining parts of the same whole and decomposing one sum in more than one way; on the pages the [study's anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) opened).

## References and source check

No new source was opened for this definition. The study's [anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) and [similar-games table](../deep-dives/subjects/fractions.md#similar-games-and-tools) apply. Every fraction in this level is a part of the one spool, which never changes, so the unit-language risk that [Whole Switch](whole-switch.md#references-and-source-check) carried is small here. The building session's source check (the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules)) is to read the [voice table](#voice) and confirm that no line names a fraction of anything but the whole spool and that no line says a correct allocation is the only one.

## Overlap

Checked against `origin/main` at `1a8fd74e` (GAMES entries, the games' `logic.ts`, open definitions).

| Game or level | What it already owns | Why Ribbon Cases is different |
| --- | --- | --- |
| Ribbon Workshop 1–3 | One gift at a time: compose one requested length from its own tray | Two requests draw on one tray at once, so a piece given to one gift is missing from the other, and the second tag is a repair of her own first answer |
| Ribbon Workshop 6, Whole Switch | The whole changes while the amount stays | Here the whole never changes. The requests change and the pieces are shared out again |
| Picnic Pantry 1 (defined, not built) | Choosing which two of three dishes fit one pantry; counted tokens | Also a shared supply, but there she chooses a subset of whole-number orders. Here both requests must be met, the quantities are fractions of a length, and the pieces can be exchanged with the scissors |
| Pet Kitchen sharing levels | Cutting one food into equal shares | Equal partition of one object. Here the two shares are built from unlike pieces and need not be made the same way |
| Seesaw Balance, Fruit Sums | Equal totals with whole numbers | No fractions and no shared stock |

**Identity:** a level of Ribbon Workshop, as the study recommends. It reuses the spool as the declared whole, the piece cards, the scissors, the bow, undo, the gift and the two-tags-one-sticker round.

## The model (`logic.ts`)

All lengths are whole numbers of ticks with `TICKS = 4` to the whole, as in levels 1–3: a half is 2 and a quarter is 1. Nothing is compared in pixels. The level has its own state. It reuses `Piece`, `HALF`, `QUARTER` and the snip rule, and it does not use the single-bench `RibbonState`, `Workbench` or `solve`.

- **Constants:** `CASES_STOCK = [2, 1, 1, 1, 1]`: one half and four quarters, 6 ticks. `CASES_FIRST = [3, 3]`: both gifts ask for three quarters. `CASES_CHANGES = [[4, 2], [2, 4]]`: the two changed orders, a whole and a half, one each way round. `RAIL_CAPACITY = 4`: a bench holds at most one whole.
- **State:** `{ tray: Piece[], rails: [Piece[], Piece[]], active: 0 | 1 }`, with stable piece IDs, and an undo stack of exact earlier states. `active` is the gift she is working on; it starts at 0 (the top gift).
- **Actions:**
  - `select(rail)` makes that gift the active one.
  - `place(pieceId)` moves a tray piece to the end of the active rail. A place that would pass `RAIL_CAPACITY` is refused and changes nothing.
  - `return(pieceId)` moves a placed piece from either rail back to the end of the tray. It does not change `active`.
  - `snip(pieceId)` replaces a tray half with two quarters in the same tray position, as at levels 2–3. A placed half cannot be snipped; it has to come back to the tray first.
  - `undo()` restores the state before the last select, place, return or snip.
  - `check()` judges both rails.
- **Verdicts from `check()`:** each rail is `short`, `long` or `right` against its own request.

  | Verdict | When | Counts |
  | --- | --- | --- |
  | `empty` | both rails are empty | nothing |
  | `right` | both rails are `right` | finishes the tag |
  | `wrong` | anything else | one miss |

  Equality is `sum(rail) === request` for each rail, independent of the order of pieces and of how the amount was made. **Every allocation with both totals right is accepted.** No piece can be on two rails, because a piece is in exactly one list.
- **Tags:** a round is two tags over one stock.
  - **Tag 1, *Two gifts*:** requests `[3, 3]`, the whole stock in the tray, both rails empty.
  - **Tag 2, *The order changes*:** the rails keep her accepted tag-1 allocation and the tray is empty (tag 1 uses every tick). The requests become one of `CASES_CHANGES`, chosen by the round's seed. The undo stack is cleared, so undo never reaches back into tag 1.
- **Solver:** `casesSolve(state, requests)` is a breadth-first search over select, place, return and snip, and returns the shortest action list to a state where both rails are right. Among equally short lists it prefers fewer returns, then no snip, then the top rail, then tray order. `casesHint(state, requests)` is the first action of that list, or the bow when both rails are already right. Because the search starts from the current state, it works from the pieces still in the tray and the pieces already placed, which is the study's "hint searches residual inventory".
- **Changed-request check:** `casesFeasible(stock, requests)` is true when some allocation of the stock, with snips, makes both requests. It is the guard on `CASES_CHANGES`: a changed order is only ever issued if it is feasible, and the rule tests prove that every issued change is solvable from every state tag 1 can end in.

### What the enumeration says

Counted by a throwaway script from these rules (pieces of the same size treated as alike):

- Tag 1 has 61 reachable arrangements of the pieces (122 states with the active gift). Three allocations are accepted:

  | Top gift | Bottom gift | Scissors |
  | --- | --- | --- |
  | a half and a quarter | three quarters | not needed |
  | three quarters | a half and a quarter | not needed |
  | three quarters | three quarters | the half is snipped |

  From the start, the shortest route is six actions and the bow. From any reachable state it is at most seven and the bow.
- Tag 2 starts from one of those three. For both changed orders and all three starts, the repair is **return one quarter from the gift that shrinks, then place it on the gift that grows**: two actions when the growing gift is already active, three when it must be selected first, then the bow. It never needs the scissors. Each tag-2 case has up to three accepted allocations (for a whole and a half: a half and two quarters with two quarters, four quarters with the half, four quarters with two quarters); when she snipped the half in tag 1 only the all-quarters one is left.
- Of the 16 pairs of requests from a quarter to a whole, the stock can make 13: every pair that totals 6 ticks or fewer. The three that total more (¾ with 1 either way round, and 1 with 1) are infeasible and are never issued.

### Why the change moves both tags

The study asks for a repair "after one request changes". With this stock that cannot be a real repair: tag 1 uses every tick, so a single tag that grows is infeasible, and a single tag that shrinks is fixed by taking pieces off that one gift without touching the other. The change is therefore **one order card that moves a quarter's worth of request from one gift to the other**, keeping the total at 6 ticks. The repair then has to cross between the gifts, which is the point of the level. See [decision 1](#open-decisions).

## The level

| Level | Name | The frozen case | What it adds |
| --- | --- | --- | --- |
| 7 | *Ribbon Cases* | Stock: one half and four quarters. Tag 1: both gifts ask for ¾. Tag 2: one gift asks for 1 and the other for ½, with her tag-1 ribbons still on the benches and an empty tray | Two requests share one tray. More than one sharing is right. A changed order is repaired by moving a piece, because ¾ + ¾ and 1 + ½ are the same amount |

There is one case. The seed varies the tray order, the ribbon colours and which gift grows in tag 2, never the quantities. As with Whole Switch, this is one idea to meet and return to, not a drill.

**Numbering and bands.** Level IDs 4 (Three halves) and 5 (Five sixths) stay reserved and undefined. Level 7 is appended: `LEVEL_IDS` becomes `[1, 2, 3, 6, 7]` and the school entry becomes `school: { min: 1, max: 7, order: [1, 2, 3, 6, 7] }`, so two smooth rounds at Whole Switch step up to it. Saved levels and pins at 1, 2, 3 and 6 are untouched.

**The older registration** (the study left this to R5). Whole Switch and Ribbon Cases stay in the one registration, `ribbon-workshop`, in Counting Cove. The game gains the `grownup` band with its own short ladder: `bands: ['school', 'grownup']` and `grownup: { min: 6, max: 7, order: [6, 7] }`. A person of 13 or older then starts at Whole Switch and steps up to Ribbon Cases, and never has to play the three composing levels first; a grown-up can still pin any level. This is the pattern Hat Band and Block Garden already use (a child's land, a `grownup` range over the top levels). Nothing moves to Lantern Lake, since a game is in exactly one land, and Counting Cove's page does not change at any band: a grown-up already sees this game there today, played at `school`. No grown-up-only presentation is added; the shell's ordinary speech settings apply. See [decision 2](#open-decisions).

**No persistent inventory.** The stock is a constant. It is dealt whole at the start of every round and at every restart of tag 1, and nothing carries from one round to the next: no saved pieces, no leftover ribbon, no supply that runs down or builds up between rounds, no `SaveData` field. Tag 2 uses the pieces of the same round's tag 1 and nothing else. A piece is never lost: at every moment the tray and the two rails together hold exactly 6 ticks, and a rule test asserts it.

### First round

Two gifts, one above the other, each with a tag reading ¾. The spool above shows one whole. The top gift is lit. "Two gifts. Each tag says three quarters. One tray for both. Tap a gift, then tap pieces for it."

1. She taps the half, then a quarter. They unroll on the top bench: "A half." "A quarter."
2. She taps a third piece. The top bench is now a whole, past the gift. She taps the bow. It is a miss: the extra quarter on the top bench flashes, and the gap on the empty bottom bench flashes. "Not yet. Look where the ribbons flash."
3. She taps the extra quarter on the top bench and it goes back to the tray. She taps the bottom gift: "The bottom gift." She taps three quarters, then the bow: "Yes! Three quarters and three quarters. One has the half in it and one is all quarters."
4. Tag 2. An order card slides in and the tags flip: the top tag now reads 1 and the bottom tag ½. "The order changed. The top gift needs one whole now. The bottom gift needs a half. The tray is empty, so move a piece."
5. She taps a quarter on the bottom bench. It goes back to the tray. She taps the top gift, then the quarter, then the bow: "Yes! One whole and a half."
6. Both ribbons tie round their gifts. "Three quarters and three quarters used every piece. One whole and a half used every piece too. Same ribbon, shared a new way." The round finishes.

## Screen and controls

The design area is 1024×768 and the width is always at least 1024. One whole is **560 logical units**, as at levels 1–3: a half is 280 and a quarter 140. Both benches start at x = 110, under the spool's left edge, so a whole ends at 670.

- **Spool (reference whole):** the 560-unit striped bar labelled "1 whole", above both benches. It is never a control.
- **Benches (two, stacked):** each is a rail one whole long with a dashed outline of its request. Placed pieces sit end to end with a seam mark at each join. **Each placed piece's hit area is its full length × 120 units tall**, so the smallest, a quarter, is 140×120. A tap on one returns it to the tray. The rows are 120 tall with at least 16 between them.
- **Gifts (one at the end of each request outline):** each gift carries its own tag with the written request (`¾`, then `1` or `½`), so the single tag of levels 1–3 is not drawn. A gift with its tag is at least 120×120 and is the control that selects its bench; a tap on the empty part of a bench selects it too. The active gift and bench are lit and the other is dimmed a little, never hidden. The widest request, a whole, puts its gift at x = 670–790, clear of the right button column.
- **Order card (tag 2):** a card that slides in beside the spool, showing the two new tags. It is a picture, not a control. When it arrives the two gift tags flip to the new requests and the gifts slide to the new ends of their outlines.
- **Tray (bottom):** the piece cards of levels 1–3, drawn at true length and 110 tall, in rows of at most four quarters' length starting at x ≥ 170, above the pet's bottom-left square. The stock is 6 ticks, so two rows.
- **Buttons (right column, each at least 120×120):** the **bow** (Check), the **scissors** and **undo**, as at levels 2–3. The scissors is the same mode with the same ways out.
- **Instruction:** a tap on the spool's label or the order card repeats the instruction (`ctx.instruct`).
- **Height:** in landscape the builder fits the spool, two 120-unit bench rows and two 110-unit tray rows in 768 units by drawing the spool thinner than at levels 1–3 and dropping the separate tag row. If that leaves less than 16 units between any two rows of targets, the spool's bar moves into the gap between the top controls and is drawn 40 units tall; no target shrinks. Portrait has the same horizontal geometry and spare height, which goes between the benches and the tray.

**Input:** ordinary taps through `onTap`, with touch-down feedback (a card brightens and its end curls, a bench piece lifts, a gift bounces). No drag. Every target is at least 100 units on its short side, which meets the [inherited geometry rule](ribbon-workshop.md#screen-and-controls); nothing here is drawn shorter than a quarter.

**The scene** is its own file beside `switch.ts` (suggested `cases.ts`), using the shared drawings in `art.ts`. It releases its listeners, timers and tweens in `destroy()`.

## Accounting, help and finishing

- **Free:** selecting a gift, placing, returning, snipping, undo, a refused place on a full bench ("No more room on this ribbon."), repeating the instruction, and a Check with both benches empty.
- **Miss:** a `wrong` Check counts one miss for that tag. Each bench that is not right flashes its gap (too short) or the part past its gift (too long). The spoken line says how many benches are wrong, never the missing amount. Checking tag 2 before changing anything is wrong, since neither ribbon fits its new tag, and counts as any wrong Check does.
- **Help:** after the second miss on a tag, one persistent glow appears on `casesHint`'s target (a gift to select, a tray card, a bench piece to return, the scissors, or the bow) and counts **one hint**. It moves with the solver as she acts and never recharges on that tag. The pause sheet's **Show a hint** shows the same glow and counts one hint unless the glow is already up. `GiftTally` already does this accounting.
- **Recovery:** every reachable state on both tags has a solver route, so the glow always points somewhere useful. **Restart** is free and always available: on tag 1 it puts the whole stock back in the tray, and on tag 2 it puts back her accepted tag-1 ribbons under the changed tags. Misses and hints already counted stay.
- **Finish:** each tag completes on `right`. After tag 2 the game calls `ctx.finish({ misses, hints })` with the round's totals. One sticker, also with help. No timer and no count of moves.
- **Adaptation:** the shell's ordinary rule, within each band's order.

## Rule tests (`logic.test.ts`)

1. **Stock and conservation:** the stock is 6 ticks; after any sequence of actions on either tag the tray and the two rails together hold exactly 6 ticks, and no piece ID is in two places.
2. **Tag 1 acceptance:** a brute-force enumeration of every way to share the stock (with and without the snip) between two rails accepts exactly the three allocations in the table above, and `check()` agrees with it on every reachable state.
3. **At least two distinct allocations without the scissors:** the half on the top gift and the half on the bottom gift are both accepted, and each names its composition line correctly.
4. **Changed-request solvability:** for each of the two changed orders and each of the three accepted tag-1 allocations (both values of `active`), `casesSolve` finds a route; it is a return from the shrinking gift and a place on the growing gift, with one select when needed, and uses no snip.
5. **Feasibility guard:** `casesFeasible` is true for exactly the 13 request pairs that total 6 ticks or fewer, false for the other three, and true for every entry of `CASES_CHANGES`.
6. **Hints lead somewhere:** from every reachable state on tag 1, and on tag 2 from every state reachable from every start, following `casesHint` reaches `right`, and each step shortens the solver's route by exactly one. With both rails right the hint is the bow.
7. **Capacity:** a place past one whole on a rail is refused and leaves the state unchanged.
8. **Verdicts:** `empty` only when both rails are empty; `right` only when both totals match; no state with both totals right is `wrong`; equality ignores piece order.
9. **Undo and restart:** undo after any action sequence restores the exact earlier state (tray order, rail order, piece IDs, active gift); undo at the start of tag 2 does nothing; restart on tag 2 returns to her accepted tag-1 allocation under the changed requests.
10. **Accounting:** `empty`, a refused place and a select count nothing; `wrong` counts one miss; the automatic glow counts once per tag; a hint request while the glow is up counts nothing.
11. **Seeded rounds 0–199:** the quantities never vary, both changed orders appear, and levels 1–3 and 6 produce the same rounds for a seed as before this level existed.
12. **Registration:** `LEVELS.school.order` is `[1, 2, 3, 6, 7]` and `LEVELS.grownup.order` is `[6, 7]`; a saved or pinned 1, 2, 3 or 6 is unchanged by `clampLevel` at `school`; every voice line the level names exists in `voice.ts`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch`, `touchDemo`):** follows `casesHint`: tray cards for the top gift, the bottom gift, its cards, the bow, then on tag 2 a quarter on the shrinking gift, the growing gift, the quarter and the bow. It finishes the round unaided.
- **How-to card (`howto.ts`), level 7 only:** goal: "Make both gifts' ribbons from one tray of pieces. Then the order changes, and you fix it without any new pieces." Steps: "Tap a gift to work on it." "Tap a piece and it joins that gift's ribbon." "Tap a piece on a ribbon to take it back." "Tap the scissors, then a half, to snip it into two quarters." "Tap the bow to check both ribbons." "When the order changes, move a piece from one gift to the other." Finish: "Two orders, one sticker." Note: "There is more than one right way to share the pieces. Three quarters and three quarters is the same amount of ribbon as one whole and a half." The existing level 1–3 and level 6 entries keep their ranges.
- **Co-play:** unchanged (it shows only at the lap and toddler bands, where this game is not offered). **Off-screen**, appended to the game's line: "For Ribbon Cases, cut a strip into a half and four quarters, make two three-quarter ribbons, then turn them into a whole and a half without adding any paper."
- **Registration:** `describeLevel(7)`: "Ribbon Cases: two gifts share one tray; make three quarters twice, then repair it when the order changes to a whole and a half". Bands and levels as in [the level](#the-level). Skills, land, music, icon and sticker are unchanged. No journal entry.

### Voice

These lines go in `src/games/ribbon-workshop/voice.ts`. Every fraction named is a part of the one spool.

| ID | Line |
| --- | --- |
| `ribbon.cases.ask` | Two gifts. Each tag says three quarters. One tray for both. Tap a gift, then tap pieces for it. |
| `ribbon.cases.rail.top` / `.bottom` | The top gift. / The bottom gift. |
| `ribbon.cases.full` | No more room on this ribbon. |
| `ribbon.cases.wrong.one` | One ribbon is not right yet. Look where it flashes. |
| `ribbon.cases.wrong.both` | Not yet. Look where the ribbons flash. |
| `ribbon.cases.made.split` | Yes! Three quarters and three quarters. One has the half in it and one is all quarters. |
| `ribbon.cases.made.quarters` | Yes! Three quarters and three quarters, all in quarters. |
| `ribbon.cases.change.top` | The order changed. The top gift needs one whole now. The bottom gift needs a half. The tray is empty, so move a piece. |
| `ribbon.cases.change.bottom` | The order changed. The bottom gift needs one whole now. The top gift needs a half. The tray is empty, so move a piece. |
| `ribbon.cases.done` | Yes! One whole and a half. |
| `ribbon.cases.both` | Three quarters and three quarters used every piece. One whole and a half used every piece too. Same ribbon, shared a new way. |

Reused as they are: `ribbon.piece.half` and `.quarter` on a place, `ribbon.empty`, `ribbon.snip.*` and `ribbon.hint`. `ribbon.cases.ask` is the tag-1 instruction and the `change` line is the tag-2 instruction (`ctx.instruct`).

## Check tier

The build is a **new interaction on an existing game**: typecheck; unit tests (this game's rule tests plus the registry, lands, how-to and voice tests, since the game gains a band); one filtered scripted play, `BROWSER_SUITE=ribbon` extended with a level 7 case (an empty Check, a `wrong` Check, a second `wrong` Check that brings the glow, a refused place on a full bench, tag 1, then tag 2 by a return, a select and a place); one portrait screenshot of tag 2 with the order card; and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ribbon-workshop` at level 7. `npm run build` only if a shared file changes. No `world`, couch or offline suite.

### Expected files

`src/games/ribbon-workshop/{logic.ts, logic.test.ts, index.ts, cases.ts, art.ts, voice.ts, howto.ts}`, the `ribbon` case in `scripts/browser-check.mjs`; at closeout the game page (`npm run game-docs`), this file's status line, the fractions study, STUDY-BACKLOG, READY and a verification entry.

## Open decisions

Each has a default the build uses. None waits on the developer.

1. **The change moves both tags.** Default: one order card changes ¾ and ¾ into a whole and a half, as [explained above](#why-the-change-moves-both-tags). The alternative, changing one tag only, is either infeasible or a repair that never touches the other gift.
2. **Older registration.** Default: the same game and land, with a `grownup` ladder of levels 6 and 7. The alternatives were a separate grown-up game in Lantern Lake, which would duplicate the scene for no new play, and leaving the game `school` only, which makes a grown-up play three composing levels to reach the two levels the study aims at them.
3. **The scissors stay.** Default: the snip is available, as at levels 2–3, so the all-quarters allocation is a third accepted answer. Removing a tool she has already learned would need its own explanation. The cost is that a snipped half cannot be joined again, so after an all-quarters tag 1 only one tag-2 allocation is left; it is still solvable in the same two moves.
4. **A piece moves through the tray.** Default: a tap returns a placed piece to the tray and a second tap places it on the active gift. The alternative, a direct move between benches, needs a drag or a third mode.
5. **An untouched Check on tag 2 is a miss.** Default: it is a deliberate Check of two wrong ribbons. Whole Switch's free `same` verdict does not apply, because that statement was true and these totals are not.
6. **One case.** Default: the frozen stock and the one mirrored change. A second stock, mixed numbers past one whole, or a third gift is each a later appended level with its own definition, and waits on Three halves (4) for lengths past a whole.
7. **Review.** Default: the building session's source check of the voice table, per the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules).
