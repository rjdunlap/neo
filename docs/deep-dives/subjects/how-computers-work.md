# How computers work: signals, representations and memory

**Subject:** `how-computers-work` · **Audiences:** L, T, P, K, S, U, M, G ([definitions](../subjects.md#the-audiences)) · **Date:** 2026-10-15 · **Session:** `codex/how-computers-work-research`, [PR #345](https://github.com/rjdunlap/neo/pull/345).

Research and proposals only; no implementation. Recommend developing the existing **Sorting Machine** candidate first: build an inspectable rule, test it on different inputs, and repair it from a visible counterexample. Its **Festival Signals** case gives older children and parents a complete design puzzle. Next define **Picture Bytes** inside Pixel Pictures for representation, then **Memory Desk** for a distinct storage interaction. Keep electrical loops in Circuit Garden and executable instruction sequences in the programming study. The [roadmap packets](../../ROADMAP.md#how-computers-work-recommendations) are definitions to write before builds, not a new scheduled queue.

## Anchors and evidence limits

Opened primary curriculum and practitioner sources; no reference game was played. These sources suggest concepts and presentation, not proof of independent use or transfer from our proposed games.

| Opened source | What was read and implication |
| --- | --- |
| [CSTA 2026 standards](https://csteachers.org/2026-csta-pk-12-computer-science-standards/), printed pp. 75–76 | **EK-SYS-HW-11:** purposeful tools. **E1-SYS-HW-11:** external hardware. **E2-SYS-HW-11:** input/output. **E3-SYS-HW-12:** software's role. **E4-SYS-HW-12:** troubleshooting. **E5-SYS-HW-12:** processing/storage. Its boundary explicitly excludes requiring gate diagrams, machine-level binary or number bases. Our optional gates are enrichment, not prerequisites or a claim of standards alignment |
| [CSTA 2017 standards](https://csteachers.org/wp-content/uploads/2025/03/csta-k-12-computer-science-standards-revised.pdf), PDF pp. 4, 6, 8 | Historical anchors, kept distinct from 2026: **1A-CS-02**, hardware purpose; **1A-DA-05**, storing/retrieving/modifying data; **1B-CS-02**, hardware/software systems; **2-DA-07**, multiple encodings. The URL's 2025 folder is not the edition |
| [ISTE student standards](https://iste.org/standards/students), **1.1.d Technology Fundamentals** | Broad understanding and purposeful technology use. This does not prescribe binary drills, gate mastery or a birthday for introducing them |
| [K–12 CS Framework: early childhood](https://k12cs.org/pre-k/) | Play, representation, patterns, visible problem solving and collaboration supply a preschool approach. Practitioner framework, not an intervention demonstrating toddler gate knowledge |
| [CS Unplugged binary lessons](https://www.csunplugged.org/en/topics/binary-numbers/) and [5–7 lesson](https://www.csunplugged.org/en/topics/binary-numbers/how-binary-digits-work-junior/) | Separate 5–7 and 8–10 guidance. Authors emphasize number knowledge at 5–7 rather than formal base systems, and discuss counting zero among possible values. Use visible states and concrete meaning first; no timed conversions |
| [Nand to Tetris, Boolean logic](https://www.nand2tetris.org/project01) and [memory](https://www.nand2tetris.org/project03) | Technical references distinguish combinational functions from retained state and test outputs against a contract. Useful for model correctness, not evidence that a child should build RAM or a CPU |

No controlled study of toddler digital-logic learning or engagement with these particular tween/parent puzzles was established in this session. The [tracker's tween evidence](../subjects.md#what-the-search-found-about-the-older-range-2026-10-14) offers hypotheses about choice, challenge and shared play, not validation of these candidates. The course's [own audience description](https://www.nand2tetris.org/) reaches high school and beyond; its scope is not a recommended island ladder.

## What people can do: proposals by age

These are starting points to observe, not age tests. Keep all instructions replayable and all relevant state visible.

| Audience | Supported starting point and limit |
| --- | --- |
| L, under 2 | A touch produces a visible response in an existing toy. No claim of input/output vocabulary, binary understanding or a need for a new computer game |
| T, about 2 | Try a large button and notice which toy responds. A caregiver may narrate; choosing between live and stored values or programming predicates is not established |
| P, about 3 | Match a pictured input with its output and explore changing it. Keep one relation visible; no formal gate editor recommended for this opening |
| K, about 4–5 | Explore pictured attributes and an explicit rule with support; start with existing sorting. A new symbolic editor needs observation before a pre-K range is proposed |
| S, about 6–8 | Trial a single editable sensor, then combine two inputs. Two-state representations can have a concrete picture meaning; arithmetic and abstract diagrams stay optional |
| U, about 9–12 | Compare truth tables, locate a counterexample, distinguish live from stored information and revise a design. These add decisions rather than longer lists |
| M, about 11–14 | A 12-year-old might choose the Festival Signals design/repair case; a 13-year-old might choose the same puzzle on the grown-up shelf. Appeal remains untested. Use top `school` through 12 and `grownup` from 13, subject to explicit registration/range definition; do not invent a band |
| G | Offer a self-contained design puzzle, builder/tester co-play, and a separate plain-HTML family activity card. None depends on a parent teaching a vocabulary lesson first |

## On the island today

Source audit of [GAMES](../../GAMES.md), the relevant `index.ts`/`logic.ts` files, [candidate notebook](../../IDEAS.md#candidates), [catalog gaps](../../IDEAS.md#gaps-in-the-catalog), [experience pilot](../../FAMILY-EXPERIENCE.md#new-game-and-mode-pilots-after-research) and [zone concepts](../../ROADMAP.md#zone-concepts). This is not new browser verification.

| Built game or proposal | Reuse and boundary |
| --- | --- |
| **Critter Sort**, pre-K/school | Attribute sorting, overlap, NOT and a worked-example entry. Prefer it when the action is putting an object in its set. Preschool is not registered |
| **Critter Crossing**, pre-K/school | Observe a hidden rule; school 6 has OR and 7 has a distinguishing test. A second game that merely guesses a rule duplicates this. Sorting Machine must let the player construct the rule and inspect intermediate signals |
| **Sorting Machine**, existing notebook/pilot | Already proposes sensors, AND/OR/NOT and visible history. Develop this identity; Gertrude's Secrets remains a historical comparison, not freshly verified here |
| **Rule Parade**, proposal | Flexible classification rules, not built. Keep its rule-switching identity separate; do not imply that Critter Sort → Crossing → Rule Parade is an implemented prerequisite chain |
| **Pixel Pictures**, preschool/pre-K/school | Copy, mirror and nonogram modes; current `PixelMode` has no encoded-row mode. Picture Bytes belongs here if the action remains composing/decoding the picture. Preserve existing levels 1–6 and picture-saving behavior |
| **Secret Code**, pre-K/school | Mastermind-style deduction from feedback. A secret combination is not a binary encoding or a program. Keep maker/breaker in its existing proposal |
| **Number Nook**, grown-up only | Sliding-tile spatial/order puzzle. Its numbers do not make it an appropriate home for binary place value |
| **Robot Path / Machine Line / Parcel Programs**, programming study | Routes, object transformations and proposed input/output programs. Memory Desk earns a new game only through direct write/read/hold behavior; if it becomes a command program, fold it into Parcel Programs |
| **Circuit Garden**, energy/waves proposal | Battery, terminals, return path and switches. Sorting Machine's lines carry abstract Boolean values; they are not wires transporting current. No physical circuit solver is needed |

Tinker Lab exists and already has thirteen game IDs in its land list at this base; adding another requires a capacity check, not smaller targets. Lantern Lake is a possible grown-up home subject to the same check. Maker Harbor and Skywatch Isles remain proposed zones. No new engine, real device access, network, camera/microphone, account, project persistence or save migration is required for the first definitions.

## Similar games, apps and unplugged play

Five digital precedents with opened first-party descriptions, plus two physical/unplugged references. Progression below is limited to what those descriptions establish; a listed feature is not evidence of an exact level order or educational effectiveness. Exclusions are our adaptation choices.

| Reference / kind | How progression grows | Borrow | Leave out / evidence limit |
| --- | --- | --- | --- |
| [Turing Complete](https://turingcomplete.game/), digital construction puzzle | NAND to other gates, components and memory, computers, then assembly | Reuse a component's understandable input/output contract; reveal an intermediate value | Full computer-building requirement, opaque parts and leaderboard framing. Official concept order read; no puzzles played |
| [Digital Logic Sim](https://sebastian.itch.io/digital-logic-sim), digital sandbox | Begin with NAND and make custom chips in layers; no prescribed goal | Persistent signal display and a component inspector | An unbounded blank editor. Island rounds need an approachable first action and finish; page describes a simulator, not a tested curriculum |
| [SHENZHEN I/O](https://www.zachtronics.com/shenzhen-io/), digital engineering puzzle | Microcontrollers, memory and logic components, conditional instructions and sandbox devices; detailed introductory order not established | A pictured behavior brief and several valid constructions | Assembly typing, datasheet dependence, employment framing and optimization comparisons |
| [TIS-100](https://zachtronics.com/tis-100/), digital repair puzzle | Repair code segments, then create challenges; source describes optional efficiency comparisons | Trace a faulty system and keep a useful failing input | Concurrent processors, text-heavy manuals, cycle/size competition. Not a reason to turn this subject into another programming study |
| [Human Resource Machine](https://tomorrowcorporation.com/humanresourcemachine), digital input/output puzzle | Two initial commands expand; visible held item, floor memory, inbox and outbox | Separate current input, stored copy and output; inspect what changes | Job threat/promotion framing and optimization pressure. Its program editor belongs closer to Parcel Programs |
| [Turing Tumble](https://upperstory.com/en/turingtumble/), physical construction game | Routing to stored bits; publisher identifies binary at puzzle 21 and addition at 37, marketed 8–adult | A bit stays in a visible state and a run can be explained | A new marble engine, complex mechanism board or rescue urgency. Publisher claims are not developmental research; no physical kit tried |
| [CS Unplugged binary](https://www.csunplugged.org/en/topics/binary-numbers/), table activity | Two-sided cards represent values; later codes for letters and patterns | A shared visible key, two states and meaningful decoding | Speed races, memorizing character codes or presenting one toy alphabet as a universal standard. Any adapted family card is a later reviewed packet |

**Access gaps:** Rocky's Boots co-author page and its manual PDF failed to open, and Robot Odyssey did not yield an opened original source. Keep both as tracker precedents to revisit; do not borrow detailed progression from memory. NandGame returned a JavaScript-only shell. Computer Science Field Guide pages failed. None is counted among the five opened digital precedents.

## What fits, and what does not

The satisfying act is making a transparent machine do what its pictured brief asks: a friend crosses, a tiny picture appears, a stored message survives an input change. Editable rules and an intelligible trace justify Sorting Machine; ordinary sorting stays in Critter Sort. Repeated comparisons belong in the same machine, not a second title for each gate.

Represent Boolean false with a distinct hollow/flat token and true with a filled/raised token, alongside optional 0/1 labels. Never rely on red/green alone. A false value is a valid result, not a broken connection; an unfilled editor slot is a separate state. Animated dots explain evaluation order and settle to a static trace; they are not electrical charges or a physically accurate signal-speed model. All tools and fixtures remain available without unlocks, resource scarcity or payment. No lives, round timer, mandatory efficiency ranking or away-time maintenance.

## An answer for every audience

| Audience | First action without an adult supplying the answer | Deeper rung / home |
| --- | --- | --- |
| L | Touch an existing Bubble Pop or music-toy control and see its immediate response | None for formal computing, because no infant symbolic-readiness evidence was established. Shared cause/effect play is sufficient |
| T | Tap the familiar toy's pictured control to make its response | Choose between two visible responses within that existing toy if observation supports it; no new gate game or binary claim |
| P | Tap picture cells in existing Pixel Pictures, watch the picture change | Try one visible row/key in a supported Picture Bytes experiment only after observation; no proposed preschool encoding range yet |
| K | Sort by a pictured attribute in Critter Sort | Compare the result with a visible sensor demonstration. Formal machine authoring remains an observation question, not an automatic younger opening |
| S | Choose a hat sensor and send a hat/no-hat critter through Sorting Machine | AND/OR/NOT with all input cases visible; later decode a four-bit picture row |
| U | Repair a gate from a failing row | Festival Signals' XOR design, equivalent machines, then Memory Desk's write/hold distinction |
| M | Choose a design brief and build a machine that satisfies every pictured case | Counterexample repair and state traces. Proposed top `school` through 12; 13+ uses `grownup` only after registration is resolved |
| G: play | Build Festival Signals without a tutorial lecture | Compare a second valid construction voluntarily; no shortest-solution requirement |
| G: play-with | One person builds, the other selects a test critter; swap | Ask which test distinguishes two machines; pet offers solo tests. No hidden on-device clue or second device needed |
| G: page tool | A plain-HTML pictured card for large two-sided paper cards and a decoder key | Make a short picture message together and change one position. Define/review the card later under the existing practical-card review process; no card drafted here |

## Candidates and priority

Effort: S small definition/content extension; M new finite interaction; L larger editor/state scope. All are proposals. Naming an older audience is not an implemented band range.

| Candidate | Fun action and learning purpose | Audiences | Effort / infrastructure / recommendation |
| --- | --- | --- | --- |
| **Sorting Machine**, develop existing seed first | Assemble sensors/gates to send the right critters to a festival; Boolean composition, tracing and test coverage | S first; U/M/G depth; K only after observation | M. Bounded acyclic rule graph and exhaustive evaluator local to the game. No conveyor physics or general circuit editor |
| **Festival Signals**, older Sorting Machine mode | Build a welcome signal for exactly one of two badges; all four cases must work | U/M/G | M after base editor; up to four gate slots and equivalent-solution acceptance. Same game identity; resolve grown-up registration |
| **Picture Bytes**, Pixel Pictures mode | Flip a four-bit row and decode it into a picture; the same information can have different representations | S first; U/M comparison depth | S–M. Fixed row order and explicit key; reuse picture rendering and current creation format if supported. No new binary arithmetic game |
| **Memory Desk**, second distinct new-game candidate | Store a pictured message, change live input and recall the old value; separate input, state and output | S/U first; M/G conditional-write cases | M. Small discrete state machine, all state visible; no recursive feedback wiring or persistent project. Consolidate with Parcel Programs if authored commands become central |
| **Computer Helper**, later existing-game content | Trace a pictured button → program → screen response and locate one disconnected stage | K/S | S–M only if an existing Little Helpers/Day by Day action can host it. Otherwise defer until a new interaction earns its place; no generic hardware-naming quiz |

Do not add a binary number game merely because a number-themed home exists. A later Picture Bytes comparison can offer weights 4/2/1 beside the same three bits, including 000, if it teaches representation instead of reproducing a sum puzzle. Cipher-wheel decoding remains the separate Decoder Ring seed; binary encoding is not encryption or secrecy.

## First game's proposed ladder: Sorting Machine

**Starting proposal:** school 1–5, then school 6–8 for older interest; a grown-up case has a separate registration/range decision. These numbers are a new game's draft sequence, not edits to another game's saved levels. No lap/toddler/preschool range is proposed. The first build should be levels 1–2, followed by 3 in another complete slice.

Let A mean **wears a hat**, B mean **has whiskers**, and C mean **wears boots**, with drawn fixtures explicitly spanning the relevant combinations. Accessories are arbitrary toy properties, never an actual species rule. Only add C when three-input play is defined. Each fixture has a stable attribute tuple; visual species variety must not change its truth value.

| Draft level / first round | Decision and finish | Mistake, useful help and future rule proof | Cost |
| --- | --- | --- | --- |
| **1. See the signal**: fixed hat sensor, a hat critter and a no-hat critter, one Send button | Send each once, inspect sensor/output, then Done. A low token keeps the gate resting; it is still a completed test | No wrong exploration or prediction; Help replays the changing input. Test both outputs and require both distinct fixtures observed; label completion as supported exposure, not gate mastery | M, base interaction |
| **2. Choose the sensor**: request admits hats; choose hat or whisker sensor | Build a one-sensor rule. Try any of four fixtures freely; Check evaluates all four and completes on an exact match | Whisker-only differs on A=1/B=0 and A=0/B=1. Show one counterexample and glow the sensor slot after two failed Checks. Prove the target is expressible and candidates are distinguishable | S after base |
| **3. Both badges**: a hat-and-whiskers request, fixed A/B sources and one operator slot | Choose AND or OR; inspect each incoming value and the combined output; Check all four cases | OR wrongly admits a hat-only critter. Help traces that row and offers AND as a local repair. Test 00→0, 01→0, 10→0, 11→1; the fixture set must include both mixed cases | S–M |
| **4. Either badge**: the sign accepts either or both | Same editor, choose OR; all four rows count | AND wrongly leaves a one-badge friend waiting. Explicitly show both-badges accepted so inclusive OR is clear. Test all four rows, not only single-badge examples | S |
| **5. No hat needed**: request admits no-hat critters | Add unary NOT after A; no B input required | Treating false as a fault is exploration; a failed Check traces A=0→1. Test both values and preserve unary arity; never let NOT turn an empty socket into true | S–M |
| **6. Hat, without whiskers** | Compose A AND NOT B in two slots; Check all four | Show the first mismatching row; highlight a slot whose replacement can reach a solution. Exhaustively verify every accepted graph and that suggested repair helps | M |
| **7. Same welcome, different machine** | Given NOT(A OR B), construct an equivalent machine from a supplied finite palette, e.g. NOT A AND NOT B | Similar-looking wires are not the criterion; acceptance compares all four outputs. A valid alternative is never rejected for differing from the authored graph | M |
| **8. Festival Signals** | Exactly one badge; four-slot construction and optional starting-machine repair, detailed below | Counterexample distinguishes OR from XOR; support preserves valid work and can complete the machine | M after older editor definition |

### Rules, support and completion contract to define

Start with a finite acyclic graph: two Boolean source values, one chosen sensor at level 2, unary NOT and binary AND/OR, one output, fixed forward-only socket choices. No cycles, floating-wire physics, delays, feedback oscillation, clocking, transistor models or gate minimization. Represent an incomplete graph as **incomplete**, not false. Empty Check asks for the missing slot without a miss.

Send and Step are free experiments, including deliberately bad predictions and replaying known results. Check is an explicit claim that the pictured brief is satisfied; one fully connected but failing submission counts **one miss**, regardless of how many rows fail. Present a gentle boing, spoken reason and persistent failing row. After two failed Checks, add one counted hint that glows a useful slot. Requested Help is counted; ordinary trace/replay and opening the how-to are not. Undo and Start over preserve miss/hint accounting. Stop/replay never loses critters; every fixture remains available.

Help should find a compatible completion in the finite graph set, preserve correct work when possible, and point to a meaningful next edit; when no completion preserves the current graph, explain the incompatible slot and offer a local replacement. Repeated Help can install a valid machine and invite Check. Assisted success earns the same single shell sticker and reports its actual hints. Level 1's two free tests must not be treated as evidence of independent mastery; its definition must resolve adaptation before implementation, using existing result/accounting contracts or an explicit shared-change proposal.

The entire validation domain is visible, though a selected-row inspector may show one large row at a time. Check must evaluate the full finite domain independent of presentation order, including untried rows; it may show the first failure without forcing every animation. A successful Check ends one machine brief through `ctx.finish`. All paused runs, callbacks and selected inputs are scene-owned and cancellation-safe. Future rule tests should prove determinism over seeds, complete input coverage, solvability within slots, alternative equivalence, exact accounting and useful/recoverable hints.

## Festival Signals: one older family case

**Brief:** the welcome lantern lights for a hat **or** whiskers, but rests when a friend has both or neither. The pictured request shows all four rows from the outset. This is a fictional signal-processing task, not a real electrical installation or rule about excluding people.

| A: hat | B: whiskers | Required signal |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

A bounded four-gate palette can express `(A OR B) AND NOT(A AND B)`. Another accepted solution is `(A AND NOT B) OR (NOT A AND B)` using five gates, so it belongs only in a later palette that actually has five slots; do not promise it in a four-slot case. Input-port swaps and any other expressible equivalent four-slot graph are accepted. Optional repair starts from `A OR B`; trying 11 reveals the difference. The test history remains on screen; remembering earlier trials is not the challenge.

The first older slice has one output and at most four editable gates. A compact diagram is a noninteractive overview; a selected-slot inspector has 100-unit controls for school players. Do not shrink all gates to fit. Grown-up-only play can use the repository's 64-unit minimum after its registration is resolved. Choose a slot, choose operator and forward source connections, then Step/Send/Check; provide tap alternatives to every drag. No arbitrary crossing wires or on-screen keyboard. All four rows must agree; shortest graph, speed and fewest tests never gate completion.

An older parent can enjoy designing and repairing this machine for themselves; builder/tester role swaps offer co-play using the same visible fixtures. Whether a 12-year-old or parent voluntarily replays it is an observation question, not established by a working solver. Avoid calling it a grown-up activity until that version and its destination exist.

## Picture Bytes and Memory Desk: bounded follow-ups

**Picture Bytes:** begin with one four-cell monochrome row and an explicit left-to-right key: filled square = 1, empty square = 0. Flip four large bit cards, press Decode, and see that exact row appear. A reference row remains visible; Check asks for the same pattern, not a decimal total. Next select each row of an existing 4×4 original picture, keeping all sixteen cells in a noninteractive preview and only four bit controls active. Avoid confusing this row encoding with nonogram run lengths. Later compare two explicitly shown palettes/keys so the same bits can mean different things. Free flips/decodes/undo; failed Check points to a differing bit, two misses glow it, and counted help can set it. Test encode/decode round trips for all sixteen rows, fixed traversal order and every valid empty/filled case. No claim of ASCII, Unicode or a standard image file format. Any two-palette encoding is an authored toy key. Add no storage fields; use an already-supported picture creation only if its shape matches.

**Memory Desk:** three separate panels show current input, stored copy and output. Choose one pictured token, Store it, choose a different input, then Recall: the output shows the stored token. Show the saved value throughout; this teaches a machine's state rather than testing the player's memory. First round finishes after this contrast and Done, with free experimentation. Later a discrete Step samples an enable switch: `nextStored = enable ? input : stored`; output reads the stored value after the step. Initial state, write-before-read ordering and reset are explicit. Compare two short visible traces, preserving all prior values, then repair an enable setting for an explicit Check. Test the whole two-token/Boolean-enable transition table. Use a primitive register, not a recursive gate latch. Consolidate with Parcel Programs if the central act becomes authoring Store/Recall commands rather than operating and inspecting the device. No automatic persistence or away-time change; physical memory and disk behavior are more varied than this toy register.

## Experience and presentation

**First unsupported action:** one stationary critter waits beside a large Send control, with a pictured hat sensor and gate visible. Touch-down depresses the control and pulses its outline immediately; a single critter advances in a scene-owned animation, its A value settles into a shaped token, and the gate opens or rests. No scrolling conveyor demands a well-timed tap. The child can replay a spoken instruction through the guide, pause the evaluation and Step each stage. Stopped animation still shows the complete result without sound. Proposed speech belongs in `voice-script.ts` when built; no lines added this session.

**Replay:** seeded cosmetic critters and request/sensor permutations vary the scene while preserving complete input tuples. Cosmetic reordering never replaces a needed counterexample. Older cases vary the target truth table only when a bounded solution and useful hint are known. One successful brief is a round. No endless automatic next order, rare part, clock or obligation to return.

**Visuals and layout:** code-drawn Pixi art and palette colors only; noninteractive decorations cannot intercept controls. Reserve the bottom-left pet and shell corners. Prefer an input panel, selected gate inspector and result panel that can reflow between landscape and portrait; the summary diagram need not be a tap target. Keep at least 100 logical units after scaling for every child control. Include a real ghost-finger bot that constructs through the same taps and explicitly Checks; a direct solver mutation is not a demonstration. Do not assume controller/couch support from touch play; those are separately scoped work.

**Off-screen follow-up:** recommend a later grown-ups' card using large two-sided paper panels and a pictured decoding key, swapping author/reader roles. This is an activity proposal, not instructions for a toddler or a parts list. Named review under the tracker’s practical-card rule precedes release. Do not introduce marbles, electronic components or device repair instructions as toddler companions.

## Decisions for the developer

- **Identity and placement:** recommend Sorting Machine only with a constructed, traced rule. Keep picture encoding inside Pixel Pictures. Confirm school-first ranges, Tinker Lab capacity and older school/grown-up identity/destination when the definitions are selected; no new zone or middle band is assumed.
- **Exposure versus mastery:** choose an adaptation policy for level 1's exploratory completion before implementation. Do not manufacture misses/hints or count button presses as Boolean understanding. Existing saved levels, pins and result contracts remain intact in this study.
- **Older editor scope:** start Festival Signals with four gate slots, a selected-slot inspector and full-domain checking. A larger five-slot equivalence palette is later work. Confirm whether a grown-up registration shares the interaction while keeping stable game IDs and appropriate ranges.
- **Model/content review:** recommend a CS educator review the distinction between data, signals, programs, physical current and memory. The screen-only definitions can proceed. An adapted practical family card requires the existing named-review process; none is drafted or approved here.
- **State ownership:** prefer Memory Desk as direct manipulation; consolidate it with Parcel Programs if program authoring becomes its core. No custom saved-machine format without a separate storage decision.

## Build slices, in order

Each row is sized as one future session. Definitions are docs only; a build starts only after its packet fixes interaction, rules, content, support, finish and integration. Do not build all rungs together.

| Slice | Complete outcome | Dependency and proportionate future checks |
| --- | --- | --- |
| **H1 — define Sorting Machine 1–3** | Freeze fixtures, graph/socket schema, first rounds, free Send versus Check accounting, adaptive policy, useful help/assisted finish, spoken/how-to content, ghost-finger inputs and both layouts; audit overlap, ranges and land capacity | Start now, docs links/diff. Resolve Festival Signals' graph compatibility without building it |
| **H2 — build Sorting Machine 1–2** | One complete exposure round and one editable sensor brief through shell reward/navigation, with all-valid support | H1 approved scope/accounting. New-game tier: typecheck, units, one filtered first/top play with wrong Check/help and portrait; build for shared registry/content changes. Navigation/offline checks only if affected shared behavior changes |
| **H3 — build level 3** | AND/OR choice with two incoming signals and all four cases | H2; new-interaction tier for first combined-gate action, scoped to this game. Later levels 4–5 can be their own new-level packets |
| **H4 — define Festival Signals** | Exact XOR brief, four-slot grammar, legal forward connections, full-domain equivalence, selected-slot layout, repair/help, older placement and role swaps | H1 model; docs links/diff. Do not require the entire younger ladder to be built before defining the older case |
| **H5 — build one older brief** | One complete construction/repair round, accepted equivalent machines and a supported finish | H4 plus required editor implementation/registration decision. New-interaction tier; filtered couch checks only if couch support is actually added |
| **H6 — define Picture Bytes** | Four-bit row, 4×4 follow-up, exact key/traversal, free decode versus Check, existing-level preservation, speech/how-to/demo and creation-format audit | Independent of H2; docs links/diff, no new standalone title |
| **H7 — build one encoded row mode** | A complete Pixel Pictures round using the visible four-bit key and supported finish | H6; new-interaction tier and registry/how-to checks if ranges/cards change. No renumbering 1–6 |
| **H8 — define Memory Desk** | One Store/change/Recall contrast, explicit state table, later enable case, consolidation decision, exposure accounting and layout | Independent packet after overlap with Parcel Programs; docs links/diff. A later build uses the new-game tier |
| **H9 — reviewed family card** | One optional plain-HTML picture-encoding activity card, with source and named review | Existing off-screen-companion process; no health, electrical or repair advice inferred from a logic game |

## What was built and what ran

Nothing implemented. No source, tests, assets, schemas or practical cards changed; no server started. Updated the subject tracker, candidate notebook, roadmap definition packets and decision/device records. Opened the sources above during the 2026-10-14–15 session and recorded access failures rather than substituting recollection. Markdown links/anchors and `git diff --check` are the docs-only checks recorded in [VERIFICATION](../../VERIFICATION.md#2026-10-15--how-computers-work-subject-research).

Not run: typecheck, units, build, browser/offline suites, reference-game play, iPad speech/input, child/parent observation or a transfer study. Model correctness, proposed registration/ranges/layout and supported completion still need implementation-specific proof; independent understanding, appeal and transfer remain unestablished.
