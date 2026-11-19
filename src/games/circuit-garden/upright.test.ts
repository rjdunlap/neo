import { describe, expect, it } from 'vitest';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { HALF, layoutFor } from './layout';
import { PLANS } from './logic';

/**
 * Circuit Garden held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views, with
 * the board mirrored and not. The targets are the bridges (and the switch), the loose connectors in the tray, and the
 * Undo, Put back, Help, Check and Done buttons; the battery and lamp stay inside the view and the board above the tray.
 */
describe.each(Object.entries(UPRIGHT_VIEWS))('Circuit Garden upright on %s', (_, v) => {
  it.each(PLANS.map((p) => [p.level, p] as const))(
    'level %s: targets are whole, apart and clear',
    (_l, plan) => {
      for (const mirror of [false, true]) {
        const L = layoutFor(v, mirror, plan.slots.length, plan.check);
        expect(L.landscape).toBe(false);
        const t: Target[] = [];
        // Bridges lie along the board (rotated a quarter turn): 110 wide, 140 tall. The switch sits on the supply bridge.
        const bridge = L.map(0.5, -1);
        for (const slot of plan.slots)
          t.push({ what: `${slot} bridge`, ...L.map(0.5, slot === 'supply' ? -1 : 1), w: 110, h: 140 });
        if (plan.switch) t.push({ what: 'switch', ...bridge, w: 120, h: 150 });
        if (plan.slots.length) {
          L.tray.forEach((p, i) => t.push({ what: `connector ${i}`, ...p, w: 124, h: 100 }));
          t.push(square('undo', L.undo, 100), square('put back', L.back, 100));
        }
        t.push(square('help', L.help, 100), square('done', L.done, 100));
        if (plan.check) t.push(square('check', L.check, 100));
        expect(uprightProblems(v, t), `level ${plan.level} mirror ${mirror}`).toEqual([]);

        // The battery and lamp: whole inside the view, clear of Home and help, and above the tray.
        for (const u of [0, 1]) {
          const p = L.map(u, 0);
          expect(p.x - 110).toBeGreaterThan(115);
          expect(p.x + 110).toBeLessThan(v.w);
          expect(p.y - 100).toBeGreaterThan(0);
        }
        const lamp = Math.max(L.map(0, 0).y, L.map(1, 0).y);
        const trayTop = plan.slots.length ? L.tray[0].y - 55 : L.help.y - 50;
        expect(lamp + 100, 'the lamp ends above the tray').toBeLessThanOrEqual(trayTop + 25);
        // The bridge drop zone stays inside the board.
        expect(L.du * 2).toBeLessThan(1);
        expect(HALF).toBe(55);
      }
    },
  );
});
