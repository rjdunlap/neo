# Sprout’s porch: low-poly art pilot

Prototype branch: `codex/low-poly-pilot`, [PR #1714](https://github.com/rjdunlap/neo/pull/1714). Developer-requested art exploration, not a new game or a replacement for the approved illustrated cast.

Scope: reproducible Blender scene and original Sprout model, a self-contained Three.js development preview, tap reactions, portrait/landscape checks, and a rendered still. Expected files: `scripts/art/sprout-porch.py`, `src/dev/sprout-preview.ts`, `src/dev/sprout/`, `sprout-preview.html`, dependencies, and this packet/verification. No saves or game navigation changes.

Temporary preview removal: remove or absorb this entry when the low-poly art direction is adopted or rejected. Production remains the illustrated cast until that decision.

Reference: [Cozy Town creator’s description](https://www.reddit.com/r/ClaudeCode/comments/1wzxr59/claude_is_making_a_little_simulated_cozy_town_for/) confirms TypeScript/Three.js. The original Sprout design remains our model reference; no reference video assets are imported.

## First prototype

Development-only preview: run `npm ci`, then `npm run dev -- --port 5194 --strictPort`, and open `http://localhost:5194/sprout-preview.html`. It is deliberately excluded from production build inputs and does not boot App or touch profiles. Three.js is a development dependency. Removal/cutover remains the art-direction decision above.

[Review still](../../src/dev/sprout/porch.png) · [Editable Blender scene](../../src/dev/sprout/porch.blend) · [Rebuild instructions](../../src/dev/sprout/README.md).

The porch has a rounded Sprout, faceted foliage, warm timber, a planter and a striped ball. Say hello tilts the head and waves an arm; Roll the ball sends it toward Sprout and back. These are authored animation previews, not physical simulation or a new curriculum activity. Buttons are at least 100 CSS pixels tall. Direct model taps use primary-pointer touch-down with no held state. The browser owns no saves, scores, rewards or audio. Ordinary production speech/input contracts have not been ported to Three.js.

Animation uses named empty pivots; do not animate a scaled eye mesh. The loader checks all required controls and two eye pivots. Browser cleanup releases geometry, materials, shadow resources and the frame loop. Reduced-motion settings suppress idle breathing/head sway. The still uses Cycles; the browser uses one shadow-casting directional light, hemisphere fill and capped pixel ratio (1.5).

This proves an editable model/export and a small browser interaction. It does not establish phone frame rate, a production character rig, costume compatibility or a renderer migration. Next art pass can refine the leaf silhouette, face/mouth and portrait camera before expanding the cast. No automatic simulation, dialogue generation or time-based progression is included.

Verification command: `GAME_URL=http://localhost:5194 node scripts/sprout-preview-check.mjs` (server running); screenshots go to `test-results/`.
