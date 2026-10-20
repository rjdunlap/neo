# Collection art (RW05 slice 1)

Prepared pictures for the first collection surfaces: the portraits on the Friends cards and the chooser, the card paper behind them, and the sprout's egg in the hatch. The species' rigs and their expression sets are in [`src/art/creatures/illustrated/`](../../art/creatures/illustrated/README.md). Everything here is loaded once at boot by `loadCollectionArt()` (`../companion.ts`) and precached for offline play.

Sources are the chosen rows of the [generated manifest](../../../docs/rework/concepts/generated/README.md) (R02, R03, R07, R08, R17, R18), untouched. Each file below was cut by `scripts/creature-art/prepare-sprite.mjs` from the repository root; re-running a command gives the same bytes.

## Commands

```bash
G=docs/rework/concepts/generated; O=src/creatures/art; P=scripts/creature-art/prepare-sprite.mjs
node $P --in $G/egg-sprout-2.png       --out $O/egg-sprout.png       --shrink 2
node $P --in $G/egg-sprout-crack-1.png --out $O/egg-sprout-crack.png --shrink 2
node $P --in $G/egg-sprout-open-1.png  --out $O/egg-sprout-open.png  --shrink 2
node $P --in $G/sprout-portrait-2.png  --out $O/sprout-portrait.png  --shrink 4
node $P --in $G/river-portrait-2.png   --out $O/river-portrait.png   --shrink 4
node $P --in $G/glider-portrait-8.png  --out $O/glider-portrait.png  --shrink 4
node $P --in $G/card-paper-2.png       --out $O/card-paper.png       --shrink 4 --pad 0 --bg transparent
```

| File | Source | Size (px) | Origin (source px under the padded top-left) | Creature bounds (source px: x, y, w, h) |
| --- | --- | --- | --- | --- |
| `egg-sprout.png` | `egg-sprout-2.png` (R08) | 436 × 536 | 189, 107 | 205, 123, 840, 1039 |
| `egg-sprout-crack.png` | `egg-sprout-crack-1.png` (R18) | 436 × 536 | 189, 107 | 205, 123, 840, 1039 |
| `egg-sprout-open.png` | `egg-sprout-open-1.png` (R18) | 436 × 576 | 189, 26 | 205, 42, 840, 1120 |
| `sprout-portrait.png` | `sprout-portrait-2.png` (R02) | 216 × 255 | 224, 120 | 256, 152, 800, 953 |
| `river-portrait.png` | `river-portrait-2.png` (R03) | 239 × 238 | 233, 164 | 265, 196, 892, 887 |
| `glider-portrait.png` | `glider-portrait-8.png` (R17) | 319 × 273 | −2, 79 | 30, 111, 1210, 1026 |
| `card-paper.png` | `card-paper-2.png` (R07) | 314 × 314 | 0, 0 | the whole opaque card |

**The egg's stages are cut one by one and placed by their origins.** `--set` shares a box only across the six expression names, and the open stage's lifted cap trims 80 source pixels taller, so each stage keeps its own trim. All three share the left origin (189) and their bottom edges land on the same source row within one pixel (107 + 536 × 2 = 1179, 26 + 576 × 2 = 1178), so `makeEgg()` anchors each at its bottom centre and the shell never jumps between taps. A unit test (`../companion.test.ts`) reads the PNG sizes and checks that registration against the origins recorded in `EGG.origins`; re-cut a stage and update both together.

**Portraits** are trimmed on their own at quarter size, about 2 sprite pixels a unit on a 150-unit card (a card draws a portrait at most 120 units). **The card paper** is opaque (R07's notes: not keyed, not trimmed), passed through at quarter size; a card washes it with half of her colour's light shade.

**Colour.** The art is drawn in each species' own colour (sprout teal, river caramel, glider lavender). A child's other colour turns the picture round the colour wheel (`recolor()`, a hue rotation from the species' swatch to hers), because a multiply tint cannot make a teal picture pink. No filter is applied for the species' own colour.

Only the sprout's egg is prepared: the hatch meets only a sprout in this slice (the river and the glider are met through RW07's adventures). The R08/R18 river and glider eggs stay in the manifest.
