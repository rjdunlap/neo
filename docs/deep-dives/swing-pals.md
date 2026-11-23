# Swing Pals deep dive

*ID `swing-pals` · bands lap, toddler, preschool, pre-K, school · session `claude/dive-swing-pals` ([PR #1319](https://github.com/rjdunlap/neo/pull/1319))*

## The game today

She pushes a friend on a tree swing until its feet ring the bell in the leaves. Later she hangs her own swing's rope on a short, middle or long hook so her friend swings along with the pet's. The learning purpose is NGSS 3-PS2-2's pattern of motion: a swing comes back at its own steady beat, pushes add up, a short rope swings back and forth faster than a long one, and neither the rider's weight nor the swing's height changes the beat. The model is a small-swing pendulum stated as a toy (hooks give 1.0, 1.5 and 2.0 s; `period(hook)` takes nothing else). It was built from its [definition](../definitions/swing-pals.md) on 2026-10-20 ([PR #689](https://github.com/rjdunlap/neo/pull/689)); the definition's open decisions were settled on 2026-10-23, keeping every default and the built glow rule.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | *Push!* One swing on the middle rope; every tap pushes at once; four pushes ring the bell (3 friends) | lap, toddler | when to tap; nothing is wrong |
| 2 | *Push when they come back.* A tap waits and lands at the back point; a "now" ring on the first two friends (3 friends) | toddler, preschool | when to tap; a push waits for the friend |
| 3 | *Short rope, long rope.* Two swings, two bells; each half of the screen pushes its swing (2 lines) | preschool, pre-K | which swing to push and how often |
| 4 | *Swing together.* The pet's swing on a seeded hook; hers starts on a wrong one; tap a hook and both let go (3 lines) | pre-K, school | which hook matches the pet's |
| 5 | *Heavy or light.* As 4, with friends of different weights; at least one line tempts "heavy goes slow" | school | the hook, ignoring weight |
| 6 | *Big push, small push.* As 5, with different release heights | school | the hook, ignoring weight and height |
| 7 | *Who comes back first?* Two friends on two hooks are pulled back; tap the one that returns first (3 races) | pre-K (between 3 and 4), school | which rope is shorter; a wrong guess is free |
| 8 | *Twice as quick.* The hook interaction of 4–6 with a request per line: twice, half or together (3 lines) | school | the hook that beats twice or half as quick |
| 9 | *Paint the beat.* One swing drips onto rolling paper, with a colour for each rope length | preschool, pre-K, school | how hard to push, which rope to use, when to finish and whether to keep the painting |

**Content pools.** The rider pool includes bunny, duck, mouse, bear, frog, cat, dog, pig and cow. See the [game page](../games/swing-pals.md) for the weight and goal pools. Three hooks. Three release heights (`EVEN` 0.8, `BIG` 1, `SMALL` 0.45 of the bell). Levels 1–2 always use the middle rope; level 3 is always short with long (beat ratio 2), on seeded sides. The authored push rounds use a bell. Later push rounds can use chimes, an apple basket or a bird’s nest. Each friend has a pentatonic note, and a 500-seed test checks the round plans.

**Accounting today.** Levels 1–3 record no misses; adaptation there moves only through hints (the pause sheet's two shared pushes, one hint each). At 4–6 the starting hook is a free look, a repeat says "We tried that one", and any other wrong hook is one miss. The right hook glows once two different hooks have swung apart on the line, counting one hint (the definition's "after the second miss" could never fire).

The [every-band table](../PHYSICS-GAMES.md#every-band) sketches a calm grown-up swing toy. Vine Swing is a separate crossing game proposal.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [PhET Pendulum Lab](https://phet.colorado.edu/en/simulations/pendulum-lab) (already named in the definition) | Simulation | Free exploration of length, mass, amplitude and gravity, then a lab screen with timers and two pendulums side by side | Two pendulums compared side by side, already the level 4–6 frame; the "only length matters" finding | Sliders, numbers, stopwatches |
| Pendulum wave ([UCSC physics demo](https://ucscphysicsdemo.sites.ucsc.edu/?p=6987), [Cosmos explainer](https://cosmosmagazine.com/physics/dance-of-the-pendulums); search snippets, not read in full) | Physical demonstration | A row of pendulums of slightly different lengths, released together, drift apart into a travelling wave and come back together | The surprise of swings drifting apart and *coming back together*, which is the pattern made visible. A row of three is a possible top level (level 9 below) | A row of 12–16; too fine and too long for her screen |
| [Exploratorium "Coupled Resonant Pendulums"](https://annex.exploratorium.edu/wsw/progress_snacks/coupledrespend/) (Science Snack; search snippet) | Hands-on activity | One pendulum's small pushes, made in time with the other's natural beat, swing it higher and higher; only equal lengths share a beat | The level 2 rule (a push in step with the swing builds height) and the level 4 rule (only matching ropes share a beat), told as a straw and two pennies; supports the off-screen suggestion | The coupling itself (energy passing back and forth); invisible and slow |
| Pendulum painting ([Science World](https://www.scienceworld.ca/resource/pendulum-painting/), [Gryphon House "Pendulum Art"](https://www.gryphonhouse.com/early-childhood-activities/pendulum-art); search snippets) | Preschool art-science activity | A paint cone on a string swings over paper; children change the swing and the weight and see the pattern; loops shrink as the swing dies down | A swing that leaves a trace on paper: evidence of its motion that stays after it stops (3-PS2-2's "observations… as evidence"). See *Paint the beat* below | Mess as the point; a single cone's 2D rosette is not a beat she can compare |
| [Pango Playground](https://apps.apple.com/us/app/pango-playground/id578951119) (Studio Pango; store listing and reviews) | Toddler toy app | Tap an object and it becomes a swing, slide, seesaw or roundabout; no goals, no levels | The lap register: a tap, a ride and a giggle, every time; one-time purchase, no ads | Nothing to learn beyond cause and effect; no progression to borrow |
| [Cut the Rope](https://arkadium.com/games/cut-the-rope/) (ZeptoLab; store and walkthrough pages) | Physics puzzle | Candy swings on ropes; levels add ropes, bubbles and moving hazards; cut at the right point of the swing to send it the right way | Nothing structural; it is the common commercial "swing" puzzle | **Rejected:** a release timing that fails, stars for speed and precision, purchases. Swing Pals never asks for a well-timed release |
| [STEMIE "Playing with swings"](https://stemielearningtrajectories.fpg.unc.edu/activity/early-intervention-playing-with-swings/) (already named) | Early-intervention routine | Push, pause, wait for the return, push again, with a grown-up | The lap and toddler turn-taking rhythm, and a co-play role for the grown-up ("Ready… push!") | — |
| Music's half and whole beats (Beat Builder, Rhythm Neighbors on the island) | Island games | Follow or build a beat | The idea of one thing happening twice for every one of another, used at level 8 *Twice as quick* (the short rope comes back twice for every long swing, exactly) | Matching the island music; here the swing's physics sets the beat |

**Learning anchors.** [NGSS 3-PS2-2](https://thewonderofscience.com/3ps22) (patterns of motion that predict future motion; the clarification names a child on a swing and rules out the words "period" and "frequency" for assessment) stays the anchor. Prediction is part of the performance expectation ("can be used to predict future motion"), which is what levels 7 and 8 add: today the game asks her to *match* a pattern, never to *predict* one.

## What makes sense here

- **More friends and more things in the leaves first.** The cheapest real gain: the four unused `CRITTERS` (cat, dog, pig, cow) as riders, giving level 5 a second heavy friend so the heavy side is not always the bear, and seeded leaf goals (the bell, wind chimes, an apple that drops into a basket, a bird's nest that tweets) so levels 1–2 look different round to round. The rule, the hooks and the accounting stay.
- **Predict before matching.** 3-PS2-2 asks her to use a pattern to predict. A *which comes back first?* level, unscored as Planet Hop's predictions are, is the definition's own "not in the first build" school prediction mode. It also fills pre-K's jump: watching two ropes and guessing is easier than choosing a hook, so it can sit between 3 and 4 by `order`.
- **One beat inside another.** Short and long hooks are exactly 1 : 2 (1.0 and 2.0 s), so the short swing comes back twice for every long swing and they meet at the back each time the long one does. Level 4's definition was careful to make that coincidence *not* count as together; a separate level that asks for it on purpose ("make yours come back twice for every one of mine") is a natural school top, with music's half and whole beats as a familiar frame.
- **A row of three, later.** A pendulum-wave row of three swings is the most striking picture of the rule, but two swings already needed a smaller rope scale (416 instead of 460) to clear the pet's corner in landscape; three equal columns fail on upright phones, but a fitted row with one fixed rope per swing at 12° passes every view (the probe, in the [level 10 definition](../definitions/swing-pals-row-of-three.md#the-swinglayout-probe-2026-11-22)).
- **Paint the beat.** A paint pot on her swing drips onto a paper strip that slides beneath at a steady speed. The short rope paints closely spaced wiggles and the long rope leaves more space between them. The framed painting keeps that record after the swing stops.
- **Left aside:** a release-timing mechanic (Cut the Rope, Master of Swing), pumping (the rider's own legs), numbers or stopwatches, swings that die away and lose a reached goal, and any push that takes height away.

The long arc: lap and toddler push and hear the bell; preschool pushes in time and sees a short rope come back quicker; pre-K predicts which comes back first and then matches a rope; school ignores weight and height, then fits one beat inside another; school's top, level 10, makes a row of three swing apart and back together.

## Experience and presentation

- **First unsupported action.** Level 1: any tap anywhere pushes, and the mitten pops at once. Level 7: tapping the friend she thinks will come back first, with no right answer to fail.
- **Touch and consequence.** Touch-down pops the big soft mitten behind the seat with a whoosh; the swing eases up a quarter of the way; a giggle on each swoop forward; the leaf goal rings its friend's pentatonic note and latches. The return to readiness is the swing itself coming back to the mitten.
- **Variety on replay.** The new rider pool and seeded leaf goals; release heights and starting hooks already vary at 4–6. The rule never changes with the dressing.
- **Reasoning versus motor precision.** Levels 1–3 are timing with no miss for any timing; 4–8 are reasoning carried out with a single tap on a 120-unit hook or a 110-unit-tall friend. Nothing needs a well-timed tap to succeed; at level 2 a tap at any time is stored.
- **Prediction stays distinct from a wrong answer.** At level 7 a prediction that turns out wrong is a result to look at ("The mouse came back first. Short rope, quick!"), never a boing or a miss. At level 8 a wrong hook is a miss, as at 4–6, since the request is stated before she chooses.
- **Supported ending.** Every line ends with the friends swinging together or ringing; the glow and the pause-sheet help always lead to the right hook; the round ends in the line-up and hop, then one sticker.
- **Co-play.** One pushes and the other says "now!" (built). At level 7 each player taps a different friend before "go" (the second tap simply adds a second marker; nothing is scored). At level 8 one claps every time the pet's swing comes back and the other every time hers does.
- **Art and feel example (code-drawn).** A wind-chime leaf goal: three short brass tubes drawn as rounded rectangles in `palette.ts` yellow-brown with a darker outline, hung on threads from one bough; when feet touch, each tube swings with its own small `tw` rotation and plays three of the friend's pentatonic steps in a quick rising run from `src/audio/notes.ts`. No new art system.
- **Needs a person or device.** The existing [device check](../DEVICE-CHECKS.md); whether a four-year-old guesses at level 7 or simply taps her favourite friend; whether "twice for every one" at level 8 is visible on an iPad or needs the clap to carry it; whether a cow on the short rope crowds the hook.

## Proposed ladder

### Fresh content inside existing levels

**Built 2026-11-06** (PR #1332, build note in the [archive](../archive/COMPLETED-2026-10-09.md#swing-pals-more-friends-and-leaf-goals-2026-11-06)). The short-hook rule below was impossible as written (short rope about 100 units, riders 113–178 tall), so the test asserts that no rider rises further above the short hook than the original five do.

| Pool | Today | Added | Notes |
| --- | --- | --- | --- |
| Riders | bunny, duck, bear (`CRITTERS`); mouse, frog (local) | cat (light), dog (middle), pig (heavy), cow (heavy, if it clears the short hook) | Level 5's filter then pairs light and heavy from a wider pool; level 4 keeps same-kind pairs. The sticker and hub icon stay pinned to the original five so existing stickers do not change |
| Leaf goal | the brass bell | wind chimes, an apple that drops into a basket on the grass, a bird's nest whose bird tweets and peeks out | Seeded per round (one kind for the whole round); each rings the friend's note. Level 3 uses two of the same kind. One voice variant each ("Ding!" stays generic) |
| Level 3 sides | short with long, seeded sides | unchanged | Short with middle (ratio 1.5) was considered and left out: preschool needs the clearest contrast |

Rule tests: the level 5 and 6 filters hold over 500 seeds with no fallback and reach the new heavy friends; every rider is drawn at least 110 units tall; on the short rope every rider's top stays below the hook at the four standard views (the build notes say the bear already comes near it, so the cow may be left off the short hook or out of the pool); every leaf goal sits at the arc's forward end inside `view` in every layout.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *Who comes back first?* | pre-K (placed between 3 and 4 by `order`: 3, 7, 4) and school (after 6) | Authored: a mouse on the short hook (left), a bear on the long hook (right), both pulled back to the same height. "Who will come back first? Tap a friend." She taps one; a small paw marker sits on it; "Ready… go!"; both let go; at the first return the short-rope friend reaches the mitten and claps, with a bright note; the pet says "Short rope, quick!" Lines 2–3 seeded: different hooks every line, at least one line where the heavier friend or the bigger push is on the *shorter* rope (the tempting wrong guess) | which friend comes back first | **Never a miss**, as Planet Hop's predictions: a guess that did not come first is shown and named ("The mouse came back first"). The pause sheet's "Show a hint" lights the shorter rope before she taps and counts one hint. Adaptation moves only through hints, as at levels 1–3 | `firstBack(line)` returns the shorter hook for every pair, whatever the weights and heights; the two hooks always differ; the tempting line appears in every seeded round; the watch lasts until the slower friend's first return | New interaction (tap a friend to predict): a friend hit area at least 110 units tall, a marker, voice lines (`instruct-first`, `first-quick`, `first-same`), how-to step `{ from: 7, to: 7 }`, the bot taps the shorter rope's friend; band change for pre-K and school (decision 1, default given) |
| 8 | *Twice as quick* | school | Authored: the pet's bunny on the long hook; her duck starts on the middle hook. "Make yours come back twice for every one of mine." A small strip under the pet's swing shows the request as pictures (one big dot, then two small dots). She taps a hook; both let go for two of the pet's swings; on the right hook (short) every pet return meets every second return of hers with a clap, and every return of hers taps a soft note. Lines 2–3 seeded from two requests: "twice as quick" (pet on long, answer short) and "half as quick" (pet on short, answer long), plus one plain *together* line so she listens to the request | which hook gives the asked-for beat | As at 4–6: the starting hook is a free look; a repeat says "We tried that one"; another wrong hook is one miss with a boing and the spoken reason ("Yours comes back once for each of mine. Try a shorter rope."); the right hook glows once two hooks have swung apart, one hint | `beatRatio(petHook, hook)` is exactly 2 only for long with short and exactly ½ only for short with long; each request has exactly one right hook; claps fire only when both swings are at the back together; the starting hook is wrong; every round holds both requests or a request and the together line | New level on the hook interaction; the request picture strip, new voice lines (`instruct-twice`, `instruct-half`, `twice-not-yet`), how-to step `{ from: 8, to: 8 }`, the bot taps the right hook |
| 9 | *Paint the beat* | preschool, pre-K, school | A duck on a long rope waits for a push over the blank paper | the rope, the push and when the painting is done | free exploration, with one counted hint per request while paper remains | [definition](../definitions/swing-pals-paint-the-beat.md) | built in slice 5 |
| 10 | *A row of three* | school | Three friends on three swings (short, middle and long ropes, one fixed rope each), released together at 12°; the pet points at one friend and asks which of the other two is back at the mittens with it first. Authored line 1 (mouse, duck, bear; pointed bear), lines 2–3 seeded, one always the tempting line where the slowest swing meets the quick one first | which of two friends meets the pointed friend first | **Never a miss**, as level 7: a guess that did not meet first is shown and named; hint lights the answer's friend with a one-line why, once per line | [definition](../definitions/swing-pals-row-of-three.md): pairs meet at 2 s (short and long), 3 s (short and middle) and 6 s (all three: the long rope's third swing); `firstMeet` never returns the pointed friend; fitted `rowLayout` passes every view at 12° | Defined after the `swingLayout` probe (three equal columns fail on upright phones; the fitted row passes); build claimed 2026-11-22 by `claude/swing-pals-row-of-three` |

### Younger-band openings

Level 1 is the lap entry and accepts taps across the play area. A single-tap swing with a long giggling sway and no goal remains a sketch.

### Easier entries and levels between existing ones

The pre-K ladder places levels 7 and 9 between 3 and 4 using `order: [3, 7, 9, 4]`. Preschool's order is `[2, 3, 9]`, and school runs from 4 through 9 (level 10, *A row of three*, is defined and extends it to 10 when built). There are no special entry levels, so a birthday preserves level 9 in the bands that have it.

### Left out on purpose

Release timing and anything that can fall; pumping; numbers, stopwatches and the words "period" and "frequency"; swings that lose a reached goal; pushes against the motion that take height away (real, but punishing); the grown-up couch toy (a proposal in [PHYSICS-GAMES](../PHYSICS-GAMES.md#every-band)); a counting mode with number cards (counting returns in a song phrase), which overlaps level 8 and adds reading of numerals.

## Decisions for the developer

**Decided 2026-11-17 (on the developer's delegation, [record](../archive/DECISIONS-2026-11-17.md#games)):** *Paint the beat* is a creative level whose painting is kept only on request, as any other creation is, and needs a definition (2); the journal files "a longer rope swings slower" (3: yes, it is an observation about the world). A "default" or "lean" below that says otherwise is superseded.

The definition's five decisions stand as decided on 2026-10-23. This dive adds:

1. **Where level 7 plays.** Built on the default; the developer can still change it. Default: pre-K between 3 and 4 (`order: [3, 7, 4]`) and school after 6. Alternative: school only, leaving pre-K's jump.
2. **Paint the beat.** The 2026-11-17 decision gives the creative round the usual optional Keep action. [Definition](../definitions/swing-pals-paint-the-beat.md)
3. **A journal discovery** ("a longer rope swings slower", filed once level 3 or 7 has shown it). Reopens the definition's decision 4 (no discovery filed). Decided yes 2026-11-17; built 2026-11-21 (slice 6).

Decision 1 has a usable default, so slice 2 stays buildable on it. Decisions 2 and 3 gate only their own slices.

## Build slices, in order

1. **More friends and leaf goals** (built, [PR #1332](https://github.com/rjdunlap/neo/pull/1332)). Riders cat, dog, pig and (if it clears the short hook) cow; seeded leaf goals (wind chimes, apple and basket, bird's nest) beside the bell. Tier: existing interaction with new content: typecheck, rule tests (the level 5–6 filters over 500 seeds reach the new heavy friends with no fallback; rider heights and short-hook clearance at four views; leaf-goal placement), the voice test, one filtered play of level 1 and level 5 with one portrait screenshot of a new goal; no `fingerdemo` (the bot is unchanged); build, since voice lines change.
2. **Level 7, *Who comes back first?*** (built 2026-11-06, [PR #1339](https://github.com/rjdunlap/neo/pull/1339)) On decision 1's default. Tier: new interaction: typecheck, unit tests (rule tests above, registry, how-to, voice), one scripted play of level 7 with one wrong prediction and one requested hint, and pre-K's `order` step from 3 to 7 to 4; one portrait screenshot; `fingerdemo` at 7; build.
3. **Level 8, *Twice as quick*.** (built 2026-11-06, PR #1339) After slice 2 (school's `order` then ends 7, 8). Tier: new level on the existing hook interaction: typecheck, rule tests, one browser play of level 8 with one wrong hook, `fingerdemo` at 8.
4. ***A row of three*** (level 10). The layout probe is done (a throwaway test; the build slice turns it into a real rule test) and the [definition](../definitions/swing-pals-row-of-three.md) is written. The build is the Queued `swing-pals` level 10 line in READY.
5. **Level 9, *Paint the beat*** (built 2026-11-22, [PR #1999](https://github.com/rjdunlap/neo/pull/1999)). The rolling paper records each rope's wiggle spacing and offers optional Keep after the framed reveal. The finished comparison can file the longer-rope discovery. [Definition](../definitions/swing-pals-paint-the-beat.md)
6. **Journal discovery.** Decision 3 (decided yes). (built 2026-11-21, [PR #1946](https://github.com/rjdunlap/neo/pull/1946)) A finished round that swung a short rope beside a long one (level 3 *Short rope, long rope* or level 7 *Who comes back first?*) files `swing-pals:longer-slower` once, "Long ropes swing slower". The matching levels (4–6, 8) also show two ropes but she tunes one to the other, so they file nothing, and levels 1 and 2 never do.

## What was built in this session

Slices 2 and 3 were later built (PR #1339); see the archive note. This session built nothing: a deep dive session is research and ideation only. Checks: `node scripts/check-links.mjs` and `git diff --check`.
