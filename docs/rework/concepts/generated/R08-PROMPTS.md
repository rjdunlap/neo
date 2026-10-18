# R08 exact generation prompts

Built-in `image_gen.imagegen`; model undisclosed by the tool. All five calls used `transparent_background: false`, the brief's white-background fallback. Original outputs were preserved without pixel changes.

Base candidates used references in this order: [approved Sprout](sprout-base-2.png), [concept sheet](../art-directions-2026-10-16.png), [approved glider](glider-base-3.png). The two color edits each used only [chosen Sprout egg](egg-sprout-2.png) as their explicit image reference. Candidate 2 is chosen; candidates 1 and 3 are not retained in the repository. No retries or missing variants.

## sprout1

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

A single egg standing upright and nothing else, in the same style as the attached creature: cream white (#F6E6D8) with four or five large soft round spots in the creature's teal (#5EC4C2), a closed plum-ink outline, soft cel shading with light from the upper left and one soft highlight. No crack, no ground, no shadow, no text. Square 1024x1024, the egg filling about 80% of the height with a clear margin, plain flat white background (or transparent).

Egg-specific format overrides the general creature format: output ONE egg, no face, leaves, ears, creature, nest or other prop. A simple upright egg silhouette with rounded narrow top and broad lower half, exactly FIVE large soft round teal spots, all within the shell. Reference 1 is the approved Sprout for color; reference 2 the concept sheet's middle Illustrated adventure style; reference 3 the approved glider's outline/shading. Opaque perfectly flat white background, 1024x1024 or larger square. Keep a generous clear margin on all sides. This base will be edited only in spot color for the other two starters.
```

## sprout2

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

A single egg standing upright and nothing else, in the same style as the attached creature: cream white (#F6E6D8) with four or five large soft round spots in the creature's teal (#5EC4C2), a closed plum-ink outline, soft cel shading with light from the upper left and one soft highlight. No crack, no ground, no shadow, no text. Square 1024x1024, the egg filling about 80% of the height with a clear margin, plain flat white background (or transparent).

Egg-specific format overrides the general creature format: output ONE egg, no face, leaves, ears, creature, nest or other prop. A simple upright egg silhouette with rounded narrow top and broad lower half, exactly FIVE large soft round teal spots, all within the shell. Reference 1 is the approved Sprout for color; reference 2 the concept sheet's middle Illustrated adventure style; reference 3 the approved glider's outline/shading. Opaque perfectly flat white background, 1024x1024 or larger square. Keep a generous clear margin on all sides. This base will be edited only in spot color for the other two starters.
Candidate 2: independent alternative of the same egg. A simple slightly broader lower half and rounded top, FIVE clear round teal spots, not speckles. Keep spots separated and fully inside the closed shell silhouette. Cream shell with one soft upper-left highlight, simple two-tone shading, no ground shadow. Center the whole egg within about 80% of the square height, with clear margins.
```

## sprout3

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

A single egg standing upright and nothing else, in the same style as the attached creature: cream white (#F6E6D8) with four or five large soft round spots in the creature's teal (#5EC4C2), a closed plum-ink outline, soft cel shading with light from the upper left and one soft highlight. No crack, no ground, no shadow, no text. Square 1024x1024, the egg filling about 80% of the height with a clear margin, plain flat white background (or transparent).

Egg-specific format overrides the general creature format: output ONE egg, no face, leaves, ears, creature, nest or other prop. A simple upright egg silhouette with rounded narrow top and broad lower half, exactly FIVE large soft round teal spots, all within the shell. Reference 1 is the approved Sprout for color; reference 2 the concept sheet's middle Illustrated adventure style; reference 3 the approved glider's outline/shading. Opaque perfectly flat white background, 1024x1024 or larger square. Keep a generous clear margin on all sides. This base will be edited only in spot color for the other two starters.
Candidate 3: independent alternative. A chunky friendly egg with a broad rounded base and gently narrower rounded top, centered with about 10% empty white margin on all sides. Exactly FIVE softly rounded teal spots of varied large sizes, separated from one another, painted flat on the shell (not raised blobs). Simple upper-left highlight and soft two-tone cel shading. Closed plum outline all around, no crack, face, character, nest, ground or cast shadow. Same style and species teal as the references.
```

## river1

```text
Edit this exact image. Change only the teal spots to caramel (#C8956A) for the River starter egg. Keep the egg's cream shell, shell shading and highlights, plum outline, the exact shapes, sizes and positions of all five spots, the pose, framing, size and position in the frame, and the white background identical. Preserve the existing lighter and darker spot shading in corresponding caramel tones. No new elements, no cracks, no ground shadow, no text. Output the same square dimensions.
```

## glider1

```text
Edit this exact image. Change only the teal spots to lavender (#B79BE0) for the Glider starter egg. Keep the egg's cream shell, shell shading and highlights, plum outline, the exact shapes, sizes and positions of all five spots, the pose, framing, size and position in the frame, and the white background identical. Preserve the existing lighter and darker spot shading in corresponding lavender tones. No new elements, no cracks, no ground shadow, no text. Output the same square dimensions.
```

