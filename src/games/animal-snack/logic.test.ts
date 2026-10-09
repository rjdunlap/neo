import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { ANIMALS, eaterOf, FAVORITE, makeRounds, PLANS, snackTouch, type Food, type SnackTable } from './logic';

describe('Animal Snack', () => {
  it('gives every animal its own food, so each snack has one eater', () => {
    const foods = ANIMALS.map((a) => FAVORITE[a]!);
    expect(new Set(foods).size).toBe(foods.length);
    for (const a of ANIMALS) expect(eaterOf(FAVORITE[a]!)).toBe(a);
  });

  it('asks about an animal that is there, never the same one twice running, with 2 to 4 snacks to count', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        rounds.forEach((r, i) => {
          expect(r.animals).toHaveLength(plan.animals);
          expect(new Set(r.animals).size).toBe(plan.animals);
          if (plan.mode === 'who' || plan.mode === 'count') {
            expect(r.animals).toContain(r.ask);
            if (i > 0) expect(r.ask).not.toBe(rounds[i - 1].ask);
          }
          if (plan.mode === 'count') expect(r.n).toBeGreaterThanOrEqual(2), expect(r.n).toBeLessThanOrEqual(4);
        });
      }
    }
  });
  it("the ghost finger plays every level through with no wrong animal, a count that is exactly right, and the bell only then", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        const free = plan.mode === 'munch' || plan.mode === 'float' || plan.mode === 'match';
        let index = 0;
        let eatenCount = 0;
        let touches = 0;
        // The table as the game builds it: free play and matching use one set of animals; questions deal new ones.
        const deal = (): SnackTable => {
          const r = rounds[Math.min(index, rounds.length - 1)];
          const friends = r.animals;
          const snacks: SnackTable['snacks'] = plan.mode === 'count' ? Array.from({ length: 5 }, () => ({ food: FAVORITE[r.ask!]!, eaten: false })) : plan.mode === 'float' || plan.mode === 'match' ? friends.map((a) => ({ food: FAVORITE[a]! as Food, eaten: false })) : [];
          return { friends, snacks, ask: r.ask, n: r.n, eatenCount };
        };
        let table = deal();
        let done = false;
        while (!done) {
          expect(++touches, `${plan.mode} seed ${seed}: finishes`).toBeLessThan(60);
          table.eatenCount = eatenCount;
          const move = snackTouch(plan, table);
          expect(move, `${plan.mode} seed ${seed}: a touch to make`).not.toBeNull();
          if (move === 'bell') {
            expect(plan.mode).toBe('count');
            expect(table.snacks.filter((s) => s.eaten).length, 'the bell rings on exactly the number asked for').toBe(table.n);
            index++;
            if (index >= rounds.length) done = true; else table = deal();
          } else if ('friend' in move!) {
            const name = table.friends[move.friend];
            if (plan.mode === 'who') {
              expect(name, 'the animal asked about').toBe(table.ask);
              index++;
              if (index >= rounds.length) done = true; else table = deal();
            } else {
              expect(plan.mode).toBe('munch');
              eatenCount++;
              if (eatenCount >= plan.rounds) done = true;
            }
          } else if ('snack' in move!) {
            const snack = table.snacks[move.snack];
            expect(snack.eaten).toBe(false);
            snack.eaten = true;
            if (plan.mode === 'float') {
              eatenCount++;
              if (eatenCount >= plan.rounds) done = true;
              else if (table.snacks.every((s) => s.eaten)) table = deal();
            } else expect(plan.mode).toBe('count');
          } else {
            const snack = table.snacks[move!.give];
            expect(plan.mode).toBe('match');
            expect(table.friends[move!.to], 'the snack goes to the animal that eats it').toBe(eaterOf(snack.food));
            snack.eaten = true;
            if (table.snacks.every((s) => s.eaten)) done = true;
          }
        }
        if (free && plan.mode !== 'match') expect(eatenCount).toBe(plan.rounds);
      }
    }
  });
});
