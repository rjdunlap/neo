import { swatch, type ColorName } from '../art/palette';
import { ROW_STEPS } from '../games/song-maker/logic';

/**
 * Things she made that can hang in the pet's treehouse: one visual work and one tune. A game hands one over when a
 * round of free making ends; she chooses whether to keep it. A visual work can be a Stamp Studio picture or a
 * Rainbow Fingers painting, and both share the picture board. Keeping is the only way in, and each kind has two
 * places: the one on display and the one before it, so a replaced picture, painting or tune is one touch away,
 * never lost. Nothing here is scored, expires or needs her to come back.
 */

export const STAMP_KINDS = ['star', 'flower', 'fish', 'cat'] as const;
export type StampKindId = (typeof STAMP_KINDS)[number];

/** Most stamps a picture holds (Stamp Studio's own limit). */
export const PICTURE_MAX = 24;
/** Enough marks to preserve a small painting while keeping backups and IndexedDB records comfortably bounded. */
export const PAINTING_MAX_MARKS = 320;
export const PAINTING_MIN_MARKS = 3;
export const PIXEL_PICTURE_MIN_SIZE = 4;
export const PIXEL_PICTURE_MAX_SIZE = 6;
export const TUNE_MIN_NOTES = 2;
export const TUNE_MAX_COLS = 8;
export const TUNE_MAX_ROWS = 5;

export interface PictureStamp {
  kind: StampKindId;
  color: ColorName;
  /** Fractions of the paper (0 to 1), so a picture draws the same on any screen. */
  x: number;
  y: number;
  size: number;
  turns: number;
}

export interface StampPictureCreation {
  kind: 'picture';
  stamps: PictureStamp[];
}

export interface PaintDab {
  shape: 'dab';
  /** Fractions of the paper, so the painting can be redrawn without keeping a bitmap. */
  x: number;
  y: number;
  r: number;
  color: number;
}

export interface PaintFlower {
  shape: 'flower';
  x: number;
  y: number;
  r: number;
  color: ColorName;
}

export type PaintingMark = PaintDab | PaintFlower;

/** A free Rainbow Fingers painting, redrawn from a bounded set of normalized, code-drawn marks. */
export interface PaintingCreation {
  kind: 'picture';
  aspect: number;
  marks: PaintingMark[];
}

export interface PixelPictureCell {
  x: number;
  y: number;
  color: ColorName;
}

/** The last little picture completed in Pixel Pictures, kept as at most a 6 by 6 code-drawn grid. */
export interface PixelPictureCreation {
  kind: 'picture';
  size: 4 | 5 | 6;
  pixels: PixelPictureCell[];
}

/** The one picture-board slot is shared by stamped pictures, finger paintings and pixel pictures. */
export type PictureCreation = StampPictureCreation | PaintingCreation | PixelPictureCreation;

/** A song on a loop: which beat (column) and pitch (row, 0 = top) each jelly sits on. */
export interface TuneCreation {
  kind: 'tune';
  cols: number;
  rows: number;
  notes: { col: number; row: number }[];
}

export type Creation = PictureCreation | TuneCreation;

/** One kind's two places: what is on display, and what was there before (to bring back). */
export interface Slot<T extends Creation> {
  current: T | null;
  previous: T | null;
}

export interface CreationsSave {
  picture: Slot<PictureCreation>;
  tune: Slot<TuneCreation>;
}

export const emptyCreations = (): CreationsSave => ({ picture: { current: null, previous: null }, tune: { current: null, previous: null } });

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const fraction = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

function cleanStamp(raw: unknown): PictureStamp | null {
  if (!isObj(raw)) return null;
  const kind = STAMP_KINDS.find((k) => k === raw.kind);
  const color = typeof raw.color === 'string' && raw.color in swatch ? (raw.color as ColorName) : null;
  const x = fraction(raw.x);
  const y = fraction(raw.y);
  if (!kind || !color || x === null || y === null) return null;
  const size = typeof raw.size === 'number' && Number.isFinite(raw.size) ? Math.min(2, Math.max(0.5, raw.size)) : 1;
  const turns = typeof raw.turns === 'number' && Number.isFinite(raw.turns) ? ((Math.round(raw.turns) % 4) + 4) % 4 : 0;
  return { kind, color, x, y, size, turns };
}

function cleanMark(raw: unknown): PaintingMark | null {
  if (!isObj(raw)) return null;
  const x = fraction(raw.x);
  const y = fraction(raw.y);
  const r = typeof raw.r === 'number' && Number.isFinite(raw.r) ? Math.min(0.12, Math.max(0.006, raw.r)) : null;
  if (x === null || y === null || r === null) return null;
  if (raw.shape === 'dab') {
    const color = typeof raw.color === 'number' && Number.isFinite(raw.color) ? Math.min(0xffffff, Math.max(0, Math.round(raw.color))) : null;
    return color === null ? null : { shape: 'dab', x, y, r, color };
  }
  if (raw.shape === 'flower') {
    const color = typeof raw.color === 'string' && raw.color in swatch ? (raw.color as ColorName) : null;
    return color ? { shape: 'flower', x, y, r, color } : null;
  }
  return null;
}

function cleanPixelPicture(raw: Record<string, unknown>): PixelPictureCreation | null {
  const size = typeof raw.size === 'number' && Number.isInteger(raw.size) && raw.size >= PIXEL_PICTURE_MIN_SIZE && raw.size <= PIXEL_PICTURE_MAX_SIZE
    ? raw.size as PixelPictureCreation['size']
    : null;
  if (size === null || !Array.isArray(raw.pixels)) return null;
  const seen = new Set<string>();
  const pixels: PixelPictureCell[] = [];
  for (const pixel of raw.pixels) {
    if (!isObj(pixel)) continue;
    const x = typeof pixel.x === 'number' && Number.isInteger(pixel.x) ? pixel.x : NaN;
    const y = typeof pixel.y === 'number' && Number.isInteger(pixel.y) ? pixel.y : NaN;
    const color = typeof pixel.color === 'string' && pixel.color in swatch ? pixel.color as ColorName : null;
    const key = `${x}:${y}`;
    if (!(x >= 0 && x < size && y >= 0 && y < size) || !color || seen.has(key)) continue;
    seen.add(key);
    pixels.push({ x, y, color });
  }
  pixels.sort((a, b) => a.y - b.y || a.x - b.x);
  return pixels.length ? { kind: 'picture', size, pixels } : null;
}

/** A visual work from anything: damaged marks are dropped and the rest bounded; null if too little remains. */
export function cleanPicture(raw: unknown): PictureCreation | null {
  if (!isObj(raw)) return null;
  if (Array.isArray(raw.stamps)) {
    const stamps = raw.stamps.map(cleanStamp).filter((s): s is PictureStamp => !!s).slice(0, PICTURE_MAX);
    return stamps.length ? { kind: 'picture', stamps } : null;
  }
  if (Array.isArray(raw.pixels)) return cleanPixelPicture(raw);
  if (!Array.isArray(raw.marks)) return null;
  const marks = raw.marks.map(cleanMark).filter((m): m is PaintingMark => !!m).slice(0, PAINTING_MAX_MARKS);
  if (marks.length < PAINTING_MIN_MARKS) return null;
  const aspect = typeof raw.aspect === 'number' && Number.isFinite(raw.aspect) ? Math.min(2, Math.max(0.5, raw.aspect)) : 4 / 3;
  return { kind: 'picture', aspect, marks };
}

/** A tune from anything: a grid Song Maker can draw, with every note on it once; null if it is too short to be a tune. */
export function cleanTune(raw: unknown): TuneCreation | null {
  if (!isObj(raw)) return null;
  const whole = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN);
  const cols = whole(raw.cols);
  const rows = whole(raw.rows);
  if (!(cols >= 2 && cols <= TUNE_MAX_COLS) || !(rows in ROW_STEPS) || rows > TUNE_MAX_ROWS || !Array.isArray(raw.notes)) return null;
  const seen = new Set<string>();
  const notes: { col: number; row: number }[] = [];
  for (const n of raw.notes) {
    if (!isObj(n)) continue;
    const col = whole(n.col);
    const row = whole(n.row);
    if (!(col >= 0 && col < cols && row >= 0 && row < rows) || seen.has(`${col}:${row}`)) continue;
    seen.add(`${col}:${row}`);
    notes.push({ col, row });
  }
  notes.sort((a, b) => a.col - b.col || a.row - b.row);
  return notes.length >= TUNE_MIN_NOTES ? { kind: 'tune', cols, rows, notes } : null;
}

/** Whatever a game offers, made safe to keep (null if there is nothing worth hanging). */
export function cleanCreation(raw: unknown): Creation | null {
  if (!isObj(raw)) return null;
  return raw.kind === 'picture' ? cleanPicture(raw) : raw.kind === 'tune' ? cleanTune(raw) : null;
}

function cleanSlot<T extends Creation>(raw: unknown, clean: (r: unknown) => T | null): Slot<T> {
  const r = isObj(raw) ? raw : {};
  return { current: clean(r.current), previous: clean(r.previous) };
}

/** The creations a restored or hand-edited save may keep. Never throws, never keeps more than two of a kind. */
export function cleanCreations(raw: unknown): CreationsSave {
  const r = isObj(raw) ? raw : {};
  return { picture: cleanSlot(r.picture, cleanPicture), tune: cleanSlot(r.tune, cleanTune) };
}

const same = (a: Creation | null, b: Creation | null) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Hang something she made. It takes the place on display and the one it replaces becomes the one to bring back.
 * Keeping what is already on display changes nothing, so a second tap cannot push the earlier one out.
 */
export function keepCreation(save: CreationsSave, made: Creation): CreationsSave {
  const clean = cleanCreation(made);
  if (!clean) return save;
  if (clean.kind === 'picture') {
    const slot = save.picture;
    return same(slot.current, clean) ? save : { ...save, picture: { current: clean, previous: slot.current ?? slot.previous } };
  }
  const slot = save.tune;
  return same(slot.current, clean) ? save : { ...save, tune: { current: clean, previous: slot.current ?? slot.previous } };
}

/** Whether there is an earlier one to bring back. */
export const canUndo = (save: CreationsSave, kind: Creation['kind']) => (kind === 'picture' ? save.picture.previous : save.tune.previous) !== null;

/** Bring the earlier one back. The one on display becomes the earlier one, so asking again puts things as they were. */
export function undoCreation(save: CreationsSave, kind: Creation['kind']): CreationsSave {
  if (!canUndo(save, kind)) return save;
  return kind === 'picture'
    ? { ...save, picture: { current: save.picture.previous, previous: save.picture.current } }
    : { ...save, tune: { current: save.tune.previous, previous: save.tune.current } };
}

/** What a tune sounds like, beat by beat: the scale steps of the jellies in each column (empty for a quiet beat). */
export function tuneBeats(tune: TuneCreation): number[][] {
  const steps = ROW_STEPS[tune.rows];
  return Array.from({ length: tune.cols }, (_, col) => tune.notes.filter((n) => n.col === col).map((n) => steps[n.row]));
}
