# Attic Finds levels 5–6: Same Job, Different Tools (definition)

Defined 2026-10-30 on `claude/define-same-job` ([PR #1041](https://github.com/rjdunlap/neo/pull/1041)), slice **H4** of the [everyday-life-long-ago study](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order), from steps **3 *Same need*** and **4 *Context changes the answer*** of its [proposed ladder](../deep-dives/subjects/daily-life-long-ago.md#first-games-proposed-ladder-attic-finds) and its [candidate row](../deep-dives/subjects/daily-life-long-ago.md#candidates-and-overlap-decisions). **Built 2026-10-31 ([PR #1045](https://github.com/rjdunlap/neo/pull/1045)), batch attic-finds 2** (deviations are in [GAMES.md](../GAMES.md#attic-finds)); the text below is the definition as written. Originally docs only. Was ready to build: every open call has a default the build uses. Everything is invented island make-believe (no real tool, place, people, date or "old"), so no historian is needed; the study's reviewer decisions 3–5 gate only later real-object content.

**What it adds:** two appended levels of the built `attic-finds` game (`src/games/attic-finds/`; levels 1–2 [defined](attic-finds.md), levels 3–4 [defined](lid-and-lever.md)):

- **Level 5, *Same job*** (pre-K, school): a friend needs a load carried. Three attic things sit on the rug; two can do the job and one only looks as if it could. She tries them, then puts **every** one that can do the job in the cart and taps Check. Two jobs per round.
- **Level 6, *Right for the job*** (school): the same three things (basket, tray, pail) and three jobs: dry leaves, acorns, water. Every one can carry the leaves, two can carry acorns, only one carries water. The thing that was right a moment ago can be wrong now, because the **job** changed, not the thing.

**Fun action and purpose:** tap a thing and watch the pet use it: the leaves ride along in the basket, or fall straight through the bottomless hoop; the acorns roll off the flat tray; the water drips out between the basket's strips. The goal is **function over appearance** (two things that look different can do the same job, and a thing that looks right can fail it) and **suitability depends on the task** (what a job needs decides which tools work). It is the study's K–S comparison step, practised on invented objects; nothing claims a tool is old, new, better or a culture's.

- Levels 1–4, their IDs, rules, pins and their how-to wording do not change. No band, land, save field, journal entry, creation, couch entry or new registration is added.
- **Numbering.** The study's "steps 3–4" are planning labels; they take **IDs 5 and 6**, the next free IDs, as the [Lid and Lever definition](lid-and-lever.md) set. The study's later steps (Two sources, What can we tell?, Mend the exhibit) stay with H5 and will number from 7.

## Overlap and the boundary with H1 and machines/tools

- **Attic Finds levels 1–2** ask what one object *does* and which part *proves* it. Levels 5–6 ask what a *job needs* and which objects *meet* it: same attic, same shelf, same corner pet, but no crank, no Turn and no clue slot. H1's `supports(clue, claim)` stays the evidence rule at level 2; levels 5–6 use a separate pure rule, `works(tool, job)`, over visible properties. Neither reads the other's tables.
- **Machines/tools and inventions studies** own building and transmitting motion (Puppet Workshop, Gear Garden) and invention history. Here nothing is built, mended, plugged or improved: the tools are finished things with fixed properties, and the round never asks her to fix the basket so it holds water.
- **Second Chance Shed** (built 1–4; N3 defines 5–6) sorts a finished item to the place that can reuse, mend or recycle it, by kind. Here the item is fixed and the question is which *containers* meet a *carrying need*; no item is mended, sorted or kept.
- **Weather Wardrobe** chooses clothes for weather. The "context changes the answer" shape is shared on purpose (a coat is right for rain, not sun); the domain (carrying), the evidence (a free try that shows the result) and the all-that-work answer are different.
- **Fill and Dump** level 7 compares *how much* two containers hold by pouring. Here every container is big enough; what decides is a bottom, a raised edge and gaps, never capacity.
- **Sink or Float / Make It Float** own predictions about floating materials. A try here is the same kind of free experiment (never a miss), applied to a different property.
- **Helper Hustle** carries fruit home with helpers to count. No counting here, and nobody carries anything by number.

## The model

- **Properties.** A tool has a set of three visible properties: `bottom` (a floor that holds a load up), `rim` (raised sides, so round things cannot roll off and water cannot slosh over) and `tight` (no gaps, so water stays in).
- **Jobs.** A job is a pictured load and the properties it needs: `leaves` (a tied bundle of dry leaves) needs `{bottom}`; `acorns` (a heap of loose acorns) needs `{bottom, rim}`; `water` (water from the attic's rain jug for a thirsty window-box plant) needs `{bottom, rim, tight}`.
- **The rule:** `works(tool, job)` is `job.needs ⊆ tool.props`. A pure lookup: no seed, colour, pattern, position or order enters it.
- **The four tools** (all invented, drawn three-quarter from above so the inside, floor and edge are visible without turning):

  | Tool | Looks like | Props | Parts the magnifier shows (each tied to a property) |
  | --- | --- | --- | --- |
  | `basket` | a round woven basket with a handle | `bottom`, `rim` | woven floor (`bottom`: "A woven floor holds things up"), tall woven sides (`rim`), little gaps between the strips (not `tight`: "Little gaps between the strips. Smaller than an acorn.") |
  | `tray` | a flat wooden tray with two cut-out handholds | `bottom`, `tight` | flat floor (`bottom`), solid wood with no gaps (`tight`), a very low edge (not `rim`: "The edge is very low.") |
  | `pail` | a small wooden pail of staves bound by two hoops, with a rope handle | `bottom`, `rim`, `tight` | floor (`bottom`), tall sides (`rim`), staves pressed tight by the hoops (`tight`: "The boards are pressed tight together.") |
  | `hoop` | the basket's woven sides and handle with **no floor** (an invented woven ring) | `rim` | tall woven sides (`rim`), the open bottom seen through the middle (not `bottom`: "No floor! You can see the rug through it.") |

  The hoop and the basket share the weave, handle and seeded colour in a round, so they look alike and differ only in the property that matters (decision 7). No tool is plain, shiny, worn, old or new.
- **Why a try fails:** `reason(tool, job)` is the first property in `bottom → rim → tight` that the job needs and the tool lacks, with the load's own picture: no `bottom` → the load falls through; no `rim` → acorns **roll off** / water **sloshes over**; not `tight` → water **drips out between the strips**. A working try has no reason.
- **Rounds:**

  | Level | Jobs, in order | Tools on the rug | Working set per job |
  | --- | --- | --- | --- |
  | 5 | two **sets**, seeded order (the authored first round: leaves first) | leaves set: basket, tray, hoop · acorns set: basket, pail, tray | leaves: basket, tray (hoop fails) · acorns: basket, pail (tray fails) |
  | 6 | leaves, acorns, water in a seeded order (the authored first round: that order) | basket, tray, pail, the same three for every job | leaves: all three · acorns: basket, pail · water: pail |

  The seed also picks the tools' left-to-right order on the rug (a permutation, re-dealt per job), each tool's palette colour from a small list (the hoop takes the basket's), and the friend (a seeded critter from the existing cast). Jobs, properties and working sets never vary with the seed.
- **No dominant answer.** Because a Check asks for **every** thing that can do the job, "always the pail" finishes only the water job; the leaves and acorns jobs need her to see that other things work too. At level 6 the basket and tray each flip from working to failing as the job changes.

## Screen and controls

The same attic as levels 1–4 (roof line, round window, the shelf across the top), with no crank, Turn button, clue chips or claim slot.

- **Landscape (1024×768 design area):** under the shelf, top-centre, the **job card** (300×150): the friend beside the load (the leaf bundle, the acorn heap or the rain jug and the thirsty plant), with the load's picture large. The **rug** across the middle holds the three **tools**, each drawn about 150 units across with a 150×150 hit box, at least 30 units apart. The **cart** (a little wooden wagon, 360×140) sits bottom-right with **three 110-unit slots**; **Check** (a 104-unit green button) sits left of the cart, dim while the cart is empty. The pet keeps its 150-unit bottom-left corner.
- **Portrait (768×1024):** shelf at the top, the job card under it, the three tools in one row across the middle (3 × 150 + 2 × 40 = 530 units), and the cart with Check in a row beneath them, right-aligned so the pet's corner stays clear.
- **Tap a tool: try it (free, any time).** The tool lifts on touch-down; the pet takes it to the load, the load goes in, and the pet walks it two steps toward the friend and back (1.6 s). Working: the load rides and the pet says `attic-finds.held`. Failing: the load does its `reason` (leaves fall through the hoop, acorns roll off the tray, water sloshes over the tray or drips out of the basket) with the line for it. Either way the **magnifier** (the existing 300-unit detail window, top-right of the rug) shows the part that decided it, with its line. The load resets afterwards. A tool already in the cart can be tried too.
- **Drag a tool to the cart: choose it.** It drops into the nearest free slot (`src/engine/drag.ts`, nearest-target resolution); dropped elsewhere it goes back to its rug place. Tapping a tool in the cart, or dragging it out, puts it back. Choosing is free until Check.
- **Check:** the cart's tools try the job in turn, left to right, the same animation as a try:
  - **Any failing tool in the cart:** one **miss** for the Check (not per tool). Each failing tool shows its reason and hops back to the rug; working tools stay in the cart.
  - **Every tool in the cart works, but a working tool is still on the rug:** not a miss. The cart's tools carry the load a little way, and the pet says `attic-finds.one-more` ("Those can do it! One more on the rug can too. Can you find it?"); the cart keeps its tools.
  - **Exactly the working set:** the job is done: the cart rolls to the friend, the friend cheers, a small picture of the load lands on the next shelf spot with the existing chime, and the pet names the shared job or the change of job (level 5: `same-leaves`, `same-acorns`; level 6: `context-leaves`, `context-acorns`, `context-water`; below). The next job's tools are dealt.
  - **Empty cart:** the cart wiggles and the pet repeats the instruction; nothing counted.
- **Finish:** after the last job (two at level 5, three at level 6) every shelved load bounces once and the round finishes.
- **Touch and timing:** taps during a try or Check animation are ignored (the drag of another tool is not started); a cancelled or lost drag returns the tool to its rug place; leaving the scene mid-animation stops it with the scene. Hit boxes use local units and the closest target wins.
- **Sound and music:** a soft woven rustle for the basket and hoop, a wooden knock for the tray and pail, a pentatonic rising pair when a load rides, a falling pair for a fall-through, roll-off or drip, the shelf chime; `STYLES.paint` keeps playing as at levels 1–4.

### First rounds

- **Level 5, job 1 (leaves; rug: hoop, basket, tray):** "Our friend needs the leaves carried to the window box. Try the things on the rug. Put every one that can do it in the cart, then tap Check." Tapping the hoop: the bundle drops through onto the rug, "No floor! The leaves fell right through." Dragging the basket and the hoop to the cart and tapping Check: the basket carries, the hoop drops the leaves and hops back, one miss. Dragging the tray in and Check: done; "A basket and a tray. They look different, but they do the same job: each has a floor to hold the leaves." Job 2 is the acorns set.
- **Level 6, job 3 (water, after leaves and acorns; rug: tray, pail, basket):** "Now water for the thirsty plant!" The cart is empty again (it empties between jobs). Tapping the basket: the water drips out between the strips, "The water dripped out between the strips," and the magnifier shows the gaps. Pail alone and Check: done, "Only the pail keeps water in. A different job needs different things." (The `context-*` lines never mention another job, so they stay true in any seeded order.)

## Levels, bands and ranges

| Level | Name | Bands | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 5 | **Same job** | pre-K, school | Which things to try, which to put in the cart, when to Check | Two jobs done, each with exactly its two working things |
| 6 | **Right for the job** | school | The same, while the job changes and the same three things succeed or fail | Three jobs done |

| Band | Before | After |
| --- | --- | --- |
| lap, toddler | `{3,3}`, `{3,4}` | unchanged |
| preschool | `{ min: 1, max: 1 }` | unchanged |
| pre-K | `{ min: 1, max: 2 }` | `{ min: 1, max: 5, order: [1, 2, 5] }` |
| school | `{ min: 2, max: 2 }` | `{ min: 2, max: 6, order: [2, 5, 6] }` |

The `order` keeps levels 3–4 out of pre-K and school (they sit between 2 and 5 by ID): `clamp` reads `order`, and `entryLevels: [3, 4]` still lands a carried 3 or 4 on the band's easiest level (`landing`), so a toddler who turns three, then four, starts pre-K at 1. A saved pre-K 2 steps up to 5, a school 2 to 5 then 6. No saved level moves. The Lid and Lever rule tests that assert "pre-K and school unchanged" change to these ranges in the build.

`describeLevel` uses the plan names: 5 "Same job: find every thing that can carry the load (two can, one only looks right)"; 6 "Right for the job: leaves, acorns, then water, and which things can carry each".

## Accounting, help and finishing

- **Never a miss:** trying any tool (a free experiment, before or after choosing), opening or closing the magnifier, dragging tools into and out of the cart, an empty-cart Check, a Check whose tools all work while another working tool is still on the rug, repeated taps during an animation, and repeating the instruction.
- **A miss:** a Check with at least one failing tool in the cart; one per Check, whatever the number of failing tools. The response is the failing tools doing their reason, visibly, with the pet's line, and hopping back.
- **Hint:** after two misses on one job, the job's working tools glow on the rug and in the cart, and the magnifier opens on the deciding part of one failing tool; `hints++` **once for that job**. **Show a hint** in the pause sheet gives the same glow and counts at most once per job (asked again on the same job it only repeats the words). Start again rebuilds the same seeded round and keeps misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after the last job, with or without help: one ordinary sticker from the shell. Nothing is kept: no creation, discovery or journal entry (decision 6).
- **Adaptation:** smooth and struggling rounds step as usual inside each band's `order`. Level 5's two jobs give at most a few counted Checks, so one careless Check still leaves a round smooth (at most one miss).

## Logic (`logic.ts`)

- `Plan.id` widens to `1 | 2 | 3 | 4 | 5 | 6` and `mode` gains `'same' | 'context'`; `PLANS` gains ids 5 and 6 with the names above; `planFor` already finds by `id`; `isFree` stays `lever | peek` (levels 5–6 count).
- `Prop = 'bottom' | 'rim' | 'tight'`; `ToolId = 'basket' | 'tray' | 'pail' | 'hoop'`; `JobId = 'leaves' | 'acorns' | 'water'`; `TOOLS` (props, parts with their property and line), `JOBS` (needs, load picture), `works(tool, job)`, `reason(tool, job)` (`'fell' | 'rolled' | 'sloshed' | 'dripped' | null`), `workingSet(job, tools)`.
- `SETS` for level 5 (`leaves: [basket, tray, hoop]`, `acorns: [basket, pail, tray]`) and `CONTEXT_TOOLS = [basket, tray, pail]` for level 6.
- `makeJobRound(plan, rng, first)`: the jobs in order (authored on `first`), and per job the rug permutation and colours; `jobState(job, tools)` and pure steps `tryTool`, `addToCart`, `removeFromCart`, `checkJob` (`'empty' | 'miss' | 'one-more' | 'done'`, returning the failing tools), `helpJob` (counts once), `glowingTools`.
- `atticLayout(view, level)` gains the job card, three tool boxes, the cart with its three slots, Check, the magnifier and three shelf spots for levels 5–6.

## Rule tests (`logic.test.ts`)

- **Rule purity:** for every tool × job, `works` equals `needs ⊆ props`; recolouring, reordering or re-dealing a tool never changes `works`; `reason` is null exactly when `works` is true and otherwise names the first missing property's outcome for that load.
- **Sets:** every level-5 set has exactly two working tools and one failing tool; the hoop fails the leaves only for lack of a `bottom`, and the tray fails the acorns only for lack of a `rim` (the look-alike differs in one property).
- **Context:** at level 6 the working sets are `{basket, tray, pail}`, `{basket, pail}` and `{pail}`; the basket and the tray each work for one job and fail another; no single tool's selection alone completes every job.
- **Check:** for every job and every subset of its tools (all 8), `checkJob` returns `done` exactly for the working set, `miss` exactly when a failing tool is included, `one-more` exactly for a non-empty proper subset of the working set, `empty` for none; the cart keeps its working tools after a miss.
- **Rounds:** over 500 seeds per level, level 5 has two jobs (one per set, both orders appearing), level 6 three (all three jobs, more than one order appearing); every rug is a permutation of the job's tools; the hoop's colour equals the basket's; the same seed gives the same round; the authored first round starts with leaves.
- **Hints:** `glowingTools(job)` is the working set, and following it gives `done`; `helpJob` counts at most once per job; a scripted level-6 water job with `{basket}`, `{basket, tray}`, then help, then `{pail}` gives misses 2, hints 1; trying every tool any number of times leaves misses 0.
- **Bands:** pre-K `{1,5,[1,2,5]}`, school `{2,6,[2,5,6]}`, lap/toddler/preschool unchanged; `landing(3, prek, [3,4])` and `landing(4, school, [3,4])` give the band's first ID; stepping up from 2 at school gives 5, then 6.
- **Layout:** at the four views for levels 5 and 6, every tool box, cart slot and Check is at least 100 units, inside `view` and clear of the pet's corner and the shell buttons; the three tools do not overlap each other or the cart; the magnifier and three shelf spots are inside `view`.
- **Registry, lands and how-to tests** pass, with no "later levels" wording on the card.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()`): level 5, each job: tap the failing tool first (a free try that fails), tap one working tool (it holds), drag both working tools to the cart, tap Check. Level 6, each job: tap one tool, drag the job's working set to the cart, tap Check. It never submits a failing Check. The same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). Strings that become untrue at 5–6:
  - Goal (whole ladder, no level wording): "Turn, crank and try attic things: watch what they do, and find what makes them work."
  - Step "Crank it again any time to watch." becomes `{ from: 1, to: 4 }`; add `{ from: 5, to: 6, text: 'Tap a thing on the rug to try it on the job and watch what happens.' }` and `{ from: 5, to: 6, text: 'Drag every thing that can do the job into the cart, then tap Check.' }`.
  - Finish: `{ from: 5, to: 5, text: 'Both jobs are done; their loads sit on the shelf.' }`, `{ from: 6, to: 6, text: 'Leaves, acorns and water are carried; all three sit on the shelf.' }`.
  - Note `{ from: 5, to: 6 }`: "Trying things is never counted against her. A Check with a thing that cannot do the job counts as a miss; a Check that leaves out a thing that could is not, and the pet asks for one more. After two misses on a job the right things glow, which counts as a hint. Everything in the attic is made up for the island; nothing here is a real old thing."
- **Co-play hint** (shared, today "One of you cranks while the other finds the clue…"): "Take turns: one tries a thing while the other watches what happens. Before Check, both say which ones you would pick."
- **Voice lines** (`voice-script.ts`, each with an optional `{pet}`; no slots, so all can be rendered clips):
  - `attic-finds.instruct-same`: "Try the things on the rug. Put every one that can do the job in the cart, then tap Check."
  - `attic-finds.instruct-context`: "The job changes each time! Try the things, then put every one that can do this job in the cart."
  - `attic-finds.job-leaves`: "Our friend needs the leaves carried to the window box." · `job-acorns`: "Now a heap of acorns to carry." · `job-water`: "Now water for the thirsty plant!"
  - `attic-finds.held`: "It held!" · `fell`: "No floor! It fell right through." · `rolled`: "The acorns rolled off the low edge." · `sloshed`: "The water sloshed over the low edge." · `dripped`: "The water dripped out between the strips."
  - Parts: `part-woven-floor`, `part-tall-sides`, `part-gaps`, `part-flat-floor`, `part-solid`, `part-low-edge`, `part-staves`, `part-no-floor` (the lines in the tool table).
  - `attic-finds.empty-cart`: "Put the things that can do it in the cart first." · `one-more`: "Those can do it! One more on the rug can too. Can you find it?" · `hint-tools`: "These ones can do it. Look at what they have."
  - `attic-finds.same-leaves`: "A basket and a tray. They look different, but they do the same job: each has a floor to hold the leaves." · `same-acorns`: "A basket and a pail. Different shapes, same job: tall sides keep the acorns in." · `context-leaves`: "All three have a floor, so all three can carry leaves." · `context-acorns`: "Acorns roll off the tray's low edge, so only the basket and the pail can carry them." · `context-water`: "Only the pail keeps water in. A different job needs different things." · `jobs-done`: "Every job done!"
  - `ctx.instruct` uses `instruct-same` / `instruct-context` followed by the current job line, so the corner pet repeats both when tapped.
- **Registration:** `PLANS`, `LEVELS` (the ranges above), `describeLevel` and `coplayHint` change; ID, name, title line, region (`story-grove`), skills (add `'comparison'`), music, bands list, `entryLevels`, hub icon and sticker do not. Story Grove's capacity is unchanged (no new game). Couch: none.
- **Off screen** (optional; the study's card review still applies before any printed card): with a grown-up, find two different things at home that can carry the same small load of dry toys, and one thing that cannot; then ask whether either could carry water. Nothing is taken apart, and "let's try it" uses only safe, ordinary things the grown-up chooses.
- **Rework couplings:** none. Nothing is saved; the shelf is the round's picture.

## Build and check tier

**New-interaction tier** (tap-to-try plus a drag into a three-slot cart is new input inside an existing game): typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (`atticjobs`, with its README row) at level 5 (one free failing try, one failing Check, one partial Check answered by `one-more`, then done) and level 6 (a requested hint on the water job, then done), finishing with the expected misses and hints; one portrait screenshot at level 6 with the cart holding a tool and the magnifier open; `fingerdemo` at levels 5 and 6; `npm run build`, because the how-to and voice files are shared.

### Expected files

`src/games/attic-finds/logic.ts`, `logic.test.ts`, `index.ts` (and any new drawing helpers inside the game folder); `src/content/howto.ts`; `src/content/voice-script.ts`; `scripts/browser-check.mjs`; README (the inventory row's levels and the browser-check row), `docs/GAMES.md` (the Attic Finds entry), `docs/VERIFICATION.md`.

Device checks stay open: whether a four-year-old reads the hoop's missing floor before trying it, or only after the leaves fall; whether "put every one that can" is understood as *all*, or she stops at one and needs `one-more`; whether the water drip reads at the drawn size on an iPad; device speech of the new lines.

## Open decisions

Each has a default the build uses. None blocks it.

1. **Bands.** Default pre-K 5 (after 2) and school 5–6. Alternative: school only for both, keeping pre-K at 1–2.
2. **A partial Check.** Default: not a miss; the pet asks for one more. Alternative: a miss, which would punish a true but incomplete answer, against the study's "never penalize choosing either working object".
3. **Choosing.** Default: tap tries, drag chooses (no tap-then-cart-tap, as at level 2). Alternative: a Choose button under each tool, more targets on the rug.
4. **Level 6's tools.** Default: basket, tray and pail for all three jobs, re-dealt per job, the cart emptied between jobs. Alternative: add the hoop as a fourth tool (fails all three; a four-tool rug needs its own layout proof).
5. **Real tools.** Default: none; every tool is invented and the card says so. Any real basket, pail or tray from a located place and time waits on the study's decisions 3–5 (H6) and is a separate content slice.
6. **Shelf and journal.** Default: the shelf shows each job's load for the round only; no discovery filed. Alternative: file "different tools can do the same job" once level 6 is finished, as Seesaw Balance files only what a round showed.
7. **The look-alike.** Default: the hoop shares the basket's weave, handle and colour in a round, so only the floor differs. Alternative: give it its own colour, which makes it easier and weakens the appearance-versus-function point.
