# 2026-11-20 — Voice clips batch 5: five more upright lap games (PR #1929)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `bath`, `night`, `fill`, `gobble` and `parade` (Splish-Splash, Goodnight Room, Fill and Dump, Puddle Gobble, Duckling Parade). Rendered 62 new slot-free clips (658 in all, 596 before); `src/audio/clips` grew by 1,084,191 bytes (+1.08 MB); the service-worker precache went from 788 to 850 entries and to 25,722.96 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 843 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
