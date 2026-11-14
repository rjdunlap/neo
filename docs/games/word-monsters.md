# Word Monsters

<!-- generated: from src/games/word-monsters; edit the text below the end mark (npm run game-docs) -->

**ID:** `word-monsters` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** letter-sounds, phonics, vocabulary

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1 |
| toddler | 1–2 |
| preschool | 2–5 |
| pre-K | 3–6 |
| school | 5, 6, 7, 8, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Tap letter monsters to hear their sounds |
| 2 | Find a letter by name: "find B" |
| 3 | Find a letter by its sound: "who says mmm?" |
| 4 | First sounds: "apple starts with aah" |
| 5 | Build a three-letter word with letters shown in the slots |
| 6 | Build a three-letter word from its sounds, with a spare letter |
| 7 | Word families: change the first sound to make hat, cat, bat (two families) |
| 8 | Change the end: keep the first two sounds and make cat, cap, can |
| 9 | One big monster: a touch anywhere makes it say its sound, its picture stays, and the next monster wakes (6 monsters) |
| 10 | Last sounds: "what does cat end with?" Tap the monster for the last sound |

<!-- end generated -->

**Starts as:** tap letter monsters to hear their sounds (lap opens one step earlier, on one big monster)

**Grows into:** find a letter by name, then by its sound, first sounds, build three-letter words, word families (hat, cat, bat), then change the end (cat, cap, can), then the last sound of a word ("what does cat end with?")

## Design notes

*After Endless Alphabet and Reader Rabbit.* Every letter is a little monster that says its sound. Tap to hear them, find a letter by name, then by its sound, match first sounds ("apple starts with aah"), then drag letters into slots to build three-letter words: level 5 shows the letters, and level 6 gives sounds alone with a spare letter. Lookalike letters are never neighbors. The sounds come from device speech (`sound.a`…`sound.z`), which approximates phonics sounds at best: they are stand-ins until checked on the iPad. Level 7 (word families): the ending (at, og, ig, un, op, en, et, ug) already stands in the last two slots as monsters, and the child drags the first sound in to make hat, then cat, then bat. Most other choices are the same family's first sounds, so hearing decides it. Two families of three words per round; every family word has a drawn picture, the sun included. Levels 5–6 draw from 19 words, three or four per short vowel (a, e, i, o, u), and every picture lives in `pictures.ts`. `bed` and `lip` are left out on purpose (b/d and i/l lookalikes).

Level 8 (school): keep the first two sounds in place and change the last sound to make the pictured word: *cat*, *cap* or *can*. Each spare ending makes no other word in that round. The word is spoken, the three letters sound out when placed, and it comes alive. The device speech is still only a stand-in for phonics and needs an iPad check.

**Level 9, One big monster (lap's first, 2026-11-13).** One big monster (about 340 units across, wearing its letter, "Aa") stands in the middle; a layer over the whole screen takes every touch. A touch anywhere makes it say its sound, and its first-word picture (never named aloud) pops out above it and flies to a shelf along the top, where it stays; the monster steps aside and the next wakes. Six different letters, each with a first-word picture; a touch between monsters only wiggles the one on screen. The sound never holds the next monster (about 1.5 s); the last sound is heard out before the closing line. Nothing can be a miss or a hint. Lap's order is `[9, 1]` and the level is an entry level, so a saved 9 carried into toddler starts at toddler's level 1. The ghost finger touches the grass beside the monster.

**A sound never holds the next question (U7 fix batch 19, 2026-11-12).** At levels 2–4 the right monster's sound starts (the praise is dropped) and the next question's monsters come after the existing beat; its ask waits for the sound, is said by the guide, and is dropped at a right tap, and a wrong tap before she has heard it is not a miss (the ask is said instead). The last sound and praise are heard out; the blend lesson at levels 5–8 is unchanged. The ghost finger waits for an ask.
