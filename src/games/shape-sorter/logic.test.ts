import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SHAPES } from '../../art/shapes';
import { SCRIPT } from '../../content/voice-script';
import { DESIGN_H, DESIGN_W } from '../../engine/view';
import {
  BOX_FRONT,
  CLASSIC,
  FLOOR_AT,
  HOLE_R,
  boxTopFor,
  clueKinds,
  holeAt,
  holeFor,
  holeLayout,
  nearest,
  pieceKinds,
  PLANS,
  startHelp,
  wrongDrop,
} from './logic';

describe('Shape Sorter', () => {
  it('deals a piece for every hole and only pieces that fit somewhere', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const kinds = pieceKinds(new Rng(seed), plan);
        expect(kinds).toHaveLength(plan.pieces);
        for (const hole of plan.holes) expect(kinds).toContain(hole);
        for (const k of kinds) expect(plan.holes).toContain(k);
      }
      // Once every piece is one color, only the shape tells them apart, and the rims stop helping.
      if (plan.sameColor) expect(plan.coded).toBe(false);
    }
  });

  it('lays out holes inside the lid, apart from each other, each catching drops on and around it', () => {
    for (const plan of PLANS) {
      const { holes, w, lidH } = holeLayout(plan);
      expect(holes).toHaveLength(plan.holes.length);
      for (const h of holes) {
        expect(Math.abs(h.x) + HOLE_R).toBeLessThanOrEqual(w / 2);
        expect(h.y + HOLE_R).toBeLessThanOrEqual(lidH);
        for (const o of holes) if (o !== h) expect(Math.hypot(o.x - h.x, o.y - h.y)).toBeGreaterThan(2 * HOLE_R + 20);
        // Dropped in the middle, or anywhere on its rim: that hole.
        expect(holeAt(holes, h.x, h.y)).toBe(h);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          expect(holeAt(holes, h.x + Math.cos(a) * HOLE_R, h.y + Math.sin(a) * HOLE_R)).toBe(h);
        }
      }
      // Far from every hole: nothing (the piece just goes home).
      expect(holeAt(holes, 0, -400)).toBeUndefined();
    }
  });

  it('has a hole for every piece, and dropping a piece on its own hole is taken (what the ghost finger carries it to)', () => {
    for (const plan of PLANS) {
      const { holes } = holeLayout(plan);
      for (let seed = 1; seed <= 30; seed++) {
        for (const kind of pieceKinds(new Rng(seed), plan)) {
          const hole = holeFor(holes, kind);
          expect(hole, `${kind}`).toBeDefined();
          expect(holeAt(holes, hole!.x, hole!.y)?.kind).toBe(kind);
        }
      }
    }
  });

  it('asks once for every shape in the clue level, in seeded order', () => {
    const plan = PLANS[7];
    expect(plan.clue).toBe(true);
    expect(plan.holes).toEqual(CLASSIC);
    for (let seed = 1; seed <= 100; seed++) {
      const order = clueKinds(new Rng(seed), plan);
      expect(order).toHaveLength(CLASSIC.length);
      expect(new Set(order)).toEqual(new Set(CLASSIC));
      expect(clueKinds(new Rng(seed), plan)).toEqual(order);
    }
  });

  it('pins levels 7 and 8 to the classic six, so a new shape kind cannot widen their lids', () => {
    expect(CLASSIC).toHaveLength(6);
    for (const k of CLASSIC) expect(SHAPES).toContain(k);
    expect(PLANS[6].holes).toBe(CLASSIC);
    expect(PLANS[7].holes).toBe(CLASSIC);
    for (const plan of PLANS) expect(plan.holes).not.toBe(SHAPES);
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
        const { w: lidW, lidH } = holeLayout(plan);
        const top = boxTopFor(h, lidH);
        expect(top, `${w}x${h} ${plan.holes.length} holes`).toBeGreaterThanOrEqual(40);
        expect(top + lidH + BOX_FRONT).toBeLessThanOrEqual(h * FLOOR_AT + 1e-9);
        expect(lidW + 24).toBeLessThanOrEqual(w - 2 * 40);
      }
    }
  });

  it('answers every touch at level 1, the only level where nothing can be wrong', () => {
    expect(PLANS.filter((p) => p.everyTouch)).toEqual([PLANS[0]]);
    expect(PLANS[0].holes).toHaveLength(1);
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
    for (const k of CLASSIC) {
      const lines = SCRIPT[`shape.find.notyet.${k}` as keyof typeof SCRIPT] as readonly string[];
      expect(lines?.length, k).toBeGreaterThan(0);
      for (const l of lines) expect(l).toContain('{shape}');
    }
  });
});
