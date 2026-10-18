# R02 generation prompts — 2026-10-17

Built-in `image_gen.imagegen`; underlying image model undisclosed by the tool. All calls used `transparent_background: false`, following R01's documented white-background fallback after noisy alpha in transparent edits. No CLI/API fallback, resizing, pixel cleanup or recompression.

Base candidates used two explicit references, in order: `docs/rework/concepts/art-directions-2026-10-16.png` (middle Illustrated adventure column, Sprout anatomy) and `glider-base-3.png` in this folder (approved style only). These explicit references and species-only prompts isolate R02 from earlier creature generations in this routine's conversation.

All five expression calls and both portrait calls referenced ONLY the chosen `sprout-base-2.png`. Base 2 and expression attempt 1 for each mood are chosen. Portrait 1 was rejected because its torso crossed the bottom canvas edge; portrait 2 closes the bust inside the frame and is chosen. No runner-up is retained. The exact submitted prompts follow.

## base1

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the sprout creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A squat, round, chubby creature, a little wider than tall, sitting in a three-quarter view turned toward the right. Small round ears; short stubby arms held a little away from the body; short feet with pink paw pads, set slightly apart. On top of the head grows a short green stem with two rounded leaves (#7CC35A, with darker veins), clearly separated from the ears. The body is teal (#5EC4C2, shadow #3A9A9B) with a large cream belly. Wide-set big eyes low on the face, a happy closed smile and blush.

Start a new species design. Image 1 is the concept/style reference: use only its middle illustrated sprout. Image 2 is the approved outline, eye and shading reference, not anatomy. Output only ONE sprout, no glider, no sheet layout. Use opaque flat white, the approved fallback after transparent editing artifacts in R01. Fit the complete creature including leaf tips and feet with comfortable margins; keep the body wider than tall (leaves excluded).
```

## base2

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the sprout creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A squat, round, chubby creature, a little wider than tall, sitting in a three-quarter view turned toward the right. Small round ears; short stubby arms held a little away from the body; short feet with pink paw pads, set slightly apart. On top of the head grows a short green stem with two rounded leaves (#7CC35A, with darker veins), clearly separated from the ears. The body is teal (#5EC4C2, shadow #3A9A9B) with a large cream belly. Wide-set big eyes low on the face, a happy closed smile and blush.

Start a new species design. Image 1 is the concept/style reference: use only its middle illustrated sprout. Image 2 is the approved outline, eye and shading reference, not anatomy. Output only ONE sprout, no glider, no sheet layout. Use opaque flat white, the approved fallback after transparent editing artifacts in R01. Fit the complete creature including leaf tips and feet with comfortable margins; keep the body wider than tall (leaves excluded).
Candidate 2: a fresh alternative of this sprout design. Emphasize a very squat round body, slightly wider than tall, SHORT leaf stem, small round ears, and stubby arms held outward enough that there is a small white gap between each arm and the lower belly where anatomy allows. Keep eyes near-black with TWO white highlights, one large upper-left and one small lower-right, matching the glider. Full original 1536x1024 landscape, no cropping.
```

## base3

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the sprout creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A squat, round, chubby creature, a little wider than tall, sitting in a three-quarter view turned toward the right. Small round ears; short stubby arms held a little away from the body; short feet with pink paw pads, set slightly apart. On top of the head grows a short green stem with two rounded leaves (#7CC35A, with darker veins), clearly separated from the ears. The body is teal (#5EC4C2, shadow #3A9A9B) with a large cream belly. Wide-set big eyes low on the face, a happy closed smile and blush.

Start a new species design. Image 1 is the concept/style reference: use only its middle illustrated sprout. Image 2 is the approved outline, eye and shading reference, not anatomy. Output only ONE sprout, no glider, no sheet layout. Use opaque flat white, the approved fallback after transparent editing artifacts in R01. Fit the complete creature including leaf tips and feet with comfortable margins; keep the body wider than tall (leaves excluded).
Candidate 3: independent alternative. Keep the body particularly round and squat, a little wider than tall, not a tall bear; a SHORT sprout stem and exactly two rounded leaves, with clear gaps from the ears. Short smooth mitten-like arms, no claws or nails. Two distinct white eye highlights per eye, large upper-left and small lower-right. Soft cream belly, small cream muzzle, rosy cheeks. Match the approved glider's clean plum outline and simple shading. Keep comfortable margins around the entire seated creature, landscape 1536x1024.
```

## blink1

```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, leaves, arms, feet, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-eye pixels unchanged; no new props, shadows or text.
```

## happy1

```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, leaves, arms, feet, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## surprised1

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, leaves, arms, feet, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## sleepy1

```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, leaves, arms, feet, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## sad1

```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, leaves, arms, feet, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## portrait1

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat opaque white #FFFFFF background. Include the short stem and both leaves completely inside the frame, with at least 10% white margin beyond the highest leaf and every ear tip. Keep Pip's two-leaf sprout, teal body, cream muzzle and belly, glossy eyes with two highlights, and soft pink cheeks. No full seated body or feet: portrait of head and upper body only.
```

## portrait2

```text
Draw the exact Sprout creature in the attached approved image as a small centered head-and-upper-body portrait on a square 1024x1024 plain white canvas. Keep its round teal head, two round ears, SHORT stem with exactly two green leaves, glossy dark eyes with two white highlights, cream muzzle, gentle closed smile, pink blush, and a small cream upper-belly area. Same clean plum outline and soft cel shading. The portrait is a COMPLETE CLOSED SILHOUETTE with a softly rounded closed bottom below the upper belly, like a collection-card bust. NO contour may cross the canvas edge; NO torso cut off at bottom. Do not draw the lower body, legs, feet, or tail. Keep the ENTIRE bust including leaves within the central 75% square, with at least 12% empty white space on ALL FOUR sides. Head turned a little to the viewer in gentle three-quarter view. Nothing else, no props, no cast shadow, no text. This is a portrait, not a zoomed crop.
```
