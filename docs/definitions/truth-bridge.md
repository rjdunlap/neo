# Truth Bridge, levels 1–4 (definition)

Documentation packet, 2026-11-22, branch `claude/define-truth-bridge`, [PR #2017](https://github.com/rjdunlap/neo/pull/2017). Study follow-up PR6 from [philosophy and reasoning](../deep-dives/subjects/philosophy-reasoning.md#candidates-and-recommended-order); placement settled by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed). Proposed game `truth-bridge`; nothing is registered or implemented. **Docs only.** Two build batches follow below.

## What you do

On Lantern Night, some islanders play Topsy: everything a Topsy islander says is the opposite of what is so. Everyone else speaks straight. Two or three islanders wait at the near end of a rope bridge, and each says one sentence about the group. Mark each islander Straight or Topsy until every sentence fits its speaker, then tap **Cross**. The islanders walk over together. At the top level, the islanders also talk about which of three planks is sound, and the player picks the plank as well.

The learning is consistency and deduction. A sentence's truth must match its speaker's kind. Settling one speaker settles what their sentence says about the others. A careful "suppose" can rule out a choice when it leads to a sentence that cannot fit.

Use stable level IDs 1–4 and the `grownup` band only. Use Puzzle Peaks as the learning region, the home of Picture Logic and Mystery Grid, and Logic as the challenge. Add one Lantern Lake tile through the existing land paging, making it the land's seventeenth tile; it lands on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. A marking is round state. It carries no economy, inventory, streak or saved puzzle.

## Identity and overlap

- **Mystery Grid** (`logic-grid`) marks a grid from clues that are always true. The puzzle-pages default left truth-and-lie clues out of *that* game ([RECOMMENDATIONS](../deep-dives/subjects/RECOMMENDATIONS.md)). The default belongs to Mystery Grid and does not bar a separate grown-up game whose whole point is speakers of two kinds.
- **Not Always** (Story Grove) breaks one claim with a visible card. Here, no card settles anything. The sentences constrain each other, and the answer is the one marking where every sentence fits.
- **Picture Logic** and **Sudoku Garden** are grown-up boards where one tap marks a cell and nothing is refused. Truth Bridge reuses that free marking and its Check accounting (below).
- **Not here:** the words "liar", "knave" or "lying". Topsy is a festival game, and nobody is in trouble. Also out: falling into the lake, timers, a mistake cap, daily puzzles, typed answers, more than three islanders on a phone.

## The islanders and their sentences

The cast is fixed: **Cat**, **Duck** and **Bear** (`FRIENDS` in `src/art/picnic.ts`, drawn by `src/art/critter.ts`). Level 1 uses two of the three. The seeded RNG picks the board, the cast order across the seats and which two islanders appear. Each islander says exactly one sentence. It appears in a speech bubble above them, in words, and is spoken. Tapping the bubble repeats the sentence, free. The sentence kinds are closed. In the table below, X and Y are named islanders other than the speaker. "Us" means everyone on the board, the speaker included.

| Kind | Sentence (as shown and spoken) | True when |
| --- | --- | --- |
| About one other | "X speaks straight." / "X is Topsy." | X's kind is as named |
| Compared with me | "X is my kind." / "X is not my kind." | X matches / differs from the speaker |
| About two others (three islanders) | "X and Y are the same kind." / "X and Y are different kinds." | As said |
| About all of us | Two islanders: "Both of us are Topsy." / "Both of us speak straight." Three islanders: "All of us are Topsy." / "All of us speak straight." | As said |
| At least one | "At least one of us is Topsy." | As said |
| Counting (three islanders) | "Exactly one of us speaks straight." / "Exactly two of us speak straight." | As said |
| Planks (level 4) | "The left (middle, right) plank is sound." / "The left (middle, right) plank is rotten." | Exactly one of the three planks is sound |

Leave out "I am Topsy." Nobody can say it, because it would be true for a Topsy islander and false for a straight one. Leave out "I am straight", since everyone can say it. Note that "X is my kind" always means X speaks straight. A Topsy speaker's false "X is my kind" means X differs from them. That is a real deduction the board may use, not a bug.

**A sentence fits** when it is true and its speaker is marked Straight, or when it is false and its speaker is marked Topsy. **A board is valid** only if exactly one assignment of kinds (and, at level 4, exactly one plank) makes every sentence fit. **Level 4 requires the kinds to be unique as well as the plank**. None of the 864 three-islander plank boards where only the plank is unique is used. The player marks every islander and then picks the plank, as the study's "mark who is who and cross" asks.

## The solver and the difficulty filter

Keep the rules in `logic.ts`. A board is a seat list (islander names) and one sentence per seat. The solver works on a **domain** per unknown: {Straight, Topsy} for each islander and {left, middle, right} for the plank at level 4.

- **Propagation step.** For one sentence, list every assignment that agrees with the current domains and in which that sentence fits its speaker. If one unknown takes a single value in all of them, that sentence settles it. Repeat over the sentences in seat order until nothing changes. If a sentence has no such assignment, the domains contradict.
- **Supposition.** Take the first unsettled unknown in seat order (the plank last) and the first of its values. Suppose it and propagate. If that contradicts, remove the value and propagate again. Each removal counts as one supposition.
- **Supposition count.** This is the number of removals needed before propagation settles every unknown. Count with the earliest-first order above, so the count is deterministic.

Brute-force enumeration over seat patterns (before names are applied), with the closed sentence list above, gives the pools below. Use these exact numbers as rule-test totals.

| Level | Islanders | Pool | Boards |
| --- | --- | --- | --- |
| 1 · *Two at the gate* | 2 | Valid, zero suppositions | 26 of the 28 valid two-islander boards. In 16, each sentence settles its own unknowns from scratch (*flat*). In 10, one sentence's result is needed to read the other (*chained*) |
| 2 · *Three on the bridge* | 3 | Valid, zero suppositions, chained (a single pass of each sentence from scratch does not settle everything) | 1,191 |
| 3 · *Try it both ways* | 3 | Valid, exactly one supposition | 404 |
| 4 · *Which plank?* | 3 and three planks | Valid in kinds and plank, at least one plank sentence, at most one supposition | 372 (198 with none, 174 with one) |

Leave out the 2 two-islander boards that need one supposition, the 40 flat three-islander boards and every board needing two (15 without planks, 6 with). A level-1 round is two boards, flat then chained. Levels 2–4 are one board a round. Each level samples its pool with `ctx.rng`, never repeating the previous round's board. Redisplay the same board, marks and plank choice through resize and rotation.

## Marking, Check, feedback and credit

Each islander has a mark plate under them, with three states: blank, **Straight** (a lantern held upright, the word "Straight") and **Topsy** (the lantern upside down, the word "Topsy"). Tapping the islander or the plate cycles blank → Straight → Topsy → blank. The kinds read by icon and word, never by colour. Marking, unmarking, cycling and re-hearing a sentence are always free, and nothing is refused. At level 4, tapping a plank selects it, and tapping it again clears it. **Help** and **Cross** sit below.

- **Cross on an incomplete answer** names the first blank islander, or the plank if none is chosen. This is free.
- **Cross on a complete answer** tests the sentences in seat order. The first sentence that does not fit gives the explanation, using only what is on screen. For example: "Duck is marked Straight. With these marks, Duck's words, 'Bear is my kind', are not so." At level 4, kinds that all fit with a wrong plank name the plank sentence that breaks. A wrong complete answer always has such a sentence, because only the solution fits every sentence. Count **one miss per distinct wrong complete answer** within a round. Crossing again with the same answer replays the explanation, free. The miss sound is the gentle boing. Nobody falls and no plank breaks.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time. The hint starts from the current marks taken as given where they agree with the solution, and treats the rest as unknown. It runs the solver until the first islander or plank whose correct value the player has not set. Highlight that islander or plank and the sentence that settles it, then say why. For a propagation step: "Bear's words, 'At least one of us is Topsy', settle Duck: Duck is Topsy." For a supposition: "Try Cat as Straight. Then Bear's words can't fit. So Cat is Topsy." Repeating the current hint with no edit replays it, free. Count each new hint once.
- **Hints always lead somewhere.** Following the hint sets one more correct value and never clears one. The rule test walks every partial marking, which is 3² or 3³ mark states, times four plank states at level 4. It checks that a chain of hints from each one reaches the solution in at most the number of unknowns.
- **On acceptance** the islanders walk over the bridge in seat order, each lantern lighting as they step off. At level 4, they cross on the chosen plank. Then the game finishes once through the normal shell with the round's misses and hints. The crossing plays only for an accepted answer.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md) and the existing `onTap`, coach and round helpers.
- **Upright phone first.** At 390 × 625 with captions and the active guide, set out the following, top to bottom:
  - the bridge and lake as a backdrop band;
  - the three planks at level 4, side by side, each at least 100 units wide;
  - three islanders in one row with their bubbles above, each column about 120 units wide;
  - the mark plates;
  - Help and Cross.
- **Bubble text.** Wrap each bubble's text to its column, at most three lines. Every sentence in the closed list fits at the game's label size; a layout test checks the longest one.
- **Targets.** Aim for 100 logical units per target, with the grown-up minimum of 64.
- **Landscape.** Put the islanders and bubbles on the left and the planks, Help and Cross on the right.
- **Captions and the guide.** Reserve their space first.
- **Art.** Draw the bridge, planks, lanterns and the new hub icon (a lantern on a rope bridge) with palette colours. Use existing confirmation sounds or pentatonic notes.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. The spoken lines are a finite list, because the cast and the sentence kinds are closed:

- **Sentences.** There are 31: 12 about one other or compared with me, 6 about two others, 5 about all or at least one, 2 counting and 6 planks. Words naming two islanders use a fixed name order (Bear, Cat, Duck).
- **Miss explanations.** One per speaker, kind and sentence: 3 × 2 × 31 at most. Generate only the combinations the pools can produce, and list them in `voice.ts` from the logic module at build time.
- **Hint lines.** One per sentence and the islander or plank it settles. Supposition lines are one per islander and kind, plus the closing "So … is …".

A unit test checks that every sentence, miss and hint the pools can produce has a voice line. The instruction is `ctx.instruct`: "Mark who speaks straight and who is Topsy, then cross."

**How-to cards.**
- Level 1 shows marking Bear from "Both of us are Topsy" (Bear is Topsy, so Cat speaks straight), then tapping Cross.
- Level 3 shows a supposition: marking an islander, seeing a sentence that cannot fit, and flipping the mark.

The ghost finger follows the solver's own steps on the seeded board and taps Cross.

**Co-play and off-screen.** In co-play, one person reads the sentences aloud and the other moves the marks. They swap after a round. Off-screen, one player writes a secret "S" or "T" for two family members, and each says one sentence that fits. The others work out who is who.

## Build batches

1. **`truth-bridge 1`, levels 1–2.** This is the new game, the mark-and-cross interaction and the propagation hints. Claimed on `claude/truth-bridge-1-2`: `src/games/truth-bridge/`, its how-to card, voice lines, the Lantern Lake land line and the `truthbridge` suite.

   **Checks:** typecheck and unit tests, which cover:
   - the pool counts above (26, 1,191) and uniqueness of every board;
   - the fit rule for every sentence kind;
   - the hint walk from every partial marking;
   - miss counting per distinct answer;
   - voice coverage;
   - registry, lands and paging.

   **Browser and build:** one filtered `truthbridge` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Finish level 1, then at level 2 cross once wrong, cross again with the same marks (no new miss), follow Help, rotate and finish with one sticker. Take one upright screenshot, run `fingerdemo` at level 2, and build with the generated voice assets.
2. **`truth-bridge 2`, levels 3–4.** This adds the supposition hint, the planks and the plank sentences.

   **Checks:** typecheck and unit tests (pool counts 404 and 372, the supposition hint, the plank hint walk, voice coverage), one filtered play at level 4 with a wrong plank and one hint, one upright screenshot with the planks, `fingerdemo` at level 4, and a build. The batch runs after batch 1.

Later proposals, not in these batches:
- a school opening at the top of `school` (the study's M audience), which needs its own layout and wording check;
- four islanders, which do not fit an upright phone;
- islanders who sometimes speak straight and sometimes do not (Smullyan's "normals");
- a question the player asks the islanders.

## Source check

The [Knights and Knaves article](https://en.wikipedia.org/wiki/Knights_and_Knaves) (opened 2026-11-22) has these points:
- It credits the name to Raymond Smullyan's *What Is the Name of This Book?* (1978), with a similar puzzle in Maurice Kraitchik's *Mathematical Recreations* (1953).
- It describes an island where each inhabitant always tells the truth or always lies.
- Its "both knaves" example matches level 1's demonstration: the speaker cannot be telling the truth, so the speaker lies and the other tells the truth.

Topsy, the cast, the sentence list, the pools and the accounting are game rules. The pool counts come from a brute-force enumeration made while writing this packet. The building session's rule tests re-derive them. They are not taken on trust.
