# Rhythm Neighbors

<!-- generated: from src/games/rhythm-neighbors; edit the text below the end mark (npm run game-docs) -->

**ID:** `rhythm-neighbors` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** turn-taking, rhythm, musical-expression

| Band | Levels, easiest first |
| --- | --- |
| lap | 7, 1, 2 |
| toddler | 2, 8, 9, 3 |
| preschool | 9, 3, 4 |
| pre-K | 4, 5, 6, 10 |
| school | 5, 6, 10, 11, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Tap a woodpecker and hear a frog answer |
| 2 | Choose two frog voices for a little chorus |
| 3 | Take turns: answer the bird with two or three frog notes |
| 4 | Play a pictured reply with two frog voices |
| 5 | Answer a short bird call with a different long-and-short frog phrase |
| 6 | Alternate two frog parts, then join a final duet |
| 7 | Knock a big tree and a frog answers every knock |
| 8 | My turn, your turn: the bird knocks, then one tap on the glowing frog answers |
| 9 | Knock a call on the big tree and the frog answers it, turned around |
| 10 | Copy or answer? Hear the bird and a frog, then say if the frog copied the bird |
| 11 | Your own answer: play the frogs in any rhythm that is not an echo of the bird |
| 12 | Longer calls: answer three or four bird knocks with a pictured reply of four frog notes |

<!-- end generated -->

**Starts as:** tap a bird and a frog chorus; knock the tree and a frog answers (lap); knock your own call and the frog answers it with the gaps flipped (toddler, preschool); hear a bird and a frog, then say whether the frog copied or answered (pre-K, school)

**Grows into:** trade different musical parts, follow two frog voices, play long/short replies with a guided option, end each round in a joined song; answer with your own reply and follow longer calls (levels 11–12)

## Design notes

*After Rhythm Heaven and call-and-response songs.* Two lap modes let taps make a bird call and frog chorus; they end by themselves after eight frog taps (the arrow still stops earlier), and after six quiet seconds a frog wiggles and croaks once, never counted. Level 7, *Knock, knock* (the lap entry, lap order 7, 1, 2), fills the left with a big tree: every knock on it sounds, and one croak answers it about 0.45 seconds later with a ripple on the pond; eight knocks finish, a tap on the frog croaks uncounted, and a touch anywhere else (pond, grass or sky) knocks the tree exactly as a tree touch does; a knock after the eighth, while the ending waits or plays, still sounds, uncounted and unanswered. After six quiet seconds the idle invitation knocks and bumps the tree (the other free levels still wiggle a frog). Level 8, *My turn, your turn* (toddler order 2, 8, 3), has the bird call two or three knocks, then one frog glows and waits: one tap answers, three exchanges finish, with no misses or hints. Level 9, *Knock a call* (toddler order 2, 8, 9, 3; preschool 9, 3, 4), makes her the caller: she knocks the big tree one to five times, and the call ends after 1.6 quiet seconds or at once on the fifth knock. One big frog answers a moment later (0.6 s after a fifth knock): one knock gets two croaks, otherwise the short/long gaps (judged relatively, as in the later levels) are flipped or reversed, so the answer differs whenever the call has two kinds of gap. Knocks during the answer sound but are not recorded. Three calls finish, then the finale replays her last call and the answer; there are no misses or hints. Finishing any answered round (levels 3–6 and 8) files the journal page "The frogs answered the woodpecker". Later levels alternate a two- or three-knock bird call with a different pictured frog reply drawn from twelve long/short shapes (two or three notes at levels 3–4, three or four at 5–6; the call is never the reply's pattern, and at 3–4 its knock count differs from the reply's note count), add a second frog (a green frog and a teal frog that croaks lower, alternating from a seeded first frog), then short/long rhythm gaps. The relative-gap judge is shared with Sound Garden. Explicit submission avoids any deadline; at levels 5–6 a gap over 2.5 s inside an unfinished reply just clears her taps with a spoken "take your time" (no miss). A tap past the reply's length sounds and costs nothing. Replay demonstrates both parts. After two misses, or when help is requested, guided play highlights the next frog and accepts the correct sequence at any pace. Three exchanges each end in a joinable song: the bird knocks its call, every frog plays the last reply together and her frog taps sound along un-judged, then one sticker. The background loop is silenced, so the bird and frog parts are the only rhythm.

Level 10, *Copy or answer?* (PR #2094): four exchanges per round. The bird knocks a two- or three-gap call and one frog plays a reply; two exchanges are exact copies and two are a different shape with the same note count (never only a tempo change). Then two 120-unit tiles appear: two matching frogs (copy) and a frog with a music-note bubble (answer). A wrong tile boings and says "Let us listen to them again", the pair replays, and a second wrong glows the right tile (one hint); misses and hints count per tile tap. The replay button plays the pair again and is not counted; frog taps croak and are never judged. The deep dive's school `order` `[5, 6, 10, 11, 12]` is `[5, 6, 10]` until levels 11 and 12 are built.

Level 11, *Your own answer* (school, after 10; PR #2293): three exchanges. The bird knocks a two- or three-gap call, then she answers with two to five notes on either frog (a sixth tap croaks and is not recorded) and sends them with the green arrow; her notes show as circles as she plays. An answer is any rhythm whose relative gap shape is not the call's (`isEcho` compares the shapes at any tempo, so a slower or faster copy is still an echo); the frogs sing her own notes back as the bird's new verse, and the ending song uses her last answer. A copy of the call or a single note is nudged with a spoken line and never counted: an echo replays the call, a lone note stays on screen for a second. The music-note button sings a sample answer (the call reversed, or with one more gap when it reads the same both ways), is not a hint, and no frog glows. There are no misses or hints; finishing files the "frogs answered the woodpecker" journal page. The ghost finger plays the sample answer.

Level 12, *Longer calls* (school, after 11; PR #2303): the level-6 turn-taking on longer material. The bird knocks three or four times with its own short and long gaps, and the pictured reply is four notes on two alternating frogs; three exchanges finish, then the joined song. No reply shape matches its call's. Replay, a glow on the next frog after two misses, guided play at any pace and the thinking-pause reset work as at level 6; the reply stays pictured, so it is more material, not more memory. The ghost finger plays the picture.
