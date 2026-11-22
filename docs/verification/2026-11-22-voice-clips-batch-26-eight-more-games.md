# 2026-11-22 — Voice clips batch 26: eight more games (PR #1973)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `orchard`, `owl`, `pm`, `pattern`, `pantry`, `graph`, `picture` and `pile` (Orchard Rows, Owl Walk Home, Paint Mixer, Pattern Train, Picnic Pantry, Picture Graph, Picture Logic, Pile Match), the next games alphabetically after Notice Board. Rendered 188 new slot-free clips (3585 in all, 3397 before); `src/audio/clips` grew by 3,588,120 bytes (+3.42 MB); the service-worker precache went to 3797 entries and 79,121.33 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 3790 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
