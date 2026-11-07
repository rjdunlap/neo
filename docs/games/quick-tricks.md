# Quick Tricks

<!-- generated: from src/games/quick-tricks; edit the text below the end mark (npm run game-docs) -->

**ID:** `quick-tricks` · **Land:** Puzzle Peaks · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spatial-words, matching, length, problem-solving

| Band | Levels, easiest first |
| --- | --- |
| toddler | 8, 1, 9 |
| preschool | 8, 1, 2, 3, 4, 9 |
| pre-K | 2, 3, 4, 5, 6, 7, 9 |
| school | 5, 6, 7, 9 |

| Level | Plays like |
| --- | --- |
| 1 | A little show: keep Bunny dry, find a sock partner, stretch a bridge |
| 2 | Leaf up high, three socks to choose from, stretch all the way across |
| 3 | Which leaf covers two, socks with the same color and pattern, a plank long enough |
| 4 | A second show: turn a parcel, set three picnic places, make four berries |
| 5 | Turn a triangular parcel, set four places, make five berries |
| 6 | Turn a corner parcel, finish a partly set picnic, make six berries |
| 7 | Two at once: two leaves for three friends, two lost socks, two gaps to bridge |
| 8 | A tiny show: a leaf over a friend, a bridge stretched past halfway |
| 9 | A third show: wind a music box, fill three cups to the line, loop the fireflies asked for |

<!-- end generated -->

**Starts as:** a little show: hold a leaf over a bunny in the rain, find a sock's partner, stretch a bridge for a beetle

**Grows into:** which leaf covers two friends, matching socks and bridge lengths; level 7 doubles show one (two leaves for three friends, two socks, two gaps); level 8 is a two-trick toddler entry (leaf, stretch) where nothing counts; level 9, the third show, winds a music box crank, fills three cups and loops the fireflies; a second show turns parcels, sets picnic places and completes berry totals

## Design notes

*After WarioWare: Touched!.* One show of three tricks, one sticker. Levels 1–3: Umbrella Up (hold a leaf above a bunny in the rain; at pre-K, choose the leaf big enough for two friends), Sock Gobbler (give the monster the partner sock, by color, then by color and pattern), and Bridge Stretch (stretch a springy plank to the far bank; at pre-K, choose the one plank long enough). Levels 4–6, a second show: Parcel Turn (rotate and fit parcels), Picnic Places (give each friend a bowl; the top level begins partly set) and Last Berry (add to a visible starting quantity and undo extras to make four, five or six berries). Level 7, *Two at once* (pre-K and school), doubles show one: three rain friends and two leaves (200 and 300 wide). A leaf over only some friends stays up with no miss and the pet names who is still wet (`tricks.wet-<friend>`); a leaf that adds nothing floats home, so it never hides under the wide leaf; with both leaves up and someone still wet, the pet says `tricks.leaf-move` and the glow lights the next leaf and its spot (that is the trick's one hint); a leaf held too low is a miss. The monster holds two different socks and five are offered in a 3-over-2 grid with exactly one partner each; a wrong sock is a miss and `tricks.one-pair` plays after the first pair. One river has a narrow gap (160) and a wide gap (260) either side of an island, with planks of 130, 220 and 330: only the middle plank on the narrow gap and the long one on the wide gap works; a too-short plank is a miss, and if the long plank lies on the narrow gap the pet says `tricks.plank-move`. Placed leaves and planks lift off freely, and the glow after two misses lights the next unfinished target and its piece. Level 8, *A tiny show* (the toddler and preschool entry), is two tricks only, the umbrella leaf and the bridge stretch: a leaf anywhere over the friend's column, above or in front, floats up over them and keeps them dry, and a stretch let go past halfway snaps across while a shorter one springs back free; nothing counts (no misses, no hints). The pet opens with `tricks.start-two` ("Two quick tricks") and re-says the trick's instruction after ten quiet seconds; the bow omits the sock monster. Ranges: toddler order 8, 1; preschool order 8, 1, 2, 3, 4 (`entryLevels: [8]`); pre-K 2–7 and school 5–7 unchanged. Rain is unchanged below level 7. Level 9, *The third show*, is last at every band (toddler order 8, 1, 9; preschool 8, 1, 2, 3, 4, 9; pre-K 2–7, 9; school 5–7, 9), three new gestures (`third-show.ts`, rules in `third-logic.ts`, amounts by band): **Wind the Music Box** turns a crank by dragging round its axle (ring 40–230 units out, direction set by the first 30 degrees, a release keeps the progress, a ghost arrow after ten quiet seconds) until the box pops; **Fill the Cups** reuses Fill & Dump's pour, judged on release, where overfilling is never a miss, a tap on a cup tips it out and a tap on the tray recovers the water, and after two overfills on one cup the line glows and the pour halves (that is the trick's one hint, at most once); **Loop the Fireflies** reuses Lasso Loops' loop: an empty loop is free and repeats the instruction, a short trail is free ("a bigger loop"), a wrong count is a miss from preschool, and the glow on the nearest group comes after the second miss. Toddler counts nothing. A finale bow and tune close the show; 24 voice lines (`tricks.third-start` to `tricks.loop-yes`, plus `tricks.pop-half`). Not built: the waiting cups are not drawn on a shelf (a served friend gets a mug beside them), and the finale does not re-lay out on rotation. An arrow appears after each trick's payoff and the child moves on when ready; misses are summed across the show, with at most one hint per trick. **Free and seeded:** at level 1 a leaf dropped below Bunny is a free try (a boing and a spoken line, no miss; plan field `countBelow`, `leafMiss`). Show one's cast is seeded (`castFor`): the friend under the leaf from bunny, duck, cat and pig (two distinct at level 3, with friend-free `tricks.umbrella-two`/`tricks.above-two`), the bridge crosser from beetle, snail and ladybug (the snail and ladybug are new code-drawn art), and the sock monster pink, teal or brown (never a sock colour), each with its own spoken lines (`tricks.umbrella-*`, `above-*`, `bridge-*`, `bridge-choose-*`); the finale bows the seeded cast. **Show two:** the picnic friends are seeded distinct island `Critter`s (never Pip); the parcel lands at a mailbox whose flag pops up with a bell; each bowl makes its friend cheer; exactly-right berries are gulped while the friends cheer. The yellow check arrow is hidden (and ignored) during Picnic Places, so no submit miss is possible there (`tricks.places-hint` is gone), and a bowl dropped near a place goes to the nearest one. A waiting green arrow repeats `tricks.next` after ten quiet seconds, and the show ends with the cast's bow and `tricks.done`. Not checked with a child: whether the free low leaf is understood, whether the hidden yellow arrow is noticed, and whether show two's critters read at picnic size. The microgame thinking behind it is in [IDEAS.md](../IDEAS.md#quick-tricks-and-microgames).
