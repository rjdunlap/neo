# Letter Trails

<!-- generated: from src/games/letter-trails; edit the text below the end mark (npm run game-docs) -->

**ID:** `letter-trails` · **Land:** Story Grove · **Ages:** preschool–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** letters, fine-motor, writing

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–6 |
| pre-K | 3–10 |
| school | 7–14 |

| Level | Plays like |
| --- | --- |
| 1 | Follow straight strokes: I, L, T |
| 2 | More straight strokes: E, F, H |
| 3 | Follow diagonal strokes |
| 4 | Follow rounded strokes |
| 5 | Combine straight and rounded strokes |
| 6 | Explore all 26 capitals |
| 7 | Trace a short word, then see its picture |
| 8 | Trace the first eight letters of the child’s name |
| 9 | Less help each time: trace one capital three times, with a solid trail, then dots, then only the start |
| 10 | Little letters like their capitals: c, o, s, v, w, t in a four-line frame |
| 11 | Magic c: a, d and g start with a little c, then a line |
| 12 | Lines and hooks: u, i, e, l, k, y and j in the four-line frame |
| 13 | Down, up and over: p, r, n, m, h and b in the four-line frame |
| 14 | The last four: f, q, x and z in the four-line frame |

<!-- end generated -->

**Starts as:** follow a firefly along capital strokes

**Grows into:** all 26 capitals starting at the top, short pictured words that end on the word's own picture, the first eight letters of the child's name on a sign, one capital traced three times with less help each time, and the little letters c o s v w t in a four-line frame, then a d g (a magic c, then a stem)

## Design notes

Defines all 26 capitals as ordered strokes starting in the top quarter of the writing box. A has two downward legs and a separate bar; M and N keep a continuous path, retracing the first upright before the diagonal. Checkpoints on the return path wait for the finger to turn; an on-trail reversal stays within the forgiving corridor. A firefly and moving beacon guide the finger; successive checkpoints enforce the trail while tolerating imprecise motion. Each finished letter becomes a code-drawn illustration with a spoken association. Levels 7–8 introduce the short word or child's name aloud before its first letter; the pet repeats the current letter instruction. Plans, seeded selection, tolerance and name normalization live in `logic.ts`; sticker seeds retain the original A–Z pictures. Accented Latin names normalize to A–Z; names with no supported letters fall back to PIP. Additional scripts would need their own stroke data. A small purple start arrow beside each stroke's start points along its first stretch until she sets off. The firefly's note climbs one pentatonic step for each fifth of the stroke. The ink is teal, rainbow, glitter or sand per round (drawn from the seed after the word, so it never changes the letter or a checkpoint). Hint: after two wandering drags on one stroke the ring lights (one hint, as before) and, once she lets go, the firefly flies the next stretch (up to 12 checkpoints) leaving yellow dots, then returns to her checkpoint. Journal: each letter traced to its end (picture shown) files an "A is for apple" entry (`letter-trails:A` to `Z`, 26 entries) at any level; the unfound card says "trace A in Letter Trails". Level 7 draws from 19 pictured words that are also Word Monsters' build words (a literal list in `logic.ts`) and ends on the word's own picture with the line `trails.made`. Level 8 traces at most eight letters (`NAME_CAP`) and ends on a wooden sign with the whole name (`trails.name`; wide capitals scale to fit); a name with no Latin letter is PIP, spoken "Pip". At levels 7–8 each letter counts at most one miss and one hint (`roundTally`), so a long round does not step her down faster than a short one; levels 1–6 keep raw counts. At levels 7–8 each letter's picture is a short unspoken flourish (about 1 s, not 2.6 s spoken), still filed as a journal discovery. Level 9 ("Three times") traces one capital from levels 1–6 three times: the solid trail, then dots, then only the start ring and arrow; three pips under the heading show the try. A wander brings the solid trail back for that stroke, and the firefly shows the way on every second wander, but each try counts at most one hint (`hintCounts`, `TRY_HINTS`); misses count as they come. One sticker for the three, and the letter's picture after the third try. Levels 7–8 are unchanged (`severalLetters` replaced the old `>= WORD_LEVEL` test). New lines `trails.dots` and `trails.alone`. Level 10 ("Little letters like their capitals") traces c o s v w t in a four-line frame (`src/learning/tracing/lowercase.ts`: `FRAME`, the `LOWER` stroke table, `isLower`, `strokesOf`; c, o and s run anticlockwise from the middle line, v and w are one stroke, t is a drop then a crossbar). The heading shows the capital beside the little letter; the picture, journal entry and voice use the capital. Same corridor as the capitals, one solid try, raw counts; because little letters are small, the miss threshold is about the radius of o (to revisit at levels 11–14). Stroke forms not yet checked against HWT's lowercase chart. New line `trails.little`.

Level 11, Magic c (school 7–11; pre-K stays 3–10): a, d and g each trace a magic-c curve then a stem (a: middle line to base; d: top line to base; g: middle line to the bottom line, its tail turning left). The stems are simple forms of our own, not yet checked against the Handwriting Without Tears lowercase chart (open, as for level 10). Plans, `MAGIC_LEVEL` and `inFrame` in `logic.ts` cover levels 10 and 11, and the corridor for in-frame levels is `LITTLE_TOLERANCE` 0.06 of the box (was 0.075; twice it stays under a little o's radius), which also narrows level 10. Voice reuses `trails.little`; the how-to has its own lines.

Level 12, Lines and hooks (school 7–12; pre-K stays 3–10): u i e l k y j in the same frame and corridor as levels 10–11. i and j end with a dot, k and y have two strokes, j's tail turns left, and e is the one letter that starts in the middle of its round and goes across first. The forms are simple shapes of our own, not yet checked against the Handwriting Without Tears chart.

Level 13, Down, up and over (school 7–13; pre-K stays 3–10): p r n m h b in the same frame and corridor. Each is one stroke that goes down its stem, back up it and over: a hump for n, m, h and r (r stops short, with no leg) or a round bowl for p and b. h and b start at the top line, p's stem reaches the bottom line. The forms are simple shapes of our own, not yet checked against the Handwriting Without Tears chart.

Level 14, The last four (school 7–14; pre-K stays 3–10): f q x z in the same frame and corridor, completing the little alphabet. f hooks over the top into its stem and has a bar; q is the magic c with a stem whose tail turns right (g's turns left); x is two crossing slides; z is one zigzag. The forms are simple shapes of our own, not yet checked against the Handwriting Without Tears chart.
