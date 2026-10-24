# Duck Pond illustrated friend (R22 / RW14 slice 6)

Chosen sources stay untouched in [the generated-art manifest](../../../docs/rework/concepts/generated/README.md): `duck-base-2.png` and `duck-portrait-2.png`, with generation prompts and provenance there. Reproduce both prepared transparent PNGs from the repository root:

```sh
node scripts/creature-art/prepare-sprite.mjs --set duck --shrink 2 --out-dir src/art/friends --check
```

The existing pipeline keys paper at full resolution, trims, adds 8 pixels of padding and downsamples in premultiplied alpha. No generation or hand painting is involved. `--check` writes light/dark/checker previews under ignored `test-results/`.

| File | Size | SHA-256 |
| --- | --- | --- |
| duck-base.png | 451 × 486 | `2d7e3793c562211292525a581f9223c6e36881db454deb2330370f684b13207e` |
| duck-portrait.png | 443 × 583 | `deb5749ef1fff12dbbc400081138ba4295f2f024610c1e750616467bfd1d13c5` |

`IllustratedDuck` uses only the base, fitted to Critter's 250-unit height with feet at the origin; existing caller scales and hit circles stay intact. Its inner container bobs, squashes and hops on the game's frame clock, and tilts when resting. The still has no expression swaps or mesh. Ducks share the asset cache, attaching an already decoded texture synchronously for immediately rendered stickers; destroying an instance frees its display children, never the shared texture. A load finishing after destruction does nothing; a failed decode retains the drawn fallback. The prepared portrait is retained for this pilot's pair but has no new UI consumer and is not bundled.

Only Duck Pond uses this class (rounds, icon and stickers). Other games still draw their ducks. Browser proof is a visual/layout check; broader adoption waits for the developer's iPad judgement with RW14 slice 4.
