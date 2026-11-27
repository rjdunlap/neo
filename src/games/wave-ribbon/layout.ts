import type { View } from '../../engine/view';
import { L_RIBBON } from './logic';

/**
 * Where Wave Ribbon's pieces stand, as pure functions of the view so a test can check every level on every upright phone view
 * (chunk 31, docs/definitions/phone-portrait.md). Sideways the design area is 1,024 × 768; held upright it is 768 wide and the
 * ribbon bench sits under Home and the help button with the controls below.
 */
export interface Pt {
  x: number;
  y: number;
}

export interface WaveLayout {
  landscape: boolean;
  /** The ribbon's left end (the driver) and its rest line; the bench frame around the ribbon, the ruler and the flag. */
  ribbonX: number;
  restY: number;
  bench: { x: number; y: number; w: number; h: number };
  send: Pt;
  replay: Pt;
  step: Pt;
  help: Pt;
  check: Pt;
  done: Pt;
  small: Pt;
  tall: Pt;
  /** The small picture of the pulse she is asked about (level 2). */
  badge: Pt;
  /** The trace cards' centres, left to right, and their size. */
  cards: Pt[];
  card: { w: number; h: number };
}

/** `checking` adds the Check button (level 2) and spreads the buttons to fit. */
export function waveLayout(v: View, checking: boolean): WaveLayout {
  const landscape = v.w >= v.h;
  if (landscape) {
    const ox = (v.w - 1024) / 2,
      oy = Math.max(0, (v.h - 768) / 2);
    const bar = checking ? [240, 370, 500, 630, 760, 890] : [280, 420, 560, 700, 840];
    const [send, replay, step, help, ...rest] = bar.map((x) => ({ x: x + ox, y: 680 + oy }));
    const done = rest[rest.length - 1];
    return {
      landscape,
      ribbonX: 260 + ox,
      restY: 220 + oy,
      bench: { x: 170 + ox, y: 40 + oy, w: 790, h: 290 },
      send,
      replay,
      step,
      help,
      check: rest.length > 1 ? rest[0] : { x: 0, y: 0 },
      done,
      small: { x: 430 + ox, y: 400 + oy },
      tall: { x: 590 + ox, y: 400 + oy },
      badge: { x: 800 + ox, y: 400 + oy },
      cards: [270, 520, 770].map((x) => ({ x: x + ox, y: 540 + oy })),
      card: { w: 200, h: 120 },
    };
  }
  const ox = (v.w - 768) / 2;
  const r1 = v.h - 225,
    r2 = v.h - 100;
  const row2 = checking ? [250, 400, 550] : [300, 500];
  const pts = row2.map((x) => ({ x: x + ox, y: r2 }));
  return {
    landscape,
    ribbonX: 104 + ox,
    restY: 365,
    bench: { x: 34 + ox, y: 215, w: 700, h: 250 },
    send: { x: 255 + ox, y: r1 },
    replay: { x: 425 + ox, y: r1 },
    step: { x: 595 + ox, y: r1 },
    help: pts[0],
    check: checking ? pts[1] : { x: 0, y: 0 },
    done: pts[pts.length - 1],
    small: { x: 260 + ox, y: 545 },
    tall: { x: 508 + ox, y: 545 },
    badge: { x: 680 + ox, y: 545 },
    cards: [144, 384, 624].map((x) => ({ x: x + ox, y: 680 })),
    card: { w: 210, h: 120 },
  };
}

export const RIBBON_SPAN = L_RIBBON;
