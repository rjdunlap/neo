# Melt and Freeze

<!-- generated: from src/games/melt-freeze; edit the text below the end mark (npm run game-docs) -->

**ID:** `melt-freeze` · **Land:** Bubble Beach · **Ages:** lap–preschool · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** states-of-matter, cause-and-effect, observation

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 1–3 |
| preschool | 3–4 |

| Level | Plays like |
| --- | --- |
| 1 | Sun and snow: tap the sun to melt an ice cube and the snowflake to freeze it again |
| 2 | Three things in turn: warm each one and see which melt, then cool the ones that did |
| 3 | Make it…: three request cards, each asking for the sun or the snowflake |
| 4 | Some do, some don’t: warm and cool a tray of four things together |

<!-- end generated -->

**Starts as:** lap–preschool

**Grows into:** tap the big sun and a thing on the table slowly melts into a puddle with a drip and a chime; tap the snowflake and it goes hard again

## Design notes

*After warm-and-cool play with ice, butter and chocolate; [definition](../definitions/melt-and-freeze.md).* A thing sits on a little table with a big sun and a big snowflake at the bottom. Each tap is one warm or cool step: the sun slowly melts ice, butter or chocolate into a puddle with a drip and a chime, and the snowflake makes the puddle go hard again as the same thing. A stone or a spoon never changes. Tapping a thing wiggles it (free). Music is the island loop.

**Levels.** Level 1 *Sun and snow* (lap, toddler): one ice cube; the round ends after one melt and one freeze; after 14 s of rest with one change unseen the pet shows the other tool, and the snowflake pulses after three suns in a row. Level 2 *Three things in turn* (lap, toddler): ice, butter and stone first, then three seeded distinct things with at least one changer and one stayer; sun each, then snowflake the ones that melted. Level 3 *Make it…* (toddler, preschool): three request cards (melt the ice, make the butter puddle hard again, melt the chocolate, then seeded on changers, alternating direction). Level 4 *Some do, some don't* (preschool): two trays of four, sun and snowflake act on all four, a tray finishes when both tools were used. Bands: lap 1–2, toddler 1–3, preschool 3–4.

**Misses and help.** Only level 3 counts misses: each wrong tool is one miss and shows what that tool does, a spoken clue follows the first, the right tool glows from the second (one counted hint per request; Show a hint on the pause sheet does the same once), and on the third miss the pet taps the right tool. Levels 1, 2 and 4 count none. Each thing that melted files a journal entry (`melt-freeze:ice`, `butter`, `chocolate`) and a stone or spoon that stayed in the warm files `melt-freeze:stays`. Co-play: ask her what the sun did, then the snowflake. Off-screen: an ice cube on a plate by a window. Start again is ignored while a change animates.

**A met request never holds the next one (U7 fix batch 4, 2026-11-11).** At level 3 `meltfreeze.same` starts and plays over the thing's exit and the next thing's arrival (0.85 s); the tools open as soon as the next thing stands. The next request's instruction is spoken when the lesson line ends, or at once if she taps a tool or asks for a hint first, so the pet never repeats a stale request. On the last request the line is heard out before the closing line.
