# Duckling Parade

<!-- generated: from src/games/duckling-parade; edit the text below the end mark (npm run game-docs) -->

**ID:** `duckling-parade` · **Land:** Barnyard · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** motor-planning, counting, colors, patterns

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–3 |
| preschool | 2–6 |
| pre-K | 4–8 |
| school | 9–11 |

| Level | Plays like |
| --- | --- |
| 1 | Tap to walk Mama Duck; ducklings join her line |
| 2 | Tap the grass or lead with a finger; bring every duckling to the pond |
| 3 | Bring 2 or 3 ducklings home |
| 4 | Find the ducklings of one color |
| 5 | Bring 3 to 5 ducklings home |
| 6 | Bring 2 or 3 ducklings of one color home |
| 7 | Make a repeating pattern with two alternating colors |
| 8 | Make a repeating pattern with three colors |
| 9 | Make the pattern: two of one color, then one of another |
| 10 | Make the pattern, leaving out the duckling that does not fit |
| 11 | Make the pattern: one of a color, then two of another |

<!-- end generated -->

**Starts as:** tap the grass or lead with a finger to walk Mama Duck; a fading grass ring acknowledges the destination; ducklings fall in behind

**Grows into:** lead them to the pond, bring exactly N, find one color, build repeated color patterns, leave out a duckling that breaks the pattern; level 11 repeats one of a color then two of another

## Design notes

*After Meerca Chase (Neopets).* Tap the grass or lead with a finger to walk Mama Duck; ducklings fall in behind (steer a growing line). A broad, fading grass ring acknowledges the clamped destination. Lifting or cancelling the finger keeps Mama walking there, while cancellation, lost capture, window exit, blur and visibility changes forget the old finger. A new accepted finger leads; palm rejection remains. The cue clears on arrival/finish, resize and destroy; native listeners are released on destroy. Later: lead them to the pond, bring exactly N, find one color, make an AB or ABC pattern, then repeat a two-of-one/one-of-another pattern (AAB at levels 9–10, school) and leave one spare duckling in the meadow. Level 11 (school) flips the unit to ABB: six ducklings, two colors, shown A B B A B B (one of a color, then two of another). It uses the same pattern rules: a wrong next color is refused, two misses glow the right ones, and a partial line cannot unload at the pond. The meadow holds exactly the pattern's ducklings. Pattern colors vary by round. Each round also picks one of two seeded meadow looks, flowers or reeds, drawn behind the pond and the back strip as decoration only (never a duckling color, no effect on rules or places). Count rounds allow partial deliveries; extra-arrival speech names the combined total, including ducklings already in the pond, and extras hop back out (one arrival miss). A wrong duckling that merely waits beside Mama at the start is never a "not me": a refusal counts only once a finger has set a destination near it (a miss also needs that destination to be nearer it than to any duckling that may join).
