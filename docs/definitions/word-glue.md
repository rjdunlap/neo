# Word Glue, levels 1–3 (definition)

Defined 2026-10-22 as slice VW1 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/vocabulary-word-parts.md#a-first-games-ladder-word-glue) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#vocabulary-and-word-parts-recommendations). *Word Glue* is a working name.

**Status: built 2026-10-24 (levels 1–3, PR #937).** The build waited on two developer calls (since settled, below) in the [Waiting row](../WAITING-ON-DEVELOPER.md) "Word Glue: new game, land and compound list review": [decision 1](#open-decisions) (a new game, and its land) and [decision 2](#open-decisions) (an ordinary adult literacy read of the [compound table](#the-compound-table-logicts-reviewed-under-decision-2), its meanings, distractor pool and deny list). Merging this definition does not authorize the build. Nothing here is gated by a specialist reviewer.

**Fun action and purpose:** two pictures sit on a soft table. She drags one onto the other (at the lap band she just taps), they hop together with a pop, and a third thing appears and comes alive: a sunflower turns to the sun, a dog curls up in its doghouse. The pet says the parts and the whole: "Sun… flower… sunflower!" The learning purpose is **two words make one, and the parts give the meaning** (CCSS L.2.4.d, compound words; Head Start ELOF P-LC 6, guessing a word's meaning from clues). Level 1 is cause and effect with a word; level 2 finds the two parts of an asked word; level 3 keeps the second part (house, box, brush) and asks which first part makes the thing a given friend needs.

## Identity and overlap

- **Clap the Syllables** owns hearing a compound's beats; Word Glue never counts syllables.
- **Opposites** keeps un- (its level 9) and two meanings (its level 10); **Word Monsters** G2 keeps re-, -ing, -ed and -s. Word Glue owns compounds, and later (VW4) -er, -ful and -less, so no word part is taught in two games.
- **Rhyme Time** and **Photo Safari** name single pictures; neither joins two into a third.
- **Spelling** is not here: nothing is printed and no rung asks her to read. Only whole words are spoken, so device speech never says a bare affix.

## The compound table (`logic.ts`, reviewed under decision 2)

Every entry is **transparent and concrete**: its meaning is built from its parts and both parts can be drawn. Nothing is printed, so only the spoken word matters, and every entry is said as one word with stress on the first part. Entries use US words; the regional ones are flagged for decision 2: *mailbox* (UK *postbox*), *sandbox* (UK *sandpit*), *dollhouse* (UK *doll's house*), and *toybox* is often written *toy box*. Each carries an authored `meaning` sentence, spoken on level 3 and in level 2's hint.

| Word | Parts | Meaning | Levels | Comes alive |
| --- | --- | --- | --- | --- |
| sunflower | sun + flower | a flower that turns to the sun | 1, 2 | turns its face to the sun |
| cupcake | cup + cake | a little cake in a cup | 1, 2 | a candle flickers on |
| doghouse | dog + house | a house for a dog | 1, 2, 3 | the dog curls up inside |
| toothbrush | tooth + brush | a brush for teeth | 1, 2, 3 | scrubs a tooth to a sparkle |
| raincoat | rain + coat | a coat for the rain | 1, 2 | rain runs off it |
| beehive | bee + hive | a home for bees | 1, 2 | bees buzz out and back |
| sailboat | sail + boat | a boat with a sail | 1, 2 | sails across the table |
| mailbox | mail + box | a box for mail | 1, 2, 3 | its flag pops up |
| birdhouse | bird + house | a house for a bird | 3 | the bird peeks out |
| dollhouse | doll + house | a house for a doll | 3 | its windows light up |
| toybox | toy + box | a box for toys | 3 | the lid closes on the toys |
| sandbox | sand + box | a box for sand | 3 | a little sandcastle rises |
| hairbrush | hair + brush | a brush for hair | 3 | brushes a curl smooth |
| paintbrush | paint + brush | a brush for paint | 3 | paints a stripe of colour |

*Football* (the study's example) is left out: it names different games in the US and UK. *Snowman* is left out because the island draws no people, so "man" has no honest picture. Opaque compounds (butterfly, hotdog, pineapple, starfish, rainbow, buttercup) are never in the table.

**Distractor pool (level 2):** single pictures the island already draws or will draw for the table: moon, star, key, tree, car, hat, duck, frog, bell, spoon, shell, chair, jar, plus the other entries' parts. A round's distractor is drawn from the pool by the seed, subject to the rule below.

**Deny list (`DENY`, reviewed under decision 2):** real or rude words that must never be makeable on screen, in either order, closed or open, with the parts and pool above. It includes at least: sunfish, sunhat, sunshine, sunset, sunrise, sunlight, sunbeam, sundog, moonflower, moonbeam, moonlight, starfish, flowerpot, flowerbed, cupboard, teacup, pancake, catfish, dogfish, hotdog, dogbowl, dogbed, houseboat, boathouse, housefly, treehouse, cathouse, bughouse, toothpaste, toothpick, raindrop, rainbow, overcoat, bumblebee, beeswax, sailfish, mailbag, boxcar, hatbox, keyhole, keyboard, shellfish, seashell, bellhop, doorbell, cowbell, armchair, highchair, footprint, football. The reviewer may add to it; a rule test reads it.

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Stick them** | lap, toddler | Nothing to get wrong: join the only pair | Five pairs |
| 2 | **What do they make?** | toddler, preschool | Which two of three pictures make the asked word | Five asked words |
| 3 | **Who is it for?** | preschool, pre-K, school | Which first part makes the thing the asking friend needs | Four asks, two heads |

**Bands:** lap 1, toddler 1–2, preschool 2–3, prek 3, school 3 ([decision 3](#open-decisions)). Levels 4–5 (VW2) add school 4–5 later.

### First rounds

- **Level 1 (authored):** a sun and a flower. She drags the flower toward the sun (or, at lap, taps either one); they hop together with a pop and a sunflower opens and turns to the sun. "Sun… flower… sunflower!" Then dog and house, cup and cake, bee and hive, sail and boat. Each picture says its word on touch-down.
- **Level 2 (authored):** "Make a doghouse!" A dog, a house and a moon. She drags the moon onto the house: they wobble, a soft boing, and they bounce apart. The pet: "Doghouse: dog… and house." (one miss). She drags the dog onto the house: a doghouse, and the dog curls up inside. Then raincoat (rain, coat, key), cupcake (cup, cake, star), mailbox (mail, box, duck), sunflower (sun, flower, jar).
- **Level 3 (authored):** a house waits in the middle; a dog, a bird and a doll stand around it. The bird: "I need a house!" She drags the dog onto the house; a doghouse appears for a moment: "That's a doghouse, a house for a dog. Who needs a house now?" and it pops apart (one miss). She drags the bird onto the house: a birdhouse, and the bird peeks out. The doll asks next, then the house slides off and a brush waits with a tooth, hair and paint: the tooth asks, then the paint.

## The model (`logic.ts`)

- **`COMPOUNDS`** is the table above: `{ word, first, second, meaning, levels }`. **`DENY`** is the deny list as lowercase strings with no spaces. `makes(a, b)` returns the entry whose parts are `{a, b}` in **either drag order** (dragging the flower onto the sun still makes a sunflower; order matters only at VW2's level 5).
- **Level 1 round:** five entries tagged level 1, no repeats; the first is the authored sunflower.
- **Level 2 round:** five asked entries tagged level 2, no repeats, each with one distractor from the pool. A distractor is valid only if no part-plus-distractor string, in either order, is in `COMPOUNDS` or `DENY`. Exactly one pair on screen makes the asked word, and no other pair makes any word in either list.
- **Level 3 round:** two of the three heads (house, box, brush), two asks each. Each head shows its three first parts. On each ask all three are present; the asked first part is drawn so that no ask repeats within a head. Every head-plus-first-part pair on screen is a listed compound, so a wrong pick always makes a real thing she can be told about. **Heads** have exactly three level-3 entries each.
- **Check** `check(state, a, b)` returns `right`, `wrong` (with the made word, or none if the pair makes nothing), or `ignore` for a drop onto empty table or onto itself.
- **Hint** `hintFor(state)` returns the right pair: the two parts at levels 1–2, the asked first part and the head at level 3.
- Rounds are seeded from `ctx.rng` within these rules; each level's first round is authored so the how-to card and demonstration open on the same story.

## Screen and controls

- **The table** fills the middle; pictures are at least 140 logical units square (the study's legibility check), laid out by `tableLayout(view, n)` for two (level 1), three (level 2) or four (level 3: a head in the middle, three first parts around it) pictures, clear of the home button and the guide's bottom-left corner, in all four views the lands test uses. The made thing appears at the table's centre at about 200 units, then shrinks to a shelf along the top that fills with the round's things (decoration only, not touchable).
- **Drag** with `src/engine/drag.ts`: touch-down lifts the picture and speaks its word. Dropping it on another picture (nearest picture within reach of the drop point, per AGENTS' close-target rule) joins them; a drop elsewhere slides it home with no count. At the lap band, level 1 also joins on a tap of either picture; at every band level 1's tap works too, so a dragging slip never stalls a toddler.
- **Near feedback:** the picture under a dragged one glows faintly. On levels 2–3 every picture glows the same way, so the glow never says which partner is right.
- **A join:** the two pictures hop together, a pentatonic two-note pop (`src/audio/notes.ts`), the made thing appears and plays its short "comes alive" animation, and the pet speaks the parts and the whole. Drops during a join are ignored. Nothing is timed.
- **Pause sheet:** Start again (the same seeded round from its first ask, keeping misses and hints) and Show a hint (`Scene.pauseActions`).
- **Music:** the home land's style keeps playing underneath; she is not making music.

## Accounting, help and finishing

- **Level 1** has no misses and no hints.
- **A miss (levels 2–3)** is a dropped pair that is not the asked word, counted once per distinct wrong pair per ask. At level 2 the pair wobbles and bounces apart with a soft boing and the pet says the asked word and its parts ("Doghouse: dog… and house."). At level 3 the wrong thing appears briefly and the pet says what it is and who it is for, from its `meaning` ("That's a dollhouse, a house for a doll. Who needs a house now?"), then it pops apart; the asking friend repeats the ask.
- **Never a miss:** touching a picture to hear it, a drop on empty table or on itself, drops during a join, tapping a friend to hear the ask again.
- **After two misses on one ask** both right parts glow (level 2) or the asking friend glows (level 3), and `hints++`, at most once per ask. Show a hint does the same, still at most once per ask.
- **Supported finish:** a third miss on an ask after its glow joins the right pair by itself and plays it, with no further count, so every round can finish. Level 2 has only two wrong pairs, so this is rare there.
- **Finish:** after the last pair or ask the shelf's things all play their animations at once, and `ctx.finish({ misses, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept or filed ([decision 5](#open-decisions)).
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A smooth level-3 round shows she picked a pictured meaning from pictured parts in this toy, nothing more about reading or morphology.

## Speech (`voice-script.ts`)

Lines under `wordglue.*`, every word whole: `intro`, `instruct.stick` ("Stick them together!"), `instruct.make` ("Make a {word}!"), `ask` ("I need a {head}!", said by the friend), `join` ("{first}… {second}… {word}!"), `miss.make` ("{word}: {first}… and {second}."), `miss.for` ("That's a {made}, {meaning}. Who needs a {head} now?"), `hint`, `done`. Picture words and `meaning` strings come from the table, so the reviewer reads every spoken sentence in one place; a test asserts every table word, part and meaning is a non-empty string with no hyphen or bare affix.

## Rule tests (`logic.test.ts`)

- **Table:** every entry's word equals `first + second`; no entry is in `DENY`; every part has a picture key; every level-3 head has exactly three entries; no opaque word from the study's list appears.
- **Level 1, over 500 seeds:** five distinct level-1 entries; the authored first round matches.
- **Level 2, over 500 seeds:** five distinct asked words; for every round, **no pair on screen other than the asked one forms a word in `COMPOUNDS` or `DENY`, in either order** (the study's distractor rule); `makes` of the right pair is the asked entry in both drag orders.
- **Level 3, over 500 seeds:** two distinct heads, two asks each, no repeated ask within a head; every head-plus-first-part pair on screen is in `COMPOUNDS`, and none is in `DENY` (so no rude or unlisted word, such as *cathouse*, can appear); the hint's friend makes the asked whole.
- **Hints and accounting:** `hintFor` is the right pair in every state; a scripted level-2 ask (wrong pair, the same wrong pair again, the other wrong pair, Show a hint twice, a third wrong) counts one miss per distinct wrong pair, one hint, and ends with the supported finish.
- **Layout:** `tableLayout` at the four views for two, three and four pictures: every picture at least 140 units, no overlap, home and guide corners clear, everything inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including its home land on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` drags the first part onto the second (`hintFor`) for each ask; at level 1 on the lap band it taps instead. Level 2's demonstration touches the distractor once first to show that touching is free.
- **How-to card** (`src/content/howto.ts`). Goal: "Stick two pictures together to make a new thing, and hear the word they make."
  - Steps: "Drag one picture onto the other, or tap one, and they join" `{ from: 1, to: 1 }`; "Listen for the word, then join the two pictures that make it" `{ from: 2, to: 2 }`; "A friend needs the thing in the middle; join that friend to it" `{ from: 3, to: 3 }`; "Touch a picture to hear its word" (all levels).
  - Finish: "Every pair is joined and its new thing has come alive."
  - Notes: "Every new word is two whole words she already knows" (all levels); "Nothing can go wrong here" `{ from: 1, to: 1 }`; "A wrong pair is one miss and the pet says the word's parts; after two misses the right pictures glow, which counts as a hint" `{ from: 2, to: 3 }`; "Hearing a word again never counts" (all levels).
- **Registration:** ID `word-glue`, name "Word Glue" (placeholder), spoken title `game.word-glue`. Region (subject) `story-grove`, the language subject, whichever land it lives in. Skills `['compound-words', 'vocabulary', 'word-meaning']`. Bands as above. Home land **Story Grove** by default ([decision 4](#open-decisions)). Hub icon: a sun and a flower joined by a little spark. Sticker (page `meadow`): a seeded made thing from the table.
- **Art (code-drawn, `src/games/word-glue/art.ts`, colours from `src/art/palette.ts`):**
  - *Reuse:* dog (`CRITTERS`); bee, cake, boat, coat and the distractor pool's moon, star, key, tree, car, hat, duck, frog, bell, spoon, shell, chair and jar (`picture()` in `src/games/rhyme-time/pictures.ts`); flower (`src/art/shapes.ts`); sun (Light Lab's `sunArt`); cup (`src/games/lemonade-stand/art.ts`); a bird (Attic Finds' `birdArt`). Shared drawings stay in their files; the build lifts a private one into `src/art/` only if it reuses it unchanged.
  - *New parts:* house, rain, sail, mail (an envelope), box, hive, tooth, brush, doll, toy (a ball and block), sand, hair (a curl), paint (a pot of paint).
  - *New joined drawings:* all fourteen made things, each with its short animation. This is most of the build's cost; the study's person check on legibility at 140 units applies.
- **Co-play:** *Silly Compounds*: the grown-up and child invent names for things in the room (a spoon hat, a sock house), the child naming first. **Off-screen** (spoken tip): "Find a toothbrush, a doorbell or a raincoat at home and say its two little words."
- **Couch:** none.
- **Rework couplings:** none required and nothing saved; the made things could later become collectible decorations, which the [rework brief](../rework/README.md) decides.

## Check tier

Word Glue 1–3 is the new-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 and level 3, with one wrong pair and one hint; one portrait screenshot at level 2; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: how the iPad's speech says each whole compound and the "first… second…" pause; whether a three-year-old reads a join as making a new thing; whether each joined drawing is recognisable at 140 units; whether the level-3 meanings are understood as "for". Browser automation establishes none of these.

## What comes next

**VW2, levels 4–5** (*What kind of thing?* and *Which way round?*) is defined after a child has played level 3. VW3 and VW4 follow VW2; the study's [build slices](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order) hold the order.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** 1: a new game (*Word Glue* stays the working name). 2: for the compound table, distractors and deny list, the building session checks it against reputable sources (museums, universities, government science agencies, established curricula), lists them here and records the check in its VERIFICATION entry; no outside reviewer is needed (no opaque compound on meaning rungs, US/UK words flagged). Story Grove allocation: Word Glue, Story Weaver and Pond Typing each try Story Grove first; the CI lands test (`landLayout` at every band in all four views) decides at merge; a game that does not fit goes to Treehouse; a built game is never moved to make room. The build is unblocked.

**Session source check (decision 2, 2026-10-24).** The compound table is unchanged; the deny list gained 64 real compounds and common two-word names found by enumerating every level-2 part and candidate distractor join and reading them (for example sunbird, bellflower, starflower, flowerbox, mooncake, dogcoat, carcoat, coattree, rainhat, raintree, mailboat, mailcar, toyboat, paintbox, birdbox, housecoat, housepaint, dogtooth; see `DENY` in `src/games/word-glue/logic.ts`). `moondog` and `duckbox` were weighed and left out (obscure; they would block the authored round's dog+moon and mailbox+duck). Sources: [K5 Learning on compound words](https://www.k5learning.com/blog/compound-words-three-types), [Kuraplan's K–1 compound list](https://www.kuraplan.com/guides/compound-words) (sunflower, toothbrush, mailbox, cupcake, sandbox, raincoat), [ReadingVine K–2 compound collections](https://www.readingvine.com/collections/compound-words/), and [Etymonline on toy-box](https://www.etymonline.com/word/toy-box) (toybox is usually written as two words; spoken only here, so harmless, and already flagged US/UK).

Decisions 1 and 2 blocked the build (settled above); the rest have defaults the build uses.

1. **A new game, and its land** (blocks). Lean: a new game, since no built game joins two pictures into a third. See decision 4 for the land.
2. **Compound list review** (blocks). An ordinary adult literacy read of the table, the `meaning` sentences, the distractor pool and the deny list: no opaque word on a meaning rung, no makeable real or rude word beside the asked one, regional words flagged.
3. **Bands.** Default lap 1, toddler 1–2, preschool 2–3, prek 3, school 3. School plays only level 3 until VW2 adds 4–5.
4. **Home land.** Default **Story Grove** (12 games today; Puzzle Peaks already lays out 13, so a thirteenth fits). *Look It Up* (IR1) moved to Barnyard when it was defined (2026-10-22), so Story Grove is Word Glue's alone. Fallback **Treehouse** (7 games), not Puzzle Peaks (13 already). The subject stays `story-grove` either way.
5. **Journal.** Default: nothing filed. Alternative: a page of things she has made, after the rework decides how made things relate to collecting.
6. **Level-3 heads.** Default house, box and brush, each with three "a ___ for a ___" compounds said as one word. The study's bowl, bed and hat were dropped because their "for" forms (dog bowl, dog bed, sun hat) are said as two words or name a different relation. Alternative fourth head: bell (cowbell, doorbell, handbell), which would need removing cowbell and doorbell from the deny list.
