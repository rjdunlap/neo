# 2026-11-26 — Growing Conditions definition (PR #2247)

**Changed:** Docs only. New [definition](../definitions/growing-conditions.md) for Garden Grow levels 12–13 (genetics G8, Growing Conditions half); genetics study, Garden Grow dive and recommendation rows updated; docs map row; Next ten: two define lines that were already built (the Rain Garden level 7 definition, PR #2088, built in #2090; the genetics G8 definition) removed, a Define Under the Soil line and an after-it Growing Conditions build line added. The stale two-tablets line had already been removed upstream.
**Ran:** `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** No code, unit, browser or build checks (nothing in `src/` changed). The level tables and rule tests in the definition are proposals until a build session.
