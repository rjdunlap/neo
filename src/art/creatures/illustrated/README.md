# Illustrated creature assets (RW02b pilot)

Prepared sprites for the [generated creature pilot](../../../../docs/rework/GENERATED-CREATURE-PILOT.md). Development preview only: nothing in a production build imports them (checked 2026-10-17: no sprite or preview code in `dist/`, none in the service worker's precache).

## `glider.png`

| | |
| --- | --- |
| Source | The "Illustrated adventure" glider on the [concept sheet](../../../../docs/rework/concepts/art-directions-2026-10-16.png), a generated image from the 2026-10-16 rework design conversation. Its tool, prompt and settings were not recorded, so the sheet itself is the source of record. No new image was generated for this pilot (the building session had no image-generation tool); see the pilot packet |
| Sheet box | x 528, y 262, 462 × 194 px; the trimmed sprite's top-left is at sheet (527, 257) including padding |
| Output | 458 × 206 px RGBA PNG, about 99 KB, 8 px transparent padding |
| Rebuild | `node scripts/creature-art/prepare-glider.mjs` (add `--check` for light, dark and checkerboard previews in `test-results/`). Deterministic; uses only the repository's Playwright Chromium |
| Preparation | Crop; flood-fill the cream paper (RGB 252, 243, 225, distance < 34) from the border; keep the shape connected to the eye; un-mix a two-pixel edge against the ink just inside it, so no cream fringe shows on dark ground |
| Scale | 0.83 creature units per pixel, so it spans the Graphics glider's ≈380 units and uses the same stage (0.8) and card (0.32) scales |
| Points (sprite px) | Centre (240, 105) sits at the creature's origin; wing root (350, 115); wing tip (105, 45); lower tip (230, 195); eyes (404, 100) r 11 and (437, 97) 4.5 × 8; crown slot (410, 70), drawn 36 units wide. All recorded in `GLIDER_ART` in `../glider-illustrated.ts` |
| Rig | A 30 × 14 `PlaneGeometry` mesh. Per-vertex weights (`weights()`) pin the body and face, bend the wing by distance from its root along the root→tip line, beat the far fin against it and ripple the ribbons behind the trailing edge. Blink lids are drawn over the painted eyes |
| Runtime | Mipmapped on load for the collection card |

## Usage terms

The concept sheet was generated inside the developer's own design session for this project and is committed in the repository; no third-party stock art or traced character is used. The generating service's output terms apply to it as they did when it was committed; they were not re-checked here.

## In progress

Generalizing the preparation script into `prepare-sprite.mjs` (file, box, seed, transparent input, `--set <species>`) on `claude/prepare-sprite-tool`; `prepare-glider.mjs` stays as a thin wrapper.
