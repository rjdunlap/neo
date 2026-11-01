# Read & Do deep dive

*ID `read-do` · bands pre-K, school · levels 1–3 on 2026-11-01 · session `claude/dive-read-do` ([PR #1094](https://github.com/rjdunlap/neo/pull/1094))*

## The game today

She reads a printed sign, then taps the picture that makes it happen in the scene. It teaches reading for meaning: the printed words, not a picture clue, decide what happens. It lives in Story Grove (`src/content/lands.ts`), plays `STYLES.quiet`, and has a ghost-finger bot (`autotouch()` taps the matching picture). `docs/GAMES.md` files its entry under the Barnyard heading, though its land is Story Grove; a docs fix for the build session.

Ranges (`LEVELS` in `index.ts`): pre-K 1–2, school 1–3. No `order`, no `entryLevels`, no `askForHint`.

| Level | Plan name | Bands | What she decides | Rounds and pool |
| --- | --- | --- | --- | --- |
| 1 | Read a color word and choose a hat | pre-K, school | Which of three hats the color word names | 3 rounds: red, blue, yellow once each; always the same three hats |
| 2 | Read big duck or small duck | pre-K, school | Which of two ducks the size word names | 2 rounds: *big duck*, *small duck*; the animal is always the duck |
| 3 | Read a sentence and make the duck or cat jump or sleep | school | Which of four cards matches both the animal and the action | 4 rounds: *the duck/cat can jump/sleep*; four cards in a 2-by-2 grid |

Every printed word is a separate, unscaled 108-by-100 target spaced 116 apart and speaks itself; a speaker reads the sign word by word. Listening is free and never a hint. A wrong pick acts out its own meaning, names it (`read.compare`), and re-reads the sign; each wrong pick is a miss, and the second on one sign glows the answer and counts one hint. One sticker per round.

The vocabulary is 11 words (`WORDS` in `logic.ts`): red, blue, yellow, big, small, duck, cat, the, can, jump, sleep.

**Gaps found while reading the code** (written here, not fixed):

- **Level 1 never varies.** Every round is the same three hats in a new order.
- **Level 2 is a coin toss with one word that matters.** It has two rounds and two choices, and *duck* is printed on every sign.
- **Level 3 always uses the same two animals.**
- **The printed sentences carry no capital and no full stop** (*the cat can jump*). That is fine for word reading and is the starting point of SS1 below.
- **Person checks still open:** the device check (child comprehension, iPad speech for each word) is still open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).
- **No couch entry.**

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Montessori command cards ([Montessori Album](https://www.montessorialbum.com/montessori/index.php/Command_Cards), [sentence cards](https://www.montessorialbum.com/montessori/index.php/Sentence_Command_Cards), [Montessori Mom](https://montessorimom.com/reading-command-cards)) | Classroom material | A single verb, then a short sentence, then two actions with an object; the child reads silently and performs it | The whole premise: the reader proves understanding by acting. Grow from a word to a sentence | Silent-reading-only rules. Here every word stays tappable to hear |
| [Endless Reader](https://apps.apple.com/app/id722910739) (Originator, 2013) | Touch app | A sight word, then a sentence puzzle whose words animate what they say | Words that become what they describe once the sentence is right | The paywall packs. Also its weakness, per [Common Sense Media](https://www.commonsensemedia.org/app-reviews/endless-reader): it mixes letter sounds into sight-word drill. Keep Read & Do about meaning, and do not claim reading from listening-supported play |
| [Super Scribblenauts](https://en.wikipedia.org/wiki/Super_Scribblenauts) (2010) | DS puzzle | Write a noun and it appears; the sequel adds adjectives that change colour, size and behaviour | *Make the sign*: her words decide what appears and how. A size word visibly changes who acts | Typed free text and a huge vocabulary. Here it is a small tile tray |
| [Baba Is You](https://en.wikipedia.org/wiki/Baba_Is_You) (2019) | Puzzle | Rules are word tiles; pushing one out, in or across changes the world | *Mend the sign*: removing, inserting or swapping a word has an immediate visible effect | Its difficulty and its breaking rules. A child's sign has one actor and one action |
| JumpStart Phonics (1999), *Storybook Cave* (recalled; already in [IDEAS](../IDEAS.md)) | Edutainment | Pick the word that finishes a sentence; characters act the story | A sentence that completes into an action | Its microphone "Read 'n' Respond" |
| Teach Your Monster to Read, sentence levels (recalled, not reopened) | Touch game | Words, then captions she reads to choose the matching picture | Picture-match from a caption, which is today's levels 1–3 | Collectable rewards for speed or streaks |
| Simon Says (playground game) | Physical | Commands grow longer; trick commands lack "Simon says" | Co-play: a grown-up reads a sign aloud and the child acts it. The off-screen card already says this | Getting "out". Nobody is eliminated here |
| Silly-sentence card games, e.g. Orchard Toys *Silly Sentences* (recalled, not reopened) | Tabletop | Combine subject, verb and object cards into funny sentences | Silly combinations are welcome when she is only exploring (*Show it*) | Grammar colour-coding as a rule she must learn |

**Learning references** (Common Core, wording confirmed via [Smithsonian Learning Lab](https://learninglab.si.edu/standards/view/1544) and [Teach Starter](https://teachstarter.com/us/common-core-standards-in-america/ccss-ela-literacy-rf-1-1-a)):

- [RF.K.3c](https://www.thecorestandards.org/ELA-Literacy/RF/K/): read common high-frequency words by sight (*the*, *can*).
- [RF.K.4](https://www.thecorestandards.org/ELA-Literacy/RF/K/): read emergent-reader texts with purpose and understanding.
- [L.K.2a](https://www.thecorestandards.org/ELA-Literacy/L/K/): capitalize the first word in a sentence and the pronoun I.
- [L.K.2b](https://www.thecorestandards.org/ELA-Literacy/L/K/): recognize and name end punctuation.
- [RF.1.1a](https://www.thecorestandards.org/ELA-Literacy/RF/1/): recognize the distinguishing features of a sentence (first word, capitalization, ending punctuation).
- [L.K.1f](https://www.thecorestandards.org/ELA-Literacy/L/K/): produce and expand complete sentences in shared language activities.
- [W.1.5](https://www.thecorestandards.org/ELA-Literacy/W/1/) and [W.2.5](https://www.thecorestandards.org/ELA-Literacy/W/2/): with guidance, strengthen writing by revising and editing (the [keyboarding study](subjects/keyboarding-editing.md) ties KE1 to W.2.5).

## What makes sense here

**One game, three directions.** Read & Do already owns *the reader acts on the exact words*. Three studies handed it their next modes:

- **SS1 *Capital and stop*** ([definition](../definitions/read-do-capital-stop.md)) dresses a sign for a reader.
- **WC3 *Make the sign*** ([writing study](subjects/writing-composition.md)) has her write the sign.
- **KE1 *Mend the sign*** ([keyboarding study](subjects/keyboarding-editing.md)) has her fix a sign that the animals act out wrongly.

All three share one scene and one set of controls:

- the sign row of word tiles (the existing 108-by-100 tiles on a 116 pitch);
- the speaker, which stays free;
- a free **Show it**: the animals act the sign as it stands, with no verdict;
- a judged **Send** against what the friend asked for.

That split settles creative play versus wrong answers for all three. Composing, editing, experimenting and Show it are never misses. Only a Send that fails what the friend asked for is a miss.

**A small sign interpreter.** WC3 and KE1 need to know what a sign *does* on a given stage. `logic.ts` gains `act(sign, stage)`, which returns one of:

- `act`: the actors and the action;
- `which`: two animals fit, for example *the cat* with a big and a small cat on stage, so the reader cannot tell which;
- `none`: no such animal, for example *the big cat* when only a small one is there;
- `unreadable`: no animal or no action, or the words are out of order.

The grammar is `The (big|small)? animal action .`, with animals duck, cat, pig and dog and actions jumps and sleeps. This is the SS1 table plus one optional size word, so SS1's eight clauses are the base.

*Which* and *none* are what make the size word matter. The animals' visible confusion (they look at each other; the pet says "Which cat? The sign doesn't say.") teaches writing for a reader. This also avoids pretending that *the cat* means both cats.

**The long-term arc:**

1. Read a word, then a sentence (built, 1–3).
2. Get a sentence ready for a reader (4–6).
3. Write a sentence for a reader (7).
4. Revise one (8–9).

Longer signs, two signs in order and stories stay out; [Story Weaver](subjects/writing-composition.md) owns stories.

**Not here:**

- Free typing or a keyboard (decided 2026-10-23 for child bands).
- Questions and exclamations (SS3 and later).
- Plurals and pronouns.
- Spelling (Word Monsters).
- Any grammar correction of her own speech.

## Experience and presentation

**The first action without help.** In levels 1–3 she can tap a word to hear it, then a picture. In 4–6 she taps the first word, which grows a capital, or stamps the stop. In 7–9 she drags a word tile into the sign and presses Show it.

**What makes it satisfying.** The animals do exactly what the words say, including the funny wrong things: a pig asleep when a jump was wanted, or two cats looking at each other.

**Touch and the consequence:**

- A tile lifts on touch-down and rides 40 units above the finger ([pitfalls](../DESIGN.md#input-and-rendering-pitfalls)).
- The row spreads open at the nearest gap while a tile is over it, and closes with a soft pentatonic tick on drop.
- Show it and Send replay the read-back with the existing word-by-word highlight, then the act.
- After the act, the animals return to their places.

**Code-drawn example.** The friend's wish is a cream speech-bubble card (`Graphics.roundRect`) showing that friend's `Critter` mid-action at 0.25 scale: the existing jump arrow or the Z. A *which* reaction tilts both critters toward each other with `setMood('surprised')`, and a *none* reaction shows a small "?" `label` over the stage.

**Variety on replay.** These change on replay without changing the rule:

- which animals are on stage, and whether it is one animal or a big and small pair;
- the wished action;
- which word is missing or extra, by seed.

**Reading, memory and motor demands.** Listening support is always free. No memory load: the wish card stays up. Precision is low: drops resolve to the nearest gap or tile, never to a pixel-exact slot.

**Supported finish.** Two failed Sends on one sign glow the next useful control or tile (one hint). There is no "do it for me" (SS1's default). After the round's signs, `read.done` and one sticker.

**Co-play.** One person reads the sign aloud and the other acts it, like Simon Says without anyone being out. A grown-up can be the "friend" who whispers the wish.

**For a person or device to judge:**

- Does a pre-K child understand "first word" and "end"?
- Do *which* and *none* reactions read as funny rather than as failure?
- Does the iPad say "full stop", "big letter" and each new word naturally?
- Is the drag into a gap comfortable in portrait?

## Proposed ladder

### Fresh content inside existing levels

**New content:**

- **Level 1:** colours drawn from red, blue, yellow, green and pink (all in `swatch`). Each round shows three hats: the answer and two other colours, seeded. Three rounds, with no colour repeated as an answer.
- **Level 2:** the animal varies per round (duck, cat, pig, dog, seeded); both choices are the same animal. Two rounds become three: big, small, then a seeded third. A third round lets each round's animal differ without two signs being identical.
- **Level 3:** the round's two animals are a seeded pair from the four. The four cards stay a 2-by-2 grid, so both the animal and the action still matter.

**Cost:**

- New words *green*, *pink*, *pig* and *dog* in `WORDS`/`WORD_LINES` and the voice script, with device speech as the fallback until clips are rendered.
- Rule tests: no repeated answer in a round, one matching card, both features still matter at level 3, and all words voiced.
- The bot is unchanged (it taps the matching card).

### New levels on top

All three new modes share the sign row, Show it and Send. SS1's levels follow [its definition](../definitions/read-do-capital-stop.md) and are only summarized here.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *Start the sign* (SS1 A) | pre-K, school | *the duck jumps.* with its stop already there | Tap the first word to capitalize it, then Send | A Send without the capital is one miss and names where a sentence starts; two on a sign glow the first word (one hint) | Send accepts exactly the capital; the stop's state is ignored; seeded clauses never repeat in a round | The toggle tile, Send, the eight-clause table, *jumps/sleeps/pig/dog*, voice lines from the definition |
| 5 | *Finish the sign* (SS1 B) | pre-K, school | *The cat sleeps* without a stop | Drag or tap-then-tap the stamp onto the end socket | As level 4, naming where it stops; the glow lands on the stamp | One socket, no duplicate stop; a drop elsewhere returns the stamp freely | The stamp (via `drag.ts`) and socket |
| 6 | *Ready for a reader* (SS1 C) | school | Both missing | Both conventions, in either order | The first missing one is named, the capital first | Both orders succeed; every intermediate state replays safely | None beyond 4–5 |
| 7 | *Make the sign* (WC3) | school | A friend's wish card shows the only pig on stage jumping; the sign reads *The ▢ .* and a tray holds *big, small, pig, cat, jumps, sleeps* | Which words, in which order, so the reader does what the friend wants. Rounds 2–3 put a big and small animal on stage, so a size word is needed | Show it and every edit are free. A Send whose `act` differs from the wish is one miss: wrong act, *which*, *none* or *unreadable*, each with its reaction and a spoken reason. Two failed Sends glow the next tile of the shortest accepted sign that extends what she has, or the word to take out (one hint) | Every wish has an accepted sign from its tray; any sign whose `act` equals the wish is accepted; a size-less sign on a pair stage is *which*; the hint tile always lies on an accepted sign | `act()`, the tray, drag-into-row with nearest-gap resolution, the wish card, `read.make.*` lines, bot (drag the shortest sign's tiles, then Send) |
| 8 | *Put one in, take one out* (KE1) | school | The round opens by acting the printed sign: *The cat sleeps.* with a big and a small cat (*which*), wish = small cat sleeps | Insert a size word at the right gap, or drag an extra word out (*The big dog jumps.* with only a small dog: *none*) | As level 7. Show it and edits free; failed Sends are misses; the hint glows the tile to insert or the word to remove | Each authored broken sign is one insert or one delete from an accepted sign and never already matches; any final sign that matches is accepted (not only the intended edit) | Delete gesture (drag a sign word back to the tray); reuses 7's row and interpreter |
| 9 | *Swap a word* (KE1) | school | *The pig sleeps.*, wish = pig jumps | Drop a tray word onto a sign word to replace it (wrong action, animal or size) | As level 8; the hint glows the word to replace and its replacement | Each broken sign is one swap from accepted; drop-on-word versus drop-in-gap resolves to the nearest target; any matching sign accepted | Swap targeting on the row; voice |

**Ranges after the builds:**

- pre-K: `{ min: 1, max: 5, order: [1, 2, 4, 5] }`. Level 3's four-word sentences stay school-only, as today.
- school: 1–9. Today's ranges become, in turn, school 1–6 after SS1, then 1–7, then 1–9.

The `order` support in `src/progress/difficulty.ts` already handles a gap (Day by Day's pre-K is `[1, 2, 4]`). How-to steps use `LevelLine` from/to per level.

**Layout:**

- The longest sign, *The small dog sleeps* plus a stop socket, is five slots, 580 units centred. Its right edge sits at x = w/2 + 290, clear of the speaker at w/2 + 365 (half-width 55).
- The tray holds six tiles in one row at 116 pitch (696 units), centred low on the stage, clear of the bottom-left pet. The build proves this at the four views.
- Gaps between tiles are only 8 units wide, so insertion **is not a target**. A dragged tile resolves to the nearest gap by its x position, and the row spreads to show where it will go.
- At level 9, a drop whose centre is over a word's middle half swaps with that word, and otherwise inserts at the nearest gap. Show the swap target with a wobble before release.

### Younger-band openings

None. Reading colour words is a kindergarten skill. Preschool colour naming lives in colour games already (Rainbow Fingers, Bubble Pop), and listening-only play would not be reading. Revisit if an observation shows a three-year-old choosing hats from printed words.

### Easier entries and levels between existing ones

None needed. Level 2 gains a third round in fresh content. Pre-K enters SS1 at level 4 through `order`, not a new entry ID.

### Left out on purpose

- **Two signs in order, or a short story:** Story Weaver owns stories.
- **Question marks and exclamations:** SS3.
- **Plurals** (*the cats jump*): the *which* reaction teaches the same point without a new grammar.
- **KE1's "move a word" verb:** word order is already judged in level 7.
- **A "do it for me" button.**
- **Typed text, timers, and scoring how fast she writes.**

## Decisions for the developer

None. These leans follow the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules):

- **SS1 is levels 4–6.** Pre-K reaches 4–5 by `order: [1, 2, 4, 5]` (S8, the definition's lean).
- **WC3 and KE1 are levels 7, 8 and 9, school only** (S8). A pre-K opening for 7 waits on observation.
- **No "do it for me"** (SS1's default).
- **The new words and clause tables** get the S1 content check in their building sessions.

## Build slices, in order

1. **Fresh words and pictures** (existing-interaction tier: typecheck, rule tests, one filtered regression play at level 3 on a seed with a pig or dog, one build for the voice lines; bot unchanged, no `fingerdemo`):
   - Level 1's five-colour pool.
   - Level 2's seeded animal and third round.
   - Level 3's seeded pair.
   - *green, pink, pig, dog* voice lines.
   - The GAMES.md entry moved under Story Grove.
2. **Levels 4–6, Capital and stop (SS1 A–C)** (new-interaction tier, as the [definition](../definitions/read-do-capital-stop.md#build-order-for-the-dive) states: typecheck, unit tests, one filtered `readdo` play of level 4 and level 6 with one failed Send and one hint, one portrait screenshot, `fingerdemo` at 4, 5 and 6). After slice 1, which adds *pig* and *dog*. It adds *jumps/sleeps*, Send, Show it and pre-K's `order`.
3. **Define *Make the sign*, level 7 (WC3)** (docs only; status `define`): the stage and wish tables, the `act()` outcomes and their spoken reasons, tray contents per round, the drag-into-row geometry at the four views, the bot, and the check tier.
4. **Define *Mend the sign*, levels 8–9 (KE1)**, after slice 3 (docs only; status `define`): the authored broken signs, delete and swap gestures, the drop-on-word versus gap rule, and the check tier.

The builds of 3 and 4 follow their definitions.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links and `git diff --check` ran.
