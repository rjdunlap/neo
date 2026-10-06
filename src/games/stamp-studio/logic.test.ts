import { describe, expect, it } from 'vitest';
import { pixel, place, PLANS } from './logic';
describe('Stamp Studio', () => {
  it('keeps stamps on paper through resize, including edge drops', () => {
    for (const [w,h] of [[674,478],[674,1075],[1200,478]]) for (const x of [-300,0,300,2000]) for(const y of [-500,0,250,2000]) {
      const s = place(x,y,w,h), p = pixel(s,w,h);
      expect(p.x).toBeGreaterThanOrEqual(70); expect(p.x).toBeLessThanOrEqual(w-70);
      expect(p.y).toBeGreaterThanOrEqual(70); expect(p.y).toBeLessThanOrEqual(h-70);
      const changed=pixel(s,w+200,h+300); expect(place(changed.x,changed.y,w+200,h+300)).toEqual(s);
    }
  });
  it('offers simple lap choices and adds manipulation before story invitations', () => {
    expect(PLANS[0].kinds).toHaveLength(1); expect(PLANS[1].kinds).toHaveLength(2);
    expect(PLANS.slice(0,2).every(p=>!p.move && !p.transform)).toBe(true);
    expect(PLANS.slice(3).every(p=>p.move && p.transform)).toBe(true);
  });
});
