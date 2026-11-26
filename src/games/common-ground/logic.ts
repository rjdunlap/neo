import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Common Ground, levels 1–2: a friend states two requests and she arranges a 2 × 3 room to keep both
 * (docs/definitions/common-ground.md). Everything is integers on cells numbered row-major `0 1 2 / 3 4 5`.
 */
export const LEVELS: BandLevels = { school: { min: 1, max: 2 } };

export const describeLevel = (level: number) =>
  level >= 2
    ? 'A request changed: the friend asks for the basket on a different side, so revise the room'
    : 'A place for you: arrange two things so a friend’s two requests are kept';

export const COLS = 3;
export const ROWS = 2;
export const CELLS = COLS * ROWS;

export type Piece = 'cushion' | 'basket' | 'plant';
export const PIECES: readonly Piece[] = ['cushion', 'basket', 'plant'];
export type Fixture = 'window' | 'door';
export const FIXTURES: readonly Fixture[] = ['window', 'door'];
export type Friend = 'bunny' | 'cat' | 'owl' | 'mouse';
export const FRIENDS: readonly Friend[] = ['bunny', 'cat', 'owl', 'mouse'];

/** The piece on each cell, or null. A piece not on any cell is in the tray. */
export type Room = readonly (Piece | null)[];
export const emptyRoom = (): Room => Array.from({ length: CELLS }, () => null);

export const cellOf = (room: Room, piece: Piece): number => room.indexOf(piece);
export const rowOf = (cell: number) => Math.floor(cell / COLS);
export const colOf = (cell: number) => cell % COLS;

/** "By the fixture": the row against its wall, the top for the window and the bottom for the door. */
export const fixtureRow = (fixture: Fixture) => (fixture === 'window' ? 0 : 1);

/** Orthogonal neighbours only: a diagonal is not beside. */
export function beside(a: number, b: number): boolean {
  return Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1;
}
export const neighbours = (cell: number): number[] =>
  Array.from({ length: CELLS }, (_, i) => i).filter((i) => beside(cell, i));

/**
 * Put `piece` on `cell`. An occupied cell swaps: the piece that was there takes the dropped piece's old cell, or goes back
 * to the tray when the dropped piece came from the tray. A drop is never refused.
 */
export function place(room: Room, piece: Piece, cell: number): Room {
  const from = cellOf(room, piece);
  const next = [...room];
  const other = next[cell];
  if (from >= 0) next[from] = null;
  next[cell] = piece;
  if (other && other !== piece && from >= 0) next[from] = other;
  return next;
}

/** A piece back in the tray. */
export function lift(room: Room, piece: Piece): Room {
  return room.map((p) => (p === piece ? null : p));
}

/** `unplaced` and `ok` first; otherwise which request is unmet. The plant is never judged. */
export type Verdict = 'unplaced' | 'ok' | 'cushion' | 'basket' | 'both';

export function requestsKept(room: Room, fixture: Fixture): { cushion: boolean; basket: boolean } {
  const c = cellOf(room, 'cushion'),
    b = cellOf(room, 'basket');
  return {
    cushion: c >= 0 && rowOf(c) === fixtureRow(fixture),
    basket: c >= 0 && b >= 0 && beside(c, b),
  };
}

export function check(room: Room, fixture: Fixture): Verdict {
  if (cellOf(room, 'cushion') < 0 || cellOf(room, 'basket') < 0) return 'unplaced';
  const k = requestsKept(room, fixture);
  return k.cushion && k.basket ? 'ok' : k.cushion ? 'basket' : k.basket ? 'cushion' : 'both';
}

export interface Move {
  piece: Piece;
  cell: number;
}

/**
 * One legal move toward `ok`, never the only answer, and never one that undoes a kept request: the cushion goes on the middle
 * cell of the fixture's row (or straight along its column into the row); the basket goes on the first cell beside the
 * cushion, an empty one before one holding the plant. Null once both requests are kept.
 */
export function hintAction(room: Room, fixture: Fixture): Move | null {
  const row = fixtureRow(fixture);
  const c = cellOf(room, 'cushion');
  if (c < 0) return { piece: 'cushion', cell: row * COLS + 1 };
  if (rowOf(c) !== row) return { piece: 'cushion', cell: row * COLS + colOf(c) };
  const b = cellOf(room, 'basket');
  if (b >= 0 && beside(c, b)) return null;
  const around = neighbours(c);
  const cell = around.find((i) => room[i] === null) ?? around.find((i) => room[i] === 'plant') ?? around[0];
  return { piece: 'basket', cell };
}

/** The seeded look of one visit. The seed never changes the rules or the counts. */
export interface Visit {
  fixture: Fixture;
  friend: Friend;
  /** Index into the cushion colours in `art.ts`. */
  tint: number;
}
export const TINTS = 4;

/** Each fixture comes once before it repeats: the next one is the other, unless nothing came before. */
export function pickVisit(rng: Rng, previous?: Fixture): Visit {
  const fixture = previous
    ? previous === 'window'
      ? 'door'
      : 'window'
    : FIXTURES[rng.int(0, FIXTURES.length - 1)];
  return { fixture, friend: FRIENDS[rng.int(0, FRIENDS.length - 1)], tint: rng.int(0, TINTS - 1) };
}

// ---- Level 2, a request changed (docs/definitions/common-ground-2.md) ----

/** The direction of the basket from the cushion. */
export type Side = 'left' | 'right' | 'above' | 'below';

/** Which side of the cushion the basket is on; null when the two cells are not beside each other. */
export function sideOf(cushion: number, basket: number): Side | null {
  if (cushion < 0 || basket < 0 || !beside(cushion, basket)) return null;
  if (rowOf(cushion) === rowOf(basket)) return colOf(basket) > colOf(cushion) ? 'right' : 'left';
  return rowOf(basket) > rowOf(cushion) ? 'below' : 'above';
}

/** The previewed side of a room that keeps both level-1 requests, or null. */
export function previewSide(room: Room, fixture: Fixture): Side | null {
  if (check(room, fixture) !== 'ok') return null;
  return sideOf(cellOf(room, 'cushion'), cellOf(room, 'basket'));
}

/** `same` is the basket beside the cushion but still on the previewed side. Reasons come cushion, basket, then same. */
export type Verdict2 = 'unplaced' | 'ok' | 'cushion' | 'basket' | 'same';

export function check2(room: Room, fixture: Fixture, previewed: Side): Verdict2 {
  const c = cellOf(room, 'cushion'),
    b = cellOf(room, 'basket');
  if (c < 0 || b < 0) return 'unplaced';
  const k = requestsKept(room, fixture);
  if (!k.cushion) return 'cushion';
  if (!k.basket) return 'basket';
  return sideOf(c, b) === previewed ? 'same' : 'ok';
}

/**
 * One legal move toward `ok` after the change: the cushion goes along its column into the fixture's row; otherwise the basket
 * goes on the first cell beside the cushion, in reading order, whose side is not the previewed one (an empty cell before one
 * holding the plant). Null once the room is `ok`.
 */
export function hintAction2(room: Room, fixture: Fixture, previewed: Side): Move | null {
  if (check2(room, fixture, previewed) === 'ok') return null;
  const row = fixtureRow(fixture);
  const c = cellOf(room, 'cushion');
  if (c < 0) return { piece: 'cushion', cell: row * COLS + 1 };
  if (rowOf(c) !== row) return { piece: 'cushion', cell: row * COLS + colOf(c) };
  const around = neighbours(c).filter((i) => sideOf(c, i) !== previewed);
  const cell = around.find((i) => room[i] === null) ?? around.find((i) => room[i] === 'plant') ?? around[0];
  return { piece: 'basket', cell };
}

/** Rooms before each move since the change, newest last. A drawing aid; nothing is judged by it. */
export type UndoStack = readonly Room[];

/** Record `room` before a move. */
export const pushUndo = (stack: UndoStack, room: Room): UndoStack => [...stack, room];

/** Step back one move; at the bottom the room is the previewed arrangement and the stack stays empty. */
export function undo(room: Room, stack: UndoStack): { room: Room; stack: UndoStack } {
  if (!stack.length) return { room, stack };
  return { room: stack[stack.length - 1], stack: stack.slice(0, -1) };
}
