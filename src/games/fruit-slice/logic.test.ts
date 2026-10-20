import { describe, expect, it } from 'vitest';
import { CARRY, PRESS } from '../../engine/ghost';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  arcAt, basketAt, BOARD_H, BOARD_W, boardsFor, bowlAt, BOWL_R, FLIGHT, FRUIT, hangTime, hintLineFor, HIT_R, insideLength, isFruit,
  judge, judgeStroke, lineHits, makeToss, met, MIN_LINE, MIN_TRAVEL, nextKind, pairBoard, pairHint, planFor, reachableCounts, RISE, HANG,
  signAt, SIGN_W, signsFor, sliceHits, type Kind,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const SEEDS = [1, 2, 3, 7, 11, 19, 42, 99, 123, 2026];

describe('arcs', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    it(`every toss stays on screen, clear of the corners, in ${name}`, () => {
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        for (const aloft of [1, 2, 3]) {
          for (let col = 0; col < aloft; col++) {
            const toss = makeToss('apple', col, aloft, rng);
            for (let t = 0; t <= FLIGHT; t += 0.05) {
              const p = arcAt(toss, t, v)!;
              expect(p.x).toBeGreaterThanOrEqual(60);
              expect(p.x).toBeLessThanOrEqual(v.w - 60);
              expect(p.y).toBeGreaterThanOrEqual(60);
              expect(p.y).toBeLessThanOrEqual(v.h - 40);
            }
            const ax = toss.ax * v.w, ay = toss.ay * v.h;
            expect(ay).toBeGreaterThanOrEqual(0.25 * v.h);
            expect(ay).toBeLessThanOrEqual(0.55 * v.h);
            // Clear of home (top left), the sign (top right) and the pet (bottom left).
            expect(Math.hypot(ax, ay)).toBeGreaterThan(160 + HIT_R);
            const s = signAt(v);
            expect(Math.abs(ax - s.x) > SIGN_W / 2 + HIT_R || Math.abs(ay - s.y) > SIGN_W / 2 + HIT_R).toBe(true);
            expect(ax > 230 || ay < v.h - 260).toBe(true);
          }
        }
      }
    });

    it(`fruit aloft together hang at least 180 apart, in ${name}`, () => {
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        for (const aloft of [2, 3]) {
          const ts = Array.from({ length: aloft }, (_, c) => makeToss('pear', c, aloft, rng));
          for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
            expect(Math.hypot((ts[i].ax - ts[j].ax) * v.w, (ts[i].ay - ts[j].ay) * v.h)).toBeGreaterThanOrEqual(180);
          }
        }
      }
    });
  }

  it('the hang is at least 1.6 s, and longer than the ghost needs to press and carry through a fruit', () => {
    const v = VIEWS.landscape;
    for (const seed of SEEDS) {
      const toss = makeToss('lemon', 1, 3, new Rng(seed));
      const hang = hangTime(toss, v);
      expect(hang).toBeGreaterThanOrEqual(1.6);
      // The bot waits beside the apex, then presses and carries 240 units through it.
      const stroke = PRESS + Math.max(CARRY.min, 240 / CARRY.speed);
      expect(hang).toBeGreaterThan(stroke + 0.5);
    }
  });

  it('a fruit comes back to the basket', () => {
    const v = VIEWS.landscape;
    const toss = makeToss('orange', 0, 1, new Rng(5));
    const end = arcAt(toss, FLIGHT, v)!;
    const b = basketAt(v);
    expect(Math.hypot(end.x - b.x, end.y - b.y)).toBeLessThan(1);
    expect(arcAt(toss, FLIGHT + 0.1, v)).toBeNull();
  });

  it('the bowl is a big target clear of the pet and inside every view', () => {
    for (const v of Object.values(VIEWS)) {
      const b = bowlAt(v);
      expect(2 * BOWL_R).toBeGreaterThanOrEqual(140);
      expect(b.x + BOWL_R).toBeLessThanOrEqual(v.w);
      expect(b.x - BOWL_R).toBeGreaterThan(230);
    }
  });
});

describe('swept hits', () => {
  const fruit = [{ x: 0, y: 0 }];
  it('a fast stroke whose samples are both outside still hits', () => {
    expect(sliceHits({ x: -200, y: 10 }, { x: 200, y: 10 }, fruit)).toEqual([0]);
  });
  it('a segment passing 76 units from the center misses', () => {
    expect(sliceHits({ x: -200, y: 76 }, { x: 200, y: 76 }, fruit)).toEqual([]);
  });
  it('hits come in the order the stroke reaches them', () => {
    const row = [{ x: 300, y: 0 }, { x: 0, y: 0 }, { x: 150, y: 0 }];
    expect(sliceHits({ x: -100, y: 0 }, { x: 400, y: 0 }, row)).toEqual([1, 2, 0]);
    expect(sliceHits({ x: 400, y: 0 }, { x: -100, y: 0 }, row)).toEqual([0, 2, 1]);
  });
  it('travel inside the circle is measured, so a flick through the edge is too little', () => {
    expect(insideLength({ x: -200, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(150);
    expect(insideLength({ x: -10, y: 74 }, { x: 10, y: 74 }, { x: 0, y: 0 })).toBeLessThan(MIN_TRAVEL);
    expect(insideLength({ x: 5, y: 5 }, { x: 5, y: 5 }, { x: 0, y: 0 })).toBe(0);
  });
});

describe('judging', () => {
  const rng = () => new Rng(3);
  it('levels 1 and 2 never refuse or miss', () => {
    for (const id of [1, 2]) {
      const plan = planFor(id);
      const sign = signsFor(plan, rng())[0];
      const r = judgeStroke(plan, sign, ['balloon', 'apple', 'flower']);
      expect(r.cut.every(Boolean)).toBe(true);
      expect(r.miss).toBe(false);
    }
  });
  it('the wrong kind, a not-fruit and a full bowl are refused', () => {
    const p3 = planFor(3);
    const s3 = signsFor(p3, rng())[0];
    const other = FRUIT.find((f) => f !== s3.rows[0].kind)!;
    expect(judge(p3, s3, other)).toEqual({ ok: false, why: 'not-kind' });
    expect(judge(p3, s3, s3.rows[0].kind!)).toEqual({ ok: true, row: 0 });
    const p4 = planFor(4);
    expect(judge(p4, signsFor(p4, rng())[0], 'balloon')).toEqual({ ok: false, why: 'not-fruit' });
    const p5 = planFor(5);
    const s5 = signsFor(p5, rng())[0];
    s5.rows[0].cut = s5.rows[0].n;
    expect(judge(p5, s5, 'apple')).toEqual({ ok: false, why: 'full' });
  });
  it('a finished row bounces at level 6 while the other row still takes its kind', () => {
    const p = planFor(6);
    const s = signsFor(p, rng())[0];
    s.rows[0].cut = s.rows[0].n;
    expect(judge(p, s, s.rows[0].kind!)).toEqual({ ok: false, why: 'row-done' });
    expect(judge(p, s, s.rows[1].kind!).ok).toBe(true);
  });
  it('a mixed stroke cuts the right fruit and counts exactly one miss', () => {
    const p = planFor(4);
    const s = signsFor(p, rng())[0];
    const r = judgeStroke(p, s, ['apple', 'balloon', 'pear', 'flower']);
    expect(r.cut).toEqual([true, false, true, false]);
    expect(r.miss).toBe(true);
    expect(s.rows[0].cut).toBe(2);
    // A stroke that has already missed counts no second miss.
    expect(judgeStroke(p, s, ['flower'], true).miss).toBe(false);
  });
  it('a stroke crossing more than needed cuts in order up to the sign, refuses the rest, one miss', () => {
    const p = planFor(5);
    const s = signsFor(p, rng())[0];
    s.rows[0].cut = s.rows[0].n - 2;
    const r = judgeStroke(p, s, ['apple', 'pear', 'lemon', 'grapes']);
    expect(r.cut).toEqual([true, true, false, false]);
    expect(r.miss).toBe(true);
    expect(met(s)).toBe(true);
  });
  it('level 8 counts pieces by twos and refuses a cut that would pass the sign', () => {
    const p = planFor(8);
    const signs = signsFor(p, rng());
    expect(signs.map((s) => s.rows[0].n % 2)).toEqual([0, 0, 0]);
    expect(signs[2].board).toBe(true);
    const s = signs[0];
    const r = judgeStroke(p, s, ['apple', 'apple', 'apple', 'apple']);
    expect(r.cut).toEqual([true, true, true, false]);
    expect(s.rows[0].cut).toBe(6);
  });
  it('level 6 signs ask for two different kinds, 1 to 4 each', () => {
    for (const seed of SEEDS) {
      for (const s of signsFor(planFor(6), new Rng(seed))) {
        expect(s.rows[0].kind).not.toBe(s.rows[1].kind);
        for (const r of s.rows) expect(r.n >= 1 && r.n <= 4).toBe(true);
      }
    }
  });
});

describe('choice exists and no round stalls', () => {
  for (const id of [3, 4, 5, 6, 8]) {
    it(`level ${id}`, () => {
      const plan = planFor(id);
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        for (const sign of signsFor(plan, rng)) {
          const aloft: Kind[] = [];
          let tosses = 0;
          let sinceRight = 0;
          // Toss until the sign is met, cutting a right fruit now and then (a child who is slow but gets there).
          while (!met(sign)) {
            if (aloft.length >= plan.aloft) aloft.shift();
            const k = nextKind(plan, sign, aloft, rng, tosses++);
            aloft.push(k);
            const right = aloft.filter((a) => judge(plan, sign, a).ok);
            const wrong = aloft.filter((a) => !judge(plan, sign, a).ok);
            if (aloft.length === plan.aloft && plan.mode !== 'enough' && plan.mode !== 'pieces') {
              // At 3, 4 and 6 a full sky always holds a choice once it has settled.
              if (tosses > plan.aloft + 2) expect(right.length > 0 || sinceRight < 2).toBe(true);
            }
            if (wrong.length && !right.length) sinceRight++;
            else sinceRight = 0;
            expect(sinceRight).toBeLessThanOrEqual(1);
            if (right.length && rng.chance(0.5)) {
              const i = aloft.indexOf(right[0]);
              judgeStroke(plan, sign, [right[0]]);
              aloft.splice(i, 1);
            }
            expect(tosses).toBeLessThan(200);
          }
          if (plan.mode === 'fruit') expect(aloft.filter((k) => !isFruit(k)).length).toBeLessThanOrEqual(1);
        }
      }
    });
  }
});

describe('level 7 boards', () => {
  it('each board has a line through exactly N, and lines through N − 1 and (below 4) N + 1; the hint crosses exactly N', () => {
    for (const seed of SEEDS) {
      const boards = boardsFor(new Rng(seed));
      expect(boards.map((b) => b.n)).toEqual([2, 3, 3, 4]);
      for (const b of boards) {
        expect(b.fruit.length).toBeGreaterThanOrEqual(4);
        expect(b.fruit.length).toBeLessThanOrEqual(6);
        const counts = reachableCounts(b.fruit);
        expect(counts.has(b.n - 1) && counts.has(b.n)).toBe(true);
        if (b.n < 4) expect(counts.has(b.n + 1)).toBe(true);
        expect(lineHits(b.hint.a, b.hint.b, b.fruit).length).toBe(b.n);
        expect(Math.hypot(b.hint.b.x - b.hint.a.x, b.hint.b.y - b.hint.a.y)).toBeGreaterThanOrEqual(MIN_LINE);
        for (const p of [b.hint.a, b.hint.b]) expect(p.x >= 0 && p.x <= BOARD_W && p.y >= 0 && p.y <= BOARD_H).toBe(true);
        // Fruit do not overlap, so every one can be told apart.
        for (let i = 0; i < b.fruit.length; i++) for (let j = i + 1; j < b.fruit.length; j++) {
          expect(Math.hypot(b.fruit[i].x - b.fruit[j].x, b.fruit[i].y - b.fruit[j].y)).toBeGreaterThanOrEqual(150);
        }
      }
    }
  });
  it('same seed, same boards', () => {
    expect(boardsFor(new Rng(8))).toEqual(boardsFor(new Rng(8)));
  });
  it('the box fits every view', () => {
    for (const v of Object.values(VIEWS)) {
      expect(BOARD_W).toBeLessThanOrEqual(v.w - 200);
      expect(BOARD_H + 175).toBeLessThanOrEqual(v.h - 160);
    }
  });
  it('a hint line can be found again after some fruit are cut', () => {
    const b = boardsFor(new Rng(4))[0];
    expect(hintLineFor(b.fruit, b.n, b.fruit.map(() => false))).not.toBeNull();
  });
});

describe('level 8 pair board', () => {
  it('each pair has a line through only those two, and the sign is even and reachable', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const b = pairBoard(rng);
      expect(b.fruit.length).toBe(6);
      b.pairs!.forEach((l, k) => expect(lineHits(l.a, l.b, b.fruit).sort()).toEqual([2 * k, 2 * k + 1]));
      const last = signsFor(planFor(8), rng)[2];
      expect(last.rows[0].n % 2).toBe(0);
      expect(last.rows[0].n).toBeLessThanOrEqual(2 * b.fruit.length);
    }
  });
  it('the hint never passes the sign', () => {
    const b = pairBoard(new Rng(6));
    const cut = b.fruit.map(() => false);
    const l = pairHint(b, cut, 2)!;
    expect(lineHits(l.a, l.b, b.fruit).length).toBe(1);
    expect(lineHits(pairHint(b, cut, 4)!.a, pairHint(b, cut, 4)!.b, b.fruit).length).toBe(2);
  });
});

describe('plans', () => {
  it('names each level and keeps the hang the same at every level (harder means choices, not speed)', () => {
    for (let id = 1; id <= 8; id++) expect(planFor(id).id).toBe(id);
    expect(RISE + HANG).toBeLessThan(FLIGHT);
    expect(planFor(1).aloft).toBe(1);
    expect(Math.max(...[1, 2, 3, 4, 5, 6, 8].map((i) => planFor(i).aloft))).toBe(3);
  });
});
