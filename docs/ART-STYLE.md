# Art style: paper cut-out with a crayon outline

The developer chose this look on 2026-11-26 after an art test of twelve styles, to replace a mix that read as generated (flat code-drawn pieces, glossy generated creature stickers and painterly generated backdrops). One hand-made look everywhere: every piece is construction paper.

## The recipe

Every filled shape, in this order:

1. **Torn edge.** The outline is pushed in and out along its edge by two sine waves (9 and 17 per loop, measured by distance along the edge), seeded by the shape so it stays still. About 4.4 logical units on a big piece, less on smaller ones (so a circle still reads as a circle) and on thin ones (so a bar to measure keeps its length). Points are joined by quadratic curves through midpoints, so the edge is soft.
2. **Shadow.** One offset copy in warm brown (`0x2d1e14`) at low alpha (one sheet, so a phone paints one layer for it), as if the paper sits above what is under it. Never black, and never a live blur filter.
3. **Flat fill** in the swatch colour. No gradients: a sky or wall is one flat sheet (`gradientTexture` now returns that).
4. **Paper fibre** over the fill at 0.28 alpha (a 192-pixel tile of short light and brown strokes), and over the ground at 0.35.
5. **Crayon outline**: a 5.2-unit stroke in a darker shade of the shape's own colour (38% of the way to `0x1d1a22`, `crayon()` in `src/art/paper.ts`) at 0.9 alpha, then a thin second pass offset by (1.8, −1.4) at 0.45 alpha. Never one ink colour for every outline.

Hairlines (veins, ripples, stems, seaweed) stay plain round strokes. Text stays flat. The ground every scene sits on is oatmeal `0xece4d4` with fibre (`PAPER_BG`, laid by the app under every scene).

A small warm pickup on a busy or similar ground (Pond Conga's food) gets a soft dark pool under it, at 0.35 alpha, so it reads.

## How it is drawn

- **The paper pass** (`src/art/paperize.ts`) does most of the work. Once per frame, before drawing, it walks the stage for `Graphics` it has not seen and rewrites their instructions into paper: solid fills become paper pieces, and a stroke that outlined the same path is replaced by the crayon outline. So every game takes the look without being redrawn. It leaves flat: fills under 0.65 alpha (glows, shades, highlights), details under 13 units (eyes, pips, dots), textured or gradient fills, shapes with holes, open strokes, and rectangles at least 700 × 560 (backdrops, which get fibre only). Overlapping pieces in one fill (clouds, bushes) are outlined from underneath so no inner lines show.
- **Animated drawings stay flat.** A `Graphics` the game redraws three times within 30 frames is left flat until it settles, so a glow, trail or meter costs nothing extra per frame.
- **Baking still drawings:** `bakePaper(node, view)` (in `paperize.ts`) turns a drawing that only changes on resize into paper at once and keeps it as one cached picture at the screen's sharpness, so a phone paints one layer for it instead of each piece's shadow, fill, fibre and outline. Home's backdrop, every place's scenery and the shared `Backdrop` hills are baked. Never bake something that moves or redraws often.
- **Comparing speed:** `?nopaper` in the address turns the look off (flat drawings, no pass, no baking), to compare the frame rate on a phone. On the dev server `window.__paperStats` counts the pass's rewrites and time.
- **Keeping something flat:** `keepFlat(node)` (a drawing or a whole subtree), for a piece that must keep a crisp exact edge (a measured ruler, a traced letter, a graph).
- **Drawing paper on purpose:** `src/art/paper.ts` has `paperCircle`, `paperEllipse`, `paperRect`, `paperPoly`, `paperShape` (the named shapes), `paperLine` (a hairline with a small shadow) and `paperGround`. What they draw is marked so the pass does not redo it. The shared button and card `finish()` uses them.
- **The swatch book:** `/?paper` on the dev server shows every named shape in the learning colours, a pond strip and the chrome, plus one creature's six moods (`&lab=<species>`, or `&lab=egg` for the egg's three stages).
- **Creatures** are drawn in code too, as paper cut-outs on a canvas (`src/art/creatures/paper/`). Each species is one file named after it whose default export draws its six moods (base, blink, happy, surprised, sleepy, sad) with the helpers in `canvas.ts`. The drawing lays every part on the points of the species' painted-art table (`SPROUT_ART`, `CAST_ART` and the rest), at the same size, so the rigs bend, blink, recolour and dress them exactly as before. A species with no file keeps its painted set; `?paintedpets` brings every painted set back to compare.
- **The egg and the collection cards** are drawn in code in the paper look (`paperEgg` in `src/creatures/companion.ts`; a card shows the paper creature, still, on a paper card), so the painted portraits, card paper and egg pictures are not loaded.
- **Plain-HTML screens:** couch play's menus and pages, and the cards on "Who's playing?", are HTML, not Pixi, so `PaperSkin` (`src/ui/paper-dom.ts`) dresses them: every button, card and panel it is given gets the same recipe drawn once on a 2D canvas at its size (torn edge, one warm shadow sheet, flat fill with fibre, double crayon outline in a darker shade of its own colour) as its background picture, in the colour the stylesheet gives it (or `--paper`, which is never inherited). A change of size, class or colour repaints it; nothing is redrawn per frame. The page sits on the oatmeal ground with fibre (`paperGroundUrl()`), and the game pictures on couch cards are run through the paper pass before they are drawn into their canvas. `?nopaper` leaves these flat too.
- **Home and places:** home's backdrop is code-drawn (`src/art/home/paper-home.ts`, in the painted picture's 1536 × 1024 frame). The painted place pictures are switched off (`PAINTED_LOCATIONS` in `src/art/locations/index.ts`), so every place shows its code-drawn scenery, which the pass turns to paper.

## Rules

- Keep the colours a child learns by name (`swatch.red`, `swatch.blue` and the rest) true to their names.
- No new motion or flashing comes with the style.
- Phone frame rate matters most: paper is built once per drawing, never per frame, and still drawings are baked. The paper pieces' layers are the main cost (overdraw), so keep new layers out of the recipe.
- Images do not take the pass. Everything a child sees is drawn in code; the generated creature, portrait, egg and place pictures stay in the repository only for `?paintedpets` and as a fallback. The developer can switch to paper-styled images generated on their machine later.
