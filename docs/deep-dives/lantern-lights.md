# Lantern Lights deep dive

*ID `lantern-lights` · band grown-up · levels 1–6 on 2026-10-31 · session `claude/dive-lantern-lights`, [PR #1079](https://github.com/rjdunlap/neo/pull/1079)*

## The game today

A grown-up logic puzzle after Lights Out, on a pond at dusk. A square of paper lanterns, each lit or dark; pressing one flips it and the lanterns above, below and beside it, and the goal is every lantern lit. By touch (Lantern Lake, since 2026-10-13) a tap on a lantern presses it at once (`onTap` fires on touch-down, and a layer over the pond works out the cell, so a press never depends on a drawing's hit area); **Undo**, **Hint** and **Start over** sit in a row under the pond. On the couch the stick moves a cursor whose glow shows what a press would flip, the bottom button presses and the left takes the last press back. Learning purpose: planning with an operation that is its own undo and whose order never matters, so a way to win is a *set* of presses (parity, the thing [Odd passes](../IDEAS.md) names).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What the player decides | Ponds |
| --- | --- | --- | --- | --- |
| 1 | A 3 by 3 pond: find the one or two lanterns to press | grown-up | Which two lanterns undo the dark patch (scramble 2, fewest at least 2) | 3 |
| 2 | A 3 by 3 pond with a few more presses to find | grown-up | The same with overlapping footprints (scramble 4, at least 3) | 3 |
| 3 | A 4 by 4 pond with a short way to light every lantern | grown-up | Short sets on a board with sixteen winning sets (scramble 4, at least 3) | 2 |
| 4 | A 4 by 4 pond that takes planning | grown-up | Longer sets (scramble 7, at least 5) | 2 |
| 5 | A 5 by 5 pond with a short way to light every lantern | grown-up | The classic board, four winning sets (scramble 5, at least 4) | 2 |
| 6 | A 5 by 5 pond that takes planning | grown-up | The classic board needing real planning (scramble 10, at least 8) | 2 |

**Content pools.** Every pond is generated: light the board, press `scramble` different lanterns at random, drop it if `fewestPresses` comes out under `atLeast`. The pools are all boards of that kind (36 at level 1, far more above), so arrangement varies on every replay; colour, shape and footprint never do. The couch shelf holds one frozen course, **Dusk on the Pond** (`course.ts`, version 1, five ponds, par 36), pinned at level 6; trips climb `[1, 2, 3, 3, 4, 5]` (`src/couch/catalog.ts`), so a level appended above 6 never enters a trip unless that list changes.

**Accounting.** Misses are always 0 (decided 2026-10-23: count a miss only where the game shows one, and no press is wrong here). Each hint counts; adaptation therefore steps on hints alone, and a long unhinted wander still counts as a smooth round. That is the recorded decision, not a gap to reopen.

**Known gaps** (found reading the code; not fixed in this session):

- **Portrait counts over the pond.** `resize()` puts the counts at `x = min((v.w + bw)/2 + 150, v.w - 120)`, `y = 190`. In portrait (768 wide) a 4 by 4 or 5 by 5 pond runs to x ≈ 616–674 and the clamp puts the counts' centre at 648, over the right column of lanterns. Not confirmed by screenshot; a 6 by 6 level makes it certain (the pond spans 36–732), so slice 1 moves them.
- **The hint is one line.** "Try the glowing lantern." names nothing about why; the solver knows whether the pond has one fewest way or several.
- **No replay of a short way** (GAMES.md lists it as not built), and touch play never says what the fewest was; only the couch course shows it.
- `destroy()` is empty; everything is scene-tracked tweens and `ctx.say`, which a destroyed scene never resolves, so nothing leaks today. A slice that adds a timer or a replay loop must guard it.

## Similar games

Evidence: the [Wikipedia article](https://en.wikipedia.org/wiki/Lights_Out_(game)), [Jaap's Puzzle Page](https://www.jaapsch.net/puzzles/lights.htm), [Simon Tatham's Flip manual](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/flip.html), the [GNOME Lights Off rules](https://help.gnome.org/users/lightsoff/stable/rules.html.en) and [cut-the-knot's Mini Lights Out](https://www.cut-the-knot.org/Curriculum/Games/Merlin4x4.shtml) were read only as search excerpts in this session, not opened; treat details as excerpt-level.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Lights Out (Tiger, 1995) and XL-25 (Vulcan, 1983) | Handheld, 5 by 5 | A fixed list of numbered puzzles, a move counter | The move count against a known minimum, which Lantern Lights already has | Puzzles tied to a booklet; a beep for every press |
| Lights Out Deluxe | Handheld, 6 by 6 | A bigger board | A 6 by 6 pond (one winning set, so its fewest is exactly the presses that made it) | Nothing new beyond size |
| Lights Out 2000 | Handheld, three states | Each light cycles off, red, green | A three-colour pond as a later definition: a press advances a step, three presses undo | Its tiger-paw button layout; mixing rule changes and size in one step |
| Mini Lights Out and its torus mode | 4 by 4, edges wrap | Wrapped edges and a "lit-only" mode | Nothing yet: wrapping is invisible on a pond with banks | A rule the picture cannot show |
| Merlin's Magic Square (Parker Brothers, 1978) | 3 by 3, different footprints | Corner, edge and centre buttons flip different shapes | Varied footprints as a far idea, shown by strings between lanterns | Footprints she must memorise without a preview |
| Simon Tatham's Flip | Free puzzle collection | Crosses or a random shape per square; Solve marks the squares to press | The Solve marking is the "show me a short way" replay; varied shapes later | Random shapes with no on-touch preview |
| GNOME Lights Off | Desktop, 5 by 5 | Endless numbered levels | Nothing beyond what generated ponds already give | A level counter as the goal |
| Coins in a grid (the game's off-screen activity) | Physical | Any size the table holds | Already the off-screen suggestion | — |

Developmental source: the game teaches no school standard; it is a grown-up planning puzzle, and the [touch, laptop and grandparents review](../IDEAS.md#touch-laptop-and-grandparents-2026-10-09) (AARP: many find games too complicated and need a tutorial) is the relevant audience note. Its open item is "a 6 by 6 Lantern Lights level".

## What makes sense here

- **Bigger boards first.** `Size` already allows 6; the 6 by 6 and 7 by 7 boards have exactly one winning set each, so every generated pond's fewest equals its scramble and the existing solver, hint and bot work unchanged. At 768 units of short side `resize()` gives 84-unit cells at 6 by 6 and 72 at 7 by 7: both pass the grown-up floor of 64 and neither reaches 100, so this stays `grownup` only. 6 by 6 comes first; 7 by 7 is left until a person has tried 6 by 6 on the iPad.
- **Explain, then show.** Two cheap kinds of understanding: a hint that names what kind of pond it is ("there is only one short way here" against "there are several short ways; this lantern is in one"), and, after a pond is lit, a "Show me a short way" replay on the starting board (Tatham's Solve marking, animated). Neither is pressure; both keep the score off the touch screen unless asked.
- **Shapes before rules.** A pond with lily pads (cells with no lantern, so footprints are clipped) varies arrangement and gives new geometry without a new rule to learn; the solver generalises with a mask. Three-colour lanterns are a real rule change (a mod-3 solver, a third lantern state, undo by two more presses) and need a definition first.
- **Long-term arc.** Grown-up: sizes 3–6, shaped ponds, then three colours. A school opening at 3 by 3 and 4 by 4 (100-unit cells fit easily) is plausible for six- to eight-year-olds as an experiment game, but placement (one land per game, Lantern Lake today) makes it a definition, as Island Bridges' was.

## Experience and presentation

- **First unsupported action.** Tap any lantern on a 3 by 3 pond; the lantern and its neighbours turn at once (a 0.07 s squash and turn, a pentatonic pop per cell), and the warm halo spills onto the neighbours. Ready again immediately: there is no lock-out.
- **Pleasure.** The row-by-row glow-up and bells when the pond lights; the halos make "how much light" visible before the end.
- **Variety without a new rule.** Generated arrangement today; slice 3 adds pond shapes. A concrete code-drawn example: a lily pad is a `Graphics` ellipse in `swatch.green` with a notch cut by a second ellipse in the water colour and a 2-unit darker rim, drawn on the water in place of a lantern; it never flips and its cell has no tap effect (a soft `sfx.tick`, no press counted).
- **Reasoning versus precision.** Taps resolve by cell, so motor precision never matters; the load is planning. Memory load stays zero: the board shows everything.
- **Supported ending.** Hints always lower the fewest by one, so asking repeatedly finishes any pond; Start over and Undo are free. Slice 2's replay is the comfortable "show me" for someone who lit it the long way.
- **Co-play.** One taps, the other predicts which lanterns will flip ("talk about which press would light the most", the existing `coplayHint`). Solo stays complete.
- **For a person or device.** Whether 84-unit cells feel comfortable on the iPad; whether a grown-up notices the replay button; whether the named hint lines are understood without reading.

## Proposed ladder

### Fresh content inside existing levels

- **Named hints** (all levels): the hint keeps pointing at a lantern of a fewest way (the existing rule test stays) but its line names the situation: `lantern.hint-one` when the pond has exactly one fewest set ("There is only one short way. Try the glowing lantern."), `lantern.hint-many` when there are several ("There are a few short ways. The glowing lantern is in one of them."). Cost: two voice lines, `hintFor` returns `{ cell, kind }`; the bot reads only the cell.
- **Show me a short way** (all levels, touch): after the glow-up, two buttons replace Undo/Hint/Start over: **Show me a short way ▷** and **Next pond ▶**. The replay resets the pond to its start, then presses `solve(start).best[0]` one lantern every 0.6 s with a ring on each, then lights. It counts nothing (the pond is already done) and is offered every time, not only after an over-par finish, so nothing compares. Couch play is unchanged (it moves straight on after its score). Rule test: replaying `best[0]` on the start reaches all-lit in exactly `par` presses for every level and seed sample; the chosen way is deterministic.

### New levels on top

Appended above 6; grown-up range becomes 1–8, then 1–9. No `order` or `entryLevels` is needed: the ladder already opens at 3 by 3 and every new level is harder than 6.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | A 6 by 6 pond with a short way to light every lantern | grown-up | Two 6 by 6 ponds, scramble 7, at least 7 | The one set of seven presses (6 by 6 has one winning set) | No misses (0, as decided); each hint counts and lowers the fewest by one; adaptation on hints | `solve(...).ways === 1` at 6 by 6; par equals the scramble exactly; hints lower the fewest by one at 7 | `PLANS` row; portrait counts fix (below); `fingerdemo` at 7; the frozen course and trips untouched |
| 8 | A 6 by 6 pond that takes planning | grown-up | Two ponds, scramble 12, at least 12 | A long set of twelve | As level 7 | Same, at 8; generation stays under its 300-attempt budget over 200 seeds | `PLANS` row |
| 9 | Lily-pad ponds | grown-up | Two authored-shape ponds on a 5 by 5 or 6 by 6 grid (a plus, a ring around a pad, an L, a diamond), scramble 6, at least 5 | The same parity planning on a shape whose edges clip the footprints | As level 7; a tap on a pad is a soft tick and nothing else | Generalised `footprint(size, cell, mask)` and `solve` over the masked cells match a brute force on every authored shape; each shape's free dimension is at most 4 (so `solve`'s `2^free` enumeration stays at most 16); a pad never flips; `parsePond` reads `' '` as a pad and the existing course still parses identically | Shared `logic.ts` changes reach the couch course, so `couchgames` filtered to Lantern Lights runs; pad art (above); one voice line `lantern.pads` for the first pad pond |

### Younger-band openings

**School opening (define first).** Levels 1–2 for `school` (3 by 3 ponds; cells already ≥ 100 at 3 by 3 and 4 by 4), with misses still 0. A definition must settle the home land (the game lives in Lantern Lake; the one-land rule means a Wonder Woods home moves it or needs a decision), a school sticker, level-scoped how-to steps for a child, a spoken first instruction that does not rely on reading, and whether a touch-down preview of the footprint (a hold that glows the five cells before release) is needed for a child. Docs only; not a build.

### Easier entries and levels between existing ones

None needed: level 1 is already a 3 by 3 pond with two presses, gentler than any grown-up board elsewhere. A grown-up who wants a small pond can pin a level.

### Left out on purpose

- **7 by 7 and larger** until 6 by 6 has been tried on the iPad (72-unit cells pass the floor, but there is no evidence yet that the bigger board is fun rather than long).
- **Torus ponds** (Mini Lights Out's wrap): a pond has banks; a wrap the picture cannot show is a hidden rule.
- **Random footprints** (Tatham's Random, Merlin): there is no on-touch preview of what a press flips, so the rule would be memorised; revisit only with a visible string drawing per lantern and a definition.
- **Lit-only** (only a lit lantern may be pressed): it turns a free press into a refusal, which would be a miss the decision does not count.
- **Chase-the-lights strategy coach** (press under each dark lantern row by row, then a bottom-row table): a real human method, but it rarely gives the fewest and the table is per size; it would need its own hint kind and test ("reaches all lit within N presses"), not a change to the fewest-press hint. Kept here as a possible later definition.
- **A par line on the touch screen** after every pond: the couch keeps it; touch shows the replay instead, with no comparison.

## Decisions for the developer

None new. The school opening's home land is for its definition to raise, under the one-land rule.

## Build slices, in order

1. **A 6 by 6 pond (batch lantern-lights 1).** Levels 7–8 (`PLANS` rows, grown-up max 8) and the portrait counts fix: when the room beside the pond is under about 260 units, the two counts sit in one line above it (`3 presses · 20 of 36 lit`), clear of the top corner buttons. *Check:* new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 (a hint, then to the sticker), one portrait screenshot of level 8 with the counts, `fingerdemo` at 8. Trips stop at level 5 and the course is pinned at 6, so no couch suite.
2. **Named hints and Show me a short way (batch lantern-lights 2),** after batch 1 (shares `index.ts` layout). `hintFor` kinds and two voice lines; the after-pond buttons and replay on touch only. *Check:* new interaction: typecheck, rule tests (hint kinds by `ways`/`best` count; replay reaches all-lit in `par`), one play at level 3 with one hint (its named line), lighting the pond and the replay, one portrait screenshot mid-replay, `fingerdemo` at 3 (the bot must press Next pond).
3. **Lily-pad ponds, level 9 (batch lantern-lights 3),** after batch 1 (shares `PLANS` and the max). Masked `footprint`/`solve`/`parsePond`, authored shapes, pad art, `lantern.pads`. *Check:* new rule: typecheck, rule tests including the brute force on every shape and the free-dimension cap, one play of level 9 with a tap on a pad (nothing counted) and a hint, to the sticker; one portrait screenshot; `fingerdemo` at 9; `BROWSER_SUITE=couchgames` filtered to Lantern Lights (shared rules change).
4. *Define:* **Lantern Lights school opening** (docs only; see *Younger-band openings*).
5. *Define, later:* **Three-colour lanterns** (Lights Out 2000's rule): a mod-3 solver checked by brute force over all 3^9 3 by 3 boards, a half-lit lantern state, Undo as a step back, voice, and a level number above 9. Not queued until slices 1–3 are built.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
