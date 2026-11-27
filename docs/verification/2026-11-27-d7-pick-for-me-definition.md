# 2026-11-27 — D7 pick for me definition (PR #2279)

**Changed:** docs only: [the definition](../definitions/pick-for-me.md) of D7 (four scopes, One pick and Another, a finite shuffle into the D5a lineup), the D7 roadmap row and two Next ten lines for its build slices.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`; the code names the definition cites (`mixPlayable`, `visibleIn`, `FAVORITES_MAX`, `HISTORY_LENGTH`, `store.levelFor`, `ChallengeKind`) were read in the source.
**Not run:** code checks (no code changed); the build sessions run the shell and navigation tier named in the definition.
