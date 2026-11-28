# 2026-11-28 — Bubble Pop level 20 Make 20 (PR #2363)

**Changed:** `src/games/bubble-pop/{logic,index,voice,howto,logic.test}.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `src/content/howto.test.ts`, `scripts/browser/suites/woods-batch.mjs`, `docs/games/bubble-pop.md`, `docs/definitions/bubble-pop-make-20.md`, `docs/deep-dives/bubble-pop.md`, `docs/ready/next/480-bubble-pop-level-20-make-20.md` (removed), `README.md`, `docs/GAMES.md`.

**Ran:**
- `npm run typecheck`: passed.
- `npm run lint`: passed (`eslint src/`).
- `npm run format:check`: passed (`prettier --check`).
- `npx vitest run src/games/bubble-pop src/content/barrels.test.ts src/content/howto.test.ts scripts/voice-clips/clips.test.mjs`: 6 files, 91 tests passed.
- `npx vitest run src/content/lands.test.ts`: 1 file, 17 tests passed.
- `npm run game-docs` and `npx vitest run src/content/game-docs.test.ts`: passed.
- `node scripts/check-links.mjs` and `git diff --check`: passed.
- Headless Playwright verification against `VITE_SPEECH=off` Vite dev server (`http://localhost:5480`):
  - Portrait phone play (`390×844`, `school` band, level 20): verified `= 20` sign (`eventMode: 'none'`, centered, `y + height <= 110`) and 10 bubbles (`1..19`, `minRadius >= 54.6`); two wrong pairs produced `[2, 1]` score, lit ONLY the first bubble of the 2nd try and its partner (`9` and `11`), and spoke `bubble.ten20` (`{ small: 9, ones: 1, big: 11 }`) in place of `bubble.notmade`; completed all 5 pairs and popped the rainbow finale. Visually inspected portrait initial and hint screenshots.
  - Ghost-finger how-to card demo (`1024×768`, `school` band, level 20): verified mode card `Make 20`, `describeLevel(20)`, and full `autotouch()` demo completion (`misses: 0, hints: 0`).
- **Failed probe:** `BROWSER_SUITE=woods WOODS_ONLY=bonds FROM_LEVEL=20 npm run test:browser` timed out at `scripts/browser/registry.mjs:1368` waiting for `MapScene` while the app sat on `HomeScene` (pre-existing mismatch on `main` after RW08 cut over the root in `a158b696c`).

**Not run:** Full 340+ file `npm test` (deferred to PR CI), `npm run build` (no shared shell/asset changes beyond generated content barrels), and `npm run test:offline`. Chrome automation does not establish real device speech or a child's reaction.
