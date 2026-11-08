import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  answerObject,
  answerRow,
  ATTRIBUTES,
  attributeOf,
  commonExact,
  compareAnswer,
  count,
  gramsFor,
  helpId,
  HelpTally,
  KILOGRAM,
  PER_GROUP,
  planFor,
  PLANS,
  remeasure,
  SAME,
  SMALL_WEIGHT,
  tableAnswer,
  tasksFor,
  toolAnswers,
  TOOL_FOR,
  TOOLS,
  UNIT_VALUE,
  type Attribute,
  type ObjectId,
  type Task,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);
const tasks = (level: number, seed: number): Task[] => tasksFor(planFor(level), new Rng(seed));

describe('tools and counts', () => {
  it('every tool measures exactly one attribute and each attribute has one tool', () => {
    expect(new Set(Object.values(TOOL_FOR)).size).toBe(ATTRIBUTES.length);
    for (const t of TOOLS) expect(ATTRIBUTES.filter((a) => TOOL_FOR[a] === t)).toHaveLength(1);
    for (const a of ATTRIBUTES) expect(attributeOf(TOOL_FOR[a])).toBe(a);
  });

  it('count is exact division, null for another attribute or a remainder', () => {
    expect(count('length', 6, { attribute: 'length', size: 'big' })).toBe(3);
    expect(count('length', 6, { attribute: 'length', size: 'little' })).toBe(6);
    expect(count('mass', 5, { attribute: 'mass', size: 'big' })).toBeNull();
    expect(count('mass', 4, { attribute: 'length', size: 'little' })).toBeNull();
  });

  it('toolAnswers is true only for the tool of the task attribute', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      for (const task of tasks(1, seed)) {
        for (const t of TOOLS) expect(toolAnswers(task, t)).toBe(t === TOOL_FOR[task.attribute]);
      }
    }
  });
});

describe('level 1', () => {
  it('has three tasks, one per attribute, length first, each one little-unit record of 4', () => {
    for (const seed of SEEDS) {
      const ts = tasks(1, seed);
      expect(ts).toHaveLength(3);
      expect(ts[0].attribute).toBe('length');
      expect([...ts.map((t) => t.attribute)].sort()).toEqual([...ATTRIBUTES].sort());
      for (const t of ts) {
        expect(t.ask).toBeNull();
        expect(t.records).toHaveLength(1);
        expect(t.records[0].unit).toEqual({ attribute: t.attribute, size: 'little' });
        expect(t.records[0].count).toBe(4);
      }
    }
  });

  it('varies the order of the other two attributes across seeds', () => {
    expect(new Set(SEEDS.map((s) => tasks(1, s)[1].attribute)).size).toBe(2);
  });
});

describe('level 2', () => {
  it('has three tasks, one per attribute, each with one big and one little record that agree on the quantity', () => {
    for (const seed of SEEDS) {
      const ts = tasks(2, seed);
      expect(ts).toHaveLength(3);
      expect([...ts.map((t) => t.attribute)].sort()).toEqual([...ATTRIBUTES].sort());
      for (const t of ts) {
        expect(t.records).toHaveLength(2);
        const big = t.records.filter((r) => r.unit.size === 'big');
        const little = t.records.filter((r) => r.unit.size === 'little');
        expect(big).toHaveLength(1);
        expect(little).toHaveLength(1);
        for (const r of t.records) {
          expect(r.unit.attribute).toBe(t.attribute);
          expect(r.count * UNIT_VALUE[r.unit.size]).toBe(t.quantity);
        }
        expect(little[0].count).toBe(2 * big[0].count);
      }
    }
  });

  it('asks big only on the last task, little on the others, with a unique answer row at the asked size', () => {
    for (const seed of SEEDS) {
      const ts = tasks(2, seed);
      expect(ts.map((t) => t.ask)).toEqual(['little', 'little', 'big']);
      for (const t of ts) {
        const row = answerRow(t);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(t.records[row].unit.size).toBe(t.ask);
        expect(t.records.filter((r) => r.unit.size === t.ask)).toHaveLength(1);
      }
    }
  });

  it('varies row order and attribute order across seeds', () => {
    const firstSizes = new Set<string>();
    const firstAttrs = new Set<Attribute>();
    for (const seed of SEEDS) {
      const ts = tasks(2, seed);
      firstSizes.add(ts[0].records[0].unit.size);
      firstAttrs.add(ts[0].attribute);
    }
    expect(firstSizes).toEqual(new Set(['big', 'little']));
    expect(firstAttrs.size).toBe(3);
  });
});

const swapSides = (t: Task): Task => ({
  ...t,
  objects: [...t.objects!].reverse(),
  records: [...t.records].reverse(),
});

describe('level 3', () => {
  const byAttr = (ts: Task[], a: Attribute) => ts.find((t) => t.attribute === a)!;

  it('has three tasks, one per attribute, each with objects A and B and exact first records (A big, B little)', () => {
    for (const seed of SEEDS) {
      const ts = tasks(3, seed);
      expect(ts).toHaveLength(3);
      expect([...ts.map((t) => t.attribute)].sort()).toEqual([...ATTRIBUTES].sort());
      for (const t of ts) {
        expect(t.objects!.map((o) => o.id).sort()).toEqual(['A', 'B']);
        expect(t.records).toHaveLength(2);
        t.objects!.forEach((o, i) => {
          const r = t.records[i];
          expect(r.unit.attribute).toBe(t.attribute);
          expect(r.unit.size).toBe(o.id === 'A' ? 'big' : 'little');
          expect(r.count * UNIT_VALUE[r.unit.size]).toBe(o.quantity);
        });
      }
    }
  });

  it('varies object order and attribute order across seeds', () => {
    const orders = new Set<string>();
    const firstAttrs = new Set<Attribute>();
    for (const seed of SEEDS) {
      const ts = tasks(3, seed);
      orders.add(ts[0].objects!.map((o) => o.id).join(''));
      firstAttrs.add(ts[0].attribute);
    }
    expect(orders).toEqual(new Set(['AB', 'BA']));
    expect(firstAttrs.size).toBe(3);
  });

  it('remeasuring in little units is exact for every task', () => {
    for (const seed of SEEDS) {
      for (const t of tasks(3, seed)) {
        expect(commonExact(t, 'little')).toBe(true);
        remeasure(t, 'little').forEach((n, i) => expect(n).toBe(t.objects![i].quantity));
      }
    }
  });

  it('remeasuring in big units is exact only for capacity; length and mass leave B between marks', () => {
    for (const seed of SEEDS) {
      for (const t of tasks(3, seed)) {
        expect(commonExact(t, 'big')).toBe(t.attribute === 'capacity');
        const big = remeasure(t, 'big');
        t.objects!.forEach((o, i) => {
          if (t.attribute === 'capacity') expect(big[i]).toBe(3);
          else expect(big[i]).toBe(o.id === 'B' ? null : o.quantity / 2);
        });
      }
    }
  });

  it('the answer is the longer ribbon A, the heavier parcel B, and the jugs hold the same', () => {
    for (const seed of SEEDS) {
      const ts = tasks(3, seed);
      const len = byAttr(ts, 'length');
      expect(len.objects![compareAnswer(len) === 0 ? 0 : 1].id).toBe('A');
      const mass = byAttr(ts, 'mass');
      expect(mass.objects![compareAnswer(mass) === 0 ? 0 : 1].id).toBe('B');
      const cap = byAttr(ts, 'capacity');
      expect(compareAnswer(cap)).toBe(SAME);
      expect(compareAnswer(cap, 'big')).toBe(SAME);
      expect(answerObject(len)).toBe('A');
      expect(answerObject(mass)).toBe('B');
      expect(answerObject(cap)).toBe('same');
    }
  });

  it('the answer stays with the object when the sides swap', () => {
    const expected: Record<Attribute, ObjectId | 'same'> = { length: 'A', mass: 'B', capacity: 'same' };
    for (const seed of SEEDS) {
      for (const t of tasks(3, seed)) {
        expect(answerObject(t)).toBe(expected[t.attribute]);
        expect(answerObject(swapSides(t))).toBe(expected[t.attribute]);
      }
    }
  });

  it('the larger first-record count is not the answer for length or capacity', () => {
    for (const seed of SEEDS) {
      for (const t of tasks(3, seed)) {
        if (t.attribute === 'mass') continue;
        const rawLargerIdx = t.records[0].count > t.records[1].count ? 0 : 1;
        const rawLarger = t.objects![rawLargerIdx].id;
        const bigRec = t.records[t.objects!.findIndex((o) => o.id === 'A')];
        const littleRec = t.records[t.objects!.findIndex((o) => o.id === 'B')];
        if (t.attribute === 'length') {
          expect([bigRec.count, littleRec.count]).toEqual([3, 5]);
          expect(rawLarger).toBe('B');
          expect(answerObject(t)).toBe('A');
        } else {
          expect([bigRec.count, littleRec.count]).toEqual([3, 6]);
          expect(rawLarger).toBe('B');
          expect(answerObject(t)).toBe('same');
        }
      }
    }
  });

  it('compareAnswer throws for a unit that cannot measure both exactly', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const ts = tasks(3, seed);
      expect(() => compareAnswer(byAttr(ts, 'length'), 'big')).toThrow();
      expect(() => compareAnswer(byAttr(ts, 'mass'), 'big')).toThrow();
    }
  });
});

describe('level 4', () => {
  it('has two mass tasks, 3 kg then 4 kg, with known rows above', () => {
    for (const seed of SEEDS) {
      const ts = tasks(4, seed);
      expect(ts).toHaveLength(2);
      expect(ts.map((t) => t.attribute)).toEqual(['mass', 'mass']);
      expect(ts.map((t) => t.table!.kg)).toEqual([3, 4]);
      expect(ts.map((t) => t.table!.known)).toEqual([
        [1, 2],
        [1, 2, 3],
      ]);
    }
  });

  it('options are a permutation of the authored choices with exactly one right answer', () => {
    const sets = [
      [1000, 3000, 4000],
      [2000, 4000, 5000],
    ];
    for (const seed of SEEDS) {
      tasks(4, seed).forEach((t, i) => {
        const opts = t.table!.options;
        expect([...opts].sort((a, b) => a - b)).toEqual(sets[i]);
        expect(opts.filter((g) => g === gramsFor(t.table!.kg))).toHaveLength(1);
        expect(opts[tableAnswer(t)]).toBe(gramsFor(t.table!.kg));
      });
    }
  });

  it('grams follow from one kilogram balancing four 250-gram weights', () => {
    expect(PER_GROUP * SMALL_WEIGHT).toBe(KILOGRAM);
    expect(gramsFor(1)).toBe(1000);
    expect(gramsFor(1)).toBe(4 * 250);
    expect(gramsFor(3)).toBe(3000);
    expect(gramsFor(4)).toBe(4000);
  });

  it('varies the pad order across seeds', () => {
    for (const i of [0, 1]) {
      expect(new Set(SEEDS.map((s) => tableAnswer(tasks(4, s)[i]))).size).toBeGreaterThan(1);
      expect(new Set(SEEDS.map((s) => tasks(4, s)[i].table!.options.join(','))).size).toBeGreaterThan(1);
    }
  });
});

describe('determinism and plans', () => {
  it('the same seed gives the same tasks', () => {
    for (const level of [1, 2, 3, 4])
      for (const seed of SEEDS.slice(0, 30)) expect(tasks(level, seed)).toEqual(tasks(level, seed));
  });

  it('planFor clamps to the built levels', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(1)).toBe(PLANS[0]);
    expect(planFor(2)).toBe(PLANS[1]);
    expect(planFor(3)).toBe(PLANS[2]);
    expect(planFor(4)).toBe(PLANS[3]);
    expect(PLANS).toHaveLength(4);
    expect(PLANS.map((p) => p.mode)).toEqual(['tool', 'rows', 'common', 'table']);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
    expect(planFor(99)).toBe(PLANS[3]);
  });
});

describe('HelpTally', () => {
  it('counts each task step once however often given, and distinct ones separately', () => {
    const h = new HelpTally();
    h.give(helpId(0, 'tool'));
    h.give(helpId(0, 'tool'));
    h.give(helpId(0, 'tool'));
    expect(h.count).toBe(1);
    h.give(helpId(0, 'answer'));
    h.give(helpId(1, 'tool'));
    expect(h.count).toBe(3);
    expect(h.has(helpId(0, 'answer'))).toBe(true);
    expect(h.has(helpId(2, 'send'))).toBe(false);
  });
});
