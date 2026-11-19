# 2026-11-18 — Bond Beads upright on phones (PR #1825)

**Changed:** Bond Beads plays upright at every level 1–7. Its layout moved from `logic.ts` into a pure `layout.ts` (`cardShapes` into `logic.ts`); on a tall view the table keeps its shape (no taller than 1.15 times its width) and sits low, with the card and the tally just above it, and the card gives up height so seven beads always fit (it used to return no layout for seven beads with a card at 768 × 1024). Sideways is unchanged. Incidental fixes: `src/engine/tween.ts` no longer throws on a tween whose target was destroyed before its first frame (it stopped the frame loop and froze levels 5–7 when a line resolved at once), with a new unit test; the next tray waits for the beads' hop as well as the line. `upright: true` is set and the registry list holds 62 games.

**Ran:** `npm run typecheck`; `npm run game-docs` then the full `npm test` (388 files); `npm run build`. The new `upright.test.ts` covers every level 1–7, every tray over 200 seeds (2 to 7 beads, 0 to 3 card pictures), three upright phone views, the captioned view and a short one.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=bond-beads PHONE_BAND=school PHONE_LEVELS=1,2,3,4,5,6,7` on a 390 × 844 touch page in headless Chromium: the first run finished levels 1–4 and stalled at level 5 (the tween freeze); after the fix levels 5, 6 and 7 finished (12, 12 and 18 touches, one sticker each) and a probe saw no page error. Upright screenshots of levels 1, 3, 5 and 7 were looked at.

**Not run:** the uprightsweep (the per-level test is the proof and the game is now flagged), `fingerdemo` (the bot is unchanged), `world`, the offline suite, the couch suites.
