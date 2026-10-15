# Color Garden deep dive

*ID `color-garden` · bands toddler, preschool, pre-K · levels 1–7 on 2026-10-14 · session `claude/color-garden-deep-dive` ([PR #302](https://github.com/rjdunlap/neo/pull/302))*

## The game today

She drags fruit, balloons and flowers from a tree into woven baskets lined with their color. Learning: matching and sorting by one attribute (color, then shade), a dragging skill, and the six color names (the pet says the color on each pickup). Source baseline: `origin/main` after PR #301.

Band windows (`LEVELS`): lap 1, toddler 1–5, preschool 3–7, pre-K 4–7. No couch entry.

| Level | Plan | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | 1 basket, 4 fruit | lap, toddler | Nothing to choose: drag practice, anything dropped over the basket lands |
| 2 | 2 colors, 6 fruit | toddler | Which of two baskets |
| 3 | 3 colors, 6 fruit | toddler, preschool | Which of three; the fruit kind gives the color away |
| 4 | 4 colors, 8 fruit | toddler, preschool, pre-K | Four baskets |
| 5 | 5 colors, 10 fruit | toddler, preschool, pre-K | Five baskets, narrower (130) |
| 6 | 6 colors, 12 balloons and flowers | preschool, pre-K | Six baskets; the kind no longer tells the color |
| 7 | 2 baskets, light and dark blue, 8 balloons and flowers | preschool, pre-K | Sort by shade, not by color |

Content (`logic.ts`, `index.ts`): six colors (`RAINBOW`), each with one fruit (`FRUIT_FOR`), two non-fruit kinds (balloon, flower, alternating by item index). `deal` takes the baskets' colors at random from the six, puts one item per color on the tree, fills the rest at random, and shuffles. Hence every round is a fresh but small combination space: no named content pool, and the only things that change on replay are which colors and where they sit.

### How it plays, from the source

- Drop anywhere over a basket or up to 230 units above its base (`REACH_UP`), 30 units beyond its rim; the nearest basket wins. A drop elsewhere springs back.
- Pickup: a tick and the spoken color ("Light blue!" at level 7). A right drop: the item shrinks into the basket and stays peeking over the rim, the basket bounces, a pentatonic bell pitched by basket position, stars in the color; every third sort the pet cheers.
- A wrong basket: boing, the basket shakes, one spoken hint naming the item's color (not more often than every 3 s); the second wrong drop of the same item glows the right basket for 4 s and counts one hint. Misses count each wrong drop.
- All sorted: bells up the baskets, confetti, one sticker through `finish`.
- Ghost finger: `autotouch()` follows `nextToSort`. `touchDemo` is set and the how-to card has per-level steps.

### Known gaps and person checks

- **No variety inside a level.** Levels 2–5 are the same drag with more baskets; level 6 only removes the fruit cue. The ladder deepens in count, never in the decision.
- **Color is the only cue on a basket** (a cloth band). A color-blind grown-up or child cannot tell red from green by band alone; the spoken color on pickup helps, the basket has no spoken name. Observe with a person; do not treat as a bug yet.
- **Level 1 has one basket, so a miss is impossible.** Fine as drag practice; it gives adaptation no evidence, so a smooth round steps her up with no signal about color.
- **A lap level that is not a lap game.** Lap's only level is dragging a fruit, which a one-year-old rarely does on purpose; a tap would suit her better (see the easy entry below).
- **Level 7's two blues** differ only by tint: the light balloon is white tinted `0xa9d3ff`, the dark blue is tinted `0x5a7fb5`. Contrast on a small iPad in sunlight is a device check; the rule test cannot see it.
- Hint wording for level 6 repeats "That one is red. Find the red basket!", which names the answer. It matches the project rule (a spoken hint, a glow after two) but is the most it can do.
- The leveling note (`levels`/`describeLevel`) lists balloons and flowers at level 6 only; a new kind would need the description to follow.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Montessori color tablets, boxes 1–3](https://montessorimom.com/lesson-day-96-color-tablets/) | Physical, ages about 2.5–5 | Box 1: three primary pairs to match; Box 2: eleven pairs; Box 3: nine colors in seven graded shades, ordered darkest to lightest | The built level 7 is the Box 3 idea in miniature. A later three-shade level is the next step on the same rail: match first, grade after | The adult-led presentation script; the sunburst needs a shaped layout |
| [Sorting Puzzles for Kids / TinyHands Sorting](https://apps.apple.com/us/app/tinyhands-sorting-1-full-version/id722162549) | Touch app, age 2+ | Twelve boards: some sort by shape or color alone, one by shape and color together | One-attribute boards before a two-attribute one | The fixed boards; they never vary |
| [Sorting Stones](https://apps.apple.com/us/app/id1488727740) | Touch app | Introduces one criterion (shape, color or size) before combining | The order: one criterion, then another, then both | Whatever its in-app flow does beyond that |
| [Sorting Colors and Shapes](https://apps.apple.com/us/app/sorting-colors-and-shapes/id1204604485) | Touch app, ten stages | Color stage before a shape stage | The same order, as separate rules rather than a rule change in a round | A stage list with no rule shown |
| JumpStart Baby (Color Train, named in [IDEAS](../IDEAS.md#candidates)) | Classic CD-ROM | A tap sends the next thing to the car of its color; the pet names both | The tap-only entry for a one-year-old (below) | — |
| Laundry, socks, toy tidy-up | Off-screen | The real thing: sort by color, then by kind, then both | The co-play line | — |

Developmental reference: sorting into given categories and counting each group is [Common Core K.MD.B.3](https://tasks.illustrativemathematics.org/content-standards/K/MD/B/3) (kindergarten, categories up to ten items), the pre-K ceiling here. Montessori age ranges for the tablets vary by source (blogs and retailers, not primary sources): treat them as approximate. No timer, lives or streak appears in any reference worth borrowing.

## What makes sense here

- **Add decisions, not baskets.** The ladder already reaches six baskets; more baskets only add scanning. Real depth is changing *what she sorts by* (color, kind, shade) and sorting the same pile two ways.
- **A tap entry for lap and the youngest toddlers**, because dragging is the real barrier at about one year (the developer's daughter is one in October 2026). Tapping an item sends it to its own basket and the pet names the color. There is nothing to choose, so it is a naming-and-watching game, which is the right lap game; the choice begins at level 2.
- **A rule shown by a picture**, so the rule never needs reading: a small sign over the tree shows a color swatch trio or a fruit and a balloon, and the pet says the rule.
- **Three-shade grading and the two-way sort** are the pre-K ceiling. Anything beyond (sort by size, then by color) belongs to Size Parade or Shape Sorter, which already own those attributes.
- **Left out:** a timed "belt" version (Factory Sort in IDEAS, overlaps and adds speed), color mixing (a different game), and a counting-the-baskets step, which is [K.MD.B.3](https://tasks.illustrativemathematics.org/content-standards/K/MD/B/3) but would be better as a level of Picture Graph.

## Experience and presentation

- **First unsupported action:** pick up a fruit and drag it toward a basket. Level 1 cannot go wrong; at level 2 she can guess.
- **Touch-down and consequence:** the pickup tick and spoken color are immediate; the right drop gives a bounce, a bell and stars. The next action returns to a ready tree at once; a wrong drop springs back with a shake.
- **Variety on replay:** the baskets' colors and the order on the tree change; slice 1 adds mixed kinds at level 6. There is one fruit per color, so no more fruit is invented.
- **Reasoning versus motor versus reading:** all drags are large (items scaled 0.78, baskets 130–160 wide), no reading, and no memory load. Level 5–6 push scanning and motor precision more than reasoning; the new levels add reasoning without more precision.
- **Supported completion and stopping:** two wrong drops of one item glow the basket, so every round ends with a sticker; the finale is a natural stopping point and "again" replays.
- **Co-play:** one grown-up asks "which basket would you pick?" before the drop; a sibling sorts a second pile; at the two-way sort, one chooses the rule. Solo stays whole.
- **Art and feel example (code-drawn, no new files):** a *rule sign* hanging from a branch: either three rounded swatches in a row (red, yellow, blue) or a small apple, balloon and flower, drawn with `swatch`, `prop()` and `roundRect`; it bobs once when the pet announces the rule. The sorted items could also bump the basket's color band so a full basket reads as "the reds".
- **Needs a person or device:** whether a one-year-old taps the tap-entry tree on purpose (iPad); level 7 and the three-shade level in sunlight; whether four baskets in a 2×2 grid read clearly in portrait.

## Proposed ladder

### Fresh content inside existing levels

- **Level 6 mixes fruit among the balloons and flowers** for the same six colors, so "red" is an apple, a balloon or a flower in one round and the kind never gives the color away. This is the honest meaning of "a bigger pool" here: no new art, only `kind` chosen from `{fruit-for-color, balloon, flower}` by index. Rule test: every item's color is one of the baskets, a round contains all three kinds only at level 6, and the number of items per basket stays at least one. Cost: tiny; the ghost finger already follows `key`.
- **Levels 2–5: a different fruit pair every round is already random**; no change proposed. If the same two or three colors keep returning, track the last colors in the rng seed's stream rather than adding state (nothing to build now).
- **Level 7: a few more blue things** is not possible with the current pool (balloons and flowers, tinted). Leave it.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | Color or kind | preschool, pre-K | Two baskets and a pile of 8 mixed things: red apples, red balloons, yellow lemons and yellow balloons. A sign over the tree shows the rule for this round: either two swatches (red, yellow) or an apple and a balloon. The pet says it | What to look at: the color or what it is. Same pile, different basket | A wrong basket: boing and the pet says the item's *property of the rule* ("That is a balloon; balloons go here"); a glow after two. Rule shown again on any miss. A sign never goes away | The pile contains each (color, kind) combination at least once, a rule's items all have exactly one valid basket, and both rules are generated across seeds. A round with both rule kinds never occurs in one round | New sign art (`roundRect` swatches and `prop()` icons), voice lines for rule announcement and wrong, how-to step scoped to level 8, ghost finger follows the same `nextToSort` once the key is "the rule's value". The IDEAS "Color and kind: red fruit only" row is this level built without the sign; this write-up supersedes it |
| 9 | Light, middle, dark | pre-K | Three baskets of one color's shade (blue, then red, green, purple across seeds): light, middle and dark. Six to nine things | Three shades of one color: the middle one is the new decision | Spoken "That one is a light blue; find the light basket"; glow after two | Shades differ by a fixed minimum on `tint` luminance, so any item is nearest to exactly one basket; every shade appears at least once | New shade tints per color (each from `swatch`); extends `SHADE_LOOK` into a table, which touches level 7's code but not its behavior; voice lines `tone.middle`; contrast needs a device check |
| 10 | Two ways at once | pre-K | Four baskets in a 2×2 grid: red apple, red balloon, yellow lemon, yellow balloon (labels as tiny pictures). 10 items | Both the color and the kind | Wrong basket says which of the two properties was wrong ("right color, but that is a balloon") | Each item has exactly one valid basket; a 2×2 round contains all four basket types; the wrong-basket line names the property that does not match | The grid layout (view-fit in `resize`); a long spoken line; the first level where a hint has two parts; K.MD.B.3 level. Needs a person check at pre-K |

Dependency: level 8's sign art is reused by 10. Levels 9 and 10 are independent; build 8 first.

### Younger-band openings

- **Lap and early toddler: "Tap and it hops".** The tree has 4 items of 2 colors; tapping an item (a large tap, no drag) sends it hopping into its basket; the pet names the color. There is nothing to choose. Window: lap and toddler, easier than level 1. Appended as the next free ID (level 8's number is taken by Color or kind, so the entry takes the next ID the build assigns, with `entryLevels` and `order` placing it first for lap and toddler). Mistakes: none are possible; the glow never shows. Rule test: all items route to their own basket; two baskets of distinct colors. Cost: a tap path in `index.ts` (using `onTap`), voice lines for the naming, how-to step, `touchDemo` bot. Replaces JumpStart Baby's Color Train as a Color Garden mode, so IDEAS' "Color Train" rows point here.
- **Toddler (the existing 2–5): no change.**

### Easier entries and levels between existing ones

- The tap entry above is the only one. It must be appended and placed with `order`/`entryLevels` (the built support), never renumbering levels 1–7 or saved pins.
- A "color band speaks" support (the pet names a basket's color when she touches it, not just when she picks up an item) is an optional support for any level, not a level; it helps colorblind players and young players. Decide if wanted: see below.

### Left out on purpose

- Speed, a conveyor, a countdown, a limited number of drops: against the project's rules.
- Counting the sorted items per basket: a Picture Graph level.
- Sorting by size or shape: Size Parade, Shape Sorter.
- Color mixing: its own game.
- Inventing a second fruit per color: the pool of unmistakable fruit is exact (apple, orange, lemon, pear, blueberries, grapes).

## Decisions for the developer

None blocks the first slices. Optional: whether baskets should speak their color on touch (an accessibility support that changes feedback in every level), and whether the tap entry should be lap-only or also the first toddler level.

## Build slices, in order

1. **Mixed kinds at level 6** (built 2026-10-14, `claude/color-garden-mixed-kinds`; fresh content): choose fruit, balloon or flower per item with the seeded rng; update `describeLevel`, a rule test, and the GAMES.md entry. Tier: new levels on an existing interaction, rule tests plus one filtered browser play of level 6 and `fingerdemo`.
2. **Tap and it hops** (lap and toddler entry): the tap path, two baskets, naming, `entryLevels` and `order`; how-to step, `touchDemo` bot. Tier: new interaction: typecheck, unit tests, one scripted play, one portrait screenshot.
3. **Level 8, Color or kind**: the rule sign, the two rules, voice lines, how-to. Same tier as above.
4. **Level 9, Light, middle, dark**: refactor `SHADE_LOOK` to a table and add the middle shade. Includes a device check for contrast.
5. **Level 10, Two ways at once**: the 2×2 layout and two-part hints. Last because it is the heaviest and needs the level 8 sign.

## What was built in this session

The deep dive session itself built nothing: it was research and ideation only. Links and `git diff --check` ran.
