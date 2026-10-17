import { describe, expect, it } from 'vitest';
import { DISCOVERY_IDS, discoveryCandidates, suggestDiscovery, type DiscoverySource } from './discovery';
import { GAMES, gameById } from '../games/registry';
import { levelsInOrder } from '../progress/difficulty';
import { defaults, type GameStats } from '../progress/save';
const source: DiscoverySource = { current: 'bubble-pop', band: 'lap', playedBand: 'lap', story: false };
const candidates = () => discoveryCandidates(source, GAMES);
const stats = (plays: number, times: number[] = []): GameStats => ({ level: 1, plays, pinned: null, history: times.map(at => ({ at, level: 1, misses: 0, hints: 0, seconds: 1 })) });

describe('the reviewed direct-next pool', () => {
  it('filters in fixed pool order and excludes the completed game', () => {
    expect(candidates().map(m => m.id)).toEqual(DISCOVERY_IDS.slice(1));
    expect(discoveryCandidates(source, [...GAMES].reverse()).map(m => m.id)).toEqual(DISCOVERY_IDS.slice(1));
    for (const change of [{ band: 'preschool' as const }, { playedBand: 'toddler' as const }, { story: true }, { current: 'peekaboo' }]) expect(discoveryCandidates({ ...source, ...change }, GAMES)).toEqual([]);
  });
  it('omits missing, incompatible and controller-only targets without substituting another pool', () => {
    const barn = gameById('sing-along-barn')!;
    expect(discoveryCandidates(source, [{ ...barn, bands: ['toddler'] }])).toEqual([]);
    expect(discoveryCandidates(source, [{ ...barn, inputs: ['controller'] }])).toEqual([]);
    expect(discoveryCandidates(source, [])).toEqual([]);
    expect(suggestDiscovery(discoveryCandidates(source, [barn]), {}, barn.id)?.id).toBe(barn.id);
    expect(suggestDiscovery([], {})).toBeUndefined();
  });
  it('prefers unplayed games, then oldest latest completion, then stable ties', () => {
    const [barn, fill] = candidates();
    expect(suggestDiscovery(candidates(), {})?.id).toBe(barn.id);
    expect(suggestDiscovery(candidates(), { [barn.id]: stats(1, [10]) })?.id).toBe(fill.id);
    expect(suggestDiscovery(candidates(), { [barn.id]: stats(2, [100, 2]), [fill.id]: stats(1, [50]) })?.id).toBe(fill.id);
    expect(suggestDiscovery(candidates(), { [barn.id]: stats(1), [fill.id]: stats(1, [50]) })?.id).toBe(barn.id);
    expect(suggestDiscovery(candidates(), { [barn.id]: stats(1, [50]), [fill.id]: stats(1, [50]) })?.id).toBe(barn.id);
  });
  it('alternates last suggestions before ranking, without changing any progress', () => {
    const save = defaults(); const before = JSON.stringify(save);
    const first = suggestDiscovery(candidates(), save.games)!;
    const second = suggestDiscovery(candidates(), save.games, first.id)!;
    expect(second.id).toBe('fill-dump');
    expect(suggestDiscovery(candidates(), save.games, second.id)?.id).toBe(first.id);
    expect(JSON.stringify(save)).toBe(before);
  });
  it('keeps the high-ID lap entry and the toddler range authoritative', () => {
    const bubble = gameById('bubble-pop')!;
    expect(levelsInOrder(bubble.levels('lap'))).toEqual([15, 1, 2, 3]);
    expect(levelsInOrder(bubble.levels('toddler'))).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
