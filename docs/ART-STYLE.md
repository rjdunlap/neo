# Art style: paper cut-out with a crayon outline

The developer chose this look on 2026-11-26 after an art test of twelve styles, to replace a mix that read as generated (flat code-drawn pieces, glossy generated creature stickers and painterly generated backdrops). One hand-made look everywhere: every piece is construction paper.

## The recipe

Every filled shape, in this order:

1. **Torn edge.** The outline is pushed in and out along its edge by two sine waves (9 and 17 per loop, measured by distance along the edge), seeded by the shape so it stays still. About 4.4 logical units on a big piece, less on smaller ones, so a circle still reads as a circle. Points are joined by quadratic curves through midpoints, so the edge is soft.
2. **Shadow.** Two offset copies in warm brown (`0x2d1e14`) at low alpha, as if the paper sits above what is under it. Never black, and never a live blur filter.
3. **Flat fill** in the swatch colour. No gradients: a sky or wall is one flat sheet (`gradientTexture` now returns that).
4. **Paper fibre** over the fill at 0.28 alpha (a 192-pixel tile of short light and brown strokes), and over the ground at 0.35.
5. **Crayon outline**: a 5.2-unit stroke in a darker shade of the shape's own colour (38% of the way to `0x1d1a22`, `crayon()` in `src/art/paper.ts`) at 0.9 alpha, then a thin second pass offset by (1.8, −1.4) at 0.45 alpha. Never one ink colour for every outline.

Hairlines (veins, ripples, stems, seaweed) stay plain round strokes. Text stays flat. The ground every scene sits on is oatmeal `0xece4d4` with fibre (`PAPER_BG`, laid by the app under every scene).

A small warm pickup on a busy or similar ground (Pond Conga's food) gets a soft dark pool under it, at 0.35 alpha, so it reads.

## How it is drawn

- **The paper pass** (`src/art/paperize.ts`) does most of the work. Once per frame, before drawing, it walks the stage for `Graphics` it has not seen and rewrites their instructions into paper: solid fills become paper pieces, and a stroke that outlined the same path is replaced by the crayon outline. So every game takes the look without being redrawn. It leaves flat: fills under 0.55 alpha (glows, shades, highlights), details under 13 units (eyes, pips, dots), textured or gradient fills, shapes with holes, open strokes, and rectangles at least 700 × 560 (backdrops, which get fibre only). Overlapping pieces in one fill (clouds, bushes) are outlined from underneath so no inner lines show.
- **Animated drawings stay flat.** A `Graphics` the game redraws three times within 30 frames is left flat until it settles, so a glow, trail or meter costs nothing extra per frame.
- **Keeping something flat:** `keepFlat(node)` (a drawing or a whole subtree), for a piece that must keep a crisp exact edge (a measured ruler, a traced letter, a graph).
- **Drawing paper on purpose:** `src/art/paper.ts` has `paperCircle`, `paperEllipse`, `paperRect`, `paperPoly`, `paperShape` (the named shapes), `paperLine` (a hairline with a small shadow) and `paperGround`. What they draw is marked so the pass does not redo it. The shared button and card `finish()` uses them.
- **The swatch book:** `/?paper` on the dev server shows every named shape in the learning colours, a pond strip and the chrome.

## Rules

- Keep the colours a child learns by name (`swatch.red`, `swatch.blue` and the rest) true to their names.
- No new motion or flashing comes with the style.
- Phone frame rate matters most: paper is built once per drawing, never per frame.
- Generated images (the creature cast, land backdrops) do not take the pass: they are being redrawn as paper, code-drawn by default (the developer can switch to images generated on their machine).
