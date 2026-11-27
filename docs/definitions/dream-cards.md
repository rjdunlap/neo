# Dream Cards, level 1: One clue, three dreams (definition)

Defined 2026-11-27 as the **Dream Cards** packet of the [social-emotional study](../deep-dives/subjects/social-emotional.md#dream-cards-turn-the-existing-seed-into-a-definition), upgrading the [notebook seed](../IDEAS.md#how-the-research-lands-on-rows-already-here) the study names, from the [Dixit row](../deep-dives/subjects/social-emotional.md#sources-recognition-and-what-to-borrow) (the publisher's [play explanation](https://www.libellud.com/game/dixit/) was opened 2026-10-14; this is not a rulebook audit) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#social-emotional-play-recommendations). Level 1 is now built (see [the game page](../games/dream-cards.md)). Checked against `origin/main` at `80f4a65ff`.

**Fun action and purpose:** a friend (the pet, or a second person on the same device) looks at three dream pictures, secretly picks one and gives one pictured clue: *quiet*, *high up*, *cozy*, *floating*, *glowing* or *tiny*. She points to the picture the clue makes her think of. Then the picked picture turns over and the two of them look at it together: "I was thinking of the moon swing. You pointed to the cloud stairs. Both can be high up." The learning purpose is **one clue can mean different things to different people, and a clue is a way of sharing what you see**: giving a clue from your own picture, reading someone else's clue, and enjoying a different association rather than being told it is wrong (the study's [perspective-taking anchors](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits)). There is no right answer to point to, no score and no clock. It does not read minds, test empathy or claim a social-skills benefit.

## Overlap

| Game / mode | What it already owns | Why Dream Cards is separate |
| --- | --- | --- |
| Who Am I? (`who-am-i`) | A secret friend, clues that rule friends out, one correct friend | There the clue is a fact and one friend fits. Here a clue is an association, several pictures fit it, and pointing to any of them finishes the round |
| Photo Safari, Mystery Friend (levels 14–15) | Yes/no questions that narrow a secret animal | A questioning-and-eliminating game. Dream Cards has one clue, no elimination and no hidden right answer to reach |
| Story Steps 14, Common Ground | Two viewpoints compared inside one story; a room arranged for another's request | Narrated choices or a floor plan. Here the other person's view is a picture association, shared by revealing |
| Pet Says, Echo Friends | Copying and repeating | Interpreting, not copying |
| Animal Charades (proposed, [movement study](../deep-dives/subjects/movement-exercise.md)) and Pond Charades ([IDEAS](../IDEAS.md#candidates)) | One person acts or draws a recognisable animal or action for a guess | Acting a real thing has one right answer. A dream picture with an abstract clue has several fair readings; the two stay different games |
| Make One for Me | Making a puzzle for someone to solve | This one is a clue about a picture, not a puzzle with an answer |

No general card-deck framework is built: the first level owns its three pictures, six clues and one fit table.

## The model (`logic.ts`)

All integers and fixed tables; nothing is random except which deal is dealt.

- **The pool, original and code-drawn** (Pixi `Graphics` from `src/art/palette.ts`, no imported art and no copied cards): six dream pictures `moon swing`, `cloud stairs`, `sky whale`, `umbrella forest`, `teacup house`, `lantern boat`; six pictured clue tokens `quiet`, `high up`, `cozy`, `floating`, `glowing`, `tiny`. Each token is an icon plus its word, spoken on tap.
- **The fit table** (`FITS`): which clues a picture *invites*, three each, and every clue fits exactly three pictures (the tests check both). Moon swing: quiet, high up, glowing. Cloud stairs: high up, floating, quiet. Sky whale: floating, cozy, high up. Umbrella forest: cozy, tiny, quiet. Teacup house: cozy, tiny, glowing. Lantern boat: floating, glowing, tiny. The table is a **suggestion of what to say** for the pet and the giver's choices, never a scoring key; see "Nothing is wrong" below.
- **A deal** is 3 distinct pictures and 3 distinct clues, chosen by the seeded RNG from the 28 deals that pass the check below, in a seeded left-to-right order. A deal is valid when **every dealt clue fits at least two dealt pictures** (so pointing is a real choice among fair readings) **and every dealt picture fits at least one dealt clue** (so the giver always has a clue that suits what they picked). Of the `C(6,3) × C(6,3) = 400` deals, **28 are valid**; in 26 of them the giver has 6 (picture, clue) pairs that fit, in 2 of them 7. A test re-derives all of these counts.
- **The round:** `choose` (the giver taps one picture, then one of the three dealt clues), `cover` (a pictured blanket hides which picture was chosen, the clue stays), `point` (the listener taps a picture, or *Show me*), `reveal` (the chosen picture turns over, the two picks are compared), then *Finish* or *Swap*.
- **Any pair is allowed.** The giver may pair a clue with a picture the table does not link (the table only guides the pet and the hint). The listener may point to any of the three pictures, including one the clue does not fit. **Nothing about the choice is wrong or counted as a miss.**
- **`revealKind(giverPick, clue, listenerPick)`** is only about what is said, never a verdict: `same` (they chose the same picture), `both-fit` (different pictures, both in the clue's fit set), `new-view` (the giver's or listener's picture is not in the fit set: "That is a new way to see it"). Whatever it returns, the round is complete and warm.
- **The pet as giver (`petPick(deal, seed)`):** deterministic from the seed, picks a (picture, clue) pair from the deal's fitting pairs, rotating through them so the same picture is not always the answer.
- **`hintAction(state)`** (see accounting) moves the listener's attention, never the answer: it highlights one picture that fits the clue, and in the giver's turn the fitting clues for the picked picture.
- **Seeded appearance only:** which friend gives, the blanket's colour, the order of pictures and clues. It never changes the rules or the counts above.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 1 | *Dream clues: give one clue and read another's* | Three pictures, three clues; the pet or a second person gives a clue, she points, the picture turns over |

`school` only (about 6–8, with a grown-up as the second person): `bands: ['school']`, level 1 only. The study's "pre-K considered separately" is **not built**: it waits until a phone has shown that the privacy blanket and the six clues read for a younger child (decision 4). Later levels, each its own definition: **2, two clues for one picture** (defined 2026-11-27: [definition](dream-cards-two-clues.md); the giver gives a second clue after the first reading), **3, make your own dream picture** (defined 2026-11-27: [definition](dream-cards-own-picture.md); build a stamp from three parts) and a grown-up couch mode. None is built or reserved beyond the next free stable IDs.

### First round

Solo, the pet gives. The pet picks the lantern boat and says "floating"; the three dealt pictures are the lantern boat, the sky whale and the umbrella forest. She points to the sky whale. The boat turns over: "I was thinking of the lantern boat. You saw the sky whale. Both can be floating." She taps *Finish*, or *Swap* to give a clue herself.

## Screen, controls and the privacy blanket (`layout.ts`, `art.ts`)

Played upright and landscape; the layout reads `view` in `resize()`.

- **The pictures:** three cards in a row (portrait: a column or a 3-up row, whichever keeps each card at least 100 units), each a 100-unit target with a 10-unit gap. A card tap uses `onTap`. The card art is drawn at the card's size from the picture's pool entry.
- **The clue tokens:** three tokens above or beside the cards, each at least 100 units, with an icon and its word. A tap says it; in the giver's turn a second tap on the same token confirms the choice, so a first tap is exploration.
- **The blanket:** after the giver confirms, a pictured blanket (a cloud, drawn over the three cards) slides down and covers only the *cards*, not the clue. The giver's choice is **never drawn on a card**: it exists only in state, so a replay of the frame, a screenshot or the tutorial cannot show it. A single large *Pass it* button under the blanket (shown only in two-person play) lifts it when the listener taps it. In solo play the blanket lifts by itself after a short fixed delay owned by the scene.
- **The listener's turn:** the clue token is shown big and says its word again on tap. The three pictures are tappable; the first tap on a picture **selects** it and a *This one* button points, so a first tap is never final. *Show me* sits beside it: it reveals without pointing, no miss.
- **The reveal:** the chosen picture's card flips; both picks get a coloured ring (giver and listener, each with a pictured avatar, the pet or a person icon) and a line plays by `revealKind`. If both rings are on the same card, one ring is drawn double.
- **Finish / Swap:** two large buttons. *Swap* runs one more pick and reveal with the roles swapped (once only; the second round ends with *Finish* alone). Home, Back and Help are the shell's. The pet is the corner guide, away from the cards in both orientations.
- **Seats:** a pictured chooser at the start, *Me and the pet* (default) or *Two of us*, always allows solo play. A second person gets no profile credit or seat record here, following the [family-role decisions](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer); the same device is passed back and forth.
- Nothing is read for navigation; the pictures, tokens and voice carry the round.

## Accounting, help and finishing

- **No misses.** No choice, pointing or reveal is a miss, because nothing is wrong. `ctx.finish({ misses: 0, hints })` always reports 0 misses.
- **Hints:** Help plays `hintAction`: in the listener's turn, a soft glow on one picture that fits the clue ("this one can be floating, and so can another"); in the giver's turn, a glow on a fitting clue for the picked picture. Using Help counts as a hint, and it never says which picture was chosen.
- **Supported ending:** *Show me* in the listener's turn and the pet taking either role are always available. The pet's pick is not used as a hidden answer; it is the first fair one. The round still gives its one sticker, supported rather than independent, as everywhere ([AGENTS](../../AGENTS.md#adding-or-extending-a-minigame)).
- **Adaptation:** one level only, so `difficulty.ts` has nothing to step; hints are still recorded.
- **Finish:** after the reveal's line the voice says the finishing line and the shell awards the sticker. The game saves no cards, no picks and no creation, keeps no record of who gave what, and draws no celebration of its own. Nothing is scored, ranked or compared across rounds.
- **What is not claimed:** no card says what a child is "thinking" or "feeling"; no line tells a child their association is wrong; there is no personal disclosure, no speech recognition and no typing.

## Speech (`voice.ts`)

`{name}` is her name; `{a}` and `{b}` are picture names and `{clue}` is a clue word, so every line carries a slot and stays on device speech (CI requires a rendered clip for each slot-free line). The building session reads each line against the study's [source check](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits): the giver only says what the picture reminds them of, never what the listener should feel.

| Key | When | Line (slotted) |
| --- | --- | --- |
| `dreams.ask-give` (instructed) | giver's turn | "{name}, pick a dream, then pick a clue about it." |
| `dreams.ask-point` (instructed) | listener's turn | "Which picture does {clue} make you think of?" |
| `dreams.cover` | the blanket falls | "Shh, {name}. The dream is hiding." |
| `dreams.pass` | two-person pass | "Pass it to your friend, {name}." |
| `dreams.pet-clue` | the pet gives | "I'm thinking of something {clue}." |
| `dreams.reveal-same` | `same` | "We both saw the {a}, {name}!" |
| `dreams.reveal-both` | `both-fit` | "I saw the {a}. You saw the {b}. Both can be {clue}." |
| `dreams.reveal-new` | `new-view` | "I saw the {a}. You saw the {b}. That is a new way to see {clue}." |
| `dreams.show-me` | *Show me* | "Here it is, {name}. It was the {a}." |
| `dreams.hint-point` | Help, listener | "The {a} can be {clue}. So can another one." |
| `dreams.hint-give` | Help, giver | "The {a} can be {clue}, {name}." |
| `dreams.swap` | *Swap* | "Your turn to give a clue, {name}." |
| `dreams.finish` | finishing | "What a lot of ways to see one clue, {name}!" |

Picture and clue names are spoken from the pool entries. No line says right, wrong, correct or mistake.

## Rule tests (`logic.test.ts`)

- The fit table: every picture fits exactly 3 clues, every clue exactly 3 pictures, and the six picture names and six clue names are distinct.
- The 28 valid deals out of 400: all the stated properties hold; 26 have 6 fitting pairs, 2 have 7; no deal has a dealt clue that fits fewer than two dealt pictures.
- Over 200 seeds: a deal is always valid, the three pictures and three clues are distinct, and every seed's pet pick is one of the deal's fitting pairs and rotates across seeds.
- `revealKind` is total over all `3 × 3 × 3 = 27` giver-pick, clue and listener-pick combinations of any dealt round, never errors, and returns `same` exactly when the picks match.
- Whatever the giver picks and the listener points to, the round reaches `reveal` and `finish`; there is no state with a miss, and `hintAction` never returns the chosen picture.
- The privacy rule: the state a renderer reads before `point` does not include the giver's pick (the pick lives in a field the card draw never reads), checked by a render test that draws all cards in `cover` and in `point` and asserts they are identical to a fresh deal.
- A layout test at every band and both orientations: every card and token at least 100 units, the pet and buttons clear of the cards.

## Ghost finger, how-to card and registration

- **How-to card:** a short card in `howto.ts`, level 1: a finger taps a picture and a clue, the blanket falls, then a finger points to a picture and the chosen one turns over.
- **Ghost finger:** `autotouch()` plays a listener turn: it taps a picture, then *This one*, then *Finish*; a unit test runs 50 seeds and every one reaches `finish` with 0 misses. `fingerdemo` plays level 1 once.
- **Registration:** a new `GameModule` `dream-cards`: grown-up name *Dream Cards*, spoken title "Dream clues", `challenge` set, skills `perspective`, `vocabulary` and `listening` (add only if not already in the skills list), `bands: ['school']`, level 1 only, a quiet `STYLES` entry, hub icon and sticker art (the picture that was chosen, drawn from its pool entry and pinned to the pool index so a sticker keeps its picture), a co-play suggestion (a grown-up gives a clue about a picture in a real book and the child points) and an off-screen suggestion (describe a cloud with one word, then compare). **Land: Story Grove** (it already lists `thought-bubbles`, `playdate-workshop` and `common-ground`), with Painted Canyon as the fallback if the lands test reports the page full at school. Run `node scripts/content-barrels.mjs` after writing `voice.ts` and `howto.ts`.
- Expected files: `src/games/dream-cards/` (`index.ts`, `logic.ts`, `logic.test.ts`, `art.ts`, `layout.ts`, `howto.ts`, `voice.ts`), `src/content/lands.ts`, `docs/games/dream-cards.md` (`npm run game-docs`), the README tables, `docs/GAMES.md`, the social-emotional study and a verification entry.

## Check tier

New game: typecheck, unit tests, **one** filtered scripted play (level 1: a solo round where she points to a picture the clue does not fit, then *Swap* and give a clue, then *Finish*), one portrait screenshot, then `fingerdemo` at level 1. `npm run build` because the lands and registry files change. Whether a 6–8-year-old finds the blanket and the passing clear, and whether the reveal lines read as warm rather than as a score, stay person checks on a phone, not gates.

## Open decisions

1. **Registration.** Default: a new game `dream-cards`, school only. The alternative (a mode of Story Theater) was rejected: the action is interpreting a picture, not choosing a story step.
2. **Land.** Default: Story Grove, Painted Canyon as the lands-test fallback.
3. **The fit table in the reveal.** Default: `both-fit` and `new-view` change only the line. If a phone playtest shows `new-view` sounds like a correction, drop it and use `both-fit`'s wording for every different pick; the rule tests do not change.
4. **Pre-K.** Default: none until the blanket and six clues have been seen on a phone.
5. **A larger pool.** Default: six pictures. Eight pictures and eight clues would raise the valid deals well past 28; do it only if play shows the deals repeat too soon.
6. **Seat credit.** Default: none, per the family-role decisions; the second person is the same profile's helper.
