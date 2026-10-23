# Sorting Machine, levels 1–3 (definition)

Defined 2026-10-23 as slice H1 of the [how-computers-work study](../deep-dives/subjects/how-computers-work.md#build-slices-in-order) ([packet](../deep-dives/subjects/RECOMMENDATIONS.md#how-computers-work-recommendations)), [PR #871](https://github.com/rjdunlap/neo/pull/871). **Docs only: no game, ID, voice line or save field exists yet.** Every open call in [Open decisions](#open-decisions) has a default the build can use. The study's CS-educator review of the data / signal / program / current / memory wording is a content gate on the spoken lines and the how-to card, not on the rules; the build may start on the defaults and merges only after that read. H2 builds levels 1–2; H3 appends level 3. Levels 4–8 (including Festival Signals, H4) stay in the study and are not defined here.

**Fun action and purpose:** send a pictured critter through a toy machine and watch a door open or stay shut; then build the machine a sign asks for by choosing its sensor or gate, and check it against every critter. Learning goal: a rule is a small machine whose parts can be inspected one at a time (a sensor reads a property, a gate combines readings, a door shows the result), and a machine is right only if it works for **every** critter, so one lucky test is not enough. A false reading is a real answer, not a broken wire. Not electricity ([Circuit Garden](circuit-garden.md)), not hidden-rule guessing ([Critter Crossing](../GAMES.md#critter-crossing)), not putting things in sets ([Critter Sort](../GAMES.md#critter-sort)): the child constructs the rule and reads the signals in between.

## Overlap and reuse

- **Critter Crossing** observes a hidden rule; Sorting Machine hands her the rule as a sign and lets her build and check the machine. **Critter Sort** sets the sorting hoops; here the sorting is done by a machine she assembles. No shared code beyond palette and critter art.
- Reuse `CRITTERS`/`attach()` in `src/art/critter.ts` for the cast (cosmetic species and colors only), `onTap` for every control, `RoundButton` (as in Ferry Jam) for Undo, and Ferry Jam's pattern for a bot that finishes through the same taps. No new engine, wire drawing, save field or shared helper.
- Booleans here are abstract signals on a diagram, not current in a wire. The sign and card never say "electricity", "power" or "circuit".

## The model (`logic.ts`)

- **Properties** are arbitrary toy accessories: `hat`, `whiskers`, `boots`. A **brief** uses exactly two properties `P`, `Q` (a seeded pair from the three). The cast is the four **fixtures**, one for each tuple `(P,Q)` in `00, 01, 10, 11`, each a critter with a fixed cosmetic species and color per brief. Species never changes a truth value, and all four tuples are always on the screen.
- **Values** are `true`, `false` or `incomplete`. A graph is a finite acyclic list of nodes: `source(P|Q)`, `sensor(p)`, `gate(AND|OR, a, b)`, `output`. Slots are `empty` until she fills them. `evaluate(graph, tuple)` returns `incomplete` if any needed slot is empty; it never treats an empty slot as `false`.
- **Check** compares `evaluate` with the sign's **target** on all four fixtures regardless of what she has tried. `check(graph, target)` returns `{ status: 'incomplete', slot }` or `{ status: 'pass' }` or `{ status: 'fail', rows }` (every failing row, in screen order; the first is shown).
- **Plans** (`planFor(level)`) are frozen, with `candidates` (what a slot can hold), `target` and `solutions(brief)`, the full list of accepted graphs (tested for non-emptiness; any graph whose four outputs equal the target is accepted at every level, not only the authored one).

| Level | Name (`describeLevel`) | Machine | Sign (target) | Rounds |
| --- | --- | --- | --- | --- |
| 1 | See the signal | Fixed sensor for `P`, a door; two fixtures (`P=1`, `P=0`) | none; the door answers | 3 seeded briefs (one per property) |
| 2 | Choose the sensor | One sensor slot (`P` or `Q`) feeding the door; four fixtures | "Friends with `X` may come in", `X` = `P` or `Q` | 6 briefs (3 pairs × 2 targets), one per round |
| 3 | Both badges | `P` and `Q` sensors fixed; one gate slot (AND or OR) | "Only friends with `P` **and** `Q`" | 3 briefs (3 pairs), seeded fixture and sensor order |

At level 3 the target is always AND (OR is level 4's), so the choice is two ways; the free Sends and the persistent per-fixture result marks are how she finds it, not luck. **Bands (`BandLevels`):** `school: { min: 1, max: 2 }` for H2, `{ min: 1, max: 3 }` once H3 ships. No `order`. No lap, toddler, preschool, pre-K or grown-up window; nothing earlier is observed, and the older editor is a separate decision.

## Screen and controls

- **Stage, machine, sign.** Left to right in landscape (stacked top to bottom in portrait): the **fixtures** (four critter cards, each at least 120 × 140 units; two cards at level 1), the **machine** (sensor slot(s), gate slot, door), and the **sign** (a picture of the request with the target door shown under each fixture: an open arch, or a flat bar with a hollow ring). Controls: **Send** (at least 120 × 100, the one large action), **Check** (levels 2–3), **Slow** toggle (a turtle, at least 100 × 100), Undo (`RoundButton`, radius 54) and the corner pet's Help. All sit clear of the bottom-left pet (start at `x = 150`) and the corner buttons.
- **Slots and choices.** A slot is at least 110 × 110 units. Tapping an empty or filled slot opens a **picker** of its candidates (2 at levels 2–3), each at least 110 × 110, drawn as the property's picture (hat, whiskers, boots) or the gate's picture (AND: two arms joining, OR: two arms either; the spoken word is "and" and "or"). Tapping a candidate fills the slot with a click and closes the picker. Re-picking replaces; nothing is lost.
- **Send.** Tap a fixture to put it on the stage (it hops forward and stays lit), tap Send to run it. The run is three stages, each a short scene-owned tween with a pentatonic note from `src/audio/notes.ts`: the critter reaches the sensor, the **value token** settles (filled, raised star for `true`; hollow dashed ring for `false`; a dotted empty ring with "?" for `incomplete`; optional `1`/`0` labels, never color alone), then the door opens or rests. Slow makes each stage wait for another tap of Send. A second Send tap during a run jumps to the settled picture (no animation is required to read the result). A finished run leaves a **result mark** (open arch or bar) under that fixture that persists for the round; the machine's tokens for the last-run critter stay on screen until the next run.
- **Level 1** has no slot and no Check: Send both critters (any order, any number of times). **Done** (a big tick, dim until both critters have been sent at least once) ends the round. A dim Done speaks "Send the other friend too."; that tap is not a miss.
- **Check.** Evaluates the whole domain at once. Pass: all four fixtures walk through their doors, the door shows the matching marks, `ctx.finish`. Fail: a gentle boing, the first failing fixture is selected and run once, and a persistent badge sits on every failing fixture. The pet says what happened ("The hat friend got in, but the sign says only whiskers.") and names the **requested** door, not the answer. Incomplete: the first empty slot pulses and the pet says "Pick a sensor first"; no miss.
- **Undo** takes back the last slot choice. **Start again** is in the pause sheet. Neither counts for anything.
- **Speech:** `ctx.instruct` states the brief; the pet repeats it. Navigation never needs reading. The sign is a picture and words, so a child who cannot read still sees which fixtures should pass.
- **Feel:** a calm existing music style (she is not making music). Code-drawn Pixi shapes and palette colors only. Decorations (steam, lamps) are `eventMode = 'none'`.

## Accounting, help and finishing

- **Never a miss:** any Send, picking or changing a slot, Slow, Undo, Start again, repeating the instruction, an incomplete Check, or opening the how-to.
- **One miss:** a **complete** machine whose Check fails, regardless of how many rows differ. The miss never shows a count of failing rows.
- **The two-miss glow:** at the round's second miss, and every second miss after, the slot that can change toward a solution glows and `hints++` once. (Level 2: the sensor slot. Level 3: the gate slot.)
- **Requested Help** (the pet's button) is one hint each press. Level 1: Help makes the unsent fixture hop. Level 2: first press selects a fixture that tells the two sensors apart and runs it; second press installs the correct sensor and invites Check. Level 3: first press selects and runs a fixture the current gate gets wrong (a mixed-badge friend) and shows both incoming values; second press installs the correct gate and invites Check. A Help that installs never ends the round by itself: a Check does.
- **Finish:** one ordinary sticker per round, with or without help, through `ctx.finish({ misses, hints })`. No creation, discovery or journal entry is filed in the first build.
- **Adaptation (level 1 decision):** level 1 ends with `misses: 0, hints: 0` when unhelped and the unchanged shell rule applies (two smooth rounds step up). That is **exposure, not evidence of Boolean understanding**; no miss or hint is invented for it, and the how-to note says it is a first look. A level that can only produce hints (Help pressed) is treated like other free-error levels: adaptation, not mastery. Two struggling rounds at levels 2–3 step down as usual. Saved levels and pins are untouched.

## Rule tests (`logic.test.ts`)

- `evaluate`: for each plan, every tuple gives the expected value; any empty slot yields `incomplete`, never `false`; a graph with a gate over an empty child is `incomplete`.
- **Coverage:** every brief has exactly four fixtures, one per tuple, and the fixture set is identical under cosmetic reordering and species changes.
- **Solvability:** each brief has at least one accepted graph; level 2's other sensor and level 3's other gate each fail on a stated row (level 2: both mixed tuples; level 3: `01` and `10`), so the wrong answers are exactly distinguishable. `check` accepts every graph in `solutions` and no other graph in the candidate space.
- **Check:** is order-independent (shuffled fixtures give the same result), evaluates untried rows, returns `incomplete` before `fail`, and one failing submission is one miss.
- **Help:** `helpFor(graph, brief, presses)` selects a fixture on which the current graph is wrong, then installs a graph in `solutions`; from every reachable partial state, installation passes `check`.
- **Seeds:** the same seed gives the same brief, fixture order and cosmetic cast; level 1 covers the three properties across seeds; level 2 covers all six briefs; level 3 covers all three pairs.
- **Layout:** `machineLayout(level, view)` at the four views the lands test uses: every target at least 100 units (the picker candidates 110), nothing under the bottom-left pet or corner buttons, portrait stacks rather than shrinks.
- **Registry, lands and how-to tests** pass with the new game (card per level; no "later levels" wording).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true` and `autotouch()` through the same taps. Level 1: tap the hat critter, Send, tap the no-hat critter, Send, Done. Level 2: tap a fixture, Send, open the picker, choose the sensor, Check. Level 3: tap a mixed-badge fixture, Send, open the gate picker, choose, Check. The bot never takes an action a child cannot take, and its fixture choice before Check is the one `helpFor` would pick. It stands in for the scripted solve.
- **How-to card** (`src/content/howto.ts`). Goal: "Build the machine the sign asks for, then check it on every friend." Steps: "Tap a friend, then Send, and watch the sensor and the door" (all levels); "Tap a slot to choose a part" `{ from: 2, to: 3 }`; "Check tries every friend at once" `{ from: 2, to: 3 }`; "Send both friends, then tap the tick" `{ from: 1, to: 1 }`. Finish: "Every friend gets the answer the sign wants." Note: "Sending is never counted. A wrong Check only costs a gentle hint." Level 1 note: "This first look is a try-out, not a test."
- **Voice lines** under `sm.*`: `intro`, `instruct.1` / `instruct.2` / `instruct.3`, `send-other`, `pick-first`, `value-true`, `value-false`, `value-incomplete`, `door-open`, `door-shut`, `check-pass`, `check-fail.<prop>` (one per property so device speech never fills a template), `help.*`, `done`. `{pet}` optional.
- **Registration:** ID `sorting-machine`, name "Sorting Machine", spoken title `game.sorting-machine`, region `tinker-lab`, home land **Tinker Lab** (13 games today, 14 with this one; it appears only from the school band, and the lands test proves the fit). Skills `['logic', 'rules', 'testing', 'systems']`. The hub icon is a gate with a door and a hat above it. The sticker is a seeded door with a critter in it.
- **Co-play:** one person reads the sign and chooses the part, the other sends the friends and says what the door did. **Off-screen:** a shoebox with a "hat" card slot and two paper doors, sending stuffed toys through ("did the hat open it?"). A practical-card version waits for the existing named-review process; none is drafted here.
- **Couch:** none. Controller support is separate work.

## Check tier

H2 (levels 1–2) and H3 (level 3) are new-game tier and new-interaction tier. Typecheck and unit tests (all above, plus registry, lands and how-to tests); then one scripted play of the new game through a `browser-check.mjs` filter (level 1 and the top built level, one failed Check, one Help) and one portrait screenshot; `fingerdemo` at the top built level; `npm run build` because the registry, lands, voice and how-to change. Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Device checks stay open: whether the sign's door pictures read without words on an iPad, how a seven-year-old reads the hollow ring, and level 1's value.

## Open decisions

Each has a default the build uses; none blocks H2.

1. **Region and land.** Default: region `tinker-lab`, land Tinker Lab (a 14th game, school only). Fallback if the lands test fails: Rainbow Meadow (12 games today). Puzzle Peaks is at 13.
2. **Level 1 and adaptation.** Default: the unchanged shell rule, described as exposure (above). The alternative is a shell change so a level may declare itself unscored, which this slice does not propose.
3. **Range.** Default: school only, 1–2 then 1–3. The alternative is a pre-K window for level 1 after someone watches a five-year-old play it.
4. **Level 3 variety.** Default: AND only, three briefs, two ways to answer. The alternative is to bring level 4's OR brief forward, which blurs the ladder.
5. **Review.** CS-educator read of the spoken lines and card (data, signals, programs, current, memory) before the build merges.
