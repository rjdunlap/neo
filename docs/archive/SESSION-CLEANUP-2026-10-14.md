# Session cleanup and recovered game integration — 2026-10-14

User requested cleanup of worktrees/roadmap and integration of completed sessions. [PR #336](https://github.com/rjdunlap/neo/pull/336) reconciles the three previously local game builds and current docs. Publication/cleanup status must be confirmed by the owning session; this record describes the reviewed integration and provisional cleanup audit.

## Recovered implementation

- Snowball Merge: source `f91e94d6-dcf1-43cf-b4a1-326266302863/neo`, three finite 16/32/64 levels, integrated in Lantern Lake.
- Marble Jump: source `0de686b6-3e61-4bfd-b7c7-7759afa3080e/neo`, canonical six-level 3/5/7/9/11/14-marble ladder, integrated in Puzzle Peaks. The competing `42d71b53-9fae-4044-ac94-af047daa2781/neo` three-level ladder was superseded; its repeated-visible-hint de-duplication guard was retained. No published levels were renumbered.
- Log Roll: source `1a99/neo`, three levels, integrated in Tinker Lab.

Original recorded checks and source baselines remain in the [historical local-build audit](LOCAL-GAME-BUILDS-2026-10-13.md). Local source docs were reconciled rather than copied wholesale. Current inventory and counts belong in [README](../../README.md#the-island-and-its-games) and [roadmap](../ROADMAP.md); dated subject-study counts remain their original research baselines.

## Verification

Typecheck, full units (149 files/1,295 tests), focused game rules/registry/how-to/lands (6 files/56 tests), and build passed; build retained its existing large-bundle warning. Land layouts preserve 100-unit targets. At `http://localhost:5187`, `marblejump` levels 1/6, `logroll` 1/3 and `snowball` 1/3 passed including wrong/inert actions, help, revision and placement/routes. The owning session viewed all three portrait screenshots. Prior source first/top ghost-finger evidence is retained because bots did not change; demos were not rerun. World, couch, offline and real-device/human checks were not run. No shell/engine contract changed.

## Worktree recovery audit (provisional)

The owning session audited 55 worktrees. Cleanup removed 36 worktrees: 29 clean merged trees and seven completed or redundant recovered trees, with needed artifacts backed up under `/Users/robert/.codex/worktree-recovery/neo-2026-10-14`. Active or locked Claude/coordinator sessions were preserved. Space research subsequently merged as [PR #335](https://github.com/rjdunlap/neo/pull/335), commit `22ab78f`; the owning session handles its finished worktree and remaining snapshot recovery. The durable backup was 63 MB at this checkpoint; locked live Claude processes and the coordinator remain preserved. Final preservation decisions remain for the owning session to append after its audit finishes. These provisional figures do not assert that every session can be removed.
