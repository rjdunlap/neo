# Fence the Field

<!-- generated: from src/games/fence-the-field; edit the text below the end mark (npm run game-docs) -->

**ID:** `fence-the-field` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** looking ahead, counting what a move gives away, strategy

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Close it: claim the plots that are ready, then play out the field |
| 2 | Don't hand it over: find the rail that makes no plot ready |

<!-- end generated -->

**Starts as:** dots and boxes against the pet on a field of nine plots that is already part-fenced. At level 1 (*Close it*) a plot has three rails: lay the fourth to claim it and go again, then play the field out. The strip says how many plots she can get against the pet's best play.

**Grows into:** level 2 (*Don't hand it over*), where no plot is ready and the sound rail is the one that leaves every plot with two rails or fewer. Levels 3–4 (*Smallest first*, *Leave two*) are defined and their start positions are generated, but they are not registered yet (batch `fence-the-field 2`).

## Design notes

- [Definition](../definitions/fence-the-field.md). The rules, the solver, the four level tests and the hints are in `logic.ts`; the layout and the touch-to-rail rule in `layout.ts`. `pools.json` holds 60 start positions a level, one per symmetry class, written by `node scripts/fence-the-field-pool.mjs`.
- A rail that costs a plot is laid, the pet's best answer plays rail by rail, and the field steps back to before it. Each different costly rail at a position is one miss; the second miss of a round, or Help, glows one sound rail with its line (one hint each, free when asked again at the same position). The pet only ever lays sound rails, so a finished round always ends on her target.
- The whole field is one touch surface: a touch on a rail's target (half a plot square) lays that rail, and a touch inside a plot lays the plot's nearest open rail.
- Upright the plots are 200 units (rail targets 100) on phones tall enough for the caption strip. On a short phone the caption is a bubble over the view, so the field shrinks to keep its rails above it, never under 64-unit targets.
