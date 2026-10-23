import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { judgeGrid, BEDS, BIG_FLOWERS, BIG_STAGES, bigFinished, bigTouch, KINDS, gardenTouch, makeRequests, matches, packetsFor, planFor, PLANS, requestKey, total, type BedState, type BigState, type Request } from './logic';

describe('Garden Grow', () => {
  it('asks for things that fit the beds, offers the packets needed, and never repeats a request back to back', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'big')) {
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
          if (plan.mode === 'more') {
            const color = Object.keys(r.want)[0] as keyof typeof r.want;
            expect(r.want[color]).toBe((r.shown?.[color] ?? 0) + 1);
            expect(r.shown?.[color]).toBeGreaterThanOrEqual(1);
          }
          if (plan.mode === 'array') {
            expect(total(r)).toBe(6);
            expect(r.shown).toEqual(r.want);
          }
          if (i > 0) expect(requestKey(r)).not.toBe(requestKey(rs[i - 1]));
        });
      }
    }
  });

  it('keeps the two new levels appended and opens pre-K at level 6', () => {
    expect(planFor(5).mode).toBe('mix');
    expect(planFor(6).mode).toBe('more');
    expect(planFor(7).mode).toBe('array');
    expect(planFor(8).mode).toBe('big');
  });

  it('checks plantings by color and number, in any order', () => {
    const r: Request = { kind: 'daisy', want: { red: 2, yellow: 1 } };
    expect(matches(r, ['red', 'yellow', 'red'])).toBe(true);
    expect(matches(r, ['red', 'yellow'])).toBe(false);
    expect(matches(r, ['red', 'yellow', 'red', 'blue'])).toBe(false);
    expect(matches({ kind: 'tulip', want: { blue: 3 } }, ['blue', 'blue', 'blue'])).toBe(true);
  });

  it("plants what is asked and no more, so the demonstration's every request is met with no bounce", () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'big' && !['rows', 'columns', 'equal'].includes(p.mode))) {
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

  it('picks a kind per request, never the same twice running, and judges color and number only', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'big')) {
      for (let seed = 1; seed <= 100; seed++) {
        const rs = makeRequests(plan, new Rng(seed));
        rs.forEach((r, i) => {
          expect(KINDS).toContain(r.kind);
          if (i > 0) expect(r.kind).not.toBe(rs[i - 1].kind);
        });
      }
    }
    const r: Request = { kind: 'daisy', want: { red: 2 } };
    expect(matches({ ...r, kind: 'sunflower' }, ['red', 'red'])).toBe(matches(r, ['red', 'red']));
  });

  it('maps every level of every band to its own plan, level 8 being the big bed', () => {
    expect(PLANS.map((p) => p.mode)).toHaveLength(11);
    expect(planFor(8).mode).toBe('big');
    for (const l of [1, 2, 3, 4, 5, 6, 7]) expect(planFor(l).mode).not.toBe('big');
    expect(makeRequests(planFor(8), new Rng(1))).toHaveLength(0);
    expect(packetsFor(planFor(8), undefined, new Rng(1))).toEqual([]);
  });

  it('level 8: five stages per flower, three flowers end it, and every touch moves it on', () => {
    let s: BigState = { done: 0, stage: 0 };
    let touches = 0;
    const stages: number[] = [];
    while (!bigFinished(s)) {
      const next = bigTouch(s);
      expect(next).not.toEqual(s);
      s = next;
      stages.push(s.stage);
      touches++;
      expect(touches).toBeLessThan(40);
    }
    expect(s).toEqual({ done: BIG_FLOWERS, stage: BIG_STAGES });
    // Every flower passes through every stage, one at a time.
    expect(stages.filter((x) => x === BIG_STAGES)).toHaveLength(BIG_FLOWERS);
    for (let st = 1; st <= BIG_STAGES; st++) expect(stages.filter((x) => x === st)).toHaveLength(BIG_FLOWERS);
    expect(bigTouch(s)).toBe(s);
  });

  it('asks for rows and columns of color by position, and judges and lights the beds that differ', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rows = makeRequests(planFor(9), new Rng(seed));
      for (const r of rows) {
        const g = r.grid!;
        expect(g).toHaveLength(6);
        expect(new Set(g.slice(0, 3)).size).toBe(1);
        expect(new Set(g.slice(3)).size).toBe(1);
        expect(g[0]).not.toBe(g[3]);
        expect(judgeGrid(r, g).ok).toBe(true);
        // Swapped rows are wrong everywhere; the first thing named is the top row.
        const swapped = [...g.slice(3), ...g.slice(0, 3)];
        const j = judgeGrid(r, swapped);
        expect(j.wrong).toEqual([0, 1, 2, 3, 4, 5]);
        expect(j.first).toEqual({ row: 0, color: g[0] });
        // One empty bed lights exactly that bed.
        expect(judgeGrid(r, g.map((c, i) => (i === 4 ? null : c))).wrong).toEqual([4]);
      }
      for (const r of makeRequests(planFor(10), new Rng(seed))) {
        const g = r.grid!;
        expect(g.slice(0, 3)).toEqual(g.slice(3));
        expect(new Set(g).size).toBeGreaterThanOrEqual(2);
        const j = judgeGrid(r, g.map((c, i) => (i === 1 ? null : c)));
        expect(j.wrong).toEqual([1]);
        expect(j.first).toEqual({ col: 1, color: g[1] });
      }
    }
  });

  it('accepts any placement of n per row, and never lights a bed that would break a row', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const r of makeRequests(planFor(11), new Rng(seed))) {
        const n = r.perRow!;
        expect(n === 1 || n === 2).toBe(true);
        const color = Object.keys(r.want)[0] as keyof typeof r.want;
        // Every placement of n in each row is accepted.
        const choose = (k: number) => {
          const out: number[][] = [];
          for (let m = 0; m < 8; m++) {
            const idx = [0, 1, 2].filter((b) => m & (1 << b));
            if (idx.length === k) out.push(idx);
          }
          return out;
        };
        let placements = 0;
        for (const top of choose(n)) for (const bottom of choose(n)) {
          const beds = Array(6).fill(null);
          for (const i of top) beds[i] = color;
          for (const i of bottom) beds[3 + i] = color;
          expect(judgeGrid(r, beds).ok).toBe(true);
          placements++;
        }
        expect(placements).toBe(n === 1 ? 9 : 9);
        // A short top row lights its free beds; an over-full bottom row lights only its extras.
        const beds: (typeof color | null)[] = Array(6).fill(null);
        beds[3] = color; beds[4] = color; beds[5] = color; if (n === 1) beds[0] = null;
        const j = judgeGrid(r, beds);
        expect(j.ok).toBe(false);
        for (const i of j.wrong) {
          const rowStart = i < 3 ? 0 : 3;
          const filled = beds.slice(rowStart, rowStart + 3).filter(Boolean).length;
          // Lighting a free bed only helps a short row; lighting a seed only helps an over-full one.
          if (beds[i]) expect(filled).toBeGreaterThan(n);
          else expect(filled).toBeLessThan(n);
        }
      }
    }
  });

  it('has the ghost finger choose a packet then plant the rows, and finish', () => {
    const plan = planFor(9);
    const r = makeRequests(plan, new Rng(3))[0];
    const beds: BedState[] = Array.from({ length: 6 }, () => ({ seed: null, bloom: false }));
    let chosen: import("../../art/palette").ColorName | null = null;
    for (let step = 0; step < 20; step++) {
      const t = gardenTouch(plan, r, beds, chosen);
      if (t === 'rain') break;
      if (!t) throw new Error('stuck');
      if ('packet' in t) chosen = t.packet;
      else if ('bed' in t) beds[t.bed] = { seed: chosen, bloom: false };
    }
    expect(judgeGrid(r, beds.map((b) => b.seed)).ok).toBe(true);
  });

  it('keeps pre-K walking 6, 7, 9, 10, 11 after the lap entry', () => {
    expect(planFor(9).mode).toBe('rows');
    expect(planFor(10).mode).toBe('columns');
    expect(planFor(11).mode).toBe('equal');
  });
});
