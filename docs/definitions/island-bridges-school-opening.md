# Island Bridges — a school opening (levels 5 and 1 at child size)

Definition, 2026-11-04, branch `claude/define-island-bridges-school`. This is dive slice 5 of the [Island Bridges dive](../deep-dives/island-bridges.md#build-slices-in-order) ([younger-band openings](../deep-dives/island-bridges.md#younger-band-openings)). **Docs only:** no game change, code or device evidence. It settles what the dive left open: which levels a school player gets, the land, the 100-unit layout (cells and buttons), the accounting under "mistakes teach", the voice, the how-to card, the rule tests, the bot and the check tier. A 13 by 13 sea stays out (it needs its own definition).

## Scope and identity

**Fun action.** As built: tap the water between two numbered islands to lay a plank, until every island has its number and all the islands are joined. At school the sea is small and drawn big.

**Learning purpose.** Deduction from counts and room: an island's number against the planks it still has room for, the same named steps the grown-up hints already speak (*just enough room*, *one way left*, *one short of full*). It is a logic puzzle at the top of the school band, not a new skill for younger children.

**Standing rules applied.** S2 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)): `school` stays 6–12, older content sits at the top of school with an age note and no gate. S8: this definition's leans below are adopted. No factual content, so S1's source check has nothing to check beyond the dive's sources (Nikoli, Tatham, Malik et al.).

**What it is.** `island-bridges` gains `school` in `bands` (`['school', 'grownup']`). No new level, plan or saved ID: school plays the two existing small seas, **level 5** (5 by 5, 4–6 islands, counting finishes it, one island with a single neighbour) then **level 1** (7 by 7, 7–9 islands, counting finishes it). Level 2 and up are 9 by 9 or 11 by 11, which cannot draw at 100-unit cells (900 and 1,100 units against the 768-unit short side), so they stay grown-up only. Nothing younger than school.

**Age note.** About 9 and up, as Sprout Shuffle's school entry is noted (the dive's "about 9–12"): in the GAMES entry, the README row and the how-to card's note, never a gate.

## Levels and band orders

```ts
const LEVELS: BandLevels = {
  school: { min: 1, max: 5, order: [5, 1] },
  grownup: { min: 1, max: 7, order: [...LEVEL_ORDER] },
};
```

`entryLevels: [5]` is already declared. A school player starts at 5; two smooth rounds step up to 1; two struggling rounds at 1 step back to 5. A birthday into grown-up carries 5 or 1, both in the grown-up order. No grown-up level, order or pin changes; `describeLevel` is unchanged (it names the sea, not the band).

## Land and places

**Home land: stays Lantern Lake** (lean, adopted under S8). The game is in exactly one land, and moving it would change where every grown-up finds it. With `school` its lowest band, Lantern Lake shows it to a school player as one of her own games (beside the host, with the signpost to the twelve grown-up puzzles), and Wonder Woods, the school home spot, lists it under the Puzzle Peaks subject automatically: places pick games by subject (`gamesFor(band)` in `PlaceScene.ts`), not by land. Explore's All games and the Arcade follow `visibleIn`, so they need nothing.

This is a deliberate, narrow exception to "Lantern Lake holds only grown-up games" (the Pond Typing placement reason): a grown-up puzzle that opens its smallest seas to the school top keeps its grown-up home. The same rule serves the next opening of a Lantern Lake puzzle (Lantern Lights' school opening). The comment on `lantern-lake` in `src/content/lands.ts` changes to say so; the lands test that Lantern Lake shows older games to a lap player still holds, and the page-fit tests already cover one game plus a signpost.

## Layout at 100 units

The current touch layout (`resizeTouch`) caps a cell at 80 and floors it at 64, with buttons 108 by 76 beside the sea or 72 high beneath it. At `ctx.band === 'school'` (the band she plays at):

- **Cells:** cap 100, floor 100 (`MIN_TOUCH` becomes a per-band value: 100 at school, 64 at grown-up). Grown-up numbers are unchanged.
- **Buttons:** Take off, Hint and Start over are at least 100 by 100: beside the sea 108 wide by 100 high with 12 between; beneath it 100 high and `min(200, (w − 24) / 3)` wide (158 at 5 by 5, 200 at 7 by 7).
- **Water targets:** already big enough. The generator never puts two islands in neighbouring cells (`len` is at least 2), so every bridge has at least one whole water cell, and `edgeAt` takes the full cell across: the smallest plank target is 100 by 100.

The fit, from the actual views (a 4:3 iPad is 1024 by 768 sideways and about 1024 by 1365 upright):

| View | Sea | Beside: `min(100, (h − 56)/n, (w − 282)/n)` | Chosen | Board | Buttons |
| --- | --- | --- | --- | --- | --- |
| 1024 × 768 | 5 by 5 | 100 | beside | 500, x 201–701, y 134–634 (centred with its buttons) | x 723–831, three 100 high |
| 1024 × 768 | 7 by 7 | 100 (`floor(712/7)` = 101, `floor(742/7)` = 106) | beside | 700, x 152–852, y 34–734 | x 874–982, three 100 high |
| 1024 × 1365 | 5 by 5 | 100 | beside (stack is also 100; beside wins on `side + 8 > stack`) | 500, y 432–932 | beside |
| 1024 × 1365 | 7 by 7 | 100 | beside | 700, x 152–852, y 332–1032 | beside |

Sideways at 7 by 7 is tight (one unit of slack), so a rule test asserts it. The board never starts left of x 152, clear of the home button and the bottom-left pet as the grown-up layout already is. The view never gets shorter than 768 (`computeView` grows the spare side), so wider iPads and safe-area insets only add room. If a view ever leaves less than 100, the layout keeps 100 and the stacked arrangement, as the grown-up layout keeps its floor.

Numbers draw at `cell × 0.46` (46 units) at 100-unit cells; level 5 and 1 numbers never reach 10.

## Taps, misses and help

### Accounting

As built for grown-ups, kept at school (lean, adopted under S8):

| What she does | Counts as | Feedback |
| --- | --- | --- |
| A plank on any open stretch, in the answer or not | nothing (exploration) | the plank pops in; an island turns green when full |
| A bump: a crossing, a third plank, a full island | nothing | soft boing and `bridges.cross` (spoken each time) |
| Take off, Start over | nothing | as built |
| An island turns red (`trouble`: its number can no longer be reached) | nothing | **new at school:** the first time in a round, `bridges.trouble` once |
| Hint | one hint | the named hint as built (`full`, `every-way`, `last-way`, `next`, `fix`) |

Misses stay 0, so a school round adapts on hints alone: two rounds with two hints each step down, two rounds with none step up. A bump is a rule the board refuses, not a wrong answer about the puzzle, so two bumps light no glow; the red outline plus `bridges.trouble` is the spoken hint a stray plank earns. Hint is always there and every round can finish with hints (following every hint from an empty sea lays exactly the answer, an existing test). One sticker per finished sea, with or without help.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | When | Line |
| --- | --- | --- |
| `bridges.trouble` | school only: first red island in a round | "The red island can't reach its number now. Take a plank off a bridge next to it." |
| `bridges.done-school` | school only: the finale, instead of `bridges.done` ("A whole archipelago, joined.") | "Every island has its planks, and they're all joined!" |

The instruction stays `bridges.go-touch` (it says what to tap). The named hint lines stay as they are; whether a nine-year-old follows "Just enough room" spoken is a person check. Both new lines are on device speech until the voice script's next render.

## Co-play, off-screen, how-to and bot

- **Co-play** and **off-screen**: the built strings serve every band (one plain string each).
- **How-to card:** the steps are not level-scoped beyond 6 and 7, which school never reaches, so the steps stay; the `note` adds "At school she plays the two small seas, 5 by 5 then 7 by 7 (about 9 and up), with bigger cells and buttons."
- **Sticker:** the existing seeded sticker.
- **Bot:** `autotouch` lays the answer through `waterOf(layout, cell, …)` with the scene's own cell, so it plays at 100 without change; `fingerdemo` at school level 1 proves it.
- **Couch:** unchanged. `COUCH_IDS`, the trip stop (levels 1–3) and both courses are grown-up couch content and do not read `bands`.

## Rule tests the build needs

1. `levels('school')` is `{ min: 1, max: 5, order: [5, 1] }`; `levels('grownup')` is unchanged; no other band is listed.
2. A pure layout helper (moved out of `resizeTouch` into `logic.ts` or a small `layout.ts`) returns, at school, cells and three buttons of at least 100 in both directions for sizes 5 and 7 at 1024 × 768 and 1024 × 1365, all inside the view and with the board's left edge at 152 or more; at grown-up it returns today's numbers for sizes 5, 7, 9 and 11.
3. Every level-5 and level-1 sea over 300 seeds per level has at least one water cell on every edge (the 100-unit plank target).
4. `registry.test.ts` (the grown-up-only list near line 311) drops `island-bridges` and a new case checks its bands are `['school', 'grownup']`.
5. The lands tests pass with the game in Lantern Lake at school (one game and a signpost on the page).
6. `bridges.trouble` and `bridges.done-school` exist in the voice script.

## Settled and open

**Settled here:** school plays levels 5 then 1 (order `[5, 1]`), no new level; home stays Lantern Lake, Wonder Woods lists it by subject; 100-unit cells and buttons at school only; accounting as built (misses 0, hints adapt), plus a once-a-round trouble line and a child's finale line; about 9 and up; couch unchanged.

**Open, not blocking:** a third school level between 1 and 2 (an 8 by 8 sea would be 800 units, past the short side; a 7 by 7 with 10–12 islands is possible later if level 1 proves easy for her); a lighthouse or gulls dressing (the dive's note).

## Device and person checks

- Whether a nine-to-twelve-year-old finishes the 5 by 5 sea from the spoken instruction and the card alone.
- Whether the named hint lines help a child or need a plainer school wording.
- Whether 100-unit cells at 7 by 7 sideways feel cramped beside the buttons on an iPad.

## Build order and check tier

Unblocked (needs nothing else). **New entry on the existing interaction, with a layout change:** typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 5 with a stray plank (the red outline and `bridges.trouble`) and one hint, then level 1 to the sticker, one portrait screenshot of the 7 by 7 sea at school, a logged 1024 × 768 layout check that the cells and buttons are at least 100, and `fingerdemo` at school level 1. One build for the voice lines.

Files expected: `src/games/island-bridges/index.ts`, `logic.ts` (or `layout.ts`) and their tests, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.
