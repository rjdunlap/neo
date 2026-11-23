import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, railAt, railTarget, railUnder, type Box } from './layout';
import { PLOT_RAILS, RAILS } from './logic';

/**
 * Fence the Field held upright. `layout` takes only the view, so both levels and every field share these boxes: the 24
 * rail targets and Help. The upright screens, the short captioned phone the browser play uses, and two sideways views.
 */
const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true).game;
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true).game;
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true).game;
const views = { ...UPRIGHT_VIEWS, shortPhone, sideways, tablet };

// Neighbouring rail targets meet at the posts; the check allows touching, not overlapping.
const target = (what: string, b: Box): Target => ({ what, x: b.x, y: b.y, w: b.w - 1e-7, h: b.h - 1e-7 });
const targets = (v: (typeof views)[keyof typeof views]) => {
  const l = layout(v);
  return [
    ...Array.from({ length: RAILS }, (_, e) => target(`rail ${e}`, railTarget(l, e))),
    target('Help', l.help),
  ];
};

describe.each(Object.entries(views))('Fence the Field on %s', (name, v) => {
  it('lays out 24 rail targets and Help: at least 64 units, apart, in view, clear of Home and the guide', () => {
    const l = layout(v);
    expect(uprightProblems(v, targets(v), 64), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
    // The score strip is a picture: in view and off the field and the Home corner.
    expect(
      uprightProblems(v, [target('score', l.score), target('field', l.field), target('Help', l.help)], 0),
    ).toEqual([]);
    // A caption bubble never covers a rail of the fence or Help, except on the sideways tablet, which has no room for both.
    const caption = captionPlace(v, true);
    if (caption.mode === 'bubble' && caption.band && name !== 'tablet') {
      const { x, y, w } = caption.band;
      expect(l.y0 + 3 * l.s <= y || l.x0 - l.s * 0.1 >= x + w).toBe(true);
      expect(l.help.y + l.help.h / 2 <= y || l.help.x - l.help.w / 2 >= x + w).toBe(true);
    }
  });

  it('has no dead part of the field: every plot touch finds one of its open rails', () => {
    const l = layout(v);
    for (let p = 0; p < 9; p++) {
      const x = l.x0 + ((p % 3) + 0.5) * l.s,
        y = l.y0 + (Math.floor(p / 3) + 0.5) * l.s;
      const hit = railUnder(l, 0, x + 3, y - 20);
      expect(hit && PLOT_RAILS[p].includes(hit.rail) && !hit.laid).toBe(true);
    }
    for (let e = 0; e < RAILS; e++) {
      const at = railAt(l, e);
      expect(railUnder(l, 0, at.x, at.y)).toEqual({ rail: e, laid: false });
      expect(railUnder(l, 1 << e, at.x, at.y)).toEqual({ rail: e, laid: true });
    }
  });
});

describe('Fence the Field target sizes', () => {
  it('gives every rail 100 units on the upright phones, and never under 64', () => {
    for (const name of ['phone', 'small', 'tall'] as const) expect(layout(UPRIGHT_VIEWS[name]).s).toBe(200);
    // Under a caption bubble the field shrinks to keep its rails clear: 85 and 88.5 units a target.
    expect(layout(UPRIGHT_VIEWS.captioned).s).toBe(170);
    expect(layout(shortPhone).s).toBe(177);
    expect(layout(sideways).s / 2).toBeGreaterThanOrEqual(64);
    expect(layout(tablet).s).toBe(180);
  });

  it('records the smallest target in CSS pixels at 390 x 844: a rail, 50.8', () => {
    const l = layout(UPRIGHT_VIEWS.phone);
    expect(thumbPx(Math.min(l.s / 2, l.help.w, l.help.h))).toBe(50.8);
  });
});
