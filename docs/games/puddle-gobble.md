# Puddle Gobble

<!-- generated: from src/games/puddle-gobble; edit the text below the end mark (npm run game-docs) -->

**ID:** `puddle-gobble` · **Land:** Bubble Beach · **Ages:** toddler–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** comparison, measurement, ordering, addition, planning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–4 |
| pre-K | 3, 4, 5, 10, 6 |
| school | 5, 10, 6, 7, 8, 9, 11, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Soak it up |
| 2 | Too big yet |
| 3 | Bigger and bigger |
| 4 | Count to grow |
| 5 | Smallest first |
| 6 | Bigger number |
| 7 | Add to grow |
| 8 | Just right |
| 9 | Smallest number first |
| 10 | Count the dots |
| 11 | Too full |
| 12 | Two pails |

<!-- end generated -->

**Starts as:** lead a smiling rain puddle with a finger (or taps) and it soaks up the beach things that fit inside it, growing every few

**Grows into:** things bigger than the puddle wobble and wait (never a miss), then smallest first, numbers up to the puddle's own, add to grow, land exactly on the pail's number with a free let-go, and soak numerals smallest first into a puddle that never grows, read dot cards next to numerals as the puddle grows, let things go from a too-full puddle until it matches the pail, and fill two pails from one set (lead onto a pail to pour, tap a full pail to tip it back); everything soaked washes up in a row, smallest to biggest

## Design notes

*After Hole.io, Donut County and Katamari's growing threshold; [definition](../definitions/puddle-gobble.md).* A smiling rain puddle sits on the beach. She leads it with a finger (a drag, or a tap where it should go; the whole screen steers, as in Duckling Parade) and it soaks up the shells, pebbles and driftwood that fit inside it: a thing fits when its tier (1–4, shown as dots) is at most the puddle's, and the puddle grows a tier after every two soaks (levels 2–3) or three (level 4, a drop meter on its rim); level 1 does not grow. A thing that is still too big wobbles and the puddle says "Too big yet"; that is never a miss at any level. At the end every soaked thing washes up in a row, smallest to biggest. Levels: 1 Soak it up (no growth), 2 Too big yet (grow every two), 3 Bigger and bigger (grow every two), 4 Count to grow (every three, a drop meter), 5 Smallest first (a stated order, no growth), 6 Bigger number (numerals on the things, the puddle gains 1 per soak, numerals alone at pre-K), 7 Add to grow (the puddle gains each thing's number, with a sum strip along the top), 8 Just right (reach exactly the pail's number: soaking past it is refused, and tapping a token on the strip lets that thing go, free). Toddler 1–2, preschool 2–4, pre-K 3–10, school 5–12 (see below); no lap entry. Misses come only at level 5 (a bigger thing before a smaller one) and level 8 (an overshoot), one per thing per round, and only when she **aimed** at it: the finger's destination is on that thing, no fitting thing is nearer the finger, and nothing has been soaked since she last aimed (a pass-over on the way only wobbles, and a step-aside the game makes after a let-go is never her aim). This aim gate is a deliberate accounting choice beyond the definition. After two aimed too-big tries since her last soak (levels 2–4 and 6–8) or two misses (levels 5 and 8) the next fitting thing glows: free at levels 1–3, from level 4 it counts one hint until she soaks again; the pause sheet's "Show a hint" glows and counts one hint per glow. Level 8's hint glows a soak on an exact solution, or the latest strip token to let go. After a let-go the puddle steps off the thing's spot and the thing re-arms once the puddle moves 30 units away or changes size. The first round of each level is authored once per session; later rounds are seeded boards, and a rule test checks that no level 1–7 board can dead-end and that level 8's hint reaches the pail within eight steps from every reachable state. The ghost-finger bot follows the hint target, steering round things in its way and tapping let-go tokens. Seventeen code-drawn things fill the tiers (tier 3 adds a sun hat and a sand spade, tier 4 a closed beach umbrella and a rolled towel, so a level-5 board varies), and numbered levels 6–8 draw pebbles, shells, starfish, sea glass and buttons. Each round takes a seeded beach mood, morning (pale sky, teal sea, mist) or midday or evening (purple-to-orange sky, low half sun, warm sand sheen); it is drawn after the board, so the board never changes, and each level's first round of a session stays midday. **Level 12 Two pails** (school, [definition](../definitions/puddle-gobble-two-pails.md)): two pails sit side by side (authored start 3, pails 9 and 11, numbers 1, 2, 3, 4, 5, 7). She soaks numbers until the puddle equals a pail's number, then leads it onto that pail to pour it in; a tap on a full pail tips it back (free). The only miss is an aimed too-much against the bigger open pail; hint order is pour, soak, fewest let-gos, tip. Build choices beyond the definition: a full pail is drawn above the puddle so its tick and number show; a pail that refused a pour re-arms when the puddle moves 30 away or its number changes (found by `fingerdemo`: a let-go while sitting on a pail must pour); extra voice lines `gobble.hint-pour`, `gobble.hint-tip`, `gobble.done-two-pails`; the finale row sits below the pails. Co-play: name a thing before the other steers there. Off-screen: nest cups from smallest to biggest. Nothing is saved and there is no couch play.
