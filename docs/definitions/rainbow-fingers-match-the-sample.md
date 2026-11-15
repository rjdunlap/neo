# Rainbow Fingers, Match the Sample (definition)

**Status:** defined 2026-11-15 ([PR #1703](https://github.com/rjdunlap/neo/pull/1703)), docs only; not built. This settles [decision 10](../deep-dives/rainbow-fingers.md#decisions-for-the-developer) of the Rainbow Fingers dive for level 12 *Match the sample, drop by drop* ([dive slice 13](../deep-dives/rainbow-fingers.md#build-slices-in-order)): the color model is written down here with its rule tests, and the verdict is **keep the level**, with the narrower sample set and the wider tolerance below. The build is queued on [READY](../READY.md) and starts by putting this model and its tests in `logic.ts` before any art.

**Fun action and purpose:** a little paint card shows a color between two primaries, such as a red-orange. Two pots stand by a bowl; each tap adds one drop, up to six. The bowl shows the color the drops make and a dot for every drop. When she thinks it matches she taps *Does it match?*. The learning goal is **proportion**: a color is made by how many drops of each paint, not only which paints, so two red and one yellow is redder than one of each, and two red with one yellow matches four red with two yellow. It is the dive's skill column, "the amounts: how many drops of each".

## Overlap

Checked against `origin/main` at `db888d91` (GAMES.md, IDEAS.md, the Rainbow Fingers dive, `src/games/rainbow-fingers/`, the open PRs).

| Game | What it already owns | Why this belongs in Rainbow Fingers |
| --- | --- | --- |
| Rainbow Fingers levels 6–11 | Which paints make a color: a bowl of two or three different pours, named by `mix()`; order and repeats never matter | Level 12 is the first level where repeats matter. Same pots, bowl and drop action, so it is a level here, not a game |
| Recipe Workshop (toddler–pre-K) | A weighted color blend of dollops (`blendColor`) and following a one-of-each card | Its card is which ingredients, at most three of one, judged by sequence; no proportion target. Its blend is an RGB average and is not reused (see the model) |
| Lemonade Stand level 6 | Comparing prices as "shells for every 2 lemons" | A rate in money; nothing is matched by look |

IDEAS.md has no ratio-mixing entry. The dive's *tints and shades* sketch (white and black in amounts) stays a sketch: this level uses no white.

## The model (`logic.ts`)

- **A bowl is two counts.** Each round's sample belongs to one *pair* of primaries in wheel order: red→yellow, yellow→blue, blue→red. The bowl holds `a` drops of the first and `b` of the second, `a + b ≤ 6`. Only that pair's two pots stand on the page, so no third paint and no white can enter the bowl (the pairs' "which paints" question is levels 6–11's).
- **Its share is a fraction.** `share = b / (a + b)`, kept as two integers. An empty bowl has no share and no color.
- **Its place on the paint wheel.** The wheel puts red at 0°, yellow at 120°, blue at 240° and the secondaries between them (orange 60°, green 180°, purple 300°). A bowl sits at `start + 120° × share`: one red and one yellow at 60° (orange), two red and one yellow at 40°. This is the hue-interpolation model decision 10 asked for, written with the share as the interpolation.
- **What it looks like.** One function, `wheelColor(deg)`, gives the bowl and the sample their fill: it interpolates in OKLab between the two neighbouring `swatch` fills of the wheel's six anchors (red, orange, yellow, green, blue, purple), so a one-to-one bowl is exactly the orange, green or purple a level 6 bowl shows. The bowl, the sample, the tests and the ghost-finger bot all call it, so what she sees is what is judged. (Recipe Workshop's RGB average is not reused: its tests do not need perceptual spacing, and these do.)
- **Samples.** Six: the one-third and two-thirds shares of each pair (two red and one yellow, one red and two yellow, and so on; at 40°, 80°, 160°, 200°, 280° and 320°). The one-to-one secondaries are not samples: they are level 6's colors, and with them the tolerance below would have to be narrow enough that a near match could not count.
- **Accepted.** A bowl matches a sample when its share is within **2/15** of the sample's, compared in integers by cross-multiplying (`|15·b·q − 15·p·(a+b)| ≤ 2·q·(a+b)` for a sample share `p/q`), as Frog Hop compares fractions, so nothing compares floats. Within six drops that accepts four shares per sample: for one third, 1/5, 1/4, 1/3 and 2/5 (drops 4:1, 3:1, 2:1, 3:2, 4:2); for two thirds, 3/5, 2/3, 3/4 and 4/5. A one-to-one bowl and a single paint never match. The accepted sets of a pair's two samples do not touch.
- **Far and near.** A check that does not match is *far*. Its direction is the paint the sample has more of than the bowl does: "A bit more yellow?"

## Why it stays faithful to paint

The level is kept because the model keeps the parts of real paint mixing that the level teaches, and they are tested:

- **More of a paint pulls the mix toward it.** Adding a drop of the second paint always moves the bowl's place toward the second anchor, and never past it (monotone).
- **Only the proportion matters.** Two red and one yellow look exactly like four red and two yellow (same share, same place, same color).
- **One of each is the secondary she already knows.** A one-to-one bowl is level 6's orange, green or purple, and the wheel is the level 8 wheel she finished.

What it leaves out, and why that is acceptable: real pigments differ in strength (a drop of blue overwhelms a drop of yellow) and mixed paint darkens and dulls, while this wheel spaces drops evenly and keeps the colors bright. The level teaches "how many of each" with a fair, even unit, as a child's paint set with equal-strength drops would; the grown-up card says "paint" (decision 8) and claims nothing about pigment. If the build's tests cannot hold the properties above with the real palette, the level is dropped rather than bent.

## How a round goes

- **Level 12, `match`, school band** (school becomes 5–12; appended, no `order`). Three samples a round, one from each pair, in a seeded order, each side (one third or two thirds) seeded. One sticker a round.
- **The page:** the sample card at the top, the bowl in the middle with up to six drop dots in the two paint colors, the two pots below it (the existing 104-unit marked pots), and two big buttons beside the bowl: *Does it match?* (a check mark) and *Start again* (the bowl tips out). Each is at least 100 units.
- **A seventh drop** does nothing to the bowl; the bowl wobbles, the pet says "The bowl is full!", and *Start again* glows. Unlike levels 6–11 (`pourInto` starts a full bowl over), a full bowl is never emptied for her, because a near mix would be lost without her choosing it.
- **A match:** the bowl's color pours onto the sample card, the card shines, and the pet says her drops, not a recipe: "Two red and one yellow make red-orange!" (her own counts, whichever accepted bowl she made). Then the next sample.
- **No miss at all.** A far check is her choice to look, not a wrong answer: no boing. The first far check of a sample says the direction ("A bit more yellow?"). The second and later far checks also glow the hinted control (below), and that sample counts one hint. A dead-end bowl (below) gets "Let's start a new bowl" instead of a direction.
- **Accounting:** `ctx.finish({ misses: 0, hints })`, where `hints` is the number of the round's three samples that showed a glow. A round with no glow is smooth; two rounds with a glow on at least two samples each step down (the shared rule: two hints is struggling). Idle glows are not added (decision 5's free idle glow does not apply; this level has no idle glow).

## The hint

`matchHint(sample, bowl)` returns the pot to glow, or `'start-again'`:

- If some bowl within six drops that keeps every drop already in this one (`a' ≥ a`, `b' ≥ b`, `a' + b' ≤ 6`) matches, the hint is a pot whose drop keeps a fewest-drops match in reach; when both pots do, it is the one whose drop moves the bowl's place closer to the sample's (from an empty bowl, the paint the sample has more of).
- Otherwise the bowl is a **dead end** (for example five yellow drops for a two-red-one-yellow sample: a sixth drop, red, still leaves five sixths yellow, and a seventh is not allowed) and the hint is `'start-again'`, which glows the *Start again* button.

What "closer" means, stated exactly: every pot hint (a) leaves a matching bowl reachable and (b) strictly reduces the distance between the bowl's share and the sample's. A `'start-again'` hint is the one exception to (b), named here so the dive's sentence "the hint always moves the bowl closer" is read with it. Following hints from any bowl reaches a match within four taps (at most one tip-out and three drops; checked at define time).

## Rule tests (`logic.test.ts`)

Written before any art, from a brute-force check made while defining (all bowls of up to six drops, all six samples):

1. **Every sample is reachable:** each has an accepted bowl of at most six drops (the smallest has three).
2. **The tolerance is a set, not a recipe:** each sample accepts exactly the four shares above (five bowls of up to six drops), and its exact recipe is among them.
3. **No near neighbor counts:** a one-to-one bowl and a single paint never match; a pair's two samples have disjoint accepted sets.
4. **Integer comparison:** acceptance agrees with the float rule on every bowl, and the code path uses only integers.
5. **Proportion, not amount:** bowls with equal shares get the same place, the same `wheelColor` and the same verdict (2:1 and 4:2).
6. **Monotone:** a drop of the second paint never decreases the place, and a drop of the first never increases it.
7. **She can see it:** using the real `swatch` fills and `wheelColor`, every rejected bowl of up to six drops is at least **4.5** OKLab units (×100) from its sample, and every accepted one is closer than the nearest rejected one. The define-time numbers: the tightest sample is red→yellow at two thirds (nearest rejected 4.7, farthest accepted 3.8); the widest margins are on the blue side (nearest rejected 8.7 to 9.3). If a palette change takes a sample below 4.5, that sample leaves the set and the test says which.
8. **Hints lead somewhere:** from every bowl and sample, a pot hint satisfies (a) and (b) above, `'start-again'` appears exactly on dead ends, and following hints reaches a match within four taps.
9. **Fair draw:** every round has three samples from three different pairs, seeded, and over many seeds both shares of each pair appear.
10. **Old levels unchanged:** `mix()`, `RECIPES`, `pourInto` and `nextPour` keep their existing tests; level 12 adds a mode and does not touch levels 6–11.

## Build notes

- New `PaintPlan` `{ mode: 'match', count: 3 }` appended as level 12; `LEVELS.school.max` 12; `describeLevel` "Match a paint card by how many drops of each"; a how-to `LevelLine` showing two drops of one pot and one of the other, then the check; the `early` paint loop in `scripts/browser-check.mjs` and `fingerdemo` reach level 12 (the bot pours the sample's exact drops, then checks).
- Voice lines: the instruction ("Make this color! Tap a pot for each drop."), the check prompt, the direction lines for the three primaries, "The bowl is full!", "Let's start a new bowl", and the six match lines ("Two red and one yellow make red-orange!"). The sample names are the spoken names only: *red-orange, yellow-orange, yellow-green, blue-green, blue-purple, red-purple* (new color words go to the parked device checks, as decision 11 says for every new color word).
- Tier when built: the new-levels tier (rule tests, one browser play of level 12, `fingerdemo` at it, one portrait screenshot of the page with the pet).

## Open decisions

None block the build; each has the default used above.

1. **Sample side by side or on top?** Default: the sample card above the bowl, so a phone in portrait can compare them in one look. A landscape layout may put them side by side.
2. **Spoken sample names.** Default: compound names (*red-orange*). An alternative is "a red orange" or naming only the nearer secondary ("a reddish orange"); the device speech check decides.
