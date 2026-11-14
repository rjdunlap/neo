# Pet Says

<!-- generated: from src/games/pet-says; edit the text below the end mark (npm run game-docs) -->

**ID:** `pet-says` · **Land:** Cozy Village · **Ages:** lap–pre-K · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** copying actions, body words, following directions, self-control

| Band | Levels, easiest first |
| --- | --- |
| lap | 13, 1, 2 |
| toddler | 1–3 |
| preschool | 2–4 |
| pre-K | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Copy the pet: clap, stomp, wave, jump, peekaboo, pat-a-cake (a grown-up taps the arrow) |
| 2 | Body words: touch your nose, pat your tummy, touch your toes |
| 3 | Two moves in order, sometimes counted: "stomp three times, then hop like a frog" |
| 4 | "Pet says": move only when you hear the pet's name first |
| 5 | Freeze dance: dance to the music, freeze when it stops |
| 13 | Pat the pet: a touch anywhere makes the pet do its next move (no arrow) |

<!-- end generated -->

**Starts as:** the pet claps, stomps and waves; copy it, and a grown-up taps the arrow (lap starts with Pat the pet: each pat on the pet brings its next move)

**Grows into:** body words with visible part targets, two moves in order (some counted), "Pet says" (move only when you hear it), freeze dance; a gentle arrow reminder

## Design notes

*After Simon Says and action songs such as "Head, Shoulders, Knees and Toes".* The big pet, with two mitten hands riding on its body, claps, stomps, waves, jumps, turns, wiggles, reaches up and crouches; the child copies off the screen and a grown-up taps the green arrow to go on. Nothing is judged and no miss is possible. Levels: copy single moves; body words (nose, tummy, ears, head, toes); two moves in order, where one move made of beats can be counted ("stomp three times, then clap", the pet counting aloud, never past five); "Pet says" (the pet moves either way to tempt, and two spaced-out commands without "Pet says" end with "did you stay still?"); and a freeze dance, where the music stops after a few seconds and the pet freezes in a pose. Tapping the big pet shows the move again; the corner guide steps out while it is the star. The playing pet has a visible nose, and body-word mittens land on its nose, belly, ears, head and feet. After ten quiet seconds with the arrow available, it wiggles once and a spoken reminder invites a grown-up to tap it; waiting never advances the round or counts as a miss or hint. Move speech uses explicit `says.move.*` IDs, and the original sticker color/pose draws are pinned for seeds 0–99. **Level 13, Pat the pet** is lap's first level (her order is 13, 1, 2): the pet stands and waits, there is no arrow, and every pat, on the pet or anywhere in the meadow, makes it do its next move (wave, clap, jump, wiggle, turn around, five different ones in a random order), said aloud; a pat during a move only squishes the pet and is not saved up, a quiet moment brings a poke and "Pat the pet!", and after the fifth move the pet cheers and the round ends by itself. Nothing is wrong, so no misses or hints. Its ID is 13 because 6–12 are kept for the planned levels. It also draws on peekaboo and pat-a-cake (seven moves, no walking or animal ones). Moves come in tiers: base (the original eight), social (peekaboo, pat-a-cake), walking (tiptoe, march), animal (hop like a frog, stretch like a cat, waddle like a duck, flap like a bird) and calm (sway like a tree, shake it out). Level 1 draws from base and social only; levels 3 and 4 from all 18. The `says.move.*` lines for the new moves are device speech (no rendered clips). Counts' "manner" (a big jump, a little jump) is not built.
