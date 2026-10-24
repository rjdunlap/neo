import { describe, expect, it } from 'vitest';
import { chooseTransition, frameAt, TRANSITION_SECONDS, usableBox } from './transition';

const v = { w: 1024, h: 768, scale: 1 };
const card = { x: 100, y: 200, w: 150, h: 150 };

describe('scene transitions (RW14 slice 9)', () => {
  it('stays under 0.4 s for every kind, about 0.35 s for a grow or shrink', () => {
    for (const s of Object.values(TRANSITION_SECONDS)) expect(s).toBeLessThan(0.4);
    expect(TRANSITION_SECONDS.grow).toBeCloseTo(0.35);
    expect(TRANSITION_SECONDS.shrink).toBeCloseTo(0.35);
  });

  it('grows from a tapped box, shrinks into a return box, and crossfades otherwise', () => {
    expect(chooseTransition(card, null, v)).toEqual({ kind: 'grow', from: card });
    expect(chooseTransition(null, card, v)).toEqual({ kind: 'shrink', into: card });
    expect(chooseTransition(card, { ...card, x: 500 }, v).kind).toBe('grow');
    expect(chooseTransition(null, null, v)).toEqual({ kind: 'fade' });
  });

  it('ignores a box that is empty, off the screen or not a number', () => {
    expect(usableBox({ x: 0, y: 0, w: 0, h: 0 }, v)).toBe(false);
    expect(usableBox({ x: 2000, y: 100, w: 150, h: 150 }, v)).toBe(false);
    expect(usableBox({ x: NaN, y: 0, w: 150, h: 150 }, v)).toBe(false);
    expect(chooseTransition({ x: -500, y: 0, w: 100, h: 100 }, null, v)).toEqual({ kind: 'fade' });
  });

  it('starts covering the box and ends at the whole view', () => {
    const f0 = frameAt(card, v, 0);
    // Centred on the card, at least as large as it on both sides, in the screen's proportions.
    expect(f0.x + (v.w * f0.scale) / 2).toBeCloseTo(card.x + card.w / 2);
    expect(f0.y + (v.h * f0.scale) / 2).toBeCloseTo(card.y + card.h / 2);
    expect(v.w * f0.scale).toBeGreaterThanOrEqual(card.w - 1e-9);
    expect(v.h * f0.scale).toBeGreaterThanOrEqual(card.h - 1e-9);
    expect(frameAt(card, v, 1)).toEqual({ x: 0, y: 0, scale: 1 });
    expect(frameAt(card, v, 7)).toEqual(frameAt(card, v, 1));
  });

  it('grows steadily: the layer only gets larger as it goes', () => {
    let last = 0;
    for (let t = 0; t <= 1; t += 0.1) {
      const { scale } = frameAt(card, v, t);
      expect(scale).toBeGreaterThanOrEqual(last);
      last = scale;
    }
  });
});
