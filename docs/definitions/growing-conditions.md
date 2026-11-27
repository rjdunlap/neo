# Garden Grow levels 12–13: Growing Conditions (definition)

Defined 2026-11-26 on `claude/define-growing-conditions` as the *Growing Conditions* half of slice **G8** of the [genetics study](../deep-dives/subjects/genetics.md#build-slices-in-order). *Paper Sprouts*, G8's other half, stays undefined and needs its own session. The packet draws on the study's [candidate row](../deep-dives/subjects/genetics.md#candidates-and-overlap-decisions), the [Garden Grow dive](../deep-dives/garden-grow.md) and the [life-science study](../deep-dives/subjects/life-science.md) (NGSS K-LS1-1 and 2-LS2-1). Status: defined, not built.

**What it adds:** two appended levels of `garden-grow` (`src/games/garden-grow/`) that grow **two beds from the same seed packet** in a toy garden and read what a stated difference did. Level 12 *Same seeds, one difference* shows two beds whose cards differ in one thing (sun or shade, or a little water or a lot) and asks her to name the one difference and which bed grew taller. Level 13 *You change one thing* gives her a question ("Does sun make it taller?") and lets her set the second bed so that **only that one thing** differs, then grows both.

**Learning goal:** plants of the same kind from the same seeds can grow differently in different conditions, and to find out what a condition does you change one thing and keep the rest the same. Level 12 is observation and reading a comparison (NGSS 2-LS2-1's matched trials, read at a pictured level; K-LS1-1's "plants need water and light"). Level 13 is the first fair-test choice. The genetics link, and the reason it lives under *genetics*, is that the same-seed plants differ in height with **no change in the seeds**, which is the half of "like, but not exactly like" that [Same Kind, Different Sprouts](same-kind-different-sprouts.md) left out on purpose (height depends on conditions).

## Ownership and overlap

| Game | Its action | Fit |
| --- | --- | --- |
| **Garden Grow** (lap–pre-K, levels 1–11) | Plant seeds, make it rain, grow flowers; pre-K placement levels 9–11 | **Chosen**, as the study and dive assign. Its soil, cloud, five growth stages (PR #749) and flower kinds (PR #851) are the whole cast. It has no school window, so this adds one |
| **Rain Garden** | Where water goes on a slope | Owns water *movement*. Level 12–13 never move or route water: the water setting is a card, not a puzzle |
| **Critter Sort 12–13** | Sort a family by what it shares | Owns visible likeness. Here likeness is held fixed (same packet) and only conditions change |
| **Sprout Shuffle** | Combine copies from two parents | Owns the mechanism. Nothing here passes anything between plants |
| **Under the Soil** (life-science step 5, undefined) | Roots-and-shoots cutaway plus a matched comparison | See [decision 1](#open-decisions): this packet defines the comparison on its own so Under the Soil can add its cutaway view later and reuse the table |

## The model: a reviewed growth table (`logic.ts`)

Two conditions, two settings each, **no hidden variable and no interaction between them**:

| Condition | Settings (card art; word) |
| --- | --- |
| Light | `sun` (a big sun; "sun") and `shade` (a cloud-shaded patch; "shade") |
| Water | `more` (three drops; "a lot of water") and `less` (one drop; "a little water") |

`height(light, water) = 2 + (light === 'sun' ? 2 : 0) + (water === 'more' ? 1 : 0)`, in **ruler steps** on a five-mark ruler beside each bed. The four results are shade and little 2, shade and a lot 3, sun and little 4, sun and a lot 5. Every plant is **healthy and in flower**: the shorter plants are smaller, never wilted, brown, sick or sad. Nothing grows over real time or while she is away, and nothing is kept between rounds.

**Claims the game may make** (and the only ones): "In this toy garden, the bed with *more sun* grew taller" and "the bed with *more water* grew taller", each of one change at a time, with "in this toy garden" kept in the grown-up note. It never says *too much water*, *needs*, *dies*, *best*, *fertilizer*, *food* (soil is never called food), a number of days, or anything about real plants' exact heights. Real plants vary; the how-to note says so.

**Cast:** one flower kind per round (existing `FlowerKind`s from `kinds.ts`), one color per round, and **identical in both beds**: the seed packet is drawn once, above both beds, so "same seeds" is visible. The pot colour is the only other decoration and carries no meaning.

## Bands and ranges

| Band | Now | After |
| --- | --- | --- |
| `prek` | `{ min: 6, max: 11, order: [6, 7, 9, 10, 11] }` | `{ min: 6, max: 12, order: [6, 7, 9, 10, 11, 12] }` (level 12 only: read a comparison, no choosing) |
| `school` | none | `{ min: 12, max: 13 }` |

IDs 12 and 13 are appended; nothing is renumbered, so saved levels and pins hold. `entryLevels` and the lap, toddler and preschool windows are unchanged. The school window is new, so the registry and lands tests, `rangeFor` and the age-place checks must be run on it (what happens to a school-band player who today plays Garden Grow through its fallback is part of the build check). The dive's 3×4 school grid still waits on Under the Soil.

## A round, step by step

Both levels play **three rounds** at 12 and **two rounds** at 13; one sticker per level, as today. The seeded round fixes a kind and color and which condition differs.

### Level 12 *Same seeds, one difference*

1. Two beds side by side under one seed packet. Each bed has two condition cards below it (light, water). Exactly **one** card pair differs; the other pair is identical. The pet says "Same seeds. Look at the cards. What is different?" (`grow.cond.look`).
2. **Tap the difference.** She taps the pair of cards that differ (the light pair or the water pair). A right tap rings and the pair glows. A wrong tap is one miss: "Those two are the same. Look again." (`grow.cond.same`). Nothing grows before this step.
3. **Grow.** One big tap on the cloud-sun token grows both beds at once, five growth stages per bed in about three seconds (the existing stages, with the ruler appearing beside each), then both stop at their heights. It replays on any later tap of the token, free.
4. **Which grew taller?** She taps the taller bed. Wrong is one miss: "Count the steps: this one is 3 and that one is 4." (`grow.cond.count`, with the numbers). A right tap says "The bed with more sun grew taller. Same seeds, one difference." (`grow.cond.result`, which names the changed condition and its direction).
5. The next round changes which condition differs, and the side of the taller bed, from the last (`avoid`).

Because the differing condition and taller side are always readable from the two cards and the two rulers, no prediction is required, so there is no unfairness; an optional **guess first** (step 2b: before growing, tap a bed to say which you think will grow taller) is a free, unjudged touch that is recorded nowhere and never counts as a miss.

### Level 13 *You change one thing*

1. The pet asks a question for the round: "Does sun make it taller?" or "Does water make it taller?" (`grow.fair.ask`), shown also as a card with the question's picture.
2. Bed A is set (seeded). Bed B starts as an exact copy of A's cards. She changes B's cards by tapping a card to flip it (sun/shade; a lot/a little).
3. **Grow** is the same token. The game checks the setup first:
   - Exactly the asked condition differs, the other is the same: both beds grow and the result line is spoken ("Only the sun was different, so the sun made this one taller.").
   - **The asked condition is the same in both beds** (whatever the other card shows): one miss, no growth: "Nothing is different yet. Change the sun." (`grow.fair.none`).
   - **The other condition also differs (two changes):** one miss, no growth: "You changed two things. Then we could not tell which one did it. Put the water back to match." (`grow.fair.two`), with an undo that returns B to a copy of A (free).
4. After a fair growth she may **flip any card and grow again** as free exploration (never judged, no miss, the round already counted). That is where "what if I change the water?" and "what if both change?" live; with both changed the line says "Two things changed, so we cannot tell which one did it".

Hints: the second miss on a round glows the card that should be flipped (none) or the card that should be flipped back (two changes); one hint is counted, as in the other Garden Grow levels.

## Accounting, help and finishing

- **Misses:** a wrong "what is different" tap, a wrong "which grew taller" tap, and an unfair or empty setup at 13. Free: guessing first, undoing, flipping a card, replaying the growth, and every post-fair exploration.
- **Hints:** the second miss at one step glows the right card or bed, counted once per step as today. A supported completion (the hinted answer taken) still finishes and still earns the sticker, and is not recorded as independent success.
- **Finishing:** `ctx.finish({ misses, hints })` after the last round; no stickers, saves or celebration from the game. No timer, no losing, no withered plant.
- **Adaptation:** the shared ladder in `src/progress/difficulty.ts` applies unchanged. Smooth (at most one miss, no hint) steps 12 to 13 in school; pre-K ends at 12.

## Logic (`logic.ts`)

- `type Light = 'sun' | 'shade'`, `type Water = 'more' | 'less'`, `interface Setup { light: Light; water: Water }`, `growthHeight(s: Setup): number` as above, and `differing(a: Setup, b: Setup): ('light' | 'water')[]`.
- `makeCompare(rng, avoid?): { kind; color; a: Setup; b: Setup; changed: 'light' | 'water' }` for level 12: A is seeded, B differs in exactly one condition, the taller side varies, and `avoid` stops a repeat of the last round's condition and side.
- `makeFair(rng, avoid?): { kind; color; a: Setup; ask: 'light' | 'water' }` for level 13. `judgeFair(a, b, ask): 'fair' | 'none' | 'two'` is the only rule. `fairAnswer(a, ask)` returns the single valid B.
- `GARDEN_MODES` gains `'compare'` and `'fair'`; `PLANS` gains two entries (indexes 11 and 12) with `requests` 3 and 2. `planFor` clamps as today, so nothing in 1–11 moves.

## Rule tests (`logic.test.ts`)

1. **The table is the table.** All four settings give the heights 2, 3, 4, 5 and each setting is healthy (no field names a condition's harm).
2. **One change, one effect.** Over all 16 ordered setup pairs, `differing` is exact, and flipping exactly one condition always changes `growthHeight` by the same signed amount (sun +2, water +1), the same whichever value the other condition holds. That is the guarantee of a fair test.
3. **Level 12 rounds are readable.** For seeds 0–199, exactly one condition differs, the taller side is derived from the cards, and `avoid` changes the differing condition or the side between rounds.
4. **Level 13 has exactly one fair answer.** For every `makeFair` (seeds 0–199) and all four possible B setups, `judgeFair` returns `fair` for exactly one (only the asked condition flipped), `two` for exactly one (both flipped) and `none` for the other two (the asked condition unchanged), and `fairAnswer` is the `fair` one.
5. **Hints lead somewhere.** The hinted card at 13 is the card whose flip moves B toward `fairAnswer`.
6. **Ladder.** `rangeFor` for `prek` and `school` includes 12 and 13 as specified; every earlier ID keeps its earlier relative order; levels 1–11's plans and tests are unchanged.

## Screen and controls

Portrait first, as the rest of the game. Two beds side by side, each at least 220 units wide, a seed packet picture centered above both, the five-mark ruler beside each bed, and under each bed two condition cards at least **110 units** square (target size after scaling), with the pet's corner clear. At level 12 the cards are tappable pairs (tap either card of a pair); at 13 the lower bed's cards flip on tap, and the upper bed's are fixed and drawn without the flip affordance. One round button, the cloud-sun token (at least 120 units), grows both beds; Undo sits at the far side. Landscape puts the two beds side by side with cards under each as in portrait. Taps use `onTap`, never drags.

## Speech, how-to and ghost finger

Voice IDs in `voice.ts` under `grow.cond.*` and `grow.fair.*`, plain words (*same seeds, sun, shade, a lot of water, a little water, taller, shorter, different*), none of which says *needs*, *best*, *too much* or *because*. The how-to card (`howto.ts`) has a level-scoped line for 12 and 13 (the existing lines for earlier levels must be scoped to their own levels, audited by the how-to test), the note "Real plants vary. This is a toy garden: it shows what changing one thing does, not how every plant grows", a co-play prompt ("Which bed would you put the plant in? What would you change next?") and an off-screen activity (two matching seed cups on two windowsills, one sunny, one shaded, and a look every few days; real watering, kept safe and simple by the grown-up). `autotouch()` for each level taps the differing pair and the taller bed at 12, and sets the one fair flip and taps the token at 13.

## Build and check tier

**New levels with one new interaction (the card flip and fair check).** Run `npm run typecheck`, Garden Grow's rule tests plus the how-to, registry and lands tests, `node scripts/content-barrels.mjs`, one filtered scripted play of levels 12 and 13 (`BROWSER_SUITE=woods WOODS_ONLY=grow`, extended past its hard-coded `level <= 7` loop) with one wrong tap, two unfair setups and a hint, `fingerdemo` at 12 and 13 (`FINGER_ONLY=garden-grow`), and one portrait screenshot of level 13. `npm run build` only if shared files or art change. No world, couch, story or offline suite. Children's reading of the cards and device speech are [parked](../DEVICE-CHECKS.md).

**Expected files:** `src/games/garden-grow/{logic.ts, logic.test.ts, index.ts, voice.ts, howto.ts}` and the browser case in `scripts/browser-check.mjs`. At closeout: `docs/games/garden-grow.md` (via `npm run game-docs`), this packet's status line, the Garden Grow dive, the genetics study's G8 row and recommendation row, VERIFICATION and READY.

## Open decisions

Each has a default the build uses; none waits on the developer.

1. **Under the Soil ordering.** The dive's 2026-10-23 decision defined Under the Soil first and had it absorb Growing Conditions "where they share the cutaway". This packet needs no cutaway, so it is defined first. Default: build this comparison now; Under the Soil later adds a roots-and-shoots view that reuses `growthHeight` and the cards, and its definition must cite this packet. Alternative: wait and define one combined packet.
2. **Content review.** Default: the game states only the toy table's one-variable comparison, with "in this toy garden" in the note, and no mechanism, requirement or harm, so it is **not gated** on a named reviewer. The developer can read the voice lines in the PR. Alternative: hold the merge for a botany or nature-education read of the card art and the sun, shade, water words.
3. **Windows.** Default: pre-K reads a comparison (12 only), school gets 12–13. Alternatives: a preschool window for 12's "which grew taller" half, or school-only both levels.
4. **Conditions.** Default: light and water only, two settings each. Out of scope on purpose: temperature, soil type and fertilizer (soil is never called food), real species, flower counts and anything that suggests a plant can be harmed by a choice.
5. **Later, not here:** *Paper Sprouts* (G8's other half, a plain-HTML conversation card); a school 3×4 grid and the root cutaway (Under the Soil); *Leaf Litter Window* (ecosystems F5); a repeated-trials "chance of variation" mode.
