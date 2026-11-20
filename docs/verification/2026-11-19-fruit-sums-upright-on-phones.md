# 2026-11-19 — Fruit Sums upright on phones (PR #1881)

**Changed:** Fruit Sums levels 1–7 open upright with a single full-size fruit row, room for short-phone captions and a basket beneath the tray at level 5. Resizing anchors in-flight fruit to their new positions and refits the found equations to the current width.
**Ran:** At base `f974d293c` plus the Fruit Sums diff, typecheck, 142 Fruit Sums and registry tests, generated game docs, scoped lint and formatting, links and diff. Layout fixtures cover sideways, upright, caption-strip and caption-bubble views.
**Browser:** `GAME_URL=http://localhost:5293/classic/`, `PHONE_ONLY=fruit-sums`. Baseline `uprightsweep PHONE_BANDS=all` marked four levels for narrow drawn fruit despite 110-unit touch areas. `uprightgames PHONE_BAND=school PHONE_LEVELS=1,2,3,4,5,6,7` finished each level by Chromium touches at 390 × 844 with one sticker. Reviewed all seven opening screenshots after the fruit landed.
**Regression:** At 390 × 625, level 7 showed its caption clear of the board, counted two misses and one hint, and kept the selected fruit and sign through rotation. Level 5 kept the collected pair in the basket through rotation during the flight. Both finished with one sticker.
**Not run:** Separate ghost-finger, local production build or offline suite.
