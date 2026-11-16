# Sprout’s porch

Original procedural models by Codex, 2026-11-16, based on Puddle Island’s existing Sprout illustration. No third-party models or textures.

- `porch.blend`: editable Blender 5.3 scene with named rigid animation pivots.
- `porch.glb`: browser model, exported with meshes and pivots only.
- `porch.png`: Cycles review still. Browser uses cheaper real-time lighting; this is not a browser screenshot.

Rebuild from the repository root:

```sh
blender --background --factory-startup -t 4 --python scripts/art/sprout-porch.py
```

The script is the source of truth. Edit it to preserve reproducibility. Blender may retain a `.blend1` backup; do not commit that backup. Colors approximate the existing Sprout and island palette, translated to 3D materials. No baked textures, external assets, or random generation.

## Pre-rendered stills (`sprites/`)

The art lab's Pixi view. Rebuild after `porch.blend` changes:

```sh
blender --background src/dev/sprout/porch.blend -t 4 --python scripts/art/sprout-porch-sprites.py
```

It writes the backdrop, Sprout's parts, the ball and `manifest.json` (where each still sits in the 1440-pixel frame, and the pivots). The camera in the script must match `src/dev/art-lab/artlab-3d.ts`.
