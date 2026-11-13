# Sand Table

<!-- generated: from src/games/sand-table; edit the text below the end mark (npm run game-docs) -->

**ID:** `sand-table` · **Land:** Rainbow Meadow · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, spatial, materials, making

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3 |
| school | 3–4 |

| Level | Plays like |
| --- | --- |
| 1 | Pour and scoop one sand heap |
| 2 | Build or lower two hills |
| 3 | Shape a landscape and show it |
| 4 | Watch the breeze and find where the sand landed |

<!-- end generated -->

**Starts as:** tap the tray to pour dry sand into a heap, tap a scoop paddle to lift some back into the bucket, then plant the flag (at lap a touch anywhere pours and eight pours finish the round); level 2 adds a second bay, level 3 a pail for spills and a landscape to Show

**Grows into:** level 1 one heap, level 2 two hills, level 3 three bays from a seeded start with a pictured invitation (any landscape is finished: no misses, no hints); level 4 a breeze puff and a pad question, the game's first right answer, with real misses and hints

## Design notes

Level 4 *Where did it go?* (built 2026-11-10, E4) follows the [E3 definition](../definitions/sand-table-sediment.md): school {3,4}; one breeze puff from a seeded side over one of three authored hills (six setups) hops the top grains over the crest; the old outline stays, grains landed in the lee settle by the built rule, and she taps the answer pad under the bay that gained. Replay re-runs the puff; Show a hint is the breeze (free), then a dotted hop path (counts one hint), then a glow behind the right pad (counts once); a glow also appears after two misses; the round finishes with the real misses and hints. Pads ignore taps (a tick) while grains move. The transport is an invented toy rule checked against the Geological Society and HiRISE dune pages.

*After sand trays and sandboxes; [definition](../definitions/sand-table.md).* A warm tray of dry sand sits under a bucket. Tap the tray and a shower of grains pours down, lands and slides into a heap; tap a scoop paddle and a scoopful lifts back into the bucket and the heap slumps. The grains follow an invented toy rule, not measured sand, and the how-to card says so. Any landscape is a finished one: planting the flag (level 3: **Show**, when the pet walks the landscape) ends the round with 0 misses and 0 hints, and nothing is kept. Pouring into an empty bucket or past the rim is never a miss; at level 3 spilled grains collect in the pail and can be tipped back. Show a hint (the pause sheet) is a real demonstration action that counts nothing, and Start again restarts the round. Home is Rainbow Meadow (Bubble Beach and Treehouse failed their scene decor tests).

**Levels.** Level 1 *Make a mound* (lap, toddler): one bay. At lap only (built 2026-11-13, PR #1609) it is a touch-anywhere version: a full-screen layer under the tray means a touch on the sky, the bucket or the wooden frame pours onto the one heap as the tray does, the scoop paddle and the flag are not shown, and the round finishes by itself 0.9 s after the eighth pour (`LAP_POURS = 8`; twelve pours would empty the bucket, so it never runs dry and the pail never comes up). The first heap is still greeted, and the lap instruction is "Tap anywhere to pour the sand!" (no rendered clip yet; device speech). Start again keeps the pours already made. The ghost finger taps the bucket, the sky and the sand in turn. Toddler's level 1 is unchanged. Level 2 *Two little hills* (toddler, preschool): two bays. Level 3 *A landscape to show* (preschool, pre-K): three bays and the pail, from a seeded start and a pictured invitation. Level 4 *Where did it go?* (school): a breeze moves sand, and she picks the bay that gained. Levels 5–6 are reserved for the study's sediment rungs.
