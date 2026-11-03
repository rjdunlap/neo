# Verification 2026-11-03 (archived entries)

## 2026-11-03 — Orchard Rows deep dive (docs only)

- [PR #1133](https://github.com/rjdunlap/neo/pull/1133), branch `ccr-73906eb2-r3nm6v`: [dive](../deep-dives/orchard-rows.md). Fresh orchards and baskets queued ([batch](../GAME-BATCHES.md#orchard-rows-2-fresh-orchards-and-baskets)); levels 7–9 *a path through the orchard* (distributive property, the split at ten) queued as a definition. Tracker, READY, batches, backlog, IDEAS, roadmap and the estimation study's E4 pointer updated; the last unstarted game dive.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the batch and the definition.

## 2026-11-03 — Picture Graph fair meadows, a visible first pick and hints that show why (picture-graph batch 1)

- [PR #1138](https://github.com/rjdunlap/neo/pull/1138): fair single-critter placement, the level-4 lift, the taller-bar distractor, why-hints (dashed line and glowing blocks), `bear`, seeded meadows.
- Ran: typecheck; picture-graph rule tests, 19 passed (placement sweep, 4 views by 300 seeds; taller distractor; `sameTap`/`sameHint`; `whyBlocks`; bear; bot same path); `src/content` and registry tests, 190 passed; build; `BROWSER_SUITE=woods WOODS_ONLY=graph FROM_LEVEL=4` levels 4–7 passed on http://localhost:5353 (level 4 double tap free; level 7 taller pick and a second wrong answer, misses/hints 4/2, why-hint screenshot).
- Not run: `fingerdemo` (bot taps unchanged), browser play of levels 1–3, offline.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): does the lift read as "picked"; does the dashed line explain "more".
