import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, UPRIGHT_VIEWS, uprightProblems } from '../upright-check';
import { layout, type Box } from './layout';
import { shape } from './logic';

const views = {
  ...UPRIGHT_VIEWS,
  short: computeView(390, 625, NO_INSETS, true),
  sideways: captionPlace(computeView(625, 390), true).game,
  tablet: computeView(1024, 768),
};
const targets = (boxes: Box[]) => boxes.map((box, i) => ({ what: String(i), ...box }));
const cells = (l: ReturnType<typeof layout>) => l.rows.flatMap((r) => [r.sign, ...r.squares]);
const boards = [2, 3, 4].map((level) => ({ level, ...shape(level) }));

describe.each(Object.entries(views))('Harbor Orders on %s', (_, view) => {
  it.each(boards)(
    'fits the order, level $level workshops, six mornings, Help and Send it',
    ({ workshops, goods }) => {
      const l = layout(view, workshops, goods);
      expect(l.rows).toHaveLength(workshops);
      const all = [l.order, l.note, ...cells(l), ...l.controls];
      expect(uprightProblems(view, targets(all), 64)).toEqual([]);
      const caption = captionPlace(view, true);
      if (view.upright && caption.mode === 'bubble') {
        const bottom = Math.max(...all.map((b) => b.y + b.h / 2));
        expect(bottom).toBeLessThanOrEqual(caption.band!.y);
      }
      // The jetty sits apart from the board and its buttons.
      expect(uprightProblems(view, targets([l.jetty, ...l.controls]), 64)).toEqual([]);
    },
  );
});

it('gives every square and control at least 44 CSS px at 390 × 844, with three workshops too', () => {
  for (const workshops of [2, 3]) {
    const l = layout(UPRIGHT_VIEWS.phone, workshops, workshops);
    expect(thumbPx(Math.min(...[...cells(l), ...l.controls].map((b) => Math.min(b.w, b.h))))).toBe(44.7);
  }
});
