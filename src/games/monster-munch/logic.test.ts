import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { isTapMode, complete, extras, missing, MUNCH_PLANS, munchHint, munchRounds, munchTouch, numberChoices, orderWords, TRAY_MAX, wantsMore, type Food, type MunchTable, type Order } from './logic';

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

  it('plays two rounds at the tapping levels, a short one first', () => {
    const counts = (level: number) => munchRounds(MUNCH_PLANS[level - 1], new Rng(3)).map((r) => [r.want.cookie, r.tray.cookie]);
    expect(counts(1)).toEqual([[4, 4], [6, 6]]);
    expect(counts(2)).toEqual([[3, 3], [5, 5]]);
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
            // The glow (and its spoken line) points at the kind of thing the next useful touch is.
            const hint = munchHint(plan, t);
            if (isTapMode(plan.mode) || plan.mode === 'count') expect(hint).toBeNull();
            else {
              const kind = move === 'bell' ? 'bell' : 'pad' in move! ? 'pad' : plan.mode === 'exact' || plan.mode === 'two' ? 'food' : 'monster';
              expect(hint, `${plan.mode} seed ${seed} step ${step}`).toBe(kind);
            }
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
              expect(isTapMode(plan.mode)).toBe(true);
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
              if ((plan.mode === 'each' || plan.mode === 'eachkind') && t.fed.every((f) => complete(r.want, f))) won = true;
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

describe('Monster Munch big bites and one of each', () => {
  const big = MUNCH_PLANS[8];
  const kinds = MUNCH_PLANS[9];

  it('serves three big cookies to one monster in two rounds, with nothing to get wrong', () => {
    expect(isTapMode(big.mode)).toBe(true);
    const rounds = munchRounds(big, new Rng(2));
    expect(rounds.map((r) => [r.monsters, r.tray.cookie, r.tray.apple])).toEqual([[1, 3, 0], [1, 3, 0]]);
    expect(munchHint(big, { want: rounds[0].want, snacks: [], fed: [{ cookie: 0, apple: 0 }], pads: [], asking: 'each' })).toBeNull();
  });

  it('puts one spare of each food on the tray, and the bot gives every monster one of each', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const r of munchRounds(kinds, new Rng(seed))) {
        expect(r.tray).toEqual({ cookie: r.monsters + 1, apple: r.monsters + 1 });
        expect(r.tray.cookie + r.tray.apple).toBeLessThanOrEqual(TRAY_MAX);
        const snacks = [...Array<Food>(r.tray.cookie).fill('cookie'), ...Array<Food>(r.tray.apple).fill('apple')].map((food) => ({ food, eaten: false }));
        const fed: Order[] = Array.from({ length: r.monsters }, () => ({ cookie: 0, apple: 0 }));
        for (let guard = 0; guard < 20; guard++) {
          const move = munchTouch(kinds, { want: r.want, snacks, fed, pads: [], asking: 'each' });
          if (!move) break;
          if (typeof move !== 'object' || !('give' in move)) throw new Error('unexpected move');
          const s = snacks[move.give];
          expect(fed[move.to][s.food]).toBeLessThan(1);
          fed[move.to][s.food]++;
          s.eaten = true;
        }
        for (const f of fed) expect(f).toEqual({ cookie: 1, apple: 1 });
      }
    }
  });
});

describe('Monster Munch band tables', () => {
  it('opens lap on Big bites and toddler walks 2, 3, 10, 4', async () => {
    const { monsterMunch } = await import('./index');
    const { rangeFor } = await import('../../progress/difficulty');
    expect(monsterMunch.levels('lap')).toEqual({ min: 1, max: 9, order: [9, 1, 2] });
    expect(monsterMunch.levels('toddler')).toEqual({ min: 2, max: 10, order: [2, 3, 10, 4] });
    expect(rangeFor).toBeTypeOf('function');
    expect(monsterMunch.entryLevels).toEqual([9, 10]);
  });
});
