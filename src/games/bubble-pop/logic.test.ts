import { describe, expect, it } from 'vitest';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { DOT_NUMERAL_Y, DOT_RADIUS, numberDots, showsDots, bondNumbers, bubbleToPop, choosePalette, countRun, signFor, FRIEND_SOUND, FRIENDS, inReach, isRight, meant, PLANS, planFor, spawnTarget, staysPut, TAP_REACH, type DemoBubble } from './logic';

describe('Bubble Pop', () => {
  it('keeps every bubble a big target, and number rounds within what fits on screen', () => {
    for (const plan of PLANS) {
      expect(plan.radius[0] * TAP_REACH * 2).toBeGreaterThanOrEqual(100);
      expect(plan.radius[0]).toBeLessThanOrEqual(plan.radius[1]);
      if (plan.mode === 'count') expect(plan.goal).toBeLessThanOrEqual(plan.most);
      if (plan.mode === 'color') expect(plan.colors).toBeGreaterThanOrEqual(2);
    }
  });

  it('picks distinct colors, and always sends the asked-for color when none is showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const plan of PLANS.filter((p) => p.mode === 'color')) {
        const palette = choosePalette(rng, plan.colors);
        expect(new Set(palette).size).toBe(plan.colors);
        expect(palette.every((c) => RAINBOW.includes(c))).toBe(true);
      }
      // An errorless start, then a target whenever there is none to pop.
      expect(spawnTarget(0, true, rng)).toBe(true);
      expect(spawnTarget(1, true, rng)).toBe(true);
      for (let n = 2; n < 30; n++) expect(spawnTarget(n, false, rng)).toBe(true);
    }
    // Once one is showing, other colors arrive too.
    const rng = new Rng(7);
    const picks = Array.from({ length: 200 }, () => spawnTarget(5, true, rng));
    expect(picks.some((p) => !p)).toBe(true);
    expect(picks.some((p) => p)).toBe(true);
  });

  it('judges pops: anything in free play, the color asked for, then numbers in order', () => {
    expect(isRight('free', { color: 'red' }, null, 1)).toBe(true);
    expect(isRight('color', { color: 'red' }, 'red', 1)).toBe(true);
    expect(isRight('color', { color: 'blue' }, 'red', 1)).toBe(false);
    expect(isRight('count', { color: 'red', number: 2 }, null, 2)).toBe(true);
    expect(isRight('count', { color: 'red', number: 3 }, null, 2)).toBe(false);
  });

  it('gives an overlapping right bubble the tap instead of counting a miss', () => {
    const wrong = { color: 'blue' as const, x: 300, y: 300, r: 60 };
    const right = { color: 'red' as const, x: 360, y: 300, r: 60 };
    const far = { color: 'red' as const, x: 600, y: 300, r: 60 };
    const isRed = (b: { color: string }) => b.color === 'red';
    // A finger between the two lands on both: it meant the red one.
    expect(meant(wrong, [wrong, right, far], { x: 320, y: 300 }, isRed)).toBe(right);
    // Squarely on the blue one, nowhere near a red one: still a miss.
    expect(meant(wrong, [wrong, far], { x: 300, y: 300 }, isRed)).toBe(wrong);
    expect(meant(right, [wrong, right], { x: 330, y: 300 }, isRed)).toBe(right);
  });

  it('bonds levels give every bubble a partner that makes the total', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bonds')) {
      for (let seed = 1; seed <= 200; seed++) {
        const nums = bondNumbers(plan.sum!, plan.goal, new Rng(seed));
        expect(nums).toHaveLength(plan.goal * 2);
        // Greedy pairing always succeeds, whichever bubble is popped first.
        const left = [...nums];
        while (left.length) {
          const a = left.shift()!;
          const i = left.indexOf(plan.sum! - a);
          expect(i, `${nums}`).toBeGreaterThanOrEqual(0);
          left.splice(i, 1);
        }
        for (const n of nums) expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThan(plan.sum!);
      }
    }
  });
});

describe('bubbles she needs', () => {
  it('stay on the screen in every mode that needs a particular one', () => {
    // The next number and a partner are laid out whole at the start, so they drift in place instead of floating off.
    expect(staysPut('count')).toBe(true);
    expect(staysPut('bonds')).toBe(true);
    // Free and color bubbles rise and leave; color mode makes up for it by sending the asked-for color when none shows.
    expect(staysPut('free')).toBe(false);
    expect(staysPut('color')).toBe(false);
    for (const plan of PLANS.filter((p) => staysPut(p.mode))) {
      const bubbles = plan.mode === 'bonds' ? plan.goal * 2 : plan.goal;
      expect(bubbles, `${plan.mode} ${plan.goal}`).toBeLessThanOrEqual(plan.most);
    }
  });
});

describe('the friends in the bubbles', () => {
  it('stay exactly these seven in this order, because the sticker draws from the list', () => {
    expect([...FRIENDS]).toEqual(['duck', 'pig', 'cat', 'bunny', 'cow', 'bear', 'dog']);
  });

  it('each have an animal voice of their own to say hello with', () => {
    expect(Object.keys(FRIEND_SOUND).sort()).toEqual([...FRIENDS].sort());
    expect(new Set(Object.values(FRIEND_SOUND)).size).toBe(FRIENDS.length);
  });
});

describe('the bubble the ghost finger pops', () => {
  const at = (x: number, y: number, extra: Partial<DemoBubble> = {}): DemoBubble => ({ x, y, r: 60, color: null, ...extra });

  it('only counts a bubble whose middle is on the screen, and leaves one still below it or about to float off', () => {
    expect(inReach(at(500, 400), 1024, 768)).toBe(true);
    expect(inReach(at(500, 730), 1024, 768)).toBe(true); // rising in: its middle is showing
    expect(inReach(at(500, 790), 1024, 768)).toBe(false);
    expect(inReach(at(500, 20), 1024, 768)).toBe(false);
    expect(inReach(at(10, 400), 1024, 768)).toBe(false);
  });

  it('always chooses a right bubble when there is one, at every level, and never the rainbow', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      for (const plan of PLANS) {
        const palette = choosePalette(rng, plan.colors);
        const target = plan.mode === 'color' ? palette[0] : null;
        let shown: DemoBubble[] = [];
        let next = 1;
        // The real game keeps sending bubbles; here there are enough on the screen to finish the round.
        if (plan.mode === 'color') shown = Array.from({ length: plan.goal * plan.colors }, (_, i) => at(120 + (i % 6) * 140, 200 + i * 5, { color: palette[i % palette.length] }));
        if (plan.mode === 'free') shown = Array.from({ length: plan.goal + 2 }, (_, i) => at(120 + (i % 6) * 140, 200 + i * 6));
        if (plan.mode === 'count') shown = Array.from({ length: plan.goal }, (_, i) => at(100 + i * 80, 300, { number: i + 1 }));
        if (plan.mode === 'bonds') shown = bondNumbers(plan.sum!, plan.goal, rng).map((n, i) => at(100 + i * 90, 300, { number: n }));
        shown.push(at(500, 300, { rainbow: true, number: 99 }));
        // Pop a whole round the way the bot would, and the round must finish with no wrong tap.
        let held: DemoBubble | null = null;
        let pops = 0;
        for (let guard = 0; guard < 80 && pops < plan.goal; guard++) {
          const pick: DemoBubble | null = bubbleToPop(plan.mode, shown, target, next, plan.sum, held);
          expect(pick, `${plan.mode} seed ${seed}`).not.toBeNull();
          expect(pick!.rainbow).toBeFalsy();
          if (plan.mode === 'bonds') {
            if (!held) held = pick;
            else {
              expect(held.number! + pick!.number!).toBe(plan.sum);
              shown = shown.filter((b) => b !== held && b !== pick);
              held = null;
              pops++;
            }
            continue;
          }
          expect(isRight(plan.mode, pick!, target, next)).toBe(true);
          shown = shown.filter((b) => b !== pick);
          if (plan.mode === 'count') next++;
          pops++;
        }
        expect(pops, `${plan.mode} seed ${seed}`).toBe(plan.goal);
      }
    }
  });

  it('takes the highest settled bubble in free play, and waits when nothing right is showing', () => {
    expect(bubbleToPop('free', [at(100, 300), at(300, 600), at(500, 200)], null, 1, undefined, null)?.y).toBe(200);
    expect(bubbleToPop('free', [at(100, 300), at(500, 60)], null, 1, undefined, null)?.y).toBe(300); // one by the top edge is about to leave
    expect(bubbleToPop('color', [at(100, 300, { color: 'blue' })], 'red', 1, undefined, null)).toBeNull();
    expect(bubbleToPop('count', [at(100, 300, { number: 3 })], null, 2, undefined, null)).toBeNull();
    expect(planFor(11).mode).toBe('bonds');
  });
});

describe('quantity support', () => {
  it('shows exactly the quantity in distinct, countable dots inside the bubble below the numeral', () => {
    for (let n = 1; n <= 10; n++) {
      const dots = numberDots(n);
      expect(dots).toHaveLength(n);
      for (const dot of dots) {
        expect(Math.hypot(dot.x, dot.y) + DOT_RADIUS).toBeLessThan(0.9);
        // The unchanged 1.05-radius numeral reserves a 1.3-radius-high box.
        expect(dot.y - DOT_RADIUS).toBeGreaterThan(DOT_NUMERAL_Y + 0.65);
        for (const other of dots) if (other !== dot) expect(Math.hypot(dot.x - other.x, dot.y - other.y)).toBeGreaterThan(DOT_RADIUS * 2);
      }
      expect(numberDots(n)).toEqual(dots);
      if (n > 6) expect(dots.filter((d) => d.y === 0.49)).toHaveLength(5);
    }
    for (const n of [0, 11, -1, 1.5, NaN]) expect(numberDots(n)).toEqual([]);
  });

  it('supports the first number rounds and bonds to five, then fades without changing their rules', () => {
    expect(PLANS.map((_, i) => i + 1).filter(showsDots)).toEqual([7, 8, 10]);
    for (const level of [7, 8, 10]) {
      const plan = planFor(level);
      const numbers = plan.mode === 'count' ? Array.from({ length: plan.goal }, (_, i) => i + 1) : bondNumbers(plan.sum!, plan.goal, new Rng(4));
      for (const n of numbers) expect(numberDots(n)).toHaveLength(n);
    }
  });
});

describe('counting runs', () => {
  const counts = PLANS.map((plan, i) => ({ plan, level: i + 1 })).filter(({ plan }) => plan.mode === 'count');

  it('count levels 7 to 9 are still 1, 2, 3 … with no draw from the round\'s random numbers', () => {
    for (const { plan, level } of counts.filter((c) => c.level <= 9)) {
      const rng = new Rng(5);
      expect(countRun(plan, rng)).toEqual(Array.from({ length: plan.goal }, (_, i) => i + 1));
      expect(rng.next()).toBe(new Rng(5).next());
      expect(signFor(plan, level, countRun(plan, new Rng(1)))).toBeNull();
    }
  });

  it('level 12 starts at a number above 1 and keeps every number small enough for a pre-K player', () => {
    const plan = planFor(12);
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      expect(run[0]).toBeGreaterThanOrEqual(2);
      expect(run).toHaveLength(plan.goal);
      expect(run.every((n, i) => n === run[0] + i)).toBe(true);
      expect(Math.max(...run)).toBeLessThanOrEqual(12);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 12, run)).toEqual({ kind: 'start', n: run[0], dots: false });
    }
  });

  it('level 13 counts back one at a time and ends at 1, never below', () => {
    const plan = planFor(13);
    const seen = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      seen.add(run[0]);
      expect(run[0]).toBeGreaterThanOrEqual(4);
      expect(run.at(-1)).toBe(1);
      expect(Math.min(...run)).toBeGreaterThanOrEqual(1);
      expect(run.every((n, i) => n === run[0] - i)).toBe(true);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 13, run)).toEqual({ kind: 'back', n: run[0], dots: false });
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('level 14 counts by tens and by fives, every number a multiple of the step and two digits', () => {
    const plan = planFor(14);
    const steps = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      const step = run[1] - run[0];
      steps.add(step);
      expect(plan.steps).toContain(step);
      expect(run).toHaveLength(plan.goal);
      expect(run.every((n, i) => n % step === 0 && n === run[0] + i * step)).toBe(true);
      expect(run[0]).toBeGreaterThanOrEqual(step);
      expect(Math.max(...run)).toBeLessThanOrEqual(99);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 14, run)).toEqual({ kind: 'by', n: step, dots: false });
    }
    expect([...steps].sort((a, b) => a - b)).toEqual([5, 10]);
  });

  it('a count run is always drawn whole and stays on the screen until it is popped', () => {
    for (const { plan } of counts) expect(plan.goal).toBeLessThanOrEqual(plan.most);
    expect(staysPut('count')).toBe(true);
  });
});

describe('the sign at the top', () => {
  it('shows the total on both bonds levels, with dots only where the bubbles carry dots', () => {
    expect(signFor(planFor(10), 10, [])).toEqual({ kind: 'bond', n: 5, dots: true });
    expect(signFor(planFor(11), 11, [])).toEqual({ kind: 'bond', n: 10, dots: false });
  });

  it('is not shown for free play, colors or counting from 1', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) expect(signFor(planFor(level), level, [])).toBeNull();
  });
});
