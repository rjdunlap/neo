import { BACK, type Spot } from './friends-layout';
import { backdropFit, CORNER_RADIUS, GUIDE_CORNER, HOME_BUTTON, PAGE_ARROW_RADIUS, type Backdrop } from './home-layout';

/**
 * The Arcade's screen (docs/rework/ARCADE.md): Back, Home and the Topics button along the top; the spotlight window with
 * the chosen game's demonstration, its name and tags and a green Play button; and a grid of game cards a page at a time,
 * with the page arrows under it. Beside each other when the view is wide, the spotlight above the grid when it is tall.
 * Cards are 150 units, Topics 240 by 100, Play 120 and the arrows 120; the bottom-left guide corner stays clear.
 */
export const ARCADE_CARD = 150;
/** The Topics button: a pill with the chosen filter's picture and name. */
export const TOPICS = { w: 240, h: 100 };
export const ARCADE_PLAY_RADIUS = 60;
/** A card, its name (up to two lines) and its tag line under it. */
export const ARCADE_CELL_H = 236;
/** The least distance between two cards' centres across a row. */
const MIN_PITCH = 158;
const MAX_PITCH = 200;
/** The top row's bottom edge; everything below starts here. */
const TOP = 140;
/** Room under the window for the name and the tag line, beside the Play button. */
const CAPTION = 96;

export interface ArcadeLayout {
  backdrop: Backdrop;
  back: Spot;
  home: Spot;
  /** The Topics button's centre. */
  topics: Spot;
  /** The spotlight window's top-left corner and width (it is 4:3, like the demonstration it holds). */
  window: { x: number; y: number; w: number };
  /** The name and tags under the window: their top-left corner and the width they may wrap to. */
  caption: { x: number; y: number; w: number };
  play: Spot;
  /** Each card's centre, in reading order, for a full page. */
  cards: Spot[];
  cols: number;
  rows: number;
  prev: Spot;
  next: Spot;
}

/** Cards on one page at this view. */
export const arcadePerPage = (v: { w: number; h: number }) => {
  const l = arcadeLayout(v);
  return l.cols * l.rows;
};

export function arcadeLayout(v: { w: number; h: number }): ArcadeLayout {
  const wide = v.w >= v.h;
  const topics = { x: HOME_BUTTON.x + CORNER_RADIUS + 24 + TOPICS.w / 2, y: BACK.y };
  const arrowRoom = PAGE_ARROW_RADIUS * 2 + 24;
  let window: ArcadeLayout['window'];
  let grid: { x0: number; x1: number; y0: number; y1: number };
  if (wide) {
    // The window is as large as the height allows under the top row, with its caption above the guide corner.
    const maxH = v.h - GUIDE_CORNER.h - CAPTION - TOP - 8;
    const w = Math.round(Math.min(v.w * 0.46, (maxH * 4) / 3, 640));
    window = { x: 40, y: TOP, w };
    grid = { x0: 40 + w + 36, x1: v.w - 24, y0: TOP, y1: v.h - arrowRoom };
  } else {
    const w = Math.round(Math.min(v.w - 160, 600));
    window = { x: Math.round((v.w - w) / 2), y: TOP, w };
    const top = TOP + (w * 3) / 4 + 16 + ARCADE_PLAY_RADIUS * 2 + 20;
    // The grid keeps to the middle so its lowest row stays right of the guide corner.
    grid = { x0: GUIDE_CORNER.w + 16, x1: v.w - GUIDE_CORNER.w - 16, y0: top, y1: v.h - arrowRoom };
  }
  const winH = (window.w * 3) / 4;
  const play = { x: window.x + window.w - ARCADE_PLAY_RADIUS, y: window.y + winH + 16 + ARCADE_PLAY_RADIUS };
  const caption = { x: window.x, y: window.y + winH + 12, w: window.w - ARCADE_PLAY_RADIUS * 2 - 16 };
  const gw = grid.x1 - grid.x0;
  const cols = Math.max(2, Math.floor(gw / MIN_PITCH));
  const pitch = Math.min(MAX_PITCH, gw / cols);
  const rows = Math.max(1, Math.floor((grid.y1 - grid.y0) / ARCADE_CELL_H));
  const left = grid.x0 + (gw - pitch * cols) / 2 + pitch / 2;
  const cards: Spot[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cards.push({ x: Math.round(left + c * pitch), y: Math.round(grid.y0 + ARCADE_CARD / 2 + r * ARCADE_CELL_H) });
  const mid = grid.x0 + gw / 2;
  const arrowY = grid.y0 + rows * ARCADE_CELL_H + PAGE_ARROW_RADIUS - 8;
  return {
    backdrop: backdropFit(v),
    back: { x: BACK.x, y: BACK.y },
    home: { ...HOME_BUTTON },
    topics,
    window,
    caption,
    play,
    cards,
    cols,
    rows,
    prev: { x: Math.round(mid - 140), y: Math.round(arrowY) },
    next: { x: Math.round(mid + 140), y: Math.round(arrowY) },
  };
}

/** The Topics sheet's tiles: 150-unit pictures with their names, a row's pitch apart. */
export const TOPIC_TILE = 150;
const TOPIC_PITCH = { x: 184, y: 200 };

/**
 * The Topics sheet (docs/rework/ARCADE.md#design): `n` picture tiles in rows under the top bar, kept right of the guide
 * corner's column so the lowest row never sits under the guide, and as many to a row as fit.
 */
export function topicsLayout(v: { w: number; h: number }, n: number): Spot[] {
  const x0 = GUIDE_CORNER.w + 20;
  const x1 = v.w - 40;
  const cols = Math.max(1, Math.min(n, Math.floor((x1 - x0) / TOPIC_PITCH.x)));
  const top = TOP + 8 + TOPIC_TILE / 2;
  const spots: Spot[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, n - r * cols);
    const left = (x0 + x1) / 2 - ((inRow - 1) * TOPIC_PITCH.x) / 2;
    spots.push({ x: Math.round(left + (i % cols) * TOPIC_PITCH.x), y: Math.round(top + r * TOPIC_PITCH.y) });
  }
  return spots;
}
