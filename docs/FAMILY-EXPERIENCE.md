# Family experience design review

*2026-10-12 · documentation and research only · reviewed against `origin/main` at `f7ef80f`*

The strongest direction is a generous family play world: recognizable places, a companion who joins the action, satisfying toys, substantial puzzles, things to make and show, and short adventures that give familiar games a new purpose. A large library is valuable when people can find an appealing activity, understand it, and want to return. Breadth, depth and presentation need to grow together.

This review connects the existing [idea notebook](IDEAS.md), [game inventory](GAMES.md), [deep dives](deep-dives/README.md) and [roadmap](ROADMAP.md). Recommendations below are **proposals**, not implemented features or completed game deep dives. The roadmap controls readiness and existing developer decisions still apply. Source and document review, plus a few retained screenshots, informed the judgments; no fresh playtest or child/device observation was performed.

## What deserves attention first

The existing foundation is unusually broad: touch toys, creative tools, number and language games, science models, deduction puzzles, a personal home, an optional story and controller play. The notebook already researches JumpStart title by title, Neopets, arcade classics, Flash portals and family party games. More reference lists alone will add little.

The larger opportunities are:

1. **Find something appealing quickly.** The all-games path grows longer as the library grows; a land must still fit on one screen. Keep the map memorable and add a complementary way to find games, rather than making targets smaller.
2. **Make the next mode understandable.** Saved IDs can have an easy entry appended after a difficult level; `order` already solves progression, but a level number alone does not explain the experience. Show the action and its support before starting it.
3. **Make interactions feel alive.** Characters and material sounds already exist. Use them consistently to acknowledge a touch, explain a change and deliver a funny payoff. Scenery should strengthen the action's setting and readability.
4. **Give the world more connections.** A sequence of completed rounds is weaker than helping a familiar friend, bringing a chosen creation into a scene, or revisiting evidence in the journal. Build another small episode before a general quest system.
5. **Give family members useful roles.** A co-play sentence is helpful, but complementary jobs can make playing together the activity itself. Begin with turn-taking or one shared board; profile credit and simultaneous input still need their existing decisions.
6. **Offer older people a different texture of play.** Teens, parents and grandparents need expressive tools, thoughtful puzzles and comfortable arcade play as well as educational ladders. Quiet presentation and direct controls can serve them on the same island.

## A catalog with many reasons to play

Organize future selection by the experience someone wants, alongside the existing learning subjects. This is a planning lens, not a proposed replacement for `GameModule.region`, age bands or lands. Each expansion should fill an underserved experience or deepen a favorite. A reskin adds content; it earns a new game identity only when the decision or interaction changes.

| Experience | Existing starting points | Valuable next depth | Research or candidate direction |
| --- | --- | --- | --- |
| **Cause and effect, for lap play** | Bubble Pop's anywhere entry, Pet Says' pat entry, Fill and Dump, Peekaboo Barn | Every intentional touch responds; a small hand can finish without a precise button; fresh consequences with stable controls | Peg Garden's guaranteed finish, one-door Peekaboo Barn, familiar songs and comic reactions |
| **Pretend and care** | Teddy Doctor, Splish Splash, Fluffy Salon, Weather Wardrobe, Pet Kitchen | Tools behave differently; friends respond to what was done; a short outing or meal gives choices a purpose | Kitchen recipe play; a visitor-room episode; voluntary pet expression and costumes |
| **Make and perform** | Rainbow Fingers, Stamp Studio, Pixel Pictures, Song Maker, Beat Builder | Choose a composition, listen or watch, revise and show it; keep a finished work deliberately | Song Maker phrases, Story Theater, Pixel Flipbook, a construction kept only after storage is defined |
| **Explore and discover** | Peekaround Island, Photo Safari, Treasure Map, the journal | Notice a clue, test a hypothesis and revisit what was actually found | Sound Detective, Warm-and-Cool Dig, Postcard Detective, evidence-led Photo Safari |
| **Serve, share and plan** | Scoop Shop, Market Stall, Little Helpers, Orchard Rows, Lemonade Stand | Several valid orders or plans; visible consequences; compare two attempts | Scaled recipes, constrained deliveries, finite event preparations; Harbor progression stays behind its person check |
| **Shape and construction** | Tangram Town, Puzzle Pals, Block Tower, Bug Builder, Shape Buddies | Rotation, support, views, alternative arrangements and useful revisions | Shape Buddies arrangements, Skyline View, Cart Workshop; Wobble Works only with an explicit structural model |
| **Investigate a system** | Sink or Float, Ramp Race, Light Lab, Habitat Helpers, Chain Reaction | Change one variable, replay exactly, compare evidence, name the model's limits | Gear Garden, Circuit Garden, repeatable observation tables |
| **Solve and deduce** | Secret Code, Ferry Jam, Garden Rows, Lantern Lights, Island Bridges, Tile Pairs | Useful explanations, undo, optional challenge with several approaches and comfortable board scale | Secret Code feedback; grown-up touch puzzles; Sorting Machine's editable conditions |
| **Move, aim and enjoy a skill** | Bouncy Launch, Penguin Slide, Bounce Back, Bumper Garden, Pond Conga | Anticipate a motion, choose a route, improve a shot; finish a finite goal without a loss screen | Mini Golf, Track Maker, an optional relaxed Pond Conga mode; main-score timers remain a developer decision |
| **Play with someone** | Bounce Back, Owl Walk Home, controller trips and face-offs | Shared planning, making a puzzle for another person, complementary control, role swaps | Secret Code maker/breaker, Buddy Delivery, Row Together; solo helper available where feasible |

### What changes with age

| Audience | A good opening experience | A worthwhile deeper experience | Presentation priority |
| --- | --- | --- | --- |
| Lap and toddler | Touch causes a pleasing event; adult and child can share the action | One visible goal, one tool, a choice between clearly different things | Little speech competing with action, generous reach, no unexplained dead touch, easy stopping |
| Preschool and pre-K | A character's request and a demonstrated gesture | Sorting, sequencing, small quantities, expressive choice, a short plan | Picture cues, spoken replay, immediate gentle feedback, hints that show a useful next action |
| School, including later elementary | Choose a task and inspect tools before committing | Evidence, debugging, equivalent solutions, constraints, a project worth revisiting | Cognitive depth separated from motor precision and reading; meaningful undo and worked examples |
| Teens and adults, including grandparents | Direct access to a chosen puzzle, arcade activity or creative tool | Strategy, personal records, richer making, cooperative planning | Quiet optional feedback, legible boards, visible input requirements, comfortable control alternatives |

These are design intentions, not developmental assessments. Keep the existing `school` and `grownup` mappings; a new tween band remains a separate decision and migration audit. An older person can still choose a simple relaxing toy. Optional reading in a game never becomes a navigation requirement.

## Navigation, discovery and levels

The developer-selected discovery study is now written in [DISCOVERY.md](DISCOVERY.md): Explore and Play entrances, direct next-game selection, finite mixes, Just Dance references and an explicit introduction/automatic-handoff boundary. Its first flow slices supplement the home/library proposals below; they do not approve land overflow, saved queues or changed support policies.

### N1: a useful home without a longer search

**Define first.** Sketch a small, predictable home shelf containing **Favorites**, **Played recently**, **Something to try**, and **Things I made**. Use stable illustrated cards and replayable spoken names. Start with existing favorites, history and creation records; do not add a recommendation service or persistent recommendation score. A suggestion can use the existing unplayed/long-unplayed rule, and remains optional.

The first implementation should be one shelf, preferably the already-built favorites, exposed from the map or home without adding another crowded map spot. Define exactly where it lives before building. Show all remembered favorites through pages; the current shelf is only a view onto the bounded collection. A recent-game link starts a fresh round, not a promise to resume an unfinished one. A game launches at `playBand`, returns to that shelf and restores its page. Switching profiles must discard the previous person's navigation memory. Opening a shelf or preview must not mark a game played. No daily rotation, empty-state guilt or completion percentage.

### N2: a complementary family library

**Define first.** Keep the place path and map; prototype a plain HTML library for a grown-up or older player, reached from the home spot. Search literal game titles and reviewed aliases, and filter by subject, available input and genuinely supported solo/together play. Use explicit metadata only when the library needs it; derive age from current registrations, but label input by the actual working route and selected level. Module metadata alone cannot establish controller support: the island does not yet sample controllers and some couch games support only part of a ladder. Distinguish island touch play from a controller course, and verify the offered level before labeling it playable. A textual search is optional, not a prerequisite for a child.

Each result shows the game's drawing, title, action, current mode and input requirement. Offer picture categories such as **Make**, **Think**, **Move**, **Listen** only after the first library is useful. The same title and art must identify a game in every route. No favorites or filters should silently hide the full catalog; clearing filters is obvious. An empty result explains what to change.

**Acceptance:** find a remembered game without paging the whole path; find a touch game with no keyboard available; leave a result and return to the same query/page; profiles stay separate; every registered game is reachable; inputs and return routes tell the truth. Future verification uses metadata rules and targeted `world`/`lands` plays, plus keyboard/focus and safe-area review.

### N3: keep geography readable as the catalog grows

**Decision before a contract change.** The current one-screen land and exactly-one-home-land tests are useful constraints. Try reorganizing explicit game lists into a new small land only if it fits the map and has a distinct place identity. If that no longer works, compare two prototypes: neighboring subplaces entered through one stable land landmark, and small named pages inside a land. Keep home and back at the same positions, speak the new destination and remember the last page. Do not adopt a giant scrolling world or duplicate game registrations to solve overflow.

The first definition audits the densest land at every band and view and the all-games home at the grown-up band. It records the next actual fit limit and proposes one solution, rather than writing infrastructure for hypothetical hundreds of games. Any change must explicitly replace the relevant `landLayout` contract and tests, preserve game IDs and update routes, signposts, birthdays and old saves where affected.

### N4: show modes, not only numbers

**Define first.** Pilot a compact illustrated mode gallery on one game's existing intro. A card says **Pop anywhere**, **Find the red bubbles**, or **Count back**, with a picture, replayable explanation and matching demonstration. Present cards in `levelsInOrder(mod.levels(playBand(mod.bands, profile.band)))`, restricted to the resolved played band and retaining saved IDs internally. The examples span bands; an individual player’s gallery does not offer the whole ladder at once. Start with Bubble Pop because its appended easy entry exposes why numeric order is insufficient.

Use existing held arrows or a comparable grown-up deliberate selection for younger bands; previews must not introduce accidental level jumps. Keep Play explicit. Show the current suggestion and the grown-up's pin distinctly. Looking, listening and leaving save nothing; finishing follows current `recordRound` behavior and does not move a pin. Do not put unrelated skills on one mastery meter. If a real branching mode eventually needs independent progress, define stable mode keys and migration then.

### N5: honest controls and an easy return

The existing roadmap's **stage B follow-up** comes before broad controller migration: identify controller-only games visibly and in speech, return their course to its launching island origin (Lantern Lake as fallback), and stop offering island controls that do not take effect. Then gain touch puzzle by puzzle and migrate island controller focus in bounded stages. Game night replaces the old shell only when trips, face-offs, courses, records and profile choices have working replacements. A friendly all-ages map does not imply every game works with every input yet.

## Visual character and game feel

The Pixi palette, critter moods and motions, shared props, lifted drags, scene-owned tweens and synthesized sounds are a good foundation. Recent Bubble Pop scenes and Beat Builder's woodland/picnic stages show that code-drawn art can have variety. Retained map imagery is older than the current land layout, so it is a style reference, not proof of current navigation. Beat Builder and Block Tower portraits suggest checking the relationship between usable space, board scale and important actions; an empty area is acceptable when it protects reach and attention.

| Pilot | Concrete improvement | Acceptance and boundaries |
| --- | --- | --- |
| **V1 · Place identity** | Art-direct one land: a strong landmark silhouette, a distinct ground edge/material, a host prop and a recognizable sound motif. Translate its landmark into its game backgrounds and icon framing | Recognizable in a small thumbnail and without its label; playable objects read first; scenery receives no pointer hits; active and decorative objects are visibly different. Use palette colors and Graphics/RenderTexture only |
| **V2 · Touch acknowledgment** | Audit Animal Snack's presentation window: it currently ignores another tap while food travels/shrinks. Try a local squash or acknowledgment that does not queue another feeding. Apply lessons to one other tap game only after review | Each intentional touch gives feedback by the next rendered frame; it never changes the number of actions, mistakes, hints or rewards. Cancel, leave and rapidly repeated touches cannot touch destroyed objects |
| **V3 · Materials and motion** | In Fill and Dump, connect jug tilt, stream, receiving level, small ripple and synthesized sound to the same event. In a construction game, show contact/compression and a short settling motion | The result is legible with sound off and without relying on color alone; motion explains a cause, not just excitement. No new drag delay, hidden hit interception or change to the stated capacity/support model |
| **V4 · Purpose and payoff** | Give one completed task a specific comic consequence: the fed friend chews its own way, a finished train carries its chosen cargo, or a musical phrase makes a friend answer | Reward reacts to what the player did, remains brief and does not block leaving. One shell sticker remains the reward; free exploration is never turned into misses |
| **V5 · Comfortable feedback** | Define an optional quieter presentation: follow `prefers-reduced-motion` by default with a per-profile override, reduce decorative motion and particles, distinguish music/effects/speech controls, and retain visual equivalents to spoken requests | Keep essential causal motion and instructions understandable; changing comfort must not change physics or scoring. If a setting changes speed, categorize records under the existing assist decision. Save defaults/repair and actual device behavior require their normal checks |
| **V6 · Older-player board comfort** | Art-direct one grown-up puzzle with stronger selection/focus states, readable clues, a spacious tool tray and calmer celebration. Board scaling follows usable `view`, not window dimensions | At least 64 logical units for grown-up targets; zoom or scroll if the board cannot fit. Child-band game targets and shared navigation retain 100; 64 applies only to grown-up games played in the `grownup` band, including a deliberate signpost visit. Undo and hint remain easy to find; controllers and touch communicate the same state |

First write a small art/feedback sheet with **idle → touch → action → consequence → settle** drawings and timings for V1–V4. Implement one game at a time, using existing helpers; extract a shared helper only after a second implemented use needs it. Avoid a wholesale renderer rewrite, imported sprites, new audio files or a universal particle pass. Different materials and character actions matter more than adding decoration everywhere.

Game-specific rendering or feedback uses the existing-game tier: typecheck, focused rules, one filtered regression play and one portrait/landscape comparison where useful; run `fingerdemo` when its shown action changes. A new gesture uses the new-interaction tier. Shared art/audio/input or saved comfort settings use the relevant shared-system tier. Never repeat unaffected suites for a polish pass.

## A world to revisit and a family to play with

### W1: one more connected adventure

**Define the Woodland Picnic first**, using Mail Carrier's map, a sharing/preparation activity and one construction or music activity. Begin with a friend's concrete request, let each completed step visibly change the picnic, and give it a complete ending. Limit it to a few short steps. Free games remain available directly.

Prefer existing idempotent story steps if success alone is enough. If a chosen tune, route or creation changes the next scene, define the smallest typed result for that one consequence using [the proposed contract](DESIGN.md#proposed-story-results). Test leaving/resuming, replay and exactly-once rewards. Do not build a quest framework, currency or world clock as a prerequisite.

### W2: a personal world with useful possessions

Research pet kinds and free visual variation, an improved creation display and a project worth resuming. Start with a finished thing that is pleasant to use: play the saved tune, replay a tiny show, or compare an observation with a previous one. Keep ownership and display separate, as stickers already do. A new saved construction/story/program needs a bounded versioned format, explicit replacement, repair and backup tests. Do not promise unlimited room storage or automatic saving of every experiment.

### W3: one shared job

**Define Secret Code maker/breaker or Buddy Delivery before a party board.** One player sets a clear challenge or chooses the stops; another solves or drives; then swap. The solo version uses authored challenges or a helper. Both people should make a meaningful decision, and an adult's role should not be to repeatedly answer for the child.

The existing seat-credit, competition, storage and table-layout decisions remain open where they apply. The first playable experiment can use sequential turns without simultaneous input, hidden personal screens or two profile rewards. Test that a helper cannot falsely count as independent mastery. Then consider Row Together's complementary paddles, with controller/touch alternatives and a solo helper, before a broad family minigame collection.

## Research sessions worth doing

The first session’s research is written in [DISCOVERY.md](DISCOVERY.md); its implementation remains open. The other sessions below are **unclaimed and not started**. They are a ranked recommendation, not a silent change to the existing wave order or a claim that any complete deep dive was done in this review. A user-selected session can take priority; otherwise the game tracker remains authoritative. System studies are separate docs-only definitions; game studies follow [one session, one game](deep-dives/README.md#one-session-one-game), researching five to ten relevant references and producing bounded build slices.

| Suggested priority | Session | Question to resolve | Concrete output |
| --- | --- | --- | --- |
| 1 | **Discovery and catalog scale** (system) | Can a returning person find a favorite, choose something unfamiliar and understand its input without browsing the whole catalog? | Discovery flow research written; D1/D2 are the next sketch slices. A dense-land capacity audit and full home/library layout remain separate definitions |
| 2 | **Art, feedback and comfort** (system) | What makes a place recognizable and an action satisfying while keeping the board readable? | V1–V4 art/feedback sheet for Animal Snack and Fill and Dump; proposed comfort defaults; separated game-specific/shared slices |
| 3 | **Peg Garden** (game) | Can lap play finish reliably, and can older players understand what a shot will do? | Guaranteed completion design, aim/landing feedback, repeatable trials and useful hints; separate the existing suite flake from game rules |
| 4 | **Fill and Dump** (game) | How does the built pouring mode grow into comparing capacity and choosing an amount? | Existing level/pool audit; same controls with meaningful comparisons, a transparent limited model and unscored prediction |
| 5 | **Shape Buddies** (game) | What makes a second arrangement a different spatial problem, and when do two shapes or two roles help? | Several valid fixed arrangements, supported completion and a separate shared-role definition; no duplicate shape-fitting game |
| 6 | **Read & Do** (game) | How can printed meaning change an action while spoken replay stays available? | Reviewed word/sentence content, acceptable alternatives, comprehension versus decoding distinction and a deeper complete round |
| 7 | **Photo Safari** (game) | Can noticing evidence and comparing scenes become more satisfying than fulfilling a picture request? | Clue-rich scenes, reviewed facts, journal evidence and observation/revisit modes |
| 8 | **Sink or Float** (game) | What manipulation lets a player improve a prediction or make something float? | A stated simplified model, controllable variables, repeatable tests and a minimal comparison view |
| 9 | **Song Maker** (game) | Can a player intentionally make and revise a phrase, answer a friend and perform it? | Free/composed mode separation, pentatonic phrase content, replay feedback and creation reuse |
| 10 | **Secret Code** (game) | What feedback teaches elimination; can one person make a fair puzzle for another? | Deduction/hint ladder and an independent maker/breaker slice tied to the seat decision |
| 11 | **Peekaround Island** (game) | What do spatial words and an overhead view let the player discover? | Readable landmarks, valid spatial clues, replay support and a purposeful viewpoint mode |
| 12 | **Pet Kitchen** (game) | Can equivalent pieces and scaled recipes stay tangible and playful? | Fair recipe content, alternative shares, meaningful quantities and a recipe-performance payoff |
| 13 | **Quick Tricks** (game) | Which gestures and comic payoffs transfer into the rest of the island? | Small stable gesture sets; deliberate accounting; no timers or automatic scene skips |
| 14 | **Island Bridges** (game) | How can a comfortable touch board and named deductions replace blind trial? | Touch layout at the approved target size, logical hints, undo, solver proof and an accessible older-player presentation |
| 15 | **Connected episode** (system) | What result actually needs to travel between games for the Woodland Picnic? | First scene, steps, consequence, stop/resume behavior and only the typed result that is needed |
| 16 | **Family roles** (system) | Can a younger child and adult each contribute without the adult taking over? | One role-swapped shared-board script, solo fallback, credit/accounting recommendation and a short person play protocol |

Existing Bouncy Launch and other unstarted game dives remain valuable; this shortlist concentrates on experience gaps rather than claiming a replacement sequence. Literacy facts and device phonics, simulation facts and language review retain their specific person checks. A new age band or exception to project rules must be resolved separately.

### New-game and mode pilots after research

Promote at most one new interaction at a time. These are **sketches**, with no implementation claim. Earlier ideas keep their notebook definitions; the two new seeds below are also recorded there.

| Pilot and likely audience | First complete round | Deeper decision and support | Extend or new? |
| --- | --- | --- | --- |
| **Warm-and-Cool Dig · preschool–school** | Tap a large patch to reveal one picture clue; choose another patch until a friendly fossil or buried toy is found. A nearby/farther cue is visible and spoken; every reveal helps | Combine two clues and explain a likely area. Unlimited reveals, no penalties for exploring; a bounded map guarantees a find | First evaluate as Treasure Map or Peekaround Island content; brushing a revealed object can reuse Splish Splash without pretending it is archaeology |
| **Cart Workshop · pre-K–school** | Choose a wheel and a load on a short fixed track, run the cart, then change one part and compare where it stops; deliver a parcel as the ending | Distinguish a single-variable test from changing everything. Replay restores the exact setup; all experiments are unscored and the model is labeled | First evaluate as Ramp Race; new game only if assembly and delivery are substantially different |
| **Gear Garden · pre-K–school, adult puzzles later** | Place a missing large gear between a handle and a dancing flower, turn the handle and see it move | Reason about direction and connectivity, then ratios only with a tested explicit model. Start with snapped placement and a forgiving turn control | New causal mechanism; Chain Reaction is a cleanup/replay reference, not a gear simulator |
| **Circuit Garden · school–grown-up** | Connect a battery, switch and lamp along chunky sockets; close the switch and light a little house | Compare open/closed paths, then plan several outputs. Undo and replay; facts and model reviewed before narration | New electrical model; reuse socket presentation, not ball or beam rules |
| **Story Theater · preschool–school** | Choose three events and a cast, watch the scene, then revise one event; any free story has an ending | One authored branch makes evidence matter; multiple supported endings where appropriate | Story Steps mode first; Story Weaver is the separate kept-book proposal |
| **Secret Code maker/breaker · pre-K–grown-up together where designed** | One person selects a small code; the other reads the same feedback and solves; swap roles | A fair bounded code and explanations let a child give an adult a real challenge. Solo authored puzzles stay available | Existing-game mode; seat credit is a prerequisite decision |
| **Row Together · family** | Two paddles steer a raft to one visible dock; supplies stay aboard after bumps and docking ends the round | Coordinate sides, then choose a route or load. A solo helper and comfortable pace avoid requiring a second person | New shared control; start after the family-role definition and placement decision |
| **Mini Golf · school–grown-up** | Pull to aim a ball on one short authored hole; choose to retry a shot or finish; a small course follows only after the shot feels good | Read a bounce, choose between routes and compare personal shot counts. No maximum strokes or lost ball; reset freely | New obstacle-course decision if Bouncy Launch cannot host it clearly. `ball.ts` supports flight, not top-down rolling: define the model before reuse. Prove reachability; do not advertise an exact par from a sampled shot search |
| **Pixel Flipbook · pre-K–grown-up** | Duplicate one small pixel picture, change a few cells and play the two-frame movement | Timing, anticipation and storytelling through revision; a Play/Stop control and easy frame undo | Pixel Pictures mode; bounded frame storage waits on the existing decision |
| **Sorting Machine · school–grown-up** | A visible sensor sends hat-wearing critters down one path; change the sensor and test a parade | Combine conditions only after single-rule predictions make sense; trace each decision and revise freely | Critter Sort/Crossing bridge, then a distinct machine if editable rules justify it |

## How this changes the roadmap

Finish or resume owned slices first. Then interleave useful content and ladder work with quality work; as a starting planning rhythm, choose a discovery/feel/world improvement after a couple of catalog slices, rather than only growing the count. This is a recommendation, not an automatic quota or a new scheduler policy.

1. **Repair the known input/return gap** in stage B; do not make couch retirement one huge prerequisite for better play.
2. **Define discovery and the art/feel sheet.** They are immediately useful docs-only work, followed by one shelf and one game pilot.
3. **Show a meaningful next mode** on one existing intro, retaining all current IDs and progress behavior.
4. **Deep dive games that open a missing experience**, while the existing tracker continues. Build cheap ready content from completed dives in parallel with these definitions when claims do not overlap.
5. **Connect a small adventure and one shared job.** Defer a broad project engine, party board and persistent economy until their first consequence is useful.
6. **Grow older-player breadth and make things worth revisiting.** A new puzzle family, an expressive tool and a comfortable skill game serve different motivations; do not fill every new slot with another number puzzle.

### What a quality review records

A later implementation review should note whether the player understood the action, whether touch feedback and consequences were readable, whether help enabled completion, what varied on replay, and whether the player voluntarily wanted to replay, revise or show the result. Include one meaningful alternative solution or experiment where the game permits one. Record short observations, not retention targets or a new analytics service.

For discovery, ask someone to find a remembered game, choose an unfamiliar suitable one, inspect another mode, leave mid-round and return, then switch profiles. For family play, watch whether both people make decisions and can swap roles. For art, compare a small landmark thumbnail and one landscape/portrait game view, including sound off. Device speech, reach and a child's reaction remain unverified until actually observed; their absence does not block a bounded desktop prototype.

## Research behind the recommendations

These sources inform the design; they do not validate Puddle Island's learning outcomes. The proposed slices and priorities are design inferences. Existing detailed JumpStart, Neopets, arcade and party-reference research remains in [IDEAS](IDEAS.md#reference-backlog).

| Primary source | What it supports here | Limit |
| --- | --- | --- |
| [Neopets' description of its world](https://portal.neopets.com/about-neopets) | Companion customization, recognizable lands, stories, collections and varied games can form one coherent identity | A product description, not educational or usability evidence; take the world structure and apply this project's own reward boundaries |
| [Skene et al., guided-play systematic review, 2022](https://research-portal.uea.ac.uk/en/publications/can-guidance-during-play-enhance-childrens-learning-and-developme/) | Child choice with responsive guidance is worth testing; some pooled outcomes favored guided play, including early maths and shape knowledge | Effects differed by outcome and studies varied; no general superiority for literacy or socioemotional learning, and no proof for a particular digital game |
| [MIT Lifelong Kindergarten](https://www.media.mit.edu/posts/lifelong-kindergarten-cultivating-creativity-through-projects-passion-peers-and-play/) | Making, sharing, revising and reflecting deserve space beside answer puzzles | A creative-learning design perspective, not an evaluation of this game's saved-project feature |
| [PBS KIDS Family & Community Learning guide](https://static.pbslearningmedia.org/media/media_files/48563a6e-71ba-4f1a-8389-3f2aa7c68329/7fe70918-f20c-4d04-abb0-b7d1ab7f7eeb.pdf) | Family activity can combine child-led choices, useful adult participation and something made together | Workshop guidance, not evidence that adding a second input automatically improves a minigame |
| [UNICEF RITEC Design Toolbox](https://www.unicef.org/childrightsandbusiness/workstreams/responsible-technology/online-gaming/ritec-design-toolbox) | Evaluate autonomy, competence, relationships, creativity and identity when judging a world or progression feature | Research mainly concerns children ages 8–12; do not extrapolate it as a lap-play assessment |
| [WebKit: Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/) | JavaScript-rendered experiences can follow reduced-motion preferences while retaining useful causal feedback | Review each motion in context; reducing presentation is different from slowing game physics |
| [Xbox Accessibility Guideline 103](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103) | Communicate important state through multiple channels, with shapes or labels alongside color | Internal simulations and checklists do not replace player testing; color-learning tasks need their own accommodation design |
| [PhET interface principles](https://phet.colorado.edu/publications/PhET%20Look%20and%20Feel.pdf) | Coherent representations, consistent cues and separation of play objects from controls inform investigation-game layouts | Simulation-interface principles are a useful design reference, not evidence that decorative detail improves learning |

## Verification of this review

Documentation only. Local links/anchors and `git diff --check` are the appropriate proof; the [verification log](VERIFICATION.md) records the actual results. No games, assets, levels, routes, saves or runtime contracts were changed. Proposed implementation checks above are future work.
