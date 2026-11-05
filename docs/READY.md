# Ready to build now

The pick list for one bounded session each (a game item may batch several related levels and content subtasks): **Next ten** is in priority order (eligible creature-world explorations first, then content slices), and **Queued** holds the other eligible build, definition and research slices grouped by game or study, in the order its dive gives. Take the first line of Next ten that no open PR, branch or worktree claims (`scripts/overlap.sh <game-id> <path>…`), read its dive or definition before claiming, and at closeout delete the landed line here, add a line for any slice the landing unblocks (the next level of a definition or dive) if it has none, and, when Next ten now holds fewer than five lines that a routine could take (unclaimed and not waiting on a person, device or developer), refill it in the same closeout from Queued (eligible RW items first), reserving at least three places for study definitions and one for research when available, and when Queued runs low, refill it from the dives' `## Build slices, in order` sections after checking each against `git log origin/main`.

Queue reconciled with `origin/main` 2026-10-21; related game work is grouped in [implementation batches](GAME-BATCHES.md), with original subtask scopes retained there. Settled October 23 identity/accounting/reviewer decisions use the [decision record](archive/DECISIONS-2026-10-23.md#standing-rules): building-session source and actual capacity checks still apply; practical-care and sensitive cultural content remain deferred. Study follow-ups and research were selected by the developer the same day; see the [study backlog](STUDY-BACKLOG.md). Each line keeps its check tier in parentheses; being ready for a rework exploration does not authorize its downstream implementation (RW02b's candidate generation runs through the [art request queue](rework/art-requests/QUEUE.md), not a session slice, and RW06–RW12 wait on the packets above them in the [sequence](rework/WORK-ITEMS.md#sequence)). Definitions and research below are explicitly selected for routine dispatch; their downstream builds still need their own ready packet. Never number these lines by hand: a deleted line must leave no gap.

## Next ten

- **`vine-snip`, slice 2: levels 4–5** (new-rules tier: typecheck, rule tests, one play of level 5 with one wrong-side keep and Grow back, one portrait screenshot at level 4, `fingerdemo` at 5): [definition](definitions/vine-snip.md#check-tier).
- **`block-topple`, slice 2: levels 4–5** (slice 1 built; new-rules tier: typecheck, rule tests, one play of level 4 with a thump then a high hit and level 5 with one wrong count, one portrait screenshot at level 4, `fingerdemo` at 5): [definition](definitions/block-topple.md#check-tier).
- **`brain-break`, levels 4–6 Sums in order** (new levels on an existing interaction: typecheck, rule tests, one play of level 6 with one wrong stone and the outline then to its sticker, one portrait screenshot of level 6, `fingerdemo` at 6): [definition](definitions/brain-break.md#sums-in-order-levels-46-definition-2026-11-03). Grownup only; stones show sums, from level 6 take-aways; same search, accounting and bot.
- **`sink-float`, level 10 *Salty or fresh* (batch sink-float 3)**, after batch sink-float 2 (built; new-interaction tier: typecheck, unit tests including the registry, lands, how-to and voice tests, one play of school level 10 through part 1, two wrong tanks on one egg question (glow, one hint), the duck question, to the sticker, one portrait and one landscape screenshot, `fingerdemo` at 10, one direct `control()` call for the two-tank ring, one build; no `couchgames`): [definition](definitions/salty-or-fresh.md), [dive](deep-dives/sink-float.md#build-slices-in-order), [batch](GAME-BATCHES.md#sink-float-3-salty-or-fresh).
- **`word-search`, level 7 *Just the theme* (batch word-search 4)**, after batch word-search 3 (built; new-interaction tier: typecheck, rule tests, one play of level 7 with a free non-theme line and two hints on one word, then to the sticker, one portrait screenshot of the blanks, `fingerdemo` at 7): [dive](deep-dives/word-search.md#build-slices-in-order), [batch](GAME-BATCHES.md#word-search-4-just-the-theme).

## Queued

- **Better voice V1 (remaining): render the rest of the slot-free script** (assets tier, offline check; status `person`): waits on the iPad listening check of the first 215 clips passes ([device check](DEVICE-CHECKS.md)), add more line-id prefixes to `scripts/voice-clips/clips.mjs` and render them locally; device speech stays the fallback. Slotted lines (V3) and Word Monsters' phonemes stay later. [A better voice](ROADMAP.md#a-better-voice)



- **RW14 slice 10, the other ten backdrops** (images only): after slices 4 and 6 pass their screenshot review. [POLISH.md](rework/POLISH.md#slice-10-the-other-ten-backdrops)

- **`sudoku-garden`, level 10 A 6 by 6 bed with sums in the cages (batch sudoku-garden 5)**, defined 2026-11-03; taken when no other Sudoku Garden batch is in flight (new-interaction tier: typecheck, rule tests, one play of level 10 with one wrong number and one cage hint, to the sticker, one landscape and one portrait screenshot, `fingerdemo` at 10, one build for the voice lines): [dive](deep-dives/sudoku-garden.md#build-slices-in-order), [definition](deep-dives/sudoku-garden.md#cage-beds-level-10-definition-2026-11-03), [batch](GAME-BATCHES.md#sudoku-garden-5-cage-beds).


- **`word-search`, school opening: level 8 four picture words (batch word-search 5)**, after batch word-search 2 (built) (new band entry with a layout change and a new list drawing: typecheck, rule tests, the registry, lands and how-to tests, one scripted school play of level 8 with two wrong lines (the second shows the ring without counting a hint), a tile tap, one Hint, to the sticker, one portrait screenshot, the logged 1024×768 and 1024×1365 sizes, `fingerdemo` at school 8, one build; no `couchgames`): [definition](definitions/word-search-school-opening.md), [dive](deep-dives/word-search.md#build-slices-in-order), [batch](GAME-BATCHES.md#word-search-5-school-opening).


### Study follow-ups (docs-only definitions)

Each line is selected for routine dispatch; claim one packet, then enqueue its unblocked builds. [Scope and cadence](STUDY-BACKLOG.md#dispatch-and-closeout).

### Subject research (docs only)

### Game research (docs only)

None left: Orchard Rows (2026-11-03) was the last unstarted game dive, and no unstarted subject research remains ([backlog](STUDY-BACKLOG.md#unstarted-game-deep-dives)). The research slot stays empty until a new game or subject is added.

## Blocked work (not routine picks)

- **Rework RW08 slice 3, the cutover** (approved by the developer 2026-10-23; starts only when they say they have played slices 1–2 on the iPad ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)), so no routine picks it up; shell, save and navigation tier): delete `classic/`, the map, age places and `?preview`. [Slice 3](rework/RW08-CUTOVER.md#slice-3-the-cutover-approved-starts-when-the-developer-has-played-slices-12)

Ordinary factual content uses the session source check under the [October 23 standing rules](archive/DECISIONS-2026-10-23.md#standing-rules). The [deferred research scopes](STUDY-BACKLOG.md#research-waiting-on-a-reviewer-decision) are not routine picks; translations still need fluent family review.
