import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { arrivalOrder, canArrive, isCross, laneCycles, LANES, MAX_WAITING, nextGreenLane, carTap, CYCLE, crossTouch, cycleFor, PHASE, VEHICLES, doneLine, GO_TARGET, hintOn, judgeGo, lightAt, nextLight, PLANS, LAMPS_LEVEL, lampRolls, nextLamp, planFor, rightNow, safe, touchCounts, type Light, type Road } from './logic';

describe('Stop and Go', () => {
  it('cycles green, yellow, red, and back, with greens and reds long enough to wait for', () => {
    expect(lightAt(0)).toBe('green');
    expect(lightAt(3.6)).toBe('yellow');
    expect(lightAt(5)).toBe('red');
    const total = CYCLE.reduce((a, c) => a + c.seconds, 0);
    expect(lightAt(total + 0.1)).toBe('green');
    for (const c of CYCLE) if (c.light !== 'yellow') expect(c.seconds).toBeGreaterThanOrEqual(3);
    expect([nextLight('green'), nextLight('yellow'), nextLight('red')]).toEqual(['yellow', 'red', 'green']);
  });

  it('seeds each round its own greens and reds, long enough to wait for and never longer than the hand waits', () => {
    const greens = new Set<number>();
    for (let seed = 1; seed <= 400; seed++) {
      const cycle = cycleFor(new Rng(seed));
      expect(cycle.map((c) => c.light)).toEqual(['green', 'yellow', 'red']);
      for (const c of cycle) {
        if (c.light === 'yellow') expect(c.seconds).toBe(PHASE.yellow);
        else {
          expect(c.seconds).toBeGreaterThanOrEqual(3);
          expect(c.seconds).toBeLessThanOrEqual(4.2);
        }
      }
      greens.add(Math.round(cycle[0].seconds * 10));
      // Any stretch without green, a yellow then a red, is shorter than the ghost hand's six-second patience.
      expect(cycle[1].seconds + cycle[2].seconds).toBeLessThan(6);
      // The same hand as below, tapping the moment green allows, still finishes the send and walk levels.
      for (const mode of ['send', 'walk'] as const) {
        const goal = PLANS.find((p) => p.mode === mode)!.goal;
        let t = 0;
        let done = 0;
        let waited = 0;
        while (done < goal && t < 120) {
          if (rightNow(mode, lightAt(t, cycle))) {
            done++;
            t += 1.4;
            waited = 0;
          } else {
            t += 1 / 60;
            waited += 1 / 60;
            expect(waited).toBeLessThan(6);
          }
        }
        expect(done).toBe(goal);
      }
    }
    // Rounds really differ: no one rhythm to learn.
    expect(greens.size).toBeGreaterThan(8);
    expect(cycleFor(new Rng(7))).toEqual(cycleFor(new Rng(7)));
  });

  it('draws six vehicles, every one reachable from the seed', () => {
    expect(VEHICLES).toHaveLength(6);
    const rng = new Rng(3);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(rng.pick(VEHICLES));
    expect(seen.size).toBe(6);
  });

  it('only counts going on red as a mistake; yellow is a nudge', () => {
    expect(judgeGo('green')).toBe('go');
    expect(judgeGo('yellow')).toBe('wait');
    expect(judgeGo('red')).toBe('stop');
    expect(safe({ ns: 'green', ew: 'red' })).toBe(true);
    expect(safe({ ns: 'green', ew: 'green' })).toBe(false);
  });

  it('sends and steps only on green, so the hand never makes the one mistake', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['toy', 'send', 'walk', 'cross', 'lanes', 'busy']);
    expect(GO_TARGET).toEqual({ lamps: 'lamp', toy: 'light', send: 'car', walk: 'step', lanes: 'car' });
    for (const light of ['green', 'yellow', 'red'] as Light[]) {
      expect(rightNow('toy', light)).toBe(true);
      for (const mode of ['send', 'walk'] as const) expect(rightNow(mode, light)).toBe(judgeGo(light) === 'go');
    }
    // A hand that taps the moment `rightNow` allows, one tap at a time and no oftener than a tap and a return take, always lands on green.
    for (const mode of ['send', 'walk'] as const) {
      const goal = PLANS.find((p) => p.mode === mode)!.goal;
      let t = 0;
      let done = 0;
      while (done < goal && t < 120) {
        if (rightNow(mode, lightAt(t))) {
          expect(judgeGo(lightAt(t))).toBe('go');
          done++;
          t += 1.4;
        } else t += 1 / 60;
      }
      expect(done).toBe(goal);
    }
    // Waiting through a yellow and a red for the next green is less than the hand's six-second patience.
    expect(CYCLE.filter((c) => c.light !== 'green').reduce((a, c) => a + c.seconds, 0)).toBeLessThan(6);
  });

  it('lets one road go at a time at the crossing until every car is through', () => {
    const goal = PLANS.find((p) => p.mode === 'cross')!.goal;
    for (const ewCars of [0, 1, 2, 3, 4, 5, 6]) {
      const waiting: Record<Road, number> = { ew: ewCars, ns: goal - ewCars };
      const lights = { ew: 'red' as Light, ns: 'red' as Light };
      let gap = 0;
      let ready = 0;
      let taps = 0;
      let through = 0;
      for (let t = 0; through < goal && t < 120; t += 0.05) {
        gap -= 0.05;
        ready -= 0.05;
        // The game rolls one waiting car a second or so on a road whose light is green, if the other is not.
        const front = safe({ ew: lights.ew, ns: lights.ns }) && gap <= 0 ? (['ew', 'ns'] as Road[]).find((r) => lights[r] === 'green' && waiting[r] > 0) : undefined;
        if (front) {
          waiting[front]--;
          through++;
          gap = 1.1;
        }
        if (ready <= 0) {
          const road = crossTouch(lights, waiting);
          if (road) {
            lights[road] = lights[road] === 'green' ? 'red' : 'green';
            ready = 1.4;
            taps++;
          }
        }
        expect(safe({ ew: lights.ew, ns: lights.ns })).toBe(true);
      }
      expect(through).toBe(goal);
      // At most one hand-over for each road after the first green.
      expect(taps).toBeLessThanOrEqual(goal);
    }
  });

  it('waits when nobody is left and turns a green road with an empty queue red only when the other road is waiting', () => {
    expect(crossTouch({ ew: 'red', ns: 'red' }, { ew: 0, ns: 0 })).toBeNull();
    expect(crossTouch({ ew: 'green', ns: 'red' }, { ew: 2, ns: 3 })).toBeNull();
    expect(crossTouch({ ew: 'green', ns: 'red' }, { ew: 0, ns: 3 })).toBe('ew');
    expect(crossTouch({ ew: 'green', ns: 'red' }, { ew: 0, ns: 0 })).toBeNull();
    expect(crossTouch({ ew: 'red', ns: 'red' }, { ew: 1, ns: 2 })).toBe('ns');
    expect(crossTouch({ ew: 'red', ns: 'red' }, { ew: 2, ns: 2 })).toBe('ew');
    expect(crossTouch({ ew: 'green', ns: 'green' }, { ew: 1, ns: 2 })).toBe('ew');
  });
});

describe('Stop and Go: every touch answers', () => {
  const lights: Light[] = ['green', 'yellow', 'red'];

  it('lets the lap car answer every touch and counts it, with nothing to get wrong', () => {
    for (const light of lights) {
      const a = carTap('toy', light, true);
      expect(a).toBe(light === 'green' ? 'drive' : 'toot');
      expect(touchCounts('toy', a)).toBe(true);
    }
    expect(touchCounts('toy', 'light')).toBe(true);
  });

  it('never counts a tap on a back car as a send or a miss', () => {
    for (const light of lights) expect(carTap('send', light, false)).toBe('toot');
    expect(lights.map((l) => carTap('send', l, true))).toEqual(['send', 'nudge', 'miss']);
    for (const a of ['send', 'nudge', 'miss', 'toot'] as const) expect(touchCounts('send', a)).toBe(false);
  });

  it('puts the hint on the thing to touch, and only on green', () => {
    expect(hintOn('send', 'green')).toBe('car');
    expect(hintOn('walk', 'green')).toBe('step');
    for (const mode of ['send', 'walk'] as const) for (const l of ['yellow', 'red'] as Light[]) expect(hintOn(mode, l)).toBeNull();
    // The hint target is what the demonstration's hand touches.
    expect(hintOn('send', 'green')).toBe(GO_TARGET.send);
    expect(hintOn('walk', 'green')).toBe(GO_TARGET.walk);
    expect(hintOn('toy', 'green')).toBeNull();
    expect(hintOn('cross', 'green')).toBeNull();
  });

  it('ends the walk at the flag, not with the cars', () => {
    expect(doneLine('walk')).toBe('go.done.walk');
    for (const m of ['toy', 'send', 'cross'] as const) expect(doneLine(m)).toBe('go.done');
  });

  it('lap level 9 is two lamps and a looping car where every touch counts and nothing can be missed', () => {
    const plan = planFor(LAMPS_LEVEL);
    expect(plan.mode).toBe('lamps');
    expect(plan.goal).toBe(8);
    // Levels 1–4 keep their plans.
    expect([1, 2, 3, 4].map((l) => planFor(l).mode)).toEqual(['toy', 'send', 'walk', 'cross']);
    for (const light of ['green', 'yellow', 'red'] as Light[]) {
      expect(carTap('lamps', light, true)).toBe('toot');
      expect(touchCounts('lamps', 'toot')).toBe(true);
      expect(rightNow('lamps', light)).toBe(true);
    }
    expect(touchCounts('lamps', 'light')).toBe(true);
    expect(lampRolls('green')).toBe(true);
    expect(lampRolls('red')).toBe(false);
    // A bot that always taps the other lamp shows both, and finishes in exactly the goal's touches.
    let rolling = false;
    const seen = new Set<string>();
    for (let i = 0; i < plan.goal; i++) {
      const lamp = nextLamp(rolling);
      seen.add(lamp);
      rolling = lampRolls(lamp);
    }
    expect([...seen].sort()).toEqual(['green', 'red']);
  });
});

describe('Stop and Go: whose light and the busy crossing', () => {
  it('adds the two levels on top of the crossing', () => {
    expect(planFor(5).mode).toBe('lanes');
    expect(planFor(6).mode).toBe('busy');
    expect([planFor(4), planFor(6)].map((p) => isCross(p.mode))).toEqual([true, true]);
  });

  it('gives each lane its own light, with a green within six seconds from any moment and both red at some moment of every cycle', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const c = laneCycles(new Rng(seed));
      const total = (l: 'car' | 'bike') => c[l].reduce((a, x) => a + x.seconds, 0);
      expect(total('car')).toBeCloseTo(total('bike'), 6);
      let bothRed = false;
      let carGreen = 0;
      let bikeGreen = 0;
      for (let t = 0; t < total('car') * 2; t += 0.05) {
        const [a, b] = [lightAt(t, c.car), lightAt(t, c.bike)];
        if (a === 'red' && b === 'red') bothRed = true;
        if (a === 'green') carGreen++;
        if (b === 'green') bikeGreen++;
        expect(a === 'green' && b === 'green').toBe(false);
        // From here one of the two lights is green now or turns green soon.
        let wait = 0;
        while (lightAt(t + wait, c.car) !== 'green' && lightAt(t + wait, c.bike) !== 'green') wait += 0.05;
        expect(wait).toBeLessThan(6);
      }
      expect(bothRed).toBe(true);
      expect(carGreen).toBeGreaterThan(0);
      expect(bikeGreen).toBeGreaterThan(0);
    }
  });

  it('judges a send by its own lane\'s light alone, and the hand picks a lane that is green', () => {
    expect(carTap('lanes', 'green', true)).toBe('send');
    expect(carTap('lanes', 'red', true)).toBe('miss');
    expect(carTap('lanes', 'yellow', true)).toBe('nudge');
    expect(carTap('lanes', 'red', false)).toBe('toot');
    for (let seed = 1; seed <= 100; seed++) {
      const c = laneCycles(new Rng(seed));
      for (let t = 0; t < 30; t += 0.7) {
        const lane = nextGreenLane(c, t);
        let w = 0;
        while (lightAt(t + w, c[lane]) !== 'green') w += 0.05;
        // No other lane turns green sooner than the one chosen.
        for (const other of LANES) {
          let o = 0;
          while (lightAt(t + o, c[other]) !== 'green') o += 0.05;
          expect(w).toBeLessThanOrEqual(o + 1e-9);
        }
      }
    }
  });

  it('finishes every seeded arrival order with no unsafe state, never more than three waiting, and at least two hand-overs', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const rng = new Rng(seed);
      const order = arrivalOrder(rng, 8);
      expect(order.filter((r) => r === 'ew')).toHaveLength(4);
      let lights = { ew: 'red' as Light, ns: 'red' as Light };
      const waiting: Record<Road, number> = { ew: 0, ns: 0 };
      let arrived = 0;
      let done = 0;
      let nextIn = 1;
      let gap = 0;
      let handOvers = 0;
      let last: Road | null = null;
      for (let t = 0; t < 400 && done < 8; t += 0.1) {
        nextIn -= 0.1;
        if (arrived < 8 && nextIn <= 0) {
          if (canArrive(waiting, order[arrived])) {
            waiting[order[arrived++]]++;
            nextIn = rng.range(1.6, 2.8);
          } else nextIn = 0.5;
        }
        // The bot taps a light every 0.5 s at most.
        if (Math.round(t * 10) % 5 === 0) {
          const road = crossTouch(lights, waiting);
          if (road) {
            lights = { ...lights, [road]: lights[road] === 'green' ? 'red' : 'green' };
            if (lights[road] === 'green' && road !== last) {
              handOvers++;
              last = road;
            }
          }
        }
        expect(safe(lights)).toBe(true);
        gap -= 0.1;
        for (const road of ['ew', 'ns'] as Road[]) {
          if (lights[road] === 'green' && waiting[road] > 0 && gap <= 0) {
            waiting[road]--;
            done++;
            gap = 1.1;
            break;
          }
        }
        expect(Math.max(waiting.ew, waiting.ns)).toBeLessThanOrEqual(MAX_WAITING);
      }
      expect(done).toBe(8);
      expect(handOvers).toBeGreaterThanOrEqual(2);
    }
  });
});
