# 2026-11-24 — Last Pebble levels 1–2 (PR #2142)

**Changed:**
- Implemented `last-pebble` levels 1–2 (`src/games/last-pebble/logic.ts`, `art.ts`, `index.ts`, `voice.ts`, `howto.ts`, `logic.test.ts`, `upright.test.ts`) as strategy-games SG3 batch `last-pebble 1`: pure Nim / *Got It* stepping-stone model (`MAX_TAKE = 2`, period `3`), level 1 (*Near the far bank*, 3 crossings with `rem = 2, 4, 5` and *show me why* replies), level 2 (*Across the stream*, `T ∈ {7, 8, 10, 11}`, turning-point rewind, `Show me` rewind from losing positions), winding 128-unit S-path stream layout (`upright: true`, `65.0` CSS px at `390 × 844`), `school` (about 10 and up) and `grownup` bands.
- Registered `last-pebble` in `src/content/lands.ts` (`puzzle-peaks`, directly after `shell-rows`), updated barrels (`src/content/voice-script.ts`, `src/content/howto.ts`), `src/games/registry.test.ts`, `src/games/grownup-thumbs.test.ts`, browser suite `scripts/browser/suites/last-pebble-play.mjs` (`scripts/browser/registry.mjs`, `scripts/browser/fixture.mjs`), `README.md`, `docs/games/last-pebble.md`, `docs/GAMES.md`, `docs/ROADMAP.md`, `docs/STUDY-BACKLOG.md`, `docs/deep-dives/subjects/strategy-games.md`, `docs/deep-dives/subjects/RECOMMENDATIONS.md`, `docs/VERIFICATION.md`, and removed `docs/ready/next/870-last-pebble-levels-1-2-near-the-far-bank-and.md`.

**Ran:**
- `npm run game-docs` (3 passed, 1 skipped)
- `npm run format:check`, `npm run lint`, `npm run typecheck` (passed)
- `npx vitest run src/games/last-pebble src/games/grownup-thumbs.test.ts src/games/registry.test.ts src/games/ladders.test.ts src/content/lands.test.ts src/content/barrels.test.ts src/content/offscreen.test.ts` (131+ tests in those suites passed) and `npx vitest run src/content/howto.test.ts src/content/game-docs.test.ts` (19 + 3 passed, 1 skipped)
- `GAME_URL=http://localhost:5473 BROWSER_SUITE=lastpebble npm run test:browser` (`VITE_SPEECH=off`, `390 × 844` upright phone with captions: level 1 laid-spot free tap, 2 wrong moves with *show me why* rewind and glow, 3 crossings to sticker `2/1`; level 2 pet win rewind to turning point, `Show me` rewind from losing spot, portrait screenshot `last-pebble-portrait.png`, finish `1/1`, 2 stickers total; PASS)
- `GAME_URL=http://localhost:5473 BROWSER_SUITE=fingerdemo FINGER_ONLY=last-pebble FINGER_LEVELS=1,2 npm run test:browser` (level 1 in 10.1s, level 2 in 6.1s; PASS)
- `npm run build` (passed)

**Not run:**
- Full `npm test` (deferred to PR CI), `npm run test:offline`, other unrelated browser suites, Kokoro clip generation for the new `lp.*` lines (device speech fallback covers them until clips are generated), and real-device / child playtest (parked).
