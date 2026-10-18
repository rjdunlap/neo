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

## R01 review and preparation notes

Eight untouched PNGs, 10,048,284 bytes total. Full-body files are 1536 × 1024; the portrait is 1254 × 1254 (larger than the requested minimum). No assets have been cut, rigged or integrated. The white-background base is the approved style reference for subsequent requests.

Reviewed all originals at full size and reduced scale; the three base candidates were also compared at 120 px on pale blue. Candidate 3 retains the broad swept wing, small far wing, two separate ribbons, closed plum outline, cream face, glossy eyes and readable lavender mid-tone. Candidate 1 initially read well when composited, but its transparent edits introduced cloudy opaque alpha outside the creature. Candidate 2 offered no useful alternative; no runner-up kept. White-background edits avoided that failure. Check transparent outputs by compositing onto solid white AND pale blue before accepting; the default tool preview alone hid this defect.

Expression ink bounds (pixels darker than 220) match the base `(23, 188, 1513, 832)` exactly, except sleepy's right bound is 1512. This is a bounds check, not proof of pixel-perfect registration: faint edge/shading variation remains possible. The preparation pipeline's alignment check and device/animation review are still outstanding. The alt shows the cream raised wing; it is intentionally an independently prepared pose.

The portrait keeps the face dominant with every tip inside the canvas; its horizontal margins are about 26 pixels, narrower than the requested 10%. Retained after the earlier three portrait attempts failed framing/style review. A preparation session should add card padding when sizing it; the source stays untouched. Background whites have slight near-white variation (sample 253–255), visually plain; use the existing paper-keying preparation. No claim of iPad readability or child appeal.

## Generating service terms

OpenAI built-in image generation, checked 2026-10-17. The [OpenAI Terms of Use, Content section](https://openai.com/policies/terms-of-use/#content) assign OpenAI's rights in output to the user to the extent permitted by law; output may be similar to others' output. These files are disclosed as AI-generated. This records the service's terms, not a claim of exclusive copyright. The tool did not expose its underlying model name, so none is inferred.
