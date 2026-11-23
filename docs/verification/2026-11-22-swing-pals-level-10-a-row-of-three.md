# 2026-11-22 — Swing Pals level 10 A row of three (PR #2011)

**Changed:** Swing Pals level 10 for school only (school runs 4-10): a separate `SwingRow` scene, `rowLayout`, `meetTime`, `firstMeet`, `rowWatch` and `rowMeetings` rules, four voice lines plus two hint lines (one per pointed middle or long rope) with rendered clips, how-to steps, upright and rule tests, and a `SWING_LEVELS=10` browser case.

**Ran:** Typecheck, full `npm test` (17785 tests; two failures, how-to steps for 10 and voice clips rendered, then fixed), `npm run build`. `BROWSER_SUITE=swingpals SWING_LEVELS=10` upright at 390x844: hint lit once, a tap on the pointed friend repeats the question, a guess that did not meet first is no miss, one sticker, 0 misses and 1 hint, portrait screenshot. `BROWSER_SUITE=fingerdemo FINGER_ONLY=swing-pals FINGER_LEVELS=10 FINGER_BAND=school` finished in 38.6 s.

**Not run:** Browser checks after the post-review hint wording change (text only); `world` and offline.
