# Song Maker

<!-- generated: from src/games/song-maker; edit the text below the end mark (npm run game-docs) -->

**ID:** `song-maker` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** music · **Plays by:** touch · **Ghost finger:** yes

**Skills:** music, patterns, listening

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 2–4 |
| preschool | 4–6 |
| pre-K | 5–7 |
| school | 6–7 |

| Level | Plays like |
| --- | --- |
| 1 | Tap jellies on a 4-beat loop and hear the song go round |
| 2 | Make any song on a bigger 6-beat loop |
| 3 | Copy a 3-note song by tapping its shadows |
| 4 | Copy a 5-note song by tapping its shadows |
| 5 | Copy a 5-note song from a little card |
| 6 | Continue a named song pattern: stairs, hops, zigzags, arches and leaps |
| 7 | Listen, then find each note of a 4-note tune by ear |

<!-- end generated -->

**Starts as:** tap jellies on a looping beat

**Grows into:** copy authored songs with rests by shadows or a card, continue a pattern, find a tune by ear

## Design notes

The bottom, lowest row is red and the top, highest row blue: the same rainbow as Jelly Drums and the treehouse tune plaque, all read from `pitchColor` in `src/audio/notes.ts`.

A looping grid of jelly beads; higher rows sound higher (pentatonic steps), and the playhead follows the music clock's beat (`music.beats()`). Free play at lap and toddler; then copying a song from shadow notes, then from a small card (levels 3–5 draw twelve authored motifs per shape, preserving their rests, with steps, repeats and at most one leap; the previous three motif choices are excluded within the loaded profile’s session, and demonstrations leave that history alone); continuing a repeating pattern (level 6 has ten named shapes, such as stairs, hops, zigzags, an arch and a valley, and the pet says the shape's name aloud before play); and finding a four-note tune by ear, where a wrong jelly is followed by the right note so the difference can be heard. A song from a free level with at least two lit jellies can be kept on the treehouse's tune plaque (the round finishes on its tap count either way); a copied song is not hers and is not offered. The background loop is silenced so the song is the only music; its clock keeps running at the game's tempo for the playhead.
