import type { View } from '../../engine/view';

export interface Spot {
  x: number;
  y: number;
}
export interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TabletsLayout {
  upright: boolean;
  /** A sign's, a picture's or a card's edge: 100 on every view. */
  cell: number;
  /** Per crib word: its picture and its signs. */
  cribPic: Spot[];
  cribSigns: Spot[][];
  /** Per group: its signs and its candidate cards. */
  groups: { signs: Spot[]; cands: Spot[] }[];
  /** The key table: one cell per sign, display only, and a cell's edge. */
  keyCells: Spot[];
  keyCell: number;
  /** Read it, Show me, Undo, Restart. */
  buttons: Spot[];
  button: number;
  /** The first tablet and the new tablet behind everything. */
  panels: Panel[];
}

const CELL = 100;
const GAP = 10;

/**
 * Where Two Tablets puts things, pure so a test reads it at every view. Sideways: the first tablet across the top (a picture over each
 * word's signs), the new tablet under it (each group's signs over its three cards), the key strip, then the buttons in a row clear of
 * the guide. Upright: each crib word is a row (picture, two signs), two to a row; a group is a row (signs, then cards).
 */
export function tabletsLayout(
  v: Pick<View, 'w' | 'h' | 'upright'>,
  words: number,
  groups: number,
  signs = 8,
): TabletsLayout {
  const upright = !!v.upright;
  const keyCell = 84;
  const keyAt = (y: number, x0: number): Spot[] =>
    Array.from({ length: signs }, (_, i) => ({ x: x0 + i * (keyCell + 8), y }));
  const keyWidth = signs * keyCell + (signs - 1) * 8;
  if (upright) {
    const extra = Math.max(0, v.h - 1024);
    const wordW = 3 * CELL + 2 * GAP;
    const colGap = 24;
    const cols = Math.min(2, words);
    const x0 = (v.w - (cols * wordW + (cols - 1) * colGap)) / 2 + CELL / 2;
    const cribTop = 275 + extra * 0.15;
    const cribPic: Spot[] = [];
    const cribSigns: Spot[][] = [];
    for (let i = 0; i < words; i++) {
      const bx = x0 + (i % 2) * (wordW + colGap);
      const y = cribTop + Math.floor(i / 2) * (CELL + 20);
      cribPic.push({ x: bx, y });
      cribSigns.push([1, 2].map((k) => ({ x: bx + k * (CELL + GAP), y })));
    }
    const rowW = 2 * CELL + GAP + 30 + 3 * CELL + 2 * GAP;
    const gx = (v.w - rowW) / 2 + CELL / 2;
    const crib = cribTop + Math.floor((words - 1) / 2) * (CELL + 20);
    const gTop = crib + CELL + 95 + extra * 0.15;
    const grp = Array.from({ length: groups }, (_, g) => {
      const y = gTop + g * (CELL + 24);
      return {
        signs: [0, 1].map((k) => ({ x: gx + k * (CELL + GAP), y })),
        cands: [0, 1, 2].map((k) => ({ x: gx + 2 * CELL + GAP + 30 + k * (CELL + GAP), y })),
      };
    });
    const bY = v.h - 94;
    return {
      upright,
      cell: CELL,
      cribPic,
      cribSigns,
      groups: grp,
      keyCells: keyAt(bY - 130, (v.w - keyWidth) / 2 + keyCell / 2),
      keyCell,
      buttons: [0, 1, 2, 3].map((i) => ({ x: 215 + i * 112, y: bY })),
      button: CELL,
      panels: [
        { x: 30, y: cribTop - CELL / 2 - 14, w: v.w - 60, h: crib - cribTop + CELL + 28 },
        { x: 30, y: gTop - CELL / 2 - 14, w: v.w - 60, h: groups * (CELL + 24) + 4 },
      ],
    };
  }
  const wordW = 2 * CELL + GAP;
  const wordGap = 20;
  const total = words * wordW + (words - 1) * wordGap;
  const wx = (v.w - total) / 2;
  const cribPic: Spot[] = [];
  const cribSigns: Spot[][] = [];
  for (let i = 0; i < words; i++) {
    const left = wx + i * (wordW + wordGap);
    cribPic.push({ x: left + wordW / 2, y: 140 });
    cribSigns.push([0, 1].map((k) => ({ x: left + CELL / 2 + k * (CELL + GAP), y: 262 })));
  }
  const gw = 3 * CELL + 2 * GAP;
  const slot = groups > 1 ? gw + 70 : 0;
  const gx0 = v.w / 2 - ((groups - 1) * slot) / 2;
  const grp = Array.from({ length: groups }, (_, g) => {
    const cx = gx0 + g * slot;
    return {
      signs: [0, 1].map((k) => ({ x: cx - (CELL + GAP) / 2 + k * (CELL + GAP), y: 392 })),
      cands: [0, 1, 2].map((k) => ({ x: cx - gw / 2 + CELL / 2 + k * (CELL + GAP), y: 500 })),
    };
  });
  return {
    upright,
    cell: CELL,
    cribPic,
    cribSigns,
    groups: grp,
    keyCells: keyAt(608, (v.w - keyWidth) / 2 + keyCell / 2 + 40),
    keyCell,
    buttons: [0, 1, 2, 3].map((i) => ({ x: 380 + i * 130, y: 706 })),
    button: CELL,
    panels: [
      { x: 30, y: 82, w: v.w - 60, h: 240 },
      { x: 30, y: 334, w: v.w - 60, h: 226 },
    ],
  };
}
