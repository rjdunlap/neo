# 2026-11-21 — RW14 slice 10: the other ten backdrops (PR #1939)

**Changed:** ten location backdrops (R26, made with `scripts/codex-image.sh`, imported and prepared; all eleven location files under 1 MB); a measured `HORIZON` row per picture in `src/art/locations/index.ts`; the location tests now run for every pictured land (spot on ground, cover the view, a horizon band); a light heading (Story Grove, Tinker Lab) gets an ink stroke over a picture in `LandScene`.
**Ran:** typecheck; `npm test` (463 files, 17395 passed, 1 skipped); `npm run build` (precache 1891 entries, 44,168 KiB); a headless probe of all eleven locations at 1024 × 768, 768 × 1024, 844 × 390 and 390 × 844 (44 views: picture shown, no code-drawn scenery, picture covers the view, spots visible, no page errors) with a montage review; `BROWSER_SUITE=home HOME_ONLY=meadow` passed; `npm run test:offline` against a production preview passed (root and classic).
**Not run:** other browser suites (code unchanged).
