# 2026-11-20 — Voice clips batch 3: five upright lap games (PR #1927)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `paint`, `munch`, `tower`, `mail` and `helpers` (Rainbow Fingers, Monster Munch, Block Tower, Mail Carrier, Little Helpers). Rendered 105 new slot-free clips (516 in all, 411 before); `src/audio/clips` grew by 1,776,610 bytes (+1.78 MB); the service-worker precache went from 603 to 708 entries and to 23,257.61 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 701 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
