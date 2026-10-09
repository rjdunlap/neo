import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import { basketMove, caught, exitFor, exitWanted, gatesFor, gateToFlip, LANES, makeEggs, PLANS, targetsFor, predictGates, type EggInAir } from './logic';

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

  it('predict levels set the gates so the egg lands somewhere new each time', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const gs = predictGates(new Rng(seed), 8);
      gs.slice(1).forEach((g, i) => expect(exitFor(g)).not.toBe(exitFor(gs[i])));
    }
  });

  it("sets the gates for the ghost finger's egg: only flips that matter, none for a gate the egg has gone by, and the egg ends at the exit asked for", () => {
    for (const exit of [0, 1, 2, 3]) {
      for (let bits = 0; bits < 8; bits++) {
        const gates = [!!(bits & 1), !!(bits & 2), !!(bits & 4)];
        for (let passed = 0; passed <= 2; passed++) {
          const g = [...gates];
          const flipped: number[] = [];
          for (let gate = gateToFlip(g, exit, passed); gate !== null; gate = gateToFlip(g, exit, passed)) {
            expect(flipped.length).toBeLessThan(2);
            // Never the gate the egg has already gone by (gate 0 is first; the branch gate second).
            if (passed >= 1) expect(gate).not.toBe(0);
            flipped.push(gate);
            g[gate] = !g[gate];
          }
          // With nothing passed the egg reaches the exit; with the first gate passed, the exit the first gate and the branch give.
          if (passed === 0) expect(exitFor(g as [boolean, boolean, boolean])).toBe(exit);
          if (passed === 2) expect(flipped).toEqual([]);
        }
      }
    }
    expect(exitWanted('sort', 'white', { basket: 1, nest: 3 })).toBe(3);
    expect(exitWanted('sort', 'brown', { basket: 1, nest: 3 })).toBe(1);
    expect(exitWanted('route', 'white', { basket: 1, nest: 3 })).toBe(1);
  });

  it('slides the basket under brown eggs and away from white ones, never undoing the egg that lands first', () => {
    const lanes = spread(LANES, 230, 1024 - 110, 190);
    const at = (lane: number, shell: 'brown' | 'white'): EggInAir => ({ x: lanes[lane], shell });
    expect(basketMove([at(2, 'brown')], lanes[1], lanes)).toBe(lanes[2]);
    expect(basketMove([at(1, 'brown')], lanes[1], lanes)).toBeNull();
    // A white egg over the basket: step aside, to the nearest clear lane.
    const aside = basketMove([at(1, 'white')], lanes[1], lanes);
    expect(aside).not.toBeNull();
    expect(Math.abs(aside! - lanes[1])).toBeGreaterThan(125);
    // Behind a white egg, a brown one: go straight to its lane.
    expect(basketMove([at(1, 'white'), at(3, 'brown')], lanes[1], lanes)).toBe(lanes[3]);
    // Under a brown egg, with another brown one coming: wait until the first has landed.
    expect(basketMove([at(1, 'brown'), at(3, 'brown')], lanes[1], lanes)).toBeNull();
    expect(basketMove([at(3, 'brown')], lanes[1], lanes)).toBe(lanes[3]);
    // A slide that would pass through the lane of a white egg about to land waits for it.
    expect(basketMove([at(2, 'white'), at(3, 'brown')], lanes[0], lanes)).toBeNull();
    expect(basketMove([at(2, 'white'), at(3, 'brown')], lanes[3], lanes)).toBeNull();
    // Never moves under a white egg, wherever the basket starts and whatever follows.
    for (let a = 0; a < LANES; a++) {
      for (let b = 0; b < LANES; b++) {
        for (let c = 0; c < LANES; c++) {
          for (const shells of [['white', 'brown'], ['brown', 'white'], ['white', 'white']] as const) {
            if (a === b) continue;
            const air = [at(a, shells[0]), at(b, shells[1])];
            const x = basketMove(air, lanes[c], lanes);
            if (x === null) continue;
            // It only moves if the basket was wrong for some egg, and the new place is right for every egg up to that one.
            const k = air.findIndex((e) => (e.shell === 'brown' ? Math.abs(lanes[c] - e.x) > 38 : Math.abs(lanes[c] - e.x) <= 125));
            expect(k).toBeGreaterThanOrEqual(0);
            for (const e of air.slice(0, k + 1)) expect(e.shell === 'brown' ? Math.abs(x - e.x) <= 38 : Math.abs(x - e.x) > 125).toBe(true);
          }
        }
      }
    }
  });

  it("plays the catching levels with the ghost finger's timing: a tap takes at least 0.45 s to arrive, the basket slides at 900 a second, and no brown egg is missed and no white one caught", () => {
    const lanes = spread(LANES, 230, 1024 - 110, 190);
    for (const plan of PLANS.filter((p) => p.mode === 'catch' || p.mode === 'brown')) {
      for (let seed = 1; seed <= 200; seed++) {
        const eggs = makeEggs(plan, new Rng(seed));
        const air: { lane: number; shell: 'brown' | 'white'; t: number }[] = [];
        let basket = lanes[1];
        let target = basket;
        let finger = lanes[1] + 90;
        let free = 0;
        let down: { at: number; x: number } | null = null;
        let spawn = 1.2;
        let next = 0;
        let got = 0;
        const dt = 1 / 60;
        for (let t = 0; got < plan.eggs && t < 120; t += dt) {
          if (down && t >= down.at) {
            target = down.x;
            down = null;
          }
          if (t >= free && !down) {
            const x = basketMove(air.map((e) => ({ x: lanes[e.lane], shell: e.shell })), target, lanes);
            if (x !== null) {
              const travel = Math.min(0.95, Math.max(0.45, Math.abs(x - finger) / 560));
              down = { at: t + travel, x };
              finger = x;
              // The press, the lift and the rest after a tap (pause 0.2).
              free = t + travel + 0.22 + 0.2 + 0.2;
            }
          }
          basket += Math.sign(target - basket) * Math.min(Math.abs(target - basket), 900 * dt);
          spawn -= dt;
          if (spawn <= 0 && air.length < (plan.mode === 'brown' ? 2 : 1)) {
            const e = eggs[next++];
            air.push({ lane: e.lane, shell: e.shell, t: 0 });
            spawn = plan.mode === 'brown' ? 1.8 : 1.2;
          }
          for (const e of air) e.t += dt / plan.fall;
          while (air.length && air[0].t >= 1) {
            const e = air.shift()!;
            const inBasket = caught(lanes[e.lane], basket);
            if (e.shell === 'brown') {
              expect(inBasket, `${plan.mode} seed ${seed}: a brown egg landed in the hay at ${t.toFixed(1)} s`).toBe(true);
              got++;
            } else expect(inBasket, `${plan.mode} seed ${seed}: a white egg landed in the basket at ${t.toFixed(1)} s`).toBe(false);
          }
        }
        expect(got).toBe(plan.eggs);
      }
    }
  });
});
