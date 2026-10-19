# R18 exact generation prompts

Generated 2026-10-19 with built-in `image_gen.imagegen`; model name undisclosed. Use case: precise-object-edit. All calls used `transparent_background: false` and explicit local reference PNGs; opaque white fallback retained untouched. This request edits an approved base rather than choosing a new base, so no three-base search was needed. Each stage succeeded on its first call; no missing variants.

## sproutCrack1

Chosen: [egg-sprout-crack-1.png](egg-sprout-crack-1.png). Reference order: [egg-sprout-2.png](egg-sprout-2.png).

```text
Edit this exact image. Add a single zigzag crack line in the same plum ink across the upper third of the shell, with two short branches, and nothing else: no pieces missing, no light inside. Keep the egg's shape, size, position, spots, outline, shading and background identical.

This is a precise stage edit of the approved Sprout egg, not a new egg. Crack runs roughly across y=450–480 in the 1254 square, above the lower two thirds. Preserve all five teal spot shapes and highlights, cream shell, outer contour and exact framing. Add only a thin plum zigzag and TWO short branching crack lines. No face, hatchling, chips, glow, ground or cast shadow. Output same 1254x1254 opaque white fallback.
```

Original tool filename: `exec-d1157556-9ef8-4d9c-b760-35d979f3845b.png`.

## sproutOpen1

Chosen: [egg-sprout-open-1.png](egg-sprout-open-1.png). Reference order: [egg-sprout-2.png](egg-sprout-2.png), [egg-sprout-crack-1.png](egg-sprout-crack-1.png).

```text
Edit this exact image. The top of the shell has broken off along the crack and lifted a little, tilted, with a jagged edge, showing a dark warm interior; the lower shell, its spots, outline, shading, size and position stay identical, and the background stays plain white. No creature inside, no pieces on the ground.

Reference 1 is the original approved Sprout egg and defines exact lower-shell geometry and markings. Reference 2 is its cracked stage and defines the zigzag separation. Lift only the top cap about 50 px upward and tilt gently, keeping it within the canvas; show a narrow dark warm brown interior gap below it. The lower shell stays EXACTLY fixed, especially below y=515 (lower two thirds of the original egg bounds). Keep the lower four teal spots and every shell edge in precisely the original places. No hatching animal, glow, chips, debris, ground or shadow. Same 1254x1254 square and opaque white fallback.
```

Original tool filename: `exec-cd290389-f0ea-4150-aa9a-a333fed276b7.png`.

## riverCrack1

Chosen: [egg-river-crack-1.png](egg-river-crack-1.png). Reference order: [egg-sprout-crack-1.png](egg-sprout-crack-1.png).

```text
Edit this exact image. Change only the spot colour from teal to caramel (#C8956A), preserving the existing highlights and shadows as corresponding caramel tones. Keep the egg's shape, size, position, outline, shell shading and background identical. Keep the exact crack zigzag and its two short branches unchanged. Preserve all five spot shapes, positions and sizes; cream shell and plum ink unchanged. No new element. Same 1254x1254 square, opaque white fallback.
```

Original tool filename: `exec-de6b8c8b-d0d5-4d42-9a2c-2e12c735a9b9.png`.

## riverOpen1

Chosen: [egg-river-open-1.png](egg-river-open-1.png). Reference order: [egg-sprout-open-1.png](egg-sprout-open-1.png).

```text
Edit this exact image. Change only the spot colour from teal to caramel (#C8956A), preserving highlights and shadows as corresponding caramel tones. Keep the opened egg's exact geometry, size, position, outline, shell shading and background identical. Keep the lifted tilted cap, jagged edges and dark warm brown interior unchanged. Preserve all five spot shapes, positions and sizes, including the spot on the cap. The lower shell must stay fixed. Cream shell and plum ink unchanged. No new element. Same 1254x1254 square, opaque white fallback.
```

Original tool filename: `exec-10583de9-b12d-45f2-b428-d64fef6ca995.png`.

## gliderCrack1

Chosen: [egg-glider-crack-1.png](egg-glider-crack-1.png). Reference order: [egg-sprout-crack-1.png](egg-sprout-crack-1.png).

```text
Edit this exact image. Change only the spot colour from teal to lavender (#B79BE0), preserving the existing highlights and shadows as corresponding lavender tones. Keep the egg's shape, size, position, outline, shell shading and background identical. Keep the exact crack zigzag and its two short branches unchanged. Preserve all five spot shapes, positions and sizes; cream shell and plum ink unchanged. No new element. Same 1254x1254 square, opaque white fallback.
```

Original tool filename: `exec-d71c538d-2dd2-48dc-b51f-3d2b12a8a4c7.png`.

## gliderOpen1

Chosen: [egg-glider-open-1.png](egg-glider-open-1.png). Reference order: [egg-sprout-open-1.png](egg-sprout-open-1.png).

```text
Edit this exact image. Change only the spot colour from teal to lavender (#B79BE0), preserving highlights and shadows as corresponding lavender tones. Keep the opened egg's exact geometry, size, position, outline, shell shading and background identical. Keep the lifted tilted cap, jagged edges and dark warm brown interior unchanged. Preserve all five spot shapes, positions and sizes, including the spot on the cap. The lower shell must stay fixed. Cream shell and plum ink unchanged. No new element. Same 1254x1254 square, opaque white fallback.
```

Original tool filename: `exec-99c9cb48-d2f6-4ff5-85dc-afa83a2abbee.png`.
