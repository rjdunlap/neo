# Maker Lane, levels 1–3 (definition)

Defined 2026-10-31 as slice FS1 of the [food-and-fiber study](../deep-dives/subjects/food-fiber-systems.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/food-fiber-systems.md#a-first-games-ladder-maker-lane-13) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#food-and-fiber-systems-recommendations). The study's six decisions were adopted on its leans under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/food-fiber-systems.md#decisions-for-the-developer)). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build** as one same-game batch, `maker-lane 1` (levels 1–3, new-game tier). Registration, bands and land take the defaults below under standing rule S8. The makers' pictures and spoken lines are built **marked for review** by an agricultural-literacy or textile educator (study decision 5); the review is a release check recorded in DEVICE-CHECKS, not a build gate. It depends on no other unbuilt game.

**Fun action and purpose:** a short lane of makers' stalls in the village. A bundle sits at the lane's start; she sends it to a maker, the maker works (a haircut, a wash, a spin, a bake) and the bundle comes back as something new, until it is a scarf, a sock, a loaf or a box for the pet. Later she chooses which maker can use the bundle *now*, and then starts from the finished thing and picks where it began, watching a wrong beginning walk the lane and make something else. The learning purpose is **finished things began as something growing, and people changed them on the way** (NALO T5.K-2.e/f, T3.K-2.b; England's KS1 D&T "where food comes from"). The gap the evidence shows is not ordering steps but connecting a heavily changed thing to a living source (ACER: 25% of Grade 6 classed cotton socks as a plant product; most thought cardboard came from a factory), so level 3's tempting wrong cards are exactly those.

## Identity and overlap

Rechecked 2026-10-31 against the catalog, the open definitions and `git log origin/main`:

- **Story Steps** orders pictured steps from memory; Maker Lane never asks for an order from memory: every middle form is a distinct picture, and a maker shows the form they need. The study mentions a Story Steps *Sheep to cloth* set; no sheep, fleece, yarn or cloth set was found in `src/games/story-steps/` on main, so there is nothing to coordinate.
- **Little Loom** (Treehouse) weaves stripes; the wool chain's weaver is one stall with a picture of a loom, and Little Loom is unchanged.
- **Mail Carrier** routes a parcel to a matching door; here the bundle's *form* decides the maker and changes after each step.
- **Second Chance Shed** owns reuse and mending; **Recipe Workshop** and **Pet Kitchen** own recipes and measuring; **Lemonade Stand**, **Market Stall** and **Swap Meet** own prices and swaps. Maker Lane has no money, recipe or recycling.
- **River Tablets** draws sheep as counted flock animals; Maker Lane reuses the drawing (below), not the rule.

## The model (`logic.ts`)

One table is the whole rule. A **chain** has a living **beginning**, four **makers** and five **forms**: the beginning, three middle forms, and the product. Maker *k* accepts exactly form *k* of its chain and gives form *k*+1. The first maker (the harvester) works on the living beginning where it stands at the lane's start.

| Chain | Beginning (form 0) | Maker 1 · tool → form 1 | Maker 2 · tool → form 2 | Maker 3 · tool → form 3 | Maker 4 · tool → product (form 4) | Product's material cue |
| --- | --- | --- | --- | --- | --- | --- |
| `wool` | a sheep | shearer · shears → lumpy fleece (a haircut; the sheep stays, lighter and happy) | washer · wash tub → clean fleece | spinner · spinning wheel → yarn (a fluffy roll shows mid-animation only, never a carried form) | weaver · loom → **woolly scarf** | fuzzy outline, chunky knit, a fringe |
| `cotton` | a cotton plant | picker · picking bag → cotton bolls (fluffy, with seeds) | cleaner · seed comb → clean cotton | spinner · spindle → thread | knitter · needles → **cotton sock** | smooth edge, thin stripes |
| `wheat` | a wheat field | cutter · sickle → a sheaf | thresher · flail → grain | miller · millstone → flour | baker · oven → **loaf** | a brown crust, a slice cut |
| `tree` | a tree | woodcutter · saw → a log (she plants a sapling where it stood) | chipper · chipper → wood chips | pulper · pulp vat → pulp | presser · press → **cardboard box** (pressed, dried and folded) | brown, a corrugated edge |

Honest simplifications, stated on the grown-up card: the spinner also cards; the presser also dries and folds; the thresher stands in for threshing and winnowing; the cotton cleaner is a hand comb (the gin is never named, decision 4); real mills use more steps and machines.

- **Types:** `Chain = 'wool' | 'cotton' | 'wheat' | 'tree'`; `Form` is a string union of the 20 forms; `Maker = { chain, step: 1 | 2 | 3 | 4, accepts: Form, gives: Form }`. `makerFor(form)` returns the one maker that accepts it (none for a product). `nextForm(form)`.
- **Level 3 things and cards** (`Thing = 'sock' | 'box' | 'loaf' | 'scarf'`, `Card = Chain beginnings | 'cow' | 'hen' | 'factory'`). Each thing is a chain's product. Cards are three per thing at every band: the right beginning, the thing's tempting wrong card, and a third from the thing's pool (seeded):

| Thing | Right card | Tempting wrong card (why) | Third-card pool | What a wrong card shows |
| --- | --- | --- | --- | --- |
| cotton sock | cotton plant | **sheep** (ACER, opened: soft must be animal) | tree, wheat field, factory | a living beginning walks its own lane and becomes its own chain's product (sheep → woolly scarf, tree → box, wheat → loaf), set beside the asked thing |
| cardboard box | tree | **factory** (ACER, opened: most thought cardboard came from a factory) | sheep, cotton plant, wheat field | the factory: the lane runs empty and the pet says it changes things but they began growing |
| loaf | wheat field | **cow** (UK BNF polls, search summaries only, a third of 5–8s saying pasta comes from animals; recorded as consistent, not as an age norm) | hen, tree, sheep | the cow and hen never take a maker step: they stand at the lane's start, the makers shrug, and a jug of milk or an egg appears |
| woolly scarf | sheep | **cotton plant** (designed: the other soft fibre; no source) | tree, wheat field, hen | as above; the cotton plant makes a smooth sock |

  The factory card appears only for the sock and the box (both factory-made today, both began growing). Cow and hen appear only at level 3 and never as a maker step (study decision 2). The right card walks its lane, every maker works, and it becomes the asked thing.
- **Rounds:** `roundFor(level, rng)`. Level 1: two different chains, makers in chain order. Level 2: two different chains; makers 2–4 of each in a seeded order that is never the chain order. Level 3: three distinct things, each with its card set in a seeded order. The first round per level is authored: level 1 wool then wheat; level 2 wool (order weaver, washer, spinner) then tree; level 3 the sock (with the sheep), the box (with the factory), then the loaf.
- **Answers:** `answerFor(state)` is the waving maker (level 1), `makerFor(bundle)` (level 2) or the right card (level 3); `glowFor` is the same.

## Levels

| Level | Name | Bands | Per round | What she does |
| --- | --- | --- | --- | --- |
| 1 | *Along the lane* | toddler 1, preschool 1 | 2 bundles | Tap the waving maker (or drag the bundle to them); the bundle changes; the product goes to the pet |
| 2 | *Who can use it now?* | preschool 2, pre-K 2, school 2 | 2 bundles | The harvest plays by itself; send the bundle to whichever of the three makers can use it as it is |
| 3 | *Where did it begin?* | pre-K 3, school 3 | 3 things | Tap the beginning the finished thing came from; the card walks the lane and makes it (or something else) |

`BandLevels`: `toddler: { min: 1, max: 1 }`, `preschool: { min: 1, max: 2 }`, `prek: { min: 2, max: 3 }`, `school: { min: 2, max: 3 }`. No `lap` (study: nothing on screen claims the link for under-2s), no `grownup`, no `order`. No rule reads the band: level 3 deals three cards at every band, and the study's four cards at school are left to FS2's definition (open decision 3).

## Screen and controls

- **The lane** is a dirt path with a beginning spot at its start (the sheep in a little pen, the cotton plant, the wheat patch, the tree) and code-drawn stalls with awnings, each a maker (`Critter` at about 0.55 scale) behind a large picture of their tool. **Stall targets: 160 × 220** (maker and tool together). At level 1 all four stalls stand in chain order; at level 2 the three remaining makers stand in the round's order. Touch-down: the maker leans forward and their tool twitches.
- **The bundle** is a large picture of the current form, **130 × 130**, sitting on the path in front of the last stall that worked on it (or at the beginning spot). It is the drag handle (`src/engine/drag.ts`, riding 40 units above the finger); dropping it on a stall sends it there, dropping it anywhere else returns it, free.
- **One gesture at levels 1 and 2:** tapping a stall sends the bundle there, exactly as dragging it does. The ghost finger taps at level 1 and drags at level 2.
- **The thought bubble** (level 2) appears over a maker who refuses: **120 × 100**, the picture of the form they need, and it stays up while the bundle keeps its present form. A maker who has done their step steps aside and hangs their work on the stall; their stall is no longer a target.
- **Level 3:** the asked thing in a frame top-right (**220 × 220**; tapping it re-asks, free); the lane across the middle (stalls about 120 wide: the replay is watched, not tapped); three **beginning cards, 200 × 200**, in a row along the bottom right of the pet's corner.
- **The pet** receives each finished product (it carries the scarf, wears the sock on a paw, hugs the loaf, sits in the box): a reaction, not a saved item.
- **Layout** (`makerLaneLayout(view, level)` in `logic.ts`, from `view`, never `window`): landscape (1024 × 768) one straight lane across the middle; portrait (768 × 1024) the lane bends into two rows (beginning and two stalls, then the rest right to left, the path curving between), and level 3's cards sit above the pet's corner. Home top-left and the pet's bottom-left corner stay clear; every target at least 100 on screen at all four standard views.

## Accounting, help and finishing

- **Free, never a miss:** at level 1, tapping a maker who is not waving (they wave and point at the glowing one); dropping the bundle off any stall; tapping the asked thing or the beginning spot; re-sending to a maker whose bubble is already up for this form (they point at their bubble); re-tapping a dimmed level-3 card (its line again); anything during a maker's animation or a replay.
- **Counted:** level 2, sending the bundle to a maker who cannot use it yet: they shake their head, their bubble shows the form they need, and the pet says their *not yet* line; one miss and a gentle `boing`. Level 3, a wrong card: one miss, its replay plays, and the card dims.
- **Glow:** two misses on the same bundle (level 2, counted across its steps) or the same thing (level 3) glow the right maker or card; the shell counts **one hint**, once per bundle or thing. **Show me** (`askForHint`, `hintLabel = 'Show me'`) at levels 2 and 3 glows the same target and counts one hint. Level 1 has no misses and no hint button: the next maker always waves and glows.
- **Assisted ending:** every bundle and thing ends through her tap or drag, after the glow if needed; finishing with help earns the ordinary one sticker. After the round's last bundle or thing, `ctx.finish({ misses, hints })`, once.
- **Adaptation:** standard. Level 1 always finishes smooth, so a toddler's ladder simply stays at 1 (the band's top). A smooth level 2 or 3 with the spoken lines is not evidence she would trace a real sock to a plant on her own; the how-to card says so.
- **Nothing is kept:** no products saved, no journal entries, no save field (study's "nothing kept").

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Every line is slot-free so the Kokoro renderer can cover it. Every maker and level-3 line carries a `// REVIEW (agricultural literacy / textiles)` marker for decision 5. *Fibre*, *processed* and *raw material* appear on the grown-up card only.

- `makerlane.instruct.1`: "Tap the maker who is waving, and watch it change!" `makerlane.instruct.2`: "Who can use it now? Bring it to the maker who can." `makerlane.instruct.3`: "Where did it begin? Tap where it came from."
- Maker work, `makerlane.make.{chain}.{step}` (16): wool "A haircut for the sheep! Lumpy fleece." / "Wash, wash. Clean fleece!" / "Spin, spin. Yarn!" / "Weave, weave. A woolly scarf!"; cotton "Pick the fluffy cotton!" / "Comb out the seeds. Clean cotton!" / "Spin, spin. Thread!" / "Knit, knit. A cotton sock!"; wheat "Cut the wheat!" / "Shake out the grain!" / "Grind, grind. Flour!" / "Into the oven. A loaf!"; tree "Saw a log, and plant a new tree!" / "Chip, chip. Wood chips!" / "Mash, mash. Pulp!" / "Press it, dry it, fold it. A box!"
- Not yet, `makerlane.notyet.{chain}.{step}` for steps 3–4 (8) and step 2 never (it is always the first right answer): e.g. "Not yet. I need it clean first." / "Not yet. I need yarn first." / "Not yet. I need flour first." / "Not yet. I need pulp first."
- Level 1: `makerlane.notme`: "Not me. Look, it's their turn!"; `makerlane.forpet`: "For you!"
- Level 3, composed of two lines: `makerlane.makes.{card}` (7): "A sheep's wool makes a woolly scarf." / "A cotton plant makes smooth cotton." / "A tree makes cardboard." / "Wheat makes flour for bread." / "A cow gives milk." / "A hen gives eggs." / factory "The factory changes things, but they began somewhere growing."; then `makerlane.this.{thing}` (4): "This sock is smooth cotton, from a plant." / "This box began as a tree." / "This loaf began as wheat, a plant." / "This scarf is woolly, from a sheep's haircut." Right answers: `makerlane.began.{thing}` (4): "Yes! This sock began as a cotton plant." (and the box, loaf, scarf).
- No line says *wrong*; shearing is always a haircut; no meat, leather or slaughter is drawn or named (decision 3); no mill or gin history (decision 4). A test checks every chain step, refusal, card and thing has its line.

## Rule tests (`logic.test.ts`)

1. **Graph:** four chains of four makers and five forms; all 20 forms distinct; every form but a product has exactly one maker (`makerFor`), and products have none; following `makerFor` from each beginning reaches its product in exactly four steps.
2. **Level 1 rounds** (300 seeds): two distinct chains, stalls in chain order; the waving maker is always `makerFor(bundle)`.
3. **Level 2 rounds** (300 seeds): two distinct chains; the bundle starts at form 1; three stalls (makers 2–4), never in chain order; at each step exactly one remaining maker accepts the bundle, and a refusing maker's bubble shows a form reachable from the current one; over all seeds the right maker for the first carry stands in each slot between 25% and 42% of rounds.
4. **Level 3 rounds** (300 seeds): three distinct things; three distinct cards each; exactly one card's result is the asked thing; the thing's tempting wrong card is always present; the factory only with the sock or box; cow and hen never with the sock or box and never as a maker; every wrong card's result (its chain product, milk, an egg, or nothing for the factory) differs from the asked thing.
5. **Accounting:** refused sends and wrong cards count one miss each; re-sends to a bubbled maker, re-taps of a dimmed card, level-1 taps, stray drops and thing taps count nothing; two misses on one bundle or thing give exactly one glow hint; misses never block the right answer; level 1 always finishes with zero misses.
6. **Hints lead somewhere:** `glowFor` is the waving maker, `makerFor(bundle)` and the right card.
7. **Authored first rounds** meet the rules above (wool then wheat; wool in weaver, washer, spinner order then tree; sock with sheep, box with factory, loaf).
8. **Layout:** `makerLaneLayout` at four views for each level: stalls at least 160 × 220 at levels 1–2 and cards 200 × 200 at level 3, all inside the view; the bundle 130; the pet corner and Home clear; the portrait lane in two rows.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the scene: level 1 taps the waving stall, level 2 drags the bundle to `makerFor(bundle)`, level 3 taps the right card. `fingerdemo` runs at levels 2 and 3.
- **How-to card** (`src/content/howto.ts`). Goal: "Help the makers change a bundle into something new, then find where finished things began."
  - Steps: "Tap the maker who is waving; the bundle changes at each stall" `{ from: 1, to: 1 }`; "Tap a maker or drag the bundle to them; a maker who can't use it yet shows what they need" `{ from: 2, to: 2 }`; "Look at the finished thing and tap where it began; a wrong start walks the lane and makes something else" `{ from: 3, to: 3 }`.
  - Finish: "The round ends when both bundles are finished" `{ from: 1, to: 2 }`; "The round ends after three finished things" `{ from: 3, to: 3 }`.
  - Notes: "The makers are simplified: one maker may stand for several real jobs" (all levels); "Rounds without hints move her up, which means she matched makers and beginnings with the lines read aloud, not that she would trace a real sock or box on her own" `{ from: 2, to: 3 }`.
- **Registration (default under S8):** ID `maker-lane`, name "Maker Lane", spoken title `game.maker-lane` ("Maker lane"). Region (subject) `cozy-village`. Skills `['where things come from', 'how things are made', 'plant or animal', 'cause and effect']` (free strings). Music: an existing gentle `STYLES` entry chosen at build (not silenced; she does not make the music). Home land **Cozy Village** (19 games on `main`, already paging at `LAND_SPOTS` 13; Notice Board is also queued there), fallback **Treehouse**, beside Little Loom; `lands.test.ts` decides at build time. *Correction:* the study named "Painted Canyon beside Little Loom" as the fallback; no such land exists, and Little Loom is in Treehouse. Hub icon: a little stall awning over a ball of yarn. Sticker: a shelf holding a scarf, a sock, a loaf and a box.
- **Art:** code-drawn in `src/games/maker-lane/art.ts` with `src/art/palette.ts`: stalls, sixteen tool pictures, the twenty forms, cotton plant, wheat patch, the factory card, the milk jug and egg, the thought bubble. Reuse `Critter` (`CRITTERS` without `pip`) for makers and the cow; `treeArt` from `src/art/picnic.ts`; **move** `sheepArt` from `src/games/river-tablets/art.ts` and the private `hen()` from `src/games/keep-house/art.ts` into `src/art/animals.ts` as exports (`sheepArt`, `henArt`), with both games importing them, so the build runs `npm run build` anyway. No imported art or audio.
- **Co-play (FS4)** (`coplayHint`): "Be the maker and the carrier: one of you moves the bundle, the other says what the maker will do to it. Swap at the next stall." **Off-screen:** "Pick up a sock, a box or some bread together and ask: what did it look like before?"
- **FS3, the "Where did it begin?" card** (grown-ups' page, plain HTML in `src/parent/panel.ts`, built with this batch or after it; conversation and looking only, decision 6): *Where did it begin?* "Find three things at home that began as a plant, an animal and a tree: a cotton sock, a wool hat, a cardboard box. Read a clothing label together ("100% cotton") and ask what it looked like before. Tear the edge of a cardboard box and look at the little fibres. Before she is two, just touch and name them together." No making, dyeing or cooking instructions.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. Makers could later be her collected creatures and a finished scarf a wearable, as the [rework brief](../rework/README.md) decides.

## Check tier

**Batch `maker-lane 1` (levels 1–3), new-game tier:** typecheck and unit tests (tests 1–8 plus registry, lands, how-to, off-screen and the moved art's existing tests); one scripted play through a new `browser-check.mjs` case (and its README row): level 1 with a tap on a maker who is not waving (free), then the waving makers to the pet; level 2 with two refused makers on the first bundle (two misses, bubbles, then the glow and its hint) and then the right makers; level 3 with one wrong card (its replay, a dimmed card) then the right one; one portrait screenshot at level 2 with a thought bubble up; `fingerdemo` at levels 2 and 3; a filtered River Tablets and Keep House check is not needed beyond their unit tests unless the moved art changes how they draw; `npm run build`, because the registry, lands, voice, how-to and `src/art/` change. If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

Person, device and review checks stay open (DEVICE-CHECKS once built), from the study: does a four-year-old pick the sheep for the sock because it is soft, and does the replay change her next pick; does the thought bubble tell her which maker comes next, or does she try every stall; does a grown-up use the label card; and the named agricultural-literacy or textile review of the makers' pictures and lines (decision 5). Browser automation establishes none of these.

## What comes next

**FS3** (the card above) ships with the build or right after it; **FS4** ships as this game's `coplayHint`; **FS2** Maker Lane 4–5 (*Stripes or plain*, *Two ways to a box*) is defined after levels 1–3 are played; **FS5** and **FS6** stay sketches.

## Open decisions

Each has a default the build uses; none waits on the developer (S8).

1. **Register Maker Lane as a new game,** toddler 1, preschool 1–2, pre-K 2–3, school 2–3, home Cozy Village, fallback Treehouse (study decision 1, with the fallback corrected).
2. **Four makers per chain, harvester first.** Default: the table above, so level 2 always has three makers after the harvest. Alternative: three-maker wheat and paper chains as the study sketched; not chosen, because cut-mill-bake skips threshing and chip-pulp-press ends at a sheet, not a box.
3. **Three cards at every band.** Default: no rule reads the band. Alternative: four cards at school (the study's audience row); deferred to FS2's definition, so one level keeps one meaning for the ladder and the how-to card.
4. **Tap sends at levels 1 and 2.** Default: one gesture, so a preschooler moving up from level 1 is never stuck; a refusal is the information. Alternative: the study's tap-to-peek at level 2 with drag to commit; not chosen, because a tap that suddenly does nothing reads as broken.
5. **The loaf's tempting card is the cow,** on search-summary evidence only; the line says the loaf "began as wheat", which stays true of breads made with milk. The reviewer may swap it for the hen.
