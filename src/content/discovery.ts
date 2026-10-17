import type { GameModule } from '../games/types';
import { playBand, type Band } from '../progress/bands';
import type { GameStats } from '../progress/save';

/** The frozen D1b pool, in tie-breaking order. */
export const DISCOVERY_IDS = ['bubble-pop', 'sing-along-barn', 'fill-dump'] as const;
type Candidate = Pick<GameModule, 'id' | 'bands' | 'inputs'>;
export type DiscoverySource = { current: string; band: Band; playedBand: Band; story: boolean };

export function discoveryCandidates<T extends Candidate>(source: DiscoverySource, catalog: readonly T[]): T[] {
  if (source.story || !['lap', 'toddler'].includes(source.band) || source.band !== source.playedBand || !DISCOVERY_IDS.some(id => id === source.current)) return [];
  return DISCOVERY_IDS.flatMap(id => {
    const mod = catalog.find(m => m.id === id);
    return mod && id !== source.current && (mod.inputs ?? ['touch']).includes('touch') && mod.bands.includes(source.band) && playBand(mod.bands, source.band) === source.band ? [mod] : [];
  });
}

/** Completion history only; opening/previewing a game does not make it played. Never mutates stats. */
export function suggestDiscovery<T extends Candidate>(candidates: readonly T[], stats: Readonly<Record<string, GameStats>>, last?: string): T | undefined {
  const pool = candidates.length > 1 ? candidates.filter(m => m.id !== last) : candidates;
  const latest = (id: string) => Math.max(0, ...(stats[id]?.history ?? []).map(r => r.at));
  return [...pool].sort((a, b) => Number(!!stats[a.id]?.plays) - Number(!!stats[b.id]?.plays) || (stats[a.id]?.plays && stats[b.id]?.plays ? latest(a.id) - latest(b.id) : 0) || DISCOVERY_IDS.indexOf(a.id as typeof DISCOVERY_IDS[number]) - DISCOVERY_IDS.indexOf(b.id as typeof DISCOVERY_IDS[number]))[0];
}
