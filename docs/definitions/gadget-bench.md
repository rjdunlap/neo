# Gadget Bench, levels 1–3 (definition)

Defined 2026-10-23 as slice 1 of the [inventions study](../deep-dives/subjects/inventions.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/inventions.md#first-games-proposed-ladder-gadget-bench) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#inventions-recommendations). Docs only: no game, ID registration, voice line, save field or band exists yet.

**Status: built 2026-10-27 (PR #1012), levels 1–3; the neighbors are Bunny, Duck, Cat and Bear, with the hedgehog and mouse standing in as bunny and cat because the island has no hedgehog or mouse critter.** Defined and buildable as follows. Levels 1–3 use five invented parts with fixed, stated properties and say nothing about real inventions, inventors, dates or tools, so no reviewer gates them (the study's reviewer gates are for real inventions, Workshop Cases' registration and the page cards). The only default the developer may want to change is the home land ([decision 1](#open-decisions)): the study's Tinker Lab is **full** since Sense Detective registered, so this packet defaults to **Treehouse**, measured below. Levels 4–7 and Workshop Cases are later definitions.

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

**Gadget Bench 4** (study slice 3): a path of three conditions where one part does not fit with another, so she reads the first failure, changes one part and tries again (the `Show me` rule extends to conflicts). **Levels 5–6** add a size constraint (the garden gate) and the new-kit transfer round, each with an enumeration test. **Level 7** gives two neighbors different criteria with several accepted designs. **Workshop Cases** (older/family case) is defined after its registration decision. None is defined here.

## Open decisions

1. **Home land (default Treehouse).** Tinker Lab is full at pre-K and school; Treehouse has room. The developer may redirect (Barnyard or Cozy Village fit one or two more); the build can start on the default.
2. **Accounting.** Default: a failing Try is free, a failing Give is a miss, the glow counts as a hint (the study's rule and Chain Reaction's precedent). Alternative: an uncounted glow, which would make every preschool round read as smooth.
3. **Keeping the gadget.** Default: nothing is kept or filed; the version strip lives in the round. Filing a finished gadget as a creation or a journal entry waits for the developer's call on the study's version-strip question.
4. **Part names and the decoy.** Default: five invented toy parts including a decoy flag. A part-table wording review is optional here (none names a real device) but welcome before the lantern is paired with a real candle or lamp in a later transfer level.
