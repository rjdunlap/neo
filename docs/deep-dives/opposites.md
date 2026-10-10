# Opposites deep dive

*ID `opposites` · bands lap, toddler, preschool, pre-K · levels 1–4 on 2026-10-10 · session `claude/zealous-cerf-vmw320` ([PR 87](https://github.com/rjdunlap/neo/pull/87))*

## The game today

Pictures of concept words in pairs, drawn in code. On the lap she taps a picture and it flips to its opposite while the word is said. Later she finds the one named, finds the opposite of a picture among three, and matches three pairs. The learning purpose is the first antonym vocabulary: a word means something *because* of what it is not.

| Level | Plan (`PLANS`) | Mode | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Tap the picture: it flips (8 rounds, one per concept) | `switch` | lap (1–1), toddler (1–2) | nothing: no wrong answer is possible, so 0 misses |
| 2 | Find the one named (5 rounds, two cards) | `find` | toddler (1–2), preschool (2–3) | which of two is "big" |
| 3 | This one is hot: find its opposite among three (4 rounds) | `opposite` | preschool, pre-K (3–4) | the opposite among one right card and two from other concepts |
| 4 | Match three pairs (2 rounds, six cards) | `pairs` | pre-K | tap one, then its opposite |

Level windows are `LEVELS` in `index.ts`: lap 1–1, toddler 1–2, preschool 2–3, pre-K 3–4. There is **no school window**, so a school profile plays at pre-K's levels 3–4 through `playBand`.

**What a round draws from.** `CONCEPTS` is eight fixed pairs: big/small (a bear), happy/sad (a cat's mood), up/down (a balloon), open/closed (a box), full/empty (a glass), hot/cold (a mug, an ice cube), day/night, fast/slow (a bunny, a snail). Level 1 plays all eight once in a shuffled order with a random side. The levels above draw a concept and its random side, so the only variety is order, side and which two other concepts fill a level-3 round. Each concept has one picture per side; the size pair is always the bear. The sticker art picks one of four concepts (`sky`, `temp`, `cup`, `lid`).

**Misses and hints.** Level 1 cannot be wrong. Elsewhere a wrong card is a boing and a spoken line naming both words, counted as a miss; a second wrong in a round glows the right card (one hint). Re-tapping the first card of a pair puts it down without a miss.

**Couplings.** A how-to card (four `LevelLine`s) and a ghost-finger bot (`autotouch()`, built on `cardToTap`, which the unit test drives for 100 seeds per plan). Voice lines `opp.switch`, `opp.word`, `opp.find`, `opp.opposite`, `opp.pairs`, `opp.notfind`, `opp.notopp`, `opp.notpair`, `opp.pair`, `opp.yay`, `opp.done`. Home land: Story Grove. Music: `STYLES.paint`. The browser case at `scripts/browser-check.mjs` plays levels 1–4 (scored, stickered). No couch entry, journal entry or picnic step.

**Known gaps.**
- **Two how-to lines are wrong today.** The card's `finish` is the plain string "The round ends when the pairs are matched." and shows at levels 1–3, where there are no pairs. The level-4 step is `{ from: 4, … }`, open-ended, so it would leak onto level 5's card (the howto test does not catch that; Goodnight Room's write-up names the same trap). Both are fixed in slice 1.
- **Eight pairs, one picture each.** After a few rounds she has seen all of it. The chunk-13 item "Each item in a pool gets a rule test that it fits its level" has nothing to test yet.
- **Nothing in the rules stops a future concept from clashing.** `find` compares by spoken word, and level 3 draws its other two pictures from any other concept. Today the eight are all unrelated; adding tall/short next to big/small makes "the opposite of big" arguable. The guard has to come before the new pairs.
- **The flip is silent apart from the word.** The bear does not stomp and the snail does not creep.
- **Level 2 is a coin flip** (two cards) and level 1 is a spoken word with no check that she took it in. Both are fine for the bands, since they carry no penalty, but they offer little to grow into.
- **School is not served.** Every pair is an adjective, preposition or noun shown by a picture. The curriculum asks for more (see Similar games).
- Person checks still open: whether a one-year-old holds a flip, and the real iPad ([roadmap](../ROADMAP.md#needs-a-person-or-a-device)).

## Similar games

The genre is the opposites picture book and the "learn opposites" app. Nearly all are a **matching game with a lesson mode**; none that I found has a graded ladder. Store listings change, so check price and privacy before relying on one.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Opposites for Kids* ([App Store](https://apps.apple.com/app/id987870107)) | app, toddlers and preschool | A learn mode of pictures with voice-over, then a memory-style match game and a spot game | the **learn-then-match** order our levels 1 and 4 already follow | the face-down memory match (it adds memory load, and Memory Match covers it); in-app purchases |
| *Kids Opposites Learning Games* ([App Store](https://apps.apple.com/us/app/id1341295700)) | app, age 3+ | Cards are self-correcting: a piece only fits its own pair | **a pair that cannot be wrong** as the supported path (our hint glow) | its listing's other details were not checked |
| *Learn Opposite Words with fun* ([App Store](https://apps.apple.com/us/app/learn-opposite-words-with-fun/id1409530542)) | app | A learn mode and a play mode where words are paired with their opposites | **words paired with their opposites** (our word-only and un- levels) | in-app purchases; the developer gave no privacy details |
| *The Opposites* (iGameMom; [review](https://igamemom.com/app-went-free-the-opposites-improve-vocabulary-while-playing-games/)) | app, ages 7+ | Matching pairs of opposing words in increasingly difficult levels | **a vocabulary ladder for older children** (our school levels) | scoring that punishes |
| *Exactly the Opposite* (Tana Hoban, 1990; [Publishers Weekly](https://www.publishersweekly.com/9780688088613), [catalog record](https://catalog.wakegov.com/Record/80782)) | wordless photo book, suggested age 2 and up | 13 spreads of familiar scenes with paired photographs (open/closed, intact/broken, hot/cold, front/back); the child supplies the words | **two near-identical pictures where only the concept differs** (our same-subject rule), and wordless looking before naming | its subtler pairs (intact/broken, front/back) wait for the older levels |
| *Black? White! Day? Night!* (Laura Vaccaro Seeger, 2006; [Kirkus](https://kirkusreviews.com/book-reviews/laura-vaccaro-seeger/black-white-day-night), [ALA notable](https://www.ala.org/winner/black-white-day-night-book-opposites)) | flap book, ages 3–6 | A question on one page, a flap or turn reveals the opposite; pairs range from basic to sophisticated, e.g. simple/complicated | **ask first, reveal after**: the flip, and level 8's picture that comes back as the hint | the optical illusions |
| *Opposites* (Sandra Boynton; [Powell's](https://www.powells.com/book/-9780671449032)) | board book | Two short words per page, rhymed, with animal characters; parents pause so the child finishes the pair | **leave a pause for her to say the second word** (a co-play tip) | rhyming text; the rating a single catalog record gave is not a reason either way |
| Sesame Street's *Zoe & Elmo's Opposites* video and the [Learn with Homer opposites page](https://learnwithhomer.com/homer-blog/8104/opposites-printable) | video and printables | Finding opposites around the house, then acting them out ([Georgia DECAL toddler list](https://www.decal.ga.gov/documents/attachments/ToddlerAtHome/OppositesWeeklySummary.pdf)) | **acting them out** (the off-screen suggestion, and an "opposite day" for school) | the video |
| A speech therapist's *fishing game* (hook cards, one word of each pair; [handout](https://childdevelopment.com.au/images/Resources/SLP_games_and_activities/Opposites.PDF)) | physical play | Catch one, then find its mate | the **catch-then-mate** shape of level 4 | nothing; it is the same game as our pairs |
| *Reading Rockets* semantic gradients ([PDF](https://Www.readingrockets.org/sites/default/files/migrated/content/pdfs/26_semantic-gradients.pdf)) | classroom strategy | Related words placed on a line between two ends (frigid, cool, hot, fiery) | the **in-between** levels 6 and 7: an opposite is the far end of a line | the printed word lists |

**Learning and developmental sources.**
- **Opposites in the curriculum.** Kindergarten asks children to relate frequently occurring verbs and adjectives to their opposites (L.K.5.b, [standard text via Shmoop](https://app.shmoop.com/common-core-standards/ccss-ela-literacy-l-k-5-b.html), also [CDE's page](https://www2.cde.ca.gov/cacs/id/web/5555)). Grade 1 adds shades of meaning among adjectives that differ in intensity (large, gigantic; L.1.5.d). Grade 2 adds working out a new word from a known prefix (happy, unhappy; L.2.4.b, [standard text](https://shmoop.com/common-core-standards/ccss-ela-literacy-l-2-4-b.html)). The first two are the in-between and word-only levels; the third is the un- level. Level 7, ordering three, echoes the grade-1 measurement standard on ordering three objects by length (1.MD.A.1, [text](https://www.shmoop.com/common-core-standards/ccss-1-md-1.html)). I read these through search summaries and teacher sites, not corestandards.org, so the exact wording should be checked there before a doc quotes it.
- **Which pair is easier.** A [2022 study of Italian-speaking 3- to 5-year-olds with gradable pairs like big/small and long/short](https://research.unipd.it/bitstream/11577/3418686/5/Pagliarini%20et%20al%202022.pdf) notes it is plausible that children first learn the positive member (big) and later its counterpart (small). That is a reason for the "say both words" flip at level 1, and for asking for the negative member (small, short, empty) only from level 2. I read the summary, not the full paper.
- **Eve Clark, 1972**, *On the child's acquisition of antonyms in two semantic fields* (Journal of Verbal Learning and Verbal Behavior 11, 750–758) is the classic reference on how children come to antonyms. I could not open it, so I draw no age claim from it.
- **Saying "opposites" aloud.** A search summary of a study of 4- and 5-year-olds with antonym analogies said that an explicit relation phrase ("opposites") helped five-year-olds but not four-year-olds. I could not open the paper, so this is **secondhand** and only a lean: pre-K and school instructions say the word "opposite", as level 3 and 4's lines already do.
- **Multiple meanings.** A kindergarten standard asks for new meanings of familiar words (L.K.4.a); I did not open its text, so level 10's link to it is from memory.
- **Adjectives only so far.** Every pair on the island today is an adjective, a preposition or a noun picture. L.K.5.b names verbs too, which is a reason for the "doing words" content below.

## What makes sense here

- **Fresh content first, but guard it first.** Eight pairs is the thinnest pool of the wave-1 games. Adding pairs is cheap art and wins the most time-in-game, but only after the rule tests exist that keep a round fair: **no two concepts share a spoken word**, and **no two concepts of the same family** (size-ish: big/small, tall/short, heavy/light) share a level-3, level-4 or level-5 round. This is the same lesson as Goodnight Room's teddy: a reasonable answer must never be marked wrong.
- **The youngest bands keep the eight.** Lap and toddler see only the existing eight until level 2; new pairs carry a `from` level so level 1 does not change. New pictures that look like old ones (a box for in/out when the box already means open/closed) are kept out.
- **Same subject, so the contrast is the only difference.** Tana Hoban's photographs work because each pair is the same scene. A card pair in one round shares its critter or prop (a big and a small *duck*), seeded. The level-3 answer matches the shown card's subject.
- **A bigger ladder through language, not speed.** The audit asked for a reason to grow this ladder. The reason is the developer's 2026-10-10 direction for more quantity across bands, plus a school gap: the school profile plays levels 3–4 today. The new levels go to the three things a school child can do with opposites that a picture alone cannot teach: place a word *between* two ends, hear a word with no picture, and see how a prefix reverses a word. None adds a timer, a lives count, clutter or a memory-match.
- **Keep it off Size Parade's ground.** Size Parade already drags three or five friends into a size order. The in-between levels therefore use temperature, fullness, height and the sky, not size.
- **Gradable and complementary pairs differ.** Only pairs on a scale have a middle (cold–warm–hot, empty–half–full); open/closed, on/off and awake/asleep do not. A rule test enforces it.
- **The co-play line is the best part.** The grown-up says the second word; "opposite day" (answer with the other one) is the off-screen suggestion for pre-K and school.
- **Who owns acting an opposite.** Opposites owns *knowing* the pairs on picture cards (and its acting flip moves the card's picture). [Pet Says](pet-says.md) owns *doing the opposite with her body* (levels 6–11 there: the pet shows one move and she does the other). They share up and down, fast and slow, open and closed; neither adds the other's mode.
- **Long-term arc.** Lap: tap and see it flip. Toddler: find the named one. Preschool: find the opposite. Pre-K: match pairs, spot the pair, find the middle. School: hear a word and find its picture, un- words, and a word with two opposites.

## Proposed ladder

### Fresh content inside existing levels

All in the order they should be built. None renumbers a level.

- **Fairness guards (slice 1, before any new pair).** `CONCEPTS` gains a `family` and a `from` (the lowest level it appears in). Tests: every spoken word is unique across all concepts; no `opposite` (level 3) or `pairs` (level 4) round, and no future `spot` round, draws two concepts of one family; every level's pool is large enough for its rounds (`pairs` needs three non-conflicting concepts; chunk 13 item 1's pool test); `makeRounds` is deterministic for a seed.
- **Four new pairs, `from` level 2 (slice 1).** Only pictures that need no new art idea and cannot be mistaken for an old one:
  - **tall/short**: a flower on a green strip, tall or short. Family: size-ish.
  - **on/off**: a lamp, lit with rays or dark. Not the box; not Goodnight Room's code (that drawing is not exported).
  - **awake/asleep**: the cat with eyes open or with the `sleepy` mood and a "z".
  - **in/out**: a ball in or beside a basket. Not the box, whose lid already means open/closed.
  Each is a few `Graphics` calls; the hub icon is unchanged. The sticker art picks from the larger pool.
- **Same-subject variation (slice 2).** `Card` gains an optional `who` (a critter id or prop). Big/small uses the bear, duck or bunny; happy/sad uses the cat, dog or pig. Tests: both cards of a `find` round and the answer to an `opposite` round share their subject; every subject renders. The seeded draw then makes level 1's eight rounds look different each time.
- **A flip that acts the word (slice 2, lap).** After the flip the picture moves in its way: the big bear stomps and the small one tiptoes; the bunny zooms and the snail creeps; the balloon rises or sinks. A tween per side through `ctx.tw`, so it stops with the scene. Optional sounds from the existing set (`sfx.animal`, `sfx.yawn`, `sfx.sigh`); pitched sounds use `src/audio/notes.ts` steps. No rule test; a portrait screenshot.
- **More pairs, `from` level 3, in a second batch (slice 4).** wet/dry (a dripping sponge, a dry one), clean/dirty (the bear), thick/thin (a book), many/few (counted friends; it overlaps Picture Graph's most/fewest, so keep it last), near/far. Each gets a legibility look at 140 units.
- **Doing words (sketch).** Verbs are in L.K.5.b and none is here. The pet or a critter acts them out: push/pull a wagon, give/take an apple, come/go along a path. One animation per word. It needs an art and voice design and a decision on whether verbs share the picture cards, so it is a sketch, not a slice.
- **Sound cards (sketch).** loud/quiet and high/low cannot be drawn well; they are sounds. A card with a speaker whose tap plays a loud or quiet note (never louder than the existing level). Costlier and wants a device check.
- **A pause for the second word.** A grown-up tip: say the first word and wait. Co-play copy only (`coplayHint`).

### New levels on top

Windows after this ladder: lap 1–1 and toddler 1–2 and preschool 2–3 **unchanged**; **pre-K 3–7** (was 3–4); a **new school window 7–10**. Levels run in difficulty order; the order and the school window are decision 1 and 2 below. A new level is appended and never renumbers a saved level.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | **Which two?** | pre-K | Five cards, no card shown first: "Which two are opposites?" The pair is hot and cold; the decoys are a bear, a lamp and a flower. Tap one, then its opposite | the one pair among five | A wrong second tap is a boing and "{a} and {b} are not opposites."; glow on one card of the pair after two misses | exactly one opposite pair among the five; no two decoys are opposites; no two concepts share a **family**; the bot taps the pair (`cardToTap`) | a `spot` mode in `PLANS`; the pairs layout with 3+2 cards; one new voice line; howto step bounded to the level. A reframing of IDEAS' "busy picture", which was clutter |
| 6 | **In between** | pre-K (top) | Three cups: empty, half full, full. "Which is between empty and full?" | the middle of a line | "That one is full. Which is between full and empty?"; glow after two. A hint that leads somewhere: the two ends light up first, then the middle glows | exactly one of three is the middle; only **gradable** concepts are used (cup, temperature, sky, height), never open/closed, on/off or awake/asleep; the three are in a fixed true order; not size | a third picture per gradable concept (half full; warm, a mug with a little steam; evening, a low sun; a middle height) with a legibility look at 140 units; two voice lines; the bot taps the middle. Reading Rockets / L.1.5.d |
| 7 | **Line them up** | pre-K (top), school (first) | The same three, shuffled, "Tap them from empty to full" | an order of three, then the other way ("full to empty") | A tap out of turn is a soft boing and "Which comes first?"; the next one in the right order glows after two. Two ends named out loud | any prefix of the true order is accepted; the bot taps in order; both directions are generated and fair | the in-between art again; a short chain of tweens as each card slides into a row; echoes 1.MD.A.1 without a unit; **not size** (Size Parade) |
| 8 | **Only the word** | school | The pet says "hot", the picture is hidden behind a speaker button. "Find the opposite!" | the opposite of a *word*, not of a picture | First miss: the picture reveals (the hint is the picture, as in a flap book); glow after two. The speaker replays the word | exactly one answer; the revealed picture after the first miss is the ask's own picture | `opposite` mode with `hidden: true`; the ask bubble draws a speaker instead of a picture; the bot's tap is unchanged. **Opens the school window**, decision 2 |
| 9 | **Un- words** | school | A zipped bag. "Zip. Which is **un**zip?" with the zipped and the unzipped bag | a prefix reverses a word | "That one is zip. Unzip is the other way."; glow after two. The word may be shown in print with its "un" in a separate bubble, always with a replayable voice | every pair is `base` / `un` + `base`; both pictures render; only reversible verbs and adjectives are used (zip, tie, lock, wrap, plug, button, fold, pack; happy/unhappy as a mood) | one picture pair per word (props the island already draws, or a few new ones); a word line per word through `{word}`; reading is optional because the pictures answer it. **Device speech for "unzip", "untie" and the rest is unchecked** (a person check). L.2.4.b |
| 10 | **Two answers** | school | "Which two are the opposite of *light*?" The cards: a rock (heavy), a dark room (dark), a feather, a lamp | a word with two meanings, so two answers | Either right card is accepted first; the other is then the only one left; a wrong card gets "That is light too. Which is the opposite of light?" (not a miss for a light-meaning card, a miss for an unrelated one). Glow after two misses | each authored word (light: heavy/dark, short: tall/long, old: new/young) has exactly two correct cards on screen and no more; decoys fit neither sense; the bot taps both | an authored table of three words (a content row each); three more pictures for old/new; a mode that clears two cards. L.K.4.a (from memory) |

**Cost the build must not forget.** The how-to card's `finish` line and level-4 step are fixed in slice 1; each new level's step is written with `{ from, to }` so it appears only at its levels, and levels 8 and 9 add reading-lite wording. `registry.test.ts` lists the game's ranges, so the band row changes with level 5 (pre-K 3–5, then wider) and the school row with level 8. The browser case at `scripts/browser-check.mjs` loops over levels, so it extends with each; `fingerdemo` plays the new top level, and the bot must clear every new mode (`cardToTap` grows a case per mode, with the same per-seed test as today).

### Younger-band openings

**None to add.** The game already serves lap from level 1, the youngest band. What can make level 1 better for a one-year-old is inside the level (the acting flip, the seeded subjects), not a new opening.

### Levels below level 1 (waiting on the level-order decisions)

Both wait on [how levels are ordered for a band and whether a band's range may skip](../ROADMAP.md#waiting-on-the-developer); an easier level appended above level 4 would make "step up" run backwards for lap.

- **One pair, again and again.** Four flips of only big and small (or only hot and cold), the same bear each time, so a one-year-old hears "big… small… big… small". Rule test: the plan names one concept, the sides alternate, and the round has no wrong answer. Cost: a plan row and a `concept` field; no art.
- **Any tap flips.** A whole-screen picture; a tap anywhere flips it. Rule test: every tap advances. Cost: a mode and a bot.

### Left out on purpose

- **A face-down memory match of opposites.** *Opposites for Kids* has one; it adds memory load, and Memory Match already covers it.
- **Hearing a word as the only clue before level 8.** Pre-K needs the picture.
- **Pairs that are not opposites** (synonyms, same and different): a separate idea, and Rhyme Time and Critter Sort hold nearby skills.
- **Timers and speed** (answer fast): the rules rule them out.
- **Stop/go and start/stop**: Stop and Go owns them.
- **Ordering by size**: Size Parade owns it.
- **A couch entry**: a calm, two-card game that the co-play suggestion already covers.
- **A journal entry for each pair seen**: possible, but the journal would need a new `JournalGame`, a save field and a line per pair, and no reason to add it yet. Revisit if the pool grows past thirty.
- **Left/right, front/back and other perspective pairs**: they depend on where the child stands; too easy to mark a reasonable answer wrong.
- **Prices, in-app purchases and ads** found on the reference apps.

## Decisions for the developer

1. **Should Opposites open a school window?** Lean: yes, with levels 7–10 (7 is shared with pre-K), because the school profile plays pre-K's levels 3–4 today. The alternative is to stop at pre-K with levels 5–7. This needs your call on **how far the language arts go**: a printed word on levels 8 and 9, with spoken support always, is a literacy step (see decision 3).
2. **Level order and windows.** Lean: 5 Which two?, 6 In between, 7 Line them up, 8 Only the word, 9 Un- words, 10 Two answers; pre-K 3–7 and school 7–10. Lap, toddler and preschool stay as they are.
3. **Is reading-lite acceptable on levels 8–9?** The spoken word is always there and the pictures carry the answer; the printed word is an extra, never required. The "un" bubble is the only part that is about the letters. Device speech for the un- words is unchecked either way.
4. **Families.** Lean: enforce the family rule for every level-3+ round and fix it in a test, so a reasonable answer is never marked wrong.
5. **Levels below level 1** wait on the existing level-order and range-skip rows in [Waiting on the developer](../ROADMAP.md#waiting-on-the-developer); no new row.

## Build slices, in order

Each is sized for one session. The slices that add a level are built in level order so saved IDs stay unbroken.

1. **Fairness guards, four new pairs and the card fixes** (ready): `family` and `from` on `CONCEPTS`, the unique-word, family and pool tests, tall/short, on/off, awake/asleep and in/out, the larger sticker pool, and the how-to `finish` and level-4 bound fixed. Tier: typecheck, the game's rule tests, the how-to and registry tests, one filtered browser play and a screenshot of each new picture. Update the "eight pairs" count in GAMES.md and the README row.
2. **Same-subject variation and an acting flip** (ready): `who` on `Card`, per-side motion, optional sound. Tier: rule tests, one browser play, a portrait screenshot.
3. **Level 5, Which two?** (ready after 1; the band row becomes pre-K 3–5): the `spot` mode, bot, how-to step, browser loop, `fingerdemo`. Tier: new level on an existing interaction.
4. **A second batch of pairs** (ready): wet/dry, clean/dirty, thick/thin, near/far, many/few, each at a `from` level.
5. **Level 6, In between** (ready after 4): third pictures for cup, temperature, sky and height.
6. **Level 7, Line them up** (ready after 5).
7. **Level 8, Only the word** (decision 1; opens the school window).
8. **Level 9, Un- words** (decision 3; needs the device-speech check).
9. **Level 10, Two answers** (ready after 7).
10. **Doing words and sound cards** (sketch; needs a design pass).
11. **Levels below level 1** (waits on the level-order decisions).
