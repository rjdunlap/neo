# Teddy Doctor

<!-- generated: from src/games/teddy-doctor; edit the text below the end mark (npm run game-docs) -->

**ID:** `teddy-doctor` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** body-parts, empathy, listening, sequencing

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 1, 7, 2, 3 |
| preschool | 2–5 |
| pre-K | 3–6 |
| school | 5, 6, 8 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the boo-boos to put on bandages |
| 2 | Put a bandage where the patient says: "on my ear" |
| 3 | See what is wrong (a bump, sniffles, cold feet) and choose what helps |
| 4 | Listen to what hurts, then use the right thing in the right place |
| 5 | A check-up in the order shown on a picture card |
| 6 | A check-up in the order the patient says |
| 7 | Choose the friend with a boo-boo, then tap to bandage it |
| 8 | Choose a check-up order that keeps the patient’s before, first or last rules |

<!-- end generated -->

**Starts as:** touch the patient to put bandages on boo-boos

**Grows into:** bandage the part a patient names, choose what helps a bump or sniffles, then what helps from a spoken clue, check-ups (three of heart, temperature, ears, weigh, measure height) in order from a card or from what the patient says; choose the hurt friend (7, toddler), follow before/first/last check-up rules in any valid order (8, school)

## Design notes

*After Toca Doctor and Dr. Panda.* Soft-toy patients (bear, cat, dog, bunny, pig) visit a little clinic; tools are reusable and dragged onto the body. Levels: touch the patient anywhere and the nearest boo-boo gets a bandage while the patient says the part ("My ear! Thank you."), bandage the part the patient names (open to lap play as a naming game: "on my ear"; the bandage is dragged there or, since 2026-10-24 ([PR #942](https://github.com/rjdunlap/neo/pull/942)), the named place is tapped on the patient), choose what helps a symptom you can see (ice for a bump, a tissue for sniffles, a warm bottle for a tummy ache, socks for cold feet), then the same from a spoken clue alone, where the tool must also land on the right body part, and check-ups in the order on a picture card or in the order the patient says: each round is three of five steps (heart, temperature, ears, a scale on the feet that the patient hops onto, a height chart behind the patient with a star on the top of its head), never the same steps in the same order twice in a row, and measuring treats nothing. The tray holds only that check-up's three tools. Where a tool lands is judged by the nearest body part (the body is mirrored, so either foot or ear counts), and at level 1 a touch anywhere on the patient goes to the nearest remaining boo-boo (taps during the spoken instruction are still ignored). A boo-boo or bandage always sits mid-belly, on the head or an ear, or on a foot, never low in the gap between the feet (a rule test checks it).

Level **7, Who needs help?** (toddler order 1, 7, 2, 3) shows three pairs of different friends, exactly one hurt, alternating sides. Tap the friend with the boo-boo, then tap to bandage them. The smiling friend giggles and says they feel fine; choosing them counts as a miss, with the hurt friend glowing after two. Level **8, Before and after** (school order 5, 6, 8) shows three unordered check-up tools. The first patient gives one before/first/last rule; the second gives two compatible rules. Every legal order works, a broken rule counts as a miss and is restated, and after two misses all tools that can go next glow. Both modes finish with one sticker, including supported completion. Level 7 is an entry level so a birthday into a band that omits it starts at that band’s easiest level. Other band windows remain as before.

**A check-up step's line never holds the next tool (U7 fix batch 12, 2026-11-12).** At levels 5, 6 and 8 a step's show plays, then its result line (`doctor.heart`, `temp`, `ears`, `weigh`, `tall`) starts, the card ticks and the tools open at once; the shown tool, scale or chart comes off when the line ends or the next line cuts it. A patient's last step is still heard out before `doctor.better`.
