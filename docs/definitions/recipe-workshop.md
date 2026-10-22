# Recipe Workshop, levels 1–3 (definition)

Defined 2026-10-22 as slice C1 of the [cooking-and-recipes study](../deep-dives/subjects/cooking-recipes.md#build-slices-in-order), from its [first game's proposed ladder](../deep-dives/subjects/cooking-recipes.md#first-games-proposed-ladder) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#cooking-and-recipes-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built (C2–C4, 2026-10-22) on the defaults below; home land Painted Canyon.** Cozy Village could not take it: `village.test.ts` finds no hedgerow room at pre-K landscape with twelve visible games (even a 0.32-scale hedge), so decision 1's fallback applied. Cozy Village is therefore full for decoration at 12 games, which also affects [Ready for Adventure](ready-for-adventure.md) and [Second Chance Shed](second-chance-shed.md), whose defaults say Cozy Village. Every ingredient is an already-prepared pretend picture in a pot: no heat, knife, raw food, serving size, tasting, feeding instruction, allergen or dietary statement is drawn or spoken, and nobody eats the bowl. The study's food-safety reviewer ([WAITING](../WAITING-ON-DEVELOPER.md), "Cooking subject: reviewer, identity and older placement") gates practical recipes, feeding and printed cooking cards, not this screen-only pretend play; the ingredient names are [decision 2](#open-decisions). Whether to register a new game at all is [decision 1](#open-decisions), with the default and the overlap case below. Levels 4–5 (mend the bowl; layered versus stirred) are a separate later packet.

**Fun action and purpose:** a little workshop counter with a few pots of pretend fruit mash and a white base, a big bowl and a spoon. A tap on a pot plops a dollop into the bowl, where it sits as its own coloured layer; a tap on the spoon swirls everything in the bowl together into one new colour; a star or leaf can go on top. She serves, and the companion holds up exactly the bowl she made. The learning purpose is **following a visual procedure and reasoning about an observable change**: what is in the bowl is the result of what she did, in which order, and mixing is the step that changes separate layers into one (Head Start P-SCI 1, 3 and 4: observe, compare, predict and investigate with support; the study's [anchors](../deep-dives/subjects/cooking-recipes.md#anchors-opened-and-evidence-limits)). It claims nothing about real cooking or nutrition.

## Identity and overlap

Rechecked 2026-10-22 against the catalog and open proposals, as the study's decision 1 asked:

- **Scoop Shop** (Cozy Village, lap–school) stacks scoops onto a cone in a pictured order; each scoop stays a separate ball forever and the only state is the stack. Here the **spoon changes the bowl's state**: two layers become one blend, and a later dollop stays visibly separate until the next mix. At level 2 the order of addition does not matter but whether she mixed *after* the last addition does, a rule no stacking game has.
- **Pet Kitchen** (Counting Cove) cuts and shares equal portions and scales recipes. Recipe Workshop never counts beyond "one of each", never divides and never scales; all measuring stays in Pet Kitchen (study packet C5).
- **Ready for Adventure** (defined, RA2) prepares props before packing them, in any valid order. Its objects have a fixed ready state; here the result is **a function of every operation, including re-mixing**, and stirring after decorating visibly folds the topper in (level 3). No food appears in Ready for Adventure.
- **Fill and Dump** pours to a line; **Rainbow Fingers** mixes paint colours. Recipe Workshop has no pouring control and never names a colour as the goal: the card shows the ingredient pictures and the spoon, never "make purple". A blend's colour is only how the drawing shows it is mixed.
- **Mix & Make** (proposal) discovers surprising combinations; here every result is predictable from a small visible card, with no discovery book.

The game earns its own registration through the mix-state rule; if the build or the developer's review finds it reads as Scoop Shop content, [decision 1](#open-decisions) names the fallback.

## The model (`logic.ts`)

- **Ingredients:** a seeded pool of pretend pots, each with a picture on its front so colour is never the only cue: `berries` (the existing `blueberries` prop picture, purple-blue mash), `apple` (`apple` picture, pink mash), `orange` (`orange` picture, orange mash), and the `base` (a white dollop with a cloud swirl on the pot, spoken per [decision 2](#open-decisions)). **Toppers** (level 3): `star` and `leaf`, flat pretend shapes from a tray, never cut by anyone.
- **Bowl state:** `mixed` (a count per ingredient stirred together, drawn as one blended fill), `loose` (the portions added since the last mix, in order, each drawn as its own dollop layer above the blend), `top` (one topper or none) and `folded` (the set of toppers stirred in, drawn as specks in the blend). **Bounds:** at most 4 portions in a bowl (mixed plus loose); at most 3 of one ingredient. Every reachable state is drawable from that finite table.
- **Actions:** `add(ingredient)` appends a portion to `loose` (refused, free, when the bowl is full); `mix()` moves every loose portion into `mixed`, and if a topper is on top it moves into `folded` and `top` empties; mixing an empty or already mixed bowl is a harmless swirl; `topper(t)` sets `top` (a topper already there goes back to the tray: one slot, a swap, never a miss); `undo()` restores the bowl's previous state from a per-bowl stack of earlier states (an emptied stack disables the button). An action that leaves the bowl unchanged (mixing a bowl with nothing loose and no topper, the same topper again, a full pot) pushes nothing, and pushing a state already in the stack truncates the stack back to that entry, so it never holds a repeat and stays bounded by the finite state table, never capped by a count that could drop the entry a repair needs. Toppers and pots never run out.
- **Blend colour** is a pure function of `mixed`'s counts (a weighted mix of the ingredients' palette fills, the base lightening it), so the art, the test and the ghost finger agree. No ingredient changes into a different substance.
- **Recipe** (levels 2–3): `{ fruit: 1, base: 1 }`, everything mixed (nothing loose), and at level 3 `top` equal to that bowl's requested topper. `folded` never matters: a star stirred in is a free extra, and a fresh star on top still satisfies the card.
- **`check(bowl, request)`** returns `ok` or the first failing reason in this order: `empty` (nothing in the bowl), `extra(ingredient)` (more than the card shows, including any ingredient the card does not show), `missing(ingredient)`, `notMixed` (something loose), `noTopper` / `wrongTopper` (level 3).
- **`hintFor(bowl, request)`** returns one next action from the bowl's *current* state: `undo` while anything is extra; else `add` the missing ingredient (fruit before base); else `mix` while anything is loose; else the requested topper; else `serve`. Following it from any reachable state reaches `ok` (every excess portion is on the stack's path from the empty bowl, so repeated undo ends it).
- **Authored first round** for each level so the how-to card and its demonstration open on the same counter; later rounds are seeded from `ctx.rng` within each level's variation.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **My bowl** | toddler, preschool | What to put in and whether to mix: every bowl is right | Serve with anything in the bowl |
| 2 | **Follow the picture** | preschool, pre-K | One of each on the card, in either order, then mix after the last one | Serve passes the check |
| 3 | **Bowls for two** | pre-K | Which bowl to make first, and mix before the topper goes on | Both bowls served, each passing its own check |

No school window in this build: the study's tentative school 3–5 waits for levels 4–5 so school play does not start on the pre-K top ([decision 3](#open-decisions)). No lap or grown-up window.

### First rounds

- **Level 1:** two pots (berries and the base), one bowl, the spoon and Serve. Any taps; a mix turns the layers into one lilac blend. Serve after one dollop or four. *Variation:* the two pots are seeded from the four (always two different pictures).
- **Level 2:** two pots (berries and the base), the bowl, the spoon, Undo and Serve; the card above shows the berries pot, the base pot and the spoon. *Concrete first bowl:* berries then base then spoon, or base then berries then spoon; both pass. Serving with only the base says what is missing, keeps the bowl and pulses the berries picture on the card. Mixing an empty bowl is a harmless swirl. Berries, mix, then base leaves a white layer on a purple blend: `notMixed`, and one more stir fixes it. *Variation:* the fruit is seeded among berries, apple and orange; only the card's two pots are on the counter (the study's "present only the tools used"; an optional topper at level 2 is [decision 4](#open-decisions)).
- **Level 3:** the companion and one critter friend (from `CRITTERS`, seeded) each stand behind a bowl, each holding up a little picture of their topper: star for one, leaf for the other. One shared card shows fruit + base + spoon; the topper tray holds a star and a leaf. *Variation:* the fruit, the friend, and which side wants the star.

## Gestures and accounting

**Inputs:** a tap does everything, so the youngest round needs no drag. A tap on a pot adds one portion to the **active bowl** (the only bowl at levels 1–2; at level 3 the bowl last tapped, ringed, the left one at the start); a tap on the spoon mixes it; a tap on a topper puts it on top; Undo undoes the active bowl's last action; Serve (levels 1–2) or a bowl's own Serve (level 3) checks that bowl. A **drag alternative** for older hands (`src/engine/drag.ts`): a dollop dragged from a pot, a topper from the tray, or the spoon onto either bowl does the same action there and makes that bowl active. The spoon drag swirls as it follows the finger but never needs circles, speed or duration: releasing over a bowl mixes it. A cancelled or missed drag floats home and does nothing.

Only an unsuccessful **Serve check** is a mistake. Adding, mixing, undoing, swapping toppers, choosing a bowl and anything at level 1 are free:

| Gesture | Result | Counts |
| --- | --- | --- |
| Tap a pot / drop a dollop on a bowl | A dollop arcs into the bowl as a new layer, with a pentatonic plip and a ripple | Nothing |
| Pot when the bowl holds 4 (or 3 of that one) | The pot wiggles; "The bowl is full." | Nothing |
| Tap the spoon / drop it on a bowl | A swirl; loose layers and any topper become one blend | Nothing |
| Tap a topper (level 3) | It lands on top (a topper there goes back) | Nothing |
| Undo | The bowl steps back one action | Nothing |
| Tap a bowl, a friend, the card | Selects the bowl / a giggle / the card speaks the request | Nothing |
| Serve an empty bowl | The invitation again ("Tap a pot to put some in.") | Nothing, at every level |
| Serve at level 1 with anything in it | The bowl is served | Nothing |
| Serve a bowl whose check fails (levels 2–3) | The bowl stays as it is; the companion says the reason; the card pulses the part that differs | **1 miss**, that bowl |
| Serve a bowl that passes | It slides to its friend, who holds it up | Nothing |

**Two misses on a bowl** show a persistent glow on `hintFor`'s action for that bowl (the pot, spoon, topper, Undo or Serve; at level 3 the bowl's ring too) and count **1 hint**. The glow follows the bowl's current state after every action until it is served. **Show a hint** (pause sheet) starts the same glow on the unserved bowl with the most misses, else the active bowl, and counts **1 hint** if that bowl has not counted one yet. **Each bowl counts at most one hint** (the study's "one hint per unresolved bowl"); asking again repeats the speech and counts nothing. At level 1 Show a hint glows a pot, then Serve, and counts nothing: the level records no misses and no hints. **Assisted action:** a tap on the glowing thing does that action as usual, so a supported round can always finish.

**Finishing:** after the last successful Serve, the companion holds up exactly the bowl she made (both friends at level 3), with a cheer and a soft chord, about four seconds; a tap skips to the end pose. Nobody eats or rates it. `ctx.finish({ misses, hints })` runs once (a `finished` guard). One shell sticker, with or without help. Adaptation follows the shell's ordinary rule; level 1 records zero misses and hints by design and is not evidence of following a recipe ([decision 3](#open-decisions) keeps the toddler window to level 1).

**Pause sheet:** Start again (empty bowls, the same request, keeping the round's misses and hints) and Show a hint (`Scene.pauseActions`).

## Screen and controls

- **Counter:** pots in a row on a shelf across the upper middle, each at least 130×130 logical units with its picture on the front; at level 3 the topper tray (star and leaf, each at least 110×110) at the row's right end. Touch-down presses a pot or the spoon at once.
- **Bowl:** at levels 1–2 one wide bowl, at least 260×180, centred low; the blend fills it from the bottom, loose dollops sit as distinct coloured layers above it, a topper sits on top, folded toppers show as specks. At level 3 two bowls, each at least 220×160, each with its friend behind it and its own Serve button below.
- **Spoon:** at least 130×130 beside the bowl (between the bowls at level 3). **Undo:** a round-arrow button at least 100×100 at the bowl's left. **Serve:** a bell button at least 120×120 at its right (one per bowl at level 3).
- **Request card** (levels 2–3): top centre, at least 260×140, the two pot pictures and the spoon; each friend's topper picture is in its speech bubble, at least 100×100. The card and bubbles are tap targets only for replaying the request.
- **Companion:** `ctx.companion()` stands behind the bowl's left (behind the left bowl at level 3), clear of the guide corner; it cheers on a successful Serve and wiggles on a failed one. It holds the served bowl beside itself on a little stand, not in `part('hands')` (some species have none).
- **Sound:** synthesized only: a pentatonic plip per dollop (its pitch per ingredient), a swish on mixing, a tick for a topper, a bell for Serve. The island style keeps playing (she is not making the music).

`workshopLayout(view, level)` returns every rectangle: card, bubbles, pots, tray, bowls, spoon, Undo, Serve buttons and companion spot. A test runs it at the four views the lands test uses and asserts every target at least 100 logical units each way (larger where stated), no two targets overlapping, at least 30 units between neighbours, the Home button (top-left) and the guide's bottom-left corner clear, and everything inside `view`; if a view cannot fit level 3, it returns null and the test fails rather than shrink.

### Layout sketches

**Landscape (1024×768), level 3:**

```
+------------------------------------------------------------+
| [Home]           [ card: fruit + base + spoon ]            |
|                                                            |
|      [fruit pot]   [base pot]        [star] [leaf]         |
|                                                            |
|   companion (★)                     friend (leaf)          |
|   [ bowl A ]        [spoon]         [ bowl B ]             |
|   [undo][serve]                     [serve]                |
|  pet                                                       |
+------------------------------------------------------------+
```

**Portrait (768×1024), level 3:** the card, then the pots and tray in one row of four, then the two friends and bowls side by side with the spoon centred under them, then Undo and the two Serve buttons. Levels 1–2 use one bowl centred, Undo left, Serve right, in either orientation.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the guide repeats them); everything else uses `ctx.say`.

- `recipe.instruct.1`: "Make a bowl for {pet}! Tap a pot to put some in. The spoon mixes it."
- `recipe.instruct.2`: "Make the bowl on the card: one of each, then mix."
- `recipe.instruct.3`: "Make a bowl for each friend: one of each, mix, then their topping on top."
- `recipe.request.<fruit>`: "One spoon of berries, one spoon of {base}, then mix." (one per fruit; `{base}` is the word from [decision 2](#open-decisions), written into each line, not substituted at run time)
- `recipe.full`: "The bowl is full."; `recipe.empty`: "Tap a pot to put some in."
- `recipe.extra.<ingredient>`: "That's more berries than the card shows. Undo steps back."
- `recipe.missing.<ingredient>`: "It still needs the berries."
- `recipe.notmixed`: "Some of it isn't mixed yet. The spoon mixes it."
- `recipe.notopper.<topper>` / `recipe.wrongtopper.<topper>`: "This friend wants the star on top."
- `recipe.hint.<action>`: "Try the berries pot." / "Try the spoon." / "Try Undo." / "Try the star." / "Try Serve."
- `recipe.served`: "Here it is!"; `recipe.all`: "A bowl for everyone!"

No line says to eat, taste, cook, cut or heat anything, names a food as good or bad, or tells a real child how to make food.

## Rule tests (`logic.test.ts`)

1. **Both orders:** at level 2, add fruit then base then mix, and base then fruit then mix, both pass; fruit, mix, base fails `notMixed` and one more mix passes.
2. **All states enumerated:** every bowl reachable within the bounds (all add/mix/topper sequences up to the cap) is drawable from the finite table and `check` gives exactly one result for it; oversupply (two of the fruit, two of the base, three portions) gives `extra`; an ingredient the card does not show is never on the counter at levels 2–3, so `extra` for it is defensive only.
3. **Mix rule:** mixing moves every loose portion into `mixed` and nothing else changes counts; a topper on top folds in and `top` empties; mixing twice is the same as once; a topper never changes ingredient counts.
4. **Undo:** undo restores the exact previous state after every action type; the stack is per bowl, an unchanged-bowl action pushes nothing, a repeated state truncates back to its first entry (a topper–mix–topper–mix cycle never grows it), and repeated undo from any state reaches the empty bowl; Start again empties the bowls and keeps misses and hints.
5. **Hints lead somewhere:** from every reachable state, following `hintFor` reaches `ok` in a bounded number of steps, and its first action is legal in that state.
6. **Accounting:** only a failed non-empty Serve check counts a miss, charged to that bowl; empty serves and every other gesture count nothing; two misses on one bowl give one glow and one hint; a bowl never counts a second hint; level 1 counts nothing at all.
7. **Level 3 independence:** both bowls served in either order, with interleaved work across them, pass; a folded star plus a star on top passes; actions never cross bowls.
8. **Level 1 freedom:** every non-empty bowl within the bounds is servable.
9. **Seeded rounds:** each level's seeded rounds stay within its variation; pots in a round have different pictures.
10. **Layout:** `workshopLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` taps at the current level: level 1 a pot, the other pot, the spoon, Serve; level 2 the base, the fruit, the spoon, Serve (the base-first order shows the order is free); level 3 the left bowl, fruit, base, spoon, its topper, its Serve, then the same on the right bowl. It waits for the finish, so `fingerdemo` proves each level.
- **How-to card** (`src/content/howto.ts`). Goal: "Put pretend things in a bowl, mix them, and serve what you made."
  - Steps: "Tap a pot to put some in the bowl; the spoon mixes everything in it" (all levels); "Any bowl is right: tap Serve when you like" `{ from: 1, to: 1 }`; "Make the bowl on the card: one of each, in either order, then mix" `{ from: 2, to: 3 }`; "Tap a bowl to work on it; mix first, then put that friend's topping on top" `{ from: 3, to: 3 }`.
  - Finish: "Serve shows the bowl you made" `{ from: 1, to: 1 }`; "When Serve matches the card, it's done" `{ from: 2, to: 2 }`; "When both friends have their bowl, it's done" `{ from: 3, to: 3 }`.
  - Notes: "Adding, mixing and Undo are free to try; only a Serve that doesn't match the card counts as a miss, and two on one bowl light up the next step and count as help" `{ from: 2, to: 3 }`; "Level 1 has no wrong bowl, so it shows play, not following a recipe" `{ from: 1, to: 1 }`; "Pretend food only: nothing here is a real recipe or advice about what to eat" (all levels).
- **Registration (default, [decision 1](#open-decisions)):** ID `recipe-workshop`, name "Recipe Workshop", spoken title `game.recipe-workshop` ("Recipe workshop"). Region (subject) `cozy-village`. Skills `['sequencing', 'following-directions', 'cause-and-effect', 'everyday-life']`. Bands (`BandLevels`): toddler 1–1, preschool 1–2, prek 2–3. Home land per [decision 1](#open-decisions). Hub icon: a bowl with a spoon and a lilac swirl. Sticker (page `meadow`): a seeded blend bowl with a star or leaf on top.
- **Art:** code-drawn in `src/games/recipe-workshop/art.ts` with `src/art/palette.ts` and the existing fruit pictures in `src/art/props.ts`: counter and shelf, pots, bowl (blend, up to four dollop layers, topper, specks), spoon, Undo, Serve bell, star and leaf, request card, speech bubbles, the companion's stand. No imported art or audio.
- **Co-play:** one person points to pots on a pretend card and the other makes that bowl, then swap. **Off-screen** (spoken tip): "With pretend kitchen toys, make a bowl from a picture, then tell someone what you did first." A conversation only: no real recipe, utensil or quantity.
- **Couch:** none. **Journal:** nothing filed. **Creations:** a kept bowl waits for an approved bounded creation format (study); nothing is saved beyond the shell's round history.
- **Rework couplings:** uses the companion through `ctx.companion()`; nothing depends on the rework.

## Check tier

The build is one declared same-game batch, [recipe-workshop 1](../GAME-BATCHES.md#recipe-workshop-1-levels-13), in one worker and PR, with the study's three slices as its named parts (if the allowance cannot cover all three, the worker stops after a complete C2 or C3 and leaves the PR draft with that checkpoint): **C2** level 1 (new game: typecheck, unit tests, one scripted play with an empty Serve and Show a hint, a portrait screenshot, `npm run build` for the registry, lands, voice and how-to files); **C3** level 2 (new interaction: typecheck, units, one filtered play with a failed Serve, the two-miss glow and a requested hint, `fingerdemo` at 2, portrait); **C4** level 3 (new levels plus the bowl-selection control: typecheck, rule tests, one play at 3 with a failed Serve on one bowl and both bowls served in the other order, `fingerdemo` at 3). One `browser-check.mjs` case (and its README row) grows across the three. A no-miss toy cannot manufacture a wrong-answer test, so C2's play checks the free empty Serve instead.

Device and person checks stay open: whether a two-year-old reads the dollop layers as separate and the blend as mixed, whether three-year-olds see why a late dollop makes the bowl "not mixed", whether a drag-to-stir feels better than a tap, and how iPad speech says the lines. Browser automation establishes none of these.

## What comes next

The study's **C7** chooses one deeper mode after observation; levels 4 (*Mend the bowl*) and 5 (*Same ingredients, different result*) are the school window's candidates and need their own definition. Pet Kitchen's equivalent measures (C5) and Picnic Pantry (C6) proceed independently.

## Open decisions

Each has a default the build uses; none blocks C2.

1. **New game and land.** Default: a new game (the overlap section says why it is not Scoop Shop content), home land **Cozy Village**, region `cozy-village`. Cozy Village holds 12 games today and [Ready for Adventure](ready-for-adventure.md) and [Second Chance Shed](second-chance-shed.md) also default there; `village.test.ts` and `lands.test.ts` decide at build time. Fallback if its layout returns null: **Painted Canyon** (`treehouse` land, 6 games), where making a bowl sits beside the other making games; the region stays `cozy-village`. Alternative: fold levels 1–3 into Scoop Shop as a mixing counter, if the developer judges the mix rule too close.
2. **Ingredient words.** Default: berries, apple, orange and a white base spoken as "yogurt", all drawn in pots, never as whole raw food to prepare. Alternative: the base is "cream" or "the white one", or any word the family prefers; changing a word changes only the voice lines.
3. **Bands.** Default: toddler 1, preschool 1–2, pre-K 2–3; school waits for levels 4–5. Alternative: school 3 now, if school children should see it before 4–5 exist.
4. **Topper at level 2.** Default: none, so the round shows only the tools its card uses. Alternative: an optional sprinkle shaker at level 2, unjudged (the study's "optional topping choice"), folding in when mixed.
5. **Drag to stir.** Default: a tap mixes at every level; the spoon drag is an alternative from level 1. Alternative: drag only from level 3, if a toddler's drag of the spoon mostly cancels.
