# Bumper Garden

<!-- generated: from src/games/bumper-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `bumper-garden` · **Land:** Bubble Beach · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-effect, tracking, colors, counting

| Band | Levels, easiest first |
| --- | --- |
| lap | 10, 1 |
| toddler | 1–2 |
| preschool | 2–4 |
| pre-K | 3, 4, 6, 8, 5, 9 |

| Level | Plays like |
| --- | --- |
| 1 | Tap to launch the ladybug; flowers bloom when it bumps them |
| 2 | Flip the ladybug back up until every flower blooms |
| 3 | Bloom the three flowers of one color |
| 4 | Bump flowers 1, 2, 3 in order |
| 5 | Bump flowers 1 to 5 in order, with others in the way |
| 6 | Count on from a number between 2 and 6: three or four flowers in order |
| 8 | Bloom every flower that is not the color asked for; those ones are asleep |
| 9 | Count back to 1 from a starting number between 5 and 8 |
| 10 | One big flower: touch anywhere to launch the ladybug; another flower wakes at each launch |

<!-- end generated -->

**Starts as:** lap starts at level 10: one big flower, and a touch anywhere launches the ladybug; level 1 then has her tap to launch it through several flower bumpers

**Grows into:** flip it back up until every flower blooms, bloom one color or every flower but one sleeping color, bump numbered flowers in order, count on from 2–6 or back from 5–8 to 1; a pulsing ring shows when to flip (2–6, 8–9); seeded Meadow, Pond and Hive tables

## Design notes

Each seeded round chooses a Meadow arch, Pond columns or Hive ring. Pond bumpers are tinted lily pads with ripples and a low croak-bell; Hive bumpers are hexagonal flowers with higher wooden notes. The same missions, collision sizes and accounting apply to every table.

*lap–pre-K · after Pokémon Pinball and 3D Pinball Space Cadet.* A ladybug ball bounces around flower bumpers on a garden table. It never drains: past the flippers a flower pot catches it and pops it back up. Tapping either half of the screen flips that side's flipper; young levels get a wider reach. Level 10 (lap's start; the ID sits above the ladder, `entryLevels: [10]`, lap plays 10 then 1) is the one level without side buttons: one big flower stands alone in the middle (drawn in full colour before it blooms, never yellow on the yellow Hive table), the table is scaled to 1.6 and centred on a tall phone, and a touch anywhere launches the ladybug, which waits without limit. While it flies, a touch still swings the flipper on that side. Each launch after the first wakes another flower with a chime and the spoken line `bumper.grow` (six awake by the sixth launch); the round ends after six launches, with nothing counted or wrong. At levels 2–6, 8 and 9 a pulsing ring at the nearer flipper tip shows when the falling ladybug is within its actual reach; it changes no physics and counts no hint. Levels: level 1, launch for fun with several flowers already awake (ends after six launches), flip until every flower blooms (the pet counts each bloom aloud, as it does at the color level), bloom one color (ends when all of that color have bloomed), bump numbered flowers in order (ends at the last numbered flower). Level 8, *Not this color*, asks "Bloom every flower that is not {color}!" and, 1.4 s later, the asked color's flowers fall asleep (faded, tilted, a bobbing "z", on all three tables): they are never wanted and bumping one only chimes. The plan has 8 flowers, 2 of the asked color and 3 each of two others; the asked color is always the fewest and at least 2 flowers are wanted, all reachable by an aimed launch. A launch that blooms nothing wanted is a miss and the usual two-in-a-row glow and aimed launch apply (a counted hint; hint accounting on this level is an open decision). The finale wakes the sleepy flowers. Level 6, *Count on*, starts at a seeded number from 2–6 and asks for three or four consecutive flowers. Level 9, *Count back*, starts at 5–8 and descends to 1. Both show a number strip highlighting the next target and speak the starting instruction; an out-of-order bump only chimes. Pre-K follows the explicit order 3, 4, 6, 8, 5, 9; ID 7 remains unbuilt. On goal levels a shot that blooms nothing wanted is a gentle miss; two in a row light the wanted flowers and aim the next launch at one (found by simulating the table).
