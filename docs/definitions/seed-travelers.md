# Seed Travelers, levels 1–3 (definition)

Defined 2026-10-22 as slice **1** of the [life-science study](../deep-dives/subjects/life-science.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/life-science.md#seed-travelers-first-games-proposed-ladder), [experience notes](../deep-dives/subjects/life-science.md#experience-and-presentation) and [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#life-science-recommendations). Docs only: no game, ID registration, voice line or save field exists yet.

**Status: defined; the build (slice 2) waits on one developer call.** The [life-science row in WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) asks the developer to confirm the new-game identity and land fit before implementation. This packet gives a default for both ([decisions 1 and 2](#open-decisions)). Once the developer accepts them, slice 2 is a ready new-game build. The named-species review in that row does not gate these three levels, because their voice, card and art name no species ([decision 3](#open-decisions)).

**Fun action and purpose:** a seed sits on a little hill on the left, and a tray of soft earth waits on the right. She sends the seed across: a puff from a big bellows carries a fluffy seed through the air, or a fuzzy critter walks past with a hooky seed caught in its fur and brushes it off at the tray. At level 3 she has both seeds and both carriers, tries pairings, sees which ones travel and sends each seed across. The learning goal is **a seed's structure fits the way it travels**: fluff catches the wind, hooks catch on fur (Head Start P-SCI; NGSS 2-LS2-2, through a toy model; the [study's anchors](../deep-dives/subjects/life-science.md)). Trying a pairing that does not travel is an experiment, never a mistake.

## References

No new source was opened for this definition. The study's similar-games table applies. From it the build takes these ideas: the pictured cause and its result stay visible together, and a small authored table rather than a simulation decides every result. It rejects aiming, timed catches, a moving seed as a target, blow detection, and any growing or wildlife-feeding instruction.

## Overlap

Checked against `origin/main` at `058bf06e` (GAMES entries, `src/content/lands.ts`, the games' `index.ts`).

| Game | What it already owns | Why Seed Travelers is different |
| --- | --- | --- |
| Garden Grow (Rainbow Meadow, lap–pre-K) | Planting seeds by colour and count, then rain makes them grow | Garden Grow never moves a seed. Seed Travelers stops at arrival and shows no growth |
| Habitat Helpers (Rainbow Meadow, preschool–school) | A visitor comes when a garden meets its food, water and shelter needs | That is an animal's needs. Here an animal is a carrier, and the question is how a seed's structure meets its carrier |
| Ramp Race (Tinker Lab, pre-K–school) | Changing height and floor in a stated distance model; fair tests | Ramp Race measures how far. Seed Travelers has binary outcomes (arrived or stayed) decided by structure and carrier. Its fair-test rung (study rung 4) is not in this packet |
| Mail Carrier, Treasure Map | Moving to a chosen destination along a route | There the destination is the choice. Here the destination is fixed and the choice is which carrier suits which seed |

**Identity default: a new game.** Pairing a structure with a carrier and watching the trip is the action. No existing game has it.

## The model (`logic.ts`)

- **Units:** `plume` (the fluffy seed) and `burr` (the hooky seed). **Carriers:** `breeze` (the bellows) and `fur` (the critter).
- **The table:** `travels(unit, carrier)` is true for `plume`+`breeze` and `burr`+`fur`, false for the other two. That is the whole model. It omits wind strength, distance, chance, and whether the seed would ever grow. It is written as "in this game", never as the only way a real seed travels.
- **A level plan** is `{ units, carriers, finish }`. `finish` is `'button'` (level 1: a Finish control appears after the first arrival) or `'all'` (levels 2–3: the round ends when every unit is in the tray).
- **State:** each unit's place (`patch` or `tray`), the loaded unit (level 2 only: the burr on the critter's fur), the current selection (level 3: a unit, a carrier or neither), the trial record (the set of `{ unit, carrier, arrived }` already tried), and whether a trip is running.
- **Actions:** `trial(unit, carrier)` runs one trip. If `travels` holds the unit ends in the tray; if not, it ends on the patch. At level 1, `trial('plume','breeze')` from the tray first returns the plume to the patch (Replay), so a trip can repeat. At levels 2–3 a unit in the tray stays there and cannot be tried again. A trip in progress ignores every other action.
- **Hint target:** `hintAction(state)` is the next useful control. At level 1 it is the bellows, or Finish once a trip has arrived. At level 2 it is the burr, then the critter. At level 3 it is the first undelivered unit (in seeded order), then its compatible carrier.

## Levels

| Level | Name | First round | Ends |
| --- | --- | --- | --- |
| 1 | *A seed rides the breeze* | One plume on the patch, one bellows. Tap the bellows: it squashes on touch-down, the plume lifts, drifts in a wide arc and settles in the tray. The bellows becomes **Replay** (the plume floats back to the patch and the next tap sends it again) | After the first arrival a large **Finish** basket appears beside the tray and gently bobs. She can replay as often as she likes; tapping Finish ends the round |
| 2 | *A hitchhiker* | One burr on the patch, one critter waiting beside it. Tap the burr: it hops onto the critter's fur, which shows a close-up hooks-in-fur picture for a moment. Tap the critter: it walks right, brushes past the tuft of grass at the tray, and the burr drops off there | When the burr lands in the tray |
| 3 | *Try both* | A plume and a burr on the patch (seeded order), the bellows and the critter. Choose a seed and a carrier, **in either order**; as soon as both are chosen the trip runs. A pairing that does not travel ends with the seed back on the patch and a spoken reason. Each tried pairing fills a cell in the trial board | When both seeds are in the tray |

**Bands:** toddler `{ 1, 2 }`, preschool `{ 1, 3 }`, prek `{ 2, 3 }`. No `school` window yet: a school child plays the pre-K window through `playBand` until study rung 4 is defined and appended. No grownup window.

**What does not travel at level 3:** the burr and the bellows: the puff rocks the burr on the patch, and "It has no fluff to catch the wind." The plume and the critter: the critter walks off, the plume slides from its back onto the patch, and "It has no hooks to hold on." Both say what the seed lacks, not that the choice was wrong, and both end with the seed on the patch, ready again.

**Changes from the study's ladder**, written down so later packets do not go stale:

- **No undo at level 3.** A pairing that does not travel already puts the seed back on the patch, and a delivered seed is finished, so there is nothing to undo. The pause sheet's Start again resets the round.
- **Level 3 chooses in either order** rather than seed-then-carrier, so a child who taps the critter first is not told off. Tapping a carrier with nothing chosen selects it and asks "Which seed?" for free.
- **Level 2 moves the critter by tapping it,** not a separate Go button. The critter is the largest target on screen and is what moves. Tapping it before the burr is on says "Put the hooky seed on first" (free).
- **Level 3's trial board is a record, not a requirement.** The study's "record both outcomes" would force a known-bad trial. Any route that delivers both seeds completes the round, including two right pairings first time.

## Screen and controls

The design area is 1024×768 and the view expands the spare dimension, so the width is always at least 1024. The ground line is at `0.68 × view.h` in landscape and `0.62 × view.h` in portrait, so the extra portrait height goes to the sky.

- **Patch (left):** a grassy hillock centred at x = 260 on the ground line, high enough that the seeds sit above the pet's bottom-left square. Each seed's hit area is a 140×140 square centred on its drawing (the plume's head and fluff, the burr enlarged at about 90 units across). At level 3 the two seeds sit 150 units apart.
- **Bellows (left, above the patch):** 150×150, centred at (120, ground − 230), nozzle pointing at the patch. In portrait it stays at the same height above the ground, so it moves down with it, never near the top-left home button.
- **Critter:** a `CRITTERS` animal from `src/art/critter.ts`, chosen from a seeded short list of furry ones (bear, dog, bunny). It waits at x = 400 on the ground. Its hit area is a body-centred `Circle` of radius 110 on screen, divided by its scale (the pitfalls note on small critters). After a trip it walks off right and a new one strolls in from the left behind the patch.
- **Tray (right):** a low wooden tray of earth with a tuft of grass, centred at `view.w − 220` on the ground. A delivered seed rests in it. At level 1 the **Finish** basket appears above it, 140×140.
- **Trial board (level 3, top centre):** a 2×2 grid of pictures, rows = the plume and the burr, columns = the bellows and the critter. An empty cell is blank; a tried pairing shows the tray (arrived) or the hill (stayed). It is not touchable and is read by picture alone, never by colour.
- **Selection:** a chosen seed lifts and gets a soft ring; a chosen carrier glows. Tapping the chosen thing again unchooses it. Choosing a second seed (or carrier) swaps the choice.

**Input:** ordinary taps through `onTap`, with touch-down feedback (the bellows squashes, a seed brightens, the critter looks up). No drags, so there is no custom pointer handling to cancel. A trip is a scene-owned tween (`ctx.tw`) whose position is recomputed from the current layout each frame, so a resize mid-trip keeps the seed on its path. Every listener is through `onTap` on objects the scene destroys; there are no game-owned timers or render textures.

## Accounting, help and finishing

- **No misses at levels 1–3.** Every trial is an experiment, including a pairing that does not travel, an early critter tap and an empty-handed carrier tap.
- **Spoken feedback is free:** each arrival names the pairing ("The wind carried the fluffy seed!"; "The hooky seed caught on the fur, and fell off at the tray!"), each stay names what the seed lacks, and tapping a seed names it.
- **A free glow after two stays in a row:** at level 3, after two pairings in a row that do not travel, the compatible carrier for the next undelivered seed (or that seed, if nothing is chosen) glows until used. It counts nothing, because nothing before it was a miss.
- **Help on request:** the pause sheet's **Show a hint** (`askForHint`) glows `hintAction`'s target and says "Try this." It counts **one hint**, at most once per support task: the trip at level 1, the trip at level 2, and each seed's delivery at level 3. A request while a glow is already up counts nothing.
- **Finish:** levels 2–3 end on the last arrival; level 1 on Finish. A short pentatonic rise plays on each arrival (`src/audio/notes.ts`), then the game calls `ctx.finish({ misses: 0, hints })`. Supported completion earns the same sticker. No timer, no score.
- **Adaptation:** the shell's ordinary rule. With no misses, two rounds without a requested hint step up within the band.
- **Restart (`restart`):** puts every seed back on the patch and clears the trial board. Hints already counted stay.

## Rule tests (`logic.test.ts`)

1. The table: exactly `plume`+`breeze` and `burr`+`fur` travel.
2. Conservation: after any sequence of actions from any level's start (enumerated; the states are few) each unit is in exactly one place, and no unit is ever duplicated or lost.
3. Every level's start can finish, and `hintAction` followed repeatedly reaches the end in the fewest trips (1, 1 and 2).
4. Level 3 accepts every delivering sequence: both orders of the two right pairings, and either with any number of stays first.
5. A stay leaves the unit on the patch and the trial recorded; repeating a recorded pairing does not add a board cell.
6. Level 1's Replay returns the plume to the patch and the next trial delivers it again; Finish is unavailable before the first arrival.
7. Level 2: the critter before loading changes nothing; loading then the critter delivers.
8. Accounting: no action at levels 1–3 adds a miss; a requested hint counts once per support task and not while a glow is up; the two-stay glow counts nothing.
9. Seeded rounds: seeds 0–199 give a valid unit order and critter, and the same seed gives the same round.
10. Every spoken line the game uses exists in `voice-script.ts`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch`, `touchDemo`):** level 1 taps the bellows, waits for the arrival and taps Finish. Level 2 taps the burr, then the critter. Level 3 first tries one pairing that does not travel (the plume and the critter), then follows `hintAction` to deliver both. The demonstration window shows one round at her current level.
- **How-to card (`src/content/howto.ts`):** goal: "Send each seed across to the tray, and find out how each one travels." Steps: level 1, "Tap the bellows to blow the fluffy seed." and "Tap the basket when you're done."; level 2, "Tap the hooky seed, then tap the critter."; level 3, "Choose a seed and a helper, in either order." and "If it stays, try another helper." Finish: "Every seed in the tray earns a sticker." Note: "A seed that stays is a good test, not a mistake. This is a toy model: real seeds travel in many ways."
- **Co-play:** one person points to where they think the seed will end up (the hill or the tray) and the other taps the carrier; then swap. **Off-screen:** draw a seed together and talk about how it might travel. No collecting, growing or outdoor instruction (the study's review boundary).
- **Registration:** ID `seed-travelers`, name "Seed Travelers", region `tinker-lab` (the science subject, as Habitat Helpers), bands `['toddler', 'preschool', 'prek']` with the `BandLevels` table above, and `describeLevel` from the level table. Music is an ordinary island style, not silenced. The hub icon is a dandelion-style seed head. The sticker art is a plume seed in flight, its sky colour seeded. Land: see [decision 2](#open-decisions).

### Voice

These lines go in `src/content/voice-script.ts`, under `seeds.*`.

| ID | Line |
| --- | --- |
| `game.seed-travelers` | Seed Travelers |
| `seeds.ask.breeze` | Tap the bellows to blow the fluffy seed to the tray! |
| `seeds.ask.fur` | Tap the hooky seed, then tap the furry friend to carry it! |
| `seeds.ask.both` | Can you get both seeds to the tray? Choose a seed and a helper. |
| `seeds.name.plume` / `.burr` | The fluffy seed. / The hooky seed. |
| `seeds.which.seed` / `.helper` | Which seed? / Which helper? |
| `seeds.arrived.breeze` | The wind carried the fluffy seed! |
| `seeds.arrived.fur` | The hooky seed caught on the fur, and fell off at the tray! |
| `seeds.stayed.breeze` | It stayed. It has no fluff to catch the wind. |
| `seeds.stayed.fur` | It slid off. It has no hooks to hold on. |
| `seeds.load.first` | Put the hooky seed on first. |
| `seeds.finish` | Tap the basket when you're done. |
| `seeds.again` | Again! Tap the bellows. |
| `seeds.hint` | Try this. |
| `seeds.done` | Both seeds made it! |

"Helper" stands for the bellows or the critter in speech; it is never a written label.

## Check tier

The build is **new game / new interaction**: typecheck, unit tests (this game's rules plus the registry, lands, how-to and voice tests), and `npm run build`, because the registry and lands are shared. Then one game-specific browser case (`BROWSER_SUITE=seeds`, a new case in `scripts/browser-check.mjs` with a README row): level 1 with one Replay and Finish; level 3 with one pairing that stays, one requested hint, then both deliveries. One portrait screenshot of level 3 with a filled trial board, then `BROWSER_SUITE=fingerdemo FINGER_ONLY=seed-travelers` (first and last level) and `BROWSER_SUITE=smoke SMOKE_ONLY=seed-travelers`. No `world`, couch or offline suite. iPad touch, device speech and whether a young child connects structure with the journey stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

### Expected files

`src/games/seed-travelers/{index.ts, logic.ts, logic.test.ts}`, `src/games/registry.ts`, `src/content/lands.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `scripts/browser-check.mjs`; at closeout README, GAMES, READY, this packet's status line, the life-science study, VERIFICATION and DEVICE-CHECKS.

## Open decisions

Each has a default. Decisions 1 and 2 are the developer's confirmation the WAITING row asks for before the build.

1. **Identity.** Default: a new game, per [overlap](#overlap). The alternative is a Garden Grow mode, rejected because Garden Grow's action is planting and growing in place, and this packet deliberately shows no growth.
2. **Land.** Default: **Rainbow Meadow**, its twelfth game (Garden Grow and Habitat Helpers live there), if the lands layout test passes at every band and view. If it returns null, use **Barnyard** (nine games), where the critter carriers fit. The region stays `tinker-lab`. Never shrink a target.
3. **Species naming.** Default: the voice, card and art say only "fluffy seed" and "hooky seed", drawn as stylized seed heads (a plume like a dandelion's, a round hooked burr), with no species named. That keeps the study's botanical review out of levels 1–3. Naming dandelion and burdock, or adding a third species (the study's floating rung 5), waits on that review.
4. **The free two-stay glow.** Default as specified: it counts nothing, because stays are experiments. The alternative is no automatic glow at all, leaving only the requested hint. Choose that if the browser play shows the glow giving the answer away before she tries.
5. **School window.** Default: none until study rung 4 (*Change one thing*) is defined; then append it as level 4 with a `school` window starting there. Existing IDs are never renumbered.
6. **Later rungs.** Study rungs 4–7 (one-variable comparison, a floating fruit, a two-patch plan and an evidence mystery) need their own definitions (study slice 6), one rung per session.
