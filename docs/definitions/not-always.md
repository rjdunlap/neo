# Not Always, levels 1–3 (definition)

Defined 2026-10-31 as slice 1 (PR1) of the [philosophy and reasoning study](../deep-dives/subjects/philosophy-reasoning.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/philosophy-reasoning.md#a-first-games-ladder-not-always) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#philosophy-and-reasoning-recommendations). The study's seven decisions were adopted on its leans under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/philosophy-reasoning.md#decisions-for-the-developer)). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-11-01** (levels 1–3, batch `not-always 1`; see the built notes at the end) as one same-game batch, `not-always 1` (levels 1–3, new-game tier). Registration, bands and land take the defaults below under standing rule S8; the spoken lines are plain descriptions of the cards on screen and need no outside source check (S1 has nothing to check: no real-world claim is made, decision 4). It depends on no other unbuilt game.

**Fun action and purpose:** a creature friend stands on a little crate above a row of picture cards and announces, very sure of itself, "All of these have hats!" She taps the one card that breaks it; the card flips up, the friend gasps and laughs at itself, and the sign above the crate changes from *all* to *not all*. Later she checks a whole row and stamps *Every one!* when nothing breaks the claim, then picks the claim the friend could have said instead that is true of every card. The learning purpose is **testing a general claim against cases: one counterexample is enough to show "all" is wrong, and "every one" is shown only by checking every one** (Common Core MP3, "constructing arguments… using concrete referents such as objects, drawings"; counterexamples; SL.K.3, asking and answering about what a speaker says, as read in the [study's anchors](../deep-dives/subjects/philosophy-reasoning.md#anchors-opened-at-their-source)). Every claim is about the cards on screen and nothing else. The how-to card claims no reading, attainment or attention benefit (the study found the 2021 EEF trial showed no reading gain).

## Identity and overlap

Rechecked 2026-10-31 against the catalog, the open definitions and `git log origin/main`:

- **Critter Sort** level 4 (*guess*) has a witness: after a wrong rule pick, `sort.notguess.*` hops a critter that shows the rule is wrong. There the **game** finds the counterexample to **her** rule, as feedback. Here a **speaker** makes a claim, she finds the counterexample, and she judges and mends the claim; nobody sorts. Critter Sort's attributes are keyed on the animal kind (`brown` means bear or dog), so its rules are partly "which animal"; Not Always builds every card from independent spec parts, so no claim can be answered by naming an animal.
- **Who Am I?** (Barnyard, built) narrows a gallery by clues to the one friend they fit. Here no card is the hidden answer; the question is whether a sentence about all the cards is true.
- **Rule Machine** ([definition](rule-machine.md), queued) chooses a rule from an in/out table; **Forecast Detective** ([definition](forecast-detective.md), queued) owns *Can't tell yet*. Not Always has no *Can't tell yet*: in a closed row of visible cards every claim is decided.
- **Sorting Machine** and **Rhyme Time**'s odd one out ask which item differs. Not Always is built so that the odd-one-out habit does **not** answer it (the decoy rule below): the spoken claim decides which card breaks it.

## The model (`logic.ts`)

- **Attributes** (`Attr`), each a picture on the card and a word in speech: `'red' | 'blue' | 'yellow'` (body colour; exactly one per card), `'hat'`, `'wings'`, `'spots'` (each present or absent). No other part of the card ever varies, so no claim can be answered by kind, size or position.
- **A card** is `{ color: 'red' | 'blue' | 'yellow', hat: boolean, wings: boolean, spots: boolean }`. `holds(card, attr)` is true when the card shows that attribute. No two cards in one row are identical.
- **A claim** is `{ q: 'every' | 'none', attr: Attr }`. `breakers(row, claim)` are the cards that show it is false: for `every`, the cards where `holds` is false; for `none`, the cards where it is true. `isTrue(row, claim)` is `breakers(...).length === 0`. **No other quantifier exists:** no *some*, *most*, *not all* or *only* claim is ever offered as an answer (*not all* appears only as the sign's change after she breaks a claim). Conditionals (*every red one…*) are level 4, not this batch.
- **The decoy rule** (levels 1–2, the study's person check made a property): for every false claim, at least one card that is **not** a breaker is the only card in the row that differs from the rest on some other attribute. So "tap the one that looks different" picks a wrong card at least as easily as the right one, and only the spoken claim decides.
- **Level 1 round:** four cards and three `every` claims, each with **exactly one** breaker, the three breakers being three different cards. The first round is authored:

  | Card | Colour | Hat | Wings | Spots |
  | --- | --- | --- | --- | --- |
  | A | red | yes | no | no |
  | B | red | yes | yes | no |
  | C | red | no | yes | no |
  | D | blue | yes | yes | no |

  Claims in order: "All of these have hats!" (C), "All of these are red!" (D), "All of these have wings!" (A). Each claim's decoys are the other two cards that are odd on another attribute.
- **Level 2 round:** five cards and three `every` claims; **one or two** are true (never none, never all three), seeded, in any position. A false claim has one or two breakers, and **either breaker is right**: one is enough. The first round is authored by the building session to the same conditions, with its true claim second.
- **Level 3 round:** four cards and two claims. Each starts as a false `every` claim with exactly one breaker (the level 1 stage). After the break, three **mended claims** appear: exactly one is true of every card, and each false one has at least one named breaker. The three are built as: the true one (an `every` on an attribute all four share, or a `none` on an attribute none of them shows); the `none` claim on the attribute just broken (false, since three cards show it); and an `every` claim on a third attribute with at least one breaker. They are shuffled. Every mended option is a universal claim about pictured parts, never an ability ("can fly" is not used) and never *not all* (true but trivial after the break).
- `glowFor(row, claim)` (the hint target): the first breaker in left-to-right order, or the stamp when the claim is true; for a mend, the true option.

## Levels

| Level | Name | Bands | Cards | What she does |
| --- | --- | --- | --- | --- |
| 1 | *Not all of them* | pre-K 1, school 1 | 4 | Tap the card that breaks each of three claims |
| 2 | *Every one?* | pre-K 2, school 2 | 5 | Tap a breaker, or stamp *Every one!* when nothing breaks it |
| 3 | *Say it better* | school 3 | 4 | Break the claim, then pick the mended claim true of every card |

`BandLevels`: `prek: { min: 1, max: 2 }`, `school: { min: 1, max: 3 }`. No preschool range: the study's "preschool by pin" means a grown-up may open it from the signpost, where `playBand` plays it at pre-K level 1. No `order`. A round is one row (one sticker); seeded rows after the authored first round.

## Screen and controls

- **The friend** is a `Critter` from `CRITTERS` (rotating per round among cat, bear, dog, bunny and pig, never recoloured), standing on a code-drawn wooden crate, about 0.7 scale. Tapping the friend or the sign repeats the claim, free (decision 6).
- **The sign** above the crate is a **pictogram**, never words: a quantifier mark beside an attribute picture. *Every*: a curved hand sweeping over three little dots. *None*: the three dots each crossed. *Not all* (after a break): the sweeping hand with one dot popped out and circled. Attribute pictures: a hat, a wing, a spotted blob, a colour blob outlined in ink (colour is the attribute itself, and red, blue and yellow are told apart by name and lightness, never red against green).
- **Cards** are cream rounded tiles, **150 × 180**, each a `Critter` built from one base spec (`{ ears: 'round', snout: 'nose', noseColor: ink, belly: true }`) with `color`, `spots` and `wings` set from the card and the hat attached; scale about **0.45**, `alive = false` except the nod. At that scale the body colour, a hat, wings and spots are the four parts judged legible; the building session confirms this from its portrait screenshot and drops `wings` from the vocabulary (tests and voice with it) if the wing does not read on the base body. Whiskers, nose colour, belly and horns are not used (too thin at 0.45).
- **The hat** is Critter Sort's `hatArt()`, moved from `src/games/critter-sort/index.ts` into `src/art/props.ts` as a shared export (Critter Sort imports it from there; its look is unchanged). That is the only shared-file change.
- **The stamp** (level 2) is a 130 × 130 wooden rubber stamp to the right of the row (landscape) or centred under it (portrait), its face showing the *every* pictogram with a tick. Stamping prints a big *Every one!* mark across the sign.
- **Mended claims** (level 3) are three pictogram signs, 220 × 120, in one row under the cards; tapping one chooses it.
- **Touch-down feedback:** a card lifts and the friend leans to look at once; the stamp presses down.
- **Layout** (`notAlwaysLayout(view, level)` in `logic.ts`, from `view`, never `window`): landscape (1024 × 768) puts the friend and sign top centre, the row of four or five cards across the middle (5 × 150 + 4 × 16 = 814) and the stamp or mended signs below or beside it. Portrait (768 × 1024) puts four cards in one row (4 × 150 + 3 × 16 = 648) and **five in two rows** (three over two), the stamp centred under them, and the three mended signs in one row (3 × 220 + 2 × 16 = 692). Home top-left and the pet's bottom-left corner stay clear; every target is at least 100 on screen at all four standard views.

## Accounting, help and finishing

- **Free, never a miss:** tapping the friend or the sign; tapping a card already flipped as this claim's breaker; at level 3, card taps while the mended signs are up (they do nothing). The friend reads the three mended signs aloud as they appear and again on a tap of the friend; a tap on a sign chooses it.
- **Counted:** at levels 1–3, tapping a card that fits the claim (the card nods and shows the part: "This one has a hat"); at level 2, stamping a false claim ("Look again") and tapping a card when the claim is true (the card nods, "This one has a hat too"); at level 3, choosing a false mended claim (the friend points to its breaker: "But this one is blue"). Each is one miss and a gentle `boing`.
- **Two misses on the same claim or mend** glow its target (`glowFor`); the shell counts **one hint**, once per claim or mend. **Show a hint** (`askForHint`, `hintLabel = 'Show me'`) glows the same target and counts one hint.
- **Assisted ending:** every claim ends through her tap, after the glow if needed; finishing with help earns the ordinary one sticker.
- **Finishing:** after the last claim of the round (and at level 3 its mend), `ctx.finish({ misses, hints })`, once.
- **Adaptation:** two smooth rounds step up, two struggling rounds step down, as standard. Because of the decoy rule a smooth round is some evidence she used the claim; the how-to card says that with the friend's spoken claim it is not evidence she reasons without it.
- **The talk moment is not in this batch** (decision 3): an *Is it fair?* or *What if?* question has no natural place in a row of cards, and the study's PR3 question card and PR4 co-play role carry that conversation. Values are never scored when a later level adds one.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Lines are slot-free per attribute so the Kokoro renderer can cover them; `{attr}` below means one line per attribute (6 attributes).

- `notalways.instruct.1`: "Is the friend right? Tap the one that shows it isn't so." `notalways.instruct.2`: "Is it true for every one? Tap one that breaks it, or stamp Every one!" `notalways.instruct.3`: "Find the one that breaks it. Then choose what the friend could say instead."
- Claims (12): `notalways.every.{attr}`: "All of these have hats!", "All of these have wings!", "All of these have spots!", "All of these are red!" (blue, yellow); `notalways.none.{attr}`: "None of these have hats!" … "None of these are red!".
- Fits (6): `notalways.fits.{attr}`: "This one has a hat." / "This one is red." Breaks (6): `notalways.breaks.{attr}`: "This one has no hat! Not all of them!" / "This one isn't red! Not all of them!" Mend misses use the breaks line for the option's breaker.
- Friend: `notalways.oops` (3 variants): "Oh! I said that too fast!", "You found one!", "Not all of them. Good looking!" `notalways.every`: "Every one! You checked them all." `notalways.again`: "Look again. Is there one that isn't?" `notalways.mend.right`: "Yes, that's true of every one."
- No line says *wrong*, *silly* or *liar*; the friend is never sad or embarrassed. No line claims anything about the world outside the cards.

## Rule tests (`logic.test.ts`)

1. **Authored rounds:** level 1's table above, claim for claim and breaker for breaker; level 2's authored round meets its conditions.
2. **Level 1 rows** (300 seeds): four distinct cards, three `every` claims each with exactly one breaker, three different breakers; the same seed gives the same round.
3. **Level 2 rows** (300 seeds): five distinct cards, one or two true claims, both counts and every true position occurring across seeds; every false claim has one or two breakers; the stamp is right exactly when `breakers` is empty.
4. **Decoy rule:** for every false claim at levels 1–2, some non-breaker is uniquely odd on another attribute.
5. **Level 3 mends** (300 seeds): exactly one of three options is true; each false option has a breaker; no option is *not all*, *some* or an ability; the broken attribute's `none` is always among them.
6. **Accounting:** fitting cards, false stamps, card taps on true claims and false mends count one miss each; friend, sign and repeat taps count nothing; two misses give exactly one glow hint per claim or mend; misses never block the right answer.
7. **Hints lead somewhere:** `glowFor` is a breaker, the stamp exactly when the claim is true, and the true mend.
8. **Layout:** `notAlwaysLayout` at four views for each level, every target at least 100 and inside the view, the pet corner clear.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the row and claim from the scene and taps `glowFor` (the first breaker or the stamp), then at level 3 the true mended sign. `fingerdemo` runs at levels 2 and 3.
- **How-to card** (`src/content/howto.ts`). Goal: "Test the friend's claim about the cards: find the one card that shows it is not so, or check them all."
  - Steps: "The friend says something about all the cards; tap the friend to hear it again" (all levels); "Tap the card that breaks the claim" `{ from: 1, to: 1 }`; "Tap a card that breaks it, or press the stamp if it is true of every card" `{ from: 2, to: 2 }`; "After breaking the claim, choose the sign that is true of every card" `{ from: 3, to: 3 }`.
  - Finish: "The round ends after the friend's last claim" (all levels).
  - Notes: "One card is enough to show *all* is wrong" (all levels); "If a claim has two cards that break it, either is right" `{ from: 2, to: 2 }`; "Every claim is about the cards on screen only" (all levels); "Rounds without hints move her up, which means she tested claims with the friend's spoken help, not that she reasons this way on her own" (all levels).
- **Registration (default under S8):** ID `not-always`, name "Not Always", spoken title `game.not-always` ("Not always"). Region (subject) `story-grove`. Skills `['reasoning', 'claims', 'counterexamples', 'listening']` (free strings). Home land **Story Grove** (16 games on `main`; `LAND_SPOTS` is 13, so it already pages and Not Always joins its second page), fallback **Puzzle Peaks** (13 today, Rule Machine queued as its 14th); `lands.test.ts` decides at build time. Hub icon: a crate with a sign showing the *all* hand and a hat. Sticker: the friend on its crate holding up a flipped card.
- **Art:** code-drawn in `src/games/not-always/art.ts` with `src/art/palette.ts`: the table, crate, sign pictograms, card tiles, stamp and mark. Cards and friend reuse `Critter`; the hat comes from `src/art/props.ts` as above. No imported art or audio.
- **Co-play** (`coplayHint`, the study's PR4 role in its simplest form): "Take turns being the friend: one of you says something about all the cards, like 'all of these have hats', and the other finds the one that isn't." **Off-screen:** "Line up some toys and say something about all of them, like 'all of these are soft'. Can she find one that isn't?" The printed claim strips stay PR4's.
- **Couch:** none. **Journal:** nothing filed (decision 7). **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The cards could later show her collected creatures by attribute, as the [rework brief](../rework/README.md) decides.

## Check tier

**Batch `not-always 1` (levels 1–3), new-game tier:** typecheck and unit tests (tests 1–8 plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 with one fitting card (a miss), a second fitting card for the glow, then the breaker; level 2 with a false stamp, then a true claim stamped; level 3 with one false mend, then the true one; one portrait screenshot at level 2 (two rows and the stamp); `fingerdemo` at levels 2 and 3; `npm run build`, because the registry, lands, voice, how-to and `src/art/props.ts` change. If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

Person and device checks stay open (DEVICE-CHECKS once built): whether a four-year-old finds the breaker from the spoken claim or taps the odd one out (watch the decoys and the *Every one!* rounds); whether the sign's pictograms read without words; whether the wing is clear at card size on an iPad. Browser automation establishes none of these.

## What comes next

**PR3** the question card (grown-ups' page) and **PR4** the printed claim strips follow the build; **PR2** Not Always 4–6 (only the red ones count, show me why, both can be true) is defined after levels 1–3 are played.

## Open decisions

Each has a default the build uses; none waits on the developer (S8).

1. **Register Not Always as a new game,** pre-K 1–2 and school 1–3, home Story Grove, fallback Puzzle Peaks (study decisions 1–2).
2. **Card taps are answers** (decision 6): the friend and the sign repeat the claim for free; a card tap is never a free look.
3. **The decoy rule.** Default: every false claim at levels 1–2 has a non-breaker that is the odd one out on another attribute. Alternative: plain odd-one-out rows for pre-K; not chosen, because then the round could be finished without listening to the claim.
4. **No talk moment in 1–3.** Default: deferred to PR3 and PR4. Alternative: one skippable *What if?* per round; not chosen, because it has nothing to ask about a row of cards.
5. **Four attributes.** Default: colour, hat, wings, spots, with wings dropped if illegible at 0.45. Alternative: ears or horns; not chosen, as too small at card scale.

## Built notes (2026-11-01)

Deviations from this definition:

- **Decoy rule.** It holds at level 1 and in level 2's one-true rows only. With two true claims, five distinct cards differ on just two dimensions and no card can be another's odd one out, so two-true rows relax it (open decision 3).
- **Wings.** Critter's own wings did not read at card scale, so a custom white feathered wing pair (`wingsArt` in `art.ts`) draws them; wings stay in the vocabulary.
- **Stamp.** It sits centred under the row in both orientations.
- **Extra voice lines:** `notalways.too.*`, `notalways.mends`, `notalways.hint`, `notalways.done`.
- **How-to note.** One level-scoped line per level (the card type shows one note per level).
- **Shared change.** Critter Sort's `hatArt` moved to `src/art/props.ts`; Critter Sort and Critter Crossing import it and look unchanged. New title clip `game.not-always` rendered.
