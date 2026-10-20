# Prepared wearables

The nine generated wearables (art requests R04–R05, [manifest](../../../../docs/rework/concepts/generated/README.md#r04-review-and-preparation-notes)) cut for the illustrated rigs, RW06 prep (2026-10-20). Sizes and anchors are in `ITEM_ART` (`../wearables.ts`); where each sits on a species is that rig's `*_WEAR` table (`SPROUT_WEAR`, `RIVER_WEAR`, `GLIDER_WEAR`). The root's creature preview dresses the illustrated column through its third button: nothing, each item, then a sunny, a rainy and a snowy outfit. Served at the site root, so the sprites are in the production build and the service worker's precache (nine files, about 1.0 MB; the precache was 92 entries, 8.06 MB, after this slice).

## How they were cut

At a third of the 1254 px originals, which keeps about 2 sprite pixels per logical unit at the sizes they are worn. Two items enclose white paper the border flood cannot reach, so their middles are named with `--hole` (a white dot on the umbrella is painted, enclosed the same way, and stays because no hole names it). Boots and mittens are pairs of the same item, so one of each is cut with `--seed` and drawn twice. Re-running a line gives the same bytes.

```bash
G=docs/rework/concepts/generated; O=src/art/creatures/wearables
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-crown-3.png      --out $O/crown.png      --shrink 3 --hole 620,600
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-scarf-3.png      --out $O/scarf.png      --shrink 3 --hole 630,425
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-sunhat-2.png     --out $O/sunhat.png     --shrink 3
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-sunglasses-3.png --out $O/sunglasses.png --shrink 3
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-raincoat-1.png   --out $O/raincoat.png   --shrink 3
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-umbrella-3.png   --out $O/umbrella.png   --shrink 3
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-beanie-1.png     --out $O/beanie.png     --shrink 3
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-boots-4.png      --out $O/boot.png       --shrink 3 --seed 300,600
node scripts/creature-art/prepare-sprite.mjs --in $G/wear-mittens-1.png    --out $O/mitten.png     --shrink 3 --seed 900,500
```

| Sprite | Size (px) | Origin (source px under the padded top-left) | Anchor (sprite px) |
| --- | --- | --- | --- |
| `crown.png` | 412 × 252 | 11, 246 | 204, 118 (the ring's open middle) |
| `scarf.png` | 369 × 325 | 80, 160 | 183, 88 (the neck hole) |
| `sunhat.png` | 422 × 239 | −2, 264 | 205, 145 (under the band) |
| `sunglasses.png` | 416 × 208 | 4, 309 | 272, 118 (between the lenses) |
| `raincoat.png` | 380 × 319 | 81, 166 | 190, 38 (the collar) |
| `umbrella.png` | 408 × 332 | 21, 138 | 255, 255 (the grip above the hook) |
| `beanie.png` | 358 × 358 | 107, 98 | 179, 300 (the brim's opening) |
| `boot.png` | 192 × 220 | 48, 294 | 90, 205 (the sole) |
| `mitten.png` | 205 × 264 | 632, 233 | 100, 150 (the palm) |

## The fit on the pilot three

Judged in the preview at rest and through touches (landscape and portrait), each item on each rig. **Fits** sit where the table puts them; a **species** misfit is the body plan (the species has no place for it, and no picture would change that); an **angle** misfit is the drawing (drawn for another view or body), and is asked for again as [R19](../../../../docs/rework/art-requests/QUEUE.md#r19-wearables-at-the-casts-angle).

| Item | Sprout | River | Glider |
| --- | --- | --- | --- |
| Crown | fits (rides the head, not the leaves) | fits | fits |
| Scarf | fits; drawn from a little above, so its open middle shows on the chest | fits | species: no neck |
| Sun hat | fits (rides the head; the leaves show behind the crown) | fits | fits |
| Sunglasses | fits: already three-quarter, the near lens on the near eye | fits; the far lens sits on the brow above the hidden eye | fits |
| Raincoat | **angle**: drawn for an upright body with long arms; the sleeves stand off its stubby arms and it sits on the belly like a bib | **angle**: drawn upright from the front; on a level body it hangs off the back like a flag | species: one wing, which a coat would hide |
| Umbrella | fits, held behind the paw like a parasol (the paw does not close round the handle) | species: walks on all four paws | species: nothing holds |
| Beanie | fits | fits | fits |
| Boots | **angle**: its feet face the viewer, soles out, so a side-on boot stands beside the foot | fits: side-on, four boots on four paws, the far two behind the body | species: never stands |
| Mittens | fits, riding the wagging arms | species: its front paws walk, and wear the boots | species: nothing to hold with |

So the review's expectation (sunglasses, raincoat, mittens and boots fail) was half right: the raincoat fails on both bodies that could wear one, the boots on the sitter only, and the sunglasses and mittens fit. Items on a moving part ride the mesh vertex nearest their point (`IllustratedCreature.pin`), so mittens follow the sprout's arms and the river's boots its legs; a fit can name a different point to ride (`ride`), which keeps the sprout's crown and sun hat on the pinned head while the leaves above them sway.

**Not established:** how any of it reads on an iPad or to a two-year-old; occlusion beyond in front or behind the whole picture (the crown's back half is drawn over the head, not behind it); the umbrella in a closed paw.
