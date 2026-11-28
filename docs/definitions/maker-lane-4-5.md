# Maker Lane, levels 4–5 (definition)

Defined 2026-11-24 as slice FS2 of the [food-and-fiber study](../deep-dives/subjects/food-fiber-systems.md#build-slices-in-order), from its [slice table](../deep-dives/subjects/food-fiber-systems.md#candidates-and-recommended-order) row FS2 (*Stripes or plain*: dye at fleece, yarn or cloth; *Two ways to a box*: new chips or old paper) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#food-and-fiber-systems-recommendations). The study's slice line said "after the first build is played"; under the [decisions of 2026-11-17](../archive/DECISIONS-2026-11-17.md#rules-used) ("after it is played" means parked) it is defined now on the study's leans, and a playtest note can still change it before or after the build. It extends the built game ([levels 1–3 definition](maker-lane.md), batch `maker-lane 1`, PR #1123) and keeps its lane, stalls, bundle, thought bubble, art, upright layout, speech rules and accounting unless this page says otherwise. **Built 2026-11-24 (batch `maker-lane 2`, PR #2140).** Level 4 and level 5 both shipped; the new voice lines are slotted, so device speech says them.

**Fun action and purpose.** Level 4, *Stripes or plain*: a friend wants a scarf, shown as a picture: one colour, or two-colour stripes. The lane has a spinner, a dyer with her pots and a weaver, in a seeded order. For a plain scarf she may dye the clean fleece, the yarn or the finished scarf, and every one works; for stripes the weaver needs two coloured yarns, so both bundles must visit the dyer **before** the loom. Level 5, *Two ways to a box*: a log from a tree and a bundle of old paper both become boxes; the log goes to the chipper, the pulper and the presser, while the old paper skips the chipper and goes straight to the pulper. The learning purpose is the study's next step after *where did it begin*: **a path of production can branch, and more than one route can make the same thing** (NALO T3.3-5.b, as the study records it), with the two real branches the study opened: when to dye (fibre, yarn or piece dyeing; yarn-dyed cloth suits stripes because the pattern comes from the yarn, from Wikipedia's *Dyeing* and a trade summary) and new fibre or recycled paper (re-pulping, classroom pages by search summary only).

## Identity and overlap

Rechecked 2026-11-24 against the catalog, the open definitions and `git log origin/main`: no built game has a branch in a production path or a dye step. Both levels are the same action as level 2 (send the bundle to a maker who can use it now; a maker who cannot shows what they need), so they extend Maker Lane rather than start a game.

- **Little Loom** (Painted Canyon) weaves her own stripe pattern over and under; here the weaver only shows that stripes come from coloured yarn, and no pattern is chosen. Little Loom is unchanged.
- **Second Chance Shed** owns reuse and sorting into the right place (bins, mending); level 5 shows only that old paper is a beginning a maker can use, and has no bins, sorting or "good for the planet" claim.
- **Colour mixing** (Paint Splash and the colour games) is not touched: the dyer's pots hold the colours the order needs, so she never chooses or mixes a colour.

## Bands and ladder

`BandLevels`: `school: { min: 2, max: 5 }`; toddler, preschool and pre-K unchanged (pre-K stays at 2–3). Levels 4 and 5 append above 3 without renumbering, so saves and pins stay valid. No `order`. No `grownup` window (the study's 13+ follow-up is FS5, a sketch).

| Level | Name (`describeLevel`) | A round |
| --- | --- | --- |
| 4 | "Stripes or plain" | Two orders: one plain scarf (one bundle), one striped scarf (two bundles, one after the other) |
| 5 | "Two ways to a box" | Two boxes: one from a log, one from old paper, one after the other |

## Level 4, Stripes or plain

- **The lane:** the beginning spot holds the sheep's pen; the harvest and the wash play by themselves (as level 2's harvest does), so each bundle starts as **clean fleece**. Three stalls in a seeded order: the **spinner** (spinning wheel), the **dyer** (a stall of dye pots, the order's colours only) and the **weaver** (loom). Every order of the three is allowed: there is no wrong order to avoid, because more than one route works.
- **The order:** a picture of the wanted scarf (one colour, or two-colour stripes) rides in the pet's corner, in a speech bubble of about 120 × 120. It is not a target. Colours come from four palette colours (red, blue, yellow, green in `src/art/palette.ts`); a striped order uses two different ones.
- **The bundle carries a colour:** `{ form, colour }`, where `colour` is `null` until the dyer works. The dyer gives the same form back coloured: clean fleece becomes coloured fleece, yarn becomes coloured yarn, a scarf becomes a coloured scarf. In a striped order the dyer gives the first bundle the first colour and the second bundle the second, so she never picks a colour.
- **Plain order (one bundle):** three accepted routes, all right: dye, spin, weave; spin, dye, weave; spin, weave, dye. The weaver weaves plain yarn here, and the dyer then dyes the scarf. The round's order is done when the scarf is the order's colour; it goes to the friend in the pet's corner.
- **Striped order (two bundles):** each bundle must be coloured before the loom, at the fleece or the yarn (two routes each, four combinations). The weaver **holds** the first coloured yarn on the loom ("One colour here. Bring me the other!"), the second bundle appears at the beginning spot, and when its coloured yarn arrives the two weave into a **striped scarf**.
- **Refusals (a thought bubble, as level 2):** the weaver given fleece ("Not yet. I need yarn first.", the existing `notyet.wool.4`); the weaver given **plain yarn in a striped order** ("For stripes, I need coloured yarn. Dye it before I weave!"; the bubble shows a coloured yarn). A maker who has done their step for this bundle steps aside as at level 2 (the spinner after spinning; the dyer once the bundle is coloured), so sending to them is free.
- **After each order** the pet names the route she took and that another works too, for a plain scarf: "You dyed the fleece first. Dyeing the yarn or the scarf works too!" (and the yarn and scarf lines); for stripes: "Stripes need coloured yarn before the loom."
- **Authored first round:** plain red (stalls spinner, weaver, dyer: a child going left to right spins, weaves and dyes the scarf, which works); then red and blue stripes (stalls dyer, spinner, weaver).

## Level 5, Two ways to a box

- **The lane:** the beginning spot holds a tree and, beside it, a bin of **old paper** (a stack of old newspapers and flattened boxes). The tree's woodcut plays by itself (a log, and a sapling planted, as at level 2). Three stalls in a seeded order: the **chipper**, the **pulper** (pulp vat) and the **presser** (press).
- **Two bundles, one after the other,** in a seeded order (authored: the log, then the old paper): the **log** takes chipper, pulper, presser; the **old paper** takes pulper, presser. Each finishes as a cardboard box for the pet; the round ends on the second box with "Two boxes, two ways: one from a tree, one from old paper."
- **Refusals:** the chipper given old paper ("No chipping needed. It's already paper!"; the bubble shows a log, the form the chipper needs); the pulper given the log ("Not yet. I need wood chips first.", the existing line); the presser given the log, chips or old paper ("Not yet. I need pulp first.", the existing line). The pulper given old paper says "Mash, mash. Old paper makes pulp too!"
- **Honest simplification,** for the how-to note: real recycling also sorts, cleans and adds new fibre; here the pulper stands for all of it.

## Screen and controls

Unchanged from levels 1–3 where not named. Both levels use **level 2's three-stall layout** (`makerLaneLayout(view, 2)`: one row of three stalls sideways, two rows upright), so every stall stays at least 160 × 220 and the bundle 130, and nothing new is a target. New on screen: the order picture in the pet's corner (level 4); the dye pots' stall; the weaver's loom holding the first coloured yarn (drawn on the loom, not a target); coloured fleece, yarn and scarf (a palette tint of the existing pictures); the striped scarf; the old-paper bin and bundle. `makerLaneLayout` gains the order bubble's rect at level 4 and the upright test checks it clears every stall and bundle spot. One gesture: tap a stall or drag the bundle there, as at level 2. Only one bundle is ever on the path, so a tap is never ambiguous on a phone.

## Accounting, help and finishing

The level 2 rule holds: a refusal is **one miss**, the maker's bubble goes up, and re-sending to a bubbled maker is free.

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 4 | the weaver given fleece; the weaver given plain yarn in a striped order | the glow after two misses on one bundle, or *Show me*; at most one per bundle | any accepted route; a maker who has stepped aside; a bubbled maker again; stray drops; taps during an animation |
| 5 | the chipper given old paper; the pulper given the log; the presser given anything but pulp | as level 4 | as level 4 |

- **Glow:** `glowFor` lights one accepting stall: at level 4 it follows the dye-first route (the dyer while the bundle is uncoloured fleece, then the spinner, then the weaver; for uncoloured yarn in a striped order, the dyer); at level 5 the one accepting stall. *Show me* (`askForHint`) lights the same stall.
- **Assisted ending:** every bundle ends through her tap or drag; one sticker per round; `ctx.finish({ misses, hints })` once after the second order or box.
- **Adaptation:** standard. School tops out at 5. A smooth level 4 with the lines read aloud is evidence she sent the bundle to the dyer before the loom, not that she could plan a dyed garment on her own; the how-to note says so.
- **Nothing is kept:** no scarf, colour or box is saved; no journal entry; no save field.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

New: `Colour`; `Load = { form: Form; colour: Colour | null }`; the dyer (`job: 'dyer'`, `tool: 'dyePots'`) and the old paper (`Form` gains `'oldPaper'`, accepted by the pulper at level 5 only), kept out of `MAKERS` so the 1–3 graph tests stay as they are; `Order = { kind: 'plain'; colour } | { kind: 'stripes'; colours: [Colour, Colour] }`; `accepts(level, maker, load, order, held)` returns what the maker gives or a refusal; `Play` gains the load's colour, the weaver's held yarn and the level-4/5 rounds; `roundFor(4|5, rng)` and `AUTHORED[4|5]`. Tests:

1. **Plain routes:** enumerating every send from clean fleece, exactly three routes reach a scarf, each of the order's colour; every one is accepted with zero misses.
2. **Striped routes:** exactly two routes per bundle reach the loom coloured (dyed fleece or dyed yarn), four combinations in all, each ending in one striped scarf of the order's two colours; weaving plain yarn in a striped order is always refused with one miss.
3. **Box routes:** the log reaches a box in exactly three steps (chipper, pulper, presser) and the old paper in exactly two (pulper, presser); the chipper always refuses old paper; at every reachable state exactly one stall accepts.
4. **Always a way on:** at every reachable state of levels 4 and 5 at least one stall accepts the bundle, and `glowFor` is one of them; following the glow finishes the round.
5. **Rounds** (300 seeds): level 4 deals one plain and one striped order, the striped colours differ, and three stalls (spinner, dyer, weaver) in a seeded order; level 5 deals the log and the old paper in a seeded order with chipper, pulper and presser seeded; over all seeds each stall order appears.
6. **Accounting:** the refusals above count one miss each, a bubbled maker again and a stepped-aside maker count nothing, two misses on one bundle give exactly one glow hint, and misses never block an accepted route.
7. **Authored first rounds** meet the rules above.
8. **The 1–3 tests** pass unchanged; the registry and difficulty tests read school 2–5.
9. **Layout:** `upright-batch-7.test.ts`'s Maker Lane walk extends to levels 4 and 5: stalls, every bundle spot and the order bubble fit and stay apart at the upright views.

## Speech, how-to, ghost and registration

- **Instructions** (`ctx.instruct`): level 4 "Make the scarf in the picture. Where will you dye it?" (`makerlane.instruct.4`); level 5 "Two ways to a box! Help the tree and the old paper both become boxes." (`makerlane.instruct.5`).
- **New lines** under `makerlane.*`, all marked `// REVIEW (agricultural literacy / textiles)` as levels 1–3 are: `make.dye` ("Dip, dip. Now it's coloured!"), `make.stripes` ("Weave, weave. Two colours make stripes!"), `weaver.wait` ("One colour here. Bring me the other!"), `notyet.stripes`, `dyed.fleece`, `dyed.yarn`, `dyed.scarf` (the route lines above), `stripes.before` ("Stripes need coloured yarn before the loom."), `make.oldpaper`, `notyet.oldpaper`, `twoways`. Every line is slot-free; colour names are never spoken (the picture carries the colour). `makerlane` is a rendered clip prefix (`scripts/voice-clips/clips.mjs`), so the build renders the new clips with `scripts/voice-clips/render.mjs` and records the size added.
- **How-to card** (`howto.ts`): steps "Make the scarf in the picture: dye at the fleece, the yarn or the scarf; stripes need coloured yarn before the loom" `{ from: 4, to: 4 }` and "A log and old paper both become boxes; old paper skips the chipper" `{ from: 5, to: 5 }`; finish "The round ends after two scarves; one sticker." `{ from: 4, to: 4 }` and "The round ends after two boxes; one sticker." `{ from: 5, to: 5 }`; the level 2–3 note extends to 5 and adds "Real dyeing and recycling take more steps than the makers show."
- **Ghost finger** (`autotouch()`): at levels 4 and 5 it drags the bundle to `glowFor`, as level 2 does. `fingerdemo` runs at 4 and 5.
- **Co-play** (`coplayHint`, unchanged): at 4 the grown-up asks "When will you dye it?" before each carry. **Off-screen:** the existing line, plus "Look at a striped sock or towel: was the yarn coloured before it was made?"
- **Grown-ups' card (FS3):** unchanged; conversation only, no dyeing or paper-making instructions (study decision 6).
- **Sticker, icon, land, music:** unchanged (Cozy Village, `STYLES.hub`).

## Build batch

**`maker-lane 2` (levels 4–5).** Everything above, one batch; level 5 is the smaller half, so if the allowance runs out, stop after a complete level 4 with a draft-PR checkpoint.

## Check tier

- **Batch `maker-lane 2`, new interaction tier:** `npm run typecheck`; unit tests (the rule tests above, with registry, difficulty, how-to, clips and the upright walk); one filtered scripted play with `BROWSER_SUITE=makerlane` on an upright phone viewport after the suite learns levels 4 and 5 (level 4: a plain order by the spin, weave, dye route, then a striped order with plain yarn sent to the weaver once (one miss, the bubble), then dyed; level 5: old paper to the chipper twice for the glow and its hint, then the right makers); one upright screenshot of level 4 with the weaver holding the first coloured yarn; `fingerdemo` at 4 and 5; `npm run build` and the offline check, because voice lines and clips are added. Record the tested commit, filter and server URL.
- **This docs slice:** `node scripts/check-links.mjs` and `git diff --check` only.

Person and review checks stay open as for levels 1–3 (the named agricultural-literacy or textile review of the new lines and pictures); a phone playtest note can answer whether grown-ups find the plain order too easy (below).

## Open decisions

Each has a default the build uses; none waits on the developer.

1. **Two bundles one after the other, not at once.** The study's slice row said "two bundles at once at level 4". Default: one bundle on the path at a time, the weaver holding the first coloured yarn, because two bundles on an upright phone lane would make a tap on a stall ambiguous and crowd the 130-unit bundle spots. The rule (both yarns coloured before the loom) is the same.
2. **The plain order has almost nothing to get wrong.** Default: keep it, because it is where "every route works" is shown and named; its only miss is weaving fleece. If phone play finds it dull, the round could deal two striped orders instead, a `roundFor` change only.
3. **The dyer picks the colour.** Default: the pots hold only the order's colours and the dyer applies them in turn, so the level asks *when* to dye and never *which colour*. A colour choice belongs to a colour game.
4. **Level 5 is school only, like level 4.** Default: pre-K stays at 2–3. Old paper skipping the chipper might suit pre-K as a later level 4 alternative if play suggests it.
