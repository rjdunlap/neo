import { describe, expect, it } from 'vitest';
import { simulate, stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { Rng } from '../../engine/random';
import { AIM_LIMIT, aimAt, aimVelocity, BOARD, DRIFT, dropAt, grid, makeBoard, PLANS, planFor, targets } from './logic';

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

  /** The world of a board, as the game builds it. */
  const worldOf = (spots: ReturnType<typeof makeBoard>): BallWorld => ({ pegs: spots.map((s) => ({ x: s.x, y: s.y, r: BOARD.peg })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 });

  /** A pearl flown with frames of uneven length, as a screen shows them, and the buds it touched in order. */
  const fly = (ball: Ball, world: BallWorld, jitter: Rng) => {
    const touched: number[] = [];
    for (let t = 0; t < 12 && ball.y - ball.r < BOARD.h; ) {
      const dt = jitter.range(0.012, 0.024);
      t += dt;
      for (const i of stepBall(ball, world, dt)) if (!touched.includes(i)) touched.push(i);
    }
    return touched;
  };

  it("drops the ghost finger's pearls so every bloom level finishes in a few shots, and a color shot that the bot is sure of lights an orange flower", { timeout: 60_000 }, () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bloom' || p.mode === 'color')) {
      let sureShots = 0;
      let sureHits = 0;
      for (let seed = 1; seed <= 15; seed++) {
        const rng = new Rng(seed);
        const jitter = new Rng(seed + 1000);
        const spots = makeBoard(plan, rng);
        const world = worldOf(spots);
        const bloomed = spots.map(() => false);
        const want = (i: number) => !bloomed[i] && (plan.mode !== 'color' || spots[i].kind === 'special');
        let shots = 0;
        while (spots.some((_, i) => want(i))) {
          // The bot reads the next draw from a copy, then the game makes the same draw.
          const drift = rng.clone().range(-DRIFT, DRIFT);
          const drop = dropAt(world, want, drift, plan.mode === 'color');
          expect(drop.x).toBeGreaterThanOrEqual(BOARD.ball);
          expect(drop.x).toBeLessThanOrEqual(BOARD.w - BOARD.ball);
          const touched = fly({ x: drop.x, y: 40, vx: rng.range(-DRIFT, DRIFT), vy: 60, r: BOARD.ball }, world, jitter);
          if (plan.mode === 'color' && drop.sure) {
            sureShots++;
            if (touched.some(want)) sureHits++;
          }
          touched.forEach((i) => (bloomed[i] = true));
          // A pearl can be let go over and over; a round that takes more than this many is not one a card can show.
          expect(++shots, `${plan.mode} seed ${seed}`).toBeLessThanOrEqual(plan.mode === 'bloom' ? 10 : 14);
        }
      }
      // Frames are never the simulation's, and a pearl is chaotic after a few bounces; the bot prefers the soonest touch to keep this high.
      if (plan.mode === 'color') expect(sureHits / sureShots).toBeGreaterThan(0.9);
    }
  });

  it("aims the ghost finger's launcher so the shot touches the flower asked for, on every board", () => {
    for (const plan of PLANS.filter((p) => p.mode === 'number' || p.mode === 'order')) {
      for (let seed = 1; seed <= 25; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng);
        const world = worldOf(spots);
        for (const n of plan.mode === 'order' ? Array.from({ length: plan.count }, (_, i) => i + 1) : targets(plan, rng)) {
          const want = spots.findIndex((s) => s.kind === n);
          const angle = aimAt(world, want, 0);
          expect(angle, `${plan.mode} seed ${seed}: flower ${n}`).not.toBeNull();
          expect(Math.abs(angle!)).toBeLessThanOrEqual(AIM_LIMIT);
          expect(simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(angle!), r: BOARD.ball }, world, BOARD.h, 12, 1 / 30).hits).toContain(want);
        }
      }
    }
  });
});
