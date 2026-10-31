# Habitat Helpers deep dive

*ID `habitat-helpers` · bands preschool, pre-K, school · levels 1–6 on 2026-10-31 · session `claude/dive-habitat-helpers`, [PR #1075](https://github.com/rjdunlap/neo/pull/1075)*

## The game today

Bunny and Duck visit a garden in Tinker Lab (`region: 'tinker-lab'`; the [GAMES entry](../GAMES.md#habitat-helpers)) when it supplies food, water and shelter that work for them. She taps garden cards from the tray into the garden's spaces (a tap takes one out again) and taps the green gate to test it. **Learning purpose:** living things need food, water and shelter from their place, and one place can meet several needs ([NGSS K-ESS3-1](https://www.nextgenscience.org/pe/k-ess3-1-earth-and-human-activity), [K-LS1-1](https://www.nextgenscience.org/pe/k-ls1-1-molecules-organisms-structures-and-processes)). The model is stated as a small one: it does not claim these are an animal's only needs.

| Level | Plan name | Band window | What she decides | Pieces offered / spaces | Rounds |
| --- | --- | --- | --- | --- | --- |
| 1 | Place Bunny's food, water and shelter, then open the garden | preschool | Put the three obvious pieces in | 3 / 3 | 1 |
| 2 | An obvious three-piece habitat for Bunny, then Duck | preschool, pre-K | The same for each visitor | 3 / 3 | 2 |
| 3 | Food, water and shelter among distractors | preschool, pre-K | Which three of five serve this visitor | 5 / 3 | 2 |
| 4 | Inspect a prepared habitat and predict who will come | pre-K, school | Bunny or Duck, from what each piece gives (touching a piece says so) | 2 prepared | 3 |
| 5 | A multipurpose piece fits each habitat into two spaces | pre-K, school | The berry hedge or the pond with reeds | 5 / 2 | 2 |
| 6 | One three-piece habitat for Bunny and Duck together | school | A shared pond, the hedge and seed grass | 6 / 3 | 1 |

Ranges: preschool 1–3, pre-K 2–5, school 4–6 (`LEVELS` in `index.ts`, plain `min..max`, no `order`).

**Content pools.** Two visitors (`VISITORS`, drawn with the shared `Critter` rig) and seven pieces (`PIECES`): clover, shallow pool, brush pile, seed grass, tall reeds, berry hedge, pond with reeds. Each level's piece list is fixed; only its order and the visitor order are shuffled. Level 4 always shows the same two prepared pairs. So a replay looks almost identical: the content is the thinnest part of the game.

**Accounting.** An incomplete test and an unmatched prediction are free observations; after two incomplete tests the pieces of the nearest working arrangement glow and one hint counts. `misses` is declared but **never incremented**, so every round reports zero misses and adaptation runs on hints alone: two rounds without the glow step her up. That is honest for experiments, but it means nothing in the game is a checkable claim yet.

**Other couplings.** Two journal entries (Bunny habitat, Duck habitat), filed only for visitors actually seen. A ghost-finger bot (`habitatTouch`) and a tested rule for every generated round. Music `STYLES.paint`. No couch entry. No person observation recorded in [OBSERVATIONS](../OBSERVATIONS.md). Two study handoffs land here: the ecosystems study's **Patch Change** ([F3](subjects/ecosystems.md#bounded-follow-ups)) and the oceans study's **shore zones** ([oceans](subjects/oceans.md), principle 5h); and the roadmap's [younger-band openings](../ROADMAP.md#more-to-play-in-every-band) (item 18) names a toddler opening.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Viva Piñata](https://en.wikipedia.org/wiki/Viva_Pi%C3%B1ata_(video_game)) (Rare, 2006) | Garden sim | Each species has visit, then residence requirements (plants, terrain, other species); new species appear as outlines as the garden grows | A visitor that comes *because* the garden meets its needs; requirements that layer | Fighting, predation, sickness, romance, money, a garden that decays while away |
| [Toca Nature](https://tocaboca.com/for-parents/toca-nature/) (Toca Boca, 2014) | Open toy | Plant enough of one tree, dig water, raise hills; matching animals move in; cutting trees can drive them off | Change the place, and who comes changes; one change at a time is visible | No goal at all; animals leaving as a silent penalty |
| [Neko Atsume](https://en.wikipedia.org/wiki/Neko_Atsume) (Hit-Point, 2014) | Collecting toy | Placing goodies attracts visitors; rarer ones need particular items | The pleasure of a visitor arriving to something she placed | Real-time waiting, food that runs out while away, currency |
| [SimPark / SimSafari](https://en.wikipedia.org/wiki/SimPark) (Maxis, 1996–98) | Ecosystem sim | Plant and animal populations respond to the habitat she lays out | A habitat as a system of parts | Population collapse, a score, a real-time clock (already noted in the [IDEAS](../IDEAS.md) row for Little Town Planner) |
| [Ecosystem](https://www.geniusgames.org/collections/science-games/products/ecosystem-family-card-game-animals-ecology-habitats-biodiversity) (Genius Games, card game) | Drafting/arranging | Organisms score by what sits beside them | Placement relationships that are visible | Points, penalties, drafting against others (the [ecosystems study](subjects/ecosystems.md) already weighs it) |
| National Wildlife Federation, [Garden for Wildlife: habitat essentials](https://www.nwf.org/Garden-for-Wildlife/Food) | Real-world programme | A yard is recognised when it supplies food, water, cover and places to raise young | The three needs the game already uses are three of its four essentials; a real-world off-screen link | Certification, counts and fees; "places to raise young" stays out (below) |
| NOAA Ocean Service, [What is the intertidal zone?](https://oceanservice.noaa.gov/facts/intertidal-zone.html) and NOAA [*Ocean Literacy*](https://repository.library.noaa.gov/view/noaa/39086) principle 5h | Science reference | Spray, high, middle and low zones: the high zone is dry for long stretches between tides; its residents close their shells or move to water; the low zone is nearly always under water; tide pools are a refuge for animals that cannot stay out of water | The shore-zone model for levels 8–9 | Species lists and zone heights (they vary by coast) |

Standards. [K-ESS3-1](https://www.nextgenscience.org/pe/k-ess3-1-earth-and-human-activity) (the relationship between what plants and animals need and the places they live) for levels 1–7; [3-LS4-3](https://www.nextgenscience.org/pe/3-ls4-3-biological-evolution-unity-and-diversity) (in a particular habitat some organisms survive well, some less well, some not at all) for the shore zones; [3-LS4-4](https://www.nextgenscience.org/pe/3-ls4-4-biological-evolution-unity-and-diversity) (a single environmental change and a solution) for Patch Change, as the ecosystems study maps it, without implying every change harms every animal.

## What makes sense here

- **Fresh content first.** Replays look the same. Equivalent alternatives for each role (a second Bunny food, a second Duck shelter and so on) and a pool of prepared prediction gardens give variety without touching the rule. New *visitors* are out for now: `visitorsFor` checks every visitor in `VISITORS`, so a third visitor would change what level 4's gardens welcome and the "welcomes exactly the visitor it reveals" test; a new visitor belongs only to a new level with its own list.
- **Patch Change as level 7** (F3). Every level so far builds or reads a garden from nothing. A garden that worked, then one thing changes, asks her to compare before and after and say which need is now missing: cause and effect in a habitat, and the game's first checkable claim (which need), while the repair stays an experiment as everywhere else in the game.
- **Shore zones as levels 8–9** (oceans 5h). The same reasoning (whose needs does this place meet?) on a rocky shore, where the place itself changes twice a day. Tide Line owns *where the sea reaches* and reading the wrack line; Habitat Helpers owns *what each shore friend needs when the sea goes out*. It reuses `src/art/shore.ts` (barnacle, anemone with its `open` pose, crab, rock, pool, wrack).
- **A toddler opening** (roadmap item 18) is plausible as a cause-and-effect toy, but adds a band: a developer call.
- **Long-term arc.** Toddler: put things in, someone comes. Preschool: food, water, shelter for one friend. Pre-K: choose among distractors, predict. School: multipurpose pieces, shared gardens, a changed garden, a shore with zones. Older (later, not sliced): two scenarios for one plan, which belongs to the ecosystems study's Meadow Plans, not here.

## Experience and presentation

- **First unsupported action:** level 1 shows exactly three pieces for three spaces; any tap places one, and the gate is the only other thing to press. A two-year-old can finish it by tapping everything.
- **Touch and consequence:** a card pops into a space with `sfx.pop` and the pet names what it gives ("clover: Bunny food"); the gate opens with a sparkle and the visitor hops in on an `outBack` tween and cheers. An incomplete garden gets a splash and the first missing need spoken; the glow comes after two.
- **Variety on replay:** with the slice-1 alternatives, each role draws one of two pieces per round (seeded), and level 4 draws its three gardens from a pool of six, so the same level shows different gardens without a new rule.
- **Reasoning versus reading, memory and motor:** need icons (an apple-ish food, a drop, a little roof) carry the needs; nothing needs reading. Targets are the existing 112-unit cards with 124-unit touch areas. Patch Change keeps the *before* picture on screen, so it is comparison, not memory.
- **Art/feel example (Patch Change):** the dried pool is the existing `pool()` drawing with its water replaced by a pale mud ellipse and three crack strokes (`g.moveTo/lineTo` in `wood.line`), with a soft `sfx.pop(2)` and a little dust burst (`ctx.particles.burst`, kind `'dot'`, sand colours) when the change happens; a small framed *before* card (about 200×130) keeps the full pool. For shore zones, the anemone's existing `open` parameter tweens from 1 to 0 as the water drains, which shows "it needs to stay wet" without distress.
- **Supported ending:** every round ends with the visitor arriving; the glow always leads to a working garden. Patch Change's need question glows its answer after two misses. Nothing is lost if she stops: nothing persists between rounds.
- **Co-play:** one says what the visitor still needs, the other places it (the existing `coplayHint`); in Patch Change, one points at what changed in the before picture, the other picks the repair. Solo play stays complete.
- **For a person or device to judge:** whether a preschooler reads the before/after card at all (the reason Patch Change starts at school); whether the shore scene's three zones read as places at iPad size; whether the toddler opening is a toy or a puzzle to a one-to-two-year-old.

## Proposed ladder

### Fresh content inside existing levels

**Equivalent pieces and a pool of prediction gardens** (slice 1). Add four pieces, each with exactly one role, so each role has two pictured options: Bunny food *dandelions* (beside clover), Bunny shelter *log burrow* (beside brush pile), Duck food *pond weed* (beside seed grass), Duck shelter *reed island* (beside tall reeds). Water stays the shallow pool (shared). `makeRounds` picks one per role per round from the seeded RNG for levels 1–3; level 3's distractors are drawn from the other visitor's pieces. Level 4 draws its three prepared gardens from a pool of six two-piece gardens (three per visitor: a multipurpose piece plus the missing need, using the new pieces where they fit). Levels 5–6 keep their authored lists so the compact and shared answers stay as tested.

- *Rule tests:* every new piece has a name and exactly one use; levels 1–3 still offer exactly one working three-piece set per visitor among their cards; every pooled prediction garden welcomes exactly one visitor; the existing level 5–6 tests (multipurpose required, the level-6 answer) pass unchanged; the bot finishes every seed.
- *Cost:* S–M. Four code-drawn pieces in `art.ts` (dandelion heads on stems, a hollow log, a floating weed mat, a reed tuft on a small island), their names in `PIECES` (spoken through the existing `habitat.place` slots; device speech), no new voice ids, no journal change, no layout change (level 3 still shows five cards).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Something changed | school (pre-K after a person check) | A working Bunny garden (clover, shallow pool, brush pile); Bunny visits. "The summer sun dried the pool." The pool becomes dry mud, a *before* card keeps the old garden, and Bunny hops home for a drink. A need question (three need icons) then a two-card repair tray (pond with reeds, seed grass) and one empty space | First *which need is missing now?* (a claim), then which card restores it (an experiment), then the gate | A wrong need: boing and "Look at the before picture. What is different?", the before card pulses; two wrong needs glow the right icon (one hint). A repair that leaves the need unmet is a free test as elsewhere; two such tests glow the restoring card (one hint) | Each change case's garden works before the change; after it exactly one need is missing; exactly one of the two cards restores it; the other meets no missing need; the need answer is `missingNeeds()[0]`; the bot answers the need, places the card and opens the gate | M. New need-question row and before card; four authored change cases (pool dried, reeds flattened by a storm, clover finished for the year, seed grass gone to seed in winter), two drawn per run; one new voice id per case plus `habitat.which-need`; no journal entry |
| 8 | High rock or rock pool? | school | A rocky shore at high tide: a bare high rock and a rock pool, an anemone and a barnacle on the sand. She taps a friend, then a place. The tide button lets the sea go out | Which place keeps each friend's needs met when the sea goes out | The tide going out is the test, always free: the anemone on the high rock pulls in tight and the pet says "The anemone needs to stay wet. Up here the rock dries out." Two such tests glow the pool (one hint). The barnacle is welcome anywhere (it closes its shell) | Every accepted arrangement keeps each friend's needs met at low tide; the barnacle is accepted in either place; the anemone only in the pool; the bot finishes every round | M–L. A shore scene from `shore.ts`; friends are Graphics, not `Critter` rigs, so arrivals and cheers need their own small tweens; a tide-out animation; new voice lines; a new bot rule |
| 9 | Who lives where? | school | Three places (high rock, middle rocks with seaweed, the rock pool, which holds one friend) and three friends (barnacle, crab, anemone) | Fit everyone so each has what it needs when the sea goes out: the anemone takes the pool, the crab hides under seaweed, the barnacle can go high | As level 8; a crab on bare rock "has nowhere to hide from the gulls" (a pause behind a rock, not caught) | Every round has at least one arrangement; every arrangement meeting the needs is accepted; the pool's one space forces the anemone choice; the glow always leads to a working arrangement | M. Reuses level 8's scene and rule with a third place and the space limit |

The shore model is stated as small, in the voice and in GAMES: in this game, the high rock dries between tides, the pool stays wet, and seaweed or a crack gives a hiding place. It does not say where barnacles *cannot* live (on real shores lower limits come from predators and crowding, not needs), so the barnacle is accepted everywhere.

**Bands and order.** School becomes 4–9 (plain `min..max`). Pre-K stays 2–5 until a person sees level 7 played; then pre-K uses `order: [2, 3, 4, 7, 5]` (Patch Change is a single change to a working garden, easier than a two-space garden). No ID is renumbered; pins stay valid.

### Younger-band openings

**Level 10, Bring Bunny (toddler).** Three big cards drop into the garden in any order on a tap; when the third lands the gate opens by itself and Bunny hops in. Nothing is wrong and there is no gate to find. Toddler range `{10, 10}` with `entryLevels` so a birthday into preschool lands on level 1. *Decision:* it adds the `toddler` band (lands fit, birthdays, describeLevel); the roadmap lists it in item 18 but no band call is recorded. Like Pixel Pictures' *Light the picture*, wait until she plays level 1 at preschool. See [Decisions](#decisions-for-the-developer).

### Easier entries and levels between existing ones

None needed between 1–6: the steps are already small. Level 7's pre-K placement uses the built `order` support as above, after its person check. No band, content or accounting decision is outstanding beyond the two below.

### Left out on purpose

- **A third garden visitor in levels 1–6:** it would change level 4's prediction answers; a new visitor belongs only to a new level (none proposed now).
- **Places to raise young** (NWF's fourth essential): nests and babies add a story about young animals that needs its own care review; the three-need model stays.
- **Predators, decline or loss over time:** no animal is harmed, the garden never decays while away, and Patch Change happens within the round, not overnight.
- **Counting habitat quality or a score**, and Viva Piñata's money and romance.
- **Pollution or human damage as the change:** the changes are seasons and weather, so there is no guilt or blame.
- **Two scenarios for one plan:** the ecosystems study's Meadow Plans for older players.

## Decisions for the developer

1. **Toddler opening, level 10 *Bring Bunny*?** Adds the `toddler` band to a preschool–school game. Recommended: wait until she plays level 1 at preschool. (Added to [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).)

Level 7 at pre-K is a person check, not a decision: it goes to [DEVICE-CHECKS](../DEVICE-CHECKS.md) once level 7 is built.

## Build slices, in order

1. **Equivalent pieces and pooled prediction gardens (batch habitat-helpers 1).** Four new pieces, seeded per-role picks at levels 1–3, six pooled level-4 gardens. *Check:* existing-interaction tier: typecheck, the game's rule tests, one filtered regression play at level 3 and level 4 with a non-default seed (the new cards visible, one incomplete test), one portrait screenshot of level 3; the bot rule is unchanged, so `fingerdemo` only if its play changes. Build once for the new art.
2. **Level 7, Something changed (batch habitat-helpers 2).** School only (school 4–7); the need question is the game's first counted miss. Satisfies the ecosystems study's F3 definition. *Check:* new interaction: typecheck, rule tests, one scripted play of level 7 with one wrong need, a second for the glow, then the right need, one non-restoring card and the right one, one portrait screenshot with the before card, `fingerdemo` at 7, one build.
3. **Levels 8–9, the rocky shore (batch habitat-helpers 3),** after batch 2 (shares the level table and the bot rule). School 4–9. *Check:* new interaction: typecheck, rule tests, one scripted play of level 8 with the anemone on the high rock first, level 9 to its sticker, one portrait screenshot of the shore, `fingerdemo` at 8 and 9, one build.
4. *Gated:* level 10 *Bring Bunny* (decision 1); level 7 at pre-K (person check after slice 2).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
