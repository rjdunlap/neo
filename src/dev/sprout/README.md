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
