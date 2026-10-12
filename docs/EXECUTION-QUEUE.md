# Roadmap execution queue

This is the working queue for the Codex coordinator, authorized on 2026-10-11. [ROADMAP.md](ROADMAP.md) and the [deep-dive tracker](deep-dives/README.md) remain the sources of scope and readiness. Follow [AGENTS.md](../AGENTS.md) for claims, implementation, publication and verification. Scheduling does not override an unresolved developer decision.

## Policy

- An hourly follow-up returns here only to **coordinate** (developer decision, 2026-10-11). Each newly admitted slice runs in a **new project chat with fresh context**, created with `create_thread`, never a fork or a subagent. This coordinator checks admission, records dispatch and reads results; it does not implement games. Dispatch at most one worker per run and allow only one outstanding worker. Keep this coordinator checkout available while the follow-up is active.
- First read fresh account usage, including both window reset timestamps. Missing usage or reset data means defer implementation. The normal subscription allowance must permit work. Never redeem reset credits, buy credits, or switch to API billing automatically.
- **No reserved percentage** (developer decision, 2026-10-11). The full remaining allowance is available. Admit a slice when its estimated consumption fits the remaining allowance in both windows; this is a start rule, not an enforceable token cap during a turn.
- **No daily pacing cap** (developer decision, 2026-10-12). Admission uses fresh actual account allowance in the five-hour and weekly windows. Historical daily allocations/debits below are retired records and must never block dispatch. Keep slice estimates to decide whether work fits the actual remaining allowance; do not divide weekly usage into daily budgets or invent another reserve.
- Before estimates exist, budget **15 percentage points of the five-hour window and 2 of the weekly window** for a gameplay slice; **8 and 0.5** for docs-only work. These are provisional planning estimates, not claims about Codex pricing. Subsequently use the larger of these defaults and 1.25 times the largest of the last three comparable observed samples. Recalibrate after overruns.
- The coordinator checks usage before dispatch; the worker checks it again after defining the scope, before implementation, before expensive verification, and at closeout. If ordinary usage is no longer permitted, stop and retain the latest available checkpoint; leave required checks marked not run. Save checkpoints at useful boundaries while usage permits so a later run can resume after exhaustion. Do not stop merely because remaining usage falls below 25%.
- Check Neo chats, fresh branches, open PRs and dirty worktrees before admission. Inspect the recorded worker first: while it is active or awaiting attention, defer new dispatch. A checkpointed, incomplete owned worker keeps its slice; resume that same chat with the necessary follow-up instead of opening a duplicate. Messaging is authorized only for workers created by this coordinator for their assigned slice; do not message unrelated sessions. If any other implementation chat is active, defer. Idle sessions still hold their claims; do not assume abandonment. Workers recheck overlap before coding and every publication as AGENTS requires.
- Use Standard speed. Keep the current model/settings unless the user changes them; put easy documentation and hard gameplay in separately scoped runs so the user can choose appropriate models. Do not assume a model change creates an independent allowance.
- A skipped check-in creates no chat, commit, worktree or PR. Keep the reset/wait reason in this chat and report it only when it changes or user action is required. Do not sleep until reset in a tool call. Recheck at the next scheduled wake-up.
- No eligible work means report that once and pause the automation; unfinished work must remain explicitly unfinished. A user instruction to pause or stop takes precedence immediately.

## Selection order

Inspect and resume the recorded worker's unfinished slice first. Otherwise revalidate the candidates below against current origin/main, the roadmap, claims and decisions; their presence here is **not a claim**. Remove completed or newly blocked candidates and refill from the next ready, bounded roadmap slice. A `define` item is eligible only for its docs-only definition; `sketch`, `decision` and `person` items do not authorize implementation.

| Order | Candidate | Scope source | State |
| --- | --- | --- | --- |
| 1 | Next ready slice in roadmap order | [Next up](ROADMAP.md#next-up), then the relevant game’s build slices | Story Steps 11 complete in #187; kept stories require the developer’s decision |

Do not implement Duck Pond's new stopping/hint rules, Puzzle Pals' box lid, or other decision-dependent scope merely because a write-up describes a lean.

## Current checkpoint

- Coordinator: chat `01a12db9-1a9e-7131-bda8-dc99bd6dea8d`; active automation `neo-roadmap-coordinator` returns here hourly to dispatch fresh worker chats.
- State: **Beat Builder docs-only deep dive complete**; publication in [PR #190](https://github.com/rjdunlap/neo/pull/190). No implementation performed or authorized in this worker. Next unstarted wave-4 dive is Block Tower; Beat Builder support/content ready for a separately admitted slice, appended modes/younger openings/storage remain decisions.
- Dispatch: `beat-builder-dive-20261012T144502Z`; worker `01a13094-bf66-71b1-ba1b-c5b843fc16d2`, host `local`, Neo project `60beeda2-d963-4f35-a4c0-82c972889939`; branch `codex/beat-builder-deep-dive`, claim `ea48a72`, integrated origin/main `8c773d3` through `b50d12d` plus final docs diff. Retrieve final head/merge from #190 and worker response.
- Scope: [Beat Builder deep dive](deep-dives/beat-builder.md): current 1–5 ladder, exact generator pools, seven comparable primary-source references and NAEYC guidance; source-derived how-to/replay/excess-hit hint gaps; phrase library; proposed 6–9 repair/isolation/sections/return; toddler/lap and below-1 openings; explicit decisions; ten later build slices. Files only deep-dive write-up/tracker, IDEAS, ROADMAP, VERIFICATION and this queue.
- Proof: research URLs read (interactive source limitations stated), changed local Markdown links/anchors and `git diff --check` passed on integrated base plus docs diff. No src/scripts/public files, tests, build or browser play; no game behavior or deployment evidence inferred. Actual device sound/speech, finger comfort and child fit open.
- Admission: coordinator 2026-10-12 14:45:02 UTC **40% / 63%**, resets `1791819581` / `1792295992`; estimate **10 / 1.25 points**. Worker first fresh **41% / 64%**, resets `1791819581` / `1792295993`; scope/pre-writing **46% / 64%**; pre-doc-verification 14:53:22 UTC **48% / 65%**, resets `1791819581` / `1792295993`; pre-publication 14:54:18 UTC **49% / 65%**, resets `1791819581` / `1792295992`, ordinary usage allowed. Aggregate five-hour admission endpoints 9 points; weekly formally unknown due one-second reset identity drift (apparent 2 points exceeds provisional 1.25); other account work contributes. Recalibrate later docs estimate conservatively; final after-commit reading in worker response, do not double-record dispatch.
- Servers: none started; unrelated worktrees/dirty repair preserved. Final docs complete for publication; no implementation or automated check remains.
- Next action: confirm #190 publication/merge and final usage in worker response, release this complete worker, then recheck admission/claims for a new separate slice. This worker stops without dispatching or messaging anyone.

For an admitted slice replace this checkpoint with: exact game/levels and expected files; owner branch/PR; latest commit and any uncommitted files; implementation done/remaining; checks run with tested revision, filters and server URL; checks not run; owned servers stopped; next action and blockers; before/after usage with timestamps and both window reset identities; slice estimate and worker/dispatch ID.

## Usage observations

Record one row per admitted run and retain the latest ten. Percentage-point differences are comparable only when the window reset identity is unchanged. A reset-crossing sample is unknown, not zero. Other account work may contribute to a difference; label it as aggregate usage, never exact per-task cost. Unknown samples do not lower estimates. Record each worker/dispatch once; the ledger improves slice estimates and does not impose a daily quota. Store a closeout reading obtained after the final commit in the worker/coordinator chat and carry it into the next checkpoint; do not make another commit solely to log publication overhead.

The allocation/debit column in old rows is historical only (retired 2026-10-12). New rows use that column for the admitted estimate instead.
| UTC date | Slice / PR | Kind | Before → after five-hour usage / reset identity | Before → after weekly usage / reset identity | Slice estimate / retired daily allocation-debit | Outcome / attribution |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-12 | Stamp Studio finish snapshot / [#175](https://github.com/rjdunlap/neo/pull/175) | Gameplay bug fix | 57% → 64% / `1791782505` | 50% → 51% / `1792295992` | 7.142857 / 2 | Merged #175; aggregate closeout 02:35:16 UTC |
| 2026-10-12 | Stamp Studio choice colors/words / [#176](https://github.com/rjdunlap/neo/pull/176) | Gameplay bug fix | 65% → 77% / `1791782505` | 51% → 53% / `1792295992` | 7.142857 / 4 | Merged #176; aggregate closeout 03:46:15 UTC |

| 2026-10-12 | Stamp Studio 1c1 / [#179](https://github.com/rjdunlap/neo/pull/179), dispatch `stamp-studio-1c1-20261012T043600Z` | Gameplay seeded choices | 82% → 91% / `1791782505` | 54% → 55% / `1792295992` | 7.142857 / 6.5 | Debit 2.5 once; implementation/proof complete; aggregate final closeout 04:44:17 UTC; merged #179, worker complete |

| 2026-10-12 | Shape Buddies definition / [#180](https://github.com/rjdunlap/neo/pull/180), dispatch `shape-buddies-definition-20261012T053600Z` | Docs only | 0% → 7% / `1791801370` | 56% → 57% / `1792295992` → `1792295993` | 7.142857 / 7.5 | Weekly identity drift: formally unknown; conservative debit 1 once (apparent aggregate 1, estimate 0.5). Before 05:36:00, closeout 05:40:58 UTC; definition/proof complete, publication follows |

| 2026-10-12 | Stamp Studio bin/lap / [#184](https://github.com/rjdunlap/neo/pull/184), dispatch `stamp-studio-bin-lap-20261012T113831Z` | Gameplay interaction | 5% → 17% / `1791819581` | 58% → 60% / `1792295992` (intermediate 1s drift) | Estimate 15 / 2.5 points | Complete/proven, publication follows; aggregate endpoints 11 / 2, closeout 11:48:47 UTC; no daily quota |

| 2026-10-12 | Story Steps two rows / [#186](https://github.com/rjdunlap/neo/pull/186), dispatch `story-steps-10-20261012T124102Z` | Gameplay interaction | 18% → 26% / `1791819581` | 60% → 61% / `1792295992` → `1792295993` | Estimate 15 / 2.5 points | Complete/proven, publication follows; pre-publication 12:47:39 UTC. Aggregate five-hour 8 points; weekly formally unknown due 1s identity drift. Final after-commit reading in worker chat |

| 2026-10-12 | Story Steps clue endings / [#187](https://github.com/rjdunlap/neo/pull/187), dispatch `story-steps-11-20261012T134132Z` | Gameplay prediction | 28% → 37% / `1791819581` | 62% → 63% / `1792295993` (intermediate 1s drift) | Estimate 15 / 2.5 points | Complete/proven, publication follows; aggregate endpoints 9 / 1 points at 13:55:45 UTC. Final after-commit reading in worker chat |

| 2026-10-12 | Beat Builder deep dive / [#190](https://github.com/rjdunlap/neo/pull/190), dispatch `beat-builder-dive-20261012T144502Z` | Docs only | 40% → 49% / `1791819581` | 63% → 65% / `1792295992` (intermediate 1s drift) | Estimate 10 / 1.25 points | Complete/docs proof passed, publication follows; aggregate endpoints 9 / 2 points at 14:54:18 UTC; final after-commit reading in worker chat. Recalibrate docs estimate using final sample; no daily quota |

## Fresh-worker dispatch and handoff

1. Check admission and resolve the Neo project using `list_projects` (currently `/Users/robert/git/neo`). Use `create_thread` with `target.type = project`, that returned project ID and `environment.type = local`. Omit model/thinking overrides so the user's configured default applies. A fresh chat does not inherit this conversation; do not fork it or paste its history. Worker checkouts use the project location; the coordinator keeps its own checkout. Creating new worktrees is not part of this policy.
2. Give the new chat a concrete title (game ID and exact slice) and a self-contained prompt using the handoff below. In that prompt the user authorizes only this one slice, its claim/verification/publication workflow and its queue checkpoint. Workers must read the latest committed queue and roadmap after fetching origin, not rely on an older local checkout.
3. Immediately record the returned thread ID, host, project, title, assigned slice, estimated usage and before-reading in the coordinator checkpoint. Publish that queue change without altering another checkout. If task creation is uncertain, inspect recent Neo chats for the exact dispatched title/scope before retrying; do not launch a duplicate. A pending `clientThreadId` is not a ready thread ID.
4. The worker rechecks concurrency, budget and claims before editing; the coordinating chat's active status is exempt, other implementation sessions are not. It makes its own feature branch from current origin/main and required docs claim/draft PR, then completes or checkpoints only the assigned slice. Record proof, usage and next action in its own final response and the committed queue. Do not create another chat or subagent, message this coordinator, or expand the scope.
5. At the next wake-up read the recorded worker using `read_thread`/`wait_threads` and its PR state. Carry its aggregate closeout reading into the ledger once by worker/slice ID; use fresh actual account limits for the next admission. Confirm completion/publication before releasing its slot. If it is incomplete but idle, resume it with a focused message (same worker, same slice); a new slice always gets a new chat. Fresh context applies between slices, while unfinished work stays with its existing worker.

Keep the handoff short: exact assigned slice, its authoritative source document, essential exclusions, and coordinator thread ID for the concurrency exemption. The worker reads current AGENTS and the queue for standing rules, usage checks, claims, verification and publication; do not copy those policies, past proof, budget ledgers or conversation history into every prompt. Include an existing branch/PR only when resuming unfinished work, and a special check only when the source docs do not specify it.

Minimal worker prompt:

> Assigned worker: complete only **<game and exact slice>**, defined in **<document/section>**. Exclude **<essential exclusions>**. Fetch origin and read current AGENTS.md and docs/EXECUTION-QUEUE.md before claiming work. Follow their admission, claim, verification and publication workflow; exempt coordinator `01a12db9-1a9e-7131-bda8-dc99bd6dea8d` from the active-session check. Record your thread/branch/PR, proof, usage and next action in the queue. Complete or checkpoint this slice, report in this chat, then stop; do not dispatch other workers or message the coordinator.

The queue is the durable cross-chat memory: scope, claims, outstanding worker, usage ledger and proof. Each worker's conversation is separate. Skipped admission never creates an empty worker chat. If worker creation or result retrieval is unavailable, report the limitation and defer; do not fall back to implementing here.

## Scheduling and limits

The hourly follow-up checks admission; it does not provide a dedicated reset event or guaranteed automatic recovery from a rate-limit interruption. Persist checkpoints so a later run can resume. Local work requires the computer powered on, the app running, and this checkout still available. Review the first few admitted runs and adjust estimates from evidence. Scheduling and account usage are separate from the game's runtime; no game code or player saves change for this workflow.

Official references: [scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app) and [usage/pricing](https://learn.chatgpt.com/docs/pricing).
