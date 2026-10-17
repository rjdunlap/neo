# Creature-world work items

[GitHub epic #484](https://github.com/rjdunlap/neo/issues/484) tracks the twelve work items.

Scope source: [rework brief](README.md). The [roadmap ready list](../ROADMAP.md#ready-to-build-now) is the dispatch queue. GitHub issue links below record execution; dependency satisfaction and a defined packet, not issue age, make an implementation ready. One issue can have several small PRs: claim the first slice listed, report remaining acceptance criteria, and close only when the whole item is delivered.

**Development saves may reset.** Do not add compatibility/migration work to any item. Validate the current schema and its writes/profile isolation. Title/cast/style names in exploration are provisional; no global rename is needed to begin.

## Sequence

| ID | Work item | Readiness | Depends on |
| --- | --- | --- | --- |
| [RW01](https://github.com/rjdunlap/neo/issues/485) | Name and story | packet written 2026-10-17 ([NAME-AND-STORY.md](NAME-AND-STORY.md)); final name is a developer decision | None |
| [RW02](https://github.com/rjdunlap/neo/issues/486) | Creature art and animation prototype | prototype and packet done 2026-10-17 ([CREATURE-ART.md](CREATURE-ART.md)); production style is a developer decision | None; use provisional names |
| [RW02b](#rw02b-generated-creature-art-and-animation-pilot) | Generated creature art and animation pilot | partly done 2026-10-17 ([PR #503](https://github.com/rjdunlap/neo/pull/503), [result](GENERATED-CREATURE-PILOT.md#pilot-result-2026-10-17)): pipeline, rig and comparison proven on a concept-sheet stand-in; **step 1, generating candidates, still ready**: the developer runs ChatGPT passes from the [art bible](ART-BIBLE.md) and [prompts](ART-PROMPTS.md); the developer chose the illustrated direction | RW02 prototype; no RW03 dependency |
| [RW03](https://github.com/rjdunlap/neo/issues/487) | Home and navigation packet | packet and wireframe done 2026-10-17 ([HOME-NAVIGATION.md](HOME-NAVIGATION.md)); production cutover waits for RW08 | Reconciled D1b; RW01 informs language |
| [RW04](https://github.com/rjdunlap/neo/issues/488) | Welcome adventure and learning packet | ready, docs definition | Existing game/source audit; coordinate RW01–RW03 |
| [RW05](https://github.com/rjdunlap/neo/issues/489) | Creature collection and active companion | define after upstream packets | RW02, RW03 |
| [RW06](https://github.com/rjdunlap/neo/issues/490) | Playable home and customization | define after upstream packets | RW03, RW05 |
| [RW07](https://github.com/rjdunlap/neo/issues/491) | Welcome adventure and visible reward | define after upstream packets | RW04, RW06 |
| [RW08](https://github.com/rjdunlap/neo/issues/492) | Explore and default-home cutover | define after upstream packets | RW03, RW07; reconcile D1b |
| [RW09](https://github.com/rjdunlap/neo/issues/493) | Learning evidence and family recap | define after upstream packets | RW04, RW07 |
| [RW10](https://github.com/rjdunlap/neo/issues/494) | Collection book and chosen unlock goals | define after upstream packets | RW05, RW07, RW08 |
| [RW11](https://github.com/rjdunlap/neo/issues/495) | Optional forms and useful talents | sketch, definition first | RW02, RW10 |
| [RW12](https://github.com/rjdunlap/neo/issues/496) | First expansion and later-school coverage | sketch, definition first | RW08, RW09, RW10; RW11 only if used |

## RW01: Name and story

[Issue #485](https://github.com/rjdunlap/neo/issues/485)

**Outcome:** a short identity/story packet that makes curiosity and learning understandable alongside collecting and customization.

**First slice:** compare three naming structures (world plus learning subtitle, creature-led name, current title), recommend one, and write a pictured Discovery Club opening and one complete invitation/ending. Explore **Puddlewild: Discovery Club** without renaming source or publishing it as approved.

**Acceptance:**
- Explain the child's role, creatures' roles, why mini-games matter and what a completed project changes; distinguish factual learning from fantasy lore.
- Show lap/toddler shared play, a preschool adventure and an older-child investigation in the same world; no required reading for navigation.
- Include pronunciation/recall/parent-understanding criteria and a practical name-conflict screen; record uncertainty, not a claim of legal clearance.
- Record the chosen working recommendation and any final-brand decision in the existing decision ledger. Continue implementation with placeholders while the final name is unresolved.

**Delivered 2026-10-17:** [name and story packet](NAME-AND-STORY.md). Human name/appeal checks are listed there and in device checks, not run.

**Likely files:** a new packet under `docs/rework/`, this index and the affected roadmap/decision row. **Proof:** links and diff; any human name/appeal checks explicitly recorded as not run until observed.

## RW02: Creature art and animation prototype

[Issue #486](https://github.com/rjdunlap/neo/issues/486)

**Outcome:** three distinct, customizable creatures proven in the project's renderer at actual presentation sizes.

**First slice:** an isolated development preview of a squat sprout creature, a long river creature and a broad cloud glider; one idle and one touch reaction each, plus one scarf and one head accessory across the cast. Keep the current game route intact until integration.

**Acceptance:**
- Use Pixi Graphics/shared palette; vary body and face proportions, silhouette and movement. Include small collection views and landscape/portrait scene composition.
- Prove accessories attach during motion and leave species features readable; record incompatible slots deliberately.
- Compare against the [concept sheet](concepts/art-directions-2026-10-16.png), simplifying painterly/background detail. The sheet is reference only.
- Record the production recommendation and rendering/animation cost; no whole-catalog reskin or universal rig framework.
- Name RW05 as the integration/removal point for a prototype-only renderer/route, or explicitly retain the preview only as an existing dev test surface.

**Likely files:** `src/art/creatures/` and a minimal existing-dev entry, plus a reference packet under `docs/rework/`. **Proof:** typecheck, build if shared rendering/assets change, one preview covering movement/accessories in landscape/portrait; cleanup and touch geometry checks where interactive. No game suites for untouched games.

## RW02b: Generated creature art and animation pilot

**Status:** partly done 2026-10-17 ([result](GENERATED-CREATURE-PILOT.md#pilot-result-2026-10-17)); step 1, generating candidates, is still ready and needs an image-generation tool. Bounded follow-up to RW02, with sprite permission approved by the developer on 2026-10-17. The assistant creates and prepares the assets; no developer drawing work is required. No new GitHub issue has been created for this follow-up.

**First slice:** one illustrated cloud glider, generated from the concept reference and animated with a small layered/deformable or pose-based rig; idle, wingbeat, touch reaction, collection portrait and crown, compared with the existing Graphics glider in the isolated dev preview. No full-cast reskin or production route/save change.

**Definition, acceptance, research and fresh-session handoff:** [generated creature pilot](GENERATED-CREATURE-PILOT.md). RW05 consumes the accepted result; final style approval remains distinct from permission to generate sprites.

## RW03: Home and navigation packet

[Issue #487](https://github.com/rjdunlap/neo/issues/487)

**Claim 2026-10-17:** worker `01a14afb-f60e-7f83-b0e7-8c049c4369a7`, branch `codex/rw03-home-navigation`; Home/Back, collection/dress, Explore/workshop and resume exploration only. Expected files: `docs/rework/HOME-NAVIGATION.md`, `docs/rework/home-navigation.html`, this index, roadmap, verification and queue. No runtime or creature-art edits. [PR #501](https://github.com/rjdunlap/neo/pull/501). Exploration complete; runtime unchanged.

**Outcome:** an inspectable route/interaction design with fewer immediate choices and a clear place for the whole catalog.

**First slice:** prototype Home (adventure/continue, creature play, Explore), collection/dress entry and one workshop/library path. Define Home versus Back, profile switching and project resume, including an interrupted game.

**Acceptance:**
- Show simplified lap/toddler and richer school presentations with large spoken/pictured choices; define how older/younger favorites remain reachable.
- Map current map/age-place/room/journal/favorite destinations to their future responsibilities. Keep a complete direct-play index without showing every item at once.
- Reconcile [D1b #483](https://github.com/rjdunlap/neo/pull/483) and existing controller/couch work; do not duplicate or silently discard their behavior.
- Specify one temporary preview entry, the default-route cutover and obsolete routes to delete in RW08. No permanent classic/v2 mode.
- Give RW05–RW08 exact interaction/return-route acceptance and a short observed-play script.

**Delivered 2026-10-17:** [route/interaction packet](HOME-NAVIGATION.md) and [standalone wireframe](home-navigation.html); Home/Back, collection/dress, workshop/library, full-index responsibilities, project interruption and RW05–RW08 route gates. Desktop prototype inspected; real-child/device and production integration checks remain open.

**Likely files:** a packet/prototype under `docs/rework/`; no production routing change in this exploration. **Proof:** links/diff and inspection of any prototype; real-child/device usability stays an explicit observation gap.

## RW04: Welcome adventure and learning packet

[Issue #488](https://github.com/rjdunlap/neo/issues/488)

**Outcome:** a buildable definition of **Welcome a New Friend**, connecting existing games to one adoption and an actual kept creation.

**First slice:** audit Stamp Studio, Pet Kitchen and Song Maker at concrete preschool/pre-K levels; choose the smallest coherent two- or three-step project. Use built picnics as references. A younger one-action toy and older variant are separately scoped, not assumed to work from the same task.

**Acceptance:**
- Specify the fun action, learning purpose, exact modes/bands, request/outcome fields, spoken prompts, supported ending and replay/resume behavior for each step.
- Carry at least one actual child creation into the ending/home; state which other consequences are fixed. Do not pretend a fixed tune/portion was the child's result.
- Define adoption and item rewards once per project, including retries, scene exit and reload; keep round stickers owned by the existing shell.
- Map a small set of explicit learning intentions to observable actions; distinguish free creation, help, independent responses and unknown evidence.
- Identify overlaps with Missing Melody, visual/habitat studies and current creation storage; specify the first complete implementation slice and its check filters before RW07 is ready.

**Likely files:** a definition under `docs/rework/`, references to existing game logic/how-to/voice and picnic contracts. **Proof:** source/rule audit, links and diff; no claim of observed engagement or learning transfer.

## RW05: Creature collection and active companion

[Issue #489](https://github.com/rjdunlap/neo/issues/489)

**Outcome:** a fresh development profile owns named individual creatures and can choose the one that accompanies play.

**First slice:** implement the smallest collection model and a functional selection surface for the three pilot species, then connect active selection to the existing guide and pet-sensitive games. Consume RW02 assets and RW03 interaction rules; remove temporary duplication as it integrates.

**Acceptance:**
- Separate species definitions from individual identity, chosen name/look and selected companion; do not store speculative breeding/combat/rarity systems.
- Define a fresh save and reset/reseed path. Old development formats may reset or be rejected; no old-save migration layer.
- Current-format validation repairs invalid species/equipment/selection safely and bounds collections. Profiles remain isolated; current-format backup/restore and offline persistence work.
- Audit pet rendering/voice assumptions, hatching/profile cards, guide, home and games using a large pet; choose focused regressions for the strongest affected uses.
- Selection changes the actual companion, survives reload and never counts as educational mastery. Preserve existing helper contracts only where callers still need them.

**Likely files:** `src/creatures/`, `src/art/pet.ts`, `src/art/creatures/`, `src/progress/`, hatch/profile/guide call sites. **Proof:** shell/save tier, focused pet-game regressions and current-format offline check; no legacy fixtures required.

## RW06: Playable home and customization

[Issue #490](https://github.com/rjdunlap/neo/issues/490)

**Outcome:** creatures visibly play in a personal home, and the child can use customization earned or made through play.

**First slice:** one home scene with selected creature, a repeatable toy interaction and a dressing action that saves one accessory/look. Implement the RW03 routes for this small surface; consume the RW05 collection rather than a second pet model.

**Acceptance:**
- Touch-down feedback, replayable spoken support, 100-unit targets, portrait/landscape and guide/control clearance.
- The equipped appearance follows the creature through home, selection and gameplay; remove/change never destroys ownership.
- At least one child-made picture or tune has a visible/playable place. Additional rooms and large inventories wait for actual use.
- Other owned creatures can be selected; no care decay or absence-based obligations.
- Release scene listeners/tweens/resources, and record any temporary entry's RW08 removal.

**Likely files:** home/dressing scene, creature state/renderers and existing creation/room content. **Proof:** shell/navigation/save tier and one focused interaction flow with landscape/portrait; current-format reload/offline checks.

## RW07: Welcome adventure and visible reward

[Issue #491](https://github.com/rjdunlap/neo/issues/491)

**Outcome:** a complete pictured project brings a new creature home and uses what the child made.

**First slice:** implement the complete minimal RW04 packet, introducing only the request/result types and progression rules it uses. If the packet cannot fit one session, claim its named runnable sub-slice and leave the issue open until the entire loop works.

**Acceptance:**
- Home → invitation → participating games → visible consequence/ending → usable home reward, with spoken replay and direct free play.
- Actual reported creation appears/plays in the ending and home; fixed consequences are represented honestly.
- Supported completion receives the same adoption. Repeating/resuming cannot duplicate the unique creature/item or round sticker; leaving early changes only completed steps.
- Save and resume the current project; cancellation is safe; a new development schema may reset old data.
- Reuse current game modules and picnic lessons. Keep story-specific requests explicit and ordinary independent rounds working.

**Likely files:** `src/adventures/`, project/home scenes, the participating games' opt-in results, progress/voice/how-to. **Proof:** story/navigation/save tier, focused project happy/help/exit/reload/replay flow, changed game rules/demos only as affected and current-format offline check.

## RW08: Explore and default-home cutover

[Issue #492](https://github.com/rjdunlap/neo/issues/492)

**Outcome:** the new home becomes the ordinary landing and the catalog remains easy to browse and launch.

**First slice:** switch the default profile entry to the proven home; implement the agreed Explore route using existing catalog/land metadata and preserve explicit game return origins. Reconcile D1b before changing results.

**Acceptance:**
- The complete catalog is reachable, including younger favorites and family/grown-up play; a large catalog does not shrink targets.
- Home/Back, project resume, chooser/profile switch, pause, how-to and input-mode routes match RW03.
- Direct-play availability is separate from authored chapter/collection unlocks. A hard pet requirement cannot block access to a learning subject.
- Delete obsolete duplicate navigation and temporary switches/routes in the same cutover or a specifically linked immediately following slice. No archived copy of source or permanent classic mode.
- Update DESIGN/README to implemented behavior and archive only planning passages now superseded; fix links and remove obsolete tests rather than preserving incompatible expectations.

**Likely files:** app routes/scenes, library/land content, relevant discovery controls, documentation and focused browser harness. **Proof:** shell/navigation tier, `world`, one affected direct-next/project flow and current-format offline check; couch suites only if their shared flows change.

## RW09: Learning evidence and family recap

[Issue #493](https://github.com/rjdunlap/neo/issues/493)

**Outcome:** parents can see what the pilot involved and what its recorded actions support saying about learning.

**First slice:** introduce stable learning-intention/mode mappings for the pilot games and a plain-HTML recap of one completed project. Keep world rewards separate from evidence.

**Acceptance:**
- Record encountered, supported and independent-in-this-task evidence only where the interaction establishes it; creative participation and insufficient evidence are explicit.
- Do not label two smooth game rounds or a collection reward as subject mastery. Cross-context claims require actual additional observations.
- Age is a starting point; reading and number evidence remain separate. No global readiness score inferred from minutes/stickers.
- Show a useful explanation and next invitation or family activity using reviewed existing content; the child does not need a dashboard.
- Bound current-format records, honor profile isolation, and leave broad curriculum-engine/general recommender work for later implemented needs.

**Likely files:** `src/learning/`, pilot result/reporting, progress and `src/parent/`. **Proof:** evidence-rule units, affected save/parent shell checks and current-format offline proof as needed; child learning transfer not established by automation.

## RW10: Collection book and chosen unlock goals

[Issue #494](https://github.com/rjdunlap/neo/issues/494)

**Outcome:** children can see their creatures/items, choose an attainable next goal and use the permanent result.

**First slice:** a small pictured collection book showing owned creatures, one named upcoming discovery and one customization goal, with a direct path to the relevant project.

**Acceptance:**
- Preview what is attainable and explain how to reach it; selection/resume follows the new navigation and voice rules.
- Completion with help unlocks the same reward. Replays are idempotent; no duplicate collection quota or arbitrary easy-round farming.
- Owned looks/toys/forms remain selectable. The book handles a larger collection through readable grouping rather than shrinking every tile.
- Keep exploration, friendship/world progress and learning evidence distinct; ordinary learning/help stays accessible.
- No global currency, random drop engine or real-time collection schedule is required for this slice.

**Likely files:** collection content/rules and scene, adventure reward/goal integration. **Proof:** pure unlock/ownership tests, focused collection/project/return flow and applicable shell/save/navigation tier.

## RW11: Optional forms and useful talents

[Issue #495](https://github.com/rjdunlap/neo/issues/495)

**Outcome:** one familiar creature gains a meaningful new appearance/action through an authored experience.

**First slice:** define one branching form choice and one interactive use in an existing project or home toy; prove body/wearable compatibility before implementation.

**Acceptance:**
- Growth follows a clear play experience; original appearance stays selectable and individual identity persists within the current model.
- A talent changes something the child can do or investigate; it does not automatically answer the learning task.
- Define a route for favorite companions to participate and a fallback where a species action would otherwise block a subject.
- Fantasy transformations remain separate from real biology instruction and from evidence of the child's mastery.
- Defer breeding, complex team statistics and generic ability frameworks; a second real use earns shared infrastructure.

**Likely files:** definition first; then creature art/rules and the one consuming game/project. **Proof:** docs first, then the affected interaction/state/art tier, bot only if a demonstrated game action changes.

## RW12: First expansion and later-school coverage

[Issue #496](https://github.com/rjdunlap/neo/issues/496)

**Outcome:** a second coherent place/project proves that the world can grow without another rework.

**First slice:** audit the catalog by learning strand, readiness and kind of play; choose one proposed region and define a small cast plus project with a specific later-elementary gap. Use existing subject studies rather than restarting them.

**Acceptance:**
- Include math, literacy/language, science, engineering/computing, arts/music, people/world, everyday/social learning and movement in the coverage map; record thin areas honestly.
- Identify which existing games gain useful modes, which new interaction is warranted, and what existing pets gain from the expansion.
- Specify an entry appropriate to the supported band plus genuinely deeper decisions; a 6–12 label alone is not a later-school curriculum.
- Add a small set of species/looks, one connected project and one new mechanic only if needed. World navigation stays bounded and readable.
- Define content review, supported completion, unlocks, actual learning evidence and observations before implementing; split into complete claims/PRs with appropriate checks.

**Likely files:** expansion packet and relevant subject/game definitions first; actual content modules later. **Proof:** docs audit first; each delivered game/project/art/navigation slice uses its own tier. No whole-release check merely for adding the plan.
