# Gadget Bench, levels 1–3 (definition)

Defined 2026-10-23 as slice 1 of the [inventions study](../deep-dives/subjects/inventions.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/inventions.md#first-games-proposed-ladder-gadget-bench) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#inventions-recommendations). Docs only: no game, ID registration, voice line, save field or band exists yet.

**Status: built 2026-10-27 (PR #1012), levels 1–3; the neighbors are Bunny, Duck, Cat and Bear, with the hedgehog and mouse standing in as bunny and cat because the island has no hedgehog or mouse critter.** Defined and buildable as follows. Levels 1–3 use five invented parts with fixed, stated properties and say nothing about real inventions, inventors, dates or tools, so no reviewer gates them (the study's reviewer gates are for real inventions, Workshop Cases' registration and the page cards). The only default the developer may want to change is the home land ([decision 1](#open-decisions)): the study's Tinker Lab is **full** since Sense Detective registered, so this packet defaults to **Treehouse**, measured below. Level 4 is [defined below](#level-4-fix-it-day-definition) and built; levels 5–6 are [defined below](#levels-56-little-gate-and-new-box-definition); level 7 and Workshop Cases are later definitions.

**Fun action and purpose:** a wooden cart stands on a workbench with a few big sockets. A neighbor holds up a picture of what it needs ("my apples must not get wet"). She picks, or drags, parts into the sockets, taps **Try** and watches the cart roll along a little path, stopping at the first thing it cannot handle; then she **gives** it to the neighbor. The learning purpose is the study's engineering-design core for the youngest audiences: **a gadget is made to meet someone's need** (K-2-ETS1-1), **a part's shape and place decide what it does** (K-2-ETS1-2), and **trying two designs shows which works** (K-2-ETS1-3). Order follows Beck et al. (2014): look at a finished gadget, change one that is shown, only then choose parts and places for oneself.

## Identity and overlap

The study's test is applied here, with the table that proves each level passes it:

- **Habitat Helpers** ("pick three pieces for three pictured needs") is the nearest game. Gadget Bench differs at every level: level 1 compares two finished designs that differ in one part and must be **tested**, not matched to a picture; level 2 **changes** a shown design; level 3 makes a part's **socket** decide whether it works (the same umbrella in the front socket does nothing). The rule test "a swapped placement fails" ([below](#rule-tests-logictestts)) is the standing proof that level 3 is not Habitat Helpers.
- **Chain Reaction** owns routing a marble through sockets; no Gadget Bench part is a ramp, ball or mechanism, and the cart's path is an authored check, never a simulation.
- **Gear Garden, Lift It, Wobble Works, Circuit Garden, Mix & Make** keep transmission, force, structure, circuits and combining. The lantern lights "the dark path" as a fixed property, never a circuit.
- **Welcome Ways** (engineering-design study, one shared entrance for several visitors) is a sibling, not a clone: Gadget Bench is one neighbor, one need, build-try-give; Welcome Ways is one design for several different visitors. They share Try-is-free accounting and nothing else.
- **Timeline Trail** keeps ordering of then and now; the lantern, candle and bulb rung stays a later shared definition.

## The model (`logic.ts`)

- **Sockets:** `under`, `top`, `front`. A gadget is `{ under?: PartId, top?: PartId, front?: PartId }`. A part may be dropped in any socket (experiments are free) but works only in its **right socket**.
- **Parts** (five invented toys; none is a real device):

| Part | Right socket | Fixes condition | Picture and spoken name |
| --- | --- | --- | --- |
| Big wheels | `under` | `bump` | two tall red wheels; "big wheels" |
| Float | `under` | `puddle` | a blue ring; "a float" |
| Umbrella | `top` | `rain` | a yellow umbrella; "an umbrella" |
| Lantern | `front` | `dark` | a green lamp on a hook; "a lantern" |
| Flag | none (decoy) | nothing | a purple flag; "a flag" |

- **Conditions** (pictured on the path in order): `smooth` (any gadget passes, including an empty one), `bump`, `puddle`, `rain`, `dark`. `need(condition)` returns its one `{ part, socket }`; `smooth` needs nothing.
- **A path** is an ordered list of conditions starting with `smooth`. `runPath(gadget, path)` returns `{ ok: true }` or `{ ok: false, at: condition, socket }`, the **first** condition whose needed part is not in its socket, and the socket responsible. Parts elsewhere never help or hurt, so an extra decoy in a free socket still passes.
- **Authoring rule for levels 1–3:** a path never holds two conditions that need the same socket (`bump` and `puddle` both need `under`), so every request has a design that passes. Conflicts begin at level 4 or later.
- **Passing set:** `passingDesigns(request, open)` enumerates every assembly of the tray's parts over the open sockets (each socket empty or one part, no part twice) that passes. Rules, hints and tests read this set, never a stored answer.
- **Rounds:** each level is three rounds; seeded from `ctx.rng`: the neighbor and what it carries (`CRITTERS`: Hedgehog with apples, Duck with a pond bag, Mouse with cheese, Bear with honey), which side the passing gadget sits on (level 1), the order of the tray, colours. The rule graph never changes with the art. The first round of each level is authored so the how-to demonstration matches.

### Levels

| Level | Name | Bands (default) | What she does | Round |
| --- | --- | --- | --- | --- |
| 1 | **Which one works?** | preschool, pre-K | Two finished gadgets and one condition. Taps either to Try it (free), then gives one | Three requests |
| 2 | **Change one part** | pre-K, school | The pet builds a gadget for the first neighbor and it works; a second neighbor needs something different and she changes one part | Three neighbor pairs |
| 3 | **Build it** | pre-K, school | A cart with two empty sockets, a tray of four parts and a path of two conditions; she chooses the parts and where each goes | Three requests |

Ranges (a `BandLevels` table): preschool `{1,1}`, prek `{1,3}`, school `{2,3}`. No lap, toddler or `grownup` range and no `GROWNUP_GAMES` entry: the study finds nothing here for lap or toddler, and Workshop Cases is a later separate registration.

#### Level 1, Which one works?

Request: one condition (`rain`, `dark` or `bump`; `puddle` appears from the second round). Gadget **A** is the cart with the needed part in its right socket; gadget **B** is the same cart with that socket holding the **flag** instead (the two differ in exactly one part). She taps a gadget to Try it (it rolls along the one-condition path and succeeds or stops at the failure), and each gadget has a round **Give** hand below it. A wrong Give is the round's miss; Try, replays and trying both are free. Authored first round: Hedgehog's apples in the rain: umbrella on top (A, left) against flag on top (B, right).

#### Level 2, Change one part

The pet builds Hedgehog's apple cart while she watches (big wheels slide into `under`, the cart crosses the bump, Hedgehog hops happily): nothing counts. Then a second neighbor arrives needing something else and the same cart stays on the bench with a tray of three parts. Rounds (authored order, neighbor and carried object seeded):

1. `bump` then `puddle` (Duck): **swap** the big wheels for the float in `under`.
2. `rain` then `dark` (Mouse): **add** the lantern to `front` (the umbrella stays; it does no harm).
3. `dark` then `bump` (Bear): **add** the big wheels to `under`.

She may Try the unchanged cart first: it fails at the new condition with its reason (free). Dropping a part on an occupied socket swaps it (the old part returns to the tray); dragging a part out returns it too. The round finishes on a passing Give.

#### Level 3, Build it

A cart with **two open sockets** (the third is a plain painted board, not a socket), a tray of four parts, a request of two conditions needing exactly those two sockets. Rounds (seeded from this table, the first authored): `rain`+`dark` (top, front), `bump`+`dark` (under, front), `rain`+`bump` (top, under), `puddle`+`rain` (under, top), `puddle`+`dark` (under, front). The tray always holds the two right parts, plus two others chosen so that **one decoy has a right socket that is not open** (the float when only `top` and `front` are open: it is a good part for a different cart) and the flag. Exactly one assembly passes; both of the right parts swapped between the open sockets fail. The path appears in order, so a failing Try stops at the first unmet condition.

## Screen and controls

- **Layout:** the **bench** in the middle (level 1: two gadgets side by side, each at least 220×180 with a Give hand at least 110×110 beneath it; levels 2–3: one cart with its open sockets, each socket at least 110×110), the neighbor's **request card** at the left (a picture of the neighbor and the pictured conditions), the **path** at the right as a row of tiles in order, the **tray** along the bottom centre clear of the guide's bottom-left corner, and **Try** and **Give** buttons at least 110×110 at the bottom right. In portrait the request card sits above the bench and the path folds below it, above the tray. `benchLayout(view, level)` chooses the sizes from the room left and returns **null rather than shrink** below a 100-unit part or socket (a test runs it in the four `lands.test.ts` views, level-3's worst case being four tray parts plus two sockets in portrait 768 wide).
- **Parts** are dragged with `src/engine/drag.ts` (riding 40 units above the finger), at least 100×100 on screen. Touch-down lifts the part and sways it. A drop within 1.2 socket radii of a socket snaps to the **nearest** socket with a wooden thunk on a pentatonic step (`src/audio/notes.ts`); any other drop glides back to the tray. A part in a socket can be dragged out; a press on a placed part that does not move past the drag threshold does nothing.
- **Try** (levels 2–3; at level 1 a tap on a gadget): the cart rolls along the path tile by tile, one rising toot per condition passed; at the failure it stops with a wobble, the failing condition's tile shakes, the pet says the reason and **the responsible socket pulses once** (an uncounted cue). Tapping during a run restarts nothing; one run at a time.
- **Give:** the neighbor takes the gadget and runs the same path. A pass is the celebration below; a failure shows the same stop and counts a miss.
- **Version strip:** a row of up to six small pictures above the tray, one per Try or Give this round (the cart with a tick, or a cross at the failing condition's picture), newest on the right. It is a picture of her tries, never a score, and takes no touches.
- **Pause sheet:** Start again (the same seeded round, keeping misses and hints) and Show a hint (`Scene.pauseActions`).
- **Music:** Treehouse's island style keeps playing (she is not making music). The tooting, thunks and wobbles are synthesized.

## Accounting, help and finishing

- **Free:** every Try, replay, drag, swap, return to the tray, Start again, and the level-2 demonstration. A failing Try is an experiment ([Chain Reaction's rule](../GAMES.md)).
- **Miss:** a **Give** whose gadget does not pass (a gentle boing; the failure is shown and spoken; the gadget stays on the bench so she can change it).
- **Hints:** (1) **Show a hint** in the pause sheet: level 1 wiggles the passing gadget's Give hand; levels 2–3 install the needed part for the first unmet condition in its socket (the part flies in). (2) **The glow**, after **two misses** or **two Trys that fail at the same condition with that condition's socket unchanged**: the responsible socket glows and the part it needs wiggles in the tray (level 1: the passing gadget glows). (3) **Supported finish:** after the glow, one more miss installs the part itself, so every round can end. Each use of (1), (2) or (3) is one hint; the glow counts once per round and a Show a hint press counts once each, up to the number of unmet conditions, then repeats the words only.
- **Adaptation** therefore reads Give misses and these hints (the shell's usual rule, `src/progress/difficulty.ts`). A supported finish is not evidence of independent skill.
- **Completion:** a passing Give ends the round: the neighbor uses the gadget along the whole path, then **an idea spreads**: two other neighbors walk in with their own copies of the same cart. After the last round, `ctx.finish({ misses, hints })`; one ordinary sticker, with or without help. Nothing is saved or filed ([decision 3](#open-decisions)).

## Speech (`voice-script.ts`)

Lines under `bench.*`: `intro`, `instruct.pick` ("Try both gadgets. Which one will work?"), `instruct.change` ("A new friend needs something else. Change one part!"), `instruct.build` ("Build it for {neighbor}! Put the parts where they work, then Try!"), `fail.bump` ("The apples hopped out at the bump."), `fail.puddle` ("The cart sank in the puddle."), `fail.rain` ("The rain got everything wet."), `fail.dark` ("It was too dark to see the path."), `ok` ("It got all the way along!"), `give.ok` ("{neighbor} loves it!"), `give.miss` ("Not yet. Look where it stopped."), `place.wrong` ("That part does not work there." only when a part in the wrong socket is the reason for a stop), `spread` ("Look, two more friends made one too!"), `hint`, `done`. Every line describes **this toy on this path**: no line says what real umbrellas, wheels or lanterns do or names a real inventor.

## Rule tests (`logic.test.ts`)

- **Run:** `runPath` returns the first unmet condition and its socket for every part/socket combination; an empty gadget passes `smooth` and fails at the first other condition; extra decoys in free sockets change nothing.
- **Authoring:** no level-1–3 path holds two conditions that need the same socket; every request has a non-empty `passingDesigns` for its tray.
- **Level 1 (500 seeds):** the two gadgets differ in exactly one part; A passes, B fails; the failing Try's `at` equals the request's condition.
- **Level 2 (500 seeds):** the shown cart passes the first neighbor and fails the second at exactly the new condition; exactly one single-part change makes it pass (swap in round 1, add in rounds 2–3); the tray holds that part and two others that do not help.
- **Level 3 (500 seeds):** exactly one assembly passes; swapping the two right parts between the open sockets fails (position matters); the decoy whose right socket is not open fails in both open sockets; the flag never helps; `passingDesigns` over the tray equals one design.
- **Help:** `helpFor(state)` always names a part that belongs to a passing design and leaves correct work in place (a swap hint replaces a wrong part only when its socket is the unmet condition's); a scripted level-3 round (swapped Try, two failing Trys at the same condition, glow, Show a hint) counts the glow and each requested hint exactly once.
- **Layout:** `benchLayout` in the four views for the level-1 pair, level-2 cart with tray of three and level-3 worst case: parts, sockets, Try, Give and the Give hands at least 100 (buttons 110) units each way; nothing overlapping the home button, the guide's bottom-left corner or each other; everything inside `view`; null rather than a smaller part.
- **Registry, lands and how-to tests** pass with the new game, including Treehouse on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows `helpFor`. Level 1: tap the failing gadget (Try, shows the stop), tap the passing gadget, tap its Give. Levels 2–3: drag the needed part(s) to their sockets with the real drag, tap Try, tap Give. The demonstration includes the failing Try so the card shows the "read where it stopped" step.
- **How-to card** (`src/content/howto.ts`). Goal: "Make a gadget that works for the neighbor."
  - Steps: "Tap each gadget to try it, then give the one that works" `{ from: 1, to: 1 }`; "Change one part so the cart works for the new friend" `{ from: 2, to: 2 }`; "Drag each part to the socket where it works, then tap Try" `{ from: 3, to: 3 }`; "Tap Give when it gets all the way along" (all levels).
  - Finish: "The neighbor loves the gadget, and two more friends make one too."
  - Notes: "Trying is never wrong: it shows where the cart stops" (all levels); "A Give that does not work counts as a miss; the glow and Show a hint each count as a hint" (all levels); "A part works in only one place: the umbrella has to go on top" `{ from: 3, to: 3 }`.
- **Registration:** ID `gadget-bench`, name "Gadget Bench", spoken title `game.gadget-bench` ("Gadget bench"). Region (subject) `tinker-lab`; skills `['design', 'testing', 'problem-solving', 'cause-and-effect']` (free strings; `design` and `testing` may be new). Bands as above, child `GAMES` only. Hub icon: a cart with a lantern. Sticker: a seeded cart with a seeded part and a tick.
- **Art:** code-drawn in `src/games/gadget-bench/art.ts` with `src/art/palette.ts`: the cart, bench, path tiles, five parts, the version strip pictures. Neighbors from `CRITTERS`. No imported art or audio.
- **Co-play** (spoken tip): **Client and inventor**: one person picks the neighbor's request, the other builds, then swap; **Tester**: before Try, the other person points to where it will stop. **Off-screen** (spoken tip, noticing only): "Find something with wheels at home and ask what the wheels are for." No page card of making or handling: those wait on the study's reviewer.
- **Couch:** none. **Rework couplings:** none required; nothing saved.

## Home land and capacity

Measured 2026-10-23 with a throwaway `landLayout` probe at `5c2ef9fe` (each land's current games visible at the band, the four `lands.test.ts` views; not committed):

| Land | Her games at preschool / pre-K / school | Rooms for more |
| --- | --- | --- |
| **Tinker Lab** | 5 / 12 / 12 (13 in total with Sense Detective) | **full** at pre-K and school |
| **Treehouse** | 7 / 7 / 7 | 6 more at every band |
| Barnyard | 9 / 10 / 11 | 3 / 2 / 2 |
| Cozy Village | 9 / 11 / 12 | 3 / 1 / 1 |

Default **Treehouse**, the island's making land, which also takes other fallbacks (Gear Garden, Sand Table); it has room for all of them. The study's Tinker Lab no longer fits at pre-K or school; a layout test at build time confirms the placement. The proposed Maker Harbor, if it ever exists, is a later move.

## Check tier

New-game tier: typecheck and unit tests (above, plus registry, lands and how-to); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 (a wrong Give, then the right one), level 2 (a free failing Try, the swap, a passing Give) and level 3 (a swapped placement Try, then a Show a hint, then the right one), one portrait screenshot of level 3, `fingerdemo` at levels 1–3, and `npm run build` because registry, lands, voice and how-to files change.

Device and person checks stay open: whether a four-year-old reads the failure from the cart stopping rather than from the voice; whether the socket thunk and snap forgive a small hand's drop; whether level 3 feels like building rather than guessing; how the iPad says "umbrella" and "lantern". Browser automation establishes none of these.

## What comes next

**Gadget Bench 4** (study slice 3) is defined and built [below](#level-4-fix-it-day-definition) as *Fix-It Day*: yesterday's cart on a longer path, the first conflict, one part revised. **Levels 5–6** are [defined below](#levels-56-little-gate-and-new-box-definition) as *Little Gate* (the garden gate's height limit) and *New Box* (the new-kit transfer round), each with an enumeration test; not built. **Level 7** gives two neighbors different criteria with several accepted designs. **Workshop Cases** (older/family case) is defined after its registration decision. None of those is defined here.

## Level 4, Fix-It Day (definition)

**Built 2026-11-06** ([PR #1330](https://github.com/rjdunlap/neo/pull/1330)): paddle wheels, yesterday's cart, the uncounted conflict line and the same-condition glow as defined; the school range is now 2–4.

Defined 2026-11-06 as slice 3 of the [inventions study](../deep-dives/subjects/inventions.md#build-slices-in-order) (*a path of three conditions; build, Try, read the first failure, change one part, Try again*, 3-5-ETS1-3) and, in the same level, the [engineering-design study](../deep-dives/subjects/engineering-design.md)'s **Fix-It Day** (*a neighbor's gadget worked yesterday but not on today's path; Try, find the part, swap one from the reuse shelf*). Docs only: written against the code as built (`src/games/gadget-bench/`, Painted Canyon, levels 1–3), not the original packet above. Like levels 1–3 it uses invented toy parts with stated properties and names no real invention, inventor or tool, so no reviewer gates it. The study's worn-or-broken-part repair is not in this level: nothing on the cart wears out.

**Fun action and purpose:** a neighbor rolls in with the cart that worked yesterday. Today's path is longer: one more condition. She taps Try and the cart stops at the new condition; the obvious fix (the float for the puddle) makes it stop at the bump instead, because **two jobs need the same socket**. She reads the two stops, finds the part on the reuse shelf that does both jobs, swaps it in and Tries again. The learning purpose: **a failure point tells you which part to change** (3-5-ETS1-3), and **when two needs pull on one place, look for one part that meets both** rather than adding more. It is the study's first conflict ("conflicts begin at level 4 or later").

### Identity and overlap (level 4)

- **Level 2, Change one part,** is the nearest rung: there the first sensible change works. At level 4 the first sensible change always fails at the other conflicting condition (a rule test proves it), so reading the second stop is the point.
- **Workshop Cases** (later, older) combines the strongest parts of three prototypes from a results table with a built-in conflict. Level 4 previews only the smallest piece of that, one guided conflict on one cart, with no table and no prototypes.
- **Welcome Ways level 7** (repair the old entrance for a new friend) designs one entrance for several visitors; Gadget Bench stays one neighbor, one cart, one path.

### The model, extended (`logic.ts`)

- **A sixth part, the paddle wheels:** right socket `under`, fixes **`bump` and `puddle`**. Picture: two tall teal wheels with flat paddle blades round the rim; spoken "the paddle wheels". An invented toy (the definition's [decision 4](#open-decisions) applies). It appears only in level 4 trays.
- **`PartSpec.fixes` becomes a list** (`Condition[]`; every other part keeps its one condition, the flag none). Each condition still has exactly one responsible socket (`bump` and `puddle`: `under`; `rain`: `top`; `dark`: `front`), so `need(c)` keeps returning the single-job part and its socket (it never returns the paddle wheels), and `runPath` asks whether **the part in `need(c).socket` lists `c` in its `fixes`**. The failure result is unchanged (`at`, `socket`, and `part` = the single-job part).
- **Levels 1–3 do not change:** their trays and pairs never hold the paddle wheels, and for any gadget without the paddle wheels the new `runPath` gives exactly the old result.
- **`socketConflict(path)`** keeps its meaning; every level-4 path has one (`bump` and `puddle`), and still no level 1–3 path does.
- **Round shape:** a level-4 round carries `yesterday: { path, gadget }` (like level 2's `shown`) and today's `path`.
  - The cart: `under` holds the single-job part for the **old** condition (`bump` gives the big wheels, `puddle` the float), and the **third** condition's socket holds its part (`rain`: umbrella on `top`; `dark`: lantern at `front`). The remaining socket is empty.
  - Yesterday's path: `smooth`, then the old condition and the third in a seeded order. The cart passes it (tested).
  - Today's path: `smooth`, then the old condition, the **new** one (the other of `bump`/`puddle`) and the third, in a seeded order.
  - The **reuse shelf** holds two parts: the paddle wheels and the single-job part for the new condition (the obvious fix), in seeded order. The tray has **four slots**: the shelf's two plus one home slot for each part on the cart, so anything she takes off has a place to go (level 2's tray already gives the shown part a slot).
- **Rounds** (three, `ctx.rng` seeded):
  1. **Authored:** Bunny; yesterday `smooth, bump, dark` with big wheels and lantern; today `smooth, bump, puddle, dark`; shelf float then paddle wheels. Try stops at the puddle.
  2. A **float** cart (old `puddle`, new `bump`); third seeded (`rain` or `dark`); path order seeded.
  3. A **big-wheels** cart with the umbrella (old `bump`, third `rain`); path order seeded.

  Neighbors are seeded from `NEIGHBORS` (Bunny first), a different one each round. Across the three rounds both carts and both thirds appear.
- **Passing set:** every passing design has the paddle wheels in `under` and the third part in its socket; the remaining socket may be empty or hold the shelf's single-job part (it does nothing there). The fewest-change fix from the cart is **exactly one part** (`under`: old part to paddle wheels).

### Accounting, help and finishing (level 4)

The level 1–3 rules hold (Try free, a failing Give a miss, the glow and Show a hint each a hint, a supported finish), with three additions:

- **Help follows a passing design, never the first stop.** Today's `helpFor` installs the part the first unmet condition needs, which at a conflict swaps the big wheels and the float back and forth forever. From level 4, `helpFor` picks **the passing design that keeps the most of her placed parts** (ties: the one that leaves the remaining socket as she has it) and installs that design's part in the first unmet condition's socket, or, when that socket already matches, in the first other socket that differs. On levels 1–3 this gives the same part as today (each has one essential passing design). At a conflict it installs the paddle wheels.
- **A repeated failing Try lights the glow.** As well as two Trys in a row failing at the same condition with that socket unchanged, at level 4 a failing Try whose whole assembly matches **any** earlier failing Try this round lights the glow. That catches the big wheels, float, big wheels loop, where the stop changes every time so the old rule never fires. The glow rings `under` and wiggles the paddle wheels; it counts once a round, as now.
- **The conflict line, uncounted:** the first time a round's failing Trys or Gives have stopped at both `bump` and `puddle`, the pet says `bench.conflict` once. It explains what happened, not what to do, so it counts nothing.

Show a hint counts up to the number of sockets in which her gadget differs from the chosen passing design (normally one), then repeats the words. After the glow, one more miss installs the paddle wheels (the supported finish, one hint). Giving the unchanged cart is a miss like any failing Give. A passing Give ends the round with the usual spread (two more neighbors with the same cart); after three rounds, `ctx.finish({ misses, hints })` and one sticker. Nothing is saved or filed.

### Screen and controls (level 4)

The level 2–3 layout with **four path tiles** (`smooth` plus three) and **four tray slots**: `benchLayout(4, 4, 4, view)`. Each round opens with the neighbor rolling the cart onto the bench while the request card shows **yesterday's path** as small faded tiles. Today's path then fills the tiles at the right, with a **sparkle on the new condition's tile** (a picture, no reading). Dragging, socket snapping, swapping (the old part glides to its home slot), Try, the stop with its socket pulse, Give and the version strip all work as at levels 2–3. The paddle wheels draw in `art.ts` with `src/art/palette.ts`, at the same 110-unit part size.

### Speech (`voice-script.ts`)

New lines:
- `bench.instruct.fix`: "{neighbor}'s cart worked yesterday. Today's path is longer. Try it, then fix it!"
- `bench.conflict`: "Big wheels for the bump, a float for the puddle, and only one fits underneath!"
- `bench.yesterday`: "Here's {neighbor} with yesterday's cart." (the arrival; uncounted)

The existing `fail.*`, `glow` ("The glowing socket needs {part}."), `hint.part`, `installed`, `give.*` and `spread` lines take the paddle wheels by name through `PARTS`. As before, no line says what real wheels, floats or paddles do.

### Rule tests (`logic.test.ts`)

- **The model:** the paddle wheels pass `bump` and `puddle` in `under` and nothing anywhere else. For every assembly of the five old parts, the new `runPath` returns exactly what the old single-part rule returned (a table of the old answers kept in the test). Level 1–3 briefs (500 seeds) never hold the paddle wheels.
- **Level 4 (500 seeds):**
  - yesterday's cart passes yesterday's path, and today's path holds exactly three conditions after `smooth` with one conflict;
  - the cart as given fails today at the new condition;
  - the obvious fix (the shelf's single-job part in `under`) fails at the old condition;
  - no assembly without the paddle wheels passes;
  - `passingDesigns` over the cart's parts plus the shelf, with all three sockets open, is non-empty, and every member has the paddle wheels in `under` and the third part in its socket;
  - the fewest-change pass differs from the cart in exactly one socket;
  - round 1 matches the authored table;
  - across the three rounds both carts and both thirds appear, and no neighbor repeats.
- **Help:** from every assembly of a level-4 round's four parts, repeating `helpFor` then `applyHelp` reaches a passing gadget within three steps and never removes a part that belongs to the chosen passing design. From the cart, and from the obvious fix, it installs the paddle wheels. Levels 1–3 give the same help part as before for every assembly of their trays.
- **Tally:** a scripted level-4 round (Try the cart; Try with the float; Try with the big wheels again, which lights the glow once; Show a hint twice, which counts once and then repeats the words) counts the hints exactly, with no misses. The conflict line fires once, never adds a hint, and never fires at levels 1–3.
- **Layout:** the layout cases gain `[4, 4, 4]` in landscape and portrait (parts and sockets at least 100, buttons 110, nothing overlapping or under a corner). If a view returns null, the build adds a second tray row rather than shrinking a part.
- **Ghost finger:** `nextMove` at level 4: Try the cart as given (a free stop at the new condition), drag the part help names (the paddle wheels), Try, Give. A simulated bot round passes in each of 200 seeded briefs.

### Registration, ladder and how-to card

- **Bands:** school `{ min: 2, max: 4 }`. Pre-K stays `{1,3}` and preschool `{1,1}`. Level 4 is at the top of school: two stops and a conflict ask for reading a sequence of failures, which the study places at 3-5-ETS1-3. `planFor` and `briefFor` clamp to `1..4` instead of `1..3`.
- **Plan:** `PLANS[4] = { name: 'Fix-It Day', describe: "Fix-It Day: yesterday's cart meets a longer path, and one part has to do two jobs" }`.
- **How-to card** (`src/content/howto.ts`):
  - New step `{ from: 4, to: 4 }`: "Try the cart, see where it stops, then swap in a part from the shelf and Try again."
  - The Give step widens to `{ from: 2, to: 4 }`.
  - New note `{ from: 4, to: 4 }`: "When two needs want the same socket, one part has to do both jobs. Trying is never wrong; a Give that does not work counts as a miss, and the glow and Show a hint each count as a hint." The conflict line is spoken help and counts nothing.
- **Co-play:** unchanged (Client and inventor; Tester points to where it will stop). **Off-screen:** unchanged. No new page card.

### Check tier (level 4)

A new level on the existing drag, Try and Give interaction, so the build session runs:
- `npm run typecheck`;
- the `gadget-bench` rule tests above, plus the registry and how-to tests, because the school range and the card change (`npx vitest run src/games/gadget-bench src/games/registry src/content/howto`);
- one browser play of level 4 only through the `gadget-bench` case: a free failing Try, the obvious-fix Try that stops at the bump and speaks the conflict line, a failing Give for a miss, then the paddle wheels and a passing Give;
- one portrait screenshot of level 4;
- `fingerdemo` at level 4.

`npm run build` is needed only if the build touches shared engine or art files beyond the game's own folder, `voice-script.ts` and `howto.ts`. Device and person checks stay open: whether a six-year-old reads two stops at one socket as a conflict, and how the iPad says "paddle wheels".

## Levels 5–6, Little Gate and New Box (definition)

Defined 2026-11-06 as slice 4 of the [inventions study](../deep-dives/subjects/inventions.md#build-slices-in-order): level 5 is the study's **constraint** (*the gadget must fit through the little garden gate, so the big wheels are too big*, 3-5-ETS1-1) and level 6 its **transfer to a new kit** (*the same need as a solved round, but the tray has no wheels*; the step Beck et al. 2014's 4–7-year-olds did not make). Docs only: written against the code as built through level 4 (`src/games/gadget-bench/`, PR #1330). Both levels use invented toy parts with stated properties and name no real device, invention or tool, so no reviewer gates them ([decision 4](#open-decisions) applies to the new parts).

**Fun action and purpose.** *Level 5, Little Gate:* the neighbor lives behind a low arch in the garden hedge. She builds a cart for the path as at level 3, Tries it, and the familiar cart crosses every condition, then bumps its tall big wheels or umbrella on the arch at the end. She swaps in a low part that does the same job and the cart rolls under. The purpose: **a design has to meet the need and stay inside a limit** (a criterion and a constraint, 3-5-ETS1-1), and **a limit applies to the whole gadget**, even a part that does nothing. *Level 6, New Box:* the pet's finished cart works for one neighbor, then its parts go home with that neighbor; a second neighbor needs the same path and the box holds only new parts. She works out which new part does each old part's job and where it goes. The purpose: **the same job can be done by a different part** (transfer to a new kit), and **where a part goes still decides what it does**.

### Identity and overlap (levels 5–6)

- **Level 3, Build it,** is the nearest rung for both: the same empty cart, tray and Try. Level 5 adds a test every part must pass at once (the arch), which no level 1–4 condition is: a condition asks one socket, the arch asks all three. Level 6 removes every part she has used for the path and keeps three open sockets, so a new part's place is a choice again.
- **Level 4, Fix-It Day,** is one part doing two jobs. Level 5 never has a socket conflict (a rule test), so the only new idea is the limit.
- **Habitat Helpers overlap test:** at level 5 the familiar right part fails the limit, so "the piece for each picture" is not enough; at level 6 all three sockets are open and the tray holds a new part whose socket is not the old part's (the glow stones, below), so socket position still decides the pass.
- **Welcome Ways** (a fixed space for several visitors) keeps the shared-structure constraint; level 5 is one cart and one limit.

### The model, extended (`logic.ts`) (levels 5–6)

- **Height.** `PartSpec` gains `tall: boolean`. Tall: the big wheels, the paddle wheels, the umbrella and the flag (a flag on a pole). Low: the float, the lantern and every new part below. The side-view board already shows height, which is why the limit is a low arch rather than the study's narrow gate (width would be depth on this board); the spoken line still calls it "the little gate".
- **Four new invented parts**, none in `PART_IDS` (as with the paddle wheels), so `need()` keeps returning the original single-job part and levels 1–4 cannot change:

| Part | Right socket | Fixes | Height | Picture and spoken name | Levels |
| --- | --- | --- | --- | --- | --- |
| Roller belt | `under` | `bump` | low | a flat loop of little wooden rollers; "the roller belt" | 5, 6 |
| Lid | `top` | `rain` | low | a snug flat wooden lid; "the lid" | 5, 6 |
| Raft | `under` | `puddle` | low | three planks tied together; "the raft" | 6 |
| Glow stones | `top` | `dark` | low | a little bowl of glowing pebbles; "the glow stones" | 6 |

- **One responsible socket per condition, except `dark` at level 6.** `bump` and `puddle` stay `under` and `rain` stays `top`. The glow stones light the path from `top`, where the lantern hangs at `front`: `dark`'s responsible socket becomes **the socket of the part that can fix it in this round**. The model: `runPath(g, path, kit?)` takes the round's kit (its tray, or every part when absent); a condition's responsible socket is the right socket of the kit's parts that fix it (within one kit every part fixing a condition shares one socket, a tested invariant: level 5's twins both sit `under` or both on `top`), so levels 1–5 read exactly as now and level 6 asks `top` for `dark`. A level 6 round with both `rain` and `dark` would put two jobs on `top` and is never authored (a rule test).
- **The gate.** A new condition `gate`, always the **last** tile of a level 5 path (the neighbor's home). It is a constraint, not a `need()`: `need('gate')` stays null, and `runPath` at `gate` fails when **any** socket holds a tall part, whether or not that part is doing a job there. The failure result is `{ ok: false, at: 'gate', socket, part }` with `socket` the first socket (`under`, `top`, `front`) holding a tall part and `part` that tall part. Conditions earlier on the path are checked first, as now, so a cart that fails the bump stops at the bump.
- **Help names a part that is on the bench.** From level 5, `runPath`'s `part` is never spoken as "what it needs"; the `glow`, `hint.part` and `installed` lines name the **target design's** part. `targetDesign` (level 4's: the passing design over the round's tray and open sockets that keeps the most of her placed parts, ties to the fewest changed sockets) is used whenever the level is 4 or above (the switch becomes `level >= 4`, not `round.yesterday`; `helpSteps` likewise). A new help kind **`take out`** returns a part to its tray slot when the target leaves that socket empty (a tall part, or the flag, sitting in a socket where it does nothing); the speech is `bench.hint.out`. On levels 1–4 help gives exactly what it gives now (a regression table).
- **The conflict line** (`bench.conflict`) stays level 4 only: `Tally.stopped` is called only when the round has a `yesterday`. Level 5's arch line is below.

#### Level 5, Little Gate

All three sockets open and an empty cart. Path: `smooth`, two conditions with no socket conflict, then `gate` (four tiles). The tray holds four parts and always includes, for each condition with a tall usual part, **both** the usual part and its low twin (big wheels and the roller belt; the umbrella and the lid). Rounds (`ctx.rng` seeded except the first):

1. **Authored:** Bunny; `smooth, bump, dark, gate`; tray big wheels, roller belt, lantern, flag (in this order, so the familiar part is first). The big-wheels cart stops at the arch.
2. Seeded from `rain` + `dark` (tray umbrella, lid, lantern, flag) or `rain` + `puddle` (umbrella, lid, float, flag); condition order seeded.
3. `bump` + `rain` (tray big wheels, roller belt, umbrella, lid): two tall parts to replace; condition order seeded.

Neighbors as at level 4 (Bunny first, a different one each round). **Passing set:** exactly one passing design each round (the low part for each condition in its socket, the third socket empty; the flag is tall, so it cannot ride along). This level states **one** passing design, not two. The "familiar" design (each condition's `need()` part in its socket) passes every condition and fails at `gate` in every round.

#### Level 6, New Box

The round opens with level 2's shown cart: the pet builds the first neighbor's cart from the old parts for a two-condition path, and it rolls along (nothing counts). Then those parts ride home with the first neighbor (`bench.newkit`), the second neighbor arrives needing **the same path**, and the empty cart stays on the bench with **all three sockets open** and a tray of four new parts. Rounds (seeded except the first; the round carries `shown` as level 2 does, plus `kit: true`):

1. **Authored:** Duck shown, then Bear; `smooth, bump, dark`; shown cart big wheels and lantern; tray roller belt, glow stones, raft, lid. The glow stones go on `top`, not where the lantern hung.
2. Seeded from `puddle` + `dark` (shown float and lantern) or `puddle` + `rain` (shown float and umbrella).
3. `bump` + `rain` (shown big wheels and umbrella; `bump` + `puddle` would put two jobs `under`); condition order seeded.

No level 6 path needs `front`: the lantern's old socket is open and does nothing for the new kit, so a glow stones drop where the lantern hung stops at the dark.

The tray is always the four new parts (roller belt, lid, raft, glow stones), seeded order after round 1. **Passing set:** the right new part for each condition in its socket; the remaining socket may be empty or hold a new part that does nothing there (it is low, and level 6 has no arch). This level states **at least two** passing designs per round. The cart body's painted small wheels are part of the board, not a part; they appear on every level and handle nothing, so "the tray has no wheels" holds.

### Accounting, help and finishing (levels 5–6)

As at levels 1–3: Try is free, a failing Give is a miss, the glow and each counted Show a hint are hints, a supported finish after the glow plus one miss installs the target design's next part (one hint). The same-condition glow rule holds, with the gate as a condition: two Trys in a row stopping at the arch with the same tall part in that socket light the glow, which rings that socket and wiggles the low twin in the tray (or, for a tall part in a socket where it does nothing, rings the socket and the part's home slot). At level 5 the "That part does not work there" line (`bench.place.wrong`) is **not** spoken at an arch stop: the tall part works there, it is just too tall. Level 6's shown cart counts nothing, as level 2's does. Show a hint counts up to the number of sockets her gadget differs from the target design, then repeats the words. After three rounds, `ctx.finish({ misses, hints })` and one sticker. Nothing is saved or filed.

### Screen and controls (levels 5–6)

- **Level 5:** `benchLayout(5, 4, 4, view)`, the same footprint as level 4's `[4, 4, 4]`. The request card shows the two conditions and a small arch. The `gate` tile is a hedge with a low wooden arch whose opening is drawn at the height of a low cart; a stop there plays the cart rolling up, the tall part tapping the arch top (a leaf shake and a soft wooden tock, `sfx.clunk`), the tall part glowing, and the cart rolling back a step.
- **Level 6:** `benchLayout(6, 3, 4, view)`, level 3's `[3, 3, 4]` footprint. During the shown build the old parts sit in the tray; when they go, they ride off on the first neighbor's cart and the four new parts drop into the tray slots.
- The four new parts draw in `art.ts` with `src/art/palette.ts` at the 110-unit part size; the tall parts are drawn as now (the big wheels, umbrella and flag already rise above the cart). Dragging, snapping, swapping, Try, the stop's socket pulse, Give and the version strip are unchanged.

### Speech (`voice-script.ts`) (levels 5–6)

New lines:
- `bench.instruct.gate`: "{neighbor} lives behind the little gate. Build a cart that gets all the way there!"
- `bench.fail.gate`: "Bump! Something is too tall for the little gate." (no part name: the glowing tall part shows which)
- `bench.instruct.newkit`: "Make a cart that works like that one, with the new parts!"
- `bench.newkit`: "Those parts went home with {neighbor}. Here's a new box of parts."
- `bench.hint.out`: "{part} does nothing there. I put it back."

`glow`, `hint.part`, `installed`, `give.*`, `ok` and `spread` take the new parts by name through `PARTS`. No line says what real wheels, lids, rafts or lamps do.

### Rule tests (`logic.test.ts`) (levels 5–6)

- **The model:** each new part passes only its condition in its right socket. `tall` is exactly the big wheels, paddle wheels, umbrella and flag. For every assembly of the six level 1–4 parts on every level 1–4 path, `runPath` (with and without a kit argument) and `helpFor` return exactly the level 4 answers (the kept table, extended to help). Level 1–4 briefs (500 seeds) never hold a new part.
- **The gate:** for every assembly of all ten parts, `runPath(g, [...conditions, 'gate'])` fails at `gate` exactly when every earlier condition passes and some socket holds a tall part, and its `socket` is the first such socket.
- **Level 5 (500 seeds):** every path is `smooth`, two conditions without `socketConflict`, then `gate`; at least one condition has a tall `need()` part; the tray holds both twins for each such condition and no paddle wheels; the familiar design fails at `gate`; `passingDesigns` holds **exactly one** design, with no tall part anywhere; round 1 matches the authored table; round 3 is `bump` + `rain`; no neighbor repeats.
- **Level 6 (500 seeds):** the shown cart passes the path; the tray holds **no part from the shown solution** and no wheels; `passingDesigns` over the tray and three open sockets is non-empty with **at least two** members; every condition's fixing part in the kit is unique; no round has both `rain` and `dark`; the authored round 1 has `dark` on `top`, and the shown cart's `dark` part sits in a different socket from the passing design's (the place still matters); round 1 matches the authored table.
- **Help (levels 5–6):** from every assembly of each round's tray, repeating `helpFor` then `applyHelp` reaches a passing gadget within four steps, every install is a part of the target passing design and comes from the tray, every take-out removes a part the target does not hold there, and help never installs a tall part on a level 5 round. From the familiar design at level 5, help installs the low twin first.
- **Tally:** a scripted level 5 round (Try the familiar cart, stop at the arch; Try it again, which lights the glow once; Show a hint twice, counting up to the differing sockets, then the words only) counts hints exactly, with no misses, and the conflict line never fires at levels 5–6.
- **Layout:** the layout cases gain `[5, 4, 4]` and `[6, 3, 4]` in landscape and portrait (parts and sockets at least 100, buttons 110, nothing overlapping or under a corner).
- **Ghost finger:** `nextMove` at level 5 places the familiar parts first (the `need()` part for each condition), Trys once (the arch stop, free), then follows help, Trys and Gives; at level 6 it waits through the shown build, follows help, Trys and Gives. A simulated bot round passes in each of 200 seeded briefs per level.

### Registration, ladder and how-to card (levels 5–6)

- **Bands:** school `{ min: 2, max: 6 }` once both are built (`{ 2, 5 }` if level 5 lands alone). Pre-K stays `{1,3}`, preschool `{1,1}`. `TOP_LEVEL` becomes 6.
- **Plans:** `PLANS[5] = { name: 'Little Gate', describe: 'Little Gate: build for the path, and the whole cart must fit under the low garden gate' }`; `PLANS[6] = { name: 'New Box', describe: "New Box: the same job as the pet's cart, from a box of parts it never used" }`.
- **How-to card** (`src/content/howto.ts`):
  - New step `{ from: 5, to: 5 }`: "Build the cart, Try it, and if it bumps the little gate, swap in a lower part that does the same job."
  - New step `{ from: 6, to: 6 }`: "Watch the pet's cart work, then build one from the new box of parts that does the same jobs."
  - The Give step widens to `{ from: 2, to: 6 }`.
  - New note `{ from: 5, to: 6 }`: "The gate is a limit on the whole cart: every part must fit under it, even one doing nothing. In the new box, a part that does the same job may sit somewhere new. Trying is never wrong; a Give that does not work counts as a miss, and the glow and Show a hint each count as a hint."
- **Co-play:** unchanged. **Off-screen:** unchanged. No new page card.

### Build slices and check tier (levels 5–6)

One same-game batch, `gadget-bench` levels 5–6, in one session; if the allowance cannot cover both, land level 5 alone (school `{2,5}`) with a draft-PR checkpoint for level 6. New levels on the existing drag, Try and Give interaction:
- `npm run typecheck`;
- `npx vitest run src/games/gadget-bench src/games/registry src/content/howto`;
- one browser play through the `gadget-bench` case at level 6 (the shown build, a failing Give for a miss with the glow-stones placed at `front`, then the right build and a passing Give), plus one level 5 round (the familiar cart's arch stop, then a passing Give), because the arch is a new path outcome;
- one portrait screenshot of level 5's arch stop;
- `fingerdemo` at levels 5 and 6.

`npm run build` only if the build touches shared engine or art files beyond the game's folder, `voice-script.ts` and `howto.ts`. Device and person checks stay open: whether a six-year-old sees the tall part as the reason at the arch rather than hearing it, whether level 6 is transfer or guessing for her, and how the iPad says "glow stones" and "roller belt".

## Open decisions

1. **Home land (default Treehouse).** Tinker Lab is full at pre-K and school; Treehouse has room. The developer may redirect (Barnyard or Cozy Village fit one or two more); the build can start on the default.
2. **Accounting.** Default: a failing Try is free, a failing Give is a miss, the glow counts as a hint (the study's rule and Chain Reaction's precedent). Alternative: an uncounted glow, which would make every preschool round read as smooth.
3. **Keeping the gadget.** Default: nothing is kept or filed; the version strip lives in the round. Filing a finished gadget as a creation or a journal entry waits for the developer's call on the study's version-strip question.
4. **Part names and the decoy.** Default: five invented toy parts including a decoy flag. A part-table wording review is optional here (none names a real device) but welcome before the lantern is paired with a real candle or lamp in a later transfer level.
5. **Level 4's band and the conflict line** (defaults: level 4 is school only, the top of `school`; the conflict line is uncounted). Pre-K could reach level 4 later if a person sees pre-K players read two stops; that is a device observation, not a build blocker.
6. **Levels 5–6's choices** (defaults: the gate is a **low arch** that rules out tall parts, because the side-view cart shows height and not width; level 6's glow stones work from `top`, so one new part's place differs from the old part's; both levels are school only, at the top of `school`). The developer may prefer the study's narrow gate (a front-view gate tile), or a level 6 where every new part sits where its old twin did; either is a change to this packet, not a build blocker.
