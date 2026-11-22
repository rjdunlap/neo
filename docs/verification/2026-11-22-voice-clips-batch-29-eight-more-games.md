# 2026-11-22 — Voice clips batch 29: eight more games (PR #1976)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `sealift`, `shed`, `code`, `seeds`, `sense`, `sr`, `sillyscene` and `snowball` (Sea Lift, Second Chance Shed, Secret Code, Seed Travelers, Sense Detective, Shell Rows, Silly Scene, Snowball Merge), the next games alphabetically after Roundup. Rendered 202 new slot-free clips (4327 in all, 4125 before); `src/audio/clips` grew by 3,898,121 bytes (+3.72 MB); the service-worker precache went to 4539 entries and 92,595.14 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 4532 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
