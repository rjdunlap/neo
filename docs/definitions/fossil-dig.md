# Fossil Dig: Find and Record, levels 1–2 (definition)

Defined 2026-10-18 as the one shared packet for the [deep-time study's](../deep-dives/subjects/deep-time.md#build-slices-in-order) slice **D1** and the [earth-materials study's](../deep-dives/subjects/earth-materials.md#build-slices-in-order) slice **E5**, from the deep-time study's [proposed ladder](../deep-dives/subjects/deep-time.md#first-games-proposed-ladder-fossil-dig-shared-with-earth-materials-e5) (plans 1–2 only; plans 3–4 are a later definition), its [ownership table](../deep-dives/subjects/deep-time.md#on-the-island-today) and the [IDEAS rows](../IDEAS.md#candidates). **Built 2026-10-21** (levels 1–2, branch `claude/fossil-dig`, on every default; build notes in the [archive](../archive/COMPLETED-2026-10-09.md#fossil-dig-levels-12-2026-10-21); the deviations from the pixels below are listed there; it is Tinker Lab's 12th game, not the 14th named in decisions). Originally docs only: no game, ID registration, voice line or save field existed. **Was ready to build:** every open call below has a default the build can use. Every leaf here is an invented island leaf described only by two plain shape words, so no paleontologist is needed before this slice; the studies' reviewer decision gates only later real-species, track and dinosaur content.

**Fun action and purpose:** a dusty stone sits in one of three dig squares on a cliff shelf. She rubs the dust away with her finger and a leaf print appears, pressed into the stone. She marks **where** it was found by tapping the flag of its square, then picks **which** of two pinned reference leaves it looks like, by its visible shape, and presses Check. The record card goes into the field notebook. The learning goal is **evidence and context**: a preserved feature plus where it was found supports a comparison, and the comparison uses what can actually be seen (the outline at level 1, the edge up close at level 2), not color or a guess. No species, date, age or "millions of years" is named; the print's only story is one plain sentence the pet says about mud that became stone.

## References

None was played; pages and documents were read. The deep-time study's [similar-games table](../deep-dives/subjects/deep-time.md#similar-games-apps-and-physical-play) (Sago Mini Dinosaurs, PBS Dinosaur Train *Fossil Finder*, AMNH *Layers of Time*, Fossil Corner, NPS Junior Paleontologist) still applies; these settle the shape of a round and the two leaf features.

| Reference | What it shows | What Fossil Dig takes or rejects |
| --- | --- | --- |
| [NPS, *What Is a Fossil?*](https://www.nps.gov/subjects/fossils/what-is-a-fossil.htm) (the study opened it) | Fossils preserve evidence of past life, including impressions of plants and traces, not only bones | **A leaf impression as the first find**, not a dinosaur cast. Rejects any named organism: the leaves are invented island leaves |
| [NPS, *Significance*](https://www.nps.gov/subjects/fossils/significance.htm) (the study opened it) | A fossil's original place carries information that removal loses; context matters as much as the object | **The Where step and the location marker on the record card.** Rejects any real-world digging or collecting advice: the dig is a pretend cliff on the island, and the how-to says so |
| [CU Museum of Natural History, *Fossil Kit Lab 4: Fossil Leaves and Climate Change*](https://www.colorado.edu/cumuseum/sites/default/files/attached-files/fossilkitlaboratoryinvestigation4.pdf) (school lab guide) | Students sort fossil leaves by margin, **entire (smooth) or toothed (jagged)**, and are warned that lobes (as on an oak) can look like teeth but are whole | **The two features:** lobed/unlobed outline at level 1, toothed/smooth edge at level 2, and the warning: level 1's lobes are big and few, level 2's teeth are small and many, shown in the magnifier so they are never confused. Rejects the climate inference: nothing is concluded from the margin here |
| [NPS Florissant, *Leaf Margin Analysis Exercise*](https://www.nps.gov/flfo/learn/education/leaf-margin-analysis-exercise-sheet-2.htm) (park education sheet) | Leaf margins are a visible feature paleobotanists record from fossil leaves | Confirms that "look at the edge" is a real observation a record keeps, so the level-2 record stamps the edge feature. Rejects counting, percentages and temperature |
| [Sago Mini Dinosaurs](https://sagomini.com/apps/dinosaurs/) (ages 2–5; the study opened it) | A digital toy with a fossil dig among its locations; digging is a free surprise | **Brushing is free and every touch clears something.** Rejects the dig as a reward with nothing to decide: here the reveal opens a comparison |
| [PBS Dinosaur Train, *Fossil Finder*](https://www.pbs.org/parents/shows/dinosaur-train) (preschool listing; the study opened it) | Preschoolers dig for fossils in a licensed show's game | The audience placement (pre-K first). Rejects a brand cast, a collection to complete and bone assembly |
| [Fossil Corner](https://store.steampowered.com/app/1587710/Fossil_Corner/) (cozy puzzle; the study opened it) | Comparing specimens by visible features builds a family tree | **Compare what you can see, feature by feature.** Rejects ancestry claims and a growing collection: one record per round, nothing accrues |

## Overlap

- **Splish Splash** owns scrubbing a pet clean, and its mud splotches are `RenderTexture`s erased patch by patch with a tested `scrubPath`. Fossil Dig **reuses that erase technique and its reachability test** for the dust, but brushing is only its opening: the round's decisions are the Where flag and the Check, which Splish Splash never asks. No body parts, no "wash the ears" ordering, no bath.
- **Puzzle Pals / Tangram Town** own fitting a picture together. Nothing here is assembled; the print is whole under the dust.
- **Treasure Map** and the notebook's *Warm-and-Cool Dig* seed own searching for a hidden spot. The stone is in plain view; there is no search, no near/far feedback and no buried toy.
- **Photo Safari** owns noticing and photographing a described thing in a scene. The record card is not a photo request; the Where flag records context.
- **Critter Sort** owns sorting many things by a rule. Fossil Dig compares one find against two references on one stated feature; it never sorts a tray.
- **Stamp Studio's** proposed *Trace Prints* (deep-time D3) makes fresh marks; Fossil Dig only uncovers a made one. **Story Steps** owns ordering a process; the pet's one sentence about mud and stone is spoken, never a strip to order.
- **Sand Table** (E1–E4) reshapes loose grains; the dust here is a mask over a stone, not a material that moves or piles.
- **Seesaw Balance** files a journal discovery; Fossil Dig files none in this build ([decision 5](#open-decisions)). **Outcrop Detective** and *Lost Layers* own layers and relative order; level 3 of the study's ladder (sites and layers) is theirs to reconcile later, not this slice.
- No shipped game asks "where was it found?" or compares a find to a reference by a named visible feature. A later shell, bark or feather print is Fossil Dig content, never a new registration.

## The model

- **Features** are two enumerations with a drawing each: `outline ∈ {lobed, unlobed}` (a broad leaf with three to five big rounded lobes, or a narrow leaf with one smooth curve) and `margin ∈ {toothed, smooth}` (many small even teeth along the edge, or a clean edge). A **leaf** is `{ id, name, outline, margin }`. The three first-build leaves are invented, named by their shape in the pet's voice, and share one green:

  | Leaf `id` | Spoken name | `outline` | `margin` |
  | --- | --- | --- | --- |
  | `star` | star leaf | lobed | smooth |
  | `ribbon` | ribbon leaf | unlobed | smooth |
  | `saw-star` | saw-star leaf | lobed | toothed |

- **A case** is `{ id, level, find, references: [Leaf, Leaf], feature }`: `find` is the leaf whose impression is in the stone, `references` the two pinned cards, `feature` the one the level asks about (`outline` at level 1, `margin` at level 2). The authored cases:

  | Case | Level | `find` | `references` | `feature` | Why the pair is fair |
  | --- | --- | --- | --- | --- | --- |
  | `L1-star` | 1 | `star` | `star`, `ribbon` | `outline` | Both references are smooth-edged, so only the outline tells them apart |
  | `L1-ribbon` | 1 | `ribbon` | `star`, `ribbon` | `outline` | The same pair with the other find, so the answer is not always the lobed leaf |
  | `L2-saw` | 2 | `saw-star` | `saw-star`, `star` | `margin` | Both references are lobed, so the outline is the shared easy clue and only the edge differs |
  | `L2-star` | 2 | `star` | `saw-star`, `star` | `margin` | The same pair with the smooth find |

- **The matching predicate:** `matches(find, reference, feature)` is `find[feature] === reference[feature]`. **`answer(case)`** is the reference for which `matches` holds on the case's feature; the authored cases guarantee exactly one, and the other reference agrees with the find on the *other* feature (the distractor shares the easy clue). The predicate is a pure lookup, never a similarity score.
- **The site** is three dig squares on the shelf, each with a **flag** of a distinct color and shape (red circle, blue triangle, yellow square) so neither color nor shape alone carries the answer. `site(case, seed)` chooses which square holds the stone; the other two squares are dug and empty. The **Where answer** is the flag of the stone's square: a fact in plain view, not a memory.
- **The dust** is a grid of `cells` over the stone (8 across, 6 down, each 50×50 logical units in the 400×300 stone). Each cell is `covered` or `cleared`; the impression occupies an authored set of cells (`leafCells(find)`, between 18 and 26 cells). A **pat** at a point clears every cell whose center lies within the brush radius (55 units, so a palm-sized touch clears a palm-sized disc). **`revealed(cells, find)`** is the fraction of `leafCells` cleared; the find is **shown** at 0.7 or more, and brushing stays free afterwards. The seed picks one leaf cell to pre-clear so a bit of the edge shows from the start, as the study's plan 1 asks.
- **A round** is one case per level, chosen by the seed between the level's two cases, with a seeded site square, reference order (left/right) and pre-cleared cell. The predicate, features and leaf drawings never vary with the seed, and no feature is mirrored or procedurally altered.
- **The record card** holds two slots, **Where** (a flag) and **Like** (a reference leaf), and, after a correct level-2 Check, an **edge stamp** (`toothed` or `smooth`) naming the feature that decided it. The card is in memory for the round only.

## Screen and controls

- **Landscape (1024×768 design area):** a pale cliff shelf across the upper half with three **dig squares** (each 260 wide, 200 tall, 20 apart, centered), a flag post at each square's top-left corner (the flag is a 104-unit target); the **stone** fills the holding square (400×300, drawn over the square so it reads as "in" it) with its dust layer on top; the **record card** (300×420, a notebook page with the Where slot and the Like slot, each 110 units, and **Check**, a 104-unit green button, dim until Like holds a leaf) at the right edge; the two **reference leaves** (130×130 cards, pinned with a drawn tack) in a row below the shelf toward the right, out of the pet's corner. The pet is the corner guide, bottom-left, with 150 units kept clear. All targets are at least 100 logical units after scaling.
- **Brushing:** a touch anywhere on the stone is a pat that clears a disc at once with a soft puff and a dry brush sound; a drag across it clears along the way (custom pointer handling with palm rejection, `pointercancel` and leaving the screen handled; `lift: 0`, since the finger is the brush). Touch-down feedback is the puff itself. The print under the dust is a darker impression in the stone, with the lobes or the single curve readable at the drawn size and, at level 2, teeth drawn at 8 units so they are visible but confirmed in the magnifier.
- **Shown:** when `revealed` reaches 0.7 the stone glows once, the pet says the found line, and the stone's flag waves. Brushing continues to work.
- **Where** (after Shown): tapping a flag stamps a little picture of that flag into the Where slot. The stone's flag is the answer; another flag is a miss (see accounting) and the slot stays empty. A flag tapped before Shown wiggles and the pet says to brush first; nothing is counted.
- **Like:** tapping a reference leaf lifts it into the Like slot; tapping the other swaps it; tapping the slot returns it. Free until Check.
- **Magnifier** (level 2; also available at level 1 without being needed): tapping the impression's edge, or a reference leaf's edge badge (a 100-unit round "look closer" button on each card), opens a 300-unit round inset at top-center showing that edge large, teeth or a clean line, with the pet's edge line spoken. Tapping another edge moves it; tapping anywhere else closes it. Looking is free.
- **Check:** submits the Like slot. Correct: the impression's outline (level 1) or edge (level 2) traces itself in light, then the matching reference's does, the pet says the matching line, the card gets its stamp, and the record card slides into the **field notebook** at the top-right corner with a chime; the round finishes. Wrong: a gentle boing, the pet names what to look at, and the leaf drops back to its pin.
- **Portrait:** the three squares shrink to 230 wide in one row at the top, the stone keeps 400×300 (it may overhang its square), the record card turns horizontal (420×300) beneath the stone with the references in a row under it, and the pet keeps its corner. `digLayout(view, level)` returns every rectangle and a test asserts the sizes at the four views.
- **Sound and music:** a dry brush sound per pat (`sfx`), a rising pentatonic pair when Shown, a wooden stamp for Where, a chime for the notebook; the land's music keeps playing (not `silenced`, nothing here makes music).

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **A leaf left a clue** | pre-K | Where to brush, which flag marks the find's square, and which reference's **outline** (lobed or not) matches | One record card in the notebook: Where stamped and a supported Check |
| 2 | **Look more closely** | pre-K | The above, plus which edge to magnify and which reference's **edge** (toothed or smooth) matches when both outlines are the same | One record card with Where, Like and the edge stamp |

The study's plans 3 (*A place, not just a picture*, two layers and relative order) and 4 (*What can this tell us?*) are school-and-up follow-ups with their own definition after this build and the Outcrop Detective audit; they would append above 2. A preschool opening is [decision 1](#open-decisions).

### First rounds

- **Level 1 (`L1-star`, stone in the blue-triangle square, star leaf on the right, one edge cell pre-cleared):** the pet: "Something's hiding under the dust. Brush it off!" One lobe's edge already shows. Pats clear discs; after six or seven the print is Shown: the stone glows, "A leaf print! A leaf pressed into mud, and the mud became stone." The blue flag waves: "Tap the flag of the square it was in." Tapping the red circle flag: boing, "That's the red circle square. Look where the stone is," one miss. Tapping the blue triangle: a stamp into Where, "Found in the blue triangle square. Now, which leaf is it like? Look at the shape." Tapping the ribbon leaf lifts it into Like; Check: boing, the ribbon leaf's single curve traces itself, "The ribbon leaf is narrow. Our print has lobes, like fingers," one miss, the leaf drops back. Tapping the star leaf, Check: both outlines trace in light, "Lobes, like fingers! It's like the star leaf." The card slides into the notebook. Finish.
- **Level 2 (`L2-saw`, stone in the yellow-square square):** brushing and Where as above. Then: "Both leaves have lobes. Look closer at the edge." Tapping the impression's edge opens the magnifier: little teeth, "Tiny teeth all along the edge." Tapping the star leaf's badge: a clean line, "Smooth, no teeth." Tapping the star leaf into Like and Check: boing, "The star leaf's edge is smooth. Look at the teeth," one miss. Saw-star leaf, Check: both edges trace, "Teeth all along, like the saw-star leaf!" The card gets the toothed stamp and slides into the notebook.

## Accounting, help and finishing

- **Never a miss:** brushing anywhere, any number of pats, a flag tapped before Shown (a wiggle and "brush first"), opening the magnifier, swapping or returning the Like leaf before Check, Check with an empty Like slot (the slot wiggles, the pet says "Pick a leaf first," nothing counted), repeated taps during feedback (ignored), repeating the instruction, or tapping the stone's own flag again after Where is stamped.
- **A miss:** a flag that is not the stone's square (Where), or a Check whose Like leaf does not match the case's feature. Each response is specific and visible: the wrong flag's square lights empty; the wrong leaf's outline or edge traces itself beside the print's, and the pet names the visible difference.
- **Glow and hints:** after two misses on one step (Where, or Check) the right flag or the right reference glows, and at level 2 the magnifier opens on the print's edge and the matching leaf's edge; `hints++` once per step. **Show a hint** in the pause sheet (`Scene.pauseActions`) does the same for the current step and counts at most once per step; asked again it only repeats the words. Start again rebuilds the same seeded round and keeps misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after the card reaches the notebook, with or without help: one ordinary sticker from the shell. No creation, discovery or journal entry is filed in this build ([decision 5](#open-decisions)); the notebook is a drawing, not a save.

## Rule tests (`logic.test.ts`)

- **Leaves and features:** every leaf has a known `outline` and `margin`; the three leaves are pairwise distinct; each feature's two values both appear among the leaves.
- **Cases:** for every case, `references` has exactly two distinct leaves, the find is one of them, **exactly one** reference `matches` on the case's feature, and the other reference matches the find on the *other* feature (so the distractor shares the easy clue); `answer(case)` is a pure lookup.
- **Rounds:** over 500 seeds per level, the round's case belongs to that level, the site square is one of three, the reference order is a permutation, the pre-cleared cell is a leaf cell; the same seed gives the same round; both cases, all three squares and both orders appear across the seeds.
- **Reveal:** `leafCells` for each leaf is 18–26 cells inside the grid; a brush path of at most 12 pats on 100-unit-spaced centers (the bot's path) reaches `revealed ≥ 0.7` for every leaf, every pre-cleared cell and every start; a single pat never clears a cell farther than the brush radius; `revealed` is monotone under more pats.
- **Site:** the Where answer equals the flag of the stone's square, the three flags differ in both color and shape.
- **Hints:** `glowTarget(round, step)` is the stone's flag for Where and `answer(case)` for Check; following it finishes the step.
- **Accounting:** a scripted level-1 round of red flag, blue flag, ribbon leaf, Check, star leaf, Check gives misses 2, hints 0; two wrong flags then the right one gives hints 1 and a second help request leaves it at 1; a Check with an empty slot changes nothing.
- **Layout:** `digLayout` at the four views for both levels: every target ≥ 100 units, the pet's corner clear, the magnifier inside `view`, the notebook corner inside `view`, the three flags not overlapping the record card or the references.
- **Registry, lands and how-to tests** pass with the new game, including the home land still fitting on one screen at every band with the new game ([decision 2](#open-decisions)).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` at level 1: six to eight pats along the tested brush path until Shown, tap the stone's flag, tap the matching reference, tap Check. At level 2: the same pats and flag, tap the print's edge (magnifier), tap the matching leaf's edge badge, tap that leaf, tap Check. It never taps a wrong flag or submits a wrong leaf; the scripted browser play adds one wrong flag and one wrong leaf itself. The same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). Goal: "Brush the dust off a stone, mark where the leaf print was found, then pick the leaf it looks like."
  - Steps: "Rub or tap the dusty stone until the leaf print shows" (all levels); "Tap the flag of the square the stone is in" (all levels); "Tap the leaf whose shape matches the print, then tap Check" `{ from: 1, to: 1 }`; "Tap the print's edge to see it up close, then pick the leaf whose edge matches, and tap Check" `{ from: 2, to: 2 }`.
  - Finish: "The record card goes into the field notebook."
  - Notes: "Brushing, looking and swapping a leaf are never counted against her" (all levels); "A wrong flag or a wrong leaf counts as a miss; after two the right one glows, which counts as a hint" (all levels); `{ from: 2, to: 2 }`: "Both leaves have the same shape at this level; only the edge, teeth or smooth, tells them apart"; and always: "The leaves and the cliff are made up for the island; nothing here is a real fossil, a real place or advice about digging."
- **Voice lines** under `fossil-dig.*`: `intro`, `instruct-brush`, `brush-first`, `found` (the one mud-and-stone sentence, [decision 6](#open-decisions)), `instruct-where`, `wrong-flag` (with `{flag}`), `where-recorded` (with `{flag}`), `instruct-shape` (1), `instruct-edge` (2), `edge-toothed`, `edge-smooth`, `not-ribbon`, `not-star-shape`, `not-star-edge`, `not-saw-star`, `match-lobed`, `match-unlobed`, `match-toothed`, `match-smooth`, `empty-slot`, `recorded`, `hint-flag`, `hint-leaf`, `done`. `{pet}` is optional in each.
- **Registration:** ID `fossil-dig`, name "Fossil Dig", spoken title `game.fossil-dig`. Region (subject) `tinker-lab`. Skills `['observation', 'comparing', 'evidence', 'recording']` (free strings). Bands: pre-K 1–2 ([decision 1](#open-decisions)). Home land **Tinker Lab** by default (13 games today, 14 with this one; [decision 2](#open-decisions)). Hub icon: a brush over a stone with a leaf print. Sticker: a seeded stone with the star or ribbon print and a little flag.
- **Co-play:** one person brushes, the other picks the flag and the leaf, then swap; at level 2 both say which edge they see before Check. **Off-screen** (optional, the studies' wording review still applies before any printed card): with a willing grown-up, pick up one fallen leaf outside, look at its edge, and say "smooth" or "teeth"; put it back where it was. No digging, no collecting, no rocks.
- **Couch:** none. Nothing here suits a controller face-off.
- **Rework couplings:** none required and nothing saved. A record card is a natural page for the [RW10](../rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) collection book; that is the rework's to define, and a recorded find must then be a permanent possession, never something lost, worn out or waiting.

## Check tier

New-game tier at build time (deep-time D2 / the earth-materials build session). Typecheck and unit tests (the rule properties above plus registry, lands and how-to tests). One scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 2, with one wrong flag, one wrong leaf, one flag tapped before Shown and one requested hint; one portrait screenshot at level 2 with the magnifier open. `fingerdemo` at both levels, since the level-2 bot must brush, open the magnifier and pick. `npm run build`, because the registry, lands, voice and how-to files change.

Device checks stay open: whether a four-year-old reads the dusty stone as "rub me" on an iPad; whether 8-unit teeth read as teeth at the drawn size before the magnifier; whether the flag-of-the-square idea lands without the pet's line; device speech of the leaf names.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** Keep all seven built defaults; a real plant, shell, track or dinosaur may be added after the session's source check against museum or university sources.

Each has a default the build uses. None blocks it. The deep-time study's decisions 2 (shared ownership: this is the one definition, and the audit above finds the Where flag and the feature comparison are decisions Splish Splash and Puzzle Pals never ask) and 5 (exploration and support: no persistence, supported finish as above) are settled here as defaults; its decision 1 (a content reviewer) is not needed for invented leaves and stays open for real species.

1. **Bands.** Default pre-K 1–2 only, as the studies' "K first" asks. Alternatives: preschool 1 with the Where flag stamped automatically when Shown (so its only decision is the outline), and a one-level school window at 2 until plans 3–4 are defined.
2. **Home land.** Default Tinker Lab (14th game; the land test decides whether it still fits at every band). Alternative: Bubble Beach, the study's trace-play backdrop. Either way the stone's cliff is drawn in the game, not in the land.
3. **Where accounting.** Default: a wrong flag is a miss (it is a fact in plain view). Alternative: location never counts and only Check does, if a four-year-old turns out to tap flags to see them wave.
4. **Region (subject).** Default `tinker-lab`. `REGION_IDS` has no earth-science subject and this slice adds none.
5. **Journal and record.** Default: nothing filed or saved; the notebook is a drawing. Alternative: file "a leaf can leave its print in stone" once a round has shown it, as Seesaw Balance files only what a round showed; any saved record card is the rework's collection book, not this game.
6. **The one sentence.** Default `found` line: "A leaf pressed into mud, and the mud became stone." No span of time, no "fossil" vocabulary test, no extinction wording below school (the study's decision 3). Alternative: add "long, long ago" if the developer prefers the time cue; never a number.
7. **Real leaves and later finds.** Default: none; the three leaves are invented and the card says so. A real plant, a shell, a track or any dinosaur content waits on the deep-time reviewer and is a separate content slice; a second impression shape (a shell) would be content, not a new level.
