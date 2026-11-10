# Vine Snip, levels 1–5 (definition)

Defined 2026-11-03 for [chunks 25 and 27](../ROADMAP.md#chunks) (dexterity; physics games), from the [sketch](../archive/VINE-SNIP-SKETCH-2026-10-13.md) and its [IDEAS row](../IDEAS.md#candidates). Levels 1–3 built 2026-11-04 (slice 1, PR #1213); levels 4–5 built 2026-11-05 (slice 2, PR #1270). **Ready to build:** every call below has a default the build uses under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4 physics, S8 identity, land, band and accounting). None needs a content reviewer or the developer. Proposed game ID `vine-snip`.

**Fun action and purpose:** fruit hangs from vines on a branch and a hungry friend waits below. She snips a vine with a tap or a swipe, and the fruit drops, or swings and flies, into the friend's mouth with a munch and a note. The learning goal is **cause and effect, then using a pattern of motion to predict where a thing will go.** A fruit held by one vine swings back and forth under it, a fruit let go keeps moving the way it was going while it falls, and the vine she keeps decides which way it swings. There are no bombs, spikes, lives, stars or clock. The fruit is never lost, and a swinging fruit keeps swinging until she acts.

## What changed from the sketch

- **No rope engine.** The sketch proposed a Verlet chain in `src/engine/rope.ts`. Under S4 (rule-model physics first; small hand-written deterministic solvers in the game's own `logic.ts`; no library), the build uses closed-form motion instead: a taut vine, a pendulum and a falling arc. Every frame and every landing is a formula that a Node test can check exactly, with the same result in Safari. A vine is drawn with a slight cosmetic sag, but the rules treat it as a straight taut line. `src/engine/` gains nothing.
- **Counting is dropped.** The sketch's level 4 (cut the number the sign shows) duplicates Fruit Slice's level 5 *Stop at the number*. Its place goes to *Which vine stays?*, a choice that only a swinging vine can teach.
- **Order becomes "which vine stays".** The sketch's linked vines (a fruit hanging from a vine that hangs from another vine) make a double pendulum, which has no closed form. Instead, two or three taut vines meet at the fruit. Cutting while two or more remain changes nothing (it still hangs still). The last vine left is the pivot. The plan is which vines to snip first.
- **The accounting question is settled** by the sketch's default (S8). A drop that misses counts from level 3. Levels 1–2 record nothing.
- **The lap question is settled.** The sketch's open call was whether a lap level is wanted. Level 1 is a lap entry where a tap anywhere snips.

## References

| Reference | What it shows | What Vine Snip takes or rejects |
| --- | --- | --- |
| Cut the Rope (ZeptoLab, 2010; [Wikipedia](https://en.wikipedia.org/wiki/Cut_the_Rope_(video_game)), [PocketGamer.biz studio profile](https://www.pocketgamer.biz/om-nom-and-beyond-zeptolab-a-studio-profile/), both via the sketch) | Swipe ropes so a candy falls or swings into a creature's mouth; stars, bubbles, spikes and hundreds of levels | Takes "cut so it falls or swings to a mouth". **Rejects** its characters and names, the three-star rating, spikes and hazards that lose the candy, and level-select locks. Its rope simulation is not reproduced. |
| Swiping and tapping as the easiest touch gestures for young children ([Joan Ganz Cooney Center](https://joanganzcooneycenter.org/?p=19607), [Frontiers review on PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5388766), via the sketch) | Taps and swipes suit small hands, and a swipe needs a visible cue | A tap snips the nearest vine as well as a swipe, and the swipe draws a trail from touch-down. Level 1 snips from a tap anywhere. |
| NGSS 3-PS2-2 (as cited and quoted in [Swing Pals](swing-pals.md#references): "a pattern can be used to predict future motion", with a child on a swing in its clarification) | The swing's back-and-forth is a pattern she can wait for and use | Level 3 onward: she waits for the swing to come toward her friend. The words "period" and "momentum" are never used. Voice says "swings", "keeps going" and "falls". |
| The simple pendulum and projectile motion (the textbook models; the small-swing rule is also stated in Swing Pals) | A pendulum's beat depends on its length. A released body keeps its sideways speed while gravity pulls it down, so it lands ahead of where it was let go | The toy model below is both, **stated as a toy**: toy gravity (slower than real, so a fall is easy to watch), the small-swing beat at every amplitude (about 3% off the real beat at 37°, computed), and no air. |
| [Fruit Slice](fruit-slice.md) (built) | Swipe-to-cut with a trail, refused cuts, board box translated and never scaled | Reuses its stroke handling, trail and board-box layout approach. It does not reuse its counting signs (the overlap reason above). |
| [Swing Pals](swing-pals.md) (built) | The island's pendulum toy: rope length sets the beat, and heights never decay before a goal | Shares the small-swing formula and the "a swing she has not finished keeps its height" rule. Vine Snip's question is where a let-go thing lands, not the beat itself. |

## Overlap

- **Fruit Slice** (Bubble Beach) cuts the fruit itself and counts. Vine Snip never cuts fruit, and nothing counts.
- **Swing Pals** pushes swings to a bell and matches ropes. Here she lets go of a swing, and the question is the landing.
- **Chain Reaction** sets up a run and watches. Here she acts during the motion.
- **Bouncy Launch** sets a flight with a pull. Here the swing sets the flight and she picks the moment and the pivot.
- **IDEAS Vine Swing** (a Pitfall!-style crossing with a release) is a separate crossing proposal. If it is ever built it must not take the ID `vine-snip`.

## The model (`logic.ts`)

All lengths are in **board units**. The board is a fixed 720 × 600 box, translated to the centre of `view` and **never scaled**, as Fruit Slice's is, so board units are on-screen logical units. Time is in seconds.

- **Toy gravity** `G = 1600` units/s². A 230-unit fall takes about 0.54 s (computed).
- **Vines** hang from **anchors** on a branch along the board's top (board y 40). A vine has an anchor and a length. Every vine on a fruit is **taut** and meets the fruit's **rest point**. The generator places anchors and lengths so that this holds exactly (`restPoint(vines)` returns the shared point and a test asserts every length).
- **Two or more vines** hold the fruit still at its rest point. Snipping one while two or more remain changes nothing but a cosmetic wobble (real two-vine equilibrium agrees).
- **One vine** makes a pendulum about its anchor. Its length `L` and its start angle `A` (the rest point's angle from straight below the anchor) give `angle(t) = A · cos(2π(t − t0) / T)` with `T = 2π √(L / G)`. That is a 2.5 s beat for `L` = 250 (computed). The swing never decays: a swinging fruit keeps its height until she acts or uses Grow back. The vine directly above the rest point gives `A = 0`, so the fruit hangs still under it.
- **A swing started by a breeze** (level 3) starts at `A = 30°` at the friend's far side.
- **No vines** makes a falling arc. The fruit leaves with its swing velocity (from `angle′(t)`, tangent to the arc) and falls with `x = x0 + vx·s` and `y = y0 + vy·s + G·s²/2`.
- **The catch.** A friend's **catch band** is 200 units wide (the open mouth and both paws), on its mouth line. A fruit is caught when its arc crosses the mouth line inside the band. `landing(line, cutTimes)` returns the crossing x and whether it lands in a band, and for a miss the side: `early` (short of the band) or `late` (past it). At levels 1–2 the friend **scoots** along the grass to stand under the landing point during the fall, so every drop is caught.
- **The miss.** A fruit that misses lands on a big leaf, bounces once, and floats back up to its rest point on a bubble over 1.2 s. Its vines grow back.
- **The window.** For a one-vine swing, `windows(line)` samples a full beat at 1/120 s and returns the snip times whose landing is caught. **Every shipped line has a contiguous window of at least 0.4 s in each beat** for each fruit's working plan (rule test). For example, a 250-unit vine from anchors 300 apart swings 37°. Its far turnaround is 150 units outside the kept anchor, and a 200-unit band centred 40 units inside that turnaround catches snips from about 0.17 s before the turnaround to 0.27 s after it: about 0.44 s (computed by hand, not yet by a test). If a generated line falls short, the filter rejects it. A build that finds the plan filter too tight may lower `G` or widen the band (never below 200), but must not drop the 0.4 s rule.
- **Which vine stays.** With several vines, the **kept** vine is the pivot. The fruit swings out past that anchor to the mirror of its rest point, so to reach a friend on one side she keeps the vine on that side. `plans(line)` lists every keep choice and its window, and `solve(line)` returns the working keeps. The hint uses the first.
- `logic.ts` holds plain, seeded, deterministic functions: `planFor(level)`, `makeLine(plan, rng)` (at most 50 tries, then an authored fallback that a test asserts is never needed over 500 seeds), `restPoint`, `angleAt`, `velocityAt`, `arcAt`, `landing`, `windows`, `plans`, `solve`, `nearestVine(point, vines)`, `cutBy(a, b, vines)` (a swept stroke segment against each taut vine segment) and `vineLayout(line, view)`.

## Screen and controls

- **The scene.** A big leafy branch across the top with knotted anchors; green vines with a few leaves; code-drawn fruit from `src/art/props.ts` (apple, orange, lemon, pear, as Fruit Slice draws them); friends from `src/art/critter.ts` (bunny, bear, duck, pig, dog, cat) sitting on stumps with open mouths and paws up. Their eyes follow the fruit. Pixi `Graphics` only, in `palette.ts` colours.
- **Layout** (`vineLayout`, tested at the four standard views).
  - The board is 720 × 600 and is centred. In 1024 × 768 landscape it spans x 152–872 below the top buttons. In 768 × 1024 portrait it spans x 24–744 with its top below the shell's buttons. The corner pet (left of x 150, below y 640 landscape, below y 874 portrait) sits outside the board in both.
  - Mouth lines are at board y 470. Stumps put every catch band inside the board: friend centres between board x 100 and 620.
  - Fruit is at least 90 units across. Friends are at least 160 units tall.
  - The layout test asserts that every vine's hit band, the catch bands, the friends and every arc's turnarounds stay inside the board and clear of the pet corner and shell buttons at all four views.
- **Snipping.** This uses custom pointer handling, as Fruit Slice does: `palmOnGlass` rejection, a window-level `pointercancel` listener removed in `destroy()`, and leaving the screen or lifting ends the stroke. Feedback appears at touch-down, as a bright trail starting at the finger. While the stroke moves, each segment of it cuts every vine it crosses (`cutBy`), so a fast swipe works at any frame rate. A tap (a stroke under 30 units) cuts the vine nearest the touch, if one is within 70 units (a hit band at least 140 wide). The two vines nearest to each other in any line are at least 140 units apart where a finger reaches them, so a tap resolves to the nearest vine and never to two. At **level 1** a tap or swipe anywhere on the board snips the one vine.
- **Grow back** (levels 3–5): a 110-unit leaf button at the board's top right regrows the current fruit's vines and returns it to rest. It is never a miss and never a hint. This is the undo for a plan she regrets.
- **Sound and feel:** a snip (a short high synthesized click with a leaf rustle), a soft *sproing* when a fruit starts to swing, and a munch that rings a pentatonic note from `src/audio/notes.ts` (each friend a different note, so a round plays a short tune). A miss gives a soft leaf bump and a boing. The default music keeps playing; it is not `silenced`, since she is not making the music.
- **Speech:** `ctx.instruct` repeats the level's instruction from the corner pet. Navigation never needs reading.

## Levels

| ID | Name (`describeLevel`) | Vines and friends | What she decides | Lines per round | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- |
| 1 | Snip! | One fruit on one vine above one friend | When to snip; anywhere on the board snips | 3 | Rest point straight above the mouth; one snip always feeds |
| 2 | Two vines | One fruit on two vines; the friend scoots to catch | Which vine first; the first swings it, the second drops it | 3 | Two anchors 260–340 apart; either order feeds; the swing after either first snip stays on the board |
| 3 | Wait for the swing | One vine, swinging from a breeze; the friend on a stump under one end of the swing | When to snip | 3 | The friend's band catches a window of at least 0.4 s per beat near its turnaround; snipping at the opposite turnaround or straight below misses; the friend's side is seeded |
| 4 | Which vine stays? | One fruit on two or three vines; one friend to one side | Which vine to keep, then when to snip | 3 | Exactly one keep choice has a window (at least 0.4 s); at least one line has three vines including one straight above (the "hangs still" vine); the friend's side is seeded and differs across the round |
| 5 | Two friends | Two fruits, each on two vines; a friend on each side, each wants one | For each fruit, the vine to keep and the moment | 2 | Each fruit has exactly one working keep, and the two working keeps send the fruits to different friends; a fruit caught by the wrong friend cannot happen (the bands are 200 apart at least); swings never cross the other fruit's vines |

**Bands (`BandLevels`):** `lap: { min: 1, max: 1 }`, `toddler: { min: 1, max: 2 }`, `preschool: { min: 1, max: 3 }`, `prek: { min: 2, max: 4 }`, `school: { min: 3, max: 5 }`. No `order`. No grown-up levels.

### First rounds

- **Level 1, line 1 (authored):** an apple on one vine above a bunny. "Snip the vine to feed Bunny!" Any tap or swipe snips it, the apple drops, and the bunny munches with a note. Lines 2–3 are seeded friends and fruit.
- **Level 2, line 1 (authored):** a pear on two vines, centred above a bear. "Snip a vine. What happens?" The first snip swings the pear with a *sproing*, the corner pet says "It swings!", and the bear's eyes follow. "Snip the other vine." The pear flies off its arc, the bear scoots under it and catches it.
- **Level 3, line 1 (authored):** an orange on one vine already swinging, with a duck on a stump under the right end of its swing. "Wait until it swings toward Duck, then snip!" A snip at the left end drops it short of the band ("Too soon. Wait until it swings toward Duck."). A snip as it comes up the right side lands in the duck's mouth.
- **Level 4, line 1 (authored):** a lemon on three vines (left, straight above, right), with a pig on the far right. "Which vine should stay so it swings to Pig?" Keeping the middle vine makes the lemon hang still under it, and the pet says "The middle vine keeps it still." Keeping the left vine swings it out to the left, away from the pig. Keeping the right vine swings it out toward the pig. Then she times the snip as on level 3.
- **Level 5, line 1 (authored):** two apples, each on two vines, with a dog on the left and a cat on the right. "Feed both friends, one apple each." The left apple must keep its left vine and the right apple its right vine.
- Later lines at every level are seeded from the plan, with mirroring, fruit kind and friend kind varied. Seeding never changes which keep works relative to the friend's side (rule test).

## Accounting, help and finishing

- **Never a miss:** any snip at levels 1–2; a snip that leaves at least one vine on the fruit (at any level); a swing that she lets run; Grow back; a fruit that falls straight down because she kept a vine that left it still and then snipped it (level 4 — that is a drop, so see the next point).
- **A miss (levels 3–5):** a fruit that lands outside every catch band, counted once per drop. The gentle response is the leaf bump and boing, and the fruit floats back up and its vines grow back. The spoken reason has a direction: `early` gives "Too soon. Wait until it swings toward {friend}". `late` gives "A little late. Snip as it swings up toward {friend}". At levels 4–5, when the kept vine could never reach that friend, she instead hears "That vine swings it the other way. Keep the vine on {friend}'s side." A drop at level 5 that lands with the other friend cannot happen (see the plan filter).
- **The glow after two misses** on a line: a dotted arc shows the kept vine's swing, with a golden stretch on it marking where a snip lands. At levels 4–5 the vine to keep glows first, and the other vines glow orange to show they get snipped. This counts `hints++` once per line.
- **Show a hint** in the pause sheet (`Scene.pauseActions`) gives the same glow, `hints++` once per request. At levels 1–2 it glows the vine to snip next and counts `hints++`. Asking when the line is done only says what to do next.
- **Finish:** when every friend in every line has eaten, the friends line up and munch in turn, each ringing its note, then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed in the first build.
- **Adaptation note:** levels 1–2 record no misses, so they move only through hints and smooth rounds. A timing miss is a real judgement (S8 default), so it counts. Levels 3–5 state the rule before she acts.

## Rule tests (`logic.test.ts`)

- **Determinism:** the same line and the same snip times give the same frames and landings. Nothing is NaN or infinite over 500 seeds, at any snip time in a beat.
- **Taut vines:** for every generated line, `restPoint` lies at exactly every vine's length from its anchor (within 0.5 units). Snipping while at least two vines remain leaves the fruit at rest.
- **Pendulum:** `angleAt` returns to its start after `T`. `T` grows with `√L`. The vine straight above the rest point gives `A = 0`.
- **Arc:** a fruit snipped at a turnaround falls straight down. A fruit snipped mid-swing lands ahead of its release point in the swing's direction.
- **Windows:** every shipped line's working plan has a contiguous window of at least 0.4 s in each beat. At level 3, a snip at the opposite turnaround and one straight below both miss, and `landing` names the side.
- **Which vine stays:** at level 4 exactly one keep has a window, and the straight-above vine (when present) gives none. At level 5 each fruit's single working keep feeds a different friend, and no fruit can land in the wrong friend's band.
- **Input geometry:** a stroke segment that crosses a vine cuts it, one that misses does not, and a fast stroke split into long segments cuts the same vines as a slow one. A tap within 70 units resolves to the nearest vine. Neighbouring vines are at least 140 apart where a finger can reach them.
- **Layout:** `vineLayout` at the four views keeps the board, catch bands, arcs and the Grow back button inside `view`, clear of the pet corner and shell buttons. Every target is at least 100 units, and the board is never scaled.
- **Generation:** for every plan over 500 seeds, lines are well formed, the plan filter in the table holds, the same seed gives the same line, mirroring keeps solvability, and the fallback is never used. Each authored first line has the outcome named in [First rounds](#first-rounds).
- **Hints:** following `solve` at the middle of its window always feeds the friend.
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` taps the vine at level 1. At level 2 it swipes across one vine, then the other. At levels 3–5 it swipes across the non-kept vines first, then waits for the middle of `solve`'s window and swipes across the kept vine. It never demonstrates a miss. The same bot drives the scripted play and `fingerdemo`.
- **How-to card** (`src/content/howto.ts`). Goal: "Snip the vines so the fruit drops or swings into a hungry friend's mouth."
  - Steps: "Tap anywhere to snip the vine" `{ from: 1, to: 1 }`; "Tap or swipe across a vine to snip it. One vine left makes the fruit swing" `{ from: 2, to: 5 }`; "Snip as the fruit swings toward the friend. It keeps going as it falls" `{ from: 3, to: 5 }`; "The vine you keep is where it swings from. Keep the vine on the friend's side" `{ from: 4, to: 5 }`; "Feed each friend one fruit" `{ from: 5, to: 5 }`.
  - Finish: "Every friend has eaten."
  - Note `{ from: 3, to: 5 }`: "A fruit that misses floats back up and counts as a miss. After two, a glowing path shows where to snip, which counts as a hint. Grow back is always free." Always: "The swing and the fall follow simple toy rules (slow gravity, no air), close to real motion but not exact."
- **Voice lines** under `vine-snip.*`: `intro`, `instruct-snip` (1), `instruct-two` (2), `instruct-wait` (3), `instruct-keep` (4), `instruct-both` (5), `swings`, `still`, `early`, `late`, `wrong-side`, `grow`, `munch`, `hint`, `done`. `{friend}` and `{pet}` are filled from the line.
- **Registration:** ID `vine-snip`, name "Vine Snip", spoken title `game.vine-snip`. Region (subject) `tinker-lab`. Skills `['cause-and-effect', 'patterns-of-motion', 'prediction', 'planning']`. Home land **Tinker Lab** (default, S8), with Chain Reaction and Bouncy Launch. Tinker Lab already pages ("a full land pages, never shrinks"), so one more spot needs only the lands tests. Hub icon: a fruit on a snipped vine above an open mouth. Sticker: a seeded friend munching a seeded fruit under a vine.
- **Co-play:** one person says "now!" when the fruit swings toward the friend; at levels 4–5, both guess which vine to keep before snipping. **Off-screen:** hang a sock from a string, swing it, and let go at different moments over a laundry basket. Then try holding it by two strings and letting one go.
- **Couch:** none. **Rework couplings:** none required; nothing is saved or unlocked. Friends at the mouths are a natural place for collected creatures ([RW05](../rework/WORK-ITEMS.md#rw05-creature-collection-and-active-companion)); that is the rework's to define.

## Build slices

1. **Levels 1–3 as a registered game (built 2026-11-04, PR #1213)** (new-game tier): `logic.ts` with the model, solver and layout, their rule tests, the scene, art, sound, voice lines, how-to card with ghost finger, registry and land, plus a `browser-check.mjs` case and its README row. Its `BandLevels` uses the table's ranges capped at 3 (`prek: { min: 2, max: 3 }`, `school: { min: 3, max: 3 }`).
2. **Levels 4–5 (built 2026-11-05, PR #1270)** (new rules on the existing interaction): keeps, the straight-above vine, the wrong-side line, two fruits and the full ranges above.

Later, as proposals only: a bubble that lifts a fruit, a bounce leaf, a spider that is gently shooed (not a hazard), and a "which vine stays" round with a pre-snipped choice to predict before trying (unscored).

## Check tier

**Slice 1:** typecheck and unit tests (the rule properties above, plus registry, lands and how-to). One scripted play through the new `browser-check.mjs` case, filtered to level 1 and level 3, with one missed drop at level 3 and one requested hint. One portrait screenshot at level 3. `fingerdemo` at level 3, since the bot must time a swing. `npm run build`, because the registry, lands, voice and how-to files change.

**Slice 2:** typecheck, rule tests, one play of level 5 with one wrong-side keep, Grow back, and then both friends fed. One portrait screenshot at level 4 with three vines. `fingerdemo` at level 5.

Device checks stay open: whether a toddler connects a tap on the vine with the drop; whether the swing's "keep going" reads on an iPad; whether the 0.4 s windows feel comfortable to a four-year-old finger.

## Decisions (defaults the build uses)

**Decided 2026-11-03 under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4, S8):**

1. **Physics:** closed-form rules in `logic.ts` (taut vines, the small-swing pendulum, a falling arc), with no `src/engine/rope.ts` and no library.
2. **Bands:** lap 1, toddler 1–2, preschool 1–3, pre-K 2–4, school 3–5.
3. **Accounting:** levels 1–2 record no misses; from level 3 a missed drop is one miss.
4. **Home land:** Tinker Lab. The alternative is Rainbow Meadow, which already holds Swing Pals and Lift It.
5. **Journal:** nothing filed. The alternative is "the fruit keeps going as it falls", filed once level 3 has shown a caught swing.

**Build decisions, slice 2 (2026-11-05):**

- Finger spacing: the definition's 140 units cannot fit three vines or two two-vine fruits on the 720-wide board, because both keeps' swings must stay on it (anchors sum to at most 312 apart). Levels 4–5 use `KEEP_GAP = 100` at 0.15 and 0.3 of the way down (the 100-unit target minimum); level 2 keeps 140.
- Timing fairness at 4–5: the top on the friend's side feeds and the start misses; level 3's straight-below rule is dropped there, since with a short fall the low fruit's bottom snip lands in the band. The authored level 4 window is 0.417 s, just over the 0.4 floor.
- Level 5 inner vines are nearly upright (44–54 off) so keeping them barely swings the fruit; fruits sit at different heights (high about 180–205, low about 290–320 below the branch).
- The bot taps rather than swipes the vines to snip at 4–5.
- Open device checks: whether a four-to-five-year-old reads which vine stays, and two simultaneous fruits on an iPad.
