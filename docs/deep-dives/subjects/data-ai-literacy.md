# Data and AI literacy: examples, evidence and little learning machines

Subject `data-ai-literacy` · audiences L, T, P, K, S, U, M and G · researched 2026-10-15 · branch `codex/data-ai-literacy-research`.

**Recommendation:** define **Example Express** first: choose pictured examples for a toy parcel sorter, watch it apply the pattern to different parcels, and repair its examples. Develop **Sample Safari** as a second investigation game and **Sorter Inspector** as an older/parent mode of Example Express. Put ordinary graph transformations in Picture Graph and example-based rule guessing in Critter Sort. All are proposals; no game or infrastructure was built.

## Anchors and evidence limits

Sources below were opened unless explicitly marked. Standards guide content, not birthday gates; age recommendations and game designs are our inferences. Reference products were researched, not played.

| Source opened | Specific anchor and implication |
| --- | --- |
| [CSTA 2026 PK–12 standards](https://csteachers.org/2026-csta-pk-12-computer-science-standards/), printed pp. 40–43, 63–72 and progression pp. 200, 202 | **E2/E3/E4/E5-ALG-ML-02** progress through training examples, changing data, input/output relationships and classification. **MS-ALG-ML-06/07/08** concern explaining, improving and evaluating models; their boundaries do not require implementing the internals. **EK-DAT-DC-08**, **E3-DAT-DC-09**, **E2-DAT-IM-10** anchor questions, completeness and collection bias. Independent training is not required in grade 2; our guided sorter is optional enrichment. Use transparent models, including cases where more examples do not help |
| [CSTA 2017 progression](https://csteachers.org/wp-content/uploads/2025/06/2017-csta-k-12-standards-progression-chart.pdf), PDF p. 1 | Historical comparison only: **1A-DA-06/07**, **1B-DA-06/07**, **2-DA-08/09** cover representing data, patterns and model refinement. Do not label these as 2026 codes |
| [AI4K12 Big Idea 3 working draft](https://ai4k12.org/wp-content/uploads/2021/01/AI4K12-Big-Idea-3-Progression-Chart-Working-Draft-of-Big-Idea-3-v.11.19.2020.pdf), PDF pp. 2–3, 6–7 | **3-A-ii/iii/iv** distinguish finding patterns, training and using a model; **3-C-i/iii** concern features and bias. K–2 can inspect labeled pictures; older rungs compare training with new inputs. This is a draft, not an adopted national standard |
| [ISTE students](https://iste.org/standards/students), **1.5.b/c** | Analyze/represent datasets and isolate relevant information; supports purposeful evidence work rather than trivia |
| [Head Start Science Preschool](https://headstart.gov/school-readiness/article/science-preschool), **P-SCI 3–5** | Comparing observable properties, asking questions and investigating are suitable foundations. This is preschool guidance, not evidence for toddler AI concepts |
| [Druga et al., Inclusive AI literacy for kids around the world](https://www.cs.unm.edu/~learningcomputing/readings/19_druga.pdf), 2019, abstract/methods/discussion | Exploratory workshops with 102 children aged 7–12 across four countries. Experience and context matter; do not assume one shared mental model or interpret workshop participation as durable transfer |
| [MIT pilot: Kids, AI devices, and intelligent toys](https://www-prod.media.mit.edu/posts/kids-ai-devices/), 2017 | Separate 4–6 and 6–10 sessions explored children's interpretations of agents. Useful reason to expose the mechanism and avoid implying that the companion thinks like a person; small pilot, not an efficacy trial |
| [The 4As family AI literacy framework](https://wip.mitpress.mit.edu/pub/the-4as/release/1), 2022 | Ask, Adapt, Author, Analyze suggests complementary family roles and room to question systems. Framework/research synthesis, not proof that our co-play will teach AI |

**Unestablished:** independent AI understanding below school age, transfer from our finite classifier to contemporary generative models, sustained tween/parent appeal, and real-world fairness understanding. The PopBots full-paper URL failed to open; its [publication landing page](https://www-prod.media.mit.edu/publications/a-is-for-ai/) opened, but no result or sample claim from that paper is used. The tracker’s [older-range evidence](../subjects.md#what-the-search-found-about-the-older-range-2026-10-14) supports trying autonomy and shared discovery, not claiming these particular games will appeal.

## On the island today

Audit: [GAMES](../../GAMES.md), [IDEAS gaps](../../IDEAS.md#gaps-in-the-catalog), the [computer study](how-computers-work.md), [programming study](programming.md), game modules and [lands](../../../src/content/lands.ts). No play verification performed.

| Existing game or proposal | Boundary for these ideas |
| --- | --- |
| **Critter Sort**, pre-K–school | Already has attribute hoops, a guessed rule, negation, worked examples, a newcomer round (7) and sorting the same critters under a changed rule (8). Choosing which pictured critter distinguishes two candidate rules belongs here. Example Express earns a new identity only through selecting the machine's training data and observing changed predictions |
| **Picture Graph**, pre-K–school, levels 1–7 | Already builds/reads graphs, uses a key and tallies. Comparing two displays of the same observations belongs here; do not create a second graph builder |
| **Pattern Train** | Repeating/translated patterns stay there; predicting a sequence is not automatically machine learning |
| **Sink or Float**, **Photo Safari**, **Day by Day** | Experiments, collecting observations and fictional weather records are existing strengths. Keep ordinary observation/forecast additions there; Sample Safari requires a consequential choice of *where to collect evidence* and a visible boundary on the conclusion |
| **Sorting Machine**, proposed in computer study | Player explicitly constructs a rule from sensors/gates. Example Express instead selects labeled examples and sees a fitted rule. Share parcel/sensor art only if implemented; no dependency on its construction engine |
| **Secret Code**, **Critter Crossing**, **Forecast Detective** proposal | Own clue consistency and informative queries. A hidden fixed rule with no training/data-collection action belongs to those games |

The gap is **data choice → model behavior → evidence-based revision**, especially for upper school and parents. Lap/toddler need no new AI title. Tinker Lab is a placement candidate only after `landLayout` capacity checks; Skywatch Isles is a proposed zone, not an available destination. Grown-up cases could use Lantern Lake after range/registration decisions.

## Similar games, tools and unplugged play

Six digital references and one physical activity. Product descriptions show possible mechanics, not demonstrated progression or appeal on an iPad.

| Opened reference | Progression described | Borrow | Leave out / limit |
| --- | --- | --- | --- |
| [AI for Oceans source repository](https://github.com/code-dot-org/ml-activities) | Fish/non-fish examples, then other sea creatures expose incomplete training | Let a model's surprising output motivate a new example | No animal exclusion as a reward or long labeling grind. Lesson-plan PDFs failed to open; their search excerpts were not used to establish exact level counts or algorithms |
| [Teachable Machine v1](https://teachablemachine.withgoogle.com/v1/) | Give examples to three classes, see changing outputs; not an authored age ladder | Immediate train/use contrast | Camera, recording, social sharing and confidence percentages. Use drawn parcels; current v2 behavior was not established from this legacy page |
| [Machine Learning for Kids](https://machinelearningforkids.co.uk/?lang=en) | Collect examples → train → build a Scratch game | Give classification a visible consequence in a creation | Account/service/project dependencies; detailed worksheets and age progression not inspected |
| [Cognimates](https://www.media.mit.edu/projects/cognimates/overview/) | Parent–child activities for ages 7–10 build games, program robots and train models | One person curates examples, another tests the resulting behavior | Hardware/connectivity requirements; project overview gives no validated level ladder |
| [Quick, Draw!](https://quickdraw.withgoogle.com/) | Repeated drawing challenges and inspection of others' drawings; no curriculum ladder established | A surprising guess can provoke investigation | Twenty-second rounds and contribution of drawings to a public dataset; avoid labeling a child's drawing as bad |
| [TensorFlow Playground](https://playground.tensorflow.org/) | Change dataset, features and network settings; inspect train/test behavior | Visible cases where a model family cannot express a pattern | Equations, dense controls and an optimizer UI for younger players; open sandbox, not evidence of child usability |
| [CS4FN intelligent paper, hosted by CS Unplugged](https://classic.csunplugged.org/documents/activities/community-activities/artificial-intelligence/intelligentpaper.pdf) | A person executes printed noughts-and-crosses instructions; discussion asks where the intelligence resides | Family swaps operator and tester roles; separate a fixed procedure from learning | Winning/losing stakes. It is a rule-following demonstration, not a trained classifier. Our own parcel-card variant below is an adaptation, not its published lesson |

## An answer for every audience

These are hypotheses to observe. M is a planning audience, not a new runtime band.

| Audience | First unsupported action to offer | Deeper decision and route |
| --- | --- | --- |
| **L**, under 2 | Tap a large critter or parcel and see it bounce/slide in an existing cause/effect toy | Choose which of two toys reacts; no classification or AI-learning claim and no new game recommended |
| **T**, about 2 | Match a pictured object with its matching basket in an existing sorting game | Same shape in a different color, with both models visible. Still ordinary matching; no demand to train an invisible rule |
| **P**, about 3 | Place one example beside an identical picture in an existing matching/sorting activity | Notice a second shared visible property with adult narration. A machine-learning objective is deferred; a proposed new preschool range would need observation |
| **K**, about 4–5 | In Critter Sort, compare one already placed critter with the hoop's picture | Choose a revealing example between two pictured rule guesses. Example Express may get an observed, supported preview later; do not promise pre-K registration |
| **S**, about 6–8 | In Example Express, add a labeled parcel and press the large Test button | Show a crossed example that separates shape from color; change training examples and watch a different prediction |
| **U**, about 9–12 | Repair a sorter that learned the wrong feature from an incomplete sample | Compare feature choices, contradictions and fresh cases; in Sample Safari, choose a second place to observe before generalizing |
| **M**, about 11–14 | Choose Sorter Inspector: explain why two equally successful training models disagree on a new parcel | Find an informative test, diagnose missing features, then choose a supported narrower deployment. Top `school` through 12 and `grownup` from 13 are possible mappings; appeal and registration remain unresolved |
| **G: own play** | A cozy Sorter Inspector audit with visible evidence and no clock | Find the smallest useful repair or explain why no available classifier can meet the brief; optimization optional after completion |
| **G: play-with** | Curator selects examples; tester chooses a new parcel; swap each trial | Predict different outcomes and discuss what observation would settle them; solo pet supplies the second role, no multiplayer engine needed |
| **G: page tool** | Plain-HTML **Paper Sorter** card using drawn parcels and two basket labels | Compare a human-written rule with a rule inferred from examples. Separate optional discussion card: who chose the labels, who is missing, and when should a person check? No real child data collection |

## Candidates and overlap decisions

Effort S = bounded mode/card; M = one new interaction; L = multiple linked investigations. Effort is a proposal estimate, not scheduled work.

| Candidate | Fun action and learning goal | Audiences | Effort / new infrastructure |
| --- | --- | --- | --- |
| **Example Express** — first new game | Teach a toy depot with example parcels, run new parcels through it, replace misleading examples; distinguish fitting from use | S–U first; M/G cases, K only after observation | M; finite local learner and explanation trace, no external model, network or saved project |
| **Sorter Inspector** — Example Express mode | Inspect two faulty depot models, choose a revealing parcel, fix the evidence or identify a model limit | U–G | M after first game; same learner, bounded case authoring and solver, no separate identity |
| **Sample Safari** — second new game | Choose observation windows on a fictional meadow, reveal occupants, then revise a habitat claim | S–G; K possible supported preview | M–L; finite population/sample masks and truthful claim evaluator; no live ecology or random rare discoveries |
| **Same Meadow, Two Pictures** — Picture Graph mode | Flip between tally, picture graph and differently scaled displays; find a supported statement | K–U | S–M; reuse counts/keys, retain levels 1–7 and pins; new input only if necessary |
| **Which Example?** — Critter Sort mode | Select the critter that will distinguish two pictured rules, then see where it belongs | K–U | S–M; reuse rule predicates, with a visible candidate set; coordinate with its existing deep dive |
| **Story Stamp Checker** — later evidence activity | Place source stamps under a toy reporter's pictured claims; leave an unsupported claim unendorsed | U–G | M; deterministic authored claim/source entailment; reuse Story Steps/Island Archive if evidence ordering is the central action. No chatbot or real-news feed |
| **Paper Sorter** — grown-ups' page | Swap curator/operator/tester roles with original parcel cards | S–G co-play | S; plain HTML/print definition only, no upload, identity scoring or real-person labeling |

**Reject/defer:** camera-based recognition, voice data collection, cloud chat, personality/ability classification, scoring a child's fairness, and algorithmic rewards based on personal play history. Shape/color coverage can illustrate sampling errors; it does not model structural discrimination or prove a system fair. Human social cases need a separate, sourced expert-reviewed definition. Generative AI needs its own bounded representation; a parcel classifier does not explain hallucinations.

## First game's proposed ladder: Example Express

**Fun:** a big lever sends parcels through a cheerful two-dock depot; a wrong route leaves the parcel available for replay. **Skill:** distinguish examples supplied to a learner, the rule it fits and the new cases it is asked to handle. **First round:** four training slots, two docks, one test parcel at a time. Do not draw a dense table as tiny cards.

### Inspectable first model

Authored universe: eight parcels from shape {circle, square} × color {blue, yellow} × stamp {leaf, star}. A request sign explicitly says the intended delivery policy, initially **circles to A, squares to B**. A and B also have different pictures and spoken names; color alone never conveys a label. The child copies the request onto example labels, not a moral judgment about a creature.

The learner considers exactly six single-feature rules: each of the three binary features can send either value to dock A. Fit by least training error, with a fixed documented tie order **color, shape, stamp**, A-value before its reversal. With zero examples output “needs examples”; otherwise show the selected rule's picture, its disagreements and tied alternatives in the inspector. This is a deliberately small learned decision stump; it must really be fitted from the child's examples, never secretly replaced with the target rule. A failure to separate two rules is observable, not a claim that the machine knows their probability.

**Concrete counterexample:** train blue-circle-leaf → A and yellow-square-star → B. Both color and shape fit; the tie rule chooses color. Test yellow-circle-leaf: the request says A, the model sends B. Add yellow-circle-leaf → A and blue-square-star → B; shape uniquely fits all four. Testing a *different stamp* then shows reuse on an unseen combination. Swapping color/shape semantics between rounds requires recomputing all labels, explanations and solution sets.

| Proposed level | First complete round / new decision | Completion and useful rule property |
| --- | --- | --- |
| **1: Show, then send** · S entry | Two prefilled, contrastive examples with color/stamp held fixed; label two more by the pictured shape request, then run two new parcels | Finish after model routes both fresh cases correctly; enumerate that the provided examples isolate the intended stump |
| **2: A surprising parcel** | Start with the confounded blue-circle/yellow-square pair above. Choose from four large example cards to repair the training set | All passing additions accepted; enumerate every subset of offered cards, prove at least two repair sets, and replay the yellow-circle failure before repair |
| **3: Choose the lesson** | Four editable slots, an explicit request, and a finite shelf; curate rather than label every parcel | Correct on every parcel in a visible four-card evaluation tray; solver proves a fitting set within four slots and that displayed counterexamples are real |
| **4: Which test helps?** · U | Two pictured candidate rules agree on seen parcels. Choose a new parcel whose correct dock will distinguish them | Require a distinguishing observation then a supported repair; verify that a noninformative test remains free and available, never a miss |
| **5: The label disagrees** | Two identical feature cards have conflicting labels. Find and reconcile the transcription against the visible request | Accept repair or removal if the remaining model passes; prove exact duplicates cannot both be fit and explain why simply adding examples need not help |
| **6: The missing feature** · U–G | Request uses a new stripe feature hidden from the model; otherwise identical parcels need different docks | Finish by exposing the stripe sensor or selecting the supported “this model cannot decide” conclusion; demonstrate indistinguishable inputs with opposing targets. Sensor enablement is a later interaction, not first-build scope |

These are proposed IDs/ranges, not additions to existing saved ladders. Define S 1–3 first; later `school` top levels and `grownup` registrations need explicit decisions. Single-feature limits are intentional; combined rules belong to a separately defined later model, never a silent algorithm change.

### Mistakes, help and supported ending

Changing labels, running tests, choosing a prediction and observing a bad machine route are **free experiments**. A model error is not a child's miss. **Check delivery** is a distinct deliberate action: count one miss per failed Check, explain one parcel's actual/required docks, and after two failed Checks glow a useful example slot/card. Requested **Show me** counts one hint and demonstrates a solver-backed change; repeating it can finish with support. Automated model failures never cause a difficulty step down. Do not let a Check recount old failures on every animation frame.

One sticker through `ctx.finish({ misses, hints })` for a completed round, including assisted completion. Keep every parcel, undo/remove/reset, replayable speech, a clear supported ending and the shell's home. No lives, deadlines, accuracy leaderboard, obligations or requirement to train on every parcel. Only a deliberate contradicted claim counts a miss in later investigation cases; “not enough evidence” must be correct whenever justified.

## Sample Safari: a bounded older investigation

Use an invented meadow of twelve visible-position creature cards, with identities initially face down. Six sunlit positions contain five leaf-badge and one star-badge cards; six shaded positions contain one leaf and five stars. Sunlit-only observations support “most in this window have leaves,” but do not establish “most in the whole meadow have leaves.” The full meadow ties. This is an authored selection-bias demonstration, not a simulation of natural ecology.

Player chooses sun/shade or a mixed observation window, records the cards actually seen, and chooses **supports / contradicts / not enough evidence** for a scoped claim. Never infer whole-meadow prevalence from one nonrandom window. Start with exact claims about observed cards and exhaustive inspection; introduce chance samples and probabilistic language only in a separate reviewed model. Solver evaluates claims against all remaining consistent hidden populations; if they disagree, uncertainty is the correct answer. Deeper cases change a window's coverage, inspect a duplicated observation, or compare a report to its actual sample. If the game merely counts already exposed critters, keep that round in Picture Graph.

## Sorter Inspector: one older and parent case

Two supplied sorters both fit the same two confounded training examples. Curator chooses one additional *training* example; tester chooses one *new* parcel. All evidence stays visible. Explain which model now satisfies the request, or identify the missing-feature pair. Complete after a valid test plus repair/limitation explanation, with solver-backed help; an optional fewer-examples challenge comes after success and never changes the reward.

Distinguish the **practice/evaluation tray**, which can guide revisions, from a **fresh final tray** not previously used for choosing examples. Once a final result is inspected and used to revise, call it practice and generate another disjoint final tray if the authored universe permits; otherwise state “all cases checked” and make no unseen-generalization claim. Whole-universe correctness is exact in this toy, never a promise about outside parcels. No probability meter or claim of calibrated confidence from training accuracy.

## Experience and presentation

Touch-down depresses a parcel card and lights its destination slot immediately; drag uses the existing engine, with tap-select/tap-slot as an alternative if defined. Each card, label, lever, undo and target remains at least 100 logical units in both layouts. Keep the pet's corner clear; a selected-slot inspector can replace a crowded table. Use Pixi palette drawings and synthesized pentatonic chutes, no imported imagery. The pet says “the sorter used color” and repeats the request; avoid saying it feels ashamed or needs care.

Round variety changes request feature, parcel decorations, contrastive evidence and which failure is discovered. Never change a learner's tie rule invisibly. How-to text must describe the current level, and the ghost finger must visibly supply examples and run a new case; a solved rule revealed by a bot without demonstrating input is insufficient. Source-coded expectations and original art use no real children, voices or uploads.

**Off-screen:** original large paper parcel drawings with the same three attributes. A curator picks examples, operator follows a pictured rule, tester introduces a new combination; swap and compare. This is a conversation idea, not a shipped card. Keep objects appropriate to the family and do not propose small loose tokens for lap/toddler play.

## Decisions for the developer

- Choose whether the first game should start with the visible six-rule inspector or only the selected rule; explainability favors visibility, but the layout must keep targets large. Prototype and observe before considering a pre-K window.
- Define school top/grown-up registration for Sorter Inspector; no new middle band. Audit destination capacity before choosing Tinker Lab or Lantern Lake; Skywatch Isles stays proposed.
- Review model explanations before shipping, especially the difference between coverage and fairness, training error and new-case reliability. Real social classifications, chatbot literacy and claims about practical privacy require a separately scoped review; they are not dependencies of the fictional parcel first slice.
- Decide whether Paper Sorter earns a printable page after the digital definition; no new account, project persistence or family tracking required.

**Decided 2026-10-23 (on the developer's delegation):** Example Express starts with only the selected rule shown (large targets, simpler first rounds); the all-six-rules inspector arrives as a later level once a layout prototype keeps every target at 100 units. Sorter Inspector registers at the top of `school` with an "about 10 and up" note and as a separate `grownup` case, in whichever existing land passes the `landLayout` capacity check (Tinker Lab and Skywatch Isles stay proposed); model explanations are source-checked by the building session (S1), and Paper Sorter gets a plain-HTML printable card on the grown-ups' page after its digital definition. A pre-K window waits for a person check after a prototype.

## Build slices in order

D1 is defined in the [Example Express 1–3 packet](../../definitions/example-express.md) ([PR #955](https://github.com/rjdunlap/neo/pull/955)); the precise seeds, accepted sets, accounting and initial selected-rule presentation there supersede the proposed ladder above for levels 1–3. D2 school levels 1–2 are built in Tinker Lab; D3 remains a separately admitted build with its own source review and rule/play/demo proof.

Definitions are docs-only, links and diff checks. Builds below are later sessions explicitly selected by the developer, not a dispatch queue.

| Slice | Complete scope | Verification when selected |
| --- | --- | --- |
| **D3 — build level 3** | Choose a bounded training set using the same interaction | Typecheck, game rule tests, top-level browser play and fingerdemo; no broad suites |
| **D4 — define Sorter Inspector** | One older case with informative test, explicit practice/fresh evaluation policy, contradiction and model-limit rules; choose range/destination | Docs links/diff |
| **D5 — build one Inspector case** | Level 4 first; label contradiction and missing-sensor interactions separate sessions | New interaction tier, filtered to this mode; preserve existing levels |
| **D6 — define Sample Safari** | Twelve-card case, scoped claims, complete consistent-population evaluator, free observation/Check distinction and help; compare Picture Graph ownership again | Docs links/diff; model review before probability or ecology claims |
| **D7 — define existing-game modes** | One Picture Graph representation comparison, then one Critter Sort informative-example case, each through its own deep dive | Docs links/diff; eventual change tier per mode |
| **D8 — define Paper Sorter** | One plain-HTML original family card and role swap; no learner analytics or uploads | Docs links/diff; content/readability review before release |

## What was built

D2 school levels 1–2 built 2026-10-25: [build note](../../archive/COMPLETED-2026-10-09.md#example-express-levels-12-d2-2026-10-25), [verification](../../VERIFICATION.md#2026-10-25--example-express-12-d2). D1 defined the [Example Express 1–3 packet](../../definitions/example-express.md); its 2026-10-24 work was research and Markdown only. The tracker, IDEAS candidate table, roadmap recommendation packet and verification log accompany this study. The original study had no runtime checks; actual device speech and family observation remain open after D2. Original link/diff results are recorded in [VERIFICATION](../../archive/VERIFICATION-2026-10-16.md#2026-10-15--data-and-ai-literacy-subject-research). Publication was explicitly authorized by the developer on 2026-10-16 after the initial approval-review block.
