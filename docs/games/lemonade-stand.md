# Lemonade Stand

<!-- generated: from src/games/lemonade-stand; edit the text below the end mark (npm run game-docs) -->

**ID:** `lemonade-stand` · **Land:** Cozy Village · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** forecasting, comparing, money, data

| Band | Levels, easiest first |
| --- | --- |
| school | 1–5 |

| Level | Plays like |
| --- | --- |
| 1 | Three days: read the weather, choose how many cups to make |
| 2 | Three days with an event on the forecast: a ferry or a quiet day |
| 3 | Four days: choose a price in shells as well as the cups |
| 4 | A market week: cups cost shells to make, so read the profit |
| 5 | Two lemon boats: tap the boat that sells lemons cheaper, then run the stand |

<!-- end generated -->

**Starts as:** read the weather sign, choose how many cups to make, and watch friends buy; each day adds a row to a picture table

**Grows into:** an event on the forecast (a ferry, a quiet day), a price in shells, then a five-day market week where a lemon (one shell, two cups) is a cost and the purse carries from day to day, then (level 5) two lemon boats each morning offer lemons at different prices and she taps the cheaper one; running out or having cups left is a result, never a mistake, while a dearer boat is a gentle miss

## Design notes

*After MECC's Lemonade Stand and the Coolmath version.* A short market week. Each day shows a forecast (a sun, clouds or rain, and from level 2 an event: a ferry bringing visitors or a quiet day), the child taps a batch of 4, 8 or 12 cups (and from level 3 a price of 1, 2 or 3 shells), then taps OPEN. Friends come one at a time: each who finds a cup buys it, the rest watch the cups run out under a SOLD OUT sign, and spare cups go to two friends on a picnic blanket. A row (weather, price, cups made, sold and left, shells) joins a picture table; tapping a row reads it aloud. After the last day the pet points out one comparison the table can show (the same weather at two prices, two weathers at the same price, or the day that kept the most).

The market is a plain function of the day (`logic.ts`): the lowest crowd for rain, clouds and sun is 2, 6 and 10 friends (plus a fixed 0 to 2 per day from the seed), a ferry adds 4 and a quiet day takes 4 away, and each shell of price loses friends (price 2 loses 2, price 3 loses 6; at least one friend always comes). Sold is the smaller of cups made and friends who came. The three weathers never overlap at one price, so the nearest batch above a day's crowd always leaves at most two cups. A week is rebuilt exactly from its seed, always has two or more weathers, and on level 1 is exactly two weathers with one of them twice, so there is always a day to compare. A rainy quiet day is never made.

Levels: **1** three days, weather only; **2** three days with an event; **3** four days with a price (a middle price earns most on a plain sunny day, the lowest in the rain, the highest on a very busy ferry day, so no price is a dead button); **4** a five-day market week where a lemon costs one shell and makes two cups (a batch of 4, 8 or 12 costs 2, 4 or 6 shells), the purse starts at 6 and carries from day to day, a batch the purse cannot pay for is dimmed (tapping it says what it costs), spare cups still cost their lemons (a small, causal loss), and if the purse falls below the smallest batch's cost the ferry captain tops it up to exactly that, so there is no debt and no failed week. A best choice that does not lose shells exists on every day of every week (tested). **5** *Two lemon boats*: four days as level 4 (events, prices, purse), but each morning two boats at a jetty offer lemons with the same lemons or the same shells (a pool of six pairs, such as 2 for 1 against 2 for 2 or 4 for 2 against 2 for 2). The offers are spoken in the instruction (the pet repeats them) and she taps the cheaper boat; the whole boat is the target. The batch cards then cost what the cheaper boat charges per two lemons, and the day goes on as on level 4. Her end-of-week insight is "Picking the cheaper boat saved you N shells this week!"

Mistakes and help: on levels 1–4 nothing is a miss, so `misses` is always 0; on level 5 only the dearer boat counts (a gentle boing, "This boat wants N shells for 2 lemons. That one wants M.", and one miss), and two misses the same morning glow the cheaper boat and count that day's one hint. Batch and price stay experiments with no miss. Running out, spare cups and a weak first batch are results the table and the pet explain ("All sold out! 5 more friends wanted a cup", "4 cups are left. They go to a picnic with friends!", "The spare cups go to a picnic, but they cost shells to make"). OPEN before choosing only nudges the cards or prices. The lightbulb asks the pet for one true thing about today, most useful first: what happened the last time it was the same weather (ran out, a smaller batch would have sold as well, or nearly everything sold), how another weather compared (levels without a price), what the event does, how the forecast works, and what a higher price does. The rows the message is about are circled; asking again steps to the next. Every message is checked against the model (`helps()`), and on day 1, with no row to point at, it explains the forecast. On level 5, the lightbulb during the boat choice says the boat comparison. Asking for help (or following the boat glow) counts as one hint for the day however often she asks, so a round where help was asked on two or more days counts as struggling and two of those step the level down, while two rounds with no help step it up.

Co-play (`coplayHint`): a grown-up reads the forecast aloud like a weather reporter and plays the first friend in line, while she decides the boat and the cups.

Not built: levels 6–7 (best buy, a typical day), a saved week or market-week chart in the journal, recipe quality and advertising, a "close the stand" button (the home button always works), the Maker Harbor tickets and fair board that this game is the first slice of, and a couch version.
