# Story Steps deep dive

*ID `story-steps` · bands toddler, preschool, pre-K, school · levels 1–7 on 2026-10-10 · session `claude/charming-mayer-27wh8m` ([PR 81](https://github.com/rjdunlap/neo/pull/81))*

## The game today

She drags story pictures into a strip of empty spaces, in the order the story happens. Each picture is a card of a known story and stage (`StoryCard`: a story id and a stage 0–3), so every empty space has exactly one right card. Pictures go in from the beginning, one space at a time (`nextSlot`); a card dropped on the wrong space, or the wrong card, is a miss with the spoken hint "What happened before this picture?", and two misses in a row make the right card glow (a hint). A right drop speaks the step ("The caterpillar changes inside a chrysalis."). The yellow music button reads only the pictures already placed. When the strip is full the pet narrates all of it, then the round ends. There is no timer, and nothing is lost.

The four stories each have four stages drawn with the same camera, so the change is the thing to see: *Build a tower*, *A flower grows*, *Make a snow friend* and *A butterfly grows*.

| Level | Plan (from `STORY_PLANS`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Two pictures (stages 0 and 3), the beginning shown, one picture from another story as a distractor; tower or snow | toddler (1–2) | which of two pictures is "what happened after" |
| 2 | Three pictures (0, 1, 3), the beginning shown, no distractor; tower or flower | toddler, preschool (2–5) | which picture comes next, twice |
| 3 | Three pictures, none shown; tower or snow | preschool, pre-K (2–5, 4–7) | the whole order of a building story |
| 4 | Three pictures, none shown; flower or butterfly | preschool, pre-K | the same for a story that grows and changes |
| 5 | Four pictures, none shown; any of the four stories | preschool, pre-K | the full four-step order |
| 6 | Four pictures; first and last shown, two from another story among the choices | pre-K, school (4–7, 6–7) | which two of four pictures belong in the middle, and in what order |
| 7 | Four pictures from six mixed ones (two from another story) | pre-K, school | which story is being told, then its order |

**What a round draws from.** Only the story (two to four, picked with the round's seeded RNG) and the shuffle vary: **four stories, sixteen authored pictures**. Levels 1–5 each pick between two stories at most (levels 5–7 among all four), so a replayed level shows the same pair. A distractor comes from any *other* of the four stories, regardless of the level, and is always stage 0 (and stage 3 when there are two). Level 7's six-picture mix is two unrelated story ends added to one real story, which are easy to dismiss by sight alone.

**Couplings.** A how-to card (steps scoped to levels 1–2, 3–5, 6 and 7+) with a ghost-finger bot (`nextPicture`), tested at every level. A hub icon and sticker (a flower, first and last stage). No couch entry, no journal entry and no picnic step. Voice: `story.start` (instruction, with the story name), `story.wrong`, `story.hint`, `story.step` (the sentence of the card); the sentences live in `STORIES`, not in the voice script.

**Known gaps.**
- A distractor can be any story, so a toddler at level 1 can get a butterfly's chrysalis. That does not matter with four stories, but with ten, a stacking story (sandcastle) beside a tower is a lookalike, which would make a fair question unfair.
- Levels 3–4 take three of the four stages (0, 1, 3), so stage 2 (the bud, the third snowball) never appears below level 5.
- Every story is a *change over time* of one object. There is no cause and effect (something happened *because*), no inference and no revision.
- A toddler at level 1 is untried (person check); a one-year-old is outside the bands.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Sequencing Post Office](https://apps.apple.com/app/id898269145) (App Store listing) | speech-therapy app | More than 60 tasks at 2-, 3- and 4-step levels, then a reward game | the 2 → 3 → 4 step ladder (the same as levels 1, 3, 5); a reward only after play | its tasks are a mixed bag of everyday scenes; ours are one story per round |
| Speech with Milo: Sequencing (made by a speech-language pathologist; listing seen in a search, page not opened) | speech-therapy app | 35 animated sequences; she orders three cards into numbered slots, then can watch an animation of the whole sequence; optional hints; sentence read-aloud | **watch the finished sequence as an animation** (our narration of the strip is the sound half); read-aloud of every step | numbered slots: ours have no numerals, the arrows between the spaces do the job |
| [Sequence of Events – Sequencing Cards for Kids](https://bridgingapps.org/bridgingapps-reviewed-app-sequence-events-sequencing-cards-kids/) (BridgingApps review) | app | 3, 4 and 5 step sequences, used to retell a story | a fifth step is a natural ceiling for school (our strip stops at 4 on a tablet) | none noted |
| [Sequences for Kids Pro](https://apps.appfollow.io/ios/sequences-for-kids-pro/597489400?country=us) (listing; aimed at ages 4–6) | app | cause and effect, "first-then", and "material to product" (flour → bread) categories | **cause and effect as its own category** (level 8) and **material to product** pairs as authored content | the listing's pro tier |
| [Read and Sequence](https://appshunter.io/ios/app/read-and-sequence-sequencing-stories-for-early-readers/id1115300858) | app | sequencing stories for early readers; a reviewer complained that the groups were random pictures, "not story sequencing" | **a sequence must be a real story with a reason for the order**: our per-card `STORIES` already has one, and the new tests assert it | text-dependent play; ours is spoken, never read |
| [Rory's Story Cubes](https://www.sensationalkids.ie/product/rorys-story-cubes-original-orange/) | dice game, ages 3+ | no levels: nine pictures rolled, then a story told by the players, alone or taking turns | the telling after the order: a place for the child to say what happens (a co-play prompt, not an interaction); turns | no scoring, random picture sets with no right answer |
| Toca Life: City (a review seen in a search; link not opened) | sandbox | no progression; cause and effect by trying things | an open "make it happen" is its own game (Stamp Studio / Story Weaver, [IDEAS](../IDEAS.md)) | nothing to sequence here |
| Physical sequencing cards (a numbered 1-2-3 board, [TES](https://www.tes.com/teaching-resource/sequence-cards-13575796); a local-authority guide, [Oldham](https://senco.oldham.gov.uk/wp-content/uploads/2025/07/Developing-Sequencing-and-Narrative-Skills.docx), suggests starting with two-picture sets before three, four and five) | classroom printable | two, then three, four, five cards; later with a "because" | the ladder we already have; **mix up the order and ask her to fix it** | printable-only bits |
| Mixed-Up Mother Goose (Sierra, named in [IDEAS](../IDEAS.md); not re-researched) | adventure | carry lost things home to their rhyme | the Woodland-Picnic / Mother Goose idea is separate (a story episode), not this game | n/a |

**Standards and development.** Sequence is implied by the retelling standards, not a standard of its own: Common Core RL.K.2 asks a kindergartener to retell familiar stories with key details with support, and grade 1 asks for retelling with key details and the central message; some state documents state it as "beginning, middle and end" or "retell story events in a logical sequence" ([a Maryland copy of the K–2 literature standards](https://marylandpublicschools.org/programs/Documents/ELA/revised-standards/k-2/Reading_Literature_Grades_K-2.pdf), [a grade 1 retelling page](https://flipeducation.ai/curriculum/us/english-language-arts/grade-1/retelling-and-sequencing)). For toddlers, Patricia Bauer's elicited-imitation work reports that by late in the first year children recall events whose order is fixed by *enabling relations* (the cup must be there before pouring), but not arbitrarily ordered ones: 16-month-olds failed arbitrary orders, 22-month-olds recalled them immediately and 28-month-olds after a delay ([search summary; the primary paper (Lukowski, Wiebe, Haight, DeBoer, Nelson and Bauer, 2005) is on a [faculty site](https://faculty.sites.uci.edu/lukowski/files/2019/08/Lukowski-Wiebe-Haight-DeBoer-Nelson-Bauer-2005.pdf), whose text I did not read]). The consequence for design: the *youngest* sequences should be enabling ones, where the earlier picture is physically part of the later (a tower, a snow friend, a sandwich), not stories whose order has to be known (a rainy day). Page fetches for the Bauer papers failed from this session, so none of the figures above were checked against the papers.

## What makes sense here

- **Quantity first.** More stories are the cheapest lasting gain: the rule stays, and the replay is a new story. Ten stories (sixteen pictures → forty) is a day of art, and every story is also a line for the pet to say.
- **Enabling stories for the youngest, reasons for older ones.** Build-up stories (tower, snow friend, sandcastle, sandwich) go to levels 1–3; change-over-time stories (flower, apple, bedtime) to levels 3–5; the butterfly and rain, whose order must be known or inferred, stay at 4 and up.
- **A new decision, not a bigger strip.** The tray stops being comfortable at six cards (level 7), so the next levels add a *different thought*: a cause, a mistake in an order, two stories at once, and a clue-based ending. Each has a rule test.
- **Revision, not a wrong answer.** A fix-the-order level lets her swap pictures freely. A swap is never a miss (an experimental choice); the music button tells the strip so far, and the round ends when the strip makes sense.
- **Left for later or elsewhere:** retelling from memory (hiding the pictures adds memory load), counting a story's words, a typed story (a separate game: Story Weaver), the Woodland Picnic or Mother Goose Muddle (story episodes; see the roadmap's story directions).
- **Long-term arc.** Toddler: what comes after (build-ups). Preschool: what comes next, the order of three. Pre-K: four steps, a missing middle, a cause. School: spotting what's out of order, keeping two stories apart, saying why (a clue).

## Proposed ladder

### Fresh content inside existing levels

**Six more stories (ten in all), each four stages with the same camera, a name and four spoken sentences:**

| Story | Name spoken at the start | Kind | Level pool it joins |
| --- | --- | --- | --- |
| `sandcastle` | Build a sandcastle | build-up (bucket, a pile, towers, a flag) | 1–5 |
| `sandwich` | Make a sandwich | build-up (bread, spread, cheese or jam, closed) | 1–5 |
| `apple` | An apple tree grows | change over time (seed, sprout, tree, apple) | 3–7 |
| `dog` | Wash the dog | change over time (muddy, soapy, rinsing, clean) | 3–7 |
| `rain` | A rainy day | order must be known (sun, clouds, rain, puddle with rainbow) | 4–7 |
| `bedtime` | Get ready for bed | order must be known (play, bath, pajamas, tuck in) | 4–7 |

The pet's bedtime is the same event as Goodnight Room's, so the card shows the pet in pajamas from `ctx.petSpec` (a later polish). Names must not break "{story}!" (they are spoken as a title).

**Pools per level** (replacing the all-stories draw in `STORY_PLANS`):

| Level | Stories it draws from |
| --- | --- |
| 1 | tower, snow, sandcastle, sandwich |
| 2 | tower, flower, sandcastle, sandwich |
| 3 | tower, snow, sandcastle, sandwich, apple |
| 4 | flower, butterfly, apple, dog |
| 5–7 | all ten |

**Distractors fix.** A distractor is drawn from the level's own pool, and never from a *lookalike* of the story (a flag `family: 'stack'` marks tower, snow, sandcastle and sandwich; the others are `'grow'`, `'wash'` and so on). Level 7's two unrelated cards come from two *different* stories, so a story cannot be spotted by one end alone.

**Stage 2 fix.** Levels 3–4 use stages [0, 1, 3]; the plans keep that. Level 3's three-stage tower still has its third block. No change.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **Choose the cause** | pre-K, school (4–8) | An effect is shown (a spilled cup and a puddle, a wet dog, a toppled tower); three pictures below, one is what made it happen (the cup tipping); she drags it to the glowing space before the effect | what happened *because* of what | a wrong card: the pet says what that picture does ("The sun does not make a puddle. What fell?"); two misses glow the right card; unseen cards are never counted | each effect has exactly one cause among its choices and no other choice appears in `plausible` for that effect (an authored table); eight cause pairs, three choices drawn from different pairs; the bot finishes every round | eight cause–effect pairs of art (16 pictures) and 16 voice lines; the one new plan shape is `kind: 'cause'`; how-to; ghost-finger bot re-uses `nextPicture` |
| 9 | **Fix the mixed-up story** | school (6–9) | All four pictures are in the strip but two neighbors are swapped; she taps one picture then another to swap them; the pet reads the strip when she taps the music button | which pictures are out of place and what goes where | **No swap is a miss** (an experiment). The round ends when the strip is in order. After eight swaps without finishing, the first wrong picture glows (one hint). An "undo" button returns the last swap | the generator never makes an already-sorted strip; the strip is solvable in at most n−1 swaps; the hint always points at a picture that is out of place; every swap sequence ends in the sorted strip within 3n swaps if followed greedily (the bot) | a swap interaction (tap, tap; new custom handling and a tap-target check), 6 voice lines; later rounds swap three pictures; no new art |
| 10 | **Untangle two stories** | school (6–10) | Six cards of two three-picture stories (stages 0, 1, 3 of each, from different families), and two strips; she drags each card to the first empty space of the strip it belongs to | which cards belong together | a card to the wrong strip: boing and "Does this belong with the flower or the tower?"; two misses glow the right card | each story's three cards are all in the tray; the two stories are never of one family; a card can only be right in one strip | a two-row layout (tested portrait and landscape: six 110-unit cards plus two rows must fit with the pet clear); bot picks the next card for either strip |
| 11 | **What will happen?** | school (6–11) | Three pictures with a clue (dark clouds; a leash and a dog at the door; a full bucket by a sandcastle), two possible ends; she drags the end the clue points to | the ending supported by the evidence | an unsupported ending is allowed to be chosen once and *played*: the pet says "That could happen, but look at the clouds…" (no miss on the first wrong choice, since a prediction is an experiment); a second wrong choice counts, and the clue glows | each authored story has a clue and exactly one `supported` ending; the other ending is physically possible but contradicted by a named clue | eight stories with two endings each (art + 16 lines) |

Ranges after these: toddler 1–2, preschool 2–5, pre-K 4–8, school 6–11 (all appended, nothing renumbered). Level 8 is the first one in the pre-K window that is not just a longer order.

### Younger-band openings

- **Toddler:** already open at levels 1–2. The fresh-content pools make level 1 stack-only, which is the enabling-relation shape that develops earliest.
- **Lap (about 1 year):** not recommended as a level 1 opening. A distractor at level 1 means misses, and 16-month-olds reliably recall only enabling orders (above); a card drag is not a one-year-old's tap. A lap game would be a different experience (below).
- **Preschool, at level 2:** already open.

### Levels below level 1 (waiting on the level-order decisions)

These would be appended, not renumbered, and a band's range would have to skip levels ("May a band's range skip levels?" in [Waiting on the developer](../ROADMAP.md#waiting-on-the-developer)).

- **Level 0a, one picture grows:** two cards, no distractor, no wrong answer possible; the other card is the only one on the tray. Dropping it plays a one-second animation (the block lands, the sprout grows). Lap and toddler. Rule test: no choices but the right card; a card dropped anywhere near the space is accepted.
- **Level 0b, press the picture to watch:** three cards that play in order when tapped. A story *told*, not asked. Lap.
- Both need a person check on a real one-year-old before they are relied on.

### Left out on purpose

- **Retell it from memory:** hides the pictures and loads memory; conflicts with the "depth before pressure" rule.
- **Timed or numbered ordering,** counting how many it took, and any score.
- **Reading each sentence:** every prompt stays spoken.
- **Five-step strips:** the tray is already full at six cards.
- **Sound Detective** (hear a sequence of sounds, arrange scene cards): a good idea in [IDEAS](../IDEAS.md), but it needs synthesized sounds for each event and unambiguous art; keep it as a separate game, or as a level only after the clue-based ending exists.

## Decisions for the developer

1. **May a band's range skip levels / how are levels ordered?** Needed for levels below 1 (0a, 0b). Already on the roadmap; nothing new to add.
2. **Is a kept story wanted in the treehouse?** A journal entry "Stories I know" (each story she completes, with its picture and step lines) uses the existing `RoundResult.discoveries` and needs no new storage kind. Lean: yes, after the six new stories, as a separate slice.
3. **A lap opening** needs a person check; no code decision is waiting.

## Build slices, in order

1. **Six new stories and per-level pools** (the cheapest, content only): `STORIES`, the art for 24 new pictures, the pools, the lookalike and distractor fix, a rule test per property (every pool is non-empty and within `STORIES`; each plan's distractors come from the pool and never from the story's family; every story's four steps differ and start with a capital letter and end with a period; no story name needs an article that the spoken "{story}!" would get wrong); README, GAMES.md and VERIFICATION entries. *Check tier:* typecheck, the game's rule tests, one screenshot of the new art; `fingerdemo` at level 1 and 5.
2. **Level 8, Choose the cause** (a new plan shape that reuses the strip). *Tier:* new levels on an existing interaction: typecheck, rule tests, one play of level 8, `fingerdemo` at 8.
3. **Level 9, Fix the mixed-up story** (a swap interaction). *Tier:* new interaction: a scripted play of level 9 and a portrait screenshot.
4. **Level 10, Untangle two stories** (two-row layout). Same tier as 3.
5. **Level 11, What will happen?** (eight clue stories). Same tier as 2.
6. **Journal "Stories I know."** A journal source test and one screenshot.
7. **Level 0a/0b** once the level-order decision is made.

Every slice updates the how-to card (steps scoped by level), `describeLevel`, the band ranges in `levels`, the voice script, and the tracker.
