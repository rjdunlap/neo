# R03 generation prompts — 2026-10-17

Built-in `image_gen.imagegen`; underlying image model undisclosed by the tool. All calls used `transparent_background: false`, retaining R01's white-background fallback. Original PNGs are copied unchanged, with no CLI/API fallback, resizing, cleanup or recompression.

The first three base calls referenced, in order, `docs/rework/concepts/art-directions-2026-10-16.png` (middle Illustrated adventure column, River anatomy) and `glider-base-3.png` in this folder (approved style only). Species-only prompts and explicit references isolate this request from earlier generations in the routine's conversation.

The three candidates were reviewed at full size and 120 px canvas width. Candidate 1 was selected for its lifted neck and readable four-foot silhouette, then refined with an image edit adding the second white eye highlights; that untouched tool output is `river-base-4.png`, the chosen base. The refinement referenced the original candidate 1. Candidate 1's exact original tool basename was `exec-d6a74c81-63f2-4aa5-9f70-5564415125c7.png`. No runner-up retained.

All mood and portrait calls referenced ONLY `river-base-4.png`. Blink/happy/sleepy/sad attempt 1 are retained. Surprised attempt 1 was rejected for drawing a far brow outside the head silhouette; attempt 2 is retained. Portrait attempt 1 was rejected for an unoutlined lower bust boundary; portrait 2 closes the outline and is retained. Exact submitted prompts follow.

## base1

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the river creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A long, low, otter-like creature in side view walking to the right, with all four short legs down and slightly apart. A small rounded head is held up, with forward-set eyes, a cream muzzle with a small dark nose, and a few fine whiskers. Behind is a broad, flat, rounded paddle tail, clearly separated from the hind leg. The body is caramel (#C8956A, shadow #8F6142) with a cream belly and muzzle; the tail is dark brown (#6B4A36) with a few soft line marks. The whole long body fills about 85% of the width.

Fresh species design: output ONE River only. Reference 1 supplies the middle Illustrated adventure column's otter anatomy; reference 2 supplies approved outline/eye/shading style only, never wings or ribbons. Plain opaque white background, the permitted fallback established in R01. Side view facing right, long horizontal body, clearly lifted small head and visible neck, all FOUR short feet visible and down, with small white spaces between legs. The paddle tail attaches only to the rump; a distinct white gap separates its lower edge from the rear paw. No ground line or ground shadow. Closed plum outline even around tail/whiskers. Two white highlights in each glossy near-black eye. Landscape 1536x1024, clear margins on every side.
```

## base2

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the river creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A long, low, otter-like creature in side view walking to the right, with all four short legs down and slightly apart. A small rounded head is held up, with forward-set eyes, a cream muzzle with a small dark nose, and a few fine whiskers. Behind is a broad, flat, rounded paddle tail, clearly separated from the hind leg. The body is caramel (#C8956A, shadow #8F6142) with a cream belly and muzzle; the tail is dark brown (#6B4A36) with a few soft line marks. The whole long body fills about 85% of the width.

Fresh species design: output ONE River only. Reference 1 supplies the middle Illustrated adventure column's otter anatomy; reference 2 supplies approved outline/eye/shading style only, never wings or ribbons. Plain opaque white background, the permitted fallback established in R01. Side view facing right, long horizontal body, clearly lifted small head and visible neck, all FOUR short feet visible and down, with small white spaces between legs. The paddle tail attaches only to the rump; a distinct white gap separates its lower edge from the rear paw. No ground line or ground shadow. Closed plum outline even around tail/whiskers. Two white highlights in each glossy near-black eye. Landscape 1536x1024, clear margins on every side.
Candidate 2, a new alternative of the same River design. Keep the head lifted but SMALL relative to the long low body, with a clearly visible cream neck. Make both eye highlights explicit: one large white upper-left, one tiny white lower-right. Four short feet down, small open white gaps between them. Tail broad, flat and rounded, separated from rear foot by an open white wedge. Keep the creature's total width including whiskers under 90% of the canvas, with at least 70 px empty white space beyond every whisker and tail tip. No fur tufts, simply rounded baby anatomy.
```

## base3

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the river creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A long, low, otter-like creature in side view walking to the right, with all four short legs down and slightly apart. A small rounded head is held up, with forward-set eyes, a cream muzzle with a small dark nose, and a few fine whiskers. Behind is a broad, flat, rounded paddle tail, clearly separated from the hind leg. The body is caramel (#C8956A, shadow #8F6142) with a cream belly and muzzle; the tail is dark brown (#6B4A36) with a few soft line marks. The whole long body fills about 85% of the width.

Fresh species design: output ONE River only. Reference 1 supplies the middle Illustrated adventure column's otter anatomy; reference 2 supplies approved outline/eye/shading style only, never wings or ribbons. Plain opaque white background, the permitted fallback established in R01. Side view facing right, long horizontal body, clearly lifted small head and visible neck, all FOUR short feet visible and down, with small white spaces between legs. The paddle tail attaches only to the rump; a distinct white gap separates its lower edge from the rear paw. No ground line or ground shadow. Closed plum outline even around tail/whiskers. Two white highlights in each glossy near-black eye. Landscape 1536x1024, clear margins on every side.
Candidate 3: independent alternative. Favor a smooth rounded long low otter shape, with the chest and neck lifted, four very short legs clearly spaced underneath, and a large dark rounded paddle tail behind with a WHITE GAP from the hind foot. Avoid pointed fur tufts. Make the near eye glossy near-black with TWO WHITE highlights, a large upper-left and a small lower-right. Total character INCLUDING whiskers occupies only 85% of canvas width, not edge to edge: leave at least 100 px white margin left and right in the 1536x1024 image. All feet down, no ground/shadow, no extra character.
```

## base4

```text
Edit this exact River image. Change ONLY the white eye highlights: put one small crisp WHITE circular highlight at the lower-right inside each visible glossy near-black eye, in addition to the existing large white highlight. For the tiny far eye the second dot may be very small. Do not change the eye shapes, face, mouth, eyebrows, cream muzzle, whiskers, anatomy, head position, legs, tail, colours, shading, outline, framing, canvas or white background. Preserve exact 1536x1024 size and all non-eye pixels.
```

## blink1

```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, legs, tail, whiskers, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-eye pixels unchanged; no new props, shadows or text.
```

## happy1

```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, legs, tail, whiskers, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## surprised1

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, legs, tail, whiskers, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## sleepy1

```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, legs, tail, whiskers, framing, size and position in the frame, and the white background. Preserve the exact 1536x1024 canvas and the entire outer silhouette including head and ears. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## surprised2

```text
Edit this exact River base image. Change ONLY the interior face: slightly widen the eyes, raise the near brow a little WITHIN the existing head outline, and turn the mouth into a small round 'o'. Preserve both white eye highlights. The far brow must remain INSIDE the head: do not draw any brow arc above the skull or change the ear. Absolutely preserve the entire outer silhouette including the head and ears and whiskers; do not touch any pixel outside the face interior. Keep body, cream muzzle boundary, legs, paddle tail, colours, markings, framing, 1536x1024 canvas and plain white background exactly fixed. No extra marks or props.
```

## sad1

```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, legs, tail, whiskers, framing, size and position in the frame, and the white background. Preserve exact 1536x1024 canvas and the entire outer silhouette including head and ears. Brows stay entirely inside the face, never above the skull. Keep all non-face pixels unchanged; no new props, shadows or text.
```

## portrait1

```text
Draw the same River creature as in the attached approved image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy closed-smile expression. Exactly the same style, outline weight, caramel colours, cream muzzle and chest, small rounded ears, whiskers and glossy eyes with TWO white highlights as the attached image. Square 1024x1024 or larger; the portrait fills about 75–80% of the frame with a clear empty WHITE margin on ALL FOUR sides; nothing else in the image; perfectly flat opaque white background. This is a complete CLOSED head-and-shoulders bust with a softly rounded closed bottom under the upper chest; do not crop the torso at the bottom edge. Keep ALL whisker tips and ear tips inside the central 80% square. No full body, legs or paddle tail; no props, ground shadow or text.
```

## portrait2

```text
Draw a collection-card portrait of this EXACT River creature, matching its face, caramel skin, cream muzzle/chest, round ears, whiskers, two eye highlights, plum ink outline and soft cel shading. A small centered head-and-upper-chest bust in gentle three-quarter view facing right, happy closed smile. Square 1024x1024 or larger, with at least 12% empty plain white margin on every side including beyond whiskers. IMPORTANT: trace a CLOSED DARK PLUM OUTLINE completely around the entire bust, INCLUDING a visible rounded ink line under the bottom of the chest. The chest must end in a rounded outlined contour INSIDE the frame, never a faded edge or unoutlined crop. No lower body, feet or tail. One bust only; no props, no scenery, no cast shadow, no text. Same character, not a new species.
```
