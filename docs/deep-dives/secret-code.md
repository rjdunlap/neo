# Secret Code deep dive

*ID `secret-code` · bands pre-K, school · levels 1–9 and 11 on 2026-11-05 · session `claude/dive-secret-code`, [PR #1096](https://github.com/rjdunlap/neo/pull/1096)*

## The game today

A gentle Mastermind in Puzzle Peaks (after Mastermind and Neopets' Time Tunnel). A wooden door hides a row of coloured stones. She taps stones from the tray into the door's slots (each goes into the first empty slot; tapping a filled slot takes its stone back), then turns the key. Each slot gets a mark: a green check (right stone, right place), a yellow dot (that stone is in the code, but in another slot; from level 3) or a gray cross. Green stones stay in place; the rest return to the tray, and the try moves into a list above the door. Every stone also carries a white shape (circle, triangle, square, star, heart), so no colour has to be read from hue alone. A round is two or three doors; one sticker.

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What she decides | Pool |
| --- | --- | --- | --- | --- |
| 1 | Two slots, three colors; each slot says yes or no | pre-K | Which stone each slot needs, from yes/no marks | 6 codes; 3 doors |
| 2 | Three slots, four colors; each slot says yes or no | pre-K, school | The same, three slots | 24 codes; 3 doors |
| 3 | Yellow marks: the color is in the code, but in another slot | pre-K, school | Where a stone that is in the code belongs | 24 codes; 2 doors |
| 4 | Three slots and five colors, with yellow marks | school | The same with a stone that is in no slot | 60 codes; 2 doors |
| 5 | Four slots and five colors | school | Four slots | 120 codes; 2 doors |
| 6 | A color can be used twice in the code | school | Whether a repeat explains the marks (every code has one) | 64 codes, 40 with a repeat; 2 doors |
| 7 | Detective door: work out the one code that fits the shown guesses | school | The one code that fits two or three shown tries | 24 codes; 2 doors |
| 8 | Four slots, five colors, and one color used twice | school | Whether a repeat explains the marks, with four slots (every code has one) | repeat codes only; 2 doors |
| 11 | A bigger detective door: four slots, five colors, and three shown guesses | school | The one code that fits three shown tries | no repeats; 2 doors |

Bands (`LEVELS` in `index.ts`): preschool 1–10 with `order` [10, 1] and `entryLevels` [10], pre-K 1–3, school 2–11 with `order` 2, 3, 4, 9, 5, 6, 7, 8, 11 (`PLANS` is keyed by level ID; a carried 10 lands on 1 at pre-K and 2 at school; `planFor` falls back below 1 to 1 and above 11 to 11). Codes are seeded (`makeCode`); levels 6 and 8 always draw a real repeat; level 7's and level 11's clues are chosen greedily to leave one candidate (`detectiveDoor`; level 11 shows exactly three on 300 tested seeds).

**Accounting.** A try is an experiment and never a miss in itself. On levels 1–6 the miss is reading one mark and ignoring it: a stone put in a slot where an earlier mark already ruled it out (`ruledOut`/`ignoredClues`; at yellow levels without repeats a gray also rules the colour out everywhere unless the same try showed it green or yellow elsewhere). Several ignored slots in one try count as one miss. Level 7 checks full consistency instead: a try that no code fitting all the shown clues could be is one miss (`contradictsClues`). Two misses on a door, or `slots + 4` tries, bring faint stones in the empty slots, a code that fits every clue so far (`suggestion`), counted as one hint per door.

**Rules and tests (`logic.ts`, `logic.test.ts`, 6 tests):** scoring (green first, yellow never more than are missing), codes that fit the plan, a miss only for an ignored clue and never for the real code, suggestions that agree with every clue and open the door when followed, a reasoning player that cracks every code without ignoring a clue, and detective doors with two or three distinct non-answer tries that leave exactly one code.

**Couch:** live-controller play (`liveController`): left and right choose a stone, the bottom button places it or turns the key, the left button takes the last stone back. A trip stop (levels 4, 5, 6, school) with a `twin` face-off scored by keys turned (lower is better); unlock tier 3 with Light Lab. One course, The Code Doors (slice 6). The bot (`nextMove`) also drives the how-to card's ghost finger (first candidate, slot by slot, then the key).

**Content around it:** voice lines `code.*` and `couch.how.secret-code`; a level-scoped how-to card; co-play hint ("say what the marks tell you") and an off-screen three-toys game.

**Known gaps (found in this session; the first three were fixed by batch 1, 2026-11-03):**

- **Fixed: a miss for a clue she can no longer see.** `layoutPast` shows only the tries that fit between the top of the screen and the door: on the 1024 by 768 landscape view `doorY` is 460, so about four rows fit, and older rows are hidden. `ignoredClues` reads the whole history, so on level 5 (four slots, often six or more tries) she can be charged a miss for a mark that has scrolled away. Memory load is exactly what the rules for every activity keep out.
- **Fixed: a stale hint.** The faint stones are computed once per door (`hinted`), then stay in every empty slot for the rest of the door. After a later try they can show a stone the new marks rule out; following the hint can then count as an ignored clue.
- **Fixed: gray wording at yellow levels.** `code.yellow` says gray means "it is not in the code at all". At levels 3–6 the tray lets her put the same colour in two slots; when the code holds it once, the second copy is gray although the colour is in the code. "No more of that stone" is the accurate meaning.
- **Two miss rules.** Levels 1–6 read one mark at a time (a green stone moved to another slot at a no-repeat level is not a miss, although it is ruled out); level 7 reads every clue together. The leniency is fine, but the how-to card and GAMES entry should say which rule a level uses so a new level picks one on purpose.
- **The automatic hint counts as help.** Faint stones after `slots + 4` tries add a hint although nothing went wrong, which feeds the step-down rule. Kept as is (it is real help); noted so a new level does not copy it blindly.
- **Person checks:** the Wonder Woods device check already lists "Secret Code's marks"; couch pacing (its demo runs 30–40 s) is in the couch device checks. No observation of a child playing it is recorded.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Mastermind* (Mordecai Meirowitz, 1970; [Wikipedia](https://en.wikipedia.org/wiki/Mastermind_(board_game))) | Two-player board game | Code length and colour count; repeats and blanks allowed by rule variants; a codemaker and codebreaker swap each game | Already the base; the **codemaker's** side as a level she plays alone (**level 9**) | A fixed number of rows that ends the game; scoring the maker by the breaker's failures |
| *Mastermind for Kids* and *Mastermind Junior* (Pressman; Goliath; retailer pages via search only: [Goliath](https://www.goliathgames.us/product/mastermind-for-kids/), [rules summary](https://officialgamerules.org/game-rules/mastermind-for-kids/)) | Children's editions | Animal pegs, larger holes, "three levels" of play; ages from about 6 on the boxes | Pictures as well as colours (already: shapes on stones); a smaller code as the way in (**level 10**) | Hole counts are not established here (search sources contradicted each other) |
| *Bulls and Cows* (pencil-and-paper, 19th–20th century; [Wikipedia](https://en.wikipedia.org/wiki/Bulls_and_cows)) | Number game | Four digits, no repeats; feedback is only *counts* of bulls and cows, not per position | Shows the island's per-slot marks are the gentle form; counts-only feedback is a much harder rule | Counts-only marks for children; it is a grown-up variant if ever |
| *Wordle* (Josh Wardle, 2021) and its Hard Mode ([Mental Floss](https://www.mentalfloss.com/fun/games/wordle-hard-mode-how-it-works), via search) | Daily word game | Six rows; Hard Mode: "any revealed hints must be used in subsequent guesses" (greens locked, yellows kept); grays may be reused | The island already *counts* ignoring a clue rather than refusing it; Hard Mode confirms that "use what the marks said" is a known, liked rule | Six-row limit, daily streak, the share grid as a score; refusing a try |
| Neopets, *Time Tunnel* (the game's named reference) | Web minigame | A colour-and-place code over rounds | Already the base | Neopoints for guesses, the round limit |
| Donald Knuth, "The computer as Master Mind" (1977; summarised in [Wikipedia](https://en.wikipedia.org/wiki/Mastermind_(board_game)#Five-guess_algorithm) and [arXiv 1908.06183](https://arxiv.org/abs/1908.06183), via search) | Algorithm | Picks the try whose worst mark pattern leaves fewest codes; every 6-colour, 4-slot code in five tries | A *fixed* reference solver gives the couch course a par (the October 23 rule); minimax names "which try tells more" for a later level | Racing the solver; showing a child the solver's count as a target |
| *Turing Machine* (Scorpion Masqué, 2022; [Board Game Quest review](https://www.boardgamequest.com/turing-machine-review/), via search) | Deduction board game | A three-digit code; each turn you choose which *verifier* to ask about a test code, so the decision is the question, not only the answer | Choosing an informative question is the step after cracking codes (left as a later definition) | Competitive race, round counting |
| *Zendo* (Looney Labs; already in the [inquiry study](subjects/inquiry.md)) | Induction game | Build examples, receive a yes/no on a hidden rule | Owned by Rule Machine and Critter Crossing on the island, not Secret Code | — |
| Hide three toys behind your back (the game's off-screen card) | Physical | Any number of toys | Already the off-screen card; level 9 is its on-screen mirror (she hides, the pet guesses) | — |

**Learning purpose.** Deduction from evidence: keeping several marks in mind, ruling out, and (for the maker) predicting what feedback a try will get. It sits under the Common Core Standards for Mathematical Practice MP1 (make sense of problems and persevere) and MP3 (construct viable arguments) ([corestandards.org](https://www.corestandards.org/Math/Practice/)), as the [standards audit](subjects/standards-audit.md) places Secret Code with the island's logic puzzles. No age claim for the preschool opening is made from a source; it is a person check.

## What makes sense here

The game is complete, tested and has a bot; what it lacks is **fairness on long doors** (the hidden-row miss), **a hint that keeps up**, **a gentler way in** for a four-year-old, and **a second side of the puzzle**: she always breaks, never makes or marks. Everything below reuses `score`, `candidates`, `nextMove` and the built tray, slots and key:

- **Fixes and fresh doors** are small and inspectable: misses read only the rows on screen; the hint recomputes after each try; the gray line says "no more of that stone". Fresh content is the door itself: three seeded code-drawn doors (the wooden door, a garden gate, a treasure chest) around the same slots, so replay varies without changing a rule.
- **A four-slot door with a repeat** (level 8) is a plan entry on the built interaction; candidates are 625, which the tests and the bot already handle.
- **Be the door** (level 9): she makes a code (free, never wrong) and the pet tries to crack it; she gives each slot its mark, and her marks steer the pet's next try. Marking is where a child shows she understands green, yellow and gray; it is Mastermind's other seat and the solo side of the family table's [Make One for Me](../IDEAS.md#mario-party-and-the-family-table-2026-10-11).
- **One slot** (level 10) opens preschool: three stones, one slot; a gray cross dims that stone in the tray, so "not this one" is visible. Pre-K keeps level 1 as its entry.
- **A bigger detective door** (level 11): four slots, five colours, three shown tries (built; a fourth row would not fit above the door at `doorY` 430). `detectiveDoor` scans every candidate per clue (about 600 by 625 scores per clue at 5^4), well under the 250 ms the rule test allows.

Not here: counts-only feedback (Bulls and Cows), Word Code (its own [IDEAS](../IDEAS.md) row), five slots or six colours (portrait's 768-unit short side fits four slots and the key; a fifth slot puts the key's 56-unit radius off the screen, and `MARKS` has five shapes).

**Long-term arc:** a preschooler finds the one stone behind a door; pre-K cracks two and three slots with yes/no marks; at school she meets yellow, four slots and repeats, marks the pet's tries on her own code, then solves detective doors from shown evidence; a family pair later swaps maker and breaker; a grown-up plays a fixed-par course on the couch.

## Experience and presentation

- **First unsupported action:** any try. On level 10 a single tap and the key give a green or a gray at once; on level 9 the first action is choosing her own code, which cannot be wrong.
- **Touch and consequence:** a stone pops into its slot (built, `outBack` scale and a pitched pop); the key knocks; marks pop in one by one with a tick. On level 9 a mark disc under each slot flips through gray, yellow and green with a soft click on touch-down; **Show the pet** sends the marks, and the pet's thought bubble shows the stones it now rules out before it tries again, so her marking visibly drives its next guess.
- **Variety without changing the rule:** seeded doors (wood, garden gate, chest), seeded codes, the pet's choice among fitting tries (`candidates` in seeded order rather than always the first).
- **Reasoning versus memory and motor:** every try that counts stays on screen; targets stay 112-unit stones and 116-unit slots; level 9's mark discs are 100 units under 124-unit slot spacing. Reading is never needed: marks are shapes as well as colours.
- **Supported ending:** faint stones after two misses (refreshed); the door always opens; one sticker per round. On level 9 the right mark glows after two wrong marks on the same try, and the pet always cracks the code (it is the solver), so the round always ends.
- **Co-play:** the built hint ("say what the marks tell you") fits every level; level 9 gives a grown-up an easy role (hide toys, then let her mark) and is the solo form of maker/breaker.
- **Art example:** the garden gate is a `Graphics` frame of two `wood.fill` posts and five rounded pickets (`roundRect`, `wood.line` stroke) over the same 164-unit slot board, with a leaf sprig from `swatch.green`; the opening light pours between the pickets as the gate's two halves tween apart (`ctx.tw.to` on `scale.x`), the same leaf the built door uses.
- **Needs a person or device:** whether a four-year-old reads the gray cross on level 10 as "not this one" without the card; whether marking the pet's try (level 9) feels like being the boss of the door or like a test; whether the faint hint stones are noticed on an iPad in daylight.

## Proposed ladder

### Fresh content inside existing levels

| Change | Where | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- |
| Misses only from tries on screen | `ignoredClues(plan, visible, guess)` with the visible rows from `layoutPast`'s count | A stone ruled out only by a hidden row is not a miss; one ruled out by a shown row still is | `index.ts` passes the visible slice; level 7's shown clues are never hidden (2–3 rows) |
| A hint that keeps up | After each try on a hinted door, recompute `suggestion` against the new history without charging another hint | The shown faint code always fits every clue | `index.ts` only |
| "No more of that stone" | `code.yellow` and the how-to step from level 3 | — (voice and card text) | Voice line, how-to card |
| Three seeded doors | Wooden door, garden gate, treasure chest; same slot geometry and key | The door choice is seeded and never changes the code or marks | Code-drawn in `index.ts`; sticker unchanged |

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | Four slots, a repeat | school (after 7) | 4 slots, 5 colours, yellow, every code has a repeat; 2 doors | Whether a repeat explains four marks | As levels 1–6 (repeat-aware `ruledOut`) | Codes always repeat; the reasoning bot cracks every seed without an ignored clue; suggestions fit | Plan entry, describe line, how-to step, `code.repeat` reused; bot unchanged; new-level tier |
| 9 | Be the door | school (after 4 in `order`) | She fills 3 slots from 4 colours (repeats allowed; free) and taps **Ready**; the pet tries a code; she sets each slot's mark (gray, yellow, green) and taps **Show the pet**; 2 codes | What mark each of the pet's stones earns | A wrong mark is a miss: the slot wobbles and the pet asks "are you sure?" naming the stone; after two wrong marks on one try the right mark glows (a hint). Her code is never wrong | The right marks are `score(code, try)`; with right marks the pet (seeded candidate) cracks every 3-slot, 4-colour code within a bound the test pins; the pet's tries always fit every mark so far | New interaction: mark discs, Ready and Show-the-pet buttons, the pet's thought bubble; voice lines; bot (`autotouch`: make a seeded code, then the right marks); how-to steps; not on the couch |
| 10 | One slot | preschool (entry) | 1 slot, 3 stones, yes/no marks; 3 doors | Which stone is behind the door | No miss is possible except a stone already crossed out, which is dimmed in the tray; trying it is a soft boing and a miss; the glow after two | Every door opens within 3 tries; a gray dims exactly that stone | Plan entry with `slots: 1`; the dimmed tray stone is level-10 only; preschool `order: [10, 1]`, `entryLevels: [10]`; new-band tier (lands page-fit for preschool Puzzle Peaks) |
| 11 | A bigger detective door | school (top) | 4 slots, 5 colours, no repeats; three or four shown tries | The one code that fits every shown mark | As level 7 (`contradictsClues`; one miss per inconsistent try; faint stones after two) | Doors are unique with at most four distinct non-answer clues over 300 seeds; generation stays under a time bound | `detectiveDoor` takes a clue cap; layout of four shown rows; how-to step; new-level tier with a layout check |

School `order` becomes `[2, 3, 4, 9, 5, 6, 7, 8, 11]` (max 11); pre-K stays 1–3; preschool `[10, 1]`.

### Younger-band openings

Level 10 opens preschool, then level 1 (two slots). Pre-K keeps 1 as its entry; level 10 is not in pre-K's order. A birthday from preschool into pre-K lands on 1 by the built nearest-in-order rule.

### Easier entries and levels between existing ones

Level 9 sits between 4 and 5 in school's order (marking yellow before four slots); level 10 is appended with `entryLevels: [10]`. No ID is renumbered and no pin moves; the couch's `level(stop)` (4, 5, 6) is unchanged.

### Level 12 *Swap seats*: maker and breaker (defined 2026-11-05)

Chunk 23's [one shared job](../FAMILY-EXPERIENCE.md#w3-one-shared-job), built on level 9. It follows the October 23 [second-seat contract](../archive/DECISIONS-2026-10-23.md#standing-rules) (S5: the second seat is anonymous and uncredited, only seat 1's play is read by `difficulty.ts`, and a role-swapped round counts as supported completion). The turns are sequential, so it needs no simultaneous input and no hidden personal screen.

- **Fun action and learning.** She hides a code from a real person and marks that person's tries. Then they swap seats, and she cracks a code the person made. Both seats make a real decision: the grown-up reasons from her marks, and she reasons from the island's marks. The grown-up never answers for her. Marking a person's try is level 9's skill, now with a reason to get it right: a wrong mark would mislead someone she is playing with.
- **Plan.** `12: { slots: 3, colors: 4, yellow: true, repeats: true, codes: 1, maker: true, swap: true }`, the same 64 codes as level 9. Neither seat can make a code bigger or longer than the plan allows, so every code a grown-up makes is fair, with no rule about which code is allowed. School only. A pre-K form (level 2's yes/no marks) waits until a pre-K child is seen marking.
- **Who is playing.** The round opens on two round buttons, at least 112 units each, side by side above the tray. One shows two figures (**Two of us**); the other shows the pet's face (**Just me**). `code.seats` asks the question aloud, so she needs no reading. The choice lasts for the round.
- **Two of us, first half: she makes and marks.**
  1. `code.lookaway` asks the grown-up to shut their eyes. She makes a code from the tray and taps the check, exactly as on level 9; her code is never wrong.
  2. A wooden lid (a `wood.fill` panel the size of level 9's 400 by 124 code panel) closes over her code. `code.grownupbreak` tells the grown-up to open their eyes, put stones in the door and turn the key. Seat 2 uses the breaker's tray, slots and key from levels 3–6, but the island gives no marks.
  3. When the key turns, the lid opens. Her mark discs appear (level 9's `cycle`; `code.markgrownup`, then `code.nopeek` the first time, asking the grown-up to look away while she marks). She taps the arrow. `wrongMarks` checks her marks, and a wrong one wobbles and plays `code.sure` (a miss). The right marks move up beside the try, the lid closes, and the grown-up tries again.
  4. The half ends when the grown-up's try is all green. If seat 2 has made `slots + 4` tries, faint stones (`suggestion`) appear for them, and they are not counted.
- **Two of us, second half: they swap.** `code.swap` asks her to shut her eyes while the grown-up makes a code from the same tray and taps the check. The lid closes over it. `code.crackit` tells her to open her eyes and crack the grown-up's code. She then breaks it with levels 3–6's rules and the island's marks (repeat-aware `ruledOut`, misses from rows on screen only). The door opens and the lid lifts to show the grown-up's code. This is one sticker; the round ends after the two halves, one code each.
- **Just me** (the solo fallback; nothing new is built for it). The pet takes seat 2: the first half is level 9's pet breaking her code (`petTry`), and the second half is a seeded `makeCode` door she breaks, with no lid and no look-away lines.
- **Accounting.**
  - Every miss and hint is hers. In the first half, a wrong mark is a miss and the glow after two wrong marks on one try is a hint (level 9). In the second half, an ignored clue is a miss and the faint stones after two misses or `slots + 4` tries are a hint (levels 1–6).
  - Seat 2's tries and their faint stones never count.
  - A **Two of us** round finishes through a pure `swapResult(twoSeats, misses, hints)` in `logic.ts`, which returns `hints: Math.max(hints, 1)` when two seats played. The round is therefore never smooth (it cannot step her up on a grown-up's easy code or play), but a struggle still reads her own misses.
  - **Just me** passes her result unchanged.
  - There is no shell change and no new `RoundResult` field.
- **Placement.** School `order` becomes `[2, 3, 4, 9, 12, 5, 6, 7, 8, 11]` with max 12. It comes right after level 9 because it uses level 9's plan. A pin, or the how-to card's arrows, take a family straight to it.
  - A child who steps up into 12 alone meets the seat question and plays **Just me** at level 9's difficulty, so adaptation never strands her in a mode that needs a second person.
  - Placing it at the top (after 11) was rejected: a two-seat mode is not harder than 11, and a solo round there would be easier than the level below it.
  - No ID is renumbered. Not on the couch.
  - The "two seats" mark on a game's icon (decided under S8) is shell work for its own slice and is not part of this level.
- **Voice** (7 new `code.*` lines):
  - `code.seats` (who is playing with you?)
  - `code.lookaway` (grown-up, shut your eyes while she makes a code)
  - `code.grownupbreak` (open your eyes, put stones in the door and turn the key)
  - `code.markgrownup` (give each of the grown-up's stones its mark)
  - `code.nopeek` (no peeking while she marks)
  - `code.swap` (swap seats: you shut your eyes while the grown-up makes a code)
  - `code.crackit` (open your eyes and crack the grown-up's code)

  `code.sure`, `code.markall`, `code.makefill` and `code.open` are reused. The lines speak to "the grown-up" and use no seat-2 name.
- **Bot (`autotouch`).** It plays **Two of us** end to end:
  - taps the two figures;
  - makes `demoCode` and taps the check;
  - plays seat 2's tries with `nextMove` (against her code), then gives the right marks;
  - makes a seeded `madeCode` as seat 2;
  - breaks it with `nextMove`.
- **The networks pointer** ("a code everyone guesses first time is no lock", [networks study](subjects/networks-citizenship.md)) is declined here. Showing a code's strength as a count of guesses is a score shown to the child, and level 9 already cut the pet's tally recap. The pointer stays with the networks study.
- **Rule tests.**
  - `swapResult` is never smooth with two seats, whatever the misses and hints, and is unchanged for **Just me**.
  - Seat 2's tries never produce a miss (`ignoredClues` is read only on her breaker half).
  - Every code either seat can make fits the plan (3 slots, 4 colours).
  - With right marks, `nextMove` cracks every one of the 64 codes, which bounds the bot's first half.
  - The school `order` test lists 12 after 9.
- **Check tier: new interaction.**
  - Typecheck and the unit tests above.
  - One scripted play of level 12 with **Two of us**: one wrong mark in the first half, then the second half with one ignored clue, to the sticker. Assert `misses >= 2` and `hints >= 1`.
  - One portrait screenshot of the seat question and one of the lid closed over her code.
  - `fingerdemo` at 12.
  - `npm run build` only if shared files change.
- **Needs a person:** whether a six-year-old marks a grown-up's tries honestly and enjoys it, and whether the look-away moments feel like a game or a chore. Both go in [DEVICE-CHECKS](../DEVICE-CHECKS.md) when it is built.

### Left out on purpose

- **Which try tells more?** (Knuth's minimax as a choice between two offered tries, every tie accepted): a good school-top idea that needs its own definition of how a non-best pick is shown without being a miss.
- **Counts-only marks, a row limit, a timer, a score shown to the child.**
- **Five slots or six colours** (portrait width and the five shapes).

## Decisions for the developer

None. Placement, band openings and accounting follow the stated leans (S8); the second seat follows S5; the couch par follows the October 23 fixed reference-solver rule.

## Build slices, in order

1. **Fair rows, a hint that keeps up and three doors (batch secret-code 1).** Built 2026-11-03 ([PR #1144](https://github.com/rjdunlap/neo/pull/1144); [checks](../archive/VERIFICATION-2026-11-03.md#2026-11-03--secret-code-fair-rows-a-hint-that-keeps-up-and-three-doors-secret-code-batch-1)): misses only from tries on screen, the refreshed hint, the "no more of that stone" line, three seeded doors. *Check (passed as planned):* existing-game fix tier: typecheck, the game's rule tests (the hidden-row case, the refreshed hint fits), one filtered regression play of level 5 in landscape with seven tries and a stone ruled out only by a hidden row (no miss), one portrait screenshot of the gate; bot unchanged, no `fingerdemo`.
2. **Level 8 Four slots, a repeat (batch secret-code 2),** after batch 1 (shares the plan table and the visible-rows rule). *Check:* new-level tier: typecheck, rule tests, one play of level 8 to its sticker, `fingerdemo` at 8. Built 2026-11-04 ([PR #1238](https://github.com/rjdunlap/neo/pull/1238); [checks](../archive/VERIFICATION-2026-11-04.md#2026-11-04--secret-code-level-8-four-slots-a-repeat-secret-code-batch-2)): one new plan, the same miss rule as levels 1–6, the `code.repeat` line reused, no new voice lines; couch unchanged. *Check (passed as planned).*
3. **Level 9 Be the door (batch secret-code 3),** after batch 1. *Check:* new-interaction tier: typecheck, unit tests including `order`, one scripted play of level 9 with a made code, one wrong mark, a second for the glow, then to the sticker; one portrait screenshot with the mark discs; `fingerdemo` at 9. Built 2026-11-05 ([PR #1246](https://github.com/rjdunlap/neo/pull/1246); [checks](../VERIFICATION.md#2026-11-05--secret-code-level-9-be-the-door-secret-code-batch-3)): school only (`order` 2, 3, 4, 9, 5, 6, 7, 8, 11; pre-K stays 1–3), eight new `code.*` lines, the pet's tally recap cut and a three-dot bubble, no couch.
4. **Level 10 One slot, the preschool opening (batch secret-code 4),** after batch 1. *Check:* new-band tier: typecheck, unit tests including the lands and registry band tests, one play of level 10 at preschool with one crossed-out stone tried, `fingerdemo` at 10, the preschool Puzzle Peaks page screenshot. Built 2026-11-05 ([PR #1249](https://github.com/rjdunlap/neo/pull/1249); [checks](../VERIFICATION.md#2026-11-05--secret-code-level-10-one-slot-secret-code-batch-4)): preschool `order` [10, 1], four new `code.*` lines, Secret Code on the preschool Puzzle Peaks page; couch unchanged. *Check (passed as planned).*
5. **Level 11 A bigger detective door (batch secret-code 5),** after batch 2 (shares the order). *Check:* new-level tier with a layout check: typecheck, rule tests (uniqueness and the time bound), one play of level 11 with one contradicting try, one portrait screenshot of the shown rows, `fingerdemo` at 11. Built 2026-11-04 ([PR #1243](https://github.com/rjdunlap/neo/pull/1243); [checks](../archive/VERIFICATION-2026-11-04.md#2026-11-04--secret-code-level-11-a-bigger-detective-door-secret-code-batch-5)): the clue cap is three, not four, so all rows fit at the highest door place; the school `order` is 2–8 then 11 until level 9 is built. *Check (passed as planned, three clues).*
6. **Couch course The Code Doors (batch secret-code 6),** after batch 1: five frozen codes at levels 4–6, par from the fixed reference solver (`nextMove`) per the October 23 rule. *Check:* couch catalog tier: course tests, `BROWSER_SUITE=couchgames` filtered to Secret Code. Built 2026-11-05 ([PR #1255](https://github.com/rjdunlap/neo/pull/1255); [checks](../VERIFICATION.md#2026-11-05--secret-code-couch-course-the-code-doors-secret-code-batch-6)): five frozen codes at levels 4, 4, 5, 5 and 6, par 16 from `solverTries`; a new `CourseInfo.reference` flag says par instead of "the fewest possible"; one voice line; new suite `couchcodedoors`. *Check (passed as planned).*
7. **Define Secret Code maker and breaker** (docs only; chunk 23). Defined 2026-11-05: [level 12 *Swap seats*](#level-12-swap-seats-maker-and-breaker-defined-2026-11-05).
8. **Level 12 Swap seats (batch secret-code 7),** after batch secret-code 3 (built; it reuses level 9's mark discs). *Check:* new-interaction tier as stated in [its definition](#level-12-swap-seats-maker-and-breaker-defined-2026-11-05).

## What was built in this session

Nothing: a deep dive session is research and ideation only (links and `git diff --check` ran).
