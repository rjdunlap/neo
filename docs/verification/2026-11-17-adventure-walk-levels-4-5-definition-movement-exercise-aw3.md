# 2026-11-17 — Adventure Walk levels 4–5 definition (movement-exercise AW3, docs only; PR #1742)

**Changed:** new "Levels 4–5 (AW3)" section in `docs/definitions/adventure-walk.md` (level 4 The way home, level 5 Which trail?; bands pre-K 2–4, school 3–5); the Adventure Walk page, movement study, study backlog, recommendations and IDEAS pointers (the stale "AW2 queued" and "nothing is built yet" lines corrected: levels 1–3 were built 2026-10-23); READY: the definition line removed, AW4 and AW5 build lines added.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The count of 192 valid trail sets was confirmed by brute-force enumeration in a scratch script. Nothing under `src/` changed.
**Not run:** typecheck, unit tests, build, browser and offline (docs tier); no source opened.
