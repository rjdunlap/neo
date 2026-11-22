# 2026-11-22 — Voice clips batch 24: eight more games (PR #1970)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `lasso`, `lemon`, `trails`, `light`, `log`, `lg`, `lookitup` and `lost-layers` (Lasso Loops, Lemonade Stand, Letter Trails, Light Lab, Log Roll, Logic Grid, Look It Up, Lost Layers), the next games alphabetically after Lantern Lights. Rendered 140 new slot-free clips (3047 in all, 2907 before); `src/audio/clips` grew by 3,001,802 bytes (+2.86 MB); the service-worker precache went to 3259 entries and 69,850.81 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 3252 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
