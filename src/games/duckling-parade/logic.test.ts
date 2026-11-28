import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  arrive,
  canJoin,
  cardSlots,
  LEVELS,
  nextInPattern,
  dressingAt,
  DRESSING_COLORS,
  DUCK_COLORS,
  makeMeadow,
  makeRound,
  needed,
  nextStop,
  nextToShow,
  SHOW_CLEAR,
  PLANS,
  readyForPond,
  RIM_ARC,
  type DemoDuckling,
} from './logic';

const POND = { x: 800, y: 420 };

describe('Duckling Parade', () => {
  it('always has enough of the right ducklings to finish', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const round = makeRound(plan, new Rng(seed));
        expect(round.ducklings).toHaveLength(plan.ducklings + (plan.oddDuckling ? 1 : 0));
        expect(new Set(round.ducklings).size, plan.name).toBe(plan.colors);
        const joinable = round.ducklings.filter(
          (c) => canJoin(plan, round, [], c) === 'join' || plan.mode === 'pattern',
        ).length;
        expect(joinable, plan.name).toBeGreaterThanOrEqual(needed(plan, round));
        if (plan.mode === 'colorCount')
          expect(round.ducklings.filter((c) => c === round.want).length).toBeGreaterThan(round.target!);
        if (round.target !== undefined) expect(round.target).toBeGreaterThanOrEqual(plan.min!);
      }
    }
  });

  it('builds a pattern line only in order, and sends it home only when complete', () => {
    const plan = PLANS.find((p) => p.mode === 'pattern' && p.unit === 3)!;
    const round = makeRound(plan, new Rng(4));
    const [a, b, c] = round.pattern!;
    expect(new Set([a, b, c]).size).toBe(3);
    expect(canJoin(plan, round, [], b)).toBe('wrong-next');
    expect(canJoin(plan, round, [a], b)).toBe('join');
    expect(canJoin(plan, round, [a, b], a)).toBe('wrong-next');
    expect(readyForPond(plan, round, 3)).toBe(false);
    expect(readyForPond(plan, round, round.pattern!.length)).toBe(true);
    // The pattern ducklings are present in the meadow.
    expect(round.pattern!.every((c) => round.ducklings.includes(c))).toBe(true);
  });

  it('makes an AAB pattern and adds one decoy to the level 10 meadow', () => {
    const pairPlan = PLANS[8];
    const pairRound = makeRound(pairPlan, new Rng(18));
    expect(pairRound.pattern).toHaveLength(6);
    expect(pairRound.pattern![0]).toBe(pairRound.pattern![1]);
    expect(pairRound.pattern![2]).not.toBe(pairRound.pattern![1]);
    expect(pairRound.pattern![3]).toBe(pairRound.pattern![0]);

    const repairPlan = PLANS[9];
    for (let seed = 1; seed <= 100; seed++) {
      const round = makeRound(repairPlan, new Rng(seed));
      expect(round.ducklings).toHaveLength(7);
      expect(round.ducklings.filter((color) => !round.pattern!.includes(color))).toHaveLength(1);
      expect(needed(repairPlan, round)).toBe(6);
      expect(readyForPond(repairPlan, round, 5)).toBe(false);
      expect(readyForPond(repairPlan, round, 6)).toBe(true);
    }
  });

  it('makes an ABB parade at level 11: a different unit from AAB, with every next duckling waiting', () => {
    const plan = PLANS[10];
    expect(plan.mode).toBe('pattern');
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeRound(plan, new Rng(seed));
      const p = round.pattern!;
      expect(p).toHaveLength(6);
      const [a, b] = p;
      expect(a).not.toBe(b);
      expect(p).toEqual([a, b, b, a, b, b]);
      // Exactly the pattern's ducklings, no decoy, so every prefix can be met from the meadow.
      expect([...round.ducklings].sort()).toEqual([...p].sort());
      for (let i = 0; i < p.length; i++) {
        expect(canJoin(plan, round, p.slice(0, i), p[i])).toBe('join');
        const other = p[i] === a ? b : a;
        expect(canJoin(plan, round, p.slice(0, i), other)).toBe('wrong-next');
      }
      expect(readyForPond(plan, round, 5)).toBe(false);
      expect(readyForPond(plan, round, 6)).toBe(true);
    }
  });

  describe('level 12, Keep it going', () => {
    const plan = PLANS[11];
    const rounds = Array.from({ length: 300 }, (_, i) => makeRound(plan, new Rng(i + 1)));
    const unitOf = (ref: string[]) => ref.slice(0, ref.length / 2);

    it('is the only level with a reference', () => {
      expect(plan.continuation).toBe(4);
      for (const r of rounds) expect(r.reference).toBeDefined();
      PLANS.slice(0, 11).forEach((p, i) => {
        for (let seed = 1; seed <= 50; seed++)
          expect(makeRound(p, new Rng(seed + i * 1000)).reference).toBeUndefined();
      });
    });

    it('shows two full units of AB, AAB or ABB, and the continuation carries the same unit on', () => {
      const kinds = new Set<string>();
      for (const r of rounds) {
        const ref = r.reference!;
        expect([4, 6]).toContain(ref.length);
        const unit = unitOf(ref);
        expect(ref).toEqual([...unit, ...unit]);
        expect(new Set(unit).size).toBe(2);
        const [a] = unit;
        kinds.add(unit.map((c) => (c === a ? 'a' : 'b')).join(''));
        expect(r.pattern).toHaveLength(4);
        const all = [...ref, ...r.pattern!];
        for (let i = unit.length; i < all.length; i++) expect(all[i]).toBe(all[i - unit.length]);
      }
      expect([...kinds].sort()).toEqual(['aab', 'ab', 'abb']);
    });

    it('puts the continuation plus one spare of each color in the meadow, both colors waiting at every step', () => {
      for (const r of rounds) {
        const [a, b] = unitOf(r.reference!).filter((c, i, u) => u.indexOf(c) === i);
        expect(r.ducklings).toHaveLength(6);
        expect([...r.ducklings].sort()).toEqual([...r.pattern!, a, b].sort());
        for (let k = 0; k < 4; k++) {
          const left = [...r.ducklings];
          for (const c of r.pattern!.slice(0, k)) left.splice(left.indexOf(c), 1);
          expect(left).toContain(a);
          expect(left).toContain(b);
        }
      }
    });

    it('accepts only the next continuation color, hints that same color, and goes home at four', () => {
      for (const r of rounds) {
        const p = r.pattern!;
        for (let i = 0; i < 4; i++) {
          for (const c of new Set(r.ducklings))
            expect(canJoin(plan, r, p.slice(0, i), c)).toBe(c === p[i] ? 'join' : 'wrong-next');
          expect(nextInPattern(r, i)).toBe(p[i]);
          expect(readyForPond(plan, r, i)).toBe(false);
        }
        expect(readyForPond(plan, r, 4)).toBe(true);
        expect(needed(plan, r)).toBe(4);
      }
    });

    it('never shows a continuation color before it is filled, except the next one while a hint reveals it', () => {
      for (const r of rounds) {
        const ref = r.reference!;
        for (let line = 0; line <= 4; line++) {
          for (const revealed of [false, true]) {
            const slots = cardSlots(r, line, revealed);
            expect(slots).toHaveLength(ref.length + 4);
            slots.slice(0, ref.length).forEach((s, i) => {
              expect(s).toMatchObject({ color: ref[i], reference: true, next: false });
            });
            slots.slice(ref.length).forEach((s, i) => {
              const shown = i < line || (revealed && i === line);
              expect(s.color).toBe(shown ? r.pattern![i] : null);
              expect(s.next).toBe(i === line);
            });
          }
        }
      }
      // Levels 7–11 still show the whole pattern, faint until filled.
      const r7 = makeRound(PLANS[6], new Rng(3));
      expect(cardSlots(r7, 0, false).map((s) => s.color)).toEqual(r7.pattern);
    });

    it('tops the school ladder', () => {
      expect(LEVELS.school).toEqual({ min: 9, max: 12 });
      expect(plan.name).toMatch(/keep the pattern going/i);
    });
  });

  it('turns away other colors, and sends extras back out of the pond', () => {
    const plan = PLANS.find((p) => p.mode === 'colorCount')!;
    const round = makeRound(plan, new Rng(9));
    const other = round.ducklings.find((c) => c !== round.want)!;
    expect(canJoin(plan, round, [], other)).toBe('wrong-color');
    const n = round.target!;
    expect(arrive(round, 0, n + 1)).toEqual({ swimIn: n, extra: 1 });
    expect(arrive(round, n - 1, 1)).toEqual({ swimIn: 1, extra: 0 });
    expect(arrive(makeRound(PLANS[1], new Rng(1)), 0, 4)).toEqual({ swimIn: 4, extra: 0 });
  });

  it('leads Mama to a duckling that may join until the line is right, then to the pond, finishing every round at every level', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const ducks: DemoDuckling[] = round.ducklings.map((color, i) => ({
          color,
          loose: true,
          x: 100 + i * 70,
          y: 300 + (i % 3) * 60,
        }));
        let line: DemoDuckling[] = [];
        let home = 0;
        let mama = { x: 60, y: 400 };
        for (let guard = 0; guard < 30; guard++) {
          const stop = nextStop(
            plan,
            round,
            line.map((d) => d.color),
            home,
            ducks,
            mama,
            POND,
          );
          expect(stop, `${plan.name} seed ${seed}`).not.toBeNull();
          if (stop!.to === 'pond') {
            const { swimIn } = arrive(round, home, line.length);
            home += swimIn;
            line = [];
            if (home >= needed(plan, round)) break;
            continue;
          }
          const d = ducks[stop!.to === 'duckling' ? stop!.index : 0];
          // It is a duckling the line may take: never a wrong color, never out of pattern order.
          expect(
            canJoin(
              plan,
              round,
              line.map((x) => x.color),
              d.color,
            ),
          ).toBe('join');
          d.loose = false;
          line.push(d);
          mama = { x: d.x, y: d.y };
        }
        expect(home, `${plan.name} seed ${seed}`).toBeGreaterThanOrEqual(needed(plan, round));
      }
    }
  });

  it('goes for the nearest duckling it may take, and waits when none may join', () => {
    const plan = PLANS[1];
    const round = makeRound(plan, new Rng(3));
    const near: DemoDuckling = { color: 'yellow', loose: true, x: 200, y: 400 };
    const far: DemoDuckling = { color: 'yellow', loose: true, x: 700, y: 400 };
    expect(nextStop(plan, round, [], 0, [far, near], { x: 150, y: 400 }, POND)).toMatchObject({
      to: 'duckling',
      index: 1,
    });
    expect(nextStop(plan, round, [], 0, [{ ...near, loose: false }], { x: 150, y: 400 }, POND)).toBeNull();
  });

  it('leads her by a way that no wrong duckling sits on, so the demonstration is never a "not me", and taps when no way is clear', () => {
    const plan = PLANS.find((p) => p.mode === 'color')!;
    const round = { ducklings: ['yellow', 'blue'] as const, want: 'yellow' as const };
    const mama = { x: 100, y: 400 };
    const wanted: DemoDuckling = { color: 'yellow', loose: true, x: 500, y: 400 };
    const wrongOnTheWay: DemoDuckling = { color: 'blue', loose: true, x: 300, y: 420 };
    const wrongAside: DemoDuckling = { color: 'blue', loose: true, x: 300, y: 650 };
    expect(
      nextStop(plan, { ...round, ducklings: [...round.ducklings] }, [], 0, [wanted, wrongAside], mama, POND),
    ).toMatchObject({ to: 'duckling', drag: true });
    expect(
      nextStop(
        plan,
        { ...round, ducklings: [...round.ducklings] },
        [],
        0,
        [wanted, wrongOnTheWay],
        mama,
        POND,
      ),
    ).toMatchObject({ to: 'duckling', drag: false });
  });

  it('dresses the meadow two ways, never in a duckling color and never where a duckling waits or in the pond', () => {
    const seen = new Set<string>();
    for (const c of Object.values(DRESSING_COLORS).flat()) expect(DUCK_COLORS).not.toContain(c);
    // The game's own layout (field, horizon at 0.3 of the height, pond) in landscape, portrait and a wide phone.
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [1024, 1365],
      [1366, 768],
    ]) {
      const field = { x0: 60, x1: w - 60, y0: h * 0.36, y1: h - 40 };
      const pond = { x: w - 210, y: field.y0 + (field.y1 - field.y0) * 0.55, rx: 165, ry: 95 };
      // Ducklings wait inside this box (index.ts spots(): fx 0.06–0.54, fy 0.08–0.92), Mama starts at its left.
      const wait = {
        x0: field.x0 + (field.x1 - field.x0) * 0.06,
        x1: field.x0 + (field.x1 - field.x0) * 0.54,
        y0: field.y0 + (field.y1 - field.y0) * 0.08,
        y1: field.y0 + (field.y1 - field.y0) * 0.92,
      };
      for (let seed = 1; seed <= 200; seed++) {
        const meadow = makeMeadow(new Rng(seed));
        seen.add(meadow.id);
        expect(meadow.dressing.length).toBeGreaterThanOrEqual(10);
        for (const d of meadow.dressing) {
          if (d.place === 'rim') expect(d.t >= RIM_ARC.from && d.t <= RIM_ARC.to).toBe(true);
          const p = dressingAt(d, field, h * 0.3, pond);
          const inWait = p.x > wait.x0 - 40 && p.x < wait.x1 + 40 && p.y > wait.y0 - 10 && p.y < wait.y1 + 40;
          expect(inWait, `${meadow.id} ${d.kind} at ${Math.round(p.x)},${Math.round(p.y)} in ${w}x${h}`).toBe(
            false,
          );
          expect(
            ((p.x - pond.x) / (pond.rx + 10)) ** 2 + ((p.y - pond.y) / (pond.ry + 8)) ** 2,
          ).toBeGreaterThan(1);
          expect(p.x).toBeLessThan(w - 30);
          if (d.place === 'rim') expect(p.y).toBeLessThan(pond.y);
          expect(p.y).toBeGreaterThan(h * 0.3);
        }
      }
    }
    expect([...seen].sort()).toEqual(['flowers', 'reeds']);
  });
});

describe('Duckling Parade at lap: one duckling at a time', () => {
  const spots = [
    { x: 100, y: 300 },
    { x: 500, y: 400 },
    { x: 300, y: 650 },
  ];
  it('brings out the first waiting duckling that is not already beside Mama', () => {
    expect(nextToShow(spots, [0, 1, 2], { x: 900, y: 300 })).toBe(0);
    expect(nextToShow(spots, [0, 1, 2], { x: 120, y: 310 })).toBe(1);
    expect(nextToShow(spots, [2], { x: 120, y: 310 })).toBe(2);
  });
  it('picks the farthest when every waiting spot is close, and nothing when none waits', () => {
    expect(nextToShow(spots, [0, 1], { x: 150, y: 320 }, 1000)).toBe(1);
    expect(nextToShow(spots, [], { x: 0, y: 0 })).toBeUndefined();
  });
  it('every lap round can bring each duckling out in turn, each a walk away from where Mama stood', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const pts = Array.from({ length: 3 }, () => ({ x: rng.range(60, 560), y: rng.range(280, 720) }));
      let mama = { x: 220, y: 430 };
      const waiting = [0, 1, 2];
      const shown: number[] = [];
      while (waiting.length) {
        const i = nextToShow(pts, waiting, mama)!;
        expect(waiting).toContain(i);
        waiting.splice(waiting.indexOf(i), 1);
        shown.push(i);
        mama = pts[i];
      }
      expect(shown.sort()).toEqual([0, 1, 2]);
      expect(SHOW_CLEAR).toBeGreaterThan(90);
    }
  });
});
