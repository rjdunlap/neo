# 2026-11-19 — Bolt Boards upright on phones (PR #1869)

**Changed:** Bolt Boards plays upright at every level (`upright: true`). `boardLayout` has an upright branch (the wall takes the 768 width and clears the strip; at level 9 the picture card hangs in a band between the header and the wall) and `woodpileLayout` upright uses slots from x=160 to w-154 with a 100 minimum (four boards get 113 wide, no longer overflowing past the undo arrow). New per-level upright test over all nine levels, every board set and five views; registry test lists the game.
**Ran:** `npm run typecheck`; vitest for `src/games/bolt-boards` (953 passed) and `registry.test.ts`; prettier and eslint clean.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=bolt-boards`: school levels 6, 7, 8, 9 and preschool levels 1, 4 each completed with one sticker (level 1 is not in the school band); screenshots of levels 6 and 9 viewed (the wall floats mid-screen on a tall phone, controls at the bottom, by design). Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, real device.
