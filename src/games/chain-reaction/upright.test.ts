import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BUTTON_HIT_R, chainLayout, COL_GAP, PANEL_BELOW, PART_HIT_R, TRAY_PITCH, TRAY_UP } from './layout';
import { makeBoards, PLANS, WHICH_BELL } from './logic';

/**
 * Chain Reaction held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on every board the seeds
 * make, at the upright phone views. The board's tap targets are its sockets (a placed or turning ramp, 104 × 100), the
 * start cup (one strip over the starting columns) and, on the prediction level, the bells; the controls rest in a row
 * up from the bottom edge. The panel, the spring, the gate and the chime are scenery.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Chain Reaction upright on %s', (_, v) => {
  describe.each(PLANS.map((p, i) => [i + 1, p] as const))('level %s', (level, plan) => {
    const L = chainLayout(v, plan.cols, plan.rows);
    const colX = (c: number) => L.left + c * COL_GAP;
    const rowY = (r: number) => L.top + (r + 1) * L.gap;
    const bottom = L.top + (plan.rows + 1) * L.gap;
    const controls: Target[] = [
      { what: 'Run', ...L.run, w: 2 * BUTTON_HIT_R, h: 2 * BUTTON_HIT_R },
      { what: 'Help', ...L.help, w: 2 * BUTTON_HIT_R, h: 2 * BUTTON_HIT_R },
      ...Array.from({ length: plan.loose }, (_, i) => ({
        what: `ramp ${i + 1}`,
        ...L.home(i),
        w: 2 * PART_HIT_R,
        h: 2 * PART_HIT_R,
      })),
    ];

    it('rests the controls in one row up from the bottom edge, clear of the guide', () => {
      expect(controls.every((t) => t.y === v.h - TRAY_UP)).toBe(true);
      expect(L.home(0).x - L.help.x).toBe(TRAY_PITCH);
      expect(uprightProblems(v, controls), `level ${level}`).toEqual([]);
    });

    it('hangs the board above the controls, inside the view', () => {
      expect(bottom + PANEL_BELOW).toBeLessThanOrEqual(v.h - TRAY_UP - BUTTON_HIT_R);
      expect(L.left - 60).toBeGreaterThanOrEqual(0);
      expect(L.left + (plan.cols - 1) * COL_GAP + 60).toBeLessThanOrEqual(v.w);
    });

    it.each([1, 2, 3, 4, 5, 6])('keeps every target apart on board seed %s', (seed) => {
      for (const machine of makeBoards(plan, new Rng(seed))) {
        const targets: Target[] = [...controls];
        const starts = [machine.start, ...(machine.blue ? [machine.blue.start] : [])];
        const lo = colX(Math.min(...starts));
        const hi = colX(Math.max(...starts));
        targets.push({ what: 'start cup', x: (lo + hi) / 2, y: L.top - 28, w: hi - lo + 120, h: 104 });
        if (level === WHICH_BELL) {
          for (const col of machine.bells ?? [])
            targets.push({ what: `bell ${col}`, x: colX(col), y: bottom - 32 - 14, w: 104, h: 140 });
        } else {
          // Every socket can hold a ramp; the turning ramps sit in some of them. Parts are 100 wide, turn areas 104.
          for (let r = 0; r < plan.rows; r++)
            for (let c = 0; c < plan.cols; c++)
              targets.push({ what: `socket ${r},${c}`, x: colX(c), y: rowY(r), w: 104, h: 100 });
        }
        expect(uprightProblems(v, targets), `level ${level} seed ${seed}`).toEqual([]);
      }
    });
  });
});

describe('Chain Reaction sideways', () => {
  const v = computeView(1024, 768);
  it('keeps the old column of controls at the right edge', () => {
    const L = chainLayout(v, 5, 5);
    expect(L.run).toEqual({ x: v.w - 100, y: 180 });
    expect(L.help).toEqual({ x: v.w - 100, y: 305 });
    expect(L.home(1)).toEqual({ x: v.w - 100, y: 577 });
    expect(L.left).toBeCloseTo(191.5, 5);
  });
});
