# Egg Catch

<!-- generated: from src/games/egg-catch; edit the text below the end mark (npm run game-docs) -->

**ID:** `egg-catch` · **Land:** Barnyard · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** tracking, hand-eye, colors, prediction

| Band | Levels, easiest first |
| --- | --- |
| lap | 12, 1 |
| toddler | 1, 8, 2 |
| preschool | 2, 3, 9, 4 |
| pre-K | 3, 9, 4, 5 |
| school | 4, 5, 6, 7, 10, 11 |

| Level | Plays like |
| --- | --- |
| 1 | Tap a hen; her egg rolls into the basket |
| 2 | Slide the basket under falling eggs |
| 3 | Catch only the brown eggs; white ones hatch in the hay |
| 4 | Flip the gates so the egg rolls into the basket |
| 5 | Route brown eggs to the basket and white eggs to the nest |
| 6 | The gates are set: tap where the egg will land, then watch it roll |
| 7 | Set the gates once for two eggs: brown to the basket, white to the nest |
| 8 | Under the hen: tap a lane to hop under the clucking hen |
| 9 | One gate: point it toward the basket, then tap the green arrow |
| 10 | Fix the run: follow the dotted trace, repair one gate and roll again |
| 11 | Flip-flop gate: set a spring gate for brown then white with one arrangement |
| 12 | One big hen: a touch anywhere and she lays an egg into the basket |

<!-- end generated -->

**Starts as:** tap a hen for her own note and brown, speckled or blue-green egg; gathered eggs hatch at the finish

**Grows into:** tap a wide lane to hop under the clucking hen (toddler level 8, between 1 and 2), slide the basket to catch, catch only brown eggs, point one gate at the basket (level 9, before 4 in preschool/pre-K), flip gates to route eggs, predicting where an egg will land from gates already set, then setting one arrangement for a brown-and-white pair, repair a gate from a dotted failed trace (10), plan two top-entry eggs with a spring gate that flips itself (11); a far barn stands on the horizon

## Design notes

*After Big Bird's Egg Catch (Atari 2600), Kaboom! and Game & Watch "Fire".* At levels 1–3 and 8 each hen lays with her own pentatonic note. Levels 1–2 have brown, speckled brown and blue-green shells, all catchable; rule levels keep brown and white. Successfully gathered or sorted eggs hatch from a basket into a line of peeping chicks before the celebration (three completed pairs show six chicks). Missed eggs never join that ending. Hens lay eggs that roll gently into a basket. Then the child slides the basket under slow falls, catches only brown eggs, and flips gates to route eggs down chutes. Missed eggs land in soft hay and hatch, so nothing breaks. At levels 2–3 a missed brown egg gets a soft boing and "Peep! Slide under the next one." (a white egg caught in the basket boings too); after two misses the hay under the next catchable egg's lane glows while the fall slows. The hens lay only while someone plays: an egg that lands with nobody playing since it was laid settles the hens (they look sleepy), is not a miss and gets no line, and the next touch wakes them (a round left alone lays one egg and stops; a couch stick or button counts as play). The ghost finger touches once per new egg. At the route and sort levels (4–5) each egg waits at the top until the child taps the green arrow, so no clock decides; gates can still be flipped while it rolls, a wrong-way egg is a miss, and after two misses the needed gates glow and the arrow pulses once they are set. The ghost finger flips the needed gates, then taps the arrow. Level 6 (predict): the gates are set and locked; the egg waits at the top until the child taps the bin where it will land; a basket appears there and the egg rolls to show where it really goes. A wrong prediction is a miss ("follow the gates"); two light the egg's whole path. The glow is non-interactive so the lit bin still accepts the next prediction. Level 7 (set it once, school): a brown egg waits above the shared fork and a white egg waits at a second hen's feeder into the other branch. Set all three gates, then tap the green arrow. The gates lock while the two eggs roll one at a time, so one arrangement must send brown to the basket and white to the nest. Three correctly routed pairs finish. A missed pair counts one miss, keeps its targets and gate arrangement for revision, and gives spoken guidance; after two misses the needed directions glow (one hint). Seeded boards start unsolved and have exactly one solution. The ghost finger follows the same gate taps and arrow. A play-through found the catch levels' full-screen steering layer still on top of the bins when routing, swallowing taps; it is now off when routing.

Level 8, **Under the hen**, is the toddler bridge, ordered `[1, 8, 2]`: one of four hens fluffs up and clucks; a tap anywhere in a wide lane hops the basket there. Only a basket under that hen releases an egg, so there is no timed catch to chase. Wrong lanes count one miss with a gentle boing and “Here, under me!”; two consecutive wrong taps light the waiting hen’s hay lane (one hint). The cue changes after every catch. Five caught eggs finish and hatch; the ghost finger uses the same lane taps. Stable ID 8 is an entry level, so carrying it to another band starts at that band’s easiest level. Lap and couch mappings are unchanged.

Level 9, **One gate**, is the preschool/pre-K bridge before the full tree: orders `[2, 3, 9, 4]` and `[3, 9, 4, 5]`. One gate splits into two exits, basket and soft hay. The egg waits for the green arrow; the gate can still be flipped before the egg reaches it. Four successful routes finish. A wrong route boings, says `egg.wrongway` and hatches safely in the hay; two consecutive misses glow the needed direction (one hint). Seeded basket sides never repeat three times running; at most one flip solves any egg. The ghost finger uses that same gate and arrow. Stable ID 9 is an entry level; lap, toddler and couch mappings retain their existing steps.

Level 10, **Fix the run**, adds debugging at school: four seeded boards, brown to the basket on the first two and white to the nest on the next two. The pet rolls a failed example for free and leaves a dotted trace into hay. Exactly one gate on that trace can fix the run. The child changes a gate and taps the arrow; gates wait during the run. A failed rerun counts once, keeps its board and draws its new trace. After two misses the first divergence from the needed path glows. The ghost finger uses the same gate taps and arrow.

Level 11, **Flip-flop gate**, sends brown then white through the same top entry with one starting arrangement. The spring on the top gate flips its direction immediately after each egg passes; the lower gates stay set. A curved arrow and spoken support explain the flip after two misses. Three correct pairs finish; each failed pair counts once and keeps its board and restored starting state for revision. All boards start unsolved, have destinations on opposite branches and exactly one working start. School order is `[4, 5, 6, 7, 10, 11]`; stable younger entry IDs 8–9 stay out of it. All six successful eggs hatch at the ending. A small far barn stands on the horizon at the left, clear of every lane, hay pile, tap column, chute and bin at all levels and views.
