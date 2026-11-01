# Rhyme Time deep dive

*ID `rhyme-time` · bands pre-K, school · levels 1–7 on 2026-11-01 · session `claude/dive-rhyme-time` ([PR #1095](https://github.com/rjdunlap/neo/pull/1095))*

## The game today

She hears picture names and finds the ones that rhyme. It teaches rhyme recognition (CCSS RF.K.2a, "recognize and produce rhyming words"), then sound and meaning together (Rhyme Riddles, the [poetry and wordplay study](subjects/poetry-wordplay.md)'s PW1, [definition](../definitions/rhyme-riddles.md)). It lives in Story Grove (`region: 'story-grove'`), plays `STYLES.paint`, and has a ghost-finger bot (`autotouch()` taps the answer, a rhyming pair in turn, or level 7's working chips then Guess).

Ranges (`LEVELS` in `index.ts`): pre-K 1–5 with `order: [1, 2, 3, 5]`, school 2–7. No `entryLevels`, no `askForHint`.

| Level | Plan (`PLANS` in `logic.ts`) | Bands | What she decides | Rounds and pool |
| --- | --- | --- | --- | --- |
| 1 | `match`, 3 choices | pre-K | Which picture rhymes with the spoken word (its picture in a bubble) | 4 questions, each from a different family; distractors one per other family |
| 2 | `match`, 4 choices | pre-K, school | The same, with four pictures | 4 questions |
| 3 | `pair`, 4 choices | pre-K, school | Which two pictures rhyme with each other (tap one, then the other; tapping the first again lets go) | 4 questions |
| 4 | `odd`, 4 choices | school | Which picture does not rhyme with the other three | 4 questions, **only from the five three-word families** (at, og, ee, ar, ear) |
| 5 | `riddle`, 3 pictures | pre-K, school | The one picture that fits a sound clue then a meaning clue | 4 riddles from the pinned pool of 102 |
| 6 | `riddle2`, 4 pictures | school | The same, meaning clue first, plus a neutral fourth | 4 riddles |
| 7 | `make`, 3 pictures | school | Build the pet's riddle for a starred picture from two sound chips and two meaning chips, then Guess | 3 riddles; never a miss; two non-working guesses glow the working chips (one hint) |

**Content pools.** Twelve families, 29 code-drawn pictures (`pictures.ts`; critters stand in for cat, dog, bear and duck; a crowned bear is the king): at (cat, hat, bat), og (dog, log, frog), ee (bee, tree, key), ar (star, car, jar), ear (bear, pear, chair), and two-word oon, ish, ake, uck, oat, ell, ing. Thirteen meaning tags (`TAGS`) feed the riddles. Riddles and the odd one out draw only on the five three-word families, so after a few rounds the same five groups return.

**Accounting.** Levels 1–6: a wrong tap is a miss with a spoken reason ("{word} does not rhyme with {prompt}", "not a pair", "{word} rhymes with {other}"); the second miss on a question glows the answer and counts one hint. Riddles: the first miss repeats both clues, the second glows. Replaying the question (music-note button) is free. Level 7 records no misses.

**Voice.** 26 `rhyme.*` lines; every list of pictures is spoken with the question, so nothing needs reading. Picture names are slotted, so they fall back to device speech.

**Tests.** `logic.test.ts` checks families are disjoint, exactly the intended rhyme is on screen, the bot's taps are right, each riddle keeps one picture for both clues and two for the rhyme alone, the pinned pool of 102, level 7's chips, tag sentences and the voice lines.

**How-to card.** Level-scoped steps for 1–2, 3, 4, 5, 6 and 7 (`src/content/howto.ts`). Co-play: stretch the ends ("caaat, haaat") and ask the pet's riddle back. Off-screen: "I spy something that rhymes with…".

**Mentions.** [ROADMAP](../ROADMAP.md) chunk 18 lists a Rhyme Time preschool opening; the language table notes rhyme families need their own design per language. [IDEAS](../IDEAS.md) Rhyme Picnic folds into Rhyme Time; Rhyme Hunt and Mother Goose Muddle stay separate proposals; *Finish the line* is Sing-Along Barn's (PW2), *Same first sound* (PW3) waits on its owner decision.

## Similar games

| Game | How progression grows | Borrow | Leave out |
| --- | --- | --- | --- |
| Starfall kindergarten games ([game rules](https://teach.starfall.com/lv/documents/teachers-lounge/GameRules.pdf)) | Pair decks of rhyming pairs, then initial-sound pairs; one game asks the child to name a rhyme | Pairs as their own rung (Rhyme Time 3 already is) | "Name a word that rhymes": needs a microphone and a listener |
| PBS Kids Super Why, [Rhyming Hopscotch](https://pbskids.org/superwhy/parentsteachers/activities/115.html) and [Wonder Red's reading camp](https://pbskids.org/superwhy/readingcamp/curriculum/w1d2.html) | One word family at a time (*all*, *ake*), hop or freeze on a family word | A family as a place you put things: the basket rung (level 10) | Printed families: Rhyme Time stays spoken; reading belongs to Read & Do |
| ReadWriteThink [Word Family Sort](https://readwritethink.org/classroom-resources/student-interactives/word-family-sort) | Sort words into family columns | Sorting by family (level 10) | Typed words; she sorts pictures by ear |
| [Hink Pinks](https://www.readwritethink.org/parent-afterschool-resources/activities-projects/think-hink-pinks) (classic riddle game; "fat cat", "spare chair") | One-syllable pairs, then two- and three-syllable versions | A rhyming *pair as a picture*: a duck in a truck (level 8) | Written clues and riddles for readers; the older versions |
| [Find the Rhyme](https://apps.apple.com/app/id1250349325) (store listing, via the poetry study) | Memory-style rhyming pairs | Nothing new (level 3) | Price |
| [Rhymo](https://www.commonsensemedia.org/app-reviews/rhymo) (12+, via the poetry study) | Rhyme riddles that test, not teach | The two-clue shape, already built (5–7) | Testing without teaching |
| Classroom picture sorts and rhyming-pair cards | Picture cards in two piles, then three | Two or three family baskets | Worksheets, timed drills |

**Developmental sources.** Reading Rockets, [development of phonological skills](https://www.readingrockets.org/topics/developmental-milestones/articles/development-phonological-skills) (after LETRS, Moats and Tolman 2009): recognising a rhyme comes well before producing one. The [ASHA review](https://pubs.asha.org/doi/pdf/10.1044/cicsd_30_S_41) reports Yopp (1988): rhyme tasks were the easiest phonological tasks for kindergartners. The poetry study's age table (rhyme recognised with prompting at 3–4, produced and odd-one-out at 5–6) agrees. So a preschool opening asks for recognition between two pictures, and production stays a later, gated rung.

## What makes sense here

- **Fresh content first.** The odd one out and every riddle use five families, so the game soon repeats. Three more three-word families (nine pictures) widen both without new rules; *whale/snail/pail* shows, like *key/bee*, that rhyme is sound, not spelling (spoken only, so this needs no reading).
- **A rhyme that does something.** Levels 1–4 end on a sparkle. A hink-pink scene, *a duck in a truck*, turns the right rhyme into a silly picture she made, and gives the preschool opening a reason to exist.
- **Families as places.** Sorting six pictures into three baskets is the first rung where she holds several families at once, the step between recognising one rhyme and producing one.
- **Not now:** producing a rhyme by changing a word's first sound (*cat → hat*) needs individual phonemes from device speech, Word Monsters' territory and its device check. It stays a sketch below.

## Experience and presentation

- **First unsupported action:** tap a picture. Cards already lift and pop on touch-down (`onTap`, `sfx.pop`).
- **Touch acknowledgment and consequence:** level 8's rider hops into the scene before the verdict, so every tap shows something; a rhyme makes the scene act (the truck drives off with the duck waving), a non-rhyme hops back out.
- **Variety:** seeded families, seeded distractors and, at level 8, an authored scene table of 10 pairs (13 after slice 1), four per round.
- **Challenge versus precision:** all cognitive. Targets stay 160 units (cards) and at least 180 (baskets); drags at level 10 drop on the nearest basket inside a generous radius.
- **Supported ending and replay:** every level ends after its questions with one sticker; the music-note button replays the question at no cost.
- **Co-play:** at level 8 the grown-up makes up the next silly pair ("a cat on a mat?"); at level 10 one names a picture, the other says its basket.
- **Needs a person or device:** does device speech say *dog*, *log* and *frog* with one vowel (some North American accents split *dog* from *log*), and does a three-year-old understand "which one goes in the truck?" as a rhyme question rather than a meaning one.
- **Art example:** the level-8 truck is the existing `truck` picture scaled to 1.6 on a road strip (`Graphics.roundRect`), with a seat anchor; the rider's `picture()` is reparented to the anchor at 0.6 scale and the truck tweens off right with `ctx.tw`, wheels turning by `rotation`.

## Proposed ladder

### Fresh content inside existing levels

**Three new families, nine pictures** (levels 1–7 all draw on them):

| Family | Words | Art | Meaning tags (generous, reviewed in the slice) |
| --- | --- | --- | --- |
| `ug` | bug, mug, rug | new: a ladybird with open wings, a mug with a handle, a striped rug | bug: fly; mug: holds; rug: sit |
| `ock` | sock, clock, rock | new: sock, a round clock face (Clock Tower's face is in its own game; draw a small one); `rock` from `src/art/shore.ts` | sock: wear; rock: sit; clock: none |
| `ail` | snail, pail, whale | new: snail and whale; `pail` from `src/art/shore.ts` | pail: holds; whale: swim; snail: none |

Seven new drawings in `pictures.ts`. Three-word families go from five to eight, so the odd one out and the riddle pool gain three groups. The riddle pool's pinned count (102) is re-derived and re-pinned in the slice; every existing riddle property must still hold (a clock or snail with no tag only ever serves as a mate or a neutral). No new voice lines: names are slotted. GAMES.md's "29 pictures in twelve families" becomes 38 in fifteen.

### New levels on top

**Level 8, *Silly pairs*** (pre-K, school; new interaction):
- **First round:** a truck stands on a road in the middle; three pictures below: duck, cat, star. "Who rides in the truck? Find the one that rhymes with truck: the duck, the cat or the star."
- **She decides:** which rider rhymes with the place.
- **Mistake:** the cat hops into the truck, the pet giggles "A cat in a truck? Cat and truck do not rhyme," and the cat hops back. A miss, as at level 1; the second glows the duck (one hint). Replaying is free.
- **Right:** the duck hops in, "A duck in a truck!", the truck drives off and back, next scene.
- **Scene table** (authored in `logic.ts`, each place with its rider, preposition and anchor): truck–duck (in), log–frog (on), chair–bear (on), hat–cat (in), dish–fish (in), jar–star (in), tree–bee (in), spoon–moon (on), cake–snake (on), boat–goat is not drawn and stays out; after slice 1, rug–bug (on), pail–snail (in), rock–sock (on). Four scenes per round, choices 3, distractors one per other family, none rhyming with the place.
- **Rule test:** every pair rhymes; no distractor rhymes with the place or with another distractor; no place appears twice in a round; every scene has an anchor and a phrase; the bot's tap is the rider.
- **Cost:** 3 voice lines (`rhyme.scene`, `rhyme.sceneYes` with the authored phrase, `rhyme.sceneNo`), anchors per place, the hop and act tweens, the bot (taps the rider), one how-to step. Ranges: pre-K `order: [1, 8, 2, 3, 5]` (max 8), school `order: [2, 8, 3, 4, 5, 6, 7]` (max 8). No couch, journal or picnic coupling.

**Level 10, *Rhyme baskets*** (school; new interaction, after slice 1):
- **First round:** three baskets, each with its key picture on the front (cat, star, bug); six pictures in two rows of three below (hat, bat, car, jar, mug, rug). "Put each picture in the basket it rhymes with."
- **She decides:** which of three families a picture belongs to, holding all three at once.
- **Mistake:** a drop on the wrong basket bounces back with "{word} does not rhyme with {key}" and is a miss; the second miss on the same picture glows its basket (one hint for that picture). A drop anywhere else, or tapping a basket to hear its key, is free.
- **End:** when the tray is empty the baskets sing their families in turn ("cat, hat, bat"); two trays per round.
- **Rule test:** three distinct three-word families; each tray picture rhymes with exactly one key; keys never appear in the tray; the bot's drag is to the right basket.
- **Cost:** drag through `src/engine/drag.ts` (rides 40 units above the finger; nearest-basket drop), the basket drawing, 3 voice lines, a bot using `dragTo`, one how-to step. School range 2–10 with level 9 absent at school (`order` lists it). Not pre-K: three families at once sits with the 5–6 odd-one-out evidence.

### Younger-band openings

**Level 9, *Silly pairs, two to choose*** (preschool entry, chunk 18): level 8's scenes with two choices and three scenes per round, the place's word spoken twice ("truck… truck. Who rhymes with truck?"). Same accounting (a miss, the glow after two). Preschool `{ min: 8, max: 9, order: [9, 8] }`, `entryLevels: [9]`. This adds a band: the lands test must pass with Rhyme Time on Story Grove's preschool page (a full land pages, never shrinks), the registry band test, a how-to step for 9, and a [device check](../DEVICE-CHECKS.md) on whether a three-year-old hears it as a rhyme question. Lap and toddler stay out: the poetry study gives those ages the pause-and-finish line (Sing-Along Barn, PW2).

### Easier entries and levels between existing ones

Level 8 is the step between level 1 (one rhyme, three pictures) and level 3 (pairs) for pre-K, placed by `order`; nothing is renumbered.

### Left out on purpose

- *Change the start* (sketch): drag a first-sound tile onto *cat* to make *hat*. It needs single phonemes from device speech (Word Monsters' unchecked device check) and overlaps Word Monsters; a later definition decides the owner.
- Saying a rhyme aloud: no microphone, and a child's speech sounds vary.
- Printed word families: Rhyme Time stays spoken; reading is Read & Do's.
- Generated rhymes or nonsense words: an unreviewed list can make unkind words.
- Timers, speed scores, streaks.

## Decisions for the developer

None new. The study's open decisions (verse review, alliteration owner) do not gate these slices.

## Build slices, in order

1. **Fresh families: bug, sock and snail** (existing-interaction tier: typecheck, the game's rule tests with the re-pinned riddle pool, one filtered regression play at level 4 on a seed showing a new family; bot unchanged, no `fingerdemo`): the nine pictures (seven new drawings, `rock` and `pail` from `src/art/shore.ts`), three families, the reviewed tags above, GAMES.md counts. Ready.
2. **Level 8 *Silly pairs*** (new-interaction tier: typecheck, unit tests including order and entry, one scripted play of level 8 with one wrong rider and a second for the glow then the rider, one portrait screenshot of a scene, `fingerdemo` at 8, one build for the voice lines), after slice 1 (its three new pairs). Ready.
3. **Level 9, the preschool opening** (new-band tier: typecheck, unit tests including the lands and registry band tests, one play of level 9 at preschool, `fingerdemo` at 9, the preschool Story Grove page screenshot), after slice 2. Ready.
4. **Level 10 *Rhyme baskets*** (new-interaction tier: typecheck, unit tests, one scripted play with a wrong basket, a second for the glow and an empty-space drop, one portrait screenshot, `fingerdemo` at 10), after slice 1. Ready.
5. *Change the start* stays a sketch, not queued.

## What was built in this session

Nothing: docs only. I read `index.ts`, `logic.ts`, `pictures.ts`, the tests, the how-to card, the GAMES entry and the poetry study. The game was not opened or played. Links and `git diff --check` ran on the changed docs.
