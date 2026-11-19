/**
 * Where Drop's Journey puts things, as a pure function of the view, so the sideways layout and the upright phone's
 * (chunk 31, docs/definitions/phone-portrait.md) are both testable (`logic.test.ts` sideways, `upright.test.ts` upright).
 * Sideways (and on any view that is not an upright phone's): the journey strip, the book and the leaf along the top,
 * the land in the middle, the cards along the bottom. Held upright the cards stay at the bottom and the strip, the book
 * and the leaf (or the postcard) sit in a row just above them, in a thumb's reach; the land sits on that row and keeps
 * its shape (no taller than `LAND_TALL` times its width), leaving the sky above it on a tall phone.
 */
import { PLACES, type Place } from './logic';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Layout {
  portrait: boolean;
  /** The land picture's area. */
  land: Box;
  /** How far down the sea is drawn: under the cards sideways, to the land's own floor held upright (the row is below it). */
  seaFloor: number;
  places: Record<Place, Box>;
  sun: { x: number; y: number };
  cards: Box[];
  strip: Box;
  book: Box;
  leaf: Box;
  postcard: Box;
}

export const CARD_W = 150,
  CARD_H = 130,
  RING = 124,
  LEAF = 120,
  BOOK = 110,
  /** One stop on the journey strip, edge to edge. */
  STRIP_STEP = 80,
  /** Held upright, the land is no taller than this times its width: a picture, not a ribbon up a tall phone. */
  LAND_TALL = 1.25;
/** The shell's corners: Home and help down the top-left, the pet bottom-left. */
const LEFT_COLUMN = 125,
  PET_CORNER = 175,
  /** The guide's corner is this tall; the upright row above the cards ends at its top, so the strip may start at the edge. */
  PET_TALL = 170;

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** Where each place sits in the land, as a fraction of its box (landscape, portrait). */
const SPOTS: Record<Place, [[number, number], [number, number]]> = {
  snow: [
    [0.14, 0.2],
    [0.2, 0.36],
  ],
  cloud: [
    [0.5, 0.16],
    [0.42, 0.1],
  ],
  ground: [
    [0.16, 0.68],
    [0.16, 0.64],
  ],
  river: [
    [0.42, 0.56],
    [0.5, 0.56],
  ],
  sea: [
    [0.78, 0.8],
    [0.72, 0.86],
  ],
};

/** How many stops of the journey the strip shows at once (at most six; older ones slide off the left). */
export function stripRoom(strip: Box): number {
  return Math.max(1, Math.min(6, Math.floor(strip.w / STRIP_STEP)));
}

export function journeyLayout(
  view: { w: number; h: number; upright?: true },
  cardCount: number,
): Layout | null {
  const { w, h } = view;
  const portrait = h > w;
  const upright = !!view.upright;
  // Cards along the bottom, right of the pet's corner; wrap to two rows if one row cannot hold them.
  const gap = 18;
  const rowLeft = PET_CORNER + 10,
    rowRight = w - 20;
  const perRow = Math.max(1, Math.floor((rowRight - rowLeft + gap) / (CARD_W + gap)));
  const rows = Math.ceil(cardCount / perRow);
  if (rows > 2) return null;
  const cards: Box[] = [];
  for (let r = 0; r < rows; r++) {
    const n = r === rows - 1 ? cardCount - perRow * (rows - 1) : perRow;
    const rowW = n * CARD_W + (n - 1) * gap;
    const x0 = Math.max(rowLeft, (rowLeft + rowRight) / 2 - rowW / 2);
    const y = h - 20 - CARD_H / 2 - (rows - 1 - r) * (CARD_H + 14);
    for (let i = 0; i < n; i++) cards.push(box(x0 + CARD_W / 2 + i * (CARD_W + gap), y, CARD_W, CARD_H));
  }
  const cardsTop = Math.min(h - 20 - CARD_H, ...cards.map((c) => c.y - c.h / 2));
  // The strip, the book and the leaf: one row along the top, or held upright just above the cards.
  const rowTop = upright ? Math.min(cardsTop - 20, h - PET_TALL) - LEAF : 18;
  const leaf = box(w - 20 - LEAF / 2, rowTop + LEAF / 2, LEAF, LEAF);
  const book = box(leaf.x - LEAF / 2 - 20 - BOOK / 2, leaf.y - LEAF / 2 + BOOK / 2, BOOK, BOOK);
  const stripLeft = upright ? 20 : LEFT_COLUMN + 10,
    stripRight = book.x - BOOK / 2 - 16;
  const strip = box((stripLeft + stripRight) / 2, rowTop + 50, stripRight - stripLeft, 92);
  // The land: between the top row and the cards; held upright, on the row above the cards and no taller than its shape.
  const landFloor = upright ? rowTop - 14 : cardsTop - 10;
  const landRoom = landFloor - 128;
  const landH = upright ? Math.min(landRoom, LAND_TALL * w) : landRoom;
  const land = box(w / 2, landFloor - landH / 2, w, landH);
  const places = {} as Record<Place, Box>;
  for (const p of PLACES) {
    const [fx, fy] = SPOTS[p][portrait ? 1 : 0];
    places[p] = box(land.x - land.w / 2 + fx * land.w, land.y - land.h / 2 + fy * land.h, RING, RING);
  }
  const sun = {
    x: land.x + land.w / 2 - (portrait ? 110 : 130),
    y: land.y - land.h / 2 + (portrait ? 70 : 60),
  };
  const seaFloor = landFloor + (upright ? 0 : 44);
  return { portrait, land, seaFloor, places, sun, cards, strip, book, leaf, postcard: leaf };
}
