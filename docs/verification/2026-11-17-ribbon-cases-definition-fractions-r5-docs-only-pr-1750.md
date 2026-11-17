# 2026-11-17 — Ribbon Cases definition (fractions R5, docs only; PR #1750)

**Changed:** new definition `docs/definitions/ribbon-cases.md` (Ribbon Workshop level 7; the two-gift tray case, the one-order-card change and the `grownup` ladder [6, 7]); the fractions study, study backlog, recommendations, roadmap, IDEAS, Ribbon Workshop and Whole Switch definition pointers and the game page; READY: the definition line removed, the build line added (Next ten holds six lines).
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The definition's counts (61 arrangements, three accepted allocations, 13 of 16 feasible request pairs, two- or three-action repairs) were enumerated by one throwaway script that was not committed. Nothing under `src/` changed.
**Not run:** no code checks; nothing under `src/` changed, no source opened (the building session's source check covers the voice table). `npm test` not run (no `node_modules` in the worktree).
