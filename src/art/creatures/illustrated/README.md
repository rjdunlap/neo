# Illustrated creature assets

Prepared sprites for the [generated creature pilot](../../../../docs/rework/GENERATED-CREATURE-PILOT.md): the pilot three species' expression sets, cut from what the [art request queue](../../../../docs/rework/art-requests/QUEUE.md) delivered (R01–R03). Used by the preview and, since RW05 slice 1 (2026-10-20), by the shipped companion and Friends (precached; production precache 81 entries, 8.2 MB, before the [prepared wearables](../wearables/README.md) joined them). The rigs that draw them are `../illustrated.ts` (shared) and `../<species>-illustrated.ts`.

## Preparing a sprite

`scripts/creature-art/prepare-sprite.mjs` cuts a generated image into a transparent, trimmed, padded PNG. It is a Node tool that uses the repository's Playwright Chromium only to decode and encode PNGs; the pixel rules live in `sprite-core.mjs` and run under vitest on synthetic images (`prepare-sprite.test.mjs`). Deterministic: the same input and arguments give the same bytes.

```bash
node scripts/creature-art/prepare-sprite.mjs --in <png> --out <png> [--box x,y,w,h] [--seed x,y] [--pad 8] [--scale 0.83] [--check]
node scripts/creature-art/prepare-sprite.mjs --set <species> [--shrink 2] [--pad 8] [--scale u] [--tolerance 4] [--check]
```

| Argument | Meaning |
| --- | --- |
| `--in`, `--out` | One image in, one sprite out. Paths are relative to the repository root |
| `--box x,y,w,h` | The part of the image to cut, in its pixels (default: the whole image). The sprite is then trimmed to the creature inside the box, so a generated image that holds one creature on a plain background needs no box |
| `--seed x,y` | A pixel on the creature, in the image's pixels (not the box's). Only the shape connected to it is kept, which drops a neighbour's parts on a shared sheet. Without it everything that is not background is kept |
| `--hole x,y` | A paper pixel the border cannot reach, in the image's pixels (a crown's open middle, a scarf's neck hole); paper floods from it too. Repeat for each hole. Without it nothing enclosed is cleared, so a painted white dot stays |
| `--bg auto\|paper\|transparent` | What the background is. `auto` (default) calls a border that is mostly clear transparent, anything else paper |
| `--pad <px>` | Clear pixels round the trimmed creature, in the sprite's pixels (default 8) |
| `--shrink <n>` | Write the sprite at 1/n size (a whole number; default 1). The creature is keyed out and trimmed at full size, the box grows to a multiple of n (to the right and down, into clear pixels), and each n × n block is averaged in premultiplied alpha, so a soft edge keeps the ink's colour and no clear pixel bleeds into it. The summary's `origin` and `bounds` stay in the source's pixels; `size` and `units` are the sprite's |
| `--scale <units>` | Creature units per sprite pixel; the summary then also reports the sprite's size in units, for the rig's `*_ART` table |
| `--tolerance <px>` | How far a set's variant may differ from its base before the run refuses (default 4) |
| `--check` | Also write light, dark and checkerboard previews at 2× (`test-results/<out name>-light.png` and so on; `--previews <prefix>` moves them) |
| `--set <species>` | Prepare the species' whole set from the generated manifest (below). `--generated <dir>` and `--out-dir <dir>` move the folders, for tests |

**Background.** A flat white, or the concept sheet's cream, is keyed out: the paper colour is the median of the box's border, paper floods inward from the border through pixels within a colour distance of 34, stopping at the ink outline, and a two-pixel edge is un-mixed (a pixel next to the paper takes the strongest colour just inside it and an alpha from how far toward that colour it lies), so no cream fringe shows on a dark ground. A transparent input is passed through: its pixels keep their colours and alpha, alpha below 8 becomes clear, and only the edge changes, a partly transparent pixel taking the colour of the nearest opaque pixel within two (keeping its alpha) so a generator's white or black halo disappears.

**Species sets and the alignment rule.** `--set <species>` reads `docs/rework/concepts/generated/README.md`, takes every table row whose File is `<species>-<asset>-<n>.png` and whose Chosen column says `yes` (also `x`, `✓` or `chosen`), and writes `src/art/creatures/illustrated/<species>-<asset>.png` for each. The expression variants (`base`, `blink`, `happy`, `surprised`, `sleepy`, `sad`) are swapped under one mesh, so they are cut with **one shared box**, the union of their trimmed bounds plus the padding, and every one of them comes out the same size with the same source origin. Before anything is written, each variant's trimmed bounds are compared with the base's: if any edge differs by more than the tolerance (4 px), the run stops and prints each drifted file's left, top, right and bottom offsets, and nothing is written; re-roll that variant in the queue rather than loosening the tolerance. A `portrait` and an `alt` pose are different pictures and are trimmed on their own. The summary line per sprite gives its size, its source origin (the image pixel under the padded top-left) and the creature's bounds, which is where a rigging session starts reading its [anchor points](../../../../docs/rework/art-requests/GAME-FIT.md#anchor-points-a-rigging-session-records).

## The pilot three (RW02b step 2, 2026-10-19)

Every set below was cut with `node scripts/creature-art/prepare-sprite.mjs --set <species> --shrink 2 --scale <u> --check` from the chosen rows of the [generated manifest](../../../../docs/rework/concepts/generated/README.md) (R01–R03, 1536 × 1024 originals on flat white), at half the generated size: about 2 sprite pixels per logical unit at stage scale, which a 2× iPad resolves without softness and keeps a species' six textures near 4–5 MB on the GPU. The six expressions of a species share one box (the union of their trimmed bounds, which differ by at most 2 px), so they swap under one mesh with no offset; `blink`, `happy`, `surprised`, `sleepy` and `sad` have the same size and origin as the base listed. `--set` also writes the portrait (and the glider's `alt`), which this slice does not keep: RW05 prepares them for the collection cards. The anchor points (face, slots, pinned body, moving parts, touch circle, misfits) are in each rig's `*_ART` table. Re-running the command gives the same bytes.

| Sprite | Source | Size (px) | Origin (source px under the padded top-left) | Creature bounds (source px: x, y, w, h) | Scale (units per px) | On stage |
| --- | --- | --- | --- | --- | --- | --- |
| `sprout-base.png` (+5) | `sprout-base-2.png`, `-blink-1`, `-happy-1`, `-surprised-1`, `-sleepy-1`, `-sad-1` | 478 × 465 | 290, 47 | 307, 63, 616, 836 (shared box) | 0.5 | ≈239 × 233 units; feet on (0, 0) at sprite (250, 458) |
| `river-base.png` (+5) | `river-base-4.png`, `-blink-1`, `-happy-1`, `-surprised-2`, `-sleepy-1`, `-sad-1` | 749 × 324 | 18, 177 | 34, 195, 1433, 420 (shared box; `happy` 2 px taller) | 0.45 | ≈337 × 146 units; feet on (0, 0) at sprite (400, 316) |
| `glider-base.png` (+5) | `glider-base-3.png`, `-blink-2`, `-happy-2`, `-surprised-2`, `-sleepy-2`, `-sad-2` | 761 × 338 | 7, 172 | 23, 188, 1468, 457 (shared box) | 0.5 | ≈381 × 169 units; body centre (0, 0) at sprite (440, 180) |

Each file is 220–260 KB (about 4.3 MB for the eighteen); as RGBA textures a set is 4.4 MB (sprout), 4.9 MB (river) or 5.1 MB (glider) before mipmaps.

**Rigs.** One `PlaneGeometry` mesh per creature (sprout 24 × 24 vertices, river and glider 40 × 18) on the shared `IllustratedCreature` base (`../illustrated.ts`): per-vertex weights pin the face and the body polygon and bend each moving part about its root with a weight that grows toward its tip, so a root never parts from the body: the sprout's two leaves (sway, and a spin on a touch) and arms; a wave down the river's back from the neck to the hips and its tail swishing; the glider's wing as a root-to-tip wave, the dorsal and ventral fins against it and the two ribbons behind the trailing edge. Touch reactions move the whole craft as the Graphics rigs do (the sprout's crouch-hop-squash, the river rearing about its hips, the glider's loop). Expressions are whole textures swapped under the mesh: `surprised` for the first 0.22 s of a touch, then `happy`; `blink` when the base class blinks, while the mood is calm or happy; otherwise the set mood (`calm` shows `base`, or `sleepy`/`sad`). Slots sit in creature units in the craft, so an accessory's strokes are not scaled with the sprite. The textures are loaded once per species by `loadArt()` (mipmapped for the collection card) and shared; a creature frees only its geometry.

## The second wave (RW02b step 3, 2026-10-20)

Tote, Trill, Dapple, Bramble, Mossback and Lumen (queue rows R09-R14) were cut with `node scripts/creature-art/prepare-sprite.mjs --set <species> --shrink 2 --scale 0.5 --out-dir src/art/creatures/cast` into **`src/art/creatures/cast/`**, not this folder. Six expressions per species share one box (all variants within the 4 px tolerance); Tote, Bramble, Mossback and Lumen also keep an `alt` still. Portraits were cut but not kept; RW10's collection book prepares them. 40 PNGs, about 12 MB.

| Species | Base size (px) | `alt` size (px) |
| --- | --- | --- |
| Tote | 623 x 450 | 486 x 386 |
| Trill | 644 x 496 | none |
| Dapple | 734 x 426 | none |
| Bramble | 498 x 482 | 506 x 477 |
| Mossback | 683 x 413 | 549 x 361 |
| Lumen | 623 x 457 | 467 x 474 |

**Why a separate folder.** `illustrated.ts` loads `./illustrated/*-*.png` with a glob, so anything here ships in the production build and the precache. The six are not in the game yet (only the dev preview `/?cast` shows them), so they stay out of the build until RW10 or a species slice moves them. The rigs are in `../cast.ts`; the result and its limits are in [the pilot document](../../../../docs/rework/GENERATED-CREATURE-PILOT.md#step-3-result-2026-10-20).

## Usage terms

The concept sheet was generated inside the developer's own design session for this project and is committed in the repository; no third-party stock art or traced character is used. The generating service's output terms apply to it as they did when it was committed; they were not re-checked here.
