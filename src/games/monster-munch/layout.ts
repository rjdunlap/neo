import type { View } from '../../engine/view';
import { spread } from '../../engine/view';
import type { MunchMode } from './logic';

/** Roughly how wide and tall a monster is at scale 1 (feet on 0, 0). */
export const MONSTER_W = 300;
export const MONSTER_H = 320;

export interface Pt {
  x: number;
  y: number;
}

export interface MunchLayout {
  /** The wooden tray the foods rest on. */
  tray: { x: number; y: number; w: number; h: number };
  /** The monsters' scale, their feet's y, and the x of each seat (four for friends, whatever is called). */
  scale: number;
  baseline: number;
  monsterX: number[];
  /** Where each food rests. */
  snacks: Pt[];
  /** The ask's sign (a post under a board), the bell, the cave door and the answer pads' row. */
  sign: Pt;
  bell: Pt;
  cave: Pt;
  pads: Pt[];
  upright: boolean;
}

export interface MunchSeating {
  mode: MunchMode;
  /** Monsters at the table now. */
  monsters: number;
  snacks: number;
  pads: number;
  /** Big bites: one cookie at a time, in the middle of the tray. */
  lapFeed: boolean;
}

/** A food's tap area is a circle this wide in radius (big bites 80). */
export const FOOD_HIT = 55;
/** Foods per tray row held upright (the tray is 578 wide beside the guide). */
export const UPRIGHT_PER_ROW = 5;
const UPRIGHT_ROW = 112;

/** How many foods rest in a row, and in how many rows. */
export function trayRows(count: number, upright: boolean) {
  const rows = upright ? Math.max(1, Math.ceil(count / UPRIGHT_PER_ROW)) : count > 7 ? 2 : 1;
  return { rows, perRow: Math.max(1, Math.ceil(count / rows)) };
}

/**
 * The table. Sideways: the tray along the bottom, the monsters on it, the sign, bell and pads across the top. Held upright
 * (768 wide): the tray hangs up from the bottom edge beside the guide's corner in rows of five, the monsters stand on it
 * across the full width, and the sign, pads, bell and cave hang just above the monsters, so a tall phone's spare height is
 * sky at the top rather than a gap above her thumb. Clear of Home and `?` (top-left) and the guide (bottom-left).
 */
export function munchLayout(v: View, s: MunchSeating): MunchLayout {
  const friends = s.mode === 'friends';
  const n = s.monsters;
  const scale = friends ? 0.52 : n === 1 ? 0.95 : n === 2 ? 0.75 : 0.66;
  const upright = !!v.upright && v.h > v.w * 1.1;
  const { rows, perRow } = trayRows(s.snacks, upright);

  if (!upright) {
    const trayTop = v.h - (rows === 2 ? 235 : 165);
    const monsterX = friends
      ? spread(4, 245, v.w - 30, 200)
      : n === 1
        ? [v.w * 0.62]
        : spread(n, 230, v.w - 50, n === 2 ? 340 : 290);
    const snacks: Pt[] = [];
    for (let i = 0; i < s.snacks; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, s.snacks - row * perRow);
      snacks.push({
        x: s.lapFeed ? (160 + v.w - 30) / 2 : spread(inRow, 180, v.w - 50, 125)[i % perRow],
        y: rows === 2 ? trayTop + 62 + row * 100 : v.h - 90,
      });
    }
    const px = spread(s.pads, v.w / 2 - 230, v.w / 2 + 230, 160);
    return {
      tray: { x: 160, y: trayTop, w: v.w - 190, h: v.h - trayTop - 15 },
      scale,
      baseline: trayTop - 25,
      monsterX,
      snacks,
      sign: { x: Math.max(230, v.w * 0.26), y: Math.min(240, trayTop - 220) },
      bell: { x: v.w - 85, y: 110 },
      cave: { x: 155, y: trayTop - 170 },
      pads: px.map((x) => ({ x, y: 170 })),
      upright,
    };
  }

  const trayH = rows * UPRIGHT_ROW + 20;
  const trayTop = v.h - 15 - trayH;
  const baseline = trayTop - 25;
  const monsterX = friends
    ? spread(4, 20, v.w - 20, 200)
    : n === 1
      ? [v.w / 2]
      : spread(n, 20, v.w - 20, n === 2 ? 340 : 290);
  const snacks: Pt[] = [];
  for (let i = 0; i < s.snacks; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, s.snacks - row * perRow);
    snacks.push({
      x: s.lapFeed ? (160 + v.w - 30) / 2 : spread(inRow, 175, v.w - 35, 115)[i % perRow],
      y: trayTop + 10 + UPRIGHT_ROW / 2 + row * UPRIGHT_ROW,
    });
  }
  // The ask hangs just over the monsters (its post reaches 150 below its centre).
  const top = baseline - MONSTER_H * scale;
  const signY = top - 170;
  return {
    tray: { x: 160, y: trayTop, w: v.w - 190, h: trayH },
    scale,
    baseline,
    monsterX,
    snacks,
    sign: { x: v.w / 2, y: signY },
    bell: { x: v.w - 85, y: signY - 40 },
    cave: { x: v.w - 85, y: signY + 90 },
    pads: spread(s.pads, v.w / 2 - 225, v.w / 2 + 225, 150).map((x) => ({ x, y: signY })),
    upright,
  };
}
