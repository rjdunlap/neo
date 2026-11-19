import type { View } from '../../engine/view';

/**
 * Where Circuit Garden's pieces stand, as pure functions of the view so a test can check every level on every upright
 * phone view (chunk 31, docs/definitions/phone-portrait.md). Sideways (1,024 wide) the numbers are the ones the scene always
 * used; held upright (768 wide) the board runs down the screen and, on a tall phone, stretches to meet the tray.
 */
export interface Pt {
  x: number;
  y: number;
}

/** Half a bridge's length along its route, in logical units. */
export const HALF = 55;

/** Held upright the board's lamp end: 545 on a 768 × 1,024 view, lower on a taller one so the board fills the space above the tray. */
export function boardBottom(v: Pick<View, 'h'>): number {
  return Math.max(545, Math.min(v.h - 530, 1000));
}

export interface Layout {
  landscape: boolean;
  /** A point on the board: `u` runs battery (0) to lamp (1), `v` across from the supply side (-1) to the return side (+1). */
  map(u: number, v: number): Pt;
  /** Bridge half-length in `u`, and the battery/lamp terminal offset in `v`. */
  du: number;
  dv: number;
  tray: Pt[];
  undo: Pt;
  back: Pt;
  help: Pt;
  check: Pt;
  done: Pt;
}

/** `pieces` loose connectors (one at level 1, two at 3); `checking` puts a Check button between Help and Done. */
export function layoutFor(v: View, mirror: boolean, pieces: number, checking: boolean): Layout {
  const landscape = v.w >= v.h;
  const flip = (u: number) => (mirror ? 1 - u : u);
  if (landscape) {
    const sx = v.w / 1024;
    const x0 = 260 * sx,
      x1 = 850 * sx,
      cy = Math.max(325, (v.h - 768) / 2 + 325);
    const bottom = v.h;
    return {
      landscape,
      map: (u, w) => ({ x: x0 + (x1 - x0) * flip(u), y: cy + w * 85 }),
      du: HALF / (x1 - x0),
      dv: 64 / 85,
      tray: (pieces > 1 ? [345, 540] : [380]).map((x) => ({ x: x * sx, y: bottom - 198 })),
      undo: { x: 720 * sx, y: bottom - 198 },
      back: { x: 860 * sx, y: bottom - 198 },
      ...(checking
        ? {
            help: { x: 420 * sx, y: bottom - 68 },
            check: { x: 620 * sx, y: bottom - 68 },
            done: { x: 820 * sx, y: bottom - 68 },
          }
        : {
            help: { x: 520 * sx, y: bottom - 68 },
            check: { x: 640 * sx, y: bottom - 68 },
            done: { x: 760 * sx, y: bottom - 68 },
          }),
    };
  }
  const sx = v.w / 768;
  const y0 = 235,
    y1 = boardBottom(v),
    cx = 445 * sx;
  return {
    landscape,
    map: (u, w) => ({ x: cx + w * 160 * sx, y: y0 + (y1 - y0) * flip(u) }),
    du: HALF / (y1 - y0),
    dv: 64 / (160 * sx),
    tray: (pieces > 1 ? [300, 470] : [300]).map((x) => ({ x: x * sx, y: v.h - 364 })),
    undo: { x: 300 * sx, y: v.h - 224 },
    back: { x: 470 * sx, y: v.h - 224 },
    ...(checking
      ? {
          help: { x: Math.max(250 * sx, 220), y: v.h - 84 },
          check: { x: 420 * sx, y: v.h - 84 },
          done: { x: 600 * sx, y: v.h - 84 },
        }
      : {
          help: { x: 300 * sx, y: v.h - 84 },
          check: { x: 430 * sx, y: v.h - 84 },
          done: { x: 560 * sx, y: v.h - 84 },
        }),
  };
}
