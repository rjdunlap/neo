# Docs map

What each document under `docs/` is for and when to open it. Rules are in [AGENTS.md](../AGENTS.md) and the how-to is in the [session guide](SESSION-GUIDE.md); this page only says where things are. Each fact has one owning document ([routing](SESSION-GUIDE.md#where-each-doc-update-goes)). A new top-level document or folder needs a line here (`scripts/docs-map.test.mjs` fails `npm test` without one); before adding one, look for the document that already owns the subject.

Most of these files keep one paragraph per line, so lines run long: read by section with `node scripts/peek.mjs outline|section|grep`.

## Running a session

| Document | Open it |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Every session: the rules, the check tiers, the publishing rule. Loaded automatically |
| [SESSION-GUIDE.md](SESSION-GUIDE.md) | For the how: claiming, worktree setup, checks, scripted play, where each doc update goes, merging, scheduled runs |
| [NEW-GAME.md](NEW-GAME.md) | When starting a new game: the scaffold command and what it leaves to do |
| [CODE-QUALITY.md](CODE-QUALITY.md) | For formatter and lint tooling, exclusions and the lint baseline |
| `.claude/agents/`, `.claude/skills/codex-image/` | The subagent prompts (`rules-tester`, `game-reviewer`, `docs-keeper`) and the generated-image skill |

## What to work on

| Document | Open it |
| --- | --- |
| [READY.md](READY.md), [`ready/next/`](ready/next/) | To pick a slice: **Next ten** (one file per line, listed by `node scripts/ready.mjs`), then **Queued**, then what is blocked |
| [ROADMAP.md](ROADMAP.md) | For direction: the chunks, their status and what is only proposed |
| [OBSERVATIONS.md](OBSERVATIONS.md) | What the developer and their wife said after playing on their phones; it decides what comes first |
| [STUDY-BACKLOG.md](STUDY-BACKLOG.md) | Which studies and dives exist and the next bounded action for each |
| [GAME-BATCHES.md](GAME-BATCHES.md) | The October 2026 same-game batch plans, now built; a scope reference for an old batch |
| [IDEAS.md](IDEAS.md) | The idea notebook: proposals, not a mandate |
| [WAITING-ON-DEVELOPER.md](WAITING-ON-DEVELOPER.md) | Only before work that depends on a call the developer alone can make |
| [DEVICE-CHECKS.md](DEVICE-CHECKS.md) | The parked device and child checks, and what a phone playtest can answer |

## What exists and how it works

| Document | Open it |
| --- | --- |
| [README.md](../README.md) (repository root) | Setup, the game inventory and count, the browser suites and their filters |
| [DESIGN.md](DESIGN.md) | Architecture and systems; before changing an area, its [integration contract](DESIGN.md#integration-contracts); before writing a helper, the [reuse map](DESIGN.md#reuse-map); before pointer or texture code, the [pitfalls](DESIGN.md#input-and-rendering-pitfalls) |
| [GAMES.md](GAMES.md), [`games/`](games/) | The index and one page per game: what it does at each level, and its design notes |
| [COUCH-PLAY.md](COUCH-PLAY.md) | The player guide for couch play |
| [VERIFICATION.md](VERIFICATION.md), [`verification/`](verification/) | The coverage summary per suite or area, and one dated entry file per set of checks |

## Plans behind the roadmap

| Document | Open it |
| --- | --- |
| [`rework/`](rework/README.md) | The creature-world target, its work items and the concept art (proposed until delivered) |
| [`definitions/`](definitions/) | One buildable definition per game or feature; read only the section for the level being built |
| [Word Code](definitions/word-code.md) | Puzzle-pages PP9, levels 1–3: guess the hidden word by letter marks, picture words at school and five letters at grown-up |
| [Domino Pond](definitions/domino-pond.md) | Puzzle-pages PP2, levels 1–3, from dot matching to exact totals and comparisons |
| [Sum Crates](definitions/sum-crates.md) | Puzzle-pages PP5, levels 1–3: crossing rows and columns of fruit crates that add to their signs, no repeat in a line; school 1–2, grown-up 3 |
| [Bunny Patches](definitions/bunny-patches.md) | Puzzle-pages PP3, levels 1–3: one bunny in every row, column and patch, none touching; pre-K 4×4 to school 6×6 |
| [Market Stall levels 12–13](definitions/market-stall-12-13.md) | Can I buy it? (does a purse cover a price, then spend it on two things) and Trade up (swap small coins for a bigger one); school, built after levels 8–11 |
| [Drag miss counting](definitions/drag-miss-counting.md) | Read-through of how every drag game counts a wrong drop (2026-11-20): none uncounted without a stated reason |
| [`deep-dives/`](deep-dives/README.md) | Each game's researched ladder, the subject studies under `subjects/`, and the research tracker |
| [DISCOVERY.md](DISCOVERY.md) | 2026-10-12 study of two ways in ("let's explore" and "let's play"), a run of games without retracing the catalog, and its build slices |
| [FAMILY-EXPERIENCE.md](FAMILY-EXPERIENCE.md) | 2026-10-12 design review of the whole family experience: the catalog, navigation, visual character, a world to revisit |
| [PHONE-PARTY.md](PHONE-PARTY.md) | 2026-10-23 proposal: one shared screen and everyone's phones, after Jackbox |
| [PHYSICS-GAMES.md](PHYSICS-GAMES.md) | 2026-10-14 research and plan for physics games |

## Reviews

Each is dated and keeps its numbered proposals (P1…, U1…); what was adopted became READY lines, definitions or code. All are in [`reviews/`](reviews/).

| Document | Reviews |
| --- | --- |
| [CRITTER-DAILY.md](reviews/CRITTER-DAILY.md), [TYPING-LAND.md](reviews/TYPING-LAND.md), [SPARK-AI-GAMES.md](reviews/SPARK-AI-GAMES.md), [POK-POK.md](reviews/POK-POK.md), [TOTOLOGIC.md](reviews/TOTOLOGIC.md) | Other games and apps, played as references |
| [UX-REVIEW-2026-11-09.md](reviews/UX-REVIEW-2026-11-09.md) | Our own screens and navigation |
| [CODEBASE-REVIEW-2026-11-07.md](reviews/CODEBASE-REVIEW-2026-11-07.md) | Our own code structure |
| [WORKFLOW-REVIEWS.md](reviews/WORKFLOW-REVIEWS.md) | How sessions work here: what was measured, what changed and why (the reasons behind the session guide) |

## History

[`archive/`](archive/README.md) holds superseded documents, old verification entries and decision records. History, not instructions: follow a link into it for a reason or a date, never for what to do.
