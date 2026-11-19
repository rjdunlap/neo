# Swap Meet

<!-- generated: from src/games/swap-meet; edit the text below the end mark (npm run game-docs) -->

**ID:** `swap-meet` · **Land:** Cozy Village · **Ages:** toddler–school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** matching, reciprocal-exchange, sequencing

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–4 |
| school | 4 |

| Level | Plays like |
| --- | --- |
| 1 | Give it — three pictured requests |
| 2 | Two friends — either request first |
| 3 | Swap! — two mutually wanted pairs |
| 4 | Chain of two — trade twice for a goal |

<!-- end generated -->

**Starts as:** trade pictured toys, with both objects crossing

**Grows into:** levels 1–4: three requests; two friends in either order; two reciprocal pairs; a two-trade chain. Exact Undo, shortest-path hints, capped support; Cozy Village

## Design notes

Drag pictured toys to make two-way exchanges. Level1 visits three friends in seeded order, each with one request and two basket choices; the returned object arrives before the next visit, and rejected offers count no misses. Level2 has two simultaneous requests, accepted in either order; returned toys stay visible but inactive. Level3 finds two reciprocal pairs among four friends, in either direction/order. Level4 carries one toy through two trades for a pictured kite or flower; a shell is one toy, never currency. Toddler1–2, preschool2–3, pre-K3–4, school4.

Blue back arrow restores the exact pre-trade holds, requests, flags and visit, with both objects crossing back. A deliberate incompatible drop onto an active friend counts one miss at2–4; inspection, empty/cancelled drops, completed friends and Undo are free. Two rejections glow a current-state shortest BFS action; yellow Hint speaks it and another request demonstrates one drag. Assistance persists through Undo, coalesces automatic/manual support per authored task and caps at two. All requests/pairs/the chain finish one shell-owned round/sticker, including supported completion. Graphics art, spoken wants/replay, level-scoped how-to and solver-driven finger demos; no saved inventory, currency, unlock or Keep. Level5–6 wait for children to play1–4.

**Upright on a phone (2026-11-19).** The layout was already a pure `layout` in `logic.ts`; `upright.test.ts` checks every stage shape of every case on the five upright views plus 360 × 800 and 768 × 1024. It found that on tall views the first friend row at y 300 put the friend panel corner and its request bubble under the undo and help buttons (bottoms at y 260) on levels 2–4. Held upright the first row is now max(420, min(560, 0.3 × height)) and the second row sits 380 below it; sideways is unchanged.
