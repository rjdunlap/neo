# Adventure Walk

<!-- generated: from src/games/adventure-walk; edit the text below the end mark (npm run game-docs) -->

**ID:** `adventure-walk` · **Land:** Barnyard · **Ages:** toddler–school · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-words, listening, following-directions, sequencing, map-reading

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–4 |
| school | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Pick either way past each landmark |
| 2 | Take the way the friend calls at each landmark |
| 3 | Follow two of the friend’s calls in order, then a third |
| 4 | Walk to the picnic, then lead the way home on the map |
| 5 | Pick the drawn trail the friend describes, there and back |

<!-- end generated -->

**Starts as:** tap one of two glowing ways (over or under, through, across, around) past each landmark on the companion's walk to a friend's picnic, then follow the friend's call

**Grows into:** level 1 free choices past three landmarks with a duck, cow or pig waiting; level 2 follows one spoken way, level 3 two calls at once, with a badge to replay them; level 4 walks out freely, then leads the way home on a map; level 5 picks among three drawn trails the friend calls, there and back; a wrong tap is a miss, two at one stop light the asked way and a hint shows it

## Design notes

*After route-following walks and spatial-word books; [definition](../definitions/adventure-walk.md).* The companion walks to a friend's picnic past three landmarks (a brook, reeds, a log, a boulder or a puddle, three per round from a seeded shuffle), and at each one two glowing ways past are drawn: over or under, through, across, around. Screen-only: the companion does all the walking and nothing asks the person to move. Level 1 lets her tap either way (free, so a round counts 0 misses and 0 hints); levels 2 and 3 follow the friend's call (a duck, cow or pig), one call per stop at level 2 and two at once at level 3 with the friend's badge to replay them (replays are free). Any wrong tap counts a miss and the walker turns back with the reason; two misses at one stop light the asked way and count one hint (at most one per stop), and Show a hint (the pause sheet) does the same. Start again restarts the walk. Home is Barnyard (Rainbow Meadow and Story Grove failed their scene decor tests); region Story Grove. Known gaps: no cross-round landmark bag (all five landmarks appear across seeds), and the device speech for "across" and "around" is unchecked.

**Levels.** Level 1 *Pick a way* (toddler, preschool): either way is right. Level 2 *Come this way* (preschool, pre-K): follow one spoken way. Level 3 *Two at once* (pre-K, school): follow two calls, then the third stop's. Level 4 *The way home* (pre-K, school 2–4/3–4) is built (2026-11-17): the walk out is level 1 exactly (nothing counted), then the picnic shrinks into a map (home door, three landmark tiles in route order, the picnic, one dotted path; shapes `sweep`, `zigzag`, `hook` from the round's seed) and she taps the landmark the walk home comes to next, three times. A tile that is not next is a miss ("Not yet! Follow the path from the picnic.", the companion steps once toward the right one); two misses on a leg or Show a hint light the next tile and say "We get to {place} first." (one hint per leg); a tile already passed only wiggles. The companion goes back past each landmark the way it came and walks to its door itself; footprints on each tile show the way walked. Level 5 *Which trail?* (school 3–5) is built (2026-11-17): the whole round is on the `sweep` map with three coloured, marked trails past the same three landmarks (192 fair sets). The friend's badge calls one in three steps (tap it to replay, free); a first tap on a flag looks along its trail (silent sparkle, free), a second walks it. A wrong trail walks to the first differing stop, turns back with a boing, is a miss and keeps a turned-back mark; it cannot be walked again that pick. At the picnic the friend calls a different trail home; the trail she came by shows footprints and its flag says "We came that way." When one trail is left unmarked its flag glows (a hint, once per pick), and Show a hint is that same hint. A round counts at most 3 misses and 2 hints. The ribbons are the path, so no dotted path is drawn; departures from the definition are in its as-built note.

**Upright on a phone (2026-11-18, upright batch 8):** every level plays upright at every band. Level 4's map had tiles overlapping each other and the companion on every upright view, so `UPRIGHT_SHAPES` puts the tiles in two columns with the door and picnic between, and the map companion is drawn at 0.42 instead of 0.35 (`mapWalkerScale`; its tap area was already 120). `standArea` is in `logic.ts`. Layout test: `upright.test.ts` in the game folder.
