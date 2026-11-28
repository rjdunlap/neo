import type { Band } from '../progress/bands';
import { earnsShells, type ShellsSave } from './shells';

/**
 * Lantern Lodge (the progression loop, chunk 32, docs/definitions/progression-loop.md, slice 7): a grown-up's own place by
 * the lake, built piece by piece with shells. Every piece has a price shown before it is built, some wait for the piece
 * they rest on (a roof for its walls), each is built once and stays for good. Nothing wears out, needs upkeep or is left
 * to chance, and building never opens a game or a level.
 */
export const LODGE_PIECES = [
  'foundation',
  'walls',
  'door',
  'windows',
  'roof',
  'chimney',
  'porch-lanterns',
  'path',
  'flowers',
  'bench',
  'fence',
  'lantern-tree',
  'dock',
  'dock-lantern',
  'boat',
] as const;
export type LodgePiece = (typeof LODGE_PIECES)[number];

export interface PieceInfo {
  name: string;
  price: number;
  /** The piece it rests on, built first; null for one that stands alone. */
  needs: LodgePiece | null;
}

export const PIECES: Record<LodgePiece, PieceInfo> = {
  foundation: { name: 'Stone footing', price: 80, needs: null },
  walls: { name: 'Log walls', price: 150, needs: 'foundation' },
  door: { name: 'Front door', price: 80, needs: 'walls' },
  windows: { name: 'Lit windows', price: 120, needs: 'walls' },
  roof: { name: 'Roof', price: 200, needs: 'walls' },
  chimney: { name: 'Chimney', price: 100, needs: 'roof' },
  'porch-lanterns': { name: 'Porch lanterns', price: 150, needs: 'roof' },
  path: { name: 'Stepping stones', price: 60, needs: 'door' },
  flowers: { name: 'Flower bed', price: 80, needs: null },
  bench: { name: 'Garden bench', price: 120, needs: null },
  fence: { name: 'Garden fence', price: 90, needs: null },
  'lantern-tree': { name: 'Lantern tree', price: 250, needs: null },
  dock: { name: 'Dock', price: 120, needs: null },
  'dock-lantern': { name: 'Dock lantern', price: 90, needs: 'dock' },
  boat: { name: 'Rowing boat', price: 200, needs: 'dock' },
};

export const isPiece = (v: unknown): v is LodgePiece =>
  typeof v === 'string' && (LODGE_PIECES as readonly string[]).includes(v);

export interface LodgeSave {
  /** Pieces built, in the order built. */
  built: LodgePiece[];
}

export const emptyLodge = (): LodgeSave => ({ built: [] });

/** Whether a piece can be built now: not built yet, and what it rests on is. */
export const canBuild = (lodge: LodgeSave, id: LodgePiece): boolean =>
  !lodge.built.includes(id) && (PIECES[id].needs === null || lodge.built.includes(PIECES[id].needs!));

export type BuildRefusal = 'band' | 'unknown' | 'built' | 'needs' | 'short';

/** Builds one piece: its price comes off the balance. Refused, with nothing changed, as `BuildRefusal` says. */
export function build(
  lodge: LodgeSave,
  shells: ShellsSave,
  id: string,
  band: Band,
): { lodge: LodgeSave; shells: ShellsSave } | { refused: BuildRefusal } {
  if (!earnsShells(band)) return { refused: 'band' };
  if (!isPiece(id)) return { refused: 'unknown' };
  if (lodge.built.includes(id)) return { refused: 'built' };
  if (!canBuild(lodge, id)) return { refused: 'needs' };
  if (shells.balance < PIECES[id].price) return { refused: 'short' };
  return {
    lodge: { built: [...lodge.built, id] },
    shells: { ...shells, balance: shells.balance - PIECES[id].price },
  };
}

/**
 * A stored record, repaired: known pieces, each once, and only those whose support is built too (a piece is kept when the
 * piece it rests on is anywhere in the list, so the order a damaged save lists them in does not matter).
 */
export function cleanLodge(raw: unknown): LodgeSave {
  const list =
    typeof raw === 'object' && raw !== null && Array.isArray((raw as { built?: unknown }).built)
      ? (raw as { built: unknown[] }).built
      : [];
  const known = [...new Set(list.filter(isPiece))];
  // Keep a piece only if its whole chain of supports is there.
  const rests = (p: LodgePiece): boolean => {
    const n = PIECES[p].needs;
    return n === null || (known.includes(n) && rests(n));
  };
  return { built: known.filter(rests) };
}

/** Every piece's price together: what a whole lodge costs. */
export const LODGE_TOTAL = LODGE_PIECES.reduce((n, p) => n + PIECES[p].price, 0);
