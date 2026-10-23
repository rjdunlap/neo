import { BACK, type Spot } from './friends-layout';

/**
 * Where the root's Home and creature play put things (RW06 slice 2, docs/rework/HOME.md#creature-play-and-home). Both
 * stand on the R06 day backdrop, cover-scaled and anchored at its bottom so the grass is always under the companion.
 * The bottom-left guide corner and, on Home, the top-right corner of the grown-ups' gear and the page's island-games link stay clear. A target
 * never shrinks: the actions are 120 units, the ball 120, Back and Home 100 and 130 apart.
 */

/** The prepared backdrop's size and where its grass begins (`src/art/home/`). */
export const BACKDROP = { w: 1536, h: 1024, floor: 730 };
/** Who's playing, Back and the house-picture Home: 100-unit buttons. */
export const CORNER_RADIUS = 50;
/** Home sits to the right of Back at the root (Friends, Dress, creature play). */
export const HOME_BUTTON: Spot = { x: BACK.x + 130, y: BACK.y };
/** Play with {pet}, Explore and the youngest's ball: 120-unit pictures. */
export const ACTION_RADIUS = 60;
export const BALL_RADIUS = 60;
/** The basket to Friends: its hit box is 124 units. The library's books take the same box. */
export const BASKET = { w: 124, h: 120 };
/** Kept clear: the bottom-left corner where a guide stands, and the island-games link's corner (CSS pixels over a scaled view, so generous). */
export const GUIDE_CORNER = { w: 200, h: 200 };
export const LINK_CORNER = { w: 300, h: 100 };
/** Home's top-right corner: the grown-ups' gear, with the island-games link below it until RW08's cutover. */
export const GEAR_CORNER = { w: 300, h: 150 };

export interface Floor {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Backdrop {
  scale: number;
  /** The sprite's bottom-centre. */
  x: number;
  y: number;
  /** Where the grass begins on screen. */
  floorTop: number;
}

export function backdropFit(v: { w: number; h: number }): Backdrop {
  const scale = Math.max(v.w / BACKDROP.w, v.h / BACKDROP.h);
  return { scale, x: v.w / 2, y: v.h, floorTop: v.h - (BACKDROP.h - BACKDROP.floor) * scale };
}

export interface HomeLayout {
  backdrop: Backdrop;
  who: Spot;
  /** The companion's feet and scale. */
  stage: Spot & { scale: number };
  /** Preschool and pre-K with Welcome a New Friend open (RW07): Continue, first in the column. Absent otherwise. */
  continue: Spot | null;
  /** Preschool and older: Play with {pet}. Absent for the youngest. */
  play: Spot | null;
  explore: Spot;
  /** Lap and toddler: the ball, right here. */
  ball: Spot | null;
  /** Where the ball may land (its centre), clear of every button. */
  floor: Floor;
}

/** `young` is lap or toddler: the companion, one toy and Explore. `project` adds Continue above Play (never for the youngest). */
export function homeLayout(v: { w: number; h: number }, young: boolean, project = false): HomeLayout {
  const backdrop = backdropFit(v);
  const right = v.w - 50 - ACTION_RADIUS;
  const mid = Math.max(GEAR_CORNER.h + ACTION_RADIUS + 20, v.h * 0.42);
  const stage = { x: Math.round(v.w * 0.4), y: v.h - 60, scale: 1.2 };
  const row = 2 * ACTION_RADIUS + 40;
  const cont = !young && project ? { x: right, y: mid } : null;
  const top = cont ? mid + row : mid;
  const explore = { x: right, y: young ? mid + 80 : top + row };
  const play = young ? null : { x: right, y: top };
  const ball = young ? { x: Math.min(stage.x + 280, right - 2 * ACTION_RADIUS - 60), y: v.h - 90 } : null;
  const floor = { x0: GUIDE_CORNER.w + BALL_RADIUS, x1: right - ACTION_RADIUS - BALL_RADIUS - 30, y0: Math.max(backdrop.floorTop + 40, v.h - 220), y1: v.h - BALL_RADIUS - 20 };
  return { backdrop, who: { x: BACK.x, y: BACK.y }, stage, continue: cont, play, explore, ball, floor };
}

export interface PlayLayout {
  backdrop: Backdrop;
  back: Spot;
  home: Spot;
  stage: Spot & { scale: number };
  ball: Spot;
  /** The kept picture's board and the tune plaque (`src/ui/creation-art.ts`), on the wall above the grass. */
  board: Spot;
  plaque: Spot;
  basket: Spot;
  /** The books on their shelf, to the library (RW08 slice 2): under Back and Home, on the wall. */
  books: Spot;
  floor: Floor;
}

export function playLayout(v: { w: number; h: number }): PlayLayout {
  const backdrop = backdropFit(v);
  const basket = { x: v.w - 50 - BASKET.w / 2, y: v.h - 50 - BASKET.h / 2 };
  const stage = { x: Math.round(v.w * 0.36), y: v.h - 70, scale: 1.1 };
  const top = BACK.y + BACK.r + 130;
  const plaque = { x: v.w - 50 - 80, y: top };
  const board = { x: plaque.x - 80 - 40 - 130, y: top };
  const floor = { x0: GUIDE_CORNER.w + BALL_RADIUS, x1: basket.x - BASKET.w / 2 - BALL_RADIUS - 30, y0: Math.max(backdrop.floorTop + 40, v.h - 220), y1: v.h - BALL_RADIUS - 20 };
  const books = { x: Math.round((BACK.x + HOME_BUTTON.x) / 2), y: top };
  return { backdrop, back: { x: BACK.x, y: BACK.y }, home: HOME_BUTTON, stage, ball: { x: Math.round(v.w * 0.62), y: v.h - 100 }, board, plaque, basket, books, floor };
}

/**
 * Explore's location cards (RW13, docs/rework/HOME.md#home-homescene-the-roots-hub): 150 units, one page holding every
 * location there will be (eleven), in rows of at most four.
 */
export const EXPLORE_CARD = 150;
export const EXPLORE_MAX = 11;
/** Cards to a row, and the distance from one row's centre to the next (a card, its name and a gap). */
const EXPLORE_ROW = 4;
/** Explore's own entries (Places, Favorites, All games, Arcade, Family play); a page of games holds at most `EXPLORE_ROW`. */
const EXPLORE_ENTRY_MAX = 5;
const EXPLORE_PITCH = 220;

export interface ExploreLayout {
  backdrop: Backdrop;
  back: Spot;
  /** Each card's centre, in the order given. */
  cards: Spot[];
}

/**
 * Rows of up to four cards, the fuller rows on top (so the narrower last row is the one that comes down beside the
 * guide corner), Back top-left, clear of the guide and link corners. One row sits across the middle, as it always has.
 */
export function exploreLayout(v: { w: number; h: number }, n: number): ExploreLayout {
  if (n < 1 || n > EXPLORE_MAX) throw new Error(`Explore holds one to ${EXPLORE_MAX} locations, not ${n}`);
  const gap = 80;
  const step = EXPLORE_CARD + gap;
  const rows = Math.ceil(n / EXPLORE_ROW);
  const y0 = rows === 1 ? Math.round(v.h * 0.45) : Math.max(200, Math.round(v.h * 0.42 - ((rows - 1) * EXPLORE_PITCH) / 2));
  const cards: Spot[] = [];
  for (let r = 0, left = n; r < rows; r++) {
    const inRow = Math.ceil(left / (rows - r));
    const x0 = v.w / 2 - ((inRow - 1) * step) / 2;
    for (let i = 0; i < inRow; i++) cards.push({ x: Math.round(x0 + i * step), y: y0 + r * EXPLORE_PITCH });
    left -= inRow;
  }
  return { backdrop: backdropFit(v), back: { x: BACK.x, y: BACK.y }, cards };
}

/** The 120-unit page arrows under a page of game cards (RW08). */
export const PAGE_ARROW_RADIUS = 60;

export interface ExploreGridLayout {
  backdrop: Backdrop;
  back: Spot;
  home: Spot;
  /** Each card's centre, in reading order. */
  cards: Spot[];
  /** The previous and next arrows, under the cards (drawn only when they have somewhere to go). */
  prev: Spot;
  next: Spot;
}

/**
 * Explore's five entries (three over two), a page of up to four games, or Family play's one card (RW08 slice 1,
 * docs/rework/RW08-CUTOVER.md#slice-1-explores-four-entries): 150-unit cards with their names under them, in one row
 * when the view is wider than tall and two by two when it is taller; Back and Home top left as in creature play, and
 * the page arrows centred under the cards, clear of the guide corner.
 */
export function exploreGridLayout(v: { w: number; h: number }, n: number): ExploreGridLayout {
  if (n < 1 || n > EXPLORE_ENTRY_MAX) throw new Error(`An Explore page holds one to ${EXPLORE_ENTRY_MAX} cards, not ${n}`);
  const step = EXPLORE_CARD + 80;
  // Explore's five entries take two rows (three over two) even when the view is wide: five in a row would not fit 1024.
  const perRow = v.h > v.w && n > 2 ? 2 : n > EXPLORE_ROW ? Math.ceil(n / 2) : n;
  const rows = Math.ceil(n / perRow);
  const y0 = rows === 1 ? Math.round(v.h * 0.42) : Math.round(v.h * 0.4 - ((rows - 1) * EXPLORE_PITCH) / 2);
  const cards: Spot[] = [];
  for (let r = 0, left = n; r < rows; r++) {
    const inRow = Math.min(perRow, left);
    const x0 = v.w / 2 - ((inRow - 1) * step) / 2;
    for (let i = 0; i < inRow; i++) cards.push({ x: Math.round(x0 + i * step), y: y0 + r * EXPLORE_PITCH });
    left -= inRow;
  }
  // Under the last row's names, a card's width apart either side of the middle.
  const arrowY = y0 + (rows - 1) * EXPLORE_PITCH + EXPLORE_CARD / 2 + 50 + 30 + PAGE_ARROW_RADIUS;
  return {
    backdrop: backdropFit(v),
    back: { x: BACK.x, y: BACK.y },
    home: { ...HOME_BUTTON },
    cards,
    prev: { x: Math.round(v.w / 2 - 160), y: arrowY },
    next: { x: Math.round(v.w / 2 + 160), y: arrowY },
  };
}

/**
 * Welcome a New Friend's page (RW07, docs/rework/WELCOME-BUILD.md#routes-and-scenes): Back and Home top left, the
 * newcomer in its basket on the left (above the guide corner), and the step cards in a row, each with room for its green
 * Play arrow below it. Cards are 150 units, the arrow 120, the basket's touch 200 across.
 */
export const PROJECT_CARD = 150;
export const PROJECT_PLAY_RADIUS = 60;
export const NEWCOMER_REACH = 100;

export interface ProjectLayout {
  backdrop: Backdrop;
  back: Spot;
  home: Spot;
  /** The basket's centre; the newcomer peeks out of it. */
  basket: Spot;
  cards: Spot[];
  /** Each card's Play arrow, under it. */
  plays: Spot[];
}

export function projectLayout(v: { w: number; h: number }, n: number): ProjectLayout {
  const backdrop = backdropFit(v);
  // As low as the guide corner allows, towards the grass.
  const basket = { x: Math.round(Math.max(GUIDE_CORNER.w + 20, v.w * 0.24)), y: Math.round(Math.min(v.h - GUIDE_CORNER.h - NEWCOMER_REACH - 20, backdrop.floorTop - 70)) };
  const step = PROJECT_CARD + 70;
  const left = basket.x + NEWCOMER_REACH + 40 + PROJECT_CARD / 2;
  const span = (n - 1) * step;
  const cx = Math.max(left + span / 2, Math.min((v.w * 0.62), v.w - 40 - PROJECT_CARD / 2 - span / 2));
  const y = Math.round(Math.max(BACK.y + BACK.r + 40 + PROJECT_CARD / 2, v.h * 0.36));
  const cards = Array.from({ length: n }, (_, i) => ({ x: Math.round(cx - span / 2 + i * step), y }));
  const plays = cards.map((c) => ({ x: c.x, y: c.y + PROJECT_CARD / 2 + 30 + PROJECT_PLAY_RADIUS }));
  return { backdrop, back: { x: BACK.x, y: BACK.y }, home: HOME_BUTTON, basket, cards, plays };
}
