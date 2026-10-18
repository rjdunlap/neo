# Creature art prompts

Ready-to-paste prompts for generating creature art in ChatGPT (or any image tool), following the [art bible](ART-BIBLE.md). Written 2026-10-17. The three pilot species are here; the second-wave species, the mood variants, portraits, wearables, eggs, the home scene and the looks are in the [art request queue](art-requests/QUEUE.md), which a routine works through one request at a time.

## How to run a pass

1. **Start fresh.** Open a new ChatGPT conversation for each creature so earlier images do not bleed in.
2. **Attach references:**
   - always [the concept sheet](concepts/art-directions-2026-10-16.png);
   - for the sprout and the river, also the approved glider `base` once it exists.
3. **Paste the prompt.** Paste the **style block** first, then the creature's `base` prompt, in the same message.
4. **Make candidates.** Ask "another version" two or three times. Download each image as the original PNG (not a screenshot).
5. **Choose and edit.** Pick one against the art bible's [review checklist](ART-BIBLE.md#review-checklist). Then, in the same conversation, run the `blink` and `happy` edit prompts on that image.
6. **Save.** Name the files `<species>-<asset>-<n>.png` (for example `glider-base-2.png`). Hand them over as described in the [art bible's process](ART-BIBLE.md#process).

If ChatGPT offers a transparent background, take it. Otherwise the prompts ask for plain white, which the pipeline can key out.

## Style block (paste first, every time)

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.
```

## Cloud glider (do first)

**`base`**
```text
Draw the cloud glider from the concept sheet as a single character sheet image: a friendly manta-ray-like flying creature gliding to the right in side view. One great swept near wing spreads up and back from the body in a broad, soft, curved triangle. A smaller far wing tip shows above the back. The wing joins the body smoothly along its whole root, with no gap. A small round head at the front has two little rounded ears, a cream face and a cream underside. The wing is lavender (#B79BE0, shadow #8C6CC8) with two or three large soft pale cloud markings (#F3E9F7). Two long flowing ribbon tails trail behind from under the wing, one lavender (#C9B3F0) and one pink (#FF9AC1). Each is fully outlined, gently S-curved, and separated from the wing and from each other by a little space. Make the lavender a step deeper than the concept sheet so it reads clearly on a white card. Wings level, in a calm mid-glide pose.
```

**`blink`** (in the same conversation, on the chosen image)
```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the white background.
```

**`happy`**
```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, ribbons, framing, size and position in the frame, and the white background.
```

**`alt`** (only if a session asks for it)
```text
Edit this exact image. Change only the near wing: raise it to the top of a wingbeat, curving upward so its pale cream underside shows. Keep the wing root exactly where it joins the body. Keep everything else identical, including the head, body, ribbons, framing and the white background.
```

## Sprout

**`base`** (attach the concept sheet and the approved glider `base`)
```text
Draw the sprout creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A squat, round, chubby creature, a little wider than tall, sitting in a three-quarter view turned toward the right. Small round ears; short stubby arms held a little away from the body; short feet with pink paw pads, set slightly apart. On top of the head grows a short green stem with two rounded leaves (#7CC35A, with darker veins), clearly separated from the ears. The body is teal (#5EC4C2, shadow #3A9A9B) with a large cream belly. Wide-set big eyes low on the face, a happy closed smile and blush.
```

Then use the same `blink` and `happy` edit prompts, with "markings, pose, ribbons" changed to "leaves, arms, feet".

## River

**`base`** (attach the concept sheet and the approved glider `base`)
```text
Draw the river creature from the concept sheet as a single character sheet image, in exactly the same style, outline and shading as the attached approved glider. A long, low, otter-like creature in side view walking to the right, with all four short legs down and slightly apart. A small rounded head is held up, with forward-set eyes, a cream muzzle with a small dark nose, and a few fine whiskers. Behind is a broad, flat, rounded paddle tail, clearly separated from the hind leg. The body is caramel (#C8956A, shadow #8F6142) with a cream belly and muzzle; the tail is dark brown (#6B4A36) with a few soft line marks. The whole long body fills about 85% of the width.
```

Then use the same `blink` and `happy` edit prompts, with "markings, pose, ribbons" changed to "legs, tail, whiskers".

## Accessories (later, after the three creatures)

The crown and scarf are code-drawn today. If they should match the illustrated cast, generate each on its own, straight-on, with the same style block. Say "a single [flower crown / striped red scarf], no character, front view". Fitting them to each creature is a rig task, not an image task.
