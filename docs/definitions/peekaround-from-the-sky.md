# Peekaround Island — From the sky (level 8): which map shows the island from above?

Definition, 2026-11-03, branch `claude/define-peekaround-from-the-sky`. This is dive slice 5 of the [Peekaround Island dive](../deep-dives/peekaround-island.md#build-slices-in-order). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the level's number and band, the round, the maps and their two wrong kinds, the accounting, the layout, the art, the voice IDs, the rule tests, the bot and the check tier. The block-tower **Skyline View** stays a sketch (see [Settled and open](#settled-and-open)).

## Scope and identity

**Fun action.** Friends stand around the big tree; one may be hiding behind it. Three little maps hang above the island, each a round island seen from the sky with the tree's crown in the middle and a tiny face for each friend. She taps the map that shows the island from above, from her side. A right map rises like a bird's view and the hidden friend waves: from the sky you can see everyone, even behind the tree.

**Learning purpose.** Moving from a side view to a view from above: the friend *in front of* the tree is at the bottom of the map, near her; *behind* is at the top; the sides stay on their own sides. It bridges the game's position words to the maps of Treasure Map, and it is the island version of the "view from above" question that Sunburst's *Building Perspective* asks with towers ([area-volume-space study](../deep-dives/subjects/area-volume-space.md)).

**Standards and research (from memory and search summaries, not re-opened this session).** NCTM's *Principles and Standards* (2000), Pre-K–2 geometry: "recognize and represent shapes from different perspectives" and find locations on maps; the C3 Framework's D2.Geo.1.K-2 (construct maps and other representations of familiar places). Blaut, McCleary and Blaut (1970) report five-year-olds naming landmarks on vertical aerial photographs without having seen one before, and Blaut and Stea's "Mapping at the age of three" (1974) has preschoolers using toy-model maps; Liben and Downs argue the skill grows with experience rather than being simply present (their 1997 *Annals of the AAG* forum with Blaut, read only as search summaries). That puts a picture-map choice within reach of the school band, with the left/right mirror as the classic error worth naming.

**What it is.** Level 8 of `peekaround-island`, for **school only** (school range 4–8). Pre-K stays at max 7. It adds no new game, land or band. It is built **after batch peekaround-island 4** (level 7 *What does the duck see?*), so that 6 and 7 keep the numbers their batches already use; `PLANS` is indexed by level and cannot have gaps. It does not need level 7's render textures: the maps are drawn directly in `Graphics`.

## The rule

Spot facings are the game's own (`whereIs`, `spotFacing` in `logic.ts`): facing 0 is in front (her side), 1 is to her right, 2 is behind the tree, 3 is to her left. Level 8 never turns the island for the answer (`turns` stays 0 between scenes, as in levels 3–5).

A **map** is an arrangement: which friend (or flower) sits at each facing, drawn on a circle seen from above with **her side at the bottom**. The island's own projection already does this: `at(s)` puts a spot at `x = sin(f·π/2)·r`, `y = cos(f·π/2)·r` (down is toward her), so the map uses the same formula with a circle (`r` on both axes) instead of the side view's ellipse. The right map is the island as it stands.

Each scene shows three maps, shuffled:

| Map | What it is | Why it is wrong |
| --- | --- | --- |
| **True** | The island from above, her side at the bottom | — |
| **Mirror** | Left and right swapped (`x` negated: facings 1 and 3 trade) | The friends to her left and right changed sides; the classic error of copying a view face to face |
| **Turned** | Everything a quarter turn round (facing `f` becomes `f + k`, `k` = 1 or 3, seeded) | The island from above, but as if someone at the side were looking; the right shape from the wrong side |

The four coloured flowers (`spot: i + 0.5`) are drawn on every map at their half-spot places and move with the same transform, so each wrong map is a true picture of a wrong viewpoint, never a scramble.

## The round

Three scenes, `rounds: 3`, mode `'sky'`, plan name *"From the sky: which map shows the island from above?"*

1. **Everyone in sight.** Three friends, on front, left and right; behind is empty. Pure map reading.
2. **One behind the tree.** Three friends, one behind the crown (hidden from her side), the empty spot a side. The pet says who is hiding before the question.
3. **A full island.** Four friends, one behind.

Generation rules (`makeSkyScene(index, rng, lastHider)` in `logic.ts`):

- Friends are distinct, and no scene holds two friends of one body colour on the maps: never cow with bunny (white) or dog with bear (brown), so every dot reads as one friend.
- Scenes 1–2: both side spots are filled, so the mirror always differs from the true map. Scene 2 puts its empty spot on a side and so fills front and behind; its mirror then moves one friend across (still different, which the rule test checks).
- The hidden friend never repeats back to back (the level's existing `lastHider` habit).
- The three maps are pairwise different arrangements, and exactly one equals the island.

## Taps, misses and help

- **Right map:** it pops and grows a little; a soft whoosh plays; the hidden friend (scenes 2–3) hops at the crown's edge; the pet says `around.sky.right`. The next scene follows the existing scene transition (`clearIsland`).
- **Mirror map (a miss):** a boing; the two side friends hop; the pet says `around.sky.mirror` with their names (scene 2's mirror, with one side empty, uses `around.sky.mirror.one` naming the friend that moved).
- **Turned map (a miss):** a boing; the island turns `k` quarter turns so the island now matches that map, the pet says `around.sky.turned`, and the island turns back. Busy during both turns. This reuses level 6's turn-to-viewer helper.
- **Two misses** ring the right map and say `around.sky.hint` (look for the friend in front of the tree: on the map it is next to the boat). One hint per scene; a ring stays until the right tap.
- A tap on the island, the tree or a friend at level 8 is free: a friend hops and makes its sound, never a miss, never a turn.

### Accounting

Misses: each wrong map. Hints: the ring after two misses (`this.hints++` in the existing `hint()`). Both feed adaptation as usual; the turned map's demonstration turn is part of the miss's feedback, not a hint. With two wrong maps per scene the most a scene can cost is two misses and one hint, and the ring then leaves only one card to tap.

## Level number and band orders

| Band | Before | After |
| --- | --- | --- |
| school | 4–7 (after batch 4) | 4–8 |
| pre-K | 3–7 (after batch 4) | unchanged |

Plain `min..max`; no `order` needed. `describeLevel(8)` is the plan name.

## Art (code-drawn, `Graphics`, palette colours)

- **Map card:** a 170-unit cream square (`cream`, `wood.line` border, 22 rounded), like level 3's picture tiles at a larger size; a parchment tint is optional (match Treasure Map's if it is exported, otherwise `cream`).
- **On the card:** a green circle of radius 64 (`swatch.green.light`, `swatch.green.line`) for the island; a crown circle of radius 22 (`swatch.green.fill`) for the tree from above, with one red apple dot; each friend a small `Critter` head (`alive = false`, scale about 0.13) at radius 46; each flower a 7-unit dot in its colour at radius 46 between spots.
- **Her side:** a small rowboat at the bottom edge of every card, and the same boat moored at the front of the island in the scene at level 8 (it stays at the front, since level 8 does not turn for the answer; during a turned-map demonstration it turns with the island and comes back). The boat is the "you are here" mark that ties the maps to her side; no words.
- **Right map moment:** a cloud puff and two birds drift across the top for the "bird's view", reusing `puffs` from `src/art/shapes.ts`.

No textures are created, so nothing new to free in `destroy()`.

## Layout and presentation

The view's design area is 1024 wide in every orientation. The three cards stand in a row at the top, centres from `spread(3, 200, view.w - 200, 190)`, tops at y = 30 (cards 30–200). The tree's crown reaches 335 units above the island's centre, so **at level 8 the island's centre is `max(0.6·h, 545)`**: in landscape (h 768) the crown's top is at 210, clear of the cards, and the island's shadow ends near 731, above the bottom edge; in portrait 0.6·h already clears. The bottom-left pet and corner buttons keep their usual clearance (the island spans x 152–872 at its shadow, as at other levels). Cards are 170 units, above the 100-unit minimum; hit areas are the whole card plus 4 units. Arrows stay hidden (level 8 is not a turning level).

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | Line | Slots |
| --- | --- | --- |
| `around.sky` | "Which map shows the island from the sky? The boat is where you are." | none (V1 clip possible) |
| `around.sky.hidden` | "Shh! The {who} is hiding behind the tree." | who |
| `around.sky.right` | "Yes! From the sky you can see everyone, even behind the tree!" | none |
| `around.sky.mirror` | "On that map, the {a} and the {b} swapped sides." | a, b |
| `around.sky.mirror.one` | "On that map, the {who} went to the other side." | who |
| `around.sky.turned` | "That map is from the side. The island has to turn to look like that!" | none |
| `around.sky.hint` | "Find the friend in front of the tree. On the map, it is next to the boat." | none |

`around.sky` is the instruction (`ctx.instruct`), repeated by the corner guide. Every slotted line stays on device speech under V1. All lines name "the tree", as the game's lines must.

## Co-play, off-screen, how-to and bot

- **Co-play:** a grown-up stands a toy behind a cup on the table and draws the table from above on paper with her: which side is the toy?
- **Off-screen:** look down at a toy from a chair, then from the floor; draw the bath or a plate from above.
- **How-to:** one step scoped `from: 8`: "Tap the map that shows the island from the sky. The boat is your side." The demo uses the bot.
- **Bot:** `peekTouch` gains `'sky'`, returning `{ kind: 'map', index }` for the true map; `touchFor` taps that card. Rule-tested like the other modes.

## Rule tests the build needs

Across many seeds:

1. Every scene shows three pairwise different maps, exactly one of which is the island's own arrangement (`whereIs` at `turns = 0`).
2. The true map puts the front friend at the bottom (`y > 0`), the behind friend at the top, facing 1 on the right and 3 on the left, using the same projection as `at()`.
3. The mirror trades facings 1 and 3 only; the turned map adds `k ∈ {1, 3}` to every facing, including the flowers'.
4. Scene 1 has no friend behind; scenes 2 and 3 have exactly one, and it is named; scene 3 has four friends.
5. No scene holds cow with bunny or dog with bear; the hidden friend never repeats back to back.
6. Turning the island `k` quarter turns makes the island's arrangement equal the turned map (so the demonstration is honest).
7. `peekTouch('sky', …)` returns the true map's index; the school range is 4–8 and pre-K's still ends at 7.

## Settled and open

**Settled here:** level 8, school only, after batch 4; two named wrong kinds (mirror and turned); the flowers move with each map; her side marked by a boat; no turning for the answer; the turned miss demonstrates by turning; accounting as above; the landscape layout rule.

**Skyline View (the block-tower version):** stays a sketch. It needs drawn block plots seen from the front and the side and a new scene (M in the study), and its question (build the top view from two side views) is harder than reading the island from above. Judge it after a person has seen a six-year-old play level 8: if the mirror and turned maps are both easy for her, the tower version is the next rung; if the mirror stays hard, more island scenes come first.

**Open, not blocking:** whether a fourth card (the island seen from behind, i.e. a half turn) is wanted at a later step; whether pre-K should get level 8 through an `order` (default no: the research above puts confident map reading at about five to six, and pre-K's window already has 6 and 7 for perspective).

## Device and person checks

- Whether she reads the boat as "my side" without being told twice.
- Whether the small critter heads read on a 170-unit card at arm's length on the iPad.
- Whether the turned-map demonstration (two turns) feels calm or too long.

## Build order and check tier

After batch peekaround-island 4. **New-interaction tier:** typecheck, rule tests, one scripted play of level 8 with a mirror map (a miss), a turned map (a miss, the island turns and back), the ring, then the right map, one portrait screenshot of the three maps, a logged landscape check that the crown's top clears the cards, and `fingerdemo` at 8. No build needed (no assets or shared files).

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.
