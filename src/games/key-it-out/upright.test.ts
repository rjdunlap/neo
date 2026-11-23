import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { ROW, layout, maxScroll, rowParts, sketchCells, type Box } from './layout';

/**
 * Key It Out held upright, on the upright screens, the short captioned phone the browser play uses (390 × 625), and two
 * sideways views. Upright, the Sketches and Key pages share the page area and are checked one tab at a time.
 */
const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true).game;
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true).game;
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true).game;
const views = { ...UPRIGHT_VIEWS, shortPhone, sideways, tablet };
type V = (typeof views)[keyof typeof views];

const target = (what: string, b: Box): Target => ({ what, ...b });

const chrome = (v: V) => {
  const l = layout(v);
  return [
    target('back', l.prev),
    target('next', l.next),
    target('name plate', l.plate),
    target('Key tab', l.tabs.key),
    target('Help', l.tabs.help),
    ...(l.tabs.sketches ? [target('Sketches tab', l.tabs.sketches)] : []),
  ];
};
const cells = (v: V, n: number) => sketchCells(layout(v), n).map((b, i) => target(`sketch ${i + 1}`, b));
/** The key rows wholly on the page before it scrolls: each question and its two ends, on screen. */
function keyRows(v: V, rows: number) {
  const l = layout(v);
  const x0 = l.page.x - l.page.w / 2,
    y0 = l.page.y - l.page.h / 2;
  const out: Target[] = [];
  for (let i = 0; i < rows && (i + 1) * ROW <= l.page.h; i++) {
    const parts = rowParts(l, i);
    for (const k of ['question', 'yes', 'no'] as const)
      out.push(target(`row ${i + 1} ${k}`, { ...parts[k], x: parts[k].x + x0, y: parts[k].y + y0 }));
  }
  return out;
}

describe.each(Object.entries(views))('Key It Out on %s', (name, v) => {
  it.each([6, 9])(
    'lays out the strip, tabs and Help with %i sketches and with the key: at least 64 units, apart, in view, clear of Home and the guide',
    (n) => {
      const l = layout(v);
      const pages = l.upright ? [cells(v, n), keyRows(v, n - 1)] : [[...cells(v, n), ...keyRows(v, n - 1)]];
      for (const page of pages)
        expect(uprightProblems(v, [...chrome(v), ...page], 64), `${name}`).toEqual([]);
      // The note and the page are pictures: in view and apart from the strip and tabs.
      expect(
        uprightProblems(v, [target('strip', l.strip), target('note', l.note), target('page', l.page)], 0),
      ).toEqual([]);
    },
  );

  it('keeps the page above a caption bubble when upright', () => {
    const l = layout(v);
    const caption = captionPlace(v, true);
    if (l.upright && caption.mode === 'bubble' && caption.band)
      expect(l.page.y + l.page.h / 2).toBeLessThanOrEqual(caption.band.y);
  });
});

describe('Key It Out on the short captioned phone', () => {
  it('fits the strip, the tabs and at least three key rows above the caption, and slides the rest', () => {
    const l = layout(shortPhone);
    expect(l.upright).toBe(true);
    expect(Math.floor(l.page.h / ROW)).toBeGreaterThanOrEqual(3);
    expect(maxScroll(l, 5)).toBeGreaterThan(0);
    expect(maxScroll(l, 8)).toBe(8 * ROW - l.page.h);
  });

  it('gives each of nine sketches a cell of at least 64 units without scrolling', () => {
    for (const c of sketchCells(layout(shortPhone), 9)) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(64);
  });
});

describe('Key It Out target sizes', () => {
  it('records the smallest target in CSS pixels at 390 x 844: a branch end, 44.7', () => {
    const v = UPRIGHT_VIEWS.phone;
    const all = [...chrome(v), ...cells(v, 9), ...keyRows(v, 8)];
    expect(thumbPx(Math.min(...all.map((t) => Math.min(t.w, t.h))))).toBe(44.7);
  });
});
