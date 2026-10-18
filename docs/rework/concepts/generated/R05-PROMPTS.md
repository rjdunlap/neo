# R05 generation prompts — 2026-10-17

Built-in `image_gen.imagegen`; underlying image model undisclosed. All 22 calls used `transparent_background: false`, following the established white-background fallback. No CLI/API fallback, pixel cleanup, resizing, cutting or recompression.

Every call used these two explicit references in order: `docs/rework/concepts/art-directions-2026-10-16.png` (middle Illustrated adventure column, style only), then `glider-base-3.png` in this folder (approved outlines/shading only). Accessory-specific instructions override the general creature format; no character is generated. These explicit references isolate R05 from previous requests in the routine's conversation.

Three candidates were generated per item; all first three boots overlapped, so an additional independent boot candidate was generated with an explicit full-height gap. No expression or pose variants are requested. All candidates were reviewed full size and at about 120 px canvas width. Only the seven selected originals are retained in the repository.

## Call outputs

| Candidate | Original tool basename | Retained |
| --- | --- | --- |
| sunhat1 | `exec-8b879154-0673-40d7-9f02-c2b9be098d0c.png` | no |
| sunhat2 | `exec-d9dcfc33-9b01-44fc-b5bb-6b32aae11236.png` | yes |
| sunhat3 | `exec-f3d1786d-64d8-4546-af89-efad779ec144.png` | no |
| sunglasses1 | `exec-d3f591fe-e7e1-4969-94a6-eb56b48c1cbd.png` | no |
| sunglasses2 | `exec-6f91e7f2-f90d-4480-8104-9a30795ea0ae.png` | no |
| sunglasses3 | `exec-97c7ebdb-342e-4b0e-a0d4-283a759fdc8c.png` | yes |
| raincoat1 | `exec-367ddaa3-2dff-4ebf-b84b-912f96edad2b.png` | yes |
| raincoat2 | `exec-aaf53611-92fb-4830-8986-0c34207c37eb.png` | no |
| raincoat3 | `exec-e9665ff6-06d7-4e01-8e62-6ba7e31d8bdf.png` | no |
| umbrella1 | `exec-b64925db-492a-4109-a4e6-be1f9e4e8008.png` | no |
| umbrella2 | `exec-dfda1136-eb48-4044-ace4-7a40a69fd178.png` | no |
| umbrella3 | `exec-434d00c2-6f4b-42a8-a7b0-4a211b74f2a7.png` | yes |
| boots1 | `exec-8bd1ca16-40ec-4ad0-855a-b8b5e216590c.png` | no |
| boots2 | `exec-9062dc32-3693-4b0a-b165-9c8405f17e88.png` | no |
| boots3 | `exec-8dc01fa2-13e1-47dc-8f04-22ed866a53c3.png` | no |
| boots4 | `exec-c2742f77-b5a3-431a-84b5-84cca78bdf2f.png` | yes |
| beanie1 | `exec-96c51a63-c1d1-474f-bef4-3de292a9c1b5.png` | yes |
| beanie2 | `exec-45e065b7-60b7-4214-875a-65d72fc5a172.png` | no |
| beanie3 | `exec-c63f3a61-bdcc-4c8a-a0ce-987b8df7f83b.png` | no |
| mittens1 | `exec-7f5e3d9b-cd12-4ccc-b283-d77196c38d83.png` | yes |
| mittens2 | `exec-9f8c6b00-fa6b-4cc5-b29b-ad2b9b3ded28.png` | no |
| mittens3 | `exec-84ce976c-968d-4125-bb1f-afbafdaf22e6.png` | no |

## Shared style block

Each exact submitted prompt is this block, followed by **two newline characters**, then the corresponding candidate block below. This removes repetition while preserving the complete submitted text.

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.
```

## sunhat1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a wide-brimmed straw sun hat, warm yellow with a pink band, seen from slightly above and to the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: ONE standalone sun hat, no head, body or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). No realistic straw texture, just a few simple curved weave lines. Rounded wide brim, pink ribbon band, no extra decorations. All contours closed and inside frame. Candidate 1: independent alternative of this same specification, with simple clear shapes that read at 120px.
```

## sunhat2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a wide-brimmed straw sun hat, warm yellow with a pink band, seen from slightly above and to the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: ONE standalone sun hat, no head, body or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). No realistic straw texture, just a few simple curved weave lines. Rounded wide brim, pink ribbon band, no extra decorations. All contours closed and inside frame. Candidate 2: independent alternative of this same specification, with simple clear shapes that read at 120px.
```

## sunhat3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a wide-brimmed straw sun hat, warm yellow with a pink band, seen from slightly above and to the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: ONE standalone sun hat, no head, body or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). No realistic straw texture, just a few simple curved weave lines. Rounded wide brim, pink ribbon band, no extra decorations. All contours closed and inside frame. Candidate 3: independent alternative of this same specification, with simple clear shapes that read at 120px.
```

## sunglasses1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of round sunglasses with sky-blue lenses and an orange frame, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Two round sky-blue lenses in a single orange frame, gently three-quarter front view; arms visible to suggest fitting a right-facing creature. Both lenses are filled sky blue, not empty white holes. Keep a clear orange bridge, closed plum contours around the rims and tips; no face, reflections of scenery, text or decals. Candidate 1: independent alternative of the same specification; every part stays comfortably inside the square canvas.
```

## sunglasses2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of round sunglasses with sky-blue lenses and an orange frame, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Two round sky-blue lenses in a single orange frame, gently three-quarter front view; arms visible to suggest fitting a right-facing creature. Both lenses are filled sky blue, not empty white holes. Keep a clear orange bridge, closed plum contours around the rims and tips; no face, reflections of scenery, text or decals. Candidate 2: independent alternative of the same specification; every part stays comfortably inside the square canvas.
```

## sunglasses3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of round sunglasses with sky-blue lenses and an orange frame, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Two round sky-blue lenses in a single orange frame, gently three-quarter front view; arms visible to suggest fitting a right-facing creature. Both lenses are filled sky blue, not empty white holes. Keep a clear orange bridge, closed plum contours around the rims and tips; no face, reflections of scenery, text or decals. Candidate 3: independent alternative of the same specification; every part stays comfortably inside the square canvas.
```

## raincoat1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a yellow hooded raincoat with the hood down and two big buttons, seen from the side as if worn by a creature facing right, no body inside. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). A single unworn yellow raincoat, gently three-quarter SIDE view oriented as if a creature inside it would face RIGHT. Hood is DOWN, folded behind the collar; no raised hood, head, body, hands, hanger or mannequin. Exactly TWO big simple buttons on the front. Short rounded sleeves, complete closed hem and sleeve outlines, collar opening visible. No logos, pockets full of things, ground, texture or cast shadow. All garment edges fully inside the square with at least 10% margin. Candidate 1: independent alternative of the same specification.
```

## raincoat2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a yellow hooded raincoat with the hood down and two big buttons, seen from the side as if worn by a creature facing right, no body inside. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). A single unworn yellow raincoat, gently three-quarter SIDE view oriented as if a creature inside it would face RIGHT. Hood is DOWN, folded behind the collar; no raised hood, head, body, hands, hanger or mannequin. Exactly TWO big simple buttons on the front. Short rounded sleeves, complete closed hem and sleeve outlines, collar opening visible. No logos, pockets full of things, ground, texture or cast shadow. All garment edges fully inside the square with at least 10% margin. Candidate 2: independent alternative of the same specification.
```

## raincoat3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a yellow hooded raincoat with the hood down and two big buttons, seen from the side as if worn by a creature facing right, no body inside. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory (a matched pair where specified), no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). A single unworn yellow raincoat, gently three-quarter SIDE view oriented as if a creature inside it would face RIGHT. Hood is DOWN, folded behind the collar; no raised hood, head, body, hands, hanger or mannequin. Exactly TWO big simple buttons on the front. Short rounded sleeves, complete closed hem and sleeve outlines, collar opening visible. No logos, pockets full of things, ground, texture or cast shadow. All garment edges fully inside the square with at least 10% margin. Candidate 3: independent alternative of the same specification.
```

## umbrella1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: an open blue umbrella with white dots and a short curved handle, seen from the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One open sky/deep-blue umbrella with a few large simple WHITE DOTS on its canopy and a SHORT curved J-handle, SIDE view. All ribs and canopy tips rounded and safely inside the square. Plum ink outlines including the handle, soft upper-left cel shading. Plain white dots are part of the blue fabric, not transparency holes. No raindrops, splashes, hand, creature, ground, shadow, text or scenery. Simple sturdy stem, no tiny hardware. Candidate 1: independent alternative of the same specification.
```

## umbrella2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: an open blue umbrella with white dots and a short curved handle, seen from the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One open sky/deep-blue umbrella with a few large simple WHITE DOTS on its canopy and a SHORT curved J-handle, SIDE view. All ribs and canopy tips rounded and safely inside the square. Plum ink outlines including the handle, soft upper-left cel shading. Plain white dots are part of the blue fabric, not transparency holes. No raindrops, splashes, hand, creature, ground, shadow, text or scenery. Simple sturdy stem, no tiny hardware. Candidate 2: independent alternative of the same specification.
```

## umbrella3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: an open blue umbrella with white dots and a short curved handle, seen from the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One open sky/deep-blue umbrella with a few large simple WHITE DOTS on its canopy and a SHORT curved J-handle, SIDE view. All ribs and canopy tips rounded and safely inside the square. Plum ink outlines including the handle, soft upper-left cel shading. Plain white dots are part of the blue fabric, not transparency holes. No raindrops, splashes, hand, creature, ground, shadow, text or scenery. Simple sturdy stem, no tiny hardware. Candidate 3: independent alternative of the same specification.
```

## boots1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of red rain boots side by side, seen from the side, toes pointing right. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO matching red rain boots, side-by-side in SIDE view with BOTH TOES POINTING RIGHT. One boot may sit a little behind the other, but both boots' full toes and soles are visible and a small WHITE GAP separates the boots. Rounded short toddler proportions, simple thick red rubber, darker red soles, visible open boot tops. No feet, legs, hands, creature, mannequin, laces, logos, buckles, puddles, ground or cast shadows. Keep entire pair inside central 80% of square. Candidate 1: independent alternative of the same specification.
```

## boots2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of red rain boots side by side, seen from the side, toes pointing right. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO matching red rain boots, side-by-side in SIDE view with BOTH TOES POINTING RIGHT. One boot may sit a little behind the other, but both boots' full toes and soles are visible and a small WHITE GAP separates the boots. Rounded short toddler proportions, simple thick red rubber, darker red soles, visible open boot tops. No feet, legs, hands, creature, mannequin, laces, logos, buckles, puddles, ground or cast shadows. Keep entire pair inside central 80% of square. Candidate 2: independent alternative of the same specification.
```

## boots3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of red rain boots side by side, seen from the side, toes pointing right. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO matching red rain boots, side-by-side in SIDE view with BOTH TOES POINTING RIGHT. One boot may sit a little behind the other, but both boots' full toes and soles are visible and a small WHITE GAP separates the boots. Rounded short toddler proportions, simple thick red rubber, darker red soles, visible open boot tops. No feet, legs, hands, creature, mannequin, laces, logos, buckles, puddles, ground or cast shadows. Keep entire pair inside central 80% of square. Candidate 3: independent alternative of the same specification.
```

## boots4

```text
R05 accessory-specific format: exactly TWO matching red rubber rain boots as TWO COMPLETELY SEPARATE shapes arranged in a horizontal row on a square 1024x1024 white canvas. Both shown in STRICT SIDE view, BOTH TOES POINTING RIGHT. LEFT boot occupies x=100..450; RIGHT boot occupies x=575..925. A continuous wide WHITE STRIP must run vertically between the two boots from top to bottom; absolutely NO overlap or touching at toes, soles, shafts or rims. Each boot has a simple darker red sole and open top, rounded toddler shape, closed plum-ink contour, upper-LEFT highlights and simple soft cel shading. No feet, legs, creature, mannequin, props, logos, laces, scenery, ground or cast shadow. Keep both whole boots and every tip comfortably inside the canvas. The two attached images are STYLE references only, especially the approved glider's plum contour and simple shading. One image containing the matched pair; do not invent extra boots.
```

## beanie1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a knitted purple beanie with a cream pompom, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One knitted PURPLE beanie with a soft CREAM pompom on top, seen from front and a little to the side, fitting a right-facing creature. Rounded dome, broad folded ribbed brim, only a few simple curved stitch lines; no realistic yarn texture. Cream pompom has a softly scalloped closed plum outline, not fine fuzzy strands. No head, ears, face, mannequin, logos or extra decorations. Entire hat and pompom remain inside the central 80% square with clear margin. Candidate 1: independent alternative of the same specification.
```

## beanie2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a knitted purple beanie with a cream pompom, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One knitted PURPLE beanie with a soft CREAM pompom on top, seen from front and a little to the side, fitting a right-facing creature. Rounded dome, broad folded ribbed brim, only a few simple curved stitch lines; no realistic yarn texture. Cream pompom has a softly scalloped closed plum outline, not fine fuzzy strands. No head, ears, face, mannequin, logos or extra decorations. Entire hat and pompom remain inside the central 80% square with clear margin. Candidate 2: independent alternative of the same specification.
```

## beanie3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a knitted purple beanie with a cream pompom, seen from the front and a little to the side. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete item filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one standalone accessory, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). One knitted PURPLE beanie with a soft CREAM pompom on top, seen from front and a little to the side, fitting a right-facing creature. Rounded dome, broad folded ribbed brim, only a few simple curved stitch lines; no realistic yarn texture. Cream pompom has a softly scalloped closed plum outline, not fine fuzzy strands. No head, ears, face, mannequin, logos or extra decorations. Entire hat and pompom remain inside the central 80% square with clear margin. Candidate 3: independent alternative of the same specification.
```

## mittens1

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of green knitted mittens with cream cuffs, thumbs out, seen from the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO green knitted MITTENS, front view, as a matching left/right pair with THUMBS POINTING OUTWARD (left mitten thumb points left, right mitten thumb points right). Each has a warm CREAM ribbed cuff, a single rounded finger pouch, and one short thumb pouch. A continuous white gap separates the entire pair, no overlap or touching. A few simple seam/rib lines suggest knitting, no realistic yarn texture. No individual fingers, hands, creature, string, logos, extra decorations or cast shadows. Keep every thumb and cuff within the central 80% square. Candidate 1: independent alternative of the same specification.
```

## mittens2

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of green knitted mittens with cream cuffs, thumbs out, seen from the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO green knitted MITTENS, front view, as a matching left/right pair with THUMBS POINTING OUTWARD (left mitten thumb points left, right mitten thumb points right). Each has a warm CREAM ribbed cuff, a single rounded finger pouch, and one short thumb pouch. A continuous white gap separates the entire pair, no overlap or touching. A few simple seam/rib lines suggest knitting, no realistic yarn texture. No individual fingers, hands, creature, string, logos, extra decorations or cast shadows. Keep every thumb and cuff within the central 80% square. Candidate 2: independent alternative of the same specification.
```

## mittens3

```text
A single wardrobe accessory image and nothing else, in the same style as the attached approved creature: a pair of green knitted mittens with cream cuffs, thumbs out, seen from the front. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024 or larger square, plain flat opaque white background, the complete pair filling about 80% of the frame with a clear margin.

Accessory-specific format overrides the general creature format: one matched pair, no head, body, hands or mannequin. References supply style only (image 1 middle Illustrated adventure column, image 2 approved glider outline and shading). Exactly TWO green knitted MITTENS, front view, as a matching left/right pair with THUMBS POINTING OUTWARD (left mitten thumb points left, right mitten thumb points right). Each has a warm CREAM ribbed cuff, a single rounded finger pouch, and one short thumb pouch. A continuous white gap separates the entire pair, no overlap or touching. A few simple seam/rib lines suggest knitting, no realistic yarn texture. No individual fingers, hands, creature, string, logos, extra decorations or cast shadows. Keep every thumb and cuff within the central 80% square. Candidate 3: independent alternative of the same specification.
```
