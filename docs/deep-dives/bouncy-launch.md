# Bouncy Launch deep dive

*ID `bouncy-launch` · bands lap, toddler, preschool, pre-K, school · levels 1–6 on 2026-10-13 · session `claude/bouncy-launch-deep-dive` ([PR #265](https://github.com/rjdunlap/neo/pull/265))*

Research and ideation only: nothing under `src/`, `scripts/` or `public/` changed, and no test or browser suite ran. The numbers below were worked out by hand from `logic.ts` and `index.ts` (no script was run).

## The game today

She pulls the pet back on a big spring and lets go; the pet flies in an arc and lands softly on a strip of five clouds, then hops back onto the spring. The learning purpose is cause and effect with a measured quantity: a bigger pull goes farther. The ladder then turns the same pull into a target (the star cloud, a numbered cloud), a comparison with her last landing, and a prediction. Region `tinker-lab` (Tinker Lab in `lands.ts`, with Sink or Float, Robot Path, Seesaw Balance, Light Lab, Ramp Race and others); `skills`: cause-and-effect, measurement, numbers; music `STYLES.bubbles`; the pet leaves the corner and does the flying.

| Level | Plan (`mode`) | Shots | Bands whose window includes it | What she does |
| --- | --- | --- | --- | --- |
| 1 | `tap` | 5 | lap, toddler | Tap the pet; it boings by a random pull (0.15–0.95 of the strip, so sometimes onto grass between clouds). No judgement |
| 2 | `free` | 4 | toddler, preschool | Pull back and let go. The landing preview (a dotted arc and a ring on the strip) is on from the first pull. No target, no wrong answer; a bigger pull goes farther |
| 3 | `star` | 3 | toddler, preschool, pre-K | A star hangs over a seeded cloud; land on it. Short or long is a miss said aloud; two misses on a shot turn the preview on (one hint) with a yellow ring for the right pull |
| 4 | `number` | 3 | preschool, pre-K, school | The same with the clouds numbered 1–5 and "Land on {n}!" |
| 5 | `compare` | 4 (+1 free opener) | pre-K, school | After the opener, "Now go farther!" or "not so far" against a red flag where the last landing was; a step of 0.04 of the strip counts |
| 6 | `predict` | 4 | school | The pet is already pulled back by a fixed, shown pull; she taps the cloud she thinks it will reach (a ring marks it), then it flies. Unscored: a different guess is never a miss |

`LEVELS`: lap 1–1, toddler 1–3, preschool 2–4, pre-K 3–5, school 4–6.

**The physics, exactly.** One dimension. `reach(pull)` is linear from `MIN_PULL` 30 to `MAX_PULL` 170 (its comment says "gentle at first", but the code is linear: a stale comment). The pet lands exactly where the pull says; there is no noise, so one pull always lands on the same spot and `pullFor(padAt(i))` lands dead centre on cloud i (44, 72, 100, 128, 156 logical units of pull). Flight height and time grow with distance (`140 + 260 f` units high, `0.7 + 0.6 f` seconds). Pulls are clamped to back-and-down of the seat. A pull under 30 springs back with no sound or words.

**What a round draws from.** Five clouds on one strip (never more, never fewer); `targets()` draws each shot's cloud from a seeded RNG, never the same twice running; one backdrop (sky 0x8fd3f7→0xe9f7ff, seed 88); one pet (the saved companion); one landing look (`puffs` clouds). Nothing else varies.

**What the rules count.** Levels 1, 2 and 6 cannot record a miss (`judge` returns `yes` for `tap`, `free` and `predict`), and the preview is on from the start at level 2, so they report `misses 0, hints 0`. Levels 3–5 count a miss for any wrong landing and a hint when the preview turns on after two misses on a shot. `score` is the summed distance from cloud centres (star and number levels only).

**Couplings.** Ghost finger (`touchDemo`, `autotouch()`): taps the pet at level 1, taps the right cloud at 6, otherwise puts a finger on the pet and pulls by `pullToTake`. Couch: a `control()` squash-down spring (power by holding down) and an `autoplay()` bot; the catalog entry plays level 3 for every stop (`level: () => 3`); and the **Cloud Hopper** challenge course (`course.ts`, `src/couch/courses.ts`, level 3, version 1) runs twelve small clouds (`padWidth` 0.5) scored by launches. Journal: one entry, `bigger-pull`, filed after two plainly different pulls (`revealsPullRule`, gap 0.15 of the strip). Voice: `launch.*` lines. Picnic: none. Creations: none. Tests: `logic.test.ts` (five properties), `course.test.ts`.

### Known gaps

Read from the code; none seen on a device.

1. **Levels 1, 2 and 6 can never record a miss.** Two smooth rounds step up, so a toddler goes 1→2→3 after four rounds on no evidence. This is by design for explore-first play (the rules allow it), but at level 6 it also means school gets no adaptive signal and only unscored taps. See decision 5.
2. **A pull the wrong way gets no feedback.** `pull()` clamps to back-and-down and a pull under 30 units just springs back, silently. A toddler dragging toward the clouds, or tapping and holding, sees and hears nothing. This is the likeliest failure at levels 2–3 and needs a person (check list below).
3. **Star and number levels are mostly a motor test.** A cloud is `0.85 / 5 = 0.17` of the strip, so the accepted window is ±0.085 of the strip, about **±12 logical units of finger travel (a window of about 24 units) on a 140-unit pull**, before any hint. That sits inside the toddler window (level 3) and gets no finger-friendly help beyond the post-miss preview. Cognitively the level is easy (one star); the precision is the difficulty. Cloud Hopper tightens it to ±7 units (`padWidth` 0.5).
4. **The predict level gives her nothing to judge the pull against.** The shown pull always lands dead centre on a cloud, the spring has no marks, and nothing from earlier shots stays on screen except memory (compare, in contrast, plants a flag). The voice says "cloud {n}" (`launch.predicted`, `launch.revealed`) but **the clouds are only numbered at level 4**, so level 6 uses a number she cannot see.
5. **The "bigger pull goes farther" rule is shown only once, by the journal.** Nothing in a round, after the first launch, lets her see two pulls side by side (a trail, two flags, a footprint). The effect lasts as long as the pet is in the air.
6. **A comment contradicts the code**: `reach()` says "Gentle at first, so small pulls are easy to control" and returns the linear fraction.
7. **`observedPulls` also collects shown pulls at level 6 and the course's launches.** Does a course round's `discoveries` reach the child's journal? From a search of `src/` only `GameScene` calls `store.discover`, and the couch scenes never do, so the answer looks like no, but a build session should confirm it with a test; the same question applies to level 6's shown pulls, which would file the journal entry for a rule she only watched (`revealsPullRule` accepts any two landings that differ by 0.15). That case is a design question as much as a bug (a watched pull is evidence, like Sink or Float's tested things).
8. **Level 6's checks never finished.** The 2026-10-10 verification entry records `BROWSER_SUITE=arcade ARCADE_ONLY=launch` and `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch FINGER_LEVELS=6` as "not run to completion" (the runner ended the browser early). Level 6 has no recorded passing browser play. Treat it as open.
9. **A pet that lands on the grass between two clouds (level 1) is silent about it.** No harm at lap; just noting that the 5-tap round has no variety guarantee (random pulls can bunch).
10. **Landings carry no sound that depends on distance.** `sfx.boing()` and `sfx.pop(4)` are fixed, so distance is seen only.
11. **The word "Kass Basher" in GAMES.md is a loose reference.** From the search summaries below the Neopets game is a *timed swing* with wind (no pull); the pull-back is closer to Splat-a-Stamp and Toss the Turtle's cannon. The GAMES entry can be corrected when a slice next touches it.

### Person checks (not established by any bot)

- Does a one-year-old tap the pet (level 1) and does she stay for five taps? Is the pet's hit area (a 190-unit-radius circle at 0.5 scale) comfortable at her height?
- Does a two-year-old pull *back* from the clouds, or drag toward them? What does she do after a silent spring-back?
- Can a three- or four-year-old land a ±12-unit window at level 3 on an iPad without the hint ring? (A pre-K child at level 5?)
- Is the arc speed at far shots (1.3 s) a pleasant wait or a long one; does repeating "Wheee!" wear?
- Does a school-age child reason from the shown pull at level 6, or guess?
- iPad speech for "Land on {n}!", "farther", "nearer", "cloud {n}".

## Similar games

**Opened** means I read the page; **search summary only** means I saw only the search result's summary, not the page. Reference is inspiration, not a design.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Kass Basher* / Whack-A-Kass (Neopets; remake of *Pingu Throw*; [MobyGames](https://www.mobygames.com/game/68129/whack-a-kass/) and a [guide](https://pinkpt.com/whackakass_sub1.htm), **search summary only**) | browser distance game, ages unspecified | One timed swing at a falling plush, helped or hurt by wind; glide or fold in the air; clicking on landing bounces farther; better weapons (stick, bat) unlock at score thresholds | The pure joy of seeing how far; a goofy tumbling flight; a bounce on landing | The swing timing and wind (a reflex test), the score-gated weapons, a villain who is bashed |
| *Toss the Turtle* (Kongregate, 2009; [TV Tropes](https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/TossTheTurtle) and [GamesBeat](https://gamesbeat.com/toss-the-turtle-violent-depictions-of-the-2-d-physics/), **search summary only**; the summaries were low quality) | physics launcher | Launch, earn money by distance, buy upgrades (rockets, jetpacks, armor), launch again | The "learn from last time" loop and the visible distance count | The currency, upgrade treadmill and the harm to a turtle |
| *Yetisports* / *Pingu Throw* ([Giant Bomb](https://giantbomb.com/wiki/Franchises/Yetisports), **search summary only**) | arcade distance series | Timed angle, bounces, an air-rotation add-on; Deluxe adds limited attempts and a rising minimum distance | A separate "in the air" skill that is optional | Limited attempts and a rising minimum (a lose condition) |
| *Angry Birds Space* (Rovio; [review](https://computerwoche.de/a/angry-birds-space-review-an-amazingly-fun-innovative-take-on-the-familiar-game,2511007), **search summary only**) | slingshot puzzle | A dotted arc previews the first part of the flight while you pull back; later worlds change the physics (gravity wells) so the same pull behaves differently | The pull-back preview as a *support* (the island already shows one after two misses); changing one rule of the world as a deliberate new level | Destruction goals, star scoring tiers, birds as a limited stock |
| PhET *Projectile Motion* ([University of Colorado; summaries of worksheets](https://ptsai.physics.ucsd.edu/Phys1_Sim_1A_ProjectileMotion.html), **search summary only**) | high-school simulation | Change angle, speed, height; drag the target to where you think it will land; fire; one variable at a time | **Place the target first, then fire** (prediction before action) and *one variable at a time* | Angles, speeds, equations, air resistance; the simulation is high-school physics |
| Science World, [Catapults](https://www.scienceworld.ca/resource/catapults/) (**opened**) | preschool/kindergarten classroom activity | Launch pompoms at chalk or tape target zones with a lever catapult; push gently for short, hard for far; extend with the fulcrum position as a second variable the child moves himself | **Target zones** instead of a point, a gentle push is short, a hard push is far, and a second variable (the pivot) only after the first | The classroom's teacher-led framing |
| NGSS [K-PS2-1](https://www2.cde.ca.gov/cacs/id/web/28972) (**opened**; California listing) | kindergarten science standard | "Plan and conduct an investigation to compare the effects of different strengths or different directions of pushes and pulls on the motion of an object." Assessment is limited to strength *or* direction, not both | The standard's own frame: compare *two strengths* of pull and see the effect; one variable at a time | Direction (angle) as a second variable in the same round |
| Number-line estimation (Siegler and Opfer 2003; Booth and Siegler 2006; [a summary of the findings](https://psychologicabelgica.com/articles/276), **search summary only**, a secondary source) | developmental research | Young children place numbers on a line as if the line were logarithmic (small numbers spread, large ones squashed), and move toward linear placement with age and with feedback; the pattern depends on the range (0–100 for kindergarten) and some work finds no clear trend between 5 and 8 | A numbered strip *is* a number line; **estimation with feedback** is the practice the research points to | Any claim that this game "fixes" estimation; I did not open the papers, so treat the effect sizes as unverified |
| Common Core [2.MD.B.6](https://teachstarter.com/us/common-core-standards-in-america/ccss-math-content-2-md-b-6) (**search summary only**) | grade-2 math standard | Whole numbers as lengths from 0 on a number line with equally spaced points; sums and differences on the line | A flagged landing as a point on the line; "two farther than the flag" as a difference | Standards as a reason to add reading or writing |
| Pull-back and rubber-band launcher activities ([a parent's account](https://www.sites.google.com/a/crestmem.edu/science-fair/2015-2016-projects/rubber-band) and a [UK forces worksheet](https://www.whizzpopbang.com/teaching-resources/522696/forces-let-it-go), **search summary only**) | physical play and classroom | Pull a car back a little or a lot, **predict** where it stops, mark a ruler on the launcher showing how far it was pulled | A scale on the spring; predict before releasing; keep it to a few pulls | Snapping bands, measuring tables for the youngest |
| QBasic *Gorillas* and the notebook's **Toss Across** ([IDEAS](../IDEAS.md), the Toss Across row, **recalled**, not re-read) | artillery duel | Set angle and power, watch the last arc stay on screen, adjust; the learning is iterative estimation | **The last arc stays on screen**; feed a friend instead of hitting one | The duel, the explosion, two numerals typed in |
| Peg Garden, Ramp Race, Sink or Float, Frog Hop (this catalog) | same island | Aimed bounces; fair tests with two variables; unscored predictions; counted hops on numerals | Their prediction and fair-test patterns; Ramp Race's stated rule | Do not repeat them: Frog Hop already owns *counted* hops, Ramp Race already owns *height × floor* |

**Developmental notes.** No source I found tests pull-back toys with toddlers; the claim that a visible, immediate pull→motion link supports early cause and effect rests on a consumer article and common practice, so treat it as plausible rather than established. The K-PS2-1 text and the Science World page are the opened, primary sources for the K-level framing.

## What makes sense here

**What fits the rules.** Soft landings, no lives or timers, an unscored prediction (the Sink or Float pattern), and one variable at a time. The ladder already follows K-PS2-1 from "different strengths of pull" through "compare to last time" to "predict". What it lacks is a way to *see and keep* the effect, targets whose difficulty is not mostly finger precision, easier entries for the youngest, and a school arc past one prediction.

**The long-term arc.**

1. **Lap and toddler: it responds.** Tap or pull; the pet flies; every launch makes a bright, pitched sound. No decision beyond "how much".
2. **Preschool and pre-K: a bigger pull goes farther, and I can aim.** Near or far, the star, the number; then "farther than last time".
3. **School (6–8): predict, estimate and compare.** Use the cloud strip as a *number line* (a numbered strip, 2.MD.B.6), estimate from earlier flights (interpolate), feed a friend whose place is not a cloud (continuous target, learn from the last shot), then choose between springs (a second, deliberate variable).
4. **8–12 horizon (not built).** Controlled trials with a picture chart ("no claim that arcade physics models everything", [IDEAS](../IDEAS.md#extend-existing-games-before-making-duplicates)); a pull chart that records pull mark against landing; Block Topple as a launch mode. Left as horizons.

**Ideas that do not fit, and why.** Angle as a variable (K-PS2-1's boundary is one variable at a time, and the island's flight arc is not a physical projectile); wind; a moving target (timing); a limited number of launches (a lose condition); upgrades or coins (purchases); high scores shown as a rank. Bounce counts (extra bounces on landing) mix a second variable into the first rule.

## Experience and presentation

**The first unsupported action.** At level 1 she taps the pet and it flies, so a one-year-old can do it. At level 2, the first pull is an unguided drag: today a wrong-way or too-short drag does nothing (gap 2), so the first action has no reply. A reply to every touch is what the lap and toddler bands need: the pet wobbles and the spring squeaks as soon as she touches it, and a drag the wrong way gets a gentle "pull back this way" arrow (a pulsing chevron pointing back-and-down) after two silent tries, not a miss.

**What makes it pleasurable.** The squeeze of the spring and the release. Today the pull has a single squeak at the start and no sound while stretching. The cheap, code-drawn upgrade: **a tick for every notch**, five notches on the spring at the pulls that land on each cloud (44, 72, 100, 128 and 156 units), each tick a pentatonic step from `src/audio/notes.ts` rising with the pull, and the **landing note of the cloud she lands on is the same step** (cloud i rings step i). Distance becomes audible (a bigger pull is a higher note) and a level-1 round of five taps becomes a little rising-and-falling tune. This also helps the "bigger pull goes farther" rule be noticed rather than only read. Art example using existing tools: draw the five notches as small white pegs on a faint arc around the seat (`Graphics`, the same yellow as the hint ring), brightening as the pull passes each; and leave a **footprint puff** (`puffs`, a soft white-to-blue cloud) on the strip where each landing was, so a level-2 round ends with four puffs that read as "my four pulls".

**Consequence and return to readiness.** The pet hops back onto the spring (0.7 s, `ease.outBack`). Misses do not break the flow. The preview arc is the existing explanation; keep it, and add the last flight as a faint dotted arc that fades (the Gorillas lesson, gap 5).

**Variety on replay without changing the rule.** Backdrop sets chosen by round seed (sunny, sunset, starry night with a moon, a rainbow day: the `Backdrop` parameters already exist, only the palette and the sun/moon change); one tap-level round that visits all five clouds once in a seeded order instead of five independent randoms; star and numeral positions already vary.

**Reasoning versus precision.** Today levels 3–4 are mainly precision (gap 3). Separate them: the decision (which cloud, how much farther) should be teachable without a ±12-unit finger. Two ways, both support rather than lowering the bar: the five **notches** make the right pull a place to aim at (a feel, not a snap), and for the youngest a near-or-far level with two huge clouds (below) tests the idea at ±28 units. For estimation levels the answer is a *tap*, not a pull, so number sense is never graded on motor skill.

**Supported ending and replay.** Every shot ends in a soft landing and the round finishes after its shots. After two misses the preview comes on; add a second tier after four (the ring becomes a magnet that clicks the pull into the notch, counted as a hint). "Again" uses the existing celebration button.

**Roles.** Co-play: one person *calls* the cloud ("the star one!", "farther!") and the other pulls (`coplayHint` already suggests saying "pull... and let go" together). In the couch route the spring is a shared turn-taking game; leave it. Nothing here needs two touches.

**Needs a person or device:** all of the checks listed above; the comfort of a notch tick under a small finger; whether the rising notes read as "more pull" or as noise next to `STYLES.bubbles`.

## Proposed ladder

Appended IDs 7–11; no saved level or pin moves. Strip and cloud counts, widths and a spring factor must be **carried per plan**: `PADS`, `padAt`, `padHit` and `reach` are shared with the Cloud Hopper course (`course.ts`, `courses.ts`, version 1), so a change to their defaults changes records and forces a `version` bump. A build slice should add optional parameters with the current values as defaults and a regression test that pins the course's constants and a few landings.

### Fresh content inside existing levels

- **Pull notches and rising notes** (all pull levels): five notches on the spring; a tick as each is crossed; the landing note of cloud i. Tests: the notch pulls equal `pullFor(padAt(i))` and each lands on its cloud (`padHit(reach(...)) === i`); the note step is a deterministic function of the cloud.
- **A wrong-way and too-short answer** (levels 2–6): a squeak and wobble on touch; after two silent tries the pulsing back-and-down chevron and a new line "Pull {pet} back, this way!"; a pull under 30 gets "A bit more!" Not a miss, not a hint.
- **Footprint puffs and a fading last arc** (levels 2, 3–4, 5, 6): puffs where each landing was; at 5 the red flag stays; at 6 each earlier flight keeps its flag with its numeral so the next shown pull can be judged against them (gap 4).
- **Numerals on the level 6 clouds** (a small fix): the voice already says "cloud {n}".
- **A seeded cloud bag at level 1**: the five taps visit the five clouds once each in a seeded order, so a lap round plays a scale. Test: five taps → five distinct pads.
- **Sky variety**: four seeded skies, same rules. Cost: palette entries only.
- **A repeated pull lands in the same place** (level 2, a journal entry candidate): after she repeats a pull within 0.03 of the strip, file "same pull, same place" (like `bigger-pull`, with its spoken line). Needs the journal test that checks voice lines against the game's data.

### New levels on top

Positions in the windows follow in "Easier entries"; "Band window" below is where each falls in the proposed orders.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Near or far** (entry) | lap?, toddler, preschool | Two big clouds, a near one and a far one, with a star over one: "Land on the far cloud!" Five shots, seeded, never the same twice | How much to pull: a little or a lot (two coarse choices) | Wrong one is "short" or "long" aloud; each cloud's window is ±0.2 of the strip (about ±28 pull units); two misses turn the preview on | Both clouds reachable inside the leash; windows do not overlap or leave a gap smaller than a finger; targets alternate by seed; the ghost-finger pull lands on each | Per-plan strip (`pads: 2`), voice `launch.near-far`, how-to line, bot; no couch change |
| 8 | **Feed the friend** | pre-K, school | A friend (Bunny, Duck) stands on the grass at any point along the strip, not on a cloud: "Bring {friend} a snack!" The previous flight stays as a dotted arc and a puff | How much to pull, using the last shot (learning from a miss, as in Gorillas); iterative estimation | A miss says "a little farther" or "a little less" and the arc stays; two misses show the preview; the friend eats whatever lands near enough (a window of ±0.09 of the strip, as wide as a cloud) | Friend positions seeded in 0.12–0.92 of the strip, at least 0.2 apart in a round; every position reachable in the leash; **one correction from the last miss lands inside the window** (linear map, determinism); the bot's pull lands | Friend art (`critter.ts`), "snack" prop in `props.ts`, voice `launch.feed*`, bot, a how-to line, journal candidate "each shot teaches the next" |
| 9 | **Between two flights** | school | Two shown pulls fly (a short one and a long one) and each leaves a flag with its numeral; a third shown pull is between them: "Which cloud will this one reach?" Three rounds of this | Interpolate: a pull between two known pulls reaches a cloud between their clouds | **Unscored.** Her pick gets a ring; the flight proves it; a different guess is explained ("this pull is in the middle, so a middle cloud") | Middle cloud strictly between the two flags and different from both (gap of at least 2 in a triple); seeded; shown pulls come from `pullFor(padAt(i))`; the bot taps the middle cloud | Numerals on pads (shared with the level 6 fix), flags (compare's), voice, bot; no couch change |
| 10 | **Where on the line?** | school | A numbered strip of ten ticks, 1–10. A pull is shown; she taps the number where she thinks it will land, then it flies and a marker shows the gap ("you said 6; it landed on 7") | Estimate a position on a number line from a pull; feedback shows the distance | **Unscored.** The tap, not the pull, is the answer; no motor demand | Shown pulls land on the tick centres of a 10-tick strip (own `padAt`); consecutive answers differ by at least 2; at least one in each third; the bot taps the right tick | A second strip (10 ticks) per plan; big numerals (at least 100-unit tap targets: ten ticks across 560 units is only 56 units wide, so the ticks are **display marks and the tap is the nearest-tick routing** over a full-width target, as Bubble Pop does); voice; bot |
| 11 | **Pick a spring** | school | Three springs (soft, medium, stiff). "Pull the same amount: which spring goes farthest?" (predict, then watch) in round 1; "Land on the star: pick the spring, then pull" in round 2, one variable at a time | The spring changes the effect of a pull; first predict, then use it | Round 1 unscored; round 2 a normal miss with a hint that glows the right spring (not the pull) | `reach(pull, spring)` is strictly increasing in both; stiffest at full pull reaches at most the last cloud; for every star there is a spring whose pull is in the leash; the default spring factor leaves levels 1–6 and Cloud Hopper unchanged | New art (three springs by color and coil), `reach` gains an optional factor, voice, bot, how-to; **needs decision 3** |

### Younger-band openings

Lap currently has level 1 (tap): five taps are a complete experience. **Option (decision 2):** let lap also play level 2, the pull, with the notches and the wrong-way help, since a one-year-old can drag and every pull is right. Without the wrong-way reply (gap 2) this would be a silent toy; with it, it is a response to every touch. It adds `lap: { min: 1, max: 2 }` and makes the game's level 2 appear for her own band today. Toddler needs nothing new except the easier entry below.

### Easier entries and levels between existing ones

Append 7 (near or far) and place it with the built `order`; declare it in `entryLevels` as an easy entry so a birthday into a band that does not list it lands on that band's easiest level. The shared `registry.test.ts` checks that every entry is first in some band. Proposed windows, in step order (the exact API is in `src/progress/difficulty.ts`; copy the Owl Walk, Block Tower or Opposites windows rather than re-deriving):

| Band | Order | min–max |
| --- | --- | --- |
| lap | `[1]` (or `[1, 2]` after decision 2) | 1–1 (or 1–2) |
| toddler | `[1, 2, 7, 3]` | 1–7 |
| preschool | `[2, 7, 3, 4]` | 2–7 |
| pre-K | `[3, 4, 8, 5]` | 3–8 |
| school | `[4, 5, 8, 6, 9, 10, 11]` | 4–11 |

7 is the only entry level: it is easy but has a high ID. Levels 8, 9, 10 and 11 are above 6 in the ID sense and keep their natural places in the order. Remaining band, content, accounting and device decisions are in the next section; no saved level or pin moves.

### Left out on purpose

- **Angle** (or any second variable in level 2–6): K-PS2-1's boundary and the one-variable rule; the flight arc is a drawing, not projectile physics.
- **Bounces, wind, moving clouds, limited launches, coins and upgrades**: timing, loss or purchases.
- **A leaderboard or best distance**: the score is the landing, not a rank. Cloud Hopper's "fewest launches" stays in the couch route.
- **"Land 2 clouds farther than the flag" (counted jumps)**: valid for 2.MD.B.6, but Frog Hop owns counted hops on numerals. Revisit after level 10 has been played.
- **A pull chart for grades 2–3** (pull mark against landing, a picture table): the roadmap's elementary horizon. Not planned here; it needs a chart UI system.
- **Throwing at a target that is hurt by it** (Toss Across): feed a friend instead (level 8).
- **A Block Topple mode**: in the notebook; it is its own interaction.

## Decisions for the developer

1. **Near or far as a new easy entry (level 7)** placed before the star level for toddler and preschool (the table above). Lean: yes; the star level's ±12-unit window is hard for a toddler, and near/far has a ±28-unit one.
2. **Lap and the pull level.** Should lap play level 2 (pull and let go) once the wrong-way reply exists? Lean: yes after a person has watched a one-year-old drag.
3. **Pick a spring (level 11)** adds a second variable (stiffness). One variable at a time within a round is kept; is a second *across* rounds welcome for school? Lean: yes, as the last school level, behind predict-then-use.
4. **The magnet/notch support** as a counted hint (it assists a motor skill, not a concept). Lean: count it as one hint after four misses, as the preview is counted after two; do not count the always-on notches at levels 2–3.
5. **Levels that cannot miss** (1, 2, 6, 9, 10) report zero misses and step up after two smooth rounds. Lean: keep (explore-first), but let a grown-up's pin hold a level; record an `assisted` flag only if the developer wants it.
6. **Watched pulls and the journal.** Should level 6's shown pulls file `bigger-pull`? Lean: only pulls she made herself, so the entry stays an observation of her own action.
7. **Rising notes next to the music.** Landing and tick notes are sound effects, not "she makes the music" (so the island's loop keeps playing). Lean: yes, quiet and pentatonic. A person should listen once on an iPad.

These go on the roadmap's "Waiting on the developer" list as one row.

## Build slices, in order

1. Built: truthful words, non-miss short/wrong-way support and numbered level-6 clouds; [build record](../archive/COMPLETED-2026-10-09.md#bouncy-launch-support-slice-1).
2. **Notches, rising notes, puffs and sky variety.** The five notches with a pentatonic tick, the landing note per cloud, footprint puffs and four skies, plus the level 1 cloud bag. Needs decision 7's listen. *Tier: typecheck, unit tests (notch pulls land on their clouds, the bag visits five distinct pads), one scripted play of levels 1–3, one portrait screenshot, and the Cloud Hopper `course.test.ts`.*
3. Built: fading last flight, numbered prediction flags and compare reference ring; [build record](../archive/COMPLETED-2026-10-09.md#bouncy-launch-last-flight-slice-3).
4. **Level 7, Near or far** with the per-plan strip parameters, the `entryLevels` entry and the new windows. Needs decision 1. *Tier: new level on an existing interaction: typecheck, unit tests including a regression that pins Cloud Hopper's constants, one browser play of level 7, `fingerdemo` at 7, the `registry` tests.*
5. **Level 8, Feed the friend.** Needs nothing blocking; art for a friend and a snack. *Tier: new interaction: typecheck, unit tests, one scripted play (first and last shot, one miss, one hint), one portrait screenshot, `fingerdemo` at 8.*
6. **Level 9, Between two flights.** Reuses the numerals and flags from slices 1 and 3. *Tier: as slice 4.*
7. **Level 10, Where on the line?** Needs the 10-tick strip and nearest-tick routing. *Tier: as slice 5.*
8. **Lap's pull level** (decision 2) and the magnet tier (decision 4). *Tier: filtered lap play, one person check noted open.*
9. **Level 11, Pick a spring.** Needs decision 3. *Tier: as slice 5.*

Every slice also updates the README row, the `GAMES.md` entry, the how-to card and the ghost-finger bot, and records a short VERIFICATION entry. The couch catalog and Cloud Hopper stay on level 3 and are untouched by levels 7–11.

## What was built in this session

Nothing: a deep dive session is research and ideation only. What ran: links and `git diff --check`.
