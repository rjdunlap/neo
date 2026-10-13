# Game and level development workflow review

Reviewed on 2026-10-10 from eight past Codex chats, current Git worktrees and branches, pull requests, and the verification log. This is a sampled review, not a timing study of all development. The [contributor guidance](../AGENTS.md) remains the workflow contract; the [verification budget](../AGENTS.md#verification-budget) now includes the developer's 2026-10-10 decision: publishing to main adds no checks beyond the changed area's tier.

## What the sessions show

| Observation | Evidence | Improvement |
| --- | --- | --- |
| Two sessions implemented the same Robot Path level 12 | “Add roadmap level ladders,” chats `01a12763-ed96-73e1-8514-43ac90f143ce` and `01a12895-cd2e-7d93-8765-902610d53895`: one left an uncommitted implementation in `7de0`, the other shipped PR 121 | Claim the exact game and level with a docs-only commit and draft PR before coding. Inspect dirty worktrees as well as unmerged branches. |
| Fresh worktrees repeatedly lacked dependencies | Robot Path, Duckling Parade and Market Stall sessions first failed to find TypeScript; borrowed dependency directories then caused cache/write problems | Use worktree-local `npm ci`. Reuse the package-manager download cache, rather than another worktree's dependency directory. |
| Server ports and caches consumed debugging time | Fill and Dump and Read & Do tried occupied ports; Robot Path tried several borrowed cache arrangements | Choose an explicit port with `--strictPort`; use the identical URL in checks and keep caches local. Stop servers at closeout. |
| Final integration sometimes repeated feature verification | Market Stall integrated newer map work after its first browser pass, then repeated the filtered play and demo | Fetch and integrate before the final checks. After later integration, inspect dependencies and rerun the proportionate checks; preserve evidence for unaffected code. |
| Release checks dominate some otherwise small slices | Fill and Dump's logged `world`, `picnic`, `couch` and offline commands took about 16.6 minutes combined; Goodnight Room recorded the same release set shortly before it | Decision 2026-10-10: use the changed area's tier for publication too. Broad suites follow affected shared behavior or an explicit full-release request. |
| Completion and verification records can diverge | Read & Do's idle chat had no final answer in the retrieved turn, its verification entry still said release checks pending, but PR 130 was merged | Close the verification entry on the published tree and include an explicit final status, tested revision, remaining checks and server cleanup. |
| Shared documentation conflicts add work | Market Stall and Duckling Parade encountered integration conflicts around verification records | Append a short entry, edit only the affected coverage row, and avoid reformatting unrelated tables. Keep counts in README and roadmap as already required. |

Some browser reruns followed real fixes and were necessary. Command counts alone do not prove wasted checking. Device and child checks remain distinct from automated coverage.

## A session that stays small

1. **Choose and claim.** Refresh origin, inspect open PRs, branch tips, worktree status and the game's existing slices. Name one complete game/content/level slice. Publish its docs-only claim and draft PR before implementing it.
2. **Set up once.** Install local dependencies, select a strict port and write down the server URL. Keep one feature branch and one worktree for the slice; create a snapshot only for checks that need one.
3. **Define the proof before coding.** State the fun action, learning purpose, supported bands, completion and mistake/hint accounting. Identify rule properties and the exact browser suite, game filter and level selector. Use the existing [README suite table](../README.md#browser-checks), not a second command inventory.
4. **Build the whole slice.** Rules, input/rendering, voice, level-scoped how-to and bot all describe the same interaction. Update the game's documentation and its existing roadmap/deep-dive row together.
5. **Integrate, then verify.** Refresh upstream before the final run. Use the lightest tier from AGENTS. Record the tested revision, selected levels, pass/fail and screenshots reviewed. A passing broad suite for unchanged code counts; a docs-only edit does not trigger another browser run.
6. **Publish and close.** Update the same PR, merge and publish according to AGENTS, finish the verification record, stop owned servers, and release the clean merged worktree and branch. Preserve artifacts referenced by the final report.

For a docs-only session, step 5 means local links and `git diff --check`; no TypeScript, unit, build or browser run is required merely because the docs are pushed to main.

## Work across usage windows

The [execution queue](EXECUTION-QUEUE.md) holds the Codex coordinator policy and its current checkpoint. An hourly follow-up in the coordinator chat checks both usage windows and existing sessions, then dispatches at most one slice into a new project chat with fresh context. The coordinator only schedules and records work; unfinished slices resume in their own worker chat. The handoff names only the slice, source and essential exclusions; the committed queue carries standing policy and prior proof. It uses the full remaining allowance, checks both actual account usage windows and records observed consumption rather than assuming a fixed message cost. Waiting checks do not create commits or new worktrees. This is an agent workflow, not a hard quota enforcement service; local scheduled work needs the computer on and the app running.

## Further improvements worth a separate slice

These are proposals, not implemented helpers. Targeted verification before publication is already the policy.

- **One game check command.** A small manifest could map stable game IDs to existing suite filters and level selectors. A command accepting a game and level could print its rule test, play-through and finger-demo commands, with a dry-run default. Fail on unknown IDs or unsupported selectors instead of silently running the entire suite. Keep the README suite table authoritative until that helper exists.
- **Safer snapshot serving.** The current snapshot script uses one default directory and port 5180. Two sessions can overwrite that shared copy. Give each snapshot its own directory, port and cache, include the source revision in the startup output, and freeze the test script along with the source. This requires a scripts change and a focused startup/isolation check.
- **Keep coverage summaries short.** *Rule adopted 2026-10-13* (AGENTS.md, "Documentation and Git"): one row per suite or area, overwritten with the latest pass. The existing per-slice rows have not been collapsed yet (see the token review below).

## Token review (2026-10-13)

Measured from the 70 Claude Code session transcripts for this project (Codex sessions on `codex/` branches were not measured, so the share of work they carry is unknown): 18,297 assistant turns, about 5.8 billion cache-read tokens, about 319K tokens of context per turn. A session starts near 68K tokens and peaks at a median of 458K (p90 950K); none was ever compacted. So most of the cost is **context that accumulates inside a session**, multiplied by its turn count (median about 260). A 20K-token read at turn 50 of 260 costs about 4M cache-read tokens. Always-loaded text matters less: `AGENTS.md` is about 9K tokens, roughly 3% of the total.

What the transcripts showed, and what was done:

- **Long chained sessions.** Several sessions ran 500 to 900 turns across more than one slice. *Done:* AGENTS.md now says one slice per session and to push verbose work to a subagent.
- **Whole-file reads of `ROADMAP.md`** (27 of 49 reads, each cut off near 70 KB, about 17K tokens apiece) and large reads of `DESIGN.md`, `README.md` and `CouchScene.ts`. *Done:* a read-by-section rule in AGENTS.md and in `docs-keeper`.
- **Bash output** was three times the size of all file reads (13.6 MB against 4.4 MB). *Done:* a rule to pipe test and suite output through `tail` or `grep`.
- **Repeated overlap checks** (about 85 `git fetch origin` runs, 47 merges, plus `gh pr list` and `git worktree list`, three or more times per slice). *Done:* `scripts/overlap.sh`.
- **Doc edits through Python heredocs** (1,423 Bash calls; 328 aimed at `ROADMAP.md`, 256 at `VERIFICATION.md`), with about seven documents touched per slice. *Partly done:* closeout can go to `docs-keeper`; the three custom agents had not been used once in these transcripts, because nothing named them.
- **A stray `docs/VERIFICATION.md-e`** (a macOS `sed -i -e` artifact, 276 lines out of date) was committed in d0f9ce6. *Done:* removed, with a pitfall line.

Proposed, not done (each moves text other sessions are editing, so do them as pure moves in their own pull request, with the anchor check below):

- Rotate `VERIFICATION.md` (423 KB, 238 entries) so only the newest dozen entries and the coverage summary stay live, as was done for 2026-10-05/06; collapse the per-slice coverage rows into one row per suite. Links of the form `VERIFICATION.md#2026-10-…` from the roadmap, README and coverage rows must be repointed.
- Split `ROADMAP.md` (172 KB): "Waiting on the developer" (35 KB) and "Needs a person or a device" (23 KB) into their own files, keeping the `#next-up` anchor that `EXECUTION-QUEUE.md` links.
- Cut `EXECUTION-QUEUE.md`'s "Current checkpoint" (very long lines read by every hourly run) to the current state, moving history out.
- `IDEAS.md` (396 KB) and `GAMES.md` (131 KB) are only read by section, so they cost nothing until opened; leave them.
- About 40 registered worktrees (roughly 30 under `~/.codex/worktrees`) are mostly merged branches; this is disk and clutter, not tokens, but the cleanup procedure below applies.

## Cleanup performed

Starting inventory: 19 registered worktrees, 116 local branches and 130 remote branch refs including the symbolic origin HEAD. Every deletion was checked against freshly fetched `origin/main`; the open PR and dirty worktrees were excluded.

- Removed 14 clean, merged worktrees and 111 merged local feature branches.
- Removed 126 merged remote feature branches with an atomic push and expected-tip leases, so a concurrent new push would reject the deletion.
- Stopped five Vite dev/preview processes rooted in the completed Fill and Dump and Goodnight Room worktrees. Read & Do's servers and other sessions' processes were preserved.
- Kept the primary checkout with PWA changes; `7de0` with the uncommitted Robot Path alternative; `af0e` with an archive-document edit and incomplete session closeout; `f930` holding main; and this workflow-review checkout.
- Kept the unmerged local Splish Splash research claim and the open ideas-research PR 131. No historical chats were deleted or archived.

Recovery files are outside the tracked tree, in `/Users/robert/git/neo/.git/cleanup-backups/2026-10-10/`: `refs.bundle` (verified before removal), `plan.json` (paths, commit IDs and branches), the PR inventory, binary patches for dirty worktrees, and per-worktree archives of `test-results` and local Claude settings when present. Dependency directories and reproducible builds were not retained. Dirty worktrees themselves were left intact.

To recover a removed checkout, use its commit from `plan.json` with `git worktree add --detach <new-path> <commit>`, then extract its artifact archive there. To restore a deleted branch, find its tip with `git bundle list-heads <bundle>` and fetch that single ref to a newly named branch. The bundle also preserves branch tips independently of the repository's reflogs.

The app's managed archive tool is scoped to the calling chat's attachments; the old worktrees were not attached here. Git removal therefore leaves those historical chats without their old checkout directory. Their chat history remains available, and the recovery manifest describes how to recreate a checkout when needed.
