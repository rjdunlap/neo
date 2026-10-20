# R24 River head layer — 2026-10-20

Built-in `image_gen.imagegen`, underlying model undisclosed, `transparent_background: false`. One edit call, accepted on the first attempt; no CLI/API fallback. The three-try missing fallback was not needed.

References in tool order (absolute paths under `/Users/robert/git/neo/docs/rework/concepts/`):

1. `generated/river-base-4.png` — exact edit target.
2. `art-directions-2026-10-16.png` — Illustrated adventure style reference only.
3. `generated/glider-base-3.png` — approved style reference only.

## nohead1

Exact prompt:

```text
Use case: precise-object-edit.
Input image 1 is the exact edit target river-base-4.png. Images 2 and 3 are style references only (Illustrated adventure column and approved glider); never add elements from them.
Edit this exact image. Remove the head completely (ears, face, muzzle, whiskers and the top of the head) as if it were drawn on a separate layer above. Continue the neck upward and forward a little past where the head joined it, ending in a soft rounded end that is fully painted in the same caramel with the cream throat continuing, with the same plum outline closed around it. Keep everything else identical: the body, back, cream belly, legs, paws, the dark paddle tail, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
Output the same 1536x1024 canvas. This is a technical body plate: no head or face, no separate floating head. Below and behind the neck, preserve the original silhouette within 4 pixels; do not shift, scale, or redraw the shoulder, torso, legs, feet or tail. The rounded neck end must lie fully inside the original head area so that the original head laid over it covers the end at rest. Keep the original white background, not transparency.
```

Original tool output: `/Users/robert/.codex/generated_images/01a15a8d-49e3-7062-ace9-23a4ef553b11/exec-7fe1051f-b546-40c7-9549-6fcc8b890e1d.png`.

Copied unchanged as `river-nohead-1.png`, 1536 × 1024, 1,454,269 bytes. SHA-256 of both source and repository copy: `c37abb05bc8cc0614a1d88b1a562bc8f2bf467ced3355926179ada55f9e9ef26`.

## Inspection proof

Full-size and temporary 120 px canvas-width review: ears, eyes, nose, muzzle, whiskers and head are gone. The caramel neck and cream throat end in one soft cap with a closed plum contour. Four paws, paddle tail, back, shoulder, belly, framing and pose remain visually aligned. No new head, props, cast shadow or clipping. The cap is concealed by the original head area at rest by static inspection; animation has not been tested.

Temporary inspection masks only (no source modification): classify paper by RGB Euclidean distance <34 from median border color, flood it from the upper-left border, and use the remaining filled silhouette. Both canvases are 1536 × 1024. Editable head/upper-neck polygon, in original pixels: `(1000,190), (1510,190), (1510,480), (1340,480), (1150,450), (1030,410), (1000,410)`. Outside that polygon, bidirectional Euclidean-radius-four-pixel silhouette comparison found **zero added and zero removed pixels beyond tolerance**. A second conservative fixed region (`x<1000 OR y>=500`) also passed. The whole candidate has no silhouette pixels more than four pixels beyond the original. The rounded cap test region (`x>=1100 AND y<400`) has **zero occupied pixels outside the original occupied shape**, even without tolerance.

This is silhouette and visual evidence, not pixel-identical color evidence: the broad fixed region has 16,550 pixels with a maximum RGB-channel difference >10, including small shading/edge changes. Preserve the original rather than repair or composite it. Later preparation must confirm the actual head cut boundary and coverage under rotation. No preparation, rigging, integration, runtime, offline, iPad or child-appeal checks were performed.
