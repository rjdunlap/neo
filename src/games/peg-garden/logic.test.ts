import { describe, expect, it } from 'vitest';
import { simulate, stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { Rng } from '../../engine/random';
import { AIM_LIMIT, BIG_LEVEL, BIG_PEG, BIG_PLAN, aimAt, aimVelocity, BACKDROPS, blooms, BOARD, DRIFT, EDGE, driftOf, dropAt, grid, guided, ledgeX, makeBoard, pickTheme, PLANS, planFor, SHAPES, STALL_AT, targets, TRAY, traySlot } from './logic';

describe('Peg Garden', () => {
  it('grows every board shape with room for every plan, buds a pearl can pass between, and all above the sand', () => {
    for (const shape of SHAPES) {
      const all = grid(shape);
      expect(all.length, shape).toBeGreaterThanOrEqual(Math.max(...PLANS.map((p) => p.pegs)));
      expect(all.filter((s) => s.x > 80 && s.x < BOARD.w - 80).length, shape).toBeGreaterThanOrEqual(2 * Math.max(...PLANS.map((p) => p.count)));
      for (const a of all) {
        expect(a.y + BOARD.peg, shape).toBeLessThan(BOARD.h - 30);
        if (shape !== 'rows') expect(Math.min(a.x, BOARD.w - a.x), shape).toBeGreaterThanOrEqual(EDGE);
        for (const b of all) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y), shape).toBeGreaterThanOrEqual(80);
      }
    }
  });

  // A pearl let go with no sideways speed exactly over a bud can balance on it (the game ends that shot after ten seconds),
  // so these drops carry a little drift: what is checked is that no two buds wedge a pearl between them.
  it('never traps a pearl between buds or against a wall on the newer shapes: drops all along the ledge roll away', () => {
    for (const shape of SHAPES.filter((s) => s !== 'rows')) {
      for (let seed = 1; seed <= 3; seed++) {
        const spots = makeBoard(planFor(1), new Rng(seed), shape);
        const world = { pegs: spots.map((s) => ({ x: s.x, y: s.y, r: BOARD.peg })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
        for (let x = BOARD.ball; x <= BOARD.w - BOARD.ball; x += 40) {
          const { landed } = simulate({ x, y: 40, vx: x < BOARD.w / 2 ? 12 : -12, vy: 60, r: BOARD.ball }, world, BOARD.h, 10, 1 / 60);
          expect(landed.y - BOARD.ball, `${shape} seed ${seed} x ${x}`).toBeGreaterThanOrEqual(BOARD.h);
        }
      }
    }
  });

  it('draws a look from the seed, every shape and backdrop in turn, and keeps the first look without one (couch play)', () => {
    expect(pickTheme(null)).toEqual({ shape: 'rows', backdrop: 'shallows' });
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const t = pickTheme(new Rng(seed));
      seen.add(t.shape).add(t.backdrop);
    }
    expect([...seen].sort()).toEqual([...SHAPES, ...BACKDROPS].sort());
  });

  it('opens a numbered bud on the aiming levels only when it is the one asked for, and every other bud at a touch', () => {
    expect(blooms(3, 'number', 3)).toBe(true);
    expect(blooms(2, 'number', 3)).toBe(false);
    expect(blooms(4, 'order', 1)).toBe(false);
    expect(blooms(1, 'order', 1)).toBe(true);
    // After the last ask nothing numbered opens until the finish opens the whole garden.
    expect(blooms(1, 'order', undefined)).toBe(false);
    for (const mode of ['number', 'order', 'color', 'bloom', 'drop'] as const) {
      expect(blooms('plain', mode, 2)).toBe(true);
      expect(blooms('special', mode, 2)).toBe(true);
    }
  });

  it('lines the tray slots up inside the sand, one pearl width apart', () => {
    for (let i = 0; i < TRAY.slots + 3; i++) {
      const s = traySlot(i);
      expect(s.y).toBeGreaterThan(BOARD.h - 30);
      expect(s.x).toBeGreaterThan(20);
      expect(s.x).toBeLessThan(BOARD.w - 20);
      if (i > 0 && i < TRAY.slots) expect(s.x - traySlot(i - 1).x).toBe(TRAY.gap);
    }
    expect(traySlot(TRAY.slots + 2)).toEqual(traySlot(TRAY.slots - 1));
  });

  it('grows buds on the grid, with the right number of specials and numbers', () => {
    for (const plan of PLANS) for (const shape of SHAPES) {
      const all = grid(shape);
      for (let seed = 1; seed <= 25; seed++) {
        const board = makeBoard(plan, new Rng(seed), shape);
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

  it('can hit every numbered bud with some aim, on every shape', { timeout: 60_000 }, () => {
    const plan = planFor(4);
    for (const shape of SHAPES) for (let seed = 1; seed <= 8; seed++) {
      const board = makeBoard(plan, new Rng(seed), shape);
      const world = { pegs: board.map((s) => ({ x: s.x, y: s.y, r: BOARD.peg })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
      const reachable = new Set<number>();
      for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.01) {
        const { hits } = simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, world, BOARD.h, 6, 1 / 30);
        for (const h of hits) if (typeof board[h].kind === 'number') reachable.add(board[h].kind as number);
      }
      expect([...reachable].sort(), `${shape} seed ${seed}`).toEqual([1, 2, 3, 4, 5]);
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
      for (const shape of SHAPES) for (let seed = 1; seed <= 4; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng, shape);
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
          expect(++shots, `${plan.mode} ${shape} seed ${seed}`).toBeLessThanOrEqual(plan.mode === 'bloom' ? 10 : 14);
        }
      }
      // The game steps a pearl as the simulation does, so a shot the bot is sure of lands on the colour level.
      if (plan.mode === 'color') expect(sureHits).toBe(sureShots);
    }
  });

  it("finishes a bloom level even when the same spot is tapped every time", { timeout: 60_000 }, () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bloom')) {
      for (const shape of SHAPES) for (let seed = 1; seed <= 4; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng, shape);
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
            expect(++shots, `${shape} seed ${seed} tap ${tapX}`).toBeLessThanOrEqual(20);
          }
        }
      }
    }
  });

  it('finishes the colour level even when the same spot is tapped every time, with a miss only for her own choice of spot', { timeout: 60_000 }, () => {
    const plan = planFor(3);
    expect(driftOf('color')).toBe(0);
    for (const shape of SHAPES) for (let seed = 1; seed <= 4; seed++) {
      const spots = makeBoard(plan, new Rng(seed), shape);
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
          expect(++shots, `${shape} seed ${seed} tap ${tapX}`).toBeLessThanOrEqual(16);
        }
      }
    }
  });

  it('puts the colour hint on a ledge spot whose pearl touches a waiting orange bud, on every board and as buds bloom', { timeout: 60_000 }, () => {
    const plan = planFor(3);
    for (const shape of SHAPES) for (let seed = 1; seed <= 10; seed++) {
      const spots = makeBoard(plan, new Rng(seed), shape);
      const world = worldOf(spots);
      const bloomed = spots.map(() => false);
      const want = (i: number) => !bloomed[i] && spots[i].kind === 'special';
      while (spots.some((_, i) => want(i))) {
        const { x } = dropAt(world, want, 0, true);
        const { hits } = simulate({ x, y: 40, vx: 0, vy: 60, r: BOARD.ball }, world, BOARD.h, 12, 1 / 30);
        expect(hits.some(want), `${shape} seed ${seed}`).toBe(true);
        hits.forEach((i) => (bloomed[i] = true));
      }
    }
  });

  it("aims the ghost finger's launcher so the shot touches the flower asked for, on every board", { timeout: 60_000 }, () => {
    for (const plan of PLANS.filter((p) => p.mode === 'number' || p.mode === 'order')) {
      for (const shape of SHAPES) for (let seed = 1; seed <= 7; seed++) {
        const rng = new Rng(seed);
        const spots = makeBoard(plan, rng, shape);
        const world = worldOf(spots);
        for (const n of plan.mode === 'order' ? Array.from({ length: plan.count }, (_, i) => i + 1) : targets(plan, rng)) {
          const want = spots.findIndex((s) => s.kind === n);
          const angle = aimAt(world, want, 0);
          expect(angle, `${plan.mode} ${shape} seed ${seed}: flower ${n}`).not.toBeNull();
          expect(Math.abs(angle!)).toBeLessThanOrEqual(AIM_LIMIT);
          expect(simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(angle!), r: BOARD.ball }, world, BOARD.h, 12, 1 / 30).hits).toContain(want);
        }
      }
    }
  });

  it('level 8 grows four huge buds, apart from each other and the walls, and every one is reachable with margin', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG_PLAN);
    const spots = makeBoard(BIG_PLAN, new Rng(3));
    expect(spots).toHaveLength(4);
    for (const a of spots) {
      expect(a.r).toBe(BIG_PEG);
      expect(a.x - BIG_PEG).toBeGreaterThanOrEqual(2 * BOARD.ball);
      expect(BOARD.w - a.x - BIG_PEG).toBeGreaterThanOrEqual(2 * BOARD.ball);
      expect(a.y + BIG_PEG).toBeLessThan(BOARD.h - 30);
      for (const b of spots) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y) - 2 * BIG_PEG).toBeGreaterThanOrEqual(2 * BOARD.ball);
    }
    const world = { pegs: spots.map((s) => ({ x: s.x, y: s.y, r: s.r! })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
    spots.forEach((_, i) => {
      // Some place on the ledge reaches the bud on every try, drifting either way.
      for (const drift of [-DRIFT, DRIFT]) expect(dropAt(world, (b) => b === i, drift).sure, `bud ${i} drift ${drift}`).toBe(true);
    });
  });

  it('level 8 never traps a pearl: drops all along the ledge reach the sand', () => {
    const spots = makeBoard(BIG_PLAN, new Rng(1));
    const world = { pegs: spots.map((s) => ({ x: s.x, y: s.y, r: s.r! })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
    for (let x = BOARD.ball; x <= BOARD.w - BOARD.ball; x += 20) {
      const { landed } = simulate({ x, y: 40, vx: x < BOARD.w / 2 ? 12 : -12, vy: 60, r: BOARD.ball }, world, BOARD.h, 10, 1 / 60);
      expect(landed.y - BOARD.ball, `x ${x}`).toBeGreaterThanOrEqual(BOARD.h);
    }
  });

  it('a stuck tapper on level 8 is guided over a waiting flower', () => {
    expect(guided('big', STALL_AT, false)).toBe(true);
    expect(guided('big', 0, false)).toBe(false);
  });
});
