import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { PAD, rowsLayout } from './layout';
import {
  basketLayout,
  cellSize,
  controlRow,
  deal,
  MIN_CELL,
  orchardLayout,
  pathLayout,
  PLANS,
  rowRange,
  turn,
  type Box,
  type Orchard,
} from './logic';

const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const sideways = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390)];
/** A layout's box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const box = (what: string, b: Box): Target => ({
  what,
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
  w: b.w - 0.01,
  h: b.h - 0.01,
});
/** Every orchard levels 1–3 can show, as planted and as turned. */
const orchards: Orchard[] = PLANS.slice(0, 3).flatMap((p) => p.shapes.flatMap((o) => [o, turn(o)]));

describe('Orchard Rows upright, levels 1–3', () => {
  it.each(Object.entries(views))('fits the rows with the answer pads or the turn button on %s', (_, v) => {
    for (const o of orchards) {
      const l = rowsLayout(v, o, 3);
      const rows = Array.from({ length: o.rows }, (_, i): Target => ({
        what: `row ${i}`,
        x: l.x,
        y: l.y + i * l.rowHeight + l.rowHeight / 2,
        w: l.width,
        h: l.hit,
      }));
      const pads = l.pads.map((p, i): Target => ({ what: `pad ${i}`, ...p, ...PAD }));
      const tag = `${o.rows} × ${o.columns}`;
      expect(uprightProblems(v, [...rows, ...pads]), tag).toEqual([]);
      // The turn button takes the pads' place once the total is right.
      expect(uprightProblems(v, [...rows, { what: 'turn', ...l.rotate, ...PAD }]), tag).toEqual([]);
      // Clear of the heading and the running sum above (to y 190), and the strip she sees is what she can tap.
      expect(l.y, tag).toBeGreaterThanOrEqual(210);
      expect(l.drawn, tag).toBeGreaterThanOrEqual(100);
      expect(l.hit, tag).toBeGreaterThanOrEqual(l.drawn);
      expect(l.hit, tag).toBeLessThanOrEqual(l.rowHeight);
      // Five trees across get more room than the 80 units a tree is drawn at.
      expect(l.width / o.columns, tag).toBeGreaterThanOrEqual(100);
    }
  });

  it('centres two pads as it does three', () => {
    const v = UPRIGHT_VIEWS.phone;
    const two = rowsLayout(v, { rows: 2, columns: 2 }, 2).pads;
    expect((two[0].x + two[1].x) / 2).toBe(v.w / 2);
    expect(two[1].x - two[0].x).toBeGreaterThanOrEqual(PAD.w);
  });

  it('leaves the sideways layout where it always was', () => {
    for (const v of sideways)
      for (const o of orchards) {
        const l = rowsLayout(v, o, 3);
        expect(l).toMatchObject({ ...orchardLayout(v.w, v.h, o), drawn: 92, hit: 100 });
        expect(l.pads).toEqual([0, 1, 2].map((i) => ({ x: v.w - 130, y: 390 + i * 125 })));
        expect(l.rotate).toEqual({ x: v.w - 130, y: 250 });
      }
  });
});

describe('Orchard Rows upright, levels 4–9', () => {
  it('closes the bottom controls up only on the narrow upright view', () => {
    expect(controlRow(1024)).toEqual([230, 370, 510, 670]);
    const [x0, x1, x2, x3] = controlRow(768);
    expect(x0).toBeGreaterThanOrEqual(200);
    expect([x1 - x0, x2 - x1, x3 - x2].every((d) => d >= 120)).toBe(true);
    expect(x3 + 130).toBeLessThanOrEqual(768 - 10);
  });

  it.each(Object.entries(views))('fits the basket levels on %s', (_, v) => {
    for (const [level, frames] of [
      [4, 0],
      [5, 3],
      [5, 4],
      [6, 0],
    ]) {
      const l = basketLayout(v, level, frames);
      const tag = `level ${level}, ${frames} frames`;
      // The game shows nothing when this is null, so null is a failure here.
      expect(l, tag).not.toBeNull();
      if (!l) continue;
      const targets = [
        box('fewer', l.down),
        box('card', l.card),
        box('more', l.up),
        box('plant', l.act),
        ...(level === 6 ? l.baskets.map((b, i) => box(`basket ${i}`, b)) : []),
      ];
      expect(uprightProblems(v, targets), tag).toEqual([]);
      // The pictures (the leftover basket, the shape frames) and the bed stay inside the view and off the controls.
      for (const b of [...l.baskets, ...l.frames, l.bed]) {
        expect(b.x >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h, tag).toBe(true);
        expect(b.y + b.h, tag).toBeLessThanOrEqual(l.down.y);
      }
      // Every deal she can reach still gets a cell worth looking at.
      for (let n = 12; n <= 24; n++) {
        const { min, max } = rowRange(level, n);
        for (let r = Math.max(1, min); r <= max; r++)
          expect(cellSize(l.bed, deal(n, r)), `${tag} n${n} r${r}`).toBeGreaterThanOrEqual(MIN_CELL);
      }
    }
  });

  it.each(Object.entries(views))('fits the path levels on %s', (_, v) => {
    for (const level of [7, 8, 9]) {
      const l = pathLayout(v, level);
      const tag = `level ${level}`;
      expect(l, tag).not.toBeNull();
      if (!l) continue;
      const signs = l.signs.map((b, i) => box(`sign ${i}`, b));
      expect(uprightProblems(v, [...signs, ...l.pads.map((b, i) => box(`pad ${i}`, b))]), tag).toEqual([]);
      if (level !== 8) continue;
      // Level 8's path controls sit where the pads will, until the path is laid.
      expect(l.up && l.down && l.card && l.lay, tag).toBeTruthy();
      const controls = [box('up', l.up!), box('card', l.card!), box('down', l.down!), box('lay', l.lay!)];
      expect(uprightProblems(v, [...signs, ...controls]), tag).toEqual([]);
      expect(l.bed.y + l.bed.h, tag).toBeLessThanOrEqual(l.up!.y);
    }
  });
});
