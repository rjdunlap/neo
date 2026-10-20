# R19 generation prompts — 2026-10-20

Built-in `image_gen.imagegen`, underlying model undisclosed; `transparent_background: false` for all eleven calls. Three independent candidates per item, followed by one corrected cape candidate each for sitter and walker. All are new image generations using references, not edits of the creature. Accessory-specific instructions override the shared creature format. Exact prompts below; no CLI/API fallback.

References for every call, in order: concept sheet (middle Illustrated adventure column, style), approved `glider-base-3.png` (outline/shading), named `sprout-base-2.png` or `river-base-4.png` (angle/body plan), and R05 `wear-raincoat-1.png` or `wear-boots-4.png` (colors/material). All paths passed to the tool were absolute under `/private/tmp/neo-art-r19/docs/rework/concepts/`.

## Call outputs

| Candidate | Original tool basename | Kept |
| --- | --- | --- |
| raincoat-sitter1 | `exec-905478a6-6b64-4193-8daf-90722b179e4d.png` | no |
| raincoat-sitter2 | `exec-b0fabff0-bf4b-4ef6-ad37-45fb2e4a3884.png` | no |
| raincoat-sitter3 | `exec-a8607d46-07b5-4b35-a0a9-57f73f0709bf.png` | no |
| raincoat-walker1 | `exec-9241bb0f-b105-4c6e-a129-3714849ec3a4.png` | no |
| raincoat-walker2 | `exec-b0cb1c71-f224-4562-878f-d7bb4a571ce3.png` | no |
| raincoat-walker3 | `exec-8f00891d-9ecf-4991-8cbe-3e366f4e7a5e.png` | no |
| boots-sitter1 | `exec-35346a4a-ecfb-4a09-a717-10c4486037c2.png` | no |
| boots-sitter2 | `exec-d7adb051-abae-4b76-9bbc-1992152210e7.png` | no |
| boots-sitter3 | `exec-d7f239f9-8743-483a-aea9-5104ffa41824.png` | yes |
| raincoat-sitter4 | `exec-3bd6d442-9bb1-42ba-a1d1-02d26e8c4767.png` | yes |
| raincoat-walker4 | `exec-22f0ab8d-5be0-4470-9855-bb5dec70fa1d.png` | yes |

## raincoat-sitter1

Used identically for candidates 1–3.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

R19 accessory-specific instructions override the creature subject and landscape format above. Use case: stylized-concept. Reference 1: middle Illustrated adventure column, style only. Reference 2: approved glider, outline/shading only. Reference 3: named creature, viewing-angle/body-plan reference only; do not draw it. Reference 4: R05 item, color/material reference only.
A single a short yellow rain cape with the hood fallen behind, cut for a round, sitting creature with very short arms: a bell-shaped cape that would cover the shoulders and the top of a round tummy, with two short sleeve cuffs at its sides rather than long sleeves, seen from the same three-quarter front-right view as the attached sprout creature, no body inside. Exactly two brown buttons on its front. Match the yellow and brown buttons of the attached R05 raincoat, while changing its cut and angle, and nothing else, in the same style as the attached creature. Worn by nobody: no creature, no body parts, no mannequin, no hanger. Closed plum-ink outline, soft cel shading with light from the upper left. Square 1254x1254, plain perfectly flat white background, no shadow, no text. Item fills about 70% of the square's width or height with a clear margin on all sides. Generate one candidate image only.
```

## raincoat-sitter4

One corrected candidate, independently generated with the same references.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

R19 accessory-specific instructions override the creature subject and landscape format above. Use case: stylized-concept. Reference 1: middle Illustrated adventure column, style only. Reference 2: approved glider, outline/shading only. Reference 3: named creature, viewing-angle/body-plan reference only; do not draw it. Reference 4: R05 item, color/material reference only.
A single a short yellow rain cape with the hood fallen behind, cut for a round, sitting creature with very short arms: a bell-shaped cape that would cover the shoulders and the top of a round tummy, with two short sleeve cuffs at its sides rather than long sleeves, seen from the same three-quarter front-right view as the attached sprout creature, no body inside. Exactly two brown buttons on its front. Match the yellow and brown buttons of the attached R05 raincoat, while changing its cut and angle, and nothing else, in the same style as the attached creature. Worn by nobody: no creature, no body parts, no mannequin, no hanger. Closed plum-ink outline, soft cel shading with light from the upper left. Square 1254x1254, plain perfectly flat white background, no shadow, no text. Item fills about 70% of the square's width or height with a clear margin on all sides. Generate one candidate image only.
Correction for this candidate: the earlier candidates had long tubular sleeves and looked like a human jacket. Draw a VERY SHORT, BROAD, BELL-SHAPED RAIN CAPE, width about twice its height, covering only shoulders and upper tummy. At the two side edges put tiny cuff rims directly against the cape edge, with essentially NO sleeve length. Hood fallen behind, two brown buttons. Match the Sprout reference's gentle three-quarter front-right camera. Keep the entire cape inside the central 70% of the canvas, with at least 15% white margin on every side. This is a new cape design, do not copy R05's long-sleeved jacket silhouette.
```

## raincoat-walker1

Used identically for candidates 1–3.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

R19 accessory-specific instructions override the creature subject and landscape format above. Use case: stylized-concept. Reference 1: middle Illustrated adventure column, style only. Reference 2: approved glider, outline/shading only. Reference 3: named creature, viewing-angle/body-plan reference only; do not draw it. Reference 4: R05 item, color/material reference only.
A single a yellow dog-style rain coat for a long, low creature walking on four legs, facing right: a coat that lies along the back from the neck to the hips with the hood down at the neck end and two brown buttons under the chest, seen from the side exactly as the attached river creature is, no body inside. The neck and fallen hood are at the right end; the long back extends left toward the hips. Match the yellow and brown buttons of the attached R05 raincoat, while changing its cut and angle, and nothing else, in the same style as the attached creature. Worn by nobody: no creature, no body parts, no mannequin, no hanger. Closed plum-ink outline, soft cel shading with light from the upper left. Square 1254x1254, plain perfectly flat white background, no shadow, no text. Item fills about 70% of the square's width or height with a clear margin on all sides. Generate one candidate image only.
```

## raincoat-walker4

One corrected candidate, independently generated with the same references.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

R19 accessory-specific instructions override the creature subject and landscape format above. Use case: stylized-concept. Reference 1: middle Illustrated adventure column, style only. Reference 2: approved glider, outline/shading only. Reference 3: named creature, viewing-angle/body-plan reference only; do not draw it. Reference 4: R05 item, color/material reference only.
A single a yellow dog-style rain coat for a long, low creature walking on four legs, facing right: a coat that lies along the back from the neck to the hips with the hood down at the neck end and two brown buttons under the chest, seen from the side exactly as the attached river creature is, no body inside. The neck and fallen hood are at the right end; the long back extends left toward the hips. Match the yellow and brown buttons of the attached R05 raincoat, while changing its cut and angle, and nothing else, in the same style as the attached creature. Worn by nobody: no creature, no body parts, no mannequin, no hanger. Closed plum-ink outline, soft cel shading with light from the upper left. Square 1254x1254, plain perfectly flat white background, no shadow, no text. Item fills about 70% of the square's width or height with a clear margin on all sides. Generate one candidate image only.
Correction for this candidate: draw a DOG RAIN CAPE IN STRICT SIDE ELEVATION facing right, a long low back blanket reaching from hips at left to neck at right, no human jacket torso and NO TUBULAR SLEEVES OR REAR LEG TUBES. Lower edge is a simple draped cape hem with open space below for four legs. The hood is collapsed behind the raised neck at the right. Two brown buttons on the short under-chest fastening at the right end. The torso covering is much longer than it is tall. Do not show the top plane of the back. Match River's exact side camera. Keep the entire coat inside the central 70% of the canvas, with at least 15% white margin on every side.
```

## boots-sitter1

Used identically for candidates 1–3.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

R19 accessory-specific instructions override the creature subject and landscape format above. Use case: stylized-concept. Reference 1: middle Illustrated adventure column, style only. Reference 2: approved glider, outline/shading only. Reference 3: named creature, viewing-angle/body-plan reference only; do not draw it. Reference 4: R05 item, color/material reference only.
A single a pair of short glossy red rain boots seen from the front-below, soles and round toe caps facing the viewer, as they would look on the attached sitting sprout creature's feet held out toward the viewer, the two boots separate with a white gap. Match the red of the attached R05 boots, while changing their angle. Do not draw upright side-on boots: foreshorten the shafts behind the broad round toe caps and show both soles facing forward, and nothing else, in the same style as the attached creature. Worn by nobody: no creature, no body parts, no mannequin, no hanger. Closed plum-ink outline, soft cel shading with light from the upper left. Square 1254x1254, plain perfectly flat white background, no shadow, no text. Item fills about 70% of the square's width or height with a clear margin on all sides. Generate one candidate image only.
```

## Retained original proof

SHA-256 compared with each original tool output before publication. Dimensions, byte counts and approximate dark/color bounds below (threshold <230; bounds are diagnostic, not a cutout).

| File | Dimensions | Bytes | Bounds | SHA-256 |
| --- | --- | --- | --- | --- |
| wear-boots-sitter-3.png | 1254 × 1254 | 1,289,543 | `(58, 273, 1197, 984)` | `6bd17b29594a7b98c9b7731612c29db6c56ed9b9ad280c68684bdde824a61645` |
| wear-raincoat-sitter-4.png | 1254 × 1254 | 1,248,902 | `(102, 259, 1177, 1003)` | `99416c81e8c9438908a9d92cdab7e4cc36bd286781f0bdfb914740cf40a648f1` |
| wear-raincoat-walker-4.png | 1254 × 1254 | 1,068,136 | `(57, 369, 1211, 869)` | `54653c3dd4c52e761861c8d0635d956cd7dd0462b4cb6facd9a2333b1f3dca54` |
