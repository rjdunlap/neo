import { describe, expect, it } from 'vitest';
import { simulate } from '../../engine/ball';
import { Rng } from '../../engine/random';
import { AIM_LIMIT, aimVelocity, BOARD, grid, makeBoard, PLANS, planFor, targets } from './logic';

describe('Peg Garden', () => {
  it('grows buds on the grid, with the right number of specials and numbers', () => {
    const all = grid();
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const board = makeBoard(plan, new Rng(seed));
        expect(board).toHaveLength(plan.pegs);
        for (const s of board) expect(all.some((g) => g.x === s.x && g.y === s.y)).toBe(true);
        if (plan.mode === 'color') expect(board.filter((s) => s.kind === 'special')).toHaveLength(plan.count);
        if (plan.mode === 'number' || plan.mode === 'order') {
          const nums = board.filter((s) => typeof s.kind === 'number').map((s) => s.kind).sort();
          expect(nums).toEqual(Array.from({ length: plan.count }, (_, i) => i + 1));
          for (const t of targets(plan, new Rng(seed))) expect(nums).toContain(t);
        }
      }
    }
  });

  it('can hit every numbered bud with some aim', () => {
    const plan = planFor(4);
    for (let seed = 1; seed <= 30; seed++) {
      const board = makeBoard(plan, new Rng(seed));
      const world = { pegs: board.map((s) => ({ x: s.x, y: s.y, r: BOARD.peg })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
      const reachable = new Set<number>();
      for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.01) {
        const { hits } = simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, world, BOARD.h, 6, 1 / 30);
        for (const h of hits) if (typeof board[h].kind === 'number') reachable.add(board[h].kind as number);
      }
      expect([...reachable].sort(), `seed ${seed}`).toEqual([1, 2, 3, 4, 5]);
    }
  });
});
