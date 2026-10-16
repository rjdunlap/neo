import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { simulate, stepBall, type Ball } from '../../engine/ball';
import { aimFor, CATCH_Y, FLIPPER, flight, kickBall, kickReach, LAUNCH, launchVelocity, makeBumpers, makeWorld, orderNumbers, planFlip, planFor, PLANS, restingFlippers, pickTable, TABLE_IDS, TABLE_SPOTS, STEP, swingFlippers, TABLE } from './logic';
import { bumperGarden } from './index';
import { levelsInOrder, nextLevelOffer, stepLevel } from '../../progress/difficulty';

describe('Bumper Garden', () => {
  it('rebuilds the same table and flowers from a seed and offers all three themes', () => {
    const seen = new Set<string>();
    const round = (seed: number) => {
      const rng = new Rng(seed);
      const table = pickTable(rng);
      seen.add(table);
      return { table, bumpers: makeBumpers(PLANS[5], rng, table) };
    };
    for (let seed = 1; seed <= 30; seed++) expect(round(seed)).toEqual(round(seed));
    expect([...seen].sort()).toEqual([...TABLE_IDS].sort());
  });

  it.each(TABLE_IDS)('can bump every %s flower spot with some launch', (table) => {
    const bumpers = TABLE_SPOTS[table].map((s) => ({ ...s, color: 0, number: null }));
    const world = makeWorld(bumpers);
    for (let i = 0; i < bumpers.length; i++) expect(aimFor(world, bumpers.length, (k) => k === i), `spot ${i}`).not.toBeNull();
  });

  it.each(TABLE_IDS)('reaches every %s spot and returns at the game physics step', table => {
    const bumpers = TABLE_SPOTS[table].map(s => ({ ...s, color: 0, number: null }));
    const world = makeWorld(bumpers);
    const reached = new Set<number>();
    for (let k = -42; k <= 42; k++) {
      const result = simulate({ x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(k * 0.01), r: TABLE.ball }, world, CATCH_Y, 40, STEP);
      result.hits.filter(i => i < bumpers.length).forEach(i => reached.add(i));
      expect(result.landed.y + TABLE.ball, `${table} angle ${k / 100}`).toBeGreaterThanOrEqual(CATCH_Y);
    }
    expect(reached.size).toBe(bumpers.length);
  });

  it.each(TABLE_IDS)('never traps the ladybug on %s: every launch comes back down to the pot', (table) => {
    for (let seed = 1; seed <= 12; seed++) {
      const plans = Object.values(PLANS);
      const plan = plans[seed % plans.length];
      const world = makeWorld(makeBumpers(plan, new Rng(seed), table));
      for (let a = -0.42; a <= 0.42; a += 0.06) {
        const { landed } = flight(world, a, 40);
        expect(landed.y + TABLE.ball, `seed ${seed} angle ${a.toFixed(2)}`).toBeGreaterThanOrEqual(CATCH_Y);
        expect(landed.x).toBeGreaterThan(0);
        expect(landed.x).toBeLessThan(TABLE.w);
      }
    }
  });

  it('sets out the right flowers: one color to bloom, or numbers to bump in order', () => {
    for (const table of TABLE_IDS) for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 100; seed++) {
        const bumpers = makeBumpers(plan, new Rng(seed), table);
        expect(bumpers).toHaveLength(plan.bumpers);
        // Flowers never overlap.
        for (const a of bumpers) for (const b of bumpers) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(TABLE.bumper * 2 + TABLE.ball * 2);
        if (plan.mode === 'color') expect(bumpers.filter((b) => b.color === 0)).toHaveLength(plan.goal);
        if (plan.mode === 'order') {
          const numbers = bumpers.map((b) => b.number).filter((n) => n !== null).sort((a, b) => a - b);
          expect(numbers).toEqual(orderNumbers(plan).sort((a, b) => a - b));
        }
      }
    }
  });

  it('keeps the original number rounds and saved IDs, inserting only the built new levels in the pre-K ladder', () => {
    expect(orderNumbers(planFor(4))).toEqual([1, 2, 3]);
    expect(orderNumbers(planFor(5))).toEqual([1, 2, 3, 4, 5]);
    const range = bumperGarden.levels('prek');
    expect(levelsInOrder(range)).toEqual([3, 4, 6, 5, 9]);
    expect(nextLevelOffer(4, range)).toBe(6);
    expect(nextLevelOffer(6, range)).toBe(5);
    expect(nextLevelOffer(5, range)).toBe(9);
    expect(stepLevel(9, -1, range)).toBe(5);
    expect(nextLevelOffer(9, range)).toBeNull();
    for (const id of [3, 4, 5]) expect(stepLevel(id, 0, range)).toBe(id);
    expect(levelsInOrder(bumperGarden.levels('preschool'))).toEqual([2, 3, 4]);
  });

  it('makes reproducible count-on and count-back sequences with one reachable flower for each target', () => {
    const starts = new Set<number>();
    const backs = new Set<number>();
    for (const table of TABLE_IDS) for (const level of [6, 9]) for (let seed = 1; seed <= 40; seed++) {
      const plan = planFor(level, new Rng(seed));
      expect(plan).toEqual(planFor(level, new Rng(seed)));
      const numbers = orderNumbers(plan);
      expect(numbers).toHaveLength(plan.goal);
      expect(new Set(numbers).size).toBe(plan.goal);
      expect(plan.goal).toBeLessThanOrEqual(plan.bumpers);
      expect(numbers.every(n => n >= 1 && n <= 9)).toBe(true);
      if (level === 6) {
        starts.add(numbers[0]);
        expect(numbers[0]).toBeGreaterThanOrEqual(2);
        expect(numbers[0]).toBeLessThanOrEqual(6);
        expect([3, 4]).toContain(numbers.length);
        numbers.slice(1).forEach((n, i) => expect(n).toBe(numbers[i] + 1));
      } else {
        backs.add(numbers[0]);
        expect(numbers[0]).toBeGreaterThanOrEqual(5);
        expect(numbers.at(-1)).toBe(1);
        numbers.slice(1).forEach((n, i) => expect(n).toBe(numbers[i] - 1));
      }
      const bumpers = makeBumpers(plan, new Rng(seed), table);
      const world = makeWorld(bumpers);
      for (const n of numbers) {
        const target = bumpers.findIndex(b => b.number === n);
        expect(bumpers.filter(b => b.number === n)).toHaveLength(1);
        expect(aimFor(world, bumpers.length, i => i === target), `level ${level} seed ${seed} number ${n}`).not.toBeNull();
      }
    }
    expect(starts.size).toBe(5);
    expect(backs.size).toBe(4);
    expect(orderNumbers(planFor(6))).toEqual([3, 4, 5]);
    expect(orderNumbers(planFor(9))).toEqual([5, 4, 3, 2, 1]);
  });

  it('bats the ladybug the way a flipper should: near the pivot it goes across, near the tip back the other way, nothing out of reach, and the chance is asked for only when it connects', () => {
    const ball = (x: number, y: number, vy = 200): Ball => ({ x, y, vx: 0, vy, r: TABLE.ball });
    let asked = 0;
    const noise = () => (asked++, 0);
    const pivot = kickBall(ball(FLIPPER.x + 4, FLIPPER.y - 30), 'left', false, noise)!;
    const tip = kickBall(ball(FLIPPER.x + FLIPPER.length, FLIPPER.y + 50), 'left', false, noise)!;
    expect(asked).toBe(2);
    expect(pivot.vx).toBeGreaterThan(250);
    expect(tip.vx).toBeLessThan(0);
    expect(pivot.vy).toBeLessThan(-850);
    // The right flipper is the left one mirrored.
    const mirrored = kickBall(ball(TABLE.w - FLIPPER.x - 4, FLIPPER.y - 30), 'right', false, noise)!;
    expect(mirrored.vx).toBeCloseTo(-pivot.vx, 5);
    // Out of reach, or already rising fast: nothing, and no chance drawn.
    asked = 0;
    expect(kickBall(ball(300, 100), 'left', false, noise)).toBeNull();
    expect(kickBall(ball(FLIPPER.x + 40, FLIPPER.y - 30, -400), 'left', false, noise)).toBeNull();
    expect(asked).toBe(0);
    // Young players reach farther.
    const far = ball(FLIPPER.x, FLIPPER.y - kickReach(TABLE.ball, false) - 8);
    expect(kickBall(far, 'left', false, noise)).toBeNull();
    expect(kickBall(far, 'left', true, noise)).not.toBeNull();
  });

  it('swings a flipper up fast while it is held and settles it back, moving its pegs', () => {
    const world = makeWorld([]);
    const flippers = restingFlippers();
    const pegsAt = world.pegs.length - 12;
    const tip = () => ({ ...world.pegs[pegsAt + 5] });
    const rest = tip();
    flippers.left.upFor = 0.2;
    for (let i = 0; i < 12; i++) swingFlippers(flippers, world, STEP);
    expect(flippers.left.angle).toBeCloseTo(FLIPPER.up, 5);
    expect(tip().y).toBeLessThan(rest.y);
    for (let i = 0; i < 120; i++) swingFlippers(flippers, world, STEP);
    expect(flippers.left.angle).toBeCloseTo(FLIPPER.rest, 5);
    expect(tip()).toEqual(rest);
  });

  it("plans the ghost finger's flip so the ladybug touches a flower that is still waiting, or else stays up for another go, and plans none when it will touch one anyway", () => {
    let planned = 0;
    let touchedOne = 0;
    let free = 0;
    for (const table of TABLE_IDS) for (const level of [3, 4, 5, 6, 9]) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 6; seed++) {
        const bumpers = makeBumpers(plan, new Rng(seed), table);
        const world = makeWorld(bumpers);
        const wanted = (i: number) => (plan.mode === 'color' ? bumpers[i].color === 0 : bumpers[i].number === orderNumbers(plan)[0]);
        for (const angle of [-0.3, -0.1, 0.15, 0.35]) {
          const start: Ball = { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(angle), r: TABLE.ball };
          const noise = (seed * 7 + angle * 10) % 40;
          const flip = planFlip(world, bumpers.length, start, false, noise, wanted);
          // Play it out as the game does: step by step, pressing on the planned step.
          const replay = (press: typeof flip) => {
            const w = { ...world, pegs: world.pegs.map((p) => ({ ...p })) };
            const flippers = restingFlippers();
            const b = { ...start };
            let touched = false;
            let pressed = false;
            let steps = 0;
            for (; steps < 120 * 12 && b.y + b.r < CATCH_Y; steps++) {
              if (press && !pressed && steps === press.frame) {
                pressed = true;
                flippers[press.side].upFor = 0.2;
                const v = kickBall(b, press.side, false, () => noise);
                if (v) Object.assign(b, v);
              }
              swingFlippers(flippers, w, STEP);
              if (stepBall(b, w, STEP).some((i) => i < bumpers.length && wanted(i))) touched = true;
            }
            return { touched, steps };
          };
          const alone = replay(null);
          if (!flip) {
            // Nothing planned: the ladybug touches one on its own, or no flip can help.
            if (alone.touched) free++;
            continue;
          }
          planned++;
          const played = replay(flip);
          if (played.touched) touchedOne++;
          // A flip that cannot reach a flower still keeps the ladybug up for a good while longer, for another go.
          expect(played.touched || played.steps > alone.steps + 60, `level ${level} seed ${seed} angle ${angle}: free ${alone.steps} steps, with the flip ${played.steps}, plan ${JSON.stringify(flip)}`).toBe(true);
        }
      }
    }
    expect(planned).toBeGreaterThan(5);
    expect(free).toBeGreaterThan(0);
    expect(touchedOne / planned).toBeGreaterThan(0.4);
  });
});
