# Picture Bytes, Pixel Pictures levels 11–12 (definition)

**Levels 11–12 built 2026-11-11 (level 11 [PR #1503](https://github.com/rjdunlap/neo/pull/1503), level 12 [PR #1506](https://github.com/rjdunlap/neo/pull/1506)); to build anything further, read “The levels”.** Defined 2026-11-11 as slice H6 of the [how-computers-work study](../deep-dives/subjects/how-computers-work.md#build-slices-in-order) ([packet](../deep-dives/subjects/RECOMMENDATIONS.md#how-computers-work-recommendations), [the brief](../deep-dives/subjects/how-computers-work.md#picture-bytes-and-memory-desk-bounded-follow-ups)). It is a mode of [Pixel Pictures](../games/pixel-pictures.md) ([dive](../deep-dives/pixel-pictures.md)), not a new game, as decided on 2026-10-23. Levels 1–10 keep their IDs, plans, pictures and behaviour; nothing is renumbered. The study's later rungs (two keys for the same bits; the weights 4, 2, 1 beside three bits) are named under [Later rungs](#later-rungs-not-defined-here) and are **not** defined here.

**Fun action and purpose:** flip four big cards between 0 and 1, press the arrow, and watch the cards turn into a row of squares, left to right. Learning goal: the same row can be written two ways, as squares or as ones and zeros, and a stated key turns one into the other exactly; a whole picture is only its rows, written one after another. It is exposure to the idea of a representation, not arithmetic: no decimal totals, no place values, no sums.

**Framing.** *Picture Bytes* is the docs' working title only. A byte is eight bits and a row here is four, so the words *byte*, *binary*, *code*, *file*, *ASCII*, *Unicode* and *pixel format* are never spoken or shown; the game says "ones and zeros", "cards", "row" and "key". The key is this toy's own, and the game never says a real computer stores a picture this way. It is not secrecy either (the Decoder Ring seed owns ciphers).

## The key and the order

One key, drawn on a key card that stays on screen for the whole round:

| Card | Square |
| --- | --- |
| 1 | filled |
| 0 | empty |

- **Within a row:** left to right. The first card is the row's left square, the fourth its right square.
- **Within a picture (level 12):** rows from the top to the bottom.
- The filled colour is the picture's one colour (the copy levels' colours); the key is about filled or empty, never about which colour.

Examples the rule tests pin, from the built one-colour 4 by 4 pictures (`PICTURES[4]`):

| Picture | Row 1 | Row 2 | Row 3 | Row 4 |
| --- | --- | --- | --- | --- |
| a heart | 1010 | 1111 | 1111 | 0110 |
| a little tree | 0110 | 1111 | 0110 | 0110 |
| a smile | 1001 | 0000 | 1001 | 0110 |
| a boat | 0100 | 0110 | 1111 | 0110 |
| a plus | 0100 | 1110 | 0100 | 0000 |

## The levels

| Level | Name (`describeLevel`) | What she does | A round |
| --- | --- | --- | --- |
| 11 | Ones and zeros: flip four cards to write one row of squares | Match one reference row with four cards | 3 seeded rows |
| 12 | Ones and zeros, a whole picture: write each row with four cards | Write a 4 by 4 picture row by row, top to bottom | 2 seeded pictures of the 5 above (8 rows) |

**Level 11, one row.** A reference strip of four squares ("make this row") sits above her own strip, which starts empty; under them are the four cards, all showing 0. She flips cards, may press the arrow to see what the cards say, and presses the check when she thinks the strips match. The three rows of a round are distinct, drawn with the seeded RNG from the 15 rows that have at least one filled square (0000 is left out here because the cards already say it), each in a seeded colour. A right row slides up to a shelf, so at the end three strips sit together.

**Level 12, a whole picture.** The little picture to write is the model beside the board (as on the copy levels), with an arrow and an outline on the row in hand. The 4 by 4 board is a preview, never touched: only the four cards and the two buttons are active. The cards start at 0000 for every row. A right row stays on the board in its colour with its four digits printed beside it, and the marker moves down one row; after the fourth row the picture is revealed and named by the existing reveal (`pixel.reveal`), with all sixteen digits still beside it. An empty picture row (a smile's second row, a plus's last) is a real case: 0000 is right as the cards stand, and she checks it without a flip.

## Screen and controls

- **Bit cards.** Four cards in a row, each at least 120 wide and 140 tall, showing a large **0** or **1**; the 1 face is also tinted and raised, the 0 face pale and flat, so the state never rests on one cue. Touch-down presses the card at once; the tap (`onTap`) flips it with a tick, a low note for 0 and a higher pentatonic step for 1. Any flip clears her decoded strip (level 12: the row in hand), so the screen never shows a row the cards no longer say.
- **The arrow (decode).** A round button (radius 60) with an arrow pointing from a card to a square. It reads the cards left to right in a short scene-owned run: each card pulses with its note and its square fills, or shows a brief hollow outline for a 0, so a zero visibly does something too. Free, any number of times. A flip during the run ends the run and clears the strip; no tap waits on speech or on the animation.
- **The check.** A green check button (radius 60, `checkIcon`, as level 10's Done). It runs the same decode first, so the comparison is always between two rows she can see, then compares with the reference row.
- **The key card and the reference** are drawn, not touched (`eventMode = 'none'`). No run numbers appear on these levels: the board has no clue margins, so a row of digits is never mistaken for levels 4–6's counts.
- **Layout.** One pure `bitsLayout(level, view)` in `logic.ts` returns the rectangles for the cards, the two buttons, the strips or board, the model and the key card, or `null` rather than shrink a target. Wide (1024 × 768 and wider): strips or board at the centre-left, model and key card in a column at the right, cards under the board, the two buttons at the right of the cards. Upright (the 768 × 1024 area and taller): model and key card along the top clear of the Home corner, the board under them, the cards in one row under that, the two buttons in the bottom row right of the pet corner. The board is a preview, so its squares may be smaller than 100 units (not below 64, so the picture still reads); the cards and buttons never go below 100. The game's `upright` flag is not changed by this definition; the layout test below covers the upright views for these two levels.
- **Feel:** code-drawn Pixi shapes in palette colours and the game's existing `STYLES.paint` music.

## Accounting, help and finishing

- **Never a miss:** flipping a card, pressing the arrow, repeating the instruction, opening the how-to.
- **One miss:** a check whose cards differ from the reference row, however many cards differ. The first card that differs, reading left to right, and its square in the reference wobble once, and the pet says what that square wants: `pixel.bits.differ.fill` or `pixel.bits.differ.empty`.
- **Hints:** every second failed check on a row is one hint. The first differing card glows until she flips it; if a card is already glowing and she has not flipped it, the hint flips it for her and says so (`pixel.bits.set`). Help never ends a row: the check does, so a helped row is still finished by her tap.
- **Finish:** the existing `finale`: one ordinary sticker through `ctx.finish({ misses, hints, creation })`, helped or not. Level 12's creation is the last finished picture in the existing shape (`{ kind: 'picture', size: 4, pixels }`), kept only on request like every other level's. Level 11 passes no creation: a single strip is not a square picture, and no storage field is added for it.
- **Adaptation:** the shell rule, with only failed checks as misses. Looking with the arrow before checking is the intended habit, so a careful child steps up; the grown-up text calls these levels a first look at ones and zeros, not mastery.

## Bands and order

- **`school`** becomes `{ min: 3, max: 12, order: [3, 4, 5, 6, 7, 8, 11, 12, 10] }`. The two levels sit after 8 and away from 4–6 so digits-as-a-key and digits-as-counts are never neighbours; level 10 stays last, where a free round's smooth result cannot step past it.
- **`preschool`** and **`prek`** are unchanged. No band is added; the land stays Painted Canyon and its page is unchanged (no new game).
- **Plans.** `PLANS` gains positions 11 and 12 (`mode: 'bitsRow'` and `'bitsPicture'`, `size: 4`, `colors: 1`), so `planFor` needs no reserved gaps. `entryLevels` keeps `[9]`: a birthday or pin carrying her into school still lands on 3 (rule-tested).
- Saved levels and pins keep their IDs. The other packets that will add Pixel Pictures levels (AM7, MM7) take the next free IDs after these.

## Rules (`logic.ts`) and rule tests (`logic.test.ts`)

`encodeRow(row)` gives four booleans from a picture row (`.` is 0, any colour letter is 1); `decodeRow(bits, colour)` gives the row back; `encodePicture` and `decodePicture` apply them to the rows in order; `firstDiffer(bits, target)` is the leftmost card that differs or `null`; `makeBitRows(rng)` draws level 11's three rows; `bitTouch(...)` is the ghost finger's next touch.

- **Round trips:** `encodeRow(decodeRow(b))` is `b` for all 16 rows, the empty and the full row included; `decodePicture(encodePicture(p))` is `p` for each of the five pictures.
- **Order:** the table above holds digit for digit (card `i` is column `i`; row `j` is the `j`th group of four); reversing a row or the row order changes the result for an asymmetric fixture (the boat).
- **Check:** passes only when all four cards agree; 0000 against an empty row passes with no flip; one failed check is one miss whatever the number of differing cards.
- **Help leads somewhere:** from each of the 16 card states to each of the 16 targets, `firstDiffer` followed by a flip reaches the target in at most four steps and never touches a card that already agrees.
- **Ghost finger:** from 0000 it flips exactly the cards the row needs, left to right, then the arrow, then the check, and never makes a failing check; on an empty row it presses the arrow and the check only.
- **Seeds and pools:** the same seed gives the same rows, colours and pictures; level 11's rows are distinct and never 0000; level 12 draws two different pictures from five one-colour 4 by 4 pictures.
- **Bands:** `levelsInOrder(rangeFor(LEVELS, 'school'))` is the order above; the younger bands' orders, the plans of levels 1–10 (mode, size, colours, count, name) and the entry level are unchanged; `describeLevel` covers 11 and 12.
- **Layout:** `bitsLayout` at every view the lands test uses and at `UPRIGHT_VIEWS`: every card and button at least 100 units, inside the view, clear of the pet and the corner buttons, cards in left-to-right order with no overlap.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()`, the same taps a player uses): as the rule test says, through the real cards and buttons.
- **How-to card** (`howto.ts`, steps scoped `{ from: 11, to: 12 }`): "Each card says 1 or 0. A 1 fills a square and a 0 leaves it empty, reading left to right."; "Tap a card to flip it. The arrow shows the row the cards make; looking is never counted."; "Tap the green check when the row matches."; level 12 only: "Write the picture one row at a time, from the top." The `finish` line gains "on the ones-and-zeros levels each row is finished by a right check."
- **Voice lines** (`voice.ts`, `pixel.bits.*`; no templates): `pixel.bits.row` (the level 11 instruction: "Each card says one or zero. One fills a square, zero leaves it empty. Flip the cards to make this row, press the arrow to see it, then tap the check."), `pixel.bits.picture` (level 12: "Now a whole picture, one row at a time. Flip the cards for the row with the arrow beside it."), `pixel.bits.differ.fill` ("This square is filled, so its card should say one."), `pixel.bits.differ.empty` ("This square is empty, so its card should say zero."), `pixel.bits.hint` ("Try the glowing card."), `pixel.bits.set` ("I flipped that card. Now tap the check."), `pixel.bits.rowdone` (two variants), `pixel.bits.emptyrow` ("Four zeros make an empty row."), `pixel.bits.done` (level 11's finale: "Four cards, one row. Any row can be written that way!"), `pixel.bits.same` (after level 12's reveal: "Sixteen ones and zeros, and the same picture."). New lines use device speech until a clip run includes them.
- **Registration:** `PixelMode` gains the two modes, `MISS_LINE` their entries, `LEVELS.school` the order above. No new ID, land, band, hub icon or sticker, and no `SaveData` field. `coplayHint` gains one sentence: one person flips the cards and reads the ones and zeros aloud, the other says which squares will fill before the arrow is pressed, then swap. The off-screen line is unchanged; a paper decoding card is the study's slice H9, behind its named review. `node scripts/content-barrels.mjs` and `npm run game-docs` as usual.
- **Couch:** none.

## Overlap

- **Levels 4–6 and Picture Logic** read digits as run lengths; here a digit is one square. Kept apart by the order above, by showing no clue margins, and by the key card.
- **Little Loom 6's lift cards** (a [visual-art](../deep-dives/subjects/visual-art.md) proposal) pass their overlap test only with a striped warp and weft; on solid colours a lift card is this level, as that study says. Nothing here changes that test.
- **Sorting Machine** owns signals through gates; **Memory Desk** (H8, not defined) owns stored state. Neither encodes a picture.

## Slices and check tier

1. **H7, level 11 *Ones and zeros*** ([batch pixel-pictures 5](../GAME-BATCHES.md#pixel-pictures-5-ones-and-zeros); new interaction on an existing game). Files: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `bits.ts` (the `BitsRound` mode), `voice.ts`, `howto.ts`, `docs/games/pixel-pictures.md`. Checks: typecheck; unit tests (the rule tests above with the registry, lands and how-to tests); one filtered scripted play of level 11 to its sticker with one failed check and the glow (the `woods` suite's Pixel Pictures cases); one upright screenshot at 390 × 844; `fingerdemo` at 11; `npm run build`, since voice, how-to and the level table change.
2. **Level 12 *A whole picture*** ([batch pixel-pictures 6](../GAME-BATCHES.md#pixel-pictures-6-a-whole-picture), after 5; new levels on the interaction batch 5 builds): typecheck, the rule tests, one browser play of level 12 with an empty row and a kept picture, `fingerdemo` at 12.

Not run in this definition: everything but `node scripts/check-links.mjs` and `git diff --check`.

## Later rungs (not defined here)

- **Two keys:** the same four cards read through two shown keys (for example filled/empty and two colours), so the same digits make different rows. An authored toy key, as the study says; it takes the next free level ID when defined.
- **Weights 4, 2, 1** beside three cards, only if it teaches representation and not a sum puzzle; the study's caution stands.

## Open decisions

Each has a default the build uses.

1. **Where the levels sit for school.** Default: after 8, before the free level 10. The alternative, right after 3, reaches every school child sooner but puts digits-as-squares next to level 4's digits-as-counts.
2. **Row order at level 12.** Default: fixed, top to bottom, with a marker. The alternative, tapping any row to choose it, adds a control and loses the "one row after another" reading.
3. **Cards between rows.** Default: back to 0000 for each row. Keeping the last row's cards would reward changing only what differs, but makes a repeated row (a heart's two full rows) a bare re-check.
4. **Names on the grown-ups' page.** Default: "Ones and zeros", with *Picture Bytes* kept as the docs' title only.
5. **Review.** The building session checks the spoken lines and the card against the study's cited sources, under the [October 23 rules](../archive/DECISIONS-2026-10-23.md#standing-rules), in place of a named CS educator.
