# R22 exact prompts and review

Generated 2026-10-23 with built-in `image_gen.imagegen`; model undisclosed by tool. Five calls: three base candidates and two portraits. Only base 2 and portrait 2 retained in the repository. No source transformations.

## Base 1

References, in order: `art-directions-2026-10-16.png`, `sprout-base-2.png`, `glider-base-3.png`. `transparent_background: true`.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

The creature is a small round yellow duck, the friendly duck of a toddler's game: a plump egg-shaped yellow body (#FFD54A, shadow #D9A520) with a cream belly (#F6E6D8), a round head with a small soft tuft of three feathers on top, a short rounded orange bill (#FF9A3C, shadow #D9731A), a small rounded wing folded on its side, and two short orange webbed feet standing on nothing. Side-on gentle three-quarter view facing the viewer's right, standing, calm and happy. Use the attached sprout only for outline weight, eye treatment and shading; do not include the sprout.

Input image roles: image 1 is the concept sheet (middle column style only); image 2 is Sprout (outline/eye/shading only); image 3 is the approved glider (cast consistency only). Generate only the duck. Transparent background.
```

## Bases 2 and 3

Same references; `transparent_background: false`. Exact prompt for each:

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

The creature is a small round yellow duck, the friendly duck of a toddler's game: a plump egg-shaped yellow body (#FFD54A, shadow #D9A520) with a cream belly (#F6E6D8), a round head with a small soft tuft of three feathers on top, a short rounded orange bill (#FF9A3C, shadow #D9731A), a small rounded wing folded on its side, and two short orange webbed feet standing on nothing. Side-on gentle three-quarter view facing the viewer's right, standing, calm and happy. Use the attached sprout only for outline weight, eye treatment and shading; do not include the sprout.

Input image roles: image 1 is the concept sheet (middle column style only); image 2 is Sprout (outline/eye/shading only); image 3 is the approved glider (cast consistency only). Generate only the duck. Use the flat pure white background fallback, completely opaque. Three distinct softly rounded crest feathers, closed bill with a single gentle smile seam, no dark mammal nose. No halo or glow outside the outline. Keep a clear empty margin at least 60 pixels on every side.
```

## Portrait 1

Reference: chosen `duck-base-2.png`; `transparent_background: false`.

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat white background (or transparent if available).

Input image role: chosen duck-base-2 is the identity reference. Keep its three soft crest feathers, two glossy eye highlights per eye, orange bill, cream cheek/chest and pink blush. Fully close the plum outline around the whole portrait including the curved lower chest edge. Pure opaque white background, no shadow or halo.
```

## Portrait 2

Same chosen base reference; `transparent_background: false`.

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat white background (or transparent if available).

Input image role: chosen duck-base-2 is the identity reference. Keep its three soft crest feathers, two glossy eye highlights per eye, orange bill, cream cheek/chest and pink blush. Fully close the plum outline around the whole portrait including the curved lower chest edge. Pure opaque white background, no shadow or halo.

Keep the complete outlined portrait inside the central 80% of the square, leaving at least 10% plain white padding on ALL four sides, including above the crest and below the curved chest. Head and upper chest only; omit the tail and feet. Do not enlarge to fill the canvas.
```

## Selection and limits

Base 1 rejected: visible background halo and two dominant crest feathers. Base 3 rejected in favor of base 2: compressed third feather and less defined webbed toes. Base 2 has three legible rounded crest feathers, two separated orange webbed feet, folded wing, closed plum outline, right-facing body, cream belly, upper-left highlights and two highlights in each eye. Its bill uses an orange smile seam instead of a mammal nose. Portrait 1 rejected for narrow lower margin and unnecessary tail. Portrait 2 keeps the base's identity and omits the tail/feet, with a closed curved lower chest.

The generated duck fills the height rather than the requested 85% landscape width; it is round and upright, not stretched to satisfy that width. Portrait 2 still fills more than the requested central 80%; all parts have clear margins. Future preparation should add display padding, especially vertically. The opaque near-white fallback has faint pixel variation; preparation owns background keying. No claim of ready-to-rig alpha, animation, iPad readability, child appeal or device acceptance. Portraits are newly framed images, not aligned expression variants; no silhouette-alignment claim applies.


## Original integrity

| File | Tool output basename | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| duck-base-2.png | exec-faa2ca6e-b1c7-42af-9f1d-c9e5e92a1c5d.png | 1536 × 1024 | 1,161,335 | `833b81ab6855fa82c90c8474e021a64e4a172957db2b3b5d6c6de301e29480eb` |
| duck-portrait-2.png | exec-55807b05-1745-4996-b1f6-f1341e1186e6.png | 1254 × 1254 | 1,270,899 | `8b29605b24551e5d9a8627632db1b9f346f3ace532a452e4261bb68a076e0e07` |

Both copies matched their original bytes. Dark-outline bounds (exclusive right/bottom): base `(326,44)-(1194,982)`; portrait `(221,66)-(1073,1199)`. Base margins top/bottom 44/42 px; portrait 66/55 px. Full-size and 120 px inspection found legible duck silhouettes, matching eye treatment, closed contours and clear separation of the base feet. Temporary white/sky-blue review composite was made only for inspection and is not a delivered asset.
