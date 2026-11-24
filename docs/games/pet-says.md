# Pet Says

<!-- generated: from src/games/pet-says; edit the text below the end mark (npm run game-docs) -->

**ID:** `pet-says` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** copying actions, body words, following directions, self-control

| Band | Levels, easiest first |
| --- | --- |
| lap | 13, 1, 2 |
| toddler | 1–3 |
| preschool | 2–4 |
| pre-K | 3–10 |
| school | 6–12 |

| Level | Plays like |
| --- | --- |
| 1 | Copy the pet: clap, stomp, wave, jump, peekaboo, pat-a-cake (a grown-up taps the arrow) |
| 2 | Body words: point to your eyes, touch your shoulders, hold your chin; then the "head, shoulders, tummy, toes" chant |
| 3 | Two moves in order, sometimes counted: "stomp three times, then hop like a frog" |
| 4 | "Pet says": move only when you hear the pet's name first; later a wrong name, and "do this, do that" |
| 5 | Freeze dance: four tunes to bounce, sway or dance like a robot to, then freeze like a tree or a flamingo |
| 6 | Opposite day: a sun means copy the pet, a moon means do the opposite (reach up high, so crouch down low) |
| 7 | Quiet dance: dance while it is quiet, and freeze when the music plays (the freeze dance turned around) |
| 8 | More opposites: stomp or tiptoe, wiggle fast or slowly, clap loudly or softly, arms wide or a hug (three pairs a round, mostly moons) |
| 9 | A walk in the woods: act out four stops on a woodland, beach or farm adventure |
| 10 | Sun or moon: listen for the sign on each of eight turns. Copy on the sun and do the opposite on the moon. |
| 11 | Pet says, opposite: when you hear the pet’s name first, do the opposite. If you only hear the move, stay still. |
| 12 | This hand: wave the hand that lights up (blue or red), then left and right like a mirror: wave your left hand, touch your right ear |
| 13 | Pat the pet: a touch anywhere makes the pet do its next move (no arrow) |

<!-- end generated -->

**Starts as:** the pet claps, stomps and waves; copy it, and a grown-up taps the arrow (lap starts with Pat the pet: each pat on the pet brings its next move)

**Grows into:** body words with visible part targets, two moves in order (some counted), "Pet says" (move only when you hear it), freeze dance, Opposite day (a sun means copy, a moon means do the opposite, and the pet shows the answer), Quiet dance (dance in the quiet, freeze when the music plays), More opposites (stomp or tiptoe, fast or slow, loud or soft, wide or a hug), four-stop movement stories, Sun or moon (the rule changes during the round), and Pet says, opposite (do the opposite when the pet says its name first and stay still for a trick). A gentle arrow reminder and a held "once more" button support grown-up co-play.

## Design notes

*After Simon Says and action songs such as "Head, Shoulders, Knees and Toes".* The big pet, with two mitten hands riding on its body, claps, stomps, waves, jumps, turns, wiggles, reaches up and crouches; the child copies off the screen and a grown-up taps the green arrow to go on. Nothing is judged and no miss is possible. Levels: copy single moves; body words (nose, tummy, ears, head, toes); two moves in order, where one move made of beats can be counted ("stomp three times, then clap", the pet counting aloud, never past five); "Pet says" (the pet moves either way to tempt, and two spaced-out commands without "Pet says" end with "did you stay still?"); and a freeze dance, where the music stops after a few seconds and the pet freezes in a pose. Tapping the big pet shows the move again; the corner guide steps out while it is the star. The playing pet has a visible nose, and body-word mittens land on its nose, belly, ears, head and feet, and (level 2, ten words) eyes, cheeks, and mouth, chin and shoulders worked out from nose, neck and body, never two words in a row from the same zone (face, top, body). Level 2 ends with the chant "head, shoulders, tummy, toes": five verses, each leaving one more word unsung from the front (the last is touches only). Level 4 holds two or three tricks: plain, a borrowed name ("Bunny says: clap!", never the pet's or the child's) which she should not follow, and "do that" after a "do this" (explained once). Device speech of the new words is unchecked. After ten quiet seconds with the arrow available, it wiggles once and a spoken reminder invites a grown-up to tap it; waiting never advances the round or counts as a miss or hint. Move speech uses explicit `says.move.*` IDs, and the original sticker color/pose draws are pinned for seeds 0–99. **Level 13, Pat the pet** is lap's first level (her order is 13, 1, 2): the pet stands and waits, there is no arrow, and every pat, on the pet or anywhere in the meadow, makes it do its next move (wave, clap, jump, wiggle, turn around, five different ones in a random order), said aloud; a pat during a move only squishes the pet and is not saved up, a quiet moment brings a poke and "Pat the pet!", and after the fifth move the pet cheers and the round ends by itself. Nothing is wrong, so no misses or hints. Its ID is 13 because 6–12 are kept for the planned levels. It also draws on peekaboo and pat-a-cake (seven moves, no walking or animal ones). Moves come in tiers: base (the original eight), social (peekaboo, pat-a-cake), walking (tiptoe, march), animal (hop like a frog, stretch like a cat, waddle like a duck, flap like a bird) and calm (sway like a tree, shake it out). Level 1 draws from base and social only; levels 3 and 4 from all 18. The `says.move.*` lines for the new moves are device speech (no rendered clips). Counts' "manner" (a big jump, a little jump) is not built. **Dance variety and scenes (level 5):** each of the four dances has its own tune and beat in the pentatonic steps (bounce, sway, shimmy, march) and its own style the pet shows and names (bounce, sway, twirl, shimmy, robot; never the same style twice running), then freezes as a named statue (tree, ice cream, flamingo, star, teapot; four different per round) and holds it until the grown-up taps the arrow. The earlier levels play in one of five scenes (meadow, beach, living room, snowy hill, evening), picked by seed after the moves so the moves a seed deals are unchanged. The style and statue lines use device speech (no rendered clips).

**Opposite day (level 6, 2026-11-14).** Six turns: two suns (copy), then four moons (do the opposite) from the pairs up/down and head/toes; two turns in a row never come from the same pair, so the opposite revealed on one turn is never the next ask. On a moon turn the arrow first makes the pet show the opposite (the grown-up's check); nothing is detected and misses stay 0. The sun/moon sign flips at the first moon and hangs above the pet, clear of the scene's own sun. A held orange "once more" button above the arrow (0.5 s) is on levels 4 and 6: it replays the turn and counts one hint per turn, while the pet tap stays free. School has a 6-6 window beside pre-K 3-6. Device speech for the `says.opp.*` lines is unchecked.

**Quiet dance (level 7, 2026-11-14).** Four dances, each a quiet stretch (3-7 s, the pet dances to a soft tick in its dance style) then a music stretch (2-4 s, the tune plays and the pet stops still where it is, a twirl caught mid-turn snapping to full width). "Music! Freeze!" is said whatever she does, so nothing is wrong and misses and hints stay 0. No stretch is as long as the one before it or the last of its kind, and a round is at most 40 s (a long frame is clamped so no stretch is skipped). When the song ends the pet holds still for the arrow; there is no once-more button. Pre-K 3-7 and school 6-7. Device speech for `says.quiet`, `says.quiet.go` and `says.music` is unchecked.

**More opposites (level 8, 2026-11-14).** Six turns from six pairs: up/down and head/toes from level 6, plus stomp/tiptoe, fast/slow wiggle, loud/soft clap and arms wide/hug. A round draws three pairs and asks each twice, never the same pair twice in a row; it opens with one sun, then five moons. The six new moves sit outside the tiers and appear in levels 8, 10 and 11. Each pair differs in one measured way (place, height, tempo or volume). On the opposite levels only, stomp squats low (0.88) against tiptoe's rise (1.08), and the clap sound takes a loudness scale. The held "once more" counts a hint here, as at 4 and 6; misses stay 0. Pre-K 3-8 and school 6-8. Device speech for `says.opp.more` is unchecked.

**A walk in the woods (level 9, 2026-11-14).** The seed picks one route through the woods, along a beach or across a farm. At each of four stops the scenery changes and the pet names and performs a move to act out together. A grown-up taps the arrow to go on. Tapping the pet is free, while holding the orange button counts one hint per stop. Pre-K and school both reach level 9.

**Sun or moon (level 10, 2026-11-14).** Over eight turns, the sign switches between sun (copy) and moon (do the opposite). The seed picks one of four sign patterns, all starting with two suns, and draws three of level 8’s six move pairs. The pet says the rule before it moves. On each moon turn, the first arrow tap shows the opposite and the next tap goes on. A pet tap repeats the turn for free. Holding the orange "once more" button counts one hint per turn. Pre-K reaches level 10 (3–10), and school reaches level 10 (6–10).

**Pet says, opposite (level 11, 2026-11-14).** The pet gives eight cues drawn from three opposite pairs. When it says its name first, players do the opposite and the first arrow tap shows the answer. On two or three spaced tricks the pet says just the move, then asks if everyone stayed still. One arrow tap advances those turns. School plays levels 6–11.

**What the guide repeats (level 7, 2026-11-18).** "Music! Freeze!" (`says.music`) is still said whatever she does, and is now the instruction (`ctx.instruct`), so while the music plays the guide and caption say freeze instead of keeping "Shh, it is quiet. Dance!"; each quiet stretch still instructs `says.quiet.go`.
