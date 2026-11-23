import { describe, expect, it } from 'vitest';
import type { View } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BUBBLE_H,
  BUBBLE_MARGIN,
  BUBBLE_W,
  CARD_H,
  CARD_W,
  REPLAY_R,
  SLOTS,
  STAGE_H,
  STAGE_W,
  rectToScreen,
  thoughtLayout,
  type Box,
  type ThoughtLayout,
} from './logic';

/**
 * Thought Bubbles held upright (chunk 31, docs/definitions/phone-portrait.md; batch `thought-bubbles upright` in
 * docs/definitions/thought-bubbles-4.md): levels 1–3 share one layout, so each view is checked with every target a level
 * shows. The three place, thing or reason cards and the bubble's drop area at every level, Replay after the story's
 * first play, and at level 3 the five picture regions on the stage she taps for the clue.
 */
const box = (what: string, b: Box): Target => ({
  what,
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
  w: b.w - 1e-7,
  h: b.h - 1e-7,
});

function targets(l: ThoughtLayout, level: number): Target[] {
  return [
    ...l.cards.map((c, i) => ({ what: `card ${i + 1}`, x: c.x, y: c.y, w: CARD_W, h: CARD_H })),
    {
      what: 'the bubble',
      x: l.bubble.x,
      y: l.bubble.y,
      w: BUBBLE_W + 2 * BUBBLE_MARGIN,
      h: BUBBLE_H + 2 * BUBBLE_MARGIN,
    },
    square('Replay', l.replay, 2 * REPLAY_R),
  ].concat(
    level === 3
      ? Object.entries(SLOTS).map(([slot, r]) => box(`the ${slot} region`, rectToScreen(l, r)))
      : [],
  );
}

describe.each(Object.entries(UPRIGHT_VIEWS))('Thought Bubbles upright on %s', (_, v: View) => {
  const l = thoughtLayout(v);

  it.each([1, 2, 3])(
    'level %i: every target fits, at least 100 units, apart and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(l, level)), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
    },
  );

  it('the stage sits inside the view, above the cards, and the cards are at least 44 px on the phone', () => {
    const s = l.stage;
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.x + STAGE_W * s.scale).toBeLessThanOrEqual(v.w);
    expect(s.y + STAGE_H * s.scale).toBeLessThanOrEqual(l.cards[0].y - CARD_H / 2);
    expect(l.bubble.y + BUBBLE_H / 2).toBeLessThanOrEqual(s.y);
    if (v === UPRIGHT_VIEWS.phone) expect(CARD_W * v.scale).toBeGreaterThanOrEqual(44);
  });
});
