# 2026-11-22 — Voice clips batch 25: eight more games (PR #1972)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `makerlane`, `marble`, `shop`, `measure`, `md`, `mn`, `notalways` and `noticeboard` (Maker Lane, Marble Jump, Market Stall, Measuring Post, Memory Desk, Movie Night, Not Always, Notice Board), the next games alphabetically after Lost Layers. Rendered 350 new slot-free clips (3397 in all, 3047 before); `src/audio/clips` grew by 5,815,984 bytes (+5.55 MB); the service-worker precache went to 3609 entries and 75,585.69 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 3602 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
