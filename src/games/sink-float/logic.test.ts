import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { ALL_SHAPES, CLAY_SHAPES, floats, rightBasket, shapesFor, SINK_PLANS, sinkPlan, THINGS, thingsFor } from './logic';

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

  it('draws the same things for levels 1 to 6 as before Make it float (clay stays out of the pools)', () => {
    const draw = (level: number) => [1, 2, 3].map((seed) => thingsFor(sinkPlan(level), new Rng(seed)).join(','));
    for (const level of [1, 2, 3, 4]) expect(draw(level)).toEqual(['key,ball,boat,duck,rock', 'ball,key,duck,boat,rock', 'ball,key,boat,duck,rock']);
    for (const level of [5, 6]) expect(draw(level)).toEqual(['coin,ball,key,boat,apple,spoon', 'rock,duck,spoon,coin,apple,leaf', 'ball,rock,apple,boat,spoon,coin']);
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
