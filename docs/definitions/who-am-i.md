# Who Am I?, levels 1–4 (definition)

Defined 2026-10-19 as slice **Z1** of the [zoo-animals study](../deep-dives/subjects/zoo-animals.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/zoo-animals.md#a-first-games-ladder-who-am-i), its [cast table](../deep-dives/subjects/zoo-animals.md#the-cast-and-what-it-costs) and the [IDEAS row](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line, art move or save field exists yet. **Ready to build** (Z3 builds levels 1–3 after Z2 moves the art; Z4 adds the bat and level 4): every open call below has a default the build can use. The one gate that is not a default is the **trait table review** in [decision 1](#open-decisions): the table below is a draft with its doubtful cells marked, and the build ships it only after the review named there.

**Fun action and purpose:** a row of friends stands on the barn's stage. The pet gives one clue, spoken and shown as a picture sign ("I have feathers"). She taps a friend the clue rules out and it waves and ducks behind its card; when only one friend is left it jumps out: "It's me! Duck!" The learning goal is **grouping animals by their features**: feathers, fur, a shell, fins, eggs or milk, and later the surprises that the groups go by features and not by flying or swimming (a penguin has feathers and cannot fly; a bat flies and feeds its babies milk). It practises elimination reasoning (a clue says who stays and who goes) at pre-K, and the five vertebrate groups by their defining features at school, which is what England's Year 1 science names and NGSS 2-LS4-1 bounds to features rather than names ([the study's anchors](../deep-dives/subjects/zoo-animals.md#anchors-and-evidence-limits)).

## References

No new source was opened for this definition; the study's anchors and its [similar-games table](../deep-dives/subjects/zoo-animals.md#similar-games-apps-and-physical-play) apply. Two recalled games shape the round and are listed so the build knows what was taken.

| Reference | What it shows | What Who Am I? takes or rejects |
| --- | --- | --- |
| *Guess Who?* (Hasbro board game, recalled, not played this session) | Two boards of face cards; each yes/no question flips down the faces it rules out until one stands | **The flip-down.** A ruled-out friend goes face down and stays visible as a card, so she can see who is gone and who is left. Rejects the opponent, the race and the questions at levels 1–4: the pet gives the clue, and asking her own questions is level 6 of the ladder |
| Twenty Questions (unplugged; the study's row) | One person thinks of an animal; others narrow it with yes/no questions | The shape of the family car game the Z8 card describes; nothing in the round itself. Rejects a question limit |
| Ohio State, *Beyond Penguins and Polar Bears* misconceptions page (opened by the study) | Pupils believe whales are fish and bats drink blood | Level 4's surprises are worth a level; the bat's clues say what the **island's** fruit bat eats and nothing about all bats, and the blood myth is never raised |
| England national curriculum, science Year 1 (opened by the study) | Identify and name common animals that are fish, amphibians, reptiles, birds and mammals; compare their structure | The five groups, each defined here by features a six-year-old can see or hear in a clue, and never asked for by name |

## Overlap

- **Critter Sort** (Barnyard) places synthetic critters by a stated or guessed rule into hoops. Who Am I? narrows a gallery of real animals to one by successive clues; real vertebrate groups as hoop signs in Critter Sort stay that game's deep-dive decision, and this game never asks her to sort.
- **Memory Match** turns cards over to find pairs; here a card turns over only to hide a ruled-out friend, nothing is remembered, and a face-down friend can always be peeked at for free.
- **Photo Safari** finds a described thing in a scene; its "who is awake at night" rounds come from the Night Garden kit (Z5), not from here.
- **Peekaboo Barn** opens doors to meet animals and name feelings; the "It's me!" jump-out borrows its reveal and nothing else.
- **Animal Snack** and **Habitat Helpers** own feeding and needs; no food or home clue appears here (the study's K-LS1-1 note).
- **Sink or Float** owns free predictions; this game has none, because a clue is a fact, not a guess.
- No shipped game asks which friend a feature picks out. Level 5 (which group?), 6 (you ask), 7 (make a riddle) and 8 (platypus) are later slices of the same ID, never new registrations.

## The model

- **A friend** is an authored record: `id`, a spoken name, its `group` (`mammal`, `bird`, `amphibian`, `reptile`, `fish`), its art source, and the set of **features** true of it. Pip, the pet, is never a card: it gives the clues.
- **A feature** is a clue ID with a picture sign and a first-person spoken line, in a **family** that decides how a miss is worded. The line is about this friend ("I lay eggs"), never about a whole group.

  | Family | Feature | Sign | Spoken clue | True of |
  | --- | --- | --- | --- | --- |
  | covering | `feathers` | a feather | "I have feathers" | duck, owl, penguin |
  | covering | `fur` | a fluffy patch | "I have fur or hair" | cow, pig¹, cat, bear, dog, bunny, bat |
  | covering | `shell` | a domed shell | "I have a hard shell" | turtle |
  | covering | `scales` | overlapping scales | "I have scales" | fish² |
  | covering | `smooth-skin` | a shiny green patch with drops | "I have smooth, wet skin" | frog |
  | parts | `wings` | a wing | "I have wings" | duck, owl, penguin, bat |
  | parts | `beak` | a beak | "I have a beak" | duck³, owl, penguin |
  | parts | `fins` | a fin | "I have fins" | fish |
  | parts | `four-legs` | four footprints | "I have four legs" | cow, pig, cat, bear, dog, bunny, frog, turtle |
  | parts | `two-legs` | two footprints | "I have two legs" | duck, owl, penguin, bat |
  | babies | `eggs` | an egg | "I lay eggs" | duck, owl, penguin, frog, turtle, fish⁴ |
  | babies | `milk` | a nursing calf | "I feed my babies milk" | cow, pig, cat, bear, dog, bunny, bat |
  | moving | `fly` | a wing with motion lines | "I can fly" | duck, owl, bat |
  | breathing | `gills` | gill lines under water | "I breathe under water with gills" | fish |

  Marked cells are **reviewer cases** ([decision 1](#open-decisions)): ¹ a pig has bristly hair, so the clue says "fur or hair" and the sign is a fluffy patch, or pig leaves `fur` rounds ([decision 4](#open-decisions)); ² the turtle gets `shell`, never `scales`, so the two kinds of scales never share a sign; ³ a duck's bill counts as a beak; ⁴ `eggs` is true of **these** friends (the island's fish and turtle), and the line is first person because not every fish or reptile lays eggs. `swims`, `lives in water`, `whiskers`, `tail` and `horns` are **never clues**: swimming does not sort anything, and the last three are about the drawing rather than the animal. `fly` appears only at level 4 and is never used to define a group.

- **The cast in this slice** (art from the study's table; Z2 moves the four in-game drawings to `src/art/`, Z4 adds the bat):

  | Friend | Group | Features | Art |
  | --- | --- | --- | --- |
  | cow, pig, cat, bear, dog, bunny | mammal | `fur`, `four-legs`, `milk` | `CRITTERS` |
  | duck | bird | `feathers`, `wings`, `beak`, `two-legs`, `eggs`, `fly` | `CRITTERS` |
  | owl | bird | as duck | Owl Walk's `Critter` |
  | penguin | bird | `feathers`, `wings`, `beak`, `two-legs`, `eggs` (no `fly`) | Penguin Slide's `penguinArt()` |
  | frog | amphibian | `smooth-skin`, `four-legs`, `eggs` | Frog Hop's `frogArt()` |
  | turtle | reptile | `shell`, `four-legs`, `eggs` | Mossy Path's `turtle()` |
  | fish | fish | `scales`, `fins`, `eggs`, `gills` | Bubble Pop's `fish()` |
  | bat (level 4, Z4) | mammal | `fur`, `wings`, `two-legs`, `milk`, `fly` | new: a `Critter` with pointy ears and a membrane-wing part |

- **A round** is a seeded gallery (an ordered list of friends), an **answer** (one of them) and an ordered list of **clues**, each true of the answer. `keeps(clue, friend)` is the table lookup; `ruledOut(remaining, clue)` is the remaining friends the clue is false of. A clue is **useful** for a remaining set when it rules out at least one friend and keeps the answer. Applying the clues in order leaves exactly the answer.
- **Generation** (`planFor(level)` plus `ctx.rng`): draw the gallery from the level's pool, draw an answer that is **distinguishable** (no other friend in the gallery has every feature the answer has: the penguin can be the answer only in a gallery without the duck or the owl, the bat in any), then build the clue list greedily from the level's allowed features, choosing at each step a useful clue at random, until one friend is left; reject and redraw (bounded, the test proves it terminates in the seeds it runs) if the list does not reach the level's clue count exactly, or if a level's extra condition (below) fails. The same seed gives the same round; the answer and the gallery order vary across seeds.
- **A miss reason** is built from the family of the current clue: for `covering` and `babies` every friend has exactly one feature in the family, so the line is "{name} has {feature}, not {clue}" ("Cow has fur, not feathers"; "Duck lays eggs, not milk" is worded by the feature's own reason text, "lays eggs"); for `parts`, `moving` and `breathing` the line is the contrast in `contrast(friend, clue)`: "{name} has two legs, not four", "Cow has no wings", "Penguin can't fly", "Frog breathes air". Every (friend, clue) pair where the clue is false has a reason text, and a test checks the table is complete.

## Screen and controls

- **Landscape (1024×768 design area):** the barn's little stage: a plank floor, a curtain across the top, the **clue sign** (a 320×130 picture sign hanging centre top, the feature's picture with a small speaker mark) and the **gallery** of three to six **friend cards** in one row across the middle (a card is 200×240 units at three or four cards, 160×210 at six: at least 100 both ways after scaling), spread by `spread()` clear of the pet's corner (150 units bottom-left) and the home button top-left. The pet is the corner guide and gives every clue.
- **A friend card** shows the friend standing on a little base with its name hidden (names are spoken, never written as the task). Touch-down lifts the card and the friend peeks out at once. A tap on a face-up card is the action (below). A tap on a **face-down** card is a free **peek**: the friend waves from behind the card for a second and the card stays down.
- **The clue sign:** a tap repeats the clue aloud; free, any time. When a new clue arrives the sign swings in and the pet speaks it; the old sign slides to a small strip at the right edge (the **clues so far**, 90-unit thumbnails, tappable to hear again, free).
- **Level 1 action:** tap the friend the clue fits. It hops to the front, "It's me! Duck!", the round finishes. Tapping a friend the clue does not fit is a miss (below).
- **Levels 2–4 action:** tap a friend the clue rules out: the card flips, the friend waves and hides, a soft whoosh. When every friend the current clue rules out is face down, the next clue arrives by itself (0.6 s later); after the last clue the one friend left jumps out. Tapping a face-up friend the clue keeps is a miss: the card half-turns, flips back, and the pet gives the reason ("Duck has feathers, so Duck stays!").
- **Portrait:** the sign stays centre top, the cards sit in two rows (two over two, or three over three) in the upper middle, the clues-so-far strip moves to a row under the sign, and the pet keeps its corner. `galleryLayout(view, n)` returns every rectangle and a test asserts sizes and clearances at the four views for `n` in 3..6.
- **Finish:** the friend left jumps out of its card, says its name, and the hidden friends pop up and wave; then `ctx.finish`.
- **Sound and music:** a soft whoosh per flip, a two-note pentatonic rise when a friend jumps out, the gentle boing on a miss; the land's music keeps playing (not `silenced`).

## Levels

| Level | Name | Bands (default) | Gallery and clues | What she decides | Finish |
| --- | --- | --- | --- | --- | --- |
| 1 | **One clue** | pre-K, school | 3 friends, 1 clue from `feathers`, `fur`, `shell`, `fins`, `smooth-skin`, `wings`, `beak`, `four-legs`, `two-legs`; exactly one friend fits | Which friend has the feature | Tap the friend who fits |
| 2 | **Turn them over** | pre-K, school | 4 friends, 2 clues from the same set; each rules out at least one friend; the second leaves one | Who each clue rules out, and who stays | The last friend jumps out |
| 3 | **Groups by features** | school | 6 friends from at least four of the five groups; 3 clues, at least two of them from `covering`, `babies` or `breathing` | The same, with the features that define the groups | The last friend jumps out |
| 4 | **Surprises** | school | 6 friends always including the penguin and the bat; 3 clues, with at least one **surprise step** (below) | That the group goes by features, not by flying | The last friend jumps out, and the pet explains the surprise once |

A **surprise step** is a clue, applied to a remaining set, whose outcome differs from a shortcut a child might use: `fly` while the penguin remains (the penguin has feathers and goes face down), `feathers` or `eggs` while the bat remains (the bat has wings and goes face down), or `milk` while the bat and a bird both remain (the birds go, the bat stays). After the surprise's flips the pet says the one explanation: "Penguin has feathers, so Penguin is a bird. Penguin just can't fly!" or "Bat can fly, but Bat feeds its babies milk, so Bat is a mammal." Said once per round, free.

Levels 5–8 of the study's ladder (which group?, you ask, make a riddle, platypus) are later definitions appended above 4; a preschool opening, if play shows one is wanted ([decision 2](#open-decisions)), goes below 1 with `order` so a saved level never shifts.

### First rounds

- **Level 1 (cow, duck, cat; clue `feathers`):** the pet: "Who am I? I have feathers!" The sign shows a feather. Tapping the cow: it half-lifts, the boing, "Cow has fur, not feathers." Tapping the duck: it hops forward, "It's me! Duck!", the cow and cat clap, the round finishes.
- **Level 2 (bunny, frog, owl, turtle; clues `four-legs`, `shell`):** "I have four legs!" Tapping the frog: half-turn, flip back, "Frog has four legs, so Frog stays!" (one miss). She turns over the owl (whoosh); the next clue swings in: "I have a hard shell!" She turns over the bunny and the frog, and the turtle jumps out: "It's me! Turtle!"
- **Level 3 (fish, frog, duck, bear, turtle, cat; clues `eggs`, `four-legs`, `smooth-skin`):** "I lay eggs!" turns over bear and cat; "I have four legs!" turns over fish and duck; "I have smooth, wet skin!" turns over the turtle, and the frog jumps out.
- **Level 4 (penguin, bat, owl, dog, fish, turtle; clues `wings`, `eggs`, `fly`):** "I have wings!" turns over dog, fish and turtle, leaving penguin, bat and owl. "I lay eggs!" is a surprise step: the bat goes face down though it has wings, and the pet explains the bat once. "I can fly!" is the second: the penguin goes face down though it has feathers, the pet explains the penguin, and the owl jumps out: "It's me! Owl!"

## Accounting, help and finishing

- **Never a miss:** tapping the clue sign or a thumbnail in the strip, peeking at a face-down card, tapping the pet, a tap during a flip or the jump-out (ignored), or a tap after the round is done.
- **A miss, level 1:** tapping a friend the clue does not fit, with the reason line. After two misses in a round the fitting friend's card glows and `hints++` once.
- **A miss, levels 2–4:** tapping a face-up friend the current clue **keeps**; the card flips back with the reason line. After two misses on one clue the cards that clue rules out shimmer together and `hints++` once for that clue.
- **Show a hint** in the pause sheet (`Scene.pauseActions`): the same glow or shimmer, counted at most once per round (level 1) or per clue (levels 2–4); asked again it only repeats the clue. **Start again** rebuilds the same seeded round and keeps misses and hints.
- **The surprise explanation** at level 4 is not a hint and counts nothing.
- **Finish:** `ctx.finish({ misses, hints })` when the last friend jumps out, with or without help: one ordinary sticker from the shell. No creation, discovery or journal entry is filed in this build ([decision 7](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Table:** every friend has exactly one `covering` feature and exactly one `babies` feature; every friend in `bird` has `feathers` and `eggs`, every `mammal` has `fur` and `milk`, the amphibian has `smooth-skin`, the reptile `shell`, the fish `scales`, `fins` and `gills`; no friend has both `eggs` and `milk` (true until the platypus, when this test changes); the penguin lacks `fly` and the bat has it; `swims`, `whiskers`, `tail` and `horns` are not feature IDs.
- **Reasons:** for every (friend, clue) pair where `keeps` is false, a reason text exists and names a feature the friend actually has (or a stated "no" contrast); for every true pair, a "stays" text exists.
- **Rounds:** for every level over 500 seeds: the gallery size, group spread and clue count match the plan; every clue keeps the answer; every clue rules out at least one friend remaining when it is given; the answer is distinguishable in its gallery; applying the clues in order leaves exactly the answer; level 1's single clue fits exactly one friend; the same seed gives the same round; every friend in the pool is the answer at least once across the seeds.
- **Level 4:** every round contains the penguin and the bat and at least one surprise step; a shortcut scorer (`fly` ⇒ bird, `wings` ⇒ bird, no `fly` ⇒ not a bird) gets at least one flip wrong in every round.
- **Hints:** at level 1 the glowed card is the answer; at levels 2–4 the shimmer set equals `ruledOut(remaining, clue)` and flipping exactly that set advances the clue.
- **Accounting:** a scripted level 2 round with one keeps-tap, one correct flip, two more keeps-taps on the same clue produces misses 3, hints 1; a second help request on that clue leaves hints at 1.
- **Layout:** `galleryLayout` at the four views for 3 to 6 cards: every card at least 100 units each way, the pet's corner clear, the sign and strip inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including Barnyard still fitting on one screen at every band with its new count.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` at level 1: tap the clue sign (hear it), tap one friend the clue does not fit (the reason), then tap the friend who fits. At levels 2–4: tap the sign, then flip every friend in `ruledOut(remaining, clue)` left to right, wait for the next clue, repeat. It never taps a friend the clue keeps. The same bot drives the scripted play, and its one deliberate wrong tap at level 1 shows that a miss is explained, not punished.
- **How-to card** (`src/content/howto.ts`). Goal: "Listen to the clue and find the friend it is about."
  - Steps: "Tap the sign any time to hear the clue again" (all levels); "Tap the friend the clue fits" `{ from: 1, to: 1 }`; "Tap each friend the clue rules out to turn it over; the next clue comes when they are all down" `{ from: 2, to: 4 }`; "Tap a turned-over friend to peek at it" `{ from: 2, to: 4 }`.
  - Finish: "The last friend left jumps out and says its name" `{ from: 2, to: 4 }`; "The friend who fits jumps out and says its name" `{ from: 1, to: 1 }`.
  - Notes: "Hearing a clue again and peeking at a hidden friend are never counted against her" (all levels); `{ from: 1, to: 1 }`: "Tapping a friend the clue does not fit counts as a miss, with the reason spoken; after two the right friend glows, which counts as a hint"; `{ from: 2, to: 4 }`: "Turning over a friend the clue keeps counts as a miss, with the reason spoken; after two on one clue the friends it rules out shimmer, which counts as a hint"; `{ from: 4, to: 4 }`: "Some clues surprise: the penguin has feathers but cannot fly, and the bat flies but feeds its babies milk. The pet explains each once."
- **Voice lines** under `whoami.*`: `intro`, `instruct-fit` (1), `instruct-turn` (2–4), `next-clue`, one `clue.<feature>` per feature in the table, `reason.not` (with `{name}`, `{has}`, `{clue}`), `reason.no` (with `{name}`, `{clue}`), `reason.stays` (with `{name}`, `{has}`), `surprise-penguin`, `surprise-bat`, `hint-glow`, `hint-shimmer`, `its-me` (with `{name}`), `done`. Friend names come from a `names` table in `logic.ts` and are spoken, never shown as text to read. `{pet}` is optional in each.
- **Registration:** ID `who-am-i`, name "Who Am I?", spoken title `game.who-am-i` ("Who am I?"). Region (subject) `barnyard`. Skills `['animals', 'attributes', 'classification', 'logic']` (free strings; `classification` is new). Bands: pre-K 1–2, school 2–4 ([decision 2](#open-decisions)); Z3 registers school 2–3 and Z4 raises it to 4. Home land **Barnyard** by default (6 games today, 7 with Bolt Boards' pending definition, 8 with this one; [decision 3](#open-decisions)). Hub icon: a friend card with a question mark and a duck peeking over its top. Sticker: a seeded friend jumping out of its card.
- **Co-play:** a grown-up says the clue in their own words before the pet does, or plays keeper: covers the sign and gives the clue by acting it out. **Off-screen** (spoken tip only; the printed car-game and Zoo Detective cards are Z8 after review): "In the car, think of an animal and let her ask what it has."
- **Couch:** none. A two-player version is level 6's "you ask" with a keeper, not a face-off.
- **Rework couplings:** none required and nothing saved. The friend cards are a natural source of pages for the [RW10](../rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) collection book (a friend's page could list its features once she has found it), which is the rework's to define; a found friend must then be a permanent page, never one that waits or wears out.

## Check tier

Z3 (levels 1–3) is the new-game tier: typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 3, with one wrong tap, one keeps-tap and one requested hint; one portrait screenshot at level 3 with three cards face down; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change, and Z2's art move touches four games (their filtered suites, one play each, are Z2's check). Z4 (level 4 and the bat) is the new-levels tier: typecheck, the rule tests, one browser play of level 4 and `fingerdemo` at it.

Device checks stay open: whether a five-year-old reads a face-down card as "gone, not lost" and the peek as free; whether the picture signs read without the speech (feathers and fur most of all); whether the half-turn-and-flip-back on a keeps-tap reads as "not that one" rather than "broken"; device speech of "amphibian" is not needed (groups are never named in this slice) but the clue lines should be heard on an iPad before Z3 merges.

## Open decisions

Each has a default the build uses. Decision 1 is the one review the study asks for before anything ships; the rest block nothing.

1. **Who reviews the trait table.** Default: the developer reviews every row of the table above before Z3's merge, checking each friend's features and the four marked cells against two general references per animal, and records the check in the build's verification entry; a named zoo educator or biology teacher ([study decision 5](../deep-dives/subjects/zoo-animals.md#decisions-for-the-developer)) replaces that review when one exists, and the printed cards (Z8) wait for that person. The rule tests check consistency with the table, not biological truth.
2. **Bands.** Default pre-K 1–2, school 2–4 (Z3 ships school 2–3). Alternatives: school 1–4 so a six-year-old starts at the one-clue round; or a preschool band at level 1 once play shows a four-year-old reads the picture signs ([study decision 7](../deep-dives/subjects/zoo-animals.md#decisions-for-the-developer)).
3. **Home land.** Default Barnyard (8 with Bolt Boards and this game; `lands.test.ts` proves the fit). Alternative: Rainbow Meadow, the Night Garden kit's land, already at 7 with Jar Sort and Block Garden pending there.
4. **The pig's covering.** Default: "I have fur or hair" with a fluffy-patch sign, so the pig is a plain mammal in every round. Alternative: the clue says "fur" and the pig never appears in a gallery whose clue list uses it.
5. **Level 1's action.** Default: tap the one friend the clue fits (one tap, a clear first round). Alternative: the same turn-over action as level 2 (two flips at three cards), so one action serves the whole ladder.
6. **Level 4 before the bat.** Default: level 4 ships in Z4 with the bat, and Z3 registers school 2–3. Alternative: Z3 ships a penguin-only level 4 (the `fly` surprise) and Z4 adds the bat's surprises to it.
7. **Journal.** Default: no discovery filed. Alternative: file "a penguin is a bird" and "a bat is a mammal" after the round that showed each surprise, as Seesaw Balance files only what a round showed.
8. **Breathing clues.** Default: `gills` only, which picks out the fish. Alternative, after review: a `breathes-air` clue true of everyone but the fish (the frog's lungs and skin make it a reviewer case).
9. **Accounting at level 1.** Default: a tap on a friend the clue does not fit is a miss with its reason, as the study's ladder says. Alternative: no misses at pre-K's level 1, counting only from level 2.
