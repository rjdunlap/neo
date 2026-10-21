import { describe, expect, it } from 'vitest';
import { simulate, stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { Rng } from '../../engine/random';
import { AIM_LIMIT, aimAt, aimVelocity, BOARD, DRIFT, driftOf, dropAt, grid, guided, ledgeX, makeBoard, PLANS, planFor, STALL_AT, targets } from './logic';

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

  /** A pearl flown as the game flies it, in fixed steps of the ball engine's substep, and the buds it touched in order. */
  const fly = (ball: Ball, world: BallWorld) => {
    const touched: number[] = [];
    for (let t = 0; t < 12 && ball.y - ball.r < BOARD.h; t += 1 / 240) {
      for (const i of stepBall(ball, world, 1 / 240)) if (!touched.includes(i)) touched.push(i);
    }
    return touched;
  };

  it("drops the ghost finger's pearls so every bloom level finishes in a few shots, and a color shot that the bot is sure of lights an orange flower", { timeout: 60_000 }, () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bloom' || p.mode === 'color')) {
      let sureShots = 0;
      let sureHits = 0;
      for (let seed = 1; seed <= 15; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng);
        const world = worldOf(spots);
        const bloomed = spots.map(() => false);
        const want = (i: number) => !bloomed[i] && (plan.mode !== 'color' || spots[i].kind === 'special');
        let shots = 0;
        while (spots.some((_, i) => want(i))) {
          // The bot reads the next draw from a copy, then the game makes the same draw.
          const spread = driftOf(plan.mode);
          const drift = spread ? rng.clone().range(-spread, spread) : 0;
          const drop = dropAt(world, want, drift, plan.mode === 'color');
          expect(drop.x).toBeGreaterThanOrEqual(BOARD.ball);
          expect(drop.x).toBeLessThanOrEqual(BOARD.w - BOARD.ball);
          const touched = fly({ x: drop.x, y: 40, vx: spread ? rng.range(-spread, spread) : 0, vy: 60, r: BOARD.ball }, world);
          if (plan.mode === 'color' && drop.sure) {
            sureShots++;
            if (touched.some(want)) sureHits++;
          }
          touched.forEach((i) => (bloomed[i] = true));
          // A pearl can be let go over and over; a round that takes more than this many is not one a card can show.
          expect(++shots, `${plan.mode} seed ${seed}`).toBeLessThanOrEqual(plan.mode === 'bloom' ? 10 : 14);
        }
      }
      // The game steps a pearl as the simulation does, so a shot the bot is sure of lands on the colour level.
      if (plan.mode === 'color') expect(sureHits).toBe(sureShots);
    }
  });

  it("finishes a bloom level even when the same spot is tapped every time", { timeout: 60_000 }, () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bloom')) {
      for (let seed = 1; seed <= 15; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng);
        const world = worldOf(spots);
        const bloomed = spots.map(() => false);
        for (const tapX of [BOARD.ball, BOARD.w / 2, BOARD.w - BOARD.ball]) {
          bloomed.fill(false);
          let stalled = 0;
          let shots = 0;
          while (bloomed.some((b) => !b)) {
            const x = stalled >= STALL_AT ? dropAt(world, (i) => !bloomed[i], rng.clone().range(-DRIFT, DRIFT)).x : tapX;
            const touched = fly({ x, y: 40, vx: rng.range(-DRIFT, DRIFT), vy: 60, r: BOARD.ball }, world);
            stalled = touched.some((i) => !bloomed[i]) ? 0 : stalled + 1;
            touched.forEach((i) => (bloomed[i] = true));
            expect(++shots, `seed ${seed} tap ${tapX}`).toBeLessThanOrEqual(20);
          }
        }
      }
    }
  });

  it('finishes the colour level even when the same spot is tapped every time, with a miss only for her own choice of spot', { timeout: 60_000 }, () => {
    const plan = planFor(3);
    expect(driftOf('color')).toBe(0);
    for (let seed = 1; seed <= 15; seed++) {
      const spots = makeBoard(plan, new Rng(seed));
      const world = worldOf(spots);
      const bloomed = spots.map(() => false);
      const want = (i: number) => !bloomed[i] && spots[i].kind === 'special';
      for (const tapX of [0, BOARD.w / 2, BOARD.w + 200]) {
        bloomed.fill(false);
        let stalled = 0;
        let wrongs = 0;
        let hinting = false;
        let shots = 0;
        while (spots.some((_, i) => want(i))) {
          const help = guided('color', stalled, hinting);
          const x = help ? dropAt(world, want, 0, true).x : ledgeX(tapX);
          const touched = fly({ x, y: 40, vx: 0, vy: 60, r: BOARD.ball }, world);
          const fresh = touched.some(want);
          stalled = fresh ? 0 : stalled + 1;
          if (fresh) hinting = false;
          if (touched.some((i) => spots[i].kind === 'special')) wrongs = 0;
          else if (!help && ++wrongs >= 2) [hinting, wrongs] = [true, 0];
          touched.forEach((i) => (bloomed[i] = true));
          expect(++shots, `seed ${seed} tap ${tapX}`).toBeLessThanOrEqual(16);
        }
      }
    }
  });

  it('puts the colour hint on a ledge spot whose pearl touches a waiting orange bud, on every board and as buds bloom', () => {
    const plan = planFor(3);
    for (let seed = 1; seed <= 40; seed++) {
      const spots = makeBoard(plan, new Rng(seed));
      const world = worldOf(spots);
      const bloomed = spots.map(() => false);
      const want = (i: number) => !bloomed[i] && spots[i].kind === 'special';
      while (spots.some((_, i) => want(i))) {
        const { x } = dropAt(world, want, 0, true);
        const { hits } = simulate({ x, y: 40, vx: 0, vy: 60, r: BOARD.ball }, world, BOARD.h, 12, 1 / 30);
        expect(hits.some(want), `seed ${seed}`).toBe(true);
        hits.forEach((i) => (bloomed[i] = true));
      }
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
