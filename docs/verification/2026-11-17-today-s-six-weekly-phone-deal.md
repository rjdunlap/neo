# 2026-11-17 — Today’s Six weekly phone deal (PR #1771)

**Changed** — The phone deals from a Monday shuffle by band, with upright-ready games first. A grown-up gets four grown-up cards and two early-school cards in either orientation. The daily page and result use the same deal. Closed the READY line and updated the roadmap and phone definitions.

**Ran** — On `1ffa762b4` plus the PR diff, typecheck, lint, formatting, 39 Today’s Six tests, full unit tests (7,928 passed, 5 skipped), build and doc links passed. The deal tests covered the month and clock-change boundary, depleted pools and a week with no repeats when the pool was large enough. `BROWSER_SUITE=phonefit` at port 5199 passed in bundled Chromium. It checked the four-and-two mix, card order across turns, the upright round and next tile, and the tick on return. The portrait screenshot was reviewed. An earlier run with system Chrome timed out at the chooser before reaching Today’s Six.

**Not run** — `world` and offline.
