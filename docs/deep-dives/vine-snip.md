# Vine Snip deep dive

*ID `vine-snip` · lap to school · levels 1–5 as of 2026-11-20*

## The game today

In [Vine Snip](../games/vine-snip.md), a tap or swipe cuts a vine and the fruit falls or swings into a hungry friend's mouth. Tinker Lab's progression starts with a visible cause and effect, then asks the player to predict a moving fruit's landing and plan which vine to keep. The [original definition](../definitions/vine-snip.md) explains the toy physics. The shipped game page records where the build diverged.

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | Snip! | lap, toddler, preschool | Tap anywhere. One vine parts and the friend catches the fruit. Three lines. |
| 2 | Two vines | toddler, preschool, pre-K | Snip either vine, then the other. The friend moves under the falling fruit and catches every release. Three lines. |
| 3 | Wait for the swing | preschool, pre-K, school | Watch a fruit already swinging and pick when to release it. Three lines. |
| 4 | Which vine stays? | pre-K, school | Pick which pivot to leave, then release toward the friend. The authored three-vine line includes one that hangs straight down. Three lines. |
| 5 | Two friends | school | Keep a viable vine and choose a release for each of two fruits. Two lines, two catches per line. |

Seeded lines draw from four fruits (apple, orange, lemon and pear) and six friends (bunny, bear, duck, pig, dog and cat). Anchor geometry, release direction and fruit/friend pairings vary by mode. Level 4 shows both sides before varying the third line. Level 5 keeps each fruit's route separate from the other friend's catch band. The model uses a repeating pendulum, a falling arc and a 200-unit catch band, with at least a 0.4 s viable release window for the scored swings. A missed drop on levels 3–5 bounces onto a leaf and floats back. The hint marks a viable keep and/or release window. Grow back is free. There is a touch ghost finger and no couch mode.

The first scored question currently tests reading the swing and hitting a release window together. A player who understands where the fruit is heading can still miss by tapping late. The game also keeps a fixed translated board. Any new controls need a layout probe in the smallest supported phone view, including the sideways game and caption clearance.

## Similar games and activities

| Reference | How it grows | Implication for Vine Snip |
| --- | --- | --- |
| [Cut the Rope](https://play.google.com/store/apps/details?id=com.zeptolab.ctr.ads) | Introduces one clear puzzle idea and varies how it is applied. Later boxes layer in more tools and obstacles. | Use one readable variation per step and keep the fruit, vines, friends and layout original. Stars, unlocks and purchases sit outside the island's loop. |
| [Cut the Rope: Experiments](https://www.zeptolab.com/games/cut-the-rope-experiments) | Keeps the familiar cut-and-feed goal while introducing more devices. | A familiar goal can survive a change to the question. An investigation of the same swing gives more value here than another device on the board. |
| [Crayon Physics Deluxe](https://www.crayonphysics.com/) | Puzzles and open-ended drawing let players create a setup and see it move. | Make the observation repeatable. An authored pair of releases can isolate one change without requiring drawing controls or a physics sandbox. |
| [Swing Pals](../games/swing-pals.md) | Builds from pushing to timing and comparing swing lengths. | Leave comparisons of rope length and beat with Swing Pals. Vine Snip can ask what happens just after release. |
| [Bouncy Launch](../games/bouncy-launch.md) | School levels predict landing distance after a shown pull or compare flights under two toy gravities. | Keep the prediction and reveal structure. Vine Snip varies the direction through one release point while keeping height, speed and gravity fixed. |
| [Exploratorium's coupled pendulums](https://www.youtube.com/watch?v=4gQdTnalzJQ) | Uses an observable physical swing pattern and changes one condition to see what follows. | Use one pendulum and change the direction through the same release point. Comparing that pair gives a short investigation without adding coupled swings. |

[NGSS 3-PS2-2](https://www.nextgenscience.org/pe/3-ps2-2-motion-and-stability-forces-and-interactions) uses regular motion to support prediction and gives a swing as an example. A side-by-side comparison can invite that habit. In the toy model, release carries the fruit's instantaneous sideways and vertical velocities into flight. At symmetric passes through the bottom, the vertical velocity is zero and the sideways velocity differs only by sign. The [OpenStax pendulum](https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums) and [projectile motion](https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion) chapters describe the approximations behind those observations.

## What makes sense here

Keep levels 1–2 an immediate, error-free experiment. Levels 3–5 already give pre-K and school players timing, pivot selection and two independent plans. The next useful change is a school prediction round in which the same release point can send fruit in either direction. That isolates motion direction and gives children who struggle with timing a way to show what they observed.

## Experience and presentation

A pair of leaf landing patches sits below a swinging fruit. A short dotted trail behind the fruit shows its direction just before a marked release point. Both choices are spoken and drawn, with a large target around each patch. Touch-down presses the leaf and marks the player's guess. A single large Snip button lets her trigger the marked release. The fruit follows the real toy-model arc and the landing leaf curls with a soft pentatonic note. The selected leaf stays marked long enough to compare with the landing. The fruit regrows for the mirrored pass. After the second landing, two large Replay and Finish controls let her watch the pair again for free or take one sticker.

In co-play, one person predicts and the other snips, then they swap on the second pass. One player can do both. Off screen, roll a soft ball across a low tabletop in each direction over the same marked point and watch where it reaches the floor. A phone playtest can judge whether the trail explains direction before the player hears the reveal and whether the caption stays clear of both leaf targets.

## Proposed ladder

### Fresh content inside existing levels

The four fruit silhouettes, six friends and mirrored boards already vary the opening. Reuse those pools for the first prediction prototype. Keep each comparison's fruit, vine length, release position and landing height fixed so a second pass changes only direction.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | [Where will it land?](../definitions/vine-snip-where-will-it-land.md) | School 3–6 | An orange passes the mark under its vine heading right. Tap a landing leaf, then Snip to let it go at that mark. It swings through the same mark heading left on the second pass. | Predict where the fruit will reach the two leaves. The marked release point stays fixed, and the model releases at the showcased phase. | Every guess reveals the actual landing. Replay is free. Help replays the approach and points out its direction without choosing a leaf. No prediction misses. Count only deliberately requested Help as a hint, at most once per pass. | Both releases start from the same point with opposite horizontal velocities, reach distinct patches and use the same flight solver. Either guess reaches the reveal and free replay. Two observed landings finish once. The chosen patch has no effect on flight, and the ghost finger can finish without a timed gesture. | One level-scoped how-to and new spoken prompts, two large leaf controls, Snip, replay, and ghost-finger sequencing. No save, journal or couch entry. |

### Younger-band openings

Lap already has the anywhere-tap entry. The toddler two-vine level supports both orders without misses. Preserve that single-action opening and its supported next step.

### Easier entries and levels between existing ones

Keep levels 1–5 in order. If phone play shows direction is still hard to read at level 3, examine the existing swing trail and hint first. That observation can guide a separate change to the level-3 presentation.

### Left out on purpose

A lifting bubble and a bounce leaf would each add a new motion rule and a separate solver question. A shooable spider would interrupt the observation. Keep those as ideas in the original definition. Keep the pre-snipped pivot prediction as a later study option after the release-direction comparison has been tried.

## Decisions for the developer

- **What to compare.** Default to the same bottom point in opposite directions. Ask where it lands before introducing questions about which vine or how fast it travels.
- **How to trigger release.** Default to an intentional Snip button that releases at the marked phase. Let the approach play visibly before arming the button, and make a clear press start the release from that pose.
- **How to account for help.** Default to a guess as free exploration. The definition should verify that both guesses always lead to the same physical result and allow a normal finish.

## Build slices, in order

1. **Define level 6, Where will it land?** **Built (on `origin/main` as level 6, checked 2026-11-28 against the game's level table)**; (docs only; defined 2026-11-21, [definition](../definitions/vine-snip-where-will-it-land.md)). Work out one authored mirrored pair with `posAt`, `velocityAt` and `arcAt`/the crossing calculation; show the quantitative leaf separation and phone target/caption envelope. Specify the approach, prediction, Snip, reveal, Help and free replay states, and the school range and ghost-finger contract. Check links and diff.
2. **Build the defined level** from the [definition](../definitions/vine-snip-where-will-it-land.md). New interaction tier. Typecheck and rule tests, one filtered `vinesnip` play with opposite guesses on two passes, Help, replay and one award, a screenshot in the phone's supported orientation, and `fingerdemo` at level 6. Add the game page and how-to changes then. **Built** 2026-11-22 (PR #1990); departures in the [game page](../games/vine-snip.md#design-notes).

## What was built in this session

Research and planning only. Checked the shipped rules and scene, compared references, and ran links and `git diff --check`.
