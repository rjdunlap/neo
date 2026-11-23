# Harbor Orders, levels 1–4 (definition)

Documentation packet, 2026-11-23, branch `claude/define-harbor-orders`, [PR #2031](https://github.com/rjdunlap/neo/pull/2031). Study follow-up ME6 from [money and economy](../deep-dives/subjects/money-economy.md#build-slices-in-order); the study's decision 4 was settled on 2026-10-23 (Harbor Orders replaces the household-budget puzzle), and placement by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed). Proposed game `harbor-orders`; nothing is registered or implemented. **Docs only.** Two build batches follow below.

## What you do

An order card hangs at the jetty on Lantern Lake: so many crates and so many boats, wanted as soon as they can be made. Two or three workshops stand along the shore, and each has a sign showing what it turns out in one morning: this many crates, or this many boats, never both. Lay out the mornings on a planning board, one row for each workshop and one column for each morning, and tap each square to say what that workshop makes that morning. The tallies on the order card fill as you plan. When the order is full, send it. The round is finished when the order is filled in the fewest mornings that can fill it.

The learning is who should make what. The workshop that is best at everything cannot do everything, so the short plan gives each workshop the job it gives up least to do. Economists call this specialization and, when one maker is better at both goods, comparative advantage. The study anchors the first to the C3 Framework's D2.Eco.4.3-5 ("Explain why individuals and businesses specialize and trade"); it recalls the second and does not claim an indicator for it. The game does the arithmetic: the player never adds a column by hand. The work is the plan and the argument that no shorter plan exists.

Use stable level IDs 1–4 and the `grownup` band only. Use Cozy Village as the learning region, the home of Market Stall, Lemonade Stand and Swap Meet, and Logic as the challenge. Add one Lantern Lake tile through the existing land paging; it lands on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. The board and the order are round state. It carries no money, price, wage, profit, inventory, saved plan or record of the fewest mornings: the goods are made and shipped inside the round, as the study's rule that every amount stays inside one round requires.

## Identity and overlap

- **Swap Meet** (`swap-meet`) trades things creatures already hold, and its level 6 adds a Harbor stall that buys and sells for shells. Nothing is traded or priced here: the question is who makes what.
- **Lemonade Stand** (`lemonade-stand`) sets a price against the weather across five days, and **Market Stall** (`market-stall`) owns coins, totals and change. Harbor Orders has no coins and no price.
- **Welcome Ways** Plaza Cases (proposed) budget planks for an entrance; the study keeps budget as a construction constraint there.
- **Village Planner** (proposed, routines) schedules jobs with one cart, where the order of the jobs is the puzzle. Here the order of the mornings never matters; only how many mornings each workshop spends on each good.
- **Maker Harbor** tickets, the fair board and the Harbor Bank (the roadmap's older-child proposals) stay parked. This game shares the harbor's name and scenery only.
- **Not here:** money, wages or prices; a workshop that is paid, idle at a cost or closed down; a score for leftover goods; a timer; a ranking or a best-plan record; a household budget.

## The workshops, the order and the plan

Keep the model in `logic.ts`. It is small and closed.

**Goods.** Crates and boats at every level; lanterns as a third good at level 4. Each good has its own drawn shape, so no good is told apart by colour alone.

**A workshop** has one **rate** for each good: a whole number from 1 to the level's top rate, the number of that good it finishes in one morning spent on it. A workshop makes one good in a morning. Its rates are not all equal, and no two workshops in a board have the same rates. The workshops are named by the shape on their signs, in board order: the **Oar**, the **Anchor** and the **Bell**.

**The order** is a wanted number of each good.

**A plan** is a number of mornings and, for each workshop and each morning, one good or nothing. A plan **fills** the order when, for every good, the rates of the squares making it add up to at least the wanted number. Making more than the order asks is allowed and is not judged.

**Counts, not arrangement.** Two plans are **the same plan** when they have the same number of mornings and every workshop spends the same number of mornings on each good. Swapping two mornings in a row changes nothing, and miss counting, hints and tests all work on these counts.

**The fewest mornings** is the smallest number of mornings in which any plan fills the order. `fewest(board)` finds it by enumerating every plan's counts at one morning, then two, and so on, and returns the number with every count-plan that fills at it. The largest case in these levels is three workshops, three goods and four mornings: 15 ways to spend a workshop's mornings, so 3,375 count-plans, small enough to enumerate at round start and in tests.

## Levels and the generator

| Level | Workshops | Goods | Top rate | Fewest mornings | Fewest-morning plans | Also required |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · *Two workshops* | 2 | Crates, boats | 4 | 2 or 3 | Any number | Each workshop is the better maker of a different good. The order card prints the number of mornings, and the board has exactly that many |
| 2 · *Better at both* | 2 | Crates, boats | 5 | 3 or 4 | 1 or 2 | One workshop has the higher rate for both goods. *Most-of* fails |
| 3 · *Three workshops* | 3 | Crates, boats | 5 | 3 or 4 | 1 to 4 | *Most-of* fails |
| 4 · *Lanterns too* | 3 | Crates, boats, lanterns | 5 | 3 or 4 | 1 to 6 | *Most-of* fails. The three goods do not each have a different single best maker |

**Most-of** is the plan a player reaches for first: every workshop spends every morning on the good it makes most of (either good, when its top rates tie). "*Most-of* fails" means no such plan fills the order in the fewest mornings, so the board cannot be solved without weighing one workshop against another.

Every board also has a **balanced order**: each good is wanted at least 4 times, and the largest wanted number is at most three times the smallest.

**The generator** draws a board from `ctx.rng` and redraws until it is valid:

1. Draw each workshop's rates from 1 to the level's top rate. Redraw if a workshop's rates are all equal, two workshops match, or the level's rule about best makers is not met.
2. Draw a number of mornings from the level's range, and fill a board of that size with goods drawn from the seed. The order starts as what that board makes; then lower each good's wanted number by 0 to 2 (0 or 1 at level 1), drawn from the seed, so the order is rarely an exact fit.
3. Check the balanced order, then run `fewest`. Redraw unless the fewest mornings equal the drawn number, the count of fewest-morning plans is within the level's row, and *most-of* fails where the row requires it.

A prototype of this generator, written with this packet and not committed, kept these shares of 20,000 seeded draws: level 1, 1,692; level 2, 515; level 3, 490; level 4, 160. So level 1 needs about 12 draws and level 4 about 125; in a longer level-4 run of 60,000 draws the longest wait for a kept board was 1,141 draws. A cheap draw fails before any enumeration, so this is quick, but the building session measures round start on a phone and switches level 4 to a prebuilt pool if it stalls. The kept boards were 960, 465, 490 and 160 different boards. At levels 2 to 4, in 419 of 515, 300 of 490 and 153 of 160 kept boards every fewest-morning plan has a workshop that splits its mornings between goods. These numbers show the generator is practical. They are not rule-test totals: the build's tests check the properties below on their own seeds.

**What each level asks.**
- **Level 1** teaches the board, with the number of mornings given. Example: the Oar makes 1 crate or 4 boats and the Anchor 4 crates or 1 boat; the order is 5 crates and 5 boats in 2 mornings. The Oar on boats and the Anchor on crates makes 8 of each.
- **Level 2** is the heart of the game. Example: the Oar makes 1 crate or 3 boats and the Anchor 3 crates or 5 boats; the order is 8 crates and 7 boats. The Anchor is better at both and makes most at boats, yet with both on boats no crate is made. In three mornings the Anchor makes crates (9) and the Oar boats (9): the Anchor makes three times the Oar's crates and not even twice its boats, so crates are where it is missed least on boats.
- **Level 3** adds a third workshop and, usually, a split. Example: the Oar makes 5 crates or 3 boats, the Anchor 1 or 3 and the Bell 3 or 5; the order is 19 crates and 16 boats. One plan fills it in three mornings: the Oar makes crates every morning (15), and the Anchor and the Bell each give one morning to crates (1 and 3) and two to boats (6 and 10).
- **Level 4** adds lanterns, so a workshop's mornings can go three ways. Example: the Oar makes 3 crates, 1 boat or 3 lanterns; the Anchor 5, 3 or 2; the Bell 2, 3 or 5; the order is 11 crates, 11 boats and 7 lanterns. One plan fills it in three mornings: the Oar two mornings of crates and one of lanterns, the Anchor one of crates and two of boats, the Bell two of boats and one of lanterns (11 crates, 12 boats, 8 lanterns).

One board is a round at every level. Redisplay the same board, order, mornings and squares through resize and rotation.

## Planning, sending, feedback and credit

- **The board.** One row for each workshop, with its sign and rates at the left, and one column for each morning. At levels 2 to 4 the round opens with one morning and every square empty (a closed door). **Add a morning** adds a column of empty squares at the right, up to six; **Take a morning away** removes the last column, down to one. At level 1 the columns are fixed at the printed number and the two buttons are not drawn.
- **Squares.** Tap a square to step it through the level's goods: crates, then boats (then lanterns), then crates again. An empty square is only how a square begins. Touch-down lifts the square at once, and the square then shows the good and how many of it that workshop makes there ("3" beside three drawn crates).
- **The order card** shows, for each good, how many the plan makes against how many are wanted ("9 / 8"), with a tick drawn on a good that is full. It updates with every tap.
- **Free moves.** Tapping squares, adding and removing mornings, and re-hearing the order (tap the order card) or a workshop's rates (tap its sign) are always free.
- **Send it** is drawn ready when every good is full. Tapping it before then is free and names the first good that is short: "The order still needs 3 boats."
- **Sending a plan that fills in the fewest mornings** finishes the round: the goods are carried down the jetty in turn on pentatonic notes, the boat leaves, and the pet says what the plan did: "Three mornings. No plan fills this order in two." The game finishes once through the normal shell with the round's misses and hints.
- **Sending a plan that fills with mornings to spare** (levels 2 to 4). Play the gentle boing, keep the plan on the board, and say what is true without giving a square away: "This plan fills the order in four mornings. It makes 6 crates and 2 boats more than the order asks. Three mornings are enough." Count **one miss per distinct plan sent**, by the counts rule above; sending the same plan again replays the explanation, free.
- **Why a miss counts here.** Sending is a worked answer: the player has claimed that the order cannot leave sooner. It is the same step as Check in Picture Logic or **Next clue** in Jar Clues. Nothing is judged before **Send it**, so trying squares and mornings costs nothing. Level 1 has no miss, because its mornings are given and every plan it accepts is a fewest-morning plan.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time. A hint is the first of these that applies:
  1. The board has fewer mornings than the fewest: "No plan fills this order in two mornings. Add a morning." The button is lit.
  2. The board has more: "Three mornings are enough. Take a morning away."
  3. The plan already fills the order: "This plan fills the order. Send it." This one is free.
  4. Otherwise take the fewest-morning plan that agrees with the most workshops' rows on the board (the first in enumeration order when several tie), light the first workshop whose row differs, and say how that workshop spends its mornings: "The Bell: one morning of crates and two of boats." The player sets the squares.

  Repeating the current hint with no change replays it, free. Count each new hint once.
- **Hints always lead somewhere.** Following a hint of kind 4 makes one more row agree with a fewest-morning plan, and the next hint keeps every row that already agrees. The rule test walks sampled boards from sampled starting plans at every level and checks that following hints reaches a plan that fills in the fewest mornings within the number of workshops plus the number of mornings to add or remove.
- **Supported finish.** After a hint has named every workshop's row, the plan on the board fills the order and **Send it** finishes the round with those hints counted. No round can end unfinished, and no plan is ever set for the player.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md) and the existing `onTap`, coach and round helpers. Check the [reuse map](../DESIGN.md#reuse-map) for crate and boat art and a tally card before drawing new ones.
- **Upright phone first.** At 390 × 625 with captions and the active guide, set out the following, top to bottom:
  - the order card, one line for each good;
  - the board: a sign column and up to six morning columns, two or three rows;
  - **Take a morning away**, **Add a morning**, **Help** and **Send it** in a row beneath it.
- **The board's squares** are at least the grown-up minimum of 64 logical units square, and 96 where the view allows: a sign column of 160 and six columns of 96 is 736 of the upright area's 768. A layout test checks the square size, and that the order card, three rows at six mornings and the button row fit above the caption at 390 × 625. If the test cannot be met with the caption showing, the building session narrows the sign column and never shrinks a square below 64.
- **Landscape.** Put the board on the left and the order card and the buttons on the right.
- **Captions and the guide.** Reserve their space first.
- **Reading.** The rates and tallies are numerals beside drawn goods, as befits a planning puzzle for a grown-up. The order, each workshop's rates and every explanation are spoken, so the round never depends on print alone. Navigation to the game requires no reading.
- **State that does not lean on colour.** Each good has its own shape, a full good carries a tick, an empty square is a closed door, and a lit row or button in a hint carries a ring.
- **Art.** Draw the three workshops with their oar, anchor and bell signs, the crate, the boat (a small rowing boat) and the lantern, the order card, the planning board, the jetty with a waiting boat, and the new hub icon (an order card beside a crate and a boat) in Pixi `Graphics` with palette colours. Use existing confirmation sounds or pentatonic notes.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. The spoken lines are a short finite list of whole lines with no slots:

- **Stage lines:** the instruction; "Send the order when every line is full."; "The order is on its way."; "No plan fills it sooner."
- **Fault lines:** two ("The order is not full yet." "This plan fills the order, and fewer mornings are enough.").
- **Hint lines:** four ("Add a morning." "Take a morning away." "This plan fills the order. Send it." "Set the lit workshop's mornings.").
- **Workshop names:** three ("The Oar." "The Anchor." "The Bell.").

A miss or a hint speaks its fault or hint line, and a hint of kind 4 speaks the workshop's name first; the caption carries the whole working with its numbers. The order and the rates are read with the shell's number words if the [reuse map](../DESIGN.md#reuse-map) has them for the numbers in play (rates to 5, orders to 60), and otherwise by a stage line while the card carries the numbers. Say on the game's page that the caption is fuller than the speech. A unit test checks that every fault and hint a board can produce has a voice line. The instruction is `ctx.instruct`: "Choose what each workshop makes each morning, and fill the order as soon as it can be filled."

**How-to cards.**
- Level 1 shows a sign with its two rates, a square stepping from crates to boats, the order card's tallies filling and **Send it**.
- Level 2 shows **Add a morning** and one workshop with the higher rate on both lines of its sign, with the note "Being best at both does not mean doing both."
- Level 3 shows one row split between crates and boats.
- Level 4 shows a square stepping through crates, boats and lanterns.

The ghost finger adds mornings up to the fewest, sets each row of the first fewest-morning plan from the top, and taps **Send it**.

**Co-play and off-screen.** In co-play, one person argues for the plan and the other tries to find a shorter one before it is sent. Off-screen, take two jobs that two people at home both do (say, chopping vegetables and washing up), guess how long each person takes at each, and work out who should do which so that both jobs are done soonest; then say what the faster person gave up.

**Grown-ups' wording.** Name what the game asks: "Decide what each workshop makes each morning so that the order is filled in the fewest mornings." It makes no claim about money skills, planning ability, attention or school results.

## Build batches

1. **`harbor-orders 1`, levels 1–2.** This is the new game: the workshops and their signs, the planning board with stepping squares, adding and removing mornings, the order card and its tallies, **Send it**, the spare-mornings explanation, the hints and the jetty finish.

   **Checks:** typecheck and unit tests, which cover:
   - `fills` and the tallies on hand-written plans, including a plan that makes more than the order;
   - `fewest` against a brute-force walk over every arrangement of squares (not counts) on small boards;
   - the generator: over sampled seeds at each level, a valid board is found within 3,000 draws and meets the balanced order and its level's row, with *most-of* failing at level 2;
   - that two arrangements with the same counts are the same plan, and miss counting per distinct plan sent;
   - that level 1 can never count a miss;
   - that a spare-mornings explanation states the true surplus and the true fewest number and names no square;
   - the hint walk, and that no hint ever sets a square;
   - the layout test;
   - voice coverage;
   - registry, lands and paging.

   **Browser and build:** one filtered `harbororders` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Finish level 1, then at level 2 send a plan that fills with a morning to spare, send it again unchanged (no new miss), follow Help to the end, rotate, and finish with one sticker. Take one upright screenshot of the board mid-plan with the order card, run `fingerdemo` at level 2, and build with the generated voice assets.
2. **`harbor-orders 2`, levels 3–4.** This adds the third workshop, the third good and the three-way squares.

   **Checks:** typecheck and unit tests (`fewest` with three workshops and three goods against the brute-force walk on small boards, the generator and its rows at levels 3–4 with *most-of* failing and level 4's best-maker rule, the hint walk with three rows, voice coverage, the layout test at three rows and six mornings), one filtered play at level 4 with one spare-mornings send and one hint, one upright screenshot of a three-good board, `fingerdemo` at level 4, and a build. The batch runs after batch 1.

Later proposals, not in these batches:
- a school form at the top of `school` with two workshops, small rates and the mornings always given, which needs its own wording check (the study names Harbor Orders for ages 11 to 14 at `school`'s top level);
- two orders that leave on different mornings, from the study's upper-school row, which makes the order of the mornings matter and needs its own model;
- the study's optional "could it take fewer mornings?" as a soft question after any filled plan, in place of the counted miss, if phone play shows the miss feels harsh;
- a fourth workshop, which needs its own layout check.

## Source check

Nothing new was opened for this packet. The study's own sources stand as it recorded them: the C3 Framework was opened and gives D2.Eco.4.3-5 on specialization and trade; comparative advantage is recalled and is not named in the K-8 indicators the study opened, so the game's page and the grown-ups' wording do not cite a standard for it.

The rates, the orders, the validity conditions and the accounting are game rules. The workshops and their goods are invented, so no fact needs a source or a reviewer. The explanation in the level 2 example (weigh what each workshop gives up) is the standard account of comparative advantage, and the examples on this page were checked by enumeration with the prototype. Whether a 96-unit square reads clearly with three drawn goods and a numeral on a phone is for the building session to judge from its screenshot. Completing a round shows that the player found a shortest plan for this order. It is not evidence about money or planning in general.
