# Creature-world rework

[GitHub epic #484](https://github.com/rjdunlap/neo/issues/484) tracks the twelve work items.

**Direction recorded 2026-10-16; implementation is staged, not built.** The developer wants a broad educational play journey with collectible, customizable creatures, meaningful unlocks, a personal world and manageable navigation, drawing on Neopets, Pokémon, JumpStart and Khan Academy. The title, final cast and visual treatment remain explorations. Puddle Island is still the shipped title.

Start with the [work items](WORK-ITEMS.md). [READY.md](../READY.md) remains the one dispatch queue; GitHub issues carry discussion, claims and execution state. This document holds the rework's direction and boundaries. [DESIGN.md](../DESIGN.md) continues to describe implemented behavior, not this target.

## Decisions and working recommendations

| State | Direction |
| --- | --- |
| Developer requested | Learning through satisfying mini-games from early childhood through schooling; stronger pet collecting/customization, retention through playing, unlocks, meta progression, breadth and future expansion |
| Developer clarified | **“It's all development, saves aren't a issue.”** Old development saves and backups may become incompatible or be reset as a rework slice needs. Do not build compatibility layers or migration projects to protect them |
| Implementation approach for this plan | Change the existing application in place, keep reusable games and research, replace surrounding systems in complete slices, and use Git history for removed code |
| Working recommendation | Home with creatures → a chosen discovery/project → a few games → a visible result → a creature, item, interaction or new adventure; Explore keeps the catalog available |
| Working recommendation from RW01 (2026-10-17) | World-led title **Puddlewild**, Puddle Island its first region, with a plain descriptive line for grown-ups. "Discovery Club" is the story premise only (a 2021 DISCOVERY CLUB PSP application covers children's educational apps; its current status was not checked); the on-screen club is provisionally the Puddlewild Club. See the [name and story packet](NAME-AND-STORY.md). No rename is approved |
| Working recommendation from RW06 (2026-10-20) | `look.worn` per individual with slots, dressing from Friends, the root Home with RW03's per-band exits and one ball toy in creature play; all nine items free for now (default). See [home packet](HOME.md) |
| Working recommendation from RW03 (2026-10-17) | Home offers a project, creature play and Explore; Back retains browse origin, Home goes to the creature home. Complete paged direct-play index, explicit family entry, interrupted-step restart. See [navigation packet](HOME-NAVIGATION.md); no production cutover until RW08 |
| Explore in RW02 | Expressive illustrated adventure, built from clean layered 2D shapes, varied creature silhouettes and quieter backgrounds. The concept sheet is reference material, not approved production art |
| Developer requested (2026-10-19) | **The creature preview grows into the whole revamped experience.** The site root now serves the rework (today the creature preview, `src/rework.ts`); the current island game moved to `classic/` until the revamp replaces it. The revamp should look nicer and bring the improved games and island navigation back inside it, and it is the time to rethink every location as a diverse ecosystem or environment, with its own backgrounds and creatures/pets ([RW13](WORK-ITEMS.md#rw13-island-revamp-ecosystems-as-locations)). This extends the 2026-10-16 habitat-kits wish (vary the scenery, no separate zoo land) from dressing lands to rethinking them. `classic/` is temporary: RW08's rule against a permanent classic mode stands |
| Decided after RW02b (2026-10-17) | The developer judged the [illustrated, mesh-animated glider](GENERATED-CREATURE-PILOT.md#pilot-result-2026-10-17) "much better" than the Graphics one: creatures use generated illustrated sprites with weight-field mesh rigs, keeping RW02's slots, misfits and still-texture thumbnails. The playful-flat recommendation below is superseded for creatures. The [art bible](ART-BIBLE.md) and [prompts](ART-PROMPTS.md) keep generated images consistent |
| Superseded RW02 recommendation (2026-10-17) | Playful-flat construction (palette fills, one outline, light-tint shading) with per-species rigs that only move containers, two accessory slots with deliberate misfits, still-texture thumbnails; expressiveness through silhouette and motion, not texture. See the [art prototype packet](CREATURE-ART.md). The dev preview is removed or absorbed at RW05 |

The save exception overrides older preservation/migration requirements **for this development rework**. Current-format defaults, bounded validation, reliable writes, profile isolation, current-format backup/restore and offline play still need appropriate checks. Define one understandable reset/reseed path when changing the format. No save is reset by this planning change.

## Learning belongs in the story

The **Discovery Club** is a working story premise: the child and their creatures explore the island, investigate questions, make things and help a community. A home base holds tools, creatures, creations and a journal of what they actually did. A recurring question leads into a playable project, and its answer visibly changes the world.

Examples to develop, not new game registrations:

- **How can we welcome a new friend?** Make a decoration, share food and compose a greeting. The new creature joins the home and uses the child's creation.
- **What will carry our garden across the pond?** Predict, build and test a floating arrangement; compare observations and welcome a river creature.
- **How can everyone hear the concert?** Make and repeat musical patterns, arrange a performance space and invite friends using a picture map.
- **Can we tell what happened from these clues?** Sequence observations, consider explanations and create a storybook of the investigation.

The educational action must cause the useful or funny result. A project can include free creative play, physical skill and a quiet favorite alongside explicit learning. Friendship and world rewards recognize participation/completion, including help; they do not certify mastery. Fictional creature lore and magical forms are labeled as fiction, separate from factual science content.

RW01 compares a world-led title plus an educational subtitle, a creature-led name, and the current title. Test pronunciation, recall, broad age appeal, parent understanding and room for future regions. A subtitle/description can explain the learning promise without putting grade levels on the child's adventure. Naming research is not a reason to stop functional work under the current title.

## The experience that grows

| Stage | Child's main experience | Collection and learning presentation |
| --- | --- | --- |
| Lap / under 2 | Shared cause-and-effect play with a grown-up | One creature in focus, one or two immediate toys; no collection-management or curriculum expectations |
| Toddler | A small understandable intention | Dress, play and help with one pictured action; immediate consequences |
| Preschool / pre-K | Short connected adventures | Meet a small family of creatures, make things for them, preview the next invitation |
| Early school | Choose, plan, revise and explain through play | Projects, useful tools, collection goals and evidence across activities; reading support remains available |
| Later elementary | Longer investigations and creative ownership | Persistent projects, optional creature forms/talents, small teams and richer subject ladders |

These are design stages, not new runtime bands. Keep the current band's behavior until a concrete slice changes it; do not infer older-child curricular coverage from the broad `school` age label. The subject studies and [standards audit](../deep-dives/subjects/standards-audit.md) supply gaps and reference material.

Home offers a primary adventure/continue action, play with creatures/favorites, and Explore. The youngest presentation is simpler. Explore can grow through places and workshops, with a small visible choice set and a complete index; adding games must not shrink targets. Home and Back receive distinct consistent meanings in RW03 before route changes ship.

## Creature collection and expansion

Plan a first collection across several shape and habitat families, then implement only three well-differentiated pilot creatures. A species brief includes silhouette, locomotion, personality, discovery story, signature interaction, wearable attachment positions and possible later forms. An individual creature has its own identity, chosen name/look and shared experiences. A selected companion travels; the rest remain available at home.

The long-term collection includes species, appearances, clothes, child-made patterns, toys, performances and habitats. Meet creatures through authored adventures; preview attainable goals and give older players meaningful choices. Supported completion reaches the same adoption/unlock. New chapters, workshops, toys and optional modes can unlock permanently through play; the old blanket “nothing gates” proposal does not veto this direction. Existing free-play learning and help remain accessible, and families can choose direct play.

Growth can unlock optional branching appearances and playable actions. It does not need a global experience bar, an idle timer or a new currency. A creature's change is not a claim about the child's skill. Talents should eventually let small teams contribute to planning/building; the child still makes the decisions. Keep favorite companions useful and avoid making one species the only access to a school subject.

Existing comfortable-stopping principles remain: no neglect while away, lost ownership, real-money purchases, streak requirements or expiring collection windows. A later economy belongs to a defined learning/play purpose, with the existing [Harbor study](../ROADMAP.md#older-child-progression-a-market-week-not-an-island-grind) as input, not an automatic prerequisite for collection.

Each future region pack should add a small cast, new uses or looks for existing companions, a connected project and specific learning/play depth. Add a substantial new mechanic only when that pack uses it. Discovery Marsh, Maker Harbor, Storybook Square and Skywatch Isles are existing **proposed** region concepts, not already-built destinations.

## Art exploration

[Three-treatment concept sheet](concepts/art-directions-2026-10-16.png): Playful flat, Illustrated adventure, Soft toy. Generated during this design conversation; concept/reference only. The middle treatment is the current recommendation, with the simpler treatment's gameplay clarity. Its dense/painterly background detail is not a runtime requirement.

**Art requests (2026-10-17):** [art-requests/](art-requests/README.md) holds the routine's brief, the [nine-species cast](art-requests/CAST.md), the [request queue](art-requests/QUEUE.md) with prompts and the [game-fit review](art-requests/GAME-FIT.md). The queue is what an image-generating routine works through; its cast is proposed, not approved. The routine delivered R01–R15 on 2026-10-17/18; the [review of 2026-10-19](ART-REVIEW-2026-10-19.md) judges the sets, adds R17–R23 and sets the code slices that follow. [PET-INTEGRATION.md](PET-INTEGRATION.md) (2026-10-17) reviews how the creatures go further into the games themselves: a guide with a job, her creatures as the cast, one talent per species, what a round makes coming home, and meeting a creature inside a game, with a recommended order and the developer's calls.

The production baseline remains Pixi Graphics and the shared palette. RW02 proves varied body families, readable expressions, simple shading and compatible wearables in code before a large cast is promised. A different asset pipeline is a separate explicit decision, not implied by the concept sheet. Compare creatures at small collection size, with clothing, in motion and against a playable scene in landscape/portrait. A picture alone does not establish child appeal or touch readability.

## Change in place

Do **not** copy the app into `archive/`, create a second repository, or build a permanent `src/v2` beside it. The current minigames, input/audio helpers, rules, bots, tests and subject research are useful foundations. Reuse them by need; remove a replaced implementation from active source once its successor works. Git retains the old version.

Use short feature branches/PRs for one complete slice. A temporary development-only route or explicit preview switch may expose a prototype while the ordinary route still works. Each such route must name its removal/cutover item; it is not a permanent “classic mode.” Do not carry dual saves or parallel world models solely for compatibility. Development data may reset at a clearly recorded cutover.

Proposed responsibilities, created only when a real slice needs them:

| Location | Responsibility and transition |
| --- | --- |
| `src/games/<id>/` | Keep game rules, levels, interactions and demonstrations here. Avoid wholesale moves or renaming merely for branding |
| `src/creatures/` | Species definitions, individual creature state, ownership/equipment and pure collection rules; RW05 introduces the first needed pieces |
| `src/art/creatures/` | Renderers/body families and attachment positions proved by RW02; adapt existing `art/pet.ts` at integration, then remove superseded rendering paths |
| `src/adventures/` | Authored requests, typed outcomes and pure project/unlock rules used by RW07; extract picnic logic only when reuse needs it |
| `src/learning/` | Small reviewed skill/mode mappings and evidence rules for the pilot, introduced in RW09; no up-front universal curriculum engine |
| `src/app/scenes/` | Home, collection, dressing, exploration and game scene orchestration; domains above own their rules |
| `src/progress/` | Persistence of the new current model; reset/reseed, validation and profile boundaries; no legacy-save migration project |
| `src/content/`, `src/engine/`, `src/audio/`, `src/parent/` | Reuse voice/how-to content, input/timing/audio and plain-HTML family tools; reorganize only for an implemented need |

An adventure requests a mode from an existing game; the game reports a bounded result; the adventure applies it once and the home renders the consequence. Keep knowledge of particular stories out of unrelated games. Creature/world progression and learning evidence are separate data with separate meanings.

## Documentation and existing work

- Keep this brief plus [WORK-ITEMS.md](WORK-ITEMS.md) as the initiative's specification. Issues are execution/discussion records; the roadmap contains only the next eligible slice and a pointer, not copies of every task.
- Keep current behavior in DESIGN and GAMES until replaced. Put future mechanics here or in their work-item packet. Do not rewrite current facts as if the rework shipped.
- Keep game deep dives and subject research in place. They remain inputs for content and learning coverage, not a demand to implement every proposed game.
- Archive only material that has actually been superseded; preserve an index and fix links. There is no reason to archive the whole existing plan or source before its replacement exists.
- Finish already-claimed work. [Discovery D1b #483](https://github.com/rjdunlap/neo/pull/483) landed before this plan merged; RW03/RW08 must build on its result navigation. Do not implement a competing Next game flow.
- The built Windy Picnic and Woodland Picnic are references for resumable projects. Missing Melody and other standalone story proposals must be reviewed against RW04/RW07 before a new story framework is started. Existing visual-identity and habitat-kit studies inform RW02/RW12; they are not competing reskins to implement simultaneously.
- After active claims, prioritize the ready rework exploration packets in the roadmap. Continue fixes and useful game/content work; reconcile unclaimed shell, pet, save and broad visual overhauls with this plan before scheduling them.

## Delivery and verification

RW01–RW04 produce concrete, reviewable exploration/definition results. RW05–RW08 deliver the first playable creature-home/adventure loop and replace the old default navigation incrementally. RW09–RW12 deepen educational evidence, collection goals and expansion mechanics. Dependencies in the work items determine actual order; an open downstream issue is not implementation-ready.

Each worker claims one bounded slice, freezes its acceptance checks, integrates current main and uses the AGENTS verification budget. Docs use links/diff checks. Runtime art prototypes use relevant type/build and visual checks. Creature state, save, navigation and story work use their affected rules, focused browser flows and current-format production/offline checks. Add game-rule and ghost-finger proof only for changed games/modes. Do not add old-save compatibility tests under this rework exception.

Judge the pilot by whether a child can find something to do, recognize/select a favorite creature, use a reward, explain what changed and resume a chosen project. Observe learning with help versus independently where the game actually supports that distinction. Child/device observations remain separate from automated correctness; retention is voluntary return to play, not a target for longer sessions.
