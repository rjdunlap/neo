# Art request queue

The routine's work list ([how a run works](README.md#what-a-run-does)). Take the first `open` row whose **after** column is satisfied. Statuses: `open` → `done` (every listed file chosen and committed, or recorded missing) → `prepared` (a coding session cut and rigged it); `blocked` means do not start. Fill the **result** line when a request is done. Every image follows the [art bible](../ART-BIBLE.md); paste its [style block](../ART-PROMPTS.md#style-block-paste-first-every-time) before every base prompt.

## The queue

| ID | Request | Files | After | Status | Result |
| --- | --- | --- | --- | --- | --- |
| R01 | [Cloud glider set](#r01-cloud-glider-set) | 8 | — | done | [Eight originals and review notes](../concepts/generated/README.md#r01-review-and-preparation-notes): base-3; blink/happy/surprised/sleepy/sad/alt-2; portrait-4. No missing files; portrait needs extra card padding. Not prepared. |
| R02 | [Sprout set](#r02-sprout-set) | 7 | R01 | done | [Seven originals and review notes](../concepts/generated/README.md#r02-review-and-preparation-notes): base-2; blink/happy/surprised/sleepy/sad-1; portrait-2. No missing files. Not prepared. |
| R03 | [River set](#r03-river-set) | 7 | R01 | done | [Seven originals and review notes](../concepts/generated/README.md#r03-review-and-preparation-notes): base-4; blink/happy/sleepy/sad-1; surprised-2; portrait-2. No missing files. Not prepared. |
| R04 | [Crown and scarf](#r04-crown-and-scarf) | 2 | R01 | done | [Two originals and review notes](../concepts/generated/README.md#r04-review-and-preparation-notes): wear-crown-3 and wear-scarf-3. No missing files. Not prepared or fitted. |
| R05 | [Weather Wardrobe items](#r05-weather-wardrobe-items) | 7 | R04 | done | [Seven originals and review notes](../concepts/generated/README.md#r05-review-and-preparation-notes): sunhat-2, sunglasses-3, raincoat-1, umbrella-3, boots-4, beanie-1, mittens-1. No missing files. Not prepared or fitted. |
| R06 | [Home scene, day and dusk](#r06-home-scene-day-and-dusk) | 2 | R01 | done | [Two originals and review notes](../concepts/generated/README.md#r06-review-and-preparation-notes): home-day-3 and home-dusk-2. No missing files. Not prepared or integrated. |
| R07 | [Collection card paper](#r07-collection-card-paper) | 1 | R01 | done | [Original and review notes](../concepts/generated/README.md#r07-review-and-preparation-notes): card-paper-2. No missing file. Opaque texture; not integrated. |
| R08 | [Three eggs](#r08-three-eggs) | 3 | R03 | done | [Three originals and review notes](../concepts/generated/README.md#r08-review-and-preparation-notes): egg-sprout-2, egg-river-1 and egg-glider-1. No missing files. Not prepared or integrated. |
| R09 | [Tote set](#r09-tote-set) | 8 | R03 | done | [Eight originals and review notes](../concepts/generated/README.md#r09-review-and-preparation-notes): base-4; blink/happy/sleepy/sad/alt/portrait-1; surprised-2. No missing files. Portrait needs card padding. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R10 | [Trill set](#r10-trill-set) | 7 | R03 | done | [Seven originals and review notes](../concepts/generated/README.md#r10-review-and-preparation-notes): base-3; blink/happy/surprised/sleepy/sad-1; portrait-2. No missing files. Full-body needs display padding. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R11 | [Dapple set](#r11-dapple-set) | 7 | R03 | done | [Seven originals and review notes](../concepts/generated/README.md#r11-review-and-preparation-notes): base-2; blink/happy/sleepy/sad/portrait-1; surprised-2. No missing files. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R12 | [Bramble set](#r12-bramble-set) | 8 | R03 | done | [Eight originals and review notes](../concepts/generated/README.md#r12-review-and-preparation-notes): base-4; blink/happy/surprised/sleepy/sad/alt/portrait-1. No missing files. Needs display padding. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R13 | [Mossback set](#r13-mossback-set) | 8 | R03 | done | [Eight originals and review notes](../concepts/generated/README.md#r13-review-and-preparation-notes): base-4; blink/happy/surprised/sad/portrait-1; sleepy/alt-2. No missing files. Portrait needs card padding. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R14 | [Lumen set](#r14-lumen-set) | 8 | R03 | done | [Eight originals and review notes](../concepts/generated/README.md#r14-review-and-preparation-notes): base-4; blink/sleepy/sad/alt-1; happy/surprised/portrait-2. No missing files. Closed wings need display padding. Prepared 2026-10-20 ([second wave](../../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20)). |
| R15 | [Pilot looks](#r15-pilot-looks) | 6 | R03 | done | [Six originals and review notes](../concepts/generated/README.md#r15-review-and-preparation-notes): sprout-look-blossom/pond-1, river-look-sunny/stream-1, glider-look-sunset/morning-1. No missing looks. Not prepared; moods would be later requests. |
| R16 | [Forms](#r16-forms) | — | RW11's definition | blocked | |
| R17 | [Glider portrait re-roll](#r17-glider-portrait-re-roll) | 1 | R01 | done | [Chosen portrait and review notes](../concepts/generated/README.md#r17-review-and-preparation-notes): glider-portrait-8 replaces portrait-4 as chosen source. No missing file. Narrow side margins need card padding; not prepared or integrated. |
| R18 | [Hatching egg stages](#r18-hatching-egg-stages) | 6 | R08 | done | [Six originals and review notes](../concepts/generated/README.md#r18-review-and-preparation-notes): egg-sprout/river/glider-crack/open-1. No missing stages. Lower shell aligned below the cut; opening-boundary caveat recorded. Not prepared or integrated. |
| R19 | [Wearables at the cast's angle](#r19-wearables-at-the-casts-angle) | 3 | the wearables test-fit on the pilot rigs (done 2026-10-20, [fit](../../../src/art/creatures/wearables/README.md#the-fit-on-the-pilot-three)) | done | [Three originals and review notes](../concepts/generated/README.md#r19-review-and-preparation-notes): wear-raincoat-sitter-4, wear-raincoat-walker-4, wear-boots-sitter-3. None missing; framing/fit caveats recorded. Not prepared or integrated. [PR #654](https://github.com/rjdunlap/neo/pull/654). |
| R20 | [Casting poses](#r20-casting-poses) | 3 per species | a casting proof slice ([integration review](../PET-INTEGRATION.md#what-this-asks-of-the-art)) | blocked | |
| R21 | [Expression set for an adopted look](#r21-expression-set-for-an-adopted-look) | 6 per look | RW10 adopting a look | blocked | |
| R22 | [The friends, duck first](#r22-the-friends-duck-first) | 2 | the [catalog-wide art decision](../../WAITING-ON-DEVELOPER.md) | blocked | |
| R23 | [Land backdrops](#r23-land-backdrops) | 1 | the same decision, after R22 is seen on a device | blocked | |
| R26 | [Location backdrops](#r26-location-backdrops) | 10 | R23 accepted on a device | blocked | |
| R24 | [River head layer](#r24-river-head-layer) | 1 | R03 | done | Chosen `river-nohead-1.png`, first edit; none missing. [Proof and caveats](../concepts/generated/README.md#r24-review-and-preparation-notes), [PR #658](https://github.com/rjdunlap/neo/pull/658). Not prepared, rigged or integrated. |
| R25 | [Sprout arms layer](#r25-sprout-arms-layer) | 1 | R02 | in progress | Worker `01a15ac4-8f17-7fe3-9458-5b5e32be86b3`, branch `codex/art-r25`; only Sprout no-arms body plate. |

Priority is the row order: the three pilot species first (they are what RW05 integrates), then what dresses and houses them, then the second wave. R01–R15 were delivered 2026-10-17/18 and [reviewed 2026-10-19](../ART-REVIEW-2026-10-19.md): every set passes the preparation script's alignment rule, so the next work is cutting and rigging in code. R17 and R18 were delivered 2026-10-19 and [reviewed the same day](../ART-REVIEW-2026-10-19.md#second-pass-r17-r18-and-the-rigged-pilot-three-2026-10-19); R24 (done) and R25 (open) answer two defects the rigging session recorded and each has a rig follow-up waiting in [READY.md](../../READY.md). The rest wait on named code slices or decisions; the bottleneck is code and an iPad look, not images. Add a row only when a named slice will consume it.

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

## R17: Glider portrait re-roll

The chosen `glider-portrait-4` is the weakest of the nine cards: the smallest and palest at 110 px on sky blue, with a rounder, larger face than the base, so card and creature read as two designs ([review](../ART-REVIEW-2026-10-19.md#assessment)). **File (1):** `glider-portrait-<n>` (continue the candidate count from 5). Attach the chosen base `glider-base-3.png` and the chosen sprout portrait as the framing reference.

```text
Draw the same creature as in the first attached image as a portrait for a collection card, framed like the second attached image: the head large and dominant, turned a little toward the viewer in a gentle three-quarter view, the near wing sweeping behind the head and the far wing tip showing, one ribbon curling into the frame; looking at the viewer with the same calm happy expression, the same small eyes, cream face and blush as the first image. Keep the wing's lavender as deep as the first image (#B79BE0, shadow #8C6FC4), not paler. Exactly the same style, outline weight and eye treatment. Square 1024x1024; the portrait fills about 85% of the frame with a clear margin on every side; nothing else in the image; plain flat white background.
```

Reject a candidate whose face is bigger-eyed or rounder than the base's, or whose wing is paler than the base's. Shrink to 110 px on pale blue beside the sprout and river portraits before choosing.

## R18: Hatching egg stages

The kept hatch (RW05 slice 1) cracks the egg over four taps; `drawEgg` draws those cracks in code today. To use R08's eggs it needs the stages as pictures. **Files (6):** `egg-sprout-crack-<n>`, `egg-sprout-open-<n>`, then the caramel and lavender edits of each: `egg-river-crack`, `egg-river-open`, `egg-glider-crack`, `egg-glider-open`. Square 1254 × 1254 as R08. Make the sprout stages as edits of `egg-sprout-2.png`, then the colour edits exactly as R08 did.

**`crack`**
```text
Edit this exact image. Add a single zigzag crack line in the same plum ink across the upper third of the shell, with two short branches, and nothing else: no pieces missing, no light inside. Keep the egg's shape, size, position, spots, outline, shading and background identical.
```

**`open`**
```text
Edit this exact image. The top of the shell has broken off along the crack and lifted a little, tilted, with a jagged edge, showing a dark warm interior; the lower shell, its spots, outline, shading, size and position stay identical, and the background stays plain white. No creature inside, no pieces on the ground.
```

Reject a stage whose lower shell moved (the hatching rig swaps the three pictures in place). The silhouette comparison R08 used applies to the lower two thirds of the shell.

## R19: Wearables at the cast's angle

**Open** since the RW06 prep fit (2026-10-20) tried R04–R05's nine items on the three pilot rigs in code ([the fit](../../../src/art/creatures/wearables/README.md#the-fit-on-the-pilot-three)). The review expected the sunglasses, raincoat, mittens and boots to fail; the fit kept the sunglasses (three-quarter already, they sit on all three), the mittens (on the sprout's paws) and the boots (side-on, on the river's four paws). Only three placements failed for the angle, so this request re-draws only those. The glider's missing scarf, mittens, boots, umbrella and coat and the river's missing umbrella and mittens are the species' body plans, not the art, and are not asked for.

Each is a new image in the item's R04/R05 colours (the R05 raincoat's yellow with two brown buttons, the R05 boots' glossy red), with the named base attached as the angle reference, worn by nobody, using R04's prompt shape ("A single … and nothing else, in the same style as the attached creature …"), flat white ground, the item filling about 70% of a 1254 × 1254 square. **Files (3):**

| File | Reference | Subject |
| --- | --- | --- |
| `wear-raincoat-sitter` | `sprout-base-2.png` | a short yellow rain cape with the hood fallen behind, cut for a round, sitting creature with very short arms: a bell-shaped cape that would cover the shoulders and the top of a round tummy, with two short sleeve cuffs at its sides rather than long sleeves, seen from the same three-quarter front-right view as the attached creature, no body inside |
| `wear-raincoat-walker` | `river-base-4.png` | a yellow dog-style rain coat for a long, low creature walking on four legs, facing right: a coat that lies along the back from the neck to the hips with the hood down at the neck end and two buttons under the chest, seen from the side exactly as the attached creature is, no body inside |
| `wear-boots-sitter` | `sprout-base-2.png` | a pair of short red rain boots seen from the front-below, soles and round toe caps facing the viewer, as they would look on a sitting creature's feet held out toward the viewer, the two boots separate with a white gap |

Reject a candidate that shows a creature or mannequin, or that changes the item's colours. Fill in the prompts and results when done; a coding session cuts them with `--hole` where an opening is enclosed (`src/art/creatures/wearables/README.md`).

## R20: Casting poses

**Blocked** until a casting proof slice is chosen (the [integration review](../PET-INTEGRATION.md#what-this-asks-of-the-art) names Size Parade and Goodnight Room). Then, per owned species in that slice, three `alt` poses a mesh cannot fake, each an edit of the chosen base: `asleep` (eyes shut, curled or settled, the same framing), `peek` (looking out from behind the frame's left edge, only the head and one hand showing) and `carry` (the species' carrying posture: Mossback's shell, River's tummy, the glider's back). Files `<species>-<pose>-<n>`. Separate pose preparation, not the expression alignment rule.

## R21: Expression set for an adopted look

**Blocked** until RW10 adopts a look from R15. Then the five expressions (`blink`, `happy`, `surprised`, `sleepy`, `sad`) for that look, as edits of the look's base with the shared prompts, so the rig can swap them under the same mesh. Files `<species>-look-<name>-<expression>-<n>`.

## R22: The friends, duck first

**Blocked** on the [catalog-wide art decision](../../WAITING-ON-DEVELOPER.md): whether the code-drawn friends follow the companions onto the illustrated pipeline. The review's lean is one pilot pair first, the duck (the friend in fifteen games) and Rainbow Meadow's backdrop (R23), judged on a device beside the untouched lands. When unblocked: `duck-base-<n>` and `duck-portrait-<n>`, a new image each with the chosen sprout base attached, the art bible's style block, the duck as `src/art/critter.ts` draws it (yellow, orange bill and feet, side-on three-quarter right view, neutral pose), 1536 × 1024 on flat white; no expressions until a game needs them.

## R23: Land backdrops

**Blocked** on the same decision, after R22 is seen on a device. The pilot location backdrop, **Rainbow Meadow** as the [RW13 packet](../ISLAND-REVAMP.md#the-eleven-locations) defines it: a wildflower meadow (clover, daisies, poppies, tall grass, bees, butterflies, a rabbit at the edge, open sky). **File (1):** `land-meadow-<n>`, 1536 × 1024, in the home scene's palette but flatter: broad shapes, no painterly texture, the lower third an empty, even ground for the game spots, the signpost and the resident, no creatures in the foreground, no text. Attach `home-day-3.png` as the style reference. Check at 1024 × 768 and in portrait (the view expands the spare dimension): nothing the eye lands on sits where the spots stand, and the 100-unit spots read against it. The code-drawn meadow from RW13 slice 2 stays until this is accepted.

## R24: River head layer

The rigged river ([step 2](../GENERATED-CREATURE-PILOT.md#step-2-result-2026-10-19)) pins its head, so the Graphics rig's look-around and head tilt are gone: the head is painted on the same picture as the neck, and moving it would tear the neck. A body plate with the head removed lets the rig lay each expression's head over it and turn it. **File (1):** `river-nohead-<n>`, an edit of the chosen `river-base-4.png` (attach it).

```text
Edit this exact image. Remove the head completely (ears, face, muzzle, whiskers and the top of the head) as if it were drawn on a separate layer above. Continue the neck upward and forward a little past where the head joined it, ending in a soft rounded end that is fully painted in the same caramel with the cream throat continuing, with the same plum outline closed around it. Keep everything else identical: the body, back, cream belly, legs, paws, the dark paddle tail, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
```

Check: below and behind the neck the silhouette stays within the 4 px tolerance of the base (as R03's variants did); the neck end sits fully inside the base's old head area, so the head layer covers it at rest. Reject a candidate that moves the shoulder, invents a new head, or leaves an open outline. If three tries fail, record it `missing`; the rig keeps the pinned head.

## R25: Sprout arms layer

The rigged sprout paints its belly under its arms, so the arms barely wag (a bigger wag stretches the belly) and the scarf is drawn over them. A body plate with the arms removed lets the rig cut the arms from the base and move them freely. **File (1):** `sprout-noarms-<n>`, an edit of the chosen `sprout-base-2.png` (attach it).

```text
Edit this exact image. Remove both arms completely, as if they were drawn on a separate layer above. Paint the teal body side and the cream belly continuously where the arms were, with the same soft shading and the same plum outline following the body's round side. Keep everything else identical: the face, ears, leaves and stem, the feet and their pink pads, colours, shading, outline weight, pose, framing, size and position in the frame, and the plain white background.
```

Check: outside the arm areas the silhouette stays within 4 px of the base; inside them the body is closed and round with no ghost of a hand. Reject a candidate that changes the face or belly shape. If three tries fail, record it `missing`; the rig keeps the small wag.

## R26: Location backdrops

**Blocked** until R23 is accepted on a device. The other ten locations of the [RW13 packet](../ISLAND-REVAMP.md#the-eleven-locations), one image each, with R23's frame, palette and empty lower third, attaching `home-day-3.png` and the accepted `land-meadow` as references. Only real plants and animals, and only those the packet lists for the place; no resident creatures, no text. **Files (10), in this order:** `land-cove` (a marsh where a river meets the sea: reeds, cattails, lily pads upstream, a mudflat, a heron), `land-peaks` (bamboo and conifers on the lower slopes, a snowline, rocky peaks, high cloud; no penguins), `land-beach` (a rocky shore with tide pools: sea stars, anemones, barnacles, kelp, gulls; no coral), `land-music` (a misty tropical cloud forest: mossy trunks, tree ferns, orchids, bromeliads, a hummingbird), `land-canyon` (layered red and orange desert rock, prickly pear, yucca, cottonwoods at a spring), `land-village` (cottages, a lane and a hawthorn hedge with blackberries), `land-grove` (a woodland garden at night: moon, stars, fireflies, evening primrose; the ground lit enough to read the spots), `land-tinker` (a cave mouth with stalactites and glow-worm lights, workbenches inside), `land-barnyard` (barn, fence, orchard trees), `land-lake` (a lake at dusk with lanterns; grown-up land, last). Check each as R23. A location keeps its code-drawn backdrop until its image is accepted.

## Not requested

- **The friends in the games** beyond the duck pilot above (the bunny in eight games, the cow, cat, bear, pig and dog, the nine land hosts, the picnic cast): code-drawn today and staying so until the catalog-wide decision ([GAME-FIT.md](GAME-FIT.md#what-stays-code-drawn)).
- **Hub icons, stickers, habitat kits, buttons and UI:** unchanged by the creature direction; small, numerous and seeded, they should stay code-drawn.

## Run log

One line per run, newest first: date, request, tool and model, what was kept, what is missing, anything odd.

- 2026-10-20 · R24 · built-in image_gen.imagegen, model undisclosed · first edit chosen as untouched `river-nohead-1.png` (1536 × 1024, 1,454,269 bytes); none missing. Full-size/120 px review, source hash equality, body silhouette within 4 px and neck cap inside old head passed. [Exact prompt/proof and shading caveat](../concepts/generated/R24-PROMPTS.md). Links/diff checked; no preparation, rigging, integration or runtime/device checks. Worker `01a15a8d-49e3-7062-ace9-23a4ef553b11`, branch `codex/art-r24`, [#658](https://github.com/rjdunlap/neo/pull/658).

- 2026-10-20 · R19 · built-in image_gen.imagegen, model undisclosed · eleven calls; kept sitter-4, walker-4 and boots-sitter-3 untouched. Full-size/120 px review, source hashes, [exact prompts and fitting caveats](../concepts/generated/README.md#r19-review-and-preparation-notes). Three 1254 × 1254 originals; no missing asset. Links/diff checked at publication; no preparation, rigging, integration or runtime/device checks. Worker `01a15a51-168d-7022-9810-6d1640f399c9`, branch `codex/art-r19`, [#654](https://github.com/rjdunlap/neo/pull/654).

- 2026-10-19, 14:01 PDT start · R18 · built-in image_gen.imagegen, model undisclosed · six first-call stage edits kept untouched (8.82 MB), none missing. Full-size/120 px review and lower-shell comparison recorded with the intentional opening-edge change; [exact prompts, references and preparation caveats](../concepts/generated/README.md#r18-review-and-preparation-notes). Links/diff checked; no cutting, rigging, integration or code/device checks. No eligible open requests remain: R16 and R19–R23 await their named dependencies; routine pauses after publication.
- 2026-10-19, 13:33 PDT start · R17 · built-in image_gen.imagegen, model undisclosed · candidates 5–7 reviewed full size and at 110 px on pale blue beside Sprout/River; candidate 7 refined as chosen portrait 8 (1.32 MB). Earlier candidates stayed wing-dominant or had an open lower contour. [Exact prompts, references, final card comparison and margin caveat](../concepts/generated/README.md#r17-review-and-preparation-notes) recorded. Portrait 4 retained but unchosen; no missing asset. Links/diff checked; no cutting, rigging, integration or code/device checks.
- 2026-10-18, 02:45 PDT start · R15 · built-in image_gen.imagegen, model undisclosed · six color edits of approved pilot bases, kept six originals (9.11 MB), no missing looks or retries. Full-size/120 px review and silhouettes within 4 px of respective bases; [exact prompts and preparation caveats](../concepts/generated/README.md#r15-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration. No eligible production requests remain; R16 awaits RW11's form definitions.
- 2026-10-18, 02:15 PDT start · R14 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; candidate 2 refined with second eye highlights as base 4. Kept eight originals (12.19 MB/11.63 MiB), no missing assets. Happy/surprised replaced for stray brows; portrait replaced for open lower contour. Five chosen expression silhouettes within 4 px; [exact prompts, closed-wing and padding caveats](../concepts/generated/README.md#r14-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-18, 00:43 PDT start, resumed 02:00 · R13 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; candidate 2 refined with second eye highlights as base 4. Kept eight originals (12.47 MB/11.89 MiB), no missing assets. Sleepy 1 replaced for eyelid drift; alt 1 replaced for shifted tail. Five chosen expression silhouettes within 4 px; [exact prompts, tucked-pose and padding caveats](../concepts/generated/README.md#r13-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-18, 00:25 PDT start · R12 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; candidate 3 refined with second eye highlights as base 4. Kept eight originals (12.44 MB/11.86 MiB), no missing assets or rejected mood edits. Five expression silhouettes within 4 px; [exact prompts, curled-pose and display-padding caveats](../concepts/generated/README.md#r12-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-18, 00:10 PDT start · R11 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; base 2 chosen for tail separation and soft crest. Kept seven originals (10.61 MB), no missing assets. First surprised rejected for far-brow silhouette drift; replacement and other moods within 4 px. [Exact prompts, anatomy and padding caveats](../concepts/generated/README.md#r11-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-17, 23:55 PDT start (finished 2026-10-18) · R10 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; base 3 chosen for three-feather crest and eye highlights. Kept seven originals (10.27 MB), no missing assets; portrait 1 replaced for narrow margins. Expressions within 4 px silhouette tolerance; [exact prompts, lighting and padding caveats](../concepts/generated/README.md#r10-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-17, 23:40 PDT start · R09 · built-in image_gen.imagegen, model undisclosed · three bases reviewed; candidate 2 refined for dot nose/second eye highlights as base 4. Kept eight originals (12.34 MB/11.77 MiB), no missing assets. First surprised lost the nose and was replaced. Expressions within 4 px silhouette tolerance; [exact prompts, tucked-in pose and portrait-padding caveats](../concepts/generated/README.md#r09-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-17, 23:25 PDT start · R08 · built-in image_gen.imagegen, model undisclosed · three base candidates reviewed full size and at about 120 px; kept egg-sprout-2 and its caramel/lavender edits egg-river-1 and egg-glider-1 (4.16 MB), no missing files. Matching bounds and silhouettes within 4 px; [exact prompts and preparation caveats](../concepts/generated/README.md#r08-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, cutting, rigging or integration.
- 2026-10-17, 23:09 PDT start · R07 · built-in image_gen.imagegen, model undisclosed · three paper candidates reviewed full size and at about 120 px; kept card-paper-2 (1.10 MB), no missing asset. Opaque square and nearly flat central cream verified; [exact prompts and integration notes](../concepts/generated/README.md#r07-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks or integration.
- 2026-10-17, 22:49 PDT start · R06 · built-in image_gen.imagegen, model undisclosed · three daytime candidates and two dusk edits reviewed; kept day-3 and dusk-2 (3.94 MB). First dusk rejected for changed clouds/dark foreground. [Exact prompts, visual landmark comparison and temporary 4:3 crop notes](../concepts/generated/README.md#r06-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/offline/device checks, production cropping or integration.
- 2026-10-17, 22:17 PDT start · R05 · built-in image_gen.imagegen, model undisclosed · three candidates per item plus one replacement boot pair, reviewed full size and at about 120 px; kept seven originals (8.63 MB), no missing assets. First three boot pairs overlapped; candidate 4 separates them. [Exact prompts, margin and fitting caveats](../concepts/generated/README.md#r05-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/device checks, cutting, rigging or integration.
- 2026-10-17, 22:02 PDT start · R04 · built-in image_gen.imagegen, model undisclosed · three candidates per item reviewed full size and at about 120 px; kept crown-3 and scarf-3 (2.45 MB). No missing assets; [exact prompts, crown-margin and fitting caveats](../concepts/generated/README.md#r04-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/device checks, cutting, rigging or integration.
- 2026-10-17, 21:43 PDT start · R03 · built-in image_gen.imagegen, model undisclosed · kept seven originals (10.30 MB), no missing variants. Three base candidates reviewed; candidate 1 refined with second white eye highlights as base 4. First surprised rejected for silhouette drift, first portrait for unoutlined chest. Expression silhouettes within 4 px and bounds within 2 px; [prompts and preparation caveats](../concepts/generated/README.md#r03-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/device checks, preparation or integration.
- 2026-10-17, 21:28 PDT start · R02 · built-in image_gen.imagegen, model undisclosed · kept seven originals (10.23 MB), no missing variants. Three base candidates reviewed; candidate 2 chosen; first portrait rejected for bottom-edge clipping. Expression silhouettes within 4 px and bounds within 1 px; [prompts and preparation caveats](../concepts/generated/README.md#r02-review-and-preparation-notes) recorded. Links/diff checked; no code/build/browser/device checks, preparation or integration.
- 2026-10-17, 21:07 PDT start · R01 · built-in image_gen.imagegen, model undisclosed · kept eight originals (10.05 MB), no missing variants; three base candidates, switched to white-background candidate 3 after transparent edits produced noisy alpha. Expression bounds within 1 px of base; portrait margin caveat and exact prompts recorded in the [manifest](../concepts/generated/README.md). Links/diff checked; no code/build/browser/device checks, preparation or integration.
- 2026-10-17 · queue written; no run yet.

## R19 worker checkpoint

2026-10-20: worker `01a15a51-168d-7022-9810-6d1640f399c9`, branch `codex/art-r19`, base `9ebda89d`. Dedicated branch because `codex/art-queue` remains attached to the prior routine chat; preserve it. Admission 4% five-hour / 1% weekly used; resets `1792531091` / `1793117891`, ordinary usage allowed. Coordinator estimate 21.25 / 3.75 points fits 96 / 99 remaining. Coordinator `01a12db9-1a9e-7131-bda8-dc99bd6dea8d` exempt; no other active implementation chat or R19 claim. Expected files: three wearable PNGs, generated manifest and R19 prompts, this queue, execution checkpoint. Next: publish claim, generate/review three candidates per item, retain chosen originals under about 12 MB, links/diff check, publish and stop. No cutting/rigging/integration.

R19 result: selected originals total 3,606,581 bytes. Source SHA-256 equality and 1254-square dimensions verified; links/diff publication proof recorded in PR #654. Worker scope/pre-implementation/pre-review/pre-publication used readings: 4/1 → 8/1 → 10/1 → 11/2%, reset identities unchanged (`1792531091` / `1793117891`), ordinary usage true. Aggregate change +7/+1 points may include other account work; coordinator admission was 2/0 with estimate 21.25/3.75 points. Next: publish/merge this art-only PR, then stop; a separately admitted preparation session owns fitting, holes and integration. Final post-publication reading belongs in worker response, no extra usage-only commit.

## R24 worker checkpoint

2026-10-20: worker `01a15a8d-49e3-7062-ace9-23a4ef553b11`, branch `codex/art-r24`, base `c4efc0e7`. Dedicated branch preserves the prior art routine checkout. Scope: only `river-nohead`, edited from chosen `river-base-4.png`; at most three tries, reject body silhouette drift beyond 4 px, exposed neck end, moved shoulder, residual/new head or open outline. Expected files: original PNG(s), generated manifest and R24 prompt/proof, this queue. No preparation, rigging or integration. Usage at scope 15% five-hour / 2% weekly used, resets `1792531091` / `1793117891`, ordinary usage true; coordinator estimate 15/2.5 fits 85/98 remaining. Coordinator `01a12db9-1a9e-7131-bda8-dc99bd6dea8d` exempt; no other active implementation chat or R24 art claim. Next: publish claim/draft PR, generate and inspect, links/diff check, publish result (or explicit missing after three failures), then stop.

R24 result: [PR #658](https://github.com/rjdunlap/neo/pull/658), chosen `river-nohead-1.png`, first call; no missing layer. Source preservation, full-size/120 px review and four-pixel silhouette/neck-coverage inspection passed; [proof and exact prompt](../concepts/generated/R24-PROMPTS.md). Tested base `2dbcc3c8` plus this images/docs diff; links and diff checks passed. Scope/pre-generation/pre-review/pre-publication usage 15/2 → 18/3 → 20/3 → 21/3% used; reset identities unchanged (`1792531091` / `1793117891`), ordinary usage true. Worker aggregate +6/+1 may include other work; coordinator admission was 13/2 with 15/2.5 estimate. Next: publish/merge this art-only result and stop; a separately admitted rig follow-up owns head cutting and motion/device validation. Final post-publication reading goes in worker response, with no usage-only commit.

## R25 worker checkpoint

2026-10-20: worker `01a15ac4-8f17-7fe3-9458-5b5e32be86b3`, branch `codex/art-r25`, base `638d4e05`. Scope: only `sprout-noarms`, edited from chosen `sprout-base-2.png`; up to three tries, then explicit missing if none preserves face, belly shape and the silhouette outside arm areas within 4 px. Expected files: untouched PNG, generated manifest and R25 prompt/proof, this queue and assigned execution checkpoint. No preparation, rigging, integration or other request. Scope usage 24% five-hour / 4% weekly used, resets `1792531091` / `1793117891`, ordinary usage true. Conservative 15/2.5 point art estimate fits 76/96 remaining. Coordinator `01a12db9-1a9e-7131-bda8-dc99bd6dea8d` exempt; its dispatch PR is coordination only; no other active implementation chat or R25 claim. Preserve prior art branches and CompanionRig #642. Next: publish claim/draft PR, generate, inspect full size and at 120 px, check links/diff, publish result or missing and stop.
