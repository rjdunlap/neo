# Food Web Workshop, levels 1–3 (definition)

Defined 2026-10-21 as slice **F1** of the [ecosystems study](../deep-dives/subjects/ecosystems.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/ecosystems.md#first-games-proposed-ladder-food-web-workshop), [rules to define](../deep-dives/subjects/ecosystems.md#rules-mistakes-help-and-proof-to-define), [presentation notes](../deep-dives/subjects/ecosystems.md#experience-and-presentation) and [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#ecosystems-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: defined; the build (F2) waits on one developer call.** The study requires a named reviewer to check the feeding records before implementation, and unlike Seed Travelers the records cannot be made species-free: who ate what *is* the content. The [ecosystems row in WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) asks the developer to review (or name a reviewer for) the six records in [the record table](#the-records-reviewer-checklist), and to confirm the identity and land defaults ([decisions 1–3](#open-decisions)). The general "Who reviews content?" answer in that file would settle the first part. Once those are confirmed, F2 is a ready new-game build of the three levels below.

**Fun action and purpose:** a little meadow shows three big creature stations, with picture cards along the top: each card is something we saw happen ("We saw the caterpillar eat clover leaves"). Tap a card and it replays: a small food symbol floats from the food into the eater's mouth. Then she makes the picture herself: drag a food badge out of the food's station onto the eater, and an arrow grows from food to eater with little dots flowing along it. When she thinks the web matches the cards she taps **Show our web**. At level 2 one arrow arrives pointing the wrong way and she turns it around; at level 3 one food feeds two different eaters, so the arrows branch. The learning goal is **building a model from observations**: a food web is a picture of who was seen eating what, its arrows point the way food goes (NGSS 5-LS2-1 through a small toy model; K-LS1-1's "animals need food"; the [study's anchors](../deep-dives/subjects/ecosystems.md#anchors-and-evidence-limits)). It is a model of these cards, never of a whole meadow.

## References

No new source was opened for this definition. The study's similar-games table applies. From it the build takes: the evidence stays visible beside the model, a small authored table rather than a simulation decides every result, and predation is shown only as a food symbol moving, never a chase. It rejects a population or energy simulator, arcade hunting, a biodiversity meter and any outdoor, feeding or handling instruction.

## Overlap

Checked against `origin/main` at `15a8782e` (GAMES entries, `src/content/lands.ts`, the games' `index.ts`).

| Game | What it already owns | Why Food Web Workshop is different |
| --- | --- | --- |
| Animal Snack (Barnyard, lap–preschool) | Giving one fictional favourite snack to one animal; cause and effect | A snack match is one source to one animal with no direction to decide and no model. Here the action is building and repairing a directed graph from cards, and its records are reviewed real relations, not favourites. Animal Snack's foods are never imported as a food web |
| Habitat Helpers (Rainbow Meadow, preschool–school) | A visitor comes when the garden meets its food, water and shelter needs | Needs of one visitor at a time. Here the relationships between several creatures are the subject, and nothing is supplied or invited |
| Dot Link (Rainbow Meadow) | Joining dots in order to make a picture | Its order is counting and the line has no meaning. Here each arrow is a claim checked against a card, and direction matters |
| Chain Reaction (Tinker Lab) | Placing parts in sockets so one event triggers the next | A causal machine run. A food web is a static record of observations, and nothing runs in sequence |
| Seed Travelers (defined, unbuilt) | A carrier moves a seed | A trip, not a relationship model. No shared organism or art |

**Identity default: a new game.** Making and repairing a directed relationship model from evidence is the action, which the study says is what earns a new identity ("rather than dragging one snack to one animal").

## The records (reviewer checklist)

Each record is one card. The wording is the card's spoken line, and the build uses these exact six. They are chosen as common, textbook relations; **each still needs the reviewer's tick before implementation** ([decision 1](#open-decisions)). The organisms are named only by kind ("the bird", "the snail"), never by species.

| ID | Spoken line | Food (source) | Eater | Reviewer question |
| --- | --- | --- | --- | --- |
| `r1` | We saw the caterpillar eat clover leaves. | clover | caterpillar | A generic caterpillar on clover; acceptable without a species? |
| `r2` | We saw the bird eat a caterpillar. | caterpillar | bird | Fine for a garden songbird? Is the replay (a caterpillar symbol, the caterpillar station staying put) gentle enough? |
| `r3` | We saw the snail eat dandelion leaves. | dandelion | snail | — |
| `r4` | We saw the bird eat a snail. | snail | bird | Thrushes do; is "the bird" acceptable, or should the card say "the thrush"? |
| `r5` | We saw the bunny eat clover. | clover | bunny | — |
| `r6` | We saw the bunny eat dandelion leaves. | dandelion | bunny | — |

**What the model says and does not say.** An arrow means "a card showed this". A pair with no card is *not on our cards*, never "does not eat". Arrows point **from the food to the eater**, the way food and its energy go (the textbook convention; [decision 5](#open-decisions)). The Sun, soil, decomposers and amounts are not in levels 1–3. The how-to note and the finish line say it is a small model of what we saw.

## The model (`logic.ts`)

- **Organisms:** `clover`, `dandelion`, `caterpillar`, `snail`, `bunny`, `bird`. **Records:** the six above as `{ id, from, to }`.
- **Cases** (each level picks one, seeded):

  | Level | Case A | Case B |
  | --- | --- | --- |
  | 1, 2 | clover, caterpillar, bird; records `r1`, `r2` | dandelion, snail, bird; records `r3`, `r4` |
  | 3 | clover, caterpillar, bunny; records `r1`, `r5` | dandelion, snail, bunny; records `r3`, `r6` |

  Levels 1–2 are a chain (plant → plant-eater → its eater); level 3 branches from the shared plant.
- **A level plan** is `{ cases, start }`. `start` is `'empty'` (levels 1 and 3) or `'one-reversed'` (level 2: one record's arrow is drawn backwards and the other is drawn correctly; which one is reversed is seeded).
- **State:** the stations (seeded position order), the arrows (a set of directed pairs, at most one arrow per unordered pair), the undo stack (her own changes only), the checks made and the hints given.
- **Actions:**
  - `connect(from, to)`: no arrow between them, so add `from → to`; the reverse arrow exists, so **turn it** to `from → to` (this is level 2's repair, and works at every level); the same arrow exists, so nothing changes (the arrow pulses). `from === to` changes nothing. Every change is pushed on the undo stack.
  - `undo()`: reverts her last change (removes an arrow she added, or turns back one she turned). A pre-drawn level-2 arrow can be turned and the turn undone, but never removed by undo, since she did not draw it.
  - `check()`: compares the arrows with the case's records. `ok` if they are exactly equal. Otherwise it returns the **first fault** in this order: `reversed` (an arrow whose reverse is a record), `missing` (a record with no arrow either way), `extra` (an arrow on no card). One check is one miss, however many faults there are.
  - `hintAction(state)`: fixes the first fault in the same order: turn the reversed arrow, add the missing one, or remove the extra one. It never removes or turns an arrow that matches a record. With no fault it returns `check`.
- **The badge is a stamp, not a portion.** A food badge floats home after every drop, so one plant can be the source of two arrows. An arrow records a card; it is not an amount of food ([study boundary](../deep-dives/subjects/ecosystems.md#rules-mistakes-help-and-proof-to-define)).

## Levels

| Level | Name | First round | Ends |
| --- | --- | --- | --- |
| 1 | *Make the picture* | Three stations, no arrows; two cards (`r1`/`r2` or `r3`/`r4`). The first suggested action is replaying a card, never a guess | **Show our web** with exactly the two arrows |
| 2 | *Turn the arrow* | The same chain arrives with one arrow pointing backwards and the other right. Replay its card and drag the food's badge onto the eater: the arrow swings round | **Show our web** with both arrows the right way; the correct one is never touched |
| 3 | *One food, two eaters* | The plant, the plant-eater and the bunny; two cards that share the plant | **Show our web** with both arrows leaving the plant |

**Bands:** school `{ min: 1, max: 3 }` only. A younger child sees it behind the land's signpost and plays the school window through `playBand`. No grownup window. Study levels 4 (*Another food*: one eater with two foods), 5 (*What remains connected?*) and 6 (Meadow Plans) need their own definitions; level 5 also waits on the study's exploration-accounting decision. That decision does not gate levels 1–3, because each has a deliberate Check.

**Changes from the study's ladder**, written down so later packets do not go stale:

- **Arrows, not ribbons.** The study's "ribbon" becomes an arrow, because the arrowhead is what level 2 teaches and because Ribbon Workshop (fractions) now owns the word.
- **Repair by re-dragging, not by removing.** The study says edges never take input; an Undo of her own changes cannot remove a pre-drawn arrow. So dragging the food's badge onto the eater turns a reversed arrow. Level 2 is then one deliberate action that states the right direction.
- **No tap-source, tap-eater alternative.** One input (the drag) keeps the ghost finger, how-to and test plan simple; see [decision 4](#open-decisions).

## Screen and controls

The design area is 1024×768 and the view expands the spare dimension, so the width is always at least 1024.

- **Cards (top centre):** one per record, 210×150, centred at `view.w / 2 ± 125`, y = 100. Each pictures the eater with the food's small icon at its mouth, and a replay mark. Tapping a card replays it: the food station glows, the food symbol floats from the food station into the eater's mouth with a soft munch, the eater does a happy bounce, and the card's line is spoken. **The food's station never moves or disappears**, and no chase is shown. Replays are free and can be repeated.
- **Stations:** three circles of radius 100 in a triangle, in seeded order: one at (`view.w / 2`, `0.43 × view.h`), two at (`view.w / 2 ± 260`, `0.72 × view.h`) in landscape; in portrait the rows move to `0.40` and `0.66 × view.h`. The lower-left station's edge stays right of x = 150 and above the pet's corner (`spread`-style clearance). Each station draws its organism; tapping it (not the badge) names it, free.
- **Food badges:** every station carries a badge, 110×110, on its lower front, picturing that organism's small icon. Drag it with `src/engine/drag.ts` (the usual 40-unit lift). A drop resolves to the **nearest** other station within 170 units of the badge; anywhere else, or its own station, floats it home with nothing changed. A badge from the top eater is allowed: the arrow it makes is simply not on the cards.
- **Arrows:** drawn from the edge of the food's station to the edge of the eater's, slightly curved, with a large arrowhead at the eater and dots flowing toward it. `eventMode = 'none'`: arrows never take input.
- **Show our web:** a 200×120 button at (`view.w − 140`, `view.h − 100`), pictured as a little web with a tick (no reading needed). It is available once any arrow exists (always at level 2).
- **Undo:** the shared `RoundButton` with `againIcon()` at (`view.w − 80`, 80), as Jar Sort's undo; dimmed when her undo stack is empty. Top-left stays the shell's home and `?`.

**Input:** `onTap` for cards and stations (touch-down feedback: a card dips, a station brightens), `draggable` for badges. No custom pointer handling, so palm rejection and cancellation come from the shared helpers. Replays and the finish show are scene-owned tweens (`ctx.tw`); positions are recomputed in `resize()`, including a badge floating home. There are no game-owned timers or render textures; drag handles are destroyed in `destroy()`.

## Accounting, help and finishing

- **Free:** replays, naming taps, every drag (including one that makes an arrow not on the cards), turning, undo and Start again. Building a wrong web is exploring until she presses Show our web.
- **A miss:** a Check that is not `ok`. One miss per Check. The boing plays, the fault's card replays and one line is spoken: `reversed`, "This arrow points the wrong way. Arrows go from the food to the one who ate it."; `missing`, "One of our cards has no arrow yet."; `extra`, "Our cards didn't show that one." (said about the cards, never "the bird doesn't eat clover").
- **Glow after two failed Checks:** the next fault's card and its two stations glow until that fault is fixed (the shell's two-miss rule). A replay alone is not a hint.
- **Show a hint** (`askForHint`, the pause sheet's button): applies `hintAction` with its animation (the arrow grows, turns or fades), replays the relevant card and counts **one hint** per request. It never undoes correct work. Asked with no fault left, it glows Show our web and counts nothing.
- **Supported finish:** repeated hints always reach a web that passes, so she can always finish; assisted rounds count their hints.
- **Finish:** an `ok` Check plays the web once (each arrow's dots flow in turn, each eater bounces, a pentatonic rise from `src/audio/notes.ts`), says "Our food web! The arrows show where the food goes.", then calls `ctx.finish({ misses, hints })` once. A second tap during the show does nothing. One sticker, also with help. No timer, no score, no journal entry or saved web.
- **Adaptation:** the shell's ordinary rule (two smooth rounds step up, two struggling rounds step down within school 1–3).
- **Restart (`restart`):** returns to the level's start (level 2's reversed arrow restored) and clears her undo stack; misses and hints already counted stay.

## Rule tests (`logic.test.ts`)

1. The record table: six records, every record's `from` and `to` are organisms in some case, and no record is its own reverse.
2. Every case's records form an acyclic graph; levels 1–2 are a two-step chain and level 3's two records share their source and have different eaters.
3. Level 2: every seeded start has exactly one reversed arrow and one correct arrow, and one `connect` along the record turns it and leaves the other unchanged.
4. `check` is `ok` exactly when the arrows equal the records; a web with several faults reports the first in the stated order and counts one miss.
5. Accounting: no action other than a failed `check` adds a miss; a hint counts one; duplicate `ok` checks cannot finish twice.
6. `hintAction` strictly reduces the number of faults, never alters an arrow matching a record, and repeated from any reachable state reaches `ok` in at most three fixes (three stations have three pairs).
7. `undo` restores the exact previous arrows; it never removes level 2's pre-drawn arrow.
8. Seeded rounds: seeds 0–199 give a valid case, station order and (level 2) reversed record, and the same seed gives the same round.
9. Layout: in landscape and portrait views every card, station, badge and button stays on screen, at least 100 units, clear of the home/`?` buttons and the pet's corner, and no two stations' drop circles overlap.
10. Every spoken line the game uses exists in `voice-script.ts`.

These prove the model is consistent and fair, not that the biology is right; that is the reviewer's tick.

## Art, ghost finger, how-to card, voice and registration

- **Art (Pixi `Graphics`, `src/art/palette.ts`):** reuse the `CRITTERS` bunny from `src/art/critter.ts` (body-centred hit area per the pitfalls). New drawings: a clover clump, dandelion leaves (leaves only, no seed head, to keep clear of Seed Travelers), a caterpillar, a snail and a round songbird, each at station size plus a 60-unit icon for cards and badges; the web-with-tick button picture. No imported art.
- **Ghost finger (`autotouch`, `touchDemo`):** level 1 taps the first card, drags the plant's badge to the plant-eater, taps the second card, drags the plant-eater's badge to the bird, taps Show our web. Level 2 taps the reversed arrow's card, drags the food badge onto the eater, then Show our web. Level 3 replays both cards, drags the plant's badge to each eater, then Show our web. The window shows one round at her current level.
- **How-to card (`src/content/howto.ts`):** goal: "Make a picture of who ate what, from the cards." Steps: every level, "Tap a card to watch what we saw." and "Drag the food's badge onto the one who ate it. The arrow points to the eater."; level 2, "One arrow points the wrong way: drag the food's badge onto the eater to turn it."; level 3, "One food can have two arrows." Finish: "Tap the web button when it matches the cards; a matching web earns a sticker." Note: "This is a small model of what the cards show. A pair with no card isn't wrong in nature, it just isn't on our cards. Only the web button can count a miss."
- **Co-play:** one person taps a card and tells what they saw; the other makes the arrow; swap for the next card. **Off-screen:** draw three pictures on paper and join them with arrows from food to eater. No collecting, feeding or handling animals (the study's review boundary).
- **Registration:** ID `food-web-workshop`, name "Food Web Workshop", spoken title `game.food-web-workshop`, region `tinker-lab` (the science subject, as Habitat Helpers), skills `['science', 'models', 'reasoning']` (free strings), bands `['school']` with the `BandLevels` table above and `describeLevel` from the level table. Music is an ordinary island style, not silenced. Hub icon: three small creature circles joined by two arrows. Sticker art: a seeded case's three icons joined by arrows. Land: see [decision 3](#open-decisions).

### Voice

These lines go in `src/content/voice-script.ts`, under `web.*`.

| ID | Line |
| --- | --- |
| `game.food-web-workshop` | Food Web Workshop |
| `web.ask.make` | Watch the cards, then make arrows from each food to the one who ate it. |
| `web.ask.turn` | One arrow points the wrong way. Can you turn it around? |
| `web.ask.branch` | One food, two eaters. Make both arrows. |
| `web.card.r1` … `web.card.r6` | The six record lines in [the record table](#the-records-reviewer-checklist) |
| `web.name.<organism>` | The clover. / The dandelion leaves. / The caterpillar. / The snail. / The bunny. / The bird. |
| `web.arrow` | The arrow points to the eater. |
| `web.miss.reversed` | This arrow points the wrong way. Arrows go from the food to the one who ate it. |
| `web.miss.missing` | One of our cards has no arrow yet. |
| `web.miss.extra` | Our cards didn't show that one. |
| `web.hint` | Here's one. |
| `web.ready` | Tap the web button when it matches the cards. |
| `web.done` | Our food web! The arrows show where the food goes. |

## Check tier

The build is **new game / new interaction**: typecheck, unit tests (this game's rules plus the registry, lands, how-to and voice tests), and `npm run build`, because the registry and lands are shared. Then one browser case (`BROWSER_SUITE=foodweb`, a new case in `scripts/browser-check.mjs` with a README row): level 1 with one wrong Check (an extra arrow), then Undo and a correct web; level 3 with one requested hint, then the second arrow and Show our web. One portrait screenshot of level 2 after the turn, then `BROWSER_SUITE=fingerdemo FINGER_ONLY=food-web-workshop` (first and last level) and `BROWSER_SUITE=smoke SMOKE_ONLY=food-web-workshop`. No `world`, couch or offline suite. iPad touch, device speech and whether a child reads arrow direction as intended stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

### Expected files

`src/games/food-web-workshop/{index.ts, logic.ts, logic.test.ts, art.ts}`, `src/games/registry.ts`, `src/content/lands.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `scripts/browser-check.mjs`; at closeout README, GAMES, READY, this packet's status line, the ecosystems study, VERIFICATION and DEVICE-CHECKS.

## Open decisions

Each has a default. Decisions 1–3 are what the WAITING row asks the developer to confirm before the build.

1. **Records review (gates F2).** Default: the six records above, generic kinds, no species names. The developer reviews them, or names a reviewer, per the "Who reviews content?" call. A changed record changes only the table and its line; the model and tests stay.
2. **Identity.** Default: a new game, per [overlap](#overlap). The alternative, an Animal Snack or Habitat Helpers mode, is rejected because neither has a directed model to build or repair.
3. **Land.** Default: **Rainbow Meadow**, beside Habitat Helpers and Garden Grow, if `lands.test.ts` passes at every band and view counting whatever has landed there by then (11 games today; Seed Travelers defaults there and Ribbon Workshop falls back there, so it could be the 13th; Puzzle Peaks already holds 13). If the layout returns null, use **Barnyard** (9 today, 10 with Who Am I?). The region stays `tinker-lab`. Never Tinker Lab itself (12) and never shrink a target.
4. **Second input.** Default: drag only. Alternative: also allow tap the food's badge, then tap the eater, if the browser play or a device check shows drags between far stations are hard.
5. **Arrow direction.** Default: food → eater (where food and energy go), said aloud every time an arrow is made at level 1. Alternative "eater → food" ("eats") is rejected: it is what children often assume, but it reverses the convention later science uses.
6. **Help placement.** Default: hints only through the pause sheet's Show a hint, plus the free glow after two failed Checks. Alternative: a visible bulb button, if school players do not find the sheet.
7. **Later levels.** Study levels 4–6 and Meadow Plans need their own packets (study slices F7–F8); level 5 also needs the exploration-accounting decision. Existing IDs are never renumbered.
