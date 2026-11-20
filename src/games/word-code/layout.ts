import type { View } from '../../engine/view';
import type { WordPlan } from './logic';

export interface Spot {
  x: number;
  y: number;
}

export interface Key extends Spot {
  /** The letter, or 'back' / 'enter'. */
  ch: string;
}

export interface WordLayout {
  upright: boolean;
  /** A try tile's edge and the step between tiles and rows. */
  tile: number;
  pitch: number;
  /** The center line of the tries and the current row's y. */
  cx: number;
  entryY: number;
  /** How many past tries fit above the current row. */
  rows: number;
  /** School's picture cards (box: `card`), and the letter tray's spots for up to 12 letters. */
  pics: Spot[];
  card: { w: number; h: number };
  tray: Spot[];
  trayTile: number;
  /** Grown-up's keyboard: 26 letters, back and enter in seven columns by four rows. */
  keys: Key[];
  keyBox: { w: number; h: number };
  back: Spot;
  check: Spot;
  hint: Spot;
}

const KEYS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'back', 'enter'];

/**
 * Where Word Code puts things, pure so a test can read it at every level and view (docs/definitions/word-code.md#layout-bands-and-upright).
 * School: the picture row on top, the tries below it, the tray at the foot (upright) or on the right (sideways), with the
 * round buttons in a column beside the tray or above it. Grown-up: the keyboard hung from the bottom edge, 176 up on an
 * upright phone so the guide's corner is clear, and the tries above it.
 */
export function wordLayout(
  v: Pick<View, 'w' | 'h' | 'upright'>,
  plan: Pick<WordPlan, 'picture' | 'letters'>,
): WordLayout {
  const upright = !!v.upright;
  const n = plan.letters;
  if (plan.picture) {
    const tile = 100;
    const pitch = 108;
    const trayPitch = upright ? 108 : 106;
    const cx = upright ? v.w / 2 : 372;
    const picY = upright ? 215 : 190;
    const pics = [0, 1, 2, 3].map((i) => ({ x: cx + (i - 1.5) * 118, y: picY }));
    const trayBottom = v.h - 60;
    const trayX = (c: number) => (upright ? v.w / 2 + (c - 1.5) * trayPitch : v.w - 70 - (3 - c) * trayPitch);
    const tray = Array.from({ length: 12 }, (_, i) => ({
      x: trayX(i % 4),
      y: trayBottom - (2 - Math.floor(i / 4)) * trayPitch,
    }));
    const trayTop = tray[0].y - 50;
    const entryY = upright ? trayTop - 70 : v.h - 70;
    const picBottom = picY + 65;
    const rows = Math.max(1, Math.floor((entryY - 50 - (picBottom + 16 - 50) - 50) / pitch));
    const buttons: Spot[] = upright
      ? [
          { x: v.w - 76, y: v.h - 60 },
          { x: v.w - 76, y: v.h - 176 },
          { x: v.w - 76, y: v.h - 292 },
        ]
      : [
          { x: 700, y: 330 },
          { x: 830, y: 330 },
          { x: 960, y: 330 },
        ];
    return {
      upright,
      tile,
      pitch,
      cx,
      entryY,
      rows,
      pics,
      card: { w: 100, h: 130 },
      tray,
      trayTile: 100,
      keys: [],
      keyBox: { w: 0, h: 0 },
      back: buttons[0],
      check: buttons[1],
      hint: buttons[2],
    };
  }
  const tile = 88;
  const pitch = 96;
  const cx = v.w / 2;
  const keyBottom = upright ? v.h - 176 : v.h - 16;
  const keyW = 96;
  const keyH = 88;
  const keyTop = keyBottom - 4 * 92 + 4;
  const keys: Key[] = KEYS.map((ch, i) => ({
    ch,
    x: cx + ((i % 7) - 3) * 100,
    y: keyTop + keyH / 2 + Math.floor(i / 7) * 92,
  }));
  const entryY = keyTop - 20 - tile / 2;
  const top = upright ? 50 : 40;
  const rows = Math.max(1, Math.floor((entryY - top - tile / 2) / pitch));
  const hint = upright ? { x: v.w - 68, y: entryY } : { x: cx + (n - 1) * 48 + 130, y: entryY };
  return {
    upright,
    tile,
    pitch,
    cx,
    entryY,
    rows,
    pics: [],
    card: { w: 0, h: 0 },
    tray: [],
    trayTile: 0,
    keys,
    keyBox: { w: keyW, h: keyH },
    back: hint,
    check: hint,
    hint,
  };
}
