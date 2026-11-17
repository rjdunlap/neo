# Picnic Pantry, level 1: Two dishes, one pantry (definition)

Defined 2026-11-17 on `claude/define-picnic-pantry` ([PR #1745](https://github.com/rjdunlap/neo/pull/1745)) as slice **C6** of the [cooking-and-recipes study](../deep-dives/subjects/cooking-recipes.md#build-slices-in-order), from its [first case and older ladder](../deep-dives/subjects/cooking-recipes.md#picnic-pantry-first-case-and-older-ladder), its [candidate row](../deep-dives/subjects/cooking-recipes.md#candidates-and-priorities) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#cooking-and-recipes-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-11-17** (level 1, slice C6b, [PR #1753](https://github.com/rjdunlap/neo/pull/1753); the game's page is [picnic-pantry](../games/picnic-pantry.md)). Read the [as-built note](#as-built) for where the build settled a detail; the sections below remain the rules it follows. Every open call used its default ([open decisions](#open-decisions)), adopted under standing rules S2 and S8 of the [October 23 decision record](../archive/DECISIONS-2026-10-23.md#standing-rules).

**Fun action and purpose:** a picnic blanket with four cushions, a pantry shelf of three jars, and three dish cards. She taps a dish and its tokens hop out of the jars onto the blanket, so the jars show what is left for the next dish; a second dish either gets everything it needs or is left with empty token outlines where a jar ran dry. A ring on the basket bell lays the picnic, and four friends sit down to exactly the two dishes she chose. The learning purpose is **reasoning about a shared, limited supply**: two dishes that each fit the pantry alone may not fit it together, the reason is one ingredient they both draw on, and more than one menu can be right. It is the study's third pleasure, choosing among feasible plans, and claims nothing about real cooking, shopping or nutrition (the study's [anchors and evidence limits](../deep-dives/subjects/cooking-recipes.md#anchors-opened-and-evidence-limits)).

## Identity and overlap

Rechecked 2026-11-17 against the catalog and open proposals, as the study's overlap table asked:

- **Pet Kitchen** (Counting Cove) shares, halves, doubles and measures one recipe. Picnic Pantry never divides, scales or measures; a dish card's cost is fixed and whole. Scaling a batch stays in Pet Kitchen (the study's *Scale every ingredient*).
- **Recipe Workshop** (Painted Canyon) makes one bowl by adding and mixing; the question is what the bowl became. Here nothing is made by hand: the question is which **pair** of finished dish cards one pantry can cover.
- **Monster Munch** counts exact orders and shares fairly: one quantity question at a time. Here two demands are added and compared with a supply, per ingredient.
- **Market Stall** and **Lemonade Stand** (Cozy Village) own prices, coins and a stand whose purse carries over. Picnic Pantry has no price, coin, sale or stock that outlasts a case: every case starts from its own full pantry.
- **Maker Lane** (Cozy Village, built since the study) follows one material along a chain of makers. Its sketched *Maker Lane plans* (FS5 in the [food-and-fiber recommendations](../deep-dives/subjects/RECOMMENDATIONS.md)) is a finite-orders plan puzzle that was told to read this definition first: it should reuse this page's selection model, shortage trace and repair rule rather than invent its own.
- **Second Chance Shed's Picnic Loop** (a later definition) schedules cups across two picnics, washing in between: a plan over time. Picnic Pantry has no time, order of serving or reuse.
- **Village Planner** and **Toy Drawer** (proposals) keep scheduling a shared bench and fitting things into a space. No timed production, appliance or packing appears here.

The game earns its own registration through the joint-feasibility rule (pick a set, add its demands, compare with one supply, accept every set that fits). If the build finds level 1 reads as a Monster Munch counting round, [decision 1](#open-decisions) names the fallback.

**Name.** The island already has a picnic spot on the map and two picnic stories, and a browser suite called `picnic` for them. The game keeps the study's name; its browser case is called `pantry` so nobody runs the story suite by mistake ([decision 5](#open-decisions)).

## The model (`logic.ts`)

- **Ingredient:** a token kind with a picture and a spoken name. Eight pictures already exist in `src/art/props.ts` (`blueberries` spoken as "berries", `apple`, `pear`, `plum`, `orange`, `banana`, `strawberry`, `lemon`); `oat` is one new code-drawn token, a pale oval cluster with three flakes, so its shape differs from every round fruit and colour is never the only cue.
- **Case:** three ingredients in a fixed jar order, a `pantry` count for each (2 to 4), and three **dishes**, each with a name, a picture and a `cost` vector over the case's three ingredients. Every dish serves **two seats**; the blanket has **four seats**, so a plan is **two different dishes**.
- **Selection:** the ordered list of placed dishes, zero, one or two long (the blanket has two dish places, so three is impossible). A case has seven selections: empty, three singles, three pairs.
- **`demand(selection)`** is the per-ingredient sum of the placed dishes' costs; **`remaining(selection)`** is `pantry − demand`, per ingredient, and may be negative; **`shortages(selection)`** lists each ingredient with a negative remainder and by how much.
- **`fits(selection)`** is true when two dishes are placed and no ingredient is short. Every selection that fits is accepted: there is no preferred menu, and leftovers are not scored.
- **`repair(selection)`** returns one edit, `{ add: dish }`, `{ putBack: dish }` or `lay`: the first step of a shortest path of edits to a selection that fits (breadth-first over the seven selections), ties broken first by keeping the dish she placed earlier, then by keeping a menu she has not laid yet in this case, then by screen order. So: empty → add a dish that is in every menu that fits, if there is one; one dish → add a partner that fits with it; a pair that does not fit → put back the dish placed second; a pair that fits → `lay`.
- **`explain(selection)`** returns, for a pair that does not fit, each short ingredient with the two dishes' needs, their sum and the pantry count: the numbers the miss line speaks and the drawing pulses.

### The cases (frozen)

Costs are written in jar order. All four were enumerated by a script on 2026-11-17; the rule tests repeat the enumeration.

| Case | Pantry (jar order) | Dishes and costs | Menus that fit, and what is left | The pair that does not fit |
| --- | --- | --- | --- | --- |
| **A** (the study's case) | 4 berries, 2 oats, 2 apples | **Swirl** `(2, 1, 0)` · **Crunch** `(0, 1, 2)` · **Apple Bowl** `(1, 0, 2)` | Swirl + Crunch, 2 berries left · Swirl + Apple Bowl, 1 berry and 1 oat left | Crunch + Apple Bowl need 4 apples; the pantry has 2 |
| **B** | 3 pears, 3 oats, 2 plums | **Pear Boats** `(2, 1, 0)` · **Pear Crumble** `(2, 2, 0)` · **Plum Cup** `(1, 0, 2)` | Pear Boats + Plum Cup, 2 oats left · Pear Crumble + Plum Cup, 1 oat left | Pear Boats + Pear Crumble need 4 pears; the pantry has 3 |
| **C** | 2 oranges, 2 oats, 3 bananas | **Sunny Squares** `(1, 2, 0)` · **Banana Bites** `(0, 1, 2)` · **Orange Cups** `(1, 0, 1)` | Sunny Squares + Orange Cups, 2 bananas left · Banana Bites + Orange Cups, 1 orange and 1 oat left | Sunny Squares + Banana Bites need 3 oats; the pantry has 2 |
| **D** | 3 strawberries, 2 oats, 2 lemons | **Berry Stack** `(2, 1, 0)` · **Lemon Twists** `(1, 0, 2)` · **Zesty Oats** `(0, 1, 2)` | Berry Stack + Lemon Twists, 1 oat left · Berry Stack + Zesty Oats, 1 strawberry left | Lemon Twists + Zesty Oats need 4 lemons; the pantry has 2 |

What the four share, and what the tests assert of any level 1 case: each dish alone fits the pantry; **exactly two of the three pairs fit**; the third pair is short on **exactly one** ingredient, one both of its dishes use; one dish is in both menus that fit; the two menus leave different leftovers; every pantry count is 2 to 4 and every dish costs 2 to 4 tokens. The short ingredient is a different jar in A, B and C (third, first, second), so "the last jar runs out" is not a trick that works.

### Rounds

A round is **two picnics**: two different cases drawn with `ctx.rng` (12 ordered pairs), each with its three dish cards in a seeded order (6 orders each). Jar order is the case's. Nothing carries from the first picnic to the second: the second case has its own full pantry.

## Level, band and range

| Level | Name (`describeLevel`) | Band | What is new |
| --- | --- | --- | --- |
| 1 | Two dishes, one pantry | school 1–1 | The whole game above |

`BandLevels` is `{ school: { min: 1, max: 1 } }`. With one level, the two-smooth-rounds step has nowhere to go; the miss and hint counts below are still defined deliberately so level 2 inherits them. The grown-ups' page line says "about 9 and up" (S2: older content sits at the top of `school` with a note and no gate). A grown-up player sees the game in its land like every school game and plays it at `school` (`playBand`), with 100-unit targets; the `grownup` band joins when a rung made for it exists ([decision 2](#open-decisions)).

## Screen and controls

- **Pantry shelf:** three jars in a row, each showing its tokens (up to four, in a 2 by 2 stack) and its picture on the front. A tap on a jar speaks its name and what is in it now ("Apples. Two left."); it is never a wrong answer.
- **Dish cards:** three cards, each with the dish picture, its name spoken on touch, its cost as a row of token pictures, and two small cushions for "serves two". A tap places the dish on the first empty blanket place; a tap on a placed dish, or on its now-dimmed card, puts it back. With both places full, a tap on the third card wobbles it and pulses the two placed dishes (`pantry.full`); it is free.
- **The trace:** placing a dish makes its tokens hop one by one from the jars to a row beside the dish on the blanket, with a pentatonic step each. A token a jar cannot give is drawn beside the dish as an **empty dashed outline** in that ingredient's shape. Putting a dish back sends its tokens home and, if the other dish had outlines, fills them from the refilled jar. The jars and the outlines are always the true `remaining` and `shortages`; nothing is hidden at level 1, and nothing turns red or sounds before she rings the bell.
- **Basket bell (Lay the picnic):** one large control. With fewer than two dishes it gives a soft tap and `pantry.need-two`, free. With a pair that fits, the picnic is laid. With a pair that does not fit, see below.
- **Laid:** the four friends hop onto the cushions around the two chosen dishes (drawn as those dishes, never a generic meal), the leftover tokens stay in their jars, and the companion says what is left (`pantry.left`). Nobody eats, waits unhappily or goes without. Two controls follow: **Next** (the second picnic, or the finish) and **Another way?**
- **Another way?** (optional, unjudged): the dishes go back and she may lay the case again. A different menu that fits earns a spoken comparison of the two sets of leftovers (`pantry.compare`); the same menu gets `pantry.same`; a pair that does not fit gets the shortage explanation. Nothing in this pass is a miss or a hint, and Next is on screen throughout.
- **Targets and layout:** every control is at least 100 units. Laid out from `view` for both shapes: landscape has the shelf across the top, the three cards in a column at the right, the blanket in the middle and the bell bottom-right, clear of the pet's corner; upright (the phone, 768 wide) stacks shelf, blanket, then the three cards in one row of about 230 units each, with the bell beside the blanket. The game registers `upright: true` ([phone portrait](phone-portrait.md#what-a-game-has-to-do)).

### What ringing the bell on a pair that does not fit does

A gentle boing; the short jar, and the outlines beside both dishes, pulse together; the companion says the reason from `explain` with the real numbers (`pantry.short`: "Crunch and Apple Bowl need four apples together. The pantry has two."). The plan stays exactly as she left it, editable. It is **one miss**.

## Accounting, help and finishing

- **Misses:** only a bell rung on a two-dish plan that does not fit, in the first pass of a case. Placing, putting back, tapping jars, the full-blanket wobble, a bell with fewer than two dishes and everything in *Another way?* are free.
- **Hints** (counted with `src/progress/coach.ts`, the `missOnRequest` cadence, one request per case): the second miss on a case shows the hint, and so does *Show a hint* on the pause sheet at any time. A hint is one `repair` step: the dish to put back, the card to add or the bell glows, and the companion names it (`pantry.hint-back`, `pantry.hint-add`, `pantry.hint-lay`). She still makes the tap. Because every selection is at most two edits from a plan that fits, three hints in a row always carry a case to its finish: that is the supported completion, and it still earns the sticker.
- **Finish:** after the second picnic's Next, `ctx.finish({ misses, hints })` with both cases' totals. One sticker per round, as the shell awards it. The game saves nothing of its own.
- **Idle:** after the shell's usual quiet time the next `repair` control glows without speech; shown, it counts as a hint, as elsewhere.

## Speech (`voice.ts`)

Instruction (repeated by the pet): `pantry.instruct`, "Four friends are coming. Pick two dishes the pantry can make." Other lines, all with the case's real names and numbers filled in:

- `pantry.dish`: "{dish}. It takes {cost}." (a card touched; cost read as "two berries and one oat")
- `pantry.jar`: "{ingredient}. {n} left." / "{ingredient}. None left."
- `pantry.full`: "The blanket holds two dishes. Tap one to put it back."
- `pantry.need-two`: "Four friends need two dishes."
- `pantry.short`: "{dish} and {dish} need {sum} {ingredient} together. The pantry has {n}."
- `pantry.hint-back`: "Try putting {dish} back." · `pantry.hint-add`: "{dish} would fit." · `pantry.hint-lay`: "That fits. Ring the bell."
- `pantry.left`: "Picnic time! {leftovers} left in the pantry." / "Picnic time! The pantry is empty."
- `pantry.compare`: "Another menu that works. This time {leftovers} left; last time, {leftovers}."
- `pantry.same`: "That is the menu you laid before. It still works."
- Spoken title `game.picnic-pantry`: "Picnic pantry".

No line calls a menu better, a food good or bad, or a leftover waste.

## Imagined food, not practical food

- Dishes are named shapes on cards ("Swirl", "Zesty Oats"); a cost is a count of picture tokens, not cups, grams or servings of anything. No card shows steps, heat, a knife or raw food.
- Nothing says what to eat, how much, or what is healthy; leftovers are only "left in the pantry". Friends have no preferences, needs or allergies at level 1, and dietary needs are never coded as puzzle constraints at any level without the separate review the study names.
- The pantry is one case's puzzle data and refills for the next case: no persistent stock, shopping, money or scarcity.
- Grown-ups' page (`src/parent/panel.ts`, plain HTML): "Picnic Pantry asks her to choose two dishes that one pantry can cover, and to see why another pair cannot. About 9 and up. The dishes are pretend: this is not a recipe or advice about food."

## Rule tests (`logic.test.ts`)

1. Each frozen case matches its table row: the two menus that fit, their leftovers, and the short ingredient and amounts of the third pair.
2. The level 1 properties in [the cases](#the-cases-frozen) hold for all four.
3. `fits` is false for every selection shorter than two dishes, and `demand`, `remaining` and `shortages` agree with each other for all seven selections of every case.
4. From each of the seven selections of every case, following `repair` reaches `lay` on a plan that fits in at most two edits, and never passes through the pair that does not fit.
5. `repair` on the pair that does not fit puts back the dish placed second, for both placement orders.
6. `explain` numbers equal the two costs, their sum and the pantry count; it lists exactly one ingredient at level 1.
7. Every seeded round has two different cases, and each case's card order is a permutation of its three dishes.
8. With a menu already laid in a case, `repair` from the empty and single selections leads to the other menu when one exists.

## Ghost finger, how-to card and registration

- **`autotouch()`:** for each case, taps the dish that is in both menus, then a partner, then the bell, then Next. It never rings a pair that does not fit, so the demonstration shows the real inputs and a real laid picnic.
- **How-to card** (`howto.ts`, level 1): "Tap two dishes. Watch the jars. Ring the bell to lay the picnic."
- **Registration (default, [decision 1](#open-decisions)):** ID `picnic-pantry`, name "Picnic Pantry", spoken title `game.picnic-pantry`. Region `cozy-village`, `challenge: 'logic'`, skills `['planning', 'comparing', 'adding', 'everyday-life']`, bands `['school']`, `upright: true`, `touchDemo: true`, music `STYLES.x` chosen at build from the existing styles. Home land **Cozy Village**, after Lemonade Stand: its lowest band is school, so it belongs on the island with the other food and stall games, not in Lantern Lake. Cozy Village lists 21 games and already pages, which the lands contract allows; `lands.test.ts` decides. Hub icon: a jar with two tokens beside a small dish. Sticker: a seeded picnic basket holding two of the cases' dishes.
- **Art:** code-drawn in `src/games/picnic-pantry/art.ts` with `src/art/palette.ts` and the fruit pictures in `src/art/props.ts`: shelf, jars, the oat token, twelve dish pictures (simple bowls, cups and squares showing their two ingredients), cards, blanket, cushions, token outlines, the basket bell, the two after-lay controls. No imported art or audio; token hops use pentatonic steps from `src/audio/notes.ts`.
- **Co-play:** "One of you picks the first dish; the other finds a second that still fits. Then say why the third pair would not." **Off-screen** (spoken tip): "With buttons or blocks as pretend ingredients, write two dish cards and see if one pile can make both." A conversation and a counting game only: no real recipe or quantity.
- **Couch:** none. **Journal:** nothing filed. **Creations:** none. **Rework couplings:** uses the companion through `ctx.companion()`; nothing depends on the rework.

## Build and check tier

One new-game slice (start from the [scaffold command](../NEW-GAME.md)): typecheck, unit tests, **one** filtered scripted play as browser case `pantry` (level 1 is both the first and the last level: one bell on the pair that does not fit, the pause sheet's hint, one *Another way?* with the other menu, both picnics to the finish) with one portrait screenshot, `fingerdemo` at level 1, and `npm run build` because the registry, lands, voice and how-to barrels change. The source check (S1) is the grown-ups' wording and the co-play and off-screen lines only.

### Expected files

`src/games/picnic-pantry/{index,logic,art,voice,howto}.ts` and `logic.test.ts`; `src/content/lands.ts`; the generated barrels (`node scripts/content-barrels.mjs`); the `pantry` case in the browser checks and its README row; `docs/games/picnic-pantry.md` and the generated game docs; the study, backlog, recommendations and ideas rows; a verification entry.

## As built

- **Tokens are handed out in placement order:** the dish placed first is always whole and the outlines sit beside the second dish. On a miss, the short jar and that ingredient's tokens and outlines beside both dishes bounce.
- **Voice:** one extra line, `pantry.another` ("The dishes are back. Is there another menu that works?"), when *Another way?* is tapped. `pantry.jar` and `pantry.left` each have a second id (`pantry.jar-none`, `pantry.left-none`) for the empty case, and `pantry.short` uses `{first}` and `{second}`.
- **Grown-ups' wording** (what it asks, about 9 and up, the dishes are pretend) is carried by the how-to card's goal and note and the level description, because `src/parent/panel.ts` has no per-game paragraph.
- **Hints:** the idle glow comes after 8 quiet seconds, once per picnic, and counts as a hint. The pause sheet's *Show a hint* while a picnic is laid glows *Next* and counts nothing.
- **Music** is `STYLES.stickers`; the land order places the game after Lemonade Stand.
- **Checks:** the browser case also takes a sideways screenshot of a laid picnic.
- **Source check (S1):** the grown-ups' wording, co-play and off-screen lines make no factual claim about food, cooking or nutrition; a rule test reads the voice lines for value words.

## What comes next

The study's deeper rungs, each needing its own definition after this level is built and played: (2) choose batch counts to reach a visible serving total; (3) combine two pictured guest preferences while keeping alternatives; (4) revise one changed pantry item and compare with the original plan; (5) make a solvable case for a partner, or choose to use up the most tokens after a valid finish. The study's **C7** picks one deeper mode across its three games after observation. A rung that hides the trace until the bell (predict first) is an option for rung 2 or later, not a change to level 1.

## Open decisions

Each has a default the build uses; none blocks the build.

1. **New game and land.** Default: a new game, home land **Cozy Village**, region `cozy-village`. Alternative: Lantern Lake, if it should sit with the grown-up puzzles (its 13 games fill one screen today, so a fourteenth would make it page for grown-ups for the first time). Fallback if level 1 reads as counting practice: fold the case into Monster Munch's school levels as a two-order round.
2. **Bands.** Default: `school` only (1–1), with "about 9 and up" on the grown-ups' page; `grownup` joins with the first rung made for it (rung 4 or 5), since three cards are a small puzzle for an adult and a grown-up player already finds and plays school games. Alternative: `['school', 'grownup']` now, at 1–1 for both.
3. **A round's length.** Default: two picnics, with *Another way?* optional after each. Alternative: one picnic that must be laid both ways, if playtests show the optional second menu is skipped and the comparison is the part worth keeping.
4. **The trace.** Default: always visible and truthful at level 1. Alternative: none at this level; hiding it belongs to a later rung.
5. **Name.** Default: "Picnic Pantry", browser case `pantry`. Alternative: "Pantry Puzzle", if two picnics on the map and a third in a game's name confuse a child choosing by ear.
6. **Dish and ingredient words.** Default: the table's invented names. Any word can change with only a voice line and a label; the costs are what the tests guard.
