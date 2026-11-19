import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CARD_H, CARD_W, CHECK_H, CHECK_W, PLAY_R, SLOT_H, SLOT_W, trackLayout } from './logic';

/**
 * Trackway Tales held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views.
 * Targets are the replay (scrub) strip, the mud strip, the cards with their Play buttons, the study board and Check;
 * the sky and sand are scenery.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Trackway Tales upright on %s', (_, v) => {
  it.each([1, 2, 3])('level %s', (level) => {
    const L = trackLayout(v, level);
    const t: Target[] = [
      {
        what: 'practice strip',
        x: L.practice.x + L.practice.w / 2,
        y: L.practice.y + L.practice.h / 2,
        w: L.practice.w,
        h: L.practice.h,
      },
      { what: 'mud strip', x: L.mud.x + L.mud.w / 2, y: L.mud.y + L.mud.h / 2, w: L.mud.w, h: L.mud.h },
      { what: 'study board', ...L.slot, w: SLOT_W, h: SLOT_H },
      { what: 'check', ...L.check, w: CHECK_W, h: CHECK_H },
    ];
    L.cards.forEach((p, i) => t.push({ what: `card ${i}`, ...p, w: CARD_W, h: CARD_H }));
    // A Play button sits on its card; it must stay inside the card and 100 units across.
    L.plays.forEach((p, i) => {
      expect(Math.abs(p.x - L.cards[i].x) + PLAY_R).toBeLessThanOrEqual(CARD_W / 2 + 1e-6);
      expect(p.y + PLAY_R).toBeLessThanOrEqual(L.cards[i].y + CARD_H / 2);
      expect(2 * PLAY_R).toBeGreaterThanOrEqual(100);
    });
    expect(uprightProblems(v, t), `level ${level}`).toEqual([]);
    // Every print keeps its 70 units on a column.
    expect(L.colW).toBeGreaterThanOrEqual(70);
    // Controls stand up from the bottom edge; the mud sits clear above the cards.
    expect(v.h - (L.check.y + CHECK_H / 2)).toBeLessThanOrEqual(60);
    expect(L.mud.y + L.mud.h).toBeLessThan(Math.min(...L.cards.map((p) => p.y - CARD_H / 2)));
  });
});
