# 2026-11-23 — Workshop Detective definition (PR #2060)

**Changed:**
- `docs/definitions/workshop-detective.md` (new): inquiry slice Q6 as its own `grownup` game on Lantern Lake, level 1 only. A labelled made-up bench lamp with two levers and two notes; the four setups and each note's prediction; why both-down/both-up is the only opening pair both notes fit; the two separating tests; the verdict and explanation for every mark set in both record states; free tries and repeats; the opening latch; the three-step hint walk; a new lamp each round whose look fixes its true note, so the same-looking lamp never changes rule; upright layout and fold rule; a finite voice list; one build batch.
- The inquiry study's Q6 slice, candidates row and example (the Ramp Race level 8 proposal marked superseded by decision 3); IDEAS, ROADMAP, study backlog and recommendation rows; *What can we tell?*'s two pointers to Q6.
- READY: Next ten line 330 (this definition) replaced by the `workshop-detective 1` build line.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The truth and verdict tables were enumerated by hand from the two notes (four setups, four mark sets, two record states).

**Not run:** code checks (docs only; nothing built). No game was opened or played; no new source was opened (the building session does the decision-4 wording check).
