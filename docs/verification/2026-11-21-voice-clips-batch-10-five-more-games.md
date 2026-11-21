# 2026-11-21 — Voice clips batch 10: five more games (PR #1934)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `garden`, `tone`, `bumper`, `salon`, `sg` and `shape` (Color Garden, Bumper Garden, Fluffy Salon, Sound Garden, Shape Sorter). Rendered 122 new slot-free clips (1213 in all, 1091 before); `src/audio/clips` grew by 1,992,516 bytes (+1.99 MB); the service-worker precache went from 1283 to 1405 entries and to 35,480.98 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1398 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
