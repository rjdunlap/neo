import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { complete, extras, missing, MUNCH_PLANS, munchRounds, munchTouch, numberChoices, orderWords, TRAY_MAX, wantsMore, type Food, type MunchTable, type Order } from './logic';

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
  it("the ghost finger plays every round of every level with no refusal, a fair share, the bell only when the order is right, and the right numbers", () => {
    for (const plan of MUNCH_PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const rounds = munchRounds(plan, rng);
        for (const r of rounds) {
          const foods: Food[] = [...Array<Food>(r.tray.cookie).fill('cookie'), ...Array<Food>(r.tray.apple).fill('apple')];
          const t: MunchTable = {
            want: r.want,
            left: r.left,
            snacks: rng.shuffle(foods).map((food) => ({ food, eaten: false })),
            fed: Array.from({ length: r.monsters }, (): Order => ({ cookie: 0, apple: 0 })),
            pads: [],
            asking: 'each',
          };
          let won = false;
          for (let step = 0; step < 40 && !won; step++) {
            const move = munchTouch(plan, t);
            expect(move, `${plan.mode} seed ${seed}: a touch to make (step ${step})`).not.toBeNull();
            if (move === 'bell') {
              if (plan.mode === 'leftover') {
                // The game's own judgment: even shares and fewer left than monsters, so the pads come.
                const counts = t.fed.map((f) => f.cookie);
                expect(counts.every((c) => c === counts[0]), 'even shares').toBe(true);
                expect(t.snacks.filter((x) => !x.eaten).length, 'fewer left than monsters').toBeLessThan(r.monsters);
                t.pads = numberChoices(r.want.cookie, rng);
              } else {
                expect(['exact', 'two']).toContain(plan.mode);
                expect(complete(r.want, t.fed[0]), 'the bell rings on exactly the order').toBe(true);
                won = true;
              }
            } else if ('pad' in move!) {
              const answer = plan.mode === 'leftover' && t.asking === 'left' ? r.left : r.want.cookie;
              expect(move.pad, 'the right number').toBe(answer);
              expect(t.pads).toContain(move.pad);
              if (plan.mode === 'leftover' && t.asking === 'each') {
                t.asking = 'left';
                t.pads = numberChoices(r.left!, rng);
              } else won = true;
            } else if ('tap' in move!) {
              expect(plan.mode).toBe('tap');
              expect(t.snacks[move.tap].eaten).toBe(false);
              t.snacks[move.tap].eaten = true;
              if (t.snacks.every((x) => x.eaten)) won = true;
            } else {
              const snack = t.snacks[move!.give];
              expect(snack.eaten).toBe(false);
              // The game refuses a food a monster already has enough of (and, when giving one each, a second cookie).
              expect(wantsMore(r.want, t.fed[move!.to], snack.food), `${plan.mode}: the monster still wants ${snack.food}`).toBe(true);
              snack.eaten = true;
              t.fed[move!.to][snack.food]++;
              if (plan.mode === 'count' && t.snacks.every((x) => x.eaten)) won = true;
              if (plan.mode === 'each' && t.fed.every((f) => f.cookie >= r.want.cookie)) won = true;
              if (plan.mode === 'share' && t.snacks.every((x) => x.eaten)) {
                expect(extras(t.fed.map((f) => f.cookie), r.want.cookie).every((n) => n === 0), 'a fair share').toBe(true);
                t.pads = numberChoices(r.want.cookie, rng);
              }
            }
          }
          expect(won, `${plan.mode} seed ${seed}: the round is won`).toBe(true);
        }
      }
    }
  });
});
