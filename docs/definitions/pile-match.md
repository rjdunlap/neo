# Pile Match, levels 1–8 (definition)

**Built 2026-10-20 ([PR #680](https://github.com/rjdunlap/neo/pull/680)), levels 1–8, on every default in [Open decisions](#open-decisions); [build note](../archive/COMPLETED-2026-10-09.md#pile-match-levels-18-2026-10-20).** Deviations: Counting Cove lists 11 games, not 12; the portrait usable width of 578 was wrong (views are at least 1024×768), so the heap always draws at scale 1; level 1's shape is seeded from six flat shapes rather than authored once.

Defined 2026-10-17 for [chunk 26](../ROADMAP.md#chunks) (gaps against popular mobile games), from the [IDEAS candidate](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** a windy-day heap of island things lies on the grass. She taps a thing on top of the heap, and it hops into a little tray. Three of the same kind in the tray pop together into the host's basket with a chime, until the grass is clear. The learning goal is **visual search and making sets of three**: find the matching pictures among distractors, see which things lie on top (an occluded thing cannot be picked up yet), and count one, two, three into a set. From level 4 the tray is small enough that taking things without a plan fills it, so older levels add **keeping a limited space in mind**. She never fails: a full tray only refuses the next thing, and tapping a piece in the tray puts it back on the heap.

This is not Tile Pairs (grown-up, pairs, mahjong's open-side rule), not Memory Match (the cards are hidden; here everything is visible) and not Photo Safari (one requested animal by name, action and place). Only Pile Match asks her to gather sets of three from a layered heap.

## References

| Reference | What it shows | What Pile Match takes or rejects |
| --- | --- | --- |
| [Triple Tile](https://apps.apple.com/us/app/triple-tile-match-puzzle-game/id1572661625) (Tripledot) and seven-slot clones such as [Triple Match](https://apps.apple.com/app/id1562639504) and [Tile Match – Triple Grove](https://apps.apple.com/app/id6796715811) (store listings, weighted lightly) | Tap a free tile into a tray of about seven slots; three of a kind clear; a full tray with no triple ends the level. Tiles lie in overlapping layers | Takes the layered heap, the tray that groups by kind and the triple pop. Rejects the losing full tray, boosters, lives, timers, stars and ads. The tray is at most 5 slots so it fits portrait at 100+ units |
| [Match 3D](https://apps.apple.com/app/1502447854) and [Match Master 3D](https://apps.apple.com/app/id1535029033) (store listings, weighted lightly) | A 3D physics pile of objects; Match Master's storage boxes overfill and the level fails | Rejects the physics pile (no engine; occlusion has to be readable and testable) and the overfill failure. Keeps the "real things in a heap" look in 2D layers |
| Blaser et al., [toddler visual search, VSS 2012](https://psych.umb.edu/kaldy/ICL/Conference_presentations_files/VSS_2012_Blaser_et_al.pdf) (14–31 months, eye tracking) | Finding a target that differs in one feature does not slow with more distractors; a target that differs only in a conjunction slows linearly with distractor count | Each kind differs from every other in **both** silhouette and color, so search stays a single-feature pop-out. The distractor count grows slowly: 6 pieces, then 9, 12, 15, 18, 24, and kinds from 2 to 8 |
| Vales and Smith (2015), [*Words, shape, visual search and visual working memory in 3-year-old children*](https://cogdev.sitehost.iu.edu/labwork/ValesSmith2015.pdf) (*Developmental Science*) | Hearing the target's name before search sped 3-year-olds' search | Levels 1–2 name the kind aloud ("Find three shells"), and every refusal names what she touched. Spoken names come from the voice script |
| [*Efficiency and accuracy of visual search develop at different rates from early childhood through early adulthood*](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7300101/) (2020, touchscreen, ages 4–25) | Accuracy matures early; search speed keeps improving into adolescence | No clock, ever. Help depends on misses and put-backs, never on how long she looks |
| [Tile Pairs](../GAMES.md#tile-pairs) (this repository) | Layered tiles assigned along a geometric clearing route, so every board clears; an exhaustive memoized solver for a hint | Copies the route assignment and the solver shape over a piece mask, with triples instead of pairs and a top-only freedom rule |

## The model

- **Pieces and layers.** A board is a frozen **shape** (a list of `{ x, y, z }` cells) and a kind for each piece. Layer `z` cells sit on a 120-unit grid; layer `z + 1` cells are offset by half a pitch (60, 60), so an upper piece covers a corner of up to four lower ones. Pieces have radius 56.
- **Free** means no present piece on a higher layer overlaps it (center distance under 112). There is no side rule. Freedom is **monotone**: removing pieces only ever frees others. Two free pieces never overlap, so a free piece is always drawn whole.
- **Kinds** are pictures: shell, acorn, apple, star, leaf, toy duck, flower and mushroom, each with its own silhouette and its own `palette.ts` color (decision 1). A round picks its kinds with `ctx.rng`. Every kind has exactly three pieces, so any three of a kind are always one of the route's triples.
- **The tray** has capacity `t` (3 or 5). Tapping a free piece moves it into the tray, next to others of its kind. It is accepted when the tray has room **or** when it makes three of its kind; three of a kind pop at once. A full tray refuses anything else, so it never overflows.
- **Put back.** Tapping a piece in the tray returns it to its own place in the heap. Nothing was ever added above that place, so the heap's state is just the set of present pieces: a 24-bit `mask` (the cap is 24 pieces, like Tile Pairs). The tray is derived from it: for each kind, the tray holds `removed(kind) mod 3`.
- **Assignment** follows Tile Pairs' `assign`: a seeded geometric clearing route (each piece free once those before it are gone) gets kinds in **consecutive triples**. Taking the heap in that order never holds more than two pieces in the tray, so every board clears with `t = 3`.
- **Asked mode (levels 1–2):** the tray is a basket showing one kind's picture, and only that kind is accepted. The asked kinds follow the route's triple order, so the asked kind always has a free piece.

`logic.ts` holds plain functions: `free(shape, mask, i)`, `freePieces`, `tray(board, mask)` (kind counts), `take(board, mask, i, t)` (returns the new mask or a refusal reason: `covered`, `full`, `wrong-kind`), `putBack(mask, i)`, `cleared(mask)`, `clearable(board, mask, t)` (memoized depth-first search over masks without put-back, with a dead set, as Tile Pairs' `solve`), `hintFor(board, mask, t)`, `assign(shape, kinds, rng)`, `planFor(level)` and `pileLayout(shape, t, view)`.

## Screen and controls

- **Layout** `pileLayout(shape, t, view)`, tested at the four standard views. The tray is one row at the bottom right, from `x = 150` (clear of the pet's corner) to `view.w − 40`: 5 slots of 104 with 8-unit gaps take 552 units. Portrait's usable width is 768 − 190 = 578, so 5 slots fit in every view; this is why `t` never exceeds 5. Tray slots are 104 × 120 hit areas. The heap sits above the tray, below a 120-unit header and between the home and book buttons. The largest shape is 5 columns by 3 rows on the bottom layer, 600 × 360 units; in landscape (768 tall) the header, heap, 60-unit gap and 120-unit tray take 660. If a view is too small, the heap scales down only while a piece stays at least 100 units across; the test asserts no shape needs to go below that.
- **Hit areas.** A free piece's hit area is a circle of radius 60 (120 across). The test asserts that free pieces' hit areas never overlap (free pieces are always at least 120 apart: same-layer pitch 120, and a lower piece close enough to be nearer is covered), so a touch resolves to the one free piece it is inside. This is why the usual nearest-target rule is not needed here. A touch outside every free piece but on a covered piece is a covered touch (below).
- **Touch-down feedback.** Pressing a free piece lifts it at once with a soft pop; releasing on it sends it along a short arc into the tray with a pentatonic note for that kind (`src/audio/notes.ts`), rising one step for the second and third of a kind. Drags are not needed: everything is a tap via `onTap`. Taps during the 0.3 s flight are ignored, as in Jar Sort, so a double tap never takes the piece that was underneath or earns a full-tray miss she did not choose. Cancelling or leaving the screen takes nothing.
- **Covered pieces** are drawn slightly dimmed and shadowed by what lies on them. Touching one wiggles it and the piece on top, and the pet says "Something is on top of it." Never a miss, at any level: it is exploration of what lies on top.
- **The tray** sorts by kind as pieces land. At three, the trio bounces, chimes and flies to the host's basket, and the slots close up. A full tray with no triple coming glows its edge softly.
- **Put back** is free and unlimited. There is no other undo. **Start again** is in the pause sheet.
- **Speech:** `ctx.instruct` gives the instruction, which the corner pet repeats. Navigation never needs reading.
- **Feel:** a calm existing music style, not `silenced`. Pieces, heap, tray and basket are drawn with Pixi `Graphics`. Nothing is saved but the round result.

## Levels

| ID | Name (`describeLevel`) | Pieces · kinds · layers | Tray `t` | Mode |
| --- | --- | --- | --- | --- |
| 1 | Find three, flat | 6 · 2 · 1 | 3 (basket) | asked |
| 2 | Find three in a little pile | 9 · 3 · 2 | 3 (basket) | asked |
| 3 | Any three you like | 6 · 2 · 1 | 5 | free tray, cannot fill |
| 4 | A little heap, a little tray | 9 · 3 · 2 | 5 | free tray |
| 5 | Four kinds | 12 · 4 · 2 | 5 | free tray |
| 6 | Five kinds, three layers | 15 · 5 · 3 | 5 | free tray |
| 7 | Six kinds | 18 · 6 · 3 | 5 | free tray |
| 8 | The big heap | 24 · 8 · 3 (15 + 8 + 1) | 5 | free tray |

At level 3 two kinds can put at most 2 + 2 = 4 in the tray without a triple, so a 5-slot tray never fills: free choice with nothing to plan. From level 4, three kinds can fill it (2 + 2 + 1), so the tray's limit starts to matter. Each level has at least six frozen shapes; a round is one heap.

**Bands (`BandLevels`):** `preschool: { min: 1, max: 4 }`, `prek: { min: 3, max: 6 }`, `school: { min: 5, max: 8 }`. No `order`; no lap, toddler or grown-up band (toddler is [decision 2](#open-decisions)).

### First rounds

- **Level 1 (authored, always first):** six pieces in a loose flat row of two lines: three apples and three shells, mixed. "Find three apples." The basket shows an apple. Each apple hops in, counted "one, two, three!", and the basket pops. "Now find three shells." Done.
- **Level 2:** six on the bottom, three on top, three kinds; asked in route order, so the first asked kind is on top.
- **Level 3:** "Put three the same together." Any free piece is accepted; six pieces, two kinds, flat.
- **Level 4:** the first heap with a tray that can fill: nine pieces, three kinds, two layers.
- **Levels 5–8:** seeded frozen shapes; at 6–8 the board finishes with the pet counting the baskets by threes ("three, six, nine … eighteen things tidied!"). That count is heard, not asked, and the game claims no multiplication skill.

## Accounting, help and finishing

- **Never a miss:** any accepted tap; put-back; touching a covered piece; Start again; repeating the instruction.
- **Wrong kind (levels 1–2):** the piece hops up and back with a gentle boing, and the pet names both: "That's a shell. Find the apples." One miss. This is the matching the level is about.
- **Full tray (levels 4–8):** a tap that the full tray refuses gets a boing, the tray glows, and the pet says "The tray is full. Tap one in the tray to put it back." One miss for the first refusal while the tray stays full; further refusals before something leaves the tray are free. At level 3 it cannot happen.
- **Two-miss glow:** at the second miss, and every second miss after, the hint target glows until she taps something. Each glow counts `hints++` once.
- **Wander hint (levels 4–8):** after three put-backs since the board began or the last hint, the hint target glows and `hints++`. Couch play never offers it.
- **The hint target** (`hintFor`) always keeps the state clearable. In order: a free piece that makes three of a kind and leaves a `clearable` state; else, if the tray has room, a free piece whose kind is already in the tray and leaves a `clearable` state; else any free piece that leaves a `clearable` state (fewest kinds in the tray first). `clearable` is the memoized search capped at 200,000 masks. If no candidate is proven (none exists, or the cap is reached), the hint switches to the **route fallback**: put back a tray piece (a lone kind first) until the tray is empty, then take pieces in the board's clearing-route order, which is provably clearable. Once on the fallback, hints stay on it until the heap is clear or she makes a different move. In asked mode it is a free piece of the asked kind.
- **No dead ends:** every pop is one of the route's triples, so after putting back the whole tray the present pieces, taken in route order, are each free when reached (monotone freedom) and arrive in consecutive triples, never holding more than two in the tray. So that state clears with `t = 3`, the hint never runs out, and there is no "stuck" state.
- **Finish:** when the heap is clear, the host carries the basket off and the pet thanks her. `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed.
- **Adaptation** uses the unchanged shell rule. Level 3 produces no misses or hints, so two rounds there step up, as intended for a free level. Levels 1–2's wrong-kind misses are real matching evidence; assisted rounds are not mastery.

## Rule tests (`logic.test.ts`)

- `free`: a piece with any overlapping present piece on a higher layer is not free; removing pieces never makes a free piece covered (monotone, checked over random masks of every shape).
- `take`: covered and wrong-kind (asked mode) refusals; a full tray refuses unless the piece makes a triple; three of a kind always pop; the tray never holds more than `t`; `tray` equals `removed mod 3` per kind; `putBack` then `take` restores the mask.
- **Frozen shapes:** every shape has at most 24 pieces, a count that matches its plan, all layers on the stated grid and offset, and a geometric clearing route. Every assigned board has exactly three of each kind and clears with `t = 3` along its route.
- **Seeded presentation:** the same seed gives the same board; kind choice never puts two kinds with the same silhouette or color on one board.
- **Level 3 cannot fill:** exhaustive over its boards, no reachable state refuses a tap for a full tray. **Level 4+ can:** each plan has a board with a reachable full tray (so the rule is real).
- **Asked mode:** at every step of levels 1–2 the asked kind has a free piece.
- `hintFor`: from many states reachable on each plan's boards (random play including put-backs), the target is legal, every non-fallback hint leaves a `clearable` state, and following hints alone clears the heap within `pieces + t` taps of a fresh hint (no loop); a full tray with no triple available always yields a put-back target. Putting back the whole tray always gives a state that clears with `t = 3` along the route. With the search forced to its cap, the route fallback alone clears every board. The level-8 worst case is timed on Node and recorded (target under 100 ms); exceeding the cap returns the fallback, never nothing.
- **Layout:** `pileLayout` at the four views for every shape and `t`: pieces at least 100 across, free hit areas never overlapping, tray slots 104 × 120, nothing in the pet's corner, everything inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including Counting Cove at 12 games fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true` and `autotouch()` tap `hintFor`'s target each step: free pieces, and a tray piece when it is a put-back. It never demonstrates a refused tap. The bot also stands in for the scripted play's solve.
- **How-to card** (`src/content/howto.ts`). Goal: "Gather the heap into sets of three the same." Steps: "Tap the kind the pet names; three go in the basket" `{ from: 1, to: 2 }`; "Tap anything on top of the heap; it goes into the tray" `{ from: 3, to: 8 }`; "Three the same in the tray pop away" `{ from: 3, to: 8 }`; "Things underneath wait until what is on top is gone" `{ from: 2, to: 2 }` and `{ from: 4, to: 8 }`; "When the tray is full, tap a thing in the tray to put it back" `{ from: 4, to: 8 }`. Finish: "The grass is clear." Note: "Touching something underneath and putting things back are never counted." Plus `{ from: 1, to: 2 }`: "Tapping a different kind is counted for her level," and `{ from: 4, to: 8 }`: "A tap the full tray turns away is counted for her level, once until something leaves the tray."
- **Voice lines** under `pile.*`: `intro`, `instruct-free`, `find.<kind>` and `this-is.<kind>` (one per kind, so device speech never fills a template; a wrong kind plays `this-is.<touched>` then `find.<asked>`), `covered`, `full`, `pop` (a few variants), `hint`, `count-threes.<n>` for 9, 12, 15, 18 and 24 (levels 6–8), `done`. `{pet}` is optional.
- **Registration:** ID `pile-match`, name "Pile Match", spoken title `game.pile-match`, region (subject) `counting-cove`, home land **Counting Cove** (11 games today, 12 with this one; Puzzle Peaks and Tinker Lab already pass at 13). Skills `['matching', 'visual-search', 'counting', 'planning']` (skills are free strings; `visual-search` is new). Hub icon: a little heap with three matching shells on top. The sticker is a seeded basket of three.
- **Co-play:** one person names a kind, the other finds three. **Off-screen:** tip a box of mixed toys onto the floor and gather them back in threes, saying "one, two, three" for each set.
- **Couch:** none in the first build. A later candidate uses `src/couch/focus.ts` to move over free pieces (its route finder suits the bot) with a confirm to take and a shoulder button for the tray.
- **Rework couplings:** none required. A cleared heap is a natural tidy-up errand for the [welcome adventure](../rework/README.md#learning-belongs-in-the-story) or a creature's home, and the kinds could later be collection items, but nothing is saved or unlocked by this slice. Any such use is the rework's to define.

## Check tier

New-game tier. Run typecheck and unit tests (all the rule properties above, plus registry, lands and how-to). Then one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to levels 1 and 8, with one wrong-kind tap at level 1 and one full-tray refusal plus one hint at level 8. Take one portrait screenshot at level 8 (the tightest view), run `fingerdemo` at level 8, and run `npm run build`, because the registry, lands, voice and how-to files change. Device checks stay open: whether a three-year-old reads dimmed pieces as underneath, piece legibility at 24 pieces on an iPad, and whether put-back is discovered without the hint.

## Open decisions

Each has a default that the build uses. None blocks it.

**Decided 2026-10-23 (on the developer's delegation):** the defaults the build used stand (a windy-day heap into the host's basket; no toddler band; 3 slots at 1–2, then 5; one miss per full-tray episode from 4; Counting Cove; couch play later).

1. **Theme and kinds.** Default: a windy-day heap of island things (shell, acorn, apple, star, leaf, toy duck, flower, mushroom) gathered into the host's basket. Alternatives: a toy-box tidy-up, or later the rework's collectible items.
2. **Toddler entry.** Default: no toddler band; preschool starts at level 1. Alternative: `toddler: { min: 1, max: 1 }` once a person has watched a 2-year-old play the flat asked level.
3. **Tray size.** Default: 3 (the basket) at 1–2, then 5, the most that fits portrait at 104 units a slot. The genre's 7-slot tray would need landscape-only play or a two-row tray; neither is proposed.
4. **Full-tray accounting.** Default: one miss per full-tray episode from level 4. Alternative: never a miss, with help only from the put-back wander hint.
5. **Home land.** Default: Counting Cove (12 games). Alternatives: Treehouse (4 games, as a tidy-up) or Barnyard (6).
6. **Couch play** later, as above. It is not part of this build.
