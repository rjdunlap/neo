# Rhyme Riddles: Rhyme Time levels 5–7

PW1 definition, 2026-10-22, branch `claude/define-rhyme-riddles` ([PR #844](https://github.com/rjdunlap/neo/pull/844)). Based on the [poetry-wordplay study](../deep-dives/subjects/poetry-wordplay.md) and its [packet](../deep-dives/subjects/RECOMMENDATIONS.md#poetry-and-wordplay-recommendations). **Built 2026-10-24 (levels 5–7), [PR #927](https://github.com/rjdunlap/neo/pull/927), branch `claude/rhyme-riddles`; the text below is the definition as written, and the build differs where noted in the [archive note](../archive/COMPLETED-2026-10-09.md).** Facts about `src/games/rhyme-time/` were read at `3fb24fd5`.

## Scope and identity

**Fun action:** the pet gives two clues about one of the pictures on the shelf, one by sound ("it rhymes with *bear*") and one by meaning ("you can sit on it"), and she taps the picture that fits both. At the top she turns round and gives the clues herself, then watches the pet find her picture, or fun-wrongly find another.

**Learning purpose:** hold a sound clue and a meaning clue together (RF.K.2, recognising and producing rhyme; no CCSS standard is quoted for the two-clue structure itself, which the study found only in a grown-up and 12+ game, so its fit for ages 5–8 is unplayed). The island claims only that she can hear, choose and produce a rhyme and use two clues with spoken support. A finished round is not evidence of phonological awareness. The Head Start ELOF goals were not opened for this definition, so none is quoted.

**It is a mode of Rhyme Time**, not a new game (study decision 1, lean yes): the same twelve families, 29 pictures, art, music, home land (Story Grove), hub icon, sticker and stable ID `rhyme-time`. Overlap checked against [GAMES.md](../GAMES.md): Rhyme Time choosing, pairing and odd-one-out stay untouched at levels 1–4. Not owned here: features-of-an-animal riddles (Who Am I?), syllables (Clap the Syllables), finishing a line (the study's PW2), Rhyme Hunt in the [idea notebook](../IDEAS.md). The pending Rhyme Time deep dive (queued research) may renumber later levels; it must keep these as written or move them with their tests.

## Bands and levels

Today `LEVELS` is `prek 1–3`, `school 2–4`. The build makes it:

| Band | Range | Note |
| --- | --- | --- |
| `prek` | `min 1, max 5`, `order: [1, 2, 3, 5]` | Level 4 (odd one out) and levels 6–7 stay school. A saved prek 4 never existed, and `order` lands a stray level on the nearest listed ID, so no pin is renumbered |
| `school` | `min 2, max 7` | Contiguous |

Levels 1–4 and `planFor` clamping do not change. Adaptation is the shell's: two smooth rounds step up, two struggling rounds step down.

## The clue table (the thing that needs review)

Every picture gets **one or more meaning tags**; a tag is one spoken clue sentence. Tags are **generous**: a picture that arguably fits a clue gets the tag, which only removes it from the roles where it must *not* fit. Tags are authored in `logic.ts` and read by the rule tests; nothing is generated.

| Tag | Clue the pet says | When it fails: "…, but {fact}." | Pictures |
| --- | --- | --- | --- |
| `wear` | You wear it. | you do not wear it | hat, coat, ring |
| `eat` | You can eat it. | you do not eat it | pear, cake |
| `eatwith` | You eat with it. | you do not eat with it | spoon, dish |
| `sit` | You can sit on it. | you do not sit on it | chair, log |
| `ride` | You can ride in it. | you do not ride in it | car, truck, boat |
| `fly` | It can fly. | it does not fly | bee, bat, duck |
| `swim` | It can swim. | it does not swim | fish, duck, frog |
| `pet` | It can be a pet. | it is not a pet | cat, dog, fish, frog |
| `fur` | It is furry. | it is not furry | cat, dog, bear, king |
| `sky` | You can see it in the sky. | you do not see it in the sky | star, moon |
| `grows` | It grows outside. | it does not grow outside | tree, pear |
| `holds` | You can put things in it. | you do not put things in it | jar, dish |
| `opens` | It opens a door. | it does not open a door | key |

Pictures with no tag (snake, bell, shell, bee's rhyme-mates tree and key aside) are fine as neutral decoys and mates. The tag table is the **content-review artifact** (study decision 2): confirm each picture's tags, add tags a reviewer thinks a child would call true (fish as `eat`? bat as `pet`?), and rule out a clue that is untrue of its picture's drawing (the bat is the flying animal, the ring is jewellery, the king is a crowned bear). No verse, rhyme text or tongue twister enters this slice, so the study's violence/demeaning rule has nothing to screen here; the clue sentences above are the whole new text.

## The riddle (levels 5 and 6)

A **riddle** is `{ clueWord, answer, mate, trap, neutral?, tag }`, built from the family table:

- `answer` and `mate` are two pictures of one family of three or more (at, og, ee, ar, ear); `clueWord` is the family's third word, **spoken only, never on the shelf**. The rhyme clue "it rhymes with {clueWord}" therefore keeps exactly `answer` and `mate`.
- `tag` is held by `answer`, **not** by `mate`, and by `trap`, a picture from a different family. The meaning clue alone therefore keeps `answer` and `trap`.
- Both clues together keep exactly `answer`. `neutral` (level 6) is a picture of a third family that holds no tag the clue uses, so it fails both.
- Combinations with no valid `trap` are dropped, not forced: `key` (tag `opens` is unique) is never an answer, and any `answer`/`mate` pair where the mate also holds the tag is skipped. By hand about twenty-five riddles remain across the five families; the build's test pins the real count from the table.

| Level | Plan name (`describeLevel`) | Shelf | Order of clues | Round |
| --- | --- | --- | --- | --- |
| 5 | *Riddle: sound clue, then meaning clue* | answer, mate, trap (3) | rhyme, then meaning | 4 riddles |
| 6 | *Riddle: meaning clue first, a fourth decoy* | answer, mate, trap, neutral (4) | meaning, then rhyme (she holds the meaning while hearing the sound) | 4 riddles |
| 7 | *Your turn: make the riddle* | answer, mate, trap (3) | she chooses | 3 riddles |

Study correction: the study's level 5 example (*bear* with chair, pear, hat) leaves only *chair* after the meaning clue, so the rule "each clue alone leaves two" failed on its own example; the `trap` picture (a log you can also sit on) fixes it.

Order, layout and choices come from the seed (`ctx.rng`): which family, which of the three words is the clue word, which tag, which trap, which side each picture sits. A riddle never repeats in a round.

## Level 5 and 6 play and accounting

- The pet says the whole riddle with every picture named (nothing needs reading): "Here is a riddle! It rhymes with *bear*. You can sit on it. Is it the chair, the pear or the log?" A music-note button replays it; **replay is free and never a hint**. The picture lifts and says its word on touch-down (Rhyme Time's `rhyme.word`).
- A **miss** is a picture that fails a clue. The spoken line names the failed clue, never "wrong": a mate says "*Pear* rhymes with *bear*, but you do not sit on it."; a trap or neutral says "*Log* does not rhyme with *bear*. Listen to the end of the word." The first miss repeats both clues; two misses glow the answer (one hint, as Rhyme Time does today).
- The payoff is the clue made real: the chosen picture does what was said (the chair is sat on by the pet, the pear is eaten, the car carries the pet off, a pet is petted), as a short motion on the pet and the card, then the next riddle. No timer, nothing lost.

## Level 7: make the riddle

The pet **marks one picture with a star**: "Tell me how to find the *chair*!" (Departure from the study's "she taps a picture": not every shelf picture has a valid riddle, so the pet chooses; she still builds the clues.) Under the shelf are two pairs of big chips (each at least 100 units across, spoken on touch-down; chips carry a picture, not text):

| Pair | Chips | What each does |
| --- | --- | --- |
| Sound | the picture of `clueWord` ("rhymes with *bear*"), and the picture of `decoyWord`, a family-mate of the trap that is not on the shelf ("rhymes with *frog*" when the trap is *log*) | the first keeps the answer and the mate; the second keeps only the trap |
| Meaning | `tag` (shared by answer and trap), and a tag only the mate holds (`eat`, the pear's) | the first keeps the answer and the trap; the second keeps only the mate |

She picks one chip from each pair (a chip stays tappable and can be changed) and taps the pet's **Guess** button (a big mouth-open pet, 100+ units). The pet takes the pictures both clues keep:

| Sound | Meaning | Kept | The pet |
| --- | --- | --- | --- |
| clueWord | tag | answer | guesses right and cheers: the round's riddle works |
| clueWord | mate's tag | mate | fun-wrong: "A pear? No, a *chair*!", then she may change a chip |
| decoyWord | tag | trap | fun-wrong: "A log? No, a *chair*!" |
| decoyWord | mate's tag | nothing | "Hmm, nothing is both!" |

Exactly one of the four combinations works (a rule test). **No miss is ever recorded at level 7**; the fun-wrong guess is the lesson, not a mistake. After two combinations that did not work in one riddle, the working chips glow (one hint), and she may use them. Asking the pet to repeat a clue is free. Unsure children can tap Guess with one pair untouched: the pet says "Give me both clues!" and nothing counts.

The meaning chips need **thirteen small glyphs**, one per tag (a hat, a spoon, a seat, a wheel, a wing, a ripple, a heart, a fluff, a star, a leaf, a box, a keyhole, a bite), drawn in code from the palette. This is the only new art; the build may use a shared `tagGlyph(tag)` in `pictures.ts`.

## Voice lines (`src/content/voice-script.ts`)

New line IDs, all spoken with the existing pet voice, `{…}` filled from the riddle: `rhyme.riddle` (rhyme-first), `rhyme.riddle2` (meaning-first), `rhyme.riddleNoRhyme`, `rhyme.riddleNoMeaning`, `rhyme.riddleYes` ("{answer}! It rhymes with {clueWord}, and {clue}."), `rhyme.riddleHint`, `rhyme.make` ("Tell me how to find the {answer}!"), `rhyme.makeGuess` (right), `rhyme.makeWrong` (fun-wrong, naming the guess and the star), `rhyme.makeNone`, `rhyme.makeBoth` ("Give me both clues!") and one `rhyme.clue.<tag>` per tag (13). Each tag's clue and failure text is the table above, so a test can check every line exists.

## How-to card and demonstration

`src/content/howto.ts` keeps its card per level with `LevelLine` entries: from level 5 the card says to listen to both clues and tap the picture that fits both; from level 7 to choose a sound chip and a meaning chip and then tap the pet's mouth. The ghost-finger bot (`autotouch`) taps, at 5 and 6, the answer; at 7 the right sound chip, the right meaning chip, then Guess (a pure `wordToTap`-style function in `logic.ts` returns the next target for the current state, as the existing one does). `touchDemo` stays on. `fingerdemo` must complete a level-7 round.

## Co-play and off-screen

`coplayHint` gains a line: "Ask the pet's riddle back: *it rhymes with cat and you wear it*. What is it?" The study's *Ask me a riddle* and *Rhyme pause* cards belong to the off-screen companions work after an ordinary content review; none is added here. Rhyme does not translate: a family-language edition needs its own table (the open family-languages decision), and this table is never auto-generated or localised by rule.

## What the build changes

One implementation slice, **existing-interaction-plus-new-levels tier** (one declared batch, levels 5–7; levels 5 and 6 share the riddle table and the shelf, level 7 adds chips and the Guess button).

- **`logic.ts`:** `RhymeMode` gains `'riddle' | 'riddle2' | 'make'`; three `PLANS` entries; the `TAGS` table above; `makeRiddles(plan, rng)`; `workingChips(riddle)` and `guessFor(riddle, soundChip, meaningChip)`; `wordToTap` extended; `describeLevel` through `planFor`. Existing levels 1–4 keep their output for the same seeds.
- **`index.ts`:** `LEVELS` as above; `ask()`, `tap()` and `right()` gain riddle branches; level 7's chips, star and Guess button; `destroy()` still has nothing to release unless a build timer is added (then it guards it).
- **`pictures.ts`:** the thirteen tag glyphs.
- **Rule tests (`logic.test.ts`):** for every generated riddle over 300 seeds per level: exactly one picture satisfies both clues; the rhyme clue alone leaves at least two and the meaning clue alone at least two; `answer` and `mate` are one family and `clueWord` its third word and not on the shelf; `trap` holds the tag and is in another family; `mate` does not hold the tag; `neutral` (level 6) holds no tag used and does not rhyme; pictures are distinct; no riddle repeats in a round; the riddle count matches the table (about twenty-five expected) and every big family has at least two; level 7's mate-only tag is held by neither answer nor trap; `key` is never an answer; level 7 has exactly one working chip pair, `guessFor` gives the answer for it and never more than one picture for any pair; every tag has a clue line and a failure line; `LEVELS` bands resolve (`prek` order `[1,2,3,5]`, a stray prek 4 lands on 3 or 5, `school` 2–7); levels 1–4 produce what they did before.
- **Voice, how-to, README row, GAMES entry, `describeLevel` text, `coplayHint`:** per AGENTS "Adding or extending".
- **Browser check (budget):** typecheck, rule tests, one scripted play of level 7 (right chips; then a fun-wrong combination; no misses recorded) and one of level 6 with a mate miss and a trap miss, `fingerdemo` at 5 and 7, one portrait screenshot of the level-6 shelf. No `world`, offline or build run unless shared files change.

## Gates and open decisions

**Source check (S1, at build 2026-10-24):** rhyme recognition and production is CCSS [RF.K.2](https://www.thecorestandards.org/ELA-Literacy/RF/K/2/); fish as food follows the USDA MyPlate Protein Foods group, which includes seafood ([NMSU extension guide](https://pubs.nmsu.edu/_e/E143/)); bats are furry flying mammals ([Smithsonian](https://www.si.edu/spotlight/bats)); the remaining tags are everyday facts about the drawn pictures, checked against each drawing. Only mate facts are spoken as failures, and none is false for any reachable riddle.

- **Content review (study decision 2):** the tag table and failure/clue lines need an ordinary review before merge. Treat the build like the other review-gated games: it may be built and checked, and merges only when the developer approves the table (or edits it). Until then it is not eligible for a routine.
- **Confirm with the developer:** (a) `prek` gets level 5 only (the lean) or none of the riddles; (b) the pet marks the star (this definition) versus her choosing the picture; (c) whether a fish counts as something to `eat` and a frog as a `pet`.
- **Not in this slice:** Finish the line, same-first-sound, Two Meanings, Pun Match, tongue twisters (never graded: the island has no microphone and speech-sound development varies), any verse, couch play, and a family-language table.
