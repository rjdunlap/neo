# Little Loom levels 1–3 (VA1)

Defined 2026-10-25 from the [visual-art study](../deep-dives/subjects/visual-art.md#a-first-games-ladder-little-loom), [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#visual-art-recommendations) and its adopted 2026-10-23 decisions. Worker `01a172be-55d8-7bd1-8b37-28f2695f581d`, branch `codex/little-loom-va1-definition`, [PR #965](https://github.com/rjdunlap/neo/pull/965). **Docs only; no game, asset, registration or save is delivered.** VA2 is a separately admitted build; review, actual placement/layout and person/device evidence remain below.

Fun action: send a shuttle across a wooden loom and see the beater pack each new ribbon into a scarf for the companion. Learning purpose: see individual threads interlace, freely choose stripe colors, then alternate two lifts to make successive rows. This is an island toy model, not evidence of real textile strength or a developmental threshold. Pattern Train owns copying/continuing a color sequence; level 2 never asks for one.

## Slice and entry windows

Proposed stable ID `little-loom`, art subject `treehouse`, land Painted Canyon (stable land ID `treehouse`, formerly Paint Pier). VA2 ranges: toddler 1–2, preschool 2–3, prek 3–3; default at range minimum. School 4–7 belongs to later definitions/builds and must not be advertised by a three-level module. Lap 1 stays absent until a person/device check shows a lap child manages it; the October23 decision did not open that gate. Add no grownup range. No renumbering later.

| Level / description for grown-ups | Whole round | Child's choice | Finish |
| --- | --- | --- | --- |
| 1 Zoom the shuttle — send eight rows across an automatically alternating loom | Six warp threads, eight rows, one weft yarn; any eligible play-surface tap throws once | Cause and effect; no correct answer to choose | Eighth accepted row is beaten in; scarf cut off automatically |
| 2 Pick the yarn — freely choose the color of each of eight rows | Same automatic lifts; three endlessly reusable marked yarn pots and a separate shuttle | Any yarn at any row; repeated or changing colors are equally valid | Same eight-row finish; no color target |
| 3 Two pedals — alternate two thread lifts before sending each row | Same cloth; two pedals, fixed weft, separate shuttle | First pedal either; each next row needs the other lift | Eight held rows, with retries/support always available |

The shell owns instruction replay, how-to, adaptation, round record, sticker, result and optional Keep. Use `ctx.companion()`; the completed scarf rests beside the companion, with no rig/wardrobe dependency. One sticker even with help. No timer, scarce yarn, lost rows while away or required return. Co-play: take turns choosing a yarn or pressing a pedal and sending the shuttle; no simultaneous hold required. Off-screen suggestion here is only “Find a stripe on your clothes together.” Paper Weaving instructions, craft materials, Gallery Walk, Loom Logic, levels 4–7, unlocks and wearable/home-project hooks are excluded.

## Drawdown and the island's holding rule

Use inspectable pure rules in the eventual `logic.ts`. VA2 uses exactly `cols=6`, `rows=8`; the study's 8×8 maximum is a future bound, not extra VA2 content. Index columns left to right `c=0..5`, rows in making order `r=0..7`. Display row 0 at the finished cloth's top, growing downward; shuttle direction alternates left/right without reversing column indices. `lift[r][c]=true` means warp on top, independent of shuttle direction. Visible cell is `lift[r][c] ? warp[c] : weft[r]`. Different-colored yarns can reveal structure; equal colors may look the same without changing validity.

A candidate lift is an exact six-boolean vector. Reject malformed input before rendering; it is not a child mistake. For a well-formed row, evaluate in this order:

1. At least one true and at least one false (otherwise `all-together`).
2. Not exactly the preceding **committed** lift (otherwise `repeat`). No preceding row means this check passes.
3. In every horizontal row and every vertical column of committed lifts plus the candidate, neither true nor false may form a consecutive run longer than three (`long-float`). Exactly three is allowed. Count structure booleans, never visible colors. Do not wrap at edges; do not join the end of one row to the next. An incomplete column uses only its existing rows. No diagonal check.

These are explicitly **the island's rules**, not a general physical theorem about looms. The study's same-shed explanation is recalled, not opened; child wording says the island's toy row slipped, and does not claim a real repeated shed must always fail. Preserve the building-session source review before implementation.

Two pedals: A lifts displayed threads 1,3,5 (`101010`), B lifts 2,4,6 (`010101`). A/B are mutually exclusive latched selections, not hold gestures. Both are valid for row 0. Auto modes choose A then B repeatedly; level 3 accepts either phase. Their alternating plans cannot trigger a float failure. No individual thread control, lift cards, arbitrary lifts or float puzzle is exposed at 1–3.

### Finite acceptance fixtures for later rule tests

`1` means lifted. W and F below denote visibly distinguishable warp/weft yarn IDs; expected visible rows follow the same left-to-right indices even on a right-to-left shuttle pass.

| Case | Committed history / candidate | Expected |
| --- | --- | --- |
| First A or first B | empty / `101010` or `010101` | accept either |
| Other pedal | `101010` / `010101` | accept; no miss |
| Same pedal | `101010` / `101010` | reject `repeat`; history stays length 1 |
| Whole shed together | empty / `000000` or `111111` | reject `all-together` |
| Horizontal boundary | empty / `111000` | accept (runs of three) |
| Horizontal overflow | empty / `111100` | reject `long-float` (four true) |
| False overflow | empty / `100000` | reject `long-float` (five false) |
| Vertical boundary | `101010`, `100101` / `101001` | accept; first column has three true |
| Vertical overflow | previous three rows above / `100110` | reject `long-float`; first column would have four true, although candidate differs and its horizontal runs pass |
| Drawdown A | warp `[W,W,W,W,W,W]`, weft F / `101010` | `[W,F,W,F,W,F]` |
| Drawdown B | same yarns / `010101` | `[F,W,F,W,F,W]`, regardless of shuttle direction |
| Equal yarns | warp and weft W / either valid pedal | six W cells, still a valid structure |
| Full scarf | eight rows of A/B or B/A alternating | eight commits, 48 visible cells, exactly one finish |

Exhaust all 64 row masks for first-row horizontal/mixed validity, all four A/B adjacent pairs, and all 256 eight-pedal plans (exactly two finish without rejection). Check every rejection leaves history/yarn/direction unchanged; following the other pedal after rejection succeeds. For levels 1–2 every eight-yarn schedule is valid (3^8 at level 2); color does not affect structure. These are proposed tests, not tests run in VA1.

## Touch, commit, retry and support

One eligible tap starts one transaction: immediate shuttle touch-down squash, throw on release, ribbon crosses, beater packs automatically, then commit. The beater is animated scenery, not a third required button. Row selection (lift and weft) is snapshotted at throw. While a throw/beater/return is busy, extra taps are ignored, never queued or counted; a held finger cannot weave multiple rows. Respect shell controls, palm rejection, pointer cancellation and leaving the canvas. Use `onTap`; free play taps never cover Home, guide or pause UI. A cancelled tap before throw changes nothing. Once thrown, scene-owned animation completes one transaction unless the scene is destroyed; destruction saves no partial row and cannot finish afterward.

Levels 1–2 choose their next lift automatically. Level 2 starts with the first pot selected and it stays selected until another pot is tapped; pot selection alone never throws. Touch-down highlights the pot, release selects and speaks its color once per yarn per round. Any number of free switches before a throw is welcome. No misses/hints at 1–2; replay is support, not assessment.

Level 3 begins with no selection. A pedal press sinks immediately and previews raised threads; release latches it. Releasing another pedal replaces the preview. Pressing the same pedal again before a throw is free. Shuttle with no selection gently cues the pedals (`loom.choose-pedal`), without miss/help debt. The shuttle deliberately submits a selected lift: a repeated committed lift makes the ribbon visibly slide loose, boings gently and returns the shuttle to its original side. Count exactly one miss for that submitted row, never for pedal exploration. Do not commit its color, advance row, beat the cloth, flip direction or finish. Clear selection after the return (also after each successful commit); retry starts from the same last committed row. Pressing during busy return does nothing.

Consecutive failed submissions at the current row reset only on a successful commit (not on pedal changes or replay). After two repeat failures, glow the other pedal and count one hint **once for this row**. Manual Show a hint gives that same valid pedal glow, and counts the same row's one hint if not already given; repeated manual/automatic help or replay does not count again. Row 0 help glows A (B remains accepted). Keep the glow until a successful commit; it must have `eventMode=none` so it cannot swallow pedal input. A new row gets a fresh cap. Replay the instruction freely; no time-based hint or wrong-answer timer. No auto-throw or forced finish. Thus two smooth rounds can adapt by the existing shell policy, but a supported completion is not independent mastery.

No Undo is required in this first slice: free color choices cannot be wrong, and invalid rows never commit. The study's general free Undo belongs to later target-matching levels. Restart remains available through the shell, with no penalty.

## Proposed layout and yarn presentation

Layout from safe `view` in `resize`, with no window-size reads. The following are **design rectangles, not measured implementation proof**. Reference logical views are landscape 1024×768 and portrait 1024×1365; interpolate extra space, without shrinking controls. Reserve top 120 for shell/title; reserve bottom-left `x=0..260, y=h-270..h` for the guide and replay, plus the shell's actual corner control bounds. Validate those against actual shell geometry at build time.

| Element | Landscape reference | Portrait reference |
| --- | --- | --- |
| Loom/warp/cloth, noninteractive | x 280..740, y 160..500 | x 250..774, y 240..850 |
| Beater sweep, noninteractive | inside loom, y 400..500 | inside loom, y 710..830 |
| Level 1 eligible play surface | remaining canvas below title, minus actual shell/guide bounds; loom itself included | same rule; use roomy center and upper loom |
| Shuttle hit target (levels 2–3) | center (850,390), 180×120 | center (810,960), 180×120 |
| Level 2 pots (only at 2) | centers (430,620), (620,620), (810,620), each 120×120 | centers (420,1160), (610,1160), (800,1160), each 120×120 |
| Level 3 pedals (only at 3) | centers (510,620), (750,620), each 140×120 | centers (490,1160), (730,1160), each 140×120 |

Pedal edges have at least 100 units between them (centers at least 240 apart), satisfying the study’s separation without overlapping hit areas. Pot centers 190 apart. Shuttle hit target stays on the same comfortable right-hand control pad even as the animated shuttle rests at either loom edge; both pad and shuttle show direction with a broad arrow. No moving-target chase. Pedals show raised thread groups with alternating line glyphs and a depressed/outlined selected state. Cloth cells and thin warp threads are not touch targets. Every required hit target stays ≥100 units on screen after scaling, with actual hit-bound and guide-clearance assertions in both orientations; a layout that cannot fit must be redesigned, not shrunk.

Reuse `src/art/palette.ts`; choose three palette IDs with fixed marks (dot, stripe, ring), repeated on pots, shuttle yarn and exposed woven segments. Give marks a dark/light outline; color-name speech supplements marks. Mark texture follows the yarn, so which strand sits on top remains visible in equal-colored cells. Light/dark separation reveals over-under; contour gaps/shadows distinguish neighboring cells. Build chooses exact palette IDs and records them: evaluate relative luminance, require ≥3:1 between each distinct warp/weft pair used to demonstrate top/bottom, and ≥3:1 for mark/background or its outline; reject a seeded palette pairing that fails. Free matching yarn choices remain legal and never miss. Do not assert every palette pair has sufficient contrast. Later rule/render tests cover the selected finite palette set, grayscale/marks, selection and sound-off state. No new art assets required: Graphics, synthesized pentatonic row sound and scene-owned animation.

## Speech, level-scoped how-to and ghost finger

Reserve these IDs in the eventual `src/content/voice-script.ts`; none are added in VA1. `ctx.instruct` sets replayable instruction; `ctx.say` speaks state feedback. State-specific replay at level 3 cues pedals when unselected, shuttle when selected; after a slip it explains the other pedal. Feedback/replay never changes counters. Cancel speech/animations on destruction through shell contracts; no clips or device acceptance claimed.

| Proposed ID | Text / use |
| --- | --- |
| `game.little-loom` | “Little Loom!” — spoken title |
| `loom.zoom` | “Tap to send the shuttle across!” — level 1 instruction |
| `loom.yarn` | “Pick a yarn. Tap the shuttle to make a scarf!” — level 2 instruction |
| `loom.pedals` | “Press a pedal, then tap the shuttle. Next row, use the other pedal!” — level 3 instruction |
| `loom.choose-pedal` | “Press a pedal to lift some threads.” — no selection |
| `loom.send` | “Now tap the shuttle.” — selected-state replay |
| `loom.slip-repeat` | “That row slipped. On our island loom, use the other pedal for the next row.” — one failed submission |
| `loom.help` | “This pedal lifts the other threads. Try it, then tap the shuttle.” — glow feedback |
| `loom.color` | “{color} yarn.” — valid palette color names only, once per chosen yarn per round |
| `loom.done` | “A scarf you made!” — before shell finish |

No unreachable all-together/float child lines required for VA2's two pedals; programmer-invalid candidates are not spoken as child errors. Grown-up how-to names the island rule explicitly.

| How-to scope | Shown steps | Demonstration |
| --- | --- | --- |
| Level 1 only | Tap the loom; watch a row cross and pack; eight rows make the scarf | Finger taps central eligible area eight times, waiting for idle/committed count after each |
| Level 2 only | Choose any marked yarn; tap shuttle; keep or change yarn until scarf ends | Select dot, send two rows; stripe, send three; ring, send three; no target sequence claimed |
| Level 3 only | Press either pedal then shuttle; use the other pedal next row; a slipped row comes back to try again | Alternate A/B for eight rows; same state machine as touch, never mutate game state |

How-to co-play tip invites turn-taking. Normal `autotouch()` completes every reachable level from exposed current state, chooses the opposite last committed pedal, waits through busy state, and respects cancellation/resize. Demo never intentionally misses; the regression play separately submits A twice, verifies one miss and unchanged row, repeats to earn one hint, replays/help again to prove the cap, then uses B and finishes. Test the bot's plan against the same holding rule; no solver or answer bypass needed.

## Placement and bounded Keep contract

Source base `3a2e29b9` (unchanged through coordinator dispatch `bb747ad6`) has **eight** Painted Canyon games: Rainbow Fingers, Fluffy Salon, Stamp Studio, Pixel Pictures, Cut Along, Draw the Pattern, Recipe Workshop and Gear Garden. The study's “Paint Pier holds four” is historical. Before Loom, age-and-younger visible counts are lap 5, toddler 7, preschool/pre-K/school 8 (games remain reachable when their highest band is younger); Loom would make these 5/8/9/9/9. With one host and a conservative signpost reservation that is at most 11 spots, below current `LAND_SPOTS=13`. This is a source-count capacity budget, **not** a passing layout test. Queued Movie Night and other future additions are not built slots: re-count at VA2, test every actual band/view/side/page and both root/classic return origins, and use `landPages` if necessary. Never squeeze targets or invent a workshop fallback because a proposed place has not shipped. Preserve stable land/game IDs and `go.*` origin routes.

Adopted Keep decision: a bounded cloth on the shared picture board, until a separate rework wardrobe definition. Existing pixel pictures are square 4–6 grids; do **not** truncate or stretch a six-by-eight scarf into that schema. Proposed new picture variant (notation only): `kind:'picture', medium:'cloth', version:1, cols:6, rows:8, cells:[48 palette indices]`. Cells are row-major visible drawdown, palette indices reference a fixed versioned allowlist of at most six existing palette IDs; no raw RGB, URLs, arbitrary objects, warp/lift history, names or bitmap. Store/render exactly those 48 cells with yarn marks derived from palette identity. It is a visual keepsake, not an editable draft or proof of structure/mastery.

VA2 must add the union/validation/render/backup handling and tests together: require exact literal dimensions/version/medium, exactly 48 integer indices in the allowlist; reject the whole malformed cloth to null (including missing/extra cells, invalid colors and unknown versions), preserve another valid picture/tune, and use existing two-slot current/previous picture ownership semantics. Keep only after completed round and explicit shell Keep, never each row or on navigation. No automatic discovery, equipment, wardrobe item or typed story result. Profile isolation and backup/restore/offline round trip remain required. Development saves may reset/reseed explicitly rather than migrate; define a clear current-format reset path at implementation cutover. This definition resets nothing.

## Build gates and proportionate proof

VA2 is one declared same-game batch of three modes plus voice/how-to/bot, placement and Keep. Before edits, repeat overlap/admission, inspect full applicable integration/pitfall/reuse contracts and review the study's cited weaving source and adopted island simplification against these fixtures. This packet adds no research or new claim of textile accuracy. Actual control/pet/land layout, palette choices, creation validation/rendering and implementation are still unproven. If Keep's shared persistence work cannot fit one bounded build, split named complete parts before claiming and explicitly retain the unbuilt Keep contract; do not silently drop it.

Future checks: typecheck, unit tests (finite rules, color independence, commit idempotency/cancellation, capped help, bot plans, registry/lands/how-to and creation validation). One filtered browser play covers each distinct entry layout/input at 1,2,3, wrong pedal, two misses/one hint and supported finish, with one portrait screenshot and ghost-finger completion at all three levels. Shared Keep/assets/catalog touch means build plus focused picture-board/profile/backup and navigation coverage, `world` for catalog navigation and production offline verification on current served build, within the browser budget. Record tested commit, exact filters, URL and not-run gaps. Do not run broad release/couch/story suites for this definition.

At VA2 finish retain iPad touch/speech/mark contrast/over-under readability and child enjoyment/comprehension checks. Lap remains a person/device gate before registration; no browser proof opens it. Living/Indigenous traditions remain excluded pending the study's community-source/reviewer gate. Paper Weaving's source/practical review and later-level/wardrobe dependencies stay separate. VA1 proves only an inspectable definition and documentation consistency.
