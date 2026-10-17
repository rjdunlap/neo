# RW02b: Generated creature art and animation pilot

**Status:** ready for one bounded implementation session. Defined 2026-10-17 as a follow-up to [RW02 / PR #499](https://github.com/rjdunlap/neo/pull/499), before production art is consumed by RW05. [Work-item index](WORK-ITEMS.md#rw02b-generated-creature-art-and-animation-pilot).

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
