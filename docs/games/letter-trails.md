# Letter Trails

<!-- generated: from src/games/letter-trails; edit the text below the end mark (npm run game-docs) -->

**ID:** `letter-trails` · **Land:** Story Grove · **Ages:** preschool–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** letters, fine-motor, writing

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–6 |
| pre-K | 3–8 |
| school | 7–8 |

| Level | Plays like |
| --- | --- |
| 1 | Follow straight strokes: I, L, T |
| 2 | More straight strokes: E, F, H |
| 3 | Follow diagonal strokes |
| 4 | Follow rounded strokes |
| 5 | Combine straight and rounded strokes |
| 6 | Explore all 26 capitals |
| 7 | Trace a short word: CAT, DOG, or SUN |
| 8 | Trace the child’s name in capitals |

<!-- end generated -->

**Starts as:** follow a firefly along capital strokes

**Grows into:** all 26 capitals starting at the top, spoken short words and the child's name

## Design notes

Defines all 26 capitals as ordered strokes starting in the top quarter of the writing box. A has two downward legs and a separate bar; M and N keep a continuous path, retracing the first upright before the diagonal. Checkpoints on the return path wait for the finger to turn; an on-trail reversal stays within the forgiving corridor. A firefly and moving beacon guide the finger; successive checkpoints enforce the trail while tolerating imprecise motion. Each finished letter becomes a code-drawn illustration with a spoken association. Levels 7–8 introduce the short word or child's name aloud before its first letter; the pet repeats the current letter instruction. Plans, seeded selection, tolerance and name normalization live in `logic.ts`; sticker seeds retain the original A–Z pictures. Accented Latin names normalize to A–Z; names with no supported letters fall back to PIP. Additional scripts would need their own stroke data. A small purple start arrow beside each stroke's start points along its first stretch until she sets off. The firefly's note climbs one pentatonic step for each fifth of the stroke. The ink is teal, rainbow, glitter or sand per round (drawn from the seed after the word, so it never changes the letter or a checkpoint). Hint: after two wandering drags on one stroke the ring lights (one hint, as before) and, once she lets go, the firefly flies the next stretch (up to 12 checkpoints) leaving yellow dots, then returns to her checkpoint. Journal: each letter traced to its end (picture shown) files an "A is for apple" entry (`letter-trails:A` to `Z`, 26 entries) at any level; the unfound card says "trace A in Letter Trails".
