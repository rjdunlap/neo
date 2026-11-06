# Welcome Ways 1–7

Defined 2026-10-24 from the [engineering-design study](../deep-dives/subjects/engineering-design.md#a-first-games-ladder-welcome-ways) and its [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#engineering-design-recommendations), under the [2026-10-23 decisions](../archive/DECISIONS-2026-10-23.md#decisions). **Levels 1–4 built in [PR #951](https://github.com/rjdunlap/neo/pull/951).** **Levels 5–7 [defined](#levels-57-definition) 2026-11-06 ([PR #1315](https://github.com/rjdunlap/neo/pull/1315)), not built.** This remains the scope/rules contract; browser proof is in [VERIFICATION](../archive/VERIFICATION-2026-10-24.md#2026-10-24--welcome-ways-levels-14). Device fit and learning outcomes remain unobserved. [PR #944](https://github.com/rjdunlap/neo/pull/944).

Fun action: put big wooden parts into an entrance, tap Try and watch friends hop or roll into the house. Learning purpose: test a design against the stated needs of everyone who will use it, notice the first blocking part and revise it. The parade, door chimes and friends waving from the window supply the payoff. No timer or minimum-parts score.

## Build record

Worker `01a170c0-46c1-7561-ac1d-b39bb265291b`, branch `codex/welcome-ways-1-4`, [PR #951](https://github.com/rjdunlap/neo/pull/951). All three substeps landed together; Tinker Lab passed the actual capacity/layout sweep. Build notes live in the [completed archive](../archive/COMPLETED-2026-10-09.md#welcome-ways-levels-14-2026-10-24).

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

Definition proof was Markdown links and `git diff --check` only. Build checks are recorded in [VERIFICATION](../archive/VERIFICATION-2026-10-24.md#2026-10-24--welcome-ways-levels-14). iPad drag/tap comfort, spoken reasons on device, whether the child notices two visitors' needs, and human access representation review remain **not run**. No unresolved developer decision gates levels 1–4; later human representation, practical access cards and later geometry retain their study gates.

## Levels 5–7 (definition)

Defined 2026-11-06 from the engineering-design study's [ladder](../deep-dives/subjects/engineering-design.md#proposed-levels-and-bands), build slice 2: a **constraint** (5), a **conflict** between two friends' needs (6) and a **repair for a new friend** (7). Docs only; nothing here is built. The levels 1–4 rules above stay the contract for 1–4 and must not change.

Fun action, unchanged: fill the entrance, tap Try, watch the parade. New learning: the space can force the shape of a design (a turn), a part that helps one friend can block another (a rail where a perch must go), and a working entrance can be changed for a new friend while keeping what still works.

### Departures from the study

- **No steep ramp.** The study's level 5 puts a one-cell steep ramp in a short straight row. The 1–4 build made every rise socket a two-cell slot so every choice shares one footprint; a one-cell part would need free-length rows, a new interaction. Its lesson (a part fits but stops Roly) is already the step's. The steep ramp stays with Plaza Cases (8–9) if free-length rows are ever defined.
- **Bear, not River, needs the big landing.** River is a rework species not yet drawn; the [2026-10-23 cast decision](../archive/DECISIONS-2026-10-23.md#decisions) uses today's critters first. Bear's body fact grows by one consistent clause: big friends need a wide door and a big landing to turn.
- **The switchback is a fixed L, not a back row she lays out.** The turn is one corner socket in a fixed path. She chooses what goes in it, not where the path runs.
- **"Wobble" becomes Teeter.** "Wobble" would collide with Wobble Works in speech. Teeter is a small pig critter (`CRITTERS.pig` at a smaller scale, swaying walk). The glider is Duck (`CRITTERS.duck`, wings): it flaps up to a perch. Both are fictional bodies, as in 1–4.
- **Level 7's new friend is Roly, with the old friends Teeter and Duck**, so the repair sets off a chain (ramps for Roly mean a rail for Teeter, and the rail must not take Duck's perch side). This replaces the study's open "a third arrives".

### The model, levels 5–7

Sockets get a **kind**: `rise` (two-cell, `gentle` or `step`, as in 1–4), `turn` (the corner, `small` or `big` landing), `door`, and `side` (`near` or `far`, beside a straight run of rises, `rail` or `perch`). A plan lists its path sockets in walking order, then its door, then its sides, and carries its own **start design** (1–4: empty rises and the narrow door, as now). Socket order is this list order everywhere: `parts()`, hint ties, enumeration and the pulsed stop.

| Part ID | Socket | Property |
| --- | --- | --- |
| `small` | turn | a one-cell landing; the path turns on it |
| `big` | turn | a two-cell landing (same 160 touch socket, wider art); the path turns on it |
| `rail` | side | runs beside the whole straight run of rises on that side |
| `perch` | side | a ledge at door height on that side |

| Visitor | Art | Fictional body fact | Pass rule |
| --- | --- | --- | --- |
| Roly, Bunny | as 1–4 | as 1–4 | as 1–4; any landing; sides don't matter |
| Bear | as 1–4 | “Bear is big. Bear needs a wide door and a big landing to turn.” | as 1–4, and the turn holds `big` |
| Teeter | small pig, sways | “Teeter is little and wobbly. Teeter holds a rail on two ramps in a row.” | steps, landings and a single ramp pass; a run of two or more `gentle` rises in one straight row passes only if either side holds `rail`. A turn ends a run |
| Duck | duck, flaps | “Duck flies up. Duck needs a perch by the door.” | does not use the path; passes if either side holds `perch`. A side holds one part, so a rail and a perch never share a side |

**Where a visitor stops** (this is the pulsed socket and the repeat-detector key): Roly, Bunny and Bear as in 1–4, at the first blocking path socket or the door; Bear at a `small` turn stops at the turn, reason `needsBig`; an empty turn is `gap`. Teeter's `needsRail` stop is the **first empty side** (near, then far), else the near side. Duck's `needsPerch` stop is the **first empty side**, else (both rails) the far side. These choices make the stop socket the socket the hint glows, below. A rise run of two `gentle` with no rail lets Teeter walk the first ramp, wobble at the second and step back; the side slot pulses.

### Levels

Visitors, door and the start design are fixed per level; `ctx.rng` varies only house colours, tray order and decorations, as in 1–4. Tray choices stay unlimited (two ramps never run out).

| Level | Board (path, door, sides) and start | Tray | Visitors, in order | Accepted designs |
| --- | --- | --- | --- | --- |
| 5, Turn at the pond | rise, turn, rise; fixed **wide** door two steps up; no sides. Start: empty rises, `small` in the turn | gentle, step, small, big | Roly, Bear | `[gentle, big, gentle]` only |
| 6, A rail and a perch | rise, rise; fixed narrow door two up; near and far sides. Start empty | gentle, step, rail, perch | Roly, Teeter, Duck | `[gentle, gentle]` with near `rail`/far `perch`, or near `perch`/far `rail` |
| 7, Fix it for Roly | as 6. Start: `[step, step]`, near `perch`, far empty (welcomes Teeter and Duck, stops Roly) | gentle, step, rail, perch | Teeter, Duck, Roly | the same two as 6; the nearest keeps the perch (three changes) |

Level 5's pond fills the ground in front of the door, so the path must turn. Its single accepted design still passes the study's Habitat Helpers overlap test: both friends use every part (shared ramps and one shared corner), and the corner must suit the biggest friend, not one piece per visitor. Level 6 is the conflict: both rails stop Duck, both perches stop Teeter, steps everywhere stop Roly. Level 7 is the repair: Try at the start lets Teeter and Duck in and stops Roly at the first step; ramps then stop Teeter (two in a row), and a rail on the near side takes Duck's perch. Changing more parts than needed is never wrong; keeping the perch is praised after success (`ww.kept`), never required or scored.

### Accounting, help and finishing

Unchanged from 1–4: `misses` always 0; Try, edits, undo, removal and replays are free; two identical stops since the last edit trigger one suggestion; manual Show me gives the same suggestion; each distinct `{socket, part}` counts one hint per round; finish once after a fully successful parade. Level 7's start design is not an edit: undo starts empty, and no hint is recorded for it.

**Hint selection, widened:** take the accepted design nearest by differing sockets, ties broken by enumeration order (each socket's values in the order `null`, gentle, step, small, big, narrow, wide, rail, perch, with the first socket outermost). If the current design's stop socket differs from that design, suggest the stop socket; otherwise the first differing socket. For 1–4 this gives exactly the current suggestions (the first blocking socket there is always the first difference), and the 1–4 tests must still pass unchanged. A hint can replace a wrong part (a step, a perch where the rail goes, a small landing).

### Speech (`voice-script.ts`)

Proposed lines; instructions through `ctx.instruct`, the rest `ctx.say`.

| ID | Text |
| --- | --- |
| `ww.five` | The pond is in the way, so the path turns. Make a way for Roly and Bear. |
| `ww.six` | Make a way for Roly, Teeter and Duck. |
| `ww.seven` | Teeter and Duck can come in. Roly is new. Change the way so Roly can come in too. |
| `ww.bear5` | Bear is big. Bear needs a wide door and a big landing to turn. (Bear's card at 5) |
| `ww.teeter` | Teeter is little and wobbly. Teeter holds a rail on two ramps in a row. |
| `ww.duck` | Duck flies up. Duck needs a perch by the door. |
| `ww.corner` | The path turns here. Put a landing here. (a `gap` at the turn) |
| `ww.big` | This landing is too small for Bear to turn. Try the big landing. |
| `ww.rail` | Two ramps in a row. Teeter needs a rail on this side. |
| `ww.perch` | Duck has nowhere to land. Put a perch on this side. |
| `ww.perchRail` | Rails on both sides. Duck needs a perch on this side. |
| `ww.hintBig` | Put the big landing in the glowing corner. |
| `ww.hintRail` | Put a rail on the glowing side. |
| `ww.hintPerch` | Put a perch on the glowing side. |
| `ww.hintSwap` | Put a ramp here instead of the step. |
| `ww.kept` | You kept Duck's perch. Duck still lands there. |
| `ww.partSmall`, `ww.partBig`, `ww.partRail`, `ww.partPerch` | Small landing. / Big landing. / Rail. / Perch. |

`ww.ramp`, `ww.gap`, `ww.done` and the 1–4 lines are reused. The current `showSuggestion` speaks `ww.hintDoor` for anything that is not a ramp; it must pick the line by part and socket kind.

### Input, layout and presentation

The same input: drag or tap-a-part then tap-a-socket, Remove for the selected socket, Undo, Try, Show me, visitor replay. Side slots are wide strips covering the whole run (one socket each, near below the run and far above it, drawn as the run's front and back edges); the turn socket is a 160 square at the corner. No board scaling; every target at least 100 after transforms; no target selectable through another's hit area.

Proposed geometry, **not verified fit**, on the 1024-wide safe area:

- **Level 5, landscape:** lower row y≈560 with the first rise at x≈430; the turn at x≈630 between rows (y≈470); the second rise on the upper row x≈430, y≈380 going back left; the wide door at x≈230, y≈340 (clear of the bottom-left guide). Tray at y≈690 or a right-hand column (x≈930) if the row collides. Portrait moves rows down into the extra height (lower row y≈760, upper y≈580, tray y≈920).
- **Levels 6–7, landscape:** visitor cards in a row y≈150–260 (three cards, at least 110 square), far side strip y≈300–404 (x≈370–690), rises y≈420–580, near strip y≈590–694; the tray moves to a right-hand column of 120-unit choices (x≈930, y≈200–680) and Try sits above it. Portrait: cards y≈240, far strip y≈480, rises y≈620, near strip y≈760, tray y≈900, Try/Undo/Remove/Show me y≈1090 as now.

If this does not fit the harness's four standard views with safe insets and pet/navigation clearance, reflow (move the tray, stack cards) before shipping; never shrink targets. Code-drawn art from `palette.ts`: landings as flat planks (the big one visibly two cells deep), the rail as posts and a bar along the strip, the perch as a ledge with a little peg at door height. Teeter wobbles and steps back at an unrailed second ramp; Duck circles once over an empty side, then lands on the perch and hops in. Silhouettes and motion carry each rule without colour or sound.

### Rule tests (`logic.test.ts`)

1. **1–4 unchanged:** enumeration counts 2, 3, 3, 27, the same accepted sets, and the existing tests pass untouched.
2. **Enumeration:** level 5 has 27 designs, exactly one accepted; level 6 has 81, exactly the two listed; level 7 has 81 and the same two. Every tray part is in an accepted design or is a distractor with a named visitor it stops (step: Roly; small: Bear; at 6, rail on both sides: Duck; perch on both sides: Teeter).
3. **Walker cases:** level 5 start with ramps → Roly arrives, Bear stops at the turn, `needsBig`; empty turn → `gap` at the turn. Level 6 `[gentle, gentle]` with no sides → Teeter stops at the near side, `needsRail`; near rail, far empty → Duck stops at far, `needsPerch`; both rails → Duck at far. `[gentle, step]` passes Teeter (one ramp) and stops Roly. A turn breaks a run (no Teeter rule at 5). Level 7's start: Teeter and Duck arrive, Roly stops at the first rise, `needsRamp`.
4. **Hints:** for every non-accepted design at levels 1–7, the suggestion is legal, reduces distance to an accepted design by one, and, when the design stops, is at the stop socket. Repeated suggestions reach success from every design without a restart.
5. **Accounting:** level 7's start leaves undo empty and hints 0; all edits keep misses 0; a perch replaced by a rail and a repeat-help on one socket count as the 1–4 rules say.
6. **Bot:** `autotouch()` reaches success at 5, 6 and 7 from the start design with any tray order.

### Code the builder must widen

The 1–4 code finds the door by `socket === p.rises` (in `evaluate`, `compatible` and `Round.edit`), `initial()` hard-codes empty rises plus a narrow door, `planFor` clamps to 4, `presentation`, `designs` and `FOOTPRINT` know only four parts, and `layout()` knows one or two rises. Levels 5–7 need kind-tagged sockets, a per-plan start design, the widened `repair()`, two new boards in `layout.ts`, Teeter and Duck actors, and the speech choice by part and socket kind. `LEVELS.school` becomes `{ min: 3, max: 7 }`; other bands, saved levels and pins are unchanged (no renumbering).

### Ghost finger, how-to card and registration

- **Ghost finger:** places the hint-solver path from the start design, taps Try between steps where the demonstration teaches: at 5, two ramps then Try (Bear stops at the small landing), then the big landing and Try; at 6, two ramps, Try (Teeter stops), a rail, Try (Duck stops), a perch, Try; at 7, Try (Roly stops), two ramps, Try (Teeter stops), a rail on the far side, Try.
- **How-to card**, level-scoped: 5 "The path turns at the pond. Fill both ramp gaps and choose a landing for the corner. Bear is big and needs the big landing to turn. Tap Try." 6 "Roly needs ramps. Two ramps in a row need a rail for Teeter, and Duck needs a perch. Put a rail on one side and a perch on the other, then tap Try." 7 "Teeter and Duck can already come in. Change the entrance so Roly can come in too, keeping any part that still works. Tap Try after each change."
- **Registration:** no new game, land or save field; Tinker Lab is unchanged. `describeLevel` gains 5–7 ("Turn at the pond", "A rail and a perch", "Fix it for Roly"). Add `FINGER_LEVELS=5,6,7` and level 5/7 cases to the `welcomeways` browser case and its README row.

### Levels 5–7 check tier

New-interaction tier (new boards and part kinds on the existing drag/tap interaction), one build session in three substeps: (1) widened logic and rule tests; (2) the level 5 corner board; (3) the level 6–7 side strips with Teeter, Duck, voice, how-to and demo. If the session cannot finish, split after (2): level 5 lands alone and 6–7 follow. Checks: typecheck and the rule tests; layout tests for both new boards at the four standard views; one scripted play of the `welcomeways` case filtered to levels 5 and 7 (a stopped Bear at the small landing, a stopped Teeter, one hint, the supported finish); `fingerdemo` at 5, 6 and 7; one portrait screenshot of level 6 and a landscape look at 5 and 6. `npm run build`, since voice and how-to content change. Levels 1–4 evidence is reused if their tests pass unchanged.

Not established by any of this: whether a six-year-old reads the rail/perch conflict from the pictures, iPad speech for "Teeter" and "perch", and drag comfort on the wider strips. Definition proof: Markdown links and `git diff --check` only.
