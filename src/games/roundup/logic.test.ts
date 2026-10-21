import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { animalsFor, emptierPen, enter, fairBell, fairNeeds, fleeSpeed, FOLLOW_SPEED, FOLLOW_STOP, followSpeed, KINDS, leadGoal, makeHerd, PLACE, pensFull, planFor, PLANS, PLURAL, ringBell, SHOO_SPEED, usesBell, shooPoint, signDots, spreadApart, startSpots, throughGate, wanted, type Kind } from './logic';

describe('Roundup', () => {
  it('gives Shoo one two successes, ordinary flee steering and a wider accepting gate', () => {
    const plan = planFor(10);
    expect(plan).toMatchObject({ mode: 'shoo', animals: 2, sequential: true, gate: 0.8, fleeRadius: 190, hintAfter: 10, helpAfter: 20 });
    const pen = { x: 500, y: 100, w: 200, h: 200 };
    // A crossing outside the old opening is accepted; the fence ends still hold.
    expect(throughGate(pen, { x: 490, y: 130 }, { x: 510, y: 130 }, plan.gate)).toBe(true);
    expect(throughGate(pen, { x: 490, y: 130 }, { x: 510, y: 130 })).toBe(false);
    expect(throughGate(pen, { x: 490, y: 110 }, { x: 510, y: 110 }, plan.gate)).toBe(false);
    expect(fleeSpeed(plan.fleeRadius!, plan.fleeRadius!, 330)).toBe(0);
    expect(fleeSpeed(105, plan.fleeRadius!, 330)).toBeGreaterThan(0);
    for (let seed = 1; seed <= 100; seed++) {
      const herd = makeHerd(plan, new Rng(seed));
      expect(herd.animals).toHaveLength(2);
      expect(herd.pens).toHaveLength(1);
      expect(herd.animals.every((kind) => enter(herd.pens[0], kind) === 'in')).toBe(true);
      expect(wanted(herd, herd.pens[0])).toBe(2);
    }
    // Existing IDs retain their plans.
    expect(planFor(6)).toBe(PLANS[5]);
    expect(planFor(7)).toBe(PLANS[6]);
    expect(planFor(8).mode).toBe('fair');
  });

  it('leaves cows outside while both nonempty pens can be completed, for every seed', () => {
    const plan = planFor(7);
    expect(plan.mode).toBe('sortStay');
    for (let seed = 1; seed <= 300; seed++) {
      const herd = makeHerd(plan, new Rng(seed));
      expect(makeHerd(plan, new Rng(seed))).toEqual(herd);
      expect(herd.stay).toBe('cow');
      expect(herd.animals).toHaveLength(6);
      expect(new Set(herd.pens.map((p) => p.kind)).size).toBe(2);
      expect(herd.pens.every((p) => p.kind !== herd.stay)).toBe(true);
      for (const kind of ['pig', 'bunny', 'cow']) expect(herd.animals.filter((k) => k === kind)).toHaveLength(2);
      for (const pen of herd.pens) {
        expect(enter(pen, herd.stay!)).toBe('wrong-pen');
        expect(enter(pen, pen.kind)).toBe('in');
        expect(wanted(herd, pen)).toBe(2);
      }
      expect(pensFull(herd, [2, 1])).toBe(false);
      expect(pensFull(herd, [1, 2])).toBe(false);
      expect(pensFull(herd, [2, 2])).toBe(true);
      expect(pensFull({ ...herd, animals: herd.animals.filter((k) => k !== herd.stay) }, [2, 2])).toBe(true);
    }
  });

  it('lets Come along follow a finger gently, gather without piling up and enter in any order', () => {
    const plan = planFor(11);
    expect(plan).toMatchObject({ mode: 'follow', animals: 3, gate: 0.8, hintAfter: 15 });
    // Following is always slower than running from a finger, and stops short of the finger itself.
    expect(FOLLOW_SPEED).toBeLessThan(SHOO_SPEED);
    for (let d = 0; d <= 1200; d += 5) expect(followSpeed(d)).toBeLessThanOrEqual(FOLLOW_SPEED);
    expect(followSpeed(FOLLOW_STOP)).toBe(0);
    expect(followSpeed(FOLLOW_STOP - 30)).toBe(0);
    expect(followSpeed(FOLLOW_STOP + 100)).toBeGreaterThan(0);
    // Three animals following a still finger, jostling apart as in the round, end round it with room between them.
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new Rng(seed);
      const finger = { x: 500, y: 400 };
      const herd = Array.from({ length: 3 }, () => ({ x: rng.range(200, 800), y: rng.range(250, 650) }));
      for (let step = 0; step < 600; step++) {
        for (const p of herd) {
          const dx = finger.x - p.x;
          const dy = finger.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const s = followSpeed(d) / 60;
          p.x += (dx / d) * s;
          p.y += (dy / d) * s;
        }
        spreadApart(herd);
      }
      for (let i = 0; i < 3; i++) {
        expect(Math.hypot(herd[i].x - finger.x, herd[i].y - finger.y)).toBeLessThan(FOLLOW_STOP + 80);
        for (let j = i + 1; j < 3; j++) expect(Math.hypot(herd[i].x - herd[j].x, herd[i].y - herd[j].y)).toBeGreaterThan(60);
      }
    }
    for (let seed = 1; seed <= 100; seed++) {
      const herd = makeHerd(plan, new Rng(seed));
      expect(herd.animals).toHaveLength(3);
      expect(herd.pens).toHaveLength(1);
      expect(herd.pens[0].target).toBeUndefined();
      // One kind and no count: whichever arrives first, each one is welcome.
      expect(herd.animals.every((kind) => enter(herd.pens[0], kind) === 'in')).toBe(true);
    }
    // Leading goes to the gate's mouth first, then inside once lined up, and the way in passes the wide gate.
    const pen = { x: 600, y: 200, w: 300, h: 300 };
    const outside = leadGoal({ x: 300, y: 250 }, pen);
    expect(outside.x).toBeLessThan(pen.x);
    const inside = leadGoal(outside, pen);
    expect(inside.x).toBeGreaterThan(pen.x);
    expect(throughGate(pen, outside, inside, plan.gate)).toBe(true);
  });

  it('always has enough animals for every pen, with a spare when counting', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const herd = makeHerd(plan, new Rng(seed));
        for (const pen of herd.pens) {
          const have = herd.animals.filter((k) => k === pen.kind).length;
          expect(have, plan.name).toBeGreaterThanOrEqual(wanted(herd, pen));
          if (pen.target !== undefined) {
            expect(have).toBeGreaterThan(pen.target);
            expect(pen.target).toBeGreaterThanOrEqual(plan.min!);
          }
        }
        expect(herd.pens.length).toBe(plan.mode.startsWith('sort') || plan.mode === 'fair' ? 2 : 1);
      }
    }
  });

  it('uses every kind in one-pen rounds and every distinct pen pair in sorting rounds', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'sortStay' && p.mode !== 'fair')) {
      const pairs = new Set<string>();
      const kinds = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const herd = makeHerd(plan, new Rng(seed));
        expect(makeHerd(plan, new Rng(seed))).toEqual(herd);
        expect(new Set(herd.pens.map((p) => p.kind)).size).toBe(herd.pens.length);
        for (const kind of herd.animals) {
          expect(herd.pens.some((p) => p.kind === kind)).toBe(true);
          kinds.add(kind);
        }
        pairs.add(herd.pens.map((p) => p.kind).sort().join(','));
        for (const pen of herd.pens) {
          expect(PLURAL[pen.kind]).toBeTruthy();
          expect(PLACE[pen.kind]).toBeTruthy();
          for (const kind of KINDS) expect(enter(pen, kind)).toBe(kind === pen.kind ? 'in' : 'wrong-pen');
          const have = herd.animals.filter((k) => k === pen.kind).length;
          if (plan.mode === 'sortCount') {
            expect(have).toBe(pen.target! + 1);
            expect(pen.target).toBeLessThanOrEqual(plan.max!);
          }
        }
        expect(ringBell(herd, herd.pens.map((p) => wanted(herd, p))).every((r) => r.extra === 0 && r.short === 0)).toBe(true);
      }
      expect([...kinds].sort()).toEqual([...KINDS].sort());
      expect(pairs.size).toBe(plan.mode.startsWith('sort') ? 10 : 5);
    }
  });

  it('varies level 4 between four and five animals, with every nonempty split possible', () => {
    const casts = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const herd = makeHerd(PLANS[3], new Rng(seed));
      expect(herd.animals.length).toBeGreaterThanOrEqual(4);
      expect(herd.animals.length).toBeLessThanOrEqual(5);
      const counts = herd.pens.map((p) => herd.animals.filter((k) => k === p.kind).length);
      expect(counts.every((n) => n >= 1)).toBe(true);
      casts.add(counts.join('+'));
    }
    expect([...casts].sort()).toEqual(['1+3', '1+4', '2+2', '2+3', '3+1', '3+2', '4+1']);
  });

  it('lets animals into their own pen, and the bell finds too many or too few', () => {
    expect(enter({ kind: 'pig' }, 'bunny')).toBe('wrong-pen');
    expect(enter({ kind: 'pig', target: 2 }, 'pig')).toBe('in');
    const herd = { animals: ['pig', 'pig', 'pig', 'bunny', 'bunny'] as const, pens: [{ kind: 'pig' as const, target: 2 }, { kind: 'bunny' as const, target: 1 }] };
    const h = { ...herd, animals: [...herd.animals] };
    expect(ringBell(h, [3, 0])).toEqual([{ extra: 1, short: 0 }, { extra: 0, short: 1 }]);
    expect(ringBell(h, [2, 1])).toEqual([{ extra: 0, short: 0 }, { extra: 0, short: 0 }]);
  });

  it('only lets animals in through the gate, and shooing is stronger up close', () => {
    const pen = { x: 500, y: 100, w: 200, h: 200 };
    expect(throughGate(pen, { x: 490, y: 200 }, { x: 510, y: 200 })).toBe(true);
    expect(throughGate(pen, { x: 490, y: 110 }, { x: 510, y: 110 })).toBe(false);
    expect(throughGate(pen, { x: 510, y: 200 }, { x: 490, y: 200 })).toBe(false);
    expect(fleeSpeed(300, 190, 330)).toBe(0);
    expect(fleeSpeed(20, 190, 330)).toBeGreaterThan(fleeSpeed(150, 190, 330));
  });

  it('puts the demonstration finger behind the animal, aimed away from the gate', () => {
    for (const [animal, gate] of [
      [{ x: 200, y: 300 }, { x: 700, y: 300 }],
      [{ x: 300, y: 500 }, { x: 700, y: 200 }],
      [{ x: 650, y: 120 }, { x: 700, y: 400 }],
    ]) {
      const finger = shooPoint(animal, gate);
      expect(Math.hypot(finger.x - animal.x, finger.y - animal.y)).toBeCloseTo(105);
      expect((gate.x - animal.x) * (finger.x - animal.x) + (gate.y - animal.y) * (finger.y - animal.y)).toBeLessThan(0);
    }
  });

  it('starts each round somewhere new, always on the open meadow left of the pens', () => {
    const field = { x0: 230, y0: 260, y1: 678 };
    const left = 600;
    const layouts = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const spots = startSpots(5, field, left, new Rng(seed));
      for (const p of spots) {
        expect(p.x).toBeGreaterThanOrEqual(field.x0 + 40);
        expect(p.x).toBeLessThanOrEqual(left);
        expect(p.y).toBeGreaterThan(field.y0);
        expect(p.y).toBeLessThan(field.y1);
      }
      layouts.add(spots.map((p) => Math.round(p.x)).join());
    }
    expect(layouts.size).toBeGreaterThan(40);
  });

  it('draws as many dots as the sign asks for, packed beside the numeral', () => {
    for (let n = 1; n <= 4; n++) {
      const dots = signDots(n);
      expect(dots).toHaveLength(n);
      expect(new Set(dots.map((d) => `${d.x},${d.y}`)).size).toBe(n);
      // Inside the board's right part: 64 ± 26 across, within its 80-unit height.
      for (const d of dots) {
        expect(Math.abs(d.x)).toBeLessThanOrEqual(26);
        expect(Math.abs(d.y)).toBeLessThanOrEqual(26);
      }
    }
    // Every counting target fits the four the sign can show.
    for (const plan of PLANS.filter((p) => p.max !== undefined)) expect(plan.max).toBeLessThanOrEqual(4);
  });

  it('says one pig, two pigs', () => {
    expect(animalsFor('pig', 1)).toBe('pig');
    expect(animalsFor('bunny', 3)).toBe('bunnies');
  });

  it('Make it fair: an even herd of 6 or 8 of one kind, two pens of that kind, and a bell', () => {
    const plan = planFor(8);
    expect(usesBell(plan)).toBe(true);
    const sizes = new Set<number>();
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const herd = makeHerd(plan, new Rng(seed));
      expect(herd.fair).toBe(true);
      expect([6, 8]).toContain(herd.animals.length);
      sizes.add(herd.animals.length);
      expect(herd.pens).toHaveLength(2);
      expect(herd.pens[0].kind).toBe(herd.pens[1].kind);
      expect(herd.pens.every((p) => p.target === undefined)).toBe(true);
      expect(herd.animals.every((k) => k === herd.pens[0].kind)).toBe(true);
      for (const pen of herd.pens) expect(enter(pen, herd.pens[0].kind)).toBe('in');
      kinds.add(herd.pens[0].kind);
    }
    expect([...sizes].sort()).toEqual([6, 8]);
    expect(kinds.size).toBe(KINDS.length);
  });

  it('Make it fair: the bell accepts any equal non-zero split and names the fuller and emptier pen', () => {
    for (let a = 0; a <= 8; a++) {
      for (let b = 0; a + b <= 8; b++) {
        const bell = fairBell([a, b]);
        expect(bell.fair).toBe(a === b && a > 0);
        if (a !== b) {
          expect([a, b][bell.less]).toBe(Math.min(a, b));
          expect([a, b][bell.more]).toBe(Math.max(a, b));
          expect(bell.less).toBe(emptierPen([a, b]));
          // The extras leave the fuller pen level with the other, unless that would empty both.
          expect(bell.extra).toBe(Math.min(a, b) === 0 ? 0 : Math.abs(a - b));
          if (bell.extra) expect(fairBell(bell.more === 0 ? [a - bell.extra, b] : [a, b - bell.extra]).fair).toBe(true);
        } else expect(bell.extra).toBe(0);
      }
    }
    // 2 and 2 with two loose is fair; 3 and 3 is fair; an empty pen is never "the same".
    expect(fairBell([2, 2]).fair).toBe(true);
    expect(fairBell([3, 3]).fair).toBe(true);
    expect(fairBell([0, 0]).fair).toBe(false);
    expect(fairBell([4, 0]).fair).toBe(false);
  });

  it('Make it fair: help and the demonstration fill the emptier pen up to half each', () => {
    for (const n of [6, 8]) {
      const herd = { animals: Array<Kind>(n).fill('pig'), pens: [{ kind: 'pig' as Kind }, { kind: 'pig' as Kind }], fair: true };
      const inside = [0, 0];
      // Following the help one animal at a time always ends level at half each.
      for (let step = 0; step < n; step++) {
        const i = fairNeeds(herd, inside);
        if (i < 0) break;
        expect(inside[i]).toBeLessThanOrEqual(inside[1 - i]);
        inside[i]++;
      }
      expect(inside).toEqual([n / 2, n / 2]);
      expect(fairNeeds(herd, inside)).toBe(-1);
      expect(fairBell(inside).fair).toBe(true);
      expect(fairNeeds(herd, [n / 2 + 1, 1])).toBe(1);
    }
  });
});
