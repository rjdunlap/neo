# Brain Break deep dive

*ID `brain-break` · band grown-up · levels 1–6 on 2026-11-18 · session `claude/dive-brain-break` ([PR #1786](https://github.com/rjdunlap/neo/pull/1786))*

## The game today

A pond of square stones, each 100 units across, on a shuffled 3×3, 4×4 or 5×5 board. The player lights the stones in number order from 1 up. A sign above the pond names the next target ("Find 7 · 6 / 16") and the voice repeats it after every right stone; a lit stone dims, gains a check and stays where it is. The purpose is visual search in number order and, from level 4, adding and taking away within 30 while searching. It is grown-up only, in Lantern Lake, upright on a phone, touch or mouse, with a ghost finger; there is no couch entry. The grown-ups' text claims practice on this task only.

| Level | Plan name | Band window | What the player decides |
| --- | --- | --- | --- |
| 1 | Find 1 to 9 on nine shuffled stones | grown-up | Where the named number is |
| 2 | Find 1 to 16 on sixteen shuffled stones | grown-up | The same, among more stones |
| 3 | Find 1 to 25 on twenty-five shuffled stones | grown-up | The same, among more stones |
| 4 | Find the sums that make 1 to 9, in order | grown-up | Which sum (`3+4`) makes the named total |
| 5 | Find the sums that make 1 to 16, in order | grown-up | The same, drawn addend up to 9 |
| 6 | Find sums and take-aways that make 1 to 25, in order | grown-up | The same, with at least ten sums and ten take-aways (`29−4`) |

**What a round draws from.** `makeBoard` shuffles the totals 1..N with the seeded RNG, so a level's only variety is where each number sits. `makeLabels` adds the sum for each stone at levels 4–6: the drawn addend is 1–9, the pair is written in either order, and at level 6 the kinds are dealt so each has at least ten stones. `judge` and `hintIndex` work on the totals, so the bot and the hints are the same at every level.

**Accounting.** A different unlit stone is one miss, with a boing and a spoken reminder (at 4–6, what the touched stone makes). Two misses in a row, or the Hint stone, outline the target and count one hint. A lit stone is free to touch. Lighting the last stone finishes through the shell for one sticker, including with help.

**Known gaps.**

- Nothing changes from level to level except the board size and whether the stones show sums: levels 1–3 are one task at three lengths, and so are 4–6.
- The sign always names the target, so at levels 1–3 the player never has to work out what comes next; the search is the whole task.
- A wrong stone answers with sound and speech only. Nothing on the stone itself moves, and a right stone dims without any squash or spark (`choose` in `index.ts`).
- The finish is one spoken line. The order the player just traced across the pond is never shown.
- Every round looks the same: one blue pond, teal stones.
- The first definition's "color words" slice was ruled out in the second definition (untimed, it reduces to reading the word); this dive keeps it out.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Schulte tables](https://ru.wikipedia.org/wiki/%D0%A2%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D1%8B_%D0%A8%D1%83%D0%BB%D1%8C%D1%82%D0%B5) | Paper attention exercise; the game's source | A 5×5 grid of 1–25 found in order; variants count down, or use letters | Counting down and letters as new trails on the same board | The stopwatch, which is the exercise's whole measure, and its speed-reading claims |
| Gorbov–Schulte red-and-black table (described on the same page) | Paper switching task | Two interleaved series: black numbers up, red numbers down, alternating | Two trails held at once, one forward and one back | Colour as the only cue; the time difference as a score |
| [Trail Making Test](https://en.wikipedia.org/wiki/Trail_Making_Test) | Clinical paper test, parts A and B | A joins 1–25; B alternates 1, A, 2, B … | Numbers and letters alternating: no colour needed, and a second person can own one trail | Timing, error scoring and anything that reads as a diagnosis |
| [1to50](https://zzzscore.com/1to50/en/) | Web and phone tap game | 25 cells; each tapped cell is replaced by one from 26–50; a best time and a world ranking | Proof that the tap-in-order action is satisfying on a phone | Best time, ranking, replaced cells (lit stones here stay as a visible trail) |
| [Brain Age](https://en.wikipedia.org/wiki/Brain_Age:_Train_Your_Brain_in_Minutes_a_Day!) and [Lumosity](https://en.wikipedia.org/wiki/Lumosity) | Daily "brain training" collections | Timed sums, a daily stamp, a "brain age" or index that should improve | Short sums as content, already built at 4–6 | The clock, daily streaks, a personal index, and the training claim; Lumosity's maker settled a deceptive-advertising case over that claim in 2016 (see its page) |
| [Hidato](https://en.wikipedia.org/wiki/Hidato) and [Numbrix](https://en.wikipedia.org/wiki/Numbrix) | Number-path logic puzzles | Consecutive numbers must touch; bigger grids and fewer givens | The pleasure of seeing the whole path drawn at the end | The deduction itself: Island Bridges and Sudoku Garden already cover grid logic |
| [Connect the dots](https://en.wikipedia.org/wiki/Connect_the_dots) | Children's paper puzzle | More dots; the order draws a picture | A line from each lit stone to the next, so the round leaves a drawing | A fixed picture (the board is shuffled, so the line is an abstract ribbon) |
| [Rack-O](https://en.wikipedia.org/wiki/Rack-O) | Card game | Ten cards from 1–60 must end up in ascending order | Ordering numbers that are not consecutive: comparing replaces finding | Hidden cards and luck |
| [Skip counting](https://en.wikipedia.org/wiki/Skip_counting) on a hundred board | School and Montessori practice | Count by twos, fives and tens, then the harder steps, then backwards | The step is the rule, and the player works out the next number | Chanting to a beat |
| [24](https://en.wikipedia.org/wiki/24_(puzzle)) | Arithmetic card game | Four numbers, any operations, make 24 | Several operations in one round (level 14 below) | Racing another player to slap the card |
| [Stroop task](https://en.wikipedia.org/wiki/Stroop_effect) | Laboratory colour-word task | Name the ink, not the word, as fast as possible | Nothing | The whole task: without a clock it is reading |

No school standard applies, since the band is grown-up; the ordering levels below use ordinary arithmetic facts (comparing integers, common fractions and one-place decimals).

## What makes sense here

Every reference that keeps the Schulte board grows by **changing the trail**, not by adding pressure: count down, count by a step, alternate two series, or order numbers that are not consecutive. Those all fit, because the action (find the next stone and tap it) and the accounting stay exactly as built. What does not fit is the thing the originals measure: seconds. Without a clock, levels 1–3 are restful but thin, so the ladder's growth has to come from the player **working out what comes next** rather than from searching faster.

That gives the arc. Levels 1–6 keep the sign naming the target. From level 7 the sign names the *rule* and the last stone lit ("Count by 3 · after 12"), and the player decides what the next number is before searching for it; the Hint stone and the two-miss outline still name and show the target, so supported completion is unchanged. The last levels compare instead of count: any sixteen numbers smallest first, numbers below zero, fractions beside decimals, then nine small sums, take-aways and times to work out and put in order.

The board stops at 5×5. A sixth column would shrink the stones below 100 units on an upright phone, which the controls rule forbids, so longer rounds are not a direction.

One model change carries every new level. Today the board holds totals 1..N and the label shows that total or a sum that makes it. If the board instead holds **ranks** 1..N and a per-level trail supplies what each rank shows and how it is spoken, then `judge`, `hintIndex`, the layout, the miss and hint counts and the ghost-finger bot need no change at any new level.

## Experience and presentation

**First action without help.** Tap the stone marked 1. The sign and the voice both name it, and nothing else on screen is tappable except Hint, so a first-time player cannot be lost.

**Touch and consequence.** A right stone chimes on a pentatonic step, dims and gains its check; the sign moves on. That is enough to read but not much to enjoy. A wrong stone boings and the voice responds, but the stone does not move. Slice 1 adds a short press squash on every tap, a side-to-side nudge on a wrong stone (through `ctx.tw`, cancelled in `destroy`), and the trail below.

**A concrete art example: the trail you made.** When stone *n* lights, a `Graphics` ribbon about 10 units wide in `swatch.yellow.line` at half alpha draws from stone *n − 1* to stone *n*, beneath the stones. By the end the pond holds one wandering line through every stone, different on every board. At the finish, before the spoken line, a bright dot runs the ribbon from the first stone to the last over about two seconds, each stone ringing its pentatonic step from `src/audio/notes.ts` as the dot passes. No score, no time: the reward is seeing and hearing the order just made.

**What varies on replay.** Today only the shuffle. Slice 1 adds three seeded pond looks in palette colours (day pond, dusk with lantern-yellow stones, mossy green), as Snowball Merge's field looks do. The new levels add real variety: the step at the count-by levels, the numbers drawn at the ordering levels.

**Reasoning, reading, memory, motor.** Motor demand is one tap on a 100-unit target. Reading is a numeral or a four-character label. No level asks the player to remember anything hidden: every stone stays visible and lit stones keep their checks. The reasoning is the count, the comparison or the sum.

**Supported ending and stopping.** Hint is always there and never blocks the sticker; one round is one board, between about fifteen seconds (nine stones) and two minutes (twenty-five sums), and leaving mid-board loses nothing but that board.

**Co-play.** Two people on one phone already take turns. The two-trail levels give each a real role: one owns the numbers, the other the letters, and they alternate taps. Solo play is unchanged.

**What a phone playtest can answer.** Whether a 25-stone board feels restful or long with no clock; whether a sign that names the rule rather than the target is welcome from level 7 or should arrive later; whether four-character labels such as `3/10` are comfortable to read on an upright phone.

## Proposed ladder

### Fresh content inside existing levels

The press squash, the wrong-stone nudge, the trail ribbon with its replay at the finish, and three seeded pond looks, at all six levels (slice 1). No rule, label or accounting change.

### New levels on top

Level IDs are appended in the order built and never renumbered; the numbers below assume the slices are built in the order listed. All are grown-up levels. At every one, a different unlit stone is one miss, two misses in a row or the Hint stone outline the target and count one hint, a lit stone is free to touch, and the bot taps `hintIndex`. Each row's cost includes its plan name, a how-to line scoped with `from`, and its voice lines.

| Level | Name | Band window | First round | What the player decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Count by twos, threes, fives or tens | grown-up | 4×4; the step is drawn per round; sign "Count by 3 · start at 3", then "Count by 3 · after 12" | What the next number is, then where it is | "That one is 21. Count on three from 12." The hint says and outlines the target | The stones show exactly k, 2k … 16k for a step from the pool; the hint stone is the next multiple; the same seed gives the same step | The rank model and the rule sign (shared by every later level); two voice lines |
| 8 | Count by harder steps, up or back | grown-up | 5×5; step from 4, 6, 7, 8, 9; half the rounds start at the top and count back ("Count back by 7 · start at 175") | The same, with harder facts and both directions | As 7, with "count back" wording | Values are k … 25k, at most three digits; direction is seeded; counting back reverses the ranks exactly | Small once 7 exists; two voice lines |
| 9 | Any sixteen numbers, smallest first | grown-up | 4×4; sixteen different numbers from 1–99; sign "Smallest first", then "After 37" | Which unlit number is the smallest | "That one is 52. A smaller one is still unlit." | All sixteen are different and within 1–99; every board holds one pair with swapped digits (37 and 73); rank order equals numeric order | Board generator; two voice lines |
| 10 | Below zero | grown-up | 5×5; twenty-five different whole numbers from −20 to 20 with a true minus sign | The same, where −12 comes before −3 | As 9; the wrong-stone line reads the sign aloud ("minus twelve") | Different values within range; at least eight below zero and eight above; at least one pair *n* and −*n* | Spoken form for negative numbers |
| 11 | Two trails: 1, A, 2, B | grown-up | 4×4; stones 1–8 and A–H; the sign shows the last two lit ("3 · C · ?") | Whose turn it is, numbers or letters, and what comes next on that trail | "That one is D. After C comes a number." | The order is exactly 1, A, 2, B … 8, H; letters and numbers alternate | Letter labels; the co-play line names the two roles |
| 12 | Two trails, there and back | grown-up | 5×5; numbers 1–13 going up, letters L–A going back: 1, L, 2, K … | The same, with one trail running backwards | As 11, naming the direction | The order is exactly 1, L, 2, K … 12, A, 13 | Small once 11 exists |
| 13 | Parts in order | grown-up | 3×3; nine values between 0 and 2 written as common fractions (`3/4`) or decimals (`0.6`); smallest first | Which is smaller, such as `2/3` or `0.7` | "That one is three quarters. A smaller one is still unlit." A lit stone keeps its label | Nine different values at least 0.03 apart; at least three fractions and three decimals; denominators only 2, 3, 4, 5, 8, 10; labels at most four characters | A curated pool with a spoken form for each entry |
| 14 | Work them out, smallest first | grown-up | 3×3; nine sums, take-aways and times (`6×7`, `15−8`, `9+4`) with different answers; smallest first | What each makes, then their order | "That one makes 42. A smaller one is still unlit." A lit stone shows its answer, as at 4–6 | Nine different answers within 1–81; at least two of each kind; operands within the level 6 bounds, times tables to 9; labels at most four characters | `evaluate` learns `×`; reuses the 4–6 reveal |

### Younger-band openings

None built from this dive. Levels 1, 2, 4 and 5 are within reach of a school-age child (number order to 16, sums to 16), but Number Trails and Number Nook already serve that band and the game lives in the grown-up land; see decision 1.

### Easier entries and levels between existing ones

None needed. Level 1 (nine stones, target named) is already a gentle entry, and the ladder stays `min..max` with no `order`.

### Left out on purpose

- **A clock, a best time, a miss count shown as a score, or a daily streak.** They are what Schulte tables, 1to50 and the training apps are built on, and the rules here forbid them.
- **A colour-word (Stroop) round.** Untimed, it is reading.
- **Flashed or hidden numbers.** That turns search into memory under time pressure.
- **Boards wider than five stones.** The stones would fall under 100 units on a phone.
- **A pick-two "make ten" round.** Pyramid Solitaire owns pairing to a total.
- **A couch entry.** Couch play retires at Lands stage E.
- **Any training, attention or ageing claim** in the plan names, voice lines or grown-ups' text. New wording names the task: "counting by a step", "putting numbers in order".

## Decisions for the developer

1. **Open levels 1, 2, 4 and 5 to the school band?** Default: no. Revisit only if a playtest note asks for it; it would need child-form voice wording and a saves audit, as Gem Swap's opening did.
2. **From level 7, should the sign name the rule and the last stone lit, rather than the target?** Default: yes, as designed above; Hint still names the target. If a playtest says it feels like being left alone, the sign can name the target again from one constant.
3. **Fractions written with a slash (`3/4`) or stacked?** Default: a slash, which is text only. Stacked fractions cost a small drawn label and can follow.
4. **Number words in the family's languages (um, dois, três …) as a trail?** Default: not built from this dive. It belongs to the language track and waits for that track's review rule; the rank model would carry it without further change.

## Build slices, in order

1. **The trail you made, a nudge on a wrong stone, and three pond looks** (levels 1–6; **built**, PR #2083). The press squash, wrong-stone nudge, ribbon between consecutive lit stones, its replay with pentatonic steps before `brain.done`, and three seeded looks. Timers and tweens are scene-owned and guarded in `destroy`. Checks: existing-game change: typecheck, the rule tests (the look is seeded; the ribbon visits the stones in rank order), one filtered `brainbreak` regression play of level 2 with one wrong stone, one upright screenshot. `fingerdemo` is not needed because the bot does not change.
2. **Levels 7–8, Count by** (**built**, PR #2091). The rank model (`makeBoard` returns ranks; a per-level trail supplies labels and spoken forms), the rule sign, levels 7 and 8, `LEVELS.grownup.max` 8. Checks: new levels on an existing interaction: typecheck, the rule tests with levels 1–6 unchanged for the same seeds, one browser play of 8 with one wrong stone and the outline, `fingerdemo` at 8, one upright screenshot.
3. **Levels 9–10, Smallest first and Below zero** (**built**, PR #2099). After slice 2. Same tier, played at 10.
4. **Levels 11–12, Two trails** (**built**, PR #2103). After slice 2. Same tier, played at 12; the co-play line gains the two roles.
5. **Level 13, Parts in order** (**claimed**, `claude/brain-break-parts-in-order`). After slice 3. Same tier, played at 13, with the upright screenshot checking the four-character labels; takes decision 3's default.
6. **Level 14, Work them out, smallest first.** After slice 3. Same tier, played at 14.

Not queued: the school opening (decision 1) and family-language number words (decision 4).

## What was built in this session

Nothing: this session was research and design only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
