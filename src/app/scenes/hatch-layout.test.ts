import { describe, expect, it } from 'vitest';
import { hatchLayout } from './HatchScene';

/** Half-sizes drawn by the hatch: a colour ball's ring, a name pill and the go button. */
const BALL = 59;
const NAME = 119;
const GO = 58;

describe('the hatch on a phone held upright (768 units wide)', () => {
  for (const w of [768, 1024, 1660]) {
    it(`keeps the choices and the go button inside the plate and apart at ${w}`, () => {
      for (const naming of [false, true]) {
        const l = hatchLayout(w, naming);
        const half = naming ? l.namePitch + NAME : 1.5 * 138 + BALL;
        const bottom = naming ? 220 + 59 : 155 + 125 + BALL;
        expect(l.cx - half).toBeGreaterThanOrEqual(30);
        expect(l.cx + half).toBeLessThanOrEqual(w - 30);
        expect(l.next.x + GO).toBeLessThanOrEqual(w - 30);
        // The button is either beside the choices or under them.
        const beside = l.next.x - GO >= l.cx + half;
        const under = l.next.y - GO >= bottom;
        expect(beside || under).toBe(true);
        expect(l.next.y + GO).toBeLessThanOrEqual(24 + l.plateH);
        // The grown-up's name field (the naming step only) starts under the go button on a narrow view.
        if (!beside && naming) expect(l.formTop).toBeGreaterThanOrEqual(l.next.y + GO);
      }
    });
  }
});
