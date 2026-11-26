import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout } from './layout';

/**
 * Count the Ballots held upright and sideways. `layout` takes only the view, so both levels share these boxes: nine
 * ballot cards, three piles and Help. The 100-unit school minimum is asked of every view, not only the grown-up 64.
 */
const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true).game;
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true).game;
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true).game;
const views = { ...UPRIGHT_VIEWS, shortPhone, sideways, tablet };

const targets = (v: (typeof views)[keyof typeof views]): Target[] => {
  const l = layout(v);
  return [
    ...l.slots.map((s, i) => ({ what: `card ${i}`, x: s.x, y: s.y, w: l.card.w, h: l.card.h })),
    ...l.piles.map((p, i) => ({ what: `pile ${i}`, x: p.x, y: p.y, w: l.tray.w, h: l.tray.h })),
    { what: 'Help', x: l.help.x, y: l.help.y, w: l.help.w, h: l.help.h },
  ];
};

describe.each(Object.entries(views))('Count the Ballots on %s', (_name, v) => {
  it('lays out nine cards, three piles and Help: at least 100 units, apart, in view, clear of Home and the guide', () => {
    expect(uprightProblems(v, targets(v), 100), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
  });
});

describe('Count the Ballots target sizes', () => {
  it('records the smallest target in CSS pixels at 390 x 844', () => {
    const l = layout(UPRIGHT_VIEWS.phone);
    const smallest = Math.min(l.card.w, l.card.h, l.tray.w, l.tray.h, l.help.w, l.help.h);
    expect(smallest).toBe(100);
    expect(thumbPx(smallest)).toBe(50.8);
  });
});
