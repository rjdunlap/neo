# 2026-11-21 — Voice clips batch 8: four more games (PR #1932)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `bolt`, `meadow`, `buddies` and `lift-it` (Bolt Boards, Meadow Pens, Shape Buddies, Lift It). Rendered 139 new slot-free clips (1001 in all, 862 before); `src/audio/clips` grew by 2,772,939 bytes (+2.77 MB); the service-worker precache went from 1054 to 1193 entries and to 31,894.15 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1186 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
