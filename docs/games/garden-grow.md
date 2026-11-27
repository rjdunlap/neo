# Garden Grow

<!-- generated: from src/games/garden-grow; edit the text below the end mark (npm run game-docs) -->

**ID:** `garden-grow` · **Land:** Rainbow Meadow · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, colors, counting, living-things

| Band | Levels, easiest first |
| --- | --- |
| lap | 8, 1, 2 |
| toddler | 2, 3, 4, 14 |
| preschool | 3, 4, 5, 14 |
| pre-K | 6, 7, 9, 10, 11, 12, 14 |
| school | 12, 13, 15 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the soil: a seed goes in and grows into a flower |
| 2 | Plant seeds, then tap the cloud to make it rain and grow them |
| 3 | Plant the color asked for: "a red flower" |
| 4 | Plant exactly 2 to 5 seeds, then make it rain |
| 5 | Two colors with a number of each: "2 red and 3 yellow" |
| 6 | Plant one more flower than the sign shows |
| 7 | Plant two rows of three flowers |
| 8 | One big bed: every touch grows the flower one step, three flowers |
| 9 | Rows of colors: choose a packet and plant each row its color |
| 10 | Columns of colors: plant each column its color |
| 11 | Same in every row: plant the same number in each row, in any beds |
| 12 | Same seeds, one difference: name what differs, then which bed grew taller |
| 13 | You change one thing: set the second bed so only the asked thing differs |
| 14 | Lift the soil: see the roots and the shoot, then a leaf crumble |
| 15 | Above and below: lift both beds and find the longer roots or the taller shoot |

<!-- end generated -->

**Starts as:** tap the soil (or anywhere, on the big-bed lap level): a seed grows into a singing flower of five kinds

**Grows into:** rain from a cloud, planting the color asked for, exactly so many seeds, two colors with a number of each, one more than the sign, two rows of three, a big bed that grows with any touch, rows of two colors, columns of colors, the same number in every row, then (school) two beds from the same seeds: name the one difference and read which grew taller, then set the second bed so only the asked thing differs, a fair test in a toy garden

## Design notes

*After toy gardens and Viva Piñata.* Tap the soil and a seed grows into a smiling flower that sings when tapped. Level 2 adds the cloud: plant, then make it rain. Opened from the collection book's blossom goal (RW11 slice 2, `ctx.request` a flower kind, played at level 2 whatever her band's range), the first seed she plants is that kind and the round ends once rain has made a flower of it bloom, reported as `RoundResult.grew`; no other behaviour changes. Later levels plant the color asked for (a wrong packet shakes, as a miss), then exactly 2–5 seeds before the rain, then two colors with a number of each. Pre-K level 6 asks for one more of a color than the flower sign shows; level 7 shows a two-by-three array in a color drawn from all six and asks for those six flowers; pre-K order is 6, 7, 9, 10, 11. Level 9, Rows of colors, shows a sign of two rows by three (top and bottom rows differ): choose a packet (free; it lifts with a ring), then tap beds; a seed of another color replaces a planted one, the same color takes it out; the rain judges by position, and a wrong layout is a miss with "The top row needs red." Level 10, Columns of colors, asks for three columns in two or three colors the same way. Level 11, Same in every row, shows flowers, empty pots and a numeral per row (1 or 2 each): plant that many in each row in any beds, every placement is accepted, and the finish says "2 and 2 makes 4". At levels 9–11 two misses glow the wrong or empty beds (at 11 the short row's free beds or the over row's extra seeds). Level 8, Grow it up, is the lap entry (lap order 8, 1, 2): one big bed, and any touch anywhere grows the flower one stage (seed, sprout, leaves, bud, open); a touch on the open flower puts it in a vase and plants the next seed, and three flowers end the round with no misses or hints (a touch mid-growth snaps the previous stage). Flowers come in five kinds (blossom, daisy, tulip, sunflower, bell) that vary per request; packets, sign and seed tags show the kind, but only color and number are judged, and the free levels pick a random kind per bed. A picture sign shows what was asked and each planted seed has a marker in its color. Tapping a planted seed takes it out and the new count is said aloud; tapping a packet when every bed is planted says so (not a miss) and points to the cloud or a seed to take out. At level 1 each bed grows on its own, so a tap on another empty bed plants at once and the round ends when no bed is still growing. Two misses make the sign and the beds still to plant glow. A seed grows in stages (stem, two leaves unfolding, a bud swelling, then the smiling head opening), and rain darkens a bed's soil, which dries back slowly once the flower is up; this is presentation only. For co-play the tip names the weather seat: one plants, one taps the cloud and says "Rain, rain... it grows!"

*Growing Conditions (levels 12–13).* Defined in [growing-conditions](../definitions/growing-conditions.md) and built in `conditions.ts`. The model is one reviewed toy table: height = 2 + 2 for sun + 1 for a lot of water, read on a five-mark ruler, every plant healthy. Level 12 is reading (no prediction needed); level 13 is the first fair-test choice, with a verdict of fair, nothing different, only the other thing, or two things, and free flipping after a fair test. Content check against the NGSS 2-LS2-1 and K-LS1-1 pages and NSTA's plant-needs resources ([sources in the verification entry](../verification/2026-11-26-garden-grow-levels-12-13-growing-conditions.md)); claims stay at "in this toy garden". Pre-K plays level 12 only; the 3×4 school grid stays a separate option on the dive.

*Under the Soil (levels 14–15).* Defined in [under-the-soil](../definitions/under-the-soil.md) and built in `cutaway.ts`. Level 14 (toddler, preschool and pre-K, after their other levels; nothing is judged) lifts a lid over one bed to show the roots below the shoot, names each part when tapped, grows both with rain, then lifts a second lid under a leaf and steps through three pictures of it crumbling (no time scale). Level 15 (school, after the fair test) puts matched beds under that window: lift both, grow, read a ruler above and one below, and tap the bed with the longer roots or the taller shoot; one wrong bed is a miss and a second glows the answer. One table: root depth equals shoot height. Content check against [Huntington's roots page](https://huntington.org/roots), [National Academy's "function of roots" lesson](https://www.thenational.academy/teachers/lessons/the-function-of-roots), the [Missouri Department of Conservation on decomposers](https://mdc.mo.gov/blogs/discover-nature-notes/decomposers) and [National Geographic's decomposers entry](https://education.nationalgeographic.org/resource/decomposers/): roots anchor and take in water, worms, fungi and bugs break leaves down and enrich the soil; "bigger plant, longer roots" is kept as a toy claim only. Deviations from the definition: the band windows set `max` to 14 so the registry's order check holds, and level 14 draws no rulers (it counts nothing).
