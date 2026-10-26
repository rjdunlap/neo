# Weather Wardrobe deep dive

*ID `weather-wardrobe` · bands lap, toddler, preschool, pre-K · levels 1–7 on 2026-10-17 (the tracker's "6" predates level 7) · session `claude/dive-weather-wardrobe` ([PR #538](https://github.com/rjdunlap/neo/pull/538))*

## The game today

Sun, rain or snow fills a big sky over grass; the pet (large, centre stage, the corner guide steps out) gets dressed. The action is choosing what suits the weather; the learning purpose is weather words, everyday reasoning (what is it for?) and, at the top, planning for two weathers and revising an outfit after a forecast change. Code: `src/games/weather-wardrobe/index.ts`, `logic.ts`, `logic.test.ts`, `art.ts`; [GAMES.md](../GAMES.md#weather-wardrobe); how-to card `'weather-wardrobe'` in `src/content/howto.ts`; voice lines `weather.*` in `src/content/voice-script.ts`; land Cozy Village (`src/content/lands.ts`); browser suites `FOURTH_ONLY=weather` and `wardrobe7` ([README](../../README.md#browser-checks)).

| Level | Plan | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `play`: tap the sky, the pet dresses itself; ends after 6 taps once all three weathers were seen | lap 1–2 | Nothing to get wrong: each sky tap steps sunny → rainy → snowy and the pet changes |
| 2 | `pick`, 1 of 2, 3 rounds | lap, toddler 2–4 | Which of two things suits the weather |
| 3 | `pick`, 1 of 3 | toddler, preschool 3–5 | The same with one more distractor |
| 4 | `all`, 2 of 4 | toddler, preschool, pre-K 4–7 | Find both things that suit it |
| 5 | `all`, 3 of 5 (sunny: 2, it has only two items) | preschool, pre-K | Find everything |
| 6 | `trip`, 4 of 6, 2 rounds; a forecast card shows weather A → B; items fly into a suitcase | pre-K | Two of each weather's things, in any order |
| 7 | `change`, 3 rounds: the pet wears weather A; tap each worn item to take it off, then dress for B | pre-K | Take off, then choose for the new weather |

**Content pools.** Three weathers (`WEATHERS`) and eight items, each belonging to exactly one weather (`ITEMS`): sunny 2 (sun hat, sunglasses), rainy 3 (raincoat, umbrella, rain boots), snowy 3 (warm hat, scarf, mittens). Distractors always come from other weathers; consecutive rounds never repeat a weather (rule-tested). One grass backdrop that changes with the weather, one pet. The sticker (`wardrobeArt`) picks a weather and one of its items from the same pools.

**Accounting.** Level 1 has no misses. Levels 2–7: a wrong item is a miss with a boing, a nudge and the spoken reason ("A scarf is for snowy days. Try another!"); the second wrong in a row counts one hint, says "Try the glowing one!" and rings a fitting item; a right choice resets the count. At level 7 the tray is hidden while she undresses, so the `weather.change.remove.first` line ("First, take off…") could never play; slice 1 removed it (gap 9).

**Known gaps found reading the code (1, 4 and 9 fixed by slice 1, 2026-10-21, and 5 by slice 3, 2026-10-22; the rest not fixed).**

1. **(Fixed in slice 1.) The level-7 card was wrong.** The how-to's pack step is `{ from: 6, … }` with no `to`, so the level-7 card also says to pack for a trip. It should be `{ from: 6, to: 6 }`.
2. **Level 7 has no real decision when undressing.** Every worn item belongs to the old weather, so "take off the clothes that do not fit" always means take off everything. A real "keep what still fits" round needs an item that suits two weathers (rain boots in snow), which breaks the one-weather-per-item rule and its tests (decision 1).
3. **The lap window holds level 2,** a two-choice round with boings and counted misses. For a child about one, the only lap level without a wrong answer is the sky toy.
4. **(Fixed in slice 1.) Level 1 ignored most touches.** Only the sky above 62% of the height answers. The grass and the worn clothes do nothing, and the pet only giggles and repeats the instruction. Nothing is named when she touches it, so the vocabulary goal rests on the weather words alone.
5. **(Fixed in slice 3.) A miss did not show why.** The boing and the spoken rule are the whole consequence; nothing on screen shows what a sun hat does in snow.
6. **The trip never pays off.** At level 6 items go into the suitcase and the round ends; the pet never goes on the trip or uses them.
7. **"Everything" means different amounts.** At level 5 sunny has only two items, so "find everything" is two in sunny rounds and three otherwise; the pools are small enough that rounds repeat quickly.
8. **The grown-ups' page shows `{name}`** in this game's `offScreen` line: already recorded as a shell bug in the [off-screen study](subjects/off-screen-companions.md); not re-diagnosed here.
9. **(Fixed in slice 1: line and branch removed.) A dead voice line.** `ask()` hides the tray tiles in change mode and `resize()` skips the tray during undressing, so the `choose()` branch for the remove phase is unreachable; slice 1 drops it or shows a dimmed tray that answers with it.

**Couch, journal, picnic.** Not in couch play, no journal entry, no story step. Recorded checks: `wardrobe7` and `fingerdemo` (2026-10-10, [coverage summary](../VERIFICATION.md#coverage-summary)). Person checks: none recorded. `weatherIcon` is imported by Lemonade Stand (`src/games/lemonade-stand/art.ts`), which draws its own cloudy icon.

## Similar games

Opened pages are linked; *search summary* marks a page seen only through a search result; *recalled* marks what was not checked at a source this session.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| JumpStart Baby, Dress Teddy (*recalled*; already in the [IDEAS reference table](../IDEAS.md)) | 1998 baby CD-ROM | Dress the bear for snow or sand; later editions name the body part each garment goes on | Naming each garment and where it goes; the bear reacts | — |
| Sago Mini Babies Dress Up ([BridgingApps](https://bridgingapps.org/bridgingapps-reviewed-app-sago-mini-babies-dress/), opened) | Toddler free dress-up | No stages: dozens of costumes, hundreds of combinations, funny reactions | Every item can go on and the character reacts: a misfit is funny, not wrong (lap entry 8) | No goal at all; Weather Wardrobe keeps one clear reason per round |
| Dress Up for the Seasons ([Kids Academy](https://www.kidsacademy.mobi/games/dress-up-for-the-seasons/), opened) | Educational web game, 2–4 | Scenes: harsh winter, rain, hot summer, cold and foggy; items include sweaters, sneakers, tank tops | A wider wardrobe per weather; positive feedback | Its page names no progression or wrong-choice handling; fog-plus-cold mixes two ideas a toddler cannot see |
| Daniel Tiger's *Choose the Right Clothes* and *A Snowy Day* ([PBS video](https://www.pbs.org/video/daniel-tigers-neighborhood-choose-right-clothes-game/), *search summary*; the LearningMedia mirror returned 404) | Pre-K/K live-action game and episode | Outfits for snow, the pool, camping, the gym; Daniel learns to dress for the cold instead of his costume | The *reason* told through a character who feels the consequence | — |
| Weather by Tinybop ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/weather-by-tinybop), opened) | Open sandbox, 6+ | Make clouds, change heat and airflow, build storms; no guidance in the app | Weather as a thing she *makes* (level 1 already) | No guidance (reviewers found children lost); a storm destroying a house |
| iDress for Weather ([Easterseals](https://eastersealstech.com/2016/11/04/am208-idress-weather-app), opened) | Independence tool | Grown-up sets what counts as hot, warm, cool, cold and really cold | Temperature as a second axis beside sky (decision 3) | Real local forecasts and per-person thresholds: not a child's game |
| Weather forecaster dress-up centre ([Pre-K Pages](https://www.pre-kpages.com/whats-the-weather-dramatic-play-dress-up-center/), opened) | Classroom dramatic play | Clip a weather card *and* a temperature card, then dress; combinations like windy-and-cool, thunderstorm-and-warm | Pairing a sky with a temperature; windy as its own weather with a scarf and jacket; putting clothes back | — |
| Pokémon GO weather ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Weather_(GO)), *search summary*, 403 on fetch) | Creature collecting | Seven weathers (sunny, partly cloudy, cloudy, windy, rainy, snow, fog), each favouring some creature types | Weather that changes who visits (rework decision 5), driven by the game's own sky | Real-world location and clock weather; boosts and spawn chasing |
| Animal Crossing: New Horizons ([KeenGamer winter clothing guide](https://www.keengamer.com/articles/guides/animal-crossing-new-horizons-winter-clothing-guide/), *search summary*) | Life sim | Seasonal clothing; villagers carry umbrellas in rain | Friends who visibly use the right thing in the weather | Clothing sold only in a season (expiring windows), real-clock weather |
| Felt-board weather bear (*recalled*) | Circle-time physical play | Teacher shows the day's weather, children put felt clothes on the bear | The off-screen version (co-play line) | — |

**Learning references.** NGSS K-ESS2-1, "Use and share observations of local weather conditions to describe patterns over time" (examples: sunny, cloudy, rainy, warm, windy) and K-ESS3-2, "the purpose of weather forecasting to prepare for, and respond to, severe weather" ([K-ESS2-1](https://www.nextgenscience.org/pe/k-ess2-1-earths-systems), [K-ESS3-2](https://www.nextgenscience.org/pe/k-ess3-2-earth-and-human-activity), opened). Levels 6–7 *prepare for a forecast*; they never teach severe weather, which stays out. For dressing and routines the [routines study](subjects/routines-self-care.md) already cites Head Start ELOF IT-PMP 9 and P-PMP 4: a correct screen answer is not evidence that she can dress herself.

## What makes sense here

Weather Wardrobe is the island's one *forecast-and-clothing* game. The subject studies agree on the boundaries: clothing stays here ([weather-water](subjects/weather-water.md)); weather records belong to Day by Day; preparing and packing props belongs to the proposed Ready for Adventure ([routines](subjects/routines-self-care.md)); a Venn of overlapping sets belongs to Critter Sort. The one-weather-per-item rule is a toy convention, not clothing advice; anything that relaxes it must stay plainly playful.

The long-term arc: **lap** makes the weather and sees the pet change, then tries things on and watches what happens (cause and effect, no wrong answers); **toddler** picks the one thing for a weather and reads a weather from an outfit; **preschool** finds everything that fits; **pre-K** plans for two weathers, dresses two friends for two places and revises after a forecast change; **school** only if decision 2 opens it, with items that fit more than one weather (pack light) and temperature as a second axis.

Fits: more items per weather, wind as a fourth weather (a hat that blows off is a funny consequence), a miss that briefly shows what happens, a trip that actually happens, a reverse level where the outfit is the clue, friends with their own destinations. Does not fit: fog (its only clothing rule is "be seen", a safety claim), real local forecasts or the device clock, severe weather, seasonal or expiring items, getting cold or ill as a penalty, a fashion score.

Rework fit ([creature-world brief](../rework/README.md)): the brief's long-term collection includes clothes, and RW06 plans a dressing action that saves one accessory. Weather wear earned through play could join that wardrobe permanently, and the game's sky could bring a weather-loving visitor. Both depend on RW05/RW06 and on whether the code-drawn clothing (`Critter.attach` coordinates) carries over to the illustrated creatures decided after RW02b, so they are decisions, not slices.

## Experience and presentation

**First unsupported action.** At lap, a tap anywhere on the sky changes it with a sound (rain splash, snow sparkle, three sun bells) and the pet dresses itself. At toddler, tapping the one item that suits the weather.

**Touch, consequence, readiness.** Today the sky, tray tiles and (at 7) worn clothes answer. Proposed: every touch at level 1 answers (the grass splashes a puddle, crunches snow or puffs a flower; a worn item wiggles and is named, "Mittens!"); a wrong item at 2–7 goes on for under a second and shows its consequence before it hops back to the tray.

**Art and sound example.** The misfit consequence with existing code: sunglasses in rain get three small `swatch.blue.fill` drop circles drawn on the lenses as a child `Graphics` of the attached item; mittens in sun get two sweat drops (a `poly` teardrop) by the pet's head and `setMood('calm')` with a fanning wiggle; a sun hat in snow gets a white `puffs()` cap that grows on the brim, a shiver (a fast ±4 unit x-tween on the pet) and a descending three-note pentatonic "brr" from `src/audio/notes.ts`. Then the item tweens back to its tile with `ease.outBack`.

**Variety on replay.** Seeded weather order and items (already); proposed: more items per weather, wind, the trip's two scenes, friends at level 10.

**Reasoning versus reading, memory, motor.** Every choice is a picture, every rule is spoken; no reading. Memory load is low: the weather stays visible all round (the forecast card at 6, the new sky at 7). Targets are 140-unit tiles; worn items have at least 130-unit hit areas.

**Supported ending and stopping.** Glow after two misses, one sticker per completed round, three short rounds. Proposed lap entry 8 finishes on its own when the fitting item is on.

**Co-play.** A grown-up looks out the real window with her (the existing co-play tip). Level 10 can be shared: each person dresses one friend. Solo stays complete.

**For a person or device to judge.** Whether a one-year-old reaches for the sky, the pet or the clothes first; whether the misfit consequences read as funny rather than unkind (a shivering pet must not look sad); whether wind is visible to a toddler without a label; whether the boing upsets a lap child (another reason for entry 8).

## Proposed ladder

### Fresh content inside existing levels

- **Every touch counts at level 1, and the card fixed** (gaps 1, 4): the grass answers per weather, worn items wiggle and are named (`weather.name.<item>` lines), the pet hops; the how-to's pack step becomes `{ from: 6, to: 6 }`. No new counting.
- **More items, one slot each** (gap 7): sunny + sandals, rainy + rain hat, snowy + earmuffs and a puffy coat (red, quilted lines, distinct from the yellow raincoat). Add a `SLOTS` map (head, eyes, neck, body, hands, feet, held) so an outfit never puts two things in one slot: "everything" at 5 and the remove/dress sets at 7 become one item per occupied slot. Sunny reaches three, so "find everything" is always three at level 5. Pin the sticker and hub icon to the original eight items and three weathers, as Market Stall pinned its six fruits. Rule tests: no outfit has two items in a slot; level 5 always needs 3; distractors still from other weathers; the sticker pool is unchanged.
- **A miss that shows why** (gap 5): the art example above, still counted as a miss with the existing spoken reason and hint. At level 7's undressing, nothing changes (it has no misses). Rule test: each weather × item misfit has a consequence kind (`cold`, `hot`, `wet`, `blown`).
- **The trip happens** (gap 6): after packing at level 6 the suitcase opens in weather A, the pet puts on A's things (hop and pop, `put()`), the scene changes to B and the pet changes; no extra choices. Rule test: the trip plays each weather's packed items in forecast order.
- **Wind** (a fourth weather; the [IDEAS](../IDEAS.md) row): a moving-cloud sky, leaves blown sideways in `update()`, the pet's ears tilt. Items: a kite (held) and a windbreaker (green, hood strings). Couplings: `weatherIcon` and `drawWeather` need a windy branch (unknown weathers fall through to snow today); the level-1 finish uses `seen.size === WEATHERS.length`, so it becomes four weathers and seven taps; trip weather pairs grow from 3 to 6; voice `weather.windy`; Lemonade Stand keeps its own three weathers. A sun hat in wind is the `blown` misfit (it lifts off and floats back).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *Try it on* | lap entry (order `[1, 8, 2]`, `entryLevels: [8]`) | Rain falls on the pet; two big tiles: umbrella and sunglasses | Which to try; anything goes on | No misses or hints: the misfit plays its funny consequence and slides off; the fitting item stops the weather on the pet (drops bounce off the umbrella) and she cheers. After 6 quiet seconds the fitting tile wiggles (not a hint). Three rounds, one per weather | Each round has exactly one fitting item and one misfit with a consequence kind; weathers differ round to round | Needs the misfit slice. Bot taps the fitting tile; how-to step `{ from: 8, to: 8 }`; voice `weather.try` |
| 9 | *Which sky?* | toddler (order `[2, 9, 3, 4]`), preschool (`[3, 9, 4, 5]`) | The pet stands in a grey, weatherless scene wearing an umbrella and rain boots; three big sky cards (sun, rain, snow) | Which weather the outfit is for (the reverse of 2–5) | A wrong sky plays over the pet for a moment with its misfit consequence, then clears; a miss; two misses glow the right card and count one hint | The outfit fits exactly one offered weather; the three cards are distinct; no two rounds repeat a weather | `weatherIcon` at 160 units on tiles; bot taps the right card; voice `weather.which` |
| 10 | *Two friends, two places* | pre-K (order `[4, 5, 10, 6, 7]`) | Two island friends (`CRITTERS`) each stand under a sign with their weather (a sunny beach, a snowy hill); four items in the tray | Who needs each item: drag it to that friend | A wrong friend hands it back with the spoken reason; a miss; two misses glow one item and its friend, one hint | Each friend's weather differs; every item fits exactly one of the two friends; each friend gets at least one | A new interaction (`src/engine/drag.ts`); friend layout must keep the pet corner clear; bot drags; links the roadmap's "consider what a friend might need" horizon |

Gated levels, kept in the write-up only: **11 *Keep what still fits*** (pre-K, decision 1): the weather turns from rain to snow; boots and the raincoat suit both, so she takes off only what no longer fits and adds the rest; taking off something that still fits is a miss. **12 *Pack light*** (school, decisions 1 and 2): a small bag holds three things for a trip through rain and snow; any set that covers both weathers is accepted, so boots that suit both earn their place. **13 *Warm or cold?*** (school, decision 3): a thermometer picture beside the sky; a cold sunny day needs a sun hat *and* a scarf.

### Younger-band openings

Level 8 *Try it on* is the lap opening (above). Level 1 already serves lap; the every-touch slice makes it a better first toy. The lap window keeps 2 after 8 for a grown-up's lap.

### Easier entries and levels between existing ones

8 and 9 are easier entries placed with the built `order` support (8 is a high ID placed first in lap's order and declared in `entryLevels`, so when a birthday moves her to toddler, which does not list 8, a saved 8 starts at toddler's easiest level; 9 sits between 2 and 3 in toddler and preschool). No saved level is renumbered. Whether toddler should also start at 8 is part of decision 4.

### Left out on purpose

Fog (its clothing rule is "be seen", a safety claim the subject studies keep out); severe weather; real local forecasts or the device clock; seasonal or expiring clothing; the pet getting ill or sad from wrong clothes; a fashion score or rating; packing non-clothing props (Ready for Adventure's job); weather tallies (Day by Day); a three-hoop or two-hoop Venn of weathers (Critter Sort); dressing for a culture or century ([daily-life study](subjects/daily-life-long-ago.md)); couch play (no natural face-off).

## Decisions for the developer

**Decided 2026-10-23 (on the developer's delegation):** the leans are adopted: some items suit two weathers through an explicit table, so 11 *Keep what still fits* is a real revision; a school window with 12 *Pack light* follows it; 13 *Warm or cold?* is a picture thermometer at school, pictures only; *Try it on* 8 stays lap only until a device check shows a toddler wants it; the rework hooks wait on RW05/RW06.

1. **Items that suit two weathers** (rain boots in snow, a raincoat in wind): relaxing the one-weather rule makes level 7 a real revision (11 *Keep what still fits*) and opens *Pack light*. Lean: yes, with a small explicit table and a rule test that every item's weathers are listed.
2. **A school window** (12 *Pack light*, 13 *Warm or cold?*). Lean: yes after decision 1; school would play 6, 7, 11, 12.
3. **Temperature as a second axis** (a picture thermometer, no numbers below zero until the `integers` subject asks). Lean: pictures only (cold, cool, warm, hot), school.
4. **Toddler start at 8** as well as lap, after a person watches a toddler with it. Default: lap only.
5. **Rework hooks**: (a) each weather's items join the companion's dress-up wardrobe permanently the first time she completes that weather (RW06); (b) the chosen sky brings a weather-loving visitor creature that can be met (RW05); (c) a wind step in the Windy Picnic story. All wait on RW05/RW06 and on whether code-drawn clothing carries to the illustrated creatures.

## Build slices, in order

**Routine batching (developer, 2026-10-21):** the numbered slices below are scope/dependency substeps. [READY](../READY.md) dispatches related substeps together using the [`weather-wardrobe` batch plans](../GAME-BATCHES.md#batch-plans): one declared batch per worker/PR, prerequisite substeps first, with existing gates and special checks preserved. Do not create a new session for each numbered level in a claimed batch.

1. **Every touch counts at level 1, and the level-7 card** (existing-game fix): grass per weather, worn items named, `{ from: 6, to: 6 }` on the pack step, the dead remove-phase line dropped or wired (gap 9). Checks: typecheck, the rule and how-to tests, one filtered play (`BROWSER_SUITE=fourth FOURTH_ONLY=weather`), `fingerdemo` at 1. *(Built 2026-10-21, [PR #682](https://github.com/rjdunlap/neo/pull/682): the grass answers per weather, worn items wiggle and are named, the pack step is `{ from: 6, to: 6 }`, the dead remove-phase line was dropped; closes gaps 1, 4 and 9. Build note in the [archive](../archive/COMPLETED-2026-10-09.md#weather-wardrobe-every-touch-counts-at-level-1-and-the-level-7-card-slice-1-2026-10-21).)*
2. **More items, one slot each, sticker pinned** (content in existing levels): sandals, rain hat, earmuffs, puffy coat, `SLOTS`, level 5 always three. Checks: typecheck, rule tests, one screenshot of each new item worn, `fingerdemo` at 5. *(Built 2026-10-21, [PR #755](https://github.com/rjdunlap/neo/pull/755): the four items, `SLOTS` and `outfitFor`, level 5 always three, sticker pinned to the original eight; the puffy coat is blue, not red, because a red coat vanished under the red scarf. Build note in the [archive](../archive/COMPLETED-2026-10-09.md#weather-wardrobe-more-items-one-slot-each-slice-2-2026-10-21).)*
3. **A miss that shows why** (existing-game change on the same interaction): misfit consequences, the item hops back; accounting unchanged. Checks: typecheck, rule tests, one filtered play with one wrong answer at 2 and 7 (`wardrobe7`). *(Built 2026-10-22, [PR #852](https://github.com/rjdunlap/neo/pull/852), batched with slice 4; closes gap 5. Build note in the [archive](../archive/COMPLETED-2026-10-09.md#weather-wardrobe-batch-1-a-miss-that-shows-why-and-lap-entry-8-try-it-on-slices-34-2026-10-22).)*
4. **Lap entry 8 *Try it on*** (new level, needs 3): order `[1, 8, 2]`, `entryLevels: [8]`. Checks: new-interaction tier (scripted play at 8 and 1, one portrait screenshot), `fingerdemo` at 8. *(Built 2026-10-22, [PR #852](https://github.com/rjdunlap/neo/pull/852); see slice 3's build note.)*
5. **The trip happens** (level 6 payoff). Checks: typecheck, rule tests, one play of 6. *(Built 2026-10-23, [PR #876](https://github.com/rjdunlap/neo/pull/876), batched with slice 6: after packing, the suitcase unpacks and the pet wears each weather's two packed items in forecast order. Build note in the [archive](../archive/COMPLETED-2026-10-09.md#weather-wardrobe-batch-2-the-trip-happens-and-level-9-which-sky-slices-5-6-2026-10-23).)*
6. **Level 9 *Which sky?*** in toddler and preschool (after 3: its wrong sky uses the misfit consequences). Checks: typecheck, rule tests, play of 9 with a wrong sky and a hint, `fingerdemo` at 9. *(Built 2026-10-23, [PR #876](https://github.com/rjdunlap/neo/pull/876); see slice 5's build note.)*
7. **Wind** (fourth weather, kite and windbreaker, `blown` misfit; after 2 and 3, which supply the slot map and the consequences). Checks: typecheck, rule tests, plays of 1 and 6, one screenshot; Lemonade Stand's forecast icons unchanged (one screenshot).
8. **Level 10 *Two friends, two places*** (new drag interaction, pre-K). **Claimed** by worker `01a177ff-2110-7eb2-b0b7-9db1de9f761e`, branch `codex/weather-wardrobe-two-friends`: only batch 3/slice 8; expected files `src/games/weather-wardrobe/{logic.ts,logic.test.ts,index.ts,friends.ts}`, voice/how-to, browser harness and documentation. Wind and levels 11–13 excluded. Checks: new-interaction tier, `fingerdemo` at 10.
9. *(Decisions 1–2)* Items for two weathers, 11 *Keep what still fits*, 12 *Pack light* and the school window.
10. *(Decision 3)* 13 *Warm or cold?*
11. *(Decision 5)* Wardrobe unlocks, weather visitors and the Windy Picnic step with the rework.

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
