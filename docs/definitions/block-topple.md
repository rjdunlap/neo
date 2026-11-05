# Block Topple, levels 1–5 (definition)

Defined 2026-11-03 for [chunks 25, 26 and 27](../ROADMAP.md#chunks) (dexterity; gaps against popular games; physics games), from the [sketch](../block-topple.md) and its [IDEAS row](../IDEAS.md#candidates). Slice 1 (levels 1–3) built 2026-11-04; slice 2 (levels 4–5) is not built. **Ready to build:** every call below has a default the build uses under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4 physics: "Block Topple starts with the simplified tipping rule"; S8 identity, land, band and accounting). None needs a content reviewer or the developer. Proposed game ID `block-topple`.

**Fun action and purpose:** a sleepy friend dozes on top of a block tower with a bell. She pulls a big springy sling back and lets go; a soft ball arcs out, thumps the tower, and the top tips over onto a cushion, the bell rings and the friend giggles. The learning goal is **estimating angle and power from the last try, then predicting where a stack is weak:** a push high on a tall, thin stack tips it over, while a push low down only bumps it. Nothing is harmed or lost, nothing is an enemy, and there are no stars, scores, shot limits or clock.

## What changed from the sketch

- **No block engine.** The sketch proposed a rigid-body simulation in `src/engine/blocks.ts` and testing a "window of working shots" because toppling is chaotic. Under S4 (rule-model physics first; small hand-written deterministic solvers in the game's own `logic.ts`; no library; Block Topple starts with the simplified tipping rule), the build uses a **closed-form flight** and **one stated tipping rule**. Every flight, first contact and topple is a formula that a Node test checks exactly, with the same result in Safari. The fall itself is a scripted tween. `src/engine/` gains nothing; a second consumer (Bubble Cannon's pull) would reuse `logic.ts` functions or earn a shared file then.
- **The robustness test becomes a rectangle.** "The result does not change when the pull is nudged by two percent" becomes: every shipped line has a rectangle of working pulls at least 8° wide and 20 units long, which contains far more than a 2% nudge.
- **Level 4's two stacks are re-shaped.** The sketch's "the wide one needs a low hit" contradicts the tipping rule (a wide stack is the one a low hit cannot tip). Level 4 is now *Hit it high*: a short wide stack with a narrow block on top, and a tall thin tower behind it, both tipping only from a high hit.
- **The lap fire-and-watch level stays out.** It was an open call; the default (S8) is no lap or toddler band. The pull is a deliberate drag, and Bouncy Launch already gives a tap-to-fly level to younger players.
- **The land is re-derived.** The sketch reasoned from Tinker Lab being full at 12; lands now page rather than shrink, so Tinker Lab is the home (with Bouncy Launch, Block Tower and Chain Reaction).

## References

| Reference | What it shows | What Block Topple takes or rejects |
| --- | --- | --- |
| Angry Birds (Rovio, 2009; [Wikipedia](https://en.wikipedia.org/wiki/Angry_Birds_(video_game)), via the sketch) and Crush the Castle (Armor Games, 2009, its cited inspiration) | Pull a slingshot, release, watch a projectile arc into a structure and topple it | Takes "pull, release, a stack tips". **Rejects** its birds, pigs and names, enemies to destroy, the three-star score, a shot limit, and a chaotic rigid-body engine. |
| Pull versus flick for young children ([Joan Ganz Cooney Center](https://joanganzcooneycenter.org/?p=19607), via the sketch) | A drag suits small hands; a fast flick does not | The pull is measured from how far the finger moves, never its speed, as Bouncy Launch's is. |
| Projectile motion (the textbook model) | A launched ball keeps its sideways speed while gravity pulls it down, so angle and speed set where it goes | The toy model below, **stated as a toy**: slow toy gravity so the arc is easy to watch, no air, no spin. |
| Toppling a block (the textbook rule: a push tips a block when its turning effect about the far bottom edge beats the weight's) | A push higher up has more turning effect; a wider base resists more | Simplified to one rule a child can see: **a push at least as high as the stack is wide tips it**. Real toppling also depends on how hard and how heavy; here any hit that reaches is hard enough. Stated on the how-to card. |
| [Bouncy Launch](../GAMES.md#bouncy-launch) (built) | The island's sling: a finger grabs the pet and pulls it back; `MIN_PULL` 30 and `MAX_PULL` 170; `palmOnGlass` and `pointercancel` handling; the last flight's arc kept | Reuses its pull handling and constants and the kept last arc. Adds direction: the pull's angle sets the launch angle, which Bouncy Launch does not use. |
| [Block Tower](../GAMES.md#block-tower) (built) | Stacking by an exact balance rule; the October 23 call that unsuccessful trials are unscored experiments with one counted hint after two | Takes the experiment accounting for a thump (below). The question is reversed: where a stack is weak, not how to build one that stands. |

## Overlap

- **Bouncy Launch** (Tinker Lab) sets one distance with one pull on a flat strip and lands on clouds. Block Topple adds the launch angle and a structure that answers where it is hit.
- **Block Tower** (Tinker Lab) builds and balances; nothing is hit. **Domino Run** (Bubble Beach) plans a chain of falls; here one hit tips one stack, and toppled parts never touch another stack (a plan filter).
- **Peg Garden** and **Bounce Back** drop or bounce a ball through pegs; neither has a pull or a structure.
- **Bubble Cannon** (IDEAS) is a separate later game reusing the pull; it does not take this ID.

## The model (`logic.ts`)

All lengths are in **board units**. The board is a fixed 720 × 560 box, translated to the centre of `view` and **never scaled**, as Vine Snip's and Fruit Slice's are, so board units are on-screen logical units. y grows downward. Time is in seconds.

- **The sling.** The ball rests at the **sling point** (board 200, 400); the grass line is at board y 500. A pull is the vector from where the finger touched the ball to where it is now. Its length is clamped to `MIN_PULL`..`MAX_PULL` (30..170, Bouncy Launch's), and its direction, reversed, is the launch direction, clamped to **10°–75° above the horizontal** toward the stacks. A release under `MIN_PULL` springs the ball back: no shot, no miss.
- **Flight.** Launch speed `v = 6 · pull` units/s (180..1020). **Toy gravity** `G = 1600` units/s² (Vine Snip's). The ball is a circle of radius 30 at `x = 200 + v·cos a · t`, `y = 400 − v·sin a · t + G·t²/2`.
- **Contact.** `flight(line, pull)` returns the **first** thing the ball's circle touches: a block (with the contact point), the hill, the grass, or the right-hand net at the board's edge. Contact with an axis-aligned block face or the hill's box is solved in closed form (x is linear in t; y is quadratic), so no sampling decides a hit. The ball then drops and rolls back to the sling over 1 s.
- **Stacks.** A stack is a column of blocks resting on each other, each at least 100 units on every face, with a **target** (a bell, a sleeping friend, or at level 5 a fruit) resting on its top block.
- **The tipping rule.** A hit on block *k* at height `h` above the grass tips the part from block *j* upward, where *j* is the **lowest** block at or below *k* for which `h − base(j) ≥ width(j)` (the hit is at least as high above that block's base as that block is wide). Everything from *j* up turns over its far bottom edge onto a cushion behind the stack, carrying its targets. If no *j* qualifies, the hit is a **thump**: the hit block wiggles and nothing falls. `tips(line, hit)` returns *j* or `null`, and is the whole rule.
  - A tall thin tower (100 wide) hit anywhere above its first block tips whole. A hit on its first block thumps.
  - A short wide stack (a 150-wide base, 100 high, with a 100-wide block on top) tips whole only from a hit at least 150 high, the top block's upper half or its top face. Lower hits thump.
- **The fall** (cosmetic): the tipping part rotates 90° about its far bottom edge over 0.6 s and settles on the cushion, its blocks spreading slightly; the target lands on the cushion (the bell rings; the friend giggles; a fruit rolls into the basket). The plan filter keeps every possible toppled part clear of every other stack, so a fall never starts another.
- **Misses by side.** A flight whose first contact is the grass or the hill short of the stacks is `short`; one that reaches the net or lands past the last stack is `over`. `flight` names the side.
- **Working pulls.** `works(line, pull)` is true when the flight's first contact tips a stack that still holds a target. `windows(line)` samples pulls on a grid (1° by 2 units over 10°–75° and 30–170) and returns the working cells. **Every shipped line has a rectangle of working pulls at least 8° by 20 units** for each target, with the other stacks still standing and after any of them has toppled (rule test). `solve(line)` returns the centre of the largest such rectangle; `nearestWorking(line, pull)` returns the working cell nearest a given pull (angle and length scaled so 1° counts as 2 units). A build that finds the filter too tight may move stacks or lower `G`, never shrink a block below 100 or the rectangle below 8° × 20.
- **Sampled estimates** (a 1/240 s sampled script during this definition, not yet a test; the build's closed-form tests replace them): level 1's working pulls are about 30% of the grid and include a 20° by 30-unit rectangle; level 2's about 20%, level 3's about 8%, and both include an 8° by 20 rectangle; at level 3 no pull flatter than 20° reaches the tower; at level 4 the short wide stack works for about 27% of pulls and the tall tower behind it, with the wide stack still standing, about 5% (largest rectangle about 13° by 24), and about 60% of the pulls that reach the wide stack thump it. No level 2 pull went over: a flat hard pull still meets the tower, so `over` arises where an arc clears a stack.
- `logic.ts` holds plain, seeded, deterministic functions: `planFor(level)`, `makeLine(plan, rng)` (at most 50 tries, then an authored fallback that a test asserts is never needed over 500 seeds), `launch(pull)`, `positionAt`, `flight`, `tips`, `works`, `windows`, `solve`, `nearestWorking`, `fellFruit(line, toppled)` (level 5) and `boardLayout(line, view)`.

## Screen and controls

- **The scene.** A grassy field under a soft sky, the sling a big forked branch with a stretchy vine band, wooden blocks in `palette.ts` colours with grain lines, a cushion behind each stack, a hill as a green mound, a rope net at the right edge. Friends from `src/art/critter.ts` (bunny, bear, duck, pig, cat) sleeping on top; a brass bell; fruit from `src/art/props.ts` at level 5, with a woven basket. Pixi `Graphics` only.
- **Layout** (`boardLayout`, tested at the four standard views). The board is centred. In 1024 × 768 landscape it spans x 152–872 below the top buttons; in 768 × 1024 portrait x 24–744, its top below the shell's buttons. The corner pet sits outside the board in both. The ball's grab circle is 140 across (the drawn ball 60) at the sling point; the pulled ball stays inside the board at every clamped pull (sling x 200 minus 170 is board x 30). Stacks stand between board x 340 and 700. The layout test asserts that the sling's grab circle, every stack, every possible fall, the hill and level 5's number pads stay inside the board, clear of the pet corner and shell buttons.
- **The pull.** Custom pointer handling, reusing Bouncy Launch's: `palmOnGlass` rejection, a window-level `pointercancel` listener removed in `destroy()`, and leaving the screen dropping the pull with no shot. Touch-down feedback: the band stretches at once and the ball squashes. While pulling, the band stretches with the finger; no aiming line is drawn (the estimate is hers). From level 2 the **last arc** stays as a faint dotted trail until the next shot lands.
- **Sound and feel:** a stretchy creak while pulling, a *thwip* on release, a wooden thump on contact pitched by block size (taller blocks lower, pentatonic steps from `src/audio/notes.ts`), the bell's ring, a giggle; a soft boing for a short or over shot. The default music plays; she is not making the music.
- **Speech:** `ctx.instruct` repeats the level's instruction from the corner pet. Navigation never needs reading.

## Levels

| ID | Name (`describeLevel`) | Stacks | What she decides | Lines per round | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- |
| 1 | Big and close | One tower of three big blocks (140 wide) with a bell, close to the sling | Pull and let go | 3 | A working rectangle at least 20° by 30 units; working pulls at least a quarter of the grid |
| 2 | Farther | One thin tower (100 wide) farther away, a friend asleep on top | How hard to pull, from the last arc | 3 | The tower stands at least 120 units farther than level 1's; at 45° a pull of 60 falls short and a harder one works; a working rectangle at least 8° by 20 |
| 3 | Over the hill | A hill between the sling and a thin tower | How high to aim | 3 | Every pull flatter than 20° meets the hill or falls short; a working rectangle at least 8° by 20 |
| 4 | Hit it high | A short wide stack with a narrow block on top, and a tall thin tower behind it; a friend on each | Where on the stack to hit | 2 | Each target has a working rectangle (at least 8° by 20) with the other stack standing and after it topples; at least a fifth of the pulls that reach the wide stack thump it; no fall reaches the other stack |
| 5 | Count what fell | Two thin towers with a fruit on each block (2–4 each) and a bell on top; a basket at their feet | Where to hit, then how many fell | 2 | A tip from different blocks drops different numbers of fruit; the total that can fall in a line is at most 8; each bell has a working rectangle |

**Bands (`BandLevels`):** `preschool: { min: 1, max: 2 }`, `prek: { min: 1, max: 4 }`, `school: { min: 2, max: 5 }`. No `order`. No lap, toddler or grown-up levels.

### First rounds

- **Level 1, line 1 (authored):** three big blocks and a bell, a bunny asleep on top. "Pull back the ball and let go to tip the tower!" A medium pull up and to the right tips the tower; the bell rings and the bunny lands giggling on the cushion. Lines 2–3 are seeded.
- **Level 2, line 1 (authored):** a thin tower at board x 580 with a bear on top. A medium pull falls short ("Short! Pull a bit harder."), and the faint trail shows where it went; a harder pull at the same angle tips it.
- **Level 3, line 1 (authored):** a hill at board x 330–430 hides the bottom of a thin tower with a duck on top. A flat pull hits the hill ("The hill's in the way. Aim higher!"); a lob over it tips the tower.
- **Level 4, line 1 (authored):** a short wide stack (a 150-wide base with a 100-wide block on top, a pig on it) in front, and a four-block tower behind with a cat. "Knock both friends down to their cushions." A hit on the base thumps ("Bump! Try higher up."); a hit high on the top block tips the whole stack. The tall tower tips from any hit above its first block.
- **Level 5, line 1 (authored):** two towers, the left with two fruits and the right with three, a bell on each. A hit on the right tower's top block tips only that block and its fruit; she rings the second bell; the pet asks "How many fruits fell?" and she taps the number among three pads.
- Later lines are seeded from the plan, with friend kind, block colours and a small sideways shift of the stacks varied. Seeding never changes whether a plan's filter holds (rule test).

## Accounting, help and finishing

- **Never a miss:** a release under `MIN_PULL`; any shot at level 1; a **thump** (a hit that tips nothing is an experiment, as Block Tower's unsuccessful trials are); a shot at a stack whose target has already fallen.
- **A miss (levels 2–5):** a `short` or `over` shot, one per shot. The gentle response is a soft boing, the ball rolling back, and a spoken reason with a direction: `short` gives "Short! Pull a bit harder or aim higher.", `over` gives "Over! A gentler pull.", and the hill (level 3) gives "The hill's in the way. Aim higher!".
- **Level 5's count:** a wrong number is one miss, once per line; the pet counts the fruit in the basket aloud, each one pulsing, then she taps again. The pads are the right number and its neighbours (never below 1), at least 110 units, in a seeded order.
- **The glow after two misses** on a line (a miss each, or a short and an over): a dotted preview arc of `nearestWorking` from her last pull, with a ghost ball at the sling showing where to pull to. `hints++` once per line. **After two thumps** on a line with no topple between them, the stack shows a golden band above its tipping line ("Higher up tips it"), `hints++` once per line. Neither glow gives the shot; she still pulls.
- **Finish:** when every target in every line has fallen (and at level 5 each count is answered), the friends wave from their cushions and the bells ring in turn, then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed in the first build.
- **Adaptation note:** level 1 records no misses, so it moves only through hints and smooth rounds. From level 2 a short or over shot is a real estimate (S8 default), so it counts; thumps never do, so trying where to hit is free.

## Rule tests (`logic.test.ts`)

- **Determinism:** the same line and pull give the same flight, contact and topple. Nothing is NaN or infinite over 500 seeds at any grid pull.
- **Flight:** before contact, `positionAt` matches the ballistic formula exactly; the clamps hold (a pull past 170 flies as 170; a direction flatter than 10° launches at 10°); a pull under 30 is no shot.
- **Contact:** `flight` finds the first touched thing, never a block behind another along the path; a closed-form contact agrees with a fine sampled check within 1 unit; nothing passes through the grass or a block between frames.
- **Tipping:** a 100-wide tower hit 99 above the grass thumps and hit 101 above tips whole; the short wide stack thumps from a hit at 149 and tips from 151; a hit on a top block whose own rule holds but whose lower block's does not tips only from that block up (level 5's partial fall).
- **Windows:** every shipped line meets its plan filter in the table, including the rectangle for each target before and after the other stacks topple, and level 3's flat pulls all meeting the hill.
- **Falls:** no possible toppled part's footprint reaches another stack or leaves the board.
- **Level 5:** `fellFruit` equals the fruit on the toppled blocks; at least two different counts are possible in each line.
- **Hints:** `solve` always works; `nearestWorking` from any grid pull works and is no farther than any other working cell.
- **Layout:** `boardLayout` at the four views keeps the board, the grab circle, falls, the hill and the pads inside `view`, clear of the pet corner and shell buttons, every target at least 100 units, and the board never scaled.
- **Generation:** for every plan over 500 seeds, lines are well formed, the same seed gives the same line, and the fallback is never used. Each authored first line has the outcome named in [First rounds](#first-rounds).
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` puts a finger on the ball, pulls back along the reverse of `solve`'s angle by its length, and lets go; at level 5 it then taps the right number. It never demonstrates a miss or a thump. The same bot drives the scripted play and `fingerdemo`.
- **How-to card** (`src/content/howto.ts`). Goal: "Pull the ball back and let go to tip the towers onto their cushions."
  - Steps: "Pull the ball back and let go" `{ from: 1, to: 5 }`; "A longer pull goes farther. The faint path shows the last try" `{ from: 2, to: 5 }`; "Pull more downward to throw it higher, over the hill" `{ from: 3, to: 5 }`; "A bump high up tips a stack; a bump low down only wiggles it" `{ from: 4, to: 5 }`; "Count the fruit that fell into the basket" `{ from: 5, to: 5 }`.
  - Finish: "Every friend is on a cushion."
  - Note `{ from: 2, to: 5 }`: "A shot that lands short or flies over counts as a miss. A bump that tips nothing is never a miss. After two misses, a dotted path shows a pull that works, which counts as a hint." Always: "The flight and the tip follow simple toy rules (slow gravity; a push as high as the stack is wide tips it), close to real but not exact."
- **Voice lines** under `block-topple.*`: `intro`, `instruct-pull` (1), `instruct-far` (2), `instruct-hill` (3), `instruct-high` (4), `instruct-count` (5), `short`, `over`, `hill`, `thump`, `tipped`, `how-many`, `count-again`, `hint-arc`, `hint-high`, `done`. `{friend}` and `{pet}` are filled from the line.
- **Registration:** ID `block-topple`, name "Block Topple", spoken title `game.block-topple`. Region (subject) `tinker-lab`. Skills `['estimation', 'cause-and-effect', 'prediction', 'counting']`. Home land **Tinker Lab** (default, S8), beside Bouncy Launch and Block Tower. Tinker Lab already pages ("a full land pages, never shrinks"), so one more spot needs only the lands tests. Hub icon: a ball arcing into a leaning tower. Sticker: a seeded friend giggling on a cushion beside a tipped tower.
- **Co-play:** one person pulls, the other says "higher" or "harder" from the last trail; at level 4, both point where they would hit before the shot. **Off-screen:** stack cardboard boxes or blocks, then roll or toss a soft ball at different heights: which stacks tip, and where?
- **Couch:** none. **Rework couplings:** none required; nothing is saved or unlocked. The sleeping friends are a natural place for collected creatures ([RW05](../rework/WORK-ITEMS.md#rw05-creature-collection-and-active-companion)); that is the rework's to define.

## Build slices

1. **Levels 1–3 as a registered game** (**built 2026-11-04**; deviations below) (new-game tier): `logic.ts` with the flight, contact, tipping rule, windows, solver and layout, their rule tests, the scene, art, sound, voice lines, how-to card with ghost finger, registry and land, plus a `browser-check.mjs` case and its README row. Its `BandLevels` caps the table at 3 (`prek: { min: 1, max: 3 }`, `school: { min: 2, max: 3 }`).
2. **Levels 4–5** (new rules on the existing interaction): the wide stack, partial tips, the thump hint, the basket and number pads, and the full ranges above. **Level 4 built 2026-11-05; level 5 not built** (needs redefinition, see [slice 2 as built](#slice-2-as-built-2026-11-05-level-4-built-level-5-not-built)); the school range is 2–4 until then.

Later, as proposals only: a bounce leaf, a seesaw, a heavy ball, a target needing two hits, chains where one fall tips another (needs a fall model), two friends taking turns, and Bubble Cannon on the same pull.

## Check tier

**Slice 1:** typecheck and unit tests (the rule properties above, plus registry, lands and how-to). One scripted play through the new `browser-check.mjs` case, filtered to level 1 and level 3, with one short shot and one hill shot at level 3 (two misses, then the dotted arc) and then the tip. One portrait screenshot at level 3. `fingerdemo` at level 3. `npm run build`, because the registry, lands, voice and how-to files change.

**Slice 2:** typecheck, rule tests, one play of level 4 with one thump then a high hit, and level 5 with one wrong count then the right one. One portrait screenshot at level 4. `fingerdemo` at level 5.

Device checks stay open: whether a four-year-old can aim by angle as well as length from the trail; whether the pull feels comfortable at full stretch on an iPad; whether "high up tips it" reads from the thumps without the glow.

## Decisions (defaults the build uses)

**Decided 2026-11-03 under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4, S8):**

1. **Physics:** a closed-form flight and the one tipping rule in `logic.ts`, scripted falls; no `src/engine/blocks.ts` and no library.
2. **Bands:** preschool 1–2, pre-K 1–4, school 2–5; no lap fire-and-watch level.
3. **Accounting:** level 1 records no misses; from level 2 a short or over shot is one miss; a thump is never a miss; level 5's wrong count is one miss per line.
4. **Home land:** Tinker Lab. The alternative is Bubble Beach, beside Domino Run and Peg Garden.
5. **Journal:** nothing filed. The alternative is "a push high up tips a tall stack", filed once level 4 has shown a high-hit tip after a thump.

## Slice 1 as built (2026-11-04): deviations from the model above

- **Board 860 × 600, not 720 × 560.** The sling is at (230, 400), the net at x 860 and falls end by x 840, because a toppled part lies its full height past the stack and needs the room.
- **Contact** is the ball's centre entering the block grown by the ball radius (square corners), not a rounded-corner solve.
- **Towers.** Level 2's tower stands at x 520–540 (two blocks); level 3's at 520–550 behind a hill at x 360–460, 110 high, so the falls fit.
- **Pull reach.** A long flat pull can bring the ball toward the pet corner on an iPad held sideways (it sits under the finger); the grab circle and every target clear it.
- **Level 1 hints.** The hint counts short, over and hill shots on level 1 too: level 1 records no misses but can still earn the dotted path, counted as a hint.
- **Thumps** in slice 1 wiggle and say "Bump! Try higher up." without the golden band (slice 2).
- **Measured working shares** (of the sampled grid): level 1 38%, level 2 32%, level 3 23%; largest working windows 41° × 60, 42° × 42 and 37° × 36 (degrees × units).

## Slice 2 as built (2026-11-05): level 4 built, level 5 not built

- **Level 4 is one stack per line, three lines, not two stacks in two lines.** On the 860 board, a 150-wide two-block stack, its 200-long fall, any 100-wide tower and its fall need at least 650 units past board x ~330, far beyond `FALL_MAX` 840; compact falls save only about 50 per stack. A round is the authored short wide stack (150-wide base, 100-wide block centred on top, a pig), then a seeded tall thin tower (3 blocks of 100, x 380–410), then a seeded wide stack (base x 400–460).
- **Rule.** The wide stack tips only from a push at least 150 high (the top block's upper half or the friend); lower hits thump. The authored wide stack works for about 28% of the pull grid and about 56% of the pulls that reach it thump (filter at least 20%). Every line keeps an 8° by 20 working window, and every level 4 fall ends inside a 768-wide portrait view.
- **Golden band (new at every level).** After two thumps on a line (never misses) a golden band shows from the stack's `tipLine` (the lowest push that tips anything) to its top; one hint per line, voice line `block-topple.hint-high`; new instruction `block-topple.instruct-high`. At level 1 that hint is the only one recorded besides arc hints.
- **Bands:** preschool 1–2, pre-K 1–4, school 2–4 (the table above still says 2–5 until level 5 is redefined).
- **Level 5 (Count what fell) is not built and needs redefinition.** Under the tipping rule a uniform 100-wide tower never tips in part (any push on an upper block qualifies j=0; a rule test asserts it). A partial tip needs a lower block wider than its own height plus the upper block's width (at least 200 for a two-step, about 250+ for three), whose fall overruns the board; two towers per line do not fit either. Options: one stepped stack per line on a wide pedestal, counting per line; counting fruit across lines; or a different fall cosmetic. This is a `define` item in [READY](../READY.md).
