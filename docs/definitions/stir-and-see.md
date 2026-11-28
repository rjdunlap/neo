# Stir and See, levels 1–5 (definition)

Defined 2026-11-27 as slice 6 of the [matter study](../deep-dives/subjects/matter.md#build-slices-in-order), from its [candidate row](../deep-dives/subjects/matter.md#candidates-and-recommended-order) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#matter-recommendations). It reuses [Melt and Freeze](melt-and-freeze.md)'s frozen substance record (`id`, authored forms, no simulation) and its unscored prediction pattern ([levels 6–7](melt-and-freeze-predictions.md)). *Stir and See* is a working name and `stir-see` a working ID. **Nothing is built.** Levels 1–5 use only pretend powders, a leaf and a drop of oil in a cup of plain water, so no science reviewer gates them; level 6 (how many spoons) waits on one ([decision 2](#open-decisions)). No chemical reaction is shown anywhere.

**Fun action and purpose.** A clear cup of water and a spoon. She taps the spoon and it dips a heap of something into the cup and stirs: some things **vanish** into the water (sugar, salt), some **sink to the bottom and stay** (sand, a pebble), some **float on top** (a leaf, a drop of oil). The learning purpose is **different things do different things in water: some mix in and disappear, some settle, some float** (the study's anchors: NGSS 2-PS1-1 for observed properties of materials, with 5-PS1-1 and 5-PS1-2, mixtures and conserved matter, the later horizon). It adds one outcome to what the island already has: floating and sinking belong to Sink or Float ([levels 1–10](../games/sink-float.md)); **vanishing into the water, and "it is still in there", is new**.

## Identity and overlap

- **Sink or Float** (Bubble Beach) drops whole things in a tank and asks sink or float, plus salty against fresh water (its level 10). Stir and See never drops a whole object to test its density, never uses salt water to hold things up, and never asks "will it float" as its question; the cup question is the three-way *vanish, settle or float* after stirring in a powder or a bit of something.
- **Melt and Freeze** owns warming and cooling. There is no sun, snowflake, hot water or heat here, so a dissolve is never explained by melting. Sugar is never shown "melting" and the voice never says it.
- **Color Garden** owns colour mixing. No dye, paint or food colour goes in the cup, and nothing turns the water a new colour.
- **Weigh It** (a later Seesaw Balance mode) owns "the jar weighs the same". Stir and See shows "it is still in there" through the cup alone ([the model](#the-model-logicts)), never a scale.

## The model (`logic.ts`)

The outcome table is authored, not simulated, so every result can be tested.

- **Material:** `{ id, outcome, word }` with `outcome` one of `vanish`, `settle`, `float`. One spoon of one material goes into one cup of plain water.
- **Stir:** `stir(cup, material)` returns the cup after a spoon is stirred in: a `vanish` material leaves a faint **shimmer** (below) and nothing else, a `settle` material becomes a heap on the bottom (a second spoon makes the heap bigger, never smaller), a `float` material stays on the surface (a leaf rides on top; the oil draws one gold drop that spreads into a thin gold disc and stays in one piece). The cup keeps its water level whatever goes in, so "the water is still there" needs no volume rule.
- **Identity ("it is still in there"):** a vanished material leaves a **faint shimmer** in the cup, drawn as the material's own colour at low opacity with a few slowly fading sparkles. It is a drawn evidence mark, not a claim about taste, and it never fades to nothing. Tapping the cup makes the shimmer pulse and the voice says "Still in there!" so a vanish is never seen as a thing that is gone from the world.
- **Pool (levels 1–5):**

| id | Outcome | Drawn as | Used at levels |
| --- | --- | --- | --- |
| `sugar` | vanish | white heap on the spoon, white shimmer | 1, 2, 3, 4, 5 |
| `salt` | vanish | grey-blue heap, pale shimmer | 3, 4, 5 |
| `sand` | settle | yellow heap, falls as grains to the bottom | 1, 2, 3, 4, 5 |
| `pebble` | settle | a small grey pebble that drops to the bottom | 3, 4, 5 |
| `leaf` | float | a green leaf riding on top | 2, 3, 4, 5 |
| `oil` | float | a gold drop that stays on top in one piece | 3, 4, 5 |

Rice, flour, cocoa, glitter, tea and anything coloured are out: flour and cocoa go cloudy before they settle, and a clear three-way table needs materials a child sees clearly doing one thing. Nothing here is food or a drink, and the voice never says "taste", "eat", "drink" or "sweet".

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Stir it** | toddler, preschool | Nothing; she stirs | One cup, sugar then sand |
| 2 | **Three spoons** | toddler, preschool | Nothing; she stirs | Sugar, sand and a leaf in turn |
| 3 | **Which one disappears?** | preschool, pre-K | One of three cups | Three questions |
| 4 | **What will it do?** | pre-K, school | A picture card, then stir | Four materials, unscored |
| 5 | **Sort the cups** | school | One of three trays | Six cups, tested before filing |

**Bands.** `toddler` 1–2, `preschool` 1–4, `prek` 3–4, `school` 4–5. `lap` is not claimed: a stirred cup has no obvious one-year-old action and that is a design bet, not evidence. `playBand` handles any other band. *Level 6, **How many spoons?*** (a saturation count) is **not defined here**: it needs a reviewed number table and waits on [decision 2](#open-decisions); IDs from 6 are reserved for it and later rungs, and no saved level is renumbered.

### Rounds (authored first round, then seeded from the pool)

- **Level 1:** the authored round is sugar, then sand. She taps the big spoon; it dips, stirs and the cup shows what happened. The round ends after both. A third or fourth stir of the same powder is free play (the heap grows). After a long idle pause the pet taps the spoon as a ghost and the round finishes ("supported finish", nothing counted).
- **Level 2:** three spoons in turn, `sugar`, `sand`, `leaf`, one of each outcome in the authored first round, then seeded: always one `vanish`, one `settle` and one `float`. The voice names what happens: "The sugar vanishes!", "The sand sinks and stays.", "The leaf floats on top."
- **Level 3:** three cups already stirred, side by side, each with a different material in it, and the question card pictures the thing to find: "Which cup has the sugar in it? Tap it." Quantities are never involved. A round is three questions, one for each outcome in the authored first round (the question asks for the cup where the material **vanished**, the one where it **settled**, then the one where it **floated**), then seeded with the first two rounds' structure kept. The cups are cloudy-free: a vanish cup looks like clear water with a faint shimmer, which is the point; she finds it by elimination from the heap and the floater. A wrong cup is one miss (see [accounting](#accounting-help-and-finishing)).
- **Level 4:** one cup of clear water, a spoon and a material beside it. She taps one of three picture cards, *it vanishes*, *it sinks and stays* or *it floats*, drawn as pictures, then taps the spoon and sees. **Nothing is scored:** "Just like you thought!" follows a match and "Surprise! Now we know." a mismatch, both warm. A round is four materials, one of each outcome plus one repeat, the authored first being `salt`, `pebble`, `leaf`, `sugar`. The spoon stays dim until she has guessed.
- **Level 5:** six already-stirred cups arrive one at a time and she files each into one of three trays by tapping: *vanished*, *sank*, *floated*, each keeping small pictures of what was filed. The cup is **tested first** by a free "tap the cup" that shows what it holds (a tap on the cup makes the shimmer or the heap or the floater glow); filing before testing is allowed and judged. The authored round is salt, pebble, oil, sand, sugar, leaf.

## Screen and controls

- **Spoon and cards:** the spoon and the picture cards are at least **120 logical units**, bottom row; upright the spoon stands alone, centred, with the cards above it. Touch-down brightens at once and starts the sound.
- **The cup:** a tall clear cup in the middle, at least 220 units wide, with the water drawn and a bowl of the material beside it; at level 3 three cups of at least 150 units; at level 5 one cup and three trays of at least 150 units.
- **Stir animation:** the spoon dips, circles about 1 s, and the result settles over another 0.6 s (a vanish fades its heap to the shimmer, a settle falls to the bottom, a float rides up and rocks once). Sounds are pentatonic steps from `src/audio/notes.ts`: a soft glug and a rising chime for a vanish, a low thud for a settle, a bubble pop for a float. All timing uses `ctx.tw`, cut cleanly on destroy.
- **Layout:** `cupLayout(view, mode)` audited in the four views the lands test uses with the bottom-left pet, home button and corner buttons clear; a target never shrinks below its minimum (level 3's cups drop to a row of three in landscape and stack two plus one upright, only if three do not fit side by side).
- **Pause sheet:** Start again and Show a hint (`Scene.pauseActions()`), ignored while a stir animates. **Music:** the island's loop.

## Accounting, help and finishing

- **Never a miss:** every tap at levels 1, 2 and 4 (a prediction is not an answer), a repeated stir, a tap on the cup.
- **Level 3:** a wrong cup is one miss, counted once per question per cup; the cup shows its own contents so she sees why. After one miss a short line ("Look for the cup with just a shimmer."); after two the right cup glows and `hints++` once per question; Show a hint does the same, still once per question. A third miss is a supported finish: the pet taps the right cup. Assisted completion is not mastery evidence.
- **Level 5:** a wrong tray is one miss; the cup hops back with a boing and a clue. The right tray glows from the second miss (one hint per cup); the third is a supported finish.
- **Finish:** `ctx.finish({ misses, hints })`; one ordinary sticker, with or without help. Levels 1, 2 and 4 always count 0 and 0, so a smooth round steps up on its own and the game never steps down from them.
- **Discoveries:** one **journal entry per outcome she actually saw**: `stir-see:vanishes` ("Things that vanish: sugar, salt"), `stir-see:settles`, `stir-see:floats`, and `stir-see:still-there` only if she tapped a vanished cup and saw the shimmer. Entries and spoken lines live in `src/content/journal.ts` with a test against the table. A creation is not kept.

## Speech (`voice-script.ts`)

Lines under `stirsee.*`: `intro`, `instruct.stir` ("Tap the spoon. Stir it in!"), `instruct.find` ("Which cup has the {thing} in it?"), `instruct.guess` ("What will the {thing} do?"), `instruct.sort`, `vanish` ("It vanishes!"), `settle` ("It sinks to the bottom and stays."), `float` ("It floats on top."), `still` ("Still in there!"), `hint.vanish` ("Look for the cup with just a shimmer."), `hint.settle`, `hint.float`, `match` ("Just like you thought!"), `surprise` ("Surprise! Now we know."), `done`. The words **react**, **reaction**, **chemical**, **melt**, **taste**, **eat**, **drink**, **sweet**, **fizz** and **dissolve** are not spoken at levels 1–5; "vanishes into the water" is the word for vanishing, with "dissolves" named at level 6 once its science is reviewed. A test checks the forbidden words.

## Rule tests (`logic.test.ts`)

- **Table:** every material's outcome and drawing are authored, ids unique and stable, `sugar` and `salt` are `vanish`, `sand` and `pebble` `settle`, `leaf` and `oil` `float`.
- **Stir:** a vanish adds no heap and no floater and keeps its shimmer; a settle only ever grows the heap; a float stays one piece on the surface; the water level never changes; the same material always gives the same outcome.
- **Rounds:** level 1 is sugar then sand; level 2 draws one of each outcome with the authored first; level 3 asks for each outcome once in the authored first round, every question solvable by exactly one cup and its distractors different outcomes; level 4 holds one of each outcome plus a repeat; level 5's six cups show every outcome twice.
- **Accounting:** a scripted level-3 question (right cup: no miss; wrong cup: one miss; the same wrong cup again: no more; Show a hint twice: one hint; a third wrong cup: supported finish) counts the stated misses and hints; levels 1, 2 and 4 count 0 and 0 for any tap sequence.
- **Hints:** each hint names the outcome the question asks for. **Layout:** `cupLayout` at the four views, sizes at least the minimums, no overlap, the pet corner clear, inside `view`. **Voice and journal:** forbidden-words test; each filed discovery has a journal entry matching the table. **Registry, lands and how-to tests** pass, including the home land on one screen at every band that sees it.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` taps the spoon at levels 1–2, the right cup at level 3, the matching card then the spoon at level 4, and the right tray at level 5, inside the demonstration window.
- **How-to card** (`src/content/howto.ts`). Goal: "Stir things into water and see which vanish, which sink and which float." Steps: "Tap the spoon to stir something into the cup" (levels 1–2); "Find the cup the card asks for" `{ from: 3, to: 3 }`; "Say what you think will happen, then stir" `{ from: 4, to: 4 }`; "Test each cup, then put it in the right tray" `{ from: 5, to: 5 }`. Finish: "She has seen what the things do in water" (1–2); "The right cup is chosen" (3); "She has guessed and seen all four" (4); "All six cups are filed" (5). Notes: "Nothing counts as a mistake at levels 1, 2 and 4"; "A wrong cup or tray shows what is in it; the pet gives a hint, and after two it glows".
- **Registration:** ID `stir-see` (working), name "Stir and See" (working), spoken title `game.stir-see`. Region (subject) `tinker-lab`. Skills `['mixtures', 'prediction', 'observation']`. Bands as above. Home land **Bubble Beach** if its layout test passes (next to Sink or Float), else **Tinker Lab**. Hub icon: a cup with a spoon. Sticker (page `meadow`): a seeded small cup or swirl.
- **Art (code-drawn, `src/games/stir-see/art.ts`, colours from `src/art/palette.ts`):** cup, water, spoon, a heap, a shimmer and one drawing per material. Reuse shared drawings only where `src/art/` already has them.
- **Co-play:** *What happened?* The grown-up asks her to name what each thing did in the cup. **Off-screen:** none until a reviewer is named; the first candidate, held, is a clear jar of water, a spoon of garden soil and a leaf, watched outside and never tasted or drunk.
- **Couch:** none. **Rework couplings:** none required.

## Check tier

New-game tier, in one or two build sessions (levels 1–2 first if the art grows): typecheck and unit tests (the properties above plus registry, lands, journal and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at the first and last level with one wrong cup at level 3 and one hint; one portrait screenshot of level 3's three cups; `fingerdemo` at levels 1 and 4; `npm run build`, because registry, lands, voice, journal and how-to files change. Phone work comes first in READY, and a phone playtest can answer whether the shimmer reads as "still in there"; a child's reaction stays a [parked](../DEVICE-CHECKS.md) check.

## Open decisions

**Settled by this packet (choices made here, within the 2026-10-23 matter decisions):** a new game rather than a Sink or Float mode (the action and learning differ: stirring in and vanishing); no `lap` band; levels 1–5 only, with no reviewer; the home land is Bubble Beach unless its layout test fails.

1. **Does a vanish need the shimmer?** Lean yes: without it, a vanished thing looks gone for good, the misconception this game should not teach. If a build session finds the shimmer reads as a tint, it keeps the voice line and drops to a corner mark; recorded at the build.
2. **Level 6, *How many spoons?*** (a saturation count) uses solubility numbers (salt and sugar differ a great deal). It is not defined until a science reviewer is named or the solubility sources are opened and cited in a follow-up packet; nothing here depends on it.
3. **A journal entry per outcome**, as in Melt and Freeze. Alternative: nothing filed until the rework decides how discoveries relate to collecting.
