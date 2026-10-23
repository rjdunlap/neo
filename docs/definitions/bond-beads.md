# Bond Beads, levels 1–4 (definition)

Defined 2026-10-22 as slice 1 of the [chemistry study](../deep-dives/subjects/chemistry.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/chemistry.md#a-first-games-ladder-bond-beads) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#chemistry-recommendations). *Bond Beads* is a working name; levels 5–8 (named kits, double holds, reactions as rearrangement) are not defined here.

**Status: defined, build not ready.** The build waits on the developer's calls in the [Waiting row](../WAITING-ON-DEVELOPER.md) "Bond Beads: new game, land, levels 1–2 framing and shape review" ([decisions 1–3](#open-decisions)). Merging this definition does not authorize the build. Docs only: no game, ID, voice line, save field or band exists yet. Levels 1–4 name no substance, so no chemistry educator gates them; one is needed before level 5 ([decision 4](#open-decisions)).

**Fun action and purpose:** a tray of round beads, each with little hands. She drags from one bead to another to link a hand on each, taps a link to break it, and builds until every hand is held. At levels 3–4 she takes shapes apart and rebuilds them as different shapes, and a **before / now tally** of small bead pictures shows the same beads are still there. The learning purpose is **rearranging the same pieces makes something different and nothing is added or lost** (the study's anchors: NGSS 5-PS1-1, then MS-PS1-1/5 as the later horizon). Construction alone proves nothing, so the tally and the empty tray are the point, not the finished shape.

## Identity and overlap

- **Island Bridges** (grown-up) counts planks on a grid with one solution; Bond Beads has free placement and many accepted builds. **Mix & Make** (recipes) and **Machine Line** (programs) change substances or order; here nothing changes except which hands hold which.
- **Block Tower**, **Chain Reaction** and **Puzzle Pals** build things, but none has a conserved set of pieces to rearrange.
- **Matter's** Melt and Freeze and Stir and See own states and mixtures; Bond Beads claims only composition and rearrangement.
- Island Bridges' molecule seas stay a later grown-up skin ([study slice 5](../deep-dives/subjects/chemistry.md#build-slices-in-order)), not here.

## The model (`logic.ts`)

Beads are a toy *model*. Levels 1–4 name nothing and say nothing about real substances; the picture is a puzzle about hands.

- **Kinds (levels 1–4):** `H` (1 hand), `O` (2 hands), `C` (4 hands). No `N` yet. Each bead has a **letter and a distinct shape mark** (H a small circle, O a rounded square, C a diamond), so colour is never the only cue. Colours follow the usual ball-and-stick convention (white, red, dark grey) from `src/art/palette.ts`; they are bead colours, never the colour of a substance.
- **Link:** joins one free hand on each of two beads. **One link per pair** at levels 1–4 (no double holds; those are level 6). A bead cannot link to itself.
- **Piece:** a group of beads joined by links. A piece is **valid** when every hand in it is held and it has at least two beads. **A build** is the set of pieces on the table.
- **Canonical form:** a piece is reduced to a canonical string of its kinds and links, independent of where beads are drawn or which of a kind is which (`canon(piece)`; a brute-force relabelling is enough at 7 beads). A build's key is its sorted piece keys. Matching compares keys.
- **Tally:** the multiset of bead kinds, e.g. `{H:4, O:2}`. It never changes in a round: beads are neither created nor removed. `tally(before)` and `tally(now)` are equal by construction; the strip draws both so she can see it.
- **Not a real-substance list at these levels.** Shapes are matched to **authored requests only**. A valid build that is not the request gets a neutral line ("Every hand is held, but this isn't the one on the card"). No shape is named as a real molecule before level 5 and the reviewed list is not needed.

### Enumerated shapes (the build and its tests use these)

All pieces below were enumerated by brute force over single-link connected graphs whose degrees equal the bead hands; the build's test re-derives them. Letters are bead kinds; each count is `C·O·H`.

| Beads | Beads count | Valid shapes (single links, connected) |
| --- | --- | --- |
| O1 H2 | 3 | 1: H–O–H |
| O3 | 3 | 1: a loop of three O |
| O2 H2 | 4 | 1: H–O–O–H |
| O4 | 4 | 1: a loop of four O |
| O3 H2 | 5 | 1: H–O–O–O–H |
| C1 H4 | 5 | 1: a C with four H |
| C1 O2 H2 | 5 | 1: a loop of C, O, O, with an H on each of C's two other hands |
| C1 O2 H4 | 7 | **2:** H₃C–O–O–H and H–O–C(H₂)–O–H (C with two H, an O–H on each side) |
| C1 O3 H2 | 6 | **2** |
| C2 O4 | 6 | **2** (loops) |

The authored requests below use only these. Shapes that look like real substances (water, methane, hydrogen peroxide) are **not named** at levels 1–4; they are drawn with letters on the beads, and the voice says "shape".

## Levels

| Level | Name | Band (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Hold every hand** | school | Which hands to join | Three trays |
| 2 | **Copy the shape** | school | The arrangement on the card | Two cards |
| 3 | **Take it apart, build two** | school | What to break, what to rebuild | Two puzzles |
| 4 | **The same beads, two ways** | school | Rearrangement, not addition | Two sets |

**Bands:** `school` only, levels 1–4 ([decision 2](#open-decisions); the study keeps lap through pre-K with Matter, since atoms come at about age 11–14). A child below school does not see the game; `playBand` still maps a younger player's launch to the school band's lowest level if a grown-up opens it (nothing gates). The `school` band's ladder range is `{ min: 1, max: 4 }`. Levels 5–8 add the `school` top later.

### Trays and requests (authored pools; each level's first round is authored)

- **Level 1 trays** (no card, any valid build ends the round): `O1 H2` (3 beads, the authored first), `O3`, `O2 H2`, `O4`. Each tray has exactly one valid shape, so level 1 teaches the gestures and "every hand held, all in one piece"; it is honest that there is nothing to decide beyond which hands to link. A round is three distinct trays.
- **Level 2 cards** (a pictured shape with the same tray loose beside it): `O2 H2` chain (4 beads, authored first), `C1 H4` (5), `O3 H2` chain (5), `C1 O2 H2` (5). A round is two distinct cards. She builds, then taps **Check**; a match ends the card.
- **Level 3 puzzles** (two built shapes on the table, a card pictures two different shapes, and the tray must empty): the four enumerated rearrangements of the same beads, in both directions of each pair.
  - `H–H` and `H–O–O–H` → two `H–O–H` (6 beads); and the reverse.
  - `H–H` and `H–O–O–O–H` → `H–O–H` and `H–O–O–H` (7 beads, the cap); and the reverse.
  The authored first is the first, forward. A round is two puzzles, the second from the other pair. Both targets are separate valid pieces; the build must be exactly the two requested keys, using every bead.
- **Level 4 sets** (loose beads with two cards; she builds one, then rearranges into the other): `C1 O2 H4` (7 beads, authored first) with its two shapes, and `C1 O3 H2` (6 beads) with its two shapes. A round is the two sets, the second the other. Either order of the two shapes is accepted; the tally strip shows `before` (the loose beads) and `now`.

## Screen and controls

- **Beads** are at least **100 logical units** across including the hand nubs' padding, laid out by `beadLayout(view, n)` for up to **7** beads. The layout is audited in landscape and portrait, in the four views the lands test uses, with the bottom-left pet clear and the home button and corner buttons clear. If seven do not fit at 100 units in portrait, the build **cuts level 3's 7-bead puzzle and level 4's `C1 O2 H4` set** rather than shrinking a bead, and records it.
- **Hands** are drawn as nubs around each bead: a free hand is an open ring, a held hand a filled dot joined by the link. Touch-down on a bead lifts and brightens it at once and speaks nothing.
- **Link:** drag from a bead to another bead (via `src/engine/drag.ts`'s lift, a line follows the finger); releasing on a bead with a free hand links, with a soft pentatonic click (`src/audio/notes.ts`). Releasing on empty table or a bead with no free hand slides back with no count. The nearest bead with a free hand within reach wins (AGENTS' close-target rule). **Tap-tap alternative:** tapping one bead and then another also links, so a dragging slip never stalls.
- **Break:** tap a link (the link has a 100-unit hit area around its midpoint); it pops and both hands reopen. Free, always.
- **Tidy:** drag a bead without releasing on another to move it; pieces move as groups when a held bead is dragged by its body. Never counts.
- **Buttons** (each at least 100 units, clear of the guide): **Undo** (one step, repeatable), **Start again** (restores the round's opening beads and links), and **Check** (levels 2–4; level 1 ends by itself when the build is valid).
- **Tally strip** at the top: *before* and *now* as rows of small bead pictures per kind; from the school band's reading level, numerals beside them. At level 1 the strip shows only *now*.
- **Request card:** at levels 2–4 a card near the top pictures the target shape(s) with letters on beads. It is at least 140 units tall and never covers a bead.
- **Pause sheet:** Start again and Show a hint (`Scene.pauseActions`).
- **Music:** Tinker Lab's loop keeps playing; she is not making music.

## Accounting, help and finishing

- **Never a miss:** linking, breaking, undo, tidying, Start again, touching a bead, and building any valid shape at level 1.
- **Level 1** has no misses and no hints; the round ends when every hand is held and everything is one piece.
- **A miss (levels 2–4)** is a **Check** that does not match the card (not the right key, a free hand left, or a bead left over), counted once per Check, and only when the build changed since the last Check (a repeated identical Check is ignored). A leftover bead or free hand is **shown with a gentle pulse, not scolded**.
- **Hints:** after a miss the pet says one fact ("This bead has a hand free."), at most one fact per miss, in the order *a free hand*, then *a bead left over*, then *a link that is not on the card*. After two misses on a card the bead or link to change glows, and `hints++` once per card. Show a hint does the same, still once per card. Every hint points to a bead or link that some accepted solution changes; a test checks this.
- **Supported finish:** a third miss after the glow plays the remaining links and breaks as a ghost, with no further count, so every round can finish. Assisted completion is not mastery evidence.
- **Finish:** `ctx.finish({ misses, hints })`; one ordinary sticker, with or without help. The result card for levels 3–4 keeps the *before* and *now* strips for a moment, then fades. Nothing is kept or filed ([decision 5](#open-decisions)).
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A smooth level 3–4 round shows she rearranged the same beads into asked shapes in this toy, nothing about real chemistry.

## Speech (`voice-script.ts`)

Lines under `bondbeads.*`, none of which says "atom", "molecule" or any substance name: `intro`, `instruct.hold` ("Hold every hand!"), `instruct.copy` ("Make this shape!"), `instruct.rebuild` ("Take it apart and build these two!"), `instruct.twoways` ("Make this shape. Then make the other one with the same beads!"), `link`, `free` ("This bead has a hand free."), `left` ("A bead is left over."), `notcard` ("Every hand is held, but this isn't the one on the card."), `hint`, `done`, `same` ("The same beads. Nothing added, nothing lost."). The how-to and the voice both use "beads", "hands", "shape" and "the same beads". A test asserts none of the forbidden words appears in the game's lines.

## Rule tests (`logic.test.ts`)

- **Shapes:** `enumerate(beads)` over every authored tray equals the table above (count and keys); each authored request key is in its tray's enumeration.
- **Solvable with every bead:** every level-1 tray, level-2 card, level-3 puzzle and level-4 set has a build whose tally equals the tray's and whose pieces are all valid.
- **Canonical matching:** permuting bead identities and positions never changes a key; two different shapes never share a key (all pairs in the table).
- **Conservation:** `tally(before)` equals `tally(now)` after any sequence of link, break, undo and start-again over 500 seeded random action sequences.
- **Alternatives:** at level 4 both orders of the two shapes are accepted; at level 3 both direction pairs are accepted by their own card only.
- **Check accounting:** a scripted level-2 card (wrong build, the same wrong build again, a changed wrong build, Show a hint twice, a third wrong Check) counts two misses, one hint and ends with the supported finish; a repeated identical Check adds nothing.
- **Hints:** `hintFor(state)` always names a bead or link that some accepted solution changes, in every reachable state of the authored requests.
- **Layout:** `beadLayout` at the four views for 3 to 7 beads: every bead at least 100 units, no overlap, buttons, card, tally and the pet corner clear, everything inside `view`; 7 beads in portrait is a named case (see Screen and controls).
- **Registry, lands and how-to tests** pass with the new game, including its home land on one screen at the `school` band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows the solver: it drags bead to bead for the links the next accepted solution needs and taps the links to break at level 3 (before the rebuild), then taps **Check**. At level 4 it builds the first requested shape, then breaks and rebuilds the second. A bot-played level 3–4 must finish within the demonstration window or use the first puzzle only.
- **How-to card** (`src/content/howto.ts`). Goal: "Link beads together hand to hand, and see that the same beads can make different shapes."
  - Steps: "Drag from one bead to another to link them, and tap a link to break it" (all levels); "Link until every hand is held and all the beads are one piece" `{ from: 1, to: 1 }`; "Build the shape on the card, then tap Check" `{ from: 2, to: 2 }`; "Take the shapes apart and build the two on the card; every bead must be used" `{ from: 3, to: 3 }`; "Build one of the two shapes, then rearrange the same beads into the other" `{ from: 4, to: 4 }`.
  - Finish: "Every hand is held and no bead is left over."
  - Notes: "Linking, breaking and undo never count as mistakes" (all levels); "A Check that is not the card is one miss and the pet names a bead to look at; after two the beads glow, which counts as a hint" `{ from: 2, to: 4 }`; "This is a puzzle about beads and hands, not a model of real substances" (all levels).
- **Registration:** ID `bond-beads`, name "Bond Beads" (placeholder), spoken title `game.bond-beads`. Region (subject) `tinker-lab`, the science subject. Skills `['composition', 'conservation', 'rearrangement', 'spatial']` ([decision 6](#open-decisions) if a more careful tag wants review). Bands as above. Home land **Tinker Lab** by default ([decision 3](#open-decisions)). Hub icon: three linked beads. Sticker (page `meadow`): a seeded small bead shape.
- **Art (code-drawn, `src/games/bond-beads/art.ts`, colours from `src/art/palette.ts`):** bead (a ball with a highlight and a shape mark), hand nub (open ring and filled dot), link (a short rounded bar), request card, tally mini-bead. Reuse a rounded button from `src/ui/` and the pet corner clearance from `src/art/`; shared drawings stay in their files.
- **Co-play:** *What's the same?* The grown-up and child look at a built shape, break it, build another and say what stayed the same. **Off-screen** (spoken tip): "Take a set of snap-together blocks, build something, take it apart and build something different. Count the blocks each time." No kitchen or model-kit card (that waits for the reviewer).
- **Couch:** none.
- **Rework couplings:** none required and nothing saved; the made shapes could later become collectibles, which the [rework brief](../rework/README.md) decides.

## Check tier

Bond Beads 1–4 is the new-game tier, in two build sessions (the study's slices 2 and 3: levels 1–2, then 3–4): typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at the first and last level, with one wrong Check and one hint; one portrait screenshot at level 4's seven-bead set; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a school-age child reads the nubs as hands and understands the tally; whether seven 100-unit beads and the two cards are comfortable on a real iPad in portrait; how the device speech says the lines. Browser automation establishes none of these.

## What comes next

**Levels 5–8** (named kit, double holds, reaction as rearrangement, a larger rearrangement) are defined after a chemistry educator reads the molecule list and the model-limits line ([study slice 4](../deep-dives/subjects/chemistry.md#build-slices-in-order)). Island Bridges molecule seas follow the same review.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** all six leans are adopted: a new game, `school` 1–4 only, home Tinker Lab if the layout test passes (else Treehouse), nothing filed in the journal, and levels 1–2 stay as the gesture-and-tally puzzle that claims no chemistry. No chemistry educator gates levels 5–8: the building session checks the molecule list, model-limits line and any picture against cited sources and records it in VERIFICATION; the O-chain shapes stay as puzzle shapes, never named substances.

Decisions 1 and 3 block the build; the rest have defaults the build uses.

1. **A new game** (blocks). Lean: yes, since rearrangement under a tally is an action no game owns and the study checked the overlap.
2. **Bands.** Default `school` 1–4 only; younger children stay with Matter's play and see nothing. (Alternative: also grown-up at levels 3–4 for parents co-playing; not needed.)
3. **Home land** (blocks). Default **Tinker Lab** (12 games today; Gear Garden's definition also lists Tinker Lab, so two builds would make 14 and the layout test decides). Fallback **Treehouse** (7), not Puzzle Peaks (13 already). The subject `region` is `tinker-lab` either way.
4. **Reviewer.** A chemistry educator reads the molecule list, the model-limits line and any reaction picture before level 5; levels 1–4 name nothing and need no review. Please confirm that is the plan.
5. **Journal.** Default: nothing filed. Alternative: a page of shapes she has built, after the rework decides how made things relate to collecting.
6. **Levels 1–2 framing.** Levels 1–2 are a puzzle that claims no chemistry; confirm they earn their place on a `school` ladder (the study asks this). Lean yes: they teach the gestures and the tally before level 3.
