import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { aloneSide, BOX_LOOKS, FRIEND_POOL, faceOf, nextOnGrass, WRAPPINGS, balanceObservation, downSide, FRIEND_FOR, makeRounds, MAX_TILT, numberChoices, other, pairHint, PLANS, planFor, progress, seesawTouch, shareSide, stays, tilt, total, ways, weigh, type SeesawRound, type SeesawTouchItem, type Side, type Thing } from './logic';

describe('Seesaw Balance', () => {
  it('demonstrates every mode with only moves that lead to its answer', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 50; seed++) {
      for (const round of makeRounds(plan, new Rng(seed))) {
        const same = plan.mode === 'same' || plan.mode === 'share';
        const items: SeesawTouchItem[] = [
          ...round.fixed.map((thing) => ({ thing, fixed: plan.mode === 'pair' ? stays(thing) || round.phase === 'read' : !same, side: round.fixedSide })),
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
          const readyForNumber = plan.mode === 'mystery' ? weight(target) === total(round.fixed) : plan.mode === 'same' ? !!aloneSide(sides) : plan.mode === 'share' ? !!shareSide(sides) : plan.mode === 'pair' ? round.phase === 'read' || !!aloneSide(sides) : false;
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
        if (plan.mode === 'mystery' || plan.mode === 'same' || plan.mode === 'share' || plan.mode === 'pair') expect(answered).toBe(true);
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
        expect(rounds).toHaveLength(plan.mode === 'pair' ? 2 * plan.rounds : plan.rounds);
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
            case 'share':
              expect(fixed).toBe(total(r.across!));
              expect(r.offered).toHaveLength(0);
              expect(r.fixed.filter((t) => t.kind === 'box')).toHaveLength(3);
              expect(r.across!.filter((t) => t.kind === 'box')).toHaveLength(1);
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
        if (plan.mode === 'level' || plan.mode === 'mystery' || plan.mode === 'parts' || plan.mode === 'same' || plan.mode === 'share') {
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

  it('leaves two boxes against two equal groups of blocks at the sharing level', () => {
    for (let seed = 1; seed <= 100; seed++) for (const r of makeRounds(PLANS[9], new Rng(seed))) {
      const here = [...r.fixed];
      const there = [...r.across!];
      const off = (side: Thing[], kind: Thing['kind']) => side.splice(side.findIndex((t) => t.kind === kind), 1)[0];
      // Cancel one box pair and the common blocks, keeping the seesaw level after each pair.
      off(here, 'box'); off(there, 'box');
      while (here.some((t) => t.kind === 'block')) { off(here, 'block'); off(there, 'block'); }
      expect(total(here)).toBe(total(there));
      const sides = { left: here, right: there };
      expect(shareSide(sides)).toBe('left');
      expect(there).toHaveLength(2 * r.answer);
      expect(r.answer).toBeGreaterThanOrEqual(2);
    }
  });

  describe('level 11, two boxes', () => {
    const PAIR = planFor(11);
    const pairs = (seed: number) => {
      const rounds = makeRounds(PAIR, new Rng(seed));
      return Array.from({ length: rounds.length / 2 }, (_, i) => [rounds[2 * i], rounds[2 * i + 1]] as const);
    };
    /** The pair round as the game sets it out: only the round box is fixed. */
    const setOut = (round: SeesawRound): SeesawTouchItem[] => [
      ...round.fixed.map((thing) => ({ thing, fixed: stays(thing), side: round.fixedSide as Side | null })),
      ...round.across!.map((thing) => ({ thing, fixed: false, side: other(round.fixedSide) as Side | null })),
    ];
    const gap = (items: readonly SeesawTouchItem[]) => {
      const sum = (side: Side) => total(items.filter((i) => i.side === side).map((i) => i.thing));
      return Math.abs(sum('left') - sum('right'));
    };
    const sidesOf = (items: readonly SeesawTouchItem[]) => ({ left: items.filter((i) => i.side === 'left').map((i) => i.thing), right: items.filter((i) => i.side === 'right').map((i) => i.thing) });
    const goal = (items: readonly SeesawTouchItem[]) => gap(items) === 0 && aloneSide(sidesOf(items)) !== null;

    it('reads the square box, then weighs a different round box with it', () => {
      expect(PLANS).toHaveLength(11);
      expect(PAIR.mode).toBe('pair');
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = makeRounds(PAIR, new Rng(seed));
        expect(rounds.map((r) => r.phase)).toEqual(['read', 'pair', 'read', 'pair']);
        let lastS = 0;
        for (const [read, pair] of pairs(seed)) {
          const s = read.answer;
          const round = pair.fixed.find((t) => t.shape === 'round')!;
          const k = pair.fixed.filter((t) => t.kind === 'block').length;
          expect(s).toBeGreaterThanOrEqual(2); expect(s).toBeLessThanOrEqual(4); expect(s).not.toBe(lastS);
          lastS = s;
          expect(round.weight).toBeGreaterThanOrEqual(1); expect(round.weight).toBeLessThanOrEqual(4); expect(round.weight).not.toBe(s);
          expect([1, 2]).toContain(k);
          // The reading: the square box alone, level against s blocks.
          expect(read.fixed).toEqual([{ kind: 'box', weight: s, shape: 'square' }]);
          expect(read.across!.every((t) => t.kind === 'block')).toBe(true);
          expect(total(read.across!)).toBe(s);
          expect(aloneSide({ [read.fixedSide]: read.fixed, [other(read.fixedSide)]: read.across! } as Record<Side, Thing[]>)).toBe(read.fixedSide);
          // The pair: level, at most ten blocks across, the round box the only round thing, and its weight the answer.
          expect(pair.fixedSide).toBe(read.fixedSide);
          expect(total(pair.fixed)).toBe(total(pair.across!));
          expect(pair.across!.length).toBe(s + round.weight + k);
          expect(pair.across!.length).toBeLessThanOrEqual(10);
          expect([...pair.fixed, ...pair.across!].filter((t) => t.shape === 'round')).toHaveLength(1);
          expect(pair.fixed.find((t) => t.shape === 'square')!.weight).toBe(s);
          expect(pair.answer).toBe(round.weight);
        }
      }
    });

    it('needs the same removals on every path to the round box alone', () => {
      for (let seed = 1; seed <= 100; seed++) for (const [read, pair] of pairs(seed)) {
        const s = read.answer;
        const k = pair.fixed.filter((t) => t.kind === 'block').length;
        // Removal-only states: which of the k + 1 removable things are off, and how many blocks across are off.
        const removable = pair.fixed.filter((t) => !stays(t));
        let goals = 0;
        for (let mask = 0; mask < 1 << removable.length; mask++) for (let c = 0; c <= pair.across!.length; c++) {
          const box = [pair.fixed.find(stays)!, ...removable.filter((_, i) => !(mask & (1 << i)))];
          const across = pair.across!.slice(c);
          const sides = { [pair.fixedSide]: box, [other(pair.fixedSide)]: across } as Record<Side, Thing[]>;
          if (total(box) === total(across) && aloneSide(sides)) {
            goals++;
            expect(mask).toBe((1 << removable.length) - 1);
            expect(c).toBe(s + k);
          }
        }
        expect(goals).toBe(1);
        expect(removable.length + s + k).toBe(2 * k + s + 1);
      }
    });

    it('classifies a change by the tilt before and after it', () => {
      expect(progress(0, 0)).toBe('level');
      expect(progress(2, 0)).toBe('level');
      expect(progress(0, 3)).toBe('tip');
      expect(progress(1, 2)).toBe('tip');
      expect(progress(3, 3)).toBe('tip');
      expect(progress(3, 2)).toBe('closer');
      // The square box off a level seesaw tips it; a block off the other side then narrows the gap.
      expect([progress(0, 3), progress(3, 2)]).toEqual(['tip', 'closer']);
    });

    it('demonstrates a pair without two tips in a row, never moving the round box', () => {
      for (let seed = 1; seed <= 100; seed++) for (const [read, pair] of pairs(seed)) {
        expect(seesawTouch(PAIR, read, read.fixed.map((thing) => ({ thing, fixed: true, side: read.fixedSide })), true)).toEqual({ kind: 'answer', value: read.answer });
        const s = read.answer;
        const k = pair.fixed.filter((t) => t.kind === 'block').length;
        const items = setOut(pair);
        const steps: string[] = [];
        let drags = 0;
        while (!goal(items)) {
          const move = seesawTouch(PAIR, pair, items);
          expect(move).not.toBeNull();
          if (move!.kind !== 'move') throw new Error('answered before the round box was alone');
          expect(move!.to).toBe('ground');
          const item = items[move!.item];
          expect(stays(item.thing)).toBe(false);
          const before = gap(items);
          item.side = null;
          const step = progress(before, gap(items));
          steps.push(step === 'tip' ? `tip-${item.thing.shape ?? item.thing.kind}` : step);
          drags++;
          expect(drags).toBeLessThanOrEqual(2 * k + s + 1);
        }
        expect(drags).toBe(2 * k + s + 1);
        // Each spare block pair tips once and levels; the square box tips once and each block after it narrows.
        expect(steps).toEqual([...Array.from({ length: k }, () => ['tip-block', 'level']).flat(), 'tip-square', ...Array.from({ length: s - 1 }, () => 'closer'), 'level']);
        expect(seesawTouch(PAIR, pair, items, true)).toEqual({ kind: 'answer', value: pair.answer });
        expect(items.filter((i) => i.side && i.thing.kind === 'block')).toHaveLength(pair.answer);
      }
    });

    it('glows something that narrows the gap from any tipped state, until it is level', () => {
      for (let seed = 1; seed <= 60; seed++) for (const [, pair] of pairs(seed)) {
        const rng = new Rng(seed * 31);
        for (let walk = 0; walk < 40; walk++) {
          // Wander: take removable things off, or put grass things onto either tray.
          const items = setOut(pair);
          let lastOff: number | null = null;
          for (let n = rng.int(1, 12); n > 0; n--) {
            const movable = items.map((item, index) => ({ item, index })).filter(({ item }) => !stays(item.thing));
            const { item, index } = rng.pick(movable);
            if (item.side) { item.side = null; lastOff = index; } else item.side = rng.chance(0.5) ? 'left' : 'right';
          }
          for (let guard = 0; gap(items) > 0; guard++) {
            expect(guard).toBeLessThan(30);
            const pick = pairHint(items, lastOff);
            expect(pick).not.toBeNull();
            const item = items[pick!];
            expect(stays(item.thing)).toBe(false);
            const before = gap(items);
            if (item.side) { item.side = null; lastOff = pick; } else {
              const sum = (side: Side) => total(items.filter((i) => i.side === side).map((i) => i.thing));
              item.side = sum('left') < sum('right') ? 'left' : 'right';
            }
            expect(progress(before, gap(items))).not.toBe('tip');
          }
          expect(pairHint(items, lastOff)).toBeNull();
        }
      }
    });

    it('leaves levels 1 to 10 as they were', () => {
      const fingerprint = PLANS.slice(0, 10).map((p) => makeRounds(p, new Rng(7)).map((r) => `${r.fixedSide[0]}${r.answer}:${r.fixed.length}/${r.across?.length ?? 0}/${r.offered.map((t) => t.weight).join('')}`).join(' '));
      expect(fingerprint).toEqual(["l1:1/0/23 l2:1/0/43 l1:1/0/42 l2:1/0/43","l2:1/0/14 l3:1/0/42 r2:1/0/13 l3:1/0/41","l2:1/0/1111 r4:1/0/111111 r3:1/0/11111","l4:0/0/423 r4:0/0/314 r4:0/0/241","l4:2/0/4123 l6:2/0/3412 r4:2/0/3142","l2:1/0/111111 r4:1/0/111111 r3:1/0/111111","l2:2/0/1111111 r3:2/0/1111111 r2:2/0/1111111","l2:3/4/ r3:2/4/ l2:3/4/","l2:4/5/ r3:3/5/ l2:4/5/","l2:5/7/ r3:4/8/ l2:5/7/"]);
    });
  });

  it('gives friends seeded faces from their weight\'s pool, distinct across weights and alike within one', () => {
    const seen = new Set<string>();
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 60; seed++) {
      for (const round of makeRounds(planFor(level), new Rng(seed))) {
        const friends = [...round.fixed, ...round.offered].filter((t) => t.kind === 'friend');
        for (const t of friends) {
          expect((FRIEND_POOL[t.weight as 1 | 2 | 3 | 4] as readonly string[]).includes(faceOf(t))).toBe(true);
          seen.add(faceOf(t));
        }
        const byFace = new Map<string, number>();
        for (const t of friends) {
          byFace.set(faceOf(t), t.weight);
          expect(byFace.get(faceOf(t))).toBe(t.weight);
        }
        expect(new Set(friends.map((t) => t.weight)).size).toBe(new Set(friends.map(faceOf)).size);
      }
    }
    for (const face of ['duck', 'cat', 'bunny', 'dog', 'pig', 'cow', 'bear']) expect(seen.has(face)).toBe(true);
  });

  it('wraps presents and looks boxes over from the seeded rng, at levels 4, 6 and 7 only', () => {
    const wraps = new Set<string>();
    const looks = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const r of makeRounds(planFor(4), new Rng(seed))) for (const t of r.offered) { expect(WRAPPINGS).toContain(t.wrap); wraps.add(t.wrap!); }
      for (const level of [6, 7]) for (const r of makeRounds(planFor(level), new Rng(seed))) for (const t of r.fixed) { expect(BOX_LOOKS).toContain(t.look); looks.add(t.look!); }
      for (const r of makeRounds(planFor(8), new Rng(seed))) for (const t of r.fixed) expect(t.look).toBeUndefined();
    }
    expect(wraps.size).toBe(3);
    expect(looks.size).toBe(2);
  });

  it('after two overs, once under, glows a block on the grass that helps fill the tray', () => {
    for (const level of [3, 5, 6]) for (let seed = 1; seed <= 40; seed++) {
      const plan = planFor(level);
      const round = makeRounds(plan, new Rng(seed))[0];
      const target = other(round.fixedSide);
      const items: SeesawTouchItem[] = [
        ...round.fixed.map((thing) => ({ thing, fixed: true, side: round.fixedSide })),
        ...round.offered.map((thing) => ({ thing, fixed: false, side: null as Side | null })),
      ];
      const pick = nextOnGrass(plan, round, items);
      expect(pick).not.toBeNull();
      expect(items[pick!].side).toBeNull();
      expect(items[pick!].thing.weight).toBeLessThanOrEqual(total(round.fixed));
      // Level: nothing more to add.
      items.filter((i) => !i.fixed).forEach((i) => { if (total(items.filter((j) => j.side === target).map((j) => j.thing)) < total(round.fixed) && i.side === null) i.side = target; });
      if (total(items.filter((j) => j.side === target).map((j) => j.thing)) >= total(round.fixed)) expect(nextOnGrass(plan, round, items)).toBeNull();
    }
  });
});
