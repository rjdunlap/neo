import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace, wrapCount } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { BUBBLE_LINES, bridgeLayout, perLine } from './layout';
import { VOICE } from './voice';

const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true);
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true);
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true);
const views = { ...UPRIGHT_VIEWS, shortPhone: shortPhone.game, sideways: sideways.game, tablet: tablet.game };

const targets = (layout: ReturnType<typeof bridgeLayout>) => [
  ...layout.bubbles.map((b, i) => ({ ...b, what: `bubble ${i}` })),
  ...layout.seats.map((b, i) => ({ ...b, what: `islander ${i}` })),
  { ...layout.help, what: 'Help' },
  { ...layout.cross, what: 'Cross' },
];

describe('Truth Bridge upright', () => {
  it.each(
    Object.entries(views).flatMap(([name, view]) => [2, 3].map((seats) => [name, seats, view] as const)),
  )(
    'lays out %s with %i islanders: targets at least 100 units upright (64 sideways), apart, clear of the shell and the caption bubble',
    (_, seats, view) => {
      const layout = bridgeLayout(view, seats);
      const boxes = targets(layout);
      expect(uprightProblems(view, boxes, view.upright ? 100 : 64)).toEqual([]);
      const caption = captionPlace(view, true);
      if (caption.mode === 'bubble' && caption.band) {
        const { x, y, w } = caption.band;
        expect(boxes.every((b) => b.y + b.h / 2 <= y || b.x - b.w / 2 >= x + w)).toBe(true);
      }
      // The scene and the status line stay out of the Home and help corner.
      expect(layout.scene.x - layout.scene.w / 2).toBeGreaterThanOrEqual(view.upright ? 115 : 0);
    },
  );

  it('records the smallest target in CSS pixels at 390 x 844: the Help button, 52.8', () => {
    const boxes = targets(bridgeLayout(UPRIGHT_VIEWS.phone, 3));
    expect(thumbPx(Math.min(...boxes.map(({ w, h }) => Math.min(w, h))))).toBe(52.8);
  });

  it('fits every sentence in its bubble in at most three lines, upright and sideways', () => {
    const sentences = Object.entries(VOICE)
      .filter(([id]) => id.startsWith('bridge.s.'))
      .map(([, [text]]) => text);
    expect(sentences).toHaveLength(25);
    for (const view of [UPRIGHT_VIEWS.captioned, sideways.game])
      for (const seats of [2, 3]) {
        const layout = bridgeLayout(view, seats);
        for (const text of sentences)
          expect(wrapCount(text, perLine(layout)), text).toBeLessThanOrEqual(BUBBLE_LINES);
        // Three lines of the label and the tail fit the bubble's height.
        expect(BUBBLE_LINES * layout.text * 1.25 + 30).toBeLessThanOrEqual(layout.bubbles[0].h);
      }
  });
});
