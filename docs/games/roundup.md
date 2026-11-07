# Roundup

<!-- generated: from src/games/roundup; edit the text below the end mark (npm run game-docs) -->

**ID:** `roundup` · **Land:** Barnyard · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** motor-planning, sorting, counting

| Band | Levels, easiest first |
| --- | --- |
| lap | 1, 11 |
| toddler | 1, 11, 10, 2, 3 |
| preschool | 2–5 |
| pre-K | 3, 4, 5, 6, 7, 8, 9, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Tap an animal and it hops into its pen |
| 2 | Shoo three animals into the pen with a finger |
| 3 | Shoo five animals into the pen |
| 4 | Sort four or five animals of two kinds into their own pens |
| 5 | Put an exact number in the pen (2 to 4) |
| 6 | Sort two kinds and put the requested number in each pen |
| 7 | Sort pigs and bunnies into their pens; leave the cows on the grass |
| 8 | Put the same number of one kind in each of two pens, then ring the bell |
| 9 | Fill a pen asking 4 or 5, starting with 1 to 3 already inside |
| 10 | Shoo one animal at a time into a wide gate, twice |
| 11 | Lead three animals that follow your finger into a wide pen |
| 12 | Sort big and little pigs into pens with matching-sized pictures |

<!-- end generated -->

**Starts as:** tap an animal and it hops into its pen

**Grows into:** lead a herd that follows a finger into the pen, shoo one animal at a time twice through a wide gate, shoo animals through the gate with a finger, sort two kinds from five farm animals, put exactly N in and ring the bell, leave cows outside the pigs’ and bunnies’ pens, put the same number in each of two pens and ring the bell, fill a pen from its starting count to 4 or 5, sort big and little pigs by size

## Design notes

*After Extreme Herder (Neopets), Puffle Roundup (Club Penguin) and Stampede (Atari 2600).* Tap an animal and it hops into its pen; later, shoo animals through the gate with a finger (guide a crowd), sort two kinds drawn from pigs, bunnies, cows, ducks and dogs, and put exactly N in and ring the bell. Each kind has its own floor (mud, carrots, hay, pond or kennel) and synthesized voice. Level 4 varies between four and five animals with at least one of each kind; level 6 supplies exactly one spare per pen beyond its target. Instructions and wrong-pen feedback name the kinds in play. At level 1 a tap on the grass or a pen makes the nearest loose animal cheer and speak, and a tap on a pen's sign says who lives there; neither is a miss or a hint. At level 11 (*Come along*) the herd keeps walking to where the finger last was for three seconds after it lifts, so tapping a little ahead of them leads them as well as a drag does (2026-10-24, [PR #942](https://github.com/rjdunlap/neo/pull/942)). Counting pens (levels 5–6 and 9) show the numeral and that many dots, and a right bell has the pet say each pen's total ("3 pigs in the mud!") before "Everyone is home". Each round's starting layout comes from the round's rng, so replay starts somewhere new. A wrong pen or a wrong bell counts a miss; the thirty-second trot-home finishes the round for her and counts one hint. Level 10 (toddler order [1, 11, 10, 2, 3]): *Shoo one* puts one animal near an 80%-open gate, then reveals a second after the first gets home; both successes finish one round and award one sticker. It keeps the ordinary 190-unit flee radius. Nothing at 10 is a miss; ten idle seconds light the animal and gate (one hint), twenty trot it home (another hint), with fresh support for the second animal. Level 11 *Come along* (lap and toddler, lap order [1, 11]): three animals of one kind gather to a finger and follow it (no flight; they hold still inside an 85-unit ring and walk at most 190 units a second, slower than the 330 flee speed, spaced 70 apart) and are led through a wide (80%) gate into one pen, in any order; no misses. "The {animals} want to follow you! Lead them to the pen." Fifteen seconds without an animal getting home make the herd glow and drift toward the gate by itself for the rest of the round (one hint, counted once); the thirty-second trot-home stays as a safety (another hint). Level 7 *Leave the cows* (pre-K 3–7) gives two pigs, two bunnies and two cows: pigs go in mud, bunnies in carrots, cows stay on the grass. A cow through either gate hops out with a miss and cow-specific speech; after two misses only needed pigs/bunnies and their gates glow. Completion requires both pigs and both bunnies in their pens, ignores the cows outside, and says the cows are happy on the grass. No bell. The ordinary thirty-second trot-home still counts a hint and never selects a cow. Level 8 *Make it fair* (pre-K 3–8): one kind, an even herd of 6 or 8 and two pens of that kind, with a board above the pens showing the animal and no number. "Put the same number of {animals} in each pen, then ring the bell!" The bell accepts any equal non-zero split (3 and 3, or 2 and 2 with two loose); both pens empty is not fair. A wrong bell is one miss: both empty says the pens are empty; one empty says that pen is empty and nobody hops out; otherwise the pet says which pen has more and the extras hop out of the fuller pen until they match. Two wrong bells give one hint, a glow on the emptier pen's gate and the loose animals. Each pen counts aloud as animals enter, and every bell plays a seesaw (settling on one note when fair, tipping down when not). The finish says "{n} {animals} in each pen. That is fair!" and, if any are loose, that the rest on the grass is fine. The thirty-second trot-home goes into the emptier pen only while the pens are uneven; once they are level, idle help only wiggles the bell. Level 9 *Fill it up* (pre-K now 3–9) starts with 1–3 animals already inside a pen asking 4 or 5 (numeral and dots), plus six loose of the same kind. Shoo in the missing part and ring the bell at the exact total. A short or extra bell is one miss: the pet counts the visible pen from one, names how many more are needed when short, or sends extras back out. Two wrong bells or fifteen idle seconds count one hint, glowing needed animals/gate and recounting the current pen; the loose herd holds still during recounts so the remainder stays true. The ordinary thirty-second trot-home counts another hint. Level 12 *Big and little*: three big and three little pigs at 0.32/0.22 scale go into pens with matching-sized pig pictures. Kind stays constant; gates, automatic help and the demo choose by size. A wrong gate hops the pig out, counts a miss and names that pen’s size. Two misses or fifteen idle seconds give one glow hint and a spoken size reminder; the thirty-second trot-home adds another hint. All six sorted pigs finish without a bell. Both sizes retain body-centred 170-unit hit diameters; pre-K order is [3, 4, 5, 6, 7, 8, 9, 12]. Entry levels 10 and 11 land at the easiest level when moving into a band without them. From level 2 up every finger on the grass shoos, each with its own ring (at most three at once; a fourth is treated as a palm, a cancelled touch is dropped): pushes from several fingers add but are capped at one finger's top speed, and in *Come along* each animal follows its nearest finger. So a grown-up can be a second shepherd, standing on the far side to turn runaways back to the gate or leading part of the herd. Pauses (bell, recount, next animal, finale) still every finger until it moves again; misses and hints are unchanged.
