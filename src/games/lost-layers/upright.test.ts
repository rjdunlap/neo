import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BTN_H,
  BTN_W,
  CARD_H,
  CARD_W,
  COL_W,
  layersLayout,
  LENS_R,
  LOOK_H,
  LOOK_W,
  ROW_H,
  ROWS,
  SLOT_H,
  SLOT_W,
} from './logic';

/**
 * Lost Layers held upright (chunk 31, docs/definitions/phone-portrait.md): both levels, on the three upright phone views,
 * the captioned one and a short one. What a level shows to touch: the two columns of layers (the cove column holds the
 * pieces a finger carries), It fits and Can't tell, the two story cards, and on level 2 the three look cards and the slot.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [1, 2];

const box = (what: string, p: { x: number; y: number }, w: number, h: number): Target => ({
  what,
  ...p,
  w,
  h,
});

function targets(v: View, level: number): Target[] {
  const L = layersLayout(v, level);
  const top = L.bottom - ROWS * ROW_H;
  const out: Target[] = [
    box('gull column', { x: L.gullX + COL_W / 2, y: top + (ROWS * ROW_H) / 2 }, COL_W, ROWS * ROW_H),
    box('cove column', { x: L.coveX + COL_W / 2, y: top + (ROWS * ROW_H) / 2 }, COL_W, ROWS * ROW_H),
    box(level >= 2 ? 'Look' : 'It fits', L.action, BTN_W, BTN_H),
    box("can't tell", L.cantTell, BTN_W, BTN_H),
    ...L.cards.map((c, i) => box(`story card ${i + 1}`, c, CARD_W, CARD_H)),
  ];
  if (level >= 2) {
    out.push(box('slot', L.slot, SLOT_W, SLOT_H));
    L.looks.forEach((p, i) => out.push(box(`look ${i + 1}`, p, LOOK_W, LOOK_H)));
  }
  return out;
}

describe.each(Object.entries(views))('Lost Layers upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(v, level)), `level ${level}`).toEqual([]);
    },
  );

  it.each(levels)('level %i: the lens opens inside the view', (level) => {
    const L = layersLayout(v, level);
    expect(L.lens.x - LENS_R).toBeGreaterThanOrEqual(0);
    expect(L.lens.x + LENS_R).toBeLessThanOrEqual(v.w);
    expect(L.lens.y - LENS_R).toBeGreaterThanOrEqual(0);
    expect(L.lens.y + LENS_R).toBeLessThanOrEqual(v.h);
  });

  it.each(levels)('level %i: the buttons stand up from the bottom edge', (level) => {
    const L = layersLayout(v, level);
    const low = Math.max(...targets(v, level).map((t) => t.y + t.h / 2));
    expect(v.h - low).toBeLessThanOrEqual(80);
    expect(L.action.y).toBeGreaterThan(L.bottom);
  });
});

it('the sideways layout is unchanged', () => {
  const v = computeView(1024, 768, NO_INSETS);
  const L = layersLayout(v, 1);
  expect(L.portrait).toBe(false);
  expect([L.gullX, L.coveX, L.bottom]).toEqual([300, 560, 680]);
});
