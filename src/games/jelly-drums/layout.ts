/**
 * Where Jelly Drums puts things, as a pure function of the view, so the sideways stage and the upright phone's (chunk 31,
 * docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`). Sideways (and an upright tablet, which is
 * not an upright phone) keeps the wide stage: five jellies 178 apart at full size. Held upright on a phone the stage
 * is 740 wide, the jellies shrink a little and sit apart by their own tap areas, and the stage, the listen-again button and
 * the fans are all in the lower part of the screen, in a thumb's reach, with the sky and the garland above.
 */
export interface Pt {
  x: number;
  y: number;
}

/** Half-widths of the five jellies, biggest (lowest note) first; a jelly is 1.55 times as tall as it is wide-half. */
export const HALF_WIDTHS = [82, 75, 68, 61, 54];
/** A jelly's tap area reaches this far past its sides, and above its top, in its own units. */
export const HIT_PAD = 18;
/** The listen-again button's radius. */
export const AGAIN_RADIUS = 56;
/** Level 12's two answer buttons ("same" and "different") are this big, and sit this far either side of the listen-again button. */
export const CHOICE_RADIUS = 60;
export const CHOICE_APART_SIDEWAYS = 230;
export const CHOICE_APART_UPRIGHT = 170;
/** Held upright, the jellies are drawn at this scale of their sideways size. */
export const UPRIGHT_SCALE = 0.85;

export interface Layout {
  upright: boolean;
  /** The jellies' scale; the lone jelly of the wake level is drawn 1.8 times this. */
  scale: number;
  /** Each jelly's standing point, biggest first. */
  jellies: Pt[];
  /** The stage's plank: its left edge, width, and the top of the plank (the jellies stand a little below it). */
  stage: { x: number; w: number; top: number; skirt: number };
  again: Pt;
  /** Level 12: the "same" button (left) and the "different" button (right), level with the listen-again button. */
  choices: [Pt, Pt];
  garland: { x0: number; x1: number; y: number; sag: number };
  /** Where the fans stand: their feet. */
  fans: Pt[];
  /** The mountains' three peaks: x, y and half-width, and the line they stand on. */
  peaks: [number, number, number][];
  mountainBase: number;
}

/** A jelly's tap area as a box in view units, by its centre. */
export function jellyHit(l: Layout, i: number) {
  const hw = HALF_WIDTHS[i];
  const p = l.jellies[i];
  const w = (hw * 2 + HIT_PAD * 2) * l.scale;
  const h = (hw * 1.55 + 50) * l.scale;
  return { x: p.x, y: p.y + (-hw * 1.55 - 30) * l.scale + h / 2, w, h };
}

export function jellyLayout(v: { w: number; h: number; upright?: true }): Layout {
  const cx = v.w / 2;
  if (!v.upright) {
    const top = v.h * 0.74;
    return {
      upright: false,
      scale: 1,
      jellies: HALF_WIDTHS.map((_, i) => ({ x: cx + (i - 2) * 178, y: top + 10 })),
      stage: { x: cx - 470, w: 940, top, skirt: v.h * 0.12 },
      again: { x: cx, y: top - 250 },
      choices: [
        { x: cx - CHOICE_APART_SIDEWAYS, y: top - 250 },
        { x: cx + CHOICE_APART_SIDEWAYS, y: top - 250 },
      ],
      garland: { x0: cx - 400, x1: cx + 400, y: 70, sag: 80 },
      fans: [0, 1, 2, 3].map((i) => ({ x: cx + (i - 1.5) * 150, y: v.h - 6 })),
      peaks: [
        [cx - 420, top - 300, 330],
        [cx + 360, top - 330, 380],
        [cx - 60, top - 260, 420],
      ],
      mountainBase: top,
    };
  }
  const s = UPRIGHT_SCALE;
  // Side by side by their tap areas (a tap area is 2 × half-width + 36 wide), so no two share a touch.
  const wide = HALF_WIDTHS.map((hw) => (hw * 2 + HIT_PAD * 2) * s);
  const total = wide.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  // The jellies stand at the stage, whose plank is up from the bottom edge: the plank, then the button, then the fans.
  const top = v.h - 430;
  const jellies = wide.map((w) => {
    const p = { x: x + w / 2, y: top + 10 };
    x += w;
    return p;
  });
  return {
    upright: true,
    scale: s,
    jellies,
    stage: { x: cx - 370, w: 740, top, skirt: 110 },
    again: { x: cx, y: v.h - 200 },
    choices: [
      { x: cx - CHOICE_APART_UPRIGHT, y: v.h - 200 },
      { x: cx + CHOICE_APART_UPRIGHT, y: v.h - 200 },
    ],
    garland: { x0: cx - 250, x1: cx + 250, y: 150, sag: 70 },
    // Right of the guide in the bottom-left corner.
    fans: [0, 1, 2, 3].map((i) => ({ x: 235 + i * 145, y: v.h - 6 })),
    peaks: [
      [cx - 250, top - 300, 330],
      [cx + 240, top - 330, 380],
      [cx - 20, top - 260, 420],
    ],
    mountainBase: top,
  };
}
