# Fruit Sums

<!-- generated: from src/games/fruit-sums; edit the text below the end mark (npm run game-docs) -->

**ID:** `fruit-sums` · **Land:** Counting Cove · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** adding, taking-away, number-sense, operations

| Band | Levels, easiest first |
| --- | --- |
| school | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Make a number up to 10 by adding two fruit, two different ways |
| 2 | Make a number up to 20 by adding two fruit, two different ways |
| 3 | Make a number up to 15 by adding or taking away, two different ways |
| 4 | Add two fruit to make the same as the sum on the sign, two different ways |

<!-- end generated -->

**Starts as:** tap two numbered fruit (and, later, a plus or take-away leaf) and the check to make the number on the sign; any way that works counts, and the round asks for two different ways

**Grows into:** add to 10, add to 20, then plus or take away to 15; three looks (orchard, cove, autumn), fruit that drop in, and a hint that glows step by step

## Design notes

*Levels 1–3 · after Donkey Kong Jr. Math's.* Calculate *mode (the notebook's "Make Twelve").* A hanging sign names a number and the tree drops five or six numbered fruit. Tap two fruit and they hop into the two boxes (tap a fruit in a box to put it back, or tap a third fruit to swap the newest), then tap the green check. **Any way that makes the number counts**, and a round asks for **two different ways**: the first is celebrated aloud ("7 plus 5 makes 12!") and listed under the sign, then "can you make 12 a different way?". The same sum the other way round, or the same one again, is "the same way" and is not a miss; a tray is built around two ways, so a round can always be finished. A try that makes another number is a miss and the check shows what it made ("8"), spoken as "3 plus 5 makes 8. We need 12."; the fruit stay in their boxes so she can swap one and check again, and after two misses on a sum the first fruit of a way she has not found glows (one hint). Levels: 1 add to make 4 to 10 from five fruit; 2 add to make 11 to 20; 3 a plus leaf and a take-away leaf choose the sign (the fruit tapped first is the one to start from), targets 5 to 15 from six fruit up to 20, and the tray always allows both a sum and a take-away. Taking away more than she has says so and is not a miss. Rules, tray generation and layout are in `logic.ts`: a test checks every seeded tray at every level has at least two distinct ways, stays inside the level's numbers, and keeps every target at least 100 units clear of the pet corner at five views. The second way is the whole point: many routes reach one answer. Notebook sketch's *times*, three-fruit sums and the grown-up "make 24" are not built; two people sharing the tray is a co-play prompt only, since seat modes wait on the family-table decisions.

**Looks, drop and hint (slice 1).** Each round has one of three looks: an orchard morning (round fruit), a cove palm at sunset (coconuts ringed in the tray colour) or autumn (pears and plums alternating). The fruit fall in from above the top edge, one after another, landing on falling pops, and take taps once landed; a found way's two fruit hop. The hint follows through: it glows the fruit that starts a way (preferring the one already in the first box), then its partner, the needed leaf at level 3, then the check; a first-box fruit that leads nowhere glows so a tap sends it home. Still one hint per sum.
