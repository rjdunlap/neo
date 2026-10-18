# Art request queue

The routine's work list ([how a run works](README.md#what-a-run-does)). Take the first `open` row whose **after** column is satisfied. Statuses: `open` → `done` (every listed file chosen and committed, or recorded missing) → `prepared` (a coding session cut and rigged it); `blocked` means do not start. Fill the **result** line when a request is done. Every image follows the [art bible](../ART-BIBLE.md); paste its [style block](../ART-PROMPTS.md#style-block-paste-first-every-time) before every base prompt.

## The queue

| ID | Request | Files | After | Status | Result |
| --- | --- | --- | --- | --- | --- |
| R01 | [Cloud glider set](#r01-cloud-glider-set) | 8 | — | done | [Eight originals and review notes](../concepts/generated/README.md#r01-review-and-preparation-notes): base-3; blink/happy/surprised/sleepy/sad/alt-2; portrait-4. No missing files; portrait needs extra card padding. Not prepared. |
| R02 | [Sprout set](#r02-sprout-set) | 7 | R01 | open | |
| R03 | [River set](#r03-river-set) | 7 | R01 | open | |
| R04 | [Crown and scarf](#r04-crown-and-scarf) | 2 | R01 | open | |
| R05 | [Weather Wardrobe items](#r05-weather-wardrobe-items) | 7 | R04 | open | |
| R06 | [Home scene, day and dusk](#r06-home-scene-day-and-dusk) | 2 | R01 | open | |
| R07 | [Collection card paper](#r07-collection-card-paper) | 1 | R01 | open | |
| R08 | [Three eggs](#r08-three-eggs) | 3 | R03 | open | |
| R09 | [Tote set](#r09-tote-set) | 8 | R03 | open | |
| R10 | [Trill set](#r10-trill-set) | 7 | R03 | open | |
| R11 | [Dapple set](#r11-dapple-set) | 7 | R03 | open | |
| R12 | [Bramble set](#r12-bramble-set) | 8 | R03 | open | |
| R13 | [Mossback set](#r13-mossback-set) | 8 | R03 | open | |
| R14 | [Lumen set](#r14-lumen-set) | 8 | R03 | open | |
| R15 | [Pilot looks](#r15-pilot-looks) | 6 | R03 | open | |
| R16 | [Forms](#r16-forms) | — | RW11's definition | blocked | |

Priority is the row order: the three pilot species first (they are what RW05 integrates), then what dresses and houses them, then the second wave. The whole queue is about 90 kept images; at one request a day it runs two to three weeks.

## Shared prompts

**A species set** is: `base`, `blink`, `happy`, `surprised`, `sleepy`, `sad` and `portrait`, plus an `alt` pose where the request names one. The six expression variants are what the games ask for ([GAME-FIT.md](GAME-FIT.md#what-the-games-ask-of-a-companion)): `happy` doubles as the singing face, `base` as calm.

Make every variant in the same conversation as the chosen base, with that base attached, using these prompts. Replace `{parts}` with the species' moving parts named in its request (for example "ribbons, wings" or "leaves, arms, feet").

**`blink`**
```text
Edit this exact image. Change only the eyes: close them gently into soft curved lash lines, as in a happy blink. Keep everything else identical: outline, colours, markings, pose, {parts}, framing, size and position in the frame, and the background.
```

**`happy`**
```text
Edit this exact image. Change only the face: open the mouth into a small, delighted open smile (no teeth) and lift the brows slightly. Keep everything else identical: outline, colours, markings, pose, {parts}, framing, size and position in the frame, and the background.
```

**`surprised`**
```text
Edit this exact image. Change only the face: make the eyes a little wider and rounder, raise both brows high, and make the mouth a small round "o". Keep everything else identical: outline, colours, markings, pose, {parts}, framing, size and position in the frame, and the background.
```

**`sleepy`**
```text
Edit this exact image. Change only the face: lower heavy eyelids so the eyes are half closed, soften the brows, and make the mouth a small relaxed smile. No "zzz" or any other mark. Keep everything else identical: outline, colours, markings, pose, {parts}, framing, size and position in the frame, and the background.
```

**`sad`**
```text
Edit this exact image. Change only the face: tilt the inner ends of the brows up, make the eyes a little glossier with one small tear at the outer corner of the nearer eye, and turn the mouth into a small gentle downward curve. Keep it soft, not distressed. Keep everything else identical: outline, colours, markings, pose, {parts}, framing, size and position in the frame, and the background.
```

**`portrait`** (a new image, with the chosen base attached)
```text
Draw the same creature as in the attached image as a portrait for a collection card: head and upper body only, turned a little toward the viewer in a gentle three-quarter view, looking at the viewer with the same happy expression. Exactly the same style, outline weight, colours, markings and eye treatment as the attached image. Square 1024x1024; the portrait fills about 80% of the frame with a clear margin on every side; nothing else in the image; plain flat white background (or transparent if available).
```

**File names:** `<species>-<asset>-<n>.png` in `docs/rework/concepts/generated/`, where `n` counts the candidates made for that asset. Mark the chosen one in the manifest.

## R01: Cloud glider set

The first set: its chosen base becomes the second style reference for every later request. **Files (8):** `glider-base`, `glider-blink`, `glider-happy`, `glider-surprised`, `glider-sleepy`, `glider-sad`, `glider-alt`, `glider-portrait`.

- Base, `blink`, `happy` and `alt` (wing raised, underside showing) prompts: [ART-PROMPTS.md, Cloud glider](../ART-PROMPTS.md#cloud-glider-do-first). Attach the concept sheet.
- `surprised`, `sleepy`, `sad`, `portrait`: shared prompts, with `{parts}` = "ribbons, wings".
- Size 1536 × 1024. The pilot sprite was 458 px wide; this one must be at least 1400 px wide inside the frame.
- Reject a candidate whose wing root is open or whose ribbons touch the wing or each other (the mesh rig needs the gaps).

## R02: Sprout set

**Files (7):** `sprout-base`, `sprout-blink`, `sprout-happy`, `sprout-surprised`, `sprout-sleepy`, `sprout-sad`, `sprout-portrait`.

- Base prompt: [ART-PROMPTS.md, Sprout](../ART-PROMPTS.md#sprout). Attach the concept sheet and the chosen glider base.
- Variants: shared prompts, `{parts}` = "leaves, arms, feet".
- The sprout is the starter and the current pet Pip's successor: it must still read as "Pip" (teal, round, the two-leaf sprout). Reject a tall or thin candidate.

## R03: River set

**Files (7):** `river-base`, `river-blink`, `river-happy`, `river-surprised`, `river-sleepy`, `river-sad`, `river-portrait`.

- Base prompt: [ART-PROMPTS.md, River](../ART-PROMPTS.md#river). Attach the concept sheet and the chosen glider base.
- Variants: shared prompts, `{parts}` = "legs, tail, whiskers".
- Reject a candidate whose tail joins the hind leg without a gap, or whose head is not lifted (the rear-up reaction needs the neck visible).

## R04: Crown and scarf

The two RW02 accessories, redrawn to match the illustrated cast. Each is its own image, worn by nobody, seen as it would sit on a creature that faces the viewer's right. **Files (2):** `wear-crown-<n>`, `wear-scarf-<n>`. Square 1024 × 1024, the item filling about 80 % of the frame.

**`wear-crown`**
```text
A single flower crown and nothing else, in the same style as the attached creature: a soft ring of yellow, purple and pink flowers with small green leaves, seen from slightly above and to the front so it could sit on top of a head that faces the viewer's right. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024, plain flat white background (or transparent), the crown filling about 80% of the frame with a clear margin.
```

**`wear-scarf`**
```text
A single knitted scarf and nothing else, in the same style as the attached creature: red with orange stripes, wrapped once as if around a neck that faces the viewer's right, with two tails hanging down to the front, a little apart from each other. Closed plum-ink outline, soft cel shading with light from the upper left, no creature, no shadow, no text. Square 1024x1024, plain flat white background (or transparent), the scarf filling about 80% of the frame with a clear margin.
```

## R05: Weather Wardrobe items

The clothes [Weather Wardrobe](../../GAMES.md) dresses the pet in, so the illustrated companion can wear them too (the scarf is R04's). Each its own image, worn by nobody, posed for a creature facing the viewer's right. **Files (7):** `wear-sunhat`, `wear-sunglasses`, `wear-raincoat`, `wear-umbrella`, `wear-boots`, `wear-beanie`, `wear-mittens`. Square 1024 × 1024.

Use R04's prompt shape ("A single … and nothing else, in the same style as the attached creature … Square 1024x1024, plain flat white background …") with these subjects:

| File | Subject |
| --- | --- |
| `wear-sunhat` | a wide-brimmed straw sun hat, warm yellow with a pink band, seen from slightly above and to the front |
| `wear-sunglasses` | a pair of round sunglasses with sky-blue lenses and an orange frame, seen from the front and a little to the side |
| `wear-raincoat` | a yellow hooded raincoat with the hood down and two big buttons, seen from the side as if worn by a creature facing right, no body inside |
| `wear-umbrella` | an open blue umbrella with white dots and a short curved handle, seen from the side |
| `wear-boots` | a pair of red rain boots side by side, seen from the side, toes pointing right |
| `wear-beanie` | a knitted purple beanie with a cream pompom, seen from the front and a little to the side |
| `wear-mittens` | a pair of green knitted mittens with cream cuffs, thumbs out, seen from the front |

A rigging session may keep the raincoat and boots code-drawn if they will not fit varied bodies; generate them anyway so the choice is made with both in hand.

## R06: Home scene, day and dusk

The backdrop for the creature home (RW06), after the concept sheet's illustrated treehouse but quieter, with an empty foreground for creatures and toys drawn by code. **Files (2):** `home-day-<n>`, `home-dusk-<n>`. Landscape 1536 × 1024 (a session crops it to the 4:3 logical view and lets the spare dimension show more sky or ground).

**`home-day`** (attach the concept sheet)
```text
A children's storybook background painting, matching the "Illustrated adventure" treehouse scene on the attached concept sheet but calmer and less cluttered: a cosy wooden treehouse with a round window and a small awning, built in one big leafy tree on the left; a rope ladder; a small wooden table with a few pots; soft green hills and a pale morning sky behind; a calm pond with two or three lily pads at the lower right; flat grass and a flat stone shelf by the water across the whole lower third. The lower third is EMPTY: no creatures, people, animals, boats, toys or text anywhere, so characters can be placed there later. Soft cel shading with light from the upper left, gentle colours, closed plum-ink outlines on the main shapes only, no painterly texture, no vignette. Landscape 1536x1024.
```

**`home-dusk`** (edit of the chosen day scene)
```text
Edit this exact image. Change only the light and sky: dusk, with a warm orange-pink sky fading to soft purple at the top, warm yellow light in the treehouse window, and a handful of small soft firefly glows in the air. Keep every shape, the composition, the empty lower third and the framing identical.
```

## R07: Collection card paper

The pilot glider read pale on a white card; the art bible asks for a card tint. One square texture that cards and the chooser can stretch, with the species' colour tinted over it in code. **File (1):** `card-paper-<n>`. Square 1024 × 1024.

```text
A soft cream paper texture for a children's collection card, square 1024x1024: very gentle, almost flat, warm cream (#F6E6D8) with a faint pale-green leaf-and-vine border just inside the edge, and at most one tiny decorative leaf in one corner. Very low contrast so a character placed on it stays readable. No text, no creature, no shadow, no rounded-corner cutout, no strong pattern.
```

## R08: Three eggs

The chooser and the hatching scene draw an egg for an unhatched profile. One egg shape in three species colours, so one hatching rig serves all three starters. **Files (3):** `egg-sprout-<n>`, `egg-river-<n>`, `egg-glider-<n>`. Square 1024 × 1024.

**`egg-sprout`** (attach the chosen sprout base)
```text
A single egg standing upright and nothing else, in the same style as the attached creature: cream white (#F6E6D8) with four or five large soft round spots in the creature's teal (#5EC4C2), a closed plum-ink outline, soft cel shading with light from the upper left and one soft highlight. No crack, no ground, no shadow, no text. Square 1024x1024, the egg filling about 80% of the height with a clear margin, plain flat white background (or transparent).
```

**`egg-river`, `egg-glider`** (edits of the chosen sprout egg)
```text
Edit this exact image. Change only the spot colour to caramel (#C8956A). Keep the egg's shape, size, position, outline, shading and background identical.
```
and the same with lavender (`#B79BE0`).

## R09: Tote set

From [CAST.md](CAST.md#second-wave-new-rows-go-into-the-art-bible-when-generated). **Files (8):** `tote-base`, `tote-blink`, `tote-happy`, `tote-surprised`, `tote-sleepy`, `tote-sad`, `tote-alt`, `tote-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a round little hermit crab, seen in a gentle three-quarter view turned toward the viewer's right. A chubby round body in coral orange (#FF9A3C, shadow #D9731A) with a cream face, big glossy eyes set in the face (no eye stalks), a tiny dark dot nose, blush and a happy closed smile. Two big rounded claws held up in front like mittens, clearly separate from the body. Four short legs, slightly apart. On its back sits a spiral shell in sand yellow (#FFD54A, shadow #D9A520) with a soft pink lip at its opening; the shell is a clearly separate shape with a small gap of outline between it and the body where they meet at the sides. Relaxed neutral pose, standing on nothing.
```

- Variants: shared prompts, `{parts}` = "claws, legs, shell".
- **`alt`** (tucked in): `Edit this exact image. Change only the body: the crab has pulled itself into its shell so that only its face, eyes and the tips of both claws peek out of the shell's opening. Keep the shell, its position, the outline, colours, framing and background identical.`
- Reject a candidate with eye stalks, pincers that look sharp, a shell fused to the body, or a visible beach.

## R10: Trill set

**Files (7):** `trill-base`, `trill-blink`, `trill-happy`, `trill-surprised`, `trill-sleepy`, `trill-sad`, `trill-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a plump, round little songbird standing in side view facing the viewer's right. A sunny yellow body (#FFD54A, shadow #D9A520) with a cream belly, a short orange beak (#FF9A3C) in a gentle closed smile, big glossy eyes and blush. On its head a fanned crest of three big soft rounded feathers in coral pink (#FF9AC1), clearly separate from each other. Two tiny wings held against the sides, two long rounded tail feathers trailing behind with a small gap between them, and two small orange feet set a little apart. Not a duck: a round songbird. Relaxed neutral pose, standing on nothing.
```

- Variants: shared prompts, `{parts}` = "crest, wings, tail feathers, feet". For `happy` say "open the beak into a small delighted singing shape" instead of "open the mouth".
- Reject a candidate that reads as a duck or chick, or whose crest feathers merge into one shape.

## R11: Dapple set

**Files (7):** `dapple-base`, `dapple-blink`, `dapple-happy`, `dapple-surprised`, `dapple-sleepy`, `dapple-sad`, `dapple-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a chubby, friendly chameleon standing on four grippy feet in a gentle three-quarter view turned toward the viewer's right. A big domed head with huge round glossy eyes, a tiny bump nose, blush and a happy closed smile; a soft crest line along the back; a short tail that curls into a neat spiral behind, with a gap between the spiral and the body. Leaf-green body (#7CCF5A, shadow #4A9A35) with a cream belly and a few large soft round spots in pink (#FF9AC1), yellow (#FFD54A) and sky blue (#4FA3F7). Legs slightly apart. Relaxed neutral pose, standing on nothing (no branch).
```

- Variants: shared prompts, `{parts}` = "spots, legs, tail".
- Reject a candidate with a long curled tongue, a branch, or eyes on turrets pointing different ways.

## R12: Bramble set

**Files (8):** `bramble-base`, `bramble-blink`, `bramble-happy`, `bramble-surprised`, `bramble-sleepy`, `bramble-sad`, `bramble-alt`, `bramble-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a small round hedgehog in a gentle three-quarter view turned toward the viewer's right. Its "spikes" are soft, rounded tufts, like a fluffy hairdo, covering the back and the top of the head in berry purple (#9A6CF0, shadow #6C45C4). A cream face and belly, small round ears, a small dark nose, big glossy eyes, blush and a happy closed smile. Tiny legs set a little apart, tiny hands held in front, a stub tail. Nothing sharp anywhere. Relaxed neutral pose, standing on nothing.
```

- Variants: shared prompts, `{parts}` = "tufts, legs, hands".
- **`alt`** (curled): `Edit this exact image. Change only the pose: the hedgehog has curled into a round ball with its tufts outward, its face peeking out at the front, in the same place and at the same size in the frame. Keep the outline, colours, framing and background identical.`
- Reject sharp quills, a brown realistic hedgehog, or a tail longer than a stub.

## R13: Mossback set

**Files (8):** `mossback-base`, `mossback-blink`, `mossback-happy`, `mossback-surprised`, `mossback-sleepy`, `mossback-sad`, `mossback-alt`, `mossback-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a sturdy little tortoise walking in side view facing the viewer's right. A round head held out on a short neck, with big glossy eyes, a tiny nose bump, blush and a happy closed smile; four stumpy legs set a little apart; a tiny tail. The body is sky blue (#4FA3F7, shadow #2F78C9) with a cream chest and underside showing below the shell. The shell is high and rounded, mossy green (#7CCF5A, shadow #4A9A35) with a few soft rounded plates, a small tuft of moss and one tiny pink flower growing on top; the shell's top is flat enough to carry something. Relaxed neutral pose, standing on nothing.
```

- Variants: shared prompts, `{parts}` = "legs, shell, flower".
- **`alt`** (head in): `Edit this exact image. Change only the head and legs: the tortoise has pulled its head and legs most of the way into the shell, with just its face and eyes peeking out at the front. Keep the shell, its position, the outline, colours, framing and background identical.`
- Reject a candidate with a pointed beak, claws, or a shell with hard geometric plates.

## R14: Lumen set

**Files (8):** `lumen-base`, `lumen-blink`, `lumen-happy`, `lumen-surprised`, `lumen-sleepy`, `lumen-sad`, `lumen-alt`, `lumen-portrait`. Attach the concept sheet and the chosen glider base.

**`base`**
```text
Draw a new creature for the same cast as the attached approved glider, in exactly the same style, outline and shading: a plump, fuzzy, friendly moth in side view facing the viewer's right, hovering. A round cream body with a big fluffy cream ruff around the neck, big glossy eyes, blush and a happy closed smile, two soft feathery antennae curving up and a little apart. Two BIG ROUND upright wings (not swept or pointed), held half open above the body so both show: dusk pink (#FF9AC1) with soft purple edges (#9A6CF0) and a few soft round glow spots in warm yellow (#FFD54A). Tiny legs tucked under the body. Wings clearly separated from the body by a thin line of outline so they can move. Relaxed neutral pose, in the air.
```

- Variants: shared prompts, `{parts}` = "wings, antennae, ruff".
- **`alt`** (wings closed): `Edit this exact image. Change only the wings: fold them up and together above the body, closed, so their outer sides show. Keep the body, face, antennae, position, outline, colours, framing and background identical.`
- Reject a candidate whose wings are swept triangles (it must not resemble the glider), or with insect legs, a proboscis or realistic fur.

## R15: Pilot looks

Alternative colour "looks" a creature can earn through play (RW10/RW11): two per pilot species, each an edit of the chosen base so the rig and every variant still fit. The looks change only the body colours; outline, eyes, markings' shapes and the cream belly stay. **Files (6):** `sprout-look-blossom`, `sprout-look-pond`, `river-look-sunny`, `river-look-stream`, `glider-look-sunset`, `glider-look-morning`.

```text
Edit this exact image. Change only the body colours: {change}. Keep the outline, eyes, face, the cream belly, the shapes of all markings, the pose, framing, size and position in the frame, and the background identical.
```

| File | `{change}` |
| --- | --- |
| `sprout-look-blossom` | teal body to soft pink (#FF9AC1, shadow #D96A96); leaves unchanged |
| `sprout-look-pond` | teal body to sky blue (#4FA3F7, shadow #2F78C9); leaves unchanged |
| `river-look-sunny` | caramel body to warm golden yellow (#FFD54A, shadow #D9A520); tail unchanged |
| `river-look-stream` | caramel body to soft blue (#7FB8E8, shadow #4F86B8); tail to deep blue (#2F5F8A) |
| `glider-look-sunset` | lavender wing to warm peach (#FFB07A, shadow #E08A4E) with the cloud marks in pale pink (#FFE0EA); ribbons unchanged |
| `glider-look-morning` | lavender wing to soft mint (#8FD9B8, shadow #5FB08E) with the cloud marks in pale cream (#F8F3E6); ribbons unchanged |

Only the `base` gets a look here. If a look is adopted, its `blink`/`happy`/mood variants are a later request made the same way from that look.

## R16: Forms

Optional branching forms (a blossom opening on the sprout, the glider's sunset wing as a form, Tote's shell garden) are [RW11](../WORK-ITEMS.md#rw11-optional-forms-and-useful-talents) work and need its definition first. **Blocked:** do not generate.

## Not requested

- **The friends in the games** (the duck in fifteen games, the bunny in eight, the cow, cat, bear, pig and dog, the nine land hosts, the picnic cast): code-drawn today and staying so; reskinning them is a catalog-wide decision for after RW05 is seen on a device ([GAME-FIT.md](GAME-FIT.md#what-stays-code-drawn)).
- **Hub icons, stickers, land backdrops, habitat kits, buttons and UI:** unchanged by the creature direction.

## Run log

One line per run, newest first: date, request, tool and model, what was kept, what is missing, anything odd.

- 2026-10-17, 21:07 PDT start · R01 · built-in image_gen.imagegen, model undisclosed · kept eight originals (10.05 MB), no missing variants; three base candidates, switched to white-background candidate 3 after transparent edits produced noisy alpha. Expression bounds within 1 px of base; portrait margin caveat and exact prompts recorded in the [manifest](../concepts/generated/README.md). Links/diff checked; no code/build/browser/device checks, preparation or integration.
- 2026-10-17 · queue written; no run yet.
