# R01 generation prompts — 2026-10-17

Built-in `image_gen.imagegen`; underlying image model not disclosed by the tool. All files are original PNGs. No CLI/API fallback or pixel cleanup. Reference paths below are repository-relative.

Base calls referenced `docs/rework/concepts/art-directions-2026-10-16.png`. The second call used `basePrompt` plus: "Candidate 2, a new alternative of the same requested anatomy. No coloured halo, glow, backdrop or shadow: outside the closed creature silhouette must be completely transparent."

The first expression/alt and first three portrait calls referenced candidate 1. These were rejected after compositing/portrait review. Retained expression/alt calls and portrait 4 referenced `glider-base-3.png`, with `transparent_background: false`. Base candidate 3 used `base3Prompt` with `transparent_background: false`; the first two base calls and rejected first edits requested transparency. Raw tool files were copied byte-for-byte; discarded attempts remain outside the repository.

Chosen prompts: `base3Prompt`, `blink2Prompt`, `happy2Prompt`, `surprised2Prompt`, `sleepy2Prompt`, `sad2Prompt`, `alt2Prompt`, `portrait4Prompt`. Prompt headings with `2` denote the second attempt for that asset (the first used candidate 1); portrait numbering counts its three earlier rejected attempts. The chosen base supersedes candidate 1 because its hidden RGB halo contaminated subsequent transparent edits.

## portrait4Prompt

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; perfectly flat opaque white #FFFFFF background. Same manta-like creature: no new limbs or torso. Face large enough to read, with a small suggestion of wing roots. At least 10% empty white margin around ALL contour tips.
```
## basePrompt

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the cloud glider from the concept sheet as a single character sheet image: a friendly manta-ray-like flying creature gliding to the right in side view. One great swept near wing spreads up and back from the body in a broad, soft, curved triangle. A smaller far wing tip shows above the back. The wing joins the body smoothly along its whole root, with no gap. A small round head at the front has two little rounded ears, a cream face and a cream underside. The wing is lavender (#B79BE0, shadow #8C6CC8) with two or three large soft pale cloud markings (#F3E9F7). Two long flowing ribbon tails trail behind from under the wing, one lavender (#C9B3F0) and one pink (#FF9AC1). Each is fully outlined, gently S-curved, and separated from the wing and from each other by a little space. Make the lavender a step deeper than the concept sheet so it reads clearly on a white card. Wings level, in a calm mid-glide pose.

Reference image is style guidance only; output one glider, not a sheet or triptych. Request an actual transparent background. The whole creature including ribbons must be at least 1400 pixels wide within the 1536 pixel frame, with clear margins; keep distinct gaps between both ribbons and the wing.
```

## base3Prompt

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw the cloud glider from the concept sheet as a single character sheet image: a friendly manta-ray-like flying creature gliding to the right in side view. One great swept near wing spreads up and back from the body in a broad, soft, curved triangle. A smaller far wing tip shows above the back. The wing joins the body smoothly along its whole root, with no gap. A small round head at the front has two little rounded ears, a cream face and a cream underside. The wing is lavender (#B79BE0, shadow #8C6CC8) with two or three large soft pale cloud markings (#F3E9F7). Two long flowing ribbon tails trail behind from under the wing, one lavender (#C9B3F0) and one pink (#FF9AC1). Each is fully outlined, gently S-curved, and separated from the wing and from each other by a little space. Make the lavender a step deeper than the concept sheet so it reads clearly on a white card. Wings level, in a calm mid-glide pose.

Reference image is style guidance only; output one glider, not a sheet or triptych. Request an actual transparent background. The whole creature including ribbons must be at least 1400 pixels wide within the 1536 pixel frame, with clear margins; keep distinct gaps between both ribbons and the wing.
Candidate 3, an independent alternative matching the same specification. Use the permitted perfectly flat pure white #FFFFFF opaque background instead of transparency. Absolutely no coloured glow, halo, shadow or vignette outside the closed silhouette. Ribbons must have visible white gaps.
```

## blinkPrompt

```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the background. Preserve the transparent alpha background and exact 1536x1024 canvas. No movement of any non-eye pixel.
```

## happyPrompt

```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the background. Preserve the transparent alpha background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## surprisedPrompt

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the background. Preserve the transparent alpha background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## sleepyPrompt

```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the background. Preserve the transparent alpha background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## sadPrompt

```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the background. Preserve the transparent alpha background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## altPrompt

```text
Edit this exact image. Change only the near wing: raise it to the top of a wingbeat, curving upward so its pale cream underside shows. Keep the wing root exactly where it joins the body. Keep everything else identical, including the head, body, ribbons, framing and the background. Preserve transparent alpha and exact 1536x1024 canvas. Keep the whole raised wing inside the frame with a clear margin.
```

## portraitPrompt

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; transparent background. This is the same manta-like winged glider with small round ears and cream muzzle/underside; do not invent arms, legs or a furry torso. Keep the wing/upper body suggestion inside the frame.
```

## portrait2Prompt

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; transparent background. This is the same manta-like winged glider with small round ears and cream muzzle/underside; do not invent arms, legs or a furry torso. Keep the wing/upper body suggestion inside the frame.
Second portrait candidate: enforce generous transparent margins of at least 100 pixels on ALL FOUR sides on a 1024x1024 canvas. The character's combined head and upper wing silhouette must fit inside the central 80 percent square, no tip approaching an edge. Head-and-shoulders framing, face dominant, not a full-body action pose.
```

## portrait3Prompt

```text
Draw a collection-card portrait of this exact cloud-glider character. Same lavender cloud-patterned skin, cream face, two little rounded ears, glossy eyes, dark plum outline, soft cel shading. Face toward the viewer in gentle three-quarter view, happy closed smile. Head and a small upper-body/wing-root area only, with no long swept wing tips, no tails, no feet or arms. All contours closed and fully inside frame. Composition: a SMALL centered character portrait occupying only 70% of the square canvas, with large empty transparent margins of at least 15% on EVERY side. Actual transparent background. Square 1024x1024 or larger. Do not fill the canvas.
```

## blink2Prompt

```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the white background. Keep an opaque perfectly flat white #FFFFFF background and exact 1536x1024 canvas. No movement of any non-eye pixel.
```

## happy2Prompt

```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the white background. Keep an opaque perfectly flat white #FFFFFF background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## surprised2Prompt

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the white background. Keep an opaque perfectly flat white #FFFFFF background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## sleepy2Prompt

```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the white background. Keep an opaque perfectly flat white #FFFFFF background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## sad2Prompt

```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, ribbons, wings, framing, size and position in the frame, and the white background. Keep an opaque perfectly flat white #FFFFFF background and exact 1536x1024 canvas. No movement of any non-face pixel.
```

## alt2Prompt

```text
undefined
```
