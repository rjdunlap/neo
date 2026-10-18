# Generated creature art

Original, untouched images from the creature art passes (see the [art bible](../../ART-BIBLE.md) and [prompts](../../ART-PROMPTS.md)). Name each file `<species>-<asset>-<n>.png` (wearables and scenes as the [queue](../../art-requests/QUEUE.md) names them). Add a row per kept file with its request ID; mark the chosen one with `yes` in the Chosen column (`prepare-sprite.mjs --set <species>` reads it).

| File | Request | Date | Tool and model | Prompt | Chosen |
| --- | --- | --- | --- | --- | --- |
| glider-base-3.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [base3Prompt](R01-PROMPTS.md#base3prompt) | yes |
| glider-blink-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [blink2Prompt](R01-PROMPTS.md#blink2prompt) | yes |
| glider-happy-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [happy2Prompt](R01-PROMPTS.md#happy2prompt) | yes |
| glider-surprised-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [surprised2Prompt](R01-PROMPTS.md#surprised2prompt) | yes |
| glider-sleepy-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [sleepy2Prompt](R01-PROMPTS.md#sleepy2prompt) | yes |
| glider-sad-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [sad2Prompt](R01-PROMPTS.md#sad2prompt) | yes |
| glider-alt-2.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [alt2Prompt](R01-PROMPTS.md#alt2prompt) | yes |
| glider-portrait-4.png | R01 | 2026-10-17 | Built-in image_gen; model undisclosed | [portrait4Prompt](R01-PROMPTS.md#portrait4prompt) | yes |
| sprout-base-2.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [base2](R02-PROMPTS.md#base2) | yes |
| sprout-blink-1.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [blink1](R02-PROMPTS.md#blink1) | yes |
| sprout-happy-1.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [happy1](R02-PROMPTS.md#happy1) | yes |
| sprout-surprised-1.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [surprised1](R02-PROMPTS.md#surprised1) | yes |
| sprout-sleepy-1.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [sleepy1](R02-PROMPTS.md#sleepy1) | yes |
| sprout-sad-1.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [sad1](R02-PROMPTS.md#sad1) | yes |
| sprout-portrait-2.png | R02 | 2026-10-17 | Built-in image_gen; model undisclosed | [portrait2](R02-PROMPTS.md#portrait2) | yes |
| river-base-4.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [base4](R03-PROMPTS.md#base4) | yes |
| river-blink-1.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [blink1](R03-PROMPTS.md#blink1) | yes |
| river-happy-1.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [happy1](R03-PROMPTS.md#happy1) | yes |
| river-surprised-2.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [surprised2](R03-PROMPTS.md#surprised2) | yes |
| river-sleepy-1.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [sleepy1](R03-PROMPTS.md#sleepy1) | yes |
| river-sad-1.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [sad1](R03-PROMPTS.md#sad1) | yes |
| river-portrait-2.png | R03 | 2026-10-17 | Built-in image_gen; model undisclosed | [portrait2](R03-PROMPTS.md#portrait2) | yes |
| wear-crown-3.png | R04 | 2026-10-17 | Built-in image_gen; model undisclosed | [crown3](R04-PROMPTS.md#crown3) | yes |
| wear-scarf-3.png | R04 | 2026-10-17 | Built-in image_gen; model undisclosed | [scarf3](R04-PROMPTS.md#scarf3) | yes |

## R01 review and preparation notes

Eight untouched PNGs, 10,048,284 bytes total. Full-body files are 1536 × 1024; the portrait is 1254 × 1254 (larger than the requested minimum). No assets have been cut, rigged or integrated. The white-background base is the approved style reference for subsequent requests.

Reviewed all originals at full size and reduced scale; the three base candidates were also compared at 120 px on pale blue. Candidate 3 retains the broad swept wing, small far wing, two separate ribbons, closed plum outline, cream face, glossy eyes and readable lavender mid-tone. Candidate 1 initially read well when composited, but its transparent edits introduced cloudy opaque alpha outside the creature. Candidate 2 offered no useful alternative; no runner-up kept. White-background edits avoided that failure. Check transparent outputs by compositing onto solid white AND pale blue before accepting; the default tool preview alone hid this defect.

Expression ink bounds (pixels darker than 220) match the base `(23, 188, 1513, 832)` exactly, except sleepy's right bound is 1512. This is a bounds check, not proof of pixel-perfect registration: faint edge/shading variation remains possible. The preparation pipeline's alignment check and device/animation review are still outstanding. The alt shows the cream raised wing; it is intentionally an independently prepared pose.

The portrait keeps the face dominant with every tip inside the canvas; its horizontal margins are about 26 pixels, narrower than the requested 10%. Retained after the earlier three portrait attempts failed framing/style review. A preparation session should add card padding when sizing it; the source stays untouched. Background whites have slight near-white variation (sample 253–255), visually plain; use the existing paper-keying preparation. No claim of iPad readability or child appeal.

## R02 review and preparation notes

Seven untouched PNGs, 10,226,865 bytes total. Full-body files are 1536 × 1024; the portrait is 1254 × 1254, above the requested minimum. Files were copied byte-for-byte from the tool originals; no cutting, rigging, integration or source-image cleanup. Same service terms and undisclosed model caveat as R01 below.

Reviewed three base candidates at full size and 120 px canvas width. Candidate 2 best retains Pip's squat teal body, cream belly, round ears, two distinct leaves and two glossy eye highlights. Candidate 1 has a longer stem and less distinct small eye highlights; candidate 3's face and leaf proportions offered no useful alternative. No runner-up kept. All chosen images face right, keep closed plum outlines and upper-left shading, and leave every tip inside the frame. Soft rounded cream fingertip markings echo the concept sheet; they are not sharp claws. Arms overlap the body in the seated pose; the preparation session must account for the nearer arm's painted seam rather than assume separate arm pixels.

The entire base, including leaves and feet, occupies bounds `(307, 63, 1229, 961)` in its landscape canvas. Its body is wider than tall; the leaves make the overall character nearly square. Framing therefore fits about 88% of canvas height and 60% of width, rather than stretching the silhouette to the generic 85%-width target. The portrait's closed bust bounds are `(256, 152, 1056, 1105)`, leaving comfortable margins. Portrait 1 was rejected for clipping at the bottom edge; portrait 2 is retained.

The expression silhouettes were compared to the base in both directions with a four-pixel tolerance: zero silhouette pixels exceeded it. Their outer bounds match exactly except sad and sleepy extend one pixel farther left. This inspection used temporary white-paper masks and thumbnails only; it did not prepare or modify the originals. Fine shading/edge differences are possible, so this is not a claim of pixel-identical non-face regions. The existing preparation alignment check, animation review and device checks are still outstanding. White backgrounds have faint near-white variation like R01; use the existing paper-keying pipeline later. No claim of iPad readability, child appeal or animation quality.

## R03 review and preparation notes

Seven untouched PNGs, 10,298,060 bytes total. Full-body files are 1536 × 1024; the portrait is 1254 × 1254, above the requested minimum. Retained variant copies were checked against the tool originals by SHA-256. No cutting, rigging, integration, pixel cleanup or recompression; service terms and undisclosed model caveat remain as below.

Three independently prompted base candidates were reviewed at full size and 120 px canvas width. Candidate 1 had the clearest lifted neck and four-foot silhouette, with a broad paddle tail separated from the rear paw by a white wedge. Candidate 2's rear foot sits closer under the belly; candidate 3's smile/head proportions offered no useful alternative. Candidate 1 was refined through the image tool to add the second white eye highlights; the untouched refinement output, base 4, is chosen. No runner-up retained. The long caramel body, cream muzzle/chest/belly, dark tail and feet, plum outlines and upper-left shading match the cast; only a few small tufts suggest fur. The far eye is foreshortened by the side view.

Base silhouette bounds are `(34, 195, 1500, 809)`, including whiskers. It occupies about 95% of canvas width rather than the requested 85%, with at least 34 pixels of side margin and no clipping. Retained after the three attempts kept that framing; the source remains unchanged. The portrait's outlined bust is fully inside bounds `(265, 196, 1157, 1083)` with a 97-pixel minimum margin. All contours and whisker tips stay inside the canvas; no cast shadow, props or ground.

Expression silhouettes were compared in both directions against the base with a four-pixel tolerance: zero silhouette pixels exceeded it. Outer bounds match except happy extends two pixels upward and sleepy/surprised end one pixel higher at the bottom. First surprised was rejected for a brow outside the skull; the replacement keeps brows inside. First portrait was rejected for a missing ink line at the lower chest; portrait 2 closes it. Temporary inspection masks and thumbnails were used only for review and did not prepare or modify originals. Minor shading/edge differences may remain, so this is not pixel-perfect registration evidence. Paper-keying, preparation alignment, animation and device checks remain for a coding session; no iPad readability or child appeal is claimed.

## R04 review and preparation notes

Two untouched PNGs, each 1254 × 1254 (above the requested minimum), 2,454,726 bytes total. SHA-256 checks confirm the repository copies match the tool originals. No cutting, rigging, fitting or integration; same service terms and undisclosed model caveat as below.

Three independent candidates for each item were reviewed at full size and about 120 px canvas width. Crown 1 had too much small floral detail; crown 2 simplified it, but crown 3 offered the clearest open oval center with six rounded yellow/purple/pink flowers and small green leaves. Scarf 1's fringe adds detail and scarf 2 reads more like an extra fold/coil; scarf 3 has one oval wrap, an open neck hole, two separated rounded tails, broad red/orange stripes and only a few knit seam lines. No runner-ups kept and no missing assets. Both are unworn and seen from slightly above/front, posed for a right-facing creature; no creature, mannequin, text, ground or cast shadow is included. Closed plum contours and soft upper-left cel shading match the approved glider.

Crown bounds are `(35, 270, 1221, 978)` and scarf bounds `(104, 184, 1162, 1110)` (pixels differing from near-white paper). All petals, leaves and tail tips remain inside the canvas. The crown occupies about 95% of width rather than the requested 80%; its narrowest side margin is 33 pixels. The scarf occupies about 84% of width with at least 92 pixels of side margin. Originals stay unchanged; card/slot padding is for preparation. The white paper contains faint near-white variation like earlier requests. **Preparation gap:** the crown center and scarf neck hole are enclosed white regions; the existing border-connected paper flood will not clear those interiors automatically. A preparation session must explicitly handle them while preserving the artwork. Front/back occlusion, scale and shape fitting to any species have not been tested. No claim of iPad readability or suitability across the cast is made by this generation pass.

## Generating service terms

OpenAI built-in image generation, checked 2026-10-17. The [OpenAI Terms of Use, Content section](https://openai.com/policies/terms-of-use/#content) assign OpenAI's rights in output to the user to the extent permitted by law; output may be similar to others' output. These files are disclosed as AI-generated. This records the service's terms, not a claim of exclusive copyright. The tool did not expose its underlying model name, so none is inferred.
