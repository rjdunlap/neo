# Ramp Race: What can we tell? (definition)

Defined 2026-10-22 as slice **Q5** of the [scientific inquiry study](../deep-dives/subjects/inquiry.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/inquiry.md#first-games-proposed-ladder-ramp-race-extensions) row 7. **Not built.**

**Gated:** the build needs levels 5 and 6 first, the [Trial Shelf / One Change](ramp-race-trial-shelf.md) Q4 build. Level 7 reuses their record cards, shelf, `TrialRecord`, replay and two-lane layout, and level IDs are appended in order. Q4 itself waits on [inquiry decisions 1–2](../deep-dives/subjects/inquiry.md#decisions-for-the-developer). Level 7 also needs those two decisions to cover it: its accounting (below) and a school-top window of 1–7. All are listed in [Waiting on the developer](../WAITING-ON-DEVELOPER.md).

**What it adds:** one appended level of `ramp-race` (`src/games/ramp-race/`), level 7.
- Levels 1–6, their IDs and pins, the pre-K 1–2 window and the stated toy model (distance = height × floor glide, in floor marks) do not change.
- It adds no band, land, tile, save field, journal entry, creation slot or couch entry, and no general trial-history engine: a case is exactly two cards.
- Workshop Detective's invented mechanism (Q6) is not part of this level; every result here comes from the public ramp model.

## Fun action and learning goal

**Two cars already rolled, and their cards are on the shelf. What can these two cards tell us?** She picks a picture that says what was different between the runs, and presses go to check it. When both things were different, she then fixes the orange lane so only one thing differs, rolls it, and says again what the cards now tell.

- The goal is to tell a **comparison that isolates one thing** from a **confounded one**, and to say "we can't tell" when both changed. Then she repairs the confounded one into a fair test.
- The claim is about the setups the cards show, so it is always checkable without guessing hidden physics. The conclusion line ("so the floor made the difference") is spoken only after a claim that isolates one thing.
- Anchors are those of the study: NGSS practice 3 (fair tests with controlled variables), practice 4 (analyze and interpret data), 3-5-ETS1-3, and the study's audience U row: distinguish a working design from evidence for a cause, and accept insufficient evidence.

## Band and range (proposal, pending decision 2)

| Band | Today | Proposed with Q4 | Proposed with this level |
| --- | --- | --- | --- |
| `prek` | 1–2 | 1–2 | 1–2, unchanged |
| `school` | 1–4 | 1–6 | **1–7**, plain `min..max`, so no `order` is needed |

`describeLevel(7)`: *What can we tell? Read two cards: did one thing change, or both? Then make it fair.*

Older players (13+) get no route here; the study's older route is Workshop Detective (Q6, after decision 3). This level adds no `grownup` band entry.

## A round: two cases

`makeTell(rng)` gives a round of **two cases, exactly one confounded and one controlled**, in seeded order. Each case is an ordered pair of setups, card A (blue, top) and card B (orange, bottom), always with **different stops**.

| Pool | Pairs | Rule |
| --- | --- | --- |
| **Confounded** | 17 | Height *and* floor differ. The 18 such unordered pairs minus the one tie, `{3, carpet}` and `{2, wood}` (both 3 marks) |
| **Controlled** | 18 | Exactly one differs: 9 height-only (each floor, three height pairs) and 9 floor-only (each height, three floor pairs) |

- Six confounded pairs have the **shorter ramp going farther** (for example `{4, carpet}` 4 against `{2, ice}` 5). These are the cases where "the taller ramp did it" is visibly not what the cards show; the pool keeps them at their natural share, no weighting.
- Which setup is card A is seeded too, so the farther car is not always on the same card.
- **The first round of the study's example:** the confounded case first, A = `{2, carpet}` (2 marks), B = `{4, ice}` (10 marks).
- Identical setups never appear. A repeated deterministic run is not independent evidence; a repeat case belongs to a later reviewed definition, as the study says.

## A case, step by step

1. **The cards arrive.** The lanes are hidden. Both cards slide onto the shelf and replay once (each card's mini car slides from its ramp to its flag, level 5's replay), with the landing note. `ramp.tell.ask` is instructed: "Two cars rolled. What can these cards tell us? Tap a picture, then press go."
2. **Pick a claim (free).** Three **claim tiles** sit under the shelf. Each pictures a pattern of difference, so none needs reading:

   | Tile | Picture | Spoken on touch | Claim |
   | --- | --- | --- | --- |
   | Floors | Two identical mini ramps on two different floor swatches | `ramp.claim.floor`: "Only the floors are different." | `'floor'` |
   | Ramps | Two different mini ramps on identical swatches | `ramp.claim.height`: "Only the ramps are different." | `'height'` |
   | Both | Two different ramps on two different swatches, with a question-mark bubble | `ramp.claim.both`: "Both are different, so we can't tell which one did it." | `'both'` |

   - Touching a tile selects it (a lift and an outline) and speaks it. Touching another moves the selection. Selecting is never a miss.
   - Touching a card replays it, free.
   - Go with nothing selected says `ramp.tell.pick`, a nudge.
3. **Check (go).** `changed(a, b)` is the truth: `'floor' | 'height' | 'both'` (never `'none'` for a shown pair). The claim is right exactly when it equals `changed`. One claim is right for every pair, so the truth table is complete and finite.
   - **Right, controlled pair:** sparkle and the conclusion, `ramp.tell.floor` ("So the floor made the difference: {floor} let it go farther.") or `ramp.tell.height` ("So the ramp made the difference: the {what} ramp sent it farther."). The case is done.
   - **Right, confounded pair:** sparkle and `ramp.tell.both` ("Yes! Both changed, so we can't tell. Let's make it fair."). Go to step 4.
   - **Wrong:** described under [Misses, hints and glow](#misses-hints-and-glow-proposal-pending-decision-1).
4. **Repair (confounded cases only).** The tiles hide and the two lanes appear, as on level 6: **lane A is card A's setup, locked** (tapping it says `ramp.keepblue`); lane B starts at card B's setup. `ramp.tell.fix` is instructed: "Change the orange lane so only one thing is different, then press go."
   - There is **no sign**: she chooses what to test by what she changes. Any lane B that differs from A in exactly one thing is fair, so **four fair repairs** are accepted (two other heights on A's floor, two other floors at A's height).
   - Go is the Check: identical lanes say `ramp.same.tell` ("Both lanes are the same now. Change one thing."), a nudge. A pair that still differs in both is a miss. A fair pair rolls both cars.
   - **Card B is replaced:** the old card B slides off, and the new orange stop becomes the new card B. Card A stays: it is the same setup as lane A, so it is still a true record. The lanes hide and the tiles return.
5. **Claim again.** `ramp.tell.again` is instructed: "What can the cards tell us now?" Steps 2–3 repeat on the new pair, which is always controlled, so the right claim is whichever thing her repair changed, and the conclusion line follows. The case is done.

After two cases, `ramp.done.tell` ("Two puzzles solved! You know when we can tell, and when we can't."), then `ctx.finish`.

**What she decides:** which claim the cards support; whether to say "we can't tell"; which thing to test and which value to try; when the pair is ready to Check.

## Misses, hints and glow (proposal, pending decision 1)

The study's principle holds: **selecting a claim, replaying cards, editing lane B and nudges are free**. Only an explicit Check (go) can miss.

| Event | Counts |
| --- | --- |
| Select or reselect a tile, replay a card, tap the locked lane, go with no tile, go on identical lanes | Free |
| Go on a wrong claim | 1 miss, a boing and the why-line below. The card parts the line names pulse on **both** cards (the mini ramps or the swatches), drawn in the existing `glow` graphic |
| Second wrong claim in one claim step | The right tile glows and `ramp.tell.hint` ("This picture matches the cards. Tap it, then press go."). **1 hint, once per claim step**. Further wrong claims still miss, without restacking the glow |
| Go on a repair that still differs in both | 1 miss, a boing, `ramp.unfair.tell` ("The ramps and the floors are both still different. Make one of them match the blue lane.") |
| Second such Check in one repair | The lane-B control `tellRepair` names glows, `ramp.fairhint` (existing). **1 hint, once per repair** |

**The why-line** (`claimWhy(claim, actual)`) always names a part where her claim and the cards disagree, so it points somewhere useful without saying which tile:

| Claimed \ actual | `floor` | `height` | `both` |
| --- | --- | --- | --- |
| `floor` | — | `ramp.why.floorsame`: "Look at the floors. They are the same." | `ramp.why.rampsdiffer`: "The floors are different. Look at the ramps too." |
| `height` | `ramp.why.rampsame`: "Look at the ramps. They are the same." | — | `ramp.why.floorsdiffer`: "The ramps are different. Look at the floors too." |
| `both` | `ramp.why.rampsame` | `ramp.why.floorsame` | — |

- **Most help in one round:** a controlled case gives at most 1 hint; a confounded case at most 3 (first claim, repair, second claim). So a round has at most 4, and two hints are already a struggling round under the shared rule.
- **Help still finishes:** a round finished with help ends normally, with one sticker.
- **Adaptation:** with three tiles a guesser misses often, so a zero-miss round is better evidence than level 5's two cards. Level 7 is the proposed school top, so stepping up does not apply; stepping down to 6 follows the shared rule.
- **Not proposed:** the study suggested that help could make and run a fair pair by itself. This packet keeps the level-6 pattern instead (glow the part to change, she touches it), so the repair is always her action and the bot shows the same touch. Recorded here as a deliberate narrowing.

## Layout (frozen; the view is at least 1024 × 768 in every orientation)

Level 7 reuses Q4's shelf (two 460 × 104 cards at x w − 500 to w − 40, y 36–140 and 152–256), home (62, 62), `?` (62, 160), pet (74, h − 18), Go (r 60 at w − 80, h − 80), and level 6's two lanes at 0.42h / 0.78h for the repair.

- **Claim tiles:** three tiles, each **200 × 150**, gap 30, total 660 wide, centered at x = w/2, top at y = 300. At 1024 × 768 that is x 182–842, y 300–450.
  - Clear of the shelf (bottom 256), home and `?` (x < 120), the pet's corner (x < 200 only below y ≈ h − 220 = 548), and Go (x ≥ w − 140, y ≥ h − 140).
  - Portrait (about 1024 × 1365) and wide phones use the same coordinates; tiles stay centered.
- **Tiles and lanes are never shown together.** In claim steps the lanes, ramps and cars are hidden and inert; in a repair the tiles are hidden and inert. The top lane at 0.42h would otherwise overlap the tiles.
- **Inside a tile:** two mini ramps over two swatches drawn with the card's own ramp and texture art (carpet dots, wood lines, ice facets), so tiles and cards share one visual language. The question-mark bubble on the Both tile is a drawing, not text.
- Q4's pure `shelfLayout(view, mode)` gains the `'tell'` mode returning tile rectangles too, so a rule test checks the arithmetic.

**Resize and cancellation:** cases are data (two `TrialRecord`s, the selection, the step); cards, tiles, pulses and glows are redrawn from it on every `resize`. Taps during a slide, replay or roll are ignored (`busy`). No game-owned timer or listener is added.

## Logic (`logic.ts`)

```ts
// RampMode gains 'tell'; PLANS gains, after Q4's entries 5–6 (IDs 1–6 unchanged):
//   { mode: 'tell', rounds: 2, name: 'What can we tell? …' }
export type Changed = 'none' | 'floor' | 'height' | 'both';
export const changed = (a: Setup, b: Setup): Changed;
export type Claim = Exclude<Changed, 'none'>;
export const claimRight = (claim: Claim, a: Setup, b: Setup) => claim === changed(a, b);
export function claimWhy(claim: Claim, actual: Claim): 'floorsame' | 'rampsame' | 'rampsdiffer' | 'floorsdiffer' | null; // null when right
export interface TellCase { a: Setup; b: Setup }
export const CONFOUNDED: TellCase[]; // the 17 pairs, unordered
export const CONTROLLED: TellCase[]; // the 18 pairs, unordered
export function makeTell(rng: Rng): [TellCase, TellCase]; // one of each, seeded order and card order
/** The next lane-B control toward exactly one difference from A; null when already so. */
export function tellRepair(a: Setup, b: Setup): 'ramp' | 'floor' | null;
```

`tellRepair`: when both differ, change the control whose match takes fewer taps on the 3-cycle (a tie matches the floor, making a height test); when identical, the ramp; else null. Matching takes at most 2 taps.

`RampTouch` gains `{ claim: Claim }`. The ghost finger:

| Step | Situation | Touch |
| --- | --- | --- |
| Claim | No tile selected, or a wrong one selected | `{ claim: changed(a, b) }` |
| Claim | Right tile selected | `'go'` |
| Repair | Not exactly one difference | `{ lane: 1, change: tellRepair(…) }` |
| Repair | Exactly one difference | `'go'` |

It never returns null in a step that is not busy, never touches lane 0, and never presses go on a wrong claim or a confounded repair, so a demonstration makes no wrong move.

## Rule tests (`logic.test.ts`)

1. **Existing levels are kept.** `PLANS` has seven entries; 1–6 are unchanged and `planFor(7)` is `tell`.
2. **Pools.** `CONFOUNDED` has 17 pairs, every one `changed === 'both'` with distinct stops, and exactly 6 where the shorter ramp went farther. `CONTROLLED` has 18, 9 `floor` and 9 `height`, all with distinct stops.
3. **Rounds.** Over 200 seeds, `makeTell` gives one confounded and one controlled case, both orders of cases occur, and both card orders occur.
4. **Truth table.** For every ordered pair of distinct setups (72), exactly one `Claim` is right and it equals `changed`.
5. **Why-lines.** For every wrong `(claim, actual)`, `claimWhy` is non-null, and the part it names really is the same (`*same`) or different (`*differs`) in the pair.
6. **Repairs.** From every confounded pair, `tellRepair` reaches exactly one difference in at most 2 taps; from identical lanes in 1. With A fixed, exactly 4 lane-B setups are fair, every one with a stop different from A's.
7. **The bot finishes.** Simulate `rampTouch` through level 7 over 50 seeds, applying touches the way `index.ts` does: each round completes both cases with 0 misses and 0 hints, no non-busy step returns null, and lane 0 is never touched.
8. **Accounting.** Q4's `tally` gains `'wrong-claim'` and `'tell-unfair'` events: *n* wrong claims in one claim step give *n* misses and `min(1, max(0, n − 1))` hints, and likewise for repairs; a whole round never exceeds 4 hints.
9. **Layout.** `shelfLayout` in `'tell'` mode at 1024 × 768, 1024 × 1365 and 1664 × 768: tiles at least 100 units both ways, no overlap with the shelf, home, `?`, the pet's corner or Go.
10. **How-to.** The existing `howto.test.ts` covers wording and length.

## Voice lines (`voice-script.ts`)

| ID | Text | Use |
| --- | --- | --- |
| `ramp.tell.ask` | Two cars rolled. What can these cards tell us? Tap a picture, then press go. | Case start (instruct) |
| `ramp.claim.floor` | Only the floors are different. | Tile touch |
| `ramp.claim.height` | Only the ramps are different. | Tile touch |
| `ramp.claim.both` | Both are different, so we can't tell which one did it. | Tile touch |
| `ramp.tell.pick` | Tap a picture first, then press go. | Nudge |
| `ramp.tell.floor` | So the floor made the difference: {floor} let it go farther. | Right, floor |
| `ramp.tell.height` | So the ramp made the difference: the {what} ramp sent it farther. | Right, height |
| `ramp.tell.both` | Yes! Both changed, so we can't tell. Let's make it fair. | Right, both |
| `ramp.tell.fix` | Change the orange lane so only one thing is different, then press go. | Repair (instruct) |
| `ramp.same.tell` | Both lanes are the same now. Change one thing. | Repair nudge |
| `ramp.unfair.tell` | The ramps and the floors are both still different. Make one of them match the blue lane. | Repair miss |
| `ramp.tell.again` | What can the cards tell us now? | After the repair (instruct) |
| `ramp.why.floorsame` | Look at the floors. They are the same. | Wrong claim |
| `ramp.why.rampsame` | Look at the ramps. They are the same. | Wrong claim |
| `ramp.why.rampsdiffer` | The floors are different. Look at the ramps too. | Wrong claim |
| `ramp.why.floorsdiffer` | The ramps are different. Look at the floors too. | Wrong claim |
| `ramp.tell.hint` | This picture matches the cards. Tap it, then press go. | Claim glow |
| `ramp.done.tell` | Two puzzles solved! You know when we can tell, and when we can't. | Finish |

- `{floor}` is the farther floor's name (*carpet*, *wood*, *ice*); `{what}` follows `ramp.fairyay`'s existing *taller* / *shorter* values.
- Reuses `ramp.keepblue` (Q4), `ramp.fairhint` (Q2) and the existing boing and sparkle.
- The conclusions are true under the stated toy model only; the how-to already names it a toy car and ramp, and no line claims real-world measurement.
- iPad speech of "can't" and the half-mark numbers joins Q4's [device check](../DEVICE-CHECKS.md) when this builds.

## How-to card (`howto.ts`)

The goal line stays *Roll a toy car down a ramp and see how far it goes across the floor.* Added, each `{ from: 7, to: 7 }`; none says "level", "later", "earlier" or "higher":

| Part | Level 7 |
| --- | --- |
| Step | Two cards show cars that already rolled. Tap the picture that says what was different: only the floors, only the ramps, or both. Press go to check. When both were different, change the orange lane so only one thing is different, press go, and say again what the cards show. |
| Finish | The round ends after two puzzles: one where only one thing changed, and one where both did. |
| Note | Choosing a picture, replaying a card and changing the orange lane are free. Pressing go on the wrong picture, or on lanes that still differ in both, is a miss; after two of either, what to tap or change glows. |

About 730 characters with the goal and level name, under the 840 limit. `coplayHint` stays; at this level one person picks the picture and the other checks the cards' ramps and floors before go, then they swap.

## Art, sound, music, couch and rework couplings

- **Art.** Pixi `Graphics` only, reusing Q4's card ramp and swatch drawing for the tiles. No imported art and no `RenderTexture`.
- **Sound.** Q4's landing note on the replay; boing and sparkle as now. Music stays `STYLES.hub`.
- **Couch.** None.
- **Rework.** Fits the [creature-world brief](../rework/README.md)'s Discovery Club, with no hook in this slice: no unlock, collectible, journal discovery or creature reaction.
- **Off screen** stays the current book-ramp suggestion.

## Check tier for the build

New-interaction tier, one session, after Q4's level 6 has merged:
1. `npm run typecheck`, then `npx vitest run src/games/ramp-race src/content/howto src/games/registry`.
2. One filtered scripted play extending the `woods` suite's `ramp` case (`BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=7`): a free tile change, one wrong claim, a second for the glow, the right claim, one confounded repair Check, the fair repair, and the second claim. Misses and hints match `tally`.
3. `fingerdemo` for `ramp-race` at level 7.
4. One portrait screenshot with the cards and tiles up.
5. `npm run build` only if a shared file beyond `voice-script.ts` and `howto.ts` changes.
- Closeout: README row, GAMES.md entry and the how-to card.

**Not established by any check:** whether a child reads the tile pictures as "only this changed", understands "we can't tell" as a good answer rather than giving up, or links the repaired card back to the first claim. These go to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when it builds; an educator wording review of the claims is still recommended (study decision 4).

## References

From the [inquiry study's precedents](../deep-dives/subjects/inquiry.md#similar-games-and-physical-play); not re-opened for this packet, and nothing beyond that study is claimed.

- [Exploratorium, Slow Your Roll](https://www.exploratorium.edu/snacks/slow-your-roll): records of positions as a representation of motion; the source of reading claims from kept records.
- [Zendo](https://www.looneylabs.com/games/zendo): keep the evidence in view and say only what it supports; behind "both still fit" becoming "we can't tell".
- [Sesame Workshop, Little Discoverers: Ramp It Up](https://static.pbslearningmedia.org/media/media_files/46629112-d994-4f61-9d46-f0effb7c121c.pdf): aligned stop records, reused from Q4's cards.

## Developer decisions (in [Waiting on the developer](../WAITING-ON-DEVELOPER.md))

1. **Accounting (inquiry decision 1, extended).** Misses only for go on a wrong claim or a still-confounded repair; one hint per claim step and per repair; tile choices, replays, edits and nudges free.
2. **Window (inquiry decision 2, extended).** School 1–7 with 7 as the school top; pre-K stays 1–2; no 13+ route here.

Nothing else blocks the build beyond Q4.
