# Market Days (definition)

Defined 2026-11-26 as slice **ML4** of the [medieval-life study](../deep-dives/subjects/medieval-life.md#build-slices-in-order) ([PR #2226](https://github.com/rjdunlap/neo/pull/2226), branch `claude/define-market-days`). Docs only: no code, no registration, no save field. Decision 3 was taken 2026-10-23 on the developer's delegation: Market Days is a **separate Lantern Lake puzzle**, not Keep House level 7, so the child's game stays a household and Lantern Lake gains a colouring puzzle it does not have. Game id `market-days`; grown-up name *Market Days*; spoken title "Market Days".

**Fun action and purpose.** Eight towns each hold one market a week. She taps a town and gives it a market day (a banner on a post). Towns a day's walk apart must not hold their market on the same day, or the same stallholders could not visit both. She finds the **fewest days** that work, then shows every town its day. The learning is constraint satisfaction and minimum: a rule between neighbours, a conflict that forces a choice, and a proof that two days cannot work (three towns that are all a day apart need three days). The history is one plain, source-checked line (below), not a lesson.

## Overlap and reuse

- **Identity check.** The central action is *assigning one of a few labels so that linked things differ*. No built game does: **Sudoku Garden** and **Logic Grid** fill a grid by uniqueness, **Island Bridges** and **Pond Conga** link things, **Circuit Garden** and **Dot Link** match colours in a given position, **Fence the Field** and **Key It Out** are measuring and typing. A map-colouring puzzle is new here, so it earns its own registration, as decided.
- Reuse `onTap` (`src/engine/input.ts`) for towns and day banners, Duck Pond's pattern of one big target that reacts on touch-down, `ctx.particles` for the market-day sparkle, Pet Kitchen's pattern of a tray of banners that stays put, and `src/progress/coach.ts` for miss and hint counting. The conflict check, solver and hint are new and live in `logic.ts`.
- **Placement.** Lantern Lake (`src/content/lands.ts`), appended after `outcrop-detective`. The capacity test the study asked for is already a property: [location pages](location-capacity.md) were built (PR #915), so a full Lantern Lake pages rather than shrinks, and `landLayout` returning null is caught by the lands test at every band. The build adds the game to the land and runs that test; it does not change `LAND_SPOTS`.
- **History on screen.** Towns, banners and people are the island's own. No real town, charter, lord, saint or date is drawn or spoken. The one historical line (grown-up card only): *Towns that held fairs and markets often fixed the days so that nearby towns did not clash.* The build checks it against the study's market-and-charter sources (decision 4 was replaced by a source check on 2026-10-23) and cuts it if it cannot be supported.

## The model (`logic.ts`)

- **Map.** A map is `{ towns: { id, x, y }[], days: number }` with towns on the integer lattice and a **day's walk** defined geometrically: two towns are *neighbours* when their lattice distance squared is at most 2 (one step, diagonals included). The neighbour list is derived, never stored, so a layout cannot disagree with its own rule. The picture draws a dotted path between every neighbour pair, so the rule is visible: **no path, no clash**.
- **The first map, `fair`** (eight towns, written as `(x, y)` on a 5 × 4 lattice, indexes 0 to 7): `(3,1) (3,2) (4,1) (2,3) (2,2) (1,1) (1,2) (0,1)`. It has thirteen neighbour pairs: 0-1, 0-2, 0-4, 1-2, 1-3, 1-4, 3-4, 3-6, 4-5, 4-6, 5-6, 5-7, 6-7. Degrees are 3, 4, 2, 3, 5, 3, 4, 2.
- **Facts proved by the generating script and pinned by test** (the numbers below were checked by exhaustive enumeration while writing this definition):
  - Six triangles of mutual neighbours exist (0-1-2, 0-1-4, 1-3-4, 3-4-6, 4-5-6, 5-6-7), so **two days can never work**; the minimum is 3.
  - There are exactly **6 proper 3-colourings, all the same partition** with the three day names permuted. The partition is `{0, 3, 5}`, `{1, 6}`, `{2, 4, 7}`. So the answer is **unique up to which banner is which**, and a player who finds a legal assignment has found the answer.
  - With four days there are 768 legal assignments, so the fourth day is a deliberately loose option used only at level 1.
- **Seeded variation.** The seed picks one of the four mirror images of the map (left-right, top-bottom, both, neither) and a permutation of the three banners, so the same puzzle looks different each time and the unique-partition property is unchanged. Different maps are a later slice, each needing its own enumeration test.
- **Solver (`solve(map, days, fixed)`).** Backtracking over towns in descending degree, returning every proper assignment that extends the player's fixed towns, up to a cap of 10. It is the single source for the hint, the check and the tests.
- **Check.** A town is in **conflict** when a neighbour has the same banner. A map is **done** when every town has a banner and none is in conflict. Conflicts are shown the moment a banner lands (below), not held for a Check button.

## Levels

| Level | Name | What changes |
| --- | --- | --- |
| 1 | *Three days* | The `fair` map, three banners, and **three towns pre-set** (a corner triangle, so the rest follow). She places the other five. |
| 2 | *Start from nothing* | The same map, nothing pre-set, three banners. The unique partition means any legal finish is the answer. |
| 3 | *Fewest days* | Four banners are offered and nothing is pre-set. The round ends when every town has a banner, none conflicts and **only three banners are used**. A legal finish that uses all four is not a miss: the game says "Can you do it with fewer days?" and she keeps going (move a town, or Undo). |

Level 3 is where the proof lives: on request (**Why?**) a triangle of towns that all need different banners is highlighted ("These three are all a day apart, so they need three days"). Three levels is the first build; more maps are a later slice.

**Bands.** `grownup` levels 1 to 3, and `school` levels 1 to 2 (a larger school child can do the pre-set rounds; level 3's idea of a minimum waits). The build writes the `BandLevels` table, reads it with `rangeFor`, and gives `describeLevel` plain text for each. Both bands are decided by the build against the lands test, since a grown-up puzzle that opens to school keeps Lantern Lake as its home (the land comment already says so).

## Screen and controls

- Landscape 1024 × 768: the map fills the centre, towns at least 100 logical units across on screen after scaling, spaced on a 160-unit lattice; the banner tray along the bottom with three or four banners 100 × 100; the pet in the lower-left corner, clear of the map (`companion()` repeats the instruction). Portrait lays the same 5 × 4 lattice vertically from `view`, never from `window`.
- **Placing.** Tap a banner to select it (lift and outline on touch-down), then tap a town to set it; tap the town again to clear. A drag from a banner to a town does the same through `src/engine/drag.ts` (a refused drop floats home). Nothing needs reading.
- **Banners are never colour-only.** Each day has a **shape and a colour** (circle, square, triangle, star) and the shape is stamped on the town's post, so the puzzle is playable without colour vision. Colours come from `src/art/palette.ts`.
- **Conflict feedback.** When a banner lands next to the same banner, the two towns' shared path **wobbles red-and-dotted** and both towns shake once; nothing is removed. This is the gentle boing, spoken as "Those two are a day apart." The same banner stays placed so she can see why, and tapping the town clears it.
- Keys and a pad: arrow keys move a ring over towns in lattice order; 1 to 4 pick a banner; Enter sets; Esc goes through `App.escape()`.

## Accounting, help and finishing

- A **miss** is a placement that creates a conflict (counted once per placement, not once per conflicting pair; clearing and replacing counts again). A **hint** is a request for help. `coach.ts` counts both.
- **Hint rule.** After two misses in a round the town that the solver can complete without guessing glows (a forced town, found by the solver: a town whose banner is the same in every legal extension of what is placed). If no town is forced, the glow goes to a town in the largest group of mutually-neighbouring places, with the line "These all need different days." The Hint button does the same on request, and repeated Hint places that banner (an assisted completion, counted as a hint, never silent).
- **Dead ends.** A placement can be legal and still leave some town with no banner it may take (the solver returns no extension). That is not a conflict and not a miss. The game says "Some town has no day left" and glows that town; Undo or clearing a town fixes it.
- **Level 3 help.** **Why?** names a triangle of mutual neighbours and says why two days, and a three-banner finish, is the minimum; it is not counted as a hint (it explains, it does not place).
- **Undo** steps back one placement; **Restart** clears the player's placements and keeps the seed. Neither is counted.
- **Finish.** The last legal placement lets every town's banner flutter and the shell's celebration play; `ctx.finish({ misses, hints })` is called once. One sticker, as for every game. Nothing is kept: no creation, no journal entry, no history line beyond the shell's.

## Rule tests (`logic.test.ts`)

- The neighbour list of `fair` is exactly the thirteen pairs above, and rebuilding it for each of the four mirrors keeps the pair count and degree multiset.
- **Exhaustive count.** For the map and for each mirror: no proper 2-assignment exists; exactly 6 proper 3-assignments exist and all give one partition; 768 proper 4-assignments exist.
- `solve` returns every extension of a fixed set and is empty when the fixed set already conflicts; level 1's pre-set triangle (three mutually neighbouring towns with three different banners) fixes the labels, so exactly one completion remains.
- Dead ends are detected: for every legal partial assignment of three banners, `solve` is either empty (the dead-end line) or contains the unique answer, never anything else, checked over a sample of seeded partials.
- The hint never names a town whose banner is not forced when a forced town exists, never names a placed town, and always makes progress when applied; repeated hints finish the round.
- The conflict check marks a town if and only if a neighbour shares its banner; *done* is equivalent to "every town has a banner and none conflicts".
- Level 3 is finished exactly when the assignment is proper and uses three banners; a proper four-banner assignment is never finished, never a miss; **Why?** names a real triangle of the map.

## Ghost finger, how-to card, voice and registration

- **Ghost finger.** The `autotouch()` bot taps a banner, then a town, for each town in the solver's order, with one deliberate conflict at level 2 for the wobble, then the hint. Level 3's bot also makes one four-banner finish before moving one town to use three.
- **How-to card** (`howto.ts`, level-scoped): level 1 "Give each town a day. Towns joined by a path need different days."; level 3 "Use as few days as you can."
- **Voice lines** in `voice.ts`: the instruction the pet repeats ("Give each town a market day. Towns joined by a path need different days."), "Those two are a day apart." (conflict), "These all need different days." (hint), "Every town has its day!" (finish). Run `node scripts/content-barrels.mjs` after.
- **Registration.** `src/games/market-days/index.ts` exports a `GameModule` listed last in Lantern Lake's `games`, `challenge` set (a puzzle), skills `constraint reasoning`, `planning`, a hub icon (a market banner on a post) and a sticker art (a flag with a basket). Stable id `market-days`; no save field, no pin special case.
- **Co-play and off-screen.** Two people take turns: one gives a town its banner and the other says whether any neighbour clashes. Off-screen: draw six dots on a page, join the near ones, and colour them with three pencils so no joined pair matches.
- **Couch play.** None. The couch catalog (`src/couch/`) is a separate route and a one-player map puzzle with a selecting ring has nothing for a shared screen, so this game is not offered there. The player guide ([COUCH-PLAY](../COUCH-PLAY.md)) needs no change; a couch version, if ever wanted, would be a face-off ("who finishes first") and its own definition.

## Check tier (for the build)

New game: typecheck, unit tests (the exhaustive counts above run in milliseconds), **one** filtered scripted play of level 1 and level 3 with one wrong placement and one hint, one portrait screenshot, `fingerdemo` at level 3, the lands test (capacity and one-land) for Lantern Lake at every band, and `npm run game-docs`. `npm run build` only if shared files or assets change. Docs: the game's page `docs/games/market-days.md`, the medieval-life dive's ML4 row, a verification entry.

## Open decisions

- **Whether school gets levels 1 and 2.** The default here is yes (pre-set rounds are within reach and Lantern Lake's own note allows it); if the developer prefers a strictly grown-up puzzle, the build sets `bands: ['grownup']` and drops the school range.
- **A second and third map.** Not defined here. Each new map needs its own exhaustive uniqueness test and a chromatic number; a four-day map would be the natural level 4.
- **The one historical line.** Kept only if the build's source check supports it.
