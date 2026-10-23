# Verification 2026-10-23 (archived entries)

## 2026-10-23 — Peg Garden level 8 Big buds (slice 4)

- Branch `claude/peg-garden-big-buds`: new `big` mode (four huge buds, radius 60, diamond), plans keyed by ID, lap order `[8, 1]`, toddler `[8, 1, 2]`, `entryLevels [8]`, voice line `peg.big`, how-to lines for level 8.
- Ran: typecheck; `npx vitest run src/games src/content src/progress` (2009 pass, with new rule tests for clear spacing, reachability under drift, no trapped pearl, stall guard); `BROWSER_SUITE=batch BATCH_ONLY=pegs FROM_LEVEL=8 TO_LEVEL=8` passed (score 0, 0); `fingerdemo` `FINGER_ONLY=peg-garden FINGER_LEVELS=8` finished in 4.3 s; one landscape screenshot reviewed.
- Not run: portrait screenshot, `npm run build`, couch suites (couch keeps its own catalog levels), iPad/device.
- Open: whether a toddler touches the huge buds and enjoys the bloom ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-23 — Mail Carrier batch 2: spoken map clues and both street sides

- [#856](https://github.com/rjdunlap/neo/pull/856), levels 13 then 11 / dive slices 6–7; worker `01a16798-fe98-7152-9f20-edd4b6fd4189`, base `d33c4784` plus batch working diff (coordinator-only queue merge `b7cff469` does not change tested code).
- Ran: typecheck; full `npm test` (211 files, 2558 passed, 4 skipped); build; 27 Mail Carrier tests including 300 seeds × both clue orientations, independent geometry/uniqueness margins, parity/order/letter targets and fallback layout properties.
- Browser at `http://localhost:5198`: `BROWSER_SUITE=batch BATCH_ONLY=mail MAIL_LEVELS=11` and `BROWSER_SUITE=woods WOODS_ONLY=mailmap MAIL_LEVELS=13 MAIL_MIRRORED=1` passed, each saved `[2,1]` and a sticker; wrong parity and order at 11; Hazel replay free at 13. Reviewed portrait `mail-carrier-11-portrait.png` and clue map `mail-carrier-13.png`: four houses per side retained, separate 176-unit targets. Six-house fallback unit-tested.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=13,11`: clean completion in 14.0/17.6 s. Links and diff whitespace checked. Logs/screenshots remain in ignored `test-results/`.
- Not run: offline, world/story/couch suites (no persistence, assets, navigation, story or couch behavior changed); actual iPad speech/touch and child play remain [open](../DEVICE-CHECKS.md). Later levels and #733 untouched.

## 2026-10-23 — Monster Munch batch 1 (part): lap 9 Big bites and toddler 10 One of each (slices 3–4)

- [#857](https://github.com/rjdunlap/neo/pull/857), `claude/monster-munch-variety-entries`; tested on the branch commit (pushed before closeout). Slice 2 (foods, monsters, places) not built.
- Ran: typecheck; `vitest src/games src/content src/progress` (162 files, 2015 tests passed).
- Browser at `http://localhost:5517`: `BROWSER_SUITE=third MUNCH_LEVELS=9,10` (harness extended in `scripts/browser-check.mjs`) passed with the expected scores 9: `[0,0]`, 10: `[2,1]`; landscape screenshots reviewed.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=monster-munch FINGER_LEVELS=9,10`: clean completion in 12.5 s (lap) and 23.7 s (toddler).
- Not run: portrait screenshot, build, offline, iPad touch and speech, child play ([open](../DEVICE-CHECKS.md)).
