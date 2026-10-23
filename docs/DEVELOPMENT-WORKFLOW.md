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

## Same-game batches (2026-10-21)

The rule as it stood in AGENTS.md until 2026-10-23 (moved here to keep that file short):

> Developer direction, 2026-10-21: a routine’s implementation slice is a predeclared same-game batch, usually 2–4 related level/content subtasks, rather than one session per appended level. [READY](READY.md) dispatches the [batch plans](GAME-BATCHES.md); original dive slice numbers remain dependency/closeout references. Claim all included IDs and files together in one worker, branch and PR; finish prerequisite substeps inside that same worker. Read the game and set up its checks once, and share final checks while covering every distinct interaction, new entry layout and bot level. Keep the verification budget and existing decision/reviewer gates. A larger new interaction may stay standalone. New dives/definitions should group their first ready builds this way.

> The coordinator’s one-slice/one-worker rule applies to the whole declared batch. Estimate allowance for every included subtask and the combined proof, using comparable observed batch usage where available; do not admit several levels on a single-level estimate. If the whole batch does not fit, split it into explicitly named complete playable parts before admission. Resume unfinished owned batches in their existing worker; do not create a chat, claim or PR for each sublevel. Research remains one game or subject per session. See [workflow guidance](#same-game-batches-2026-10-21).

The developer requested grouping related levels to avoid reloading the same game in separate sessions. One session now owns a coherent batch, normally 2–4 original level/content subtasks, with one claim, branch, PR, local setup and closeout. [READY](READY.md) gives the dispatch order; [GAME-BATCHES](GAME-BATCHES.md) preserves the exact included source tasks. For example Garden Grow’s row, column and equal-row levels share a grid engine; Sound Garden’s pitch drawing and pitch copying share one drag interaction. A new input/layout family or unresolved decision is a reason to separate a batch.

Keep the existing session through the whole declared batch and resume it after allowance resets. Read source sections once, retain a short implementation/proof checklist and run shared final checks once. Every distinct interaction and materially different younger entry still gets its required evidence; batching does not authorize skipped tests or broaden a game check into a release suite. The coordinator must estimate the whole batch, splitting before admission if needed. Study/research cadence counts dispatch batches rather than levels.

This reduces repeated orientation, dependency setup, claim/PR handling and duplicated proof. Actual context-cache hit rates, token savings and total runtime have not been measured for this policy. Larger conversations can also accumulate more context, so keep batches bounded and start fresh after their merge. Do not assume that merely keeping a chat alive guarantees a cache saving.

## A session that stays small

1. **Choose and claim.** Refresh origin, inspect open PRs, branch tips, worktree status and the game's existing slices. Name one complete same-game batch, including its related levels/content and dependencies; a slice need not mean one level. Publish its docs-only claim and draft PR before implementing it.
2. **Set up once.** Install local dependencies, select a strict port and write down the server URL. Keep one feature branch and one worktree for the slice; create a snapshot only for checks that need one.
3. **Define the proof before coding.** State the fun action, learning purpose, supported bands, completion and mistake/hint accounting. Identify rule properties and the exact browser suite, game filter and level selector. Use the existing [README suite table](../README.md#browser-checks), not a second command inventory.
4. **Build the whole slice.** Rules, input/rendering, voice, level-scoped how-to and bot all describe the same interaction. Update the game's documentation and its existing roadmap/deep-dive row together.
5. **Integrate, then verify.** Refresh upstream before the final run. Use the lightest tier from AGENTS. Record the tested revision, selected levels, pass/fail and screenshots reviewed. A passing broad suite for unchanged code counts; a docs-only edit does not trigger another browser run.
6. **Publish and close.** Update the same PR, merge and publish according to AGENTS, finish the verification record, stop owned servers, and release the clean merged worktree and branch. Preserve artifacts referenced by the final report.

For a docs-only session, step 5 means local links and `git diff --check`; no TypeScript, unit, build or browser run is required merely because the docs are pushed to main.

## Work across usage windows

The [execution queue](EXECUTION-QUEUE.md) holds the Codex coordinator policy and its current checkpoint. An hourly follow-up in the coordinator chat checks both usage windows and existing sessions, then dispatches at most one slice into a new project chat with fresh context for the whole declared batch, not each constituent level. The coordinator only schedules and records work; unfinished slices resume in their own worker chat. The handoff names only the slice, source and essential exclusions; the committed queue carries standing policy and prior proof. It uses the full remaining allowance, checks both actual account usage windows and records observed consumption rather than assuming a fixed message cost. Waiting checks do not create commits or new worktrees. This is an agent workflow, not a hard quota enforcement service; local scheduled work needs the computer on and the app running.

## Further improvements worth a separate slice

These are proposals, not implemented helpers. Targeted verification before publication is already the policy.

- **One game check command.** A small manifest could map stable game IDs to existing suite filters and level selectors. A command accepting a game and level could print its rule test, play-through and finger-demo commands, with a dry-run default. Fail on unknown IDs or unsupported selectors instead of silently running the entire suite. Keep the README suite table authoritative until that helper exists.
- **Safer snapshot serving.** The current snapshot script uses one default directory and port 5180. Two sessions can overwrite that shared copy. Give each snapshot its own directory, port and cache, include the source revision in the startup output, and freeze the test script along with the source. This requires a scripts change and a focused startup/isolation check.
- **Keep coverage summaries short.** *Rule adopted 2026-10-13* (AGENTS.md, "Documentation and Git"): one row per suite or area, overwritten with the latest pass. The existing per-slice rows have not been collapsed yet (see the token review below).

## Token review (2026-10-13)

Measured from the 70 Claude Code session transcripts for this project (Codex sessions on `codex/` branches were not measured, so the share of work they carry is unknown): 18,297 assistant turns, about 5.8 billion cache-read tokens, about 319K tokens of context per turn. A session starts near 68K tokens and peaks at a median of 458K (p90 950K); none was ever compacted. So most of the cost is **context that accumulates inside a session**, multiplied by its turn count (median about 260). A 20K-token read at turn 50 of 260 costs about 4M cache-read tokens. Always-loaded text matters less: `AGENTS.md` is about 9K tokens, roughly 3% of the total.

What the transcripts showed, and what was done:

- **Long chained sessions.** Several sessions ran 500 to 900 turns across more than one slice. *Initial response:* one slice per session. *Updated 2026-10-21:* one predeclared same-game batch per session, keeping the context through related levels while avoiding an unbounded chain of unrelated work.
- **Whole-file reads of `ROADMAP.md`** (27 of 49 reads, each cut off near 70 KB, about 17K tokens apiece) and large reads of `DESIGN.md`, `README.md` and `CouchScene.ts`. *Done:* a read-by-section rule in AGENTS.md and in `docs-keeper`.
- **Bash output** was three times the size of all file reads (13.6 MB against 4.4 MB). *Done:* a rule to pipe test and suite output through `tail` or `grep`.
- **Repeated overlap checks** (about 85 `git fetch origin` runs, 47 merges, plus `gh pr list` and `git worktree list`, three or more times per slice). *Done:* `scripts/overlap.sh`.
- **Doc edits through Python heredocs** (1,423 Bash calls; 328 aimed at `ROADMAP.md`, 256 at `VERIFICATION.md`), with about seven documents touched per slice. *Partly done:* closeout can go to `docs-keeper`; the three custom agents had not been used once in these transcripts, because nothing named them.
- **A stray `docs/VERIFICATION.md-e`** (a macOS `sed -i -e` artifact, 276 lines out of date) was committed in d0f9ce6. *Done:* removed, with a pitfall line.

Done in the follow-up (2026-10-13), as pure moves with every link repointed by `scripts/check-links.mjs`:

- `VERIFICATION.md` went from 429 KB to about 65 KB: the newest fifteen dated entries and the coverage summary stay; the rest is in [the archived log](archive/VERIFICATION-2026-10-07-13.md). The summary lost 25 rows (docs-only slices and older rows for a game that has a newer one).
- `ROADMAP.md` went from 175 KB to 115 KB: [Waiting on the developer](WAITING-ON-DEVELOPER.md) and [Needs a person or a device](DEVICE-CHECKS.md) are their own files, and AGENTS.md routes to them.

Left as is, on purpose:

- `EXECUTION-QUEUE.md` (18 KB) is the live state of the Codex coordinator, which rewrites its "Current checkpoint" every hour; trimming it from another session risks a conflict with the owner. The coordinator can shorten it when it next edits.
- `IDEAS.md` (396 KB) and `GAMES.md` (131 KB) are only read by section, so they cost nothing until opened.
- About 40 registered worktrees (roughly 30 under `~/.codex/worktrees`) are mostly merged branches. That is disk and clutter, not tokens; the cleanup procedure below applies.

## Agent setup review (2026-10-23)

Compared against Anthropic's Claude Code guidance (best practices, "Extend Claude Code", the June 2026 steering post) and OpenAI's Codex guidance (AGENTS.md discovery, best practices, rules).

- **Codex was reading only the first 32 KiB of AGENTS.md.** Codex stops at `project_doc_max_bytes` (32 KiB by default); AGENTS.md is about 46 KB. Asked directly, Codex quoted text that broke off at "Same-game batches" (line 140), so Codex sessions never saw the closeout, worktree, pitfall, claim, overlap or merge rules. *Done:* `project_doc_max_bytes = 65536` in the developer's `~/.codex/config.toml` (outside the repository; a new machine needs the same line), confirmed by asking Codex for the file's last headings, and `scripts/agent-guard.test.mjs` fails if AGENTS.md passes 60 KiB. Claude Code loads the whole file.
- **Stale subagent prompts.** `game-reviewer` still banned imported art (sprites are allowed since 2026-10-17) and `docs-keeper` archived verification entries by hand instead of with `archive-verification.mjs`. *Done:* both fixed; all three agents now treat AGENTS.md as already loaded and as overriding their own summary. `game-reviewer` reports only rule or requirement breaks, since a reviewer asked for gaps always finds some.
- **The subagents were never invoked.** *Done:* the minigame checklist names `rules-tester` (step 2) and `game-reviewer` (step 7), as it already named `docs-keeper`.
- **"Never" rules were only requests.** *Done:* a Claude `PreToolUse` hook (`scripts/agent-guard.mjs`, `.claude/settings.json`) blocks `npm run test:browser` without `BROWSER_SUITE` and, on macOS, `sed -i -e`; a Codex rule in `~/.codex/rules/guards.rules` forbids `sed -i -e` (checked with `codex execpolicy check`). Codex prefix rules cannot express "without a filter", so the browser rule is Claude-only.
- **Images from Claude sessions.** *Done:* `scripts/codex-image.sh` and the `codex-image` skill hand a brief and reference images to one `codex exec` conversation using Codex's built-in `image_gen` (ChatGPT plan, no API key); tested with a new transparent image and a reference edit, each under two minutes.
- **Session token review, 2026-10-13 to 23.** Claude: 601 sessions, median 28 calls and 117K peak context (down from 260 calls and 458K); 2.2B cache-read tokens, 57% from the scheduled roadmap routines (median 3.5M per run, rising to 4–5M once batches started). Codex: the hourly coordinator heartbeat wakes in one ever-growing thread (125K context at its first wake, 402K at its latest): 312M input over 194 wakes, of which 157 dispatched nothing yet cost about 1.15M each, against about 16K for a Claude routine run that defers. Re-read cost by source: AGENTS.md about 234M (Claude) and 84M (Codex); start-of-session orientation about 130M, including `overlap.sh` printing all 183 worktrees. `docs-keeper` ran 258 times, `game-reviewer` 3, `rules-tester` 0. *Done:* `overlap.sh` with no terms now lists only worktrees that can hold a claim (21 KB to 8 KB), and AGENTS.md asks for a checkpoint and fresh session past about 150K context. *Proposed:* a fresh-run coordinator (a standalone automation rather than a heartbeat thread).
- **Shorter AGENTS.md (same day).** *Done:* 46.3 KB to 32.3 KB (about 30%), so it fits Codex's default 32 KiB even without the config change. The integration table's full cells, the reuse map and the input/rendering pitfalls moved word for word into [DESIGN.md](DESIGN.md#agent-reference) ("Agent reference"), with a one-line contract per area left in AGENTS.md; the same-game batch paragraphs moved into [this file](#same-game-batches-2026-10-21); two repeated sentences were shortened. No rule changed meaning; the Couch play row took the correction from draft PR #848 (`GROWNUP_GAMES` is retired). What remains is rules every task needs; going much lower would mean moving rules behind links agents might not follow.
- **Not done, on purpose.** AGENTS.md was not split: nested AGENTS.md files below the repository root are invisible to Codex sessions started at the root, and path-scoped `.claude/rules/` would help Claude only. Skills shared through `.agents/skills/` (Codex) and `.claude/skills/` (Claude) would duplicate checklists AGENTS.md already carries, which is how the two subagent prompts drifted. Run `/doctor prompt-audit` in Claude Code from time to time to catch that drift.

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
