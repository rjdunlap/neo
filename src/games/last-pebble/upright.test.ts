import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { SPOT_SIZE, streamLayout } from './logic';

const short = computeView(375, 601, NO_INSETS, true);
const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true).game;
const landscape = computeView(1024, 768);
const phoneLandscape = computeView(844, 390);
const notchLandscape = computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 });
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true).game;

const views = {
  ...UPRIGHT_VIEWS,
  short,
  shortPhone,
  landscape,
  phoneLandscape,
  notchLandscape,
  sideways,
};

describe.each(Object.entries(views))('Last Pebble layout on %s', (name, v) => {
  it.each([6, 7, 8, 9, 10, 11])(
    'places %i stepping spots >= 128 units, apart, in view, clear of Home and guide',
    (target) => {
      const l = streamLayout(v, target);
      const targets = l.spots.map((s) => square(`spot ${s.spot}`, s, l.spotSize));
      expect(uprightProblems(v, targets, 128), `${name} T=${target}`).toEqual([]);
    },
  );
});

describe('Last Pebble target sizes', () => {
  it('keeps every spot at 128 units and records 65.0 CSS px at 390 x 844', () => {
    expect(SPOT_SIZE).toBe(128);
    expect(thumbPx(SPOT_SIZE)).toBe(65);
  });
});
