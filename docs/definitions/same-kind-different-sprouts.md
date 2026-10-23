# Critter Sort levels 12–13: Same Kind, Different Sprouts (definition)

Defined 2026-10-22 on `claude/define-same-kind-sprouts` ([PR #772](https://github.com/rjdunlap/neo/pull/772)) as slice **G4** of the [genetics study](../deep-dives/subjects/genetics.md#build-slices-in-order). It draws on the study's [audience table](../deep-dives/subjects/genetics.md#an-answer-for-every-audience), its [candidate row](../deep-dives/subjects/genetics.md#candidates-and-overlap-decisions) and its [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#genetics-recommendations). **Built 2026-10-23** on `claude/critter-sort-sprouts` ([PR #865](https://github.com/rjdunlap/neo/pull/865)): levels 12–13, plant art, `sort.plant.*` voice lines and how-to lines ([checks](../VERIFICATION.md#2026-10-23--critter-sort-levels-1213-same-kind-different-sprouts-g4)). It was one same-game batch, [critter-sort 1](../GAME-BATCHES.md#critter-sort-1-same-kind-different-sprouts). Every [open decision](#open-decisions) has a default the build uses.

**What it adds:** two appended levels of `critter-sort` (`src/games/critter-sort/`) that sort **little plants grown from one big plant's seeds**. The family is always stated, never deduced. Level 12 *Like the big plant* uses one hoop and one feature. Level 13 *Same and different* uses overlapping hoops, the big plant's leaf shape on one and its petal marks on the other. Six little plants share some of the big plant's features and differ in others.

**Learning goal:** young plants are like their parent plant, but not exactly like it, and plants of the same kind still differ from each other. This is NGSS [1-LS3-1](https://www.nextgenscience.org/pe/1-ls3-1-heredity-inheritance-and-variation-traits) (observe similarities and differences; the standard's assessment boundary excludes inheritance mechanisms), as the study's [anchors](../deep-dives/subjects/genetics.md#anchors-and-evidence-limits) set it. **No mechanism is taught or implied.** No copies, tiles, "because", chance or prediction appear, and the game never claims a child understands inheritance. What it shows is that siblings differ, and that a feature can match the big plant or not.

## Ownership: Critter Sort, not Photo Safari

The study left the owner to the [actual action](../deep-dives/subjects/genetics.md#candidates-and-overlap-decisions). Checked against `origin/main` at `40b7ae38`, using both deep dives and the games' `logic.ts`.

| Game | Its action | Fit |
| --- | --- | --- |
| **Critter Sort** (Barnyard; pre-K 1–6, school 2–11) | Drag many individuals into hoops whose picture signs name a visible feature; overlapping hoops, a leaf mat for "neither", spoken reasons, a worked example, a mat-aware hint and a ghost finger | **Chosen.** Comparing a whole family against one shown reference is "put every one that matches here". Its Venn already says "shares this, shares that, both, neither", which is the same/different comparison. Nothing new needs inventing except the cast and its signs |
| **Photo Safari** (lap–school) | Tap the single animal matching a spoken request; listening vocabulary | Its rounds need exactly one match per request, while a family comparison has several matches and several non-matches. A "photo of the plant with spots like its parent" turns the comparison back into a single-answer search |
| **Garden Grow** | Plant needs and growth | Keeps the later conditions comparison (G8, *Growing Conditions*). This packet shows no growing and makes no environment claim |
| **Sprout Shuffle** (defined, G1) | Combine copies from two parents | Owns the mechanism at the top of school. This packet is its observational foundation and shares its petal-mark art language, but never its tiles or rules |

**Bands covered:** pre-K (K, 4–5) and school (S, 6–8), the study's "labeled plant-family album" and "inspect records" rows. Toddler and preschool comparisons stay unbuilt. Critter Sort has no preschool row ([its decision 1](../deep-dives/critter-sort.md#decisions-for-the-developer)), and the study says a younger opening needs a child observed first. Nothing here opens a band.

## The plant set

The plants are invented garden flowers, drawn with Pixi `Graphics` in `palette.ts` colours. They are not real species. The cast is one **big plant** and its **little plants**. In this game every plant, big or little, has exactly two sortable features, each with two values:

| Feature | Values | Drawing (shape carries the meaning; colour never does) | Spoken words (sign phrase, `FEATURE_WORDS`) |
| --- | --- | --- | --- |
| Leaves | `round` / `pointy` | Two broad leaves on the stem: round ovals, or long leaves with a sharp tip. Outlined, and at least 40 units long at play scale | "with round leaves" / "with pointy leaves" |
| Petal marks | `spotted` / `plain` | Five petals, each with three dark oval marks or empty, as in [Sprout Shuffle's art](sprout-shuffle.md) | "with spotted petals" / "with plain petals" |

**Decoration that carries no meaning:** the flower pot's colour and a small seeded tilt. Pots let two little plants with the same features be told apart and dragged separately. A pot is not part of the plant, so its colour makes no biological claim. Petal colour is **one colour per family** (seeded per round, from cream, pink or yellow), so colour is never a third difference she might expect a hoop to sort. Leaf colour is always the same green.

**Left out on purpose:** height, size and number of flowers, which depend on growing conditions (study: NGSS 3-LS3-2; that belongs with Garden Grow's G8). Also out: real species, a second parent, pollen, "mother/father" words, any "better/worse" plant, and any animal family. No human family resemblance, ever.

**Art reuse:** one function, `drawPlant(g, { leaves, petals, petalColor, potColor, big })`. It goes in the game's own file unless Sprout Shuffle is built first, in which case both games share it from `src/art/plants.ts`. A little plant has the same on-screen footprint as a critter at `SCALE`. The big plant is drawn 1.6 times larger in a wider pot, with a small cream tag showing a seed packet picture.

## Bands and ranges

| Band | Now | After | Where it sits |
| --- | --- | --- | --- |
| `prek` | `{ min: 1, max: 6, order: [6, 1, 2, 3] }` | `{ min: 1, max: 13, order: [6, 1, 12, 2, 3, 13] }` | 12 follows the one-hoop level 1; 13 follows the overlapping-hoop level 3 |
| `school` | `{ min: 2, max: 11, order: [2, 3, 4, 5, 7, 8, 9, 11] }` | `{ min: 2, max: 13, order: [2, 12, 3, 13, 4, 5, 7, 8, 9, 11] }` | The same pairing: each new level sits beside the critter level with the same diagram |

IDs 12 and 13 are appended. ID 10 stays reserved for *Pick the signs*. Nothing is renumbered, and saved levels and pins are unchanged. A child already past 2 or 3 on the school ladder is not moved back; adaptation can reach 12 or 13 on a step down or a pin. `entryLevels` stays `[6]`. The registry's order test must still find every ID inside `min..max`.

## A round, step by step

Both levels play **two rounds** (one sticker for the level), and each round gets a new seeded family. A round fixes the big plant's features (`parent: { leaves, petals }`) and six little plants (four at level 12), then derives the hoops' rules from the parent.

### Level 12 *Like the big plant* (one hoop)

1. The big plant stands at the top centre beside the hoop sign. It is decoration only (`eventMode = 'none'`, never a drop target) and stays clear of the shell's top corners. The sign shows **one** of the big plant's features as a picture: its petal (spotted or plain) in round 1, its leaf (round or pointy) in round 2. The order is seeded.
2. Four little plants wait on the grass, one already in the hoop as the existing worked example (`example: true`). Exactly **two or three** of the four match the sign, including the example (`fitting` is not used). At least one does not match.
3. Spoken (`sort.plant.one`): "These little plants grew from the big plant's seeds. Put every little plant {a} in the hoop, like the big plant!" Here `{a}` is the sign phrase ("with spotted petals").
4. She drags each matching plant into the hoop. Non-matching plants **may stay on the grass**, as at level 1. There is no leaf mat, so pre-K has no extra place to learn. The round ends when every matching plant is in.
5. End line (`sort.plant.family`): "They all grew from the same big plant. Some look like it, and some look different!"

### Level 13 *Same and different* (overlapping hoops)

1. The big plant stands above the diagram. The left sign shows its **leaves** and the right sign its **petal marks**, so the middle means "like the big plant both ways" and the leaf mat means "different both ways".
2. Six little plants, one already in the middle (the worked example). **All four parts are present** in every round, so at least one little plant is in each of left only, right only, middle and the leaf mat. Two little plants may share both features, and their pots tell them apart.
3. Spoken (`sort.plant.venn`): "These little plants grew from the big plant's seeds. One hoop is for little plants {a}, like the big plant. The other is for little plants {b}, like the big plant. Little plants like it both ways go in the middle. Little plants that look different both ways go on the leaf mat."
4. Everything else is the existing `venn` behaviour with the explicit leaf mat: an exact place for every plant, completion when all six are placed, and the mat-aware hint and bot.
5. End line: `sort.plant.family`, then the existing `sort.done`.

## Misses, hints and glow

Unchanged from Critter Sort's existing rules, re-voiced for plants:

- A drop in the wrong part is **one miss**, a boing and a spoken reason naming what the plant has and what the big plant has. "This little plant has pointy leaves. The big plant has round leaves." (`sort.plant.isnot`, `{have}` and `{parent}`). In the middle: "This little plant has round leaves and spotted petals, like the big plant both ways. It goes in the middle!" (`sort.plant.both`). On the leaf mat: "This little plant looks different both ways. It belongs on the leaf mat!" (`sort.plant.mat`).
- Putting a plant back on the grass is free. Dropping a non-matching plant anywhere outside the hoop at level 12 is free, as at level 1.
- Two wrong drops in a row light the existing `hintFor` glow on the plant just missed and its correct part. That counts **one hint**, as today.
- The pet never tells her the plant is "wrong" or "not part of the family". Every little plant belongs to the family; only the hoop changes.

## Logic (`logic.ts`)

- Add `SortSprout { leaves: 'round' | 'pointy'; petals: 'spotted' | 'plain'; pot: number }` and a `PlantRule = 'round' | 'pointy' | 'spotted' | 'plain'` with `FEATURE_WORDS`. `fitsPlant(s, rule)` is a direct feature test. `placeOf`, `hintFor`, `nextToSort` and `spotFor` are generalised over a `fits` function (or the round holds a `fitsAt(i, rule)` closure). Their behaviour on critters is unchanged, which the existing tests prove.
- `SortPlan` gains `cast?: 'plants'`. The two plans are a `SPROUT_PLANS` table read by `planFor(12)` and `planFor(13)`, beside `COUNT_PLAN`; `PLANS` indices never move.
- `makePlantRound(plan, rng, avoid?)` picks the parent's features and the family colour, then the little plants. At level 12 the sign is the parent's petal value (round 1) or leaf value (round 2), in seeded order. At level 13 the rules are `[parent.leaves, parent.petals]`. The round retries until its stated constraints hold (as `makeRound` already does). `avoid` stops round 2 repeating round 1's parent.
- The bot and the ghost finger use `nextToSort` unchanged.

## Rule tests (`logic.test.ts`)

1. **Truthful signs.** Every sign shows a feature value the round's big plant actually has, at both levels and over seeds 0–199.
2. **The family varies.** Every level-12 round has 2–3 matching little plants out of 4 (example included) and at least one non-match. Every level-13 round has all four parts present.
3. **No hidden third difference.** Within a round every plant's petal colour equals the family's colour. Pot colour is never read by `fitsPlant` or `placeOf`.
4. **Places are derivable.** For every plant in every seeded round, `placeOf` agrees with a brute-force check of its two features against the parent's.
5. **Hints lead somewhere.** From any partially sorted state, `nextToSort` returns an unplaced plant and its correct part. After a miss, `hintFor` returns the missed plant.
6. **Critter rounds unchanged.** The existing suite passes untouched, and the generalised helpers give the same results on all critter plans for seeds 0–199.
7. **Ladder.** `rangeFor` for pre-K and school includes 12 and 13. The orders contain every earlier ID in its earlier relative order, so 12 and 13 are only inserted.

## Voice lines (`voice-script.ts`)

New IDs under `sort.plant.*`: `.one`, `.venn`, `.isnot`, `.both`, `.mat`, `.family` and `.example` ("Look, this little plant is already in its place."), with the texts above. The words are deliberately plain: *big plant*, *little plant*, *seeds*, *like*, *different*. None says *parent*, *baby*, *mother*, *gene* or *because*. A grown-up note on the how-to card may say "parent plant".

## How-to card (`howto.ts`)

Add `LevelLine`s for 12–13 and audit every existing Critter Sort line whose range or plain string would otherwise also show at 12 or 13. Lines that mention critters, hats or the counting step must be scoped to their own levels.

- `{ from: 12, to: 12 }`: "Drag each little plant that matches the sign into the hoop. The others can stay on the grass."
- `{ from: 13, to: 13 }`: "Drag each little plant into the hoop for what it shares with the big plant, the middle for both, or the leaf mat for neither."
- Note (12–13): "All the little plants grew from the big plant's seeds. Young plants look like their parent plant in some ways and not others. No answer here says why."
- The goal line becomes "Sort critters, and little plants, by pictured rules and explore the groups you made."
- **Co-play:** "Which little plant looks most like the big plant? Which looks least like it?" There is no right answer and nothing is recorded.
- **Off-screen:** look at the leaves on one houseplant or garden plant together and find two that are not quite the same.

## Build and check tier

**New levels on an existing interaction.** The drag, hoops, mat, hint and bot are unchanged; the new parts are the cast, its art and the plans.

- Run `npm run typecheck`, Critter Sort's rule tests, and `howto.test.ts`/`registry.test.ts`, because the ladder and card change.
- One filtered browser play (the existing Critter Sort case, extended with levels 12 and 13): level 13 with one wrong drop and two wrong drops in a row for the hint, then completion. Take one portrait screenshot of level 13 with the big plant, the signs and six pots in view, checking the shell's corners and the pet's clearance.
- Run `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort` at 12 and 13.
- Run `npm run build` only if the art lands in shared `src/art/plants.ts`.
- No `world`, couch, story or offline suite.
- A child's reading of "like the big plant" and device speech of the sign phrases go to [DEVICE-CHECKS](../DEVICE-CHECKS.md).

### Expected files

`src/games/critter-sort/{logic.ts, logic.test.ts, index.ts}` (and `src/art/plants.ts` only under the sharing case above), `src/content/voice-script.ts`, `src/content/howto.ts`, `scripts/browser-check.mjs`. At closeout: README row, GAMES entry, the Critter Sort dive, this packet's status line, the genetics study and recommendation rows, READY/GAME-BATCHES, STUDY-BACKLOG, VERIFICATION and DEVICE-CHECKS.

## Open decisions

Each has a default the build uses. None waits on the developer before the build.

1. **Content review.** Default: **not gated.** The levels state only what is visible plus 1-LS3-1's "like, but not exactly like". They contain no model, mechanism, dominance wording or prediction, which are what the study's reviewer gate covers ([WAITING](../WAITING-ON-DEVELOPER.md), the genetics row, and decision 1 there on who reviews content). The developer can still read the seven voice lines in the PR. Alternative: hold the merge for the genetics reviewer.
2. **Owner.** Default: Critter Sort, per [ownership](#ownership-critter-sort-not-photo-safari). The alternative, a Photo Safari plant mode, was rejected because it needs one answer per request.
3. **Ladder placement.** Default: 12 and 13 sit beside the critter level with the same diagram in both bands. The alternative is to append both at the school top (`…, 11, 12, 13`), which keeps the school order untouched but puts easy diagrams above harder ones.
4. **Pre-K level 13.** Default: included, after 3. The overlapping diagram is already a pre-K level. The alternative is school only, if a person check of level 3 shows the middle confuses her.
5. **Later packets, not here:** *Whose seeds?* (school top: a look-alike plant from a neighbour's seeds, so looks alone cannot tell a family) needs its own definition. Toddler and preschool openings wait on Critter Sort's decision 1 and a child observed. Growing Conditions and Paper Sprouts stay G8.
