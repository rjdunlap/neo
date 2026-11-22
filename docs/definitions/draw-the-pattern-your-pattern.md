# Draw the Pattern level 12: Your pattern (definition)

*Game `draw-the-pattern` · pre-K and school · defined 2026-11-22 from [dive slice 5](../deep-dives/draw-the-pattern.md#build-slices-in-order) and the dive's [level 12 sketch](../deep-dives/draw-the-pattern.md#new-levels-on-top), on the [decision of 2026-11-17](../archive/DECISIONS-2026-11-17.md#games): level 12 lives in Draw the Pattern, not Pattern Train, because the action is drawing. Docs only; nothing here is built. It extends the [levels 1–8 definition](draw-the-pattern.md), whose strip, tracer, crayon, corridor and pictures it reuses unchanged unless a line below says otherwise.*

**Fun action and purpose.** The roles of levels 7–8 swap. The strip shows two or three empty places, each with two faint paths: one that goes up (a hill or a peak) and one that goes down (a dip or a valley). She draws whichever she likes in each place, so she makes the start of a pattern. Then the pet takes the crayon, says her pattern back to her ("hill, dip… again!") and carries it on to the end of the strip, repeating exactly what she drew, and the finished strip becomes a bridge or a row of flags in the picture. Learning goal: **making a repeating pattern and seeing its unit repeat** (the NCETM early-years pattern guidance quoted in the [Pattern Train dive](../deep-dives/pattern-train.md): "make your own and sustain it", with the unit of repeat as something she can point to). It also keeps the game's motor practice: every unit of hers is a real stroke along a corridor. Nothing she chooses is wrong, and nothing is scored.

## Level ID and play order

- **ID 12**, name *Your pattern*, plan `mode: 'own'` (a new `Mode`), two strips. It is the next free ID; nothing is renumbered.
- **Bands** (`LEVELS` in `logic.ts`): pre-K `{ min: 5, max: 12, order: [5, 9, 6, 7, 8, 12] }`, school `{ min: 8, max: 12, order: [8, 11, 12] }`. Lap, toddler and preschool are unchanged. `entryLevels` stays `[10]`: 12 is not an easy entry, and every band that lists 12 lists it, so a birthday from pre-K into school keeps her level.
- **Placement is intended.** A round here counts no misses and counts hints only when she asks (below), so almost every round is smooth. Putting 12 at the top of both windows means that only stops her stepping down, never makes her skip anything: at pre-K she has met AB, AAB and ABB at 7–8 before she makes her own, and at school it is a calm top after the spiral and eight. Pattern Train's proposed level 17 *Make your own* accepted a fast climb for the same reason ([dive decision 3](../deep-dives/pattern-train.md#decisions-for-the-developer)); here the question does not arise, because 12 is the top. Grown-ups can pin it at either band.

## The model

Everything in the [levels 1–8 model](draw-the-pattern.md#the-model) holds (strip coordinates by height, `sampleStroke`, `advanceTrace`, the start ring, the crayon, the corner rule) with these additions.

- **A pair per strip.** Each strip draws one pair from the existing `PAIRS` (hill/dip, peak/valley, peak/dip, hill/valley), seeded, the two strips' pairs different. Every pair is one that goes up and one that goes down, so the first move tells them apart and the two faint paths never share a corridor (the property levels 7–8 already test).
- **Her places.** Strip 1 has **two** places, strip 2 has **three**. Each place is an `ownStroke(pair, x0, w)`: the two candidates of `choiceStroke` sharing the unit's start, **with no `right`**. `chooseOrder` picks the candidate her first clear move follows, exactly as at levels 7–8, and `wrongReached` is already false for a stroke without `right`, so either candidate finishes the place. The dive's sketch had two crayon buttons and the pet drawing her picks; this definition drops the buttons so that she draws every unit of her pattern herself, which is the game's fun action, and so that the level adds no new control.
- **Her unit is what she drew.** `ownCore(chosen)` is the list of kinds she drew, in order: two units on strip 1, three on strip 2. **The pet repeats that list as a whole** until the strip is full: `continueOwn(chosen, total) = patternUnits(chosen, total)`, the existing helper. This is the dive's open "rule for continuing a non-repeating choice", and it has no exceptions: every list of two or three kinds is a unit that can repeat, so every choice she makes is a pattern and none is corrected. Repeating the whole list is also exactly what continuing its shortest repeating part gives (hill, hill repeated is hill repeated; for two or three places the shortest part is the whole list or a single kind), so the pet never has to pick between two readings. The dive's "pick one more" and "the first two again" fallbacks are not needed and are left out.
- **What the pet says.** `spokenCore(chosen)` is the shortest repeating part of her list: one kind when all her units are the same ("hill… again!"), otherwise the whole list ("peak, valley, valley… again!"). It is only what the pet says; the drawing always repeats the whole list.
- **Lengths and widths.** `total` is the largest whole number of repeats that fits nine units: strip 1 (two places) has **8** units, four repeats; strip 2 (three places) has **9** units, three repeats. The unit width is fixed per strip, `w = min(UNIT_W, 3.2 / total)`: 0.4 on strip 1 and about 0.356 on strip 2, which is level 8's width, already played. Both are known before she draws, so her places never move or resize. The strip is centred as `choiceStrip` centres it.
- **The pet's part comes after hers.** There is no lead at the start: the start ring sits at the first place's start. When her last place is finished the pet takes the crayon and draws the rest (`patternStroke` of `continueOwn(…).slice(places)` from the end of her last unit), saying each unit's existing `draw.unit.*` word as it draws it, about 0.8 s a unit, as at levels 7–8. Her units stay in her crayon's colour and the pet's in its own, so the picture shows where her unit ends and the repeats begin.
- **The demonstration.** At the round's start, and whenever she taps the pet or the picture, the pet's crayon runs lightly along the first place's up path and then its down path, leaving no line, while the instruction plays. It shows the choice; it chooses nothing.
- `logic.ts` gains plain functions: `ownStroke(pair, x0, w)`, `ownCore(chosen)`, `spokenCore(chosen)` and `continueOwn(chosen, total)`; `stripsFor(12, rng)` returns two strips whose strokes are her places, with each strip's `pair`, `places`, `total` and `w` recorded, and the pet's continuation built once her places are chosen.

## Screen and controls

- **The strip, ring, crayon and picture** are exactly as at levels 7–8; the empty places beyond hers show nothing until the pet draws them, so the strip reads as "her part, then room to go on". `layoutFor` is unchanged, so the views its layout tests cover (including the phone views) hold for level 12; the strip's units are no narrower than level 8's.
- **No new targets.** The draw layer, palm rejection, lost-release handling and touch-down dent are the existing ones. Tapping the pet or the picture repeats the demonstration and the instruction, as at every level; that is not a hint.
- **Feedback as she draws.** Her crayon scratches and climbs the pentatonic steps as usual. When a place is finished, the path she did not draw fades and the pet says her unit's word ("Dip!"), so she hears her own pattern build up.
- **The continuation.** After her last place: "Now I'll keep your pattern going!", then the pet draws and names each unit, with the same rising notes, and at the end says her unit and "again!" over the whole strip lighting unit by unit (`draw.own.again`). Then the strip rolls up into the picture as every strip does.
- Pixi `Graphics` only, colours from `palette.ts`; music unchanged (`STYLES.paint`, not `silenced`: she is drawing, not composing).

## First round

- **Strip 1:** two places on a seeded pair, say hill/dip. The pet runs its crayon lightly up the first place's hill path and down its dip path: "Make your own pattern! Go up or go down, you choose." She draws, say, a hill, then a dip. The pet: "Hill, dip. Now I'll keep your pattern going!", draws hill, dip, hill, dip, hill, dip, and the strip lights in pairs: "Hill, dip… again!" The strip becomes the bridge ("Your pattern is a bridge!").
- **Strip 2:** three places on the other pair, say peak/valley. If she draws peak, peak, peak, the pet says "Peak… again!" and carries on with six more peaks; nothing about a pattern of one kind is wrong. The strip becomes the flags ("Your pattern is the flags!"), and `draw.done` ends the picture.
- **Later rounds** draw new seeded pairs; which pair falls on which strip, and the bridge and flags, follow the seed as at 7–8.

## Accounting, help and finishing

- **Her choices are never counted.** No place, unit, order or pattern she makes is wrong; there is no boing, no rule line and no glow for any choice.
- **A stray is not a miss here.** Wandering out of the corridor leaves the crayon waiting where she stopped, with the soft tick level 10 uses (`stray()` gains the `own` mode beside `dots`), and `draw.back-to-crayon`. It counts nothing and lights nothing: at a creative level a slip of the hand should not step her down, and the corridor at 0.4 and 0.356 widths is the one she has already met at levels 7–8. The level counts **no misses at all**.
- **Show a hint** (the pause sheet) lights the next stretch of **both** faint paths of the current place while it is undecided, or of the path she chose once it is, and counts `hints++` once per request, as at levels 7–8. Asking while the pet is drawing only repeats the instruction.
- **Finish:** `ctx.finish({ misses: 0, hints })`. One ordinary sticker, with or without help.
- **Nothing is kept** (as Pattern Train's proposed 17 keeps nothing): the strips go into the round's picture like every other level's. Keeping a strip stays the [levels 1–8 definition's decision 2](draw-the-pattern.md#open-decisions), folded into the rework's home customization.
- **Journal:** nothing is filed. **Leaving early** keeps nothing and owes nothing.

## Rule tests (`logic.test.ts`)

- **Her places.** For every pair and both strips, each place has two candidates sharing the unit's start, no `right`, and the two paths at least two corridors apart past the divergence (as levels 7–8); `wrongReached` is false on both candidates at every progress.
- **Every choice is a pattern.** For every list of two kinds and every list of three kinds over every pair (4 + 8 lists per pair), `continueOwn(chosen, total)` starts with `chosen`, has length `total`, and equals `chosen` repeated (`out[i] === chosen[i % chosen.length]`); `total` is 8 for two places and 9 for three; the strip ends on a whole repeat.
- **What the pet says.** `spokenCore` returns one kind when every unit is the same and the whole list otherwise; repeating `spokenCore` to `total` gives the same units as `continueOwn` for every list.
- **The fit.** The full strip of `total` units at width `w` lies inside the strip (x from 0 to `STRIP_W`), its units join on the baseline, and the corridor is never narrower than level 8's.
- **Seeds.** Two strips with different pairs; a seed sweep reaches every pair on both strips; the same seed gives the same strips.
- **Accounting.** A stray at level 12 never changes `misses` (a test on the scene's accounting helper, or in the scripted play below if the helper stays in `index.ts`).
- **Bands.** The two windows above with 12 last in each `order`; registry, lands, how-to and voice tests pass.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()` at level 12): draws the **up** path in the first place and the **down** path in every later place, so the demonstration shows a pattern of two different kinds, then waits while the pet draws. It uses the chosen candidate's `traceWaypoints`, the existing `trace` intent. It never demonstrates a stray. The same bot finishes the scripted play.
- **How-to card** steps `{ from: 12, to: 12 }`: "Two faint paths are shown in each place: one goes up, one goes down. Draw whichever you like."; "When your places are drawn, the pet says your pattern and keeps it going to the end of the strip." Note `{ from: 12, to: 12 }`: "Nothing she draws here is wrong, and wandering off the path is not counted; the crayon just waits. Asking for a hint lights both paths and counts as a hint." The goal line and finish stay as they are.
- **Voice lines** under `draw.*`: `instruct.own` ("Make your own pattern! Go up or go down, you choose."), `own.keep` ("Now I'll keep your pattern going!"), `own.again` ("Again!"). The unit words (`draw.unit.*`) and the bridge and flags lines (`draw.picture.bridge`, `draw.picture.bunting`) already exist. The clip renderer picks the new lines up through the existing `draw.` prefix.
- **Describe level:** `PLANS[11].name` "Your pattern: draw up or down in each place, and the pet keeps your pattern going".
- **Co-play:** one person draws the places on a paper strip, the other carries the pattern on; then swap who starts. **Off-screen:** make a pattern of two kinds of things in a row (spoons and forks, big and little stones) and ask a grown-up to carry it on; check it together by saying it aloud.
- **Overlap:** Pattern Train's [proposed level 17 *Make your own*](../deep-dives/pattern-train.md#proposed-ladder) (not built) has her choose a unit of tapped cars and a green Go. This level's unit is drawn strokes with a fixed number of places and no Go button, and it keeps the motor practice; if both are built, the two make the same idea in two media, which the NCETM guidance recommends.
- **Rework couplings:** none required. Nothing is saved or unlocked.

## Check tier

New levels on an existing interaction: her places are the levels 7–8 candidates with no wrong one, the continuation is the pet's existing animated stroke, and there is no new control. Typecheck and unit tests (the rule tests above, plus registry, lands, how-to and voice); one browser play of level 12 through the existing `drawpattern` suite (`BROWSER_SUITE=drawpattern DRAW_LEVELS=12`) on an upright phone, drawing a hill then a dip, then (strip 2) three of the same kind, one deliberate stray (no miss counted) and one requested hint, then the picture; `fingerdemo` at 12. `npm run build`, because the voice and how-to files change, and the voice clips for the three new lines in the next voice batch. Then `npm run game-docs` for the page's generated block.

## Open decisions

None block the build; each has a default.

1. **How she chooses.** Default: she draws either faint path in each place (no buttons). Alternative: the dive's two crayon buttons, with the pet drawing her picks; it would add a new control and take the drawing away from her.
2. **How many places.** Default: two on strip 1, three on strip 2. Alternative: the dive's four places on both strips (two repeats on eight units); it adds nothing a two- or three-unit pattern does not show, and four is harder to say back.
3. **A stray.** Default: not a miss at this level, the crayon just waits. Alternative: count it as at 7–8, which would let a wobbly creative round step her down.
4. **Where 12 plays.** Default: the top of pre-K and school. Alternative: school only, leaving pre-K's top at 8.
