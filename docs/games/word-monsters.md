# Word Monsters

<!-- generated: from src/games/word-monsters; edit the text below the end mark (npm run game-docs) -->

**ID:** `word-monsters` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** letter-sounds, phonics, vocabulary

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–5 |
| pre-K | 3–6 |
| school | 5–8 |

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

<!-- end generated -->

**Starts as:** tap letter monsters to hear their sounds

**Grows into:** find a letter by name, then by its sound, first sounds, build three-letter words, word families (hat, cat, bat), then change the end (cat, cap, can)

## Design notes

*After Endless Alphabet and Reader Rabbit.* Every letter is a little monster that says its sound. Tap to hear them, find a letter by name, then by its sound, match first sounds ("apple starts with aah"), then drag letters into slots to build three-letter words: level 5 shows the letters, and level 6 gives sounds alone with a spare letter. Lookalike letters are never neighbors. The sounds come from device speech (`sound.a`…`sound.z`), which approximates phonics sounds at best: they are stand-ins until checked on the iPad. Level 7 (word families): the ending (at, og, ig, un, op) already stands in the last two slots as monsters, and the child drags the first sound in to make hat, then cat, then bat. Most other choices are the same family's first sounds, so hearing decides it. Two families of three words per round. The "sun" picture (a big S) is hidden here so it doesn't give the answer away.

Level 8 (school): keep the first two sounds in place and change the last sound to make the pictured word: *cat*, *cap* or *can*. Each spare ending makes no other word in that round. The word is spoken, the three letters sound out when placed, and it comes alive. The device speech is still only a stand-in for phonics and needs an iPad check.
