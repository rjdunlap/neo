import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { DUEL_PLAN, duelServeDir, duelWinner, countFor, isZoneMode, makeSequence, serveAngleFor, LOB, petLob, farWall, isGoalMode, reachableZones, keeperReach, keeperSpeed, landingY, paddleForLanding, versusMisses, volleySpeed, zoneOf, ZONES, type AimGeometry, COURTS, courtFor, afterHit, afterMiss, paddleBounce, paddleTarget, PLANS, predictY, type PaddleGeometry } from './logic';

describe('Bounce Back', () => {
  it('predicts where the ball arrives, folding in wall bounces', () => {
    expect(predictY(0, 100, 100, 0, 300, 0, 400)).toBe(100);
    expect(predictY(0, 100, 100, 100, 200, 0, 400)).toBe(300);
    // 100 + 400 = 500 overshoots the bottom wall at 400 and comes back to 300.
    expect(predictY(0, 100, 100, 100, 400, 0, 400)).toBe(300);
    // Moving away from the target: no prediction, stay put.
    expect(predictY(300, 100, 100, 50, 0, 0, 400)).toBe(100);
  });

  it('angles the ball by where it hits the paddle, keeping its speed', () => {
    const mid = paddleBounce(200, 200, 200, 300, false);
    expect(mid.vx).toBeCloseTo(-300);
    expect(mid.vy).toBeCloseTo(0);
    const edge = paddleBounce(300, 200, 200, 300, true);
    expect(edge.vx).toBeGreaterThan(0);
    expect(edge.vy).toBeGreaterThan(150);
    expect(Math.hypot(edge.vx, edge.vy)).toBeCloseTo(300);
  });

  it('starts slow with a huge paddle and speeds up gently', () => {
    PLANS.slice(1, 5).forEach((p, i) => {
      expect(p.speed).toBeGreaterThanOrEqual(PLANS[i].speed);
      expect(p.paddle).toBeLessThanOrEqual(PLANS[i].paddle);
    });
    expect(PLANS[0].paddle).toBeGreaterThanOrEqual(240);
  });

  it("holds the ghost finger's paddle where the ball arrives, and on the stars level slides it so the bounce goes through the star", () => {
    // The table on a 1024 by 768 screen, as the game lays it out.
    const plan = PLANS.find((p) => p.mode === 'stars')!;
    const R = 26;
    const half = plan.paddle / 2;
    const g: PaddleGeometry = { faceX: 984 - 46 - R, top: 90 + R, bottom: 728 - R, low: 90 + half, high: 728 - half, paddle: plan.paddle, speed: plan.speed, starReach: R + 52 };
    const rng = new Rng(11);
    // Follow the ball after the bounce, wall to wall, and report how near it comes to the star on its way across.
    const nearest = (arrive: number, paddleY: number, star: { x: number; y: number }) => {
      const v = paddleBounce(arrive, paddleY, plan.paddle, plan.speed, false);
      let x = g.faceX;
      let y = arrive;
      let vy = v.vy;
      let best = Infinity;
      while (x > star.x - 100) {
        x += v.vx / 240;
        y += vy / 240;
        if (y < g.top) [y, vy] = [g.top, Math.abs(vy)];
        if (y > g.bottom) [y, vy] = [g.bottom, -Math.abs(vy)];
        best = Math.min(best, Math.hypot(x - star.x, y - star.y));
      }
      return best;
    };
    let hit = 0;
    let total = 0;
    for (let i = 0; i < 400; i++) {
      const arrive = rng.range(g.top, g.bottom);
      const star = { x: rng.range(180 + 200, 984 - 200), y: rng.range(90 + 80, 728 - 80) };
      const y = paddleTarget(arrive, star, g);
      // The paddle always meets the ball, and stays on the table.
      expect(Math.abs(arrive - y)).toBeLessThanOrEqual(half + R * 0.6);
      expect(y).toBeGreaterThanOrEqual(g.low);
      expect(y).toBeLessThanOrEqual(g.high);
      total++;
      if (nearest(arrive, y, star) <= g.starReach) hit++;
    }
    // Most stars can be reached from where the ball comes; the rest are sent straight back and the pet's return gives another chance.
    expect(hit / total).toBeGreaterThan(0.85);
    // Without a star the paddle sits on the ball.
    expect(paddleTarget(300, null, g)).toBe(300);
    // When no star is asked for, every level meets the ball on the same line.
    for (const p of PLANS) expect(paddleTarget(250, null, { ...g, paddle: p.paddle, speed: p.speed })).toBe(250);
  });

  it('starts a hint after two misses in a row, ends it on her next bounce, and can start another', () => {
    let st = { wrongs: 0, hinting: false };
    let hints = 0;
    const miss = () => {
      const n = afterMiss(st.wrongs, st.hinting);
      st = { wrongs: n.wrongs, hinting: n.hinting };
      if (n.newHint) hints++;
    };
    miss();
    expect(st.hinting).toBe(false);
    miss();
    expect(st.hinting).toBe(true);
    miss();
    miss();
    expect(hints).toBe(1);
    st = afterHit();
    expect(st.hinting).toBe(false);
    miss();
    miss();
    expect(hints).toBe(2);
    // A bounce between misses means they were not in a row.
    st = afterHit();
    miss();
    st = afterHit();
    miss();
    expect(st.hinting).toBe(false);
  });

  it('gives every seeded pick a court, and each court is only a look', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(courtFor(i / 100).id);
    expect(seen.size).toBe(COURTS.length);
    expect(courtFor(0.9999)).toBe(COURTS[COURTS.length - 1]);
    // The ball and the court's table must differ in color so the ball reads, and the game is the same on every court.
    for (const c of COURTS) expect(c.table).not.toBe(c.ground);
  });

  // The table as the game lays it out in each view: box x 180 to w - 40 and y 90 to h - 40, faces 46 in, the ball's radius 26.
  const aim = (w: number, h: number, plan: (typeof PLANS)[number]): AimGeometry => {
    const R = 26;
    const half = plan.paddle / 2;
    const x0 = 180;
    const x1 = w - 40;
    const y0 = 90;
    const y1 = h - 40;
    return { faceX: x1 - 46 - R, leftX: x0 + 46 + R, top: y0 + R, bottom: y1 - R, low: y0 + half, high: y1 - half, paddle: plan.paddle, speed: plan.speed, starReach: R + 52 };
  };
  const VIEWS: [number, number][] = [[1024, 768], [768, 1024], [1366, 768], [1194, 834]];

  it('only calls a color zone the paddle can send the ball to, and always has two to choose from', () => {
    const plan = PLANS[5];
    expect(plan.mode).toBe('color');
    for (const [w, h] of VIEWS) {
      const g = aim(w, h, plan);
      for (let i = 0; i <= 80; i++) {
        const arrive = g.top + ((g.bottom - g.top) * i) / 80;
        const zones = reachableZones(arrive, g);
        expect(zones.length, `${w}x${h} arrive ${Math.round(arrive)}`).toBeGreaterThanOrEqual(2);
        for (const z of zones) {
          const want = g.top + ((z + 0.5) / ZONES.length) * (g.bottom - g.top);
          const { y, landing } = paddleForLanding(arrive, want, g);
          expect(Math.abs(arrive - y)).toBeLessThanOrEqual(plan.paddle / 2);
          expect(y).toBeGreaterThanOrEqual(g.low);
          expect(y).toBeLessThanOrEqual(g.high);
          expect(zoneOf(landing, g.top, g.bottom)).toBe(z);
        }
      }
    }
  });

  it('keeps the goal levels beatable: the keeper never covers the whole table, and a good shot lands out of its reach', () => {
    const rng = new Rng(5);
    for (const plan of PLANS.filter((p) => isGoalMode(p.mode))) {
      for (const [w, h] of VIEWS) {
        const g = aim(w, h, plan);
        const half = (g.bottom - g.top) / 2;
        expect(keeperReach(plan.keeper!, g, 26), `${plan.mode} ${w}x${h}`).toBeLessThanOrEqual(half * 0.9);
        expect(keeperSpeed(plan.keeper!, g)).toBeGreaterThan(0);
        let beaten = 0;
        for (let i = 0; i < 300; i++) {
          const keeperY = rng.range(g.top, g.bottom);
          const arrive = rng.range(g.top, g.bottom);
          const { landing } = paddleForLanding(arrive, farWall(keeperY, g), g);
          if (Math.abs(landing - keeperY) > keeperReach(plan.keeper!, g, 26)) beaten++;
        }
        expect(beaten / 300, `${plan.mode} ${w}x${h}`).toBeGreaterThan(0.75);
      }
    }
  });

  it('speeds the volley gently with a cap, and scores a round by margin without punishing a loss', () => {
    expect(volleySpeed(480, 0)).toBe(480);
    expect(volleySpeed(480, 3)).toBeGreaterThan(480);
    expect(volleySpeed(480, 99)).toBeCloseTo(480 * 1.4);
    // A hard-fought win stays smooth (at most one miss); a clear win is free; a loss counts every goal against.
    expect(versusMisses(true, 0)).toBe(0);
    expect(versusMisses(true, 3)).toBe(1);
    expect(versusMisses(true, 6)).toBe(3);
    expect(versusMisses(false, 5)).toBe(5);
    expect(landingY(300, 0, aim(1024, 768, PLANS[5]))).toBeCloseTo(300);
  });

  it('lobs only on the play-together and count rallies, gently, and the child can always meet the return', () => {
    for (const p of PLANS) {
      for (const pick of [0, 0.25, 0.5, 0.99]) {
        const lob = petLob(pick, p.mode);
        if (p.mode === 'together' || p.mode === 'count') expect(Math.abs(lob)).toBeLessThanOrEqual(LOB);
        else expect(lob).toBe(0);
      }
    }
    // The pet's paddle held at the largest lob sends the ball at most about 0.26 rad off straight, a slow drift her paddle follows easily.
    const speed = PLANS[4].speed;
    const r = paddleBounce(200 + LOB * (PLANS[4].paddle / 2), 200, PLANS[4].paddle, speed, true);
    expect(Math.abs(r.vy) / Math.abs(r.vx)).toBeLessThan(0.3);
  });

  it('calls the three colors once each, never the same call twice, and can always serve the next one', () => {
    const rng = new Rng(3);
    let prev: number[] | undefined;
    for (let i = 0; i < 50; i++) {
      const seq = makeSequence(() => rng.next(), prev);
      expect([...seq].sort()).toEqual([0, 1, 2]);
      if (prev) expect(seq).not.toEqual(prev);
      prev = seq;
    }
    const plan = PLANS[8];
    expect(isZoneMode(plan.mode)).toBe(true);
    const angles = Array.from({ length: 12 }, (_, i) => -0.4 + (0.8 * i) / 11);
    for (const [w, h] of VIEWS) {
      const g = aim(w, h, plan);
      for (let z = 0; z < ZONES.length; z++) {
        expect(serveAngleFor(z, angles, (180 + w - 40) / 2, (90 + h - 40) / 2, g), `${w}x${h} zone ${z}`).not.toBeNull();
      }
    }
  });

  it('counts a skip rally in whole steps up to the goal times the step, and leaves other levels counting by ones', () => {
    for (const p of PLANS.filter((x) => x.mode === 'skip')) {
      expect(countFor(p, 1)).toBe(p.step);
      expect(countFor(p, p.goal)).toBe(p.goal * p.step!);
      expect(countFor(p, p.goal) % p.step!).toBe(0);
    }
    expect(countFor(PLANS[4], 7)).toBe(7);
    expect(PLANS.filter((x) => x.mode === 'skip').map((x) => x.step)).toEqual([2, 5]);
  });

  it('ends a face-off at the goal exactly once, serves to whoever let the ball by, and is beatable in both directions', () => {
    expect(duelWinner([4, 4])).toBeNull();
    expect(duelWinner([5, 4])).toBe(0);
    expect(duelWinner([2, 5])).toBe(1);
    // The right paddle's player scored (the ball passed the left paddle): serve left, toward the one who let it by.
    expect(duelServeDir(0)).toBe(-1);
    expect(duelServeDir(1)).toBe(1);
    // The face-off has no level and is not on the island's ladder, and its paddle is long enough to be fair to both players.
    expect(PLANS).not.toContain(DUEL_PLAN);
    expect(DUEL_PLAN.paddle).toBeGreaterThanOrEqual(190);
    expect(DUEL_PLAN.goal).toBe(5);
  });
});
