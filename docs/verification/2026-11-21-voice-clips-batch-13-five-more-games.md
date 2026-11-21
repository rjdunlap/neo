# 2026-11-21 — Voice clips batch 13: five more games (PR #1938)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `monster`, `sound` (both Word Monsters), `little-conductor`, `beat`, `bug` and `rain` (Word Monsters, Little Conductor, Beat Builder, Bug Builder, Rain Garden). Rendered 123 new slot-free clips (1679 in all, 1556 before); `src/audio/clips` grew by 2,161,851 bytes (+2.16 MB); the service-worker precache went from 1748 to 1871 entries and to 43,361.14 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1864 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
