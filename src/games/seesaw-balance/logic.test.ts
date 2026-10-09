import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { aloneSide, balanceObservation, downSide, FRIEND_FOR, makeRounds, MAX_TILT, numberChoices, other, PLANS, seesawTouch, tilt, total, ways, weigh, type SeesawTouchItem, type Thing } from './logic';

describe('Seesaw Balance', () => {
  it('demonstrates every mode with only moves that lead to its answer', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 50; seed++) {
      for (const round of makeRounds(plan, new Rng(seed))) {
        const same = plan.mode === 'same';
        const items: SeesawTouchItem[] = [
          ...round.fixed.map((thing) => ({ thing, fixed: !same, side: round.fixedSide })),
          ...(round.across ?? []).map((thing) => ({ thing, fixed: false, side: other(round.fixedSide) })),
          ...round.offered.map((thing) => ({ thing, fixed: false, side: null })),
        ];
        let numbers = false;
        let answered = false;
        const weight = (side: 'left' | 'right') => total(items.filter((item) => item.side === side).map((item) => item.thing));
        const target = other(round.fixedSide);
        for (let step = 0; step < 30; step++) {
          if (plan.mode === 'heaviest') for (const item of items) if (item.side) item.tested = true;
          const sides = { left: items.filter((i) => i.side === 'left').map((i) => i.thing), right: items.filter((i) => i.side === 'right').map((i) => i.thing) };
          const readyForNumber = plan.mode === 'mystery' ? weight(target) === total(round.fixed) : plan.mode === 'same' ? !!aloneSide(sides) : false;
          if (readyForNumber && !numbers) numbers = true;
          const move = seesawTouch(plan, round, items, numbers);
          if (!move) break;
          if (move.kind === 'answer') {
            expect(move.value).toBe(round.answer);
            answered = true;
            break;
          }
          const item = items[move.item];
          expect(item.fixed).toBe(false);
          if (move.to === 'wagon') {
            expect(item.thing.weight).toBe(round.answer);
            item.side = null;
            item.inWagon = true;
          } else if (move.to === 'ground') item.side = null;
          else {
            if (plan.mode === 'heaviest') for (const otherItem of items) if (otherItem !== item && otherItem.side === move.to) otherItem.side = null;
            item.side = move.to;
          }
        }

        if (plan.mode === 'up' || plan.mode === 'heavy') expect(weight(target)).toBeGreaterThan(total(round.fixed));
        if (plan.mode === 'level' || plan.mode === 'parts') expect(weight(target)).toBe(total(round.fixed));
        if (plan.mode === 'mystery' || plan.mode === 'same') expect(answered).toBe(true);
        if (plan.mode === 'heaviest') expect(items.some((item) => item.inWagon && item.thing.weight === round.answer)).toBe(true);
      }
    }
  });

  it('leans toward the heavier side, more for a bigger difference, and is level only when equal', () => {
    expect(tilt(3, 3)).toBe(0);
    expect(downSide(3, 3)).toBeNull();
    expect(tilt(1, 2)).toBeGreaterThan(0);
    expect(downSide(1, 2)).toBe('right');
    expect(tilt(2, 1)).toBeLessThan(0);
    expect(downSide(2, 1)).toBe('left');
    // A difference of one is plainly visible; bigger differences lean further, up to a limit.
    expect(Math.abs(tilt(4, 5))).toBeGreaterThanOrEqual(0.1);
    for (let d = 1; d < 8; d++) {
      expect(tilt(0, d + 1)).toBeGreaterThanOrEqual(tilt(0, d));
      expect(Math.abs(tilt(0, d))).toBeLessThanOrEqual(MAX_TILT);
    }
    expect(weigh(4, 3)).toBe('under');
    expect(weigh(4, 4)).toBe('level');
    expect(weigh(4, 5)).toBe('over');
    expect(balanceObservation(0, 0)).toBeNull();
    expect(balanceObservation(2, 4)).toBe('heavy-down');
    expect(balanceObservation(3, 3)).toBe('equal-level');
  });

  it('makes every round winnable, with a real choice to make', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.rounds);
        for (const r of rounds) {
          const fixed = total(r.fixed);
          const offered = r.offered.map((t) => t.weight);
          switch (plan.mode) {
            case 'up':
              // Any offered friend lifts the rider: it only has to go on the other side.
              for (const w of offered) expect(w).toBeGreaterThan(fixed);
              expect(new Set(offered).size).toBe(offered.length);
              break;
            case 'heavy':
              // One friend lifts the rider and one does not.
              expect(offered.filter((w) => w > fixed)).toHaveLength(1);
              expect(offered.filter((w) => w < fixed)).toHaveLength(1);
              break;
            case 'level':
            case 'mystery':
              // Enough blocks to balance, with spares so stopping at level is a choice.
              expect(offered.every((w) => w === 1)).toBe(true);
              expect(offered.length).toBeGreaterThan(fixed);
              expect(r.answer).toBe(fixed / (plan.boxes ?? 1));
              break;
            case 'heaviest':
              expect(r.fixed).toHaveLength(0);
              expect(new Set(offered).size).toBe(3);
              expect(r.answer).toBe(Math.max(...offered));
              break;
            case 'same':
              // It starts level, with nothing on the grass, and the box isn't alone yet.
              expect(fixed).toBe(total(r.across!));
              expect(r.offered).toHaveLength(0);
              expect(aloneSide({ [r.fixedSide]: r.fixed, [other(r.fixedSide)]: r.across! } as Record<'left' | 'right', Thing[]>)).toBeNull();
              break;
            case 'parts':
              // At least two different ways to make the same weight.
              expect(fixed).toBe(r.answer);
              expect(ways(fixed, offered).length).toBeGreaterThanOrEqual(2);
              break;
          }
          for (const t of [...r.fixed, ...r.offered]) if (t.kind === 'friend') expect(FRIEND_FOR[t.weight as keyof typeof FRIEND_FOR]).toBeDefined();
        }
        // Counting levels never ask the same number twice in a row.
        if (plan.mode === 'level' || plan.mode === 'mystery' || plan.mode === 'parts' || plan.mode === 'same') {
          for (let i = 1; i < rounds.length; i++) expect(rounds[i].answer).not.toBe(rounds[i - 1].answer);
        }
      }
    }
  });

  it('two identical boxes have a unique per-box weight and enough unit blocks', () => {
    for (let seed = 1; seed <= 100; seed++) for (const r of makeRounds(PLANS[6], new Rng(seed))) {
      expect(r.fixed).toHaveLength(2); expect(r.fixed[0].weight).toBe(r.fixed[1].weight);
      expect(total(r.fixed)).toBe(2 * r.answer); expect(total(r.offered)).toBeGreaterThan(total(r.fixed));
    }
  });

  it('finds every way to make a weight, and offers three nearby numbers', () => {
    expect(ways(5, [1, 2, 3, 4]).map((w) => w.join('+')).sort()).toEqual(['1+4', '2+3']);
    expect(ways(6, [1, 2, 3, 4]).map((w) => w.join('+')).sort()).toEqual(['1+2+3', '2+4']);
    for (let answer = 2; answer <= 5; answer++) {
      for (let seed = 1; seed <= 50; seed++) {
        const choices = numberChoices(new Rng(seed), answer);
        expect(choices).toContain(answer);
        expect(new Set(choices).size).toBe(3);
        for (const c of choices) expect(c).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('reaches a lone box on a level seesaw by taking the same off both sides, and tips when only one side changes', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'same')) for (let seed = 1; seed <= 100; seed++) for (const r of makeRounds(plan, new Rng(seed))) {
      const here = [...r.fixed];
      const there = [...r.across!];
      // Taking one block from one side only tips the seesaw.
      expect(downSide(total(here.slice(0, -1)), total(there))).not.toBeNull();
      const off = (kind: Thing['kind']) => {
        here.splice(here.findIndex((t) => t.kind === kind), 1);
        there.splice(there.findIndex((t) => t.kind === kind), 1);
        expect(total(here)).toBe(total(there));
      };
      if (plan.boxes === 2) off('box');
      while (here.some((t) => t.kind === 'block')) off('block');
      const sides = { left: here, right: there };
      expect(aloneSide(sides)).toBe('left');
      // What is left across from the lone box is its weight in blocks, a number to say.
      expect(there).toHaveLength(r.answer);
      expect(r.answer).toBeGreaterThanOrEqual(2);
    }
    // A box alone is not enough if the other side still has a box.
    expect(aloneSide({ left: [{ kind: 'box', weight: 3 }], right: [{ kind: 'box', weight: 3 }] })).toBeNull();
  });
});
