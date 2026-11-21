# 2026-11-21 — Voice clips batch 11: five more games (PR #1935)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `dots`, `feel`, `poke`, `gears`, `sand` and `scoop` (Dot Link, Feelings Faces, Gear Garden, Sand Table, Scoop Shop). Rendered 98 new slot-free clips (1311 in all, 1213 before); `src/audio/clips` grew by 1,526,301 bytes (+1.53 MB); the service-worker precache went from 1405 to 1503 entries and to 36,986.53 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1496 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
