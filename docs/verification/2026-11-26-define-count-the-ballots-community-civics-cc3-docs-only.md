# 2026-11-26 — Define Count the Ballots, community-civics CC3 (docs only)

**Changed:** new definition `docs/definitions/count-the-ballots.md` (ranked-ballot model, deal generator, levels 1–2, hint and miss rules, Lantern Lake registration, rule tests); the community-civics dive's CC3 row; the docs map; READY (the define line removed, the build line added to Next ten).
**Ran:** a throwaway Node enumeration of all 2,002 nine-ballot deals over three candidates (360 have no first-round majority and unique largest and smallest piles, all with piles 4-3-2; 240 have run-off winner equal to plurality winner, 120 differ), both worked examples checked by the same script, `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** code checks and browser plays (nothing built; the packet is a definition).
