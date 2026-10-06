import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { complete, extras, missing, MUNCH_PLANS, munchRounds, numberChoices, orderWords, TRAY_MAX, wantsMore } from './logic';

describe('Monster Munch rounds', () => {
  it('always put enough food on a tray that stays small enough to grab', () => {
    for (const plan of MUNCH_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = munchRounds(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.rounds);
        for (const r of rounds) {
          const total = r.tray.cookie + r.tray.apple;
          expect(total, plan.name).toBeLessThanOrEqual(TRAY_MAX);
          // Every monster's order can be met from the tray.
          expect(r.tray.cookie).toBeGreaterThanOrEqual(r.want.cookie * r.monsters);
          expect(r.tray.apple).toBeGreaterThanOrEqual(r.want.apple * r.monsters);
          if (plan.mode === 'exact' || plan.mode === 'two') {
            expect(r.want.cookie).toBeGreaterThanOrEqual(plan.min);
            expect(r.want.cookie).toBeLessThanOrEqual(plan.max);
            // Spare food, so stopping at the right number is a real choice.
            expect(r.tray.cookie).toBeGreaterThan(r.want.cookie);
          }
          if (plan.mode === 'share') expect(r.tray.cookie).toBe(r.want.cookie * r.monsters);
        }
        if (plan.mode === 'exact') rounds.slice(1).forEach((r, i) => expect(r.want.cookie).not.toBe(rounds[i].want.cookie));
      }
    }
  });

  it('checks orders, refusals and fair shares', () => {
    const want = { cookie: 2, apple: 1 };
    expect(complete(want, { cookie: 2, apple: 1 })).toBe(true);
    expect(complete(want, { cookie: 2, apple: 0 })).toBe(false);
    expect(missing(want, { cookie: 1, apple: 1 })).toEqual({ cookie: 1, apple: 0 });
    expect(wantsMore(want, { cookie: 2, apple: 0 }, 'cookie')).toBe(false);
    expect(wantsMore(want, { cookie: 2, apple: 0 }, 'apple')).toBe(true);
    expect(extras([3, 1, 2], 2)).toEqual([1, 0, 0]);
    expect(extras([2, 2], 2)).toEqual([0, 0]);
  });

  it('offers three different number choices including the answer', () => {
    for (let answer = 1; answer <= 9; answer++) {
      for (let seed = 1; seed <= 20; seed++) {
        const choices = numberChoices(answer, new Rng(seed));
        expect(choices).toHaveLength(3);
        expect(new Set(choices).size).toBe(3);
        expect(choices).toContain(answer);
        for (const c of choices) expect(c >= 1 && c <= 10).toBe(true);
      }
    }
  });

  it('says orders in plain words', () => {
    expect(orderWords({ cookie: 1, apple: 0 })).toBe('1 cookie');
    expect(orderWords({ cookie: 2, apple: 1 })).toBe('2 cookies and 1 apple');
    expect(orderWords({ cookie: 0, apple: 2 }, true)).toBe('2 more apples');
  });

  it('leftover rounds never share evenly, leave fewer cookies than monsters, and fit the tray', () => {
    const plan = MUNCH_PLANS.find((p) => p.mode === 'leftover')!;
    for (let seed = 1; seed <= 200; seed++) {
      for (const r of munchRounds(plan, new Rng(seed))) {
        expect(r.left).toBeGreaterThanOrEqual(1);
        expect(r.left).toBeLessThan(r.monsters);
        expect(r.tray.cookie).toBe(r.want.cookie * r.monsters + r.left!);
        expect(r.tray.cookie).toBeLessThanOrEqual(TRAY_MAX);
        expect(r.want.cookie).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
