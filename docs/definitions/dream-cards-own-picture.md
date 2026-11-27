# Dream Cards level 3, *Make your own dream picture* (definition)

*Game `dream-cards` · level 3 · school only · defined 2026-11-27 on `claude/define-dream-cards-3`, as the next level of the [level 1 definition](dream-cards.md#the-level) (built 2026-11-26, [PR #2259](https://github.com/rjdunlap/neo/pull/2259)) and the [level 2 definition](dream-cards-two-clues.md) (built 2026-11-27, [PR #2261](https://github.com/rjdunlap/neo/pull/2261)), from the [social-emotional study](../deep-dives/subjects/social-emotional.md#dream-cards-turn-the-existing-seed-into-a-definition). Checked against `src/games/dream-cards/logic.ts` (the `FITS` table, `LEVELS`, `describeLevel`) at `origin/main`. Whether a 6–8-year-old enjoys building the stamp and whether the pointing lines read as warm stay [person checks on a phone](../DEVICE-CHECKS.md), not gates. Built 2026-11-27 ([PR #2263](https://github.com/rjdunlap/neo/pull/2263)); two deviations: the sticker stays the shell's seed over the six pool pictures, and the 50-seed `autotouch()` unit test is covered by the filtered browser play instead.*

**Fun action and purpose.** In levels 1 and 2 she reads a picture that is already drawn. Here she **makes the picture first**: three taps put together a dream stamp from three parts, then she gives one clue about it, and the pet (or a second person) points to the picture the clue makes them think of among three, hers and two others. The picture she made turns over last. The learning is the other half of level 1's idea: *a clue is a way of sharing what you see, and the picture you make says something about it that the person looking can read in their own way* (the study's [perspective-taking anchors](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits)). What she builds is a free creative choice, so **no stamp is a wrong stamp**; and the one who points may point to any card, so no pointing is a miss. There is no score, no clock and no right answer.

## Overlap

| Game / mode | What it already owns | Why this level is separate |
| --- | --- | --- |
| Dream Cards 1–2 | Three drawn pictures, six clues, the blanket and the reveal; two clues for one picture | There she reads the pool's pictures. Here she makes one, so the giver's picture is hers and the fit table has to grow to cover a picture made of parts. The deal, clue tokens, blanket and reveal are reused as built |
| Paint Mixer, Design Studio, Make One for Me | Making a colour, a design or a puzzle for someone | This stamp is made to be *read*, and is never judged by a recipe; it ends in a comparison of two readings, not a finished object or a puzzle with an answer |
| Who Am I?, Mystery Friend | One secret answer reached by ruling things out | Nothing is ruled out and no picture is the answer she must reach |

No general stamp or card-deck framework is built: this level owns its three part tables, and the stamp is drawn by `art.ts` from the pool's existing colours and shapes.

## The model (`logic.ts`)

Everything in level 1's and level 2's model stays as built (the pool, `FITS`, `validDeal`, `revealKind`). Added, all integers over fixed tables; nothing is random except which deal is dealt and which decoys.

- **The stamp** has three parts, one chosen from three in each slot: **where** `sky`, `meadow`, `pond`; **thing** `swing`, `house`, `boat`; **light** `moon`, `lantern`, `star`. `27` stamps (3 × 3 × 3). The part names are spoken on tap, and each part is drawn from the shared palette (`Graphics`, no imported art).
- **What a part invites** (`PART_CLUES`, indices into `CLUES`: `0` quiet, `1` high up, `2` cozy, `3` floating, `4` glowing, `5` tiny), two clues each, so that every clue is invited by exactly three of the nine parts:

| Slot | Part and its two clues |
| --- | --- |
| where | sky: high up, floating · meadow: quiet, cozy · pond: glowing, tiny |
| thing | swing: high up, quiet · house: cozy, tiny · boat: floating, glowing |
| light | moon: quiet, glowing · lantern: cozy, floating · star: high up, tiny |

- **`stampFits(stamp, clue)`** is true when **any** of the stamp's three parts invites the clue (the union). Of the 27 stamps, 24 invite exactly four clues and 3 invite all six (a test re-derives both counts). Like `FITS`, this is a **suggestion of what to say** for the pet's reading and the hint, never a scoring key.
- **A made deal** is the stamp plus two *decoy* pool pictures (seeded, any two of the six, `15` pairs) and three clues (any three of the six, `20` triples), shown in a seeded left-to-right order. It is valid when **every dealt clue fits at least two of the three pictures** (the stamp through `stampFits`, the decoys through `fits`), **the stamp fits at least one dealt clue**, and **each decoy fits at least one dealt clue**. Of the `27 × 15 × 20 = 8,100` combinations, **1,464 are valid, and every stamp has between 41 and 134** (a test re-derives all three numbers), so any stamp she builds has real deals and `dealMade(stamp, seed)` always finds one. The deal is dealt **after** she finishes the stamp; the three clue tokens appear then.
- **The round:** `build` (three slots, tapped in any order; the stamp shows as it grows), `clue` (she taps a dealt clue, then taps it again to confirm, as in level 1), `cover` (the blanket falls over the three cards), `point` (the pet or a second person points), `reveal` (her stamp turns over, the two picks are compared), then *Finish* or *Swap*.
- **`petPoint(deal, clue, seed)`** is deterministic from the seed: it points to one of the dealt pictures that fit the clue (there are always at least two), rotating over seeds so it is not always her stamp. It uses only the deal and the clue, never a hidden mark on the stamp.
- **Any clue and any point are allowed.** She may give a clue the stamp's parts do not invite; the listener may point anywhere. **`revealKind(stampPick, clue, listenerPick)`** (level 1's, unchanged) says which line is spoken (`same`, `both-fit`, `new-view`); it is never a verdict and the round is complete whatever it returns.
- **`hintAction3(state)`** moves attention, never the answer: while she builds, Help only names the three slots ("pick one of each"); once the clues are dealt it glows one token the stamp fits (`stampFits`); in the pet's-stamp turn after *Swap* it glows one picture that fits the clue, as in level 1. It never reads which card is the stamp.
- **Seeded appearance only:** the decoys' order, the blanket's colour and the pet's reading. These never change the rules or the counts above.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 3 | *My dream: build a picture, then give its clue* | She builds a stamp from three parts, gives a clue, and the pet or a friend points among three pictures; hers turns over |

`LEVELS` becomes `school: { min: 1, max: 3 }`. Adaptation is as everywhere (two smooth rounds step up, two rounds with at least two hints step down, clamped); level 3 is the top, a grown-up can pin it with `store.pin`, and levels 1 and 2 stay the way in. A round with no hint counts as smooth. Saved levels and pins are never renumbered.

### First round

Solo, the pet points. She builds a sky, a boat and a lantern. The stamp is a floating lantern boat in a night sky. Her clue tokens are floating, cozy and tiny; the other two cards are the umbrella forest and the sky whale. She gives *floating*. The blanket falls, lifts, and the pet points to the sky whale ("floating"). Her stamp turns over: "I saw the sky whale. You made a sky lantern boat. Both can be floating." She taps *Finish*, or *Swap* so she points at a stamp the pet built.

## Screen and controls (`layout.ts`, `art.ts`)

Upright and landscape; `resize()` reads `view`. Same 100-unit minimum for every target.

- **Build:** three rows (portrait: stacked; landscape: side by side), one per slot, each row three large part buttons with a picture and name. A tap says the name and puts the part into the stamp; a second tap on the same part keeps it, a tap on another part in that row swaps it. The stamp is drawn large in the middle and updates at once; nothing is wrong until it is done. A *Done* button appears when all three slots are filled and is the only way forward.
- **Clue:** after *Done* the three dealt clue tokens appear (a tap says it, a second tap confirms), exactly as in level 1. The stamp is **not saved**: it exists only in state and is cleared when the round ends.
- **The blanket and the pointing:** as level 1 (the cloud covers the three cards, *Pass it* in two-person play, lifted automatically in solo play). Her stamp is never marked: the three cards look alike in size and frame and are shuffled, so a second person who watched her build still has to read the clue.
- **Reveal, Finish, Swap:** as level 1. *Swap* (once): the pet builds a stamp from a seeded recipe and gives a clue, and she points; a stamp built by the pet is a recipe in `art.ts`, never a hidden right answer. The second round ends with *Finish* alone.
- The pet is the corner guide, clear of the cards and part rows at every band; a layout test covers both orientations.

## Accounting, help and finishing

- `ctx.finish({ misses: 0, hints })`: no build, clue or point is a miss; Help counts as a hint.
- **Supported ending:** *Done* is always available once three parts are chosen; the pet building, pointing or giving a clue and *Show me* always finish the round, which still gives its one sticker, supported rather than independent ([AGENTS](../../AGENTS.md#adding-or-extending-a-minigame)).
- **Sticker:** unchanged: the level 1 sticker drawn from a pool picture pinned to its pool index. In level 3 it is the pool picture the pet pointed to if a pool picture was pointed to, otherwise the first decoy in the shuffled order. The stamp itself is not a sticker.
- **Finish:** the game saves no stamp, no clue and no record of who pointed where, and draws no celebration of its own. A "keep my dream picture" request (a treehouse creation) is not defined here; it would be a later, optional line, and it would hold only the three part IDs.
- **Not claimed:** no line says what a stamp means about the child, or that a reading is wrong; no speech recognition, no typing, no drawing from scratch.

## Speech (`voice.ts`)

New keys carry a slot (`{name}` hers, `{part}` a part name, `{a}` and `{b}` picture or stamp names, `{clue}` a clue word) so they stay on device speech. Level 1's `-me` and `-pair` voices carry over, since she is the giver here and the pet or a friend points.

| Key | When | Line |
| --- | --- | --- |
| `dream-cards.ask-build` (instructed) | building | "{name}, pick a place, a thing and a light for your dream." |
| `dream-cards.part` | a part is tapped | "{part}." |
| `dream-cards.build-done` | all three chosen | "What a dream, {name}! Pick a clue for it." |
| `dream-cards.hint-build` | Help, building | "Pick one of each, {name}: a place, a thing and a light." |
| `dream-cards.hint-clue` | Help, clue | "Your dream can be {clue}, {name}." |
| `dream-cards.reveal3-same` | `same` | "We both saw your dream, {name}!" |
| `dream-cards.reveal3-both` | `both-fit` | "I saw the {b}. You made the {a}. Both can be {clue}." |
| `dream-cards.reveal3-new` | `new-view` | "I saw the {b}. You made the {a}. That is a new way to see {clue}." |

(`{a}` is the stamp's spoken name, built from its parts as "sky lantern boat".) Slotted lines mean no new rendered clip is required. No line says right, wrong, correct or mistake. After the voice file changes, run `node scripts/content-barrels.mjs`.

## Rule tests (`logic.test.ts`, plus a layout test)

- `PART_CLUES`: nine parts of two distinct clues each, every clue invited by exactly three parts.
- `stampFits` over the 27 stamps: 24 invite four clues, 3 invite all six, none fewer than four.
- Made deals over all 27 stamps: 8,100 combinations, 1,464 valid, every stamp between 41 and 134; every valid deal satisfies the three clauses; `dealMade` returns a valid deal for every stamp and every one of 200 seeds, with three distinct pictures and three distinct clues.
- `petPoint` is one of the dealt pictures that fit the clue, is the same for the same seed, and rotates across 200 seeds (both the stamp and a decoy are pointed to).
- `revealKind` over every stamp, clue and listener-point combination never errors and returns `same` exactly when the picks match; every sequence reaches `reveal` and finish with 0 misses.
- The privacy rule: the three cards' draw state in `point` is identical whichever card is the stamp, checked by a render test (the stamp is not marked, only placed).
- `hintAction3` never returns the stamp's position; level 3 is in `LEVELS` and `describeLevel(3)` is the string above; a layout test covers the build rows, tokens and cards at every band and both orientations.

## Ghost finger, how-to card and registration

- **How-to card:** a level 3 card: a finger taps a part in each of three rows, *Done*, a clue, and the cloud falls and lifts. Level 1 and 2 cards are unchanged.
- **Ghost finger:** `autotouch()` at level 3 taps the first part in each row, *Done*, a clue twice, then *Finish*; a unit test runs 50 seeds and every one reaches `finish` with 0 misses. `fingerdemo` plays level 3 once.
- **Registration:** no new game; level 3 is added to `LEVELS`, `describeLevel`, the how-to, the voice file, `art.ts` (the nine part drawings and the stamp compositor), the game's page `docs/games/dream-cards.md` (`npm run game-docs`) and a verification entry. Story Grove stays the land; the lands test must still pass at school.

## Check tier

New levels on an existing interaction, plus a new art and build interaction, so one step above the plain tier: typecheck, the game's rule tests and layout test, one browser play of level 3 (solo: build, give a clue the stamp does not invite, the pet points, then *Swap* and point to a pet stamp, then *Finish*) with one portrait screenshot of the build screen, and `fingerdemo` at level 3. `npm run build` only if a shared file changes.

## Open decisions

1. **Union or majority for `stampFits`.** Default: union (any part invites), because a stricter "most parts agree" rule leaves two stamps with no valid deal. Revisit only if a playtest shows the pet's readings sound too loose.
2. **Keep the stamp.** Default: no. A saved dream picture would be a separate request-only line holding the three part IDs.
3. **Three decoy pool pictures or two.** Default: two decoys with her stamp, three cards in all, matching levels 1–2.
4. **A fourth slot or more parts.** Default: no. Three slots of three give 27 stamps, enough variety; more parts would multiply the art for no new idea.
5. **Whether `new-view` sounds like a correction.** Inherited from level 1's decision 3: if it does, use `both-fit`'s wording for every different pick.
