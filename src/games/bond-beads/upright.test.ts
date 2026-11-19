import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BEAD_GAP, BEAD_R, BEAD_REACH, beadLayout, overlaps, TABLE_TALL, type Rect } from './layout';
import { cardShapes, LEVELS, roundFor } from './logic';

/**
 * Bond Beads held upright (chunk 31, docs/definitions/phone-portrait.md): every level, every tray a round can deal, on
 * the three upright phone views, the captioned one and a short one. The targets are every bead (a 128-unit circle, the
 * scene's hit area), Check (levels 2 and up), Undo and Start again; a tap between two beads breaks their link, so the
 * table itself is a touch surface and nothing else may lie on it.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

/** The scene's bead hit area: a circle of the body's radius plus 14. */
const BEAD_TOUCH = 2 * (BEAD_R + 14);

/** Every tray shape a level deals over many seeded rounds: how many beads, how many pictures on the card. */
function trays(level: number): [beads: number, pictures: number][] {
  const seen = new Map<string, [number, number]>();
  for (let seed = 1; seed <= 200; seed++)
    for (const s of roundFor(level, new Rng(seed)))
      seen.set(`${s.kinds.length}/${cardShapes(s).length}`, [s.kinds.length, cardShapes(s).length]);
  return [...seen.values()];
}

const box = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w,
  h: r.h,
});

it('covers levels 1 to 7, and every tray they deal', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7]);
  const all = levels.flatMap((level) => trays(level));
  expect(Math.max(...all.map((t) => t[0]))).toBe(7);
  expect(Math.max(...all.map((t) => t[1]))).toBe(3);
  expect(trays(1).every((t) => t[1] === 0)).toBe(true);
});

describe.each(Object.entries(views))('Bond Beads upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      for (const [n, pictures] of trays(level)) {
        const at = `level ${level}, ${n} beads, ${pictures} pictures`;
        const l = beadLayout(v, n, pictures)!;
        expect(l, at).not.toBeNull();
        const buttons = [
          ...(l.check ? [box('Check', l.check)] : []),
          box('Undo', l.undo),
          box('Start again', l.again),
        ];
        expect(!!l.check, at).toBe(level >= 2);
        expect(uprightProblems(v, buttons), at).toEqual([]);
        l.beads.forEach((b, i) => {
          // A bead is a circle: against the buttons its box is checked, against another bead its middle's distance.
          expect(uprightProblems(v, [square(`bead ${i + 1}`, b, BEAD_TOUCH), ...buttons]), at).toEqual([]);
          for (const c of l.beads.slice(i + 1))
            expect(Math.hypot(b.x - c.x, b.y - c.y), at).toBeGreaterThanOrEqual(
              Math.max(BEAD_TOUCH, BEAD_GAP),
            );
          // Its hands stay on the table.
          expect(b.x - BEAD_REACH, at).toBeGreaterThanOrEqual(l.table.x);
          expect(b.x + BEAD_REACH, at).toBeLessThanOrEqual(l.table.x + l.table.w);
          expect(b.y - BEAD_REACH, at).toBeGreaterThanOrEqual(l.table.y);
          expect(b.y + BEAD_REACH, at).toBeLessThanOrEqual(l.table.y + l.table.h);
        });
        // The table takes link taps: the card, the tally and the buttons are off it, in view and off Home and the guide.
        const parts = [l.tally, ...(l.card ? [l.card] : []), l.undo, l.again, ...(l.check ? [l.check] : [])];
        for (const p of parts) expect(overlaps(p, l.table), at).toBe(false);
        for (const p of [l.table, l.tally, ...(l.card ? [l.card] : [])])
          expect(
            uprightProblems(v, [box('part', p)]).filter((x) => !x.includes('units')),
            at,
          ).toEqual([]);
      }
    },
  );

  it.each(levels)(
    'level %i: the table sits low and keeps its shape, with the card and tally just above',
    (level) => {
      for (const [n, pictures] of trays(level)) {
        const l = beadLayout(v, n, pictures)!;
        // Wide enough for the ring, never a long ellipse up a tall phone.
        expect(l.table.w).toBe(v.w - 40);
        expect(l.table.h).toBeLessThanOrEqual(TABLE_TALL * l.table.w + 1e-6);
        expect(l.table.h).toBeGreaterThanOrEqual(680);
        // The bottom of the table is just above the buttons and the guide, whatever the screen's height.
        expect(v.h - (l.table.y + l.table.h)).toBeLessThanOrEqual(190);
        const head = l.card ?? l.table;
        if (l.card) {
          expect(l.table.y - (l.card.y + l.card.h)).toBe(20);
          expect(l.card.h).toBeGreaterThanOrEqual(200);
          expect(l.card.w).toBeGreaterThanOrEqual(590);
          expect(l.card.x).toBe(l.tally.x);
        }
        // The tally is the strip above the card (or the table), never left at the top of a tall screen.
        expect(l.tally.y + l.tally.h).toBeLessThanOrEqual(head.y - 20 + 1e-6);
        expect(head.y - (l.tally.y + l.tally.h)).toBeLessThanOrEqual(20 + 1e-6);
      }
    },
  );
});

describe('Bond Beads sideways', () => {
  it('keeps the tally, the card column, the buttons and the table where they were', () => {
    const l = beadLayout(computeView(1024, 768, NO_INSETS), 7, 2)!;
    expect(l.tally).toEqual({ x: 150, y: 20, w: 854, h: 70 });
    expect(l.card).toEqual({ x: 724, y: 110, w: 280, h: 360 });
    expect(l.table).toEqual({ x: 180, y: 110, w: 524, h: 638 });
    expect(l.check).toEqual({ x: 808, y: 500, w: 112, h: 112 });
    expect(l.undo).toEqual({ x: 740, y: 636, w: 112, h: 112 });
    expect(l.again).toEqual({ x: 876, y: 636, w: 112, h: 112 });
  });

  it('a screen as short as the upright area itself still deals every tray, the card giving up height first', () => {
    const v = computeView(768, 1024, NO_INSETS, true);
    for (const n of [2, 3, 4, 5, 6, 7])
      for (const pictures of [0, 1, 2, 3]) {
        const l = beadLayout(v, n, pictures)!;
        expect(l, `${n} beads, ${pictures} pictures`).not.toBeNull();
        if (l.card) expect(l.card).toEqual({ x: 150, y: 110, w: 598, h: 144 });
        expect(l.tally.y).toBe(pictures ? 20 : 145);
      }
  });
});
