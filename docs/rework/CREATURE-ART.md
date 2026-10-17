# Creature art and animation prototype (RW02)

[Issue #486](https://github.com/rjdunlap/neo/issues/486), [work item](WORK-ITEMS.md#rw02-creature-art-and-animation-prototype), [PR #499](https://github.com/rjdunlap/neo/pull/499). Written 2026-10-17. Proposed: nothing here is approved production art, and the species and accessory names are provisional (RW01's "Puddlings" is optional and unused in code).

## What was built

An isolated development preview, drawn with Pixi `Graphics` and the shared palette (`src/art/palette.ts`). It holds three creatures, two accessories, a small collection view and a scene that changes layout between landscape and portrait.

- **Open it:** `npm run dev`, then load `/?creatures`. The preview replaces the "Who's playing?" front door for that page load only.
- **Production builds:** the `?creatures` hook sits inside `import.meta.env.DEV` in `src/main.ts`, so a production build leaves out the preview and the creatures entirely (checked: no preview or creature code in `dist/assets`).
- **Island and catalog unchanged:** no route, registry, land, save field or game changed, and no game was reskinned.

| Species (provisional) | Silhouette and face | Idle | Touch reaction |
| --- | --- | --- | --- |
| **Sprout**: squat, teal | Wider than tall (≈200 × 230 at scale 1 including leaves), short legs, round ears, a big low face with wide-set eyes, a two-leaf sprout | Breathes (squash and stretch), leaves sway, blinks | Crouches, hops 70 units, lands with a squash, spins its sprout and opens its mouth |
| **River**: long, brown | Low and stretched (≈330 × 140), a small head with forward-set eyes, a cream muzzle, whiskers and a dark paddle tail | A slow wave runs down the back, the tail swishes, the head bobs | Rears up onto its hind legs to look, front legs dangling, then settles; the tail flicks |
| **Cloud glider**: broad, lavender | A flat ray with one great swept wing carrying cloud marks (≈380 across with ribbons), a tiny face at the front, two pink ribbon tails | Floats, flaps slowly, the ribbons wave | A full loop-the-loop with fast wing beats |

- **Source files:** `src/art/creatures/` holds `creature.ts` (the shared base: slots, blinking, the touch clock), `sprout.ts`, `river.ts`, `glider.ts`, `accessories.ts` and `index.ts`.
- **The preview scene:** `src/dev/creature-preview.ts`.
- **Relation to the current pet:** the sprout deliberately resembles the current pet, `CRITTERS.pip` (teal, with a sprout), so the change reads as an evolution. It is built differently, though: squatter, with arms and a separate leaf rig rather than the critter's shared standing body.

## Accessories and slots

Each species has a `head` slot and a `neck` slot, unless it lacks one on purpose. A slot is an empty container placed inside a moving body part, so anything worn there rides the motion with no tracking code:

- the sprout's body, which hops;
- the river's head, which rears;
- the glider's whole craft, which loops.

An accessory is drawn once for its slot's width. Only the scarf's tails move: they sway at rest and flutter during a touch reaction.

| | Sprout | River | Cloud glider |
| --- | --- | --- | --- |
| **Crown** (head) | Rings the top of the head around the sprout; the leaves stay visible | Sits between the ears | Sits on the top of the head, in front of the wing root |
| **Scarf** (neck) | Where head meets body, under the arms; the mouth stays clear | A collar across the throat that turns with the head | **Incompatible, deliberately.** It has no neck: the head runs straight into the wing, so a band would hide the face or the wing root. `misfit.scarf` records the reason, and the collection card shows a "no" mark while scarves are on. A tail-ribbon tie is a possible later substitute, not built |

A unit test (`src/art/creatures/creatures.test.ts`) checks three things:

- every accessory has either a slot or a recorded misfit reason on every species;
- a worn slot moves at least 15 units during a touch reaction;
- the slot returns to within idle sway afterwards.

## Presentation sizes

These are the sizes this proved, in the 1024 × 768 logical layout.

**Scene creatures** (scale 0.8–0.95, about 200 units tall or 300 long):

- Each creature has a body-centred hit circle with a radius of 105–135 logical units in both orientations, against the 100-unit minimum.
- Taps use `onTap`. The circles stay put while the body moves, so a hop or loop never runs away from the finger.

**Collection cards** (150-unit cards, creatures at scale 0.32–0.44):

- Species read by silhouette at this size: the round sprout, the long river and the winged triangle.
- The crown's flowers and the scarf's red stay legible. At thumbnail size the river's scarf is only a red mark at the throat.
- Thumbnails take no touches; the card itself is the target.

**Layout:**

- **Landscape:** the cards stand in a column on the right.
- **Portrait:** the cards run in a row along the bottom. The scene's ground rises so all three creatures stay clear of the collection and the accessory toggles (top-left).

## Comparison with the concept sheet

Compared with the [concept sheet](concepts/art-directions-2026-10-16.png) (reference only):

- **Where it lands:** the prototype is closest to the sheet's **playful flat** column. It uses flat fills with one darker outline, light-tint bellies and undersides, blush and glossy dot eyes.
- **Kept from the sheet:** the three silhouettes, the teal sprout's leaf, the otter-like river body with its paddle tail, and the glider's cloud-marked wing and ribbons.
- **Simplified away:** the illustrated column's painterly shading, fur texture, wing gradients and every background detail. The backdrop is three flat bands: sky, grass and water.
- **Out of reach:** the soft-toy column (felt texture, soft lighting) is not reachable with `Graphics` at reasonable cost.

## Rendering and animation cost

Every part is drawn once at construction. Idle and touch motion only move, rotate and scale containers, so no `Graphics` is cleared or redrawn per frame. A creature is plain shapes with a few transform updates per frame.

Measured in the dev preview (headless Chromium, `test-results/rw02-cost.mjs`):

| Species | Display objects | `Graphics` | `update()` per frame |
| --- | --- | --- | --- |
| Sprout | 29 | 17 | ≈0.5 µs |
| River | 63 | 49 (ten spine segments × outline, fur and belly) | ≈2 µs |
| Glider | 88 | 77 (two 16-link ribbons × outline and fill) | ≈2.3 µs |

- **Animation cost:** the per-frame animation cost is negligible.
- **Draw cost:** headless software rendering ran the preview at about 21 fps whether the six creatures animated or were frozen. The chooser ran at about 40 fps in the same harness. The cost is in drawing many vector objects in software, not in the motion, and headless numbers do not predict an iPad.
- **Open:** a frame-rate check on a real iPad is open in [device checks](../DEVICE-CHECKS.md).

## Production recommendation

1. **Style:** keep this construction, flat palette shapes with one outline weight and light-tint shading, as the production base. Add illustrated-adventure warmth only where it is cheap: a second tint for shading, a highlight stroke and a softer outline color per species. Do not chase painterly or soft-toy rendering in `Graphics`. The brief's "expressive illustrated adventure" is reached through silhouette, pose and motion, not texture.
2. **Rig:** each species owns its own small rig. Body parts are containers with procedural motion written as functions of time since the touch, so there is no physics state to leak, and the motion is easy to test and cheap to run. Do not build a universal skeleton or rig framework; three species with different anatomy shared only blinking, slots and the touch clock.
3. **Slots:** keep two named slots (`head`, `neck`). Each species declares either a slot or a misfit reason, and an accessory is drawn for the slot's width. New accessories go through the same table; a species without a slot gets a deliberate reason, not an approximation.
4. **Cost controls for production:**
   - Draw collection thumbnails as **still textures**. Render one frame of a frozen creature into a `RenderTexture` (as Puzzle Pals does) instead of keeping six or more live rigs on a collection page.
   - Bake the river's and glider's segmented outlines into fewer objects if the iPad check shows draw cost.
   - Keep at most a handful of live creatures on screen.
5. **Sound and speech:** the touch reactions have none yet. RW05 should add a pentatonic chirp per species (Web Audio, `src/audio/notes.ts`) and voice lines in the existing voice script.

## Integration and removal point (RW05)

**RW05 (creature collection and active companion)** is the integration and removal point. When RW05 adds the real collection model and the selection surface, it:

- **Reuses** `src/art/creatures/`, or replaces it with the production version of these rigs;
- **Deletes** `src/dev/creature-preview.ts` and the `?creatures` hook in `src/main.ts`.

Until then the preview is a development-only test surface. No game, land, save or the guide uses these creatures, and the current pet (`src/art/pet.ts`, `Critter`) is unchanged.

## Not established

- iPad frame rate and touch feel.
- A child's recognition of the three species, or their wish to collect and dress them.
- Whether the glider's missing scarf disappoints; the "no" mark is a developer-facing preview signal, not child UI.
- The final species names and colors.

These are recorded in [device checks](../DEVICE-CHECKS.md). The production style choice is in [waiting on the developer](../WAITING-ON-DEVELOPER.md).
