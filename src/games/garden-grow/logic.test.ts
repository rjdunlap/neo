import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BEDS, makeRequests, matches, packetsFor, PLANS, total, type Request } from './logic';

describe('Garden Grow', () => {
  it('asks for things that fit the beds, offers the packets needed, and never repeats a request back to back', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const rs = makeRequests(plan, rng);
        expect(rs).toHaveLength(plan.requests);
        rs.forEach((r, i) => {
          expect(total(r)).toBeGreaterThanOrEqual(1);
          expect(total(r)).toBeLessThanOrEqual(BEDS);
          const packets = packetsFor(plan, r, rng);
          for (const c of Object.keys(r.want)) expect(packets).toContain(c);
          expect(new Set(packets).size).toBe(packets.length);
          if (plan.mode === 'color') expect(total(r)).toBe(1);
          if (plan.mode === 'count') expect(total(r)).toBeGreaterThanOrEqual(2), expect(packets).toHaveLength(1);
          if (plan.mode === 'mix') expect(Object.keys(r.want)).toHaveLength(2);
          if (i > 0) expect(JSON.stringify(r.want)).not.toBe(JSON.stringify(rs[i - 1].want));
        });
      }
    }
  });

  it('checks plantings by color and number, in any order', () => {
    const r: Request = { want: { red: 2, yellow: 1 } };
    expect(matches(r, ['red', 'yellow', 'red'])).toBe(true);
    expect(matches(r, ['red', 'yellow'])).toBe(false);
    expect(matches(r, ['red', 'yellow', 'red', 'blue'])).toBe(false);
    expect(matches({ want: { blue: 3 } }, ['blue', 'blue', 'blue'])).toBe(true);
  });
});
