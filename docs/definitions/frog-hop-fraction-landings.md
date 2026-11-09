# Frog Hop, Fraction Landings (definition)

Defined 2026-11-09 as slice **R3** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order), from its [candidates row](../deep-dives/subjects/fractions.md#candidates-and-fit) and the [Frog Hop deep dive](../deep-dives/frog-hop.md). It is two new Frog Hop levels on the existing pad and card interactions, not a new game. Nothing is built yet. Every [open decision](#open-decisions) has a default the build uses.

**Fun action and purpose:** the frog's lily pads now sit at quarters of a whole. The sign asks for hops of a quarter, a half or a whole, and she taps where the frog will land; the frog then hops there, each hop as long as its size. In the second level the frog lands on a lily with one hop size, plants a flag, goes back to zero and she chooses how many hops of another size reach the same flag. The learning goal is **fractions as numbers on a line, measured as intervals from zero**, and **equivalent positions**: two quarters land where one half does, and four quarters, two halves and one whole all land on 1 (CCSS 3.NF.A.2a–b, 3.NF.A.3a and 3.NF.A.3c; the [study's anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits)). Only halves and quarters of one whole are used, so the study's math-educator review (for Whole Switch, Window Mosaic and division) does not gate these levels.

## References

No new source was opened. The study's anchors and its [similar-games table](../deep-dives/subjects/fractions.md#similar-games-and-tools) apply: a number line is central (the IES practice guide's moderate-evidence recommendation), the whole stays visible, and positions are verified as intervals rather than by counting tick marks (the classic slip of reading five marks between 0 and 1 as fifths). The Frog Hop dive's [decisions](../deep-dives/frog-hop.md#decisions-for-the-developer) settle the voice rule used here: say landing names when the answer is a pad, hop counts when the answer is a count.

## Overlap

Checked against `origin/main` at `c2424f2e` (GAMES entries, the Frog Hop dive, `src/games/frog-hop/`, the open PRs).

| Game | What it already owns | Why this belongs in Frog Hop |
| --- | --- | --- |
| Ribbon Workshop (Counting Cove, school 1–3) | Composing a length from half and quarter pieces, exchanges that keep the length | Ribbon Workshop has lengths from 0 and no positions. Here a fraction is a place on a line with 0, 1 and 2 on it, reached from a start that need not be 0 |
| Pet Kitchen, Fill and Dump, Memory Match 11 | Sharing food, pour marks, naming fraction pictures | None has a number line |
| Frog Hop G2 *Halves on the line* (grown-up window sketch) | Halves on a whole-number line, planned for `grownup` | **Retired into this packet.** The study places halves and quarters on a line at school (grade 3), inside the `school` band, so G2 is not kept as separate grown-up content |
| Frog Hop levels 3–6 | Adding hops of 1 along whole numbers | The tap is the same; the unit changes. That is why this is a Frog Hop extension and keeps its tier light |

## The model (`logic.ts`)

- A fraction plan has `unit: 4`: four ticks per whole. A pad's value is a tick index, so the line 0–2 is ticks 0–8, which is exactly the nine pads of `WINDOW` at `STEP` 104. Nothing slides and `lo` is always 0, so `answerSlot`'s `target - lo` still holds. Whole-number plans have no `unit` (read as 1) and are unchanged.
- A question gains `jump` (ticks per hop: 1 is a quarter, 2 a half, 4 a whole) and `count` (hops). `target = start + jump × count`, all integers. Nothing is compared in pixels.
- Fraction Match questions also carry `jump2` (the second hop size) and `answer2 = target / jump2` (the card).
- Display names come from one function of the tick: `fracName(t)` gives `0`, `¼`, `½`, `¾`, `1`, `1¼`, `1½`, `1¾`, `2` (mixed numbers, see [decision 2](#open-decisions)), and `fracWords(t)` the spoken form ("three quarters", "one and a half"). A quarter landing that equals a half or a whole also has its quarter name ("two quarters", "four quarters") for the equivalence line.

## Levels

Both `school`, five questions a round, one sticker a round. Names are local until built (see [numbering](#numbering)).

| Level | Mode | Name (`describeLevel`) | Questions | What it adds |
| --- | --- | --- | --- | --- |
| FL1 | `frac-hop` | *Quarter and half hops along one whole: where does the frog land?* | Targets inside 0–1. Cases (start ticks, jump, count): from 0: (¼ ×1–4), (½ ×1–2); from ¼: (¼ ×1–3), (½ ×1); from ½: (¼ ×1–2), (½ ×1). The first question is always 0 + ½. The other four are seeded and distinct, with at least one more half hop and at least one start that is not 0 | A fraction is a place reached by equal hops from a start; two quarters land where one half does |
| FL2 | `frac-match` | *Two hop sizes, one lily: how many hops of the other size reach the same place?* | From 0, two stages. Cases (first size × count → second size, card answer): ½×2 → ¼, 4; ½×3 → ¼, 6; ¼×4 → ½, 2; 1×2 → ½, 4; ½×4 → 1, 2; ¼×2 → ½, 1; 1×1 → ¼, 4; ½×1 → ¼, 2. Five distinct cases, seeded, with at least one landing above 1 | Equivalence: one position has several names (1 = 2 halves = 4 quarters; 1½ = 3 halves = 6 quarters) |

Every first-stage count is at most 4, so the sign stays short, and every card answer is at most 6, so the existing `GAP_CARDS` 1–6 are enough. No answer repeats twice running (the existing `makeQuestions` rule).

### First rounds

- **FL1, first question:** the frog is on 0. Over the pads 0 to 1 a bracket reads "one whole" and the four gaps between pads 0 and 1 are equal. The sign reads `½`, the pet says "Start at zero. Hop one half. Where will the frog land?" She taps the middle pad between 0 and 1. The frog makes one long hop spanning two pads, the pad shows `½` and the pet says "One half!"
- **FL2, first question (½×2 → ¼):** stage 1, the sign reads `½ + ½`; she taps the pad marked 1; the frog hops two half hops ("one half… one!"), a flag goes up on 1 and the frog leaps back to 0. Stage 2, the sign reads `? hops of ¼`, the pet says "How many quarter hops reach the flag?" and the number cards appear. She taps 4; the frog hops four quarter hops, counted "one, two, three, four", lands by the flag and the pet says "Two halves and four quarters land on the same lily: one!"

## Screen and controls

- The same nine pads, frog, sign and cards. Pads keep their 104 spacing and hit areas; the cards keep theirs. Frog Hop is not `upright`, and these levels do not change that.
- **Labels:** on fraction plans only the whole pads (0, 1, 2) show a numeral. The other pads are blank until the frog lands on one, then that pad shows its name (`¾`, `1½`) until the next question. Labelling every pad would turn the task into reading a numeral; leaving them blank asks her to read position (see [decision 1](#open-decisions)).
- A "one whole" bracket spans pads 0 to 1 on every fraction question, drawn on its own layer above the row with `eventMode = 'none'`.
- **Sign:** the sum of the start and the hops, the start omitted when it is 0 (`¼ + ¼ + ¼`, `½ + ¼ + ¼`), at most four hop terms; FL2's second stage reads `? hops of ¼` (or `½`, `1`). The board widens to its text, at most 720 units, centred.
- **Hops:** one arc per hop, as long as its size (a half hop spans two pads, a whole four), using the existing leap tween with the height scaled to the span.
- **FL2 flag:** a small code-drawn flag on the first-stage pad, on a layer that is not the pad. Not a flower, which the dive reserves for the 5, 10, 15, 20 landmarks.
- **The sticker and icon do not change.** `Pad` keeps its numeral path; fraction labels and blanks are set by a separate method so `sticker()` and `HopIcon` draw exactly as today. The existing test *pins the original seeded sticker numerals and frog drawing* must pass untouched.
- An inert tap (a pad during FL2's card stage) keeps the existing free nudge (`hop.cards`, the cards bounce); it is never a miss.

## Accounting, help and finishing

- A wrong pad or card is a miss with a named kind (below); two misses bring the counted demonstration and the glow. **One hint per question** across both FL2 stages, through the existing `hintCharge`.
- Pad misses, `fracMiss(start, jump, count, chosen)`, in this priority:
  1. `backward`: at or behind the start → the existing `hop.wrong.forward`.
  2. `size`: the hops taken with the wrong size: a half or whole question answered with one-tick hops (`start + count`), or a quarter question answered with half hops (`start + 2 × count`) → `hop.frac.size` ("Each hop is one {size}. {Size} hops are {smaller/bigger} than that.").
  3. `whole`: whole hops for a half or quarter question (`start + 4 × count`, when on the line) → `hop.frac.whole`.
  4. `one-more` / `one-less`: one tick past or short → `hop.frac.ticks` ("Count the hops between the pads, not the pads.").
  5. `count` otherwise → `hop.frac.count` ("Count the {size} hops from {where}.").
- Card misses at FL2's second stage: `same` when the card equals the first-stage count and the sizes differ → `hop.frac.same-smaller` ("A quarter hop is shorter than a half hop, so it takes more hops.") or `hop.frac.same-bigger`; otherwise the existing card `one-more` / `one-less` lines, then `count`.
- **Hint (demonstration):** FL1 and FL2's first stage hop the right hops saying the landing names ("one quarter, two quarters, three quarters"), then the pad glows. FL2's second stage hops the second size counting hops ("one, two, three, four") to the flag, then the card glows. Afterwards she still taps the answer, as everywhere in Frog Hop.
- **Equivalence line** on a right FL1 answer whose quarter name differs (`hop.frac.also`: "Two quarters. That is one half!"), and at the end of every FL2 question (`hop.frac.same`).
- Five answered questions finish through `ctx.finish({ misses, hints })` as today.

## Rule tests (`logic.test.ts`)

1. Every FL1 and FL2 question has integer ticks with `target = start + jump × count`, start and target on 0–8, FL1 targets ≤ 4, and `lo` is 0.
2. FL1's first question is 0 + ½, every round has at least two half-hop questions and at least one non-zero start, and the five cases are distinct.
3. FL2: `answer2 × jump2 = target`, the sizes differ, `answer2` is in `GAP_CARDS`, the first-stage count is at most 4, every round has a landing above 1, and the cases are distinct.
4. `fracMiss` classifies every wrong pad for every question, with the priority above; `size` and `whole` are only returned when that pad exists on the line; a hint still follows two misses and is charged once per question.
5. `fracName` and `fracWords` cover ticks 0–8 and agree (`6` → `1½`, "one and a half"); the quarter name is offered exactly for ticks 2, 4, 6 and 8.
6. `answerSlot` gives the right pad for FL1 and FL2's first stage and the right card for FL2's second stage (the ghost finger's targets).
7. The existing tests stay green: whole-number levels unchanged, the sticker pin, the ladder covering `school` with no silent clamp.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `autotouch()` taps the answer pad on FL1; on FL2 the answer pad, then the answer card, through `answerSlot`.
- **How-to card:** one `LevelLine` per level: FL1 "Hop quarters and halves: tap where the frog lands"; FL2 "Land on a lily, then choose how many hops of the other size reach it".
- **Voice (`voice.ts`):** `hop.frac` ("Start at {where}. Hop one {size}{times}. Where will the frog land?"), `hop.frac.match` ("Hop {hops}. Where will the frog land?"), `hop.frac.second` ("How many {size} hops reach the flag?"), and the miss, `also` and `same` lines above. Spoken numbers are always words, never glyphs. The slots go through device speech until the slotted-clip work (V3).
- **Registration:** both levels `school` only, at the top of the school ladder through `order`. Not a couch level (the couch stops stay `[3, 3, 4, 5, 6, 6]`). No new land, band, save field or sticker.
- **Grown-ups' targeting row:** "Fractions as places on a line; equal hops of a quarter and a half; equivalent positions" · 3.NF.A.2, 3.NF.A.3a, 3.NF.A.3c · off screen: a masking-tape line 0–2 on the floor and paper strips one quarter and one half long to step along it.

### Numbering

IDs are the next free plan indexes at build time (`describeLevel` and `planFor` read `PLANS` by position, so IDs stay contiguous), with `order` putting FL1 then FL2 at the top of `school`. The dive's unbuilt levels (9 *Count up to take away*, 10 *Over ten, your way*, 11 *Hop by tens*, 12, 13) are referred to by name: whichever is built first takes the next ID, and either order is fine. Saved levels and pins never move. The dive's "IDs 14 and up" for the younger entries and the grown-up window becomes "the next free IDs when built".

## Check tier

The build is **new levels on an existing interaction** (pads and cards both exist): typecheck, Frog Hop rule tests plus the how-to, voice and registry tests, then `BROWSER_SUITE=woods WOODS_ONLY=hop` at FL2 (one wrong pad, one wrong card, the hint) and `BROWSER_SUITE=fingerdemo` at FL1 and FL2. Add one landscape and one portrait screenshot of FL2, since the labels, bracket and flag are new drawing. `npm run build` only if a shared file changes (the voice script and how-to barrels). No couch, `world` or offline suite. iPad touch, device speech of the fraction words and a child's response stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

### Expected files

`src/games/frog-hop/{logic.ts, logic.test.ts, index.ts, voice.ts, howto.ts}`, the woods hop loop in `scripts/browser-check.mjs` if its top is still a number; at closeout `docs/games/frog-hop.md` (via `npm run game-docs`), README and GAMES, READY, the Frog Hop dive, this packet's status line, the fractions study and VERIFICATION.

## Open decisions

Each has a default the build uses. None waits on the developer.

1. **Labels.** Default: only 0, 1 and 2 are labelled; a pad shows its name once landed on. The alternative labels every pad, which makes FL1 a numeral-matching task.
2. **Past 1.** Default: mixed numbers (`1½`, "one and a half"), the common grade-3 form. Improper names (`3/2`, "three halves") are said only in FL2's equivalence line ("three halves"), and Ribbon Workshop's *Three halves* rung owns them as a length.
3. **Choosing the hop size.** A level where she picks quarter or half hops to reach a flag is a new interaction (two hop buttons, like the dive's *Big hops and little hops*) and stays a later option.
4. **Thirds and sixths.** Out: twelve ticks to a whole do not fit nine pads without sliding. A later packet would need the stride work of *Hop by tens* first.
5. **Who it is for.** `school` covers 6 to 12. Whether a six-year-old enjoys FL1 or it reads as nine-year-old content is a person check, not a gate; the `order` keeps it at the top so younger players reach it last.
