# Jar Clues, levels 1–4 (definition)

Documentation packet, 2026-11-23, branch `claude/define-jar-clues`, [PR #2030](https://github.com/rjdunlap/neo/pull/2030). Study follow-up E5 from [estimation](../deep-dives/subjects/estimation.md#candidates-and-fit); placement settled by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed, and Jar Clues is an ordinary next definition that no longer waits for Weights Case or Box Balance). **Batch `jar-clues 1` (levels 1–2) built 2026-11-23** ([PR #2048](https://github.com/rjdunlap/neo/pull/2048); [game page](../games/jar-clues.md)); batch 2 (levels 3–4) is queued. Two build batches follow below.

## What you do

A jar of lake pebbles stands on the jetty at Lantern Lake, and nobody has counted it. Look at the jar and plant a first guess on a board of the numbers 1 to 60. Then the lamplighter's clues arrive one at a time ("an even number", "fewer than 45", "the digits add to 7"). For each clue, cross off every number it rules out and ask for the next one. When the clues run out, two or three numbers are still standing, well apart. Look at the jar again and choose the one that fits what you see. The jar pours out into rows of ten and is counted.

The learning is estimation used the way the mathematical practice standards describe it: as a check alongside other reasoning. The clues are exact, and each one is applied to sixty numbers at once (parity, counting by fives, digits, multiples). The last step is a judgement by eye between amounts that are far enough apart to tell. The first guess is there so the player has something of their own to compare with the count.

Use stable level IDs 1–4 and the `grownup` band only. Use Counting Cove as the learning region, the home of Lasso Loops' estimation levels, and Logic as the challenge. Add one Lantern Lake tile through the existing land paging; it lands on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. The board, the guess and the clues are round state. It carries no economy, inventory, streak, daily jar, saved puzzle or record of how close a guess was.

The shape comes from Steve Wyborney's Esti-Mysteries, as the study recorded it: a jar, clues that narrow the numbers "often" to two or three, and a deliberate last choice of the most reasonable one.

## Identity and overlap

- **Lasso Loops** (`lasso-loops`) levels 6 and 7 ask a school child for a free guess about a meadow, give one jar of ten as a benchmark and check by looping tens. Jar Clues keeps their rule that a guess is never a miss and their count by tens at the reveal. Its work is different: number-property clues applied to a whole board, for a grown-up.
- **Who Am I?** and **Fewest Clues** narrow a set of suspects from clues about what each suspect looks like or does. Here the suspects are sixty numbers, one clue removes many at a stroke, and the clues never finish the job: the picture does.
- **Truth Bridge** (`truth-bridge`) and **Mystery Grid** (`logic-grid`) are pure deduction with one answer. Jar Clues deliberately stops deduction two or three numbers short.
- **Weights Case** and **Box Balance** (proposed grown-up number puzzles) work with a balance. The study's worry that the shelf's number puzzles might repeat does not arise: this one has no balance, no equation and no par.
- **Not here:** a closest-guess score, a prize, a ranking or a daily jar; a timer; a photograph; real small objects in a jar (the off-screen activity uses large household things only, as the study's choking-hazard boundary requires); a typed answer.

## The jar, the board and the clues

Keep the model in `logic.ts`. It is small and closed.

**The count** is a whole number from 6 to 60. **The board** is the numbers 1 to 60 in six rows of ten, so a row is a run of ten (1–10, 11–20 and so on) and a column is a last digit. A number is either **standing** or **crossed off**.

**Digits.** A one-digit number has tens digit 0, so 7 is "0 and 7": its digits add to 7 and its ones digit is the bigger one. The how-to card says this once, and every explanation that leans on it says it again.

**A clue** is a statement that is true or false of each number from 1 to 60. The kinds are closed:

| Kind | Clues | From level |
| --- | --- | --- |
| Range | "More than *a*" and "Fewer than *a*", for *a* = 5, 10, … 55 (22 clues) | 1 |
| Parity | "An odd number", "An even number" | 1 |
| Counting by | "You say it counting by fives", "You say it counting by tens" | 1 |
| Ends in | "It ends in *d*", for *d* = 0 … 9 (10 clues) | 1–2 only |
| Digit sum | "The digits add to *s*", for *s* = 3 … 12 (10 clues) | 2 |
| Digit order | "The ones digit is bigger than the tens digit", "The tens digit is bigger than the ones digit" | 2 |
| Multiple | "A multiple of *m*", for *m* = 3, 4, 6, 7, 8, 9 | 3 |
| Not a multiple | "Not a multiple of *m*", for *m* = 3, 4, 5 | 3 |
| Special | "A prime number", "A square number" | 3 |
| One of two | "Exactly one of these is true:" followed by two clues of different kinds, each a range, parity, counting-by or multiple clue (248 pairs) | 4 |

That is 59 plain clues and the one-of-two form.

**A board** is a count and an ordered list of clues. **A board is valid** when:

- every clue is true of the count;
- each clue, when it arrives, crosses off at least the level's smallest cut of the numbers still standing (no clue arrives and does nothing);
- more than three numbers stand before the last clue, and two or three stand after it, the count among them;
- any two of the numbers left standing are at least the level's gap apart, so the jar can tell them apart;
- no clue appears twice, there is at most one "More than" and at most one "Fewer than", and the level's row below is met.

**The jar.** Draw the pebbles as a packed, overlapping pile, so they cannot be counted one by one, in a jar whose inside holds sixty to the brim line. The top of the pile stands at the count's share of the way to the brim: 30 pebbles half fill it. The pile's surface is uneven by no more than one pebble's height. At levels 1 and 2 a **ten line** is etched on the glass where ten pebbles reach, as the benchmark; at levels 3 and 4 the glass is plain. Because the last numbers standing are at least nine apart, their pile heights differ by at least nine sixtieths of the jar, several pebbles' height.

## Levels and the generator

| Level | Clues | Kinds in the pool | Smallest cut | Gap between the last numbers | Jar | Also required |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · *First clues* | 3 | Range, parity, counting by, ends in | 4 | 10 | Ten line | None |
| 2 · *Digit clues* | 4 | Level 1's, digit sum, digit order | 3 | 9 | Ten line | At least one digit-sum or digit-order clue |
| 3 · *Multiples and primes* | 4 | Level 2's without "ends in", multiple, not a multiple, special | 3 | 9 | Plain | At least one multiple, not-a-multiple or special clue |
| 4 · *One of two* | 5 | Level 3's, one of two | 2 | 9 | Plain | Exactly one one-of-two clue |

**The generator** draws a board from `ctx.rng` and redraws until it is valid:

1. Draw the count from 6 to 60.
2. For each place in the clue list, list every clue in the level's pool that is true of the count, is allowed beside the clues already chosen, makes the level's smallest cut, and leaves more than three numbers standing (or, in the last place, two or three). Pick one from the seed. If the list is empty, redraw.
3. Check the gap between the numbers left standing and the level's required kind. If either fails, redraw.

A prototype of this generator, written with this packet and not committed, kept these shares of 20,000 seeded draws: level 1, 7,448; level 2, 5,106; level 3, 6,058; level 4, 6,715. So it needs about three or four draws at every level. The kept boards covered 53 to 55 of the 55 possible counts at each level, and 1,697, 3,410, 5,352 and 6,706 different boards. At level 1 the last clue was an "ends in" clue on nine boards in ten; from level 3, where that kind leaves the pool, the digit sums and multiples finish the boards. These numbers show the generator is practical. They are not rule-test totals: the build's tests check the properties below on their own seeds.

**What each level asks.**
- **Level 1** teaches the routine: guess, apply a clue to the whole board, check, and judge by the jar at the end. A range clue is a sweep of rows, and its edge needs care ("fewer than 40" also rules out 40, at the end of the fourth row). Example: *fewer than 35*, *more than 5*, *it ends in 2* leaves 12, 22 and 32.
- **Level 2** moves the clues inside the numbers. Example: *fewer than 40*, *more than 5*, *an even number*, *the digits add to 3* leaves 12 and 30.
- **Level 3** takes the ten line away and asks for multiples, primes and squares. Example: *more than 25*, *fewer than 50*, *not a multiple of 3*, *the digits add to 10* leaves 28, 37 and 46.
- **Level 4** adds one clue that has to be reasoned about before it can be applied. Example: *exactly one of these is true: more than 20, a multiple of 3*; then *fewer than 55*, *more than 10*, *not a multiple of 5*, *the digits add to 7* leaves 34, 43 and 52. The one-of-two clue often leans on a later one, and the player may leave it half applied until then: only the check at "Next clue" judges the board.

One board is a round at every level. Redisplay the same board, crosses, guess flag and clue through resize and rotation.

## Guessing, crossing off, feedback and credit

- **The first guess.** The round opens on the jar and the full board: "About how many? Tap your first guess." Tapping a number plants a small flag on it; tapping another moves the flag. **First clue** starts the clues and is enabled once a flag is planted. The flag stays on its number for the whole round, crossed off or not. **The guess is free:** it is never a miss or a hint, nothing is said about it until the reveal, and no clue or explanation mentions it.
- **Crossing off.** Tap a standing number to cross it off; tap a crossed number to bring it back. A sweep (a drag across the board) gives every number it passes the state the first one took, so a row, a column or a block goes in one stroke. Sweeping is custom pointer handling: read the [input and rendering pitfalls](../DESIGN.md#input-and-rendering-pitfalls) and keep palm rejection, cancellation and cleanup.
- **Free moves.** Planting and moving the flag, crossing off, bringing back, sweeping and re-hearing a clue (tap the clue card) are always free, and nothing is refused.
- **The check.** **Next clue** (after the last clue, **Last look**) checks the board against every clue shown so far. The board holds when the numbers standing are exactly the numbers every shown clue allows. Then the next clue arrives, with the earlier clues kept in a short list above it.
- **A board that does not hold.** Play the gentle boing. The explanation takes the lowest number that is wrong, lights it, and says why:
  - still standing: "23 is still standing. The clue says an even number, and 23 is odd."
  - crossed off but allowed: "34 is crossed off. It fits every clue so far: it is fewer than 40 and even."
  - a digit clue on a one-digit number: "7 is still standing. Its digits are 0 and 7, so the tens digit is not the bigger one."
  - one of two: "24 is still standing. It is more than 20 and a multiple of 3: both are true, and the clue says exactly one."

  The explanation never says which number is the count. A wrongly crossed number is explained the same way whether or not it is the count, so the explanation gives nothing away. Count **one miss per distinct wrong board at a check** within a clue; checking the same board again replays the explanation, free.
- **Why a miss counts here.** A check is a worked answer: the clue and the board are on screen and settle every number before **Next clue** is pressed. It is the same step as Check in Picture Logic or a full page in Key It Out. Nothing is judged between checks, so trying a cross and taking it back costs nothing.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time. The hint takes the lowest row that holds a wrong number, lights every wrong number in that row, and says the working: "The clue says an even number. In this row 21, 23, 25, 27 and 29 are odd. Cross them off." or "34 fits every clue so far. Bring it back." The player does the crossing. If the board already holds, Help says so ("This board fits the clue. Ask for the next one."), free. Repeating the current hint with no change replays it, free. Count each new hint once.
- **Hints always lead somewhere.** Following a hint makes one more row right and leaves the others as they were. The rule test walks sampled wrong boards at every clue of sampled boards at every level and checks that following hints reaches the board that holds in at most six hints.
- **The last look.** After the last clue's check, the crossed numbers fade and the two or three left standing grow into large cards beside the jar: "Which one does the jar hold?" Tapping a card chooses it. **This choice is a judgement and never a miss**, as the study fixed: nothing is counted for it, and no hint is offered for it.
- **The reveal.** The jar pours into a tray of rows of ten. The pebbles are counted by tens and then by ones on pentatonic notes, and the pet says the three numbers plainly: "Your first guess was 30. You chose 34. The jar holds 34." When the choice was another card, the last sentence is the same and nothing is added; when the first guess was within five, add "Close from the start." Nothing is ranked or kept. The game finishes once through the normal shell with the round's misses and hints.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md) and the existing `onTap`, coach and round helpers. Check the [reuse map](../DESIGN.md#reuse-map) for number cards, a pour and a count by tens (Lasso Loops' jars and Fill and Dump's pour) before drawing new ones.
- **Upright phone first.** At 390 × 625 with captions and the active guide, set out the following, top to bottom:
  - the jar on the left of a strip, with the clue card and the list of earlier clues to its right;
  - the board, ten across and six down;
  - **Help** and **Next clue** in a row beneath it.
- **The board's cells** are at least the grown-up minimum of 64 logical units square: ten across is 640 of the upright area's 768. A layout test checks the cell size, that the strip, the board and the button row fit above the caption at 390 × 625, and that the jar keeps at least 200 units of height there. If the test cannot be met with the caption showing, the building session shortens the strip (the earlier clues fold into a count, "clue 3 of 4", that opens the list when tapped) and never shrinks a cell.
- **Landscape.** Put the board on the left and the jar, the clues and the buttons on the right.
- **Captions and the guide.** Reserve their space first.
- **Reading.** The numbers and clues are printed, as befits a number puzzle for a grown-up. Every clue speaks when it arrives and when tapped, so the round never depends on print alone. Navigation to the game requires no reading.
- **State that does not lean on colour.** A crossed number carries a drawn cross and fades; the flag is a shape; a lit number in an explanation carries a ring.
- **Art.** Draw the jar, the pebbles (three palette colours and two sizes close enough that the pile height stays honest), the ten line, the tray, the flag, the clue card and the new hub icon (a jar beside three number cards, one of them ringed) in Pixi `Graphics` with palette colours. A unit test checks that the pile's top rises with the count and stands within one pebble of the count's share of the jar. Use existing confirmation sounds or pentatonic notes.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. The clues are closed, so the spoken lines are a short finite list of whole lines with no slots:

- **Clues:** 59, one for each plain clue, and one lead line for the one-of-two form ("Exactly one of these is true."), after which its two clues speak in turn.
- **Fault lines:** three ("A number the clue rules out is still standing." "A number you crossed off fits every clue so far." "For this number both are true, or neither is.").
- **Hint lines:** three ("Cross off the lit numbers in this row." "Bring the lit number back." "This board fits the clue. Ask for the next one.").
- **Stage lines:** the instruction, "Which one does the jar hold?", "The jar holds this many." and "Close from the start."

A miss or a hint speaks its fault or hint line and then the clue's own line while the numbers are lit, and the caption carries the whole working with the numbers in it. The reveal counts with the shell's number words if the [reuse map](../DESIGN.md#reuse-map) has them for 1 to 60, and otherwise speaks the stage line while the caption and the tray carry the numbers. Say on the game's page that the caption is fuller than the speech. A unit test checks that every clue, fault and hint a board can produce has a voice line. The instruction is `ctx.instruct`: "Guess, then cross off what each clue rules out."

**How-to cards.**
- Level 1 shows a flag planted, the clue "fewer than 35" sweeping the last two rows and the six numbers at the end of the fourth, and the last look between three cards beside the jar with its ten line. It carries the line about one-digit numbers.
- Level 2 shows "the digits add to 7" leaving 7, 16, 25 and 34 on a part of the board.
- Level 3 shows the plain jar and "a multiple of 7" leaving one number in most rows.
- Level 4 shows a one-of-two clue with one number where both are true (crossed off), one where neither is (crossed off) and one where exactly one is (standing).

The ghost finger plants the flag on 30, then at each clue sweeps the ruled-out numbers row by row and taps **Next clue**, and at the last look taps the card nearest the pile's height.

**Co-play and off-screen.** In co-play, before the first clue each person says a number that is surely too low and one that is surely too high, as the study's *Too low, too high* tip suggests; then one reads the clues and the other crosses off. Off-screen, guess how many spoons are in the drawer or books on a shelf, write three clues about the real count for someone else ("an odd number", "more than 20", "the digits add to 9"), and count together. Use large household things only, never small pieces in a jar near a young child.

**Grown-ups' wording.** Name what the game asks: "Guess how many are in the jar, cross off the numbers each clue rules out, and choose between the last few by eye." It makes no claim about number sense, attention or school results.

## Build batches

1. **`jar-clues 1`, levels 1–2.** This is the new game, the jar and its pile, the board with tapping and sweeping, the clue kinds through digit order, the check, the row hints, the last look and the pour.

   **Checks:** typecheck and unit tests, which cover:
   - each clue kind's truth over 1 to 60, including the one-digit convention;
   - the generator: over sampled seeds at each level, a valid board is found within 200 draws and meets every condition of validity and its level's row;
   - that the count is always among the last numbers standing and the last numbers are the level's gap apart;
   - the check (a board holds exactly when the standing numbers are the allowed ones), and miss counting per distinct wrong board;
   - that an explanation always names a wrong number and a true reason, and never differs for the count;
   - the hint walk;
   - that the guess and the last choice never change misses or hints;
   - the pile height test and the layout test;
   - voice coverage;
   - registry, lands and paging.

   **Browser and build:** one filtered `jarclues` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Finish level 1, then at level 2 press **Next clue** with a ruled-out number standing, press it again unchanged (no new miss), follow Help, rotate, choose a card that is not the count and finish with one sticker. Take one upright screenshot of the board mid-round with the jar, run `fingerdemo` at level 2, and build with the generated voice assets.
2. **`jar-clues 2`, levels 3–4.** This adds the multiple, not-a-multiple, special and one-of-two clues and the plain jar.

   **Checks:** typecheck and unit tests (the new kinds' truth tables, the generator and its required kinds at levels 3–4, the one-of-two explanations for both-true and neither-true numbers, the hint walk, voice coverage), one filtered play at level 4 with one wrong check on the one-of-two clue and one hint, one upright screenshot of a one-of-two clue card, `fingerdemo` at level 4, and a build. The batch runs after batch 1.

Later proposals, not in these batches:
- a board to 100 with a jar to match, which needs its own layout check;
- a school form at the top of `school` with a 1–30 board, two clues and the ten line, which needs its own wording check (the study names Jar Clues "at school level" for ages 11 to 14);
- a clue about the picture itself ("more than half full"), which would make the eye part of the deduction;
- the player writing clues for someone else's jar, from the off-screen activity.

## Source check

Nothing new was opened for this packet. The study's own sources stand as it recorded them: the Esti-Mysteries page was opened and gives the clue kinds and the two or three numbers left for a last reasonable choice; the mathematical practice standards page was opened and gives estimation as a way to detect errors and judge reasonableness.

The clue kinds, the validity conditions, the gaps, the jar's fill rule and the accounting are game rules. The pebbles and the jar are invented, so no fact needs a source or a reviewer. Whether a gap of nine in sixty reads clearly in the drawn jar on a phone is for the building session to judge from its screenshot; if it does not, widen the gap in the level table before building further. Completing a round shows that the player applied these clues to this board. It is not evidence about estimation in general.
