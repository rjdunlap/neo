# Verification 2026-10-24 (archived entries)

## 2026-10-24 — RW07 slice 3: Welcome a New Friend's ending, adoption and basket bed

- `store.adoptWelcome`, the ending in `ProjectScene`, shared `singTune()`, and the basket bed in `PlayScene` ([PR #908](https://github.com/rjdunlap/neo/pull/908)). The tune plays once at the arrival and on a tap, not on the loop as the packet said.
- Ran on `9fc608e2`: typecheck; `npm test` (221 files, 2749 passed); `npm run build`; `BROWSER_SUITE=welcome` and `BROWSER_SUITE=home` on `http://localhost:5962` (full flow to the ending and naming, leave adopts no one, Continue replays, Ripple joins and Home has no Continue, bed shows her picture and wakes to her tune, reload, Friends lists her, Come with me leaves the bed empty, pre-K has no bed, toddler no Continue; portrait ending and landscape bed screenshots reviewed).
- Failed: `npm run test:offline` against `vite preview --port 4758` (current build), twice at "Finished a new minigame while offline", the failure already open since RW14 slice 8; the offline reload and cached open passed. Not a pass.
- Not run: `world`, `picnic`, couch. Open: arrival, naming by tap at 3-4, the bed and device speech with a child ([device check](../DEVICE-CHECKS.md)).
