# 2026-11-22 — Voice clips batch 27: eight more games (PR #1974)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `pixel`, `playdate`, `conga`, `pt`, `lens`, `pyramid`, `tricks` and `ramp` (Pixel Pictures, Playdate Workshop, Pond Conga, Pond Typing, Puddle Lens, Pyramid Solitaire, Quick Tricks, Ramp Race), the next games alphabetically after Pile Match. Rendered 332 new slot-free clips (3917 in all, 3585 before); `src/audio/clips` grew by 6,250,979 bytes (+5.96 MB); the service-worker precache went to 4129 entries and 85,281.07 KiB.
**Ran:** the clip and audio unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check against a production preview (passed, 4122 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); the full `npm test` (CI runs it); a listen to the new clips (nothing is stitched; device speech stays the fallback).
