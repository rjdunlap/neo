# Bumper Garden deep dive

*ID `bumper-garden` · bands lap, toddler, preschool, pre-K · levels 1–6 and 9 on 2026-10-15 · session `claude/bumper-garden-deep-dive` ([PR #297](https://github.com/rjdunlap/neo/pull/297))*

## The game today

The fun action is sending a ladybug up into a garden table and watching flowers chime and bloom when it bumps them. The learning is cause and effect, visual tracking of a moving thing, flip timing, then colors, counting and ordered numbers. The ladybug never drains: a flower pot below the flippers catches it and pops it back up. Current ladder includes Count on and Count back ([PR #408](https://github.com/rjdunlap/neo/pull/408)); the original deep-dive baseline was `f245779`.

Band windows are the actual adaptive ranges (`LEVELS` in `src/games/bumper-garden/index.ts`): lap 1, toddler 1–2, preschool 2–4, pre-K IDs 3–6 and 9, in order `[3, 4, 6, 5, 9]` (`min: 3`, `max: 9`). IDs 7 and 8 are not built. There is no school window. Couch: tier game, `play: 'together'`, face-off `team`, one flipper per player, trip level 3 then 4, demo level 3.

| Level | Plan | Bands | Table and first round | What she decides | Response, help and completion |
| --- | --- | --- | --- | --- | --- |
| 1 | `spring` (6 flowers, goal 6) | L, T | Tap anywhere: the ladybug leaves the pot at a random angle | Nothing; the action is the toy | No misses. Flowers bloom when touched. The round ends after the sixth launch. The pet repeats "tap to send the ladybug up" after 8 idle seconds |
| 2 | `bloom` (5 flowers) | T, P | The pot relaunches by itself after 1.2 s. Tapping the left or right half of the screen flips that flipper, wide reach (+46) | When to flip, which side | No misses and no hints: a ladybug that does nothing is simply caught again. Ends when every flower has bloomed. The pet counts each bloom aloud (slice 1, 2026-10-15) |
| 3 | `color` (7 flowers, 3 of the asked color) | P, K | "Bloom the yellow flowers!" Only that color blooms; the others just chime | Which flowers to aim for | A shot (a pot-to-pot trip) that blooms nothing wanted is a gentle miss; two in a row show a glow on the wanted flowers and aim the next launch at one (`aimFor`). The pet counts the bloomed ones |
| 4 | `order` (6 flowers, 1–3 numbered) | P, K | "Bump the flowers in order. Find 1!" | The next number | Same miss and hint rule. The pet says "Now 2!" after 0.9 s |
| 5 | `order` (8 flowers, 1–5 numbered) | K | Five numbers among three plain decoys | The next number, with distractions | As level 4 |
| 6 | Count on, `order` (6 flowers) | K | A seeded start from 2–6 and three or four consecutive numbers; the strip highlights the next | Count on from a number other than 1 | As level 4; complete the shown sequence |
| 9 | Count back, `order` (8 flowers) | K | A seeded start from 5–8, descending to 1; the strip highlights the next | Count back by one | As level 4; ends when 1 blooms after the preceding numbers |

### How it plays, from the source

- The table is 600 × 720 units, 1/120-second fixed steps, so a look ahead, a ghost finger and the game agree at any frame rate. Flowers sit on 8 fixed spots (`SPOTS`) and a round uses 5 to 8 of them in a seeded shuffle; the hedges, flippers, pot and launch point never change.
- A flip while the ball is within `kickReach` (30 units at levels 3–6 and 9, 76 at levels 1–2) sends it back up, leaning by where on the flipper it landed, with ±40 of random sideways chance. A flip that connects with nothing still animates and ticks.
- Each bump chimes a bell, pitched by height on the table. A wanted bump blooms the flower with a star burst.
- The ghost finger (`autotouch`) taps to launch at level 1, then asks `planFlip` for the moment to press; the couch bot (`autoplay`) flips the side the ball is falling toward. Rule tests cover every spot being reachable, no launch trapping the ball, the right flowers per plan, the flipper kick, and the bot's plan.
- Misses are counted only on `color` and `order` pot-to-pot trips that bloomed nothing wanted. Levels 1 and 2 have none, so a level-2 round never steps down on struggle and cannot register as a hint.

### Known gaps and person checks

- **The how-to is not true at every level (resolved 2026-10-15, slice 1).** Step 1 now reads `to: 1` and each level has its own finish line (L1 after six launches, L2 every flower, L3 all flowers of the asked color, L4+ the last numbered flower).
- **Two things change at once at level 3.** The rule changes (a color) and the reach drops from 76 to 30 (`wide` is only on at `spring` and `bloom`), so the move from 2 to 3 is both a new idea and a harder shot. A toddler or preschooler may need the wide reach to stay on through level 3, and level 2 may feel thin beside level 3 (it now counts blooms aloud, slice 1). A person check, not a bot check.
- **Same table every time.** Seeded flower spots change, but the hedges, flippers and pot never do, so round 20 looks like round 2.
- **Level 2 has no sign she did anything (resolved 2026-10-15, slice 1).** Level 2 now says the running count as each flower blooms, like levels 3–4.
- No school window: bands stop at pre-K by design (IDEAS ladder audit). This write-up proposes what a school window could hold, and leaves the call to the developer.
- Not established by any bot: whether a one-year-old's tap lands near the ladybug at all, whether the 1.2 s pot pause feels long or short, and whether two thumbs on the two halves of a landscape iPad are comfortable. See DEVICE-CHECKS if added.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [3D Pinball: Space Cadet](https://ryanmedeiros.substack.com/p/space-cadet-3d-pinball-the-making) | Classic PC table | Missions, such as Target Practice (hit eight bumpers), earn promotions from Ensign up; both the requirements and the rewards step up with rank. Many missions are "hit these targets or pass through here a set number of times" | The mission is the rule and the table stays the same, which is exactly how this ladder's modes work. Named missions with a clear target and a promotion-style step | Ball drain, scores, extra balls, the skewed pseudo-3D camera |
| [Pokémon Pinball: Ruby and Sapphire](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Pinball:_Ruby_%26_Sapphire/Part_1) | Handheld table with modes | A route repeated on the table triggers a mode: Catch 'Em (hit bumpers three times to uncover a silhouette, then hit the Pokémon three times), Egg, Evolution (collect three items), Travel (changes the area); separate bonus stages | The reveal-then-bump mode (a silhouette that fills in) is a good picture of "find the one asked for"; areas as a way to change the table's look and layout | Two-minute mode timers, the need to repeat routes to unlock modes |
| [Kirby's Pinball Land](https://kirby.fandom.com/wiki/Pinball_Land) | Game Boy table | Three tables, each of three stacked boards; reach the top for a warp star and a boss; a middle board holds a bonus mini-game; a life is lost only below the lowest board | Stacked boards as a natural way to add height; a bonus board as a short reward | Lives, bosses to defeat |
| [Peggle and Peggle Nights](https://en.wikipedia.org/wiki/Peggle_Nights) | Physics puzzle | Themed levels per Master, then levels where the player may pick; challenges (low-ball, specific shots); an "Aced" mark per level | Themed boards per character; a "special" flower the ball must reach; Bumper Garden's flowers already echo the orange pegs | Score chasing, ball counts, timing a shot for style bonuses |
| Pinball Kids, farm/soccer/space tables ([App Store](https://apps.apple.com/us/app/-/id6475088283)) | Preschool app | Three simplified themed tables | Themed tables are the common currency of kids' pinball; a table per theme beats a harder table | Not stated whether it drains: not something to copy either way |
| [Pinball Simple Addition](https://www.construct.net/en/free-online-games/pinball-simple-addition-1128/play?via=mn) (pre-K to grade 3) | Browser math | The ball's target is an addition fact; a wrong answer drains the ball | A number on the bumper that the ball adds up | Punishing a wrong sum by draining |
| Physical: a pinball activity table such as Little Tikes' My First Pinball (ages 1 and up) and marble runs | Toy | Ball, launcher and obstacles, no goal | The toy action first, a goal later: level 1 is already this | |
| Pachinko and Marble-run toys | Physical and arcade | Many small deflections to a score | Many gentle bumps as the unit of fun | Gambling-adjacent framing, scoring |

**Developmental sources.** Infants track a moving target in small jumps at first; smooth pursuit grows quickly from about 2 to 6 months and is near-adult in gain by 6 months, and ability to follow a target through an occlusion and predict its return keeps growing between 5 and 12 months. In one study of 1 to 18-month-olds, tracking time was longest for a larger stimulus (4.7° of visual angle) moving at a medium velocity (15°/s), and faster targets produced more jumps ([Rosander et al., Plymouth](https://researchportal.plymouth.ac.uk/en/publications/smooth-pursuit-development-in-infants-2/); [occlusion study, NTNU](https://ntnuopen.ntnu.no/ntnu-xmlui/handle/11250/2437184)). For a lap-age player this argues for a big, slow ladybug and a few big, well-spaced flowers. Smooth pursuit does not reach adult level until seven or eight years, so a school-age window cannot assume it. This is a design argument, not a claim that the table will be tracked well: the ball's speed on a real iPad needs a person to judge.

**Standards, for the number levels.** The Common Core kindergarten counting and operations strands ([K.CC](https://www.thecorestandards.org/Math/Content/K/CC/), [K.OA](https://www.thecorestandards.org/Math/Content/K/OA/)) include counting forward from a given number (K.CC.2), reading and writing numerals, and adding within 5 (K.OA.5) and finding the partner to make 10 (K.OA.4). Counting backward is a common preschool and kindergarten activity but is not itself a K.CC standard. Colors and patterns map to the early pattern work in Pattern Train.

## What makes sense here

The ladder already uses the pinball genre's best trick, a mission on the same table, and stays gentle by never draining. Growth should follow the same shape: **new missions on the same table and new tables for the same missions**, with no new pressure.

Fits the rules:

- **New missions in the pre-K window** that reuse `order`/`color` machinery: count on from a number, bloom a color pattern, bloom what is not this color, count back, then number sums. Each is a different thing to decide with the same flip.
- **A younger, slower opening** (a few huge flowers, a floaty ladybug) for lap, because level 1 is already the toy and the lap research argues for big and slow.
- **A touch-friendlier flip** between levels 1 and 2: one tap anywhere flips the flipper nearer the ladybug, so a toddler's first flip does not need to choose a side.
- **Tables**: a pond table (lily pads, ripples) and a hive table (hexagon flowers) that change the spots, the bumper art and the notes, so replays feel new without a new rule. Many kids' pinball apps work this way.
- **A school window** only with a rule that is worth a school child's time (make-ten sums). Pinball's missions-with-promotions are a model for an optional "Garden Gardener" rank page, but ranks are a score and would be a developer decision (not built here).

Does not fit: a drain, balls remaining, scores and multipliers, mode timers (Pokémon's two-minute modes), "tilt" and nudging, and any dexterity mode that needs a faster flip. A fast flipper level is a separate game, not a rung here.

The long-term arc: lap launches for fun; toddler flips; preschool and pre-K learn which flowers matter (a color, then a number, then a pattern); a school window adds sums and a tune.

## Experience and presentation

- **First unsupported action.** At lap and toddler, the first tap launches the ladybug with no instruction: `bumper.spring` plays once and repeats after 8 idle seconds. At level 2 the toddler's first act is a flip, a tap on a half of the screen. A good test: does the very first tap land while the ball is falling, with nobody pointing?
- **What makes it pleasurable.** A whoosh on launch, a bell pitched by the flower's height on every bump, a star burst when a flower blooms, a squish in the pot, and a finale that blooms the rest with rising bells. Touch-down feedback is the flipper button shrinking to 0.85 and returning in 0.2 s plus a tick.
- **What varies on replay.** Seeded flower spots, flower colors and the launch angle. Three seeded table layouts and skins (see Fresh content) so a given level is not one picture.
- **Reasoning, reading, memory, motor.** Levels 1–2 are purely motor and tracking. Levels 3–6 and 9 add colors and number words; the pet says the number and each flower shows a numeral, so a child who cannot read still hears "Find 2". Nothing needs memory: the next number is said again. The motor load (a narrow reach, ±40 of sideways chance) is the same at levels 3–6 and 9 as a pre-K child's hands, and the observation that the hardest part is the shot, not the numbers, is a person check.
- **Supported ending and replay.** Every round ends with the flowers blooming and a sticker, helped or not: two wasted trips light the wanted flowers and aim the next launch, so the round can always finish. Level 1 ends after six launches with no failure. Nothing times out; she can stop at any point.
- **Co-play and roles.** Couch already gives each player a flipper. On touch, a grown-up and child can each take one half of the screen; a co-play tip ("one of you is the left flipper, one the right") needs no code. Solo remains the default.
- **A concrete art/feel example.** Draw a small glowing ring at the tip of the flipper nearer the ladybug when it is within reach and falling, in a code-drawn `Graphics` circle that pulses; it teaches "now" without words. A hedge flipper with a leaf shape and a little squash-and-stretch on the ladybug at the kick uses only `Graphics` and the existing tween. A ladybug that ends each round sleeping in the pot gives a quiet stop.
- **Questions a person or device must answer.** Can a one-year-old ever land a tap on the ladybug at all, or does it only work by chance? Is the pot's 1.2 s auto-relaunch calm or rushed? Is the wide reach too wide (flips that "cheat")? Do two thumbs on the halves of a landscape iPad feel natural, and does palm rejection hold? Does the slow, large ladybug of the proposed level 13 hold a lap child's eyes? Real hardware and a child, not Chrome automation.

## Proposed ladder

### Fresh content inside existing levels

- **Three tables (built 2026-10-15).** The existing garden is the *Meadow*, with a *Pond* (flowers drawn as lily pads, ripples on a bump, a frog-croak bell timbre) and a *Hive* (hex flowers, wooden notes). `TABLE_SPOTS` defines the Meadow arch, Pond columns and Hive ring; the plan stays the same. Every layout passes reachability and no-trap tests at simulation and game steps. The table is picked by seeded `ctx.rng`; `describeLevel` stays the plan's name.
- **Flipper-ready ring (built 2026-10-15, [PR #406](https://github.com/rjdunlap/neo/pull/406))** on the nearer flipper (art example above), for levels 2–6 and 9 (extended with slice 4). It shows only while the falling ladybug is within actual kick reach; it changes no physics and counts no hint.
- **A count in bloom mode (built 2026-10-15).** Level 2 says the count as each flower blooms (`count`, like levels 3–4), so the toddler hears that each bloom adds one. Costs one `ctx.say` and no rules change.
- **Level 3 asked color from more than three colors.** `FLOWER_COLORS` has four; the asked color is already a seeded pick. Allow two asked colors across a round's two goals only in a new level (below), not in 3.
- **Wide reach through level 3.** A decision for a person check: keep `wide` for `color` mode so the rule and the reach do not both change at once.
- **Truthful how-to (built 2026-10-15)** (a doc/code fix, no rules): step 1 `to: 1`, finish lines per level.

### New levels on top

Levels 6 and 9 are built; all other rows below remain proposals. Appended IDs; none renumbers. Bands for the unbuilt rows are proposed windows; each level's windows go in `LEVELS`' `order` per band so adaptation steps one at a time. Mistakes follow the existing rule: a pot-to-pot trip that did nothing wanted is a gentle miss, two in a row light the wanted flowers and aim the next launch, and a flower bumped out of turn just chimes.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Count on (built, PR #408) | K | A seeded start at 2–6 with three or four consecutive flowers, plus plain decoys | Which number comes next, starting anywhere | As level 4; hint glows the next number | Numbers are consecutive from the start; the start is in 2–6; the sequence fits inside the table's flowers; every number has a flower with a free spot | Built. Reuses `order`, seeded `start`/length, `bumper.start` and the level-scoped how-to; no journal/couch mapping change |
| 7 | Pattern bloom | K | "Yellow, pink, yellow, pink." A strip at the top shows the pattern (AB, later ABB, ABC); flowers of those colors | The next color in the pattern | A wrong color just chimes; two wasted trips glow the next color and aim a launch | The sequence is a valid repeating unit shown at least twice; every needed color has enough flowers for the whole run; colors are distinguishable (not red and pink beside each other for color-blind players; add a shape mark) | M. A strip drawn in `Graphics` like Pattern Train; the pet says the pattern; bot and couch map to the same `wanted` function |
| 8 | Not this color | K | "Bloom the flowers that are not yellow!" The yellow ones turn grey and sleepy | A negation: everything except | Bumping a sleepy flower is a chime, not a miss; the usual two-trip hint | At least two flowers are wanted; the asked color is the one with the fewest; a sleepy flower is never wanted | S. A `not` flag on `color` plans; grey draw state; a voice line |
| 9 | Count back (built, PR #408) | K | A seeded start at 5–8, then every number down to 1 (Bubble Pop 13 already counts back) | Which number comes next, going down | As level 4; "Now 4!" | The sequence descends from the start; a flower exists for each; the start is seeded from 5–8 and the sequence ends at 1 | Built. `order` reversed with `bumper.back`; reuses `bumper.next` |
| 10 | Make five | K | A strip shows five empty dots. Flowers carry 1–4 dots. Bumping one fills that many dots | Which flowers add to five | A flower with more dots than the gap goes "sleepy" and does nothing; if no awake flower fits, a new bunch grows so she is never stuck | From every reachable state the gap can be filled (or a refill happens); an overshoot is impossible; a flower value is within 1–4 and the gap is 5 | M. New rule state, dot art, pet says "three and two make five!"; K.OA.5 |
| 11 | Make ten | S (decision) | Ten empty dots, flowers carrying 1–9 | The partner that makes ten (K.OA.4) | As 10 | As 10, with values 1–9 and the gap 10; at least two ways to make ten | M. Needs a school window decision |
| 12 | Garden tune | K, S (decision) | A short tune of three to five notes shown as colored dots; flowers sing the notes | The next note of the tune; she hears it as she goes | Wrong note: the flower plays its own pitch, no miss; hint glows the next flower | Each tune note has a flower; no two flowers share a note; tune is a pentatonic phrase | M. The game becomes one where she makes music, so `music: silenced(STYLES.x)` and the registry's silenced list; may reuse Sing-Along Barn tunes; decision below |

Proposed future windows: pre-K becomes 3–10 (4–10 for adaptation purposes might be enough once 6–9 are tuned), school 6–12 if the developer opens it. Preschool stays 2–4. Ordering by `order` within the pre-K window, easiest first: 3, 4, 6, 7, 8, 5, 9, 10.

### Younger-band openings

| Level | Name | Band | First round | What she decides | Mistakes and hints | A rule test asserts | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Floaty garden | L, T | Three huge flowers (at least 100 units across on screen), gravity 60 % and launch speed 70 %; the ladybug is larger and slow | Nothing: tap to launch, watch the ladybug drift and ring bells | No misses; one sticker after four launches | Every large flower is reachable by some launch; the ball always returns to the pot; flower size on screen is at least 100 units (physical target); the flight time is at least twice level 1's | S. Plan parameters (gravity, speed, flower radius); new voice line; lap and toddler ranges |

### Easier entries and levels between existing ones

- **13 Floaty garden** is appended and placed first for lap (`order: [13, 1]`) and toddler (`[13, 1, 14, 2]`). `entryLevels: [13]` lets a newly one-year-old land on it; levels 1 and 2 are not renumbered.
- **14 Anywhere flip** (T, P): the level 2 rule, but a tap anywhere flips whichever flipper is nearer the ladybug, with the wide reach and no side to pick. First round: the same as level 2. It sits between 1 and 2 in the toddler `order`, and is a stepping stone for a child who has had trouble with the halves. Rule test: with the ladybug on either side of the table a tap anywhere always chooses the nearer flipper; the flip reaches whenever a left or right tap would. Cost S. Add `14` to the toddler's `entryLevels` only if a one-year-old can land on it from the lap band; a device check first.
- Remaining decisions: the school window (below), whether the tune level silences the island's loop, and whether hint accounting matches the other games.

### Left out on purpose

- A drain, extra balls, scores, multipliers, mode timers, tilt, a fast-flip mode, boss stages and "ranks" as a score.
- A separate pinball game. Pinball with flippers and bumpers on the same engine is already in IDEAS ("Pond Pinball and Brick Breaker") and extends this game; a grown-up pinball table is a different session.
- A Pokémon-style "route to trigger a mode": modes are levels she picks up by playing, not by repeating a route.
- Random "mystery" flowers that change the rule mid-round.

## Decisions for the developer

1. **A school window.** Bumper Garden ends at pre-K by design. Open school with levels 11 and 12 (make ten, a tune), or leave it? Recommend leaving school unopened until levels 6–10 are tuned, then deciding.
2. **Lap Floaty garden (13).** Lap's tap-and-watch is already level 1; a slower, bigger table is only worth it if a one-year-old can follow the ball (a device check). Recommend yes, appended, ready for observation.
3. **Garden tune (12) as music.** It makes the game a music-making game: silence the island loop and add it to the registry's silenced list, or leave music off the ladder.
4. **Wide reach through level 3.** A balance change to an existing level.
5. **Hint accounting.** Whether the two-trip hint should count as a hint on level 8's "not" levels, where a sleepy-flower bump is not a miss.

Add each to [Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) when the roadmap chunk is next edited.

## Build slices, in order

1. **Truthful how-to and a count in bloom mode (built 2026-10-15, [PR #355](https://github.com/rjdunlap/neo/pull/355)).** Step 1 is `to: 1`, the finish line is per level, and level 2 says the count as each flower blooms (`ctx.say('count')`). Checked by typecheck and vitest; browser play of level 2 not run (see [VERIFICATION](../VERIFICATION.md)).
2. **Flipper-ready ring (built 2026-10-15, [PR #406](https://github.com/rjdunlap/neo/pull/406)).** A noninteractive pulsing ring on the nearer flipper at levels 2–5, only while flying, falling and within actual kick reach. Physics, scoring, hints and RNG unchanged; how-to note scoped to 2–5. Typecheck, 24 focused tests, build, level-2 cue/input/completion regression and portrait review passed ([verification](../archive/VERIFICATION-2026-10-15.md#2026-10-15--bumper-garden-flipper-ready-ring)); ghost finger not rerun (bot unchanged).
3. **Tables: layouts and skins for Pond and Hive (built 2026-10-15, [PR #410](https://github.com/rjdunlap/neo/pull/410)).** Seeded Meadow arch, Pond columns and Hive ring, lily pads/ripples/croak-bells and hex flowers/wooden notes. Plans and accounting unchanged. Typecheck, 16 rules, both filtered level-5 plays and portraits passed; see [verification](../VERIFICATION.md#2026-10-15--bumper-garden-pond-and-hive-tables).
4. **Count on and Count back, levels 6 and 9 (built 2026-10-15, [PR #408](https://github.com/rjdunlap/neo/pull/408)).** Seeded starts/sequence lengths, highlighted number strips and spoken starts reuse the order rules. Pre-K order is `[3, 4, 6, 5, 9]`; IDs 7/8 remain unbuilt. Existing IDs/pins, other bands, physics/scoring and couch trip levels 3/4 are preserved (catalog reviewed). Typecheck, 41 focused tests, build, filtered play of both levels, landscape/portrait review and clean 12.8/21.2 s ghost fingers passed ([verification](../archive/VERIFICATION-2026-10-15.md#2026-10-15--bumper-garden-count-on-and-count-back)).
5. **Not this color, level 8.** Check as slice 4.
6. **Pattern bloom, level 7.** Pattern strip, color-blind-safe marks. Check: rule tests, one play, one portrait screenshot.
7. **Make five, level 10.** New rule state and dot art. Check: rule tests, a play, `fingerdemo`.
8. **Floaty garden (13) and Anywhere flip (14), with `order` and `entryLevels`.** Rule tests that a birthday lands on the entry and that adaptation steps along `order`. Check: rule tests and one play each (after the lap decision).
9. **Make ten and a school window; Garden tune (12).** Only after the decisions. Check: as a new interaction.

Closing each slice also updates the README row, GAMES.md, the how-to card (level-scoped), the couch catalog `level` mapping if the pre-K range moves, and the roadmap.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Only documents changed; links and `git diff --check` ran.
