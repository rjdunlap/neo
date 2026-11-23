# Word Glue, levels 5–6 (definition)

**Status: ready to build in two batches, no review gate.** Defined 2026-11-22 as slice VW2 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order), from its [ladder rows](../deep-dives/subjects/vocabulary-word-parts.md#a-first-games-ladder-word-glue) 4 (*What kind of thing?*) and 5 (*Which way round?*) and its [candidates row](../deep-dives/subjects/vocabulary-word-parts.md#candidates-and-fit) VW2. The study's slice line said "after a child has played level 3"; the developer admitted Word Glue 4–5 for definition on the study's lean without waiting for play on [2026-11-17](../archive/DECISIONS-2026-11-17.md#games). It extends the built game ([levels 1–3 definition](word-glue.md), PR #937) and keeps its compound table, art, shelf, speech pattern and accounting unless this page says otherwise.

**Numbering.** The study, the decision record and the READY line call these rungs "levels 4–5". Level 4 is now lap's *One big picture* (built 2026-11-13, an entry level in lap's order `[4, 1]`), so the two rungs take the next free numbers: **level 5, *What kind of thing?*** and **level 6, *Which way round?*** Every mention below uses 5 and 6.

**Fun action and purpose.** Level 5: a made thing sits on the table and comes alive (a doghouse, its dog curled up inside), with its two parts below it. The pet asks "Is a doghouse a dog or a house?" and she taps the part it *is*: the house hops into the doghouse and the pet says "Yes! A doghouse is a house, a house for a dog." The learning purpose is **the last part names the thing** (English compounds are head-final; CCSS L.2.4.d, "use knowledge of the meaning of individual words to predict the meaning of compound words"). Level 6: two drawings built from the same two parts, a houseboat bobbing on the water and a boathouse with a boat inside its open door. "Which is the houseboat?" She taps it; it comes alive, and the pet names both. The purpose is **the order of the same two parts changes the thing**, which is level 5's rule used to tell two real words apart. Nothing is printed and neither level asks her to read.

## Identity and overlap

Rechecked 2026-11-22 against the catalog and `git log origin/main`: no island game asks which part of a word names the thing or contrasts two orders of the same parts. Both rungs stay in Word Glue because the object of study is the same compound table and the same "parts make the whole" talk; only the action changes from joining to choosing. The level-1 definition's ownership holds: Clap the Syllables keeps a compound's beats, Opposites keeps un- and two meanings, Word Monsters keeps re-, -ing, -ed and -s.

## Bands and ladder

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 5 | **What kind of thing?** | school | Which of the two parts the made thing is | Five asks, five different heads |
| 6 | **Which way round?** | school | Which of two drawings from the same parts is the asked word | Four asks, one per pair |

**Bands:** lap `{ min: 1, max: 4, order: [4, 1] }` and toddler to pre-K unchanged; school becomes **`{ min: 3, max: 6, order: [3, 5, 6] }`**. A bare `min: 3, max: 6` would put lap's big-picture level 4 into school's ladder, so the order is required. Level 4 stays in `entryLevels`, so a saved or pinned 4 carried into school lands on 3 (`landing` in `src/progress/difficulty.ts`), and a saved 5 or 6 carried into a younger band clamps to that band's top as any level does. A rule test asserts 4 is not in school's order.

## Level 5, What kind of thing?

- **Entries.** The compound table gains a level tag `5` on the entries whose two parts are both countable nouns, so "a ___ or a ___" is always grammatical: sunflower, cupcake, doghouse, toothbrush, beehive, sailboat, birdhouse, dollhouse, toybox. Raincoat, mailbox, sandbox, hairbrush and paintbrush are left out ("a rain", "a mail", "a sand", "a hair", "a paint"). **No new compound and no new drawing**: every part and made thing is already drawn.
- **Round.** Five asks with five different heads (second parts: flower, cake, house, brush, hive, boat, box give seven to draw from). The first round of a session is authored: doghouse, sunflower, toothbrush, cupcake, sailboat.
- **Screen.** The made thing at the top of the table at its made size (`MADE`, 210), playing its comes-alive animation once when asked; its two parts below it at card size (`CARD`, 150), side by side in landscape and side by side or stacked in an upright phone view, laid out by a new `kindLayout(view)`. Every part at least 140 units, clear of Home and the guide corner, in the four views the lands test uses.
- **No pattern shortcut.** The right part is always the second part of the word, so neither the screen nor the speech may give that away. Per ask, the seed picks **which side** the right part sits on and **which part the question says first** ("a dog or a house?" or "a house or a dog?") independently. Per round, the right part is on the first side in two or three of five asks, and is said first in two or three of five. Only listening to the word's last part answers every ask.
- **Action.** A tap (`onTap`), not a drag. Touch-down lifts the part and speaks its word. A right tap: the part hops into the made thing with the pentatonic pop, the pet says the right line, and the made thing goes to the shelf.
- **A wrong tap:** the part wobbles back with the soft boing and the pet says what the thing is: "A doghouse isn't a dog. It's a house: a house for a dog." The line uses the entry's existing `meaning`, so beehive reads "It's a hive: a home for bees." The question is then asked again.

## Level 6, Which way round?

- **The pair table (`PAIRS`, separate from `COMPOUNDS`).** Each row is two real words made of the same two parts in opposite orders, both concrete, both drawable as different things, both stressed on the first part. Words are spoken as written; open compounds (two written words) are allowed here because nothing is printed and the point is the order, not the spelling.

| Pair | Word | Meaning | Comes alive | Reversed word | Meaning | Comes alive |
| --- | --- | --- | --- | --- | --- | --- |
| house, boat | houseboat | a boat you can live in | bobs; smoke puffs from its chimney | boathouse | a house for boats | its door swings open on the boat inside |
| pan, cake | pancake | a flat cake you cook in a pan | flips and lands | cake pan | a pan for baking a cake | a cake rises in it |
| race, horse | racehorse | a horse that runs in races | tosses its mane, wearing a number cloth | horse race | a race for horses | two horses gallop past a finish flag |
| sled, dog | sled dog | a dog that pulls a sled | shakes in its harness | dog sled | a sled that dogs pull | slides a little way on the snow, empty |

  Regional words: *cake pan* (UK *cake tin*) and *dog sled* (UK *dog sledge*) are flagged as US, as the level-1 table flagged its regional words. Left out: *house dog / doghouse* (a house dog drawn indoors reads as a doghouse), *chocolate milk / milk chocolate* (stressed on the second part, so not the same pattern), *box lunch / lunchbox* (rare outside the US), *racecar / car race* (car is a level-2 distractor; kept out to avoid new joins).
- **Why separate from `COMPOUNDS`.** `makes(a, b)` finds an entry in either drag order and returns the first match, which levels 1–3 rely on; with both orders in one table it would always return the first. `distractorsFor` draws level 2's distractors from every table part, so new parts (pan, race, horse, sled) added to `COMPOUNDS` would become level-2 distractors and need a fresh deny-list enumeration. Keeping level 6's words in `PAIRS` leaves both untouched. *Houseboat*, *boathouse* and *pancake* stay in `DENY`: they must still never be makeable from level-2 pictures (house, boat, cake are level-2 parts), and the table test "no `COMPOUNDS` entry is in `DENY`" does not read `PAIRS`.
- **Round.** All four pairs, one ask each, in seeded order. Exactly two asks ask the first-listed word (houseboat, pancake, racehorse, sled dog) and two the reversed word, so both orders appear; the right drawing is on the first side in exactly two. The first round of a session is authored: houseboat (right drawing on the second side), cake pan (first side), dog sled (first side), racehorse (second side).
- **Screen.** The two drawings at made size (210), side by side in landscape and stacked in an upright phone view, by `tableLayout(view, 2)` or a sibling if the upright spacing needs it; every drawing at least 140 units with no overlap. The asking pet stays in its corner.
- **Action.** A tap on a drawing. Touch-down lifts it and speaks its word, which is free: hearing both names is how she checks. A right tap: the drawing comes alive and the pet says "Houseboat: a boat you can live in. And that one is a boathouse!"; then both go to the shelf. A wrong tap: the drawing wobbles with the boing and the pet says what it is: "That's a boathouse, a house for boats. Which is the houseboat?"
- **Art (`src/games/word-glue/art.ts`, colours from `src/art/palette.ts`).** Eight new made drawings with their short animations: houseboat and boathouse reuse the existing `house()` and boat drawings; racehorse and horse race reuse the critter horse (`CRITTERS.horse`); sled dog reuses the dog; pancake, cake pan and dog sled are new shapes (a pan, a sled). No part picture is drawn on screen at this level. Each pair's two drawings must differ in what the big thing is (a boat vs a house, a flat cake vs a pan, one horse vs a race, a dog vs a sled), and a capture strip of all eight is the build's legibility check.

## Accounting, help and finishing

The same for levels 5 and 6, and the same shape as levels 2–3 adapted to a two-way choice:

- **A miss** is a wrong tap, each one counted, up to two per ask (with two choices the per-distinct-pair rule of level 2 would cap a guess at one miss). **After two misses on one ask** the right picture glows and `hints++`, once per ask; Show a hint does the same, still once per ask. A third wrong tap after the glow plays the right answer with no further count (the supported finish).
- **Never a miss:** touching a picture to hear its word (a touch-down that is not released on it), tapping the made thing (level 5) to hear the question again, taps during a join or a spoken line.
- **Finish:** after the last ask the shelf's things all play their animations, then `ctx.finish({ misses, hints })`; one sticker from the shell, with or without help. Nothing is kept or filed.
- **Adaptation:** the ordinary rule. A smooth round (at most one miss in five or four asks) is unlikely from guessing (a coin flip averages 2.5 misses in five), but it shows only that she used word order in this toy with spoken words, not that she reads compounds.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

- **Model.** `PLANS` gains levels 5 and 6. `COMPOUNDS` entries gain `5` in `levels` as listed; `PAIRS` holds `{ parts: [a, b], word, meaning, reversed, reversedMeaning }`. `makeRound(5 | 6, rng, authored)` builds the asks; an `Ask` carries the right key, the two choice keys in screen order and, at level 5, which part is said first. `check` and `hintFor` take a tapped key at these levels; `makes` and `distractorsFor` are unchanged.
- **Level 5, over 500 seeds:** five asks, five distinct heads, every entry tagged 5; both parts countable (the tagged list matches this page); the right side is first in two or three asks and said first in two or three; the authored round matches.
- **Level 6, over 500 seeds:** four asks, the four pairs once each; exactly two first-listed asks; right drawing first in exactly two; for each pair `word` is the parts joined in one order and `reversed` the other, with spaces removed; the authored round matches.
- **Tables:** every level-5 entry and every `PAIRS` word and meaning is a non-empty string with no hyphen or bare affix; every `PAIRS` word has a drawing key; no `PAIRS` word is in `OPAQUE`.
- **Bands:** school's order is `[3, 5, 6]` and does not contain 4; `landing(4, school range, [4])` is 3.
- **Accounting:** a scripted ask (wrong, wrong, Show a hint, wrong) counts two misses, one hint, and ends with the supported answer; Show a hint before any miss counts one hint and a later hint request on the same ask counts nothing.
- **Layout:** `kindLayout` and the level-6 layout at the four views: every picture at least 140 units, no overlap, Home and guide corners clear, everything inside `view`; the upright tests (`upright-batch-6.test.ts`) gain both levels.

## Speech, how-to, ghost and registration

- **Voice lines** (`voice.ts`, `wordglue.*`, whole words only): `instruct.kind` ("Is a {word} a {a} or a {b}?"), `kind.right` ("Yes! A {word} is a {second}: {meaning}."), `kind.wrong` ("A {word} isn't a {first}. It's a {second}: {meaning}."), `instruct.which` ("Which is the {word}?"), `which.right` ("{Word}: {meaning}. And that one is {other}!", with the article "a" for the countable reversed words), `which.wrong` ("That's {made}, {meaning}. Which is the {word}?"). Device speech must say *cake pan*, *horse race*, *sled dog* and *dog sled* as two words with stress on the first; the voice-clip build covers them.
- **How-to card** (`howto.ts`): steps "Listen to the question, then tap the part the thing really is" `{ from: 5, to: 5 }` and "Two things from the same parts: tap the one the pet asks for" `{ from: 6, to: 6 }`; finish "Every question is answered and its thing has come alive" `{ from: 5, to: 6 }`; notes "In English the last part names the thing: a doghouse is a house. Many languages put it first, so these two levels are English-only" `{ from: 5, to: 6 }` and "A wrong tap is one miss and the pet says what the thing is; after two misses the right picture glows, which counts as a hint" `{ from: 5, to: 6 }`.
- **Ghost finger:** `autotouch()` taps the hint picture at levels 5 and 6; at level 6 it touches the wrong drawing first (touch-down and slide off, free) to show that hearing a name is free.
- **Registration:** `describeLevel` gains both names; skills unchanged; land, icon and sticker unchanged. `npm run game-docs` regenerates the page's tables.
- **Co-play:** *Which way round?* at home: say "a house boat or a boat house?" and draw both. **Off-screen** unchanged.

## Build batches

1. **Batch `word-glue 2`: level 5** (no new art; the tap interaction, `kindLayout`, the school band order, speech, how-to, bot and tests).
2. **Batch `word-glue 3`: level 6**, after batch 2 (the `PAIRS` table, eight drawings, speech, how-to, bot and tests).

## Check tier

Each batch is the new-interaction tier: typecheck and unit tests (rule, layout, upright, registry, lands, how-to and voice-clip tests); one filtered `wordglue` play on an upright phone at the batch's level with one wrong tap and one hint; one upright screenshot; `fingerdemo` at the level; `npm run build`, because voice lines and art change. Batch 3 adds a capture strip of the eight new drawings. Speech of the two-word compounds on a real phone, and whether a child hears the last part as the thing, are not established by browser automation.

## Open decisions

None block the build. Defaults taken on the study's lean: the two rungs are English-only and say so on the how-to card (study decision 3); US words *cake pan* and *dog sled* are used and flagged; level 5 uses only countable-part entries rather than adding articles per part.
