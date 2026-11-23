# 2026-11-23 — Thought Bubbles level 5 definition (PR #2032)

**Changed:** new definition `docs/definitions/thought-bubbles-5.md` (LM4, *Who is telling?*; one build batch, `thought-bubbles 3`), the level 4 definition's status line, the literature study (slice 4), RECOMMENDATIONS, the study backlog, the game page's not-built sentence; READY (Next ten line removed, the build line added; two Next ten files renumbered so no two share a prefix) and the docs map.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. A throwaway script brute-forced the definition's pattern table and round rule: each listed telling has exactly one possible teller, and about 40% of random three-story draws satisfy the round rule, so a bounded redraw is practical.
**Not run:** code checks (docs only; nothing built); no browser, and no game was opened or played.
