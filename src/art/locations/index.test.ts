import { describe, expect, it } from 'vitest';
import { layoutSpots } from '../../content/lands';
import { landLayouts, VIEWS } from '../../app/scenes/resident-check';
import { FILES, horizonOf, locationFiles, PICTURE, pictureFit } from './index';

describe('location pictures', () => {
  it('names a real land with every file, and gives every picture its Places card', () => {
    // FILES is every .webp in this folder (`import.meta.glob`).
    expect(FILES.stray).toEqual([]);
    expect([...FILES.cards.keys()].sort()).toEqual([...FILES.pictures.keys()].sort());
    expect(FILES.pictures.has('rainbow-meadow')).toBe(true);
    expect(locationFiles(['./meadow.webp', './rainbow-meadow-card.webp']).stray).toEqual(['./meadow.webp']);
  });

  it('covers the view with the painted horizon on the ground line, in every view', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      for (const horizon of [0.36, 0.4, 0.62]) {
        const ground = view.h * horizon;
        const h = horizonOf('rainbow-meadow');
        const fit = pictureFit(view, ground, h);
        expect(fit.y + h * fit.scale, name).toBeCloseTo(ground);
        expect(fit.y, name).toBeLessThanOrEqual(1e-6);
        expect(fit.y + PICTURE.h * fit.scale, name).toBeGreaterThanOrEqual(view.h - 1e-6);
        expect(fit.x - (PICTURE.w / 2) * fit.scale, name).toBeLessThanOrEqual(1e-6);
        expect(fit.x + (PICTURE.w / 2) * fit.scale, name).toBeGreaterThanOrEqual(view.w - 1e-6);
      }
    }
  });

  // The spots' feet stand on the calm ground. Their drawings still rise in front of the painted trees, rabbit and rocks on
  // every real meadow page (measured 2026-10-24; a question for the developer in WAITING-ON-DEVELOPER), so that is not asserted.
  it('stands every Rainbow Meadow spot on the calm painted ground below the horizon, in every layout and view', () => {
    for (const { ground, layout, where } of landLayouts('rainbow-meadow')) {
      for (const spot of layoutSpots(layout)) expect(spot.y, where).toBeGreaterThan(ground);
    }
  });
});
