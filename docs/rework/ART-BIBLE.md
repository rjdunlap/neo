# Creature art bible

Written 2026-10-17 after the developer chose the illustrated direction ([RW02b result](GENERATED-CREATURE-PILOT.md#pilot-result-2026-10-17)). Every generated creature image, and every session that prepares, rigs or judges one, follows this page. It sets one look for the cast and the rules an image must meet before it can be cut out and animated. Ready-to-paste prompts are in [ART-PROMPTS.md](ART-PROMPTS.md).

Species, names and colours here are still provisional (see [waiting on the developer](../WAITING-ON-DEVELOPER.md)). Changing them is an edit to this page, made before new images are generated.

## The look in one line

Warm storybook illustration for a toddler: chunky, rounded, friendly creatures with big glossy eyes, a dark ink outline and soft two-tone shading, closest to the **Illustrated adventure** column of the [concept sheet](concepts/art-directions-2026-10-16.png).

The concept sheet is the style reference: attach it to every generation. The approved glider, once chosen, becomes the second reference.

## Shared rules (every creature)

| Area | Rule |
| --- | --- |
| **Shape** | Simple, rounded silhouettes that read as a filled shadow shape alone. Big head, big eyes, small mouth, short limbs: baby proportions. No thin spiky parts except deliberate ones (ears, leaf tips, ribbon ends) |
| **Outline** | A dark plum-ink line (≈ `#2B1B2E`) all the way round the outside, a little heavier than the inner lines. The outline must be **closed**: every part, including ribbons, leaves and tail tips, is fully outlined. Inner lines are thinner and sparing |
| **Shading** | Soft cel shading: each material has a base colour, one softer shadow tone and one highlight, with light from the **upper left**. Gentle gradients inside a shape are fine. No cast shadow on the ground, no rim lights, no ambient-occlusion grime, no texture noise. Fur is suggested by a few line strokes at most |
| **Eyes** | Glossy near-black ovals (≈ `#21141B`), one large white highlight upper left and one small one lower right; a thin white or cream eye-white ring is fine. Both eyes visible when the anatomy allows |
| **Face** | Small dark nose, a short curved smile, soft pink blush ovals (≈ `#FF8FA3` at about half strength) under the eyes |
| **Bellies and muzzles** | A warm cream (≈ `#F6E6D8`) belly, muzzle or underside, which ties the cast together |
| **Value** | Must read on white (collection cards) and on pale sky blue (`#CDE6FA`): at least one large mid-tone area, and no creature that is pastel all over. The pilot glider read too pale on a white card; the new one should be a step deeper |
| **Mood** | Calm, curious and happy, never scary: no teeth, claws, frowns or sharp angles toward the viewer |
| **Facing** | Body turned to the **viewer's right**: a side view or a gentle three-quarter view. The whole cast faces the same way, so the game can flip them as one |
| **Not wanted** | Realistic fur, 3D render, plush or felt, pixel art, painterly brush texture, sparkles, motion lines, text, logos, props, scenery, accessories (accessories are separate assets) |

## Creatures

Sizes are in the game's logical units at scale 1, so images can be prepared to match. Hex values are targets, not exact pixel values.

| Species (provisional) | Silhouette and anatomy | Colours | Size in game |
| --- | --- | --- | --- |
| **Sprout** | Squat, round, a little wider than tall; small round ears; short stubby arms; short feet with pink paw pads; two-leaf sprout on top of the head with a short stem. Sitting or standing, three-quarter view facing right | Teal body ≈ `#5EC4C2` (shadow `#3A9A9B`); cream belly; leaf green ≈ `#7CC35A` with darker veins | About 200 tall |
| **River** | Long, low, otter-like body; small head held up with forward-set eyes; cream muzzle; whiskers; four short legs; a broad, flat, dark paddle tail. Side view facing right, all four feet down | Caramel ≈ `#C8956A` (shadow `#8F6142`); cream belly and muzzle; tail dark brown ≈ `#6B4A36` | About 330 long |
| **Cloud glider** | Manta-like ray: one great swept near wing, a smaller far wing tip above, a small round head at the front with two little ears, cream face and underside; pale cloud markings on the wing; two long flowing ribbon tails, one lavender and one pink. Side view gliding right | Lavender ≈ `#B79BE0` (shadow `#8C6CC8`, a step deeper than the pilot's); cloud marks `#F3E9F7`; ribbons `#C9B3F0` and `#FF9AC1` | About 380 across including ribbons |

## Image requirements (so it can be cut and animated)

These come from the RW02b pipeline (`scripts/creature-art/prepare-glider.mjs` and the mesh rig in `src/art/creatures/glider-illustrated.ts`).

1. **One creature per image**, nothing else in it: no ground, props, other creatures or text.
2. **Background:** transparent if the tool offers it. Otherwise a perfectly flat, plain white background (`#FFFFFF`) with no shadow, gradient, vignette or paper texture.
3. **Framing:** landscape 1536 × 1024 (portrait 1024 × 1536 only for a tall creature). The creature fills about 85% of the width (or height) with a clear margin on every side: **no part may touch or cross the edge.**
4. **Separated parts:** where the anatomy allows, keep gaps between parts that will move independently (legs from the belly, the tail from the body, ribbons from the wing, the leaves from the head), so the mesh can bend one without dragging another.
5. **Neutral pose:** a relaxed middle pose, not an extreme. The rig makes the motion; wings level, ears up, mouth in a gentle closed smile.
6. **Variants are edits of the approved image, not new generations.** Ask for "the same image with only X changed", and reject any variant whose outline, proportions, markings or camera moved.

## Asset set per creature

| Asset | Purpose | Required |
| --- | --- | --- |
| `base` | The approved neutral image; the rig deforms it | Yes |
| `blink` | The same image with the eyes gently closed (curved lash lines); replaces the painted-lid trick | Yes |
| `happy` | The same image with an open, happy mouth and slightly raised brows; shown during the touch reaction | Yes |
| `alt` | A specific pose a mesh cannot fake (for example the glider's wing fully raised, showing the pale underside) | Only if the rig needs it |

## Process

1. **Generate:** use the developer's ChatGPT with [the prompts](ART-PROMPTS.md), the concept sheet attached and the glider first. Make three or four candidates per creature.
2. **Choose:** pick one candidate against the checklist below at full size, and again shrunk to about 120 px wide (card size).
3. **Variants:** generate `blink` and `happy` from the chosen image. Re-roll any variant that drifts.
4. **Store:** put the originals, untouched (no screenshots, crops or resizes), in `docs/rework/concepts/generated/<species>-<asset>-<n>.png`. Record the date, tool and prompt in `docs/rework/concepts/generated/README.md`.
5. **Prepare:** a session cuts and rigs them with the RW02b pipeline. The script needs a small change first: take the file, box and seed as arguments and handle a transparent input.
6. **Later creatures:** attach the approved glider as a second reference so each new creature matches it.

## Review checklist

- [ ] Reads as this species by its silhouette alone, at 120 px wide
- [ ] Outline closed all round, the same plum-ink colour and relative weight as the rest of the cast
- [ ] Light from the upper left; one shadow tone and one highlight per material
- [ ] Eye, nose, blush and cream-belly treatment match the shared rules
- [ ] Facing right; neutral pose; no part touches the edge; plain background
- [ ] Moving parts separated by gaps where the anatomy allows
- [ ] Variants line up exactly with the base: only the named feature changed
- [ ] Holds up on white and on pale sky blue
