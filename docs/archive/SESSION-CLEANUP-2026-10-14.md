# Session cleanup and recovered game integration — 2026-10-14

User requested cleanup of worktrees/roadmap and integration of completed sessions. [PR #336](https://github.com/rjdunlap/neo/pull/336) reconciles the three previously local game builds and current docs. The integration merged at `7c8a159`; the completed cleanup is recorded below.

## Recovered implementation

- Snowball Merge: source `f91e94d6-dcf1-43cf-b4a1-326266302863/neo`, three finite 16/32/64 levels, integrated in Lantern Lake.
- Marble Jump: source `0de686b6-3e61-4bfd-b7c7-7759afa3080e/neo`, canonical six-level 3/5/7/9/11/14-marble ladder, integrated in Puzzle Peaks. The competing `42d71b53-9fae-4044-ac94-af047daa2781/neo` three-level ladder was superseded; its repeated-visible-hint de-duplication guard was retained. No published levels were renumbered.
- Log Roll: source `1a99/neo`, three levels, integrated in Tinker Lab.

Original recorded checks and source baselines remain in the [historical local-build audit](LOCAL-GAME-BUILDS-2026-10-13.md). Local source docs were reconciled rather than copied wholesale. Current inventory and counts belong in [README](../../README.md#the-island-and-its-games) and [roadmap](../ROADMAP.md); dated subject-study counts remain their original research baselines.

## Verification

Typecheck, full units (149 files/1,295 tests), focused game rules/registry/how-to/lands (6 files/56 tests), and build passed; build retained its existing large-bundle warning. Land layouts preserve 100-unit targets. At `http://localhost:5187`, `marblejump` levels 1/6, `logroll` 1/3 and `snowball` 1/3 passed including wrong/inert actions, help, revision and placement/routes. The owning session viewed all three portrait screenshots. Prior source first/top ghost-finger evidence is retained because bots did not change; demos were not rerun. World, couch, offline and real-device/human checks were not run. No shell/engine contract changed.

## Completed worktree recovery audit

Audited **55 worktrees** and removed **41** completed or redundant checkouts. The **14 retained** checkouts are the clean primary repository, this cleanup session, **11 locked Claude sessions with live processes**, and the locked roadmap coordinator. Every retained session's completed feature tip is already in `origin/main`; the coordinator is preserved for its automation. No locked worktree or live process was stopped. Historical chats remain open.

Needed screenshots, probes, local settings, original patches and untracked game source are backed up under `/Users/robert/.codex/worktree-recovery/neo-2026-10-14` (63 MB at the audit). `audit.json`, per-tree `manifest.json` files and `cleanup-result.json` record original paths, heads, branches, backups, recovery refs and removal decisions. Dirty completed sessions were first preserved in named `recovery/cleanup-*` stash snapshots, then made clean and detached at current published main before removal; no dirty tree was force-removed. The primary checkout's earlier archive-link edit is separately protected by `recovery/primary-before-cleanup`. Recovery refs retain the stash parents, including untracked-file snapshots; the artifact archives also contain the untracked source.

The primary `/Users/robert/git/neo` checkout is clean on `main`, updated through the published integration; its old redundant `main` worktree was released. Only merged feature branches without a remaining checkout were deleted. Unmerged historical, superseded and recovery refs were preserved. All session-owned check servers were stopped.

## Other-session reconciliation

- **Space research:** [PR #335](https://github.com/rjdunlap/neo/pull/335), `22ab78f`, completed and merged during cleanup; its study and roadmap recommendations are retained and its finished worktree released.
- **Beat Builder's mend, revise, sections, returning-song, toddler and picnic branches:** already published equivalents, including picnic #199 and returning song #205; no extra gameplay change needed.
- **Bouncy Launch's local integration checkpoint:** the implemented source is already published through #275; its controller changes match the published C1b work.
- **Critter Sort's research and Just a few:** published equivalents in #316/#326. The obsolete Bug Builder claim is superseded by the completed #296 study.
- **Tangram fish/lighthouse and Peekaboo bedroom:** published equivalents; removed stale local/uncommitted roadmap labels.
- **Goodnight regression worktree:** its dirty diff exactly duplicates merged `8a22297` (#152); preserved as a recovery snapshot and released.
- **Three unpublished games:** published by #336 after source reconciliation and the checks above. The duplicate three-level Marble Jump is intentionally superseded by the six-level ladder, with its useful hint fix retained.

No completed, unique feature identified by this audit remains unpublished. Preserved recovery snapshots and obsolete/rebased branch tips are historical evidence, not pending implementation. Practical science/content review, hardware observations and proposed roadmap work retain their existing open status.
