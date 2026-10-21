import { describe, expect, it } from 'vitest';
import { carTap, CYCLE, crossTouch, doneLine, GO_TARGET, hintOn, judgeGo, lightAt, nextLight, PLANS, rightNow, safe, touchCounts, type Light, type Road } from './logic';

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

  it('only counts going on red as a mistake; yellow is a nudge', () => {
    expect(judgeGo('green')).toBe('go');
    expect(judgeGo('yellow')).toBe('wait');
    expect(judgeGo('red')).toBe('stop');
    expect(safe({ ns: 'green', ew: 'red' })).toBe(true);
    expect(safe({ ns: 'green', ew: 'green' })).toBe(false);
  });

  it('sends and steps only on green, so the hand never makes the one mistake', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['toy', 'send', 'walk', 'cross']);
    expect(GO_TARGET).toEqual({ toy: 'light', send: 'car', walk: 'step' });
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
});
