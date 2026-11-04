# Lantern Lights — a school opening (levels 1 and 2)

Definition, 2026-11-04, branch `claude/define-lantern-lights-school`. This is dive slice 4 of the [Lantern Lights dive](../deep-dives/lantern-lights.md#build-slices-in-order) ([younger-band openings](../deep-dives/lantern-lights.md#younger-band-openings)). **Docs only:** no game change, code or device evidence. It settles what the dive left open: which levels a school player gets, the land, whether the layout reaches 100 units, the accounting under "mistakes teach" when no press is wrong, a child's spoken instruction, whether a footprint preview is needed, the how-to card, the rule tests, the bot and the check tier.

## Scope and identity

**Fun action.** As built: tap a lantern on a small pond at dusk; it and the lanterns right beside it flip, lit to dark or dark to lit, until every lantern glows.

**Learning purpose.** Cause and effect with a rule she can see, then planning with it: a press flips a fixed little shape, pressing the same lantern twice puts it back, and the order never matters. At school this is an experiment game: try a press, watch what flips, undo or press again.

**Standing rules applied.** S2 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)): `school` stays 6–12, a note gives the age, nothing gates. S8: this definition's leans below are adopted. No factual content, so S1 has nothing to check.

**What it is.** `lantern-lights` gains `school` in `bands` (`['school', 'grownup']`). No new level, plan or saved ID: school plays the two existing 3 by 3 levels, **level 1** (three ponds, two presses each) then **level 2** (three ponds, three or four presses). The 4 by 4 levels (3–4) would also draw at 116-unit cells, but sixteen winning sets and longer plans are a different step; they stay grown-up until a person has watched a child finish level 2 (open, below). Nothing younger than school: under six, a press that also flips its neighbours is a rule to be told, not discovered, and the misses-0 accounting gives adaptation nothing to read.

**A fact the build relies on.** Every 3 by 3 board has exactly one winning set (the 3 by 3 press matrix is invertible over two numbers), so on every school pond the fewest presses equals the scramble (2 at level 1; 4 at level 2, whose `atLeast: 3` therefore never rejects), `solve(...).ways === 1`, and following the hint from the start lights the pond in exactly that many presses. Batch 2's named hint will therefore always speak its one-way line at school; the school build does not depend on batch 2.

**Age note.** About 7 and up: the first pond takes two presses and every tap shows its effect, gentler than Island Bridges' "about 9 and up", but finishing level 2 means holding a small plan. In the GAMES entry, the README row and the how-to card's note, never a gate.

## Levels and band orders

```ts
const LEVELS: BandLevels = { school: { min: 1, max: 2 }, grownup: { min: 1, max: 8 } };
```

No `order` and no `entryLevels`: the school ladder is simply 1..2. A school player starts at 1; two smooth rounds step up to 2; two struggling rounds at 2 step back to 1. A birthday into grown-up carries 1 or 2, both in the grown-up range. No grown-up level, plan, name or pin changes; `describeLevel` is unchanged (it names the pond, not the band). If batch 3 lands first the grown-up max is 9; the school row does not change.

## Land and places

**Home land: stays Lantern Lake**, under the rule the [Island Bridges school opening](island-bridges-school-opening.md#land-and-places) settled: a grown-up puzzle that opens its smallest boards to the school top keeps its grown-up home, and that definition names this opening as the next case. Lantern Lake then shows the game to a school player as one of her own (beside the host, with the signpost to the other grown-up puzzles). Wonder Woods, the school home spot, lists it under the Puzzle Peaks subject automatically: places pick games by subject (`gamesFor(band)` in `src/app/scenes/PlaceScene.ts`), not by land. Seventeen Puzzle Peaks games already list `school`, so the place pages as it already does; it never shrinks. Explore's All games and the Arcade follow `visibleIn` and need nothing.

Whichever of the two school openings is built first rewrites the comment on `lantern-lake` in `src/content/lands.ts` ("Every game here is for the `grownup` band") to name the exception; the second adds its game to it. The lands test that a lap player sees older games in Lantern Lake still holds.

## Layout at 100 units: no change

The view is the 1024 by 768 design rectangle grown on its spare side (`computeView`): 1024 × 768 sideways and about 1024 × 1365 upright on a 4:3 iPad, never less than 768 high. Today's `resize()` gives a cell of `min(116, floor((h − 262) / n))` beside the counts, and the counts sit beside the pond whenever the room there is at least 240. At 3 by 3:

| View | Cell | Pond | Counts | Buttons (`tile(160, 100)`, centres 180 apart) |
| --- | --- | --- | --- | --- |
| 1024 × 768 | 116 (`floor(506/3)` = 168, capped) | 348, x 338–686, y 112–460 | beside (338 of room), x 836 | y 488–593; x 252–412, 432–592, 612–772 |
| 1024 × 1365 | 116 | the same | beside | the same |

So every lantern is a 116 by 116 target (the tap layer resolves by cell) and every button is 160 by 100 with 20 between, already above the 100 floor; the left button starts at x 252, clear of the bottom-left pet as at grown-up level 1 today. **No layout code changes.** A rule test cannot reach `resize()` without Pixi, so the build logs the numbers once at 1024 × 768 instead of extracting a helper.

## Taps, misses and help

### Accounting

As built for grown-ups, kept at school (lean, adopted under S8):

| What she does | Counts as | Feedback |
| --- | --- | --- |
| Any press | nothing (no press is wrong; decided 2026-10-23) | the lantern and its neighbours turn at once, a pop each |
| Undo, Start over | nothing | as built |
| Hint | one hint | the glowing lantern and `lantern.hint` ("Try the glowing lantern.") |
| **New at school:** presses on one pond reach the fewest plus six (8 at level 1, 10 at level 2) and the pond is not lit | nothing | once per pond, `lantern.stuck-school` |

Misses stay 0, so a school round adapts on hints alone: two rounds with two hints each step down, two with none step up. A long wander with no hint still counts as smooth; that is the recorded decision, and the nudge is what keeps it from being lonely. The nudge counts nothing, lights no glow by itself and is not a miss; it only says where help is. Asking for hints repeatedly finishes any pond (each hint lowers the fewest by one, an existing property). One sticker per finished round, with or without help.

### Footprint preview: not added

The dive asked whether a child needs a hold that glows the five cells before release. **Lean, adopted: no.** `onTap` presses on touch-down, which is the immediate feedback the rules ask for; a preview would turn one tap into hold-then-release and make a quick tap feel dead. The footprint is learned the way the game is meant to be: press, see, and Undo (free) or press the same lantern again (its own undo). The ghost finger on the how-to card shows a press before she plays. If the person check below finds a child confused about what flips, the couch cursor's glow (drawn in `update()` in `index.ts`, which already marks a press's footprint) is the reusable piece for a later preview; not in this build.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | When | Line |
| --- | --- | --- |
| `lantern.go-school` | school only: the first instruction (through `ctx.instruct`, so the pet repeats it), instead of `lantern.go-touch` | "Tap a lantern. It flips, and so do the lanterns right next to it. Make every lantern glow!" |
| `lantern.stuck-school` | school only: once per pond, at the fewest plus six presses | "Tricky one! Tap the button with the diamond, and a lantern will glow to show you where." |

The grown-up instruction says "the four lanterns beside it", which is wrong for a corner (two) or an edge (three); on a 3 by 3 pond that is eight of nine lanterns, so a child's line must not count them. The nudge names the Hint button by its ◇ mark, so finding help never depends on reading the label. `lantern.lit` and `lantern.done` ("A pond full of light.") serve a child as they are. Both new lines are on device speech until the voice script's next render.

## Co-play, off-screen, how-to and bot

- **Co-play:** the built string says "the four beside it"; the build changes it to "Tap a lantern to flip it and the ones beside it. Talk about which press would light the most." (one string for every band). **Off-screen:** unchanged (coins in a grid).
- **How-to card:** step 1 becomes "Tap a lantern to flip it and the lanterns above, below and beside it." (the same counting fix); the 6 by 6 step is scoped `from: 7` and never shows at school; the `note` adds "At school she plays the two 3 by 3 ponds (about 7 and up). If she presses a lot without lighting the pond, she is told where Hint is; that counts nothing."
- **Sticker:** the existing seeded sticker.
- **Bot:** `autotouch` taps `hintFor`'s lantern through `center()` with the scene's own cell, so it plays at school unchanged; `fingerdemo` at school level 2 proves it.
- **Couch:** unchanged. `COUCH_IDS`, the trip stops (`[1, 2, 3, 3, 4, 5]`) and the course *Dusk on the Pond* are grown-up couch content and do not read `bands`; the nudge and school instruction read `ctx.band`, which couch play never sets to school.

## Rule tests the build needs

1. `levels('school')` is `{ min: 1, max: 2 }` with no `order`; `levels('grownup')` is unchanged; no other band is listed.
2. Over 300 seeds per level, every level-1 and level-2 pond is 3 by 3 with `solve(...).ways === 1` and a fewest of exactly 2 (level 1) or 4 (level 2).
3. On those ponds, pressing `hintFor`'s lantern from the start until lit takes exactly the fewest presses.
4. A small pure helper for the nudge (`stuckAt(par)` returning `par + 6`, or a `shouldNudge(presses, par, told)` predicate in `logic.ts`) fires once per pond at 8 and 10 (from `Pond.par`) and never at grown-up.
5. `registry.test.ts` (the grown-up-only `ids` list near line 311) drops `lantern-lights`, and a case checks its bands are `['school', 'grownup']`.
6. The lands tests pass with the game in Lantern Lake at school.
7. `lantern.go-school` and `lantern.stuck-school` exist in the voice script, and the how-to card test still passes (no level-relative wording).

## Settled and open

**Settled here:** school plays levels 1 and 2 (3 by 3), no new level; home stays Lantern Lake by the Island Bridges rule, Wonder Woods lists it by subject; no layout change (116-unit cells, 160 by 100 buttons); accounting as built (misses 0, hints adapt) plus a once-a-pond spoken nudge toward Hint at the fewest plus six; a child's instruction that does not count neighbours; no footprint preview; about 7 and up; couch unchanged.

**Open, not blocking:** level 3 (4 by 4) at school if level 2 proves easy for her; a footprint preview if a child cannot tell what flips.

## Device and person checks

- Whether a seven-year-old finishes a level-1 pond from the spoken instruction and the card alone, and whether she notices that a press also flips its neighbours.
- Whether the nudge arrives too early or too late (six presses past the fewest), and whether she finds the ◇ button from it.
- Whether level 2 (four presses) is a fair top for a school child or level 3 should open.

## Build order and check tier

Unblocked (needs nothing else; it shares `LEVELS` and `index.ts` with batches 2 and 3 and the `lantern-lake` comment and the `registry.test.ts` grown-up list with the Island Bridges school opening, so whichever lands second rebases). **New band entry on the existing interaction, no layout change:** typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 1 with one hint and enough extra presses on a pond to hear `lantern.stuck-school` once, then level 2 to the sticker, one portrait screenshot of a 3 by 3 pond at school, a logged 1024 × 768 check that cells and buttons are at least 100, and `fingerdemo` at school level 2. One build for the voice lines.

Files expected: `src/games/lantern-lights/index.ts`, `logic.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.
