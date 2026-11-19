import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, PUPPET_H, PUPPET_W, standAt } from './logic';

/**
 * Puppet Stage held upright (chunk 31, docs/definitions/phone-portrait.md): all six levels on the three upright phone views,
 * the captioned one and a short one. What a level shows to touch: the floor (a touch raises a puppet there), the tassel,
 * the parked puppets, level 3's three bubbles, the story levels' two peeks and marquee cards, and Bow (with The end).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [1, 2, 3, 4, 5, 6];

const box = (what: string, b: { x: number; y: number; w: number; h: number }): Target => ({ what, ...b });

function targets(v: View, level: number): Target[] {
  const l = layout(level, v);
  const out: Target[] = [box('tassel', l.tassel), box('Bow', l.bow)];
  l.curtains.forEach((b, i) => out.push(box(`curtain ${i + 1}`, b)));
  l.bubbles.forEach((b, i) => out.push(box(`bubble ${i + 1}`, b)));
  l.peeks.forEach((b, i) => out.push(box(`peek ${i + 1}`, b)));
  l.cards.forEach((b, i) => out.push(box(`card ${i + 1}`, b)));
  if (l.end) out.push(box('The end', l.end));
  return out;
}

describe.each(Object.entries(views))('Puppet Stage upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(v, level)), `level ${level}`).toEqual([]);
    },
  );

  it.each(levels)(
    'level %i: a risen puppet is still a whole touch target and two stand apart on the floor',
    (level) => {
      const l = layout(level, v);
      expect(PUPPET_W * l.k).toBeGreaterThanOrEqual(100);
      expect(l.stand.apart).toBeGreaterThanOrEqual(PUPPET_W * l.k);
      if (level >= 4) {
        expect(l.stand.min - (PUPPET_W * l.k) / 2).toBeGreaterThanOrEqual(l.stage.left + l.curtains[0].w);
        expect(l.stand.max + (PUPPET_W * l.k) / 2).toBeLessThanOrEqual(l.stage.right - l.curtains[1].w);
      }
      const two = [standAt(l.stand.min, [], l.stand), standAt(l.stand.min, [l.stand.min], l.stand)];
      expect(Math.abs(two[0] - two[1])).toBeGreaterThanOrEqual(l.stand.apart - 1e-6);
      expect(l.stage.floor).toBeLessThan(v.h - PUPPET_H / 2);
      expect(l.floorTouch.y + l.floorTouch.h / 2).toBeLessThanOrEqual(v.h);
    },
  );

  it.each([4, 5, 6])(
    'level %i: the four marks stand a whole puppet apart so no two puppets overlap',
    (level) => {
      const l = layout(level, v);
      const xs = l.marks.flat().sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++)
        expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(PUPPET_W * l.k - 1e-6);
      expect(l.snap).toBeGreaterThanOrEqual(50);
    },
  );
});

it('the sideways layout is unchanged', () => {
  const v = computeView(1024, 768, NO_INSETS);
  const l = layout(1, v);
  expect(l.portrait).toBe(false);
  expect([l.stage.left, l.stage.floor, l.stage.bottom, l.k, l.stand.apart]).toEqual([180, 461, 511, 1, 160]);
});
