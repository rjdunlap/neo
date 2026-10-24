# Verification 2026-10-24 (archived entries)

## 2026-10-24 — RW07 slice 3: Welcome a New Friend's ending, adoption and basket bed

- `store.adoptWelcome`, the ending in `ProjectScene`, shared `singTune()`, and the basket bed in `PlayScene` ([PR #908](https://github.com/rjdunlap/neo/pull/908)). The tune plays once at the arrival and on a tap, not on the loop as the packet said.
- Ran on `9fc608e2`: typecheck; `npm test` (221 files, 2749 passed); `npm run build`; `BROWSER_SUITE=welcome` and `BROWSER_SUITE=home` on `http://localhost:5962` (full flow to the ending and naming, leave adopts no one, Continue replays, Ripple joins and Home has no Continue, bed shows her picture and wakes to her tune, reload, Friends lists her, Come with me leaves the bed empty, pre-K has no bed, toddler no Continue; portrait ending and landscape bed screenshots reviewed).
- Failed: `npm run test:offline` against `vite preview --port 4758` (current build), twice at "Finished a new minigame while offline", the failure already open since RW14 slice 8; the offline reload and cached open passed. Not a pass.
- Not run: `world`, `picnic`, couch. Open: arrival, naming by tap at 3-4, the bed and device speech with a child ([device check](../DEVICE-CHECKS.md)).

## 2026-10-24 — Sprout Shuffle G2 placement check (blocked; docs only)

- [PR #912](https://github.com/rjdunlap/neo/pull/912), `claude/sprout-shuffle-g2`: the G2 build stopped at its placement condition; the blocker and a location-capacity definition line are recorded in READY, the genetics dive and the definition.
- Probe: with a stub `sprout-shuffle` module registered (school only), `npx vitest run src/content/lands.test.ts src/app/scenes/ src/app/nav-meaning.test.ts` was run once in each of the 11 lands. Every land failed. Rainbow Meadow failed `meadow.test.ts` at prek and school 4:3 landscape: 0 flowers, against a minimum of 6, and a free-cell grid found no 40-unit gap from y≈120 down. Tinker Lab and Puzzle Peaks failed `lands.test.ts` because `landLayout` returned null. Every other land failed its scene test, including small lands through the added signpost (Painted Canyon at preschool n=7, Music Mountain at toddler n=6).
- Not run: typecheck, the unit suite, build and the browser checks. The stub and code were backed out, so only docs changed.
- Open: the location-capacity definition, then G2 itself.

## 2026-10-24 — Photo Safari levels 8, 9 and 12 (slices 5–7)

- [PR #913](https://github.com/rjdunlap/neo/pull/913), `claude/photo-safari-5-7`, tested at `17fd6491` on a local Vite dev server: school 8 What changed?, school 9 Is it true? and the toddler Who is sleeping? entry (12).
- Ran: typecheck; 175 unit tests (photo-safari logic 17, with new act/changed/true rule tests, registry and content); `BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=8,9,12` (two misses and one hint each, album, saved score, sticker, portrait screenshots of 8 and 9; level 9 re-run after the judge-phase tap fix); `BROWSER_SUITE=fingerdemo FINGER_ONLY=photo-safari FINGER_LEVELS=8,9,12` clean (24.7, 20.2, 13.1 s). `game-reviewer` found one defect (animal taps while judging), fixed.
- Not run: build (no shared files or assets changed), offline, the unchanged levels.
- Open: a toddler on entry 12, a child comparing the pinned photo at 8 and understanding 9's claims and thumbs on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the lap fewer-animals entry waits on a person check.
