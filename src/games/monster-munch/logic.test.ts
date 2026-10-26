import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { canCallFriend, friendsReady, munchAnswer, shareReturns, isTapMode, complete, extras, FOODS, foodWord, lookAlike, missing, MUNCH_PLANS, munchHint, munchRounds, munchTouch, noFood, numberChoices, orderWords, total, TRAY_MAX, wantsMore, type Food, type MunchRound, type MunchTable, type Order } from './logic';

/** The foods on a round's tray, one entry each. */
const trayFoods = (r: MunchRound): Food[] => r.kinds.flatMap((k) => Array<Food>(r.tray[k]).fill(k));

describe('Monster Munch rounds', () => {
  it('always put enough food on a tray that stays small enough to grab', () => {
    for (const plan of MUNCH_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = munchRounds(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.rounds);
        for (const r of rounds) {
          const k = r.kinds[0];
          expect(total(r.tray), plan.name).toBeLessThanOrEqual(TRAY_MAX);
          // Only the round's kinds are on the tray or in the order.
          for (const f of FOODS) if (!r.kinds.includes(f)) {
            expect(r.tray[f], `${plan.mode}: no ${f} on the tray`).toBe(0);
            expect(r.want[f]).toBe(0);
          }
          // Every monster's order can be met from the tray.
          for (const f of FOODS) expect(r.tray[f]).toBeGreaterThanOrEqual(r.want[f] * r.monsters);
          if (plan.mode === 'exact' || plan.mode === 'two') {
            expect(r.want[k]).toBeGreaterThanOrEqual(plan.min);
            expect(r.want[k]).toBeLessThanOrEqual(plan.max);
            // Spare food, so stopping at the right number is a real choice.
            expect(r.tray[k]).toBeGreaterThan(r.want[k]);
          }
          if (plan.mode === 'share') expect(r.tray[k]).toBe(r.want[k] * r.monsters);
        }
        if (plan.mode === 'exact') rounds.slice(1).forEach((r, i) => expect(r.want[r.kinds[0]]).not.toBe(rounds[i].want[rounds[i].kinds[0]]));
      }
    }
  });

  it('plays two rounds at the tapping levels, a short one first', () => {
    const counts = (level: number) => munchRounds(MUNCH_PLANS[level - 1], new Rng(3)).map((r) => [r.want.cookie, r.tray.cookie]);
    expect(counts(1)).toEqual([[4, 4], [6, 6]]);
    expect(counts(2)).toEqual([[3, 3], [5, 5]]);
  });

  it('checks orders, refusals and fair shares', () => {
    const want = { ...noFood(), cookie: 2, apple: 1 };
    expect(complete(want, { ...noFood(), cookie: 2, apple: 1 })).toBe(true);
    expect(complete(want, { ...noFood(), cookie: 2 })).toBe(false);
    expect(complete(want, { ...noFood(), cookie: 2, apple: 1, berry: 1 })).toBe(false);
    expect(missing(want, { ...noFood(), cookie: 1, apple: 1 })).toEqual({ ...noFood(), cookie: 1 });
    expect(wantsMore(want, { ...noFood(), cookie: 2 }, 'cookie')).toBe(false);
    expect(wantsMore(want, { ...noFood(), cookie: 2 }, 'apple')).toBe(true);
    expect(wantsMore(want, noFood(), 'carrot')).toBe(false);
    expect(total({ ...noFood(), berry: 2, cracker: 3 })).toBe(5);
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
    expect(orderWords({ ...noFood(), cookie: 1 })).toBe('1 cookie');
    expect(orderWords({ ...noFood(), cookie: 2, apple: 1 })).toBe('2 cookies and 1 apple');
    expect(orderWords({ ...noFood(), apple: 2 }, true)).toBe('2 more apples');
    expect(orderWords(noFood())).toBe('nothing');
  });

  it('reads every food correctly, singular and plural', () => {
    expect(orderWords({ ...noFood(), berry: 1 })).toBe('1 berry');
    expect(orderWords({ ...noFood(), berry: 3 })).toBe('3 berries');
    expect(orderWords({ ...noFood(), cracker: 2 }, true)).toBe('2 more crackers');
    expect(orderWords({ ...noFood(), cracker: 1 }, true)).toBe('1 more cracker');
    expect(orderWords({ ...noFood(), cookie: 2, carrot: 1 })).toBe('2 cookies and 1 carrot');
    expect(orderWords({ ...noFood(), carrot: 3, berry: 1 })).toBe('3 carrots and 1 berry');
    expect(orderWords({ ...noFood(), apple: 1, berry: 2, cracker: 1 })).toBe('1 apple and 2 berries and 1 cracker');
    for (const f of FOODS) {
      expect(orderWords({ ...noFood(), [f]: 1 })).toBe(`1 ${f}`);
      expect(foodWord(f, 1)).toBe(f);
      expect(foodWord(f, 2)).toBe(f === 'berry' ? 'berries' : `${f}s`);
      expect(orderWords({ ...noFood(), [f]: 4 })).toBe(`4 ${foodWord(f, 4)}`);
    }
  });

  it('leftover rounds never share evenly, leave fewer cookies than monsters, and fit the tray', () => {
    const plan = MUNCH_PLANS.find((p) => p.mode === 'leftover')!;
    for (let seed = 1; seed <= 200; seed++) {
      for (const r of munchRounds(plan, new Rng(seed))) {
        expect(r.left).toBeGreaterThanOrEqual(1);
        expect(r.left).toBeLessThan(r.monsters);
        const k = r.kinds[0];
        expect(r.tray[k]).toBe(r.want[k] * r.monsters + r.left!);
        expect(total(r.tray)).toBeLessThanOrEqual(TRAY_MAX);
        expect(r.want[k]).toBeGreaterThanOrEqual(2);
      }
    }
  });
  it("the ghost finger plays every round of every level with no refusal, a fair share, the bell only when the order is right, and the right numbers", () => {
    for (const plan of MUNCH_PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const rounds = munchRounds(plan, rng);
        for (const r of rounds) {
          const foods = trayFoods(r);
          const k = r.kinds[0];
          const t: MunchTable = {
            want: r.want,
            kinds: r.kinds,
            left: r.left,
            snacks: rng.shuffle(foods).map((food) => ({ food, eaten: false })),
            fed: Array.from({ length: plan.mode === 'friends' ? 1 : r.monsters }, (): Order => noFood()),
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
              const kind = move === 'call' ? 'call' : move === 'bell' ? 'bell' : typeof move === 'object' && move && 'pad' in move ? 'pad' : plan.mode === 'exact' || plan.mode === 'two' ? 'food' : 'monster';
              expect(hint, `${plan.mode} seed ${seed} step ${step}`).toBe(kind);
            }
            if (move === 'call') {
              expect(canCallFriend(t)).toBe(true);
              t.fed.push(noFood());
            } else if (move === 'bell') {
              if (plan.mode === 'friends') {
                expect(friendsReady(t)).toBe(true);
                expect(t.fed).toHaveLength(r.monsters);
                t.asking = 'friends';
                t.pads = numberChoices(r.monsters, rng);
              } else if (plan.mode === 'leftover') {
                // The game's own judgment: even shares and fewer left than monsters, so the pads come.
                const counts = t.fed.map((f) => f[k]);
                expect(counts.every((c) => c === counts[0]), 'even shares').toBe(true);
                expect(t.snacks.filter((x) => !x.eaten).length, 'fewer left than monsters').toBeLessThan(r.monsters);
                t.pads = numberChoices(r.want[k], rng);
              } else {
                expect(['exact', 'two']).toContain(plan.mode);
                expect(complete(r.want, t.fed[0]), 'the bell rings on exactly the order').toBe(true);
                won = true;
              }
            } else if ('pad' in move!) {
              const answer = munchAnswer(t);
              expect(move.pad, 'the right number').toBe(answer);
              expect(t.pads).toContain(move.pad);
              if ((plan.mode === 'leftover' || plan.mode === 'friends') && t.asking !== 'left') {
                t.asking = 'left';
                t.pads = numberChoices(r.left!, rng);
              } else if (plan.mode === 'sharekind' && t.asking === 'each') {
                t.asking = 'second';
                t.pads = numberChoices(r.want[r.kinds[1]], rng);
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
              if ((plan.mode === 'share' || plan.mode === 'sharekind') && t.snacks.every((x) => x.eaten)) {
                for (const f of r.kinds) expect(extras(t.fed.map((o) => o[f]), r.want[f]).every((n) => n === 0), 'fair for each kind').toBe(true);
                t.pads = numberChoices(r.want[k], rng);
              }
            }
          }
          expect(won, `${plan.mode} seed ${seed}: the round is won`).toBe(true);
        }
      }
    }
  });
});

describe('Monster Munch foods', () => {
  const pooled = MUNCH_PLANS.map((p, i) => ({ p, level: i + 1 })).filter(({ p }) => p.pool);
  const fixed = MUNCH_PLANS.map((p, i) => ({ p, level: i + 1 })).filter(({ p }) => !p.pool);

  it('pools exactly levels 4 to 8, and keeps 1, 2, 3, 9 and 10 off the pool', () => {
    expect(pooled.map((x) => x.level)).toEqual([4, 5, 6, 7, 8]);
    expect(fixed.map((x) => x.level)).toEqual([1, 2, 3, 9, 10, 11, 12]);
  });

  it('never repeats the first food from the previous round, and the kinds are real foods', () => {
    for (const { p } of pooled) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = munchRounds(p, new Rng(seed));
        rounds.forEach((r, i) => {
          expect(FOODS).toContain(r.kinds[0]);
          if (i > 0) expect(r.kinds[0], `${p.mode} seed ${seed} round ${i}`).not.toBe(rounds[i - 1].kinds[0]);
        });
      }
    }
  });

  it('varies the food across seeds and uses every food somewhere', () => {
    for (const { p, level } of pooled) {
      const seen = new Set<Food>();
      for (let seed = 1; seed <= 300; seed++) for (const r of munchRounds(p, new Rng(seed))) r.kinds.forEach((k) => seen.add(k));
      expect([...seen].sort(), `level ${level}`).toEqual([...FOODS].sort());
    }
  });

  it('pairs two different foods that do not look alike at the two-food level', () => {
    const two = MUNCH_PLANS.find((p) => p.mode === 'two')!;
    expect(lookAlike('cookie', 'cracker')).toBe(true);
    expect(lookAlike('cracker', 'cookie')).toBe(true);
    expect(lookAlike('apple', 'carrot')).toBe(false);
    const pairs = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      for (const r of munchRounds(two, new Rng(seed))) {
        expect(r.kinds).toHaveLength(2);
        const [a, b] = r.kinds;
        expect(a).not.toBe(b);
        expect(lookAlike(a, b), `${a} with ${b}`).toBe(false);
        expect(r.want[a]).toBeGreaterThanOrEqual(1);
        expect(r.want[b]).toBeGreaterThanOrEqual(1);
        expect(r.want[b]).toBeLessThanOrEqual(2);
        pairs.add(`${a}+${b}`);
      }
    }
    // Plenty of different pairings, and cookie with cracker never among them.
    expect(pairs.size).toBeGreaterThan(8);
    expect(pairs.has('cookie+cracker') || pairs.has('cracker+cookie')).toBe(false);
  });

  it('single-food pooled levels carry one kind, and the other foods stay off the order', () => {
    for (const { p } of pooled.filter(({ p }) => p.mode !== 'two')) {
      for (let seed = 1; seed <= 100; seed++) for (const r of munchRounds(p, new Rng(seed))) expect(r.kinds).toHaveLength(1);
    }
  });

  it('keeps cookies at levels 1, 2, 3 and 9, and cookie with apple at level 10', () => {
    for (const { p, level } of fixed) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const r of munchRounds(p, new Rng(seed))) {
          expect(r.kinds, `level ${level}`).toEqual(level === 10 || level === 12 ? ['cookie', 'apple'] : ['cookie']);
          for (const f of FOODS) if (!r.kinds.includes(f)) expect(r.tray[f]).toBe(0);
        }
      }
    }
    // Same round counts and amounts as before.
    const counts = (level: number, seed: number) => munchRounds(MUNCH_PLANS[level - 1], new Rng(seed)).map((r) => [r.want.cookie, r.tray.cookie]);
    for (const seed of [1, 7, 99]) {
      expect(counts(1, seed)).toEqual([[4, 4], [6, 6]]);
      expect(counts(2, seed)).toEqual([[3, 3], [5, 5]]);
      expect(counts(3, seed)).toEqual([[1, 3], [1, 4]]);
      expect(counts(9, seed)).toEqual([[3, 3], [3, 3]]);
    }
  });

  it('puts only the round\'s kinds on a tray of at most ten, and the bot finishes with every food', () => {
    for (const { p } of pooled) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const r of munchRounds(p, new Rng(seed))) {
          const foods = trayFoods(r);
          expect(foods.length).toBe(total(r.tray));
          expect(foods.length).toBeLessThanOrEqual(TRAY_MAX);
          for (const f of foods) expect(r.kinds).toContain(f);
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
    expect(rounds.map((r) => [r.monsters, r.tray.cookie, total(r.tray) - r.tray.cookie])).toEqual([[1, 3, 0], [1, 3, 0]]);
    expect(munchHint(big, { want: rounds[0].want, kinds: rounds[0].kinds, snacks: [], fed: [noFood()], pads: [], asking: 'each' })).toBeNull();
  });

  it('puts one spare of each food on the tray, and the bot gives every monster one of each', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const r of munchRounds(kinds, new Rng(seed))) {
        expect(r.kinds).toEqual(['cookie', 'apple']);
        expect(r.tray).toEqual({ ...noFood(), cookie: r.monsters + 1, apple: r.monsters + 1 });
        expect(total(r.tray)).toBeLessThanOrEqual(TRAY_MAX);
        const snacks = trayFoods(r).map((food) => ({ food, eaten: false }));
        const fed: Order[] = Array.from({ length: r.monsters }, () => noFood());
        for (let guard = 0; guard < 20; guard++) {
          const move = munchTouch(kinds, { want: r.want, kinds: r.kinds, snacks, fed, pads: [], asking: 'each' });
          if (!move) break;
          if (typeof move !== 'object' || !('give' in move)) throw new Error('unexpected move');
          const s = snacks[move.give];
          expect(fed[move.to][s.food]).toBeLessThan(1);
          fed[move.to][s.food]++;
          s.eaten = true;
        }
        for (const f of fed) expect(f).toEqual({ ...noFood(), cookie: 1, apple: 1 });
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
    expect(monsterMunch.levels('school')).toEqual({ min: 6, max: 12, order: [6, 7, 12, 8, 11] });
  });
});


describe('Monster Munch sharing both kinds and choosing group counts', () => {
  it('starts with the promised visible quantities, and generates bounded divisible pairs', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = munchRounds(MUNCH_PLANS[11], new Rng(seed));
      expect(rounds[0].tray).toEqual({ ...noFood(), cookie: 4, apple: 2 });
      for (const r of rounds) {
        expect(r.kinds).toEqual(['cookie', 'apple']);
        expect(r.monsters).toBe(2);
        expect(total(r.tray)).toBeLessThanOrEqual(10);
        for (const f of r.kinds) {
          expect(r.want[f]).toBeGreaterThanOrEqual(1);
          expect(r.want[f]).toBeLessThanOrEqual(3);
          expect(r.tray[f]).toBe(r.want[f] * r.monsters);
        }
      }
    }
  });

  it('returns the overfull kind even when total food per monster matches', () => {
    const want = { ...noFood(), cookie: 2, apple: 1 };
    const fed = [{ ...noFood(), cookie: 3 }, { ...noFood(), cookie: 1, apple: 2 }];
    expect(shareReturns(want, fed)).toEqual([{ ...noFood(), cookie: 1 }, { ...noFood(), apple: 1 }]);
    expect(shareReturns(want, [want, want])).toEqual([noFood(), noFood()]);
  });

  it('covers 2–4 friends, 2–3 each and every allowed remainder including zero', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const rounds = munchRounds(MUNCH_PLANS[10], new Rng(seed));
      expect(rounds[0]).toMatchObject({ monsters: 3, want: { cookie: 2 }, tray: { cookie: 7 }, left: 1 });
      for (const r of rounds) {
        expect(r.monsters).toBeGreaterThanOrEqual(2);
        expect(r.monsters).toBeLessThanOrEqual(4);
        expect(r.want.cookie).toBeGreaterThanOrEqual(2);
        expect(r.want.cookie).toBeLessThanOrEqual(3);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.left).toBeLessThan(r.want.cookie);
        expect(r.tray.cookie).toBe(r.monsters * r.want.cookie + r.left!);
        expect(total(r.tray)).toBeLessThanOrEqual(10);
        seen.add(`${r.want.cookie}/${r.monsters}/${r.left}`);
      }
    }
    for (const key of ['2/4/0', '2/4/1', '3/2/0', '3/2/1', '3/2/2', '3/3/0', '3/3/1']) expect(seen.has(key), key).toBe(true);
    for (let seed = 1; seed <= 30; seed++) expect(numberChoices(0, new Rng(seed)).sort()).toEqual([0, 1, 2]);
  });

  it('reserves existing shares, accepts calls before dealing, and guides a premature bell toward useful play', () => {
    const r = munchRounds(MUNCH_PLANS[10], new Rng(3))[0];
    const t: MunchTable = { want: r.want, kinds: r.kinds, left: r.left,
      snacks: trayFoods(r).map((food) => ({ food, eaten: false })), fed: [noFood()], pads: [], asking: 'each' };
    expect(friendsReady(t)).toBe(false);
    expect(canCallFriend(t)).toBe(true);
    t.fed.push(noFood(), noFood());
    expect(canCallFriend(t)).toBe(false); // seven visible cookies, six already owed
    expect(munchHint(MUNCH_PLANS[10], t)).toBe('monster');
    t.fed.forEach((f) => { f.cookie = 2; });
    t.snacks.slice(0, 6).forEach((s) => { s.eaten = true; });
    expect(friendsReady(t)).toBe(true);
    expect(munchHint(MUNCH_PLANS[10], t)).toBe('bell');
    t.fed.pop(); t.snacks.slice(4, 6).forEach((s) => { s.eaten = false; });
    expect(friendsReady(t)).toBe(false);
    expect(munchHint(MUNCH_PLANS[10], t)).toBe('call');
  });
});
