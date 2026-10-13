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

- Coordinator `01a12db9-1a9e-7131-bda8-dc99bd6dea8d`; automation active hourly. Definition worker complete, [#242](https://github.com/rjdunlap/neo/pull/242) merged at `6b954a418cf02cfca68e773492794d37c7940a6c`; slot released.
- Newly admitted: **Block Tower level-5 prediction replay and authored pair pool**, defined [slice 4](deep-dives/block-tower.md#build-slices-in-order). Frozen Watch again, explicit Continue, three observations/exactly-once completion, seven pairs/28 variants and bounded fair selection. Preserve zero misses/hints, bands/IDs/sticker seeds; exclude mirror reach, new levels/bands, storage and decisions 1–4.
- Dispatch `block-tower-prediction-20261013T045450Z`; worker `01a1339d-a681-7f50-b731-e116f733870d`, host `local`, Neo project `60beeda2-d963-4f35-a4c0-82c972889939` (`/Users/robert/git/neo`), requested title "Block Tower 5: prediction replay and pairs". Fresh project/local chat, minimal handoff, no history/model override; branch/claim PR pending, source base `10df86a`.
- Expected files: Block Tower rules/implementation/tests, voice/how-to, filtered browser regression and related docs. Implementation and required proof **not run by coordinator**. Source new-interaction tier: typecheck/unit rules, one filtered level-5 first/last play with predictions/replay/Continue and zero misses/hints/one sticker, portrait and level-5 demo; build if shared files change. No unchanged full/offline suites.
- Admission 2026-10-13 04:54:50 UTC **56% five-hour / 88% weekly used**, resets `1791874139` / `1792295993`; ordinary usage allowed. Estimate **15 / 2.5 points**, fits actual remaining **44% / 12%**. No daily cap/reserve; worker rechecks usage.
- Previous worker proof: local docs links/anchors and diff check passed; no code/build/browser authorized/run. Final 04:06:33 UTC **56% / 88%**, resets `1791874139` / `1792295992`; admission 49% / 86% with same identities. Aggregate endpoints **7 / 2 points** (intermediate weekly 1s drift); reconciled once below, duplicate pending row consolidated. No previous servers started; no unchanged proof rerun.
- Admission overlap: no active Neo implementation/open PR or overlapping dirty work; unrelated dirty registry/deep-dive repair preserved. Coordinator servers none. Actual device speech/clearance and child fit remain open.
- Next action: retrieve worker/PR next wake-up; confirm completion/publication and reconcile usage once before another dispatch. Resume same worker if unfinished; do not implement here.

## Usage observations

Record one row per admitted run and retain the latest ten. Percentage-point differences are comparable only when the window reset identity is unchanged. A reset-crossing sample is unknown, not zero. Other account work may contribute to a difference; label it as aggregate usage, never exact per-task cost. Unknown samples do not lower estimates. Record each worker/dispatch once; the ledger improves slice estimates and does not impose a daily quota. Store a closeout reading obtained after the final commit in the worker/coordinator chat and carry it into the next checkpoint; do not make another commit solely to log publication overhead.

The allocation/debit column in old rows is historical only (retired 2026-10-12). New rows use that column for the admitted estimate instead.
| UTC date | Slice / PR | Kind | Before → after five-hour usage / reset identity | Before → after weekly usage / reset identity | Slice estimate / retired daily allocation-debit | Outcome / attribution |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-12 | Beat Builder how-to / [#192](https://github.com/rjdunlap/neo/pull/192), dispatch `beat-builder-howto-20261012T154702Z` | Content wording | 1% → 8% / `1791838034` | 65% → 66% / `1792295993` → `1792295992` | Estimate 15 / 2.5 points | Merged #192; final 15:53:50 UTC. Aggregate five-hour 7 points; weekly formally unknown due 1s identity drift (apparent 1). Worker complete; reconciled once |
| 2026-10-12 | Beat Builder replay/repair / [#194](https://github.com/rjdunlap/neo/pull/194), dispatch `beat-builder-replay-20261012T164902Z` | Existing interaction fix | 9% → 18% / `1791838034` | 66% → 68% / `1792295992` (intermediate 1s drift) | Estimate 15 / 2.5 points | Merged #194; final 16:59:12 UTC. Aggregate endpoints 9 / 2 points; worker complete, reconciled once |

| 2026-10-12 | Beat Builder authored phrases / [#196](https://github.com/rjdunlap/neo/pull/196), dispatch `beat-builder-phrases-20261012T175018Z` | Gameplay generation | 19% → 25% / `1791838034` | 68% → 69% / `1792295992` (intermediate 1s drift) | Estimate 15 / 2.5 points | Merged #196; final 17:55:07 UTC. Aggregate endpoints 6 / 1 points; worker complete, reconciled once |


| 2026-10-12 | Beat Builder woodland / [#197](https://github.com/rjdunlap/neo/pull/197), dispatch `beat-builder-woodland-20261012T184648Z` | Content/art | 25% → 34% / `1791838034` | 69% → 70% / `1792295993` (intermediate 1s drift) | Estimate 15 / 2.5 points | Merged #197; final 18:54:41 UTC. Aggregate endpoints 9 / 1 points; worker complete, reconciled once |


| 2026-10-12 | Block Tower dive / [#209](https://github.com/rjdunlap/neo/pull/209), dispatch `block-tower-dive-20261012T204519Z` | Docs only | 48% → 3% / `1791838034` → `1791856047` | 73% → 74% / `1792295993` → `1792295992` | Estimate 12 / 2.5 points | Merged #209; final 20:52:52 UTC. Five-hour reset crossing and weekly identity drift: aggregate unknown; worker complete, reconciled once |



| 2026-10-12 | Block Tower support / [#213](https://github.com/rjdunlap/neo/pull/213), dispatch `block-tower-support-20261012T215149Z` | Content wording | 4% → 12% / `1791856034` | 74% → 75% / `1792295993` (intermediate 1s drift) | Estimate 15 / 2.5 points | Merged #213; final 21:57:46 UTC. Aggregate endpoints 8 / 1 points; worker complete, reconciled once |


| 2026-10-12 | Block Tower reach / [#216](https://github.com/rjdunlap/neo/pull/216), dispatch `block-tower-reach-20261012T224849Z` | Existing-game fix | 12% → 23% / `1791856034` | 75% → 77% / `1792295993` (intermediate 1s drift) | Estimate 15 / 2.5 points | Merged #216; final 22:56:48 UTC. Aggregate endpoints 11 / 2 points; worker complete, reconciled once |



| 2026-10-12 | Block Tower heights / [#218](https://github.com/rjdunlap/neo/pull/218), dispatch `block-tower-heights-20261012T235249Z` | Existing interaction | 24% → 35% / `1791856034` | 77% → 79% / `1792295992` → `1792295993` | Estimate 15 / 2.5 points | Merged #218; final worker closeout around 00:00:25 UTC Oct 13. Aggregate five-hour 11; weekly unknown due identity drift, apparent 2; reconciled once |


| 2026-10-13 | Block Tower prediction definition / [#242](https://github.com/rjdunlap/neo/pull/242), dispatch `block-tower-prediction-definition-20261013T035820Z` | Docs only | 49% → 56% / `1791874139` | 86% → 88% / `1792295992` (intermediate 1s drift) | Estimate 12 / 2.5 points | Merged #242; final 04:06:33 UTC. Aggregate endpoints 7 / 2 points; worker complete, reconciled once |

| 2026-10-13 | Block Tower prediction build, dispatch `block-tower-prediction-20261013T045450Z` | New interaction | 56% → pending / `1791874139` | 88% → pending / `1792295993` | Estimate 15 / 2.5 points | Fresh worker `01a1339d-a681-7f50-b731-e116f733870d` admitted; implementation/proof pending |

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
