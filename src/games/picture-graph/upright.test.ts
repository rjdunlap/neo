import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, square, type Target } from '../upright-check';
import {
  BLOCK_H,
  cardLayout,
  claimLayout,
  COL_W,
  columnX,
  graphBase,
  LEVELS,
  pairLayout,
  PLANS,
  prebuilt,
  ROW_H,
  shoreArea,
  STAMP_R,
  THING_SIZE,
  trayLayout,
  UPRIGHT_LIFT,
} from './logic';

/**
 * Picture Graph held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the three upright phone views,
 * the captioned one and a short one. The targets are the ones a round asks for: a graph's columns (each a whole tap box
 * tall), the check, the number pads, the claim stamps, the shore things and tray rows of level 8 and the three small
 * graphs of level 10; and the graph panel must stand clear of the guide in the bottom-left corner.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = LEVELS.school!.order!;

describe.each(Object.entries(views))('Picture Graph upright on %s', (_, v) => {
  it('is on the upright area', () => expect(v.upright).toBe(true));

  it.each(levels)(
    'level %i: the targets are whole, apart, in view and clear of Home and the guide',
    (level) => {
      const plan = PLANS[level - 1];
      const t: Target[] = [];
      if (plan.mode === 'line') {
        const tray = trayLayout(v.w, v.h, plan.kinds, plan.max);
        for (let r = 0; r < plan.kinds; r++)
          t.push({
            what: `row ${r + 1}`,
            x: (tray.left + tray.right) / 2,
            y: tray.rowY(r),
            w: tray.right - tray.left,
            h: ROW_H,
          });
        expect(tray.right, 'tray inside the view').toBeLessThanOrEqual(v.w);
        expect(tray.slotX(plan.max - 1) + tray.slot / 2, 'last slot inside the tray').toBeLessThanOrEqual(
          tray.right,
        );
        expect(tray.slot, 'a slot holds a placed thing').toBeGreaterThanOrEqual(76);
        const area = shoreArea(v.w, v.h, plan.kinds, plan.max);
        expect(area.right - area.left).toBeGreaterThanOrEqual(THING_SIZE * 3);
        for (const [i, x] of [area.left + THING_SIZE / 2, area.right - THING_SIZE / 2].entries())
          t.push(
            square(
              `thing at the shore's ${i ? 'right' : 'left'} edge`,
              { x, y: area.top + THING_SIZE / 2 },
              THING_SIZE,
            ),
          );
        for (let i = 0; i < 3; i++)
          t.push({
            what: `pad ${i + 1}`,
            x: v.w / 2 + (i - 1) * 160,
            y: (area.top + area.bottom) / 2,
            w: 124,
            h: 112,
          });
      } else if (plan.mode === 'pair') {
        const p = pairLayout(v.w, v.h, plan.kinds);
        for (let i = 0; i < 3; i++)
          t.push({ what: `graph ${i + 1}`, x: p.graphX(i), y: (p.top + p.bottom) / 2, w: p.gw, h: p.gh });
      } else {
        const base = graphBase(v.h, true);
        const lift = UPRIGHT_LIFT;
        expect(base + 80, 'the panel ends above the guide').toBeLessThanOrEqual(v.h - 170);
        for (let i = 0; i < plan.kinds; i++)
          t.push({
            what: `column ${i + 1}`,
            x: columnX(v.w, plan.kinds, i),
            y: base - 116,
            w: COL_W,
            h: 8 * BLOCK_H + 80,
          });
        if (!prebuilt(plan)) t.push(square('check', { x: v.w - 90, y: base - 40 }, 112));
        if (plan.mode !== 'claim')
          for (let i = 0; i < 3; i++)
            t.push({ what: `pad ${i + 1}`, x: v.w - 100, y: v.h * 0.32 + i * 125, w: 124, h: 112 });
        if (plan.mode === 'claim') {
          const c = claimLayout(v.w, v.h, lift);
          for (let i = 0; i < 3; i++) t.push(square(`stamp ${i + 1}`, c.stamp(i), STAMP_R * 2));
          expect(c.card.y + c.card.h / 2, 'the claim card sits over the graph').toBeLessThanOrEqual(
            base - 312,
          );
        }
        if (plan.mode === 'fives') {
          const c = cardLayout(v.w, v.h, plan.kinds, plan.max, lift);
          expect(c.bottom, 'cards above the panel').toBeLessThanOrEqual(base - 312);
          expect(c.top).toBeGreaterThanOrEqual(150);
          expect(c.right).toBeLessThanOrEqual(v.w - 110 - 62);
          expect(c.rowH).toBeGreaterThanOrEqual(56);
        }
        // The panel is the widest thing: inside the view and left of the pads and stamps.
        const left = columnX(v.w, plan.kinds, 0) - COL_W / 2 - 40;
        const right = columnX(v.w, plan.kinds, plan.kinds - 1) + COL_W / 2 + 30;
        expect(left).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(v.w - 100 - 62 - 10 + 12);
      }
      expect(uprightProblems(v, t)).toEqual([]);
      for (const x of t) expect(x.y + x.h / 2, `${x.what} in view`).toBeLessThanOrEqual(v.h);
    },
  );
});
