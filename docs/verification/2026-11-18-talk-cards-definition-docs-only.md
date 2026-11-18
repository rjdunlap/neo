# 2026-11-18 — Talk cards definition, docs only (PR #1783)

**Changed:** new definition `docs/definitions/talk-cards.md` (six grown-ups' page conversation cards: Not Always, Notice Board, Shell Rows, Maker Lane, Thought Bubbles, Puppet Stage; two build slices); the six studies, study backlog, recommendations and At-home card pointers; the landed READY line removed and the two builds queued in Next ten. Nothing is built.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. NAMLE's key questions page was reopened and its three questions confirmed.
**Not run:** the AAP statement returned HTTP 403 and was not opened, so its caution is left off the Notice Board card. No code checks (nothing under `src/` changed); the build sessions run their own tiers.
