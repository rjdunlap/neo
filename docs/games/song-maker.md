# Song Maker

<!-- generated: from src/games/song-maker; edit the text below the end mark (npm run game-docs) -->

**ID:** `song-maker` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** music, patterns, listening

| Band | Levels, easiest first |
| --- | --- |
| lap | 8, 1, 2 |
| toddler | 2–4 |
| preschool | 4, 11, 5, 6, 9 |
| pre-K | 5, 11, 6, 12, 7, 9 |
| school | 6, 7, 9, 10, 13, 14 |

| Level | Plays like |
| --- | --- |
| 1 | Tap jellies on a 4-beat loop and hear the song go round |
| 2 | Make any song on a bigger 6-beat loop |
| 3 | Copy a 3-note song by tapping its shadows |
| 4 | Copy a 5-note song by tapping its shadows |
| 5 | Copy a 5-note song from a little card |
| 6 | Continue a named song pattern: stairs, hops, zigzags, arches and leaps |
| 7 | Listen, then find each note of a 4-note tune by ear |
| 8 | One big jelly on a 4-beat loop; any touch lights the nearest, and more jellies wake |
| 9 | Make your own song on a 6-beat loop, then press the check to hear it once more |
| 10 | Answer the pet's 4-note question with a note on each of the next four beats |
| 11 | Finish the pet's 2-note song with a note on each of the last two beats |
| 12 | Listen, then pick each note of a 4-note tune from two shadows |
| 13 | Answer the pet's 4-note question, ending your answer on the home jelly |
| 14 | Change one thing in the pet's song: raise the end, match two beats, go down, or add a quiet beat |

<!-- end generated -->

**Starts as:** at lap, one big jelly where a touch anywhere lights it; otherwise tap jellies on a looping beat

**Grows into:** copy authored songs with rests by shadows or a card, finish a two-note song start (level 11, preschool and pre-K), continue a pattern, pick each heard note from two shadows (level 12, pre-K) before finding a tune by ear, then make your own song (level 9) and answer the pet's question (level 10, school) and then end the answer on the home jelly (level 13, school: a check that ends elsewhere is a miss, and the pet plays her answer and the same answer ending home), and last change one thing in the pet's song so it does what a picture asks (level 14, school)

## Design notes

The bottom, lowest row is red and the top, highest row blue: the same rainbow as Jelly Drums and the treehouse tune plaque, all read from `pitchColor` in `src/audio/notes.ts`.

A looping grid of jelly beads; higher rows sound higher (pentatonic steps), and the playhead follows the music clock's beat (`music.beats()`). Free play at lap and toddler; the lap band starts at level 8, "wake": one big sleeping jelly on a 4-beat, 3-row loop, a touch anywhere lights the nearest awake spot with its note, more spots wake as she lights them (low row first, then middle, then top), a touch on a lit jelly puts it out and is not counted, the round ends a loop after her twelfth light with at least two lit, and her tune is kept as a creation; then copying a song from shadow notes, then from a small card (levels 3–5 draw twelve authored motifs per shape, preserving their rests, with steps, repeats and at most one leap; the previous three motif choices are excluded within the loaded profile’s session, and demonstrations leave that history alone); continuing a repeating pattern (level 6 has ten named shapes, such as stairs, hops, zigzags, an arch and a valley, and the pet says the shape's name aloud before play); and finding a four-note tune by ear, where a wrong jelly is followed by the right note so the difference can be heard. A song from a free level with at least two lit jellies can be kept on the treehouse's tune plaque (the round finishes on its tap count either way); a copied song is not hers and is not offered. The background loop is silenced so the song is the only music; its clock keeps running at the game's tempo for the playhead.

Upright on a phone, `songLayout` (pure, in `logic.ts`) returns bars: levels 1–5, 7 and 8 get one board across the 768 width (cells up to 180, top 240, bottom at h − 184, the card and replay button above it). Level 6 (8 beats × 5 rows cannot be 8 columns of 100 on 768) folds the 4 given beats into a small 50-unit read-only bar above, and the 4 beats she fills in get a full 4-column board (cells 104–150) hung above the guide's corner; the given bar's seeds hide and take no touch. `upright.test.ts` covers every level, with its check and before buttons, in five views.

Level 9, "My song" (`mode: 'compose'`), is an open 6-beat, 4-row loop with no target and no wrong answers (no misses, no hints). It is placed last by `order` in preschool (4, 5, 6, 9), pre-K (5, 6, 7, 9) and school (6, 7, 9); lap and toddler are unchanged. The definition's proposal numbered it 8 and put it in windows with level 8, but 8 is lap's one big jelly, so it is 9 and level 8 is not in those windows. A check button in the right margin (100 units wide, upright `songLayout` too) wakes once at least 3 jellies are lit and a full 6-beat loop has played since her last change (`composeReady` in `logic.ts`). Pressing it plays the song once more, then finishes 0/0 and offers the song as a kept tune exactly as free play does. Two voice lines (`song.compose`, `song.compose.ready`), how-to lines and a bot (`autotouch` lights 3 jellies, then presses the check).

Level 10, Answer my song (school only for now; a person check decides pre-K): an 8×4 board whose first four beats are the pet's authored question (eight of them, the last three skipped), drawn as given white-ringed jellies on a tint. She puts one jelly on each of beats 5–8; a tap in a beat moves its jelly and a tap on the lit one puts it out, so no answer is wrong, an echo included. The check wakes once all four are filled and the loop has played all eight beats since her last change, then plays the song once more and finishes with no misses; the whole eight-beat song is offered as an ordinary kept tune. Upright, the question is a small given bar above her four beats (as at level 6). Not built: the performing critter beside the check and the pet singing the answer half, which the definition sketches; the loop itself plays both halves.

Level 11, Finish my song (preschool and pre-K, placed right after the first copy level in each window and listed in `entryLevels` so aging into school lands at school's first level): a 4×3 board whose first two beats are a two-note opening drawn from the 3-row motif pool (seven distinct openings, the last three skipped), drawn as given white-ringed jellies on a tint. She puts one jelly on each of beats 3–4 using the same move-per-beat interaction as level 10, the check wakes once both are filled and all four beats have played since her last change, and the whole four-beat song is offered as a kept tune (`song.finish`, `song.finish.ready`). Upright, all four beats fit on one full-width board.

Level 12, Two to choose (pre-K only, placed right before level 7 and listed in `entryLevels` so aging into school lands at level 6): level 7's 4×3 heard tune with the replay button, except each beat shows two shadow candidates (the right note and one random other row, `choices: 2`) while the third seed is quiet (`eventMode = 'none'`). Tapping the wrong shadow plays a boing and then the column's right note (`song.again`), glowing the earliest unsolved note after two misses (`song.hint`); solving a beat clears its other shadow and leaves the lit jelly tappable to sing (`song.listenTwo`). Copied tunes are not offered for the pet's room.

Level 13, Bring it home (school, after level 10): level 10's board with questions that start on the home (bottom) jelly and end away from it. A check whose last jelly is not home is a miss: a boing, the pet plays her answer and then the same answer ending home (`song.home.hear`), the check sleeps until she changes something, and after two misses the home jelly in the last beat glows.

Level 14, Change one thing (school, last; `mode: 'revise'`): the pet's 6-beat, 4-row tune is lit on the whole board, from twelve authored tunes (`CHANGE_TUNES`, three per request, the last three skipped), with a wooden picture card of one request and a yellow band under the beats it is about. The requests (`requestMet`): raise the end (the last jelly sits higher than it did), make beat 4 match beat 1 (same row), go down at the end (the last two beats both sound and the last is lower), or add a quiet beat (any beat empty). Every beat uses level 10's one-jelly-a-beat tap. The yellow before button plays the pet's tune as it was. The check wakes once her song differs from the pet's and a full loop has played since her last change; other changes are welcome and only the request is checked. A check without it is a miss (D4): a boing, the pet's tune and then hers, a request line (`song.change.<request>.again`), the check asleep until a change, and after two misses a glow on the jelly `changeTap` picks, whose tap brings the song closer (from any song, at most two hint taps finish it; from the pet's tune, one). The ghost finger makes that one tap and presses the check, and the revised song is offered as an ordinary kept tune. The deep dive proposed an 8-beat tune, but an 8×4 board cannot keep 100-unit cells upright on the 768 × 1024 view, so it uses level 9's 6×4 board; a match has two single-tap answers (move either beat), the other requests at least three.
