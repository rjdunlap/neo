# Sprout’s porch: low-poly art pilot

Prototype branch: `codex/low-poly-pilot`, [PR #1714](https://github.com/rjdunlap/neo/pull/1714). Developer-requested art exploration, not a new game or a replacement for the approved illustrated cast.

Scope: reproducible Blender scene and original Sprout model, a self-contained Three.js development preview, tap reactions, portrait/landscape checks, and a rendered still. Expected files: `scripts/art/sprout-porch.py`, `src/dev/sprout-preview.ts`, `src/dev/sprout/`, `sprout-preview.html`, dependencies, and this packet/verification. No saves or game navigation changes.

Temporary preview removal: remove or absorb this entry when the low-poly art direction is adopted or rejected. Production remains the illustrated cast until that decision.

Reference: [Cozy Town creator’s description](https://www.reddit.com/r/ClaudeCode/comments/1wzxr59/claude_is_making_a_little_simulated_cozy_town_for/) confirms TypeScript/Three.js. The original Sprout design remains our model reference; no reference video assets are imported.

## First prototype

Preview: now the art lab's Live 3D view (see [the runtime comparison](#runtime-comparison-2026-11-16)); it does not boot App or touch profiles. Three.js is a development dependency. Removal/cutover remains the art-direction decision above.

[Review still](../../src/dev/sprout/porch.png) · [Editable Blender scene](../../src/dev/sprout/porch.blend) · [Rebuild instructions](../../src/dev/sprout/README.md).

The porch has a rounded Sprout, faceted foliage, warm timber, a planter and a striped ball. Say hello tilts the head and waves an arm; Roll the ball sends it toward Sprout and back. These are authored animation previews, not physical simulation or a new curriculum activity. Buttons are at least 100 CSS pixels tall. Direct model taps use primary-pointer touch-down with no held state. The browser owns no saves, scores, rewards or audio. Ordinary production speech/input contracts have not been ported to Three.js.

Animation uses named empty pivots; do not animate a scaled eye mesh. The loader checks all required controls and two eye pivots. Browser cleanup releases geometry, materials, shadow resources and the frame loop. Reduced-motion settings suppress idle breathing/head sway. The still uses Cycles; the browser uses one shadow-casting directional light, hemisphere fill and capped pixel ratio (1.5).

This proves an editable model/export and a small browser interaction. It does not establish phone frame rate, a production character rig, costume compatibility or a renderer migration. Next art pass can refine the leaf silhouette, face/mouth and portrait camera before expanding the cast. No automatic simulation, dialogue generation or time-based progression is included.

Verification command: see the runtime comparison below; screenshots go to `test-results/`.

## Runtime comparison (2026-11-16)

Developer-requested, on `claude/low-poly-art-research-2fd7e8`. The porch is now one page, the **art lab**, that draws it two ways from the same Blender scene with the same taps and the same motion (`src/dev/art-lab/motion.ts`):

- **Live 3D** (`?view=3d`, `artlab-3d.ts`): the first prototype, unchanged in look: Three.js draws `porch.glb` every frame.
- **Pre-rendered** (`?view=2d`, `artlab-2d.ts`): `scripts/art/sprout-porch-sprites.py` renders the porch once in Cycles from the browser's camera, plus Sprout's body, head, waving arm, closed eyes and the ball as separate stills with their pivots in a manifest. Pixi turns and slides those stills. Each part is rendered whole, lit by the scene but unhidden by its neighbours, which is what a flat illustration could not give the cut-out rig.

Open it at `art-lab/` on the deployed site (not linked from the game, and kept out of the offline precache), or locally with `npm run dev` at `/art-lab/`. A readout shows frames per second, the slowest frame of the last five seconds, time to ready, and the compressed bytes that view fetched (production build only). `?dpr=3` lifts the pixel-ratio cap of 1.5 on either view. On a phone that has the game installed, an older offline copy can answer `art-lab/` with the home page until the game has been opened and closed once; a private tab avoids that.

| Measured on the production build | Live 3D | Pre-rendered |
| --- | --- | --- |
| Art fetched | `porch.glb`, 673 KB as built (71 KB if the host compresses it; no mesh compression tried) | 81 KB: a 56 KB backdrop and five small stills |
| Code fetched, compressed | 155 KB of Three.js and the view | 9 KB of view code on top of the Pixi the game already loads |
| Drawn each frame | 103 meshes, 206 draw calls with the shadow pass, 45k triangles | 6 sprites and a drawn ball shadow |
| Lighting | One real-time sun and a sky fill | Cycles area lights, baked, including Sprout's shadow on the boards |
| Adding a pose or a camera angle | Free: move a pivot or the camera | A re-render (27 s for this set), and only in-plane motion between renders |

Frame rate is not in the table: headless Chrome uses software rendering, so only a real phone can answer it, and that is what the page is for.

**Limits of the pre-rendered view.** Parts turn in the picture plane only: the head tilt and arm wave read well because the camera faces them, but a head turn, a walk toward the camera or a costume seen from another side each need their own renders. The ball spins as a flat disc rather than rolling. A moving part's shadow on its neighbour is baked at rest.

Verification: `LAB_VIEW=3d` and `LAB_VIEW=2d` with `GAME_URL=http://localhost:4173 node scripts/sprout-preview-check.mjs` (preview running).

## Phone playtest follow-up (2026-11-16)

From the developer's phone: both views hold 60 fps with a 17 ms slowest frame, **Live 3D looks better**, Sprout's eyes are not liked, and Live 3D stopped working twice (how it stopped was not reported). So real-time 3D is fast enough on that phone for a scene this size, and the open questions are its reliability and the character's face.

**Reliability.** The cause is not known; nothing could be reproduced in headless Chrome. One defect was found by reading the code and fixed: leaving the page frees the renderer, so a page brought back by a back swipe was a dead canvas. It now reloads instead. The page also reports what happens next time, on the readout: a count of graphics-context losses (the browser taking the GPU away; both renderers restore themselves), any script error, and a note when the previous visit ended without the page closing normally, which is what a tab killed for memory looks like.

**Eyes.** `sprout-porch.py` now models three styles under the head, each with its own blink pivots, and Live 3D switches between them in place (`?eyes=Bead` opens on one): **Classic** (the original glossy ovals in a cream ring), **Bead** (small round beads set wider and lower) and **Soft** (flat ovals, no ring, one glint). The extra styles add 90 KB to the uncompressed model and stay out of the stills, so the pre-rendered view keeps Classic.
