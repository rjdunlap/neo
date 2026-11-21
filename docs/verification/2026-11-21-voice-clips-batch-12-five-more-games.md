# 2026-11-21 — Voice clips batch 12: five more games (PR #1936)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `attic-finds`, `kitchen`, `ps`, `swing-pals` and `wordglue` (Attic Finds, Pet Kitchen, Puppet Stage, Swing Pals, Word Glue). Rendered 245 new slot-free clips (1556 in all, 1311 before); `src/audio/clips` grew by 4,302,015 bytes (+4.30 MB, larger than recent batches because these games have many lines); the service-worker precache went from 1503 to 1748 entries and to 41,227.30 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1741 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
