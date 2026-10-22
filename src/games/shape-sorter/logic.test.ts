import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { MORE_SHAPES, SHAPES } from '../../art/shapes';
import { SCRIPT } from '../../content/voice-script';
import { DESIGN_H, DESIGN_W } from '../../engine/view';
import {
  BOX_FRONT,
  CURVES,
  FLOOR_AT,
  POOL,
  SIZE_POOL,
  boxTopFor,
  clueKinds,
  dealHoles,
  factDue,
  fits,
  holeAt,
  holeFor,
  holeLayout,
  nearest,
  pieceKinds,
  PLANS,
  startHelp,
  TAP_HOLD,
  TAP_REACH,
  tapsIn,
  planFor,
  sizeMiss,
  wrongDrop,
} from './logic';
import { PRESS } from '../../engine/ghost';
import { shapeSorter } from './index';

describe('Shape Sorter', () => {
  it('deals a piece for every hole and only pieces that fit somewhere', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const holes = dealHoles(new Rng(seed), plan);
        const pieces = pieceKinds(new Rng(seed + 1000), plan, holes);
        expect(pieces).toHaveLength(plan.pieces);
        for (const hole of holes) expect(pieces.some((p) => fits(hole, p))).toBe(true);
        for (const p of pieces) expect(holes.filter((h) => fits(h, p))).toHaveLength(1);
      }
      // Once every piece is one color, only the shape tells them apart, and the rims stop helping.
      if (plan.sameColor) expect(plan.coded).toBe(false);
    }
  });

  it('lays out holes inside the lid, apart from each other, each catching drops on and around it', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 20; seed++) {
        const { holes, w, lidH } = holeLayout(plan, dealHoles(new Rng(seed), plan));
        for (const h of holes) {
          // Shapes reach a little past r (a diamond's points, a rectangle's ends): allow for the widest.
          expect(Math.abs(h.x) + h.r * 1.18).toBeLessThanOrEqual(w / 2);
          expect(h.y + h.r * 1.18).toBeLessThanOrEqual(lidH);
          for (const o of holes) if (o !== h) expect(Math.hypot(o.x - h.x, o.y - h.y)).toBeGreaterThan(h.r + o.r + 20);
          // Dropped in the middle, or anywhere on its rim: that hole.
          expect(holeAt(holes, h.x, h.y)).toBe(h);
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
            expect(holeAt(holes, h.x + Math.cos(a) * h.r, h.y + Math.sin(a) * h.r)).toBe(h);
          }
        }
        // Far from every hole: nothing (the piece just goes home).
        expect(holeAt(holes, 0, -400)).toBeUndefined();
      }
    }
  });

  it('has a hole for every piece, and dropping a piece on its own hole is taken (what the ghost finger carries it to)', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 30; seed++) {
        const specs = dealHoles(new Rng(seed), plan);
        const { holes } = holeLayout(plan, specs);
        for (const piece of pieceKinds(new Rng(seed), plan, specs)) {
          const hole = holeFor(holes, piece);
          expect(hole, `${piece.kind}`).toBeDefined();
          expect(holeAt(holes, hole!.x, hole!.y)).toBe(hole);
          expect(fits(hole!, piece)).toBe(true);
        }
      }
    }
  });

  it('asks once for every shape in the clue level, in seeded order, each clue naming exactly one dealt shape', () => {
    const plan = PLANS[7];
    expect(plan.clue).toBe(true);
    // Which kinds each clue describes: "no corners" is a circle and an oval, "four equal sides" a square and a diamond…
    const fitsClue: Record<string, string[]> = {
      circle: ['circle', 'oval'],
      oval: ['oval', 'circle'],
      square: ['square', 'diamond'],
      diamond: ['diamond', 'square', 'trapezoid'],
      star: ['star', 'pentagon'],
      pentagon: ['pentagon', 'star'],
      trapezoid: ['trapezoid', 'diamond'],
    };
    for (let seed = 1; seed <= 300; seed++) {
      const holes = dealHoles(new Rng(seed), plan);
      const kinds = holes.map((h) => h.kind);
      const order = clueKinds(new Rng(seed), holes);
      expect(order).toHaveLength(6);
      expect(new Set(order)).toEqual(new Set(kinds));
      expect(clueKinds(new Rng(seed), holes)).toEqual(order);
      for (const k of kinds) expect((fitsClue[k] ?? [k]).filter((o) => kinds.includes(o as never))).toEqual([k]);
    }
  });

  it('draws 6–8 from the whole pool with a pinned count, and keeps the square and the diamond apart', () => {
    expect(POOL).toEqual([...SHAPES, ...MORE_SHAPES]);
    expect(SHAPES).toHaveLength(6); // other games deal SHAPES; the new five join only here
    const seen = new Set<string>();
    for (const level of [6, 7, 8]) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 300; seed++) {
        const kinds = dealHoles(new Rng(seed), plan).map((h) => h.kind);
        expect(kinds).toHaveLength(level === 6 ? 5 : 6);
        expect(new Set(kinds).size).toBe(kinds.length);
        expect(kinds.includes('square') && kinds.includes('diamond')).toBe(false);
        if (level === 6) expect(kinds).toEqual(expect.arrayContaining(['circle', 'square']));
        else {
          expect(kinds.filter((k) => CURVES.includes(k)).length).toBeGreaterThanOrEqual(1);
          expect(kinds.filter((k) => !CURVES.includes(k)).length).toBeGreaterThanOrEqual(2);
        }
        kinds.forEach((k) => seen.add(k));
      }
    }
    expect(seen).toEqual(new Set(POOL));
    // The fixed levels keep their lids, and every dealt kind has a name, a clue, a hint and a fact.
    expect(dealHoles(new Rng(1), planFor(5)).map((h) => h.kind)).toEqual(['circle', 'square', 'triangle', 'star']);
    for (const k of POOL) {
      for (const id of [`shape.${k}`, `shape.find.clue.${k}`, `shape.find.hint.${k}`, `shape.find.notyet.${k}`, `shape.fact.${k}`]) {
        expect((SCRIPT[id as keyof typeof SCRIPT] as readonly string[] | undefined)?.length, id).toBeGreaterThan(0);
      }
    }
  });

  it('sizes pieces at 6–7 between 0.85 and 1.15, a kind dealt twice once little and once big, any size fitting its hole', () => {
    for (const level of [6, 7]) {
      const plan = planFor(level);
      expect(plan.sizes).toBe(true);
      for (let seed = 1; seed <= 200; seed++) {
        const holes = dealHoles(new Rng(seed), plan);
        const pieces = pieceKinds(new Rng(seed), plan, holes);
        for (const p of pieces) {
          expect(p.scale).toBeGreaterThanOrEqual(0.85);
          expect(p.scale).toBeLessThanOrEqual(1.15);
          expect(Math.abs(p.scale - 1)).toBeGreaterThan(0.06);
        }
        for (const k of new Set(pieces.map((p) => p.kind))) {
          const of = pieces.filter((p) => p.kind === k);
          if (of.length >= 2) expect(new Set(of.map((p) => p.scale > 1)).size).toBe(2);
        }
      }
    }
    for (const level of [1, 2, 3, 4, 5, 8, 9, 10]) expect(pieceKinds(new Rng(3), planFor(level)).every((p) => p.scale === 1)).toBe(true);
  });

  it('says a fact on one swallow in three at 5–7 only', () => {
    for (let level = 1; level <= 11; level++) {
      const due = Array.from({ length: 9 }, (_, i) => factDue(planFor(level), i + 1));
      expect(due.filter(Boolean)).toHaveLength([5, 6, 7].includes(level) ? 3 : 0);
    }
  });

  it('level 10 is two plain holes, circle and square, both dealt, between toddler 2 and 3', () => {
    const plan = planFor(10);
    expect(plan).toMatchObject({ holes: ['circle', 'square'], pieces: 4, coded: false, sameColor: false });
    for (let seed = 1; seed <= 100; seed++) {
      const kinds = pieceKinds(new Rng(seed), plan).map((p) => p.kind);
      expect(new Set(kinds)).toEqual(new Set(['circle', 'square']));
    }
    expect(shapeSorter.levels('toddler')).toEqual({ min: 1, max: 10, order: [9, 1, 2, 10, 3, 4, 5] });
    expect(shapeSorter.describeLevel(10)).toBe('2 shapes, plain holes');
  });

  it('level 11 is one kind in three sizes: one hole and one piece of each size, and the wrong size is too big or too little', () => {
    const plan = planFor(11);
    expect(plan.sized).toBe(true);
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const holes = dealHoles(new Rng(seed), plan);
      expect(new Set(holes.map((h) => h.kind)).size).toBe(1);
      expect(holes.map((h) => h.size).sort()).toEqual([0, 1, 2]);
      kinds.add(holes[0].kind);
      const pieces = pieceKinds(new Rng(seed), plan, holes);
      expect(pieces.map((p) => p.size).sort()).toEqual([0, 1, 2]);
      const laid = holeLayout(plan, holes).holes;
      for (const p of pieces) {
        const right = holeFor(laid, p)!;
        expect(right.size).toBe(p.size);
        // The nearest hole still wins with sized holes: dropped on the right one, that one.
        expect(holeAt(laid, right.x, right.y)).toBe(right);
        for (const h of laid) if (h !== right) expect(sizeMiss(h, p)).toBe(p.size! > h.size! ? 'big' : 'little');
        expect(sizeMiss(right, p)).toBeNull();
      }
    }
    expect(kinds).toEqual(new Set(SIZE_POOL));
    expect(shapeSorter.levels('preschool')).toEqual({ min: 3, max: 11, order: [3, 4, 5, 6, 7, 11] });
    expect(shapeSorter.levels('prek')).toEqual({ min: 5, max: 11, order: [5, 6, 7, 11, 8] });
    for (const id of ['shape.size.start', 'shape.size.big', 'shape.size.little', 'shape.size.same']) {
      expect((SCRIPT[id as keyof typeof SCRIPT] as readonly string[] | undefined)?.length, id).toBeGreaterThan(0);
    }
  });

  it('stands every lid on the floor, below the top buttons and inside the view, in every view', () => {
    const views: [number, number][] = [
      [DESIGN_W, DESIGN_H],
      [DESIGN_W + 340, DESIGN_H], // a wide laptop
      [DESIGN_H, DESIGN_W], // an iPad held upright
      [DESIGN_H, DESIGN_W + 300], // a tall phone shape
    ];
    for (const [w, h] of views) {
      for (const plan of PLANS) {
        const { w: lidW, lidH } = holeLayout(plan, dealHoles(new Rng(1), plan));
        const top = boxTopFor(h, lidH);
        expect(top, `${w}x${h} level ${PLANS.indexOf(plan) + 1}`).toBeGreaterThanOrEqual(40);
        expect(top + lidH + BOX_FRONT).toBeLessThanOrEqual(h * FLOOR_AT + 1e-9);
        expect(lidW + 24).toBeLessThanOrEqual(w - 2 * 40);
      }
    }
  });

  it('answers every touch at levels 1 and 9, the only levels where nothing can be wrong', () => {
    expect(PLANS.filter((p) => p.everyTouch)).toEqual([PLANS[0], PLANS[8]]);
    for (const p of PLANS.filter((p) => p.everyTouch)) expect(p.holes).toHaveLength(1);
    const items = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 400, y: 0 }];
    expect(nearest(items, 260, 50)).toBe(items[1]);
    expect(nearest(items, -999, 0)).toBe(items[0]);
    expect(nearest([], 0, 0)).toBeUndefined();
  });

  it('glows the right hole on every second miss, whichever pieces were tried and however many went in between', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const help = startHelp();
      let glows = 0;
      // Any mix of wrong drops and pieces going in (which never reset the count).
      for (let k = 0; k < 30; k++) if (rng.chance(0.5) && wrongDrop(help)) glows++;
      expect(help.hints).toBe(glows);
      expect(help.hints).toBe(Math.floor(help.misses / 2));
    }
    const six = startHelp();
    const lit = Array.from({ length: 6 }, () => wrongDrop(six));
    expect(lit).toEqual([false, true, false, true, false, true]);
    expect(lit.some(Boolean)).toBe(true);
  });

  it('names a right shape dropped in its own hole at the clue level, for every clue', () => {
    for (const k of POOL) {
      const lines = SCRIPT[`shape.find.notyet.${k}` as keyof typeof SCRIPT] as readonly string[];
      expect(lines?.length, k).toBeGreaterThan(0);
      for (const l of lines) expect(l).toContain('{shape}');
    }
  });

  it('level 9 is the tap-in entry: one circle hole, three pieces, every touch answered, and a tap puts any dealt piece in', () => {
    const plan = planFor(9);
    expect(plan).toMatchObject({ holes: ['circle'], pieces: 3, everyTouch: true, tapIn: true });
    // The ghost finger's press is a tap; a held touch is a drag, and no other level hops a piece in.
    expect(tapsIn(plan, PRESS, 0)).toBe(true);
    expect(tapsIn(plan, TAP_HOLD + 0.1, 0)).toBe(false);
    // A quick fling across the floor is a drag; a wobble under a still finger is not.
    expect(tapsIn(plan, PRESS, 48 + 40)).toBe(true);
    expect(tapsIn(plan, PRESS, TAP_REACH + 1)).toBe(false);
    for (let level = 1; level <= 8; level++) expect(tapsIn(planFor(level), 0, 0)).toBe(false);
    // From any seed, three taps finish the round: every dealt piece has its own hole to hop into.
    const { holes } = holeLayout(plan, dealHoles(new Rng(1), plan));
    for (let seed = 1; seed <= 100; seed++) {
      const pieces = pieceKinds(new Rng(seed), plan);
      expect(pieces).toHaveLength(3);
      for (const p of pieces) expect(holeFor(holes, p)).toBeDefined();
    }
    expect(SCRIPT['shape.tap.start']?.length).toBeGreaterThan(0);
  });

  it('plays level 9 alone at lap and first at toddler, an entry level the older bands never land on', () => {
    expect(shapeSorter.bands).toContain('lap');
    expect(shapeSorter.levels('lap')).toEqual({ min: 9, max: 9, order: [9] });
    expect(shapeSorter.levels('toddler').order?.[0]).toBe(9);
    expect(shapeSorter.entryLevels).toEqual([9]);
    for (const band of ['preschool', 'prek'] as const) expect(shapeSorter.levels(band).order).not.toContain(9);
    expect(shapeSorter.describeLevel(9)).toBe('tap a shape and it hops in');
  });
});
