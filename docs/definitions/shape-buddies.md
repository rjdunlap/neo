# Shape Buddies: first solo round, and level 2

**Solo definition, 2026-10-11; level 1 implemented 2026-10-12 ([PR #204](https://github.com/rjdunlap/neo/pull/204)).** Stable ID `shape-buddies`; roadmap [chunk 5](../ROADMAP.md#next-up), [candidate](../IDEAS.md#candidates). This is one round, not a whole-game ladder or research session.

## Purpose and overlap

Fun action: turn two paper creatures into a bridge and a seed catcher, try the construction, then carry the caught seed to a pot. Learning: a shape's function depends on where it is used; change one part and observe the result. Proposed bands `prek` and `school`, both level 1 only (`{ min: 1, max: 1 }`); no younger-band or new-band claim. Proposed subject and existing home land: `tinker-lab`, subject skills shape/function and spatial planning. Integration must still prove that land fits without smaller targets.

[GAMES](../GAMES.md#chain-reaction), [IDEAS](../IDEAS.md#candidates) and the [deep-dive tracker](../deep-dives/README.md) were checked. Chain Reaction already snaps separate ramps into sockets and traces a marble to a bell; Block Tower tests load support, Ramp Race compares slopes, Bug Builder composes matching body parts, and Quick Tricks stretches a bridge. None implements changing a creature between supporting and containing shapes. Keep this small new activity only while those transformations remain the meaningful action. If implementation becomes just placing ramps to route a ball, extend Chain Reaction instead.

## Level 1: one gap, one seed, one pot

Show a fixed starter chute on the left bank, one 140-unit gap, a receiver dock on the right bank, and a pot farther right. Two interchangeable paper creatures start in separate parking spots. Each has a plain silhouette and exactly three selectable, predefined replacements: **flatten** (wide bridge), **scoop** (cup), **slope** (wide ramp descending right). Tools replace the silhouette, never cut or accumulate geometry. Both bridge silhouettes span the gap; the starter chute supplies the push across the flat bridge. No steering or timing is required.

1. Tap either creature to select it, tap a shape tool, and drag it onto the bridge or receiver dock. One creature per dock; occupied docks reject a drop gently, without replacing the occupant. Return a creature to its own parking spot to free the dock. Switching selection keeps both creatures' changes.
2. Tap Try to release the seed from the fixed chute. A flattened **or sloped** creature at the bridge carries it across; a scooped creature at the receiver catches it. The seed stops in the cup and waits for the player.
3. Tap the pot's picture to have the receiver carry its cup along the right bank and tip in the seed. A sprout and both friends' wave complete the round through `ctx.finish({ misses, hints })`, once. The shell gives one sticker, including with help, and owns saving, celebration and return navigation.

Known workable construction: creature A flattened at the bridge, B scooped at the receiver; Try, then pot. Equally acceptable: A sloped/B scooped, or either bridge shape with the creature identities exchanged. Accept the visible outcome, never compare to a single stored answer. Choosing, reshaping, parking and failed experimental runs are exploration: **misses stay 0**. A failed run has a soft boing, a cushion catches the seed, and speech names the first unsupported step: “The seed needs a bridge” or “The seed needs a cup.” Replay returns the seed to the chute with the construction unchanged. After two unsuccessful runs, glow the relevant dock and useful tool; count a hint only when this actionable guidance is first shown for that unresolved step. An explicit Help action gives that same guidance and does not charge it twice. Supported completion remains available by following the glowing actions; assisted completion is not independent mastery.

Undo restores the previous edit, including placement and selection. Undo or Replay while the seed waits in the cup resets it to the chute before editing; all edits are disabled during the short run/carry animation. No wrong-answer gate, speed requirement, lives or round-ending timer. Home is available through the shell at any time.

## Touch, speech and lifecycle

Lay out from `view.w/h`: construction across the middle; two separate selection/parking areas and three tools below; Try/Replay, Undo and Help in separate areas clear of the bottom-left pet and shell corners. Every creature, dock, tool, pot action and button has a non-overlapping target at least **100 logical units after scaling**; bridge art is not the receiver's hit area. Show selection and tool response immediately on touch-down. Use `onTap`, existing object drags (including finger lift and cancellation), and nearest valid dock on release. Resize must preserve spacing rather than shrink controls. Portrait is the app's usable view/turn-prompt contract.

Proposed voice-script lines, read through `ctx.instruct`/`ctx.say`: “Make a bridge and a cup for the seed”; “Choose a friend”; “Flat can make a bridge”; “A slope rolls it across”; “A scoop holds it”; “Try your shapes”; “Now take the seed to the pot”; and the two replay explanations above. The corner pet repeats the instruction. Shape pictures, selection rings and spoken labels make every step usable without reading. A parent can ask “Which shape can hold it?” while helping the single player. Off screen: slide a large soft toy over a cardboard bridge into a bowl; no small seed props.

Use Pixi Graphics/palette and synthesized sounds, scene-owned tweens, tracking and cleanup. The existing shell, pet and ghost-finger demonstration contract suffice; no new infrastructure, save field, imported art/audio, controller mode or independent second seat. Release drag handles and tracked objects in `destroy`; scene cancellation must stop the carry/finish chain.

## Inspectable rules and implementation proof

Put silhouettes, docks, legal placements, undo snapshots and a pure trace in the game's `logic.ts`. A finite authored model determines events: chute → bridge (flatten/slope pass; absent/plain/scoop fall) → receiver (scoop catches; absent/plain/flatten/slope spill) → player-requested carry → pot. Animation renders that trace; it cannot decide success from frame rate or approximate collisions. `engine/ball.ts` models pegs/walls, not these silhouettes; do not extend it into a shape solver. Chain Reaction's deterministic trace and known-solution hints are reuse references, not copied assumptions. Level 1 has fixed geometry; seeded RNG may vary creature colors only, never solvability. No procedural puzzle generator is needed.

Future implementation tier: **new game/new interaction** from [AGENTS](../../AGENTS.md#verification-budget). Typecheck and meaningful unit tests: all accepted identity/shape arrangements; failure at each missing role; hint actions that lead to a solution; undo/replay preserving/restoring state; seeded presentation consistency; completion once and hint deduplication. One filtered scripted play at level 1 (first and last are the same), failed trial, hint, undo/replay, assisted finish and exactly one shell sticker; ghost finger must use the same touch actions. One portrait screenshot checks clearance/100-unit targets; build when shared registry/content files change. Add the normal module/land/voice/how-to/README/GAMES integration then, not now. Device speech, real iPad touch and child understanding remain human checks. This document originally recorded no implementation proof; see [verification](../archive/VERIFICATION-2026-10-07-13.md#2026-10-12--shape-buddies-solo-seed-journey) for the subsequent build checks.

Future proposals only: two useful shapes combined. The different fixed dock arrangement is now defined as [level 2](#level-2-a-step-down-defined-2026-10-16). No developer decision blocks this bounded definition; the developer commissioned the solo implementation on 2026-10-12. Arbitrary cutting, general physics, cooperative seats and competitive modes stay excluded.

## Level 2: a step down (defined 2026-10-16)

**Status: ready** (docs-only definition, roadmap [chunk 5](../ROADMAP.md#chunks); nothing here waits on the developer). One appended level on the existing interaction: same two friends, same three tools, same docks, buttons, drags and trace model. Only the bank heights change, and with them which bridge shape works.

**Why it is a real next decision.** At level 1 Flat and Slope both cross a level gap. At level 2 the far bank sits one step lower than the chute's bank. A flat friend lies level at the high side and its far end hangs in the air over the stream, short of the low bank, so the seed rolls off its end and drops onto the cushion in the stream. A slope descending right reaches down to the low bank, so the seed rolls down onto it. The cup still matters: on the low bank the seed would roll past the catching dock and away without a scoop there. The learning goal stays the game's own (a shape's function depends on where it is used) and becomes visible: the same Flat that worked yesterday does not work here. Nothing becomes routing a ball through sockets; that stays Chain Reaction's.

**Arrangement and geometry.** Level 1's layout is unchanged. Level 2 raises the left bank and the starter chute by **50 units**. The bridge dock moves up to `y 275`, so its 180×110 box spans 220–330. The catching dock, the pot, the low bank, parks, tools and buttons keep their level-1 positions: receiver `y 300` (box 245–355), parks and tools `y 485` (boxes 430–540), buttons at `h − 118`. No box moves, shrinks or overlaps another, and the pet corner stays clear as at level 1. The raised chute's left end must clear the caption (its bottom is near `y 192`). If the portrait screenshot shows they touch, move the caption up; never shrink or move a target. A flat friend in the bridge dock is drawn level with the high bank, ending visibly above the low bank. A sloped friend is drawn tilted from the high bank down to the low one. Both reuse the existing silhouettes. The stream gets a second cushion under the flat bridge's end, drawn like level 1's.

**Outcomes, all from the finite trace.**

| Bridge dock | Catching dock | Result | Spoken |
| --- | --- | --- | --- |
| slope | scoop | caught; tap the pot to plant | `buddies.plant` |
| flatten | anything | falls off the flat end (`bridge`) | `buddies.stepFlat` |
| empty, plain or scoop | anything | falls into the gap (`bridge`) | `buddies.stepBridge` |
| slope | empty, plain, flatten or slope | rolls past (`receiver`) | `buddies.cup` (unchanged) |

Accepted constructions: friend A sloped at the bridge with B scooped at the catcher, or the identities exchanged (two in all). Accept the visible outcome; never compare to a stored answer. As at level 1, choosing, reshaping, parking and failed trials are exploration: **misses stay 0**. Hints keep the role rule: after two unsuccessful runs for the same role, or explicit Help, glow that role's friend, tool and dock. Each role counts at most one hint across the round. At level 2 the bridge role's useful tool is **Slope**. Replay, Undo, occupied-dock rejection, the run and carry lock, completion once through `ctx.finish({ misses, hints })` and one shell sticker are all unchanged.

**Rules in `logic.ts`.** Add a plan table keyed by level, for example `PLANS = { 1: { bridges: ['flatten', 'slope'], drop: 0 }, 2: { bridges: ['slope'], drop: 50 } }`. `trace(s, level)` reads `bridges`. A flat bridge at a level with `drop > 0` still returns the `bridge` failure; the scene picks `buddies.stepFlat` for it. `guidance(s, level)` suggests the first shape in `bridges`, so Slope at level 2, with the same friend choice (the dock's occupant, else a parked friend). `SeedRound` takes the level. `layout(w, h, level)` applies `drop` to the left bank, the chute and the bridge dock only. Level 1's behavior, voice and layout must be byte-for-byte what they are now.

**Ladder and IDs.** `LEVELS` becomes `prek: { min: 1, max: 2 }`, `school: { min: 1, max: 2 }`; no `order` is needed. Level 1 keeps its number and meaning, so saved levels and pins survive and nothing is renumbered. Both bands get level 2: pre-K is about 4–5, and the step is one visible change with spoken support. The usual two-smooth-rounds step-up applies. Misses are always 0 here, so a hint-free level 1 round counts as smooth. `describeLevel(1)` keeps “Reshape a bridge and cup; test and plant one seed”. `describeLevel(2)` is “A step down: only a slope bridge reaches the low bank; test and plant one seed”.

**Speech and how-to.** New lines in `src/content/voice-script.ts`:

- `buddies.start2` (the `ctx.instruct` line at level 2, repeated by the corner pet): “The far bank is lower. Make a slope and a cup for the seed. Choose a friend, change its shape, and drag it to a dock.”
- `buddies.stepFlat`: “The flat bridge stays up high. It doesn't reach the low bank. A slope goes down to it.”
- `buddies.stepBridge`: “The seed needs a slope down. Choose the friend at the gap, or a parked friend. Make it a slope and drag it to the bridge dock.”

The level-1 `buddies.bridge` line stays for level 1 only. The caption's text has no “flat” wording, so it needs no change. In `src/content/howto.ts`, split the second step into two `LevelLine`s. `{ from: 1, to: 1 }` keeps today's text. `{ from: 2, to: 2 }` says: “Drag one friend to the bridge dock and the other to the catching dock. The far bank is lower, so only a sloped bridge reaches it; a cup catches the seed.” The goal, finish and note hold at both levels. A co-play prompt for level 2: “Why didn't the flat one work this time?” Off screen: the soft toy slides down a cardboard ramp from a cushion to the floor and into a bowl.

**Ghost finger.** `autotouch()` already follows `guidance()`; passing the level makes it select a friend, tap Slope, drag to the raised bridge dock, then do the same for the cup, Try and the pot. No new intent type.

**Check tier: new levels on an existing interaction.**

- Typecheck.
- Shape Buddies rule tests: both accepted level-2 constructions catch. Flat at the bridge fails `bridge` at level 2 and still passes at level 1, where all four accepted constructions are unchanged. Every other row of the table above gives its failure. `guidance` at level 2 reaches `caught` from the initial state and from a level-1 solution (a flat bridge plus a cup). Hint de-duplication per role holds at level 2. Level 2 layout boxes do not overlap and stay at least 100 units.
- Registry and how-to tests: the ranges, `describeLevel(2)` and the level-scoped how-to lines.
- One browser play at level 2 in the `buddies` suite: a flat bridge fails and speaks `buddies.stepFlat`, a slope succeeds, then plant, finishing with misses 0 and one sticker. Add one portrait screenshot at level 2.
- `fingerdemo` with `FINGER_ONLY=shape-buddies` at level 2.
- Build only if shared files beyond the game, voice script and how-to change.

Device speech, iPad touch and a child's reaction stay human checks.

**Excluded:** two shapes combined (still a proposal), a third friend or tool, new bands, kept creations, save fields, controller or couch modes, cutting, and general physics.
