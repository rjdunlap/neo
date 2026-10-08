import { swatch, type ColorName } from '../art/palette';
import { ROW_STEPS } from '../games/song-maker/logic';

/**
 * Things she made that can hang in the pet's treehouse: one picture and one tune. A game hands one over when a round
 * of free making ends; she chooses whether to keep it. Keeping is the only way in, and each kind has two places: the
 * one on display and the one before it, so a replaced picture or tune is one touch away, never lost. Nothing here
 * is scored, expires or needs her to come back.
 */

export const STAMP_KINDS = ['star', 'flower', 'fish', 'cat'] as const;
export type StampKindId = (typeof STAMP_KINDS)[number];

/** Most stamps a picture holds (Stamp Studio's own limit). */
export const PICTURE_MAX = 24;
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

export interface PictureCreation {
  kind: 'picture';
  stamps: PictureStamp[];
}

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

/** A picture from anything: damaged stamps are dropped and the rest bounded; null if nothing is left to hang. */
export function cleanPicture(raw: unknown): PictureCreation | null {
  if (!isObj(raw) || !Array.isArray(raw.stamps)) return null;
  const stamps = raw.stamps.map(cleanStamp).filter((s): s is PictureStamp => !!s).slice(0, PICTURE_MAX);
  return stamps.length ? { kind: 'picture', stamps } : null;
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
