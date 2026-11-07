# Peekaround Island

<!-- generated: from src/games/peekaround-island; edit the text below the end mark (npm run game-docs) -->

**ID:** `peekaround-island` · **Land:** Puzzle Peaks · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** object-permanence, perspective, spatial-words, reasoning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–4 |
| pre-K | 3–7 |
| school | 4–8 |

| Level | Plays like |
| --- | --- |
| 1 | Turn the island to find who is hiding behind the tree |
| 2 | Find the friend named: "where is the duck?" (two others are showing) |
| 3 | Three friends are showing: who is hiding behind the tree? |
| 4 | Put three friends behind, in front of, and next to the tree |
| 5 | Two directions at once, then before the island turns around: who will be in front? |
| 6 | A picture stands on the island: who can't see it, with the tree in the way? |
| 7 | Three pictures of the island from three sides: which one shows what the duck sees from where it stands? |
| 8 | From the sky: which map shows the island from above? |

<!-- end generated -->

**Starts as:** turn a little island to find who is hiding behind the tree

**Grows into:** find a named friend, work out who is hiding from a picture card, put friends behind / in front of / next to the tree, two directions, guess who will be in front, then a half turn; tap the friend who cannot see a picture because the tree is in the way, choose which of three picture cards shows what a named friend sees from where it stands, then which of three top-down maps shows the island from the sky (school)

## Design notes

*After Captain Toad: Treasure Tracker and Fez.* A round island seen from the side, with a big round tree in the middle and four friend spots a quarter turn apart. Turning is drawn, not 3D: each spot's angle projects onto an ellipse, depth sets scale and draw order, and anything behind the tree's crown is hidden and cannot be tapped. Flowers between the spots make each quarter turn visible. "In front of", "behind" and "next to" are always from the child's side, so turning changes them (`logic.ts` `whereIs`).

- Levels 1–2 show arrow buttons; tapping the tree also turns it. Level 1 finds whoever hides behind the tree. Level 2 finds a named friend while two others stand in plain sight; tapping one of them is a miss. Two misses ring the arrows while the asked-for friend is hidden, and ring that friend once it is in view (it says "There is the duck! Tap the duck."); the ring follows if she turns after the hint.
- Level 3 has no arrows. A picture card shows all four friends and the child taps the one who is hiding: an elimination. A visible friend tapped by mistake says where it stands; the hider's picture glows after two misses. A right answer turns the island halfway round to reveal the friend.
- Levels 4–5 drag friends from the shore onto the island. Level 4 has three shore friends and three requests, asked one at a time and covering all three words ("next to" is never asked last). Level 5 gives two directions at once, always *behind* and *next to* (it never asks "in front of"), then turns the island halfway and always names the friend now in front. Before each turn a picture card of the friends on the island (2 pictures after the first pair, 4 after the second) asks who will be in front once it has turned; any guess is free (no miss, hint or glow), the friend who was behind cheers, and a different guess first hears "The one behind came round to the front!" (`frontAfterHalfTurn` in `logic.ts`; the ghost finger taps the right picture; the card spaces its pictures by count and on narrow screens uses the room right of the corner buttons, which also stops level 3's four pictures overlapping). Either side counts for "next to". A drop away from the island floats home without a miss; a drop on the wrong spot gets a spoken explanation of the word, and the fitting spots glow after two misses.
- Level 6 (`see`; pre-K and school only, range 3–6) puts a picture card on a small easel on one island spot, with friends round it, and asks who can't see it: the friend across the tree. Each tapped friend is turned to the front (the short way) and a wrong one says "I can see it!" (a miss, with a boing); two misses ring the friend across and say to look for the friend on the other side of the tree from the picture. A right friend says "I can't see it! The tree is in the way." Three scenes a round; the picture faces her from the right, behind and the left once each, shuffled (never from the front, where the friend across would stand behind the crown and could not be tapped). A picture at the side has two friends (across and front); behind the tree it has three, and the pet first says "The picture is behind the tree. We can't see it either!"
- Level 7 (`view`; pre-K and school only, range 3–7) puts three friends right, behind and left of the tree (her side empty) and names one at the side: "What does the duck see?" Three picture cards (270×220) show the island from each friend's side, drawn as live mini scenes (the four coloured flowers and the other friends make every side differ; the tree art does not turn, so no swing was added). A wrong card is a miss: the island turns to that friend's side and the pet says "That's what the cow sees!"; two misses ring the right card with a spoken hint. The right card turns the island to the named friend's side. Three scenes a round; the named friend is at the right and at the left at least once each. This level's island sits lower (y = max(0.6h, 586)) so the crown clears the cards at 1024×768.
- Level 8 (`sky`; school only, range 4–8; pre-K's still ends at 7): three small round maps hang above the island, each the island seen from the sky with the tree as a circle, the friends as coloured dots and a boat on her side; one is true, one is the mirror (left and right swapped) and one is quarter-turned. She taps the map that matches. The mirror miss hops the two swapped friends and names them (or the one that went to the other side); the turned miss turns the island to match that map and then back; a wrong map counts once (repeat taps re-explain without another miss); two misses ring the right map with a spoken hint (the friend in front of the tree is next to the boat). Three scenes a round: all friends in sight; one hidden of three; one hidden of four. The right map pops with a whoosh and a bird's-view cloud and birds; the hidden friend hops at the crown's edge. The island sits low enough that the crown clears the cards at 1024×768.
- Every request leaves a free spot that does not fit, whichever fitting spot she takes, so each drop is a real choice (rule-tested). The hider never repeats back to back. The round ends with a full spin of the island.
