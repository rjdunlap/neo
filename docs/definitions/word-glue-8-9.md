# Word Glue, levels 8–9: Suffix Workshop (definition)

Defined 2026-11-23 as slice VW4 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order), from its [audience row](../deep-dives/subjects/vocabulary-word-parts.md#what-people-can-do-and-an-answer-for-every-audience) for 9–12 ("join a word to a meaning tile (a person silhouette for 'someone who', an empty cup for 'without'); the voice says the whole word (painter, careless)") and its [candidates row](../deep-dives/subjects/vocabulary-word-parts.md#candidates-and-fit) VW4. The study makes Suffix Workshop a Word Glue rung, so it extends the built game ([levels 1–3](word-glue.md), [levels 5–6](word-glue-5-6.md)) and the defined [level 7](word-glue-7.md). It keeps the game's art, shelf, join and tap input, speech pattern and accounting unless this page says otherwise. **Level 8 built 2026-11-23** (batch `word-glue 5`, [game page](../games/word-glue.md#design-notes)): school is `{ min: 3, max: 8, order: [3, 5, 6, 7, 8] }` until level 9 is built, and the join is drag-only, as at level 3, because a tap that flew an action in would make hearing a wrong action a miss. Level 9 is not built.

**Numbering.** The study's candidates row called this rung "Word Glue 7–8". Level 7 is *Name the new thing* (VW3), so Suffix Workshop takes **level 8, *Someone who*** (-er) and **level 9, *Full of or without*** (-ful and -less).

**Fun action and purpose.**

- **Level 8.** A grey person-shaped tile stands in the middle of the table: "someone who". Three action pictures sit round it: the paint, a loaf in an oven and music notes. "Make a painter!" She drags the paint onto the person, and a cat in a smock appears at an easel. "Paint… painter! Someone who paints."
- **Level 9.** A tree with a few leaves stands at the top. Below it are a fruit tile and two cups: one full ("full of") and one empty ("without"). "Make the tree fruitful!" She taps the full cup, the fruit tile hops into it, and the tree fills with fruit. "Fruit… fruitful! Full of fruit." The next ask may be "Make the lamp powerless!": the empty cup, and the lamp goes dark.

The learning purpose is the one the study takes from CCSS L.3.4.b ("use a known affix as a clue to the meaning of an unknown word formed when the affix is added to a known word", with *care/careless*): **a whole word she knows, plus an ending, makes a new word whose meaning the ending tells you.** Level 8 hears the known word inside the new one; level 9 hears the ending and chooses its meaning. Every line speaks whole words and a meaning ("someone who", "full of", "without"): **no bare ending is ever spoken**, nothing is printed and nothing asks her to read. Spelling changes (*swim, swimmer*; *bake, baker*) never show, because nothing is spelled.

## Identity and overlap

Rechecked 2026-11-23 against the catalog and `git log origin/main`: no island game teaches -er, -ful or -less. The study's ownership note holds:
- **Opposites** level 9 owns un-.
- **Word Monsters** G2 owns re-, -ing, -ed and -s.
- The unstarted **spelling-sentences** study owns how a word with an ending is spelled.
- **Word Glue** owns compounds and these three endings, so no ending is taught in two games.

Levels 8–9 stay in Word Glue because their action is the game's own: level 8 is level 3's join (one thing stays in the middle; choose what joins it), and level 9 is level 5's two-way tap.

## Bands and ladder

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 8 | **Someone who** | school | Which action is inside the asked *-er* word | Five asks, three actions each |
| 9 | **Full of or without** | school | Whether the asked word means "full of" or "without" | Five asks, five different words to change |

**Bands:** school becomes **`{ min: 3, max: 9, order: [3, 5, 6, 7, 8, 9] }`**; the other bands are unchanged. The existing test that school's order leaves out lap's level 4 now also asserts it ends `[…, 7, 8, 9]`. A saved 8 or 9 carried into a younger band clamps to that band's top. **Build order:** level 8 needs level 7 to be built first (the band order and the level number assume it).

## Level 8, Someone who (-er)

**The doers (`DOERS`, separate from `COMPOUNDS`, `PAIRS` and the level-7 table).** Each row is an action word, its *-er* word, the meaning and a doer drawing. Every word means "someone who" does the action, and the action is a plain verb she knows:

| Action | Word | Meaning | Action tile | Doer (comes alive) |
| --- | --- | --- | --- | --- |
| paint | painter | someone who paints | the existing `paint` part | a cat in a smock at an easel (dabs a stroke) |
| bake | baker | someone who bakes | a loaf in an oven | a bear in a chef's hat holding a loaf (steam rises) |
| sing | singer | someone who sings | three music notes | a duck singing (notes float up on pentatonic steps) |
| swim | swimmer | someone who swims | blue waves | a dog swimming (paddles; ripples) |
| drive | driver | someone who drives | a steering wheel | a pig at the wheel of the existing car (beeps) |
| read | reader | someone who reads | an open book | a bunny reading (turns a page) |
| build | builder | someone who builds | three stacked blocks | a mouse stacking blocks (one more lands) |

**Left out, and why:**
- *-er* words that name a thing, not a person (sticker, mixer, toaster, heater);
- the comparing *-er* (bigger, faster);
- words where *-er* is not an ending at all (corner, butter, hammer, flower);
- words whose action is not a plain verb she knows (farmer, gardener, teacher, whose bases are a place or less concrete for a picture);
- *runner* and *jumper*, which also name a rug and (in the UK) a sweater.

A rule test checks every row's meaning is "someone who" plus the action with an *s*.

**The person tile** is a soft grey figure (head and shoulders, no face), the same size as a card. Touch-down on it says "Someone who…".

**Round.** Five asks, five different words, in seeded order. For each ask:
- the person tile is in the middle;
- the asked word's action and two other actions sit round it, in a seeded order;
- across the round the right action sits in each of the three places at least once, so a place never answers.

The first round of a session is authored: painter (paint, bake, sing), swimmer (read, swim, drive), baker (build, bake, paint), driver (drive, sing, read), builder (swim, read, build). The layout reuses level 3's `tableLayout(view, 4)`: the person in the middle, the three actions left, right and below.

**Action.**
- The same join as level 3: drag an action onto the person (or tap the action, which flies it there). Only an action joins; the person stays put.
- **A right join:** the person turns into the doer, which comes alive. The pet says "Paint… painter! Someone who paints." Then the doer goes to the shelf.
- **A wrong join:** the wrong doer appears for a moment, as level 3's wrong friend briefly gets its real thing. The pet says "That's a baker, someone who bakes. Make a painter!" Then the doer shrinks back into the person tile.

## Level 9, Full of or without (-ful and -less)

**The words (`ENDINGS`).** Each row is a known word whose *-ful* and *-less* forms are both real and both mean, literally, "full of" and "without" it, with one thing on the table that shows either:

| Word | Tile | Thing on the table (neutral) | *-ful*: meaning, change | *-less*: meaning, change |
| --- | --- | --- | --- | --- |
| fruit | an apple | a tree with a few leaves | fruitful: full of fruit; the tree fills with fruit | fruitless: without fruit; its last fruit drops away |
| color | three paint blobs | a fish, half coloured | colorful: full of color; stripes of every colour | colorless: without color; it fades to grey |
| power | a lightning bolt | a lamp, glowing dimly | powerful: full of power; a bright beam | powerless: without power; it goes dark, its plug out |
| cheer | two balloons | a room, half lit | cheerful: full of cheer; curtains open, flowers, bright | cheerless: without cheer; grey and dim |
| care | two hands round a small heart | a bear carrying a stack of blocks | careful: full of care; walks slowly, the stack steady | careless: without care; trots, and the top block tumbles off |

Notes on the table:
- *Fruitful* is used for its literal meaning, "full of fruit", the one the tree shows. The grown-ups' note says it also means "producing a lot".
- *Color* is the US spelling; it is spoken the same, and nothing is printed.
- Every ask reads as "Make the {thing} {word}!": the tree fruitful, the fish colorful, the lamp powerful, the room cheerful, the bear careful, and each *-less* form the same way.
- **No cup but the two meaning cups** is on screen: the care tile and the care scene carry no cup, so the only cups are the answers.
- **Left out:**
  - words with only one real form (spotless, cloudless and toothless have no *-ful*; playful and spoonful have no *-less*);
  - pairs whose meanings are not "full of" and "without" (tasteful and tasteless);
  - painful, harmful and fearful, which picture hurt or fear;
  - restful and restless, because restful describes a sleep or a place, not an animal, and does not mean "full of rest".

**The two cups** are the meaning tiles: a cup filled to the brim ("full of") and an empty cup ("without"), drawn with the existing `cup` part. Touch-down says "Full of!" or "Without!".

**Round.** Five asks, one per word, in seeded order. Per ask the seed picks which form is asked. Across the round:
- *-ful* is asked two or three times, and *-less* the rest;
- the right cup is on the left two or three times.

So neither the side nor a habit answers; only the ending does. The first round of a session is authored: fruitful (full cup on the right), colorless (empty cup on the left), careful (full cup on the left), powerless (empty cup on the right), cheerful (full cup on the left).

**Screen.** `kindLayout(view)` places it, as at level 5:
- the thing at the top at made size;
- under it the word's tile;
- the two cups side by side at card size, below or either side of the tile.

If the tile does not fit at card size above the cups, the build adds a sibling layout. It never shrinks a target below 140 units.

**Action.**
- A tap on a cup (`onTap`). The word's tile is not a choice; touch-down on it says its word.
- **A right tap:** the tile hops into the cup, the thing changes and comes alive, and the pet says "Fruit… fruitful! Full of fruit." Then the thing goes to the shelf.
- **A wrong tap:** the cup wobbles with the boing and the pet says what that word would mean: "Fruitless means without fruit. Make the tree fruitful: full of fruit."

## Accounting, help and finishing

- **Level 8** counts as level 3 does:
  - one miss per distinct wrong action on an ask;
  - after two misses, the right action glows and `hints++`, once per ask (Show a hint does the same);
  - a wrong drop after the glow and two earlier wrong drops joins the right action, uncounted.
- **Level 9** counts as levels 5 and 6 do:
  - every wrong tap is a miss, up to two per ask;
  - after two misses the right cup glows and `hints++`, once per ask (Show a hint does the same);
  - a third wrong tap plays the right answer with no further count.
- **Never a miss:** touching a tile, the person or a cup to hear it; tapping the thing (level 9) to hear the ask again; taps during a join or a line.
- **Finish:** after the fifth ask the shelf's things all come alive, then `ctx.finish({ misses, hints })`; one sticker from the shell, with or without help. Nothing is kept or filed.
- **Adaptation:** the ordinary rule. A smooth round shows she heard the known word or the ending in this toy's spoken words. It does not show that she reads or spells words with endings.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

**Model.**
- `PLANS` gains level 8 (`DOER_LEVEL`) and level 9 (`ENDING_LEVEL`).
- `DOERS` holds `{ action, word, meaning }`.
- `ENDINGS` holds `{ base, full: { word, meaning }, without: { word, meaning } }`.
- An `Ask` at level 8 carries its doer and three action keys; at level 9 its ending row, the asked form and the cups' screen order.
- **Level 8 follows level 3's join, but the code needs these changes**, because today's join helpers read `COMPOUNDS` and test `plan.level === 3`:
  - `check` and `drop` resolve a pair through a level-aware lookup: at level 8 an action dropped on the person finds its `DOERS` row (and `drop`'s `made`, the wrong thing shown briefly, is that row); every other level still uses `makes`.
  - The fixed-head rule in `check` and `canDrag` widens from level 3 to levels 3 and 8: only an action moves, and only onto the person.
  - `hintFor` returns the asked action and the person at level 8.
  - `DOERS` rows can be shaped like a `Compound` (`first`: the action, `second`: `'person'`) so `Ask.entry` and `drop` keep their types.
- **Level 9** uses `tap` and `checkTap`; `rightChoice` gains level 9 (the asked form's cup).
- None of the new rows enter `COMPOUNDS`, so `makes`, `forms` and `distractorsFor` stay as they are. A test checks that levels 2 and 3 still resolve through `COMPOUNDS` and that an action and the person make nothing there.

**Tests over 500 seeds:**
- **Level 8:** five asks, five distinct words; three distinct actions per ask, the right one among them; the right action in each place at least once per round; the authored round matches.
- **Level 9:** five asks, the five words once each; *-ful* asked two or three times; the right cup on the left two or three times; the authored round matches.

**Tables:**
- every `DOERS` meaning is "someone who" plus the action with an *s*, and every word is the action followed by *-er* as spoken, allowing a dropped final *e* (bake, baker) and a doubled last letter (swim, swimmer);
- every `ENDINGS` row's meanings are "full of" and "without" plus the base;
- no word or line has a hyphen or a bare ending;
- no new word is in `OPAQUE`;
- every key has a drawing.

**Accounting:**
- *Level 8:* the same action dropped twice counts one miss.
- *Level 8:* two distinct wrong actions glow and count one hint, and a later Show a hint counts nothing.
- *Level 9:* a scripted ask (wrong, wrong, Show a hint, wrong) counts two misses and one hint, and ends with the supported answer.

**Bands:** school's order is `[3, 5, 6, 7, 8, 9]` without 4.

**Layout:** the four lands-test views and the upright views of `src/games/upright-batch-6.test.ts` gain levels 8 and 9. Every tile, cup and person is at least 140 units, with no overlap, Home and guide corners clear, inside `view`.

## Speech, how-to, ghost and registration

**Voice lines** (`voice.ts`) are written out in full, generated from `DOERS` and `ENDINGS` as level 6's are from `PAIRS`. Slotted lines are never rendered as clips, and every line ends in a whole word or a meaning:

| Line id | Text, for one row | Count |
| --- | --- | --- |
| `wordglue.instruct.doer` | "Join an action to the person." (`ctx.instruct`) | 1 |
| `wordglue.doer.<word>.ask` | "Make a painter!" | 7 |
| `wordglue.doer.<word>.right` | "Paint… painter! Someone who paints." | 7 |
| `wordglue.doer.<word>.made` | "That's a baker, someone who bakes." (then the ask again) | 7 |
| `wordglue.doer.person` | "Someone who…" | 1 |
| `wordglue.action.<action>` | "Paint!" | 7 |
| `wordglue.instruct.ending` | "Tap the cup that makes the word." (`ctx.instruct`) | 1 |
| `wordglue.ending.<word>.ask` | "Make the tree fruitful!" | 10 |
| `wordglue.ending.<word>.right` | "Fruit… fruitful! Full of fruit." | 10 |
| `wordglue.ending.<word>.wrong` | "Fruitless means without fruit. Make the tree fruitful: full of fruit." | 10 |
| `wordglue.ending.cup.full`, `.empty` | "Full of!", "Without!" | 2 |
| `wordglue.ending.base.<base>` | "Fruit!" | 5 |

Clips are keyed by text, so a line that already exists reuses its clip.

**How-to card** (`howto.ts`):
- Steps:
  - "Listen for the word, then join its action to the person" `{ from: 8, to: 8 }`;
  - "Listen to how the word ends, then tap the full cup or the empty cup" `{ from: 9, to: 9 }`.
- Finish: "Five words are made and their things have come alive" `{ from: 8, to: 9 }`.
- Notes:
  - "Every word is a word she knows plus an ending, and the pet always says the whole word and what it means (someone who, full of, without), never the ending alone" `{ from: 8, to: 9 }`;
  - "Fruitful is used for full of fruit; it also means producing a lot" `{ from: 9, to: 9 }`;
  - the accounting line of levels 3 and 5 for each.
- The English-only note widens to cover levels 8–9.

**Ghost finger:** `autotouch()` drags the hint action onto the person at level 8 and taps the hint cup at level 9. On a demonstration's first ask, it first touches the wrong cup and slides off, so hearing a cup is shown to be free.

**Registration:** `describeLevel` gains both plan names; skills, land, icon and sticker are unchanged. `npm run game-docs` regenerates the page's tables, and the game page's *Grows into* line gains both levels.

**Co-play and off-screen:** "Someone who…": take turns naming someone who does what the other mimes (a swimmer, a singer). Around the house, find something colorful and someone being careful.

## Art (`src/games/word-glue/art.ts`, palette colours)

- **Level 8:**
  - the person tile;
  - six new action tiles (bake, sing, swim, drive, read, build; paint reuses the level-3 `paint` part);
  - seven doers built on existing `Critter` rigs (cat, bear, duck, dog, pig, bunny, mouse) with one prop each, each with a short comes-alive motion.
- **Level 9:**
  - five new base tiles (fruit, color, power, cheer, care), none of them a cup;
  - five things, each drawn in three states (neutral, full of, without), with short changes between them.
- **Legibility check:** a capture strip of the seven doers and the five things in all three states. Each doer must read as the action at the shelf's 84 units, and each thing's two changed states must differ at a glance.

## Build batches

Each batch is the new-interaction tier, after level 7 is built.

1. **Batch `word-glue 5`: level 8.** It builds `DOERS`, the person tile, the action tiles and doers, speech, how-to, the ghost finger, the school order and the tests.

   **Checks:**
   - typecheck and unit tests (rule, layout, upright, registry, lands, how-to and voice-clip tests);
   - one filtered `wordglue` play on an upright phone at level 8 with one wrong action dropped twice (one miss) and one Show a hint;
   - one upright screenshot;
   - `fingerdemo` at 8;
   - the doers' capture strip;
   - `npm run build`.
2. **Batch `word-glue 6`: level 9.** In progress on `codex/neo-ready-word-glue-9`. It builds `ENDINGS`, the cups, the base tiles and things, speech, how-to, the ghost finger and the tests.

   **Checks:**
   - typecheck and unit tests;
   - one filtered upright play at level 9 with one wrong cup and one Show a hint;
   - one upright screenshot;
   - `fingerdemo` at 9;
   - the things' capture strip;
   - `npm run build`.

Device speech of the whole words on a real phone, and whether a child hears the ending as carrying the meaning, are not established by browser automation.

## Open decisions

None block the build. Defaults taken on the study's lean:
- Suffix Workshop is Word Glue levels 8–9, not a new game (the study's "a Word Glue rung");
- the levels are English-only (study decision 3);
- the US spelling *color* is used and flagged;
- level 9 uses only words with both forms, so the choice is always between two real words.

## Source check

Nothing new was opened for this packet. CCSS L.3.4.b and its *care/careless* example were opened by the study and are quoted as it recorded them; Clark's agentive -er from about three to four is recalled there. The word lists and meanings are game content, read by this session for real, literal, pictureable words. Completing a round shows she matched spoken words with endings to pictured meanings here. It is not evidence about reading or spelling.
