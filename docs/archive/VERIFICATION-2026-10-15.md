# Verification 2026-10-15 (archived entries)

## 2026-10-15 — Peekaboo Barn level 16 One door

- [PR #331](https://github.com/rjdunlap/neo/pull/331), branch `claude/peekaboo-one-door`: lap entry placed first (lap `order` [16, 1, 2], `entryLevels` [16]); one big house, a touch anywhere opens it (a new animal each time, never repeating), it opens by itself after 6 s untouched and that self-opening does not count; six touched reveals, no misses or hints. `howto.test.ts` now iterates `levelsInOrder`.
- Passed `npm run typecheck`; full vitest (1279 pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=16,2` (self-opening uncounted, a far-corner touch counts; the original-six history count is now 9); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaboo-barn FINGER_LEVELS=16` finished in 18.8 s.
- Not run: a portrait screenshot, build, and the person check (whether a one-year-old swats or looks first).

## 2026-10-15 — Critter Crossing level 7 Settle it

- [PR #332](https://github.com/rjdunlap/neo/pull/332), branch `claude/critter-crossing-settle-it` (uncommitted working diff over `5d05927`): school now levels 2–7. Level 7 starts with two critters already tried (one crossed, one waited) leaving the rule and a lookalike standing; of the four waiting critters at least one splits the two and at least one does not. A critter both pictures answer alike is a free try with `cross.same` (never a miss); two such tries glow a splitter (one hint). Guess wakes at 3 tries (the two count).
- Passed `npx tsc --noEmit`; vitest `src/games` + `src/content` (120 files, 1026 tests, including the new "level 7, settle it" rule tests); `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-crossing FINGER_LEVELS=7` in 21.7 s; one scripted portrait play (820x1100) at level 7: two same-answer tries, a hint glow (hints 1, misses 0), then a splitter crossed; screenshot reviewed.
- Not run: the how-to demonstration watched by eye, build, offline, a landscape screenshot, play by a child on an iPad, and device speech for `cross.settle` and `cross.same`.

## 2026-10-15 — Goodnight Room a note per friend

- [PR #333](https://github.com/rjdunlap/neo/pull/333), branch `claude/goodnight-friend-notes` (uncommitted working diff over `1176f47`): slice 10, first half. Each friend has its own pentatonic bell step (`NOTE_STEP` in `src/games/goodnight-room/logic.ts`), played when she says goodnight, replacing the note that rose with the count. The finale is unchanged. The yawn nudge is not built.
- Passed `npx tsc --noEmit` and the Goodnight Room unit tests (12 pass, including the new "distinct notes per room" test).
- Not run: browser play, a listen on a device, build, offline.

## 2026-10-15 — Duck Pond level 12 Bye-bye ducks

- Changed: a `bye` plan at level 12 in `src/games/duck-pond` (five ducks, tap one to wave it off, counted down, all swim back; lap and toddler entry), [PR #334](https://github.com/rjdunlap/neo/pull/334). Departing ducks take no taps.
- Ran: `npm run typecheck`; `npx vitest run src/games` (1028 passed); `BROWSER_SUITE=originals ORIGINALS_ONLY=ducks DUCK_LEVELS=12` (also portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=duck-pond FINGER_LEVELS=12` clean in 28.2 s.
- Not run: build, device or child check; the screenshot was not reviewed visually. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-15 — Tangram Town pine (level 6)

- Added one picture, `pine` (roof over an upside-down hull on a square trunk), to level 6's silhouette pool only (`src/games/tangram-town/logic.ts`); level 4 needs a triangle pair so it is not there. Pictures are now twenty by the count of `PICTURES` keys.
- Ran: `npm run typecheck` clean; `npx vitest run src/games/tangram-town` 13 passed (the existing every-picture fits, never-overlaps and fills tests cover the new picture).
- Not run: browser play, `creative` filter, `fingerdemo` and the one screenshot of the new art the content tier asks for.
- Open: how the pine looks on screen, and a real-device play; neither is established.

## 2026-10-14 — Recovered grown-up games and session cleanup

- [PR #336](https://github.com/rjdunlap/neo/pull/336): integrated Snowball Merge (three levels), canonical Marble Jump (six, plus duplicate’s repeated-visible-hint guard) and Log Roll (three). Marble Jump is in Puzzle Peaks, Log Roll in Tinker Lab and Snowball Merge in Lantern Lake; full-size land targets preserved. [Source/recovery audit](SESSION-CLEANUP-2026-10-14.md).
- Ran: typecheck; full unit run (149 files, 1,295 tests); focused game rules/registry/how-to/lands (6 files, 56 tests); build passed (existing bundle-size warning). At `http://localhost:5187`, filtered `marblejump` 1/6, `logroll` 1/3 and `snowball` 1/3 passed, including invalid/inert actions, requested help, revision, placement/routes and portrait; all three portrait images visually reviewed.
- Source first/top ghost-finger passes retained in [historical evidence](LOCAL-GAME-BUILDS-2026-10-13.md); bots unchanged and demos not rerun. No world, couch, offline, iPad, device-speech or human-enjoyment check claimed. Documentation links/diff checked during closeout.
- Final cleanup: 55 worktrees audited, 41 removed with durable backups/recovery refs; primary checkout clean on current `main`. Twelve locked session/coordinator worktrees plus primary/current retained. All identified completed unique features merged; documentation links/diff passed.
