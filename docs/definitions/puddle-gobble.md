# Puddle Gobble, levels 1–8 (definition)

Defined 2026-10-17 for [chunk 26](../ROADMAP.md#chunks) (gaps against popular mobile games), from its [IDEAS candidate row](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** after a rain shower, a smiling puddle sits on the beach. She leads it with a finger (or taps where it should go), and it slides over shells, pebbles and driftwood and soaks up everything that **fits inside it**, growing a little after every few. A thing that is still too big wobbles and the puddle says "Too big yet!", then flows on past it; once the puddle has grown, the same thing slips in. At the end the puddle washes everything up into one tidy row on the sand, smallest to biggest, and the beach is clean. The learning goal is **size comparison against a moving reference**: what fits depends on how big the puddle is *now*, and that changes because of what she has already soaked, so the order she works in matters. Later levels state an order (smallest first, seriation), then swap pictured sizes for numbers (compare, then add to grow, then land on an exact total). There is no clock, no rival, nothing chases and nothing is lost.

**What the theme rules out.** The references swallow people, cars and houses. Here the puddle only tidies: it soaks up beach litter and lost toys, never a critter, a friend's home or anything a friend is holding, and the finish puts every soaked thing back on the sand in a row. Nothing disappears for good.

## References

| Reference | What it shows | What Puddle Gobble takes or rejects |
| --- | --- | --- |
| [Hole.io](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025) (Voodoo, 2018; about 119 million downloads in 2025 per PocketGamer.biz; play details from [AppSamurai's case study](https://appsamurai.com/blog/mobile-app-success-story-hole-io/) and unofficial guide pages, weighted lightly) | Steer a hole around a city; small things fall in first and the hole grows until trucks and buildings fit. Matches run about two minutes against rival holes that can swallow yours | Takes "small first, then what used to be too big". **Rejects** the two-minute match, the rivals and being swallowed, and swallowing people and buildings |
| [Donut County](https://store.epicgames.com/p/donut-county) (Ben Esposito / Annapurna Interactive, 2018; store listing) | A hole that grows with each thing that falls in; levels end with the biggest object; things can be catapulted back out | Takes a single growing mechanic paced by authored levels, each ending on its biggest thing, and "things come back out" (here, the tidy row). Rejects the climax of swallowing friends' homes |
| [Katamari Damacy](https://en.wikipedia.org/wiki/Katamari_Damacy) (Namco, 2004; Wikipedia) | Objects smaller than the ball stick on contact; larger ones are hurdles; growing turns hurdles into pickups and opens blocked areas | Takes the exact idea of a **threshold that moves with growth**. Rejects collisions that knock things off and the timer: a too-big thing here never costs anything and never blocks the way |
| Feeding Frenzy (Sprout Games / PopCap, 2004; **recalled**, the source of the [idea notebook's Big Fish, Little Fish row](../IDEAS.md)) | Eat smaller fish to grow; bigger fish eat you | Takes "smaller than you" as the rule. Rejects being eaten; nobody here is food |
| Piaget's seriation task and the Montessori Pink Tower, as summarized by [Stanford's pre-K math teacher education module](https://prek-math-te.stanford.edu/node/198) and [Montessori Academy](https://montessoriacademy.com.au/montessori-at-home/toddler-resources/montessori-pink-tower/) | Ordering rods or ten cubes by size; relative comparison appears around 3, full ordering of many close sizes is reliable around 7–8 (Piagetian benchmark) | Levels 1–4 ask only "does this fit *now*?" (relative comparison). The stated smallest-first rule waits for pre-K (level 5) with four widely spaced sizes, not many close ones. The tidy row at every finish shows a size ordering without asking for one |

## Overlap

- **Size Parade** owns static comparison (tap the biggest or smallest) and dragging friends into a line. Puddle Gobble's question is different: the reference is the puddle itself, and it changes with her own play. It is a new game per AGENTS.md (a different meaningful action: steering a growing body).
- **Duckling Parade** owns steering a growing *line*; this reuses its finger steering (`nextStop`, the clamped destination ring, palm rejection, cancel/blur/visibility handling), not its rules.
- **Fruit Sums** and **Number Trails** own addition practice; levels 7–8 use addition as the growth rule, with the sum shown, not as a quiz.
- The idea notebook's **Big Fish, Little Fish** row (Xbox Live Arcade table) describes essentially this game; once Puddle Gobble is built, the docs closeout can mark that row as covered by it. This definition does not edit it.

## The model

- **Tiers.** Things and the puddle have whole-number **tiers** 1–4. A tier-`k` thing is drawn 70, 120, 170 or 220 units across; a tier-`k` puddle is 100, 150, 200 or 250 units across (its own tier's thing plus 30). So a thing is soakable exactly when it is **visibly smaller than the puddle**, and the next tier up is visibly bigger. Each thing and the puddle also show their tier as 1–4 dots on a small ring (as Domino Run's dot faces), so size is never judged from the drawing alone.
- **The fit rule (picture levels 1–5):** a puddle of tier `s` soaks a thing of tier `t` when `t ≤ s`. Otherwise it is **too big yet**.
- **Growth (levels 1–4):** a dot meter around the puddle's rim shows `grow` empty drops (2 at levels 1–3, 3 at level 4); each soak fills one; when full, the puddle steps up a tier (capped at 4) and the meter empties. Growth is **count-based**, never area-based, so tests are exact and counting has a job.
- **Numbers (levels 6–8):** things are all drawn at tier 2's size with a numeral tag, so the number decides (the same trick as Size Parade's shared appearance). The puddle shows its number `P`. It soaks a thing of value `v` when `v ≤ P`. Level 6: `P += 1` per soak. Levels 7–8: `P += v`, shown as a running sum in a strip at the top ("5 + 3 + 4 = 12"). The puddle's drawing grows with `P` (stepped, capped at 250 units) but the rule reads only numbers.
- **Never a dead end (1–7).** Growth is monotonic: soaking anything that fits can only make more things fit. So a board is solvable from every reachable state if and only if it is solvable greedily from the start, which generation guarantees. Level 8 (an exact total) can dead-end; letting a soaked thing go is the free undo (below).
- **Too-big things never block.** The puddle is water: it flows under and past a too-big thing, which wobbles on top. There is no collision, no pushing and no pathing, so nothing can be trapped or unreachable.
- **Contact.** A thing is **touched** when its center is inside the puddle's circle. A soakable touched thing slides in (0.35 s, a pentatonic plop from `src/audio/notes.ts`: bigger tiers sing lower notes, so a growing puddle plays a falling tune). A too-big touched thing wobbles once and is **armed off** until its center is more than 30 units outside the puddle, so dragging across it reacts once, not continuously. "Too big yet!" is spoken at most once per thing per puddle tier (or per `P` value) and at most every 3 s.
- `logic.ts` holds plain functions: `fits(puddle, thing)`, `soak(state, id)` (returns the new state, or a refusal with its reason: `too-big`, `order` at level 5, `too-much` at level 8), `letGo(state, id)` (level 8), `greedyClears(state)`, `exactSolutions(state)` (level 8, a bounded subset search over at most 7 things), `hintTarget(state)`, `planFor(level)`, `makeBoard(plan, rng)` (seeded; built from a plan, accepted only if it passes the plan filter; at most 50 tries, then an authored fallback that a test asserts is never needed over 500 seeds) and `beachLayout(board, view, rng)`.

## Screen and controls

- **Steering** reuses Duckling Parade's: touch-down anywhere on the sand sets a destination (a broad, fading ring acknowledges it) and the puddle glides there at up to 320 units/s; a held finger leads it continuously; lifting keeps it gliding to the last point. Cancel, lost capture, leaving the window, blur and visibility changes forget the finger; palm rejection is kept; native listeners are released in `destroy()`. Tapping a thing also just sets the destination to it, so a toddler can tap rather than drag.
- **Field and layout** (`beachLayout`, tested at the four standard views). The field is `view` minus 40-unit margins, a 130-unit top band for Home and `?` (150 at levels 7–8, where it holds the sum strip and the pail), and the pet's bottom-left corner (240 × 240). Things are placed by seeded rejection sampling with at least 30 units between edges and at least the largest puddle's radius from the puddle's start, which is the field's lower middle. At most 8 things. On resize, normalized positions are re-fitted; the puddle is clamped into the field. The layout test asserts: everything inside the field, nothing in the pet corner or under the shell's buttons, no overlaps, nothing stranded at the origin, the strip's tokens at least 100 units, and the same board on every view.
- **Level 8's strip:** each soaked thing becomes a 100 × 100 token in the sum strip; **tapping a token lets that thing go**: it hops back onto the sand at its old spot and `P` drops by its value. This is free at any time, never a miss.
- **Finish:** when the board is cleared (levels 1–7) or `P` equals the pail's number (level 8), the puddle shivers, every soaked thing washes up into one row on the sand, smallest to biggest, with its plop notes played in order, and the host friend says thank you. Then `ctx.finish`.
- **Speech:** `ctx.instruct` gives the instruction; the corner pet repeats it. Navigation never needs reading; numerals at 6–8 are read aloud on touch ("Seven. The puddle is five: too big yet").
- **Feel:** a calm existing music style (not `silenced`: the plops are accents, not her music). Wet sand, a soft blue puddle with eyes and a smile, beach things in `palette.ts` colors, Pixi `Graphics` only; soaked things bob inside the puddle (up to 8 small icons).

## Levels

| ID | Name (`describeLevel`) | Start | Things (tiers or values) | Rule added | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- |
| 1 | Soak it up | tier 2 | 5 × tier 1 | none: everything fits | Every thing fits at the start; finishes after 5 soaks |
| 2 | Too big yet | tier 1, grow 2 | 4 × tier 1, 1 × tier 2 | a thing too big until she grows | Exactly one thing too big at the start; it fits after 2 soaks |
| 3 | Bigger and bigger | tier 1, grow 2 | 2 × 1, 2 × 2, 1 × 3 (+0–1 tier 1) | two growth steps | Some thing needs tier 3; greedy clears; no tier-3 thing fits before 4 soaks |
| 4 | Count to grow | tier 1, grow 3 | 3 × 1, 3 × 2, 1 × 3 | a 3-drop meter | Greedy clears; the tier-3 thing is the last that can be soaked |
| 5 | Smallest first | tier 4, no growth | 5 things, tiers 1–4, every tier present | soak from smallest to biggest; same tier in any order | All fit from the start; the only constraint is order |
| 6 | Bigger number | `P` = 3, `+1` per soak | 6 values from 1–10 | numbers decide | At least two values too big at the start; greedy clears |
| 7 | Add to grow | `P` = 4–6, `+v` | 6 values from 1–20 | the sum strip | At least one value bigger than `P` + the smallest value at the start; greedy clears; final `P` ≤ 60 |
| 8 | Just right | `P` = 3–5, `+v`, pail `T` 12–20 | 6 values from 1–9 | land exactly on the pail's number; soaking past `T` is refused | `exactSolutions` ≥ 1 and ≤ 6 (order-feasible: each value fits when soaked); some reachable state has a fitting soak that leaves no exact total without letting go |

**Bands (`BandLevels`):** `toddler: { min: 1, max: 2 }`, `preschool: { min: 2, max: 4 }`, `prek: { min: 3, max: 6 }`, `school: { min: 5, max: 8 }`. No `order`; no lap or grown-up levels in the first build ([decision 1](#open-decisions)).

### First rounds (authored; later rounds seeded from the plan, one board per round)

- **Level 1:** a tier-2 puddle; five shells scattered. "Lead the puddle to the shells!" Every touch soaks one; after five the row washes up.
- **Level 2:** a tier-1 puddle; four pebbles and a toy boat (tier 2). If she reaches the boat first: wobble, "Too big yet! Soak little things to grow." After two pebbles the puddle grows; the boat now fits.
- **Level 3:** a tier-1 puddle; two leaves (1), two pinecones (2), a beach ball (3). The ball fits only after four soaks.
- **Level 4:** a tier-1 puddle with a 3-drop meter; three shells, three pinecones, one driftwood stick (3). "Fill the drops to grow." The stick fits only after six soaks.
- **Level 5:** a tier-4 puddle that does not grow; a feather (1), two seaweed clumps (2), a beach ball (3), a floaty ring (4). "Soak them smallest first." Touching the ring while the feather is out: a boing and "The feather is smaller. Soak it first." (one miss), the ring wobbles and stays.
- **Level 6:** `P` = 3; values 1, 2, 4, 5, 7, 3 on pebbles. 4, 5 and 7 are too big at first; soaking 1, 2, 3 brings `P` to 6.
- **Level 7:** `P` = 5; values 2, 3, 6, 9, 15, 4. 15 is too big until `P` reaches 15 (for example 5 + 2 + 3 + 4 = 14, then 6 → 20).
- **Level 8:** `P` = 4, pail 15; values 2, 3, 5, 6, 8, 9. The one exact total is 4 + 2 + 3 + 6 (5, 6, 8 and 9 are all too big at first, so the order matters too). Soaking 3 then 5 makes 12 and leaves no way to 15: the hint glows the 5 in the strip to let it go. Touching 9 at 12 would make 21: refused, "That makes twenty-one. The pail wants fifteen."

## Accounting, help and finishing

- **Never a miss:** steering anywhere; touching a too-big thing (exploration, as Domino Run's stalls and Chain Reaction's runs); repeating the instruction; letting a thing go at level 8.
- **A miss (one per refusal):** at level 5, touching a bigger thing while a smaller one is still out (`order`); at level 8, touching a fitting thing that would pass the pail's number (`too-much`). Each refusal is a boing, the thing wobbles and stays, and the pet says why. The same thing cannot count again until it is re-armed (its center leaves the puddle by 30 units) **and** she has soaked something since. At most one miss per thing per round.
- **The glow:** after two too-big touches since her last soak (levels 2–4, 6–8), or after two misses (5, 8), `hintTarget` glows and a faint trail runs from the puddle to it. At levels 1–3 the glow is free (no hint counted); from level 4 each glow counts `hints++` once, and no second glow counts until she soaks something.
- **`hintTarget`:** the nearest soakable thing (1–4, 6–7); the smallest remaining thing (5); at level 8 a soak on some exact solution consistent with what is in the strip, or, if none exists, the strip token to let go that reopens one with the fewest let-gos.
- **Show a hint** (pause sheet, `Scene.pauseActions`): the same glow on request, `hints++` once per glow at every level.
- **Finish:** `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed in this build.

## Rule tests (`logic.test.ts`)

- **`fits` and the tiers:** `t ≤ s` and `v ≤ P`; growth exactly every `grow` soaks, capped at tier 4; `+1` and `+v` growth; drawn diameters keep a soakable thing strictly smaller than the puddle and the next tier strictly bigger.
- **Refusals:** `order` exactly when a strictly smaller tier remains (level 5); `too-much` exactly when `P + v > T` (level 8); a too-big touch never changes state.
- **No dead end (1–7):** for every plan over 500 seeds, `greedyClears` from the start; and from 200 sampled reachable states per plan (random fitting soaks), greedy still clears.
- **Level 8:** every generated board has 1–6 exact solutions; from every reachable strip state (enumerable for 6 things), following `hintTarget` (soaks and let-gos) reaches `T` within 8 steps.
- **Each authored first round** has the properties listed above (the boat fits after exactly 2 soaks, level 8 has exactly the one exact total named, 3 then 5 dead-ends, and 9 at `P` = 12 is refused).
- **Generation:** well formed, passes its plan filter, same seed gives the same board, the fallback is never used.
- **Layout:** `beachLayout` at the four views for 5 and 8 things with tier-4 sizes, against the assertions above.
- **Registry, lands and how-to tests** pass with the new game, including its land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` presses on the puddle and drags toward `hintTarget`, detouring around too-big things through a tangent waypoint so the demonstration never shows a bump; at level 8 it taps a strip token when the hint is a let-go. The same bot drives the scripted play; a test asserts the bot finishes every plan over 200 seeds with zero misses.
- **How-to card** (`src/content/howto.ts`). Goal: "Lead the puddle to soak up the beach."
  - Steps: "Drag or tap to lead the puddle" (all levels); "It soaks up anything smaller than itself" `{ from: 1, to: 5 }`; "After two, it grows bigger" `{ from: 2, to: 3 }`; "Fill the three drops to grow" `{ from: 4, to: 4 }`; "Soak the smallest first" `{ from: 5, to: 5 }`; "It soaks up any number up to its own" `{ from: 6, to: 8 }`; "Each one makes the puddle one bigger" `{ from: 6, to: 6 }`; "Each number adds to the puddle" `{ from: 7, to: 8 }`; "Land exactly on the pail's number; tap one at the top to let it go" `{ from: 8, to: 8 }`.
  - Finish: "The beach is clean" `{ from: 1, to: 7 }`; "The puddle matches the pail" `{ from: 8, to: 8 }`.
  - Note: "Touching something too big is never counted: the puddle just flows past it." Plus `{ from: 5, to: 5 }`: "Soaking a bigger one first counts as a miss." and `{ from: 8, to: 8 }`: "Going past the pail's number counts as a miss; letting one go never does." Plus `{ from: 4, to: 8 }`: "After two tries that don't fit, the next one to soak glows; that counts as a hint."
- **Voice lines** under `puddle-gobble.*`: `intro`, `instruct` (1–4), `instruct-grow` (4), `instruct-order` (5), `instruct-number` (6), `instruct-add` (7), `instruct-pail` (8), `too-big`, `grow`, `smaller-first`, `too-much`, `let-go`, `hint`, `done`, number readouts reusing the shared number lines. `{pet}` is optional.
- **Registration:** ID `puddle-gobble`, name "Puddle Gobble", spoken title `game.puddle-gobble`. Region (subject) `puzzle-peaks`, beside Size Parade (comparison and ordering). Skills `['comparison', 'measurement', 'ordering', 'addition', 'planning']`. Home land **Bubble Beach** by default ([decision 3](#open-decisions)). Hub icon: a smiling puddle with a shell sliding in. Sticker: a seeded puddle with a row of things beside it.
- **Co-play:** one person names a thing ("Can it soak the ball yet?") before the other steers there. **Off-screen:** nest cups or bowls: which ones fit inside which, and line them up smallest to biggest.
- **Couch:** none in the first build. A later candidate: the stick steers the puddle directly, with seeded boards for a fair face-off on level 7–8 boards.
- **Rework couplings:** none required; nothing saved or unlocked. The puddle is a natural creature for the [creature collection](../rework/WORK-ITEMS.md) (a water sprite whose "talent" is soaking) and the tidy row could file beach finds into the journal; both are the rework's to define (RW05, RW10–RW11), not this build's.

## Check tier

New-game tier. Typecheck and unit tests (the rule properties above, plus registry, lands and how-to tests). One scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8, with one too-big touch, one refused overshoot and one requested hint; one portrait screenshot at level 4 (largest puddle and meter). `fingerdemo` at levels 1 and 8, since a drag bot has to land contacts and a let-go tap. `npm run build`, because the registry, lands, voice and how-to files change.

Device checks stay open: whether a toddler finds tap-to-lead without help; whether "visibly smaller" plus dots reads on an iPad at tier 1 versus tier 2; whether accidental too-big touches while steering feel like a scold (they count nothing, but the line is spoken).

## Open decisions

Each has a default the build uses. None blocks it.

1. **Bands.** Default toddler 1–2, preschool 2–4, pre-K 3–6, school 5–8. Not in the first build: a lap entry (any touch splashes the puddle toward a shell), which level 1 nearly is.
2. **Accounting.** Default: a too-big touch is never a miss at any level; misses come only from level 5's stated order and level 8's overshoot, one per thing per round. Alternative: count a too-big touch as a miss at numeral levels 6–8, where the comparison is deliberate.
3. **Home land.** Default Bubble Beach (a rain puddle on the sand). It holds 4 games today and 6 once Domino Run and Fruit Slice land on their defaults, so Puddle Gobble would be the seventh; the lands test must still fit. Alternative: Puzzle Peaks beside Size Parade (13 today, likely too many) or Barnyard after a rain (8 with Bolt Boards).
4. **Fit rule wording.** Default "fits if smaller than the puddle", using tiers where a same-tier thing is drawn smaller than the puddle. Alternative: strict tiers (`t < s`), which makes "same size" a refusal but needs equal-sized drawings to be told apart.
5. **Numbers at pre-K.** Level 6 numerals 1–10 sit in pre-K's range; an alternative is dot-cards under each numeral at pre-K only.
