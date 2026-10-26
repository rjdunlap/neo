import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  askRank, BIG_LITTLE, BIG_LITTLE_ASKS, CRITTER_H, CYCLE, CYCLE_SCALE, CYCLE_TAPS, cycleAt, dealSteps, dropSpot, FLAG_COLORS, FRIEND_SCALE, FRIENDS, middleAsks, MIDDLE_ONE, MIN_RATIO, paradeLayout,
  pickRounds, SIZE_CYCLE, SIZE_PLANS, sizeBell, sizeOrder, sizePlan, sizeScale, sizeTouch, sizeWord, stepBell, STEPS, stepScale, TARGET, TWO_IN_A_LINE,
} from './logic';

/** An iPad sideways and upright, and a phone sideways: the logical width is never below the 1024 design width. */
const VIEWS = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390)];

describe('Size Parade', () => {
  it('orders ranks from smallest or biggest, and bigger ranks are bigger', () => {
    expect(sizeOrder(3, 'small')).toEqual([0, 1, 2]);
    expect(sizeOrder(3, 'big')).toEqual([2, 1, 0]);
    for (let n = 2; n <= 5; n++) for (let r = 1; r < n; r++) expect(sizeScale(r, n)).toBeGreaterThan(sizeScale(r - 1, n));
  });

  it('the ghost finger finds the biggest or smallest friend, and lines every level up in order, touching no wrong friend', () => {
    for (const plan of SIZE_PLANS) {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed);
        const order = sizeOrder(plan.count, plan.order);
        // The friends in the row are shuffled; the pick levels deal four of them, the line levels one row.
        const rows = plan.mode === 'pick' ? 4 : 1;
        for (let row = 0; row < rows; row++) {
          const friends = rng.shuffle([...order]).map((rank) => ({ rank, placed: false }));
          let step = 0;
          while (step < (plan.mode === 'pick' ? 1 : order.length)) {
            const i = sizeTouch(order, step, friends);
            expect(i, `${plan.name}: a friend to touch`).not.toBeNull();
            expect(friends[i!].rank, 'the right size').toBe(order[step]);
            expect(friends[i!].placed).toBe(false);
            if (plan.mode === 'line') friends[i!].placed = true;
            step++;
          }
        }
      }
    }
  });

  it('asks for bigger or smaller between two friends, biggest or smallest among more', () => {
    for (const plan of SIZE_PLANS) {
      const word = sizeWord(plan);
      if (plan.count === 2) expect(word).toBe(plan.order === 'big' ? 'bigger' : 'smaller');
      else expect(word).toBe(plan.order === 'big' ? 'biggest' : 'smallest');
    }
  });

  it('chimes the biggest friend lowest, on steps that fall as size rises', () => {
    for (let n = 2; n <= 5; n++) {
      for (let r = 1; r < n; r++) expect(sizeBell(r, n)).toBeLessThan(sizeBell(r - 1, n));
      expect(sizeBell(0, n)).toBe(9);
      expect(sizeBell(n - 1, n)).toBe(5);
    }
  });

  it('pins the size steps: neighbours differ by at least 18 units, and the smallest friend keeps a full target', () => {
    for (const plan of SIZE_PLANS) {
      const h = (r: number) => sizeScale(r, plan.count) * FRIEND_SCALE * CRITTER_H;
      for (let r = 1; r < plan.count; r++) expect(h(r) - h(r - 1), plan.name).toBeGreaterThanOrEqual(18);
      expect(h(0)).toBeGreaterThan(55);
    }
    expect(TARGET.w).toBeGreaterThanOrEqual(100);
    expect(TARGET.h).toBeGreaterThanOrEqual(100);
  });

  it('lays every row out without overlapping targets, each at least 100 wide, and keeps the line spots apart', () => {
    for (const v of VIEWS) {
      expect(v.w).toBeGreaterThanOrEqual(1024);
      for (const plan of SIZE_PLANS) {
        const slots = plan.mode === 'line' ? plan.count : 0;
        const { friends, targetW, spots } = paradeLayout(plan.count, slots, v.w);
        expect(targetW, plan.name).toBeGreaterThanOrEqual(100);
        for (let i = 1; i < friends.length; i++) expect(friends[i] - friends[i - 1], plan.name).toBeGreaterThanOrEqual(targetW);
        expect(friends[0] - targetW / 2).toBeGreaterThanOrEqual(80);
        expect(friends[friends.length - 1] + targetW / 2).toBeLessThanOrEqual(v.w);
        for (let i = 1; i < spots.length; i++) expect(spots[i] - spots[i - 1]).toBeGreaterThanOrEqual(132);
      }
    }
  });

  it('takes a drop near the glowing spot as generously as before, and names another spot rather than counting it', () => {
    const { spots } = paradeLayout(5, 5, 1024), y = 300;
    for (let glowing = 0; glowing < 5; glowing++) {
      expect(dropSpot(spots[glowing], y, spots, y, glowing)).toBe(glowing);
      expect(dropSpot(spots[glowing] + 80, y + 90, spots, y, glowing)).toBe(glowing);
      for (let other = 0; other < 5; other++) if (Math.abs(other - glowing) > 1) expect(dropSpot(spots[other], y, spots, y, glowing)).toBe(other);
    }
    expect(dropSpot(spots[2], y + 200, spots, y, 2)).toBeNull();
    expect(dropSpot(spots[4] + 200, y, spots, y, 0)).toBeNull();
  });

  it('level 17 lines two friends up, smaller first, and the bot can do it; level 10 asks for the middle at least twice in four rows', () => {
    expect(sizePlan(17)).toBe(TWO_IN_A_LINE);
    expect(sizePlan(10)).toBe(MIDDLE_ONE);
    expect(sizePlan(4).count).toBe(4);
    const order = sizeOrder(2, 'small'), friends = [{ rank: 1, placed: false }, { rank: 0, placed: false }];
    expect(friends[sizeTouch(order, 0, friends)!].rank).toBe(0);
    friends[1].placed = true;
    expect(friends[sizeTouch(order, 1, friends)!].rank).toBe(1);
    for (let seed = 1; seed <= 200; seed++) {
      const asks = middleAsks(new Rng(seed));
      expect(asks).toHaveLength(4);
      expect(asks.filter((a) => a === 'middle').length).toBeGreaterThanOrEqual(2);
      expect(asks.some((a) => a !== 'middle')).toBe(true);
      for (const a of asks) expect([0, 1, 2]).toContain(askRank(a));
    }
    expect(askRank('middle')).toBe(1);
    expect(sizeWord(MIDDLE_ONE, 'middle')).toBe('middle-sized');
  });

  it('deals the even spread to every line level and a pick level’s first row, then varied steps that keep a fair ratio', () => {
    const gameH = (step: number) => stepScale(step) * FRIEND_SCALE * CRITTER_H;
    for (const plan of [...SIZE_PLANS, TWO_IN_A_LINE, MIDDLE_ONE, BIG_LITTLE]) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        for (let row = 0; row < 4; row++) {
          const steps = dealSteps(rng, plan, row);
          expect(steps, plan.name).toHaveLength(plan.count);
          // Littlest first, every step distinct and on the five-step scale, so rank still means size and neighbours differ by at least 18 units.
          for (let r = 1; r < plan.count; r++) { expect(steps[r], plan.name).toBeGreaterThan(steps[r - 1]); expect(gameH(steps[r]) - gameH(steps[r - 1])).toBeGreaterThanOrEqual(18); }
          for (const st of steps) expect(st).toBeGreaterThanOrEqual(0), expect(st).toBeLessThan(STEPS);
          if (plan.mode === 'line' || row === 0 || plan.bigLittle) { expect(steps[0]).toBe(0); expect(steps[plan.count - 1]).toBe(STEPS - 1); }
          // Two friends stay at least two steps apart, a ratio of at least 1.4; the first row's 2.4 needs no adult.
          if (plan.count === 2) expect(stepScale(steps[1]) / stepScale(steps[0])).toBeGreaterThanOrEqual(1.4);
          // In a varied pick row the asked friend is never a near call against its neighbours.
          if (plan.mode === 'pick' && row > 0) { const asked = plan.order === 'small' ? 0 : plan.count - 1, ratio = (a: number, b: number) => Math.max(stepScale(a), stepScale(b)) / Math.min(stepScale(a), stepScale(b));
          for (const n of [asked - 1, asked + 1]) if (steps[n] !== undefined) expect(ratio(steps[n], steps[asked]), plan.name).toBeGreaterThanOrEqual(MIN_RATIO); }
          if (plan.count === 2 && row === 0) expect(stepScale(steps[1]) / stepScale(steps[0])).toBeCloseTo(2.38, 1);
        }
      }
    }
    // Later rows do vary at the pick levels, and the middle one of level 10 keeps both neighbours a fair step away.
    for (const plan of [SIZE_PLANS[0], SIZE_PLANS[2], SIZE_PLANS[3]]) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 30; seed++) seen.add(dealSteps(new Rng(seed), plan, 1).join(','));
      expect(seen.size, plan.name).toBeGreaterThan(1);
    }
    for (let seed = 1; seed <= 40; seed++) {
      const steps = dealSteps(new Rng(seed), MIDDLE_ONE, 1, 1);
      expect(steps).toHaveLength(3);
      for (const n of [0, 2]) expect(Math.max(stepScale(steps[n]), stepScale(steps[1])) / Math.min(stepScale(steps[n]), stepScale(steps[1]))).toBeGreaterThanOrEqual(MIN_RATIO);
    }
    expect(FRIENDS).toHaveLength(8);
    expect(new Set(FRIENDS).size).toBe(8);
    expect(new Set(FLAG_COLORS).size).toBe(FLAG_COLORS.length);
    for (let st = 1; st < STEPS; st++) expect(stepBell(st)).toBeLessThan(stepBell(st - 1));
    expect(sizeBell(0, 5)).toBe(stepBell(0));
  });

  it('level 16 cycles one friend through three sizes and back, ending after a bounded number of taps, big enough to see and small enough to touch', () => {
    expect(sizePlan(16)).toBe(SIZE_CYCLE);
    expect(cycleAt(0)).toEqual({ step: 0, word: null });
    const steps = [0], words: string[] = [];
    for (let t = 1; t <= CYCLE.length; t++) { const c = cycleAt(t); steps.push(c.step); words.push(c.word!); }
    expect(steps).toEqual([0, 2, 4, 2, 0]);
    expect(words).toEqual(['bigger', 'biggest', 'smaller', 'littlest']);
    expect(new Set(steps).size).toBe(3);
    expect(CYCLE_TAPS).toBe(12);
    for (let t = 1; t <= CYCLE_TAPS; t++) expect(cycleAt(t)).toEqual(cycleAt(((t - 1) % CYCLE.length) + 1));
    const h = (step: number) => stepScale(step) * FRIEND_SCALE * CYCLE_SCALE * CRITTER_H;
    // The littlest keeps a full target; the biggest, standing 90 from the bottom, keeps its head below the cue strip in a sideways iPad view.
    expect(h(0)).toBeGreaterThanOrEqual(100);
    expect(TARGET.w).toBeGreaterThanOrEqual(100);
    for (const v of VIEWS) expect(v.h - 90 - h(4)).toBeGreaterThanOrEqual(150);
  });

  it('level 9 asks for the big one, then the little one, then the big one, at a 2.4 ratio, far apart, and the bot finds each', () => {
    expect(sizePlan(9)).toBe(BIG_LITTLE);
    expect(pickRounds(BIG_LITTLE)).toBe(3);
    expect(pickRounds(SIZE_PLANS[0])).toBe(4);
    expect(BIG_LITTLE_ASKS).toEqual(['big', 'small', 'big']);
    for (let i = 1; i < BIG_LITTLE_ASKS.length; i++) expect(BIG_LITTLE_ASKS[i]).not.toBe(BIG_LITTLE_ASKS[i - 1]);
    expect(askRank('big', 2)).toBe(1);
    expect(askRank('small', 2)).toBe(0);
    expect(askRank('big')).toBe(2);
    expect(sizeWord(BIG_LITTLE, 'big')).toBe('big');
    expect(sizeWord(BIG_LITTLE, 'small')).toBe('little');
    const steps = dealSteps(new Rng(3), BIG_LITTLE, 1);
    expect(stepScale(steps[1]) / stepScale(steps[0])).toBeGreaterThanOrEqual(2);
    for (const v of VIEWS) {
      const { friends, targetW } = paradeLayout(2, 0, v.w, 420);
      expect(friends[1] - friends[0]).toBeGreaterThanOrEqual(400);
      expect(targetW).toBeGreaterThanOrEqual(100);
      expect(friends[0] - targetW / 2).toBeGreaterThanOrEqual(165);
      expect(friends[1] + targetW / 2).toBeLessThanOrEqual(v.w);
    }
    for (const ask of BIG_LITTLE_ASKS) {
      const order = [askRank(ask, 2)], friends = [{ rank: 1, placed: false }, { rank: 0, placed: false }];
      expect(friends[sizeTouch(order, 0, friends)!].rank).toBe(ask === 'big' ? 1 : 0);
    }
  });
});
