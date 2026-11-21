# Location pictures

Each location's illustrated backdrop, `<land-id>.webp`, and its 480 × 360 Places card, `<land-id>-card.webp` (RW14 slice 4, [docs/rework/POLISH.md](../../../docs/rework/POLISH.md#slice-4-the-illustrated-rainbow-meadow-and-postcards-in-places)). `index.ts` finds them by name with `import.meta.glob`, the root loads them at boot, and a location without a file (or whose file fails to load) keeps its code-drawn scenery; `classic/` never loads them.

All eleven locations are pictured (the ten R26 backdrops arrived 2026-11-21 as `docs/rework/concepts/generated/land-<place>-1.png`; the file names are the land IDs, so Canyon is `treehouse.webp`). `rainbow-meadow.webp` (70 KB) and its card (14 KB) are prepared from the chosen R23 candidate `docs/rework/concepts/generated/land-meadow-5.png` by the import script ([IMPORT.md](../../../docs/rework/art-requests/IMPORT.md)), after `npm ci`:

```bash
node scripts/art/import-inbox.mjs --choose land-meadow-5.png
```

Each picture's ground begins at its own measured row of 1024 (the meadow's is 395; `HORIZON` in `index.ts`, the lowest edge of the landmarks across the width the spots use; a picture without an entry is taken at 38%). `pictureFit` puts that row on the location's ground line, where `landLayout` stands the spots, and cover-scales the rest. Keep each file under 1 MiB (the offline precache drops files over 3 MiB).
