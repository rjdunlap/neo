# Word Glue, level 7: Name the new thing (definition)

Defined 2026-11-23 as slice VW3 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order), from its [audience row](../deep-dives/subjects/vocabulary-word-parts.md#what-people-can-do-and-an-answer-for-every-audience) for 9–12 ("an invented object (a hat for a snail) gets a name built from tiles, any order accepted that puts the thing last") and its [candidates row](../deep-dives/subjects/vocabulary-word-parts.md#candidates-and-fit) VW3. It extends the built game ([levels 1–3](word-glue.md), [levels 5–6](word-glue-5-6.md)) and keeps its art, shelf, speech pattern, tap input and accounting unless this page says otherwise. Docs only: nothing here is built.

**Numbering.** The study calls this rung "Word Glue 6" and its candidates row calls Suffix Workshop (VW4) "Word Glue 7–8". Levels 4 to 6 are taken (lap's *One big picture*, then *What kind of thing?* and *Which way round?*), so this rung is **level 7**, and Suffix Workshop takes the next free numbers, **8 and up**, when it is defined.

**Fun action and purpose.** A new thing nobody has a word for sits on the table: a hat with a star on it, and a little frog peeking out from under the brim. The pet says "A new kind of hat! What will you call it?" Four picture tiles wait below: the hat, the frog, a star and a spoon. She taps two, and they fly into two name slots in the order she tapped them. "Frog… hat… frog hat! A hat for a frog." The hat comes alive and goes up to the shelf. A *star hat* is right too, and so is a *spoon hat* ("That would be a hat for a spoon. What a funny name!"). A *hat frog* is not: "That would be a kind of frog. This is a kind of hat, so hat goes last."

The learning purpose is **coining a compound: the thing goes last, and the first part says something about it.** Level 5 asked her to *find* the part a made thing is; level 7 asks her to *use* that rule to make a name nobody has heard, the Berko-style coinage the study borrows from the wug test. The first part is her free choice, and the pet says what each choice tells you about the thing. Nothing is printed and nothing asks her to read.

## Identity and overlap

Rechecked 2026-11-23 against the catalog and `git log origin/main`: no island game asks her to build a name for a pictured thing. Word Glue levels 1–4 join two pictures into a known word; level 5 picks the head of a known word; level 6 picks between two known words from the same parts. Level 7 is the first rung that makes a word, so it belongs in Word Glue: the same compound talk, the same pictures, a new action. The level-1 ownership note holds: Clap the Syllables keeps a compound's beats, Opposites keeps un- and two meanings, Word Monsters keeps re-, -ing, -ed and -s, and Suffix Workshop (VW4) will add -er, -ful and -less here later.

## Bands and ladder

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 7 | **Name the new thing** | school | Which picture goes first and that the thing goes last | Four new things, four different heads |

**Bands:** school becomes **`{ min: 3, max: 7, order: [3, 5, 6, 7] }`**; the other bands are unchanged. Level 7 is school's top, for the study's "S top, U" (about 8 to 12; ages to 12 play `school`). The existing rule test that school's order leaves out lap's level 4 now also asserts the order ends `[…, 6, 7]`. A saved or pinned 7 carried into a younger band clamps to that band's top, as any level does.

## The new things (`INVENTIONS`)

Each new thing has a **head** (the thing it is, drawn largest and centred, and named in the ask), **two pictured first parts** (drawn smaller on it or with it, each with what the name says) and **one unpictured first part** (a tile that is not in the drawing, accepted too, with a "would be" meaning). The four tiles are the head and those three.

| Head | Pictured first part → name and meaning | Pictured first part → name and meaning | Unpictured first part → name and meaning |
| --- | --- | --- | --- |
| hat | frog → *frog hat*, a hat for a frog | star → *star hat*, a hat with a star on it | spoon → *spoon hat*, a hat for a spoon |
| boat | bee → *bee boat*, a boat for bees | cup → *cup boat*, a boat made from a cup | key → *key boat*, a boat for a key |
| chair | cake → *cake chair*, a chair made of cake | dog → *dog chair*, a chair for a dog | key → *key chair*, a chair for a key |
| tree | spoon → *spoon tree*, a tree that grows spoons | key → *key tree*, a tree that grows keys | star → *star tree*, a tree that grows stars |
| coat | shell → *shell coat*, a coat made of shells | bird → *bird coat*, a coat for a bird | jar → *jar coat*, a coat for a jar |
| car | duck → *duck car*, a car for a duck | bell → *bell car*, a car with a bell on top | hat → *hat car*, a car for a hat |

**Why these.** Every tile is a picture the game already draws (`partArt`, or Rhyme Time's shared pictures: hat, frog, star, spoon, key, chair, tree, coat, car, duck, bell, shell, jar, cake, dog, bee, bird, cup, boat), so no new tile art is needed. Each head is a different everyday thing, so a round of four never repeats the rule on the same word.

**Invented means invented.** None of the twelve ordered names each new thing's four tiles can make (spaced or joined) may be a word in `COMPOUNDS`, `PAIRS`, `DENY` or `OPAQUE`, and none may be a set phrase a child might know. This session's read of all 72 ordered names (as of 2026-11-23) made these swaps:
- *Car* was dropped beside the coat (`carcoat` is in `DENY`; a car coat is a real coat).
- *Car* was dropped beside the tree (*car key* would be buildable from the tree's tiles).
- *Frog*, *duck*, *bell* and *hat* were left out of the tree (*tree frog*, *tree duck*, *bell tree*, *hat tree*).
- *Bell* was dropped beside the chair (`dogbell` is in `DENY`).
- *Moon* and *shell* were left out of the chair (*moon chair* and *shell chair* are furniture names).
- *Bee* was left out of the hat (`beehat` is in `DENY`).

The build session rereads the table. It swaps any name it finds to be a set phrase for another drawn picture, and records the swap on this page.

**Why separate from `COMPOUNDS` and `PAIRS`.** `makes` and `distractorsFor` read `COMPOUNDS`, so new parts there would become level-2 distractors and need a fresh deny-list enumeration. `PAIRS` is level 6's two-way table. `INVENTIONS` is its own table and touches neither.

## The round and the screen

- **Round.** Four of the six new things, one ask each, in seeded order, four different heads. Each ask's four tiles are in seeded order, and **across the four asks the head sits in each of the four tile places exactly once**, so neither the place nor a habit answers. The first round of a session is authored: hat (head in the third place), boat (first), tree (fourth), car (second).
- **Screen, top to bottom:** the shelf; the new thing at made size (`MADE`, 210); two name slots side by side at card size (`CARD`, 150), with a small glue dot between them; the four tiles at card size. Laid out by a new `nameLayout(view)`, returning `{ thing, slots: [Pt, Pt], tiles: Pt[] }`:
  - **Upright phone (768 × 1024 logical):** one row of four tiles (4 × 150 plus three gaps of 24 is 672 of 768).
  - **Landscape:** the same stack if it fits under the shelf and above the guide's corner. Otherwise the thing and the slots on the left and the tiles two by two on the right.
- **Size and clearance:** every tile and slot at least 140 units, with no overlap, inside `view`, and clear of Home, the guide's corner and the shelf row, in the four lands-test views and the upright views of `src/games/upright-batch-6.test.ts`. If a view cannot fit the stack with captions showing, the layout takes the two-column form there and never shrinks a tile.

## Naming, feedback and help

- **Hearing is free.** Touch-down on a tile lifts it and speaks its word; sliding off before release does nothing else. Tapping the new thing says the ask again.
- **Placing.** A tap (`onTap`) on a tile flies it into the first empty slot, left then right, so the order she taps is the order of the name. A tap on a filled slot sends its tile back to its place, free.
- **The name is judged when the second slot fills.** The pet's line starts with the name she built, said part by part with a pause as in `wordglue.join` ("Frog… hat… frog hat!"), and goes on to say what it means:
  - **Right:** any first part, then the head. Pictured: "Frog… hat… frog hat! A hat for a frog." Unpictured: "Spoon… hat… spoon hat! That would be a hat for a spoon. What a funny name!" The tiles hop into the thing with the pentatonic pop, it comes alive and goes to the shelf.
  - **Thing first** (the head, then a first part): "Hat… frog… hat frog? That would be a kind of frog. This is a kind of hat, so hat goes last."
  - **Thing left out** (two first parts): "That name leaves out the hat. This is a kind of hat."

  After a wrong name, the tiles wobble back to their places with the soft boing, and the ask stands.
- **Misses.** A wrong name is one miss the first time that ordered name is built on this ask. Building it again replays its line, free. The distinct-wrong set needs an **ordered key** ("hat frog" is not "frog hat"), not level 2's sorted `pairKey`.
- **Hints.** After two distinct wrong names, the head tile and the right-hand slot glow and `hints++`, once per ask. **Show a hint** does the same, still once per ask, and says "This is a kind of hat, so hat goes last. Any picture can go first." A wrong name after the glow and two earlier wrong names is the supported finish: the head flies to the right-hand slot and the first pictured part to the left, the pet says that name's right line, and nothing more is counted.
- **Why a wrong order is a miss here.** The first part is free, so a free creative choice is never judged. What is judged is the one rule this level teaches and level 5 already showed: the name says what the thing is at its end. The explanation says which kind of thing her name would make, so the miss teaches.
- **Never a miss:** hearing a tile, sending a tile back from a slot, tapping the thing, taps while a line plays or a thing flies, and the choice among the three first parts.
- **Finish.** After the fourth thing the shelf's four things all play their animations, then `ctx.finish({ misses, hints })`; one sticker from the shell, with or without help. Nothing is kept or filed.
- **Adaptation:** the ordinary rule. A smooth round (at most one miss in four asks) shows she put the thing last on four new names in this toy with spoken words. It does not show that she coins compounds in speech.

## Art (`src/games/word-glue/art.ts`, palette colours)

Six new made drawings in `madeArt`, built from the existing part and shared pictures. In each one the head is the largest shape and centred, and its two pictured first parts are smaller and plainly on it or with it:

| Thing | Drawing | Comes alive |
| --- | --- | --- |
| hat | a big hat with a star badge, a small frog peeking from under the brim | the frog lifts the hat and blinks |
| boat | a boat whose hull is a blue cup with its handle at the stern, two bees riding | bobs; the bees loop round the sail |
| chair | a chair in sponge-and-frosting layers with a cherry, a small dog curled on the seat | the dog wags; a crumb drops |
| tree | a tree hung with spoons and keys | sways; the spoons and keys tinkle on pentatonic notes |
| coat | a coat covered in shells, a bird peeking from its pocket | the bird pops up and flaps |
| car | a car with a bell on its roof, a duck at the wheel | rolls a little; the bell rings a pentatonic note |

The unpictured first parts (spoon, key, star, jar, hat) are never drawn on the thing. A capture strip of the six drawings at made size and shelf size is the build's legibility check: the head must still read as the thing at the shelf's 84 units.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

- **Model.**
  - `NAME_LEVEL = 7`. `PLANS` gains `{ level: 7, name: 'Name the new thing: tap two pictures to name an invented thing, the thing last (4 things)' }`.
  - `INVENTIONS` holds `{ head, parts: [{ part, meaning, pictured }] × 3 }`.
  - An `Ask` at level 7 carries its invention and its four tile keys in screen order.
  - `GlueState` gains `slots: string[]` (at most two). `restartState` and `advance` clear it.
- **Functions.**
  - `place(s, key)` fills the next slot and, on the second, judges.
  - `unplace(s, slot)` sends a tile back and counts nothing.
  - `judgeName(head, a, b)` returns `right | thingFirst | thingMissing`.
  - `applyHint` and `hintFor` at level 7 return the head and the first pictured part.
- **Round, over 500 seeds:** four asks, four distinct heads from `INVENTIONS`; each ask's tiles are its head and three first parts; the head occupies each tile place once across the round; the authored round matches.
- **Names:** for every invention, the three first-part-then-head names are `right`, the three head-then-first-part names are `thingFirst`, and the six names of two first parts are `thingMissing`.
- **Table:** every tile key is drawable (`partArt` or the shared set); every meaning is a non-empty string with no hyphen or bare affix; no buildable ordered name, spaced or joined, is in `COMPOUNDS`, `PAIRS`, `DENY` or `OPAQUE`; exactly two first parts per invention are pictured.
- **Accounting:** a scripted ask (hat frog, hat frog again, frog star, Show a hint, spoon frog) counts two misses and one hint, and ends with the supported answer. Show a hint before any miss counts one hint, and a later hint request on the same ask counts nothing. `unplace` never changes misses or hints.
- **Bands:** school's order is `[3, 5, 6, 7]` without 4.
- **Layout:** `nameLayout` at the four lands-test views and the upright views passes the size and clearance rules above. `upright-batch-6.test.ts` gains level 7.
- **Voice coverage:** every buildable name of every invention has a line, and every tile key has a word line.

## Speech, how-to, ghost and registration

**Voice lines** (`voice.ts`). Slotted variants are never rendered as clips, so every line is written out per thing, generated from `INVENTIONS` as level 6's are from `PAIRS`. Clips are keyed by text, so a line whose text already exists reuses its clip.

| Line id | Text, for the hat | Count |
| --- | --- | --- |
| `wordglue.instruct.name` | "Tap two pictures to give the new thing a name." (`ctx.instruct`) | 1 |
| `wordglue.name.<head>.ask` | "A new kind of hat! What will you call it?" | 6 |
| `wordglue.name.<head>.right.<part>`, pictured part | "Frog… hat… frog hat! A hat for a frog." | 12 |
| `wordglue.name.<head>.right.<part>`, unpictured part | "Spoon… hat… spoon hat! That would be a hat for a spoon. What a funny name!" | 6 |
| `wordglue.name.<head>.first.<part>` | "Hat… frog… hat frog? That would be a kind of frog. This is a kind of hat, so hat goes last." | 18 |
| `wordglue.name.<head>.missing` | "That name leaves out the hat. This is a kind of hat." | 6 |
| `wordglue.name.<head>.hint` | "This is a kind of hat, so hat goes last. Any picture can go first." | 6 |
| `wordglue.tile.<key>` | "Frog!" (one per tile key) | 19 |

The voice-clip build renders them, and the page says device speech of the invented two-word names is unchecked on a real phone.

**How-to card** (`howto.ts`), all `{ from: 7, to: 7 }`:
- Step: "Tap two pictures to name the new thing. The one you tap first goes first."
- Step: "Tap a picture in the name to send it back."
- Finish: "Four new things have names and have gone to the shelf."
- Note: "Any picture can go first, even one that is not in the drawing: a frog hat, a star hat or a spoon hat is still a hat. In English the thing goes last, so a name with the thing first, or without it, is one miss, and the pet says what that name would mean."
- Note: "After two misses the thing's picture and the last slot glow, which counts as a hint."

**Ghost finger:** `autotouch()` puts the first pictured part, then the head. On a demonstration's first ask it first touches the head tile and slides off (free, so hearing a word is shown), and if a slot holds a wrong tile it taps that slot to send it back.

**Registration:** `describeLevel` gains the plan name; skills, land, icon and sticker are unchanged. `npm run game-docs` regenerates the page's tables, and the game page's *Grows into* line names level 7.

**Co-play:** *Silly Compounds* on screen: take turns choosing the first part for each new thing and say what your name means. **Off-screen** unchanged.

## Build batch

**Batch `word-glue 4`: level 7.** It builds:
- the `INVENTIONS` table and its rule tests;
- the tap-to-slot interaction, `nameLayout` and the six drawings;
- speech, how-to, the ghost finger and the school band order.

## Check tier

New interaction tier:
- typecheck and unit tests (rule, layout, upright, registry, lands, how-to and voice-clip tests);
- one filtered `wordglue` play on an upright phone at level 7, with one thing-first name, the same name again (no new miss), one Show a hint and an unpictured first part accepted;
- one upright screenshot mid-ask with a tile in a slot;
- `fingerdemo` at level 7;
- `npm run build`, because voice lines and art change;
- a capture strip of the six new drawings.

Speech of the invented names on a real phone, and whether a child hears "the thing goes last" as a rule rather than a habit, are not established by browser automation.

## Open decisions

None block the build. Defaults taken on the study's lean:
- any first part is accepted, as the study and RECOMMENDATIONS say ("any name that puts the thing last is accepted");
- the level is English-only, and the how-to note says the thing goes last in English (study decision 3);
- the head is named in the ask, so the decision is the order and the first part, not guessing what the drawing is.

## Source check

Nothing new was opened for this packet. The study's sources stand as it recorded them: CCSS L.2.4.d (opened), Berko 1958 and Clark 1993 (recalled). The invented names and meanings are game content, read for set phrases by this session as above. Completing a round shows that she put the thing last in four spoken names here. It is not evidence about her morphological awareness or reading.
