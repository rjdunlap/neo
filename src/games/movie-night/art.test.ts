import { it, expect } from 'vitest';
import { footage } from './art';
import { cutFootage } from './cut-art';
import { GARDEN, PARCEL } from './cut';
import { POND, DOOR } from './logic';
it('keeps every level 4–5 shot inside the film frame at every moment', () => {
  for (const shot of [...GARDEN, ...PARCEL])
    for (const time of [0, 0.5, 0.8, 1.2, 1.99]) {
      const b = cutFootage(shot, time).getLocalBounds();
      expect(b.x, `${shot.id}@${time} left`).toBeGreaterThanOrEqual(-161);
      expect(b.y, `${shot.id}@${time} top`).toBeGreaterThanOrEqual(-91);
      expect(b.x + b.width, `${shot.id}@${time} right`).toBeLessThanOrEqual(161);
      expect(b.y + b.height, `${shot.id}@${time} bottom`).toBeLessThanOrEqual(91);
    }
});
it('keeps every authored action inside the film frame, including Bunny’s ears', () => {
  for (const shot of [...POND, ...DOOR])
    for (const time of [0, 0.79, 0.8, 1, 1.99]) {
      const picture = footage(shot, time),
        b = picture.getLocalBounds();
      expect(b.x, `${shot.id}@${time} left`).toBeGreaterThanOrEqual(-161);
      expect(b.y, `${shot.id}@${time} top`).toBeGreaterThanOrEqual(-91);
      expect(b.x + b.width, `${shot.id}@${time} right`).toBeLessThanOrEqual(161);
      expect(b.y + b.height, `${shot.id}@${time} bottom`).toBeLessThanOrEqual(91);
      picture.destroy({ children: true });
    }
});
