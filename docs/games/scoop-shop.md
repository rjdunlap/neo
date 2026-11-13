# Scoop Shop

<!-- generated: from src/games/scoop-shop; edit the text below the end mark (npm run game-docs) -->

**ID:** `scoop-shop` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** colors, counting, sequencing, memory

| Band | Levels, easiest first |
| --- | --- |
| lap | 10, 1 |
| toddler | 1, 2, 11, 3 |
| preschool | 2, 11, 3, 4, 5 |
| pre-K | 3, 4, 12, 13, 5, 6 |
| school | 5, 12, 13, 6, 7, 8, 9 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the tubs to pile scoops on a cone; any flavors |
| 2 | One scoop in the color the customer asks for |
| 3 | Two scoops matching the picture, in any order |
| 4 | Count the scoops: "three green scoops, please" |
| 5 | Three flavors stacked bottom to top, like the picture |
| 6 | Remember the order after the picture hides |
| 7 | Two cones: remember two friends' orders (three scoops altogether); tap a cone to choose it, tap a friend to peek |
| 8 | Remember three scoops, change one named position, then build the new order |
| 9 | Hear three distinct scoops top first, then build bottom first; tap the friend for an upright peek |
| 10 | Any scoop: one tap, one scoop, one munch |
| 11 | Who wanted pink? Match the prepared scoop to one of two customer pictures |
| 12 | Fill it up: count on from the scoops already there to make three to five |
| 13 | Three pink and two blue: match two color counts, in any order |

<!-- end generated -->

**Starts as:** one tap serves one scoop at lap entry 10, then pile scoops for a customer

**Grows into:** toddler/preschool 11 matches a prepared scoop to one of two customer pictures; one color, two scoops, "four blue scoops", three flavors stacked in order, then from memory; pre-K/school 12 counts on from prefilled scoops and 13 combines two color counts; school 8 changes one remembered scoop, 9 builds a spoken top-first order bottom up, and 7 serves two friends at once, each with a hidden picture order, from two cones

## Design notes

*After Papa's Freezeria and Neopets' Ice Cream Machine.* Tap tubs to pile scoops on a cone for a customer (build an order); then one color, two scoops, "four blue scoops", three flavors stacked in order, then from memory. Level 2 asks for one scoop of a colour the counter has, never the tub at the customer's own place along the counter and never the previous customer's colour, so the colour word does the work. Every touch answers: a tub squashes on touch-down, and a tap while a scoop is in flight or a customer is walking in or being served wobbles the tub and pops, with no second scoop and no queue. Tapping the customer at levels 1–5 pokes them; they giggle and say the order again (free, never a miss or hint); at level 6 that tap is still the peek hint, and a tap while the picture shows just giggles. Tapping the cone wobbles it; once served it takes no touches. At levels 1 (free) and 4 (count) each landing scoop is counted aloud ("1!", "2!"). The level-4 count card shows the numeral and, under it, a row of that many scoops in the order's colour. Eight customers (cat, dog, bear, bunny, pig, cow, pip, duck) come three to a round, shuffled. Each customer is served in a cone, a paper cup or a waffle bowl (the order bubble's mini shows which), dealt so no two customers in a row share a kind, and the window behind the counter is one of three scenes per round (beach, village street, evening lanterns); neither changes an order. The thank-you names the flavour on top ("Yum, strawberry!", with lemon, mint, blueberry, chocolate and grape), and as the cone slides to the customer each scoop bobs and plays its tub's note, bottom to top.

Lap starts with level 10, *Any scoop*: three customers, one scoop each, no misses. It opens on one big tub (1.6 times size, centred) and a touch anywhere in the shop, or on the cone, scoops from the nearest shown tub; one more flavor tub pops in with each customer (three flavors in all) and the big tub settles beside it, and the order bubble shows the newest flavor; lap order `[10, 1]`, `entryLevels: [10]` lands a birthday or entry pin at the next band's easiest level. Toddler/preschool level 11, *Who wanted pink?*, shows two customers with different scoop pictures and a prepared one-scoop cone, with tubs hidden. Tap the matching customer or their picture to serve it; the waiting customer stays and a new one joins. Matching sides alternate across three cones. A wrong customer shakes, boings and names their own colour (one miss); after two misses on a cone the matching picture glows (one hint). Cone exploration is free. Toddler order `[1, 2, 11, 3]`; preschool `[2, 11, 3, 4, 5]`. Both levels have spoken instructions, level-specific how-tos, a ghost-finger bot and one sticker per complete round.

Pre-K/school level 12, *Fill it up*, starts each cone with 1–3 scoops of one colour and asks for 3–5 in all. The numeral and row show the total; existing scoops are filled and the missing slots outlined, filling as scoops land. The needed amount changes between customers. Each landing scoop is counted aloud from the existing count; two misses glow the needed tub and count aloud from the current cone to the target. Level 13, *Three pink and two blue*, asks for two colour counts totaling 4 or 5 (counts 1–4); the two card rows show a numeral and scoops for each colour. Either colour can go first; an extra scoop of a saturated colour bounces back even while the other colour is incomplete. Wrong colours and extras count a miss; two misses give one glow hint per customer. Customer taps repeat the order free. Pre-K order `[3, 4, 12, 13, 5, 6]`; school `[5, 12, 13, 6, 8, 9]`, preserving saved IDs and pins. Three served cones earn one sticker, including with support.

School levels 8 and 9 build on level 6's remembered order (three distinct scoops, no picture while she builds). **Level 8, *Change of mind***: the order is shown and spoken, the picture hides after 1.2 s, then the friend announces one changed position (bottom, middle or top) and its new colour (`scoop.change-rule`, `scoop.change-bottom|middle|top`); she builds the new order. **Level 9, *Top first***: the friend says the order top first with no picture (`scoop.top-first-rule`, `scoop.top-first`); she builds it bottom first. Input stays locked while the setup speech plays. Tapping the friend peeks the final upright cone: the first peek per order is one hint, repeats are free. A wrong scoop bounces back (one miss); the second miss glows the next tub (one hint, once per order). Voice uses device speech, no clips yet. **Level 7, *Two cones***: two friends arrive together, each with a picture card (one a single scoop, the other an ordered two-scoop cone, either side; three scoops in all), then both pictures hide 1.2 s after the second request is spoken (`scoop.two-cones` rule, `scoop.order-single`, `scoop.order-pair`). Coloured mats tie each friend to a cone. The left cone starts chosen (blue outline); tapping a cone chooses it (free, silent, keeps both stacks and any help); tapping a friend peeks only that friend's order without changing the choice (first peek per order one hint, repeats free; input locked during the reveal). Each cone keeps its own misses, glow and peek: a wrong scoop bounces (one miss), the second miss on a cone glows its next tub (one hint, once per order), at most four hints a round. She may serve either friend first; after one is served the other cone is chosen automatically, and both fed finishes with one sticker. School only, order `[5, 12, 13, 6, 7, 8, 9]`.

**A met order's line never holds the next customer (U7 fix batch 11, 2026-11-12).** `scoop.yum*` starts after the munch; the walk-off and the next arrival follow in sequence (the next order about 1.6 s into the line) and the next order cuts the thanks. Level 7's other cone opens as the line starts. The memory levels (6, 8, 9) and the last customer's line are still heard out.
