# Verification 2026-10-20 (archived entries)

## 2026-10-20 — Ramp Race truthful support (inquiry Q2)

- Built the [Q1 definition](../definitions/ramp-race-support.md) ([PR #624](https://github.com/rjdunlap/neo/pull/624), commit cca1599b): `classifyFair`, `fairRepair` and `fairLine` in `logic.ts`; `rampTouch` in fair mode never returns null, so the ghost finger repairs any unfair pair within three taps; at level 4 the second unfair Check turns on a corrective glow on the orange lane (`ramp.fairhint`), a wrong-only pair hears `ramp.wrong.*`, and the finish lines, how-to card and co-play tip are truthful. Accounting is unchanged (level 4's hint on every unfair Check from the second is recorded, not fixed).
- Ran `npm run typecheck` (clean); `npx vitest run src/games/ramp-race src/content/howto` (26 passed, with four new rule tests); `npx vitest run src/content src/games/registry` (passed).
- Ran `BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=4` (both-changed then wrong-only Check with their spoken lines, the glow, a third unfair Check counted as a hint with no re-announcement, the repaired pair ringing go, the glow cleared on the next question, final score [3, 2]; screenshot `test-results/browser/ramp-race-4.png`) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ramp-race FINGER_LEVELS=4` (clean, 16.8 s), both at `http://localhost:5796`.
- Not run: build (no shared asset changed), browser play of levels 1–3 (interaction unchanged; finish line and card text only), navigation, offline, device speech.
- Open: whether a child connects the orange glow to "change this" and whether device speech reads half-marks ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the level-4 hint count per question stays with [inquiry decision 1](../deep-dives/subjects/inquiry.md#decisions-for-the-developer).

## 2026-10-20 — Fill and Dump count sign (slice 1)

- Built [slice 1](../deep-dives/fill-dump.md#build-slices-in-order) ([PR #626](https://github.com/rjdunlap/neo/pull/626), commit 5a596101): at levels 3–4 a dot card left of the basket fills as fruit goes in and shows extras below it (`countSign` in `logic.ts`, `CountSignCard` in `index.ts`, two how-to lines, the `originals` fill case now asserts the extras appear and leave); check and accounting unchanged; levels 1–2 and 5 have no sign.
- Ran `npm run typecheck` (clean); `npx vitest run src/games/fill-dump src/content` (105 passed, with the new count-sign rule test); `GAME_URL=http://localhost:5471 BROWSER_SUITE=originals ORIGINALS_ONLY=fill FILL_LEVELS=3,4 node scripts/browser-check.mjs` (levels 3 and 4, level 4 in portrait; `test-results/browser/fill-dump-4.png` reviewed: the sign sits clear of the corner buttons).
- Not run: fill levels 1, 2 and 5 (unchanged code), `fingerdemo` (the bot's action is unchanged), build (no shared file or asset changed), any device check.
- Open: a person has not watched a toddler read the sign.
