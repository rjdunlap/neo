# 2026-11-22 — Voice clips batch 28: eight more games (PR #1975)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `read`, `ready`, `recipe`, `rhyme`, `ribbon`, `rt`, `robot` and `herd` (Read & Do, Ready for Adventure, Recipe Workshop, Rhyme Time, Ribbon Workshop, River Tablets, Robot Path, Roundup), the next games alphabetically after Ramp Race. Rendered 208 new slot-free clips (4125 in all, 3917 before); `src/audio/clips` grew by 3,522,616 bytes (+3.36 MB); the service-worker precache went to 4337 entries and 88,754.27 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 4330 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
