# 2026-11-22 — Voice clips batch 35: couch play's lines (PR #1984)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `couch` (couch play's lines). Rendered 61 new slot-free clips (5517 in all, 5456 before); `src/audio/clips` grew from 98,795,131 to 100,638,201 bytes (+1,843,070 bytes, +1.84 MB); the service-worker precache went to 5729 entries and 115,886.28 KiB. What stays on device speech: slotted lines and the small or rework-scene prefixes resident, arcade, daily, species, tune, heart, library, dress, discovery and chooser.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 5722 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
