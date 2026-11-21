# 2026-11-21 — Voice clips batch 9: five more games (PR #1933)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `puzzle`, `neighbors`, `song`, `doctor` and `safari` (Puzzle Pals, Rhythm Neighbors, Song Maker, Teddy Doctor, Photo Safari). Rendered 90 new slot-free clips (1091 in all, 1001 before); `src/audio/clips` grew by 1,645,647 bytes (+1.65 MB); the service-worker precache went from 1193 to 1283 entries and to 33,516.09 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1276 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
