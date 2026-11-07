import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  answerRow, ATTRIBUTES, attributeOf, count, helpId, HelpTally, planFor, PLANS, tasksFor, toolAnswers, TOOL_FOR, TOOLS,
  UNIT_VALUE, type Attribute, type Task,
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

describe('determinism and plans', () => {
  it('the same seed gives the same tasks', () => {
    for (const level of [1, 2]) for (const seed of SEEDS.slice(0, 30)) expect(tasks(level, seed)).toEqual(tasks(level, seed));
  });

  it('planFor clamps to the built levels', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(1)).toBe(PLANS[0]);
    expect(planFor(2)).toBe(PLANS[1]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
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
