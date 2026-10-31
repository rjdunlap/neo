# Verification 2026-10-30 (archived entries)

## 2026-10-30 — Puppet Stage levels 1–3 (theatre and puppetry TP1)

- [PR #1028](https://github.com/rjdunlap/neo/pull/1028), branch `claude/puppet-stage-1-3`: new game `puppet-stage` (Music Mountain, 7 games) plus the shared `voice.sayIn` / `ctx.sayIn` device-speech preset path. Tested at the branch head with Vite on a random port in 5200–5999.
- Ran: typecheck; `npm test` 282 files, 3,763 tests passed; `npm run build` passed; a fresh-context game review found no defects.
- `BROWSER_SUITE=puppetstage` passed: level 1 three pops, a drag and Bow (0/0); level 2 the wrong puppet twice (2 misses, glow, 1 hint) and voice asks; level 3 the free try, a wrong bubble (1/0), a portrait screenshot. `fingerdemo` with `FINGER_ONLY=puppet-stage` clean at lap level 1 (10.5 s) and pre-K level 3 (12.2 s), and with `FINGER_LEVELS=2` at toddler (10.0 s). Fixed in the build: the ghost finger's lift left the level-1 floor touch held, the bot tried a blocked puppet, and the portrait front row sat under the bubbles.
- Not run: `phone`, `howto` suites. Open: the four [device checks](../DEVICE-CHECKS.md#puppet-stage-levels-13-tp1-2026-10-27) (iPad voice pitch and distinct presets, a one-year-old's reaction, a three-year-old hearing "the sleepy way", portrait comfort of the 140-unit puppets); real speech and a child's play are not established.

## 2026-10-30 — Caravan Days 4–5 definition (CS3, docs only)

- [PR #1029](https://github.com/rjdunlap/neo/pull/1029), branch `claude/define-caravan-days-4-5`: [definition](../definitions/caravan-days.md#levels-45-cs3-swap-at-the-stop-worth-more-far-away) (level 4 Swap at the stop, level 5 Worth more far away; school range 3–5), a batch plan in [GAME-BATCHES](../GAME-BATCHES.md#caravan-days-2-swap-at-the-stop-and-worth-more-far-away); READY, backlog, roadmap, ideas, packet and study point to it. Nothing built, no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the building session's source check of the history lines; the build runs the new-interaction tier; the three [device checks](../DEVICE-CHECKS.md#caravan-days-levels-45-cs3-2026-10-30) wait for the built levels.
