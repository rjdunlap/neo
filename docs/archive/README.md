# Archived documents

These files are **history, not instructions**. They record proposals, research, decisions and checks as they stood when they were written. Where they disagree with the current docs, the current docs win; the [docs map](../README.md) says which those are. Every file here has a line below (`scripts/docs-map.test.mjs` checks it; the dated verification files are covered by their one section). To archive a document, move it here with its date in the name, add its line, and repoint links with `node scripts/check-links.mjs --fix-moved` where sections moved.

## Roadmaps, plans and ideas

| File | What it is | Where its live content went |
| --- | --- | --- |
| [ROADMAP-HISTORY.md](ROADMAP-HISTORY.md) | The whole roadmap before the 2026-10-07 cleanup, including the completed-milestone list and the decisions recorded in checked items | [ROADMAP.md](../ROADMAP.md) |
| [ELEMENTARY-ROADMAP.md](ELEMENTARY-ROADMAP.md) | The long-term plan through elementary school: horizons, game-family growth, zone concepts, curriculum references | The roadmap's [later horizons](../ROADMAP.md#later-horizons-elementary) |
| [PLAY-AND-PROGRESSION.md](PLAY-AND-PROGRESSION.md) | The 2026-10-06 review of longer play, personal goals and scoring, with research notes; it led to the couch challenge courses and the pet room | Goal and scoring principles in the roadmap's [planning rules](../ROADMAP.md#planning-rules); built behavior in [DESIGN](../DESIGN.md#couch-play) |
| [PARTY-AND-SWITCH.md](PARTY-AND-SWITCH.md) | The Island Party proposal (built as couch play) and research into running the game on an original Nintendo Switch | Couch play in [DESIGN](../DESIGN.md#couch-play) and [COUCH-PLAY.md](../COUCH-PLAY.md); co-op ideas in [IDEAS](../IDEAS.md); the Switch port is [parked](../ROADMAP.md#parked-or-decided) |
| [IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md](IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md) | IDEAS.md's short-ladder audit and its second and third rounds, moved out on 2026-10-17 | The game [deep dives](../deep-dives/README.md) superseded them |
| [ROADMAP-LADDER-HANDOFF-2026-10-12.md](ROADMAP-LADDER-HANDOFF-2026-10-12.md) | Verbose deep-dive handoff and completed/stale short-ladder list before the family-experience review | [Current roadmap](../ROADMAP.md#short-ladders-in-order), [deep dives](../deep-dives/README.md), [family review](../FAMILY-EXPERIENCE.md) |
| [ROADMAP-CLEANUP-2026-10-15.md](ROADMAP-CLEANUP-2026-10-15.md) | The Next up table, short-ladder and more-to-play lists, Lands, Profiles first and Grown-up play text as they stood before the roadmap was shortened to a ready-to-build list | [ROADMAP.md](../ROADMAP.md), [READY.md](../READY.md) |
| [USER-RESEARCH-2026-10-24.md](USER-RESEARCH-2026-10-24.md) | The research review and the five-minute child observation protocol, for when child observations start | Real play is recorded as phone playtest notes in [OBSERVATIONS](../OBSERVATIONS.md) |
| [GAME-BATCHES-2026-11-23.md](GAME-BATCHES-2026-11-23.md) | The October 2026 same-game batch plans, every one built; a scope reference for an old batch, archived 2026-11-23 | The [batch rules](../SESSION-GUIDE.md#same-game-batches) |
| [PROGRESSION-PROPOSAL-2026-10-26.md](PROGRESSION-PROPOSAL-2026-10-26.md) | The superseded Harbor progression proposal: the old ticket/wheel/bank specification, moved from the roadmap after reconciliation with the October 23 decisions | The [rework brief](../rework/README.md) |
| [ROADMAP-CLEANUP-2026-11-09.md](ROADMAP-CLEANUP-2026-11-09.md) | The roadmap's per-game "Where we are" bullets and its newest-game chain | The README tables are the inventory |
| [BLOCK-TOPPLE-SKETCH-2026-10-14.md](BLOCK-TOPPLE-SKETCH-2026-10-14.md), [VINE-SNIP-SKETCH-2026-10-13.md](VINE-SNIP-SKETCH-2026-10-13.md), [DAY-BY-DAY-FIRST-SLICE.md](DAY-BY-DAY-FIRST-SLICE.md) | Early notes that sat loose in `docs/` | Each game's page in [docs/games/](../GAMES.md) |

`MICROGAME-IDEAS.md` and `ARCADE-IDEAS.md` were merged into [IDEAS.md](../IDEAS.md), and `CONTROLLER-SETUP.md` became [COUCH-PLAY.md](../COUCH-PLAY.md); git history has their earlier versions. On 2026-10-17 the subject recommendation packets left the roadmap for [deep-dives/subjects/RECOMMENDATIONS.md](../deep-dives/subjects/RECOMMENDATIONS.md) (not an archive: they are live proposals). The original design brief also exists as a [historical design artifact](https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913) outside the repository. Nothing in the project depends on it.

## Completed work and build notes

Frozen 2026-11-18: a landed slice no longer gets a build note ([routing](../SESSION-GUIDE.md#where-each-doc-update-goes)). What a slice built is in its verification entry and its game's page.

| File | What it is | Where its live content went |
| --- | --- | --- |
| [COMPLETED-2026-10-09.md](COMPLETED-2026-10-09.md) | Finished roadmap items and build notes from 2026-10-09 to 2026-11-17 (including the [ME1 definition closeout](COMPLETED-2026-10-09.md#me1-swap-meet-14-definition-2026-10-25) and the [WL1 definition closeout](COMPLETED-2026-10-09.md#wl1-european-portuguese-stage-1-definition-2026-10-25); the ghost-finger build log, the couch route's built steps, the Lemonade Stand plan, the shortened "Where we are"), idea-notebook rows for ideas that were built, and the evidence paragraphs of the 2026-10-09 reviews. About 850 KB: read it with `node scripts/peek.mjs` | [ROADMAP.md](../ROADMAP.md) (open work), [GAMES.md](../GAMES.md) (what was built), [IDEAS.md](../IDEAS.md) (proposals) |
| [Bubble Pop levels 16–18](2026-11-17-bubble-pop-big-and-little-which-one-has-the-dots-and-pictures-pr-1768.md), [upright batch 6](2026-11-17-upright-batch-6-six-early-school-games-pr-1765.md), [upright batch 7](2026-11-17-upright-batch-7-six-more-early-school-games-pr-1766.md) | Three build notes of 2026-11-17 written as their own files | The games' pages in [docs/games/](../GAMES.md) and that day's entries in [docs/verification/](../VERIFICATION.md) |

## Decisions and lists for the developer

| File | What it is | Where its live content went |
| --- | --- | --- |
| [DECISIONS-2026-10-23.md](DECISIONS-2026-10-23.md) | Every open question decided on the developer's delegation of 2026-10-23, each with its reason and the row as it stood; its [standing rules](DECISIONS-2026-10-23.md#standing-rules) still decide what is not the developer's alone | Each decision is in its source doc; what remains is in [WAITING-ON-DEVELOPER.md](../WAITING-ON-DEVELOPER.md) |
| [DECISIONS-2026-11-17.md](DECISIONS-2026-11-17.md) | The calls made as owner on 2026-11-17 for the work a READY refill had skipped as gated, and the Portuguese reviewer answer of the same day | Each is in its source; the unblocked slices are in [READY.md](../READY.md) |
| [WAITING-ON-DEVELOPER-2026-11-09.md](WAITING-ON-DEVELOPER-2026-11-09.md) | The per-game optional decisions the waiting list used to repeat | Each is in its dive's own "Decisions for the developer" section with a default; the live list is [WAITING-ON-DEVELOPER.md](../WAITING-ON-DEVELOPER.md) |
| [DEVICE-CHECKS-2026-11-09.md](DEVICE-CHECKS-2026-11-09.md) | The 616 iPad, child, TV and controller checks collected up to the day they were parked, grouped by game | The live page is a short [parked note](../DEVICE-CHECKS.md) |

## Sessions and workflow

| File | What it is | Where its live content went |
| --- | --- | --- |
| [EXECUTION-QUEUE-2026-11-03.md](EXECUTION-QUEUE-2026-11-03.md) | The Codex coordinator's queue, policy and checkpoints, paused 2026-11-03 and frozen; archived 2026-11-18 | [Scheduled runs](../SESSION-GUIDE.md#scheduled-runs) in the session guide; [READY.md](../READY.md) is the pick list |
| [LOCAL-GAME-BUILDS-2026-10-13.md](LOCAL-GAME-BUILDS-2026-10-13.md) | Historical local-build audit: superseded source-worktree evidence for the three recovered games | Nothing live |
| [SESSION-CLEANUP-2026-10-14.md](SESSION-CLEANUP-2026-10-14.md) | Source reconciliation, integration checks and the completed recovery audit | Nothing live; later reviews are in [WORKFLOW-REVIEWS.md](../reviews/WORKFLOW-REVIEWS.md) |

## Verification entries before 2026-11-12

Since 2026-11-12 each set of checks is its own file in [`docs/verification/`](../VERIFICATION.md) and nothing is rotated. Before that, entries beyond the newest fifteen in the live log were moved here, into the file for the day they were written; the live [coverage summary](../VERIFICATION.md#coverage-summary) links here where a suite's last recorded pass is in one of these files.

- [VERIFICATION-2026-10-05-06.md](VERIFICATION-2026-10-05-06.md): entries from the first two days of building.
- [VERIFICATION-2026-10-07-13.md](VERIFICATION-2026-10-07-13.md): entries rotated out of the live log on 2026-10-13.
- One file per day from 2026-10-13: [10-13](VERIFICATION-2026-10-13.md), [10-14](VERIFICATION-2026-10-14.md), [10-15](VERIFICATION-2026-10-15.md), [10-16](VERIFICATION-2026-10-16.md), [10-17](VERIFICATION-2026-10-17.md), [10-18](VERIFICATION-2026-10-18.md), [10-19](VERIFICATION-2026-10-19.md), [10-20](VERIFICATION-2026-10-20.md), [10-21](VERIFICATION-2026-10-21.md), [10-22](VERIFICATION-2026-10-22.md), [10-23](VERIFICATION-2026-10-23.md), [10-24](VERIFICATION-2026-10-24.md), [10-25](VERIFICATION-2026-10-25.md), [10-26](VERIFICATION-2026-10-26.md), [10-27](VERIFICATION-2026-10-27.md), [10-28](VERIFICATION-2026-10-28.md), [10-30](VERIFICATION-2026-10-30.md), [10-31](VERIFICATION-2026-10-31.md), [11-01](VERIFICATION-2026-11-01.md), [11-02](VERIFICATION-2026-11-02.md), [11-03](VERIFICATION-2026-11-03.md), [11-04](VERIFICATION-2026-11-04.md), [11-05](VERIFICATION-2026-11-05.md), [11-06](VERIFICATION-2026-11-06.md), [11-07](VERIFICATION-2026-11-07.md), [11-08](VERIFICATION-2026-11-08.md), [11-09](VERIFICATION-2026-11-09.md), [11-10](VERIFICATION-2026-11-10.md), [11-11](VERIFICATION-2026-11-11.md), [11-12](VERIFICATION-2026-11-12.md). Each from 2026-10-13 on also ends with the execution queue's worker dispatch records for that day, moved out of the live log on 2026-10-17.
