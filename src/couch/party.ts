import { Rng } from '../engine/random';
import type { RoundResult } from '../games/types';

export const COUCH_IDS = ['penguin-slide', 'bouncy-launch', 'bounce-back'] as const;
export type CouchId = typeof COUCH_IDS[number];
export const STOPS = 6;
export interface CouchRound extends RoundResult { id: CouchId; seed: number; level: number }
export interface Party { seed: number; rounds: CouchRound[]; selected: CouchId | null }
export interface CouchSave {
  version: 1;
  party: Party | null;
  trips: number;
  /** One counter and latest sticker seed per game; ownership counts never fall as history rotates. */
  stickers: Partial<Record<CouchId, { count: number; seed: number }>>;
}
export const couchDefaults = (): CouchSave => ({ version: 1, party: null, trips: 0, stickers: {} });
const isId = (v: unknown): v is CouchId => COUCH_IDS.includes(v as CouchId);
const number = (v: unknown, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
export function repairCouch(raw: unknown): CouchSave {
  const v = object(raw), out = couchDefaults();
  if (v.version !== 1) return out;
  out.trips = number(v.trips);
  const stickers = object(v.stickers);
  for (const id of COUCH_IDS) {
    const s = object(stickers[id]);
    if (number(s.count)) out.stickers[id] = { count: number(s.count), seed: number(s.seed, 0x7fffffff) };
  }
  if (v.party) {
    const p = object(v.party);
    const rounds = Array.isArray(p.rounds) ? p.rounds.slice(0, STOPS).map(object).filter(r => isId(r.id)).map(r => ({ id: r.id as CouchId, level: levelFor(r.id as CouchId, 0), seed: number(r.seed, 0x7fffffff), misses: number(r.misses), hints: number(r.hints) })) : [];
    // Levels are reconstructed from the route, not arbitrary save input.
    rounds.forEach((r, i) => r.level = levelFor(r.id, i));
    out.party = { seed: number(p.seed, 0x7fffffff), rounds, selected: rounds.length < STOPS && isId(p.selected) ? p.selected : null };
  }
  return out;
}
export const levelFor = (id: CouchId, stop: number) => id === 'penguin-slide' ? (stop < 3 ? 4 : 5) : 3;
export const seedFor = (party: Party) => new Rng(party.seed + party.rounds.length * 7919).int(1, 0x7fffffff);
export const offers = (party: Party) => new Rng(seedFor(party)).shuffle([...COUCH_IDS]);
export const roundToken = (party: Party) => `${party.seed}:${party.rounds.length}:${party.selected}`;
/** Idempotent settlement: stale finishes cannot award again, or settle a different selection. */
export function completeRound(save: CouchSave, token: string, result: RoundResult): boolean {
  const p = save.party;
  if (!p?.selected || p.rounds.length >= STOPS || roundToken(p) !== token) return false;
  const id = p.selected, seed = seedFor(p);
  p.rounds.push({ id, seed, level: levelFor(id, p.rounds.length), misses: number(result.misses), hints: number(result.hints) });
  const old = save.stickers[id];
  save.stickers[id] = { count: (old?.count ?? 0) + 1, seed };
  p.selected = null;
  if (p.rounds.length === STOPS) save.trips++;
  return true;
}
