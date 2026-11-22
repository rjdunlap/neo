# 2026-11-22 — Village Vote levels 4–6 definition (PR #1998)

**Changed:** Added the [levels 4–6 definition (CC5)](../definitions/village-vote.md#levels-46-definition-cc5): *A tie*, *Everyone can use it* and *Chip in*, three build batches (`village-vote 2` to `4`) queued in READY. Docs only.

**Ran:** `node scripts/check-links.mjs` and `git diff --check` (results in the PR), plus one uncommitted throwaway enumeration script: level-6 purse plans (12 from 2×6 gives 1 way; 10 from 1,1,2,2,3,3 gives 19; 12 from 1,2,2,3,3,3 gives 20) and the level-4 run-off split (a 1–1 split of the two closed friends ties 4–4).

**Not run:** Typecheck, unit tests, build and browser play (docs-only slice).
