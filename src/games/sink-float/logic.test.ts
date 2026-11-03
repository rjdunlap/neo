import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT, type LineId } from '../../content/voice-script';
import { ALL_SHAPES, ALL_THINGS, CLAY_SHAPES, floats, rightBasket, shapesFor, SINK_PLANS, sinkPlan, THINGS, thingsFor, thingWord, type Thing } from './logic';

const THING_PLANS = SINK_PLANS.filter((p) => p.mode !== 'shape');

describe('Sink or Float', () => {
  it('always mixes floaters and sinkers, with surprises only where the level asks for them', () => {
    for (const plan of THING_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        expect(things, plan.name).toHaveLength(plan.count);
        expect(new Set(things).size).toBe(things.length);
        expect(things.some(floats)).toBe(true);
        expect(things.some((t) => !floats(t))).toBe(true);
        if (!plan.surprises) for (const t of things) expect(THINGS[t].obvious).toBe(true);
        else expect(things.some((t) => !THINGS[t].obvious)).toBe(true);
      }
    }
  });

  it('names the right basket for every thing, and every round has both baskets to show (so a demonstration sorts both ways)', () => {
    for (const plan of THING_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        const baskets = new Set(things.map(rightBasket));
        expect(baskets.size, plan.name).toBe(2);
        for (const t of things) expect(rightBasket(t) === 'float').toBe(THINGS[t].floats);
      }
    }
  });

  it('floats and sinks every thing as reviewed for plain tap water', () => {
    const reviewed: Record<string, [floats: boolean, obvious: boolean]> = {
      duck: [true, true], boat: [true, true], ball: [true, true], feather: [true, true],
      leaf: [true, false], apple: [true, false], log: [true, false], ice: [true, false],
      rock: [false, true], key: [false, true], marble: [false, true],
      coin: [false, false], spoon: [false, false], paperclip: [false, false],
    };
    expect(Object.keys(THINGS).sort()).toEqual(Object.keys(reviewed).sort());
    for (const t of ALL_THINGS) expect([THINGS[t].floats, THINGS[t].obvious], t).toEqual(reviewed[t]);
  });

  it('varies the five familiar things across rounds at levels 1 to 4, and brings every thing into play', () => {
    for (const level of [1, 2, 3, 4]) {
      const sets = new Set<string>();
      const seen = new Set<Thing>();
      for (let seed = 1; seed <= 60; seed++) {
        const things = thingsFor(sinkPlan(level), new Rng(seed));
        sets.add([...things].sort().join(','));
        for (const t of things) seen.add(t);
      }
      expect(sets.size, `level ${level}`).toBeGreaterThan(5);
      expect([...seen].sort()).toEqual(ALL_THINGS.filter((t) => THINGS[t].obvious).sort());
    }
    for (const level of [5, 6]) {
      const seen = new Set<Thing>();
      for (let seed = 1; seed <= 100; seed++) for (const t of thingsFor(sinkPlan(level), new Rng(seed))) seen.add(t);
      expect([...seen].sort(), `level ${level}`).toEqual([...ALL_THINGS].sort());
    }
  });

  it('names every thing in plain words for the voice and the journal, with an observation line for each', () => {
    expect(thingWord('ice')).toBe('ice cube');
    expect(thingWord('paperclip')).toBe('paper clip');
    expect(thingWord('log')).toBe('log');
    for (const t of ALL_THINGS) {
      expect(thingWord(t), t).toMatch(/^[a-z]+( [a-z]+)?$/);
      expect(SCRIPT[`journal.sink.${t}` as LineId], t).toBeDefined();
    }
  });

  it('makes level 7 the shape experiment, and clamps above it', () => {
    expect(SINK_PLANS).toHaveLength(7);
    expect(sinkPlan(7).mode).toBe('shape');
    expect(sinkPlan(99)).toBe(sinkPlan(7));
    for (let l = 1; l <= 6; l++) expect(sinkPlan(l).mode).not.toBe('shape');
  });

  it('floats only the hollow boat, and explains every shape with a real line', () => {
    expect(ALL_SHAPES.filter((s) => CLAY_SHAPES[s].floats)).toEqual(['boat']);
    for (const s of ALL_SHAPES) expect(SCRIPT[CLAY_SHAPES[s].line], s).toBeDefined();
    for (const id of ['sink.clay-sinks', 'sink.clay-ask', 'sink.clay-same', 'sink.clay-hint'] as const) expect(SCRIPT[id]).toBeDefined();
  });

  it('offers all three shapes in every experiment, the boat in every place over many seeds, and a new clay color each time', () => {
    const plan = sinkPlan(7);
    const boatAt = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const exps = shapesFor(plan, new Rng(seed));
      expect(exps).toHaveLength(plan.count);
      for (const e of exps) {
        expect([...e.order].sort()).toEqual([...ALL_SHAPES].sort());
        boatAt.add(e.order.indexOf('boat'));
      }
      expect(exps[0].color).not.toBe(exps[1].color);
    }
    expect([...boatAt].sort()).toEqual([0, 1, 2]);
  });
});
