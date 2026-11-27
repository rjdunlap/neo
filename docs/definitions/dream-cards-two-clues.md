# Dream Cards level 2, *Two clues for one picture* (definition)

*Game `dream-cards` · level 2 · school only · defined 2026-11-27 on `claude/define-dream-cards-2`, as the next level of the [level 1 definition](dream-cards.md#the-level) (built 2026-11-26, [PR #2259](https://github.com/rjdunlap/neo/pull/2259)), from the [social-emotional study](../deep-dives/subjects/social-emotional.md#dream-cards-turn-the-existing-seed-into-a-definition). Checked against `src/games/dream-cards/logic.ts` (the `FITS` table, `VALID_DEALS`, `LEVELS`) and `voice.ts` at `origin/main`. A child's reading of it is a person check, not a gate.*

**Fun action and purpose.** Level 1 ends when the picture turns over. Here the giver sees where she pointed, and may offer **a second clue for the same picture** before it turns over. She then keeps her point or moves it, and the picture turns over to show both clues and both readings. The learning is the next step of the same idea: *when someone reads your clue differently, you can say more, and a second clue can change what another person sees* (perspective-taking, the study's [anchors](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits)). Keeping her first point and moving it are both fine; **the first reading is never made wrong by the second clue**. There is no score, no clock and no right picture, and the game does not read minds or claim a social-skills benefit.

## Overlap

Level 1 owns the pictures, the clues, the blanket and the reveal; this level adds only a second clue and a second look. Who Am I? and Mystery Friend narrow a secret to one right answer with clues that *rule things out*; here a second clue may make one picture fit better, but any picture can still be pointed to and no picture is the answer she must reach. Common Ground and Two Viewpoints compare viewpoints in a story or a room; here the viewpoints are two readings of one picture. No new picture, clue or fit table is added.

## The model (`logic.ts`)

Everything in level 1's model stays as built (the pool, `FITS`, the 28 valid deals, `dealRound`, `revealKind`). Added, all integers over the same tables:

- **A two-clue round** is a level 1 round with a *second clue* `clue2`, a dealt clue different from the first, given after the listener's first point. Nothing else about the deal changes, so **no new deal is needed and the 28 stay the 28**.
- **`bothFit(deal, c1, c2)`** returns the dealt pictures that fit both clues. Over the 28 deals and their 3 unordered clue pairs each (84 pairs), exactly one dealt picture fits both in 68 pairs and exactly two do in 16 (none is ever empty). A test re-derives both counts; across the whole pool of six clues the 15 clue pairs fit no picture (1 pair), exactly one picture (10 pairs) or two (4 pairs). It is used only to say what the pet says and to dress a hint; it is never a score.
- **`fittingTriples(deal)`** lists the ordered `(picture, clue, clue2)` with the picture fitting both clues. In every valid deal there are at least 6: 14 deals have 6, 12 have 8 and 2 have 10, 200 in all (a test re-derives these). So the pet can always give two clues that both suit its picture.
- **`petPick2(deal, seed)`:** deterministic from the seed; rotates through `fittingTriples`, so the first clue is level 1's fitting pair and the second is a further clue that also fits. The pet fixes its triple when the round starts (state only) and gives `clue2` after her first point; it does not choose `clue2` by looking at where she pointed, so the game does not steer her toward a "correct" move.
- **Any second clue is allowed.** A person giver may pick either of the two dealt clues they have not used, whether or not the picture fits it; the listener may keep or move to any of the three pictures. **Nothing here is a miss.**
- **`secondKind(first, final)`** is `kept` when her final point is her first, else `moved`. **`finalKind(giverPick, c1, c2, final)`** is `same` (final is the giver's picture), `both-fit` (a different picture that fits **both** clues) or `new-view` (a picture that does not fit both); the first picture is not graded. It only selects which line is said, never a verdict, and the round ends warmly whatever it returns.
- **`hintAction2(state)`** in the second look glows the two clue tokens and names them; it never glows a picture and never reads the giver's pick, so it cannot give the answer (the privacy rule below keeps this true).

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 2 | *Two clues: say more, then look again* | Level 1's three pictures and three clues; after her first point the giver adds a second clue, she keeps or moves her point, then the picture turns over |

`LEVELS` becomes `school: { min: 1, max: 2 }`. The adaptation rule applies as everywhere (two smooth rounds step up; two rounds with at least two hints step down): a level 1 round with no hint is smooth, so level 2 follows after two such rounds, and a grown-up can pin either with `store.pin`. Level 1 is unchanged and stays the way in; level 3 (colour her own stamp) stays its own later definition.

### First round

Solo, the pet gives, as in level 1: it picks the lantern boat and says "floating"; the cards are the lantern boat, the sky whale and the umbrella forest. She points to the umbrella forest. It stays pointed (her ring is drawn on her card, the giver's choice is still nowhere on screen). The pet says "And it is glowing too." She taps *This one* on the umbrella forest again, or moves to the lantern boat. The boat turns over: "I saw the lantern boat. You saw the umbrella forest. That is a new way to see glowing." She taps *Finish*, or *Swap* to give two clues herself.

## Screen and controls (`layout.ts`)

Same upright and landscape layout, three cards and three tokens, each at least 100 units; nothing new is drawn on the cards.

- **After her first point:** her ring is on her card and the **first clue token** moves to a "given" place beside the cards (still tappable to hear again). The other two tokens stay in the row. The giver's choice is still **never drawn**: it exists only in state.
- **The giver's second clue** (a person or *Pass it*, as in level 1; the pet speaks it): a tap hears a token, a second tap on the same token confirms, exactly as level 1. In two-person play the blanket is **not** lowered again; she is still the listener, the giver only sees her ring and chooses a clue.
- **Her second look:** both clue tokens are shown big, the three cards are tappable, and two large buttons say *Keep it* (her ring stays) and, after she selects a different card, *This one* (the ring moves). *Show me* is there as before. A first tap on a card only selects it, as in level 1, so there is no accidental move.
- **The reveal:** the giver's card flips; her first and final readings show as two rings (one ring when she kept it), the giver's as in level 1. Lines are by `finalKind`, plus one sentence if she moved. *Finish* and *Swap* (once; the swapped round is two clues too) as in level 1.
- A pictured step on the how-to card and the existing pet clearance rule apply; the layout test runs at every band and both orientations.

## Accounting, help and finishing

- `ctx.finish({ misses: 0, hints })`: no choice is a miss, and Help in the second look counts as one hint.
- **Help** by phase, never naming the giver's picture: in her first look as level 1; in the giver's second turn a glow on a dealt clue the picked picture fits (when none fits, the pet says "Any clue is fine, say what it makes you think of"); in her second look the two clue tokens glow and the pet says "Look for one that can be {c1} and {c2}."
- **Supported ending:** *Show me*, the pet taking either role and *Keep it* always finish the round; it gives its one sticker and is not independent mastery.
- **Finish** is as level 1: the game saves nothing about picks, clues or who gave what, and draws no celebration of its own.
- **Not claimed:** no line says what anyone feels or that a reading is wrong; no speech recognition and no typing.

## Speech (`voice.ts`)

New keys, all carrying a slot so they stay on device speech (`{name}` is hers, `{a}`, `{b}` picture names, `{clue}` and `{clue2}` clue words). Level 1's `-me` and `-pair` variants carry over: each new reveal line has the same three voices (the pet gave, she gave and the pet pointed, two people), as the built file does.

| Key | When | Line (pet voice) |
| --- | --- | --- |
| `dream-cards.ask-second` (instructed) | giver's second turn | "Now say one more clue about the same dream, {name}." |
| `dream-cards.pet-clue2` | the pet gives it | "And it is {clue2} too, {name}." |
| `dream-cards.ask-again` (instructed) | her second look | "{clue} and {clue2}. Keep your picture, or look again?" |
| `dream-cards.kept` | she kept it | "You are keeping the {b}, {name}." |
| `dream-cards.moved` | she moved | "A second clue can change what you see, {name}." |
| `dream-cards.reveal2-same` | `same` | "I saw the {a}, and you found it, {name}. {clue} and {clue2}!" |
| `dream-cards.reveal2-both` | `both-fit` | "I saw the {a}. You saw the {b}. Both can be {clue} and {clue2}." |
| `dream-cards.reveal2-new` | `new-view` | "I saw the {a}. You saw the {b}. That is a new way to see {clue} and {clue2}." |
| `dream-cards.hint-clues` | Help, second look | "Look for one that can be {clue} and {clue2}, {name}." |
| `dream-cards.hint-any` | Help, no clue fits | "Any clue is fine, {name}. Say what it makes you think of." |

(The `-me` and `-pair` variants swap "I" and "you" as in the built level 1 lines.) No line says right, wrong, correct or mistake; the building session adds none that does. After the voice file changes, run `node scripts/content-barrels.mjs`.

## Rule tests (`logic.test.ts`, plus a layout test)

- `bothFit` over all 28 deals: 68 clue pairs with one dealt picture fitting both, 16 with two, none with zero; over the pool 1 / 10 / 4 pairs fit none / one / two pictures.
- `fittingTriples`: at least 6 in every valid deal (14 with 6, 12 with 8, 2 with 10, 200 total); every triple's picture fits both clues and `clue2 ≠ clue`.
- Over 200 seeds: `petPick2` is one of its deal's triples, rotates across seeds, and is the same for the same seed.
- `finalKind` is total over all giver-pick, clue-pair and final-point combinations (`3 × 6 × 3` per deal) and returns `same` exactly when the final point is the giver's picture; `secondKind` is `kept` exactly when the points match.
- Every sequence of choices reaches `reveal` and finish with 0 misses; `hintAction2` never returns a card, depends only on the deal and the clues (a render-or-state test: two rounds with the same deal and clues but different giver picks give identical hints).
- The privacy rule extends: the state a card draw reads in the first look, the second turn and the second look never includes the giver's picture.
- Level 2 is in `LEVELS` and `describeLevel(2)` is the string above; the layout test covers the "given" clue place and the two buttons at every band and both orientations.

## Ghost finger, how-to card and registration

- **How-to card:** level 2 shows a finger tapping a card, then a second clue appearing, then the finger tapping *Keep it* or another card; the level 1 card is unchanged.
- **Ghost finger:** `autotouch()` at level 2 taps a card and *This one*, waits for the second clue, taps *Keep it* then *Finish*; a unit test runs 50 seeds and every one reaches `finish` with 0 misses. `fingerdemo` plays level 2 once.
- **Registration:** no new game; level 2 is added to `LEVELS`, `describeLevel`, the how-to card, the voice file, the lands page text if the level list changes (Story Grove stays), the game's page `docs/games/dream-cards.md` (`npm run game-docs`), and a verification entry. The sticker is unchanged.

## Check tier

New levels on an existing interaction: typecheck, the game's rule tests, one browser play of the new top level (solo: point to a picture the first clue does not fit, take the second clue, move once, then *Swap* and give two clues, then *Finish*) and `fingerdemo` at level 2. `npm run build` only if shared files change. Whether a 6–8-year-old finds the second look natural, and whether the lines read as warm rather than as a correction, stay person checks on a phone, not gates.

## Open decisions

1. **Does the pet react to her first point?** Default: no, its second clue is fixed with its first pick (above), which keeps the pet from steering her. If a phone playtest shows the second clue feels random, let `petPick2` choose the second clue from the two it fits, preferring the one the first reading does not fit; the rule tests only change the "same for the same seed" case.
2. **A third clue.** Default: none. The giver has exactly two further clues to choose between and gives one; a third round would be a different level.
3. **Whether `new-view` sounds like a correction.** Inherited from level 1's decision 3: if it does, use `both-fit`'s wording for every different final point.
