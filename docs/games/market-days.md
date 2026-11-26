# Market Days

<!-- generated: from src/games/market-days; edit the text below the end mark (npm run game-docs) -->

**ID:** `market-days` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** constraint reasoning, planning

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Three days: give each town a market day, three towns already set |
| 2 | Start from nothing: three market days for every town |
| 3 | Fewest days: four banners offered, finish with only three |

<!-- end generated -->

**Starts as:** Eight towns each hold one market a week; she gives each town a market day (a banner with a colour and a shape) so that towns joined by a dotted path, a day's walk apart, never share a day. Level 1 sets three towns that all need different days and she finishes the other five; level 2 starts from nothing.

**Grows into:** Level 3 offers four banners and asks for a finish that uses only three, with Why? showing three towns that are all a day apart (so two days can never work). More maps, and a four-day map, are later slices.

## Design notes

- Definition: [market-days](../definitions/market-days.md). The rules (map, neighbours, solver, hint) are in `logic.ts`; the map has exactly six proper three-banner assignments, all the same partition, so a legal finish is the answer.
- A miss is a placement that clashes with a joined town; the clash wobbles red and stays so she can see why. Two misses glow the Hint button. Hint glows a forced town (or a town of a triangle), and a second Hint on the same town places its banner. Why?, Undo and Restart are free.
- A fourth banner in a finished level 3 round is neither a miss nor a finish: "Can you do it with fewer days?"
- Not built from the definition yet: arrow keys and 1 to 4 keys, a drag from a banner to a town, and the ghost finger's deliberate conflict (its taps go straight to the finish). The one historical line for the grown-up card is not written: the source check against the medieval-life study is still to do, so nothing historical is on screen.
- The title line is `market-days.title`, not `game.market-days`, so no rendered clip is needed (the title speaks by device speech until a voice pass renders it; a `game.*` line needs a Kokoro clip).
- Upright-ready: towns and banners are at least 100 units; `upright.test.ts` records the layout at every phone view.
