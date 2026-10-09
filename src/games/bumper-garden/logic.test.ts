import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { stepBall, type Ball } from '../../engine/ball';
import { aimFor, CATCH_Y, FLIPPER, flight, kickBall, kickReach, LAUNCH, launchVelocity, makeBumpers, makeWorld, planFlip, PLANS, restingFlippers, SPOTS, STEP, swingFlippers, TABLE } from './logic';

describe('Bumper Garden', () => {
  it('can bump every flower spot with some launch', () => {
    const bumpers = SPOTS.map((s) => ({ ...s, color: 0, number: null }));
    const world = makeWorld(bumpers);
    for (let i = 0; i < SPOTS.length; i++) expect(aimFor(world, bumpers.length, (k) => k === i), `spot ${i}`).not.toBeNull();
  });

  it('never traps the ladybug: every launch comes back down to the pot', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const plan = PLANS[seed % PLANS.length];
      const world = makeWorld(makeBumpers(plan, new Rng(seed)));
      for (let a = -0.42; a <= 0.42; a += 0.06) {
        const { landed } = flight(world, a, 40);
        expect(landed.y + TABLE.ball, `seed ${seed} angle ${a.toFixed(2)}`).toBeGreaterThanOrEqual(CATCH_Y);
        expect(landed.x).toBeGreaterThan(0);
        expect(landed.x).toBeLessThan(TABLE.w);
      }
    }
  });

  it('sets out the right flowers: one color to bloom, or numbers to bump in order', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const bumpers = makeBumpers(plan, new Rng(seed));
        expect(bumpers).toHaveLength(plan.bumpers);
        // Flowers never overlap.
        for (const a of bumpers) for (const b of bumpers) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(TABLE.bumper * 2 + TABLE.ball * 2);
        if (plan.mode === 'color') expect(bumpers.filter((b) => b.color === 0)).toHaveLength(plan.goal);
        if (plan.mode === 'order') {
          const numbers = bumpers.map((b) => b.number).filter((n) => n !== null).sort();
          expect(numbers).toEqual(Array.from({ length: plan.goal }, (_, i) => i + 1));
        }
      }
    }
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
    for (const level of [3, 4, 5]) {
      const plan = PLANS[level - 1];
      for (let seed = 1; seed <= 6; seed++) {
        const bumpers = makeBumpers(plan, new Rng(seed));
        const world = makeWorld(bumpers);
        const wanted = (i: number) => (plan.mode === 'color' ? bumpers[i].color === 0 : bumpers[i].number === 1);
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
