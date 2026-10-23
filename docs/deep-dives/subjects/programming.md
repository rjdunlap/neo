# Programming: make something happen

**Subject:** `programming` · **Audiences:** L, T, P, K, S, U, M, G · **Date:** 2026-10-14 · **Session:** `codex/programming-subject-research` · repository read at `5222d51`.

Research and proposals only, following [chunk 28](../../ROADMAP.md#next-up) and the [subject procedure](../subjects.md#the-procedure-one-session-one-subject). Source pages were opened on the session date, with extraction limits below. No reference game was installed or played; no game, interpreter or parent tool was built.

**P1 definition:** [Cue Studio 1–3](../../definitions/cue-studio.md), 2026-10-22, [PR #834](https://github.com/rjdunlap/neo/pull/834), docs only. Identity, band/entry/accounting and land decisions remain open; P2 is gated. This packet supersedes the provisional first-three-level details below, including its proposed band windows; later levels remain research proposals.

**Recommendation:** define **Cue Studio** first: make a pet perform a tiny program, then connect an event to another character's response. It earns a separate identity only if the child actually edits executable commands; choosing story endings stays in Story Steps. Develop the existing **Machine Line** seed next for transforming objects, then **Parcel Programs** for older children and parents: one reusable program must work on several visible input trays. Keep waypoints, loop repair and reusable route routines in **Robot Path**, through its existing decisions and dive. These are docs-first recommendations, not a scheduled queue or approved registrations.

## Anchors and evidence limits

The older game study cites the 2017 CSTA standards. The live CSTA site now presents a 2026 revision. Keep editions explicit; do not silently replace old codes or claim alignment.

| Opened source | What was read / design implication |
| --- | --- |
| [CSTA 2026 PK–12 standards](https://csteachers.org/2026-csta-pk-12-computer-science-standards/), printed pp. 49–51, 55, 59–60 | **EK-PRO-PD-04:** ordered commands, including unplugged expression. **E2-PRO-PD-04 / E2-PRO-TR-07:** events/iteration and simple debugging. **E3-PRO-PD-04:** selection. **E4-PRO-PD-04:** compare correctness/clarity. **E4-PRO-VD-06 / E5-PRO-VD-06:** trace then manipulate stored values. **MS-PRO-PD-12 / MS-PRO-VD-16:** procedures and typed values. Progress from visible action to tracing, reuse and data; these are curriculum expectations, not age-readiness evidence |
| [CSTA 2017 PDF](https://csteachers.org/wp-content/uploads/2025/03/csta-k-12-computer-science-standards-revised.pdf), pp. 4–9 | Opened **1A-AP-10/14**, **1B-AP-09/10/12/15/16**, **2-AP-12/14/17**: sequences, debugging, variables, events, reuse, collaboration and test cases. These remain historical anchors for the Robot Path dive; the 2025 URL directory is not the standards edition |
| [CAL-ScratchJr cluster-randomized trial, Yang et al., Learning and Instruction 95 (2025)](https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2024/10/blockimpact_paper_2024.pdf), abstract and limitations | Eleven schools, 21 second-grade classrooms, a 24-lesson curriculum: medium positive coding effect, no significant computational-thinking effect. Implementation varied and follow-up was limited. This is classroom/curriculum evidence, not evidence that a short island game improves general reasoning or transfers to schoolwork |
| [Official ScratchJr teaching resources](https://sites.bc.edu/scratchjr/teach/) | Describes scaffolded Pre-K–2 work, ages 4–8, through storytelling, coding and play. Practitioner guidance supports a concrete expressive starting point; it does not establish independent use at 3 or younger |
| [CS Unplugged Kidbots](https://www.csunplugged.org/en/topics/kidbots/) | Separates designing, coding, testing and debugging through roles; includes 5–7 and 8–10 lessons. Borrow role exchange and explainable commands, not a claim that all-age appeal has been tested here |

The [2026 overview](https://csteachers.org/pk12standards/) was also opened to confirm the edition and grade organization. The study above does not establish readiness for toddlers, transfer, or sustained tween/parent engagement. A [preschool ScratchJr paper](https://doi.org/10.1016/j.heliyon.2024.e30482) appeared in search, but its full publisher page returned 403; it is **not** an opened developmental anchor. No toddler programming-intervention evidence was established. The tracker’s [tween research](../subjects.md#what-the-search-found-about-the-older-range-2026-10-14) supplies tentative autonomy/challenge/relatedness hypotheses, not demand for these games.

## What people can do: implications by age

These are proposed entry points to observe, not birthday thresholds or assessments. Curriculum ages and audience preferences are different evidence.

| Audience | Supported starting point and limit |
| --- | --- |
| L, under 2 | Immediate touch/effect in existing toys. No claim of programming, symbolic sequencing or independent program authorship |
| T, about 2 | Choose one pictured action and see it performed. A two-stage editor is a hypothesis with a grown-up, not a reason to extend bands now |
| P, about 3 | Try one command then Play, with the output always visible. If the child repeatedly taps the character expecting immediate movement, keep direct play; ScratchJr guidance does not establish this age's readiness |
| K, about 4–5 | Two visible commands and an editable order, with a demonstration and no remembered verbal list. Official early-years curriculum makes this a reasonable design trial |
| S, about 6–8 | Trace an event, repair one command, compare a repeat with an expanded sequence. The classroom trial supports teaching concrete code without promising general reasoning gains |
| U, about 9–12 | Reuse a routine and check it on contrasting inputs; visible stored values and counterexamples give decisions beyond a longer sequence |
| M, about 11–14 | Author a compact behavior or repair a data-processing program, choose tests and compare alternatives. Appeal is untested; 11–12 can be proposed at top `school`, 13+ at existing `grownup`; no new band |
| G | A satisfying input/output puzzle, shared author/tester roles and a plain-HTML conversation card are separate offers. Parent interest must be observed, not inferred from children's coding studies |

## On the island today

Read [GAMES](../../GAMES.md#robot-path), `src/games/robot-path/{index,logic}.ts`, Story Steps' theater logic, the [Robot Path dive](../robot-path.md), [candidate notebook](../../IDEAS.md#candidates), [catalog gaps](../../IDEAS.md#gaps-in-the-catalog) and [zone concepts](../../ROADMAP.md#zone-concepts). This is a source audit, not fresh play verification.

| Existing activity or proposal | Coverage and boundary |
| --- | --- |
| **Robot Path**, preschool–school | Built preschool 1–2, pre-K 1–6, school 4–12; three seeded boards per programming level 1–10, counted moves 7–8, whole-program loops 9–10, unscored prediction 11, repair 12. Waypoint 13, loop repair 14 and routine 15 remain proposals. Current `RobotMode` is steps/counts/loop: **conditionals, variables and functions are not implemented** |
| **Story Steps / Story Theater** | Built authored cause/effect choices and replayable revised endings. Extend it for narrative choice; Cue Studio must expose an executable command sequence/event binding, rather than relabel a story choice as coding |
| **Song Maker / Beat Builder / Dance Workshop** | Musical phrases, rhythms and proposed move composition. Keep timed music composition there. Cue Studio starts with untimed non-musical actions and no physical instruction |
| **Puppet Workshop**, proposal | Mechanical cams/gear phases make a scene move. Keep its physical mechanism identity; Cue Studio edits symbolic behavior. If either reduces to picking a canned animation, consolidate before building |
| **Machine Line**, existing seed | Paint/stripe/turn an object. Develop this identity; a product-changing program is distinct from Robot Path's route and Tangram Town's spatial assembly |
| **Sorting Machine / Rule Parade / Critter Crossing** | Attribute predicates and discovering/classifying by rules. Conditional object processing may reuse that vocabulary, but do not create a second pure classification game |
| **Secret Code** | Deduction from guesses and feedback; “code” means a secret combination, not a program. Maker/breaker remains its own family-play proposal |

No general scripting system, online code execution, text editor or new project storage is needed. Local, finite game rules are enough. Tinker Lab is a proposed child destination subject to capacity; Story Grove is an alternative for Cue Studio if its experience is predominantly storytelling. Lantern Lake is a proposed grown-up destination. Skywatch Isles and Maker Harbor remain future zones, not implementation dependencies.

## Similar games, apps and unplugged play

Six digital precedents with opened first-party descriptions. The progression column separates described growth from any unverified level order. None was played; adaptation exclusions are our choices, not allegations about every product.

| Reference | How play grows | Borrow | Leave out / source limit |
| --- | --- | --- | --- |
| [ScratchJr teaching activities](https://sites.bc.edu/scratchjr/teach/) and [Meet and Greet lesson PDF](https://www.scratchjr.org/pdfs/hoc/ScratchJr-Meet-and-Greet.pdf) | Movement, multiple scripts, repeats and messages; the lesson has one character trigger another | A visible sender/receiver, original small performances | Broad editor palette, recording and endless restart. Old main-site HTML extracted almost nothing; the official teaching page and eight-page lesson PDF supplied the evidence |
| [Scratch family resources](https://www.scratchfoundation.org/learn/for-families) | Create together and explore user-made animations, stories and games; no fixed difficulty ladder described on this page | Authoring for someone else's response; multiple expressive outcomes | Accounts, public sharing and a full development environment. Parent testimonials are not intervention evidence; blocks/tutorial detail was not extracted from the JS-based Ideas page |
| [Lightbot developer explanation](https://lightbot.com/Lightbot_HowDoesLightbotTeachProgramming.pdf) | Sequences, procedures when the main row cannot hold everything, recursive repetition and tracing repairs | Show control moving into and back from a routine | Recursive call cycles and short-program rankings. The document explains mechanics, not a controlled learning result or an exact puzzle sequence; routes stay in Robot Path |
| [Human Resource Machine](https://tomorrowcorporation.com/humanresourcemachine) | Inbox/outbox tasks gain commands and memory; optional size/speed challenges | One visible held value, storage and a finite input/output contract | Employment threat/promotion framing, mandatory optimization or general-purpose assembly-language complexity |
| [7 Billion Humans](https://tomorrowcorporation.com/7billionhumans) | Many workers execute one language; publisher describes 60+ puzzles and hint/skip support, without a detailed concept order | One rule tested in different local situations; accessible help | Swarms, concurrency hazards and workplace pressure. Shared-program variety can be explored sequentially before parallel simulation |
| [Opus Magnum](https://www.zachtronics.com/opus-magnum/) | Open-ended machine solutions, optional compactness/speed comparison and an editor | A completed program's animated output is worth watching; more than one solution | Weapon fiction, competitive comparisons, public sharing and the large machinery palette. No exact introductory ladder is established by the page |
| Physical/unplugged: [Kidbots](https://www.csunplugged.org/en/topics/kidbots/) | Plan, code, act as interpreter, test and revise; age-grouped activities | Meaningful author/interpreter/tester roles and an observable trace | Blindfolds, races or physical instruction invented for a toddler. Our optional table-based card remains a later reviewed parent-tool packet |

Code.org Course B opened only navigation/footer text; Kodable and Cargo-Bot developer pages failed. Their mechanics are **not** evidence in this study. Prior notebook comparisons remain historical, not retroactively verified here.

## An answer for every audience

| Audience | First action without an adult supplying the answer | Deeper rung / home |
| --- | --- | --- |
| L | Touch Pet Says or a broad existing cause/effect toy | Explore a second effect with a grown-up. **No new coding mode:** no evidence for an editor at this age |
| T | Tap an existing pet-action choice and see it happen | Optionally choose the next action together; no required stored queue or coding claim. Cue Studio toddler entry remains a later observation-dependent proposal |
| P | Put a wave tile in one slot and press Play | Choose wave or turn; optional two-action imitation. Trial Cue Studio 1 only, with preschool range unapproved |
| K | Arrange wave and turn, then replay their order | Create a different ending, then repair a pictured sequence. Cue Studio 1–3 proposed |
| S | Connect a bell-picture event to a pet response and test both triggers | Repeat a short phrase, then send one event between characters. Cue Studio 4–6; finite behavior, not racing |
| U | Build one Machine Line recipe that transforms two starting objects correctly | Reusable chunks and a conditional branch; Parcel Programs adds visible memory when it changes the solution |
| M | Repair a parcel routine on two contrasting trays, or author a short interactive scene | Choose a revealing third test and explain a general rule. 11–12 top `school`, 13+ proposed `grownup`; creative and puzzle paths both available, no invented tween surface |
| G: play | Solve Parcel Programs' finite input/output cases | Compare a correct solution with a clearer or smaller one, voluntarily; no timer or withheld ordinary finish |
| G: play with | One person chooses a pictured performance request/input tray; the other programs it, then swap | Tester can press Step and point to the first mismatch. Solo pet supplies the request; shared-device turn exchange only, pending existing seat/credit decisions |
| G: page tool | Later **Program the Puppet** card: choose pictured actions, predict, perform on the table and revise | Plain HTML under off-screen companions; no account, grading or activity tracking. Adapted physical/material instructions require the existing named-review process |

## Candidates and fit

Effort is relative: S = content in an existing interaction, M = one bounded new interaction, L = older language/data extension; these are not time promises.

| Candidate | Fun action / learning goal | Audiences | Effort and new infrastructure |
| --- | --- | --- | --- |
| **Cue Studio**, new-game candidate, define first | Program a tiny pet performance, then wire an event-response; order, events and execution traces cause the show | P–S first; U/M/G creative horizon; L/T reuse existing toys | M first three rounds, L later events. Local bounded commands; no general editor, recording or saved programs |
| **Machine Line**, develop existing seed | Paint, stamp and turn a toy to match a request; composition and order-dependent state changes | K/S first, U–G later | M. Discrete object state and finite machine functions, no conveyor physics. Audit Color Garden/Stamp Studio/Sorting Machine overlap |
| **Parcel Programs**, new older-family candidate | Write one packing rule for several visible trays; input/output, testing, procedures and stored values | U/M/G, possible S entry after definition | L. Bounded interpreter/search, explicit finite domains and trace; no network, arbitrary code or new saves |
| **Robot Path: reusable route**, existing-game packet | Repair/reuse a route chunk; abstraction and control flow | S, U horizon | M–L. Existing level-15 definition/decision, two rows and one-level calls; preserve 1–12 and couch 4–6 |
| **Program the Puppet**, parent-tool packet | Take turns authoring/interpreting visible instructions; precise communication and debugging | K–G co-play; younger watch/choose | S definition, separate plain-HTML build. Existing parent-tool/reviewer workflow; no new shell system |

## First game's proposed ladder: Cue Studio

This is a researched ladder to **define**, not a registration-ready implementation. Proposed first window: pre-K 1–3 and school 2–6, with preschool 1 considered only after observation. No lap/toddler band, older registration or adaptive policy is approved. Leave numeric IDs provisional until the game has an agreed identity.

**First screen:** the saved companion stands above a three-slot shelf; Wave and Turn tiles, Play, Undo and Finish are pictured and spoken. No instruction asks a child to read. Tap a tile to append, tap Undo to remove; optional drag uses the shared drag helper. Every visible command has an icon that differs by shape as well as color. The pet repeats the instruction. “Turn” means one complete spin, so order does not depend on facing direction.

| Proposed level | First round / deeper decision | Completion, experiments and useful help | Meaningful future rule test / cost |
| --- | --- | --- | --- |
| 1 **Make a move** | One slot, Wave or Turn; choose one and play | Either action is valid. Finish becomes available after one complete playback, or supported playback through help; no wrong choice | Both commands terminate, replay resets pose, all accepted programs can finish. M |
| 2 **My little show** | Two slots; create wave→turn, turn→wave or repeated actions | Any two-action show may finish after playback; editing/replaying is free. No preferred creation | All four sequences terminate in a known pose; trace order equals shelf order. M with 1 |
| 3 **Fix the cue** | Pictured request wave→turn; starting program turn→wave; first Play is a free watch | Deliberate Check after editing compares the action trace. A failed Check gets a gentle boing and “The turn came first”; preserve program. After two misses glow the earliest mismatching slot; help inserts the requested action there, then replay/Check | Requested trace attainable, accepted alternatives defined by trace, one repair leads toward it; no miss for the free watch or ordinary Play. M; requires editable slot selection |
| 4 **Which signal?** | Bind bell-picture→wave and flower-picture→turn; either signal can be tested | Two displayed checks, any order; every trial shows which event fired. Only Check validates bindings, never penalize free event exploration | Both event/action combinations checked; no hidden input. Event icons have shape cues and replayable names. M new interaction |
| 5 **A repeated phrase** | Build wave→turn twice using one bounded Repeat-2 group | Finish when requested finite trace plays after Check; expanded four-command form is also valid if offered. Compare forms without a shortest-program score | Repeat means exactly two iterations; expanded and grouped traces equivalent; no recursion or unbounded repeats. M |
| 6 **Pass the cue** | Pet waves, sends leaf-symbol cue; bird receives it and opens a drawn fan | At most one send and one receiver, no cycles. The trace visibly crosses rows; repair sender/receiver mismatch. A supported complete show finishes normally | Empty/mismatched receiver explained; at most six executed actions; delivery order deterministic; no orphan callbacks on leave. L, separate definition/build |

**Accounting to freeze before implementation:** exploration/creative levels 1–2 have no misses. For requested levels, only an explicit failed Check counts one miss; ordinary Play, Step, free first watch, predictions, incomplete edits and empty Play are not errors. Two failed Checks show the mismatch glow, counted once; an additional concrete repair through help counts once per newly supplied repair, never again for redisplaying it. Count help used even if the final program succeeds. Always offer a guided completion; never leave a wrong program as a dead end. Creative/helped completion is not evidence of independent programming mastery. The current difficulty rule would treat easy creative rounds as smooth; define windows/order/entry behavior deliberately before a build so exploratory success cannot certify or unexpectedly rush harder concepts.

**Finite semantics:** first three levels need only Wave and Turn, each a complete action. Output is the ordered action trace, not only the final pose (wave→turn and turn→wave end looking alike). Undo edits the program; Replay starts from the same initial pose; Check evaluates that same interpreter trace. Higher levels introduce events and bounded repetition separately; no wall-clock timing puzzle, parallel writes or recursive calls. Reject malformed data gently rather than entering a loop. Stop/guard every action on scene destruction. Keep this local; another game's need must precede any shared interpreter extraction.

## Older-family first cases

### Machine Line: order that changes the toy

Define one square toy with finite state `(base, motif, orientation)`. **Paint blue** sets base blue **and clears the motif**; **Stamp leaf** sets a visible leaf without changing base; **Turn** rotates a visibly asymmetric toy one quarter-turn. The pictured request is a blue toy with a leaf. Paint→Stamp succeeds; Stamp→Paint produces a plain blue toy and explains “The paint covered the leaf.” Show intermediate states, allow undo and unlimited free trials; deliberate Check is the only possible miss. Accept every program with the requested final state, not only the authored order. A supported finish demonstrates the useful repair.

This is an invented machine rule; ordinary real paint need not erase a stamp. Freeze that wording and art. Deeper cases compare commuting/noncommuting operations, repeated turns and conditional processing of two inputs. This earns new play only through the **editable transformation program**, not a Stamp Studio decorating page. Future tests enumerate the finite state space, acceptance and every supplied hint; no test is run in this research session.

### Parcel Programs: one rule, contrasting inputs

First case: two visible trays of pretend cloth parcels, `[leaf, shell]` and `[shell, leaf]`. An instruction row has **Take next**, **If held is leaf: attach ribbon**, **Send**; a bounded **For each parcel** wrapper executes the row once per displayed parcel. Take reads the next parcel into one visible hand; Attach changes only its ribbon bit; Send appends it to output and empties the hand. The request: preserve order, ribbon every leaf and leave every shell plain. A hard-coded position-specific answer fails visibly on the contrasting tray. All samples/domains are disclosed; no hidden test trick.

Define legal editing before building: structured condition/action slots, no free jumps, one held parcel, no Take into an occupied hand or Send from an empty one; such states stop with an explanation and remain revisable. A first incorrect run is a free trace; only explicit Check across the two trays can count a miss, once per check. Help identifies the first counterexample and supplies a valid local edit or a full demonstrated program if needed. Completion accepts any legal program satisfying both trays, regardless of length; show both successful outputs and award ordinary completion. A future exhaustive checker verifies every tray over the declared first-case domain (length two, leaf/shell) if the UI promises a general rule, rather than asserting generality from two samples.

Later cases add one named **Wrap** routine, then a visible **previous symbol** memory tile for ribbons only on the start of each run of equal symbols (e.g. leaf, leaf, shell). Show initial memory as “none” and each update. Keep this inside Parcel Programs unless its actions become pure sorting or arithmetic. Nested loops, parameters and two simultaneous workers are later horizons, not first-case dependencies. Optional fewer-instruction/clearer-program comparisons follow a successful ordinary ending. M/parent interest remains a person check.

## Experience and presentation

The first unsupported action is choosing a command and pressing Play. Touch-down compresses the chosen tile immediately; insertion leaves a ghost copy in the slot, and playback highlights that slot as the pet moves. A short pentatonic note can mark an action, but icons/trace work with sound off. Original Pixi art, existing palette and saved pet; no sprite/audio imports. Cue Studio is not musical composition; if it later becomes music-making, use the existing silenced-style contract.

Design to 100-unit targets after scaling, including slots and both event rows; clear the bottom-left guide and corner navigation. For the first three levels, show only two action tiles, at most two slots, Play, Undo, Check/Finish as relevant. Portrait may stack the stage above the program; never shrink targets to fit. Grown-up-only later cases may use their existing 64-unit minimum. Freeze both layouts in the definition; this research has no layout screenshot or fit proof.

Replay variety comes from original actions, requested order and optional scene dressing; decoration never changes code meaning. Use seeded authored cases for puzzles. Free creation offers the same valid ending every time, with a deliberate Finish after playback; no applause timer or endless run. Each completed round uses `ctx.finish`, including supported creation, with one ordinary sticker.

Solo: pet gives the request, child edits/tests. Together: one chooses a pictured trace, the other programs, then swap; Step lets the tester contribute. No need for controller multiplayer or a new family launcher to define this. A future ghost finger must visibly select/insert/edit and press the same controls, including help recovery. Existing controller/couch exposure requires its own definition, not an automatic consequence of touch support.

Off-screen possibility: an author chooses two pictured actions and an interpreter enacts them with a tabletop puppet; swap and discuss what happened first. This is a **concept for a reviewed card**, not instructions to move a child's body, acquire loose objects or run a real robot. Keep practical-card review in [off-screen companions](off-screen-companions.md).

## Decisions for the developer

1. **Identity and first scope.** Recommend Cue Studio 1–3 first, only if the command editor earns a new game beside Story Theater/Dance Workshop/Puppet Workshop. Machine Line is the next lower-palette puzzle alternative. Docs-first definitions can proceed now.
2. **Audience and placement.** Pre-K/school first; preschool 1 needs an observation, no lap/toddler coding claim. Confirm current-land capacity before registering. Older school/grownup entries need the existing registration/route audit; no new middle band or future zone assumed.
3. **Robot Path gate stays put.** Its routine/couch decision remains under [Waiting on the developer](../../WAITING-ON-DEVELOPER.md#waiting-on-the-developer). This subject does not approve level 15 or add a competing route ladder.
4. **Adaptation and help.** Freeze free-creation versus requested Check accounting, entry order and guided finish before implementation; exploratory completion must not be presented as mastery. No shell changes are implied.
5. **Programs are transient first.** Keeping or remixing a saved program would need a bounded versioned creation, migration/backup repair and explicit replacement. Not required by any first round.
6. **Review and claims.** Recommend an early-years CS educator review the command/event/metaphor language. Name an appropriate reviewer before any new practical off-screen card ships. No claim of general intelligence, broad computational-thinking transfer, or adolescent/parent demand.

## Build slices, in order

Each definition is one docs-only session; build packets are separate sessions after their specific decisions. No slice starts a second research queue.

| Order | Complete slice and exit | Check tier when undertaken |
| --- | --- | --- |
| P1 **Define Cue Studio 1–3** — defined 2026-10-22 | [Bounded packet](../../definitions/cue-studio.md), [PR #834](https://github.com/rjdunlap/neo/pull/834); identity, ranges/accounting and placement remain decisions, no implementation | Docs: links/anchors and diff only |
| P2 **Build Cue Studio 1–2** | One-command and two-command free performances, editable replay and deliberate supported Finish; complete shell integration, not an interpreter-only stub | New game: typecheck, units, one filtered first/top play with help/inert-action coverage and portrait; shared registration files imply build |
| P3 **Build Cue Studio 3** | Pictured requested trace, free first watch, local repair, deliberate Check and truthful graduated help; bot demonstrates repair | New interaction tier: typecheck, units, filtered first/top affected play including wrong Check/help and portrait; build only if shared files/assets change |
| P4 **Define event/repeat/message 4–6** | Freeze event dispatch, bounded loops, sender/receiver trace and all interruption cases, then build one complete rung per session | Definition docs only; builds use new-interaction tier, or new-level tier where the input is unchanged, plus top-level ghost finger |
| P5 **Define Machine Line's first three rounds** | Free transformation, blue-leaf request, then order repair; finite operations, accepted final states, hint repair, overlap and placement | Docs only; eventual complete new-game build uses its tier |
| P6 **Define Parcel Programs' contrasting-tray case** | Freeze language, finite domains, legal states, exhaustive acceptance, visible counterexamples/help, readable trace, older audience/home and supported finish | Docs only; eventual game/new interaction uses its tier, couch filter only if couch is actually added |
| P7 **Define Program the Puppet card**, optional | One reviewed plain-HTML card with meaningful author/interpreter roles and voluntary ending; reuse off-screen companions workflow | Docs only; actual parent UI uses its affected tier |
| Parallel smaller alternative **Robot Path routine definition** | Reuse the existing level-15 packet after its recorded decision, without renumbering saves or widening couch | Definition docs only; implementation uses its actual new-interaction tier |

## What was built and checked

Nothing playable. Study, subject tracker, notebook, roadmap and decision/device/verification notes only. Clean starting tree and current `origin/main` checked; overlap check found no competing claim. Claim `33987f1`, [PR #338](https://github.com/rjdunlap/neo/pull/338). Initial publication was blocked by automatic approval review; after verifying the destination and the standing publication authorization in `AGENTS.md`, the claim push and draft PR succeeded.

Closeout records relative Markdown links/anchors and `git diff --check`. No typecheck, unit, build, browser, offline, hardware, speech or child/parent play check is justified by this docs-only change. Future checks must observe independent command use, meaningful trace repair, sound-off cues, layout comfort, voluntary replay/role swaps and older appeal; automation cannot establish understanding or transfer.
