import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../engine/view';
import {
  ANSWER_SIZE,
  clampGlass,
  corners,
  lensLayout,
  MIN_LENS,
  MIN_LENS_1,
  PLANS,
  ringBox,
  ringHits,
  STOP_SIZE,
  THING_SIZE,
  type Rect,
} from './puddle-lens/logic';
import { frameFor, UPRIGHT_DESIGN } from './ribbon-workshop/frame';
import { CAPACITY, ROW_TICKS, trayLayout, UNIT, type Piece } from './ribbon-workshop/logic';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

/**
 * Grown-up games that gained the grown-up band after upright batch 4 (chunk 31, docs/definitions/phone-portrait.md),
 * checked at every level, since a phone's Today's six plays a game at the player's own band.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const target = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w,
  h: r.h,
});

describe.each(Object.entries(views))('Grown-up upright catch-up on %s', (_, v) => {
  it.each(PLANS.map((p) => p.level))('Puddle Lens level %i: the lens and every button fit', (level) => {
    const l = lensLayout(v, level);
    expect(l).not.toBeNull();
    if (!l) return;
    const targets = [
      ...l.stops.map((r) => target('stop', r)),
      ...(l.answer ? [target('answer', l.answer)] : []),
      ...l.choices.map((r) => target('choice', r)),
      ...l.things.map((t) => target('thing', ringBox(t))),
    ];
    expect(uprightProblems(v, targets)).toEqual([]);
    // Full-size buttons upright, the same units as sideways: no level falls back to the smaller grown-up cards.
    for (const r of l.stops) expect(Math.min(r.w, r.h)).toBe(STOP_SIZE);
    for (const r of [...l.choices, ...(l.answer ? [l.answer] : [])])
      expect(Math.min(r.w, r.h)).toBe(ANSWER_SIZE);
    for (const t of l.things) expect(t.r * 2).toBe(THING_SIZE);
    expect(l.stops.length).toBe(level >= 3 ? 4 : 0);
    expect(l.choices.length).toBe(level === 9 || level === 11 ? 4 : level >= 5 ? 3 : 0);
    if (level !== 2) {
      // The lens: inside the view, clear of Home, "?" and the guide, and never under a button.
      expect(l.lens.r * 2).toBeGreaterThanOrEqual(level === 1 ? MIN_LENS_1 : MIN_LENS);
      const b = ringBox(l.lens);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(v.w);
      expect(b.y + b.h).toBeLessThanOrEqual(v.h);
      for (const k of corners(v)) expect(ringHits(l.lens, k)).toBe(false);
      for (const t of targets)
        expect(ringHits(l.lens, { x: t.x - t.w / 2, y: t.y - t.h / 2, w: t.w, h: t.h })).toBe(false);
    } else {
      // The hand lens rests on the table above the row, the table keeps the whole glass inside the view and off Home,
      // "?" and the guide, and a glass let go on any thing stays centred on it (clampGlass does not pull it away).
      const t = l.table!;
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w).toBeLessThanOrEqual(v.w);
      for (const k of corners(v))
        expect(t.x < k.x + k.w && k.x < t.x + t.w && t.y < k.y + k.h && k.y < t.y + t.h).toBe(false);
      for (const p of [l.rest!, ...l.things]) expect(clampGlass(p, t)).toEqual({ x: p.x, y: p.y });
    }
    // A thumb on a 390-wide phone: the smallest button is at least 44 px.
    if (v === UPRIGHT_VIEWS.phone && targets.length)
      expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
  });
});

/**
 * Ribbon Workshop's three scenes (the bench, Whole Switch and Ribbon Cases) draw sideways layouts into a scaled world
 * upright (ribbon-workshop/frame.ts): the targets below are the ones every scene has, in the scene's units, mapped onto
 * the real view.
 */
describe.each(Object.entries(views))('Ribbon Workshop upright on %s', (name, v) => {
  const f = frameFor(v);
  const real = (what: string, x: number, y: number, w: number, h: number): Target => ({
    what,
    x: x * f.s,
    y: y * f.s + f.y,
    w: w * f.s,
    h: h * f.s,
  });
  // Level 1's largest tray: two halves and four quarters, eight ticks in two rows.
  const stock: Piece[] = ([2, 2, 1, 1, 1, 1] as const).map((size, id) => ({ id, size }));
  const all = () => {
    const out: Target[] = [];
    const tray = stock;
    for (const spot of trayLayout(tray, f.trayLeft)) {
      const p = tray.find((q) => q.id === spot.id)!;
      out.push(real(`tray card ${p.id}`, spot.x, f.view.h - 90 - spot.row * 125, p.size * UNIT, 110));
    }
    for (let i = 0; i < CAPACITY; i++)
      out.push(real(`bench tick ${i}`, f.x0 + (i + 0.5) * UNIT, 370, UNIT, 120));
    for (const [what, x, y] of [
      ['bow', f.view.w - 80, f.view.h - 90],
      ['scissors', f.view.w - 80, f.view.h - 215],
      ['undo', f.view.w - 80, 82],
    ] as const)
      out.push(real(what, x, y, 120, 120));
    return out;
  };

  it('scales the sideways world to the view and keeps it on the view', () => {
    expect(f.view.w).toBeGreaterThanOrEqual(UPRIGHT_DESIGN.w - 1e-6);
    expect(f.s).toBeLessThanOrEqual(1);
    expect(f.s * UPRIGHT_DESIGN.w).toBeLessThanOrEqual(v.w + 1e-6);
    expect(f.y).toBeGreaterThanOrEqual(0);
    expect(f.y + f.view.h * f.s).toBeLessThanOrEqual(v.h + 1e-6);
    expect(f.trayLeft * f.s).toBeGreaterThanOrEqual(150);
  });

  it('keeps the tray, the bench ticks and the buttons whole, apart and off the corners', () => {
    // The largest tray any level starts with and a bench of six ticks.
    expect(uprightProblems(v, all(), 64)).toEqual([]);
    // The second row of the tray stays below the bench's plank.
    const rows = trayLayout(stock, f.trayLeft);
    expect(Math.max(...rows.map((r) => r.row))).toBe(1);
    expect(f.trayLeft + ROW_TICKS * UNIT + 3 * 12).toBeLessThanOrEqual(f.view.w);
  });

  it("keeps How Many Pieces Fit?'s answer cards whole, apart and off the corners", () => {
    // Four 220 by 110 cards in a 2 by 2 grid where the tray stood, over the bench's four ticks and the buttons.
    const out: Target[] = [];
    for (let i = 0; i < 4; i++)
      out.push(
        real(
          `answer card ${i}`,
          f.trayLeft + 110 + (i % 2) * 236,
          f.view.h - 90 - (1 - Math.floor(i / 2)) * 126,
          220,
          110,
        ),
      );
    for (let i = 0; i < 4; i++) out.push(real(`bench tick ${i}`, f.x0 + (i + 0.5) * UNIT, 355, UNIT, 120));
    for (const [what, x, y] of [
      ['bow', f.view.w - 80, f.view.h - 90],
      ['undo', f.view.w - 80, 82],
    ] as const)
      out.push(real(what, x, y, 120, 120));
    expect(uprightProblems(v, out, 64)).toEqual([]);
  });

  it('keeps every target a thumb wide on a 390-wide phone', () => {
    if (v !== UPRIGHT_VIEWS.phone) return;
    expect(name).toBe('phone');
    expect(Math.min(...all().map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
  });

  it('leaves a sideways view as it was', () => {
    const side = computeView(1024, 768, NO_INSETS);
    expect(frameFor(side)).toEqual({ s: 1, y: 0, view: side, x0: 110, trayLeft: 170 });
  });
});
