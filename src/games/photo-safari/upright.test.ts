import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { groundLine, MAX_TELL_CHIPS, mysteryLayout, tellLayout, tellRowsReserved } from './layout';
import { chipsFor, LEVELS, makeScene, mysteryChips, planFor, sightingPositions } from './logic';

/**
 * Photo Safari held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on several seeds, on the upright
 * phone views. Targets are each friend's body (about 120 × 130, standing at its feet; the tap circle is a larger forgiving
 * one that the nearest friend wins), the camera and thumbs buttons, the picture-word cards and the Tell button.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

describe.each(Object.entries(views))('Photo Safari upright on %s', (_, v) => {
  it.each(Array.from({ length: LEVELS.school!.max }, (_l, i) => i + 1))('level %s', (level) => {
    const plan = planFor(level);
    for (let seed = 1; seed <= 12; seed++) {
      const rng = new Rng(seed);
      const kind = plan.mode === 'tell' ? 'tell' : plan.mode === 'mystery' ? 'mystery' : 'plain';
      const ground = groundLine(v, kind, !!plan.best);
      const t: Target[] = [];
      if (!plan.big) {
        const scene = makeScene(plan, rng);
        sightingPositions(scene.sightings, v.w, v.h, ground).forEach((p, i) =>
          t.push({ what: `friend ${i}`, x: p.x, y: p.y - 65, w: 120, h: 130 }),
        );
        if (kind === 'tell') {
          const n = chipsFor(scene, rng).length;
          expect(n).toBeLessThanOrEqual(MAX_TELL_CHIPS);
          const at = tellLayout(v, n);
          at.chips.forEach((p, i) => t.push({ what: `card ${i}`, x: p.x, y: p.y, w: 150, h: 130 }));
          t.push({ what: 'tell', x: at.button.x, y: at.button.y, w: 170, h: 130 });
        }
        if (kind === 'mystery') {
          const chips = mysteryChips(scene);
          const actions = chips.filter((c) => c.kind === 'action').length;
          mysteryLayout(v, !!plan.best, actions, chips.length - actions).chips.forEach((p, i) =>
            t.push({ what: `card ${i}`, x: p.x, y: p.y, w: 150, h: 130 }),
          );
        }
      }
      if (kind === 'plain') {
        // The camera (levels 5 and 7's look step) and the two thumbs (the claim's true or not) share the bottom edge.
        t.push({ what: 'camera', x: v.w / 2, y: v.h - 72, w: 150, h: 116 });
      }
      const problems = uprightProblems(v, t);
      expect(problems, `level ${level} seed ${seed}`).toEqual([]);
    }
  });

  it('the thumbs sit beside each other inside the view', () => {
    const t: Target[] = [-95, 95].map((dx, i) => ({
      what: `thumb ${i}`,
      x: v.w / 2 + dx,
      y: v.h - 72,
      w: 150,
      h: 120,
    }));
    expect(uprightProblems(v, t)).toEqual([]);
  });
});

describe('Photo Safari tray layout', () => {
  it('keeps the wide view as it always was', () => {
    const wide = { w: 1200, h: 800 };
    expect(tellRowsReserved(wide)).toBe(0);
    const at = tellLayout(wide, 4);
    expect(at.chips.map((c) => c.y)).toEqual([722, 722, 722, 722]);
    expect(groundLine(wide, 'tell')).toBe(Math.min(800 * 0.78, 600));
  });

  it('puts at most three cards in a row upright, and the Tell button on its own row at the bottom', () => {
    for (let n = 1; n <= 6; n++) {
      const at = tellLayout({ w: 768, h: 1400 }, n);
      const rows = new Set(at.chips.map((c) => c.y));
      expect(rows.size).toBe(Math.ceil(n / 3));
      for (const y of rows) expect(y).toBeLessThan(at.button.y);
    }
  });
});
