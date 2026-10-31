# Lemonade Stand deep dive

*ID `lemonade-stand` · bands school · levels 1–4 on 2026-10-31 · session `claude/dive-lemonade-stand`, [PR #1070](https://github.com/rjdunlap/neo/pull/1070)*

## The game today

A short market week in Cozy Village (`region: 'cozy-village'`; the [GAMES entry](../GAMES.md#lemonade-stand) and the [roadmap's first slice](../ROADMAP.md#first-slice-lemonade-stand-built-2026-10-08)). Each day the stand's sign shows a forecast, she taps a batch of 4, 8 or 12 cups (and from level 3 a price of 1, 2 or 3 shells), taps OPEN, and watches friends arrive one at a time until the cups or the friends run out. A row joins a picture table. After the last day the pet points out one comparison the table can show. **Learning purpose:** read a forecast and a picture table, compare made, sold, left and shells, change one variable after evidence; later, unit cost and profit inside one bounded purse.

| Level | Plan name | Band window | What she decides |
| --- | --- | --- | --- |
| 1 | Three days: read the weather, choose how many cups to make | school 1–4 | A batch from the weather; two weathers, one of them twice |
| 2 | Three days with an event on the forecast | school | A batch from weather plus a ferry (+4) or a quiet day (−4) |
| 3 | Four days: choose a price as well as the cups | school | A batch and a price (1/2/3 shells; price 2 loses 2 friends, 3 loses 6) |
| 4 | A market week: cups cost shells to make | school | Batch and price from a purse of 6; a lemon costs 1 shell and makes 2 cups; the ferry captain tops a purse up to 2, never debt |

**What a round draws from:** three weathers × an optional event, a 0–2 per-day crowd noise from the seed, the three batches and three prices; the friends are the critter cast without Pip. `logic.ts` holds every rule (`demand`, `sellDay`, `settle`, `rating`, `bestChoice`, `helps`, `insight`, `forecastChoice`), with 21 rule tests in `logic.test.ts`. The table cells are made, sold, left and (from level 3) shells; a row's `wanted` (friends who came) and `unserved` exist in the model but have no column.

**Accounting today:** `misses` is always 0: every batch and price is an experiment. The lightbulb says one true thing (`helps()`) and counts one hint per day, however often she asks.

**Known gaps and checks:** [the device check](../DEVICE-CHECKS.md) asks whether the weather sign reads without reading, whether a weak first batch feels like an experiment, whether five days is too long, and whether the closing comparison adds anything. No `coplayHint`. No couch version. 37 `lemon.*` voice lines. The scripted case is `BROWSER_SUITE=woods WOODS_ONLY=lemon` (it pays `[0, 1]`: no misses, one hint).

**Subject studies that point here:** [ratio and proportion](subjects/ratio-proportion.md) (*Best buy*, a unit rate, 6.RP.A.3.b, "belongs here as a mode"), [chance and statistics](subjects/chance-statistics.md) (*a typical day*, the mean of the week, England Year 6), [integers](subjects/integers.md) (no debt, no negative purse), [weather and water](subjects/weather-water.md) (weather is an economic assumption, not meteorology), [media literacy](subjects/media-literacy.md) (its seller appears on Notice Board posters; this game is unchanged).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Lemonade Stand (MECC, 1979)](https://archive.org/details/Lemonade_Stand_1979_Apple), [classroom guide](https://archive.computerhistory.org/resources/access/text/2019/03/102783879-05-01-acc.pdf) | Turn-based business sim | Cost per glass rises across days; weather reports; advertising signs; random events (street crews, storms) | Daily decision, then a report; the cost of a cup changing during the run (here: two lemon boats) | Thunderstorms that wipe out a day without warning; advertising as a demand lever |
| [Coolmath Lemonade Stand](https://www.coolmathgames.com/blog/optimization-games-to-turn-you-into-a-business-tycoon) | Web tycoon | Recipe, price, ice, then upgrades and reputation over 14–30 days | Optimizing a few visible variables; price against weather | Hidden reputation and recipe quality, long runs, upgrade grind |
| [Lemonade Tycoon](https://en.wikipedia.org/wiki/Lemonade_Tycoon) ([review](https://www.pocketgamer.com/lemonade-tycoon/review/)) | Tycoon | Locations, recipe, news events, stand upgrades | A news item on the forecast (already the ferry and quiet day) | Factors with invisible weight (the review found several barely mattered); expanding empire |
| [Common Sense Media on Lemonade Stand](https://www.commonsensemedia.org/app-reviews/lemonade-stand) | Review | — | Grown-up framing: "basic business concepts", nothing grander | Claims of financial literacy outcomes |
| [Papa's Pizzeria (Flipline)](https://www.flipline.com/blog/?p=1262) | Order time-management | A named customer cast, each with a preferred order; unlockable toppings | Friends who are recognisable characters (the critter cast already is) | Timers, tips scored by speed, unlock grind |
| [Market Stall](../GAMES.md#market-stall) and [Scoop Shop](../GAMES.md#scoop-shop) (this island) | Exact-amount shopkeeping | Pay, change, order changes | Shell coins (`coinArt`), the shopkeeper role | Exact payment: here quantities are uncertain and choices are experiments |
| A real juice stand at a picnic (the game's `offScreen`) | Physical play | Pour, count leftovers, write a table | The table as the record of the day | — |
| [Illustrative Mathematics 3.MD.B.3](https://tasks.illustrativemathematics.org/content-standards/3/MD/B/3.html) | Standard tasks | Scaled picture and bar graphs, "how many more" | Reading two rows and subtracting | — |

Learning references: unit rates are 6.RP.A.3.b and the mean as a fair share is England Year 6 and 6.SP.A.3, both already cited in the [ratio](subjects/ratio-proportion.md) and [chance and statistics](subjects/chance-statistics.md) studies; the roadmap's [older-child economy section](../ROADMAP.md#older-child-progression-a-market-week-not-an-island-grind) holds the evidence about currency and rewards.

## What makes sense here

The game's strength is an honest, inspectable little model: every demand number is a plain function of what the sign shows plus a small noise, and every pet sentence is checked against it. Depth should come from **new decisions inside the same week**, not more days (five already worries the device check) or hidden variables. Two studies name exactly such decisions: *which lemon boat is the better buy* (a unit rate, ratio study) and *how many friends come on a typical sunny day* (the mean as levelling, statistics study). Both have one right answer, so they become the game's first counted misses; batches and prices stay experiments that never count.

Recipe quality, reputation, advertising, upgrades and several stands are left out: each adds a variable she cannot see, a grind, or (advertising) persuasion as a sales lever, which [Notice Board](../definitions/notice-board.md) treats as something to recognise rather than use. Harbor Tickets are parked ([roadmap](../ROADMAP.md#older-child-progression-a-market-week-not-an-island-grind)); the purse stays inside one round.

**Long-term arc:** school 1–4 reads weather and price (built) → 5–6 compare the cost of lemons (unit rate) → 7 a typical day from the table (mean) → a possible pre-K opening that counts a visible line of friends (decision).

## Experience and presentation

- **First unsupported action:** on level 5, the morning's two boats bob at the jetty, each with a sign of drawn lemons and drawn shells ("2 🍋 for 1 🐚"). She taps one. The right boat toots, slides to the stand and tips its lemons into the crate (touch-down: the boat dips and its sign brightens).
- **Wrong boat:** a gentle boing, the boat stays, and the pet lines both signs up as "for 2 lemons" (one small batch, four cups): "This boat wants 2 shells for 2 lemons. That one wants 1." Two misses that morning glow the cheaper boat and count one hint.
- **Typical day (level 7):** the three sunny rows' friend counts stand as towers of little friend faces beside the table. She drags a face from a tall tower to a short one; the tower settles with a soft pop and a pentatonic step that rises with the tower's height. When all three are even, a dotted line runs across them and the pet says "A typical sunny day: 11 friends."
- **Art and feel example:** the boats grow from the ferry in the game's own `eventIcon` (`art.ts`), given a striped sail in `swatch` colours; a lemon is a `Graphics` ellipse with a nub, the shell is `coinArt(1)` from Market Stall. The tower faces are the existing critter heads at 0.35 scale.
- **Variety without changing the rule:** seeded boat pair and positions (left/right), seeded sail colours, the friend cast; the week's weather and events as today.
- **Reasoning versus reading and motor:** signs are pictures plus a spoken offer (tap the sign to hear it, free). Lemons and shells are counted, never read. Towers are large drag targets (faces at least 100 units with a hit circle).
- **Supported ending:** every day completes; the boat question ends when the right boat is tapped; the typical-day towers finish when even; the closing comparison names the boat savings or the typical crowd. Home always works; there is no saved in-progress week.
- **Co-play:** a grown-up reads the forecast aloud like a weather reporter and plays the first friend in line; she decides the cups (a `coplayHint` to add in slice 1). Solo stays complete.
- **Needs a person or device:** whether the "for 2 lemons" lining-up reads as cheaper per cup for a 7–8-year-old; whether levelling towers feels like a fair share or a chore; whether four days with a boat each morning is too long.

## Proposed ladder

### Fresh content inside existing levels

1. **A co-play hint** (`coplayHint`): the weather-reporter and first-friend roles above. Text only; no voice line.
2. **Seeded awning and cup colours** per round (stripe colour from `swatch`, cup rims), leaving the sticker art and its seed unchanged. Optional; no rule change.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | **Two lemon boats** | school | Four days as level 4 (events, prices, purse). Each morning two boats offer lemons with the **same lemons or the same shells**: "2 for 1" vs "2 for 2", or "4 for 2" vs "2 for 2". | Which boat is cheaper (then batch and price as level 4, at the chosen boat's lemon price) | Dearer boat: boing, the "for 2 lemons" comparison spoken, one miss; two misses that morning glow the cheaper boat and count one hint. A day counts **at most one hint** whether from the glow or the lightbulb. Batch and price stay experiments | Every offer pair has one strictly cheaper boat; both offers give whole shells for 2 lemons (a 4-cup batch); the cheaper boat's price per lemon is at most 1 shell, so `bestChoice` still finds a day that does not lose shells and the opening purse affords any batch; every spoken comparison is true | New interaction (boat pick before the batch cards); `batchCost` takes a lemon price; `bestChoice`/`forecastChoice` take it too; `helps()` gains a boat line; `insight()` gains *the boats saved you N shells this week* (the sum of the dearer boat's extra cost on the batches made, true by construction); voice lines `lemon.boat.*`; a crate/jetty in the stand scene; the bot taps the cheaper boat |
| 6 | **Best buy** | school | As level 5, but **neither the lemons nor the shells match**: "2 for 1" vs "6 for 6", "2 for 2" vs "6 for 3", "4 for 2" vs "6 for 6" | Which boat is cheaper per lemon (a unit rate) | As level 5; the comparison scales both to 2 lemons ("6 for 6 is 2 shells for every 2 lemons") | As level 5 plus: the two offers differ in both lemons and shells; the hint's scaled numbers equal the offer's rate | New levels on level 5's interaction; offer pool only |
| 7 | **A typical sunny day** | school | Five days, price 1, no events, no purse. Days 1–4 include three sunny days; before day 5 (sunny) the three sunny rows' **friends who came** stand as towers | Level the towers by dragging friends, then a batch for day 5 using the typical crowd | A move that makes the towers less even gets "That tower got taller" (not a miss); a second such move glows the tallest tower and counts one hint; reaching even always finishes the question. Batches stay experiments | The three sunny crowds are unequal, their mean is a whole number, at least two moves are needed, the typical crowd is at most 12 (a batch exists); the pet's typical number equals the mean of `wanted`, never of `sold` | New interaction (drag via `src/engine/drag.ts`); a **came** column (friend face) on this level, since `sold` understates the crowd on a sold-out day; this level's sunny noise widens to 0–4 (its own plan field, other levels unchanged); `insight()` gains *the typical day was right/close*; voice lines; the bot drags tall to short |

Levels append in order 5, 6, 7 with stable IDs; `LEVELS.school.max` rises with each.

### Younger-band openings

**Enough cups for the line** (pre-K, a proposal): a line of two to five friends is already waiting and visible; she taps cups onto the counter until there is one for each, then OPEN. One-to-one matching with a running result; too few or too many is shown, not counted. Adds `prek` to `bands`, so it waits on the developer (decision 1 below) and overlaps Scoop Shop's and Monster Munch's counting.

### Easier entries and levels between existing ones

None proposed. Level 1 is already the gentlest (one factor, two weathers, no shells). The pre-K opening, if approved, would be a new ID appended with `entryLevels` for the `prek` band, never renumbering 1–4.

### Left out on purpose

- Recipe quality, reputation, upgrades, several stands, empire growth (hidden variables, grind).
- Advertising as a demand lever (persuasion as a tool; Notice Board names selling instead).
- Forecasts that turn out wrong, storms that wipe a day (the sign is always true; the noise is 0–2, or 0–4 on level 7).
- Debt, interest, a persistent currency, Harbor Tickets (parked), purchases with shells outside the round.
- Timers, speed tips, a "close the stand" button before a person asks for one (Home always works).
- A couch version.

## Decisions for the developer

1. **A pre-K opening ("Enough cups for the line")?** It adds the `prek` band to a school game; the alternative is to leave counting a line to Scoop Shop and Monster Munch.
2. **A market-week chart in the journal?** The original plan allowed "one bounded market-week chart to the journal later". Should a finished week file its table as a discovery, and which weeks (the first sold-out day, the first boat saving)?

## Build slices, in order

Each level slice raises `LEVELS.school.max`, extends `describeLevel` (the plan names), adds a level-scoped how-to step (`{ from: 5 }` …), extends the `lemon` case in `scripts/browser/suites/woods-batch.mjs` and the touch-demo levels, and updates the README row and [GAMES.md](../GAMES.md#lemonade-stand).

1. **Level 5, Two lemon boats, with the co-play hint** (ready; batch `lemonade-stand 1`). The boat pick, the lemon price in `batchCost`/`bestChoice`/`forecastChoice`, the boat help and insight, one counted miss per dearer boat and at most one hint per day. Tier: new interaction: typecheck, unit tests (the offer pool, no-loss and affordability with the cheaper boat, true comparisons, the savings insight), one scripted play `BROWSER_SUITE=woods WOODS_ONLY=lemon` at level 5 with one wrong boat, a second for the glow, then the right boat, and the lightbulb on a different day (the round pays 2 misses and 2 hints: one for the glowed morning, one for the lightbulb day), one portrait screenshot of the jetty, the touch demo at 5. Build only if shared files change.
2. **Level 6, Best buy** (after slice 1). The unit-rate offer pool. Tier: new levels on an existing interaction: typecheck, rule tests, one play at 6, the touch demo at 6.
3. **Level 7, A typical sunny day** (after slice 2). The came column, the towers, the level's own noise. Tier: new interaction: typecheck, rule tests (whole mean, two moves, at most 12, mean of `wanted`), one scripted play with one move that makes a tower taller and a second for the glow, a portrait screenshot of the towers, the touch demo at 7.
4. **Fresh: seeded awning and cup colours** (optional, any time). Tier: typecheck, the sticker pin test, one screenshot.
5. **Enough cups for the line** (waits on decision 1). Adds `prek`: audit lands, how-to, voice and the band tests together.
6. **Market-week chart in the journal** (waits on decision 2).

## What was built in this session

Nothing: a deep-dive session is research and ideation only. Links and `git diff --check` ran.
