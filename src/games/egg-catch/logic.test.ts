import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import { repairBoards, repairTarget, repairGate, simulateFlipflop, flipflopBoards, laneChoice, pairBoards, pairExits, pairGateToFlip, pairNeeds, basketMove, caught, glowLane, HenPace, exitFor, exitWanted, gatesFor, gateToFlip, routeTouch, LANES, makeEggs, PLANS, targetsFor, predictGates, BARN_ASPECT, exitOffsets, farBarnAt, HORIZON, laneXs, routeCx, type EggInAir, type Shell, HEN_SHELLS, HEN_NOTES, SHELL } from './logic';

describe('Egg Catch', () => {
  it('lays eggs in changing lanes, with white eggs only where asked and never three in a row', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const eggs = makeEggs(plan, new Rng(seed));
        for (const e of eggs) expect(e.lane).toBeLessThan(LANES);
        eggs.slice(1).forEach((e, i) => expect(e.lane).not.toBe(eggs[i].lane));
        const mixes = plan.mode === 'brown' || plan.mode === 'sort';
        if (mixes) expect(eggs.every((e) => e.shell === 'brown' || e.shell === 'white')).toBe(true);
        else if (plan.mode === 'tap' || plan.mode === 'lane' || plan.mode === 'catch') expect(eggs.every((e) => e.shell === HEN_SHELLS[e.lane])).toBe(true);
        else expect(eggs.every((e) => e.shell === 'brown')).toBe(true);
        eggs.slice(2).forEach((e, i) => expect(e.shell === 'white' && eggs[i].shell === 'white' && eggs[i + 1].shell === 'white').toBe(false));
        expect(eggs.filter((e) => e.shell !== 'white').length).toBeGreaterThanOrEqual(plan.eggs);
      }
    }
  });

  it('keeps early shells visibly apart from white and every coloured egg catchable by the bot', () => {
    expect(new Set(HEN_NOTES).size).toBe(LANES);
    for (const shell of HEN_SHELLS) {
      expect(shell).not.toBe('white');
      const rgb = (n: number) => [n >> 16, (n >> 8) & 255, n & 255];
      expect(Math.hypot(...rgb(SHELL[shell].fill).map((c, i) => c - rgb(SHELL.white.fill)[i]))).toBeGreaterThan(100);
      expect(basketMove([{ x: 600, shell }], 230, [230, 420, 600, 790])).toBe(600);
      expect(glowLane([{ lane: 2, shell, t: 0.5 }], [{ lane: 0, shell: 'brown' }], 0)).toBe(2);
    }
    expect(new Set(makeEggs(PLANS[1], new Rng(7), 100).map((e) => e.shell))).toEqual(new Set(['brown', 'speckled', 'blue']));
  });

  it('routes every exit with the gates the hint shows', () => {
    for (let exit = 0; exit < 4; exit++) {
      for (let other = 0; other < 2; other++) {
        const gates: [boolean, boolean, boolean] = [false, !!other, !!other];
        for (const { gate, right } of gatesFor(exit)) gates[gate] = right;
        expect(exitFor(gates)).toBe(exit);
      }
    }
  });

  it('deals the single fork fairly and solves it with at most one flip, using the same hint and bot', () => {
    const plan = PLANS[8];
    expect(plan).toMatchObject({ mode: 'route', singleGate: true, eggs: 4 });
    for (let seed = 1; seed <= 100; seed++) {
      const targets = targetsFor(plan, new Rng(seed));
      expect(new Set(targets.map((t) => t.basket))).toEqual(new Set([0, 1]));
      targets.forEach(({ basket, nest }, i) => {
        expect(nest).toBe(1 - basket);
        expect([0, 1, 2].every((offset) => targets[(i + offset) % targets.length].basket === basket)).toBe(false);
        for (const start of [false, true]) {
          const gates = [start, false, false];
          const hint = gatesFor(basket, true);
          expect(hint).toEqual([{ gate: 0, right: basket === 1 }]);
          expect(routeTouch(gates, basket, true)).toBe(Number(start) === basket ? 'go' : 0);
          const flip = gateToFlip(gates, basket, 0, true);
          if (flip !== null) gates[flip] = !gates[flip];
          expect(Number(gates[0])).toBe(basket);
          expect(routeTouch(gates, basket, true)).toBe('go');
          expect(gateToFlip([!gates[0]], basket, 1, true)).toBeNull();
        }
      });
    }
  });

  it('keeps the basket and nest apart, and catches generously', () => {
    for (const t of targetsFor(PLANS[4], new Rng(2))) expect(t.nest).not.toBe(t.basket);
    expect(caught(100, 180)).toBe(true);
    expect(caught(100, 230)).toBe(false);
  });

  it('predict levels set the gates so the egg lands somewhere new each time', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const gs = predictGates(new Rng(seed), 8);
      gs.slice(1).forEach((g, i) => expect(exitFor(g)).not.toBe(exitFor(gs[i])));
    }
  });

  it('rolls a waiting egg only once its gates are set: the ghost finger flips at most two gates, then taps the green arrow', () => {
    for (const exit of [0, 1, 2, 3]) {
      for (let bits = 0; bits < 8; bits++) {
        const g = [!!(bits & 1), !!(bits & 2), !!(bits & 4)];
        let taps = 0;
        for (let touch = routeTouch(g, exit); touch !== 'go'; touch = routeTouch(g, exit)) {
          expect(++taps).toBeLessThanOrEqual(2);
          g[touch] = !g[touch];
        }
        expect(exitFor(g as [boolean, boolean, boolean])).toBe(exit);
      }
      // Already set: straight to the arrow, with nothing flipped.
      const set = [false, false, false];
      for (const { gate, right } of gatesFor(exit)) set[gate] = right;
      expect(routeTouch(set, exit)).toBe('go');
    }
  });

  it("sets the gates for the ghost finger's egg: only flips that matter, none for a gate the egg has gone by, and the egg ends at the exit asked for", () => {
    for (const exit of [0, 1, 2, 3]) {
      for (let bits = 0; bits < 8; bits++) {
        const gates = [!!(bits & 1), !!(bits & 2), !!(bits & 4)];
        for (let passed = 0; passed <= 2; passed++) {
          const g = [...gates];
          const flipped: number[] = [];
          for (let gate = gateToFlip(g, exit, passed); gate !== null; gate = gateToFlip(g, exit, passed)) {
            expect(flipped.length).toBeLessThan(2);
            // Never the gate the egg has already gone by (gate 0 is first; the branch gate second).
            if (passed >= 1) expect(gate).not.toBe(0);
            flipped.push(gate);
            g[gate] = !g[gate];
          }
          // With nothing passed the egg reaches the exit; with the first gate passed, the exit the first gate and the branch give.
          if (passed === 0) expect(exitFor(g as [boolean, boolean, boolean])).toBe(exit);
          if (passed === 2) expect(flipped).toEqual([]);
        }
      }
    }
    expect(exitWanted('sort', 'white', { basket: 1, nest: 3 })).toBe(3);
    expect(exitWanted('sort', 'brown', { basket: 1, nest: 3 })).toBe(1);
    expect(exitWanted('route', 'white', { basket: 1, nest: 3 })).toBe(1);
  });

  it('slides the basket under brown eggs and away from white ones, never undoing the egg that lands first', () => {
    const lanes = spread(LANES, 230, 1024 - 110, 190);
    const at = (lane: number, shell: 'brown' | 'white'): EggInAir => ({ x: lanes[lane], shell });
    expect(basketMove([at(2, 'brown')], lanes[1], lanes)).toBe(lanes[2]);
    expect(basketMove([at(1, 'brown')], lanes[1], lanes)).toBeNull();
    // A white egg over the basket: step aside, to the nearest clear lane.
    const aside = basketMove([at(1, 'white')], lanes[1], lanes);
    expect(aside).not.toBeNull();
    expect(Math.abs(aside! - lanes[1])).toBeGreaterThan(125);
    // Behind a white egg, a brown one: go straight to its lane.
    expect(basketMove([at(1, 'white'), at(3, 'brown')], lanes[1], lanes)).toBe(lanes[3]);
    // Under a brown egg, with another brown one coming: wait until the first has landed.
    expect(basketMove([at(1, 'brown'), at(3, 'brown')], lanes[1], lanes)).toBeNull();
    expect(basketMove([at(3, 'brown')], lanes[1], lanes)).toBe(lanes[3]);
    // A slide that would pass through the lane of a white egg about to land waits for it.
    expect(basketMove([at(2, 'white'), at(3, 'brown')], lanes[0], lanes)).toBeNull();
    expect(basketMove([at(2, 'white'), at(3, 'brown')], lanes[3], lanes)).toBeNull();
    // Never moves under a white egg, wherever the basket starts and whatever follows.
    for (let a = 0; a < LANES; a++) {
      for (let b = 0; b < LANES; b++) {
        for (let c = 0; c < LANES; c++) {
          for (const shells of [['white', 'brown'], ['brown', 'white'], ['white', 'white']] as const) {
            if (a === b) continue;
            const air = [at(a, shells[0]), at(b, shells[1])];
            const x = basketMove(air, lanes[c], lanes);
            if (x === null) continue;
            // It only moves if the basket was wrong for some egg, and the new place is right for every egg up to that one.
            const k = air.findIndex((e) => (e.shell === 'brown' ? Math.abs(lanes[c] - e.x) > 38 : Math.abs(lanes[c] - e.x) <= 125));
            expect(k).toBeGreaterThanOrEqual(0);
            for (const e of air.slice(0, k + 1)) expect(e.shell === 'brown' ? Math.abs(x - e.x) <= 38 : Math.abs(x - e.x) > 125).toBe(true);
          }
        }
      }
    }
  });

  it("plays the catching levels with the ghost finger's timing: a tap takes at least 0.45 s to arrive, the basket slides at 900 a second, and no brown egg is missed and no white one caught", () => {
    const lanes = spread(LANES, 230, 1024 - 110, 190);
    for (const plan of PLANS.filter((p) => p.mode === 'catch' || p.mode === 'brown')) {
      for (let seed = 1; seed <= 200; seed++) {
        const eggs = makeEggs(plan, new Rng(seed));
        const air: { lane: number; shell: Shell; t: number }[] = [];
        let basket = lanes[1];
        let target = basket;
        let finger = lanes[1] + 90;
        let free = 0;
        let down: { at: number; x: number } | null = null;
        let spawn = 1.2;
        let next = 0;
        let got = 0;
        const dt = 1 / 60;
        for (let t = 0; got < plan.eggs && t < 120; t += dt) {
          if (down && t >= down.at) {
            target = down.x;
            down = null;
          }
          if (t >= free && !down) {
            const x = basketMove(air.map((e) => ({ x: lanes[e.lane], shell: e.shell })), target, lanes);
            if (x !== null) {
              const travel = Math.min(0.95, Math.max(0.45, Math.abs(x - finger) / 560));
              down = { at: t + travel, x };
              finger = x;
              // The press, the lift and the rest after a tap (pause 0.2).
              free = t + travel + 0.22 + 0.2 + 0.2;
            }
          }
          basket += Math.sign(target - basket) * Math.min(Math.abs(target - basket), 900 * dt);
          spawn -= dt;
          if (spawn <= 0 && air.length < (plan.mode === 'brown' ? 2 : 1)) {
            const e = eggs[next++];
            air.push({ lane: e.lane, shell: e.shell, t: 0 });
            spawn = plan.mode === 'brown' ? 1.8 : 1.2;
          }
          for (const e of air) e.t += dt / plan.fall;
          while (air.length && air[0].t >= 1) {
            const e = air.shift()!;
            const inBasket = caught(lanes[e.lane], basket);
            if (e.shell !== 'white') {
              expect(inBasket, `${plan.mode} seed ${seed}: a brown egg landed in the hay at ${t.toFixed(1)} s`).toBe(true);
              got++;
            } else expect(inBasket, `${plan.mode} seed ${seed}: a white egg landed in the basket at ${t.toFixed(1)} s`).toBe(false);
          }
        }
        expect(got).toBe(plan.eggs);
      }
    }
  });

  /** Catching levels as the game runs them: lay when the timer and the hens allow, land after the fall. */
  function run(level: 2 | 3, seconds: number, playing: (t: number) => boolean) {
    const plan = PLANS[level - 1];
    const pace = new HenPace();
    const air: { k: number; t: number }[] = [];
    let laid = 0;
    let unplayed = 0;
    let spawnIn = 1.2;
    const dt = 1 / 60;
    for (let t = 0; t < seconds; t += dt) {
      if (playing(t)) pace.play();
      spawnIn -= dt;
      if (spawnIn <= 0 && air.length < (level === 3 ? 2 : 1) && pace.canLay(air.length)) {
        air.push({ k: pace.lay(), t: 0 });
        laid++;
        spawnIn = level === 3 ? 1.8 : 1.2;
      }
      for (const e of [...air]) {
        e.t += dt / plan.fall;
        if (e.t >= 1) {
          air.splice(air.indexOf(e), 1);
          if (!pace.land(e.k)) unplayed++;
        }
      }
    }
    return { laid, unplayed, pace };
  }

  it('hens wait when nobody plays: an idle round lays one egg, and it is no miss', () => {
    for (const level of [2, 3] as const) {
      const idle = run(level, 60, () => false);
      expect(idle.laid).toBe(1);
      expect(idle.unplayed).toBe(1);
      expect(idle.pace.awake).toBe(false);
      // Playing all along keeps them laying, and every landing was played over.
      const busy = run(level, 60, () => true);
      expect(busy.laid).toBeGreaterThan(10);
      expect(busy.unplayed).toBe(0);
      // A look-away in the middle costs at most one unplayed egg; the next touch wakes them.
      const away = run(level, 60, (t) => t < 15 || t > 40);
      expect(away.unplayed).toBeLessThanOrEqual(level === 3 ? 2 : 1);
      expect(away.laid).toBeGreaterThan(idle.laid);
      expect(away.pace.awake).toBe(true);
    }
  });

  it('a second egg in the air waits for play since the last one', () => {
    const pace = new HenPace();
    pace.play();
    pace.lay();
    expect(pace.canLay(1)).toBe(false);
    pace.play();
    expect(pace.canLay(1)).toBe(true);
    expect(pace.canLay(0)).toBe(true);
  });

  it('the hint glows the lane of the next brown egg', () => {
    for (const level of [2, 3]) {
      for (let seed = 1; seed <= 100; seed++) {
        const eggs = makeEggs(PLANS[level - 1], new Rng(seed));
        for (let next = 0; next < eggs.length; next++) {
          // Nothing in the air: the next brown egg the hens will lay.
          const upcoming = [...eggs.slice(next), ...eggs].find((e) => e.shell !== 'white')!;
          expect(glowLane([], eggs, next)).toBe(upcoming.lane);
        }
      }
    }
    const eggs = makeEggs(PLANS[2], new Rng(4));
    // In the air, the brown egg that lands first wins over a white egg lower down and the stream.
    expect(glowLane([{ lane: 0, shell: 'white', t: 0.9 }, { lane: 2, shell: 'brown', t: 0.3 }, { lane: 3, shell: 'brown', t: 0.6 }], eggs, 0)).toBe(3);
  });
});

it('deals solvable unsolved two-hen boards, with hints that fix a needed gate', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const boards = pairBoards(new Rng(seed), 12);
    expect(boards).toEqual(pairBoards(new Rng(seed), 12));
    for (const b of boards) {
      expect(b.basket).not.toBe(b.nest);
      expect(pairExits(b.gates, b.whiteBranch)).not.toEqual([b.basket, b.nest]);
      const solutions = Array.from({ length: 8 }, (_, bits) => [!!(bits & 1), !!(bits & 2), !!(bits & 4)] as [boolean, boolean, boolean])
        .filter((g) => pairExits(g, b.whiteBranch).every((exit, i) => exit === [b.basket, b.nest][i]));
      expect(solutions).toHaveLength(1);
      const gates = [...b.gates];
      let steps = 0;
      for (let gate = pairGateToFlip(b, gates); gate !== null; gate = pairGateToFlip(b, gates)) {
        expect(++steps).toBeLessThanOrEqual(3);
        expect(pairNeeds(b).find((n) => n.gate === gate)?.right).not.toBe(gates[gate]);
        gates[gate] = !gates[gate];
      }
      expect(pairExits(gates as [boolean, boolean, boolean], b.whiteBranch)).toEqual([b.basket, b.nest]);
    }
  }
});

it('Under the hen deals five changing cues and accepts a forgiving tap only under the calling hen', () => {
  const plan = PLANS[7];
  expect(plan.mode).toBe('lane');
  expect(plan.eggs).toBe(5);
  for (const width of [1024, 1365]) {
    const lanes = spread(LANES, 150, width - 40, 220);
    for (let seed = 1; seed <= 100; seed++) {
      const eggs = makeEggs(plan, new Rng(seed), plan.eggs);
      expect(eggs).toEqual(makeEggs(plan, new Rng(seed), plan.eggs));
      eggs.slice(1).forEach((e, i) => expect(e.lane).not.toBe(eggs[i].lane));
      for (const egg of eggs) {
        for (let lane = 0; lane < LANES; lane++) {
          for (const offset of [-95, 0, 95]) {
            expect(laneChoice(lanes[lane] + offset, lanes, egg.lane)).toEqual({ lane, lay: lane === egg.lane });
          }
        }
      }
    }
    expect(laneChoice(-200, lanes, 0)).toEqual({ lane: 0, lay: true });
    expect(laneChoice(width + 200, lanes, 3)).toEqual({ lane: 3, lay: true });
  }
});


it('deals four visible failed runs with exactly one repair on the trace and a truthful hint', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const boards = repairBoards(new Rng(seed), 4);
    expect(boards).toEqual(repairBoards(new Rng(seed), 4));
    expect(boards.map((b) => b.shell)).toEqual(['brown', 'brown', 'white', 'white']);
    for (const board of boards) {
      const target = repairTarget(board);
      const failed = exitFor(board.gates);
      expect(failed).not.toBe(board.basket);
      expect(failed).not.toBe(board.nest);
      const repairs = [0, 1, 2].filter((i) => {
        const gates = [...board.gates] as typeof board.gates;
        gates[i] = !gates[i];
        return exitFor(gates) === target;
      });
      expect(repairs).toHaveLength(1);
      expect([0, board.gates[0] ? 2 : 1]).toContain(repairs[0]);
      expect(repairGate(board.gates, target)).toBe(repairs[0]);
      // Even an experimental multi-gate revision gets a hint that reaches the destination.
      for (let bits = 0; bits < 8; bits++) {
        const gates = [!!(bits & 1), !!(bits & 2), !!(bits & 4)] as typeof board.gates;
        let flips = 0;
        for (let gate = repairGate(gates, target); gate !== null; gate = repairGate(gates, target)) {
          expect(++flips).toBeLessThanOrEqual(2);
          gates[gate] = !gates[gate];
        }
        expect(exitFor(gates)).toBe(target);
      }
    }
  }
});

it('simulates the spring after each passage and deals one unique working start for both top-entry eggs', () => {
  const starts = Array.from({ length: 8 }, (_, bits) => [!!(bits & 1), !!(bits & 2), !!(bits & 4)] as [boolean, boolean, boolean]);
  for (const start of starts) {
    const before = [...start];
    const result = simulateFlipflop(start);
    expect(result.exits).toEqual([exitFor(start), exitFor([!start[0], start[1], start[2]])]);
    expect(result.gates).toEqual(start);
    expect(start).toEqual(before);
  }
  for (let seed = 1; seed <= 200; seed++) {
    for (const board of flipflopBoards(new Rng(seed), 3)) {
      expect(board.basket < 2).not.toBe(board.nest < 2);
      expect(simulateFlipflop(board.gates).exits).not.toEqual([board.basket, board.nest]);
      const solutions = starts.filter((g) => simulateFlipflop(g).exits.every((exit, i) => exit === [board.basket, board.nest][i]));
      expect(solutions).toHaveLength(1);
      const gates = [...board.gates];
      for (const { gate, right } of pairNeeds(board)) gates[gate] = right;
      expect(simulateFlipflop(gates).exits).toEqual([board.basket, board.nest]);
    }
  }
});

describe('Egg Catch far barn', () => {
  // Logical views: iPad landscape, an iPad Air, a wide phone, iPad portrait and the tallest view before the turn prompt.
  const VIEWS = [[1024, 768], [1105, 768], [1365, 768], [768, 1024], [1024, 1365], [1024, 1638]] as const;
  const overlaps = (a: number[], b: number[]) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  it('stands a far barn, 60 to 80 tall, on the horizon at the left of every level, at every view', () => {
    for (const plan of PLANS) {
      for (const [w, h] of VIEWS) {
        const barn = farBarnAt(plan, w, h);
        expect(barn, `${plan.name} ${w}x${h}`).not.toBeNull();
        expect(barn!.height).toBeGreaterThanOrEqual(60);
        expect(barn!.height).toBeLessThanOrEqual(80);
        expect(barn!.base).toBe(h * HORIZON);
      }
    }
  });

  it('keeps the barn on screen, above the pet, and clear of every lane, hay pile, tap column, chute and bin', () => {
    for (const plan of PLANS) {
      const routing = !['tap', 'lane', 'catch', 'brown'].includes(plan.mode);
      for (const [w, h] of VIEWS) {
        const barn = farBarnAt(plan, w, h)!;
        const half = (barn.height * BARN_ASPECT) / 2 + 4; // the trim overhangs the walls by 4
        const box = [barn.x - half, barn.base - barn.height - 3, barn.x + half, barn.base];
        const at = `${plan.name} ${w}x${h}`;
        expect(box[0], at).toBeGreaterThanOrEqual(0);
        expect(box[3], at).toBeLessThan(h - 205); // the pet's corner
        if (routing) {
          for (const dx of exitOffsets(!!plan.singleGate)) {
            const x = routeCx(w) + dx;
            expect(overlaps(box, [x - 17, 0, x + 17, h]), `${at} chute`).toBe(false);
            expect(overlaps(box, [x - 80, h - 160, x + 80, h]), `${at} bin`).toBe(false);
          }
        } else {
          for (const x of laneXs(plan.mode, w)) expect(overlaps(box, [x - 85, 0, x + 85, h]), `${at} lane`).toBe(false);
          if (plan.mode === 'lane') expect(box[2], `${at} tap columns`).toBeLessThan(150);
        }
      }
    }
  });
});
