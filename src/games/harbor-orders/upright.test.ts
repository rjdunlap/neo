import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, UPRIGHT_VIEWS, uprightProblems } from '../upright-check';
import { layout, type Box } from './layout';

const views = {
  ...UPRIGHT_VIEWS,
  short: computeView(390, 625, NO_INSETS, true),
  sideways: captionPlace(computeView(625, 390), true).game,
  tablet: computeView(1024, 768),
};
const targets = (boxes: Box[]) => boxes.map((box, i) => ({ what: String(i), ...box }));
const cells = (l: ReturnType<typeof layout>) => l.rows.flatMap((r) => [r.sign, ...r.squares]);

describe.each(Object.entries(views))('Harbor Orders on %s', (_, view) => {
  it('fits the order, two workshops, six mornings, Help and Send it', () => {
    const l = layout(view);
    const all = [l.order, l.note, ...cells(l), ...l.controls];
    expect(uprightProblems(view, targets(all), 64)).toEqual([]);
    const caption = captionPlace(view, true);
    if (view.upright && caption.mode === 'bubble') {
      const bottom = Math.max(...all.map((b) => b.y + b.h / 2));
      expect(bottom).toBeLessThanOrEqual(caption.band!.y);
    }
  });
});

it('gives every square and control at least 44 CSS px at 390 × 844', () => {
  const l = layout(UPRIGHT_VIEWS.phone);
  expect(thumbPx(Math.min(...[...cells(l), ...l.controls].map((b) => Math.min(b.w, b.h))))).toBe(44.7);
});
