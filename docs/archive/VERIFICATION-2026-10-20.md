# Verification 2026-10-20 (archived entries)

## 2026-10-20 — Ramp Race truthful support (inquiry Q2)

- Built the [Q1 definition](../definitions/ramp-race-support.md) ([PR #624](https://github.com/rjdunlap/neo/pull/624), commit cca1599b): `classifyFair`, `fairRepair` and `fairLine` in `logic.ts`; `rampTouch` in fair mode never returns null, so the ghost finger repairs any unfair pair within three taps; at level 4 the second unfair Check turns on a corrective glow on the orange lane (`ramp.fairhint`), a wrong-only pair hears `ramp.wrong.*`, and the finish lines, how-to card and co-play tip are truthful. Accounting is unchanged (level 4's hint on every unfair Check from the second is recorded, not fixed).
- Ran `npm run typecheck` (clean); `npx vitest run src/games/ramp-race src/content/howto` (26 passed, with four new rule tests); `npx vitest run src/content src/games/registry` (passed).
- Ran `BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=4` (both-changed then wrong-only Check with their spoken lines, the glow, a third unfair Check counted as a hint with no re-announcement, the repaired pair ringing go, the glow cleared on the next question, final score [3, 2]; screenshot `test-results/browser/ramp-race-4.png`) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ramp-race FINGER_LEVELS=4` (clean, 16.8 s), both at `http://localhost:5796`.
- Not run: build (no shared asset changed), browser play of levels 1–3 (interaction unchanged; finish line and card text only), navigation, offline, device speech.
- Open: whether a child connects the orange glow to "change this" and whether device speech reads half-marks ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the level-4 hint count per question stays with [inquiry decision 1](../deep-dives/subjects/inquiry.md#decisions-for-the-developer).
