import { describe, expect, it } from 'vitest';
import { oklabDistance } from '../../art/oklab';
import { RAINBOW, swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  addMatchDrop,
  LEVELS,
  MATCH_CAPACITY,
  MATCH_SAMPLES,
  matchDegrees,
  matchHint,
  matchesSample,
  morePaint,
  pickSamples,
  planFor,
  wheelColor,
  type MatchBowl,
  type MatchSample,
} from './logic';

const CAPACITY = 6;
const BOWLS: MatchBowl[] = [];
for (let a = 0; a <= CAPACITY; a++) for (let b = 0; a + b <= CAPACITY; b++) BOWLS.push([a, b]);

const total = ([a, b]: MatchBowl) => a + b;
const share = (bowl: MatchBowl) => bowl[1] / total(bowl);
const exact = (sample: MatchSample): MatchBowl => [3 - sample.share, sample.share];
const expectedMatch = (sample: MatchSample, bowl: MatchBowl) =>
  Math.abs(share(bowl) - sample.share / 3) <= 2 / 15 + Number.EPSILON;
const keepsDrops = (candidate: MatchBowl, bowl: MatchBowl) =>
  candidate[0] >= bowl[0] && candidate[1] >= bowl[1];

describe('Rainbow Fingers level 12, Match the sample', () => {
  it('appends three samples to the school ladder at level 12', () => {
    expect(LEVELS.school).toEqual({ min: 5, max: 12 });
    expect(planFor(12)).toEqual({ mode: 'match', count: 3 });
    expect(MATCH_CAPACITY).toBe(CAPACITY);
  });

  it('places each defined sample at the intended share between its two primaries', () => {
    expect(
      MATCH_SAMPLES.map((sample) => [matchDegrees(sample, exact(sample)), ...sample.pair, sample.name]).sort(
        (a, b) => Number(a[0]) - Number(b[0]),
      ),
    ).toEqual([
      [40, 'red', 'yellow', 'red-orange'],
      [80, 'red', 'yellow', 'yellow-orange'],
      [160, 'yellow', 'blue', 'yellow-green'],
      [200, 'yellow', 'blue', 'blue-green'],
      [280, 'blue', 'red', 'blue-purple'],
      [320, 'blue', 'red', 'red-purple'],
    ]);
  });

  it('accepts exactly five bowls of four shares per sample, with three drops the smallest match', () => {
    for (const sample of MATCH_SAMPLES) {
      const accepted = BOWLS.filter((bowl) => matchesSample(sample, bowl));
      const mirrors: MatchBowl[] = [
        [4, 1],
        [3, 1],
        [2, 1],
        [3, 2],
        [4, 2],
      ];
      const expected = sample.share === 1 ? mirrors : mirrors.map(([a, b]): MatchBowl => [b, a]);
      expect(accepted, sample.name).toHaveLength(5);
      expect(accepted, sample.name).toEqual(expect.arrayContaining(expected));
      expect(new Set(accepted.map(share)).size, sample.name).toBe(4);
      expect(Math.min(...accepted.map(total)), sample.name).toBe(3);
      expect(matchesSample(sample, exact(sample)), sample.name).toBe(true);
    }
  });

  it('agrees with the inclusive fractional tolerance on every bowl and keeps each pair’s accepted sets disjoint', () => {
    for (const sample of MATCH_SAMPLES)
      for (const bowl of BOWLS) {
        const label = `${sample.name} with ${bowl}`;
        const accepted = matchesSample(sample, bowl);
        expect(accepted, label).toBe(expectedMatch(sample, bowl));
        if (bowl[0] === 0 || bowl[1] === 0 || bowl[0] === bowl[1]) expect(accepted, label).toBe(false);
        if (accepted)
          expect(matchesSample({ ...sample, share: sample.share === 1 ? 2 : 1 }, bowl), label).toBe(false);
      }
  });

  it('draws the anchor swatches exactly, including the secondaries from equal pours', () => {
    for (const [i, color] of RAINBOW.entries()) expect(wheelColor(i * 60), color).toBe(swatch[color].fill);
    expect(wheelColor(360)).toBe(swatch.red.fill);
    for (const sample of MATCH_SAMPLES) {
      expect(matchDegrees(sample, [0, 0])).toBeNull();
      expect(matchDegrees(sample, [1, 1])).toBe(sample.start + 60);
    }
  });

  it('gives equal proportions the same place, color and verdict at every amount', () => {
    for (const sample of MATCH_SAMPLES)
      for (const bowl of BOWLS) {
        if (!total(bowl)) continue;
        const degrees = matchDegrees(sample, bowl)!;
        expect(degrees, `${sample.name} with ${bowl}`).toBeCloseTo(sample.start + 120 * share(bowl));
        for (const peer of BOWLS.filter((other) => total(other) && share(other) === share(bowl))) {
          const label = `${sample.name} with ${bowl} and ${peer}`;
          expect(matchDegrees(sample, peer), label).toBe(degrees);
          expect(wheelColor(matchDegrees(sample, peer)!), label).toBe(wheelColor(degrees));
          expect(matchesSample(sample, peer), label).toBe(matchesSample(sample, bowl));
        }
      }
  });

  it('moves toward the paint just added and preserves a full bowl', () => {
    for (const sample of MATCH_SAMPLES)
      for (const bowl of BOWLS) {
        const first = addMatchDrop(bowl, 0);
        const second = addMatchDrop(bowl, 1);
        if (total(bowl) === CAPACITY) {
          expect(first).toBe(bowl);
          expect(second).toBe(bowl);
          continue;
        }
        expect(first).toEqual([bowl[0] + 1, bowl[1]]);
        expect(second).toEqual([bowl[0], bowl[1] + 1]);
        const before = matchDegrees(sample, bowl);
        if (before === null) continue;
        const towardFirst = matchDegrees(sample, first)!;
        const towardSecond = matchDegrees(sample, second)!;
        expect(towardFirst).toBeGreaterThanOrEqual(sample.start);
        expect(towardFirst).toBeLessThanOrEqual(before);
        expect(towardSecond).toBeGreaterThanOrEqual(before);
        expect(towardSecond).toBeLessThanOrEqual(sample.start + 120);
      }
  });

  it('shows a visible gap between accepted and rejected fills for every sample', () => {
    for (const sample of MATCH_SAMPLES) {
      const target = wheelColor(matchDegrees(sample, exact(sample))!);
      let farthestAccepted = 0;
      let nearestRejected = Infinity;
      for (const bowl of BOWLS) {
        if (!total(bowl)) continue;
        const fill = wheelColor(matchDegrees(sample, bowl)!);
        const distance = oklabDistance(target, fill);
        if (expectedMatch(sample, bowl)) farthestAccepted = Math.max(farthestAccepted, distance);
        else nearestRejected = Math.min(nearestRejected, distance);
      }
      expect(nearestRejected, sample.name).toBeGreaterThanOrEqual(4.5);
      expect(farthestAccepted, sample.name).toBeLessThan(nearestRejected);
    }
  });

  it('hints toward a nearest reachable match and starts again only at a dead end', () => {
    for (const sample of MATCH_SAMPLES)
      for (const bowl of BOWLS) {
        const label = `${sample.name} with ${bowl}`;
        const hint = matchHint(sample, bowl);
        const reachable = BOWLS.filter((other) => expectedMatch(sample, other) && keepsDrops(other, bowl));
        if (expectedMatch(sample, bowl)) {
          expect(hint, label).toBeNull();
        } else if (reachable.length === 0) {
          expect(hint, label).toBe('start-again');
        } else {
          if (hint !== 0 && hint !== 1) throw new Error(`${label}: expected a pot, got ${hint}`);
          const next = addMatchDrop(bowl, hint);
          const shortest = Math.min(...reachable.map(total));
          expect(
            reachable.some((other) => total(other) === shortest && keepsDrops(other, next)),
            label,
          ).toBe(true);
          if (total(bowl)) {
            const other = addMatchDrop(bowl, hint === 0 ? 1 : 0);
            expect(Math.abs(share(next) - sample.share / 3), label).toBeLessThan(
              Math.abs(share(bowl) - sample.share / 3),
            );
            if (reachable.some((candidate) => total(candidate) === shortest && keepsDrops(candidate, other)))
              expect(Math.abs(share(next) - sample.share / 3), label).toBeLessThanOrEqual(
                Math.abs(share(other) - sample.share / 3),
              );
          } else expect(hint, label).toBe(sample.share - 1);
        }
        let current = bowl;
        for (let tap = 0; tap < 4 && !expectedMatch(sample, current); tap++) {
          const move = matchHint(sample, current);
          if (move === null) break;
          current = move === 'start-again' ? [0, 0] : addMatchDrop(current, move);
        }
        expect(expectedMatch(sample, current), label).toBe(true);
      }
  });

  it('names the paint whose share is too small on a far check', () => {
    for (const sample of MATCH_SAMPLES)
      for (const bowl of BOWLS.filter((bowl) => total(bowl) && !expectedMatch(sample, bowl))) {
        const more = share(bowl) < sample.share / 3 ? 1 : 0;
        expect(morePaint(sample, bowl), `${sample.name} with ${bowl}`).toBe(more);
      }
  });

  it('deals one sample from each pair in seeded order, with both shades and every order seen', () => {
    const names = new Set<string>();
    const orders = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const samples = pickSamples(new Rng(seed));
      expect(samples, `seed ${seed}`).toEqual(pickSamples(new Rng(seed)));
      expect(
        samples.map((sample) => sample.start).sort((a, b) => a - b),
        `seed ${seed}`,
      ).toEqual([0, 120, 240]);
      for (const sample of samples) {
        expect(MATCH_SAMPLES).toContainEqual(sample);
        names.add(sample.name);
      }
      orders.add(samples.map((sample) => sample.start).join(','));
    }
    expect(names.size).toBe(6);
    expect(orders.size).toBe(6);
  });
});
