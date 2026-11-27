# River Tablets, levels 7–8 (AR4: Say it with pictures & Which one do I mean?)

Defined 2026-11-26 as slice **AR4** of the [ancient river civilizations study](../deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order) ([packet](../deep-dives/subjects/RECOMMENDATIONS.md#ancient-river-civilizations-recommendations)). Decision 6 was settled `2026-10-23` ([record](../archive/DECISIONS-2026-10-23.md)): levels 7–8 stay in `river-tablets` ("how writing reached sounds"), cross-listed with `vocabulary-word-parts` and `poetry-wordplay`, using invented island picture-signs on the child's screen (Decision 1) and a building-session source check for the spoken history lines. Built in two ordered batches: **`river-tablets 4`** (level 7, **built 2026-11-26**: the rules in `logic.ts`, art, scene, voice and how-to; its new voice lines carry the `{pet}`, `{sentence}` or `{sign}` slot so none needs a rendered clip, and the sentence bar is the speaker bar at the top) and **`river-tablets 5`** (level 8, **built 2026-11-26**, [PR #2230](https://github.com/rjdunlap/neo/pull/2230): the rules in `logic.ts` and `determinative.test.ts`, art, scene, voice and how-to; it reuses `rt.rebus.sentence` for the spoken sentence).

**Fun action and purpose:** level 7 (*Say it with pictures*) lets the scribe write something that is not a sheep or a basket of grain: she hears a short sentence (*"I see a deer."*) and picks the picture-signs whose **names sound like** the spoken words (`eye`, `sea`, `deer`), then presses **Read** to hear her clay tablet read back aloud. Level 8 (*Which one do I mean?*) meets the snag of rebus writing: two different words share the same sound (*sun* and *son*, *deer* and *dear*, *ant* and *aunt*, *fir* and *fur*). She hears a sentence and places a **mute meaning-sign** (a **determinative**: sky, person, plant, animal) beside the sound-sign so the reader knows which word is meant. Learning goal: how writing jumped from counting goods to recording speech (the **rebus principle**, C3 D2.His.9–11, KS2 *evolution of written forms*), and why scribes added silent meaning-signs to separate homophones.

## Overlap, IDs and bands

- **Rhyme Time** (`rhyme-time`, Story Grove) owns rhyming families (`cat`, `hat`, `bat`), not homophones or writing a sentence with sound-borrowed signs.
- **Word Glue** (`word-glue`, Story Grove) owns compound words and affixes (`sunflower`, `painter`), not rebus sound-borrowing or mute determinatives.
- **Read & Do** (`read-do`, Story Grove) owns printed captions and sign editing; River Tablets uses spoken sentences and clay picture-signs with no required reading.
- **River Tablets 1–6** (`river-tablets`, Story Grove, `upright: true`, `bands: ['preschool', 'prek', 'school']`, `region: 'story-grove'`, `challenge: 'numbers'`, `music: STYLES.paint`) stay untouched. Levels 7 and 8 append to `PLANS` (`MAX_LEVEL = 8`), `LEVELS.school` widens from `3..6` to `3..8` (`preschool` stays `1..2`, `prek` stays `2..3`), and no saved level or pin shifts.

`describeLevel`:
- 7: `"Say it with pictures: pick picture-signs whose names sound like the words (two sentences)"`
- 8: `"Which one do I mean? add a silent meaning-sign so look-alike sounds read right (two sentences)"`

## Level 7, *Say it with pictures* (`rebus`)

### The model (`logic.ts`)

- **Picture-sign inventory (9 target signs + 8 concrete distractors, all drawn as clay icons; corrected from "12" when built):**
  - Target homophone signs (name spoken -> word written):
    `eye` (*I*), `sea` (*see*), `deer` (*deer* / *dear*), `sun` (*son*), `wood` (*would*), `knot` (*not*), `bee` (*be*), `pear` (*pair*), `flower` (*flour*).
  - Non-homophone concrete distractor signs (never rhyme or homophone-match any target slot in the sentence):
    `jar`, `sheep`, `crate`, `leaf`, `moon`, `cup`, `boot`, `drum`.
- **Authored sentence bank (6 sentences, 3 target slots each, 2 distinct sentences drawn per round by `ctx.rng`):**

| ID | Spoken sentence | Ordered 3-sign solution | Distractor pool (3 drawn) |
| --- | --- | --- | --- |
| `see-deer` | *"I see a deer."* | `['eye', 'sea', 'deer']` | `jar`, `leaf`, `moon`, `drum` |
| `dear-son` | *"See my dear son."* | `['sea', 'deer', 'sun']` | `jar`, `cup`, `boot`, `leaf` |
| `would-not` | *"I would not!"* | `['eye', 'wood', 'knot']` | `sheep`, `crate`, `moon`, `cup` |
| `see-pair` | *"I see a pair!"* | `['eye', 'sea', 'pear']` | `jar`, `drum`, `boot`, `leaf` |
| `would-be` | *"Oh, I would be!"* | `['eye', 'wood', 'bee']` | `crate`, `moon`, `cup`, `sheep` |
| `flour-not-wood` | *"Flour, not wood!"* | `['flower', 'knot', 'wood']` | `jar`, `drum`, `moon`, `boot` |

- **Flow & pure helpers (`startRebus`, `placeSign`, `liftSlot`, `readRebus`, `rebusHint`):**
  - The round opens with Sentence 1 spoken aloud (`rt.rebus.sentence.<id>`) while the 3 empty clay slots pulse in order.
  - Tapping a sign in the 6-sign tray speaks its picture name (`rt.rebus.sign.<sign>`, e.g., *"Eye."*, *"Wood."*) and places it in the leftmost empty slot (unless all 3 slots are full, in which case the tablet wobbles and says `rt.rebus.full` — never a miss).
  - Tapping a filled slot on the tablet lifts that sign back to the tray (free, unlimited).
  - Tapping **Read** while fewer than 3 slots are filled wobbles **Read**, says `rt.rebus.fill-first`, and counts nothing.
  - Tapping **Read** with 3 slots filled commits:
    - **Exact match (`slots === solution`):** the pet reads the sentence aloud with rising pentatonic chimes (`rt.rebus.right.<id>`), and advances to Sentence 2 (or finishes after Sentence 2).
    - **Mismatch:** counts **1 miss**. The pet reads the placed picture names in order (`rt.rebus.wrong`, naming the misplaced position), keeps her signs on the tablet so she can swap only what needs fixing, and returns to input.
    - **Hint (`rebusHint`):** after 2 misses on a sentence, or on Help (`Show me`), the leftmost slot that is empty or does not match `solution[i]` glows (if wrong, tapping it or the glowing right sign swaps/places it) and counts **1 hint** (at most once per sentence). Following the glow step-by-step always reaches `solution`.

## Level 8, *Which one do I mean?* (`determinative`)

### The model (`logic.ts`)

- **Four mute meaning-signs (determinatives, no spoken word of their own):**
  - `person` (head-and-shoulders mark)
  - `sky` (crescent-and-stars sky arch)
  - `plant` (sprout/wheat stalk)
  - `animal` (paw/antler mark)
- **Authored contrasting homophone pairs (4 pairs = 8 sentences; each round draws 1 pair from the 4 via `ctx.rng` and plays both meanings in seeded order so she sees the *same* sound-sign take *two different* meaning-signs in one round):**

| Pair | Shared sound-sign | Meaning A (spoken sentence + right determinative) | Meaning B (spoken sentence + right determinative) |
| --- | --- | --- | --- |
| `sun-son` | `sun` | *"The warm sun shines in the sky."* -> **`sky`** | *"My son carries a basket."* -> **`person`** |
| `deer-dear` | `deer` | *"A deer stands by the reeds."* -> **`animal`** | *"My dear friend came to visit."* -> **`person`** |
| `ant-aunt` | `ant` | *"A tiny ant crawls on the clay."* -> **`animal`** | *"My aunt baked bread today."* -> **`person`** |
| `fir-fur` | `fir` | *"A tall fir grows by the path."* -> **`plant`** | *"The cat's soft fur is warm."* -> **`animal`** |

- **Flow & pure helpers (`startDeterminative`, `pickDeterminative`, `determinativeHint`):**
  - The tablet displays the shared sound-sign (`120 × 120`, tap to re-hear its sound word, free) beside an empty dashed determinative cell (`120 × 120`) marked `?`.
  - The top banner speaker button replays the full spoken sentence (`rt.det.sentence.<id>`) at any time (free).
  - Tapping one of the 4 mute meaning-signs commits:
    - **Match (`pick === answer`):** stamps the silent meaning-sign into the clay beside the sound-sign, explains why it fixes the meaning (*"The sky sign is silent — it tells the reader you mean sun in the sky!"*, `rt.det.right.<id>`), and advances to the second sentence of the pair (or finishes after Sentence 2).
    - **Mismatch:** counts **1 miss**. The meaning-sign bounces back, the pet names what that silent sign stands for (*"That is the animal sign. Listen again…"* + re-speaks the sentence, `rt.det.wrong`), and keeps the choice open.
    - **Hint (`determinativeHint`):** after 2 misses on a sentence, or on Help (`Show me`), the right meaning-sign glows (`1` hint, at most once per sentence).

## Screen, controls and upright layout (`tabletLayout` in `logic.ts`)

Both levels reuse `tabletLayout` + `finishLayout` (including `hangFromBottom` upright) and are tested across all 4 landscape views and all `UPRIGHT_VIEWS` + `short`:

- **Level 7 (`rebus`):**
  - `lane`: speaker replay bar along the top (`≥ 110` tall, tap to re-hear sentence).
  - `tablet`: centered clay tablet holding the 3 sign cells (`110 × 110`, gap `16`, total `362` wide).
  - `signs`: 2 rows × 3 columns of `110 × 110` picture-sign buttons (`gap = 16`, `362 × 236`), centered below the tablet (upright) or beside/below in `free` (landscape).
  - `handIn` (**Read**): `140 × 110` button beside the tray in landscape and centered below the tray in upright.
- **Level 8 (`determinative`):**
  - `lane`: speaker replay bar along the top (`≥ 110` tall, tap to re-hear sentence).
  - `tablet`: centered clay tablet holding the sound-sign (`120 × 120`, tap to hear sound) and the empty/stamped determinative cell (`120 × 120`, visual target/display).
  - `determinatives`: 1 row of 4 mute meaning-sign buttons (`110 × 110`, gap `16`, total `488` wide; in landscape centered in `free`, in upright centered across `768` above `PET_CORNER` or wrapped 2×2 if `free.w < 488` — tested so every target is `≥ 100` units, `≥ 44` CSS px at `390 × 844`, and clear of `HOME_CORNER` and `PET_CORNER`).

## Accounting, voice, how-to, ghost finger and co-play

- **Accounting (`src/progress/coach.ts`):**
  - Level 7: only a wrong **Read** counts a miss; tapping signs, lifting slots, re-hearing the sentence, or tapping **Read** with empty slots is never counted. Hint glow counts at most 1 hint per sentence.
  - Level 8: only a wrong meaning-sign tap counts a miss; re-hearing the sentence or sound-sign is never counted. Hint glow counts at most 1 hint per sentence.
  - Both finish via `ctx.finish(tally(t))` for one ordinary sticker, with standard `difficulty.ts` stepping (`school: 3..8`).
- **Voice (`src/games/river-tablets/voice.ts`, all static keys, `rt.*` prefix):**
  - `rt.instruct.7` (*"Pick three picture-signs that sound like the words, then press Read."*), `rt.instruct.8` (*"Tap the silent meaning-sign that shows which meaning the sentence uses."*), `rt.history.rebus` (*"Long ago, scribes used pictures of things for their sounds to write words that were not things."*), `rt.history.det` (*"Long ago, scribes added silent meaning-signs so readers could tell look-alike sounds apart."*), plus the sentence, sign, wrong, right, and help lines (`Better Voice V1` renders or falls back to device speech cleanly).
- **How-to card (`src/games/river-tablets/howto.ts`):**
  - Step `{ from: 7, to: 7 }`: `"Pick three picture-signs whose names sound like the sentence, then tap Read."`
  - Step `{ from: 8, to: 8 }`: `"Tap the silent meaning-sign that shows which meaning of the word the sentence uses."`
  - Level-scoped `note` entries (`from: 7, to: 7` and `from: 8, to: 8`) naming what is free vs counted and the corresponding history line.
- **Ghost finger (`touchDemo: true`, `autotouch()`):**
  - Level 7: taps the 3 signs in `solution` order, then taps **Read**.
  - Level 8: taps the authored `answer` determinative for the current sentence.
- **Co-play:**
  - Level 7: one reads the spoken sentence slowly aloud, the other finds the matching picture-signs.
  - Level 8: guess both meanings of the sound-sign before listening to the sentence, then pick the silent meaning-sign together.

## Build batches and check tiers

Build in order, one session per batch (do not combine):

1. **Batch `river-tablets 4` — Level 7, *Say it with pictures* (`school`):**
   - Add `rebus` plan (`level: 7`), `12` target/`8` distractor icons in `art.ts`, `startRebus`/`placeSign`/`liftSlot`/`readRebus`/`rebusHint` and `tabletLayout` branch in `logic.ts`, scene wiring + `autotouch()` in `index.ts`, `voice.ts`, `howto.ts`, widen `LEVELS.school` to `3..7`.
   - **Rule tests (`logic.test.ts`):** every sentence in the bank has 3 distinct valid signs, unique solution, zero rhyme/homophone overlap with its distractors, lifting/re-placing invariants, `rebusHint` walk always reaches `solution`, `tabletLayout` passes all 4 landscape views and all `UPRIGHT_VIEWS` + `short`.
   - **Tier (new interaction):** `npm run typecheck`, unit tests (`river-tablets`, `upright`, `lands`, `registry`, `howto`, `voice`, `game-docs`), one filtered `rivertablets` scripted play of level 7 (one wrong Read + hint glow, finish 2 sentences to sticker), one upright portrait screenshot, `fingerdemo` at level 7, `npm run build` (voice/howto/shared content change), `npm run game-docs`.
2. **Batch `river-tablets 5` — Level 8, *Which one do I mean?* (`school`, after `river-tablets 4` lands):**
   - Add `determinative` plan (`level: 8`), 4 determinative icons + `ant`/`fir` sound-signs in `art.ts`, `startDeterminative`/`pickDeterminative`/`determinativeHint` and `tabletLayout` branch in `logic.ts`, scene wiring + `autotouch()` in `index.ts`, `voice.ts`, `howto.ts`, widen `LEVELS.school` to `3..8`.
   - **Rule tests (`logic.test.ts`):** all 4 pairs draw both meanings in seeded order, each meaning has a unique determinative distinct from its twin, wrong determinative never mutates solved state, `determinativeHint` always points to `answer`, `tabletLayout` passes all 4 landscape views and all `UPRIGHT_VIEWS` + `short`.
   - **Tier (new interaction):** `npm run typecheck`, unit tests (`river-tablets`, `upright`, `lands`, `registry`, `howto`, `voice`, `game-docs`), one filtered `rivertablets` scripted play of level 8 (one wrong determinative + hint glow, finish 2 sentences to sticker), one upright portrait screenshot, `fingerdemo` at level 8, `npm run build`, `npm run game-docs`.

## Source check

- **Cuneiform & Egyptian hieroglyphs** (opened in the [ancient river civilizations study](../deep-dives/subjects/ancient-river-civilizations.md#anchors-and-evidence-limits)): proto-cuneiform pictographs taking phonetic value (rebus principle, ~2800 BC); Egyptian logograms, phonograms and mute determinatives placed at the end of a word to fix its meaning and separate homophones.
- **English KS2 History & C3 Framework** (opened in the study): KS2 *"evolution of language and its written forms"*; C3 D2.His.9–11 (types and purposes of historical sources).
- The building session for each batch checks the exact wording of `rt.history.rebus` / `rt.history.det` against accessible museum or KS2 curriculum pages per the October 23 standing rule.
