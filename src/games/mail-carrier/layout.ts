import { spread, type View } from '../../engine/view';
import { clueNode, mapNode, sideColumns, type MailMode } from './logic';

/**
 * Where Mail Carrier puts things (chunk 31, docs/definitions/phone-portrait.md). Sideways everything sits where it always
 * has. Upright (the 768-wide area) both scenes hang up from the bottom edge and clear the guide's corner, so a tall
 * phone's spare height is sky at the top: the street's houses stand in a row (or in two rows of four for the odd-and-even
 * level) above the road with the letter over them; the woods' map takes the width, with the picture key (or the two
 * choice buttons) in one row beneath it.
 */
export interface Pt {
  x: number;
  y: number;
}

/** The lowest the guide's corner reaches up the screen, and the width it covers (see `uprightProblems`). */
const GUIDE_TOP = 170;

export interface StreetHouse extends Pt {
  scale: number;
  /** The tap circle's radius, in the house's own units (centred 60 above its feet). */
  hit: number;
}

export interface StreetLayout {
  upright: boolean;
  houses: StreetHouse[];
  envelope: Pt;
  /** The road band: its top edge and height (a curb line is drawn on top of a full-width road). */
  road: { top: number; h: number; curb: boolean };
  /** The cart's height, and the leftmost it stops (clear of the guide's corner). */
  cartY: number;
  cartMin: number;
}

/** Four houses per side, as many as the street has for the odd-and-even level; fewer where the width is short sideways. */
export function streetColumns(v: Pick<View, 'w' | 'upright'>, count: number): number {
  return v.upright ? count / 2 : sideColumns(v.w);
}

/** How many houses the street shows: the odd-and-even level's six at a narrow sideways width, otherwise its plan. */
export function streetHouses(v: Pick<View, 'w' | 'upright'>, planned: number, sides: boolean): number {
  return sides && !v.upright && sideColumns(v.w) === 3 ? 6 : planned;
}

export function streetLayout(
  v: Pick<View, 'w' | 'h' | 'upright'>,
  count: number,
  sides: boolean,
): StreetLayout {
  if (!v.upright) {
    const y = v.h - 150;
    if (sides) {
      const columns = count / 2;
      const houses = Array.from({ length: count }, (_, i) => ({
        x: 160 + ((v.w - 260) * (i % columns)) / (columns - 1),
        y: i < columns ? 380 : v.h - 130,
        scale: 0.8,
        hit: 110,
      }));
      return {
        upright: false,
        houses,
        envelope: { x: v.w / 2, y: 105 },
        road: { top: houses[0].y + 110, h: 54, curb: false },
        cartY: y + 140,
        cartMin: 210,
      };
    }
    return {
      upright: false,
      houses: spread(count, 160, v.w - 50, 178).map((x) => ({ x, y, scale: 1, hit: 110 })),
      envelope: { x: v.w / 2, y: 150 },
      road: { top: y + 40, h: v.h - (y + 40), curb: true },
      cartY: y + 140,
      cartMin: 210,
    };
  }
  // Upright: the lowest row's mailboxes (about 130 below the feet) stay above the guide's corner.
  const near = v.h - 310;
  if (sides) {
    const columns = count / 2;
    const pitch = Math.min(176, (v.w - 60) / columns);
    const x0 = (v.w - pitch * (columns - 1)) / 2;
    const far = near - 290;
    const houses = Array.from({ length: count }, (_, i) => ({
      x: x0 + (i % columns) * pitch,
      y: i < columns ? far : near,
      scale: 0.8,
      hit: Math.min(110, (pitch - 2) / 2 / 0.8),
    }));
    return {
      upright: true,
      houses,
      envelope: { x: v.w / 2, y: Math.max(130, far - 290) },
      road: { top: far + 110, h: 54, curb: false },
      cartY: near + 140,
      cartMin: 210,
    };
  }
  const scale = count >= 5 ? 0.9 : 1;
  const pitch = Math.min(178, (v.w - 60) / count);
  const x0 = (v.w - pitch * (count - 1)) / 2;
  return {
    upright: true,
    houses: Array.from({ length: count }, (_, i) => ({
      x: x0 + i * pitch,
      y: near,
      scale,
      hit: Math.min(110, (pitch - 2) / 2 / scale),
    })),
    envelope: { x: v.w / 2, y: Math.max(130, near - 420) },
    road: { top: near + 40, h: 150, curb: true },
    cartY: near + 140,
    cartMin: 210,
  };
}

export interface WoodsLayout {
  upright: boolean;
  /** The map's paper, in stage units. */
  rect: { x: number; y: number; w: number; h: number };
  /** The houses' scale on the map, and their tap circle's radius in their own units (null: the art's own bounds). */
  houseScale: number;
  houseHit: number | null;
  /** The post office's tap circle on the clue level (it speaks the clue), in the office's own units. */
  officeHit: { x: number; y: number; r: number };
  letters: Pt;
  stoneCount: Pt;
  go: Pt;
  /** The key card's rectangle, each row's center, the row's drawn scale, tap box and glow, in the row's own units. */
  key: {
    card: { x: number; y: number; w: number; h: number };
    rows: Pt[];
    scale: number;
    hit: { w: number; h: number };
    glow: { w: number; h: number };
  };
  /** The two route-choice buttons and the two compare buttons (they take the key's place while shown). */
  choices: Pt[];
  compare: Pt[];
}

export function woodsLayout(
  v: Pick<View, 'w' | 'h' | 'upright'>,
  mode: MailMode,
  keyRows: number,
): WoodsLayout {
  const keyMode = mode === 'key';
  if (!v.upright) {
    const keyW = 260;
    const x = 150;
    const y = 104;
    const w = v.w - keyW - 40 - x;
    const h = v.h - 24 - y;
    const kx = v.w - keyW / 2 - 20;
    const top = keyMode ? 220 : 250;
    const rowH = Math.min(100, (v.h - 30 - top) / keyRows);
    return {
      upright: false,
      rect: { x, y, w, h },
      houseScale: 1,
      houseHit: mode === 'clue' || keyMode ? 50 : null,
      officeHit: { x: -35, y: -40, r: 68 },
      letters: { x: kx, y: mode === 'compare' ? 108 : 118 },
      stoneCount: { x: kx, y: 204 },
      go: { x: x + w - 70, y: y + h - 70 },
      key: {
        card: { x: kx - keyW / 2, y: top - 30, w: keyW, h: rowH * keyRows + 40 },
        rows: Array.from({ length: keyRows }, (_, i) => ({ x: kx, y: top + rowH * (i + 0.5) - 10 })),
        scale: 1,
        hit: { w: 236, h: keyMode ? 100 : 90 },
        glow: { w: 236, h: 84 },
      },
      choices: [0, 1].map((i) => ({ x: kx, y: v.h * (i === 0 ? 0.62 : 0.81) })),
      compare: [0, 1].map((i) => ({ x: kx, y: 330 + i * 160 })),
    };
  }
  // Upright: one band of five key tiles (or the two buttons) above the guide's corner, the map above it with the letter
  // bag over the map, and the walk button beside the bag.
  const panelH = 130;
  const panelTop = v.h - GUIDE_TOP - 6 - panelH;
  const mapBottom = panelTop - 14;
  const mapY = Math.max(170, mapBottom - 760);
  const rect = { x: 130, y: mapY, w: v.w - 130 - 20, h: mapBottom - mapY };
  const lettersY = Math.max(100, mapY - 100);
  const cy = panelTop + panelH / 2;
  const pitch = Math.min(150, (v.w - 28) / keyRows);
  const x0 = v.w / 2 - (pitch * (keyRows - 1)) / 2;
  const small = rect.h < 640;
  return {
    upright: true,
    rect,
    houseScale: small ? 0.8 : 0.9,
    houseHit: 52 / (small ? 0.8 : 0.9),
    officeHit: { x: 0, y: -40, r: 50 },
    letters: { x: v.w / 2 + 30, y: lettersY },
    stoneCount: { x: v.w / 2 + 30, y: lettersY + 76 },
    go: { x: v.w - 80, y: lettersY },
    key: {
      card: { x: 14, y: panelTop, w: v.w - 28, h: panelH },
      rows: Array.from({ length: keyRows }, (_, i) => ({ x: x0 + i * pitch, y: cy })),
      scale: 0.7,
      hit: { w: 200, h: 150 },
      glow: { w: 200, h: 140 },
    },
    choices: [0, 1].map((i) => ({ x: v.w / 2 + (i ? 128 : -128), y: cy })),
    compare: [0, 1].map((i) => ({ x: v.w / 2 + (i ? 128 : -128), y: cy })),
  };
}

/** A map node in board coordinates, inside a margin so houses stay on the paper (the clue level's map is a square). */
export function nodePoint(
  rect: { w: number; h: number },
  mode: MailMode,
  mirrored: boolean,
  n: number,
  upright = false,
): Pt {
  const m = upright ? 50 : 70;
  const { w, h } = rect;
  if (mode === 'clue') {
    const node = clueNode(n, mirrored);
    const size = Math.min(w - 2 * m, h - 2 * m - 40);
    return { x: m + node.x * size, y: m + 40 + node.y * size };
  }
  const node = mapNode(n, mirrored);
  return { x: m + node.x * (w - 2 * m), y: m + 40 + node.y * (h - 2 * m - 40) };
}
