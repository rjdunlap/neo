# R09 exact generation prompts

Built-in `image_gen.imagegen`; model undisclosed by the tool. Every call used `transparent_background: false` (white fallback). Repository images are untouched source PNGs.

Base candidates 1–3 used references in this order: [concept sheet](../art-directions-2026-10-16.png), [approved glider](glider-base-3.png). Candidate 2 was chosen for anatomy and refined as base 4 using candidate 2 as its sole reference. Every expression, tucked-in pose and portrait used only [base 4](tote-base-4.png) as its explicit reference. Candidate 1 and 3, unrefined candidate 2 and surprised 1 were not retained in the repository. Surprised 1 lost the nose; surprised 2 is chosen. No missing assets.

## base1

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a round little hermit crab, seen in a gentle three-quarter view turned toward the viewer's right. A chubby round body in coral orange (#FF9A3C, shadow #D9731A) with a cream face, big glossy eyes set in the face (no eye stalks), a tiny dark dot nose, blush and a happy closed smile. Two big rounded claws held up in front like mittens, clearly separate from the body. Four short legs, slightly apart. On its back sits a spiral shell in sand yellow (#FFD54A, shadow #D9A520) with a soft pink lip at its opening; the shell is a clearly separate shape with a small gap of outline between it and the body where they meet at the sides. Relaxed neutral pose, standing on nothing.

Reference 1 is the concept sheet (middle Illustrated adventure column); reference 2 is the approved glider for style. Exactly four short rounded legs and two blunt mitten claws. Keep all limbs and shell inside clear margins; the crab's face is on the RIGHT side of its shell. Opaque plain white background.
```

## base2

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a round little hermit crab, seen in a gentle three-quarter view turned toward the viewer's right. A chubby round body in coral orange (#FF9A3C, shadow #D9731A) with a cream face, big glossy eyes set in the face (no eye stalks), a tiny dark dot nose, blush and a happy closed smile. Two big rounded claws held up in front like mittens, clearly separate from the body. Four short legs, slightly apart. On its back sits a spiral shell in sand yellow (#FFD54A, shadow #D9A520) with a soft pink lip at its opening; the shell is a clearly separate shape with a small gap of outline between it and the body where they meet at the sides. Relaxed neutral pose, standing on nothing.

Reference 1 is the concept sheet (middle Illustrated adventure column); reference 2 is the approved glider for style. Exactly four short rounded legs and two blunt mitten claws. Keep all limbs and shell inside clear margins; the crab's face is on the RIGHT side of its shell. Opaque plain white background.

Candidate 2: another independent design, not a copy of candidate 1. Make exactly FOUR short oval walking legs visible below the body, with small white gaps between the four feet. TWO separate raised rounded mitten claws, without pointed tips. A simple round spiral shell, distinctly outlined against the coral body, with a pink opening lip. Keep a tiny DOT nose, two white highlights per eye and a clear closed contour around every limb. Generous empty margin.
```

## base3

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.

Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a round little hermit crab, seen in a gentle three-quarter view turned toward the viewer's right. A chubby round body in coral orange (#FF9A3C, shadow #D9731A) with a cream face, big glossy eyes set in the face (no eye stalks), a tiny dark dot nose, blush and a happy closed smile. Two big rounded claws held up in front like mittens, clearly separate from the body. Four short legs, slightly apart. On its back sits a spiral shell in sand yellow (#FFD54A, shadow #D9A520) with a soft pink lip at its opening; the shell is a clearly separate shape with a small gap of outline between it and the body where they meet at the sides. Relaxed neutral pose, standing on nothing.

Reference 1 is the concept sheet (middle Illustrated adventure column); reference 2 is the approved glider for style. Exactly four short rounded legs and two blunt mitten claws. Keep all limbs and shell inside clear margins; the crab's face is on the RIGHT side of its shell. Opaque plain white background.

Candidate 3: independent alternative with a compact round spiral shell, a clear separate pink-rimmed opening and a baby crab emerging toward the right. Four separate stubby rounded walking legs, two rounded mitten claws held a little away from the cheeks. The claws have only a soft notch, never sharp pincers. Nose is a tiny ROUND DOT, not a triangular mammal nose. Exactly two WHITE highlights per glossy eye, one big upper-left and one small lower-right. Keep clear white gaps between moving parts wherever practical and generous margins.
```

## base4

```text
Edit this exact image. Change only these tiny facial details: replace the triangular nose with a tiny round dark plum DOT nose, and add one small WHITE lower-right highlight to EACH eye so each glossy eye has a large upper-left white highlight and a small lower-right white highlight. Keep the complete creature outline, all four legs, two claws, shell spiral and pink lip, the face shape, mouth, blush, colors, shading, framing, canvas size, position and white background identical. No other changes.
```

## blink1

```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background.
```

## happy1

```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background. Keep any brows inside the existing head silhouette.
```

## surprised1

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background. Keep both brows and every facial feature fully inside the existing head silhouette; do not extend the outer outline.
```

## surprised2

```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background. Keep both brows and every facial feature fully inside the existing head silhouette; do not extend the outer outline.

Retain the tiny round dark dot NOSE at exactly its current position between the eyes and mouth. The small o-shaped mouth is BELOW that nose, not replacing it. Keep the cream facial patch boundary fixed. Only eyes, brows and mouth may change.
```

## sleepy1

```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background. Preserve the tiny round dot nose and cream facial patch boundary; all features stay inside the head silhouette.
```

## sad1

```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, claws, legs, shell, framing, size and position in the frame, and the background. Preserve the tiny round dot nose and cream facial patch boundary; keep the tear and brows fully INSIDE the existing head silhouette.
```

## alt1

```text
Edit this exact image. Change only the body: the crab has pulled itself into its shell so that only its face, eyes and the tips of both claws peek out of the shell's opening. Keep the shell, its position, the outline, colours, framing and background identical. The walking legs are tucked inside and invisible. Preserve the exact yellow shell spiral, pink lip and shell outer silhouette in their original pixel positions. A smaller shy smiling face, with dot nose and glossy eyes, peeks from inside the existing opening; just two small blunt claw tips at the opening. No other elements or shadow.
```

## portrait1

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat white background (or transparent if available).

This is Tote, the coral hermit crab with cream face, tiny round dot nose, two white highlights per eye and a yellow spiral shell with pink lip behind the head. Show upper body, two rounded mitten claws and enough shell to identify it, no walking legs. Fully CLOSE every contour at the bottom of the bust; all shell and claw tips remain inside 10% clear margins. Opaque white fallback. No ground, shadow, text or frame.
```

