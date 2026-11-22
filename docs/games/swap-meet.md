# Swap Meet

<!-- generated: from src/games/swap-meet; edit the text below the end mark (npm run game-docs) -->

**ID:** `swap-meet` · **Land:** Cozy Village · **Ages:** toddler–school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** matching, reciprocal-exchange, sequencing

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–4 |
| school | 4–6 |

| Level | Plays like |
| --- | --- |
| 1 | Give it — three pictured requests |
| 2 | Two friends — either request first |
| 3 | Swap! — two mutually wanted pairs |
| 4 | Chain of two — trade twice for a goal |
| 5 | Chain of three — plan three trades past a tempting side trade |
| 6 | Shells make it easier — trade with friends, then try the shell stall |

<!-- end generated -->

**Starts as:** trade pictured toys, with both objects crossing

**Grows into:** levels 1–4: three requests; two friends in either order; two reciprocal pairs; a two-trade chain; school adds a three-trade chain past a tempting side trade (level 5) and a shell stall that sells and buys for a flat price, then a count of which route took fewer trades (level 6). Exact Undo, shortest-path hints, capped support; Cozy Village

## Design notes

Drag pictured toys to make two-way exchanges. Level1 visits three friends in seeded order, each with one request and two basket choices; the returned object arrives before the next visit, and rejected offers count no misses. Level2 has two simultaneous requests, accepted in either order; returned toys stay visible but inactive. Level3 finds two reciprocal pairs among four friends, in either direction/order. Level4 carries one toy through two trades for a pictured kite or flower; a shell is one toy, never currency. Toddler1–2, preschool2–3, pre-K3–4, school4.

Blue back arrow restores the exact pre-trade holds, requests, flags and visit, with both objects crossing back. A deliberate incompatible drop onto an active friend counts one miss at2–4; inspection, empty/cancelled drops, completed friends and Undo are free. Two rejections glow a current-state shortest BFS action; yellow Hint speaks it and another request demonstrates one drag. Assistance persists through Undo, coalesces automatic/manual support per authored task and caps at two. All requests/pairs/the chain finish one shell-owned round/sticker, including supported completion. Graphics art, spoken wants/replay, level-scoped how-to and solver-driven finger demos; no saved inventory, currency, unlock or Keep. Level5–6 wait for children to play1–4.

**Upright on a phone (2026-11-19).** The layout was already a pure `layout` in `logic.ts`; `upright.test.ts` checks every stage shape of every case on the five upright views plus 360 × 800 and 768 × 1024. It found that on tall views the first friend row at y 300 put the friend panel corner and its request bubble under the undo and help buttons (bottoms at y 260) on levels 2–4. Held upright the first row is now max(420, min(560, 0.3 × height)) and the second row sits 380 below it; sideways is unchanged.

**Levels 5–6 (school band now 4–6; 2026-11-22).** Level 5 *Chain of three* has four friend panels (three chain friends and a side friend who wants the same object as a chain friend), the basket and the companion's goal card; two authored cases (kite3 tempts at the second trade, star3 at the first). The side trade is legal and never a miss: it leaves a dead end with a free remark, offers at the dead end count as rejected offers with the dead-end line, and two glow the back arrow. Undo holds up to three entries and never drops one. Hints: the back arrow line, the give line for the goal holder, otherwise the backward clue ("Frog has the kite. Frog wants the berry."). Level 6 *Shells make it easier* has two stages: stage 1 is a plain three-trade chain with the shell stall shut (pictured, no target); stage 2 resets friends and basket and opens the stall (sell any object for the purse, two shells on a string; buy a shelf good with the purse; flat price). Undo starts empty at stage 2 and is capped at three, dropping the oldest. Each stage keeps a net trade count; at the end an unscored question, "Which way took fewer trades?", shows two route cards, accepts fewer, same or more, then the round finishes. A purse dropped on a friend counts as one miss; returning goods to the stall is free. Help names the stall at stage 2.

Departures from the definition: the stall shelf has three fixed places (the definition says two goods, but a sell puts a third there and selling back needs it), sized as three full targets in a row; the level 6 instruction ("Our friend wants a {goal}. Trade with the friends first. Then the shell stall opens.") was written at build because the definition gave none. Five slot-free voice clips were rendered (stall open, purse return, the question, fewer, same). The routes bundle reached 8.39 MB, past the 8 MiB precache bound, so `vite.config.ts` now allows 10 MiB (recorded in DESIGN.md). Resizing during the question redraws the route cards. The `swapmeet` browser suite takes `SWAPMEET_LEVELS` to filter levels, and `autotouch()` taps the route card with fewer marks.
