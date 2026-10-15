# Verification 2026-10-15 (archived entries)

## 2026-10-15 — Peekaboo Barn level 16 One door

- [PR #331](https://github.com/rjdunlap/neo/pull/331), branch `claude/peekaboo-one-door`: lap entry placed first (lap `order` [16, 1, 2], `entryLevels` [16]); one big house, a touch anywhere opens it (a new animal each time, never repeating), it opens by itself after 6 s untouched and that self-opening does not count; six touched reveals, no misses or hints. `howto.test.ts` now iterates `levelsInOrder`.
- Passed `npm run typecheck`; full vitest (1279 pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=16,2` (self-opening uncounted, a far-corner touch counts; the original-six history count is now 9); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaboo-barn FINGER_LEVELS=16` finished in 18.8 s.
- Not run: a portrait screenshot, build, and the person check (whether a one-year-old swats or looks first).
