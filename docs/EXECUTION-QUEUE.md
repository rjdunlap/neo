# Roadmap execution queue

This is the working queue for the Codex coordinator, authorized on 2026-10-11. [ROADMAP.md](ROADMAP.md) and the [deep-dive tracker](deep-dives/README.md) remain the sources of scope and readiness. Follow [AGENTS.md](../AGENTS.md) for claims, implementation, publication and verification. Scheduling does not override an unresolved developer decision.

## Policy

- An hourly follow-up returns to the same coordinator chat. Complete or checkpoint **one slice**, then end the run. Do not spawn agents or new chats, message other sessions, or dispatch parallel implementations. Reuse this checkout and a named feature branch; do not modify another session's checkout. Keep this coordinator worktree available while the follow-up is active.
- First read fresh account usage, including both window reset timestamps. Missing usage or reset data means defer implementation. The normal subscription allowance must permit work. Never redeem reset credits, buy credits, or switch to API billing automatically.
- **No reserved percentage** (developer decision, 2026-10-11). The full remaining allowance is available. Admit a slice when its estimated consumption fits the remaining allowance in both windows and the daily allocation below; this is a start rule, not an enforceable token cap during a turn.
- Pace weekly use as well: at the first admitted run of each UTC day, set that day's allowance to `weekly remaining percent / max(1, ceil(days until weekly reset))`. Keep that allowance fixed for the day and subtract the day's recorded consumption. Reinitialize at a weekly reset. Do not admit a slice whose weekly estimate exceeds the day's remaining allocation. A larger slice may be split only into independently useful, explicitly scoped parts; otherwise defer it and report the sizing problem once.
- Before estimates exist, budget **15 percentage points of the five-hour window and 2 of the weekly window** for a gameplay slice; **8 and 0.5** for docs-only work. These are provisional planning estimates, not claims about Codex pricing. Subsequently use the larger of these defaults and 1.25 times the largest of the last three comparable observed samples. Recalibrate after overruns.
- Check usage again after defining the scope, before implementation, before expensive verification, and at closeout. If ordinary usage is no longer permitted, stop and retain the latest available checkpoint; leave required checks marked not run. Save checkpoints at useful boundaries while usage permits so a later run can resume after exhaustion. Do not stop merely because remaining usage falls below 25%.
- Check other Neo chats' status, fresh branches, open PRs, and dirty worktrees before admission. If another implementation chat is active, defer this run. Claims remain held by idle sessions too: skip their slices; do not assume their unfinished work is abandoned. Check overlap again before every publication as AGENTS requires.
- Use Standard speed. Keep the current model/settings unless the user changes them; put easy documentation and hard gameplay in separately scoped runs so the user can choose appropriate models. Do not assume a model change creates an independent allowance.
- A skipped check-in creates no commit, worktree or PR. Keep the reset/wait reason in this chat and report it only when it changes or user action is required. Do not sleep until reset in a tool call. Recheck at the next scheduled wake-up.
- No eligible work means report that once and pause the automation; unfinished work must remain explicitly unfinished. A user instruction to pause or stop takes precedence immediately.

## Selection order

Resume this coordinator's unfinished slice first. Otherwise revalidate the candidates below against current origin/main, the roadmap, claims and decisions; their presence here is **not a claim**. Remove completed or newly blocked candidates and refill from the next ready, bounded roadmap slice. A `define` item is eligible only for its docs-only definition; `sketch`, `decision` and `person` items do not authorize implementation.

| Order | Candidate | Scope source | State |
| --- | --- | --- | --- |
| 1 | Stamp Studio slice 1c: early seeded choices, bin and lap nudge/limit completion (1a–b built) | [Build slices](deep-dives/stamp-studio.md#build-slices-in-order); explicitly ready with no decision | Candidate; recheck claims and size before admitting |
| 2 | Story Steps level 10: untangle two stories | [Build slices](deep-dives/story-steps.md#build-slices-in-order); level 9 is built | Candidate; define the two-row interaction and exclude ambiguous story pairings before claiming |
| 3 | Next ready slice in roadmap order | [Next up](ROADMAP.md#next-up), then the relevant game's build slices | Select only after rechecking current scope and dependencies |

Do not implement Duck Pond's new stopping/hint rules, Puzzle Pals' box lid, or other decision-dependent scope merely because a write-up describes a lean.

## Current checkpoint

- Coordinator: chat `01a12db9-1a9e-7131-bda8-dc99bd6dea8d`; active automation `neo-roadmap-coordinator` returns here hourly.
- State: Stamp Studio slice 1b implementation and verification complete; [PR #176](https://github.com/rjdunlap/neo/pull/176) closes publication. Confirm its merge before the next slice. Slice 1a is already merged (#175, `9f82866`). No second slice admitted this run.
- Owner branch: `codex/stamp-studio-choice-words`; base `9f82866`, claim `a599a6e` plus implementation/docs diff. Shared kind/name and pinned sticker mapping, matching choice colors, kind/full speech guards and scoped how-to cover existing levels 1–6. Early seeding/bin/lap controls remain queued as 1c.
- Checks: typecheck, 58 Stamp Studio/save/how-to tests and build passed. Three regressions failed on old behavior. `BROWSER_SUITE=creative CREATIVE_ONLY=stamps STAMP_LEVELS=3 GAME_URL=http://localhost:5202` passed after the logging probe identified and the harness dismissed the co-play overlay. `test-results/browser/stamp-studio-3.png` landscape reviewed; docs links/diff passed. No required checks remain for this bounded fix. Broad suites/howto/fingerdemo/portrait/offline not run; hardware not checked.
- Next action: confirm merge/clean tree, carry any later closeout usage from this chat, then check admission for one ready slice. No logging-only commit needed.
- Daily UTC date: 2026-10-12; weekly reset identity: `1792295992`; fixed daily allocation: **7.142857 weekly percentage points**; cumulative conservative debit: **4** (2 prior + max(2 estimate, 2 observed)). No reset crossed at the comparable before/closeout endpoints.
- Before usage: 03:32:30 UTC, five-hour used 65% (reset `1791782505`), weekly used 51% (reset `1792295992`). Prepublication closeout: 03:42:48 UTC, five-hour 74%, weekly 53%, same endpoint reset identities, ordinary usage allowed. Intermediate weekly timestamps drifted one second; they were not treated as an actual reset or used to replenish the daily budget. Aggregate usage only.
- Owned servers: Vite `http://localhost:5202` stopped; browser closed. No other session changed.

For an admitted slice replace this checkpoint with: exact game/levels and expected files; owner branch/PR; latest commit and any uncommitted files; implementation done/remaining; checks run with tested revision, filters and server URL; checks not run; owned servers stopped; next action and blockers; UTC date and weekly reset identity; daily allocation/spent; before/after usage with timestamps and window reset identities.

## Usage observations

Record one row per admitted run and retain the latest ten. Percentage-point differences are comparable only when the window reset identity is unchanged. A reset-crossing sample is unknown, not zero. Other account work may contribute to a difference; label it as aggregate usage, never exact per-task cost. Unknown samples do not lower an estimate or replenish the daily allocation; conservatively debit at least the admitted weekly estimate. For valid samples debit the larger of the weekly estimate and observed weekly consumption. Store the closeout reading in this chat if obtained after the final commit and carry it into the next checkpoint; do not make another commit solely to log publication overhead.

| UTC date | Slice / PR | Kind | Before → after five-hour usage / reset identity | Before → after weekly usage / reset identity | Daily allocation / cumulative debit | Outcome / attribution |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-12 | Stamp Studio finish snapshot / [#175](https://github.com/rjdunlap/neo/pull/175) | Gameplay bug fix | 57% → 64% / `1791782505` | 50% → 51% / `1792295992` | 7.142857 / 2 | Merged #175; aggregate closeout 02:35:16 UTC |

| 2026-10-12 | Stamp Studio choice colors/words / [#176](https://github.com/rjdunlap/neo/pull/176) | Gameplay bug fix | 65% → 74% / `1791782505` | 51% → 53% / `1792295992` | 7.142857 / 4 | Verified; prepublication aggregate sample, final closeout in chat |

## Scheduling and limits

The hourly follow-up checks admission; it does not provide a dedicated reset event or guaranteed automatic recovery from a rate-limit interruption. Persist checkpoints so a later run can resume. Local work requires the computer powered on, the app running, and this checkout still available. Review the first few admitted runs and adjust estimates from evidence. Scheduling and account usage are separate from the game's runtime; no game code or player saves change for this workflow.

Official references: [scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app) and [usage/pricing](https://learn.chatgpt.com/docs/pricing).
