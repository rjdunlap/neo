# Movement and exercise subject research

*ID `movement-exercise` · audiences L, T, P, K, S, U, M, G · 2026-10-14 · `codex/movement-exercise-research`, [PR #311](https://github.com/rjdunlap/neo/pull/311) · roadmap chunk 28.*

**Research complete; proposals, no implementation.** Prefer Pet Says for copying and freeze dance. The distinct first candidate is **Dance Workshop**: arrange pictured moves, watch the pet perform, revise the phrase. Its screen-only composition can be defined without prescribing exercise; any invitation to perform it, movement card, stretch or yoga instruction needs the named pediatric reviewer required by the [subject procedure](../subjects.md#ground-rules). No reviewer is appointed by this document.

## Anchors opened

Sources below were opened on 2026-10-14. Provider descriptions establish mechanics, not effectiveness. Standards guide content; the app cannot assess physical competence.

| Source | What was actually opened | Design implication |
| --- | --- | --- |
| [WHO under-five recommendations](https://www.who.int/EN/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more) | Official 2019 summary: varied activity through the day; ages 1–2 at least 180 minutes, ages 3–4 the same total including at least 60 energetic minutes. Sedentary screen time is not recommended under two | Those are whole-day recommendations, never a game quota. For lap, prioritize a caregiver's off-screen interaction; do not claim that watching the pet or tapping earns activity minutes |
| [WHO physical activity](https://www.who.int/news-room/fact-sheets/detail/physical-activity) | Official 2024 fact sheet, including walking, wheeling, recreation and play; guidance covers disabilities and older adults | Participation can differ. No body ranking, expenditure estimates, physical-performance score or assumption that everybody stands |
| [AAP toddler activity](https://www.healthychildren.org/English/healthy-living/growing-healthy/Pages/toddler-activity.aspx) | Caregiver guidance offers indoor shared dancing and hide-and-seek alongside everyday active play | A family prompt can bridge to real play; a screen game is not a replacement for it. The separate English AAP media-policy announcement failed to load; no new AAP screen-time threshold is asserted here |
| [SHAPE America 2024 PE standards](https://shapeamerica.org/standards/pe/new-pe-standards/) | Opened indicators **1.2.15** (PreK–2 dance movements), **1.5.5** (3–5 combinations), **1.8.2** (6–8 dance sequences), **2.8.8** (varying dances through movement concepts), **1.12.4** (9–12 creation), **4.12.1** (self-expression) | Progress from choosing to composing and varying a phrase. These are grade spans, not ages or runtime bands; arranging icons alone does not satisfy a PE performance indicator |

Do not turn standards' fitness assessment or stretching content into product instructions. This study does not establish a safe yoga sequence, stretch duration, breathing practice, exercise dose or accommodation for a particular person.

## What people can do: evidence and limits

| Audience | Evidence opened | Consequence for design |
| --- | --- | --- |
| L, under 2 | WHO above distinguishes infant floor play and 1-year-old activity, with caregiver interaction | Existing lap Pet Says can be a brief shared toy; the research recommends no new infant exercise-screen mode. No assumed walking, copying or response on cue |
| T, about 2 | [CDC two years](https://www.cdc.gov/act-early/milestones/2-years.html): examples include pointing to body parts, gestures and operating toy buttons | One visible choice and immediate result; do not require jumping or imitation to advance. CDC milestones describe most children and are not a diagnostic tool or access gate |
| P, about 3 | [CDC three years](https://www.cdc.gov/act-early/milestones/3-years.html) includes joining other children in play | Offer parallel participation; do not infer independent choreography or perfect turn-taking from that milestone |
| K, about 4–5 | [CDC four years](https://www.cdc.gov/act-early/milestones/4-years.html) includes pretend roles and choosing to play with other children | A pictured maker/performer role is plausible. Two-move visible sequences are a design hypothesis, not a milestone claim |
| S, about 6–8 | SHAPE PreK–2/3–5 indicators above | Keep the phrase visible while ordering or revising it; increase the decision before length or speed |
| U, about 9–12 | [Pawlowski et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9255119/): qualitative playground study of 56 tweens, supporting variety, challenge, choice and friendship | Let players author, compare and swap roles. Playground findings do not prove tablet engagement or increased activity |
| M, about 11–14 | SHAPE 6–8 indicators; tween evidence overlaps only the younger portion | A twelve-year-old might choose constrained composition; a thirteen-year-old might prefer an optional partner remix. Both need observation; no middle-school educational-game efficacy evidence was established |
| G | WHO recognizes varied adult activity and participation; no parent preference study was conducted | Offer an interesting composition puzzle, meaningful co-play, and a separate reviewed page card. None should prescribe exercise or track adherence |

## On the island today

Checked current source and [GAMES](../../GAMES.md), not only the original write-ups:

- **Pet Says** (`src/games/pet-says/logic.ts`, `index.ts`): built IDs 1–5 plus appended lap entry 13; lap order `[13,1,2]`, toddler 1–3, preschool 2–4, pre-K 3–5. Copy actions, body words, pairs, a spoken-name rule and freeze dance already exist. A grown-up advances most rounds; taps replay; nothing detects the person's movements. IDs 6–12 belong to its [existing plan](../pet-says.md), not this study. More guided moves, opposite rules and scene variety stay there.
- **Jelly Drums**, **Beat Builder**, **Sound Garden** and **Sing-Along Barn** make or follow sound through screen input. They do not establish whole-body activity. Stomp Steps' [notebook proposal](../../IDEAS.md#sketches-first-drafts-of-the-definition-of-ready) is also finger rhythm, despite its name.
- **Stop and Go** steers a toy vehicle; its proposed crossing mode belongs to the separate safety subject, not proof of road knowledge. **Brain Break** is a built grown-up number-search puzzle, not an exercise routine.
- **Belly Breaths** overlaps the social-emotional subject and Feelings Faces; **Row Together** already owns the shared rowing action and seat decisions. Neither should be redefined here.

Gaps: no player-authored body phrase, no reviewed movement-card collection, no demonstrated tween appeal. The nearest useful reuse is Pet Says' illustrated pet motion; it does not justify a generalized animation editor, new age band, save format or activity tracker.

## Similar games and unplugged play

Six references, all opened; this was document research, not hands-on play. The last column combines observed incompatible mechanics and our exclusions; it does not assert that every service contains every excluded feature.

| Reference | Kind / how progression grows | Borrow | Leave out here |
| --- | --- | --- | --- |
| [GoNoodle Freeze!](https://www.gonoodle.com/videos/lYOmA2/freeze) | Follow-along movement video; varied dance/freeze cues rather than a persistent puzzle ladder | An unmistakable still/moving contrast | Continuous video pace as a required response deadline; service video/assets. Pet Says already owns this interaction |
| [Cosmic Kids series](https://cosmickids.com/our-series/) | Story yoga, short dance episodes and different series; variety comes from adventures and formats | An action can have a narrative purpose; let a family choose a format | Imported characters/video, clinical benefit claims, prescribed poses or bedtime flow. Marketing statements are not developmental evidence |
| [Just Dance camera controller](https://www.ubisoft.com/en-ca/game/just-dance/2026/news-updates/2UBGhF4xWMLAVVFMmTCWwn/revolutionising-motion-gaming-the-camera-controller-feature) | Camera-based movement scoring; choreography gives coordinated sequences to learn | Pictured preparation before the next phrase | Camera capture, body matching and accuracy grades; commercial music and service dependencies |
| [Ring Fit Adventure](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Ring-Fit-Adventure-1638708.html) | Physical accessories connect exercises to an adventure; minigames/custom routines offer other forms | A chosen movement can cause a visible world consequence | Combat, exercise prescriptions, accessory sensing, bodily statistics and progress contingent on exertion |
| [WarioWare: Move It!](https://play.nintendo.com/news-tips/game-releases/warioware-move-it-available-now/) | Many motion microgames introduced through illustrated starting forms | Show the starting arrangement clearly; vary the consequence | Rapid deadlines and motion-controller dependence; quantity is not a learning ladder |
| [Playworks Simon Says](https://www.playworks.org/game-library/simon-says/) | Unplugged leader/follower game; practice, variants and changing the leader add depth | A practice round and swapping who invents the cue | Elimination, exercise as a consequence, tricking as humiliation. Its physical commands are not a reviewed Puddle Island card |

## What fits

**Copying stays Pet Says. Composing earns a distinct decision.** Adding more follow-along dances should extend the existing game; the workshop differs because the player makes, inspects and changes the instruction sequence. If a build definition cannot make that authorship clear, use a Pet Says mode instead of registering another imitation game.

The screen-only skill is expressive sequencing and revision; optional family performance is a separate experience whose fitness or learning benefit is unmeasured. No extra reward for performing, standing, moving faster or reporting effort. Seated participation, watching, helping with the screen and declining a turn must all be compatible with finishing.

Home proposal: **Music Mountain** for composition; existing Pet Says remains in Cozy Village. A parent-only constrained puzzle could use Lantern Lake later if it becomes an independent game. Do not create a land/zone or change routes for this study. School's upper rungs can serve U; ages 13+ resolve through existing `playBand` rules. M is a planning audience, never a silent new runtime band.

## An answer for every audience

| Audience | First action without an adult supplying the answer | Deeper decision / destination |
| --- | --- | --- |
| L | Pat the existing Pet Says pet and see it respond; caregiver can take the interaction off-screen | Choose whether to repeat; **no new exercise game** because infant screen/physical instruction is not the appropriate research outcome |
| T | Tap one of two pictured pet moves and see it perform | Choose which comes next; workshop 1, subject to actual child observation |
| P | Put two pictured moves into a strip | Swap their order and hear/see the difference; workshop 2 |
| K | Make a four-position phrase with a pictured repeated pair | Decide what repeats; workshop 3 |
| S | Fix one position to meet a visible phrase request | Compare the original and revision; workshop 4 |
| U | Find another phrase meeting two simultaneous constraints | Explain why two solutions work; workshop 5 |
| M | Choose a short constraint puzzle or invent a variation for a partner | Workshop 5–6 without childish commands or bodily grading. Proposed school top levels for 11–12; 13+ grown-up access if approved. Tween preference remains untested |
| G: play | Solve a six-position choreography constraint puzzle at leisure | Find a second solution; workshop 5–6. A cozy logic puzzle, not a workout |
| G: play-with | One person chooses a phrase, another predicts or remixes one card | Swap maker/reviser; shared physical participation optional after review. One active profile's ordinary round credit; no invented second seat |
| G: page tool | Open a plain-HTML source-linked family activity card, once reviewed | Choose a space/participation variant and put the screen away. No timer, schedule, checklist, calories or fitness logging |

## Candidates

Effort: S = one small content/definition slice; M = a new complete interaction; L = multiple sessions. All proposals.

| Candidate / action | Learning purpose | Audiences | Effort / infrastructure | Disposition |
| --- | --- | --- | --- | --- |
| Pet Says: new pictured dance scene and leader swap | Imitation, agency, shared attention | L–K, G co-play | S–M; use its existing animation/round contract | Reuse its deep dive; no competing ladder here |
| **Dance Workshop:** arrange moves, watch, revise | Sequence, pattern, constraints, expressive composition | T–G; L uses Pet Says | M; finite phrase logic, pictured strip, pet animation; no new engine/save needed initially | First candidate below; screen-only definition can proceed |
| **Dance Duet:** change one part while preserving a partner's phrase rule | Communication and equivalent solutions | S/U/M/G | M after Workshop; local role swap, not two-profile credit | Later content mode, not another game |
| **Family movement cards:** choose an off-screen shared-play invitation | Participation and caregiver connection | L–G | S per reviewed card; plain HTML in parent panel, no tracking | Needs named pediatric reviewer and accessibility review before wording or physical demonstrations ship |
| Stretch/yoga or breathing adventure | Possible movement or calming practice | No audience authorized yet | L; qualified instruction/content review, accessibility and cultural framing | Questions only. No pose sequence, dose or therapeutic claim designed here |
| Stomp Steps | Finger rhythm and musical sequencing | K–S | Existing proposal; rhythm judging overlaps Sound Garden | Leave in music study; do not label taps physical exercise |

## Recommended follow-ups, requested 2026-10-14

**Developer preference to retain:** after discussing other movement ideas, the developer asked to add the recommendations to the roadmap and remember them. Prioritize **Adventure Walk** and **Animal Charades** for definition alongside Dance Workshop; keep **Mirror Partners** within Pet Says. This supplements the study's candidate list; it does not implement a game or schedule a worker. [Roadmap packets](../../ROADMAP.md#movement-and-family-play-recommendations), [PR #312](https://github.com/rjdunlap/neo/pull/312).

| Candidate | Fun action / purpose | Small complete experience and deeper play | Fit / unresolved work |
| --- | --- | --- | --- |
| Adventure Walk · T–S, G co-play | Choose a journey and act out or watch its landmarks; spatial language and sequencing | Three pictured landmarks lead to a friend's picnic; choose the destination, preview/replay each event, then arrange the visited pictures to retell it. Later choose a route, revisit landmarks or describe the way back. Retelling allows replay and supported completion, with no judgement of the person's movement | Promote the notebook's Bear Hunt Walk seed under an original island name, with original scenes/story. Distinguish moving along a route from Peekaround's positions and Pet Says' guided actions; no copyrighted text or imported illustrations. Off-screen invitations need named review |
| Animal Charades · P–G | One person interprets a pictured clue and another guesses; communication, perspective and flexible representation | One clue, unlimited guesses, reveal and voluntary role swap form a complete round. Acting, describing or pointing can contribute. Later combine an animal with an action, or discuss multiple reasonable guesses | New family activity; first define private clue presentation on one device and a solo pet demonstration. No camera, microphone, automated body verdict, elimination or pressure to perform. Family placement/seat credit remains undecided; physical prompts need review |
| Mirror Partners · T–G | Take turns leading and copying; attention, agency and shared invention | One lead, one response, then swap; replay/finish remain explicit and unjudged. Later change one component or explore an opposite | Pet Says extension, not another game. Reconcile with its existing leader-swap, opposite and This hand plans. A mirror/left-right convention must be explicit; no pose accuracy checking |

These are design recommendations with proposed age ranges, not established developmental outcomes. No new clinical or motor-learning claim is made. Rhythm Detective and Playground Designer are not selected priorities in this follow-up.

## A first game's ladder: Dance Workshop

Working ID `dance-workshop`, **not registered**. A pet performs a finite pictured phrase; the player composes it, never the app grading a human body. A first definition must recheck overlap with Pet Says, Song Maker and Beat Builder. Use generic pet gestures only, with no spoken instruction for a person to imitate until review.

Initial palette: three visually distinct pet-only animations (wave, clap, wiggle), each one equal phrase slot. Reuse existing code-drawn motion where practical, not new dance traditions or anatomically instructional poses. No jumping, balancing, stretching, breath holds or side-specific body directions in the first packet. The exact animations and any participant-facing wording remain reviewer questions.

| Level / proposed window | First round / what the player decides | Experiments, support and ending | Rule proof / cost |
| --- | --- | --- | --- |
| 1 · T/P | Choose a pictured move for each of two slots; repeated choices allowed; play the pet's phrase | Every choice valid; select a slot then a move, preview as often as wanted. Finish lights after one preview; no required repetition | Every choice maps to a valid move; two filled slots playable. M: strip, animation replay, spoken labels and demo |
| 2 · P/K | Three slots, same three moves; swap one pair and preview the new order | No correct composition. Undo restores exactly the old phrase; Finish after preview | Swap preserves length/multiset; undo exact. S after 1 |
| 3 · K/S | Four slots; pictured request is two repeats of a two-move phrase, with the first pair freely chosen | Preview shows both pairs side by side; a mismatch invites revision. After two mismatches glow the first differing slot. Supported completion can copy the first pair | `phrase[0:2] = phrase[2:4]`; allow AA as well as AB. S–M; pattern explanation and support bot |
| 4 · S | Given wave-clap-wave-wiggle, repair at most one slot to make two identical pairs | Keep original visible, unlimited undo; either change the second or fourth position. Hint shows a valid differing pair, accepts either repair | Enumerate all one-change repairs; generator guarantees at least one. S–M; alternative-answer tests |
| 5 · S/U/M/G | Six slots; request exactly two of each move and no identical neighbours | Watch, revise, explicit Hint can place one valid next card; two mismatches glow the violated count or adjacency, not an arbitrary target | Enumerate 3^6 phrases; nonempty solution set, all alternatives accepted; each hint leaves a solution reachable. M; counters and constraint explanation |
| 6 · U/M/G | A pictured six-slot phrase already satisfies level 5; make a different valid phrase using at most two swaps | The original remains beside it; undo and replay. First worked example counts as assistance; no shortest-time or fewest-move competition | Finite enumeration guarantees a distinct reachable solution; swap history/undo exact. M; second-phrase comparison and role swap |

**Complete round and accounting.** Editing and previewing are experiments: no misses. In constrained levels a separate pictured Check offers an explanation; failed checks still need no miss because this is a revision workshop. Count a requested worked example, automatic correction after support, or full assisted completion as one hint per use; free replay and highlighting a violated rule do not count. Keep assisted completion available with the same one sticker. The build definition must verify this distinction against adaptation: zeros for creative rounds are participation, not physical or cognitive mastery; do not add a new global adaptation policy here. A grown-up can pin a level. No persisted creations in slice 1; storing a phrase is a separate typed creation/save proposal.

**Bands/order proposal, not approved mappings:** toddler 1; preschool 1–2; pre-K 2–3; school 3–6; grown-up 5–6; no lap registration. Stable 1–6 IDs for a new game only; do not consume Pet Says' reserved 6–12 or change 13. Approve the mapping before implementation. No automatic extra rounds: Play previews, Finish completes once, shell celebration owns Again/Next/Home. Leaving mid-phrase changes no progress.

## Experience and presentation

On entry, the first empty card has a thick dotted border; two or three large move pictures wait beside the strip. A touch compresses the selected card immediately, inserts its picture and gives the pet a tiny answering wave. Preview animates one card at a time with a moving border; after the final pose the pet returns to still readiness and the same strip stays editable. Choose audio from the existing pentatonic notes, with quiet/silenced music during the phrase; the visible pulse carries the same information with sound off.

Use Pixi Graphics and palette colors: cream rounded phrase cards, dark pose silhouettes, an ink underline for the currently performed card. No imported art/music or flashing correctness confetti over controls. A phrase finishes in a finite number of slots, without a deadline. Keep controls at least 100 logical units for child bands, retain pet clearance and check both orientations. Six cards may need two rows rather than shrinking targets. Use tap-to-select/tap-to-place, not precision dragging; an optional drag would use the existing drag helper and require separate proof.

Replay variety is authorship at 1–3 and seeded solvable start/constraint combinations at 4–6; draw new phrase boards with `ctx.rng`, not random stage layouts. Cards remain visible throughout, so memory and reading are not prerequisites. Solo play can watch the pet; co-play alternates maker and reviser with one device. No promise that off-screen movement occurred and no physical movement unlocks a control.

**Off-screen equivalent, pending reviewer:** the family uses pictured cards to invent a short shared sequence and changes one card. This is a concept for review, not a printable activity or approved body instruction. The page card must be reviewed for younger/non-standing participation, space, adult responsibility and a comfortable way to decline. Never publish an exercise prescription from this plan.

## Decisions for the developer

1. Name a pediatric physiotherapist/PT or other appropriately qualified movement reviewer, plus an accessibility reviewer, before participant instructions/cards/physical demonstrations are authored for release. Ask about all age ranges, seated or non-standing alternatives, floor/space suitability, fatigue and stopping language; stretches/yoga/breath work require their own content review. Existing movement games are not retrospectively clinically validated by this study.
2. Approve composition as a distinct game or choose a Pet Says authoring mode. Lean: new game only if arranging and revising is the main action; no new follow-along duplicate. Define the first two-slot screen-only round before coding.
3. Approve the proposed band windows and how creative participation reaches constrained levels. Keep M as an audience until the separate middle-band decision is made. No silent migration or saved-level renumbering.
4. Is parent solo composition interesting enough for Lantern Lake, or better as the grown-up levels of this game? Observe one finite puzzle before choosing a second registration.

## Build slices, in order

1. **Ready to define, docs only:** settle decision 2, the first two-slot screen-only round, exact gesture art/wording and reviewed/omitted physical prompts; approve the band table and assistance accounting. Recheck Pet Says/music authoring overlap. Exit: one implementable round with all buttons, replay/finish/cancel states and no unresolved placement alternative. Links and diff check only.
2. **After slice 1 decisions, implement levels 1–2:** finite authoring, preview, replacement/swap, undo, finish, shell integration and ghost finger. No physical instruction, saved creation or special family route. New-game tier: typecheck, units, one filtered first/last play with revision/help paths and portrait; build because registry/how-to/voice/lands change. Add the script filter to README. Rules cannot prove physical participation.
3. **Levels 3–4:** repeated pair and repair with equivalent answers; scoped how-to, useful worked example and bot. New levels on existing interaction: typecheck, rules, top-level browser play and fingerdemo. If comparison/Check is a new interaction, use that tier instead.
4. **Levels 5–6 and local duet:** finite constraint solver, comparison, role swap without new seat credit. Rule properties above; first/last affected-level play, help, undo, portrait for changed comparison layout and demo. New-interaction tier; no full couch suite unless couch code is actually changed.
5. **Only after reviewer approval and family observation:** one plain-HTML off-screen card with named author/reviewer, date and source; no log or scheduler. Keep the all-game card library under `off-screen-companions`. Parent overlay change uses the affected shell tier; card-only edits use docs/content checks. Do not infer all stretches/yoga are approved from one card.

No build slice is dispatched or scheduled by this study. No code, tests, game assets or runtime contracts changed.

## What was built

Nothing. Research and proposals only. Relative links/anchors and `git diff --check` checked in this session; see [verification](../../archive/VERIFICATION-2026-10-14.md#2026-10-14--movement-and-exercise-subject-research). Typecheck, units, build, browser, offline and device checks were not run. Open: named movement/accessibility reviewers, observed family/teen appeal and actual device speech/touch comfort.
