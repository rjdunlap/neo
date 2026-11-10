# Pile Match deep dive

*ID `pile-match` · bands preschool, pre-K, school · levels 1–9 on 2026-11-09 · session `claude/dive-pile-match` ([PR #1363](https://github.com/rjdunlap/neo/pull/1363))*

## The game today

A windy-day heap of island things lies on the grass in layers. She taps a piece on top and it hops into a tray; three of a kind pop together into the host's basket, and the round ends when the grass is clear. A covered piece is dimmed and only wiggles. Tapping a piece in the tray puts it back in its own place. The learning purpose is **visual search and making sets of three**: find matching pictures among distractors, see what lies on top, count one, two, three into a set, and from level 4 keep a small tray in mind. Built 2026-10-20 ([PR #680](https://github.com/rjdunlap/neo/pull/680)) from its [definition](../definitions/pile-match.md); it lives in Counting Cove (`region: 'counting-cove'`, `challenge: 'noticing'`).

| Level | Plan name (`describeLevel`) | Bands | Heap (pieces · kinds · layers), tray | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Find three, flat | preschool | 6 · 2 · 1, basket of 3, asked | Which pictures are the named kind (always apples, then shells) |
| 2 | Find three in a little pile | preschool | 9 · 3 · 2, basket of 3, asked | The named kind, and which of them are on top |
| 3 | Any three you like | preschool, pre-K | 6 · 2 · 1, tray 5 | Free choice; two kinds can never fill the tray |
| 4 | A little heap, a little tray | preschool, pre-K | 9 · 3 · 2, tray 5 | Which kind to gather so the tray does not fill |
| 5 | Four kinds | pre-K, school | 12 · 4 · 2, tray 5 | The same, with more to look through |
| 6 | Five kinds, three layers | pre-K, school | 15 · 5 · 3, tray 5; count by threes | Digging through three layers |
| 7 | Six kinds | school | 18 · 6 · 3, tray 5; count by threes | The same, with six kinds |
| 8 | The big heap | school | 24 · 8 · 3, tray 5; count by threes | Every kind at once |
| 9 | A smaller tray | school | 18 · 6 · 3, tray 4; count by threes | Which kind to finish before starting another, with one fewer place |

`LEVELS` is `{ preschool: 1–4, prek: 3–6, school: 5–9 }`, with no `order` or `entryLevels` at slice 2 (slice 3 adds level 11 to preschool and pre-K by `order`, and `entryLevels: [11]`). A round is one heap.

**Content pools.** `shapes.ts` holds six frozen shapes per level (level 9 reuses level 7's ten `PILE18` shapes). `makeBoard` picks a shape and deals kinds in consecutive triples along a seeded clearing route, so every heap clears with a 3-slot tray. Eight kinds (shell, acorn, apple, star, leaf, toy duck, flower, mushroom), each with its own silhouette and its own palette colour; `blue` and `white` are the unused swatches. Level 1 always deals apples and shells. One look: a rounded grass patch, no backdrop or weather, so the windy day exists only in the description. Music `STYLES.stickers`; each kind lands on its own marimba step, rising for the second and third.

**Accounting.** Never a miss: an accepted tap, a put-back, a covered touch, Start again. A different kind at levels 1–2 is one miss, with the pet naming both. From level 4 the first tap a full tray refuses is one miss, then free until something leaves the tray. Every second miss glows the hint (one hint); from level 4 three put-backs since the board began or the last hint glow it too. `hintFor` takes a tap a memoized search (capped at 200,000 masks) proves still clears, else the route fallback (put back a stray kind, then follow the clearing route). Level 3 cannot produce a miss, so two rounds there step up.

**Known gaps.**
- *Closed by slice 1:* three seeded looks (meadow, sand, autumn; levels 1–2 always meadow), a windy drop-in, ten shapes a level (none shared between 1/3 or 2/4), and a seeded second kind at level 1 (shell, toy duck or leaf after apples).
- The sticker's kind is from the seed, not from the round. The contract rebuilds a sticker from its seed alone (`sticker(seed)` in `src/games/types.ts`), so this stays as it is.
- The step from 3 to 4 changes three things at once for preschool and pre-K: a second layer in free play, a third kind, and a tray that can fill (with a miss).
- *Closed by slice 2:* the tray is typed `3 | 4 | 5`; level 9 has four places.
- With one colour and one outline per kind, search is always single-feature pop-out (by design, from the definition's Blaser et al. reference). Level 10 *Look closely* (school, 2×2 look-alikes) is the one step where two features must be checked; more kinds or pieces would be clutter, and the 24-bit mask caps a heap at 24.
- The count by threes has lines for 15, 18 and 24 only.
- No couch entry (definition decision 6: later) and no journal coupling.
- Person checks open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): whether a three-year-old reads dimmed pieces as underneath, legibility at 24 pieces, whether put-back is found without the hint. Nothing in [OBSERVATIONS](../OBSERVATIONS.md).

**Browser coverage.** `pilematch` (`scripts/browser/suites/pile-match-play.mjs`) and `fingerdemo`: level 1 by taps with one wrong-kind tap; level 8 with a full tray (two refused taps, three put-backs, one hint); a portrait screenshot; from 2026-11-09 level 9 too (four slots drawn, tray filled to four with no three, one refused tap, solved by the ghost finger's choices).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Triple Tile](https://apps.apple.com/us/app/triple-tile-match-puzzle-game/id1572661625) and its seven-slot clones (the definition's references) | Tile triple-match | More tiles and layers; then a tighter tray and tiles that look alike | A smaller tray on the same heap, so the planning gets tighter without adding clutter | The losing full tray, boosters, lives, timers, stars, ads |
| [Match 3D](https://apps.apple.com/app/1502447854) | 3D object pile | Bigger piles of real-looking objects, then near-identical objects in different colours | Look-alike objects (same thing, two looks) as a late "look closely" step | The physics pile, the countdown, the overfilled box that fails the level |
| [Mahjong solitaire](https://en.wikipedia.org/wiki/Mahjong_solitaire) and this repository's [Tile Pairs](../GAMES.md#tile-pairs) | Layered pairs | Layouts (the turtle and others) rather than rules; a layout is a new problem | Many frozen layouts per level are the cheapest variety; the route assignment and solver are already copied | Unwinnable deals and the shuffle penalty |
| [Pick-up sticks](https://en.wikipedia.org/wiki/Pick-up_sticks) | Physical top-first removal | Nothing but care | The heap made by tipping: you see what lands on top. A drop-in opening that shows layering | The dexterity test (here a tap always works) |
| [Where's Wally?](https://en.wikipedia.org/wiki/Where%27s_Wally%3F) and hidden-picture puzzle books | Named visual search | Busier scenes and look-alike decoys | A named target with look-alikes for school, said aloud and pictured | Search against a clock; tiny targets |
| [Dobble / Spot It!](https://en.wikipedia.org/wiki/Dobble) | Symbol matching card game | Variants with fewer symbols for young players; a race in the main game | One player names "a blue duck", the other finds it: colour and shape words in co-play | The race to be first |
| A toy-box tidy-up (the off-screen suggestion) | Physical sort | Free sorting, then by a named kind | The off-screen suggestion stays | — |

The design lens behind the ladder is [feature integration](https://en.wikipedia.org/wiki/Feature_integration_theory) (Treisman and Gelade 1980): a target that differs from every distractor in one feature pops out at any heap size, while one that shares colour with some distractors and shape with others must be checked piece by piece. The definition's toddler study (Blaser et al., VSS 2012) found the same pattern from the second year. Pile Match keeps pop-out everywhere it is today and adds one conjunction step at the school top, small (12 pieces) so it does not slow into a chore. Counting by threes stays heard, not asked: skip-counting in the US Common Core is by 5s, 10s and 100s in grade 2 ([2.NBT.A.2](https://www.thecorestandards.org/Math/Content/2/NBT/A/2/)), and threes belong to grade 3's multiplication, which this game does not claim. Nothing here claims an attention or school benefit.

## What makes sense here

- **Variety first, at no cost to the rule.** Looks, a windy drop-in, more shapes and a varied level 1 make repeats feel new without changing any plan.
- **A softer step for the youngest.** A free-play level with two layers but only two kinds sits between 3 and 4, so layering in free play comes before the tray can fill.
- **Tighter, not bigger, at the top.** A 4-slot tray on the level 7 heap is a real planning step; more pieces or kinds would only add clutter.
- **One new noticing question.** Look-alike kinds (two silhouettes in two colours) make her look at both features. It is visual search, still with no clock.
- **Long arc.** Preschool: asked baskets, free trays, the new little-pile step. Pre-K: filling trays up to five kinds. School: three layers, the big heap, the smaller tray and look-alikes. Couch play stays later (decided 2026-10-23).

## Experience and presentation

- **First unsupported action.** Level 1 says "Find three apples" and shows an apple on the basket tag; any apple she taps hops in. No reading and no grown-up needed.
- **Touch and consequence.** Touch-down lifts a free piece with a soft pop; the hop is a 0.3 s arc onto its kind's marimba step, so one kind plays a rising three-note run before it pops. A covered touch wiggles the piece and what lies on it. A refused tap boings and says why.
- **Variety on replay.** Today only the shape and kinds change. Slice 1 adds three seeded looks (meadow, cove sand, autumn), a windy drop-in and four more shapes a level; slice 4 adds two kinds to the pool, so a level 8 heap no longer always holds all eight.
- **Reasoning, not motor precision.** Every free piece answers within 60 units (120 across) and free hit areas never overlap; it is all taps. The challenge is seeing what is on top and keeping the tray open, never aim or speed.
- **Supported ending.** The hint never runs out (the route fallback always clears), Start again is in the pause sheet, and one sticker comes with or without help.
- **Co-play.** The current hint ("One of you names a kind, and the other finds three") gains words at level 10: "a blue duck", "a yellow star".
- **Art and feel example.** The windy drop-in: a gust drawn as three curling white strokes (`Graphics` arcs, alpha tweened by `ctx.tw`) sweeps across the header, and the heap falls in **bottom layer first**: each piece drops about 80 units with a small squash and its shadow ellipse growing as it lands, the next layer about 0.15 s later. She has seen which things landed on top before she touches anything. Taps are ignored until the last piece lands (the existing `busy` guard), and the whole drop stays under a second. The autumn look tints the grass `swatch.brown.light` and scatters a few drawn leaves under the heap (never pieces, never tappable).
- **Needs a person.** Whether the drop-in makes "underneath" clearer to a three-year-old than the dimming alone; whether a six-year-old finds look-alikes interesting or tiresome; whether the level 10 colour pairs read for a colour-blind child (a device check, as below).

## Proposed ladder

### Fresh content inside existing levels

- **Three seeded looks** (meadow, cove sand, autumn): ground colour, a code-drawn edge (grass tufts, a wet sand line with two shells, fallen leaves) and a sky band behind the header. Levels 1–2 keep the meadow so the first rungs stay familiar.
- **The windy drop-in** at the start of every heap, as above.
- **More shapes:** ten per level (four more in each pool), and levels 1 and 3, 2 and 4 stop sharing pools (`FLAT6B`, `PILE9B`), so the twelve preschool shapes become forty.
- **Level 1's second kind is seeded** from shell, toy duck and leaf (apples still come first, so the first ask never changes).
- **Two more kinds** (slice 4): a blue feather (curved quill with barbs) and a white sock (ankle bend, a coloured heel), the washing line's windy-day losses, on the two unused swatches. Each gets `this-is` and `find` lines; the pool becomes ten and a board still holds at most eight.

A rule test asserts: every new shape matches its plan, lies on its grid and has a clearing route; no shape repeats within a level; level 1's first asked kind is apples for every seed; each look is chosen from the seed and levels 1–2 always use the meadow; the drop-in order is non-decreasing in `z`; every kind has its art index, colour, note and voice lines; no two kinds on a board share a colour or a silhouette (except at level 10, below).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | A smaller tray | school, after 8 by `order` | The level 7 heap (18 · 6 · 3) with a 4-slot tray; count by threes (18) | Which kind to finish before starting another, with one fewer place to park | As levels 4–8: one miss per full-tray episode, the two-miss glow, the three-put-back hint | Every board clears along its route with `t = 3` (so `t = 4` too); a full 4-slot tray is reachable; hints are legal and clear the heap without looping at `t = 4`; the hint search stays under the level 8 time; levels 1–8 unchanged | `tray: 3 \| 4 \| 5` in the plan type and layout; reuses `PILE18` shapes (or slice 1's); how-to steps widened to 9; bot unchanged |
| 10 | Look closely | school, after 9 | 12 · 4 · 2, tray 5: two silhouettes in two colours (for example yellow duck, blue duck, yellow star, blue star) | Which pieces match in both shape and colour | As levels 4–8. A refused tap names the piece fully ("That is a blue duck"); the glow is unchanged | Every board is a 2 × 2 of silhouette × colour; colour pairs come only from a fixed list chosen to stay apart for common colour blindness (yellow and blue, orange and purple; never red and green); each kind differs from exactly two others in one feature; every variant has `this-is` and `find` lines; the board clears along its route | Model change: a kind becomes a silhouette plus a colour (`KINDS` keeps indices 0–9 and appends variants, so saved stickers keep their meaning); `kindArt` takes the colour; new `this-is` lines for each variant; layout unchanged; bot unchanged |

### Younger-band openings

None ready. A toddler level (definition decision 2: `toddler: { min: 1, max: 1 }`) waits for a person to watch a two-year-old play level 1, which is a person check, not a slice. It stays with the definition's device check.

### Easier entries and levels between existing ones

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | Any three in a little pile | preschool and pre-K, between 3 and 4 by `order` | Six pieces of two kinds, four on the grass and two on top, tray 5 | Which piece is on top, in free play; the tray still cannot fill | As level 3: nothing can be a miss; covered touches wiggle and are never counted | Two kinds can never fill a 5-slot tray (exhaustive, as level 3); every shape has two layers and a clearing route; preschool order `[1, 2, 3, 11, 4]`, pre-K `[3, 11, 4, 5, 6]`; levels 1–10 unchanged | Six new frozen shapes (`PILE6`); `order` in `LEVELS`; how-to steps for "things underneath wait" widened to 11; bot unchanged |

Level 11 has no misses, so two rounds there step up to 4, like level 3. `entryLevels: [11]` (added in the build) keeps a level 11 carried into school from entering there: it lands at 5, not 9; preschool still enters at 1 and pre-K at 3. School's order becomes `[5, 6, 7, 8, 9, 10]`.

### Left out on purpose

- **Hidden or face-down pieces.** A hidden piece makes a tap a guess, and the hint would know what she cannot see.
- **More than 24 pieces, more kinds per board or a 6–7 slot tray.** Clutter, the mask cap, and a tray that does not fit the upright view at 104 units a slot.
- **"Three that go together" (families: seashore, woods, garden).** It would be a sorting game, needs at least three new pictures per family and membership she cannot argue with (is an apple a tree thing or a garden thing?). Left for a sorting game's dive, not this one.
- **Asking her to say how many were tidied.** The count by threes stays heard; a quiz at the end would turn the finish into a test.
- **Sets of four.** It changes the counting goal and makes the tray fill almost at once.
- **Timers, stars, move counts, boosters.** Pressure and the genre's paid parts.

## Decisions for the developer

None new. By the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S8) the definition's defaults stand; couch play stays "later"; the toddler opening needs a person watching a child, which stays a device check.

## Build slices, in order

1. **Built (2026-11-07, PR #1371).** **Looks, the windy drop-in, more shapes and a varied level 1** (preschool to school; typecheck, rule tests, one filtered `pilematch` play at level 4 with one portrait screenshot in the autumn look, and `fingerdemo` at 1 because the drop-in changes when the bot may tap; build only if shared files change). The suite's level 1 script must not assume shells come second.
2. **Built (2026-11-09, PR #1438).** **Level 9 *A smaller tray*** (new level on the existing interaction: typecheck, rule tests at `t = 4`, one browser play of 9 with one full-tray refusal, `fingerdemo` at 9).
3. **Built (2026-11-09, PR #1441).** **Level 11 *Any three in a little pile*** placed between 3 and 4 (new level on the existing interaction: typecheck, rule and registry tests with the new `order`, one browser play of 11, `fingerdemo` at 11).
4. **Built (2026-11-09, PR #1444).** **Two more kinds and level 10 *Look closely*** (model change and new art on the existing interaction: typecheck, rule tests, one browser play of 10 with one refused tap and one portrait screenshot, `fingerdemo` at 10, build because voice lines change). Add a device check: whether the level 10 colour pairs read for a colour-blind child.

## What was built in this session

Slice 1 (PR #1371): `LOOKS`/`lookFor` in `logic.ts` (meadow; sand with a wet line and two shells; autumn with fallen leaves on the rim and under the heap), each with a sky band behind the header; levels 1–2 always meadow; decor is small, non-interactive and never in a kind's tile style. The windy drop-in: three white gust strokes sweep the header, pieces fall 80 units bottom layer first (`dropDelay` = z × 0.15 s, fall 0.35 s, squash, growing shadow), taps wait on `busy` until the last lands, under 1 s. Ten frozen shapes per level (44 new), so levels 1/3 and 2/4 no longer share pools (preschool sees 40 shapes). Level 1 asks apples, then a seeded second kind from shell, toy duck, leaf (`LEVEL1_SECOND`). No voice-line, level, how-to or bot changes. 16 rule tests.

Slice 2 (PR #1438): plan 9 *A smaller tray* (18 · 6 · 3, tray 4, count by threes; `pile.count-threes.18` reused), `tray: 3 | 4 | 5`, school band 5–9 without `order`; `SHAPES[9]` = `PILE18` (level 7's ten shapes); how-to steps widened to 9 with a level 9 note; no voice-line or bot changes. Rule tests (17 in the file) assert level 9 is level 7's heap with tray 4, every board clears along its route at `t = 4` with the tray never above 2, a full 4-place tray is reachable, and hint search at levels 8 and 9 stays under 250 ms; the existing hint tests iterate `PLANS`, so hints are legal and non-looping at `t = 4`.

Slice 3 (`claude/pile-match-little-pile`): plan 11 *Any three in a little pile* (6 pieces, 2 kinds, 2 layers, tray 5, free play like level 3: nothing is a miss, covered touches are never counted, put-backs never bring the hint); ten frozen `PILE6` shapes (four on the grass, two on top). `LEVELS` preschool `{1–11, order [1, 2, 3, 11, 4]}`, pre-K `{3–11, order [3, 11, 4, 5, 6]}`, school unchanged 5–9. Deviation from the definition: `entryLevels: [11]` was added so a level 11 carried into school (birthday or pin) lands at 5, not 9. `planFor` looks plans up by ID. A `freePlay` plan flag (levels 3 and 11) replaces the `plan.id >= 4` checks in `index.ts` for the put-back hint and full-tray miss (levels 1–2 stay excluded). How-to steps for tapping, popping and "things underneath wait" widened to 11, plus a level 11 note. No voice-line or bot changes. Rule tests (19 in the file): level 11 shapes exhaustively never fill a 5-place tray, have 4 + 2 layers and share no shape with levels 2 or 4; band orders; `stepLevel` 3 to 11 to 4; `landing(11, school)` = 5. Slice 4 (PR #1444): a blue feather and a white sock (`KINDS` 8, 9) and level 10 *Look closely* (school, after 9, band now 5–10; 12 pieces · 4 kinds · 2 layers · tray 5, reusing level 5's `PILE12` shapes). Its kinds are two silhouettes from shell, sea star, mushroom and sock times one colour pair (yellow/blue or orange/purple); 16 variant kinds sit at indices 10–25 so kinds 0–9 keep their meaning, and stickers still roll among the first 8 kinds so saved sticker seeds keep their art. A full-tray refusal at level 10 says `pile.this-is.<colour>-<shape>` then `pile.full` and counts once as at 4–9; there is no count by threes at 10; variant notes reuse the silhouette's; find and this-is lines exist for every new kind. Deviation from the dive: look-alike silhouettes exclude the duck and flower, whose orange beak and yellow middle would vanish in some colours. How-to full-tray step and note widened to 10, plus a level 10 note. Rule tests (24 in the file): kind integrity with voice keys; below level 10 no kinds share a colour or outline and the feather and sock appear; level 10 is a 2×2 from safe pairs, each kind differs from exactly two others in one feature, and a full tray is reachable. All four slices are built.
