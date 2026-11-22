import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { Rng } from '../../engine/random';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BH, BIN_HIT, BUTTON_R, BW, bearX, edgeX, standX, towerLayout, towerX, TRAY_HIT } from './layout';
import { MEND_TASKS, mendDomain, mendTask, makeReachRounds, makeStandRounds, planFor, reachX } from './logic';

/**
 * Block Tower held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views.
 * Levels 1 and 2 take a tap anywhere, so they have no targets; the rest are checked below. The room's window, the beam
 * and the table are scenery.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Block Tower upright on %s', (_, v) => {
  const L = towerLayout(v);
  const circle = (what: string, p: { x: number; y: number }): Target => ({
    what,
    ...p,
    w: 2 * BUTTON_R,
    h: 2 * BUTTON_R,
  });
  const bin: Target = {
    what: 'basket',
    x: L.bin.x + BIN_HIT.x + BIN_HIT.w / 2,
    y: L.bin.y + BIN_HIT.y + BIN_HIT.h / 2,
    w: BIN_HIT.w,
    h: BIN_HIT.h,
  };

  it('stands everything on the floor, with the top furniture below the Home column', () => {
    expect(v.h - L.floor).toBe(70);
    expect(L.window.y).toBeGreaterThanOrEqual(210 - 70);
    expect(L.beamY).toBeGreaterThanOrEqual(0);
    expect(L.window.x + 170).toBeLessThanOrEqual(v.w);
  });

  it.each([3, 4])('level %s: the basket, the bell and the tower beside them', (level) => {
    const plan = planFor(level);
    const match = plan.mode === 'match';
    const tx = towerX(v, match);
    // The tower's tap area is 150 wide and as tall as its blocks; the tallest tower is nine blocks.
    const blocks = 9;
    const tower: Target = {
      what: 'tower',
      x: tx,
      y: L.floor - (blocks * BH + 40) / 2 + 10,
      w: 150,
      h: blocks * BH + 40,
    };
    const t = [bin, circle('bell', L.bell), tower];
    // The flag's pennant is scenery, but the compare level's visitor tower stands to the left.
    if (match)
      t.push({ what: 'visitor tower', x: bearX(v), y: L.floor - (blocks * BH) / 2, w: 150, h: blocks * BH });
    expect(uprightProblems(v, t), `level ${level}`).toEqual([]);
    // The bell clears the basket and stands up from the bottom edge.
    expect(L.bell.y + BUTTON_R).toBeLessThan(L.bin.y + BIN_HIT.y);
    expect(v.h - L.bin.y).toBeLessThanOrEqual(120);
  });

  describe.each([0, 1, 2, 3, 4, 5, 6, 7])('level 5, seed %s', (seed) => {
    it.each([false, true])('school %s', (school) => {
      const rounds = makeStandRounds(new Rng(seed), school);
      // Each block's tap area is 144 wide and 102 tall, standing on its own height; a tower's own blocks overlap.
      const box = (i: number, k: number, off: number): Target => ({
        what: `tower ${i} block ${k}`,
        x: standX(v, i) + (off * BW) / 8,
        y: L.floor - k * BH - (BH + 30) + (BH + 40) / 2,
        w: BW + 40,
        h: BH + 40,
      });
      const towers: Target[] = [];
      for (const round of rounds) {
        const [a, b] = [0, 1].map((i) => round.towers[i].map((off, k) => box(i, k, off)));
        for (const x of a) {
          expect(uprightProblems(v, [x]), `seed ${seed}`).toEqual([]);
          for (const y of b) expect(uprightProblems(v, [x, y]), `seed ${seed}`).toEqual([]);
        }
        for (const y of b) expect(uprightProblems(v, [y]), `seed ${seed}`).toEqual([]);
      }
      const t = [...towers, circle('watch again', L.watchAgain), circle('continue', L.continueStand)];
      // The buttons clear both towers' columns, at their widest.
      expect(uprightProblems(v, t), `seed ${seed}`).toEqual([]);
      // The buttons sit just above the towers' tops, not at the top of a tall phone.
      expect(L.floor - 3 * BH - (L.watchAgain.y + BUTTON_R)).toBeLessThanOrEqual(260);
      expect(L.watchAgain.y).toBe(L.continueStand.y);
    });
  });

  describe.each([0, 1, 2, 3])('level 6, seed %s', (seed) => {
    it('keeps the tray, the table and the star in view', () => {
      for (const round of makeReachRounds(new Rng(seed))) {
        const t: Target[] = Array.from({ length: round.blocks }, (_, i) => ({
          what: `tray block ${i}`,
          ...L.tray(i),
          y: L.tray(i).y - 30,
          w: TRAY_HIT.w,
          h: TRAY_HIT.h,
        }));
        expect(uprightProblems(v, t), `seed ${seed}`).toEqual([]);
        const e = edgeX(v, round.direction);
        // Blocks and star stay on screen: the star stands past the edge, the whole tower reaches it.
        const star = reachX(round.star, e, BW, round.direction);
        expect(star - BW / 2).toBeGreaterThanOrEqual(0);
        expect(star + BW / 2).toBeLessThanOrEqual(v.w);
        const top = L.tableTop - (round.blocks + 0.6) * BH - 40;
        expect(top).toBeGreaterThanOrEqual(210);
      }
    });
  });

  describe.each(MEND_TASKS.map((t) => t.id))('level 7, task %s', (id) => {
    it.each([1, -1] as const)(
      'leaning %s: the tower, the top block across its domain and both buttons',
      (d) => {
        const task = mendTask(
          MEND_TASKS.find((t) => t.id === id)!,
          d,
        );
        const tx = towerX(v, false);
        const n = task.tower.length - 1;
        const buttons = [circle('undo', L.watchAgain), circle('let go', L.continueStand)];
        // The top block's tap area at each end of its domain, standing on the block below.
        for (const x of [mendDomain(task)[0], mendDomain(task).at(-1)!]) {
          const top: Target = {
            what: `top block at ${x}`,
            x: tx + (x * BW) / 8,
            y: L.floor - n * BH - (BH + 30) + TRAY_HIT.h / 2,
            w: TRAY_HIT.w,
            h: TRAY_HIT.h,
          };
          expect(uprightProblems(v, [top, ...buttons]), `${id} ${d} at ${x}`).toEqual([]);
        }
        // Every block stays inside the view, and the buttons sit above the tower's top.
        for (const x of task.tower) {
          expect(tx + (x * BW) / 8 - BW / 2).toBeGreaterThanOrEqual(0);
          expect(tx + (x * BW) / 8 + BW / 2).toBeLessThanOrEqual(v.w);
        }
        expect(L.watchAgain.y + BUTTON_R).toBeLessThan(L.floor - (n + 1) * BH - 30);
      },
    );
  });
});
