# 2026-11-22 — Voice clips batch 37: library and book lines

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `library` and `book` (the library and collection-book lines, after RW10 slice 1 landed). Rendered 9 new slot-free clips (5553 in all, 5544 before); `src/audio/clips` grew by 124,764 bytes (+0.12 MB); the service-worker precache went to 5765 entries and 116,431 KiB. This was the last slot-free prefix, so the slot-free render of V1 is complete. What stays on device speech: slotted lines (V3).
**Ran:** the clip and audio unit tests (30 pass across 5 files), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 5758 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
