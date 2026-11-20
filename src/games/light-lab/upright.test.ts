import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { Rng } from '../../engine/random';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CARD_H, CARD_W } from './art';
import { boardOrigin, CARD_STEP, cardsShift, CELL, ROW_GAP, TRAY_GAP, TRAY_H, TRAY_STEP } from './layout';
import { materialsRound, PLANS } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

describe('Light Lab layout', () => {
  it('keeps the sideways plan: the stack centred, never above 110', () => {
    expect(boardOrigin(sideways, 6, 4, 0)).toEqual({ x: 212, y: Math.max(110, (768 - 400) / 2 + 20) });
    expect(boardOrigin(sideways, 7, 5, 0).y).toBe(Math.max(110, (768 - 500) / 2 + 20));
  });
});

/** Every level's board shape and what hangs under it (the tray, or level 11's cards row). */
function shapes() {
  const out: { what: string; cols: number; rows: number; tray: number; cards: boolean }[] = [];
  PLANS.forEach((p, i) => {
    if (p.mode === 'materials') return;
    out.push({ what: `level ${i + 1}`, cols: p.cols, rows: p.rows, tray: p.tray, cards: false });
  });
  for (let seed = 1; seed <= 30; seed++) {
    const b = materialsRound(new Rng(seed)).board;
    out.push({ what: `materials seed ${seed}`, cols: b.cols, rows: b.rows, tray: 0, cards: true });
  }
  return out;
}

describe.each(Object.entries(views))('Light Lab upright on %s', (_, v) => {
  it.each(shapes())('$what: board, tray slots and cards fit, apart, clear of Home and the guide', (s) => {
    const below = s.tray ? TRAY_GAP + TRAY_H : s.cards ? ROW_GAP + CARD_H : 0;
    const o = boardOrigin(v, s.cols, s.rows, below);
    const t: Target[] = [
      {
        what: 'board',
        x: o.x + (s.cols * CELL) / 2,
        y: o.y + (s.rows * CELL) / 2,
        w: s.cols * CELL,
        h: s.rows * CELL,
      },
    ];
    const cx = o.x + (s.cols * CELL) / 2;
    if (s.tray) {
      const top = o.y + s.rows * CELL + TRAY_GAP;
      for (let k = 0; k < s.tray; k++)
        t.push({
          what: `tray slot ${k}`,
          x: cx + (k - (s.tray - 1) / 2) * TRAY_STEP,
          y: top + TRAY_H / 2,
          w: 100,
          h: 100,
        });
    }
    if (s.cards) {
      const y = o.y + s.rows * CELL + ROW_GAP + CARD_H / 2;
      for (let k = 0; k < 3; k++)
        t.push({ what: `card ${k}`, x: cx + cardsShift(v) + (k - 1) * CARD_STEP, y, w: CARD_W, h: CARD_H });
    }
    expect(uprightProblems(v, t)).toEqual([]);
    // Room above the board for the turns note.
    expect(o.y).toBeGreaterThanOrEqual(70);
    // Hung up from the bottom edge.
    const last = t[t.length - 1];
    expect(v.h - (last.y + last.h / 2)).toBeLessThanOrEqual(240);
  });
});
