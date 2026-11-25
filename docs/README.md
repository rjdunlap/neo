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
| [`rework/`](rework/README.md) | The creature-world target, its work items (RW10 packet: [collection book](rework/COLLECTION-BOOK.md)) and the concept art (proposed until delivered) |
| [`definitions/`](definitions/) | One buildable definition per game or feature; read only the section for the level being built |
| [Ready for Adventure 4](definitions/ready-for-adventure-4.md) | Routines RA4, Ready for Adventure level 4: the parade request changes, so repair the bag and Check again; school |
| [Window Mosaic](definitions/window-mosaic.md) | Fractions R6, Pixel Pictures level 13: color a second window the same amount in a different shape, then pick the matching window; school |
| [Common Ground, level 1: A Place for You](definitions/common-ground.md) | Social-emotional slice 4: place a cushion by a window and a basket beside it for a visiting friend, then press Visit; a new school-only game |
| [Word Code](definitions/word-code.md) | Puzzle-pages PP9, levels 1–3: guess the hidden word by letter marks, picture words at school and five letters at grown-up |
| [Domino Pond](definitions/domino-pond.md) | Puzzle-pages PP2, levels 1–3, from dot matching to exact totals and comparisons |
| [Tide Tables](definitions/tide-tables.md) | Assign three jobs to a fictional harbor day using tide heights and job order, with multiple working schedules; grown-up, Lantern Lake |
| [Truth Bridge](definitions/truth-bridge.md) | Mark each islander Straight or Topsy until every sentence fits its speaker, then cross; levels 1–4 (the top adds planks), in two batches; grown-up, Lantern Lake |
| [Key It Out](definitions/key-it-out.md) | Name six or nine sketched invented creatures from a field guide's yes-or-no key (later with hidden parts, margin notes and a habits table); right names are stamped three at a time; levels 1–4, both batches built; grown-up, Lantern Lake |
| [Jar Clues](definitions/jar-clues.md) | Guess how many pebbles a jar holds, cross off the numbers each clue rules out on a 1–60 board, and choose between the last two or three by eye before the jar is poured and counted; levels 1–4, both batches built; grown-up, Lantern Lake |
| [Harbor Orders](definitions/harbor-orders.md) | Lay out what each of two or three workshops makes each morning (crates, boats and lanterns) on a planning board so the order is filled in the fewest mornings; levels 1–4, both batches built; grown-up, Lantern Lake |
| [Workshop Detective](definitions/workshop-detective.md) | Inquiry Q6, one case: mark what two records of a made-up bench lamp can show, then try the lever setting that tells two notes apart; grown-up, Lantern Lake |
| [Outcrop Detective](definitions/outcrop-detective.md) | Earth materials E6, levels 1–2: reorder four event cards to build a cliff's story, then say whether the rocks tell the order for sure and choose the look that decides; school and grownup, Lantern Lake |
| [Shadow Play](definitions/shadow-play.md) | Slide three flat cut-outs between a lamp and a screen (later turn them and swap rails) until the shadow fills a skyline outline; levels 1–4, both batches built; grown-up, Lantern Lake |
| [Fence the Field](definitions/fence-the-field.md) | Dots and boxes on a small field against the pet: claim a safe rail, then runs and the leave-two answer; levels 1–4, both batches built; grown-up, Lantern Lake |
| [Last Pebble 3–5](definitions/last-pebble-3-5.md) | Strategy-games SG3b: choose who goes first, bigger steps (take 3 or 4) and misère (last stone loses); two build batches |
| [Last Pebble](definitions/last-pebble.md) | Strategy-games SG3, levels 1–2: lay one or two stones across a stream in turn to reach the far bank, finding stepping stones back from the end; school (about 10 and up) and grown-up, Puzzle Peaks |
| [Sum Crates](definitions/sum-crates.md) | Puzzle-pages PP5, levels 1–3: crossing rows and columns of fruit crates that add to their signs, no repeat in a line; school 1–2, grown-up 3 |
| [Garden Rows level 11](definitions/garden-rows-bee.md) | Puzzle-pages PP4, The bee counts tall flowers: a 3×3 bed with visibility clues viewed from each gate |
| [Campsite](definitions/campsite.md) | Puzzle-pages PP6, school level 1: pitch three tents using row and column counts and one shared-edge pairing per tree |
| [Bunny Patches](definitions/bunny-patches.md) | Puzzle-pages PP3, levels 1–3: one bunny in every row, column and patch, none touching; pre-K 4×4 to school 6×6 |
| [Market Stall levels 12–13](definitions/market-stall-12-13.md) | Can I buy it? (does a purse cover a price, then spend it on two things) and Trade up (swap small coins for a bigger one); school, built after levels 8–11 |
| [Block Tower level 7](definitions/block-tower-mend.md) | Mend the leaning tower: move the top block under ropes, release, and see whether it stands; school, a repair interaction |
| [Egg Catch level 13](definitions/egg-catch-sorting-gate.md) | Sorting gate: place a shell-reading sorter at one junction and turn it so four mixed eggs reach their baskets; school, a placement interaction |
| [Swing Pals level 9](definitions/swing-pals-paint-the-beat.md) | Paint the beat: a paint pot on the swing paints wiggles on a rolling paper strip; the painting is kept only on request; preschool to school |
| [Swing Pals level 10](definitions/swing-pals-row-of-three.md) | A row of three: three swings of short, middle and long rope released together; guess which of two friends is back with the pointed friend first (the slowest meets the quickest first); a fitted row at 12° after the layout probe; school |
| [Notice Board levels 4–5](definitions/notice-board-4-5.md) | What did it leave out? (go and see the real stall) and Who's behind it? (open the club's door, ask the friend who does not sell it), with Story Stamp Checker absorbed as a paw pin; school |
| [Word Glue levels 5–6](definitions/word-glue-5-6.md) | What kind of thing? (tap the part a made thing is, the last word) and Which way round? (houseboat or boathouse); school, in two batches |
| [Word Glue level 7](definitions/word-glue-7.md) | Name the new thing: tap two pictures to name an invented thing, the thing it is last; school |
| [Word Glue levels 8–9](definitions/word-glue-8-9.md) | Suffix Workshop: Someone who (join an action to the person: painter) and Full of or without (fruitful or fruitless); school, in two batches |
| [Thought Bubbles level 4](definitions/thought-bubbles-4.md) | Two bubbles: two friends who saw different things, a bubble each; school top (about 9 and up), in two batches, upright phone play for levels 1–3 first |
| [Thought Bubbles level 5](definitions/thought-bubbles-5.md) | Who is telling?: two speech bubbles each hold a telling of two or three parts, and she drags in the friend who could have told each (the only friend there for every part told); school top (about 9 and up), one batch |
| [Look It Up levels 4–6](definitions/look-it-up-4-6.md) | Contents page (find an animal's page from a contents list), Picture or words? (the picture shows the baby, only the printed caption gives its name tag) and Two pages together (read one page, find another that says the same); school, in two batches |
| [Lasso Loops level 7](definitions/lasso-loops-too-few-too-many.md) | Too few, too many: loop one jar of ten, then tap away the guess cards that cannot be right (too few or too many) before the tens round checks the one that stays; school top, a new level on an existing interaction |
| [Shell Rows levels 4–5](definitions/shell-rows-4-5.md) | Two ways to win (set a shell that makes two rows at once) and Play it out (a whole gentle match where a tie is a good ending), with the grown-up seat as a second batch; school |
| [Maker Lane levels 4–5](definitions/maker-lane-4-5.md) | Stripes or plain (dye at the fleece, the yarn or the scarf; stripes need coloured yarn before the loom) and Two ways to a box (a log and old paper both become boxes); school, Cozy Village |
| [Draw the Pattern level 12](definitions/draw-the-pattern-your-pattern.md) | Your pattern: draw a hill or a dip in each empty place of a strip, with no wrong choice, then the pet says her pattern back and carries it to the end of the strip; pre-K and school |
| [Silly Scene](definitions/silly-scene.md) | Puzzle-pages PP7, levels 1–3: tap what could not happen in a familiar picture and hear why; preschool 1, pre-K 1–2, school 2–3, Puzzle Peaks |
| [Vine Snip level 6](definitions/vine-snip-where-will-it-land.md) | Where will it land?: predict where one orange lands when released through the same point heading right, then left, then watch both and replay free; school, a prediction interaction |
| [Play first, set up after](definitions/play-first.md) | TotoLogic P1: the first visit on a device with no visible profile is one picture choice (three age places) and a round as a guest that awards nothing until adopted; adoption is a rename; the guest flag, backups and two build slices |
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
| [CLAUDE-3D-ANIMATION-2026-11-22.md](reviews/CLAUDE-3D-ANIMATION-2026-11-22.md) | Tools and practices for 3D models and animation made with Claude, with a verdict on each for our creature art |
| [WORKFLOW-REVIEWS.md](reviews/WORKFLOW-REVIEWS.md) | How sessions work here: what was measured, what changed and why (the reasons behind the session guide) |

## History

[`archive/`](archive/README.md) holds superseded documents, old verification entries and decision records. History, not instructions: follow a link into it for a reason or a date, never for what to do.
