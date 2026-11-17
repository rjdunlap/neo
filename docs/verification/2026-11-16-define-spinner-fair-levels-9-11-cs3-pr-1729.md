# 2026-11-16 — Define Spinner Fair levels 9–11 (CS3, PR #1729)

**Changed:** docs only: the levels 9–11 definition (`docs/definitions/spinner-fair-9-10.md`; the study's two levels are defined as three), its three READY lines (CS3a–c), the chance-statistics study, batch plans, roadmap and study-backlog rows, links from the earlier Spinner Fair definitions, and two refill lines in Next ten.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** typecheck, unit tests, build, browser suites and `fingerdemo` (no code changed); nothing is built.
**Caveats:** the chance figures in the definition come from a one-off simulation and exact binomial sums, not the game's code; no source was fetched, so the source checks are owed to CS3b and CS3c.
