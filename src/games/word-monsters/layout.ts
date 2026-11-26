import { spread, type View } from '../../engine/view';
import type { MonsterPlan } from './logic';

/**
 * Where Word Monsters puts things, as pure functions of the view and the level's plan, so the sideways layout and the
 * upright phone's (chunk 31, docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`). Sideways, the
 * picture and boxes sit in the upper third and the loose monsters stand in one row along the bottom (five wrap to two
 * rows only when narrow). On the upright 768-wide area four monsters stand two by two and five as three over two, the
 * rows are lifted clear of the guide's corner, and the picture and boxes sit just above them, so the whole word is built
 * in the lower half of a tall screen where a thumb reaches.
 */

export interface Spot {
  x: number;
  y: number;
}

type V = Pick<View, 'w' | 'h'>;
type Plan = Pick<MonsterPlan, 'mode' | 'choices' | 'rounds'>;

/** A monster's round body. */
export const BODY_R = 62;
/** A loose monster's touch circle. */
export const HIT_R = BODY_R + 24;
/** Level 13: a team monster's body is this much wider on each side, two tummies' worth. */
export const TEAM_STRETCH = 30;
/** A team's touch ellipse, half its width: it hugs the wide body so it never reaches over a neighbor's. */
export const TEAM_HIT_RX = BODY_R + 10 + TEAM_STRETCH;
/** Boxes are this far apart and this big. */
export const SLOT_GAP = 150;
export const SLOT_SIZE = 132;
/** The boxes' middle, below the top anchor. */
export const SLOT_DY = 106;
/** Two rows of loose monsters are this far apart; odd and even monsters stand a little lower and higher. */
export const ROW_GAP = 205;
export const JITTER = [-10, 18] as const;
/** Level 12's "read the word" button: its radius, and its place from the top anchor. */
export const READ_R = 52;
export const READ_AT: Spot = { x: 306, y: SLOT_DY };
/** Level 9's kept pictures, small along the top. */
export const SHELF_SCALE = 0.3;

/** The upright phone's 768-wide area (a sideways view is never under 1024 wide). */
export const narrow = (v: V) => v.w < 1020;

/** How many loose monsters stand in each row, top row first. */
export function rowSizes(v: V, choices: number): number[] {
  if (!narrow(v)) return [choices];
  // Sideways, five never fit one narrow row; upright, four full-size monsters do not fit one row either.
  if (choices >= 5) return [3, choices - 3];
  if (choices === 4) return [2, 2];
  return [choices];
}

/** The bottom row's middle. Upright it is lifted clear of the guide's corner, a little more on a taller phone. */
function bottomRow(v: V): number {
  return narrow(v) ? v.h - 290 - Math.max(0, v.h - 1206) * 0.15 : v.h - 130;
}

/** The anchor the picture, the boxes and the read button hang from. */
export function topSpot(v: V, plan: Plan): Spot {
  if (!narrow(v)) return { x: v.w / 2, y: v.h * 0.3 };
  const rows = rowSizes(v, plan.choices).length;
  return { x: v.w / 2, y: bottomRow(v) - (rows - 1) * ROW_GAP - 380 };
}

/** Box `i` of `count`, sideways from the top anchor. */
export const slotX = (i: number, count: number) => (i - (count - 1) / 2) * SLOT_GAP;

/** Box `i`'s middle, in stage units. */
export function slotSpot(v: V, plan: Plan, i: number, count: number): Spot {
  const top = topSpot(v, plan);
  return { x: top.x + slotX(i, count), y: top.y + SLOT_DY };
}

/**
 * Where `n` loose monsters stand (all of them at the start of a question; fewer when the screen turns mid-word). `count`
 * is the word's boxes, which level 12 keeps its row near.
 */
export function looseSpots(v: V, plan: Plan, n: number, count = 3): Spot[] {
  const sizes = rowSizes(v, plan.choices);
  const five = plan.choices === 5;
  const base =
    plan.mode === 'repair' && !narrow(v)
      ? Math.min(v.h - 130, slotSpot(v, plan, 0, count).y + 375)
      : bottomRow(v);
  const out: Spot[] = [];
  let left = n;
  sizes.forEach((size, j) => {
    const m = Math.min(left, size);
    left -= m;
    const xs = narrow(v)
      ? sizes.length > 1 && !five
        ? spread(m, 0, v.w, 260)
        : spread(m, 0, v.w, 220)
      : spread(m, five ? 140 : 150, v.w - (five ? 20 : 40), 190);
    for (let i = 0; i < m; i++)
      out.push({ x: xs[i], y: base - (sizes.length - 1 - j) * ROW_GAP + JITTER[i % 2] });
  });
  return out;
}

/** Level 9: where the big monster stands. */
export const bigSpot = (v: V): Spot => ({ x: v.w / 2, y: v.h * 0.62 });

/** Level 9: where the `i`th of `rounds` kept pictures sits along the top, clear of the corners. */
export function shelfSpot(v: V, rounds: number, i: number): Spot {
  const xs = spread(rounds, 150, v.w - 150, 110);
  return { x: xs[i], y: Math.max(90, v.h * 0.14) };
}

/** Level 9: a kept picture's scale, smaller when the shelf is narrow so six never overlap (a picture is about 220 wide). */
export function shelfScale(v: V, rounds: number): number {
  const xs = spread(rounds, 150, v.w - 150, 110);
  return Math.min(SHELF_SCALE, ((xs[1] ?? 0) - xs[0] || 110) / 260);
}

/** A word's picture above the boxes, and level 10's larger one with no boxes under it: scale and place from the top anchor. */
export const BUILD_PICTURE = { scale: 0.5, y: -110 } as const;
export const LAST_PICTURE = { scale: 0.9, y: -10 } as const;
/** A tappable picture's generous square, before its scale. */
export const PICTURE_HIT = 240;
/** Level 12: a monster standing in a box is tapped inside this, so neighbors 150 apart never share a touch. */
export const FIXED_HIT = { w: 148, h: 164 } as const;
/** Levels 11 and 13: the tap area over the row of boxes reaches this far past the boxes' middles, and is this tall. */
export const SLOT_ROW_HIT = { pad: 80, h: 160 } as const;
/** A drop this far above or below the boxes' middle still tries the next box. */
export const DROP_REACH = 140;

/** Level 16: a picture card is this big a square (a tap anywhere on it counts) and its picture is drawn this scale. */
export const CARD = { size: 176, scale: 0.55 } as const;

/** Level 16: where its three picture cards stand, in the loose monsters' places (a row; lifted clear of the guide upright). */
export const cardSpots = (v: V, plan: Plan): Spot[] => looseSpots(v, plan, plan.choices);
