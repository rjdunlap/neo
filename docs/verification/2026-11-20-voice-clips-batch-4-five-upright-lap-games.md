# 2026-11-20 — Voice clips batch 4: five more upright lap games (PR #1928)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `bounce`, `peek`, `go`, `jelly` and `egg` (Bounce Back, Peekaboo Barn, Stop and Go, Jelly Drums, Egg Catch). Rendered 80 new slot-free clips (596 in all, 516 before); `src/audio/clips` grew by 1,416,826 bytes (+1.42 MB); the service-worker precache went from 708 to 788 entries and to 24,654.13 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 781 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
