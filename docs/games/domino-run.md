# Domino Run

<!-- generated: from src/games/domino-run; edit the text below the end mark (npm run game-docs) -->

**ID:** `domino-run` · **Land:** Bubble Beach · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, spacing, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–4 |
| pre-K | 3–5 |
| school | 4–10 |

| Level | Plays like |
| --- | --- |
| 1 | Tip the line |
| 2 | One missing |
| 3 | Fill the gaps |
| 4 | Tall ones reach farther |
| 5 | Two bells |
| 6 | Growing dominoes |
| 7 | Just enough |
| 8 | Two bells, one tray |
| 9 | Where will it stop? |
| 10 | Over the puddle |

<!-- end generated -->

**Starts as:** stand dominoes from a tray in a lane's gaps and tap the green starter; the line clacks down to the bell

**Grows into:** one missing, several gaps, tall dominoes that reach farther, a fork with two bells, a giant for the gong, and a tray with just enough; a chain that stops is never a miss and the dominoes stand back up; puddles, beach moods and chime, horn and drum ends; at school a guess-then-fix level where she taps where the line will stop, sees it run, then repairs it, and a puddle only a giant reaches over

## Design notes

*After domino toppling videos; [definition](../definitions/domino-run.md).* Drag dominoes from a tray into the sockets of a lane (at level 2 a tap on the tray domino also hops it into the glowing gap), then tap the green starter: the line clacks down and the last domino rings the bell. A domino falls if the one before it reaches it (reach equals size) and it is at most one size bigger; a bell is size 1 and a gong is size 4, so only a giant rings it. The size shows on the domino's dot face. Tapping a placed domino sends it back to the tray; dropping on another placed one swaps them. A chain that stalls is never a miss: the fallen dominoes stand back up and the pet says why (a gap too wide, or a push too big). Misses are always 0. From the second stall on a line at levels 3–10 the next placement glows and counts one hint; the pause sheet's "Show a hint" gives the same glow and counts once; a line that already rings just says "Tap the green one!". Levels: 1 Tip the line (tap any domino), 2 One missing (a glowing gap, tap-to-hop), 3 Fill the gaps, 4 Tall ones reach farther, 5 Two bells (a fork, two lines), 6 Growing dominoes (a gong), 7 Just enough, 8 Two bells, one tray, 9 Where will it stop? (tap where the line stops, then fix it), 10 Over the puddle (a two-wide puddle only a giant reaches over). Toddler 1–2, preschool 2–4, pre-K 3–5, school 4–10. Lines are seeded and checked by a tipping-rule test (the authored first lines' exact solutions; 500 seeds across the plans never use the fallback). The ghost-finger bot drags the hint placement, then taps the starter. Every empty slot that is not a socket is a puddle (seeded lines at levels 4 and 6–8; first lines have none): a domino dropped there splashes and springs back, never a miss or hint. Each round has a beach mood (morning, sunset, low tide), and each lane's end has a look (bell, shell chime or boat horn; gong or beach drum) with its own ring and spoken line. Nothing is saved and there is no couch play.
