# Word Code levels 1–3 (definition)

Proposed touch game `word-code`, PP9 of the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order). Defined 2026-11-18 from `e574cb9da` in [PR #1828](https://github.com/rjdunlap/neo/pull/1828), following the [November 17 decision](../archive/DECISIONS-2026-11-17.md#games) (admitted for definition, second in its order). **Docs only:** no code, word list or device evidence. The three levels form one implementation batch.

Guess the hidden word. Every try is marked letter by letter with Secret Code's marks (a check in the right spot, a dot elsewhere in the word, a cross not in the word), and the marks are the evidence for the next try. At school the hidden word is one of four pictures and the letters come from a small tray; at grown-up it is a five-letter word from a reviewed list. The learning is deduction over letters: which letters the marks still allow, with reading and spelling short words as the way in. It makes no phonics or decoding claim; a spelling or reading outcome is for a person to watch.

## Ladder and sample rounds

| Level | Band | Board and rule | Example |
| --- | --- | --- | --- |
| 1 *Which picture word?* | School | A hidden three-letter picture word. Four pictures (the candidates, one of them hidden) sit in a row, each with its word under it. A tray of the candidates' distinct letters. Rows of three. | Candidates CAT, PIG, HEN, FOX; the hidden word is HEN. She tries CAT: all three are crosses, so PIG, HEN and FOX are still allowed. She tries HEN: three checks, and the round finishes. |
| 2 *Four-letter picture words* | School | The same round with four-letter words and rows of four. | Candidates FROG, DUCK, MOON, NEST; the hidden word is NEST. She tries MOON: M and both Os are crosses and N is a dot, which leaves NEST alone. |
| 3 *Five-letter words* | Grown-up | A hidden five-letter word from the answer list. Any word on the guess list is a try; a word that is not on it is turned down with no cost. Unlimited rows, the latest six showing. | Hidden `CRANE`. `SLATE` marks S, L and T crosses and A and E checks (A and E are in the same spots in `CRANE`); the next try can keep them. Repeated letters follow the two-pass rule below. |

One round per play. `BandLevels`: `school: 1–2`, `grownup: 3–3`. School's order is 1 then 2 by the usual two smooth rounds; the grown-up band has one level, so adaptation has nowhere to move there, as at any one-level band. Candidate pictures use the built [`PICTURE_THEMES`](../../src/learning/words/themes.ts) words and `typingPicture(word)`: the ten three-letter words (CAT, DOG, PIG, HEN, COW, FOX, LOG, NET, SUN, BEE) for level 1 and the eight four-letter words (FROG, DUCK, BOAT, MOON, RAIN, TREE, LEAF, NEST) for level 2, so no new picture is needed. A level's four candidates come from its own pool, seeded, and the hidden word is one of the four.

**Marks, reused.** Each try letter takes a mark with Secret Code's shapes beside the colour (check, dot, cross: `MARKS`, never hue alone). `score()` is a new pure function in `word-code/logic.ts` with the standard two-pass rule: checks first, then each remaining try letter takes a dot while an unmatched copy of it remains in the hidden word, else a cross. A letter tried twice where the word has one copy marks one dot or check and one cross. Secret Code's `score` is for stones and slots, so it is not imported; the shapes and the draw helpers are.

## Screen, scoring and help

- **School:** a letter tray of the four candidates' distinct letters (at most 12, so four to a row in three rows at 100 units); she taps letters to fill the row and a back button takes the last one off. Tap a candidate picture to hear its word (free, nothing counted). A try may be any letters: a guess is never a miss in itself, and a string that is not a word is marked all the same. Rows stay on screen above the tray; three tries fit and older rows scroll off like Secret Code's.
- **Grown-up:** an on-screen keyboard (26 letters, back and enter in seven columns by four rows) and a hardware keyboard on a laptop, and Enter submits. A word that is not on the guess list shakes and is turned down for free. The keys carry the best mark known for their letter, as the tray does at school.
- **The miss is ignoring a mark she can still see:** submitting a try with a letter in a spot where a still-visible check or cross on a try above already ruled it out (a cross anywhere for a letter the marks say is absent; a dot spot again for the same letter; or dropping a visible check from its spot). The try still plays, so she gets its marks; it counts **one miss** (never more than one a try), the boing sounds and a spoken hint names the ignored letter. Tries that have scrolled off cost nothing, and Secret Code's repeated-letter rule applies (a cross on a second copy only rules out the extra copy). After two misses the keys or tray letters the marks rule out dim, and the glow stays on.
- **Hint:** one button, counted once per press through the coach. It shows one letter of the hidden word in its place (the first spot not yet checked) and names it. A round always finishes: rows are unlimited, and hints lead to the word.
- **School completion:** the round finishes when she builds the hidden word. **Grown-up completion:** the same. One sticker comes with every completed round, with or without help, through `ctx.finish({ misses, hints })`; there are no lives, limits, daily word or streak. Misses and hints are the only count; the number of tries never counts, so a long hunt is never scolded.
- **Speech:** the school instruction goes through `ctx.instruct` (the pet repeats it): "Which picture word is hiding? Tap letters to try a word. A check means right place, a dot means another place, a cross means not in it." Each marked try is read back at school as its word and its result ("C is not in it. A is in another place."), and a tap on a picture says its word. The grown-up level speaks only the instruction and the hints; its marks are shapes. Words are said by device speech until slotted clips, so no spelling or phonics claim is made before the device-speech check ([parked](../DEVICE-CHECKS.md)).

## Words, lists and review

Data lives in `src/games/word-code/words.ts` as plain lists in capitals, kept apart from `learning/words/themes.ts` so no Word Search grid or Crossword changes.

- **School:** the two picture pools above, nothing else. A candidate set draws from one pool. Every hidden word is a picture word she can tap to hear.
- **Grown-up answers:** about 400 five-letter words of everyday life (nouns, verbs and adjectives she would use aloud), no plurals made only by adding S, no proper nouns, no names, no obscure words. **Guesses:** a larger list of a few thousand five-letter words that includes every answer. The build starts from the public-domain ENABLE list (recorded with its licence in the file), intersected with a common-word frequency source for the answers.
- **Block list:** the existing [`BLOCKED`](../../src/learning/words/blocked.ts) set extended with five-letter profanity, slurs, sexual words and words about violence or drugs. No blocked word is an answer or a guess, so none appears on a board or is accepted, and a test checks every list entry. The assistant reviews the answer list in full for fairness and the block list for gaps before it ships (as the Portuguese review is the assistant's); a second human review is not a blocker.

## Generation and the par rule

Seeded rules in `logic.ts` (`ctx.rng`); nothing random in `index.ts`.

- **Reference solver.** A fixed deterministic solver plays the grown-up level: the first try is a recorded opener, then each next try is the alphabetically first answer-list word still consistent with every mark so far. `solverTries(hidden)` is its guess count. This is the October 23 par rule's fixed reference solver (the same idea as Secret Code's `solverTries`): **par is a reference count, never a target shown to her and never "the fewest possible"**. Touch play shows no par. The number is for a later couch course only, whose own definition freezes a few hidden words and sums their `solverTries`.
- **Solvable.** Every answer is reached by the reference solver within six tries (an acceptance test over the whole answer list, so a list change that breaks it fails). If an answer needs more, it leaves the list rather than raising the bound.
- **School sets.** For every seed, a level's four candidates are distinct, drawn from the level's pool, and and a solver that tries only candidates (the first one still allowed) finishes in at most three tries (a test enumerates every combination of four from the pool and every hidden word).
- **Marks.** `score()` is tested for the standard cases: all checks, all crosses, a repeated letter in the try with one in the word, a repeated letter in the word with one in the try, a check taking precedence over a dot.

## Layout, bands and upright

Phone work comes first, so the game ships `upright: true` and a pure `layout.ts` (the lesson of the [upright batches](phone-portrait.md#game-batches)): layout is a function of `view`, level and screen, with a per-level test over the landscape view (1024 × 768) and the upright views (768 × 1024 to 768 × 1700), so nothing is judged from a browser screenshot alone.

- **School targets** are at least 100 units: tray letters 100 × 100, try tiles 100 × 100, picture cards 100 wide (picture in the top 64 and the word under it at 28). A candidate row of four plus gaps is 436 wide. Landscape: the picture row and the tries on the left, the tray on the right; upright: the picture row on top, the tries below, the tray at the foot.
- **Grown-up targets** are at least 64 units (the band's minimum) and as tall as the view allows; the first build aims for the keyboard keys to measure at least 44 CSS pixels at 390 × 844 (about 86 units), which seven columns of 96 by 88 do, and records its smallest target in [`grownup-thumbs.test.ts`](../../src/games/grownup-thumbs.test.ts). If the board and keys cannot both fit in the shorter landscape view, the tries scroll rather than the keys shrink.
- The whole round stays visible, clear of the pet and the corner buttons; the corner guide is the pet's instruction at school.
- **No timer, no daily word, no sharing.** The couch is not part of this definition.

## Land and sources

**Home land: Lantern Lake.** It is a grown-up game that opens a small level to school, the rule the [Word Search school opening](word-search-school-opening.md#land-and-places) settled and Lantern Lights, Island Bridges and Pond Conga followed. With `school` its lowest band, Lantern Lake shows it to a school player beside the signpost, and Wonder Woods lists it by subject (`gamesFor(band)`). It is not Puzzle Peaks: that land takes Domino Pond's build, and Secret Code (its nearest game) is preschool to school.

At the source base Lantern Lake has 13 games on the grown-up side, so with the host it already pages (7 + 6); Word Code makes it 14 and pages 7 + 7, with no signpost on the older side. On the school side it shows host, five games (Gem Swap, Lantern Lights, Word Search, Island Bridges, Pond Conga) and the signpost today; Word Code makes it six games and the signpost, which fits on one page at every school view. The lands tests (`lands.test.ts`, `registry.test.ts` and the Lantern Lake scene test) check the counts; the 13-spot budget and the no-shrink rule hold ([location capacity](location-capacity.md)).

Sources: Wordle and its genre are the model for the marks and the stated rule (the dive's [Wordle](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order) row); the word lists are original selections from the public-domain ENABLE list, never a copy of the New York Times list. Checking the marks over repeated letters follows the usual two-pass rule. The learning purpose is stated as deduction and short-word reading only; no outcome claim.

## Overlap

- **Secret Code** marks colours in slots; Word Code marks letters in words, and a try must be a word at grown-up level. They share the marks, the miss rule and the glow after two misses, not code.
- **Word Search** finds known words in a grid; Word Code finds an unknown one by evidence. **Pond Typing** and **Crossword** use `typingPicture`; Word Code draws it for candidates and does not change them.
- **Word Monsters'** ladder and the grown-up window's [word ladder](../deep-dives/word-monsters.md) (G1) work from word steps; Word Code never asks her to change one letter at a time.

## Build checks

Start from the [new-game scaffold](../NEW-GAME.md). Rule tests: `score()` cases above, the reference solver finishing every answer within six tries, school candidate sets over every combination, the block list over every list, the ignored-mark miss over repeated letters, the hint always leading to the word, and the layout test per level and view. Typecheck and unit tests; **one** filtered scripted play of level 1 and of level 3 (one wrong answer, one hint) and one portrait screenshot of each band; `fingerdemo` at level 1 (the ghost finger builds the hidden word from the tray); `npm run build` once for the shared voice lines and the land change. Say which checks were not run. Expected files: `src/games/word-code/` (`index.ts`, `logic.ts`, `layout.ts`, `words.ts`, `voice.ts`, `howto.ts`, `art.ts`, tests), `src/content/lands.ts`, the generated barrels, `src/games/registry.test.ts`, `src/games/grownup-thumbs.test.ts`, the game page, README and GAMES.md rows, and a verification entry.

## Settled and open

**Settled here:** `word-code`; school levels 1–2 (three- and four-letter picture words, four candidates, a letter tray) and grown-up level 3 (five letters, reviewed lists); Secret Code's marks and miss rule; unlimited tries, no daily word; par is a fixed reference solver's count, shown nowhere in touch play; Lantern Lake; upright from the first slice.

**Open, not blocking:** a couch course frozen from `solverTries`; a younger opening with spoken letters; lowercase letters; a letter-picking wheel for the d-pad (couch); more picture words as more are drawn; how the grown-up answer list is balanced for a family with other languages ([additional languages](additional-languages.md)).
