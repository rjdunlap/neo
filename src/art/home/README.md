# Home's backdrop

`home-day.webp` is the root Home's day backdrop (RW06 slice 2, [docs/rework/HOME.md](../../../docs/rework/HOME.md#home-homescene-the-roots-hub)), prepared from the R06 candidate `docs/rework/concepts/generated/home-day-3.png` (1536 × 1024, about 1.9 MB) at its full size, 150 KB, well under the 1 MiB budget that keeps it inside the 3 MiB per-file precache limit:

```bash
node -e "require('sharp')('docs/rework/concepts/generated/home-day-3.png').webp({ quality: 82, effort: 6 }).toFile('src/art/home/home-day.webp')"
```

`sharp` is not a direct dependency: it arrives with `@vite-pwa/assets-generator`, so the command runs after `npm ci`. The grass begins at y = 730 of 1024 (`BACKDROP.floor` in `src/creatures/home-layout.ts`); `backdropFit` cover-scales the picture and anchors its bottom to the view's, so the spare dimension shows more sky (portrait) or more of the sides. Dusk (`home-dusk-2`) is not used ([default 2](../../../docs/rework/HOME.md#decisions-defaults-the-build-uses)).
