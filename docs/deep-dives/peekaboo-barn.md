# Peekaboo Barn deep dive

*ID `peekaboo-barn` · bands lap, toddler, preschool, pre-K · levels 1–8 on 2026-10-10 · session `claude/zen-gauss-qmbqb6` ([PR 96](https://github.com/rjdunlap/neo/pull/96))*

## The game today

She taps a hiding place (a haystack, bush, crate or door) and an animal pops out, makes its cartoon voice and is named. Later, the animals peek over the covers and she is asked to find one by name; later still they pop out, hide, and she is asked where one went. The learning purpose is object permanence and animal words (lap, toddler), then matching a name to a place and remembering it (preschool, pre-K). `skills`: object-permanence, animal-words, memory.

| Level | Plan | Goal | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- |
| 1 | free, 3 places | 8 reveals | lap, toddler | nothing: any tap is right |
| 2 | free, 4 places | 12 reveals | lap, toddler | the same, more places and more of them |
| 3 | find, 2 places | 5 questions | toddler | which of two peeking animals is the named one |
| 4 | find, 3 places | 6 | toddler, preschool | the same among three |
| 5 | find, 4 places | 6 | toddler, preschool | the same among four |
| 6 | remember, 2 places | 5 | preschool, pre-K | where the named animal hid after all popped out and hid |
| 7 | remember, 3 places | 5 | preschool, pre-K | the same among three |
| 8 | remember, 4 places | 6 | preschool, pre-K | the same among four |

The ranges are lap 1–2, toddler 1–5, preschool 4–8 and pre-K 6–8 (`LEVELS` in `src/games/peekaboo-barn/index.ts`). A level's mode and size are `PLANS` in `logic.ts`.

**What a round draws from.** Seven animals (`ANIMALS`: cow, duck, pig, cat, dog, bunny, bear), each with one synthesized voice (`sfx.animal`: moo, quack, oink, meow, woof, hop, growl) and a spoken word; four covers (`COVERS`: hay, bush, door, crate), shuffled and cut to the level's places; one scene (`Backdrop`, seed 21, with a barn drawn behind). `deal` puts a different animal behind each place, so a round of three places has 210 possible deals. Free play sends in a newcomer who is never anyone already out. `pickTarget` never asks for the same animal twice in a row. A cover tapped in free play holds its animal out for 2.4 seconds, then it hides and someone new takes its place. In remember rounds the animals pop out 0.7 seconds apart, wait 1.4 seconds and hide.

**Misses and hints.** Free play has none. In find and remember a wrong place pops its animal out ("That's the pig! Where is the cow?"), counts one miss, and the animal goes back to peeking (find) or hiding (remember). The second miss on one question wiggles the right cover and counts one hint. The round finishes with everyone out for a bow and confetti; the score is 0 and 0 in free play. Mistakes teach by showing, so a miss in remember mode is also a look.

**Couplings.** How-to card: three `LevelLine` steps and two finish lines. Ghost finger: `touchDemo` with `autotouch()` through `spotToTap` (a rule with a test). Voice: `peek.free`, `.found`, `.look`, `.where`, `.yes`, `.notit`. Land: Barnyard, first in its list. Music: `STYLES.hub`, the island loop. Sticker: a seeded animal peeking over a hay, bush or door cover; map icon: `BarnIcon`. Browser: `ORIGINALS_ONLY=peekaboo` plays levels 1–8 (two wrong taps and the wiggle hint at every question level, saved score 0/0 for free and 2/1 for the rest, a sticker per round), `fingerdemo` plays 1–8, and the `originals` suite expects 8 history entries for this game. No couch entry, journal entry, picnic step or saved creation.

**Known gaps** (read from the code and docs; none has been seen on a device unless said).

1. **Adding an animal moves every saved sticker.** `sticker(seed)` does `rng.pick(ANIMALS)` and `BarnIcon` cycles `ANIMALS`, so any change to that list changes the picture on stickers already earned. The same trap Bubble Pop found with `FRIENDS`. New animals need their own pool and the seven pinned by a test.
2. **The how-to card has two unbounded lines.** The last step is `{ from: 6 }` and the second finish line is `{ from: 3 }`. `howto.test.ts` checks that a step is bounded only for Bubble Pop, so a level 9 would inherit "Watch who hides where, then tap the hiding place of the animal asked about" and "the round ends when every animal asked about has been found". Bound both and make the test generic.
3. **Four places overlap.** A place's hit rectangle is 260 wide and the four-place spacing is 232, so neighbours overlap by 28 units and the right-hand one wins the tap. [AGENTS.md](../../AGENTS.md#input-and-rendering-pitfalls) says to resolve close targets to the nearest. Also, the leftmost of four covers starts near x = 34 at 1024 wide, while the bottom-left pet's clearance rule starts at 150. **Needs a screenshot** before it is called a bug.
4. **Four covers cap the places at four.** A fifth place or a new scene means drawing more covers.
5. **Free play never nudges.** Only a missed question sets `Spot.hint`, so a child who does nothing on level 1 sees nothing change after the first instruction.
6. **Levels 1 and 2 differ by quantity only** (3 places and 8 reveals; 4 places and 12). The only depth a lap child has is more of the same.
7. **One scene, four covers, seven animals, no cover motion** (only the wiggle).
8. **Person checks open:** lap level 1 with a real child ([roadmap](../ROADMAP.md#needs-a-person-or-a-device)), and whether the bear's growl is kind to a one-year-old (not asked anywhere yet).

The abandon-cards page error that the 2026-10-09 ghost-finger entry in [VERIFICATION.md](../VERIFICATION.md) lists as unfixed was fixed by the scene-teardown change recorded above it in the same file (40 cards, 0 errors), so it is not a gap.

## Similar games

Peekaboo is a first game: most of its references are a tap-to-reveal toy with no ladder at all. The ladders below it are the cup game and the memory apps. **Every page below was read through search summaries only; page fetches were refused by the environment's network policy, so none of the details is quoted from the page itself.** Store listings are the developers' own words and change.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Peekaboo Barn* by Night & Day Studios ([Common Sense](https://www.commonsensemedia.org/app-reviews/peekaboo-barn), [listing](https://apps.appfollow.io/ios/peekaboo-barn/300590611?country=pw)) | app, the namesake | No levels: tap a door and an animal appears, named aloud and written in lowercase; the day ends at night when the animals go to bed; narration in several voices and languages, and parents can record their own | The ending the child can feel (our finale bow); the written name under a revealed friend as optional reading-lite | Nothing; it has no pressure |
| *Peekaboo Barn: Farm Day* ([Common Sense](https://www.commonsensemedia.org/app-reviews/peekaboo-barn-farm-day), [listing](https://apps.apple.com/app/id913731304)) | app, its heavier sequel | Tasks through a day: tap stars to wake the rooster, feed animals the food in their thought bubble, shear and clean them, put the sun down and tuck them in. The listing and the review disagree on age (3–6, 0–4, 3+) | Different tasks for different animals; a calm ending | Feeding and care (Animal Snack, Pet Kitchen and Goodnight Room hold them) |
| *Peek-a-Zoo* by Duck Duck Moose ([review](https://childrenandmedia.org.au/app-reviews/apps/peek-a-zoo), [listing](https://apps.apple.com/app/id471531262)) | app | Two modes, a whole tour or the animals you pick; the child guesses which animal is hidden, and one review describes questions such as "Which one is yawning?" | **Clues that are not the animal's name:** how it looks and how it feels (yawning, sleepy); choosing favourites | Purchases (one review mentions an in-app option) |
| *Peekaboo Zoo HD Lite* by Touch & Learn ([listing](https://apps.apple.com/app/id587372727)) | app | Tap to reveal; the child can hear the hidden animal's sound first | **The sound as the question** ("Who says moo?") | Nothing |
| *Peek-a-Boo Woods*, JumpStart Toddlers, 1999 ([wiki](https://jstart.fandom.com/wiki/Peek-a-Boo_Woods_(activity))) | CD-ROM, the project's own lineage | Two levels: clear the leaves, flowers or butterflies off the screen to reveal an animal; then match baby animals to their parents | Clearing a cover by rubbing (a lap gesture); baby and grown-up pairs | Nothing |
| *Matching Games for Toddlers and Preschoolers* ([review](https://igamemom.com/matching-games-for-toddlers-and-preschoolers/)) and *Memory Games For Kids* with its Peekaboo monsters ([listing](https://toucharcade.com/games/memory-games-for-kids)) | apps | A hide-and-seek mode: after a brief look the scene goes dark and the child finds 6–8 characters with a flashlight; the toddler version uses 3–5 and leaves the shadows visible. Kidloland unlocks its categories by purchase | **Shadows left visible** as scaffolding for the youngest | Six to eight characters (more than we hold at four) and the flashlight; the purchases |
| *Shell Game* by Duckie Deck ([listing](https://chrome.google.com/webstore/detail/shell-game-at-duckie-deck/bkggpmiilmbfpkkpgadbpfepannagnah/support)) and the cup game in a Brookes Publishing handout ([PDF](https://brookespublishing.com/wp-content/uploads/2021/06/FreeHandouts.pdf)) | web game and a physical activity | The ball goes under one cup, the cups move, the child picks. The handout starts with one cup and builds to three; a general cups article advises slow shuffles before fast ones | **Staging: one swap, then more, always slow**; one hidden thing at first | Speeding up the shuffle; the carnival's betting |
| *Where's Spot?* by Eric Hill ([listing](https://jarrold.co.uk/departments/books/hobbies-crafts-and-puzzles-books/novelty-and-activity-books/wheres-spot-9780723263661)) | picture book, the first lift-the-flap | Each flap shows a surprise animal before the one being sought is found; made for a two-year-old | The question that has a different answer than the first flap ("Where's {pet}?") | Nothing |
| *Pop-Up Pals* by Battat ([product](https://battat.com/products/pop-up-pals-bt2531)) | physical toy, 18 months and up | Four animals, each released by a different action (turn, press, flip, slide) | **Each cover opens its own way** | Nothing |
| *Guess Who?* by Hasbro ([instructions](https://instructions.hasbro.com/en-au/instruction/guess-who-classic-game)) | board game, 6 and up | Yes/no questions about attributes flip faces down until one is left | **Choosing by attributes**, as a single spoken clue with no flipping | Two players, secret choice, a wrong guess ending the game |

**Developmental sources** (secondhand; none checked against the original).

- **Object permanence.** The usual account has the child failing the "A, not B" search at about 8–12 months and tracking an object that was hidden, retrieved and hidden again by 12–18, with tracking one that moved while hidden ("invisible displacement") placed later; full mastery is put at 18 months or more ([Wikipedia summary](https://en.wikipedia.org/wiki/Object_permanence)). The stages are contested: Cummings and Bjork (1981) found that 12- to 14-month-olds did not make the A-not-B error on invisible displacement with five locations, and put errors down to memory ([PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/Cummings_EBjork_1981a.pdf)). Ages are loose, so the plan does not claim to measure her.
- **Animal sounds are first words.** A speech-language milestone sheet lists imitating animal sounds among the 12–18 month markers ([Northern Health](https://northernhealth.ca/sites/northern_health/files/services/speech-language/documents/milestones%2012-18.pdf)). This is why a lap round speaks the sound and the name together.
- **Visual closure** (recognizing a whole from a part) is still developing in the second year of life ([Forbes and Plunkett](https://journalpub.escholarship.org/cognitivesciencesociety/article/27502/galley/17138/download)); I found no preschool norms.
- **Spatial memory.** A review argues hide-and-seek strengthens spatial memory ([article](https://doi.org/10.29303/jku.v12i4.1007)). A search summary put the span of four-year-olds at about 2.5–3 in a Corsi-style task that asks for a *sequence* of locations ([review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5504534); I could not confirm that page was the source). Remember mode asks for one location among N, which is easier, so this is not a ceiling for it.
- **Spatial words.** Kindergarten geometry asks children to describe positions with above, below, beside, in front of, behind and next to ([K.G.A.1](https://thecorestandards.org/Math/Content/K/G/A/1/)).

## What makes sense here

**A first toy with a short ladder on top.** The audit's round three put Peekaboo Barn under "more hiding is memory load" and proposed only new scenes and animals. The developer's 2026-10-10 note asks for more quantity. The two agree for the youngest bands: **fresh content** (covers that move, scenes, animals who name their feelings, cover names) adds hours with no new rule. For the older bands, the levels on top below ask for **new kinds of decision**, not more items to hold: choose by a word or a feeling, recognize from a part, follow a swap, combine two clues. Items stay at four or fewer and nothing is timed. They **override the audit's leave**, so they wait on a decision, as Bubble Pop's did.

**Fits.**

- **Clues that are not a name** (*Peek-a-Zoo*, *Guess Who?*): Critter already draws moods (`setMood`) and has spec fields for ears, snout, spots, horns and whiskers, so a clue can be read from the data and a test can check the voice never lies.
- **The sound as the question** (*Peekaboo Zoo*), **a cup game's staging** and **a visible displacement** for the younger bands, all of which wait on level order.
- **Covers that open their own ways** (*Pop-Up Pals*) and **cover names** ("behind the haystack") for lap and toddler: cause and effect, plus a place word.
- **Scenes and animals.** Both are quantity; the animals need new art and voices, costed apart.
- **The pet as a hiding friend** and **the written name** are optional personal touches.

**Arc by band.** Lap: one door, then any cover, covers that open differently, who names itself, "where did it go". Toddler: finding a named animal among two to four, who says moo, hiding an animal yourself. Preschool: finding and remembering by name, then "who is sleepy?" and "who has spots?". Pre-K: remembering, then recognizing from ears, then a switch. School (a new window, a decision): the switches with four places and two-clue "guess who".

## Proposed ladder

### Fresh content inside existing levels

All ready; none needs a decision. The rule tests are named for each.

1. **Guards first.** Pin the seven animals for the sticker and icon and give new animals their own pool (known gap 1); bound the how-to's last step and finish line and make the bounded-step test generic (gap 2); resolve a tap to the nearest place when hit areas overlap (gap 3); and nudge in free play: after six seconds without a touch one cover wiggles and gives a small sound, with no hint counted. Tests: the sticker pool is exactly the seven in order; every how-to line is bounded; a point between two places resolves to the nearer; the nudge never fires while an animal is out.
2. **Covers that open their own ways** (all levels). The door swings on its two diagonals, the haystack rustles and parts, the bush shakes and sheds a leaf, the crate lid lifts (*Pop-Up Pals*). A soft sound for each. Cost S–M, drawn in code on the existing covers; no rule.
3. **Cover names said aloud** ("Behind the haystack, a cow!"). One line per cover for `peek.found` and `peek.yes`; the preposition "behind" arrives with the picture. Test: every cover has a name and a line, names are unique.
4. **Scenes picked by the round's seed:** a garden (flowerpot, sunflower, wheelbarrow, rock), a beach (umbrella, sandcastle, bucket, towel) and a bedroom (blanket, toy box, curtain, bed), beside the barnyard. Each is a `Backdrop` style and four to six covers of about 230 by 150 with the top at −150, so the poses fit. The sticker and the map icon stay on the barnyard. Test: each scene has at least four covers, all named, none repeated in a round. A **screenshot per scene** checks that every animal reads against its cover.
5. **Animals who name how they feel** (levels 1–2 and as the seed of level 9). Sometimes the animal that pops out is sleepy, surprised or singing (`setMood`), and the voice says it: "A sleepy cow!" Six mood words are new language, all drawn already. Test: every mood used has a line.
6. **More animals,** costed in two parts. *Art:* `CRITTERS` has only the seven, and a sheep, horse, hen or mouse needs new `CritterSpec` parts (wool, mane, comb, a color the palette may lack) in the shared `critter.ts`, with every part off by default so no other game changes. *Voice:* `sfx.animal` has exactly seven sounds, so each newcomer needs a synthesized baa, neigh, cluck or squeak. Lean: sheep, horse, hen and mouse, entering at level 4 and above, so the youngest levels keep the seven first words. Tests: every animal has a voice, a word and a sound; every level's pool is larger than its places; the sticker still draws from the seven.
7. **{pet} hides too.** Once a round, as a surprise friend, "It's {pet}!" — never asked for, so never a miss. Cost M, after a read of `src/art/pet.ts` for its size and pose.
8. **The written name under a revealed friend,** in lowercase, with the voice always saying it (the namesake app does this). Optional reading-lite; no phonics claim until device speech is checked.
9. **Co-play and off-screen lines** for the above: "Cover your eyes and ask 'where's the cow?'", and for the moods "Make a sleepy face together".

### New levels on top

All seven override the audit's leave and so wait for decisions 1 and 2. IDs are appended, never inserted. They keep the places at four or fewer, nothing is timed, and a tap is only taken when the houses are still. Order is by learning axis, easiest first within each: the step-up rule assumes a level is not easier than the one below it, so this is flagged in decision 2.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Who has…? | pre-K, school | Three animals peek, one with sleepy eyes: "Who is sleepy?" Later: "Find the one with spots" | which peeking animal matches a feeling or a part word | A wrong animal pops out and the voice names what it has ("That's the pig. Pigs have round snouts. Look for spots!"); two misses glow the right one (a hint) | the clue holds for exactly one animal present; every part word is read from `CRITTERS`' fields and every mood from the animals' set moods; a deal with no unique clue is redealt | S–M. Plan fields `mode: 'clue'`, `spots: 3`, `goal: 5`; about 16 voice lines; no art; a bot that taps the clue's holder |
| 10 | Whose ears? | pre-K, school | Three animals show only the top of the head over the cover; "Where is the bunny?" The long ears give it away | recognizing an animal from a part | A wrong animal rises, says hello and drops back to the top pose; two misses raise the right one to a full peek for a moment (a hint) | the tops (shape and color) of the animals present are all different; the asked animal is present | M. A new pose (`top`, about −10 with a screenshot check that every animal's top shows); a `topOf` rule; the abandon-cards case |
| 11 | Whose ears? (four) | pre-K, school | Four tops; "Where is the cat?" | the same among four, where the pointy ears of pig and cat differ by color | As 10 | As 10, over every deal of four | S after 10; a plan entry |
| 12 | Switcheroo | pre-K, school | Three animals pop out, say who they are and hide; two houses trade places in a slow arc ("Switch!"); "Where is the cow?" | follow a house through one swap | A wrong house pops out its animal and hides again; two misses replay the swap slowly with the right house glowing (a hint). The houses cannot be tapped while moving | `applySwaps` is a permutation; the two swapped houses differ; the asked animal's house changes; each swap lasts at least 0.9 s; no more than three swaps; the final place is unique | M. Swap tween with an arc so houses do not overlap; z-order; voice `peek.switch`; a bot that follows `finalIndex`; the harness |
| 13 | Switcheroo again | pre-K, school | Three houses, two swaps | follow two swaps | As 12 | As 12, with two swaps | S after 12 |
| 14 | Switcheroo, four houses | school (pre-K top left to the developer) | Four houses, three swaps | follow three swaps among four | As 12 | As 12, with four houses and three swaps | S after 12 |
| 15 | Guess who! | school | Four animals peek: "I have floppy ears and spots." | combine two clues; neither alone is enough | A wrong animal says what it does and does not have ("The dog has floppy ears, but no spots. Look for spots too!"); two misses glow the right one | each clue pair is held by exactly one animal present; each single feature is held by at least two; every reply states only true facts from the spec | M. Two-slot voice composition; about 12 reply lines; a bot that taps the unique holder |

Windows (lean): lap 1–2 and toddler 1–5 unchanged; **preschool 4–8 unchanged; pre-K 6–13; school 9–15** (school's lower bound is new, so no saved level moves). A six-year-old therefore starts at "Who has…?" and climbs quickly. Alternative: pre-K stays 6–8 and the new levels belong to school.

Sketches, not levels: **not clues** ("no spots", "not pink": logic words past *and*), **who is still hiding?** (three come out, the fourth stays in; she picks its picture from a tray of choices: identity from a set rather than a place, a new interaction), **ordinal houses** ("the second house"), **baby and grown-up pairs** (the namesake of *Peek-a-Boo Woods* level 2; needs baby art). "Next to" and "between" stay in Peekaround Island.

### Younger-band openings

**None to add.** Lap is the lowest band and level 1 already has no miss. A **school** window is the upper-band opening in the table above; it is the one real fit risk, since a seven-year-old may find a barn babyish, and decision 2 asks.

### Levels below level 1 (waiting on the level-order decisions)

These are easier than levels that exist, or fall between them, so they wait on [how levels are ordered and whether a range may skip](../ROADMAP.md#waiting-on-the-developer). IDs are assigned when built (16 and up).

| Entry | Band and place | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- |
| **One door** | lap, before level 1 | A single big house in the middle. Any touch anywhere opens it ("Peekaboo!"), a new animal each time who names itself; after 6 seconds without a touch it opens by itself. Six pops | nothing | None: no miss, no hint | the stage-wide input always opens the door while it is closed; the animals cycle and never repeat the last; the self-opening is at least 6 s | S. A stage-wide hit area last in the stage, no art, one line. A person check: whether she swats or looks first. A no-decision alternative: make level 1's first two reveals one door |
| **Where did it go?** | lap and toddler, between 2 and 3 | One animal trots across the front and hops behind one of two houses. "Where did the cow go?" She taps the house | where something went (visible displacement); no names to remember | An empty house wiggles and says "Nobody home"; two misses make the right house wiggle and the animal's voice sounds again (a hint) | exactly one house holds the animal; the walk ends at its house; the other houses are empty | M. A walk path and an empty-house response; no stereo pan (the audio layer has none); the bot taps the house |
| **Who says moo?** | toddler, between 3 and 4 | Two animals peek. A sound plays, "Who says moo?" | which animal makes the sound (*Peekaboo Zoo*) | A wrong animal pops out and says its own voice ("That's the pig. Oink!"); two misses glow the right one | every animal's sound is distinct; the asked sound belongs to an animal present | S–M. Reuses find; one line; a sound per new animal |
| **Hide it yourself** | toddler and preschool | An animal waits at the side; she drags it to a house and it hides; the pet looks in the wrong houses first, then "Peekaboo!" Three hides | where to hide (a free choice) | None: she cannot be wrong | the seeker never repeats a house and ends at the hiding one; a drop resolves to the nearest house | M. `drag.ts` with the animal riding above the finger; the seeker is voice and wiggles (the corner pet only cheers today). Co-play: a grown-up covers their eyes |

### Left out on purpose

- **Feeding, shearing and tucking in** (*Farm Day*): Animal Snack, Pet Kitchen and Goodnight Room hold care and bedtime.
- **Six to eight hidden characters and a flashlight,** or any speed-up of a shuffle: more memory load and pressure than the rules allow; the swaps stay at least 0.9 seconds.
- **Counting what is hiding, adding and taking away:** Duck Pond 11 (hiding ducks) and its adding levels hold them. **Patterns of who hides next:** Pattern Train.
- **A timer, a wrong-guess penalty, categories unlocked by purchase** (*Kidloland*, *Peek-a-Zoo*'s option).
- **Position in a turned world** (in front of, behind, next to): Peekaround Island.
- **A couch entry:** a calm toy; the co-play line covers it.

## Decisions for the developer

1. **Override the audit's "more hiding is memory load" for levels 9–15?** Lean: yes for 9, 10, 11 and 15 (no extra items), and yes with limits for the Switcheroo levels (12–14: items stay at four or fewer, nothing is timed, the swap is slow and the hint replays it). If no, the fresh content and the below-level-1 entries stand alone.
2. **Windows and the school band.** Lean: pre-K 6–13, school 9–15, preschool unchanged. The step-up rule assumes each level is not easier than the one below it; "Who has…?" (9) is easier than remember with four places (8), so say whether that is acceptable or whether a single "new axis" level may be easier.
3. **Level order for the entries below level 1.** One door, Where did it go?, Who says moo? and Hide it yourself join the existing two level-order rows. Lean: do the general fix (an explicit order apart from the saved IDs) before building more than one such entry.
4. **New animals.** Lean: sheep, horse, hen, mouse, with new parts in `critter.ts` (off by default), entering at level 4 and above. If no, scenes and moods carry the fresh content.
5. **{pet} as a hiding friend, and the written name.** Lean: yes to both after reading `pet.ts`; neither can be a miss.
6. **Person checks to add:** whether a one-year-old swats one door (lap), whether the bear's growl is gentle, whether a four- or five-year-old can follow a 0.9-second swap, and device speech for the feeling and part words.

## Build slices, in order

Each is sized for one session. Slices that add a level are built in level order so saved IDs stay unbroken. Each level slice also updates `scripts/browser-check.mjs` (its Peekaboo loop stops at level 8, and `originals` expects 8 history entries), the `fingerdemo` levels, the how-to `LevelLine`s, `describeLevel`, the README row and GAMES.md.

1. **Guards, covers that move and cover names** (ready, no decision). Pin the sticker pool; bound the how-to lines and make the test generic; nearest-place taps; the free-play nudge; cover motions; cover names. Tier: typecheck, the game's rule tests, the how-to test, `ORIGINALS_ONLY=peekaboo` filtered to levels 1, 5 and 8, and one portrait screenshot (also the gap-3 clearance check).
2. **Scenes** (ready; each a sub-slice: garden, beach, bedroom). Tier: rule tests and one screenshot per scene.
3. **Animals who name how they feel,** then **more animals** with their voices (ready; decision 4 for the last). Tier: rule tests, `critter.test.ts`, a screenshot of all eleven and `fingerdemo` at level 1.
4. **{pet} hides too** and **the written name** (ready after reading `pet.ts`).
5. **Level 9, Who has…?** (needs decisions 1–2). Tier: new level on an existing interaction: rule tests, one browser play of level 9 and `fingerdemo` at it.
6. **Levels 10–11, Whose ears?** (needs the top-pose screenshot first). Same tier.
7. **Levels 12–14, Switcheroo.** Same tier, plus the abandon-cards stress, since a tween that moves covers can outlive its scene.
8. **Level 15, Guess who!** Same tier.
9. **The below-level-1 entries** (wait on decision 3; One door first, Where did it go? second).
10. **Sketches:** not clues, who is still hiding, ordinal houses, baby and grown-up pairs.

## What was built in this session

Nothing: a deep dive session is research and ideation only. `git diff --check` and a relative-link check ran on the changed docs.
