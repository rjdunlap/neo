import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { Rng } from '../../engine/random';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BUTTON_R, PIECE_HIT, townLayout } from './layout';
import { buildFor, PLANS, VERTICES } from './logic';

/**
 * Tangram Town held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The
 * targets are the tray pieces' touch circles and the turn, help and check buttons; every picture's shapes (as drawn, turned)
 * must stay clear of the buttons and above the tray.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};

/** The drawn bounds of a slot's shape, in board units. */
function bounds(t: { shape: keyof typeof VERTICES; x: number; y: number; turns: number }) {
  const v = VERTICES[t.shape];
  const a = (t.turns * Math.PI) / 2;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (let i = 0; i < v.length; i += 2) {
    const x = t.x + v[i] * Math.cos(a) - v[i + 1] * Math.sin(a);
    const y = t.y + v[i] * Math.sin(a) + v[i + 1] * Math.cos(a);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

describe.each(Object.entries(views))('Tangram Town upright on %s', (_, v) => {
  it.each(PLANS.map((p, i) => [i + 1, p] as const))(
    'level %i: targets are whole, apart and clear',
    (level) => {
      const b = buildFor(level, new Rng(level));
      const l = townLayout(v, b.targets.length);
      expect(l.tray).toHaveLength(b.targets.length);
      const t: Target[] = l.tray.map((p, i) => square(`piece ${i + 1}`, p, PIECE_HIT * 2));
      const buttons = [
        l.help,
        ...(b.rotate ? [l.turn] : []),
        ...(b.repair ? [l.check] : []),
        ...(b.flip ? [l.flip] : []),
      ];
      buttons.forEach((p, i) => t.push(square(`button ${i + 1}`, p, BUTTON_R * 2)));
      expect(uprightProblems(v, t)).toEqual([]);
    },
  );

  it('keeps every picture clear of the buttons and above the tray', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 12; seed++) {
        const b = buildFor(level, new Rng(seed));
        const l = townLayout(v, b.targets.length);
        for (const s of b.targets) {
          const r = bounds(s);
          expect(l.board.x + r.x1, `level ${level} ${b.picture} right`).toBeLessThan(l.turn.x - BUTTON_R);
          expect(l.board.x + r.x0).toBeGreaterThan(115);
          expect(l.board.y + r.y0).toBeGreaterThan(40);
          const trayTop = Math.min(...l.tray.map((p) => p.y)) - PIECE_HIT;
          if (!b.repair)
            expect(l.board.y + r.y1, `level ${level} ${b.picture} above tray`).toBeLessThan(trayTop);
        }
      }
    }
  });
});
