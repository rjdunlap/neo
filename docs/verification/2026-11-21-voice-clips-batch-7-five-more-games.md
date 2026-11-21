# 2026-11-21 — Voice clips batch 7: five more games (PR #1931)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `moss`, `meltfreeze`, `opp`, `grow` and `moonwindow` (Mossy Path, Melt and Freeze, Opposites, Garden Grow, Moon Window). Rendered 100 new slot-free clips (862 in all, 762 before); `src/audio/clips` grew by 1,681,988 bytes (+1.68 MB); the service-worker precache went from 954 to 1054 entries and to 29,162.21 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 1047 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
