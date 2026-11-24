/**
 * Where Rhythm Neighbors puts things, as a pure function of the view, so the sideways screen and the upright phone's (chunk
 * 31, docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`). Sideways (and an upright tablet, which is
 * not an upright phone) keeps its pond with the bird on the left and the buttons along the top. Held upright the frogs
 * sit low, in a thumb's reach, with the three round buttons in a row under them, right of the guide; the bird (or the big
 * tree of levels 7 and 9), then the row of pictured notes, stand above.
 */
export interface Pt {
  x: number;
  y: number;
}

/** A button's radius (the buttons are 100 across). */
export const BUTTON_RADIUS = 50;
/** A frog's tap radius, in its own units; the big frog of the tree levels is drawn 1.5 times as big. */
export const FROG_RADIUS = 100;
/** The big frog's scale on the tree levels. */
export const BIG_FROG = 1.5;
/** The bird's tap circle: radius, and how far above its standing point its center is. */
export const BIRD_RADIUS = 110;
export const BIRD_LIFT = 30;
/** The tree's tap box in its own units, left, top, width and height (the scene's hit area). */
export const TREE_BOX = { x: -215, y: -360, w: 430, h: 640 };

/** Level 10's two answer tiles are squares this wide (the tap target). */
export const TILE_SIZE = 120;

export interface Layout {
  upright: boolean;
  /** The bird's (or the tree's) standing point, and the tree's scale. */
  bird: Pt;
  treeScale: number;
  /** Each frog's center. */
  frogs: Pt[];
  /** The row of pictured notes: its height, and where the first and last note's centers may lie. */
  score: { y: number; x0: number; x1: number };
  replay: Pt;
  help: Pt;
  submit: Pt;
  /** Level 10's two tiles: the frog copied the bird, or the frog answered. */
  tiles: { copy: Pt; answer: Pt };
  /** The pond's ellipse. */
  pond: { x: number; y: number; rx: number; ry: number };
}

export function neighborsLayout(
  v: { w: number; h: number; upright?: true },
  o: { voices: number; tree: boolean },
): Layout {
  const cx = v.w / 2;
  const pond = (y: number) => ({ x: cx, y, rx: Math.min(400, v.w * 0.4), ry: 130 });
  if (!v.upright) {
    const frogs = Array.from({ length: o.voices }, (_, i) => ({
      x: cx + (o.voices === 1 ? 0 : i ? 160 : -160),
      y: v.h - 180,
    }));
    const s = Math.min(1, (v.h - 260) / 640);
    if (o.tree) frogs[0] = { x: v.w * 0.7, y: v.h - 190 };
    return {
      upright: false,
      bird: o.tree ? { x: v.w * 0.27, y: v.h / 2 + 50 } : { x: 155, y: 300 },
      treeScale: s,
      frogs,
      score: { y: 290, x0: 250, x1: v.w - 120 },
      replay: { x: 220, y: 65 },
      help: { x: 360, y: 65 },
      submit: { x: v.w - 80, y: 65 },
      tiles: { copy: { x: cx - 130, y: v.h - 350 }, answer: { x: cx + 130, y: v.h - 350 } },
      pond: pond(v.h - 160),
    };
  }
  // Upright: the frogs 330 up from the bottom edge, the buttons 95 up, clear of the guide in the bottom-left corner.
  const frogY = v.h - 330;
  const frogs = Array.from({ length: o.voices }, (_, i) => ({
    x: o.tree ? v.w - 193 : cx + (o.voices === 1 ? 0 : i ? 160 : -160),
    y: frogY,
  }));
  // The tree stands on the pond's edge and its crown stays under Home; the pictured notes sit between the bird and the frogs.
  const scoreY = frogY - 190;
  const s = Math.min(0.9, (frogY + 100 - 215) / 640);
  return {
    upright: true,
    bird: o.tree ? { x: 215, y: frogY + 100 - 280 * s } : { x: cx, y: scoreY - 150 },
    treeScale: s,
    frogs,
    score: { y: scoreY, x0: 100, x1: v.w - 100 },
    replay: { x: 250, y: v.h - 95 },
    help: { x: 400, y: v.h - 95 },
    submit: { x: v.w - 110, y: v.h - 95 },
    tiles: { copy: { x: cx - 100, y: scoreY + 17 }, answer: { x: cx + 100, y: scoreY + 17 } },
    pond: pond(frogY + 20),
  };
}
