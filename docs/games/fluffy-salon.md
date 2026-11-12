# Fluffy Salon

<!-- generated: from src/games/fluffy-salon; edit the text below the end mark (npm run game-docs) -->

**ID:** `fluffy-salon` · **Land:** Painted Canyon · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** creativity, pretend-play, vocabulary, fine-motor

| Band | Levels, easiest first |
| --- | --- |
| lap | 6, 1, 7, 2 |
| toddler | 6, 1, 7, 2, 8 |
| preschool | 2, 8, 3, 4, 9 |
| pre-K | 3, 4, 5, 9, 10, 11, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Grow and color the pet's fluffy fur |
| 2 | Free play with every tool: grow, snip, comb, curl, color |
| 3 | One request at a time: "make it long", "make it pink" |
| 4 | Two-part requests checked in the mirror: "short and blue" |
| 5 | Copy a pictured style: length, curls and color |
| 6 | Pat the fluff: no buttons, any touch grows the fur |
| 7 | Snip snip: grow the fur, then snip it |
| 8 | Pink, please: the five bottles and one color at a time |
| 9 | Two customers: match each visible two-part request, in either order |
| 10 | Longer than Pip’s: grow or snip fur to compare two lengths |
| 11 | Two colors: put at least 35% of each requested color in the fur |
| 12 | Changed my mind: reverse a loved length or curl request on the same hair |

<!-- end generated -->

**Starts as:** pat the fluff to grow it, then grow and color fur, then freely snip and curl; a seeded friend in the chair at levels 3–5

**Grows into:** pat anywhere, grow or snip with two buttons, five color bottles ("Pink, please"), every tool (grow, snip, comb, curl, color), then requests like "short and blue", copy a pictured style, serve two visible customers in either order, style fur longer or shorter than Pip’s, paint two requested colors together, then reverse a loved length or curl request

## Design notes

*After Toca Hair Salon.* The pet sits in the chair with fluffy fur to grow, snip, comb, curl and color. Free play first (lap play includes the all-tools free mode), then one request at a time, two-part requests checked in the mirror ("short and blue"), then copying a pictured style. Requests never start already done, and the hint points to the tool for what to fix next. Free play (levels 1–2) has no misses: a touch that misses the fur makes the pet giggle, and when the mirror appears the pet asks her to look in it, which ends the round. Level 3 has no mirror and no misses; each request finishes by itself, and a tool glows (one hint) after 15 seconds without progress with the tool that helps. At levels 4–5 the mirror checks: looking too early is a miss, and when the colour is mostly there the pet says "a little more" and the strands still in the old colour glow. Levels 3–5 seat her pet (about half the rounds) or a seeded friend (cat, bunny, bear, dog or pig) in the chair, named in the request, the mirror check and the pet's lines; with a friend in the chair the corner guide stays. Each round has a seeded room (wall gradient, cape stripe that is never the customer's colour, floor check), and free play at levels 1–2 starts from one of five seeded looks (fuzz, mop, sleek, two-tone, mohawk). Level 8, *Pink, please*, shows only the five bottles (no mirror) and asks for one colour at a time, twice, never starting in the asked colour; a request finishes by itself when the colour covers about 80 % of the fur. Any bottle paints; a wrong bottle is named once ("That's blue! I want pink.") and is no miss; after two different wrong bottles the asked bottle glows (one hint), and the 15-second quiet-time glow applies as at level 3. The bottle matching the fur's own colour starts selected, and a stroke with it is named but not counted. Levels 6–8 are not changed by customers.

**Levels 6–7 (lap and toddler entries; both bands `order [6, 1, 7, 2]`, range 1–7, `entryLevels [6, 7]`).** Level 6, *Pat the fluff*: no buttons; any touch grows fur from short fuzz, and when the average length reaches 120 the pet does the floof shake and a big mirror (radius 70, top middle) appears; a tap on it finishes, or after 20 quiet seconds the pet looks by itself. Level 7, *Snip snip*: two big buttons, grow and snip (radius 54); the fur starts long and curly; the mirror is free play. Neither level has a miss or a hint.

**Levels 9–10.** Level 9, *Two customers* (preschool and pre-K): her pet and a seeded friend keep two distinct pictured two-part requests visible. Tap either head or card to select it (the selected card has a purple frame and pointer); a card repeats that customer’s request. Tools only change the selected head. A successful mirror check marks that customer done and preserves its style while the other is served; either order completes the round. Each customer owns its own miss/hint state. Level 10, *Longer than Pip’s* (pre-K): Pip has a fixed seeded length of 60–150, and her pet starts at the same average length. Grow or snip until the pet’s fur is at least 25 longer or shorter, as asked. Each mirror look draws two straight sample locks with aligned tops and lines across their actual tips. Only an unfinished mirror check is a miss; two for a customer light the tool for its current unmet attribute (one hint), and old-color strands glow when color is still missing. There is no idle hint. Each complete round awards one sticker through the shell; neither style is saved. Preschool `order [2, 8, 3, 4, 9]`; pre-K continues through 11–12 below.

**Levels 11–12 (pre-K).** Level 11, *Two colors*: one request names two distinct seeded colors, pictured as alternating strands. Any arrangement with at least 35% of the strands in each is accepted (10 of 26 each); a third color may remain. An unfinished mirror check names the missing color and glows strands that can take it while reserving enough of the other requested color; after two misses, the bottle glows (one hint). The glow follows the current missing color as she paints. Level 12, *Changed my mind*: make one length or curl request and check it in the mirror; the pet loves it, then asks for the opposite on that same attribute. The exact styled hair stays in the chair: snip reverses grow, comb reverses curl, and either direction can be asked. The card and replayable spoken instruction change with the request. Each request has its own two-miss glow; styling itself is unscored, and the round gives one sticker after the second successful check. Pre-K `order [3, 4, 5, 9, 10, 11, 12]`; no school window or saved style.

**A met request never holds the next one (U7 fix batch 6, 2026-11-12).** At the single-customer levels with several requests (3, 4, 5, 8 and 12) the love line starts, the 0.6 s look follows and the next request's card opens at once with input open. Its spoken ask waits for the love line, or is said at her first touch on the fur, a tool, the mirror or a card. The mirror's check line is cut by the verdict, which is judged at once. At level 9 the second customer is selected and open as the first one's line starts; tapping the finished customer does not drop the pending ask. The last request's line is heard out before the closing line.
