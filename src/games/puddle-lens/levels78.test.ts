import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  ANSWER_SIZE,
  corners,
  GREEN_DRIFT,
  GREEN_DRIFT_W,
  GREEN_DROPS,
  GREEN_IDS,
  greenDeciding,
  greenDriftAt,
  greenEvidenceAt,
  greenKindOf,
  greenRoundFor,
  greenSeeLine,
  helpFor,
  judgeGreen,
  judgeWall,
  LensTally,
  lensLayout,
  MAX_ART_SCALE,
  MAX_SPEED,
  MIN_LENS,
  planFor,
  ringBox,
  ringHits,
  STOPS,
  STOP_SIZE,
  WALL_IDS,
  WALL_SLIDES,
  wallDeciding,
  wallEvidenceAt,
  wallKindOf,
  wallRoundFor,
  wallSeeLine,
  type GreenAnswer,
  type WallAnswer,
} from './logic';

const seeds = (n: number) => Array.from({ length: n }, (_, i) => i * 7919 + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const WALL_ANS: WallAnswer[] = ['plant', 'animal', 'cant-tell'];
const GREEN_ANS: GreenAnswer[] = ['living', 'all-through', 'cant-tell'];
const ALLOWED = ['edge', 'inside', 'boxes', 'wall', 'soft-edge', 'even'];

describe('level 7-8 tables', () => {
  it('every slide and drop has 4 evidence entries that never shrink and hold no colour or motion', () => {
    const sets = [
      ...WALL_IDS.map((i) => WALL_SLIDES[i].evidence),
      ...GREEN_IDS.map((i) => GREEN_DROPS[i].evidence),
    ];
    expect(sets.length).toBe(6);
    for (const ev of sets) {
      expect(ev.length).toBe(4);
      for (let s = 1; s < 4; s++) for (const e of ev[s - 1]) expect(ev[s]).toContain(e);
      for (const e of ev) for (const x of e) expect(ALLOWED).toContain(x);
    }
  });
  it('level 7 holds only onion skin, leaf and cheek cells, and never lists boxes', () => {
    expect([...WALL_IDS].sort()).toEqual(['cheek-cells', 'leaf', 'onion-skin']);
    for (const id of WALL_IDS) for (const e of WALL_SLIDES[id].evidence) expect(e).not.toContain('boxes');
  });
});

describe('deciding stops', () => {
  it('level 7: 3, 3, 3; level 8: threads 3, balls 4, water 4', () => {
    expect(wallDeciding('onion-skin')).toBe(3);
    expect(wallDeciding('leaf')).toBe(3);
    expect(wallDeciding('cheek-cells')).toBe(3);
    expect(greenDeciding('green-threads')).toBe(3);
    expect(greenDeciding('green-balls')).toBe(4);
    expect(greenDeciding('green-water')).toBe(4);
  });
  it('deciding is the lowest stop where the truth rule holds, and the rule agrees with the answer from there up', () => {
    for (const id of WALL_IDS)
      for (const s of STOPS) {
        const k = wallKindOf(wallEvidenceAt(id, s));
        if (s < wallDeciding(id)) expect(k).toBeNull();
        else expect(k).toBe(WALL_SLIDES[id].kind);
      }
    for (const id of GREEN_IDS)
      for (const s of STOPS) {
        const k = greenKindOf(greenEvidenceAt(id, s));
        if (s < greenDeciding(id)) expect(k).toBeNull();
        else expect(k).toBe(GREEN_DROPS[id].answer);
      }
  });
});

describe('judgeWall', () => {
  for (const id of WALL_IDS)
    for (const s of STOPS) {
      it(`${id} at stop ${s}`, () => {
        const v = Object.fromEntries(WALL_ANS.map((a) => [a, judgeWall(id, s, a)]));
        const kind = WALL_SLIDES[id].kind;
        if (s < wallDeciding(id)) {
          expect(v.plant).toEqual({ result: 'free', line: 'lens.could-be' });
          expect(v.animal).toEqual(v.plant);
          expect(v['cant-tell']).toEqual({ result: 'free', line: 'lens.right-for-now' });
        } else {
          expect(v['cant-tell']).toEqual({ result: 'miss', line: 'lens.wall.can-tell-now' });
          const lie = kind === 'plant' ? 'animal' : 'plant';
          expect(v[kind]).toEqual({ result: 'right', line: `lens.wall.yes.${kind}` });
          expect(v[lie]).toEqual({ result: 'miss', line: wallSeeLine(id) });
        }
      });
    }
  it('see-lines', () => {
    expect(wallSeeLine('onion-skin')).toBe('lens.wall.see.no-green');
    expect(wallSeeLine('leaf')).toBe('lens.wall.see.wall');
    expect(wallSeeLine('cheek-cells')).toBe('lens.wall.see.soft');
  });
  it('colour alone (green is plant, else animal) is not right on all three slides at their deciding stops', () => {
    const byColour = WALL_IDS.map(
      (id) => judgeWall(id, wallDeciding(id), WALL_SLIDES[id].colour === 'green' ? 'plant' : 'animal').result,
    );
    expect(byColour.every((r) => r === 'right')).toBe(false);
    expect(byColour).toContain('miss');
  });
});

describe('judgeGreen', () => {
  for (const id of GREEN_IDS)
    for (const s of STOPS) {
      it(`${id} at stop ${s}`, () => {
        const v = Object.fromEntries(GREEN_ANS.map((a) => [a, judgeGreen(id, s, a)]));
        const kind = GREEN_DROPS[id].answer;
        if (s < greenDeciding(id)) {
          expect(v.living).toEqual({ result: 'free', line: 'lens.could-be' });
          expect(v['all-through']).toEqual(v.living);
          expect(v['cant-tell']).toEqual({ result: 'free', line: 'lens.right-for-now' });
        } else {
          expect(v['cant-tell']).toEqual({ result: 'miss', line: 'lens.green.can-tell-now' });
          const lie = kind === 'living' ? 'all-through' : 'living';
          expect(v[kind]).toEqual({
            result: 'right',
            line: kind === 'living' ? 'lens.green.yes.living' : 'lens.green.yes.through',
          });
          expect(v[lie]).toEqual({ result: 'miss', line: greenSeeLine(id) });
        }
      });
    }
  it('see-lines', () => {
    expect(greenSeeLine('green-threads')).toBe('lens.green.see.threads');
    expect(greenSeeLine('green-balls')).toBe('lens.green.see.balls');
    expect(greenSeeLine('green-water')).toBe('lens.green.see.even');
  });
  it('all drops show identical evidence at stops 1-2, so colour never decides', () => {
    for (const s of [1, 2] as const)
      for (const id of GREEN_IDS) expect(greenEvidenceAt(id, s)).toEqual(greenEvidenceAt('green-water', s));
  });
});

describe('levels 7-8 rounds', () => {
  it('three distinct samples, one of each, across 500 seeds', () => {
    for (const seed of seeds(500))
      for (const authored of [false, true]) {
        const w = wallRoundFor(new Rng(seed), authored);
        expect(new Set(w).size).toBe(3);
        expect([...w].sort()).toEqual([...WALL_IDS].sort());
        const g = greenRoundFor(new Rng(seed), authored);
        expect(new Set(g).size).toBe(3);
        expect([...g].sort()).toEqual([...GREEN_IDS].sort());
      }
  });
  it('the authored rounds', () => {
    expect(wallRoundFor(new Rng(1), true)).toEqual(['onion-skin', 'cheek-cells', 'leaf']);
    expect(greenRoundFor(new Rng(1), true)).toEqual(['green-balls', 'green-water', 'green-threads']);
  });
});

describe('levels 7-8 help and tally', () => {
  it('Show a hint turns to the deciding stop; null without a sample', () => {
    for (const id of WALL_IDS)
      expect(helpFor(7, { wall: id })).toEqual({ do: 'turn', stop: wallDeciding(id) });
    for (const id of GREEN_IDS)
      expect(helpFor(8, { green: id })).toEqual({ do: 'turn', stop: greenDeciding(id) });
    expect(helpFor(7, {})).toBeNull();
    expect(helpFor(8, {})).toBeNull();
  });
  it('a scripted slide counts one miss and one hint; two misses light the glow', () => {
    const t = new LensTally();
    expect(judgeWall('leaf', 3, 'animal').result).toBe('miss');
    t.miss();
    expect(t.hint()).toBe(true);
    expect(t.hint()).toBe(false);
    expect(judgeWall('leaf', 3, 'plant').result).toBe('right');
    expect([t.misses, t.hints]).toEqual([1, 1]);
    expect(t.glow).toBe(false);
    t.miss();
    expect(t.glow).toBe(true);
  });
  it('plans name levels 7 and 8', () => {
    expect(planFor(7).level).toBe(7);
    expect(planFor(8).level).toBe(8);
  });
});

describe('level 8 drift', () => {
  it('the fastest drift stays under the speed cap on screen', () => {
    expect(GREEN_DRIFT * GREEN_DRIFT_W * Math.sqrt(1 + 0.8 ** 2) * MAX_ART_SCALE).toBeLessThanOrEqual(
      MAX_SPEED,
    );
  });
  it('sampled over time the offset stays within the drift radius and its numeric speed is under the cap', () => {
    for (const seed of seeds(40)) {
      const phase = new Rng(seed).range(0, Math.PI * 2);
      const dt = 0.01;
      let prev = greenDriftAt(phase, 0);
      for (let t = dt; t < 60; t += dt) {
        const p = greenDriftAt(phase, t);
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(GREEN_DRIFT * Math.SQRT2 + 1e-9);
        expect((Math.hypot(p.x - prev.x, p.y - prev.y) / dt) * MAX_ART_SCALE).toBeLessThanOrEqual(
          MAX_SPEED + 1e-6,
        );
        prev = p;
      }
    }
  });
});

describe('levels 7-8 layout', () => {
  for (const [name, v] of Object.entries(views))
    for (const level of [7, 8]) {
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
        for (const r of rects) expect(ringHits(l.lens, r)).toBe(false);
      });
    }
});
