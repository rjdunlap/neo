import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { codeLayout } from './layout';
import { PLANS } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sq = (what: string, x: number, y: number, s = 112): Target => ({ what, x, y, w: s, h: s });

describe.each(Object.entries(views))('Secret Code upright on %s', (_, v) => {
  Object.entries(PLANS).forEach(([lv, plan]) => {
    it(`level ${lv}: slots, tray, key and buttons fit and stand apart`, () => {
      const lay = codeLayout(v, plan.slots, plan.colors);
      expect(lay.upright).toBe(true);
      const t: Target[] = [
        ...lay.slotX.map((x, i) => sq(`slot ${i}`, x, lay.doorY)),
        sq('the key', lay.key.x, lay.key.y),
        ...lay.trayX.map((x, i) => sq(`stone ${i}`, x, lay.trayY)),
      ];
      if (plan.maker) lay.slotX.forEach((x, i) => t.push(sq(`disc ${i}`, x, lay.discsY)));
      expect(uprightProblems(v, t)).toEqual([]);
      // Swap seats' two buttons show while the slots are still empty and unused (the seats question), so they stand apart from the key and tray, not the slots.
      if (plan.swap) {
        const seats = lay.seatsX.map((x, i) => sq(`seat ${i}`, x, lay.seatsY));
        expect(
          uprightProblems(v, [
            ...seats,
            sq('the key', lay.key.x, lay.key.y),
            ...t.filter((x) => x.what.startsWith('stone')),
          ]),
        ).toEqual([]);
      }
      // The slot panel's marks sit between the slots and the discs; discs stay above the tray.
      expect(lay.discsY + 56).toBeLessThan(lay.trayY - 56);
      // At least one past try row always shows above the door, and the door hangs low on a tall phone.
      expect(lay.rows).toBeGreaterThanOrEqual(1);
      expect(lay.doorY).toBeGreaterThan(v.h - 520);
      // Two of us: the made code's panel (400 × 124, scaled) is a picture, not a target, so it only has to stay inside the
      // view and clear of the tries list, the key, the slots and Home.
      if (plan.swap) {
        const w = 400 * lay.mine.scale;
        const h = 124 * lay.mine.scale;
        const panel: Target = { what: 'the code panel', x: lay.mine.x, y: lay.mine.y, w, h };
        expect(uprightProblems(v, [panel, sq('the key', lay.key.x, lay.key.y)], 0)).toEqual([]);
        const listRight = lay.pastX + (plan.slots - 1) * 76 + 60;
        expect(listRight).toBeLessThan(lay.mine.x - w / 2);
        expect(lay.mine.y + h / 2).toBeLessThan(lay.doorY - 100);
      }
    });
  });
});
