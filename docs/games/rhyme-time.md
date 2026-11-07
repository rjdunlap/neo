# Rhyme Time

<!-- generated: from src/games/rhyme-time; edit the text below the end mark (npm run game-docs) -->

**ID:** `rhyme-time` · **Land:** Story Grove · **Ages:** preschool–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** rhyming, listening, phonological-awareness, words

| Band | Levels, easiest first |
| --- | --- |
| preschool | 9, 8 |
| pre-K | 1, 8, 2, 3, 5 |
| school | 2, 8, 3, 4, 5, 6, 7, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Which one rhymes with "cat"? Three pictures to choose from |
| 2 | Which one rhymes? Four pictures to choose from |
| 3 | Find the two pictures that rhyme with each other |
| 4 | Odd one out: three rhyme, one does not |
| 5 | Riddle: sound clue, then meaning clue |
| 6 | Riddle: meaning clue first, a fourth decoy |
| 7 | Your turn: make the riddle |
| 8 | Silly pairs: who rides in the truck? The rider that rhymes hops in |
| 9 | Silly pairs, two to choose: three scenes, the rider or one other picture |
| 10 | Rhyme baskets: drag six pictures into three baskets by rhyme, two trays |

<!-- end generated -->

**Starts as:** which picture rhymes with "cat"?

**Grows into:** four choices, find the rhyming pair, odd one out, Rhyme Riddles (sound clue and meaning clue; school: make the riddle), Silly pairs (the rider that rhymes hops into the place; level 9, the preschool opening, offers two to choose from), Rhyme baskets (school: drag six pictures into three family baskets)

## Design notes

*After rhyming picture games and Dr. Seuss read-alouds.* 38 code-drawn word pictures in fifteen rhyme families (cat/hat/bat, star/car/jar, bear/pear/chair, bug/mug/rug, sock/clock/rock, snail/pail/whale, and so on); critters stand in for cat, dog, bear and duck, and a crowned bear is the king. Every question is said aloud with all its words, and a music-note button repeats it. Levels: which one rhymes with a word (three, then four choices), find the rhyming pair (tap one, then another), and the odd one out of three rhymes. Distractors come from other families, so exactly the intended answer rhymes (rule-tested). A non-rhyme is a gentle miss naming both words; two misses glow the answer. **Levels 5–7, Rhyme Riddles** ([definition](../definitions/rhyme-riddles.md); pre-K plays 1, 2, 3, 5; school 2–7): the pet gives two clues about one shelf picture, one by sound ("it rhymes with *bear*") and one by meaning ("you can sit on it"), and she taps the picture that fits both. Level 5 shows three pictures (the answer, a rhyming mate that fails the meaning clue, and a meaning trap that does not rhyme) with the sound clue first; level 6 gives the meaning clue first and adds a fourth decoy. Meaning facts come from a tag table in `logic.ts` (178 riddles, pinned by test; arguable fits such as a bug in the sky, a pet snail or soup from a mug never serve as the neutral or mate). A mate miss says "{word} rhymes with {sound}, but {fact}"; a trap or other picture says it does not rhyme; the first miss repeats both clues and the second glows the answer (one hint); replaying the clues is free. The right picture acts out its clue (a flyer floats, a ride drives, food or a seat squashes). **Level 7, Your turn** (school): the pet stars one picture and she builds its riddle from two sound chips (the picture's clue word and a decoy that rhymes with the meaning trap) and two meaning chips (code-drawn tag glyphs), then taps the pet's mouth Guess button. Level 7 never records a miss: an empty Guess is free, a working guess is the pet's turn to answer, and two non-working guesses glow the working chips (one hint). The tag table is generous (fish are food, a frog can be a pet). Co-play: ask the pet's riddle back. **Level 8, Silly pairs** (pre-K plays 1, 2, 3, 5, 8 with 8 second; school 2, 8, 3–7): a place picture (a truck, log, chair, hat, dish, jar, tree, spoon, cake, rug, pail or rock, scaled up) stands in the middle and three picture cards wait below, the rider that rhymes with the place plus one picture from each of two other families (twelve authored scenes, rule-tested: the distractors never rhyme with the place or each other, and no place repeats in a round). Four scenes make a round. Tapping the rhyming rider hops it in at the place's anchor, where it stays, and the place acts (the truck drives off and back on a road strip, the others squash-bounce) while the pet says "A duck in a truck! duck, truck. They rhyme!". A rider that does not rhyme hops in, the pet giggles ("Hee hee! A cat in a truck? cat and truck do not rhyme...") and it hops back: one miss; the second miss glows the rider (one hint). **Level 9, Silly pairs, two to choose** (the preschool opening; preschool plays 9 then 8, entry 9): level 8's scenes with two pictures, the rider and one non-rhyming picture, and three scenes a round; the pet says the place twice ("The truck… truck. Who rhymes with truck? The duck or the cat?"). Same accounting: a wrong picture is a miss, the second glows the rider (one hint). Rhyme Time is on Story Grove's preschool page. **Level 10, Rhyme baskets** (school only; school plays 2, 8, 3–7, 10): three woven baskets, each with a key picture on a badge, and six pictures (two from each of the three families, three-word families only, no family repeated across a round's two trays) wait in two rows below. She drags each picture (it says its word when picked up) to the nearest basket within 180 units. A wrong basket floats the picture home, is a miss and says "{word} does not rhyme with {key}"; the second miss on that picture glows its basket and the picture (one hint per picture). Dropping on the grass or tapping a basket (it says its key) is free. A right basket shrinks the picture in with "{key}, {word}! They rhyme!"; when the tray is empty each basket sings its family, and two trays make a round. Drags use `src/engine/drag.ts`.
