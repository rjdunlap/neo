# Illustrated creature assets

Prepared sprites for the [generated creature pilot](../../../../docs/rework/GENERATED-CREATURE-PILOT.md) and, once the [art request queue](../../../../docs/rework/art-requests/QUEUE.md) delivers them, the collection's species sets. Development preview only: nothing in a production build imports them (checked 2026-10-17: no sprite or preview code in `dist/`, none in the service worker's precache).

## Preparing a sprite

`scripts/creature-art/prepare-sprite.mjs` cuts a generated image into a transparent, trimmed, padded PNG. It is a Node tool that uses the repository's Playwright Chromium only to decode and encode PNGs; the pixel rules live in `sprite-core.mjs` and run under vitest on synthetic images (`prepare-sprite.test.mjs`). Deterministic: the same input and arguments give the same bytes.

```bash
node scripts/creature-art/prepare-sprite.mjs --in <png> --out <png> [--box x,y,w,h] [--seed x,y] [--pad 8] [--scale 0.83] [--check]
node scripts/creature-art/prepare-sprite.mjs --set <species> [--pad 8] [--scale u] [--tolerance 4] [--check]
```

| Argument | Meaning |
| --- | --- |
| `--in`, `--out` | One image in, one sprite out. Paths are relative to the repository root |
| `--box x,y,w,h` | The part of the image to cut, in its pixels (default: the whole image). The sprite is then trimmed to the creature inside the box, so a generated image that holds one creature on a plain background needs no box |
| `--seed x,y` | A pixel on the creature, in the image's pixels (not the box's). Only the shape connected to it is kept, which drops a neighbour's parts on a shared sheet. Without it everything that is not background is kept |
| `--bg auto\|paper\|transparent` | What the background is. `auto` (default) calls a border that is mostly clear transparent, anything else paper |
| `--pad <px>` | Clear pixels round the trimmed creature (default 8) |
| `--scale <units>` | Creature units per sprite pixel; the summary then also reports the sprite's size in units, for the rig's `*_ART` table |
| `--tolerance <px>` | How far a set's variant may differ from its base before the run refuses (default 4) |
| `--check` | Also write light, dark and checkerboard previews at 2× (`test-results/<out name>-light.png` and so on; `--previews <prefix>` moves them) |
| `--set <species>` | Prepare the species' whole set from the generated manifest (below). `--generated <dir>` and `--out-dir <dir>` move the folders, for tests |

**Background.** A flat white, or the concept sheet's cream, is keyed out: the paper colour is the median of the box's border, paper floods inward from the border through pixels within a colour distance of 34, stopping at the ink outline, and a two-pixel edge is un-mixed (a pixel next to the paper takes the strongest colour just inside it and an alpha from how far toward that colour it lies), so no cream fringe shows on a dark ground. A transparent input is passed through: its pixels keep their colours and alpha, alpha below 8 becomes clear, and only the edge changes, a partly transparent pixel taking the colour of the nearest opaque pixel within two (keeping its alpha) so a generator's white or black halo disappears.

**Species sets and the alignment rule.** `--set <species>` reads `docs/rework/concepts/generated/README.md`, takes every table row whose File is `<species>-<asset>-<n>.png` and whose Chosen column says `yes` (also `x`, `✓` or `chosen`), and writes `src/art/creatures/illustrated/<species>-<asset>.png` for each. The expression variants (`base`, `blink`, `happy`, `surprised`, `sleepy`, `sad`) are swapped under one mesh, so they are cut with **one shared box**, the union of their trimmed bounds plus the padding, and every one of them comes out the same size with the same source origin. Before anything is written, each variant's trimmed bounds are compared with the base's: if any edge differs by more than the tolerance (4 px), the run stops and prints each drifted file's left, top, right and bottom offsets, and nothing is written; re-roll that variant in the queue rather than loosening the tolerance. A `portrait` and an `alt` pose are different pictures and are trimmed on their own. The summary line per sprite gives its size, its source origin (the image pixel under the padded top-left) and the creature's bounds, which is where a rigging session starts reading its [anchor points](../../../../docs/rework/art-requests/GAME-FIT.md#anchor-points-a-rigging-session-records).

## `glider.png`

| | |
| --- | --- |
| Source | The "Illustrated adventure" glider on the [concept sheet](../../../../docs/rework/concepts/art-directions-2026-10-16.png), a generated image from the 2026-10-16 rework design conversation. Its tool, prompt and settings were not recorded, so the sheet itself is the source of record. No new image was generated for this pilot (the building session had no image-generation tool); see the pilot packet |
| Sheet box | x 528, y 262, 462 × 194 px; the trimmed sprite's top-left is at sheet (527, 257) including padding |
| Output | 458 × 206 px RGBA PNG, about 99 KB, 8 px transparent padding |
| Rebuild | `node scripts/creature-art/prepare-glider.mjs` (add `--check` for light, dark and checkerboard previews in `test-results/`), a thin wrapper that runs `prepare-sprite.mjs` with `--box 528,262,462,194 --seed 925,360 --bg paper --pad 8 --scale 0.83`. Byte-identical to the committed file (checked 2026-10-17 after the generalization) |
| Preparation | Crop; flood-fill the cream paper (RGB 252, 243, 225, distance < 34) from the border; keep the shape connected to the eye; un-mix a two-pixel edge against the ink just inside it, so no cream fringe shows on dark ground |
| Scale | 0.83 creature units per pixel, so it spans the Graphics glider's ≈380 units and uses the same stage (0.8) and card (0.32) scales |
| Points (sprite px) | Centre (240, 105) sits at the creature's origin; wing root (350, 115); wing tip (105, 45); lower tip (230, 195); eyes (404, 100) r 11 and (437, 97) 4.5 × 8; crown slot (410, 70), drawn 36 units wide. All recorded in `GLIDER_ART` in `../glider-illustrated.ts` |
| Rig | A 30 × 14 `PlaneGeometry` mesh. Per-vertex weights (`weights()`) pin the body and face, bend the wing by distance from its root along the root→tip line, beat the far fin against it and ripple the ribbons behind the trailing edge. Blink lids are drawn over the painted eyes |
| Runtime | Mipmapped on load for the collection card |

## Usage terms

The concept sheet was generated inside the developer's own design session for this project and is committed in the repository; no third-party stock art or traced character is used. The generating service's output terms apply to it as they did when it was committed; they were not re-checked here.
