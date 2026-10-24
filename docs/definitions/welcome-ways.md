# Welcome Ways 1–4

Defined 2026-10-24 from the [engineering-design study](../deep-dives/subjects/engineering-design.md#a-first-games-ladder-welcome-ways) and its [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#engineering-design-recommendations), under the [2026-10-23 decisions](../archive/DECISIONS-2026-10-23.md#decisions). **Docs only, ready for a separate build.** No game, registration, artwork, speech, device fit or learning outcome is established by this packet. [PR #944](https://github.com/rjdunlap/neo/pull/944).

Fun action: put big wooden parts into an entrance, tap Try and watch friends hop or roll into the house. Learning purpose: test a design against the stated needs of everyone who will use it, notice the first blocking part and revise it. The parade, door chimes and friends waving from the window supply the payoff. No timer or minimum-parts score.

## Scope, bands and overlap

New touch game `welcome-ways`, subject `tinker-lab` (the existing reasoning/engineering subject); proposed ranges: toddler 1–2, preschool 1–3, prek 2–4, school 3–4, defaults at each range's minimum. No lap or grownup registration in this build. School 5–7 and Plaza Cases 8–9 remain later definitions. The existing shell owns difficulty, stickers, guide, how-to, celebration and saving. No new profile field, construction collection, visitor unlock or home visit is implemented; a successful entrance lives only for its round. Use `ctx.companion()` for the guide.

Habitat Helpers matches pieces to needs. Here a placed part changes the traversable path and the **same entrance** must carry every visitor, in order. Level 3's step admits Bunny but stops Roly; level 4's ramps admit Roly but a narrow door stops Bear. Tests must preserve these examples. Gadget Bench remains one neighbor's portable gadget and its Give action; Welcome Ways has no Give or scored submission. Chain Reaction owns moving marbles and mechanisms; this game uses authored fictional traversal rules, not physics. Real access needs, building codes, human characters with disabilities and the proposed Who can use it? card remain outside scope.

## Parts and visitors

The entrance runs left to right through ordered two-cell sockets. Each installed rise piece climbs **one toy step**, using both cells. A step block has a vertical front and flat top; a gentle ramp has a slope across its full width. This is a fictional model, never a real ramp specification. Each socket's entry height equals the prior socket's exit height; a gap blocks passage. A door stands at the final height; width is a separate final socket, not a replacement for a ramp.

| Part ID | Footprint and property | Use in 1–4 |
| --- | --- | --- |
| `gentle` | two cells, rise 1, rolling surface | one copy available per rise socket |
| `step` | two cells, rise 1, vertical step at entry | an alternative in each rise socket, from level 2 |
| `narrow` | one door socket, one toy width | fixed in 1–3; selectable in 4 |
| `wide` | same door socket, two toy widths | selectable in 4 |

Rail, perch, landing, steep ramp and back-row turns are **not** tray parts or active rules in 1–4. They keep their later study roles; do not implement unused infrastructure. Every tray choice remains available after placement, so there can always be two ramps in level 4. Parts are socket choices, not a finite inventory. Dropping a choice on an occupied socket replaces its part atomically; removing a part restores a gap. A door choice only fits the door socket. Dropping elsewhere restores the prior state and is never an answer error.

| Visitor | Art for this build | Fictional body fact | Pass rule |
| --- | --- | --- | --- |
| Roly | round critter using existing `Critter` shapes, no human mobility device | “Roly rolls. Roly needs a ramp.” | every rise socket contains `gentle`; either installed door width passes |
| Bunny | existing bunny critter | “Bunny hops up steps and ramps.” | every rise socket contains `step` or `gentle`; either door width passes |
| Bear | existing bear critter, visibly wider than the narrow opening | “Bear is big. Bear needs a wide door.” | either rise piece passes; only `wide` passes |

Names are local fictional visitors, not new collectible species. Bear's drawn body must fit the wide aperture and visibly exceed the narrow aperture; hit areas never depend on its decorative body. Roly moves by a rolling bob without rotating a face upside down, Bunny hops, Bear walks. Distinct silhouettes and movement carry the rule without colour or sound.

## Round plans and accepted designs

One entrance and one successful parade completes a round, through `ctx.finish({ misses: 0, hints })`, with exactly one shell sticker including after help. The next round may vary house colours, tray order and harmless decorations using `ctx.rng`; visitor order, door height and rules below stay fixed. No hidden condition or randomly unavailable solution.

| Level | Initial board and tray | Visitors, in test order | All accepted designs |
| --- | --- | --- | --- |
| 1, Place a ramp | one empty rise socket, fixed narrow door one step up; only gentle ramp | Roly | `[gentle]`, fixed door |
| 2, Step or ramp | same board; step and gentle ramp | Roly | `[gentle]`, fixed door |
| 3, One entrance for both | same board and choices | Bunny, then Roly | `[gentle]`, fixed door |
| 4, Two ramps and a door | two empty rise sockets; fixed door frame two steps up, initially narrow removable door; step, gentle ramp, narrow and wide door choices | Roly, then Bear | `[gentle, gentle]`, wide door |

The starting narrow door in 4 deliberately lets Roly in once the ramps work, while Bear still stops; wide-first and either ramp placement order are equally valid. There is no plank budget in these rungs: the constraint is the fixed entrance footprint, one piece per socket and every stated visitor. Several distinct final designs arrive only with levels 5–7; do not invent alternatives that contradict the early visitors' rules.

Level 1 still uses the big Try button: instruction and ghost finger show place, then Try. This makes testing deliberate and avoids an unexpected parade mid-drag. A single placed part is its only building decision. A free tap on a visitor card repeats that friend's need; it never places a part or counts a hint.

## Testing, repairs and accounting

`evaluate(plan, design)` is a pure walker: visit friends in plan order, sockets from ground to door. Return either all arrivals, or `{ visitor, socket, reason, arrived }` for the **first** blocking location of the first blocked visitor. Reasons are `gap`, `needsRamp`, `needsDoor`, `needsWide`. An absent door uses `needsDoor`; Bear at a narrow door uses `needsWide`. An empty rise socket uses `gap` before any movement-specific rule.

Try walks the snapshot that was present at touch-down; lock building and Try during that short parade. A stopped visitor pauses at that exact part, which pulses, and the guide speaks the matching reason. Earlier arrivals remain visible only until that Try ends. The next Try starts **all** visitors outside, including earlier arrivals, so edits are checked for everyone again. A successful Try shows every arrival, then finishes once. Try on a gap is also a free observation; no reset, life, failure tally or game-over.

`misses` is always zero. Free actions include Try, placing, swapping, removing, invalid drops, visitor replay and undo. Keep one undo of the last building edit, clearing it on a new round; undo restores board only, never hint accounting. An interrupted/cancelled drag changes nothing. A repeatable failed Try is never an independent-mastery claim.

Automatic support: two completed Tries, since the last building edit, with the same `{visitor, socket, reason}` trigger one repair suggestion. A new building edit clears this repeat detector. The suggestion pulses the **needed tray choice and destination**; it does not silently install it. Manual “Show me” supplies the same suggestion immediately. Count each distinct `{socket, suggestedPart}` at most once per round across automatic and manual help; replays of an already shown suggestion do not add hints. Thus level 4 may record help for each ramp and the door separately, while repeatedly asking about one ramp records one hint. This preserves the shell's normal hints-based adaptation; do not add a private difficulty algorithm.

Hint selection uses a solver: enumerate accepted complete designs, choose the nearest by number of differing sockets (stable socket/part order breaks ties), and suggest the first different socket. The current wrong piece **may be replaced**; a solution need not extend an incorrect fixed placement. At an already accepted design, Show me simply says to Try, with no hint. This repairs the study's overly strict “extends the current one” wording, which would leave a placed step unhelpable. Automatic hints normally address the first blocking socket; the enumeration tests assert this for all four plans. The same solution guides `autotouch()`.

## Input, layout and presentation

Use `onTap` for Try, undo and visitor replay; `drag.ts` for parts, with forgiving nearest-socket drops. Support tap-a-part then tap-a-socket as an equivalent alternative, with a visible selection outline. Provide a large remove control for the selected occupied socket (clear selection on empty background), rather than requiring a precise return drag. Buttons show immediate touch-down feedback; a picked part lifts, a compatible socket outlines, an incompatible socket greys. Decorations and hint overlays have `eventMode = 'none'`. Preserve palm rejection, cancellation, resize state and destroy cleanup under the [input pitfalls](../DESIGN.md#input-and-rendering-pitfalls).

Layout is from `view` inside safe insets, with no board container scaling to squeeze parts. Proposed rectangles below use the 1024-wide safe design area, centred if `view.w` is greater; portrait moves rows down into its extra height. These coordinates are a construction plan, **not verified fit**.

- Navigation reserves y0–140. Keep guide space x0–240 at the bottom clear. Visitor cards (each 144 square) sit at x320 and x500, y160–304; only present visitors draw. House and parade sit below them, clear of controls.
- Entrance sockets: centres x430 and x630 at y440, each 160 square; for one rise use x530. Door socket centre x830, y400, 144 wide by 200 high. Level 4's drawn rise heights connect the two pieces without moving their input centres onto adjacent hit areas. Two-cell geometry is model space, not two little touch targets.
- Landscape tray: four possible choice centres x320, x500, x680, x860, y620; each 144 square. Only available choices draw. Try centre x860, y170, 144 square. Undo and Remove are 120 square centred x110 and x250, y390; Remove shows only for an occupied selected socket, with a spoken label on selection.
- Portrait (1024 × about 1365 logical units): visitor cards y240; entrance sockets y600 and door y560; tray y880; Try x850,y1090; undo/remove x330/x510,y1090. Keep the bottom-left guide region clear; do not spread cards to the corners.
- Every interactive target must remain at least 100 screen logical units after transforms. At narrower scales enlarge targets or reflow; never assume a 144-unit drawing survives arbitrary container scaling. Implementation layout tests cover the harness's four standard views, safe insets, all tray counts, and pet/navigation bounds. If proposed geometry does not fit, revise the layout before shipping, without shrinking targets. No part should be selectable through another target's hit area.

Code-drawn wood, ramps, door and critters use `palette.ts`; no generated assets or imported audio needed. Synthesize a soft snap, gentle stop boing and pentatonic door chimes. Quiet island music may play: this is a design game, not a music-making game. Use scene tweens and tracked critters; release drag handles/listeners and guard callbacks on destroy. Resize during a parade preserves its snapshot and visitor progress without finishing twice.

## Spoken support and how-to

Proposed `ww.*` lines for `voice-script.ts`; IDs do not exist yet. Instructions use `ctx.instruct` and the companion repeats them. Feedback uses `ctx.say`. All needs are pictured and replayable.

| ID | Text |
| --- | --- |
| `ww.title` | Welcome Ways. |
| `ww.one` | Put the ramp in the gap. Then tap Try. |
| `ww.two` | Make a way for Roly. Try a step or a ramp. |
| `ww.three` | Make one way for Bunny and Roly. Then tap Try. |
| `ww.four` | Make a way for Roly and Bear. Bear needs a wide door. |
| `ww.roly` | Roly rolls. Roly needs a ramp. |
| `ww.bunny` | Bunny hops up steps and ramps. |
| `ww.bear` | Bear is big. Bear needs a wide door. |
| `ww.gap` | There is a gap here. Put a part in the gap. |
| `ww.ramp` | Roly rolls. This step stops Roly. Try a ramp here. |
| `ww.door` | The door is missing. Put a door here. |
| `ww.wide` | This door is too narrow for Bear. Try the wide door. |
| `ww.hintRamp` | Put this ramp in the glowing gap. |
| `ww.hintDoor` | Put the wide door in the glowing frame. |
| `ww.ready` | The way is ready. Tap Try to invite everyone. |
| `ww.done` | Everyone can come in! |

Control labels use replayable “Try”, “Undo”, “Take this part out”, “Step”, “Ramp”, “Narrow door”, “Wide door”; speech never depends on reading them. Add missing control lines in the build. The finished guide celebrates everybody getting in, not a fastest or cheapest design.

Level-scoped how-to card steps:

| Levels | Card steps |
| --- | --- |
| 1 | Put the ramp in the glowing gap. Tap Try and watch Roly roll in. |
| 2 | Put a step or a ramp in the gap. Tap Try to see whether Roly can roll in. Change the part and try again whenever you like. |
| 3 | Bunny hops; Roly rolls. Build one entrance for both. Tap Try, then change any part that stops a friend. |
| 4 | Fill both gaps and choose a door. Roly needs ramps; Bear needs a wide door. Tap Try and invite both friends. |

`autotouch()` selects and places a solver solution, then taps Try and waits for finish through the real input path; it must handle swapped tray order and a pre-existing wrong part. Demonstration for 3 first tests a step, watches Bunny enter and Roly stop, then replaces it with a ramp. Demonstration for 4 repairs a narrow door after both ramps work. In demonstrations the shell owns persistence and rewards as usual.

Co-play: grown-up voices a visitor's pictured need while the child builds, then swap. Proposed off-screen line for preschool and older: “With large toy blocks, make an entrance for two toys that move differently. Let each toy try it.” No new under-three off-screen sentence or real building advice; use the existing off-screen policy and parent panel conventions.

## Build batch and verification gates

One new-game batch, levels 1–4, with three related substeps: (1) pure plans/walker/repair solver and tests; (2) one/two-socket building and visitor parade with supported completion; (3) voice, how-to, demonstration and island integration. No new shared infrastructure unless the implemented interaction needs it.

Home is **Tinker Lab**, else **Cozy Village**, per the decided order. At base `0b501cbd`, Tinker Lab lists 15 IDs and Cozy Village 13 in `lands.ts`. Pages are supported; a count does not prove failure or fit. Before registration run the existing `landLayout`/land tests and capacity sweep with this game at every band in all standard views, including older signposts. Keep all controls large and use pages. Only if the candidate fails its actual layout check, test Cozy Village; if both fail, checkpoint placement, not a new land. Check rework Places entry and return origin as well as classic land/path/older signposts. Do not change shell routes or save format in this slice.

Required meaningful rule tests in `logic.test.ts`:

1. Enumerate all designs, including gaps/absent door: 2, 3, 3 and 27 combinations respectively (fixed doors excluded). Exact accepted sets equal the table; every plan has a solution. Every distractor has a named blocked visitor.
2. Every choice occupies the same two-cell rise footprint; no steep ramp or late part exists. Seeded permutations change presentation only. Two ramps can be placed without exhausting the tray.
3. Level 3 step yields Bunny arrival then Roly/first-rise/needsRamp. Level 4 two ramps+narrow yields Roly arrival then Bear/door/needsWide; a first gap or first step stops Roly before door width is tested. Missing doors report needsDoor.
4. For every incomplete/incorrect design, the hint is legal, differs from the current socket and reduces distance to an accepted design by one. Repeated hints can reach success without restarting; installed steps can be replaced. Hints on accepted boards do not count.
5. All editing/Try/undo paths keep misses zero; repeat-detector reset on edit, two identical stops trigger help, one identical repair counts once across manual/auto help, different repairs can count separately. Undo cannot erase help. A successful Try calls finish once; a failed Try never does.
6. Input/bot tests cover cancellation, tap alternative, replacement, removal, resize during traversal, destroy during speech/tween and every new level's solver demonstration. Test the visitor snapshot and full retest after changes so an old arrival cannot bypass a new obstacle.

Build tier: typecheck and unit tests; one filtered scripted play covering first/last levels, a step that blocks Roly, narrow door that blocks Bear, hint and supported finish; demonstrate each new layout/level with `fingerdemo`; one portrait screenshot of level 4 and a landscape inspection. Build because registration/content files change. Add the suite/filter to the existing browser harness and README. Navigation/assets/persistence checks follow only what the implementation actually changes, under AGENTS' budget; do not claim offline fit from this document.

Definition checks: Markdown links and `git diff --check` only. Implementation checks, iPad drag/tap comfort, spoken reasons on device, whether the child notices two visitors' needs, and human access representation review are **not run**. These observations remain future build/device evidence, not blockers on writing this fictional toy packet. No unresolved developer decision gates levels 1–4; later human representation, practical access cards and later geometry retain their study gates.
