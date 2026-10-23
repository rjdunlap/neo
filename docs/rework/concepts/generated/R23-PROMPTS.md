# R23 Rainbow Meadow generation and review

2026-10-23. Built-in `image_gen.imagegen`, underlying model undisclosed. Source-only request; no import, preparation or integration. [Revised batch 1 prompt](../../art-requests/CHATGPT-BATCH.md#1-rainbow-meadow-backdrop-r23-land-meadowpng) supersedes older lower-third wording.

## Candidates 1 and 2

Each call receives the exact prompt below and these ordered style references (not edit targets): `home-day-3.png`, then `../art-directions-2026-10-16.png`. `transparent_background: false`. No recent conversation image inclusion. Each is an independent new generation, not an edit.

```text
A children's storybook background painting for a toddler's iPad game, in the same style as the attached reference pictures (the treehouse scene, and the "Illustrated adventure" column of the concept sheet): broad rounded shapes, soft cel shading with light from the upper left, gentle gradients only inside shapes, closed dark plum-ink outlines (#2B1B2E) on the main shapes only, calm and uncluttered. No painterly texture, no vignette, no text, no letters, no signs, no people, no characters and no creatures in the foreground. Palette: soft sky blues (#CDE6FA to #4FA3F7), fresh greens (#DDF2CF, #7CCF5A, shadow #4A9A35), warm cream (#FFF4E3), with small accents of red #F2545B, orange #FF9A3C, yellow #FFD54A, pink #FF9AC1 and purple #9A6CF0.

Layout (important): landscape 1536x1024, full bleed, no border. The horizon sits about 38% of the way down the picture (around y = 390). Every landmark (trees, rocks, buildings, water features) stands on or above the horizon and inside the middle half of the width (x from about 384 to 1152); the far left and right may continue the scenery but hold nothing important. The top-left and top-right corners are calm, plain sky. Below the horizon the ground is one broad, calm, evenly lit surface with only very low, soft detail, at most a few small soft tufts at the far left and right edges: no paths, rocks, flowers, water, animals or props anywhere from y = 420 to the bottom, so large round buttons placed there read clearly.

Rainbow Meadow: a sunny wildflower meadow under an open sky. Along the horizon, in the middle half: a gentle green rise with clover, daisies, red poppies and tall grass, two or three soft rounded trees, a soft rainbow low in the sky behind them, a few small bees and butterflies in the air above the horizon, and one small rabbit sitting at the meadow's edge on the horizon line. Soft white clouds high in the sky, away from the corners. Below the horizon, the meadow becomes an even, gently sloping lawn of soft light green (#DDF2CF to #BFE6A8), calm and almost flat in colour, with a few tiny daisy dots only at the far left and right edges.
```

## Candidate 3

Same references and parameters as candidates 1 and 2, with this paragraph appended verbatim:

```text
Layout enforcement: the numeric composition rules take precedence over the style references and over the final sentence about daisy dots. All tree trunks, flowers and the rabbit end at or above y=390, never below y=410. Keep the entire lower 60% a single smooth light-green lawn with no flowers at all, no brush texture and no leafy patches. Keep ALL important silhouettes, including entire tree crowns and the rabbit, between x=384 and x=1152; shrink them to fit if needed. The rabbit is small and distant, not a large foreground character. Do not copy the reference scene's busy ground. Calm plain blue sky in both upper corners.
```

## Candidate 4

Generated edit of candidate 3 only (`exec-425b950a-a625-4ffa-a115-8c1085110032.png`); `transparent_background: false`. Exact prompt:

```text
undefined
```

## Candidate 5

Second and final targeted reroll, a generated edit of candidate 4 only (`exec-26a24de9-b045-4dd0-b0ff-c31d930deb56.png`); `transparent_background: false`. Exact prompt:

```text
undefined
```

## Review and provenance

Chosen `land-meadow-5.png`. Candidates 1 and 2 rejected: horizon around y=480–500, busy lawn, scattered edge flowers, landmarks spilling outside the middle half. Candidate 3 clears the lawn but still places the horizon near y=480. Candidate 4 raises it to about y=430; candidate 5 places the main boundary at about y=380–400 (roughly 38%). Five actual built-in calls: three new candidates, then two generated composition edits; only the chosen original is retained in the repository, no runner-up or missing asset.

Full-size review: two rounded trees, rainbow, wildflowers and small horizon rabbit; bees/butterflies above; main shapes have plum outlines and upper-left highlights, no text, foreground characters, paths, water or ground props. Lower ground is smooth light green, free of discrete detail from y=420 downward. Top corners are plain blue. It is flatter than the home scene, while tree foliage remains detailed. No claim of exact palette pixel matching.

At 120 px the meadow/trees/rainbow silhouette reads; the small rabbit and insects are subordinate details, not interaction targets. QA-only center-cover previews at 1024 × 768 and 768 × 1024, with four illustrative 100 px cream circles on the lower ground, show clear targets and the main landmarks retained. These are static composition probes, not game screenshots or a test of actual spot coordinates. The portrait view uses source x=384..1152. Peripheral flower/rock edges and part of the right pink butterfly exceed that range and clip; the two principal trees, rabbit and rainbow remain readable. A top cloud touches the image edge. Those are recorded deviations, not cropped or repaired in the source. Actual integration, screenshot acceptance, iPad readability and child appeal are untested.

## Original integrity

| File | Tool output basename | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| land-meadow-5.png | exec-6e6ab4ad-e66f-4e7c-ac77-d103ff4ce339.png | 1536 × 1024 RGB | 1,670,501 | `b9c56816eb9d4bccea2702fb89898dd7e3eb9deeec9bdea1987dd04b92986441` |

Repository copy matches the original bytes and SHA-256. Original tool output is under `$CODEX_HOME/generated_images/01a16a69-39d8-7841-a52f-0bfed76f9af6/`. No resizing, cropping, recompression, cleanup, import or integration of the delivered source. Temporary resized/cropped QA probes remain ignored under `test-results/r23/`; they are not deliverables. Generating-service terms are the existing OpenAI built-in record in the [manifest](README.md#generating-service-terms); no underlying model name is inferred.
