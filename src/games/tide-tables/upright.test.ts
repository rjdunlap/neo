import { expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { tableLayout } from './layout';

const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true);
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true);
const views = { ...UPRIGHT_VIEWS, shortPhone: shortPhone.game, sideways: sideways.game };

it.each(Object.entries(views))(
  'keeps all ten touch targets clear of each other and the shell at %s',
  (_, view) => {
    const layout = tableLayout(view);
    const targets = [...layout.rows, ...layout.jobs, ...layout.actions].map((b, i) => ({
      ...b,
      what: `target ${i}`,
    }));
    expect(uprightProblems(view, targets, 64)).toEqual([]);
    expect(thumbPx(Math.min(...targets.map(({ w, h }) => Math.min(w, h))))).toBe(48.8);
    const caption = captionPlace(view, true);
    if (caption.mode === 'bubble' && caption.band) {
      const { x, y, w } = caption.band;
      expect(targets.every((box) => box.y + box.h / 2 <= y || box.x - box.w / 2 >= x + w)).toBe(true);
    }
  },
);
