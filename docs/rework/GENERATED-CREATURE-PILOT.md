# RW02b: Generated creature art and animation pilot

**Status:** partly done. On 2026-10-17 ([PR #503](https://github.com/rjdunlap/neo/pull/503)) the preparation pipeline, mesh rig and comparison were proven on a stand-in cut from the concept sheet; see [Pilot result](#pilot-result-2026-10-17). **First-slice step 1 (generate candidates) runs through the [art request queue](art-requests/README.md)** (2026-10-17): an image-generating routine takes one request a run, following the [art bible](ART-BIBLE.md) and [prompts](ART-PROMPTS.md), and a session then prepares and rigs each chosen set. Defined 2026-10-17 as a follow-up to [RW02 / PR #499](https://github.com/rjdunlap/neo/pull/499), before production art is consumed by RW05. [Work-item index](WORK-ITEMS.md#rw02b-generated-creature-art-and-animation-pilot).

## Developer decision and ownership

On 2026-10-17 the developer approved changing the rule against imported sprites: “I'm fine changing that rule about sprites, it's more I wouldn't be able to make them.” Generated raster sprites, layered illustration and texture atlases are allowed. The assistant owns asset generation, preparation, integration and documented reproduction; the developer is not expected to draw, cut layers, clean frames or animate them. The sound synthesis rule remains unchanged. This permission does not select a final style, approve a whole-game reskin or require a paid animation product.

## Problem and outcome

The developer still found the creatures, especially the glider's wings, below the quality of the [concept sheet](concepts/art-directions-2026-10-16.png) after several code-drawn revisions. Rebuilding generated illustrations with simple Pixi Graphics curves loses their shape, warmth and volume; scaling rigid wing shapes limits animation. This is an assessment of this prototype, not proof that vector art cannot achieve that quality.

Deliver one polished **cloud glider** in an isolated dev preview: a coherent illustrated sprite with an idle, a wingbeat and a touch reaction, plus a small collection portrait and a wearable crown. Compare it directly with the existing Graphics glider at the same on-screen sizes. Keep the other two creatures and the game's normal front door intact. Do not expand to the full cast until this experiment establishes a repeatable workflow.

## Read first and preserve

- [Current art packet](CREATURE-ART.md), concept sheet and `src/art/creatures/glider.ts`, `creature.ts`, `accessories.ts`, `creatures.test.ts`; preview: `src/dev/creature-preview.ts`, opened with `/?creatures` in development.
- The current stable species ID is `glider`; it supports a crown on `head` and deliberately declines a scarf. Preserve those semantics and minimum touch targets.
- Inspect `git status` and current main before editing. The defining session used `codex/rw02-review`, based on `97efae1`, and left review/art changes **uncommitted**. Do not assume those changes are merged or available in a fresh checkout. PR #499 is the merged baseline; determine what subsequent work actually exists.
- Ignored `test-results/rw02-*.png` and probes may exist in that worktree, but are not durable dependencies. Keep accepted source art and reproducible tools in tracked project files, with a short manifest. Do not rely on this chat, temporary outputs or a particular local path.

## First slice

1. Use the available image-generation tool and its skill to generate a small set of glider candidates from the concept sheet. Aim at its illustrated-adventure warmth: broad soft manta wings, clear attachment to the body, a readable friendly face, pale lavender/cream cloud markings and flowing ribbons. No need for pixel art or a soft-toy rendering experiment. Supply the concept and approved candidate as visual references for subsequent edits; use the shared palette as the color guide.
2. Choose and preserve one strong static design before animating it. Inspect the full-size creature and its 150-unit card portrait. Keep lighting, proportions, markings and camera angle fixed across assets. A beautiful large image that fails at game size is not sufficient.
3. Prefer **layered illustration plus controlled animation**: separate near/far wings, body, face and ribbons, with hidden overlap under moving parts. Prepare clean alpha edges. Use deformable wing geometry or a few explicit wing poses so the roots stay attached while the tips bend; do not merely shrink the entire wing vertically. Keep eyes and the crown separately controllable.
4. Use the smallest renderer that proves the result. Existing Pixi textures, containers and a small mesh/pose rig are a reasonable starting point. Spine is an optional candidate, not a mandatory dependency or purchase; check its current capabilities/license if chosen. If automatic layer extraction is unavailable, the assistant must use another workable asset-preparation approach or pose-based animation, not hand the drawing work back to the developer.
5. Add one idle, a complete wingbeat cycle and one touch reaction. A reference-driven short video or generated key poses may help, but extracted frames require inspection and cleanup for drift, alignment and loop seams. A generic “make a spritesheet” prompt is not acceptance. Use alternate artwork for folds/undersides when deformation cannot represent them convincingly.
6. Wire a temporary comparison in the existing dev preview. Preserve species identity, input behavior, accessory handling and cleanup. Keep runtime generation out of the app: ship prepared local assets only. Record how RW05 will consume the accepted renderer and remove the comparison; do not introduce a permanent old/new mode.

## Acceptance and proof

- Compare old/new idle and reaction at identical gameplay and collection sizes in landscape and portrait, dressed and bare. The new version should visibly preserve the concept's broad wing silhouette and integrated body; show the result for review without claiming aesthetic approval in advance.
- Motion has stable anatomy, face and markings; wing roots do not separate; wings bend rather than behave like hinged paper cutouts. Inspect a complete cycle, including the loop boundary and repeated taps.
- Crown stays attached without hiding the face; unsupported scarf behavior stays explicit. Hit targets stay at least 100 logical units after scaling, with immediate feedback and palm rejection.
- Prepared assets have true transparency, consistent scale/origin, sufficient padding and clean edges on both light and dark backgrounds. Commit source/reference assets, export dimensions, pivots/attachment metadata, prompts/settings and any preparation scripts needed to reproduce the result; record generation tool and relevant usage terms. Avoid embedding temporary URLs, secrets or machine-specific paths.
- Run typecheck, focused creature/attachment tests and one filtered preview probe covering inputs, crown, card fit, repeated taps, both orientations and exit cleanup. Review screenshots plus the actual motion. Run build to check asset loading and production isolation; if assets enter the production bundle/cache, add the production offline check. No unrelated game/world suites for an isolated preview.
- Record asset/atlas sizes, display-object count and observed preview frame timing, distinguishing desktop/headless results from iPad performance. iPad touch/performance and child preference remain open until observed; they do not block making a reviewable pilot.
- Finish with a short recommended workflow, actual generation/cleanup effort, remaining defects and whether the result warrants extending to sprout/river. A still image alone is not completion. Stop after this pilot; no collection/save/route cutover or catalog reskin.

## Research carried forward

Reviewed 2026-10-17; these are starting points, not independently benchmarked product endorsements. Reddit reports are anecdotal and may include vendors.

- [Sketch → static image → animation → spritesheet](https://www.reddit.com/r/aigamedev/comments/1sisx27/finally_smoothed_out_the_animation_w_new/): an example of approving the source image before motion.
- [Generation, animation and Aseprite cleanup](https://www.reddit.com/r/aigamedev/comments/1s76q5f/finally_figured_out_how_to_make_decent_animations/): a working multi-tool account, including face cleanup; its pixel-art specifics are not our target style.
- [Sprite workflow difficulties](https://www.reddit.com/r/aigamedev/comments/1x1abfa/workflow_for_sprites/): static quality does not establish consistent animation.
- [Spine meshes](https://us.esotericsoftware.com/spine-meshes), [Pixi runtime](https://us.esotericsoftware.com/spine-pixi), [skins/attachments](https://en.esotericsoftware.com/spine-runtime-skins): technical candidates for deformation and dressing.
- [Scenario layer extraction](https://help.scenario.com/articles/8235214611-image-to-layers-and-video-to-layers-the-essentials): optional assistance, with output still needing inspection.
- [Unity's image/video/spritesheet workflow](https://unity.com/blog/unity-ai-sprite-generator): confirms that approach, explicitly presented as prototyping rather than guaranteed finished art.

## Next-session starting instruction

Implement RW02b from this packet. Inspect the actual worktree/main state, preserve unrelated work, generate and integrate one illustrated glider using available tools, and return a playable comparison plus reproducible assets and focused verification. The developer has approved sprites and is not expected to make the artwork. Do not ask again whether sprites are allowed. Final cast/style selection and rollout remain separate decisions.

## Pilot result (2026-10-17)

Built on `claude/rw02b-illustrated-glider` from merged `main` (`b6b2a68`). The uncommitted `codex/rw02-review` changes to the Graphics species were left alone; the comparison's "Graphics" side is the merged PR #499 glider.

**What exists.** Open `/?creatures` in a dev build. An illustrated glider (`src/art/creatures/glider-illustrated.ts`) stands beside the Graphics glider at the same stage scale, with a fourth collection card at the same card scale. Both take the crown and decline the scarf, use the same 112-unit touch circle at stage scale, the same loop-the-loop and the same accessory toggles.

![Graphics and illustrated gliders side by side, dressed](concepts/rw02b-glider-comparison.png)

**The art is the concept sheet's glider, not a new generation.** This session had no image-generation tool. So the pilot cut the "Illustrated adventure" glider out of the committed concept sheet as a labelled stand-in, to prove preparation, rig and comparison.
- **Rebuild:** was `node scripts/creature-art/prepare-glider.mjs`; the stand-in and its wrapper were deleted at step 2 (below), which prepares the real sets with `prepare-sprite.mjs --set`.
- **Manifest:** [`src/art/creatures/illustrated/README.md`](../../src/art/creatures/illustrated/README.md).
- **Still open:** step 1's candidate set (several generated gliders, a chosen design, consistent re-generation for poses or layers). The next session with an image tool should start there, re-run the same preparation and keep the rig. The next-session instruction below still applies, starting at step 1.

**Animation: a deformable mesh, not layers.** A flat image has no hidden overlap to cut layers from, so the sprite rides a 30 × 14 mesh and vertices move by weight:
- the body and face are pinned;
- the wing moves by its distance from the root along the root→tip line, as a wave whose tip lags, so it bends rather than hinges and its root cannot part from the body;
- the far fin beats against the wing;
- the ribbons ripple behind the trailing edge.

The wing beats at 2.2 rad/s at idle and eases up to 9 rad/s during the touch loop. Its phase accumulates and the reaction's strength is eased, so neither the start or end of a reaction nor a quick re-tap snaps the wing; a test bounds every vertex's movement per frame, and it failed at 15 px before this was fixed. The painted eyes cannot close, so a lid of wing colour with a lash line covers each one for a blink.

![Six phases of the touch wingbeat, crown on](concepts/rw02b-glider-wingbeat.png)

| Measured (dev, not iPad) | Graphics glider | Illustrated glider |
| --- | --- | --- |
| Display objects | 88 | 17 (one mesh, lids, slot) |
| `update()` per frame, Node | ≈3.7 µs | ≈19 µs (420 vertices moved and uploaded) |
| Asset | none | 458 × 206 PNG, ≈99 KB file, ≈0.5 MB GPU with mipmaps |
| Headless preview, four gliders plus sprout and river | — | 7–10 fps in software rendering, against ≈21 fps for RW02's six creatures in the same kind of harness; says nothing about an iPad |

**Proof.**
- **Unit tests** (`glider-illustrated.test.ts`, 7 tests at the time; step 2 replaced them with a shared suite per species):
  - same species, slots and scarf misfit as the Graphics glider;
  - touch circle ≥ 100 units at stage scale;
  - the sprite's recorded size, a transparent border and opaque eyes;
  - face and wing root pinned through idle and three taps (two in quick succession);
  - the wing tip travels more than 12 px;
  - no painted pixel stretches past double;
  - the tip/mid ratio varies (a bend, not a hinge);
  - no vertex moves more than 8 px between frames through a reaction's start, its end and a quick re-tap;
  - the crown rides the loop and settles;
  - destroy frees the geometry and not the shared texture.
- **Preview probe** (`test-results/rw02b-probe.mjs`, Chromium headless, 1024 × 768 and 768 × 1024):
  - two quick taps restart the reaction;
  - the crown and scarf toggles work dressed and bare;
  - cards fit;
  - leaving to the chooser raised no page errors.
- **Wingbeat strips:** three strips were inspected as stills: idle, touch, and the reaction's end with the loop live (six frames each). The real-time motion was not watched by a person.
- **Edges:** the sprite was checked on light, dark and checkerboard backgrounds.
- **Production build:** no sprite or preview code in `dist/` or the precache, so no offline check is needed.

**Assessment.** The illustrated glider keeps the concept's broad wing, integrated body, cloud markings and ribbons, which is what the Graphics version lost. **Developer verdict (2026-10-17): "the illustrated looks much better."** Illustrated sprites on a mesh rig are the creature direction. RW05 keeps the illustrated glider and deletes the Graphics glider; sprout and river follow once real candidates are generated (step 1).

**Defects and limits:**
- **Soft source.** About 1.4 sprite pixels per logical unit on the stage, so about 0.7 per device pixel on a 2× iPad: visibly soft up close. A production generation should be at least 2–3× larger.
- **Weak at card size.** It reads paler and smaller than the Graphics glider at card size on white. A card background tint or a slightly larger card scale would help.
- **Covered ears.** The crown covers the ear tips.
- **Painted lids.** The blink lids are painted patches. A generated eye-closed variant would look better.
- **Ribbon kink.** The upper ribbon compresses slightly where it leaves the wing at the beat's extreme.
- **Loop restart.** A re-tap mid-reaction restarts the craft's loop with a small jump (about 17 units), inherited from the Graphics glider; the mesh itself does not jump.
- **No underside view.** The wing never shows its underside; a mesh cannot fold, so a deeper beat needs alternate artwork.

**Recommended workflow:**
1. Generate a large (≥1400 px wide) side view on flat paper, plus an eyes-closed variant.
2. Prepare it with this script, given a new box and seed.
3. Mark root, tip and face points in a `*_ART` table.
4. Reuse this weight-field mesh rig per species.

Effort for this pilot: about an hour of preparation and tuning. Nearly all of it went to edge de-fringing and weight-field boundaries, not drawing.

**Extending to sprout and river.** Worthwhile only after a real generation pass: the sprout's leaf sway and the river's spine wave map onto the same weight-field approach. Do not reskin them from the concept sheet, which is too small.

**Hand-off to RW05.** RW05 keeps one glider renderer and deletes the other, the `art` comparison entry in `src/dev/creature-preview.ts` and the texture load in `main.ts`'s dev hook. If RW05 keeps the illustrated version, it moves the asset loading into the collection's own scene load and makes card thumbnails still textures as [CREATURE-ART.md](CREATURE-ART.md#production-recommendation) recommends.

**Not established:**
- iPad frame rate and touch feel;
- a child's preference between the two;
- whether anyone watching the real motion finds it convincing.

These are in [device checks](../DEVICE-CHECKS.md).

## Step 2 result (2026-10-19)

Built on `claude/rw02b-rig-pilot-three` ([PR #609](https://github.com/rjdunlap/neo/pull/609)) from `main` dc7fb3b4, after the [art review](ART-REVIEW-2026-10-19.md). The three pilot species now stand as illustrated mesh rigs beside their Graphics rigs in `/?creatures`, with a card each; the concept-sheet stand-in and `prepare-glider.mjs` are gone.

**Assets.** `prepare-sprite.mjs` gained `--shrink <n>` (box-averaged in premultiplied alpha after keying at full size). Each set was cut with `--set <species> --shrink 2`: sprout 478 × 465, river 749 × 324, glider 761 × 338 px, six expressions each from one shared box, 220–260 KB a file (4.3 MB for the eighteen in the repository), 4.4–5.1 MB a species as RGBA textures. About 2 sprite px per logical unit at stage scale, which fixes the pilot's soft-source defect. The manifest rows (size, origin, bounds, rebuild arguments) are in [the illustrated README](../../src/art/creatures/illustrated/README.md#the-pilot-three-rw02b-step-2-2026-10-19).

**Rigs.** `IllustratedCreature` (`src/art/creatures/illustrated.ts`) holds what the three share: the mesh, the vertex loop, the texture swap and the loader; each species keeps its `*_ART` table (face, slots, the pinned body polygon, moving parts with root and tip, slot widths, misfits with reasons, per the [anchor list](art-requests/GAME-FIT.md#anchor-points-a-rigging-session-records)) and its weights. Measured in Node (dev, not an iPad):

| | Sprout | River | Glider |
| --- | --- | --- | --- |
| Mesh | 24 × 24 (576 vertices) | 40 × 18 (720) | 40 × 18 (720) |
| Display objects | 6 (Graphics 15) | 6 (Graphics 49) | 5 (Graphics 81) |
| `update()` per frame | ≈9 µs (Graphics ≈0.2 µs) | ≈10 µs (Graphics ≈1 µs) | ≈19 µs (Graphics ≈1 µs) |
| Moving parts | leaves (sway, a spin on a touch), arms | back wave neck → hips, tail | wing (root → tip wave), two fins, two ribbons |
| Touch reaction | crouch, hop, squash (the craft) | rears about its hips | loop-the-loop |
| Touch circle on the stage | 109 units (0.95) | 120 units (0.8; the preview shows the river pair at 0.8 so both fit a landscape row) | 120 units (0.8) |

**Expressions** are whole textures: `surprised` for the first 0.22 s of a touch, then `happy`; `blink` when the base class blinks (calm or happy mood only, since the blink sprite carries the calm mouth); `sleepy` and `sad` as a set `mood`. The painted lids are gone. In the preview a tap on an illustrated card turns its mood calm → sleepy → sad.

**Crown and scarf.** The crown fits all three (sprout 120 units around the stem; river 80 between the ears; glider 40 on the head behind the ear, which no longer covers the ear tip). The scarf fits the sprout (180 units under the chin, drawn over the resting arms) and the river (80 at the collar); the glider declines it as before (`misfit.scarf`). Slots sit in creature units beside the scaled art, so accessory strokes keep their weight.

**Proof.** `npm run typecheck`; `npx vitest run src/art/creatures scripts/creature-art` (41 tests: the shared suite per species checks the recorded size, a transparent border, opaque eyes and six same-size expressions; the Graphics species' slots and misfits; face, nose, mouth, paws or belly pinned through idle and three taps while the tip travels and no painted pixel stretches past double; no vertex moving more than 12–14 px a frame; the texture swaps; the crown riding the reaction and settling; destroy freeing the geometry and not the textures; plus a weights test per species and the script's new shrink test); `test-results/rw02b-probe.mjs` at 1024 × 768 and 768 × 1024 (every stage creature reacts to a tap and a quick re-tap, the three moods cycle, scarf and crown toggle off and on with misfits honoured, cards and toggles fit without overlap, every creature inside the window, leaving to the chooser, no page errors; screenshots `rw02b-1024x768.png`, `rw02b-768x1024.png`); `npm run build` with no sprite or preview code in `dist/` or the precache.

**Remaining defects and limits:**
- **Not seen on a device.** Frame rate with six creatures, three of them meshes, and the 2× ink edge are in [device checks](../DEVICE-CHECKS.md).
- **Arms and the scarf.** The sprout's scarf is drawn over its resting arms, and its arms wag only a little (a larger wag stretches the belly painted under them). R25 ended missing (no `sprout-noarms` plate after three tries, [PR #662](https://github.com/rjdunlap/neo/pull/662)), so the small wag stays.
- **The river's head is pinned.** Fixed 2026-10-20: the head is now its own layer and turns ([River head layer](#river-head-layer-2026-10-20)).
- **Loop restart.** The glider's re-tap mid-reaction still restarts the loop with the small jump the Graphics glider has; the mesh itself never jumps (bounded by test).
- **No underside view** for the glider's wing, as before.
- **Card scale.** At 0.32–0.44 the illustrated cards read well on white; the glider's card still reads smallest (its portrait is R17's re-roll).
- **Portraits not kept.** `--set` writes them; RW05 adds them to the repository with the card paper.

## Wearables fit (2026-10-20)

Built 2026-10-20 ([PR #632](https://github.com/rjdunlap/neo/pull/632)): the nine wearables cut and dressed on the three pilot rigs; verdict, commands and sizes are in [the fit](../../src/art/creatures/wearables/README.md#the-fit-on-the-pilot-three). Angle misfits are queue row R19.

## Step 3 result (2026-10-20)

Built 2026-10-20 ([PR #633](https://github.com/rjdunlap/neo/pull/633)): Tote, Trill, Dapple, Bramble, Mossback and Lumen prepared and rigged on the pilot's mesh pattern; sizes, command and the reason for the separate folder are in [the sprite README](../../src/art/creatures/illustrated/README.md#the-second-wave-rw02b-step-3-2026-10-20).

- **Sprites.** 40 PNGs (about 12 MB) in `src/art/creatures/cast/`: six expressions per species from one shared box (all within the 4 px tolerance), plus `alt` stills for Tote, Bramble, Mossback and Lumen. Portraits were cut but not kept (RW10's collection book prepares them). The folder is outside `illustrated.ts`'s glob on purpose, so nothing ships: `npm run build` precaches 99 entries (9244 KiB) with no cast assets or preview code in `dist/`.
- **Shipped (RW14 slice 2, 2026-10-23).** The six ship as residents from WebP copies (`scripts/creature-art/to-webp.mjs`), 36 files, 920 KB; the PNGs stay for the pixel tests and the preview's `alt` stills, so this section's "nothing ships" and 99-entry precache figures describe 2026-10-20 only.
- **Rigs.** `src/art/creatures/cast.ts`: `CAST` ids, one smaller `*_ART` table per species (size, scale from CAST.md, centre, eyes, nose, mouth, pinned body, one to four moving parts, touch circle, slots, misfits), one `IllustratedCast` class on the shared base (24 x 24 mesh, whole-texture expression swap) with a whole-craft reaction each (Tote scuttle, Trill hop, Dapple creep, Bramble curl, Mossback plod, Lumen flutter). Tote and Lumen decline the scarf (no neck); all six wear the crown. No new species in the save, no route change; `Creature.species` is widened to `SpeciesId | CastId` as a type only.
- **Preview.** `/?cast` on the dev server only (`src/dev/cast-preview.ts`): the six at one scale, tap to poke, a mood button, a dress button, alt stills in the corners.
- **Checks.** Typecheck; `npx vitest run src/art/creatures scripts/creature-art` (7 files, 99 tests, including the shared `illustratedSuite` on all six with a new `twin: false` option, weight tests and the alt-file check); a preview probe at 1024 x 768 and 768 x 1024 (every creature reacts to a real tap, touch radius 115-153 units, mood and dress work, no page errors); `npm run build`.
- **Limits.** The scarf on side-on species reads as a band across the throat (the R19 angle question applies). Deformations are small bends because a single-layer picture has nothing painted under a moving part. Dapple's colour change, Bramble's curl and Tote's and Mossback's retracting appear only as the alt still, not as a swap under the mesh. Hit circles and slots were read by eye off a 25 px grid. Not measured or seen: frame rate with six meshes, an iPad, a child's reaction.

## River head layer (2026-10-20)

Built 2026-10-20 ([PR #663](https://github.com/rjdunlap/neo/pull/663)), the river half of the step 2 follow-up; the arm half does not apply because R25 ended missing, so the sprout keeps its small wag.

- **Plate.** `prepare-sprite.mjs` gained `PLATES` (`nohead`, `noarms`): a plate is cut in the set's shared expression box without the drift check. `--set river --shrink 2 --scale 0.45` re-cut the six expressions byte-identical and wrote `river-nohead.png` (749 x 324, 191 KB) from R24's `river-nohead-1.png`.
- **Rig.** The body mesh shows the plate in every mood. A second 24 x 14 mesh over the head box (sprite x 452-749, y 0-156) shows the expression and bends about the throat by a weight that is 0 along the cut and rises over 88 px behind the ear and 66 px up the throat. The turn is the idle look (about +-0.1 rad) plus 0.1 rad lift on a touch; cut vertices also carry the back wave so the seam never opens. Head and neck slots and items pinned inside the head box (crown, sunhat, sunglasses, beanie, scarf) ride the head layer. `illustrated.ts` gained optional hooks (`faceMesh`, `skin`, `carrier()`, `layers()`); the other species are unchanged.
- **Tests.** Plate size and head painted out inside the base outline within 4 px; head and face travel while cut vertices move only with the back wave (no frame step of 4 px or more); at the furthest look either way every plate pixel the head covers at rest stays covered (the first weights exposed 204 outline pixels behind the ear).
- **Limits.** A minor seam where the cut crosses the cream/caramel edge and the front-of-chest contour (not visible at 1.8x in the probe). Not seen on an iPad. RW05's CompanionRig ([#642](https://github.com/rjdunlap/neo/pull/642), open draft) should pin `part('head')` through `pin()` so it rides the head layer once both land.
