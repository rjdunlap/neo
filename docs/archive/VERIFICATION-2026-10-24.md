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

## 2026-10-24 — Location capacity definition (docs only)

- [PR #914](https://github.com/rjdunlap/neo/pull/914), `claude/location-capacity`: [definition](../definitions/location-capacity.md) of pages for a full land; no code changed.
- Probe: a throwaway vitest probe of `landLayout`, `visibleIn` and `olderIn` on `origin/main` `edd6a74b`, deleted afterward. 4:3 landscape binds at 14 spots, Rainbow Meadow's scenery fails at 14, and portrait and phone fit 23 or more.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, unit tests, build, browser (docs only).
- Open: the build.

## 2026-10-24 — Location capacity: pages for a full land

- [PR #915](https://github.com/rjdunlap/neo/pull/915), `claude/location-pages` on `origin/main` `af1b3074`: `LAND_SPOTS = 13`, balanced pages with arrows in `landLayout`, a page in the land origin, and a capacity sweep (`landLayouts`) in all ten location tests; Beach, Painted Canyon and Music Mountain reworked with `scanPlace`.
- Ran: `npm run typecheck`; `npm test` (222 files, all passing); `BROWSER_SUITE=lands` (every page of every land, all bands landscape, lap/school/grownup portrait, arrow touch areas); `BROWSER_SUITE=world` (first run failed on two harness expectations of the old `{ land }` origin, updated to `{ land, page: 0 }`; rerun PASS); `npm run build`; `npm run test:offline` against `vite preview --port 5444` (served `classic-BU0HtDNI.js` matched `dist`). Dev server `http://localhost:5298`.
- Scripted look (Tinker Lab at school, root): pages 6+6; the next arrow turns to page 1; a game launched there returns to page 1; the host's suggestion turns back to page 0; portrait page 1 fine; no page errors.
- Not run: couch suites (untouched). Open: iPad check of the arrows (no fitting section in [device checks](../DEVICE-CHECKS.md) yet).

## 2026-10-24 — Pond Typing levels 1–3 (KE2 part 1)

- `claude/pond-typing` at `aa4f38a3`: new keyboard-only couch game `pond-typing` (school 1–3), the typed-letter channel (`CouchControls.typed`, `GameModule.typing`), couch registration, the Bubble Pond course and the island course route; home Story Grove (after merging #915's land pages; it failed Story Grove's drawing test before them).
- Ran: typecheck; `npm test` 2779 passed (224 files, with 20 new rule tests in `pond-typing/{logic,course}.test.ts` and 3 in `couch-input.test.ts`); `BROWSER_SUITE=couchgames COUCH_ONLY=pond-typing` (intro, level-1 bot round, save; the bot's typing checked instead of key lighting); one Playwright probe: island `go.game('pond-typing')` opens the course page, two wrong keys gave 1 miss and 1 hint with the key glowing, the right key popped, no page errors, portrait screenshot reviewed; `npm run build`.
- Not run: offline check, `world`, `lands` suite (the land fit was checked by the registry and lands unit tests), a real laptop keyboard or a child. Open: levels 4–6, picture words, the Show the key toggle; [device check](../DEVICE-CHECKS.md#pond-typing-levels-13-ke2-2026-10-24).
