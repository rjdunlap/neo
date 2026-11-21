# 2026-11-20 — Voice clips batch 2: five upright games (PR #1924)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `barn`, `snack`, `size`, `far` and `stamp` (Sing-Along Barn, Animal Snack, Size Parade, Far Lights, Stamp Studio). Rendered 124 new slot-free clips (411 in all, 287 before); `src/audio/clips` grew from 3,494,997 to 5,757,507 bytes (+2.26 MB); the service-worker precache went from 479 to 603 entries and from 19,273.82 to 21,503.85 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 596 cached assets).
**Failed, not from this change:** the root offline suite fails with "Root navigation did not persist Counting Cove while offline", identically on untouched `origin/main`; queued in [READY](../READY.md).
**Not run:** a listen to the new clips (nothing is stitched; device speech stays the fallback).
