import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { caught, exitFor, gatesFor, LANES, makeEggs, PLANS, targetsFor } from './logic';

describe('Egg Catch', () => {
  it('lays eggs in changing lanes, with white eggs only where asked and never three in a row', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const eggs = makeEggs(plan, new Rng(seed));
        for (const e of eggs) expect(e.lane).toBeLessThan(LANES);
        eggs.slice(1).forEach((e, i) => expect(e.lane).not.toBe(eggs[i].lane));
        const mixes = plan.mode === 'brown' || plan.mode === 'sort';
        if (!mixes) expect(eggs.every((e) => e.shell === 'brown')).toBe(true);
        eggs.slice(2).forEach((e, i) => expect(e.shell === 'white' && eggs[i].shell === 'white' && eggs[i + 1].shell === 'white').toBe(false));
        expect(eggs.filter((e) => e.shell === 'brown').length).toBeGreaterThanOrEqual(plan.eggs);
      }
    }
  });

  it('routes every exit with the gates the hint shows', () => {
    for (let exit = 0; exit < 4; exit++) {
      for (let other = 0; other < 2; other++) {
        const gates: [boolean, boolean, boolean] = [false, !!other, !!other];
        for (const { gate, right } of gatesFor(exit)) gates[gate] = right;
        expect(exitFor(gates)).toBe(exit);
      }
    }
  });

  it('keeps the basket and nest apart, and catches generously', () => {
    for (const t of targetsFor(PLANS[4], new Rng(2))) expect(t.nest).not.toBe(t.basket);
    expect(caught(100, 180)).toBe(true);
    expect(caught(100, 230)).toBe(false);
  });
});
