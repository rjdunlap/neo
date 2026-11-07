# Mail Carrier

<!-- generated: from src/games/mail-carrier; edit the text below the end mark (npm run game-docs) -->

**ID:** `mail-carrier` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** numerals, counting, colors, community, map reading, planning

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1, 2, 10 |
| preschool | 2, 10, 3, 4 |
| pre-K | 3, 4, 5, 9, 12, 6 |
| school | 4, 5, 9, 12, 6, 13, 7, 8, 11, 14, 15 |

| Level | Plays like |
| --- | --- |
| 1 | Tap any mailbox to post a letter |
| 2 | Match the letter's color to the door |
| 3 | Match dots on the letter to dots and numbers on the mailboxes |
| 4 | Deliver to the house number on the letter (1 to 9) |
| 5 | Count the dots on the letter, then find that house number |
| 6 | Picture map of Wonder Woods: find who the letter is for in the key, then the house with their sign |
| 7 | Plan two deliveries on the map in order (letter 1, then 2), then walk the route |
| 8 | Find the house, then choose the shorter of two paths marked with stepping stones |
| 9 | A problem on the letter: tap the helper whose tool fixes it |
| 10 | Match the picture on the letter to the tool on the sign |
| 11 | Both sides of the street: odd numbers on one side, even on the other, rising left to right |
| 12 | Deliver to the house number on the letter (10 to 20) |
| 13 | Hazel’s spoken clue: between, next on the left, nearest and farthest on the picture map |
| 14 | Plan three deliveries in any order; optionally walk a second order and compare stone counts (two bags) |
| 15 | Make the picture key: match five signs to their neighbours, then deliver two letters |

<!-- end generated -->

**Starts as:** tap any mailbox to post a letter

**Grows into:** match colors, then dots, then house numbers 1 to 9, tool signs and helpers with problem pictures, then numbers 10 to 20; in Wonder Woods, read a picture map's key, plan two deliveries in order, then choose the shorter of two stepping-stone paths; spoken map clues and odd/even street sides; three deliveries in any order with a free second walk to compare stone counts; make a five-row sign key, then deliver two letters

## Design notes

*After Paperboy.* The pet delivers letters along a street. A letter shows a door color, a number of dots, or a numeral (1 to 9), and the child taps the matching mailbox; a wrong mailbox politely hands it back. At level 1 a touch anywhere off a house wiggles the envelope and waves the nearest mailbox's flag (never a miss or hint), and six seconds without a touch while a letter waits repeats the instruction with a flag wave. Every street house presses to 1.04 on touch-down. After a delivery at the dots and count levels (3 and 5) the pet counts aloud ("One, two, three, four. Number 4!"); level 4 names the numeral only. Thanks has four variants. Levels 6–7 (pre-K–school): Hazel the squirrel postkeeper's picture map of the woods, with paths from her hollow-tree post office to five houses marked only by a sign (acorn, mushroom, leaf, flower, star). A picture key beside the map says which neighbor lives behind each sign, and tapping a row says it. Level 6 brings one letter at a time with a neighbor's picture: find them in the key, then tap their house, and the pet walks the paths there. Level 7 brings two numbered letters: tap the house for letter 1, then letter 2 (a dotted purple route and numbered flags show the plan, and tapping a planned house takes it and later stops out), then the green arrow walks it. Level 8 (school): find the neighbor's house, then compare two paths around a loop using their stepping stones; the pet walks the shorter route. Each destination has two simple routes separated by at least two stones. A wrong house or route is a gentle miss; after two route misses the shorter choice glows. The map and weighted paths are in `logic.ts` and rule-tested. The brown dog is left out of the woods, since at key size it looks like the bear. The street varies by seed: peaked or round roofs, an optional chimney and window box per house, and one mailbox colour per round chosen away from the doors (and from near neighbours such as teal and blue) instead of always blue; the duck joins the street's seven neighbours. The pet rides a small cart on the road: a posted letter drops into the cart, which rolls to the mailbox, and a wrong mailbox hands it back to the cart. Each woods round (levels 6-8) draws its map mirrored left to right half the time, with the same paths and stone counts. Street levels added 2026-10-22: level 10 (*Which door?*, toddler order 1, 2, 10; preschool 2, 10, 3, 4) shows two or three houses with a tool sign each (wrench, bandage roll, watering can, stamp, ring buoy, whisk) and a letter with one tool; tap the door with that tool. Level 9 (*Who can help?*, pre-K and school) shows five helpers with tool signs and a letter with a problem picture; the right helper pops up holding the tool and a journal entry is filed for each helper whose letter landed. A wrong house is a gentle miss naming its own tool, glowing after two. Level 12 (*Numbers past ten*) shows houses numbered 10 to 20 and a two-digit numeral letter; delivery names the number and its ten-and-ones ("Thirteen! Ten and three.").

School additions **13, Hazel’s clue**, and **11, Both sides of the street** follow the school order `[4, 5, 9, 12, 6, 13, 7, 8, 11, 14, 15]`. Level 13 brings four question-mark letters, one each for between, next on the left (both across the top row), nearest and farthest from the post office in a straight line. The same graph uses a square map with clearer near/far distances; clues resolve from its actual mirrored geometry and sign names. Tap Hazel at the post office for a free replay. A wrong house names its sign and repeats the clue; two misses glow the answer. Level 11 has five numeral letters and eight houses at 0.8 scale, odd numbers above the road and even below, each side rising left to right. A seeded round chooses 1–8 or 9–16 (no persistent bag counter). Wrong-side feedback names the parity; a wrong house on the right side says which way to look. Two misses glow the target. Portrait retains four houses per side with separate 176-unit targets; the narrow-layout fallback uses three per side and 1–12. Both modes keep retries, assisted completion and one sticker.

Level **14, Three letters, your way**, carries two bags of three letters. Plan each bag in any order and use the green arrow to walk, with numbered flags and free undo as at 7. This map adds a loop with one visible stone per segment; the count includes the return to the post office. Every order delivers all three letters, and some orders take fewer stones. After the first walk, spoken support and picture arrows offer one optional second plan of the same stops or the next bag. The second walk compares shorter, longer or equal counts; its exploratory taps are unscored and it awards no extra sticker. On the first plan only, a house without a letter is a gentle miss; two misses glow an unplanned recipient and its key row. Any valid order and undo are free. Both bags finish one round and one sticker, including help.

Level **15, Make the key**, starts with five wet key rows showing signs and the neighbours visible at their own doors. Tap a blank row, then the house with its sign; the neighbour appears in the row. Houses tapped before choosing a row and repeated row taps are free. A mismatched house is a gentle miss naming both signs; two misses glow the matching house. After all five rows are filled, two picture letters arrive one at a time and use the completed key as at 6. The school ladder ends at 15; other bands keep their windows. Making the key and both deliveries finish one round and one sticker, including help.
