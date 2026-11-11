import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  LEVELS,
  OPS,
  PAIRS,
  PROPS,
  TUPLES,
  Tally,
  briefFor,
  candidateGraphs,
  check,
  choicesFor,
  complete,
  corners,
  evaluate,
  has,
  helpFor,
  machineLayout,
  nextMove,
  overlaps,
  pairKey,
  planFor,
  wanted,
  setSlot,
  slots,
  solutions,
  type Bit,
  type Brief,
  type Fixture,
  type Node,
  type Prop,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i);
const fx = (p: Bit, q: Bit): Fixture => ({ p, q, species: 'pip', color: 'teal' });
const sensor = (prop: Prop | null, fixed = false): Node =>
  fixed ? { kind: 'sensor', prop, fixed: true } : { kind: 'sensor', prop };
const brief2 = (target: Prop = 'hat'): Brief => ({
  level: 2,
  props: ['hat', 'whiskers'],
  fixtures: TUPLES.map(([p, q]) => fx(p, q)),
  target: sensor(target, true),
  graph: sensor(null),
  candidates: ['hat', 'whiskers'],
});
const level2 = SEEDS.map((s) => briefFor(2, new Rng(s)));

describe('evaluate', () => {
  it('reads sensor P and Q for every tuple', () => {
    const b = brief2();
    for (const [p, q] of TUPLES) {
      expect(evaluate(sensor('hat'), fx(p, q), b)).toBe(p === 1);
      expect(evaluate(sensor('whiskers'), fx(p, q), b)).toBe(q === 1);
    }
  });
  it('gives incomplete, never false, for empty sensors and gates', () => {
    const b = brief2();
    expect(evaluate(sensor(null), fx(0, 0), b)).toBe('incomplete');
    const g = (op: 'AND' | 'OR' | null, a: Node, c: Node): Node => ({ kind: 'gate', op, a, b: c });
    expect(evaluate(g(null, sensor('hat', true), sensor('whiskers', true)), fx(1, 1), b)).toBe('incomplete');
    expect(evaluate(g('AND', sensor(null), sensor('whiskers', true)), fx(0, 0), b)).toBe('incomplete');
    expect(evaluate(g('OR', sensor('hat', true), sensor(null)), fx(1, 1), b)).toBe('incomplete');
  });
  it('gives the truth tables for AND and OR over fixed sensors', () => {
    const b = brief2();
    for (const [p, q] of TUPLES) {
      const and: Node = { kind: 'gate', op: 'AND', a: sensor('hat', true), b: sensor('whiskers', true) };
      const or: Node = { kind: 'gate', op: 'OR', a: sensor('hat', true), b: sensor('whiskers', true) };
      expect(evaluate(and, fx(p, q), b)).toBe(p === 1 && q === 1);
      expect(evaluate(or, fx(p, q), b)).toBe(p === 1 || q === 1);
    }
  });
  it('has() ignores a property outside the brief', () => {
    const b = brief2();
    expect(has(fx(1, 1), b, 'boots')).toBe(false);
    expect(has(fx(1, 0), b, 'hat')).toBe(true);
    expect(has(fx(1, 0), b, 'whiskers')).toBe(false);
  });
});

describe('coverage', () => {
  it('level 2 has one fixture per tuple with distinct species and colors', () => {
    for (const b of level2) {
      expect(b.fixtures).toHaveLength(4);
      expect(b.fixtures.map((f) => `${f.p}${f.q}`).sort()).toEqual(['00', '01', '10', '11']);
      expect(new Set(b.fixtures.map((f) => f.species)).size).toBe(4);
      expect(new Set(b.fixtures.map((f) => f.color)).size).toBe(4);
    }
  });
  it('level 1 has two fixtures with P=1 and P=0, distinct casts', () => {
    for (const s of SEEDS) {
      const b = briefFor(1, new Rng(s));
      expect(b.fixtures).toHaveLength(2);
      expect(b.fixtures.map((f) => f.p).sort()).toEqual([0, 1]);
      expect(b.fixtures[0].species).not.toBe(b.fixtures[1].species);
      expect(b.fixtures[0].color).not.toBe(b.fixtures[1].color);
      expect(b.props[0]).not.toBe(b.props[1]);
    }
  });
});

describe('solvability', () => {
  it('level 2 always has a solution and the other sensor fails exactly the mixed tuples', () => {
    for (const b of level2) {
      const sols = solutions(b);
      expect(sols.length).toBeGreaterThan(0);
      const target = (b.target as { prop: Prop }).prop;
      const other = b.candidates.find((c) => c !== target)!;
      const v = check(setSlot(b.graph, 0, other), b);
      expect(v.status).toBe('fail');
      if (v.status === 'fail') {
        const mixed = b.fixtures.map((f, i) => (f.p !== f.q ? i : -1)).filter((i) => i >= 0);
        expect([...v.rows].sort()).toEqual(mixed.sort());
        expect(mixed).toHaveLength(2);
      }
      expect(check(setSlot(b.graph, 0, target), b).status).toBe('pass');
    }
  });
  it('check accepts exactly the solutions among all candidate graphs', () => {
    for (const b of level2) {
      const all = candidateGraphs(b);
      const sols = solutions(b);
      expect(all).toHaveLength(2);
      for (const g of all)
        expect(check(g, b).status === 'pass').toBe(sols.some((s) => JSON.stringify(s) === JSON.stringify(g)));
    }
  });
  it('level 1 starting graph passes check', () => {
    for (const s of SEEDS) {
      const b = briefFor(1, new Rng(s));
      expect(check(b.graph, b).status).toBe('pass');
    }
  });
});

describe('check', () => {
  it('is order independent', () => {
    for (const s of SEEDS) {
      const b = level2[s];
      const shuffled: Brief = { ...b, fixtures: new Rng(s + 1000).shuffle([...b.fixtures]) };
      for (const g of candidateGraphs(b)) expect(check(g, shuffled).status).toBe(check(g, b).status);
    }
  });
  it('judges every row, sent or not (check takes no sent state)', () => {
    const b = brief2('hat');
    const v = check(setSlot(b.graph, 0, 'whiskers'), b);
    expect(v).toEqual({ status: 'fail', rows: [1, 2] });
  });
  it('is incomplete with slot 0 before fail when the slot is empty', () => {
    expect(check(brief2().graph, brief2())).toEqual({ status: 'incomplete', slot: 0 });
  });
});

describe('Tally', () => {
  it('counts misses and the glow hint', () => {
    const t = new Tally();
    expect(t.miss()).toBe(false);
    expect([t.misses, t.hints, t.glowing]).toEqual([1, 0, false]);
    expect(t.miss()).toBe(true);
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
    t.miss();
    t.miss();
    expect([t.misses, t.hints]).toEqual([4, 1]);
  });
  it('counts one hint per help press', () => {
    const t = new Tally();
    expect(t.help()).toBe(1);
    expect(t.help()).toBe(2);
    expect(t.hints).toBe(2);
  });
});

describe('helpFor', () => {
  it('press 1 on an empty machine runs a mixed fixture', () => {
    for (const b of level2) {
      const h = helpFor(b.graph, b, 1);
      expect(h.kind).toBe('run');
      if (h.kind === 'run') expect(b.fixtures[h.fixture].p).not.toBe(b.fixtures[h.fixture].q);
    }
  });
  it('press 1 on a complete wrong machine runs a fixture it gets wrong', () => {
    for (const b of level2) {
      const wrong = candidateGraphs(b).find((g) => check(g, b).status === 'fail')!;
      const h = helpFor(wrong, b, 1);
      expect(h.kind).toBe('run');
      if (h.kind === 'run') {
        const v = check(wrong, b);
        expect(v.status === 'fail' && v.rows.includes(h.fixture)).toBe(true);
      }
    }
  });
  it('press 2 installs a passing machine from every partial state', () => {
    for (const b of level2) {
      for (const g of [b.graph, ...candidateGraphs(b)]) {
        const h = helpFor(g, b, 2);
        expect(h.kind).toBe('install');
        if (h.kind === 'install') expect(check(h.graph, b).status).toBe('pass');
      }
    }
  });
});

describe('seeds', () => {
  it('the same seed gives the same brief', () => {
    for (const level of [1, 2])
      for (const s of SEEDS) expect(briefFor(level, new Rng(s))).toEqual(briefFor(level, new Rng(s)));
  });
  it('covers every prop at level 1 and all six pair/target briefs at level 2', () => {
    const firsts = new Set(SEEDS.map((s) => briefFor(1, new Rng(s)).props[0]));
    expect([...firsts].sort()).toEqual([...PROPS].sort());
    const combos = new Set(level2.map((b) => `${b.props.join('+')}>${(b.target as { prop: Prop }).prop}`));
    expect(combos.size).toBe(PAIRS.length * 2);
  });
});

describe('nextMove', () => {
  it('level 1 sends unsent fixtures then is done', () => {
    const b = briefFor(1, new Rng(3));
    expect(nextMove(b, b.graph, [false, false])).toEqual({ send: 0 });
    expect(nextMove(b, b.graph, [true, false])).toEqual({ send: 1 });
    expect(nextMove(b, b.graph, [true, true])).toEqual({ done: true });
  });
  it('level 2 sends a mixed friend, picks the accepted prop, then checks', () => {
    for (const b of level2) {
      const m = nextMove(b, b.graph, [false, false, false, false]);
      expect('send' in m).toBe(true);
      if ('send' in m) expect(b.fixtures[m.send].p).not.toBe(b.fixtures[m.send].q);
      const sent = [true, false, false, false];
      const pick = nextMove(b, b.graph, sent);
      expect(pick).toEqual({ pick: (b.target as { prop: Prop }).prop });
      const filled = setSlot(b.graph, 0, (pick as { pick: Prop }).pick);
      expect(nextMove(b, filled, sent)).toEqual({ check: true });
    }
  });
});

describe('slots', () => {
  it('a fixed sensor is not a slot; setSlot leaves fixed sensors alone', () => {
    const g: Node = { kind: 'gate', op: null, a: sensor('hat', true), b: sensor(null) };
    expect(slots(g).map((s) => s.kind)).toEqual(['gate', 'sensor']);
    expect(slots(sensor('hat', true))).toEqual([]);
    expect(setSlot(sensor('hat', true), 0, 'whiskers')).toEqual(sensor('hat', true));
    const filled = setSlot(setSlot(g, 0, 'OR'), 1, 'boots');
    expect(filled).toEqual({ kind: 'gate', op: 'OR', a: sensor('hat', true), b: sensor('boots') });
    expect(complete(g)).toBe(false);
    expect(complete(filled)).toBe(true);
    expect(complete(sensor('hat', true))).toBe(true);
    expect(g).toEqual({ kind: 'gate', op: null, a: sensor('hat', true), b: sensor(null) });
  });
});

describe('layout', () => {
  const views = [computeView(1024, 768), computeView(768, 1024)];
  for (const level of [1, 2, 3]) {
    for (const v of views) {
      it(`level ${level} at ${v.w}x${v.h} has full-size, non-overlapping, in-view parts`, () => {
        const l = machineLayout(level, v);
        expect(l).not.toBeNull();
        if (!l) return;
        for (const f of l.fixtures) {
          expect(f.w).toBeGreaterThanOrEqual(120);
          expect(f.h).toBeGreaterThanOrEqual(140);
        }
        expect(l.fixtures).toHaveLength(level === 1 ? 2 : 4);
        expect(l.sensors).toHaveLength(level === 3 ? 2 : 0);
        for (const r of l.sensors) {
          // Inside the cabinet, above the gate slot and clear of each other.
          expect(r.x).toBeGreaterThanOrEqual(l.machine.x);
          expect(r.x + r.w).toBeLessThanOrEqual(l.machine.x + l.machine.w);
          expect(r.y + r.h).toBeLessThan(l.slot!.y);
        }
        if (level === 3) expect(overlaps(l.sensors[0], l.sensors[1])).toBe(false);
        expect(l.door.y + l.door.h).toBeLessThanOrEqual(l.machine.y + l.machine.h);
        if (l.slot) expect(l.door.y).toBeGreaterThanOrEqual(l.slot.y + l.slot.h);
        if (level >= 2) {
          expect(l.slot!.w).toBeGreaterThanOrEqual(110);
          expect(l.slot!.h).toBeGreaterThanOrEqual(110);
          expect(l.picks).toHaveLength(2);
        }
        for (const p of l.picks) {
          expect(p.w).toBeGreaterThanOrEqual(110);
          expect(p.h).toBeGreaterThanOrEqual(110);
        }
        expect(l.send.w).toBeGreaterThanOrEqual(120);
        expect(l.send.h).toBeGreaterThanOrEqual(100);
        expect(l.slow.w).toBeGreaterThanOrEqual(100);
        expect(l.slow.h).toBeGreaterThanOrEqual(100);
        for (const b of [l.check, l.done, l.undo])
          if (b) {
            expect(b.w).toBeGreaterThanOrEqual(100);
            expect(b.h).toBeGreaterThanOrEqual(100);
          }
        expect(level === 1 ? l.done : l.check).not.toBeNull();
        const parts = [
          ...l.fixtures,
          l.machine,
          l.send,
          l.slow,
          ...[l.sign, l.check, l.done, l.undo].filter((r) => r !== null),
        ];
        for (const p of parts) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.x + p.w).toBeLessThanOrEqual(v.w);
          expect(p.y + p.h).toBeLessThanOrEqual(v.h);
          for (const c of corners(v)) expect(overlaps(p, c)).toBe(false);
        }
        parts.forEach((a, i) =>
          parts.forEach((b, j) => {
            if (i < j) expect(overlaps(a, b)).toBe(false);
          }),
        );
      });
    }
    it(`level ${level} on a short phone view is null or valid`, () => {
      const v = computeView(844, 390);
      const l = machineLayout(level, v);
      if (l) {
        for (const f of l.fixtures) {
          expect(f.w).toBeGreaterThanOrEqual(120);
          expect(f.h).toBeGreaterThanOrEqual(140);
        }
        expect(l.machine.y + l.machine.h).toBeLessThanOrEqual(v.h);
      } else expect(l).toBeNull();
    });
  }
});

describe('level 3, Both badges', () => {
  const briefs = SEEDS.map((seed) => briefFor(3, new Rng(seed)));
  const mixed = (f: Fixture) => f.p !== f.q;

  it('is the top of the school ladder, named Both badges', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 3 });
    expect(planFor(3).name).toBe('Both badges');
    expect(planFor(2).name).toBe('Choose the sensor');
  });

  it('has two fixed sensors and one empty gate slot offering AND and OR', () => {
    for (const b of briefs) {
      expect(b.level).toBe(3);
      const list = slots(b.graph);
      expect(list).toEqual([{ index: 0, kind: 'gate', value: null }]);
      expect(choicesFor(b, list[0])).toEqual([...OPS]);
      expect(b.graph.kind).toBe('gate');
      if (b.graph.kind !== 'gate') continue;
      expect(b.graph.a).toEqual({ kind: 'sensor', prop: b.props[0], fixed: true });
      expect(b.graph.b).toEqual({ kind: 'sensor', prop: b.props[1], fixed: true });
      expect(b.props[0]).not.toBe(b.props[1]);
    }
  });

  it('has one fixture per tuple with a distinct cast, and an empty gate reads incomplete for all of them', () => {
    for (const b of briefs) {
      expect(b.fixtures.map((f) => `${f.p}${f.q}`).sort()).toEqual(['00', '01', '10', '11']);
      expect(new Set(b.fixtures.map((f) => f.species)).size).toBe(4);
      expect(new Set(b.fixtures.map((f) => f.color)).size).toBe(4);
      for (const f of b.fixtures) expect(evaluate(b.graph, f, b)).toBe('incomplete');
      expect(check(b.graph, b)).toEqual({ status: 'incomplete', slot: 0 });
    }
  });

  it('the sign wants only the friend with both; AND is the one solution and OR fails exactly the mixed friends', () => {
    for (const b of briefs) {
      expect(b.fixtures.filter((f) => wanted(f, b)).map((f) => [f.p, f.q])).toEqual([[1, 1]]);
      const sols = solutions(b);
      expect(sols).toHaveLength(1);
      expect(slots(sols[0])[0].value).toBe('AND');
      expect(check(setSlot(b.graph, 0, 'AND'), b)).toEqual({ status: 'pass' });
      const v = check(setSlot(b.graph, 0, 'OR'), b);
      expect(v.status).toBe('fail');
      if (v.status !== 'fail') continue;
      expect(v.rows).toHaveLength(2);
      expect(v.rows.every((i) => mixed(b.fixtures[i]))).toBe(true);
      expect(v.rows).toEqual([...v.rows].sort((x, y) => x - y));
    }
  });

  it('covers all three pairs, both sensor orders and many fixture orders across seeds; a seed repeats', () => {
    expect(new Set(briefs.map(pairKey))).toEqual(new Set(PAIRS.map((p) => p.join('-'))));
    expect(new Set(briefs.map((b) => b.props.join('-'))).size).toBe(6);
    expect(new Set(briefs.map((b) => b.fixtures.map((f) => `${f.p}${f.q}`).join(' '))).size).toBeGreaterThan(
      12,
    );
    expect(briefFor(3, new Rng(77))).toEqual(briefFor(3, new Rng(77)));
  });

  it('levels 1 and 2 draw the same briefs as before level 3 existed (first seeds pinned by shape)', () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const two = briefFor(2, new Rng(seed));
      expect(two.level).toBe(2);
      expect(slots(two.graph)).toEqual([{ index: 0, kind: 'sensor', value: null }]);
      expect(two.candidates).toEqual(two.props);
      expect(briefFor(1, new Rng(seed)).fixtures).toHaveLength(2);
    }
  });

  it('help runs a mixed friend from the empty, the wrong and the right gate, then installs AND, which passes', () => {
    for (const b of briefs.slice(0, 60)) {
      for (const g of [b.graph, setSlot(b.graph, 0, 'OR'), setSlot(b.graph, 0, 'AND')]) {
        const first = helpFor(g, b, 1);
        expect(first.kind).toBe('run');
        if (first.kind === 'run') expect(mixed(b.fixtures[first.fixture])).toBe(true);
        const second = helpFor(g, b, 2);
        expect(second.kind).toBe('install');
        if (second.kind === 'install') {
          expect(slots(second.graph)[0].value).toBe('AND');
          expect(check(second.graph, b).status).toBe('pass');
        }
      }
    }
  });

  it('the ghost finger sends the friend help would pick, chooses AND, then checks', () => {
    for (const b of briefs.slice(0, 60)) {
      const none = b.fixtures.map(() => false);
      const m1 = nextMove(b, b.graph, none);
      const h = helpFor(b.graph, b, 1);
      expect(m1).toEqual({ send: h.kind === 'run' ? h.fixture : -1 });
      const sent = none.map((_, i) => 'send' in m1 && i === m1.send);
      expect(nextMove(b, b.graph, sent)).toEqual({ pick: 'AND' });
      expect(nextMove(b, setSlot(b.graph, 0, 'AND'), sent)).toEqual({ check: true });
    }
  });

  it('a failed Check of a complete gate is one miss whatever the failing rows; the second lights the glow once', () => {
    const t = new Tally();
    expect(t.miss()).toBe(false);
    expect([t.misses, t.hints]).toEqual([1, 0]);
    expect(t.miss()).toBe(true);
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
  });
});
