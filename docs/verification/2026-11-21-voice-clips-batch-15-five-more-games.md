# 2026-11-21 — Voice clips batch 15: five more games (PR #1957)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `says`, `memory`, `slice`, `around` and `walk` (Pet Says, Memory Match, Fruit Slice, Peekaround Island, Adventure Walk). Rendered 151 new slot-free clips (1944 in all, 1793 before); `src/audio/clips` grew by 2,286,595 bytes (+2.29 MB); the service-worker precache went to 2156 entries and 48,511.26 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed: production reload, cached font and assets (2149), lands map and home spot, a how-to card and Play, new-game completion, reward, saved progress, Windy Picnic, treehouse and journal offline across reloads).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
