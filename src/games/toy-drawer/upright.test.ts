import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BUTTON_R, CELL, CLOSE_R, drawerLayout, MIN_HIT, packTray, trayToys } from './layout';
import { PLANS, puzzleOf } from './logic';

/**
 * Toy Drawer held upright (chunk 31, docs/definitions/phone-portrait.md) and on the usual sideways view: the drawer, the
 * tray and the controls fit, apart and clear of Home, "?" and the guide, at every level and with every toy turned or not.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};
const sideways = { design: computeView(1024, 768), wide: computeView(1366, 768) };

const cases = PLANS.flatMap((p, i) => p.cases.map((c) => ({ level: i + 1, c, canTurn: p.canTurn })));

describe.each(Object.entries(views))('Toy Drawer upright on %s', (_, v) => {
  it.each(cases.map((x) => [x.level, x.c.toys.join('+'), x] as const))(
    'level %i %s: tray, controls and drawer are whole, apart and clear',
    (_l, _n, { c, canTurn }) => {
      const p = puzzleOf(c, canTurn);
      const l = drawerLayout(v, p.rows, p.cols);
      const t: Target[] = [];
      for (let mask = 0; mask < 1 << p.toys.length; mask++) {
        const slots = packTray(trayToys(p, mask), l.tray, l.trayCell);
        expect(slots, `${c.toys} mask ${mask}`).not.toBeNull();
        if (mask === 0)
          slots!.forEach((s, i) =>
            t.push({ what: `toy ${i + 1}`, x: s.x + s.w / 2, y: s.y + s.h / 2, w: s.w, h: s.h }),
          );
        for (const s of slots!) {
          expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(MIN_HIT);
          expect(s.x).toBeGreaterThanOrEqual(l.tray.x);
          expect(s.x + s.w).toBeLessThanOrEqual(l.tray.x + l.tray.w + 1e-6);
        }
      }
      for (const [name, pt, r] of [
        ['undo', l.undo, BUTTON_R],
        ['start over', l.again, BUTTON_R],
        ['hint', l.hint, BUTTON_R],
        ...(canTurn ? ([['turn', l.turn, BUTTON_R]] as const) : []),
        ['close', l.close, CLOSE_R],
      ] as const)
        t.push(square(name, pt, r * 2));
      // The drawer's cells are never shrunk and the drawer sits clear of Home and the buttons.
      expect(l.drawer.w).toBe(p.cols * CELL);
      expect(l.drawer.x).toBeGreaterThanOrEqual(115);
      expect(l.drawer.x + l.drawer.w).toBeLessThanOrEqual(v.w);
      expect(l.drawer.y + l.drawer.h).toBeLessThan(l.tray.y);
      expect(l.tray.y + l.tray.h).toBeLessThanOrEqual(l.undo.y - BUTTON_R + 1e-6);
      expect(uprightProblems(v, t)).toEqual([]);
    },
  );
});

describe.each(Object.entries(sideways))('Toy Drawer sideways on %s', (_, v) => {
  it.each(cases.map((x) => [x.level, x.c.toys.join('+'), x] as const))(
    'level %i %s fits',
    (_l, _n, { c, canTurn }) => {
      const p = puzzleOf(c, canTurn);
      const l = drawerLayout(v, p.rows, p.cols);
      for (let mask = 0; mask < 1 << p.toys.length; mask++)
        expect(packTray(trayToys(p, mask), l.tray, l.trayCell), `${c.toys} mask ${mask}`).not.toBeNull();
      expect(l.drawer.x + l.drawer.w).toBeLessThan(l.tray.x);
      expect(l.drawer.y + l.drawer.h).toBeLessThan(l.undo.y - BUTTON_R);
      expect(l.tray.y + l.tray.h).toBeLessThanOrEqual(l.close.y - CLOSE_R + 1e-6);
      expect(l.tray.x + l.tray.w).toBeLessThanOrEqual(v.w);
      expect(l.drawer.x).toBeGreaterThanOrEqual(115);
    },
  );
});
