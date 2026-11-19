import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { CRITTER_HIT, PLANT_HIT, sortLayout } from './layout';
import {
  COUNT_PARTS,
  countSpot,
  hasNeitherMat,
  HOOP_R,
  MAT_RY,
  planFor,
  sortPlaceAt,
  spotFor,
  type Place,
} from './logic';

const views = [
  captionPlace(computeView(1024, 768), false),
  captionPlace(computeView(844, 390), false),
  captionPlace(computeView(768, 1024, undefined, true), false),
  ...[
    computeView(390, 625, undefined, true),
    computeView(375, 667, undefined, true),
    computeView(390, 844, undefined, true),
  ].flatMap((view) => [captionPlace(view, false), captionPlace(view, true)]),
];

describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13])('Critter Sort level %i', (level) => {
  it('keeps every bank state usable and the demonstrated drop in the correct region', () => {
    const { mode, critters, cast, count } = planFor(level);
    const hoops = mode === 'venn' || mode === 'two' ? 2 : 1;
    const hit = cast ? PLANT_HIT : CRITTER_HIT;
    const places: Place[] = ['left'];
    if (hoops === 2) places.push('right');
    if (mode === 'venn') places.push('both');
    if (hasNeitherMat(mode)) places.push('out');

    for (const { game: view, band, mode: caption } of views) {
      for (let n = 0; n <= critters; n++) {
        const layout = sortLayout(view, mode, hoops, n, critters - n);
        for (const place of places) {
          const { x, y } = spotFor(layout.centers, mode, place, 1);
          expect(sortPlaceAt(layout.centers, mode, x, y)).toBe(place);
        }
        if (!view.upright) continue;
        expect(hit.radius * 2).toBeGreaterThanOrEqual(100);
        for (const [i, p] of layout.loose.entries()) {
          const top = p.y + hit.y - hit.radius;
          const bottom = p.y + hit.y + hit.radius;
          expect(p.x - hit.radius).toBeGreaterThan(150);
          expect(p.x + hit.radius).toBeLessThan(view.w);
          expect(bottom).toBeLessThan(view.h);
          expect(top).toBeGreaterThan(
            hasNeitherMat(mode) ? layout.mat.y + MAT_RY : layout.centers[0].y + HOOP_R,
          );
          if (caption === 'bubble' && band) {
            const { y, h } = band;
            expect(bottom <= y || top >= y + h).toBe(true);
          }
          for (const other of layout.loose.slice(i + 1))
            expect(Math.hypot(p.x - other.x, p.y - other.y)).toBeGreaterThanOrEqual(2 * hit.radius);
        }
        for (const sign of layout.signs) {
          const halfWidth = mode === 'butnot' ? 115 : 55;
          expect(sign.x - halfWidth).toBeGreaterThan(110);
          expect(sign.x + halfWidth).toBeLessThan(view.w - 110);
          expect(sign.y - 49).toBeGreaterThan(0);
        }
        for (const c of layout.centers) {
          expect(c.x - HOOP_R).toBeGreaterThan(0);
          expect(c.x + HOOP_R).toBeLessThan(view.w);
        }
        if (mode === 'guess' || count) {
          const choices = count ? layout.compares : layout.guesses;
          // A guessed answer pulses at 1.12 scale. Keep even that wider target beside the guide.
          const halfWidth = count ? 72 : 83;
          for (const [i, p] of choices.entries()) {
            expect(p.x - halfWidth).toBeGreaterThan(150);
            expect(p.x + halfWidth).toBeLessThan(view.w);
            expect(p.y + (count ? 54 : 72)).toBeLessThan(view.h);
            if (i > 0) expect(p.x - choices[i - 1].x).toBeGreaterThan(2 * halfWidth);
          }
        }
        if (count) {
          for (const [i, part] of COUNT_PARTS.entries()) {
            const badge = layout.badges[i];
            expect(badge.x - 30).toBeGreaterThan(0);
            expect(badge.x + 30).toBeLessThan(view.w);
            const targets = Array.from({ length: 3 }, (_, k) => countSpot(layout.centers, part, k, 3));
            for (const [k, p] of targets.entries()) {
              expect(p.x - hit.radius).toBeGreaterThan(0);
              expect(p.x + hit.radius).toBeLessThan(view.w);
              for (const other of targets.slice(k + 1)) {
                expect(Math.hypot(p.x - other.x, p.y - other.y)).toBeGreaterThanOrEqual(2 * hit.radius);
              }
            }
          }
        }
      }
    }
  });
});
