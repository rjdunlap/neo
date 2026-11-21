# 2026-11-21 — Voice clips batch 6: five more games (PR #1930)

**Changed:** `scripts/voice-clips/clips.mjs` PREFIXES gained `launch`, `peg`, `sink`, `hop` and `slide` (Bouncy Launch, Peg Garden, Sink or Float, Frog Hop, Penguin Slide). Rendered 104 new slot-free clips (762 in all, 658 before); `src/audio/clips` grew by 1,806,414 bytes (+1.81 MB); the service-worker precache went from 850 to 954 entries and to 27,503.77 KiB.
**Ran:** the clip unit tests (30 pass across `scripts/voice-clips` and `src/audio`), typecheck, build, and `OFFLINE_SUITE=classic` offline check (passed, 947 cached assets).
**Not run:** the root offline suite (no navigation or persistence change); a listen to the new clips (nothing is stitched; device speech stays the fallback).
