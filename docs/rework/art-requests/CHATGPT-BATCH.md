# ChatGPT art batches

Written 2026-10-23 for the developer, who generates these images in ChatGPT; Claude Code sessions here have no image tool. Each prompt is ready to paste. The rows behind them are in the [queue](QUEUE.md) (R22, R23, R26), and the slices that use them are in [POLISH.md](../POLISH.md). After downloading, the [import pipeline](IMPORT.md) files and prepares the images with one command. The image routine ([README](README.md)) may also take an open row; check the [queue](QUEUE.md#the-queue) first and skip a row it already marks `done`.

## How to make one image

1. **Open a new ChatGPT chat for each group below** (one for the meadow, one for the duck), so earlier pictures do not leak in.
2. **Attach the reference files the group names** from this repository; on GitHub, open each file and use "Download raw file". Then paste the group's prompt exactly as written.
3. **Make two or three candidates.** Ask "Make another version, same prompt" for each extra one. Do not ask for changes to a candidate unless a group's prompt says to. A coding session picks the best one with the [review checklist](../ART-BIBLE.md#review-checklist), so you do not have to choose.
4. **Download each candidate with ChatGPT's download button** (a PNG at full size). Do not crop, resize or screenshot. Rename it to the file name the group gives, adding `-a`, `-b`, `-c` for extra candidates: `land-meadow-a.png`, `land-meadow-b.png`.
5. **Put the files in `docs/rework/concepts/inbox/`** in your checkout, then run `node scripts/art/import-inbox.mjs`, or ask a Claude session to "import the art inbox". The script refuses a wrong name or a too-small image and leaves it there.

ChatGPT's landscape size is 1536 × 1024 and its square size is 1024 × 1024, which is what each prompt asks for. If ChatGPT offers a transparent background for a creature, take it; otherwise the flat white background is keyed out by the script.

## Shared text

**Backdrop block.** Paste it before each backdrop prompt. The layout paragraph matters most: the game puts large round buttons on the ground, and a tall iPad shows only the middle half of a landscape picture.

```text
A children's storybook background painting for a toddler's iPad game, in the same style as the attached reference pictures (the treehouse scene, and the "Illustrated adventure" column of the concept sheet): broad rounded shapes, soft cel shading with light from the upper left, gentle gradients only inside shapes, closed dark plum-ink outlines (#2B1B2E) on the main shapes only, calm and uncluttered. No painterly texture, no vignette, no text, no letters, no signs, no people, no characters and no creatures in the foreground. Palette: soft sky blues (#CDE6FA to #4FA3F7), fresh greens (#DDF2CF, #7CCF5A, shadow #4A9A35), warm cream (#FFF4E3), with small accents of red #F2545B, orange #FF9A3C, yellow #FFD54A, pink #FF9AC1 and purple #9A6CF0.

Layout (important): landscape 1536x1024, full bleed, no border. The horizon sits about 38% of the way down the picture (around y = 390). Every landmark (trees, rocks, buildings, water features) stands on or above the horizon and inside the middle half of the width (x from about 384 to 1152); the far left and right may continue the scenery but hold nothing important. The top-left and top-right corners are calm, plain sky. Below the horizon the ground is one broad, calm, evenly lit surface with only very low, soft detail, at most a few small soft tufts at the far left and right edges: no paths, rocks, flowers, water, animals or props anywhere from y = 420 to the bottom, so large round buttons placed there read clearly.
```

**Creature style block.** Paste it before the duck prompts. It is the art bible's [style block](../ART-PROMPTS.md#style-block-paste-first-every-time), unchanged:

```text
Style: warm children's storybook illustration for a toddler's iPad game, matching the "Illustrated adventure" column of the attached concept sheet. Chunky, rounded, friendly creature with baby proportions: big head, big glossy near-black eyes with a large white highlight at the upper left and a small one at the lower right, a small dark nose, a short gentle closed smile, soft pink blush under the eyes, and a warm cream belly or muzzle. A closed dark plum-ink outline (#2B1B2E) goes all the way round the creature, slightly heavier on the outside edge and thinner for the few inner lines. Soft cel shading with light from the upper left: one base colour, one soft shadow tone and one highlight per material, and gentle gradients only inside shapes. No cast shadow, no ground, no texture noise, no realistic fur, no 3D render, no plush or felt, no pixel art, no sparkles or motion lines, no text.

Format: exactly one creature and nothing else, on a perfectly flat plain white background (#FFFFFF) with no shadow, gradient or paper texture (or a transparent background if available). Landscape 1536x1024. The creature fills about 85% of the width, with a clear empty margin on every side; no part touches or crosses the image edge. The body faces the viewer's right. A relaxed neutral pose. Keep small gaps between parts that would move separately, such as legs, tail, ribbons or leaves, wherever the anatomy allows.
```

## Batch 1: generate these first

Three images, two to three candidates each. They are the pilot pair the [catalog-wide art row](../../WAITING-ON-DEVELOPER.md#decisions-that-block-work) asks to judge on the iPad: an illustrated location and an illustrated friend beside the untouched rest.

### 1. Rainbow Meadow backdrop (R23): `land-meadow.png`

**Attach:** [`concepts/generated/home-day-3.png`](../concepts/generated/home-day-3.png) and [`concepts/art-directions-2026-10-16.png`](../concepts/art-directions-2026-10-16.png). **Paste:** the backdrop block, then:

```text
Rainbow Meadow: a sunny wildflower meadow under an open sky. Along the horizon, in the middle half: a gentle green rise with clover, daisies, red poppies and tall grass, two or three soft rounded trees, a soft rainbow low in the sky behind them, a few small bees and butterflies in the air above the horizon, and one small rabbit sitting at the meadow's edge on the horizon line. Soft white clouds high in the sky, away from the corners. Below the horizon, the meadow becomes an even, gently sloping lawn of soft light green (#DDF2CF to #BFE6A8), calm and almost flat in colour, with a few tiny daisy dots only at the far left and right edges.
```

Uses: [slice 4](../POLISH.md#slice-4-the-illustrated-rainbow-meadow-and-postcards-in-places), and the Places postcard the script cuts from it.

### 2. The duck (R22): `duck-base.png`

**Attach:** [`concepts/art-directions-2026-10-16.png`](../concepts/art-directions-2026-10-16.png) and [`concepts/generated/sprout-base-2.png`](../concepts/generated/sprout-base-2.png) (as the cast's outline and shading reference, not to copy). **Paste:** the creature style block, then:

```text
The creature is a small round yellow duck, the friendly duck of a toddler's game: a plump egg-shaped yellow body (#FFD54A, shadow #D9A520) with a cream belly (#F6E6D8), a round head with a small soft tuft of three feathers on top, a short rounded orange bill (#FF9A3C, shadow #D9731A), a small rounded wing folded on its side, and two short orange webbed feet standing on nothing. Side-on gentle three-quarter view facing the viewer's right, standing, calm and happy. Use the attached sprout only for outline weight, eye treatment and shading; do not include the sprout.
```

### 3. The duck's portrait (R22): `duck-portrait.png`

**In the same chat as the duck, after its candidates. Attach** your first duck candidate (`duck-base-a.png`); a coding session can re-make the portrait from a different chosen base later. **Paste** this queue's [portrait prompt](QUEUE.md#shared-prompts):

```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat white background (or transparent if available).
```

Uses: [slice 6](../POLISH.md#slice-6-the-duck-pilot) (Duck Pond only).

## Batch 2: after the meadow is accepted

Wait until the illustrated meadow has been seen on the iPad and kept, since R26 follows R23's acceptance. Then make ten backdrops in this order, each in its own chat with the same two attachments plus the accepted `land-meadow` file. Paste the backdrop block, then the line below. Only real plants and animals, no resident creatures. The file names are what the script expects.

| File | Paste after the backdrop block |
| --- | --- |
| `land-cove.png` | `Counting Cove: a marsh where a river meets the sea. Along the horizon in the middle half: reeds and cattails, a small fresh pond with lily pads on the left, a soft mudflat where the river opens to a pale sea strip on the right, a heron standing on the horizon line, two dragonflies in the air. Below the horizon, an even, calm sandy-green flat.` |
| `land-peaks.png` | `Puzzle Peaks: a mountain from bamboo forest to snow. In the middle half: rounded rocky peaks with snow above a clear snowline, conifers on the upper slopes and soft bamboo on the lower slopes along the horizon, high soft cloud. No penguins, no pandas. Below the horizon, an even, calm alpine meadow.` |
| `land-beach.png` | `Bubble Beach: a rocky shore with tide pools. Along the horizon in the middle half: gentle waves on a blue sea, a few rounded barnacled rocks with kelp, two small tide pools with a sea star and an anemone set into the rocks at the horizon, two gulls in the sky. No coral, no fish. Below the horizon, an even, calm pale sand.` |
| `land-music.png` | `Music Mountain: a misty tropical cloud forest on a mountain. In the middle half: mossy tree trunks with tree ferns, orchids and bromeliads along the horizon, soft mist bands across green mountain slopes behind, one hummingbird in the air. Below the horizon, an even, calm mossy green floor.` |
| `land-canyon.png` | `Painted Canyon: a desert canyon with a spring. In the middle half: layered red, orange and cream rock walls and mesas along the horizon, a small spring pool with cottonwood trees at the foot of the rocks, prickly pear and yucca beside it. No camels, no palm trees. Below the horizon, an even, calm warm sand.` |
| `land-village.png` | `Cozy Village: cottages along a lane. In the middle half: a row of small cream and pastel cottages with pitched roofs and chimneys along the horizon, a pale lane in front of them, a hawthorn hedge in white blossom with blackberries, a robin on the hedge. Below the horizon, an even, calm village green.` |
| `land-grove.png` | `Story Grove: a woodland garden at night. A deep blue night sky with a round full moon in the upper middle and soft stars, a woodland edge of dark rounded trees along the horizon, evening primrose flowers and a few warm firefly glows above the horizon, an owl on a stump at the horizon line. Below the horizon, an even, calm moonlit green lawn, light enough for buttons to read.` |
| `land-tinker.png` | `Tinker Lab: a workshop in a cave mouth. Dark rounded rock overhead with a few stalactites hanging from the top edge away from the corners and soft blue-green glow-worm lights, a cave mouth in the middle showing daylight and a green hill, two simple wooden workbenches with a few tools at the back wall on the horizon. Below the horizon, an even, calm sandy stone floor.` |
| `land-barnyard.png` | `Barnyard: a farm. In the middle half: a red barn with a white-trimmed door, a wooden fence along the horizon, two or three apple trees in fruit, a hay bale. No animals. Below the horizon, an even, calm grassy yard.` |
| `land-lake.png` | `Lantern Lake: a lake at dusk. A warm orange-pink sky fading to soft purple at the top, a still lake along the horizon with a few floating paper lanterns and a small moored rowboat, reeds on the far bank. Below the horizon, an even, calm dusky grass bank.` |

Uses: [slice 10](../POLISH.md#slice-10-the-other-ten-backdrops), which needs no code: each imported file appears in its location.

## Not in these batches

Buttons, hub icons, stickers, game spots and UI frames stay code-drawn (the [recorded lean](../../WAITING-ON-DEVELOPER.md#decisions-that-block-work)); [slice 7](../POLISH.md#slice-7-buttons-and-cards-with-a-finish) improves them in code. Creature variants (R20, R21, a new R25 attempt) keep the queue's routine. No audio, ever.
