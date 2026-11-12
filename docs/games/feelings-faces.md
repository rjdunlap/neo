# Feelings Faces

<!-- generated: from src/games/feelings-faces; edit the text below the end mark (npm run game-docs) -->

**ID:** `feelings-faces` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** emotions, empathy, vocabulary

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1, 2 |
| toddler | 2, 10, 3, 4 |
| preschool | 3–6 |
| pre-K | 5, 6, 7, 8, 11 |
| school | 11, 12, 13 |

| Level | Plays like |
| --- | --- |
| 1 | Tap feeling bubbles to see the pet show each feeling |
| 2 | Match the pet's face, happy or sad |
| 3 | Find the happy, sad or sleepy face out of two |
| 4 | Find a named feeling out of three faces |
| 5 | Choose what helps: a hug, a pillow, an apple or a scarf |
| 6 | Watch what happens, then choose how the pet feels |
| 7 | Find the friend who feels a named feeling |
| 8 | Watch what happens, then choose how to help the pet feel better |
| 9 | Tap the pet to see it show one feeling after another |
| 10 | Hug or pillow: choose from two helpers for a sad, sleepy or hungry pet |
| 11 | Two friends, one happening: match each friend’s own reaction |
| 12 | Ask first: hear what a friend wants, then offer its stated wish, including quiet space |
| 13 | What happened? Use the face and leftover clue to choose a happening |

<!-- end generated -->

**Starts as:** tap bubbles or poke the pet, choose a helper, compare two friends’ reactions, use a leftover clue, or ask a friend what they want

**Grows into:** match and name faces, choose what helps, connect happenings and feelings, recognize different reactions and honor stated wishes, including quiet space

## Design notes

The critter gained `sad` and `calm` moods, with brows and a tear so feelings read even at sticker size. Lap play is cause and effect: four feeling bubbles change the big pet's face, with a matching sound, and tapping a sad pet gives it a hug. Level 9, *Poke a feeling*, is the lap entry (lap order 9, 1, 2): no bubbles, the pet starts calm, and each tap anywhere on it shows the next step of a fixed cycle (happy, surprised, sleepy, sad, then a hug that returns it to happy) with the feeling's sound, word and effect; the hug is hearts and its own sound. It ends by itself after six taps with a sticker, and `misses` and `hints` are always 0. Later levels match the pet's face, find a named feeling, choose what helps a need (a hug, a pillow, an apple, or a scarf), watch a small event and choose how the pet feels (the pet stays `calm` until answered, so the event carries the answer), and find which of four friends feels a named feeling. Level 6 draws four different happenings from eight (a balloon drifts away, the moon rises, a cloud rains on the window, a butterfly lands on the pet's head, a lullaby's bell notes drift up, a ball bounces in, and more); two happenings may share a feeling. Level 7 draws its friends from eight. Level 8 joins the event to a helpful choice from five scenarios (balloon drifts away or ice cream falls off its cone, then a hug; moon rises, then a pillow; snow at the window, then a scarf; an empty picnic basket, then an apple); a round shows four different happenings and at least three different helpers, and the care-only happenings never appear at level 6. The hug is said as the pet's own preference ("{pet} loves a hug!"), not a rule. A tap on a happening's prop wobbles it and replays its sound, free and never a miss. Tapping the pet repeats the question (at level 9 it shows the next feeling instead). The big pet replaces the corner guide and repeats the instruction when tapped.

Level 10, *Hug or pillow*, places two helper cards below a sad, sleepy or hungry pet; toddler order is `[2, 10, 3, 4]`. Level 11, *Two friends, one happening*, shows Cat and Bunny reacting differently to a jack-in-the-box, rain or a drum. A blue ring identifies the named friend; three face cards answer “How does Cat/Bunny feel?” Each round shows two happenings and asks about both friends, four questions total. These are the fictional friends’ reactions, not a universal answer to an event. Pre-K order is `[5, 6, 7, 8, 11]`, and school order is `[11, 12, 13]`. Level 13, *What happened?*, pairs the pet’s face with a leftover balloon string, torn gift wrapper, moon or rain puddle; choose the matching happening from three cards. A wrong happening briefly replays without changing the actual face or clue. At 10, 11 and 13 a wrong card counts one miss; two misses offer the glow and count one hint; supported completion still earns one sticker after four questions. Spoken questions, level-specific how-tos and ghost-finger demonstrations cover all three. Lap and preschool windows stay unchanged.

Level 12, *Ask first*, shows Bunny, Cat, Bear and Dog one at a time, looking sad or sleepy. Tap the friend to ask; a thought bubble and spoken request reveal the wish before four offer cards appear. Every four-friend round includes a hug, quiet space on a blanket, a ball game and Hazel at the door exactly once. Tap the friend to repeat the wish without a miss or hint. Wrong offers count a miss and replay the request; two misses offer one glow hint. Give the stated wish: the game may end happy, and the other requests end calm. Calm stays valid at the round ending. Four supported answers earn one sticker, with a two-step ghost finger and level-specific spoken how-to. These are fictional requests, not advice about a real child.

**A right answer's line never holds the next question (U7 fix batch 11, 2026-11-12).** The line starts and, after the 0.5 s beat, the next board opens with its ask waiting for the line, her first tap or the guide (`Game.sayWaitingAsk`). A first tap while the ask waits says it and is not judged, since several asks are only spoken. Levels 6 and 8 (why, care) and level 11's question before a new happening hear the line out first, since the happening's narration would cut it, as does the last question's line.
