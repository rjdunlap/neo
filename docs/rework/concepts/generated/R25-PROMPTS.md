# R25 Sprout arms layer — 2026-10-20

Built-in `image_gen.imagegen`, underlying model undisclosed, `transparent_background: false`. Three edit calls, all rejected for changing invariant shading away from the arms. **Missing: `sprout-noarms`; no chosen layer.** Three-try fallback applies: keep the existing small wag. No CLI/API fallback, source repair or compositing.

References in tool order for every call (under `/Users/robert/git/neo/docs/rework/concepts/`):

1. `generated/sprout-base-2.png` — exact edit target, freshly used each try.
2. `art-directions-2026-10-16.png` — Illustrated adventure style reference only.
3. `generated/glider-base-3.png` — approved style reference only.

All three original outputs retained untouched as rejected evidence, **not approved assets**. Total 4,474,154 bytes. Source/repository SHA-256 equality verified for every file. Each is 1536 × 1024.

## noarms1

Exact prompt:

```text
Use case: precise-object-edit.
Input image 1 is the exact edit target sprout-base-2.png. Images 2 and 3 are style references only (Illustrated adventure column and approved glider); never add elements from them.
Edit this exact image. Remove both arms completely, as if they were drawn on a separate layer above. Paint the teal body side and the cream belly continuously where the arms were, with the same soft shading and the same plum outline following the body's round side. Keep everything else identical: the face, ears, leaves and stem, the feet and their pink pads, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
Output the same 1536x1024 canvas. This is a technical body plate: no arms, hands, fingers or ghosts of hands; retain both feet and their pink pads and retain the tail. Outside the arm areas preserve the original silhouette within 4 pixels. Do not shift, scale or redraw the face, eyes, nose, mouth, ears, leaves, stem, feet, tail or cream belly shape. Inside the removed-arm areas the teal body side must be smoothly round with a closed plum contour, and the existing cream belly must continue naturally. No new markings, props or ground shadow. Keep the original white background, not transparency.
```

Original tool output: `/Users/robert/.codex/generated_images/01a15ac4-8f17-7fe3-9458-5b5e32be86b3/exec-b6cf570f-584e-4696-a199-9f40ca9b4576.png`.
Untouched repository copy: `sprout-noarms-1.png`. SHA-256 of both: `19664a005348174565b916b5aec3a6ba0774ed631e09d4dcf0aae749238d85d2`.

## noarms2

Exact prompt:

```text
Use case: precise-object-edit.
Input image 1 is the exact edit target sprout-base-2.png. Images 2 and 3 are style references only (Illustrated adventure column and approved glider); never add elements from them.
Edit this exact image. Remove both arms completely, as if they were drawn on a separate layer above. Paint the teal body side and the cream belly continuously where the arms were, with the same soft shading and the same plum outline following the body's round side. Keep everything else identical: the face, ears, leaves and stem, the feet and their pink pads, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
Output the same 1536x1024 canvas. This is a technical body plate: no arms, hands, fingers or ghosts of hands; retain both feet and their pink pads and retain the tail. Outside the arm areas preserve the original silhouette within 4 pixels. Do not shift, scale or redraw the face, eyes, nose, mouth, ears, leaves, stem, feet, tail or cream belly shape. Inside the removed-arm areas the teal body side must be smoothly round with a closed plum contour, and the existing cream belly must continue naturally. No new markings, props or ground shadow. Keep the original white background, not transparency.
Critical correction for this attempt: preserve the original colors and shading outside the arms exactly. Do not recolor, increase saturation, improve lighting or repaint the leaves, face, feet, tail or belly. Treat every pixel outside the two arm regions as locked. The near arm occupies approximately x=420..635, y=560..750 and far arm x=1088..1210, y=550..760 on the 1536x1024 original; these are the only regions to edit. Remove the arms and close the round body sides locally; do not touch the green leaves at all.
```

Original tool output: `/Users/robert/.codex/generated_images/01a15ac4-8f17-7fe3-9458-5b5e32be86b3/exec-7b28adab-8af7-4a14-814a-fba868d75082.png`.
Untouched repository copy: `sprout-noarms-2.png`. SHA-256 of both: `f7e47bf814423a42b4ebfa29c9a21522c859be8659bbaefd8481bf87102bd04b`.

## noarms3

Exact prompt:

```text
Use case: precise-object-edit.
Input image 1 is the exact edit target sprout-base-2.png. Images 2 and 3 are style references only (Illustrated adventure column and approved glider).
Edit this exact image. Remove both arms completely, as if they were drawn on a separate layer above. Paint the teal body side and the cream belly continuously where the arms were, with the same soft shading and the same plum outline following the body's round side. Keep everything else identical: the face, ears, leaves and stem, the feet and their pink pads, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
Use the same 1536x1024 canvas. Strict local inpainting only. Leave all existing pixels of the face, eyes, mouth, leaves, ears, stem, feet, tail, belly outline and belly shading unchanged. Do not flatten or reshape the torso highlights and shadows away from the arm removal sites. Do not increase leaf saturation. Preserve silhouette outside the arm areas within 4 pixels. Keep the same sitting pose and closed smooth plum body contour where each hand was removed, no ghost fingers, no new objects, no background changes.
```

Original tool output: `/Users/robert/.codex/generated_images/01a15ac4-8f17-7fe3-9458-5b5e32be86b3/exec-155da7ae-92ba-4f8a-86d6-9de67d316896.png`.
Untouched repository copy: `sprout-noarms-3.png`. SHA-256 of both: `db9410f2243176d274a709b9f528ffecdc0fc659ef61bafac54598db0d22e033`.

## Inspection proof

All outputs reviewed full size and as temporary 120 px canvas-width thumbnails. Both arms and pale fingertips removed, teal sides have closed rounded plum contours with no ghost hands, and face, cream belly outline, leaves/stem, ears, tail, feet and pink pads remain visually aligned. No added props, shadow or clipping. Candidate 1 increases leaf saturation and changes broad body/leaf shading. Candidates 2 and 3 improve color fidelity but redraw the broad teal side highlight/shadow below and beside the former near arm, outside the local edit area. All fail unchanged shading; passing geometry alone is insufficient.

Temporary inspection masks only: classify paper by RGB Euclidean distance <34 from median border color, flood it from the upper-left border, and use the remaining filled silhouette. Editable arm/removal and side-closure areas in original pixels, inclusive: near arm `420<=x<=635, 560<=y<=750`; far arm `1088<=x<=1210, 550<=y<=760`. These cover original arms and body joins, excluding face, belly, feet and tail. No resizing, translation or alignment before comparison.

| Candidate | Bytes | Added / removed silhouette pixels beyond Euclidean radius 4 outside arms | Outside-arm pixels with maximum RGB-channel difference >10 | Disposition |
| --- | --- | --- | --- | --- |
| 1 | 1,418,260 | 0 / 0 | 165,401 | Rejected: saturation and shading drift |
| 2 | 1,532,920 | 0 / 0 | 33,697 | Rejected: side shading redrawn outside arms |
| 3 | 1,522,974 | 0 / 0 | 32,609 | Rejected: side shading redrawn outside arms |

The RGB count diagnoses color differences; it is not a new acceptance threshold. Rejection follows visual changes to the named invariant shading. Originals untouched; masks/thumbnails QA only. No preparation, cutting, rigging, integration, runtime, build/unit/browser/offline, iPad or child-appeal checks performed. No fourth try: keep the small wag unless a later explicit request reopens this layer.
