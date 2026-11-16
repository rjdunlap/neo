# 2026-11-16 — Sprout low-poly art prototype (PR 1714)

**Changed:** Development-only Blender/Three.js art study; original procedural scene, editable source, GLB, still and hello/ball preview. Base `29687e23` plus pilot diff.
**Ran:** Blender 5.3 generation/render; typecheck; production build (preview excluded); `GAME_URL=http://localhost:5194 node scripts/sprout-preview-check.mjs`, hello/ball and resize at 390×844 and 1000×700, screenshots inspected. Fixed eye-mesh/pivot selection found in visual review. Initial browser run interrupted by formatting HMR; frozen retry passed. Full units: 7,206 passed, 5 skipped; Secret Code unchanged level-11 timing threshold failed (332 ms against 250 ms).
**Probe:** Secret Code alone passed all 24 tests; full-run failure recorded as a timing flake.
**Not run:** Production world/offline/browser suites: no production entry, save, navigation or asset-loading changes. No new game/learning rules. Real-time browser rendering differs from the Cycles still.
