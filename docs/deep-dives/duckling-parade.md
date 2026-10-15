# Duckling Parade deep dive

*ID `duckling-parade` · lap–school · levels 1–10 audited 2026-10-15 · `codex/duckling-parade-deep-dive`, [PR #387](https://github.com/rjdunlap/neo/pull/387)*

## The game today

She taps grass or leads a finger across it; Mama waddles toward the destination and nearby ducklings join her trailing line. Taking that line to the pond makes each duckling hop in and splash. The learning purpose moves from intentional movement and following, through exact quantities and color selection, to ordered repetition. There is no collision loss, countdown or self-tail penalty.

Source audit at `f866d18` (the current main base of the claim; see Git history for the full hash): [rules and generator](../../src/games/duckling-parade/logic.ts), [scene and band windows](../../src/games/duckling-parade/index.ts), [rule tests](../../src/games/duckling-parade/logic.test.ts), [how-to](../../src/content/howto.ts), [speech](../../src/content/voice-script.ts), [game guide](../GAMES.md#duckling-parade). This is a code audit, not a fresh play-through. The tracker’s old eight-level/pre-K ceiling was stale; school 9–10 already exist.

| Level | Current plan | Bands whose window includes it | What she decides / round pool |
| --- | --- | --- | --- |
| 1 | Tap to walk | lap, toddler | Collect all three yellow ducklings; Mama heads to the pond automatically when all join |
| 2 | Lead everyone | toddler, preschool | Find four yellow ducklings, then lead them home |
| 3 | Bring a small number | toddler, preschool | Bring 2 or 3 from six yellow ducklings; two target quantities |
| 4 | One color | preschool, pre-K | Collect the three wanted-color ducklings among six, using two colors |
| 5 | Bring more | preschool, pre-K | Bring 3, 4 or 5 from seven yellow ducklings |
| 6 | Number and color | preschool, pre-K | Bring 2 or 3 of one color from eight ducklings in three colors; wanted color has target + 1 available |
| 7 | AB line | pre-K | Collect six in alternating colors, with the entire target shown |
| 8 | ABC line | pre-K | Collect six in a three-color sequence, with the entire target shown |
| 9 | AAB line | school | Collect six: two of A, one of B, repeat |
| 10 | AAB with a spare | school | Same six-place AAB line, leaving one third-color duckling in the meadow |

Current windows: lap 1; toddler 1–3; preschool 2–6; pre-K 4–8; school 9–10. No `order` override or appended entry exists. `planFor` clamps to 1–10. Multi-color rounds shuffle the five-color pool (yellow, blue, pink, purple, red). There are 20 ordered distinct two-color assignments and 60 ordered distinct three-color assignments; level 10 uses three colors but only two in the line. Level 6 has two quantities × 60 assignments before meadow shuffling. Meadow positions are seeded, normalized and gently animated; there are no named meadow/content cards. The same rule already varies by color and arrangement on replay. The plan descriptions at 7/8 name fixed example colors although generated colors vary.

`canJoin` checks color or the next pattern color. All six pattern slots remain visible, with the next ringed. Count dots fill for ducks already in the pond, not ducks following Mama. Count rounds accept partial trips; extras hop back out, count one miss for that arrival, and can still finish the round with help. A pattern cannot unload until its whole six-duck line is complete. A wrong-color/next duck merely passed by is unpenalized; a destination aimed near it can count a miss, subject to nearest-joinable and cooldown rules. Two such misses, or 15 seconds without progress, trigger a counted hint; hint glows show eligible loose ducklings and/or the pond. Joining clears the hint state. Level 1 automatically changes the destination home; the other modes need a pond visit. `ctx.finish` passes misses/hints to the shell for its normal single sticker.

Existing tests cover sufficient inventory over seeds, AAB/spare generation, order and complete-line pond rules, extras, and `nextStop` choosing eligible ducklings/clear routes. They do not establish real-finger intention or layout comfort. The ghost finger uses `nextStop`, dragging along a clear route and otherwise tapping a waypoint/destination. This game has no couch catalog entry or `control`/`autoplay`; do not imply controller play. No journal discovery, kept creation or picnic result is emitted. Existing co-play suggests counting together; off-screen suggests follow-the-leader and counting the line.

### Known gaps and proof limits

- Pointer down sets a destination, with acknowledgment mainly through Mama starting to walk; no explicit destination marker is drawn. Up/outside release are handled, but there is no explicit `pointercancel` handler. A fresh finger replaces the prior steering ID; palm rejection is present. Record a cleanup/cancellation slice, not a fix in this session.
- Counting progress is hard to inspect before a pond visit because dots reflect only home count. An extra can join incidentally along a route and still produce an arrival miss. Whether to change that accounting needs the developer; current passing checks are not approval for a new policy.
- The spoken extra count uses `target + extra`. After earlier partial deliveries this is the eventual total, not necessarily the size of the line that just arrived; future wording should distinguish total from current batch without changing accounting.
- `parade.repair` and the how-to describe leaving out a spare. Level 10 does not repair an already incorrect line; call it exclusion rather than claiming repair/revision learning.
- The most recent recorded [level-10 evidence](../VERIFICATION.md#coverage-summary) is reused: filtered `arcade` and clean `fingerdemo`, 2026-10-10. No checks rerun here. iPad speech, color distinction, intended selection versus incidental joining, palm/cancel handling and independent child understanding remain open.

## Similar games

Six precedents were reviewed through the sources below on 2026-10-15; none was played. Progression comparisons describe documented mechanics and design inferences, not learning-effect evidence. The Meerca page returned 403 on opening; its limited comparison uses first-party search excerpts only. Other linked pages/PDF opened.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Meerca Chase II](https://www.neopets.com/games/game.phtml?game_id=500), also [Neopets pet games](https://www.neopets.com/games/pet/) | Classic collection/steering; named in the current game | Gather Neggs to grow a tail; maze mode adds hedges (excerpt-only evidence) | An immediately visible growing following line | Hazard/score-driven challenge; no self-tail collision or lost ducklings here |
| [Pikmin 4](https://pikmin4.nintendo.com/) | Leader-and-followers adventure | Types gain different uses; exploration opens routes; gathering, transport and rewind permit different approaches | A follower visibly joins, moves with the group and reaches a destination; inspectable roles could later deepen a route | Combat, danger and limited expedition days; timed Dandori challenges |
| [Snakebird](https://noumenongames.itch.io/snakebird) | Spatial snake puzzle | Boards ask different body shapes for pushing, lifting and teleportation | New decisions can come from arrangement rather than faster movement | Gravity traps or geometry that turns ordinary steering into a precision test; no such body simulation proposed |
| [Thinkrolls 2](https://www.avokiddo.com/thinkrolls2/) | Touch educational maze | Separate easy/hard sets; chapters introduce different physical concepts | Introduce a rule in isolation, then combine it with something familiar | Its scale of 270 puzzles is not a content requirement; no unverified cognitive-benefit claim or unrelated physics system |
| [Snipperclips](https://www.nintendo.com/us/store/products/snipperclips-cut-it-out-together-switch/) | Cooperative action puzzle | Different tasks use adjustable paper shapes and joint experiments | Partners can suggest/test an approach, then exchange roles; a joyful action can carry reasoning | Required simultaneous input or dependence on a second player |
| [Copy My Pattern / Extend the Pattern / Same Rule, Different Stuff](https://youngmathematicians.edc.org/wp-content/uploads/2021/06/Patterns.pdf) | Physical educational pattern games, pp. 20–22 | Copy, find a missing part, continue a unit, then transfer its structure to new materials | A visible repeating unit and meaningful extensions rather than only a longer line | Small loose manipulatives as a lap activity; memory copying and age labels as readiness gates |

[Head Start’s preschool math framework](https://headstart.gov/school-readiness/article/math-preschool) separates object counting, cardinality and patterning. Here, one-at-a-time pond arrivals support matching a count to a collection; hearing the app count does not prove the child counted independently. The EDC/NAEYC [pattern games](https://youngmathematicians.edc.org/wp-content/uploads/2021/06/Patterns.pdf) distinguish copying, extending and transferring a repeating unit, with approximate developmental expectations. That supports the proposed direction, not a claim that any particular level teaches algebra or is suitable for every child of an age. [NAEYC’s meaningful-math discussion](https://www.naeyc.org/resources/pubs/tyc/oct2014/making-math-meaningful) also supports mathematical conversation during ordinary play.

## What makes sense here

Keep the pleasurable waddle-and-splash action across the ladder. Lap gets an easy cause/effect encounter; toddler chooses a destination; preschool selects a quantity or color; pre-K builds an ordered line; school can extend a visible unit or compare rule structure. Additional speed, crowded boards and hidden instructions would mainly measure motor control or memory. New quantity work stays here only when choosing and transporting a group matters; Duck Pond already covers direct duck counting and Market Stall covers requested quantities. Pattern Train owns completing a stationary train; Duckling Parade earns its extension when the chosen followers visibly form and carry the ordered line. Roundup’s crowd shooing and pen gate are different actions and need no duplicated subsystem.

No younger band than lap is proposed. Preserve all ten saved IDs and the school window already built. Proposed windows below do not invent another age band, move lands or change saves. Older-family constraint puzzles remain optional future definitions; the current school game can also remain a relaxing favorite.

## Experience and presentation

The first unsupported action is a tap beside a visible duckling. Mama turns, waddles, the duckling hops into place and quacks; the finger can lift while she walks. Make touch acknowledgment explicit with a broad, fading grass ring at the clamped destination, drawn with `Graphics` and palette colors. It is a destination cue, never a new target or obstacle. Keep decorations noninteractive. At the pond a white/blue ripple and synthesized splash show each arrival; return readiness through the existing step back from water, without another confirmation screen. Keep speech through the voice script and any added pitched response pentatonic.

Replay can change the five-color assignments, spacing and harmless meadow dressing (reeds or flowers outside paths), with the same inventory and collection rule. Two code-drawn meadow backdrops can feel different without moving the pond or reducing controls. Do not obscure the duckling’s color or add accessories as scored attributes to existing levels. A future count card should distinguish already home from following now with duck pictures as well as fill; the developer must choose whether that visible aid is wanted.

Keep requests and the next pattern position visible and replayable through the pet. Tapping a destination remains a valid alternative to continuous steering at every level; a how-to correction can state that existing fact. Wide collection reach and safe passing keep arithmetic/pattern reasoning separate from precise dragging. A bot route is useful proof of completion but cannot judge whether a child’s finger feels in charge.

Supported completion retains eligible-duck glows, the home glow and normal rewards. If an appended level needs help, guide the next actual choice and allow the same taps to finish; no separate reduced-reward route. Home can be used at any time. After completion use the shell’s Again/next/home choices; do not add obligations to the remaining meadow ducklings or an endless parade that cannot comfortably end.

Solo remains complete. A co-player can be the caller, pointing to the next displayed color or counting one duck per arrival; the child steers, and roles can swap next round. The caller should describe the rule rather than grab the device. An optional off-screen large-body clap/clap/step pattern can echo a unit when appropriate; no small loose props are needed. Observe real-device color contrast, target understanding, speech pacing and sound-off feedback; observe voluntary replay and independent pattern continuation with a person. No learning transfer or tween/parent demand is established by this plan.

## Proposed ladder

### Fresh content inside existing levels

**Built in #389:** make plan descriptions at 7/8 say two-/three-color repetition rather than fixed generated colors; make the how-to say tap or lead a finger at 2–10 and describe level 10 as a pattern with a spare. Clarify arrival speech as the total in the pond plus extras after a partial trip. Preserve the generator, misses/hints and ten IDs. Accounting and generator retained; see the build note below.

**Built in #397:** two cosmetic meadow treatments (flowers, reeds), seeded and drawn outside input routes, with pond, Mama start, duck inventory, count ranges, pattern units and color pools unchanged.

**Ready after support:** a small authored arrangement pool is only ready after proving open routes and clear choices in both layouts; do not assume random spacing is fair just because inventory is sufficient. No fresh quantity or color-attribute expansion in existing saved levels.

### New levels on top

All are proposals, not implemented. IDs 11–14 are reserved only in this write-up and must be rechecked before a build. The first extension can be built without changing lower levels; choices requiring a developer call are explicit.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | ABB parade | school, proposed 9–11 | Six ducks in two colors; displayed A B B A B B; use the current full target card | Repeat a different two-color unit, rather than merely alternating or AAB | Current wrong-next refusal and two-miss/idle eligible glow; partial pattern cannot unload | Exact multiset covers every prefix; A differs from B; all seeded rounds finish; every eligible color agrees with the next slot | Small: generator/plan, truthful description/how-to, voice can reuse pattern line; bot and school range; no new interaction or couch |
| 12 | Keep it going | school, proposed 9–12; decision before build | Two shown AB units on a persistent reference; collect a separate four-duck continuation with empty progress slots | Infer continuation from the visible repeating unit instead of copying every future color | Deliberate wrong-next miss; hint reveals one next slot, marked as help; full reference stays visible | At least two full reference units; continuation phase exact; finite candidate supply; hint is accepted next; no reference duck is accidentally counted toward transport | Medium: reference versus progress art, rule/help state, speech, bot, and accounting definition; new interaction tier |
| 13 | Same rule, new colors | school, proposed 9–13; decision | Visible yellow/blue AAB reference; pink/purple meadow with picture key yellow→pink, blue→purple | Carry the same unit into a new pair of colors; reference never disappears | Wrong-next gets next-role explanation; hint points through the key then to a waiting duck | Bijection of two colors; both roles differ; every accepted sequence has the same equality structure as the reference; six available matches | Medium: mapping display/read-aloud support, generated pairs, help and bot; distinct from Pattern Train’s stationary mapping; define layout first |
| 14 | Our parade | pre-K/school optional; decision | Choose two distinct large color swatches and AB or AAB picture unit; then lead six matching ducks home | Author a bounded pattern, then make it move | Authoring choices are never misses; preview/rechoose before walking; during collection current wrong-next rules with help; completion after six delivered | Every offered selection yields finite solvable inventory; no same-color two-role unit; preview and checker use one rule; help/replay cannot duplicate completion | Medium/large: deliberate creation/setup phase, 100-unit controls, voice, bot and phase cleanup; no saved creation until separately approved |

### Younger-band openings

Lap already exists at 1; no new band/window is needed. Three ducklings and automatic home may already be enough. **Decision/person:** an appended single-duck encounter at 15 could offer a more immediate lap entry if real play shows 1 is too indirect. First round: one yellow duck near Mama, tap any meadow destination to approach it, automatic home and one sticker. No miss for exploration; highlight the nearby encounter only as truthful assistance. Tests would prove the join and automatic ending and absence of unreachable starting geometry. This is an easier entry, not evidence of independent counting. Do not silently reduce level 1.

### Easier entries and levels between existing ones

No renumbering. If 15 is approved, lap `{ min: 1, max: 15, order: [15, 1] }`, toddler `{ min: 1, max: 15, order: [15, 1, 2, 3] }` and module `entryLevels: [15]` can place it safely; other bands retain their exact supported order. Explicit order must exclude intervening IDs outside each band’s intended ladder. Review toddler inclusion separately rather than infer it from lap approval.

A two-duck visible AB entry could later bridge 6→7, but it needs observation: reducing sequence length may help motor load without teaching repetition, since one AB is not a repeated unit. Prefer the proposed support/arrangement work first. Do not append that entry until the exact repeating evidence and its band order are defined.

### Left out on purpose

No faster snake mode, fatal tail collisions, blocked exits, prey, timers, lives, streaks or score chase. No arbitrary twelve-duck increase. No physics-body solver, mandatory controller/co-op mode, new map destination or save schema. No “repair” label for choosing around a spare. Letter/odd-even steering references in the [notebook](../IDEAS.md) remain candidates for their own meaningful learning interaction, not automatic modes here. Pattern transfer should remain one bounded visible example; a general symbolic-rule machine belongs with Critter Crossing/Rule Parade.

## Decisions for the developer

These are open choices, not resolved by this research. [Waiting list](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer).

1. Should the count card show following-now as well as home-so-far? Should incidental extra pickups still count as misses on arrival, or only deliberate quantity checks? Freeze the exact rule, assistance and adaptation accounting before changing either. Keep existing behavior in ready slices.
2. Approve the school continuation/mapping direction at 12/13, including a permanently visible reference and one-step reveal as counted help. No hidden-sequence memory test.
3. Is a bounded player-authored parade at 14 wanted? Default proposal is no kept creation; a saved parade would need its own result/storage design.
4. Observe lap 1 before approving the one-duck 15, its automatic ending and any toddler entry/order change. Do not equate a bot finishing with infant readiness.

## Build slices, in order

1. Truthful support at existing 1–10 is built in [PR #389](https://github.com/rjdunlap/neo/pull/389); [build note](../archive/COMPLETED-2026-10-09.md#duckling-parade-truthful-support-2026-10-15).
2. Destination acknowledgment/cancelled steering is built in [PR #391](https://github.com/rjdunlap/neo/pull/391); [build note](../archive/COMPLETED-2026-10-09.md#duckling-parade-destination-and-cancellation-2026-10-15). Real-finger feel remains open.
3. Two cosmetic meadow treatments are built in [PR #397](https://github.com/rjdunlap/neo/pull/397); [build note](../archive/COMPLETED-2026-10-09.md#duckling-parade-meadow-treatments-2026-10-15). Both are seeded decoration only.
4. **Ready — append ABB at 11.** Six slots and two colors on the existing pattern interaction, extending only school to 11. Typecheck and game rules; one filtered top-level `arcade` play (`ARCADE_ONLY=parade ARCADE_LEVELS=11`) and `fingerdemo` (`FINGER_ONLY=duckling-parade FINGER_LEVELS=11`); build because registry/band integration is shared. Update all game/level docs and person checks. Recheck that 11 is unused first.
5. **Decision first — freeze and build 12 only.** After approval, define reference/progress, reveal help and completion; then implement the four-duck continuation with first/last relevant round, one wrong choice, one hint and portrait under the new-interaction tier. Typecheck, meaningful units, filtered play/demo; build for shared changes. No 13/14 bundled in.
6. **Decision first — mapping 13, then authoring 14, each its own session.** Define their pictures/acceptance/help and solo/bot phases before implementation. Each uses the new-interaction tier; kept results excluded. Do not broaden windows while implementing the mapping.
7. **Person/decision first — lap entry 15 and count aid/accounting, separate slices.** Observe 1, resolve the open choices, then define stable orders/entries and exact miss/help semantics. A level uses the new-level tier; an accounting change uses focused rule/regression proof at 3/6 and demo if affected. Any shared difficulty/save/navigation changes require their actual stronger tier. No such implementation is admitted here.

## Build record

The original #387 session was docs-only audit and research, with links and diff checks only. Support slice 1 is built in #389; [verification](../VERIFICATION.md#2026-10-15--duckling-parade-truthful-support). The source audit and known gaps above describe the pre-support base; the fixed-color descriptions, exclusion terms and extra-arrival wording are now corrected. Destination/cancellation slice 2 is built in #391; [verification](../VERIFICATION.md#2026-10-15--duckling-parade-destination-and-cancellation). Other proposed slices and person/decision work remain open.
