# Hat Band

<!-- generated: from src/games/hat-band; edit the text below the end mark (npm run game-docs) -->

**ID:** `hat-band` · **Land:** Music Mountain · **Ages:** preschool–grown-up · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** listening, musical roles, texture, cause and effect

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–3 |
| school | 2–4 |
| grown-up | 4 |

| Level | Plays like |
| --- | --- |
| 1 | Put on a hat: a drum hat and a tune hat; put one on a friend to hear their part, then make a band |
| 2 | Swap a hat: four hats; swap, spotlight one friend, hear two different bands, then finish with the one she likes |
| 3 | Alone, then together: both friends play; hear each one alone with the spotlight, then the two together |
| 4 | Build a song: three friends (drum, tune and a low part) and a three-part song; start with the tune alone, end with everybody, the middle is hers; Check plays it through |

<!-- end generated -->

**Starts as:** put a drum hat or a tune hat on a friend and the friend starts playing that part, over and over; at level 4 (school and grown-up) three friends with a drum, a tune and a low hat arrange a three-part song

**Grows into:** take a hat off or swap it for another, tap a star to hear one friend alone, then hear each hat alone and the two together before Done (no wrong mix, no misses); at level 4, Check the song against the picture of how it starts and ends (a complete song that does not fit is a miss, with a hint after the second)

## Design notes

Hat Band fits upright on a phone, including the three performers and song cards in Build a song.

*preschool–grown-up (levels 1–4; preschool 1–2, pre-K 1–3, school 2–4, grown-up 4) · after Toca Band and BANDIMAL; [definition](../definitions/hat-band.md).* Two friends (seeded) stand on a little stage with a rack of hats. Each hat is a musical job: a drum hat plays a beat with no notes, a tune hat plays four pentatonic notes; both loop at a fixed 80 beats a minute, so the pace is not a choice (Little Conductor owns pace) and any mix sounds fine. Drag a hat onto a friend, or tap a hat and then tap a friend (a tap is judged by finger travel under 24 units); a drop away from a friend returns the hat. The part joins at the next beat, with a pending ring while it waits; tapping a worn hat takes it off, and a hat put on an occupied friend replaces the old one. A worn friend bobs and flashes their prop on the beat. The pet says "the drum hat" or "the tune hat" the first time each hat is lifted and not again. Music is silenced (`silenced(STYLES.jelly)`); the band is the music, and speech ducks it to half.

Level 1, *Put on a hat* (one drum hat and one tune hat): put one on, hear its part, add the other, take one off. Done needs a nonempty band that has played one whole loop; a Done tapped earlier is gently refused with `hat-band.both` or `hat-band.together`, and a dim Done glows the next thing to try (a hat or a star) for 3 seconds, never counted. Level 2, *Swap a hat* (two drum and two tune hats, two of one role allowed at once): replace or remove hats, and use the star under each friend to hear that friend alone (the other dims; any change of hats returns to the full band). Done needs a whole loop and two different versions heard. Level 3, *Alone, then together* (the same rack, both friends must wear a hat): every worn hat must have been heard alone for a whole loop since it was put on, then the two together for a whole loop. A hat counts as heard alone when it is the only part sounding for a whole loop, solo or not (so a lone worn hat counts, and the second hat joining makes the spotlight needed for at least one hat). Anyone can finish with any mix; the round ends with a bow and one ordinary sticker. Level 4, *Build a song* (school and grown-up; its own scene, `song.ts`): three friends each wear one hat, a drum hat, a tune hat and a new low hat (`thump` or `walk`, a pluck voice an octave below the tunes). The song has three parts shown as cards; she taps a part, then taps friends to put their hats on or take them off in that part, hearing it loop. Play plays the whole song through, Undo goes back up to 20 steps, and Check plays the song and judges it against a pictured two-clause brief: the tune alone first, everybody last, the middle hers (7 of 343 nonempty songs fit). The song starts as everybody in every part. Check with an empty part is free and says which part needs somebody; a complete song that does not fit is a miss (the clause is spoken and its card bounces); from the second miss, and from the pause sheet's Show a hint, the repair's part card and friend glow, counted at most once per clause. An accepted Check plays an encore, the friends bow and the round finishes with one ordinary sticker, with or without help. The word "bass" is not spoken.

Misses and hints: none exist at levels 1–3; a round finishes 0/0 and Done is gated only by the heard rules (level 4 counts misses and hints as above). Nothing is kept. Co-play: one dresses each friend, then swap hats; off-screen: hum "boom, boom" with a little tune over it. Browser suite `hatband`.
