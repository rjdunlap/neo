# Secret Code

<!-- generated: from src/games/secret-code; edit the text below the end mark (npm run game-docs) -->

**ID:** `secret-code` · **Land:** Puzzle Peaks · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** deduction, using-evidence, colors, reasoning

| Band | Levels, easiest first |
| --- | --- |
| preschool | 10, 1 |
| pre-K | 1–3 |
| school | 2, 3, 4, 9, 12, 5, 6, 7, 8, 11 |

| Level | Plays like |
| --- | --- |
| 1 | Two slots, three colors; each slot says yes or no |
| 2 | Three slots, four colors; each slot says yes or no |
| 3 | Yellow marks: the color is in the code, but in another slot |
| 4 | Three slots and five colors, with yellow marks |
| 5 | Four slots and five colors |
| 6 | A color can be used twice in the code |
| 7 | Detective door: work out the one code that fits the shown guesses |
| 8 | Four slots, five colors, and one color used twice |
| 9 | Be the door: she makes a code and marks the pet’s tries green, yellow or gray |
| 10 | One slot, three stones: which stone is behind the door? A gray cross rules a stone out |
| 11 | A bigger detective door: four slots, five colors, and three shown guesses |
| 12 | Swap seats: she makes a code and marks a grown-up’s tries, then cracks the code they make (or plays it with the pet) |

<!-- end generated -->

**Starts as:** fill a door's slots with stones; each slot says yes or no

**Grows into:** yellow "wrong place" marks, more slots and colors, repeated colors, detective doors with prior clues, a bigger four-slot detective door, *Be the door* (she makes the code and marks the pet's tries), *One slot* (the preschool opening: one slot, a gray crosses a stone out), and *Swap seats* (school: she and a grown-up take turns making a code and marking, then break each other's; Just me puts the pet in seat 2)

## Design notes

*After Mastermind and Neopets' Time Tunnel.* Tap stones into a door's slots and turn the key. Each slot gets a green check, a yellow dot (in the code elsewhere; from level 3) or a gray cross; guesses stay listed above the door, and green stones stay in place. Each stone also carries a shape, so colors never rely on hue alone. A guess is never a miss in itself. The miss is ignoring a clue she can still see: putting a stone where a mark on a try still drawn above the door already ruled it out, a rule that understands repeated colors (older tries that have scrolled off a short screen, 1024 by 768 landscape shows four, never cost a miss; level 7 uses only the friend's shown clues). Gray means "no more of that stone", since a second copy of a color can be gray while the color is in the code. Two such misses, or many guesses, bring faint stones in the empty slots that fit every clue so far; the stones are redrawn after each later try on that door (no new hint counted). Each door of a round is a seeded wooden door, garden gate or treasure chest (codes unchanged). Later levels have more slots and colors, then a repeated color (level 6, three slots; school level 8, *Four slots, a repeat*, four slots and five colors with a color used twice in every code, so that color can earn two marks; two doors, the same miss rule as levels 1–6, the `code.repeat` line, and school spans levels 2–12). School level 7 is a detective door: two or three distinct prior guesses identify exactly one three-stone code, with no repeated colors. Each of the round’s two doors has fresh seeded clues. A try that contradicts any of that evidence counts as one miss and gets a spoken reminder; two misses bring faint solution stones. The original clues remain visible throughout retries. School level 11, *A bigger detective door*, is the same door with four slots and five colors (no repeats): three seeded shown tries (never more than three, so every clue row fits above the door at the highest place) leave exactly one code. It uses level 7's miss rule (one miss per try that contradicts a shown clue or an earlier try), `code.detective` and `code.contradiction` are reused, faint stones come after two misses or once five own tries are on screen, and the clue rows never fade.

**Level 12, Swap seats (school).** A seat question first: **Two of us** (she and a grown-up) or **Just me** (the pet takes seat 2). In the first half she makes a code and, under a lid, marks the other seat's tries with level 9's gray, yellow and green discs. A wrong mark is a miss (`code.sure`, `code.markall` reworded to suit a grown-up as well as the pet); two wrong presses on one try ring the right marks (one hint). Then the seats swap and she breaks the other seat's code under levels 3–6 rules; in Two of us an ignored clue in seat 2 is no miss (the grown-up is guessing), while one in her own half is. The two-seat rounds finish through `swapResult`, which is never smooth: at least one hint is recorded (supported completion). Just me uses level 9's bottom layout and the second half instructs `code.repeat`. In Two of us the code panel and the lid sit at the upper right (full 400 by 124 size) because the tray and the lidded code show together. No spoken cue between seat-2 tries (the key and tray reappear). Seven new `code.*` voice lines; the bot's codes come from `quickCode` (fewest `solverTries`, a salted clone that leaves the round's rng untouched). School only, not on the couch.

**Level 10, One slot (preschool).** One slot, three stones, three doors a round. She taps a stone and the key; a green opens the door, a gray crosses that stone out: it dims in the tray under a small gray cross (`code.notthis`). Tapping a crossed-out stone is the level's only miss (it wobbles, a boing and `code.crossed`, and stays in the tray); after two such misses on a door the hidden stone glows in the tray and a faint stone shows in the slot (`code.onehint`, one hint). Every door opens within three tries (rule-tested). The instruction is `code.oneslot`. Preschool `order` is 10 then 1 (entry 10; a carried 10 lands on 1 at pre-K, 2 at school); Secret Code shows on the preschool Puzzle Peaks page. Couch unchanged (4–6).

**Level 9, Be the door (school).** Roles swap: she fills three slots from four colours (repeats allowed, no wrong code) and taps the check; her code moves to a yellow panel at the bottom while the pet thinks (a three-dot bubble) and tries a seeded code that fits every mark so far (`petTry`; it cracks any of the 64 codes within six tries when marked right). She taps the disc under each stone to cycle gray, yellow, green, then taps the arrow. A wrong mark is a miss, one per arrow press: the first wrong stone wobbles and the pet asks "Are you sure about my {color} stone?" (`code.sure`); an unmarked disc is only a reminder (`code.markall`), not a miss. After two wrong presses on one try, a ring around each disc still wrong shows the right mark (one hint), updated on each tap. Two codes a round. School `order` is 2, 3, 4, 9, 12, 5, 6, 7, 8, 11; pre-K stays 1–3. A resize no longer re-shows the tray while she marks. The pet's recap of greens and yellows is not spoken here, and the thought bubble is three dots only. The ghost finger uses a seeded `demoCode` the pet cracks in at most three tries. Not on the couch (control and autoplay guarded). Voice lines `code.maker`, `code.another`, `code.makefill`, `code.markit`, `code.pettry`, `code.markall`, `code.sure`, `code.cracked`; the how-to card scopes level 9 steps and notes.

**Couch course, The Code Doors.** Five frozen codes on the couch (levels 4, 4, 5, 5 and 6; the four-colour door hides its fifth stone), each door played under its own level's plan. A turn of the key is a try; taking a stone back is free. Par comes from the fixed reference solver `solverTries` (`nextMove` run until the door opens): 2, 3, 3, 4 and 4, so 16 in all, computed rather than typed in. The game's hint (two ignored clues, or slots + 4 tries) marks the run as helped; a reload restarts the door and keeps the tries already made. Badges are Finished and On par. Because this par can be beaten, `CourseInfo.reference` makes the shelf, course page, HUD and result say par (under, on or above) instead of "the fewest possible". Voice line `couch.course.codedoors`.
