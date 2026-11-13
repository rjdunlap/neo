# Photo Safari

<!-- generated: from src/games/photo-safari; edit the text below the end mark (npm run game-docs) -->

**ID:** `photo-safari` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** vocabulary, verbs, positions, listening

| Band | Levels, easiest first |
| --- | --- |
| lap | 13, 1, 2 |
| toddler | 1, 2, 12 |
| preschool | 2–4 |
| pre-K | 3–5 |
| school | 4, 5, 6, 7, 8, 9, 10, 11 |

| Level | Plays like |
| --- | --- |
| 1 | Tap any animal to take its photo |
| 2 | Photograph the animal named: "the pig" |
| 3 | Action words: "the bunny jumping" |
| 4 | Place words: "the duck under the tree" |
| 5 | Both: "the cat sleeping behind the bush" |
| 6 | Not: "the animal that is not sleeping" |
| 7 | Two clues, no name: combine what an animal is doing and where it is |
| 8 | What changed? Photograph the meadow, then find the friend doing something new or in a new place |
| 9 | Is it true? Photograph the animal named, then thumbs up or down: does the photo show what was said? |
| 10 | Tell me which: tap the one picture word only the sparkly animal has, then Tell |
| 11 | Tell me both: every picture word fits two, so tell a doing word and a place word together |
| 12 | Doing words only: "Who is sleeping?" |
| 13 | One big friend: a touch anywhere takes its photo, and the next friend walks in (6 photos) |

<!-- end generated -->

**Starts as:** lap opens with one big friend in an open meadow: a touch anywhere takes its photo and the next friend walks in; toddlers start by tapping any of three animals to take its photo

**Grows into:** photograph the animal named, then "the bunny jumping", "the duck under the tree", and both (two fit each clue alone), then "the animal that is not sleeping" and school two-clue action/place requests without a name; school 10–11 let her tell the pet with spoken picture-word chips (one unique clue, then an action/place pair); school 8–9 compare a pinned meadow photo (What changed?) and judge a spoken claim with thumbs (Is it true?); toddlers get an action-only Who is sleeping? entry; waving and pond-only swimming join the action words

## Design notes

**Level 13, One big friend (lap's opening, built 2026-11-13, PR #1614).** Appended as level 13 and first in lap's order `[13, 1, 2]`; it is an entry level, so a saved 13 carried into toddler starts at toddler's own level 1, and no saved level or pin is renumbered. One big friend (about 230 units on its short side) stands in the middle of an open meadow with no places drawn. A layer over the whole meadow takes every touch: a touch anywhere takes its photo, the polaroid flies to the album, and the next friend walks in from the side, until six different friends fill the album. It is a snap plan with a big flag, so every touch is right, it asks once and skips praise, and nothing can be a miss or a hint. Between photos a touch hops the friend instead of being dropped. The click never holds the next friend, and the last click is heard out. The ghost finger touches the grass beside the friend.

*After Pokémon Snap.* Animals are busy around the island; tap one to photograph it. Requests grow from the animal's name to what it is doing ("jumping") and where it is ("under the tree"), then both. At level 5 all three animals are the same kind: one distractor shares the target's action and another its place, so both clues are needed. Exactly one animal matches each request. Level 2 (finding a named animal) is open to lap play as a naming game. Level 6 (not): "the animal that is not sleeping": everyone else is doing the same thing, and only the asked-for animal is doing something different. A wrong photo says what that animal *is* doing ("that is the cat sleeping"). School level 7 (Two clues, no name) asks for an action and place without naming the animal. Four animals share two places: two fit each clue alone and exactly one fits both. A wrong photo names the animal, action and place; two misses glow the answer and count one hint. Nearest body-centre taps resolve overlapping forgiving targets; four successful photos open the album and finish one round. School follows IDs 4–11 and younger ranges stay unchanged except the toddler entry below. At 8 (What changed?), the first tap (the big camera button or any animal, never a miss) photographs the whole meadow and pins the photo top-centre; puffs hide everyone and one friend changes one thing, its action in the first two photos and its place (to the one empty spot; a pond swimmer never moves) in the next two. A wrong pick says what is still the same as in her photo; two misses glow the answer (one hint); the right pick files a polaroid and says what changed. At 9 (Is it true?, school only), the pet makes a claim ("the duck is sleeping in the pond"); she photographs the named animal (a wrong animal is a miss), the photo is held up big, and she presses thumbs-up or thumbs-down. Each round has two true and two false claims in seeded order; a false claim differs in one sensible attribute. A wrong thumb is a miss and pulses the photo; two glow the right thumb (one hint); animals ignore taps while she judges. Toddler entry 12 (Who is sleeping?, order 1, 2, 12) shows three different friends doing different toddler actions (sleeping, eating, jumping, dancing) and names only the doing word; a wrong photo names what it caught. At 10 (Tell me which), a friend wants the sparkly animal’s photo: she selects spoken action/place picture words and presses Tell, with one unique chip enough among three animals. At 11 (Tell me both), four animals form a 2×2, so both words are necessary. The camera follows her words: two fits wobble with “Which one?”, one wrong fit gets a wrong photo, none gets a sweep. Each non-empty failed Tell is one miss; chips stay for revision. Two misses clear contradictory chips and glow unchosen solver words (one hint). Empty Tell, chip changes and animal taps are free; extra truthful words are accepted. Four right descriptions fill the album. Each action in a successful photo—jumping, sleeping, eating, dancing, waving or swimming—files its action-word observation in the discovery journal. Waving has a moving raised paw; swimming has bobbing, paddling ripples and water over the feet, only at the pond. Levels 5, 7, 10 and 11 omit swimming because repeating a pond-only action at two distinct places would break clue fairness.

**A photo never holds the next scene (U7 fix batch 20, 2026-11-12).** At levels 2–8 and 10–12 the right photo's click starts with the polaroid and the next scene follows it at once, praise dropped; level 8's change line and tell mode's thanks are chained after the click and stop only when an ask is said or another photo's lines start. The scene's ask waits for the lines, is said by the guide, and is said in place of a miss at a wrong snap, a first chip, a tell press or an animal tap, so a wrong tap before she has heard it is not a miss. Level 9's true or false plays over the album tween and the next scene. The last photo's lines are heard out. The ghost finger waits for an ask.
