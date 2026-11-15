# 2026-11-14 — Lemonade Stand fresh seeded awning and cup colours (PR #1694)

**Changed:** `lemonade-stand` draws a per-round awning colour and cup trim (`standLook`, `cupArt(full, trim?)` in `art.ts`) from `ctx.rng` after `makeWeek`; no rule, level, voice or how-to change; sticker and hub icon unchanged.
**Ran:** `npm run typecheck` (clean); `npx vitest run src/games/lemonade-stand` (2 files, 42 tests, including the new `art.test.ts` sticker-art pin of seeds 0-39 written from the pre-change code); a headless Playwright launch at 390x844 portrait of levels 3, 5 and 7 with screenshots (purple, orange, blue, red and pink awnings seen; teal and purple straws on the batch cards; 0 page errors).
**Not run:** full `npm test` (CI runs it), `npm run build` (no shared files or assets changed), browser suites (no interaction changed).
