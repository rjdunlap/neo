import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  ANSWER_SIZE,
  CANDIDATES,
  CLASSES,
  corners,
  decidingStop,
  evidenceAt,
  helpFor,
  judgeLife,
  judgeSort,
  lensLayout,
  lifeDropsFor,
  looksAlive,
  LensTally,
  MAX_ART_SCALE,
  MAX_SPEED,
  ART_R,
  STOP4_ZOOM,
  MIN_LENS,
  PAIR_IDS,
  PAIRS,
  rightLife,
  ringBox,
  ringHits,
  SORT_IDS,
  SORT_SAMPLES,
  sortEvidenceAt,
  sortRoundFor,
  STOPS,
  STOP_SIZE,
  swimmerAt,
  swimmerSpeed,
  SWIMMER_FIELD,
  planFor,
  type CandidateId,
  type LifeAnswer,
} from './logic';

const seeds = (n: number) => Array.from({ length: n }, (_, i) => i * 7919 + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const ANSWERS: LifeAnswer[] = ['alive', 'not-alive', 'cant-tell'];
const IDS = Object.keys(CANDIDATES) as CandidateId[];

describe('level 5 candidates', () => {
  it('every evidence set is defined at stops 1-4, never shrinks, and holds no motion or colour', () => {
    for (const id of IDS) {
      expect(CANDIDATES[id].evidence.length).toBe(4);
      for (let s = 1; s < 4; s++)
        for (const e of CANDIDATES[id].evidence[s - 1]) expect(CANDIDATES[id].evidence[s]).toContain(e);
      for (const ev of CANDIDATES[id].evidence)
        for (const e of ev) expect(['edge', 'inside', 'hairs', 'empty', 'ragged']).toContain(e);
    }
  });
  it('nothing separate shows at stops 1-2', () => {
    for (const id of IDS) for (const s of [1, 2] as const) expect(evidenceAt(id, s)).toEqual([]);
  });
  it('the truth rule (edge and inside) agrees with the Truth column wherever anything shows', () => {
    for (const id of IDS)
      for (const s of STOPS)
        if (evidenceAt(id, s).length) expect(looksAlive(evidenceAt(id, s))).toBe(CANDIDATES[id].alive);
  });
});

describe('level 5 pairs', () => {
  it('are exactly A-C, one alive and one not, both moving or both still, deciding at 3, 3, 4', () => {
    expect(PAIR_IDS).toEqual(['A', 'B', 'C']);
    for (const p of PAIR_IDS) {
      const [a, b] = PAIRS[p].map((id) => CANDIDATES[id]);
      expect(a.alive !== b.alive).toBe(true);
      expect(a.motion === 'still').toBe(b.motion === 'still');
      expect(evidenceAt(a.id, 4)).not.toEqual(evidenceAt(b.id, 4));
    }
    expect(PAIR_IDS.map(decidingStop)).toEqual([3, 3, 4]);
  });
  it('the deciding stop is the lowest where evidence differs', () => {
    for (const p of PAIR_IDS) {
      const [a, b] = PAIRS[p];
      for (const s of STOPS)
        if (s < decidingStop(p)) expect([...evidenceAt(a, s)].sort()).toEqual([...evidenceAt(b, s)].sort());
    }
  });
});

describe('judgeLife', () => {
  for (const p of PAIR_IDS)
    for (const ringed of [0, 1] as const)
      for (const s of STOPS) {
        it(`${p} ringed ${ringed} at stop ${s}`, () => {
          const d = decidingStop(p);
          const c = CANDIDATES[PAIRS[p][ringed]];
          const v = Object.fromEntries(ANSWERS.map((a) => [a, judgeLife(p, ringed, s, a)]));
          if (s < d) {
            expect(v['cant-tell']).toEqual({ result: 'free', line: 'lens.right-for-now' });
            // No oracle: a true and a false guess sound the same.
            expect(v.alive).toEqual(v['not-alive']);
            expect(v.alive).toEqual({ result: 'free', line: 'lens.could-be' });
            expect(rightLife(p, ringed, s)).toBe('cant-tell');
          } else {
            expect(v['cant-tell']).toEqual({ result: 'miss', line: 'lens.can-tell-now' });
            const truth = c.alive ? 'alive' : 'not-alive';
            const lie = c.alive ? 'not-alive' : 'alive';
            expect(v[truth].result).toBe('right');
            expect(v[lie].result).toBe('miss');
            expect(rightLife(p, ringed, s)).toBe(truth);
            // The miss names the evidence, never the verdict.
            expect(['lens.look.inside', 'lens.look.empty', 'lens.look.ragged']).toContain(v[lie].line);
          }
        });
      }
});

describe('level 5 rounds', () => {
  it('three drops, every pair once, alive and not-alive rings, across 500 seeds', () => {
    for (const seed of seeds(500))
      for (const authored of [false, true]) {
        const drops = lifeDropsFor(new Rng(seed), authored);
        expect(drops.map((d) => d.pair).sort()).toEqual(['A', 'B', 'C']);
        const alive = drops.map((d) => CANDIDATES[PAIRS[d.pair][d.ringed]].alive);
        expect(alive).toContain(true);
        expect(alive).toContain(false);
      }
  });
  it('the authored round: A with the swimmer ringed, C with the silt ringed, then B', () => {
    const drops = lifeDropsFor(new Rng(5), true);
    expect(drops.map((d) => [d.pair, PAIRS[d.pair][d.ringed]]).slice(0, 2)).toEqual([
      ['A', 'swimmer'],
      ['C', 'silt'],
    ]);
    expect(drops[2].pair).toBe('B');
  });
  it('drifters stay in the drop and under the speed cap, still ones do not move', () => {
    const cap = MAX_SPEED / (ART_R * STOP4_ZOOM * MAX_ART_SCALE);
    for (const seed of seeds(200))
      for (const d of lifeDropsFor(new Rng(seed), false))
        d.paths.forEach((path, i) => {
          const c = CANDIDATES[PAIRS[d.pair][i]];
          expect(swimmerSpeed(path)).toBeLessThanOrEqual(cap + 1e-9);
          if (c.motion === 'still') expect(swimmerSpeed(path)).toBe(0);
          for (let t = 0; t < 30; t += 0.7) {
            const p = swimmerAt(path, t);
            expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(SWIMMER_FIELD + 1e-9);
          }
        });
  });
});

describe('level 6 samples', () => {
  it('every class has samples; the class evidence is drawn at the deciding stop and at stop 4', () => {
    for (const cls of CLASSES) expect(SORT_IDS.some((id) => SORT_SAMPLES[id].cls === cls)).toBe(true);
    for (const id of SORT_IDS) {
      expect(sortEvidenceAt(id, SORT_SAMPLES[id].deciding).length).toBeGreaterThan(0);
      expect(sortEvidenceAt(id, 4)).toEqual(SORT_SAMPLES[id].evidence);
    }
    expect(SORT_IDS.filter((id) => SORT_SAMPLES[id].deciding === 4)).toEqual(['green-ball']);
  });
  it('judgeSort is one free verdict for every tray below the deciding stop, and misses only on wrong trays above it', () => {
    for (const id of SORT_IDS)
      for (const s of STOPS) {
        const v = CLASSES.map((t) => judgeSort(id, s, t));
        if (s < SORT_SAMPLES[id].deciding)
          for (const x of v) expect(x).toEqual({ result: 'free', line: 'lens.look-closer-edges' });
        else
          CLASSES.forEach((t, i) => expect(v[i].result).toBe(t === SORT_SAMPLES[id].cls ? 'right' : 'miss'));
      }
  });
  it('rounds: four distinct samples, every class, the green ball, across 500 seeds; the authored round', () => {
    for (const seed of seeds(500)) {
      const r = sortRoundFor(new Rng(seed), false);
      expect(new Set(r).size).toBe(4);
      for (const cls of CLASSES) expect(r.some((id) => SORT_SAMPLES[id].cls === cls)).toBe(true);
      expect(r).toContain('green-ball');
    }
    expect(sortRoundFor(new Rng(1), true)).toEqual(['green-thread', 'swimmer', 'sand', 'green-ball']);
  });
});

describe('levels 5-6 help', () => {
  it('Show a hint turns to the deciding stop', () => {
    for (const p of PAIR_IDS) expect(helpFor(5, { pair: p })).toEqual({ do: 'turn', stop: decidingStop(p) });
    for (const id of SORT_IDS)
      expect(helpFor(6, { sample: id })).toEqual({ do: 'turn', stop: SORT_SAMPLES[id].deciding });
  });
  it('a speck with a wrong verdict, two hints and a right verdict counts one miss and one hint; two wrong presses light the glow', () => {
    const t = new LensTally();
    expect(judgeLife('A', 0, 3, 'not-alive').result).toBe('miss');
    t.miss();
    expect(t.hint()).toBe(true);
    expect(t.hint()).toBe(false);
    expect(judgeLife('A', 0, 3, 'alive').result).toBe('right');
    expect([t.misses, t.hints]).toEqual([1, 1]);
    expect(t.glow).toBe(false);
    t.miss();
    expect(t.glow).toBe(true);
  });
  it('plans name levels 5 and 6', () => {
    expect(planFor(5).level).toBe(5);
    expect(planFor(6).level).toBe(6);
  });
});

describe('levels 5-6 layout', () => {
  for (const [name, v] of Object.entries(views))
    for (const level of [5, 6]) {
      it(`${name} level ${level}`, () => {
        const l = lensLayout(v, level);
        expect(l).not.toBeNull();
        if (!l) return;
        expect(l.answer).toBeNull();
        expect(l.stops.length).toBe(4);
        expect(l.choices.length).toBe(3);
        for (const s of l.stops) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(STOP_SIZE);
        for (const c of l.choices) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(ANSWER_SIZE);
        expect(l.lens.r * 2).toBeGreaterThanOrEqual(MIN_LENS);
        const rects = [...l.stops, ...l.choices, ...(l.paw ? [ringBox(l.paw)] : [])];
        for (const r of [...rects, ringBox(l.lens)]) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h).toBeLessThanOrEqual(v.h);
        }
        for (const r of rects)
          for (const k of corners(v))
            expect(r.x < k.x + k.w && k.x < r.x + r.w && r.y < k.y + k.h && k.y < r.y + r.h).toBe(false);
        for (const k of corners(v)) expect(ringHits(l.lens, k)).toBe(false);
        rects.forEach((a, i) =>
          rects.forEach((b, j) => {
            if (i < j)
              expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
          }),
        );
        for (const r of rects) expect(ringHits(l.lens, r)).toBe(false);
      });
    }
  it('the lens stays well over the minimum at 1024x768 and 768x1024', () => {
    expect(lensLayout(views.landscape, 5)!.lens.r * 2).toBeGreaterThanOrEqual(500);
    expect(lensLayout(views.portrait, 5)!.lens.r * 2).toBeGreaterThanOrEqual(460);
  });
});
