# 2026-11-24 — Bounce Back idle paddle (PR #2093)

**Changed:** Bounce Back: the pet aims its return away from a parked paddle (`isAwayMode`, `returnArrival`, `petLobAway`) on rally, together, count and skip levels; level 2 now lobs.
**Ran:** typecheck, prettier, eslint, the 19 Bounce Back rule tests (two new: an idle paddle never meets returns on 1024x768 and a narrow table; the usual lob is kept when already clear), `FINGER_ONLY=bounce-back` fingerdemo at levels 12 and 11.
**Not run:** the unit suite beyond Bounce Back, build, `BATCH_ONLY=bounce`.
