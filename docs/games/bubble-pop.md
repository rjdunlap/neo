# Bubble Pop

<!-- generated: from src/games/bubble-pop; edit the text below the end mark (npm run game-docs) -->

**ID:** `bubble-pop` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** cause-effect, tracking, colors, counting

| Band | Levels, easiest first |
| --- | --- |
| lap | 15, 1, 19, 2, 3 |
| toddler | 1, 2, 3, 16, 4, 5, 6 |
| preschool | 4, 5, 6, 17, 7, 18, 8, 9 |
| pre-K | 6–12 |
| school | 10–14 |

| Level | Plays like |
| --- | --- |
| 1 | Pop anything, 12 pops |
| 2 | Pop anything, 15 pops |
| 3 | Pop anything, 18 pops |
| 4 | Pop one color, 2 colors in play |
| 5 | Pop one color, 3 colors in play |
| 6 | Pop one color, 5 colors in play |
| 7 | Numbers in order, 1 to 5 |
| 8 | Numbers in order, 1 to 7 |
| 9 | Numbers in order, 1 to 10 |
| 10 | Pop two bubbles that make 5 together (4 pairs) |
| 11 | Pop two bubbles that make 10 together (5 pairs) |
| 12 | Start at a number between 2 and 7 and count up (6 bubbles) |
| 13 | Count back to 1 from a number between 5 and 10 |
| 14 | Count by tens or fives (10, 20, 30 … or 5, 10, 15 …) |
| 15 | Tap anywhere on the screen to pop the nearest bubble, 8 pops (lap's first level) |
| 16 | Pop one size, big or little, as asked (8 pops; toddler plays it between levels 3 and 4) |
| 17 | Pop the bubble with the number of dots asked for, 1 to 4, no numerals (6 asks; preschool plays it between levels 6 and 7) |
| 18 | Match dots to numerals, 1 to 4: tap one, then its partner (6 pairs; preschool plays it between levels 7 and 8) |
| 19 | Swipe a finger across the screen to blow bubbles, then pop them, 8 pops (lap plays it after level 1) |

<!-- end generated -->

**Starts as:** pop anything (or tap anywhere to pop the nearest)

**Grows into:** blowing the bubbles first (level 19), then pop one color, then numbers in order, then pairs of bubbles that make 5 and 10 (a sign at the top shows the number), then counting from a start number, back to 1, and by tens and fives, on the shore, in the bath, at night or under the sea; countable dots support levels 7, 8 and 10; toddlers also pop the big or the little bubbles (level 16), and preschoolers pop the bubble with the asked number of dots (level 17)

## Design notes

**One word in European Portuguese (WL2, 2026-11-22).** With the setting on, the pet adds the friend's word in the free modes and the colour's word after the first colour instruction (the pet's replay stays English); the other levels add none. The word table is `src/content/words/pt-PT.ts`; the setting is *A word in another language* on the grown-ups' page, per profile, off by default, and only a local pt-PT voice speaks it. See [the definition](../definitions/additional-languages.md#as-built-2026-11-22).

Its how-to intro names and pictures each level (a mode card, with a ladder of the band's levels easiest first on the intro). Tap bubbles as they float up; some hold a friend, who drops to the sand and makes its own animal sound, and the first of each friend in a round says its name ("A duck!"). Later, one color, numbers in order, then pairs, then counting sequences. Levels 7–8 and 10 show countable dots beneath the unchanged-size numeral (dice layouts through six, then five and some more); levels 9 and 11 fade that support. Every round floats in one of four places drawn at random: the shore (the sticker and map icon stay on it), a tiled bath with foam, a night sky with twinkling stars and a sleepy moon, or the sea with light rays, seaweed and three fish. Plain bubbles get a rim that shows in each; the scenery takes no touches. Count the dots together in co-play. A wrong bubble only wobbles and gets a spoken hint. Levels 10–11 (number bonds): every bubble has a partner that makes 5 (pre-K) or 10 (early school). Tap one to hold it still with a glow, then its partner: both pop with "3 and 2 make 5!" A wrong pair is a gentle miss that says both numbers and their total; two in a row glow a pair that works. Tapping the held bubble again lets it go. A sign at the top of the screen shows the total to make (two small bubbles, an equals bar and the numeral, with the dice dots on level 10), and takes no touches. Levels 12–14 are counting sequences, not sums, in the same drifting bubbles and with the same wobble, nag and glow after two misses: 12 starts at a number from 2 to 7 and counts up six (never past 12); 13 starts at a number from 5 to 10 and counts back to 1; 14 counts by tens (10 to 70) or fives (5 to 35) in two digits. Each shows its start, or its step with an arrow ("10s"), on the sign, and the spoken line names the start. Because drifting bubbles overlap, a touch goes to the bubble whose middle is nearest the finger (a play-through found taps landing on the wrong, overlapping bubble). **Level 15, pop anywhere** is lap's first level (her order is 15, 1, 2, 3, and a game she has never finished starts at the first): the same floating bubbles, but bigger, slower and fewer (four at a time, eight pops), and a touch anywhere on the screen pops the nearest bubble that is showing, however far, so a swat counts (a hand resting on the glass with more than three touches is still ignored); there is no wrong place and no miss, a touch with no bubble showing does nothing, and the rainbow bubble at the end is also popped by a touch anywhere. Two smooth rounds step her up to level 1.

Level 15 opens with one large still bubble already on screen at Play (1.3 times the level's largest, right of Home, the question mark and the guide, below the top bar), so the first touch anywhere pops something. Rising bubbles are gated by the pops: one more may be on screen for each pop, up to four, so none rise on a timer into an empty screen; a rising bubble starts already in reach and swells in from half size, and an empty screen gets one at once. Every other level fills to its most as before.

**Level 16, big and little** (toddler, placed after level 3 by `order`): bubbles come in two sizes (little radius 50–54, big 92–104, a ratio of at least 1.7; the little is larger than the research's first 42–48 because every bubble is drawn at least 100 units across), and the round asks for "big" or "little". A big bubble pops at a low pitch and a little one high, so the contrast is heard as well as seen. A wrong size wobbles and is named ("That one's little. Find big!") and counts a miss; two misses in a row glow the right size, which counts as a hint. **Level 17, which one has the dots?** (preschool, placed after level 6): four drifting bubbles show dice pips 1 to 4 and no numeral, and the voice asks "Pop the one with four!" Six asks, every count once before a repeat and never the same count twice running; a popped bubble is replaced by one with the same count, so one of each is always showing. A wrong bubble has its dots said aloud ("That one has three. Find four!") and two in a row glow the right one. **Level 18, dots and numbers together** (preschool, placed after level 7 by `order` `[4, 5, 6, 17, 7, 18, 8, 9]`, mode `match`): eight still drifting bubbles, a numeral bubble and a dice-pip bubble for each of 1 to 4, each pair colored differently so the match is found by number and not by color. Tap one to hold it (it glows; a held numeral is read aloud, held dots are not, so the child counts them); tapping its partner (same number, other kind) pops both with "{n} and {n}! They match!" and a new pair of that count swells in, so every count stays showing twice. Six pairs, then the rainbow bubble. Tapping another bubble of the same kind moves the hold and is not a miss; tapping the held bubble lets go. The other kind with a different number is a miss that keeps the hold and says a hint ("That one has {wrong}. Find {n}!" for dots, "That's {wrong}. Count the dots again!" for a numeral); two misses in a row glow the partner and count one hint. Idle 6 seconds while holding glows the partner without counting a hint. The ghost finger takes the dots first, then the matching numeral. Match-mode numerals omit the small lower glint so it cannot be counted as a dot. Every still mode (count, bonds, dots, match) now starts each bubble at a spot clear of the others (`clearSpot` in `logic.ts`), because two dot bubbles starting stacked read as one bigger count. Only the two slot-free clips (`bubble.match`, `bubble.mode.18`) are rendered; the slotted lines use device speech.

**Level 19, blow, then pop** (lap, placed after level 1 by `order` `[15, 1, 19, 2, 3]`, plan field `blow`): the same free play, but no bubble rises by itself. A finger down on empty space blows one bubble there, and a finger dragged across it blows a trail, one every 200 units of stroke (`blowAlong`, never more than the plan's four on the screen); each blown bubble swells out of a speck, floats up and is tapped to pop it, with the usual friends and pictures riding inside, eight pops and the rainbow bubble. A whole-screen layer under the bubbles takes the blowing, so a touch on a bubble pops it and a touch beside one blows; a hand of four or more contacts blows nothing, and cancel, blur or leaving the page ends the stroke with no bubble. No touch is wrong. If no bubble has been on the screen for six seconds one rises from below, so a child who only taps is never stuck. The ghost finger swipes a trail when nothing is showing, then pops. Whether a lap child drags before she taps stays a person check, not a gate. Its three lines carry `{pet}`, so they use device speech and no clip is rendered; the next voice pass can reword them without it.

**Pictures in bubbles** (free play, levels 1–3 and 15): about one bubble in seven holds one of eight code-drawn pictures, two for each scene (shore flower and shell, bath rubber duck and boat, night star and moon, sea fish and starfish). It is released and named the first time, like a friend. The sticker pool (`FRIENDS`) is unchanged.
