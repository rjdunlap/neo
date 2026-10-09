import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BEDS, gardenTouch, makeRequests, matches, packetsFor, PLANS, total, type BedState, type Request } from './logic';

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

  it("plants what is asked and no more, so the demonstration's every request is met with no bounce", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const requests = makeRequests(plan, new Rng(seed));
        const free = plan.requests === 0;
        for (const request of free ? [undefined] : requests) {
          const beds: BedState[] = Array.from({ length: BEDS }, () => ({ seed: null, bloom: false }));
          const packets = request ? packetsFor(plan, request, new Rng(seed)) : [];
          let rained = 0;
          for (let touch = gardenTouch(plan, request, beds), n = 0; touch; touch = gardenTouch(plan, request, beds), n++) {
            expect(n, `${plan.name} seed ${seed}`).toBeLessThan(20);
            if (touch === 'rain') {
              rained++;
              const planted = beds.filter((b) => b.seed && !b.bloom).map((b) => b.seed!);
              // It rains only when there is something to grow, and for a request, only on exactly what was asked.
              expect(planted.length).toBeGreaterThan(0);
              if (request) expect(matches(request, planted)).toBe(true);
              for (const b of beds) if (b.seed) b.bloom = true;
            } else if ('bed' in touch) {
              expect(beds[touch.bed].seed).toBeNull();
              beds[touch.bed].seed = 'red';
              // The 'plant' level grows a flower the moment it is planted.
              if (plan.mode === 'plant') beds[touch.bed].bloom = true;
            } else {
              expect(packets).toContain(touch.packet);
              const at = beds.findIndex((b) => !b.seed);
              expect(at).toBeGreaterThanOrEqual(0);
              beds[at].seed = touch.packet;
              // A color level grows the one flower at once and the request is met.
              if (plan.mode === 'color') beds[at].bloom = true;
            }
          }
          if (free) {
            expect(beds.every((b) => b.bloom)).toBe(true);
            expect(rained).toBe(plan.mode === 'water' ? 1 : 0);
          } else if (plan.mode === 'color') expect(matches(request!, beds.filter((b) => b.bloom).map((b) => b.seed!))).toBe(true);
          else {
            expect(rained).toBe(1);
            expect(matches(request!, beds.filter((b) => b.bloom).map((b) => b.seed!))).toBe(true);
          }
        }
      }
    }
  });
});
