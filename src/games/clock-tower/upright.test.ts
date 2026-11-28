import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BELL_HIT, CARD, R, REQUEST_BOX, START_CARD, STRIP, VISIT_SIGN, towerLayout } from './layout';
import { PLANS } from './logic';

/**
 * Clock Tower held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The
 * targets are the face's touch circle, the request sign and bell (the setting levels), and each pretend-plan card's two taps
 * (the reading level); the "one hour later" comparison and the hand key take no touch but must stay on screen and clear.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};

describe.each(Object.entries(views))('Clock Tower upright on %s', (_, v) => {
  it.each(PLANS.map((p, i) => [i + 1, p] as const))(
    'level %i: targets are whole, apart and clear',
    (_l, plan) => {
      const l = towerLayout(v, plan.mode);
      const hit = (R + 30) * l.face.s * 2;
      const t: Target[] = [square('face', l.face, hit)];
      const boxes: Target[] = [];
      if (plan.mode === 'read') {
        expect(l.cards).toHaveLength(3);
        l.cards.forEach((c, i) => {
          t.push({ what: `card ${i + 1} picture`, x: c.x + CARD.pick.x, y: c.y, w: CARD.pick.w, h: CARD.h });
          t.push({ what: `card ${i + 1} time`, x: c.x + CARD.hear.x, y: c.y, w: CARD.hear.w, h: CARD.h });
        });
        boxes.push({ what: 'heading', x: l.heading.x, y: l.heading.y, w: 320, h: 40 });
      } else if (plan.mode === 'visit') {
        t.push({ what: 'free-time sign', x: l.sign.x, y: l.sign.y, ...VISIT_SIGN });
        expect(l.cards).toHaveLength(3);
        l.cards.forEach((c, i) => t.push({ what: `start ${i + 1}`, x: c.x, y: c.y, ...START_CARD }));
        t.push(square('bell', l.bell, BELL_HIT));
        boxes.push({ what: 'strip', x: l.strip.x, y: l.strip.y, ...STRIP });
        boxes.push({ what: 'hand key', x: l.handKey.x + 12, y: l.handKey.y + 20, w: 210, h: 100 });
        // The tower roof stays under the cards.
        expect(l.cards[0].y + START_CARD.h / 2).toBeLessThan(l.face.y - (R + 150) * l.face.s);
      } else {
        t.push({ what: 'request', x: l.request.x, y: l.request.y, w: REQUEST_BOX.w, h: REQUEST_BOX.h });
        t.push(square('bell', l.bell, BELL_HIT));
        boxes.push({ what: 'hand key', x: l.handKey.x + 12, y: l.handKey.y + 20, w: 210, h: 100 });
        if (plan.mode === 'later')
          boxes.push({ what: 'comparison', x: l.comparison.x, y: l.comparison.y, w: 250, h: 160 });
      }
      expect(uprightProblems(v, [...t, ...boxes], 0)).toEqual([]);
      expect(uprightProblems(v, t)).toEqual([]);
    },
  );

  it('keeps the tower roof clear of the sign above it and the face above the bottom', () => {
    const read = towerLayout(v, 'read');
    expect(read.heading.y).toBeGreaterThanOrEqual(100);
    expect(read.face.y + 218 * read.face.s).toBeLessThan(read.cards[0].y - CARD.h / 2);
    const set = towerLayout(v, 'hour');
    expect(set.request.y + REQUEST_BOX.h / 2).toBeLessThanOrEqual(set.face.y - R - 150);
    expect(set.face.y + R + 30).toBeLessThan(set.bell.y - BELL_HIT / 2);
  });
});
