# Log Roll

<!-- generated: from src/games/log-roll; edit the text below the end mark (npm run game-docs) -->

**ID:** `log-roll` · **Land:** Tinker Lab · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spatial-reasoning, planning, mental-rotation

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–7 |

| Level | Plays like |
| --- | --- |
| 1 | Open stones: learn to tip and stand |
| 2 | Two gaps: plan the log’s footprint |
| 3 | Broken path: weave around three gaps |
| 4 | The long way round: loop past the dead ends |
| 5 | Lay it in the cradle: finish lying across two stones |
| 6 | Soft moss: cross the soft stones lying down |
| 7 | The stone bridge: stand on the switch, then cross |

<!-- end generated -->

**Starts as:** tip a log across stones and stand it upright on the goal

**Grows into:** seven levels of four frozen floors each (mirrored, so eight shapes a level), from gaps and a lying cradle finish to soft moss and a standing switch that raises a bridge, with exact shortest-route hints, a visible tip, three pond looks, Undo, restart and ghost finger; touch only, in Tinker Lab

## Design notes

Grown-up, Tinker Lab; touch only. Use the directional controls to tip a log across stepping stones and stand it upright on the pictured goal. Each level has four frozen floors with a hollow ('G') and a seeded left-right mirror; layout derives from the floor size, and one of three seeded looks (spring pond, autumn leaves, evening water) dresses the pond. The log tips over in 0.22 s with at most one queued tap, a refused roll leans toward the missing stone, and finishing ripples the hollow and shows the roll count and the shortest route as information only. A glowing hint is counted once. Hints are exact shortest routes. An invalid roll leaves the log in place with gentle feedback; Undo and restart remain available. Complete at the upright goal for one sticker, including with help; ghost-finger demonstration included. Level 5 swaps the upright goal for a cradle: two stones marked 'C', side by side or stacked, that the log must lie across; standing on a cradle stone is not a miss, it says `log.cradle` and shows "Standing does not fit · lie it across both cradle stones". Depth 10 sits below level 4's 16 because the new rule carries the difficulty (a recorded choice, for a person to judge).


Level 6 *Soft moss* has three green moss stones on a 6×5 floor at depth 8. Moss supports a lying log but refuses a standing log, with a lean and spoken explanation; refusals cost no miss. Level 7 *The stone bridge* has a 7×5 floor split by water, two sunken bridge stones and a purple-ringed switch. Standing on the switch raises the bridge in a short animation; lying on it does nothing. The bridge stays raised until Undo takes back the press or Start over resets the puzzle. Hints search forward with the bridge flag as part of the state, so they stay exact after revisions. Its starts are exactly 12 rolls away and all require the switch. Levels 1–5 retain their floors and starts.
