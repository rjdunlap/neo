import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { UPRIGHT_VIEWS } from '../../games/upright-check';
import { journalLayout } from './JournalScene';
import { stickerBookLayout } from './StickerBookScene';

/**
 * The journal and the sticker book on a phone held upright (chunk 31, shell slice 2), beside the sideways views they
 * already had: every target at least 100 units, inside the view and apart. Explore, Friends and Dress are checked by
 * their own layout tests in `src/creatures/`.
 */
const VIEWS = [
  computeView(1024, 768),
  computeView(768, 1024),
  computeView(844, 390),
  computeView(1366, 768),
  ...Object.values(UPRIGHT_VIEWS),
];

interface Box {
  what: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const rect = (what: string, p: { x: number; y: number }, w: number, h = w): Box => ({
  what,
  x0: p.x - w / 2,
  y0: p.y - h / 2,
  x1: p.x + w / 2,
  y1: p.y + h / 2,
});
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function problems(v: { w: number; h: number }, boxes: Box[]): string[] {
  const out: string[] = [];
  boxes.forEach((b, i) => {
    if (Math.min(b.x1 - b.x0, b.y1 - b.y0) < 100) out.push(`${b.what} is under 100 units`);
    if (b.x0 < 0 || b.y0 < 0 || b.x1 > v.w || b.y1 > v.h) out.push(`${b.what} leaves the view`);
    for (const c of boxes.slice(i + 1)) if (overlap(b, c)) out.push(`${b.what} overlaps ${c.what}`);
  });
  return out;
}

describe('the journal on every view, upright included', () => {
  it('fits Back, both page arrows, eight 190 × 170 cards and the strip with its Play, apart', () => {
    for (const v of VIEWS) {
      const l = journalLayout(v);
      const where = `${Math.round(v.w)}×${Math.round(v.h)}`;
      expect(l.cards).toHaveLength(8);
      const strip: Box = {
        what: 'strip',
        x0: l.strip.x - l.strip.w / 2,
        y0: l.strip.y - 62,
        x1: l.strip.x + l.strip.w / 2,
        y1: l.strip.y + 62,
      };
      const targets = [
        rect('back', l.back, 100),
        rect('previous', l.previous, 100),
        rect('next', l.next, 100),
        ...l.cards.map((c, i) => rect(`card ${i}`, c, 190, 170)),
      ];
      expect(problems(v, [...targets, strip]), where).toEqual([]);
      // Play sits on the strip, and the page dots between the cards and the strip.
      const play = rect('play', l.play, 112);
      expect(play.x0 >= strip.x0 && play.x1 <= strip.x1 && play.y0 >= strip.y0 - 1, where).toBe(true);
      const lowest = Math.max(...l.cards.map((c) => c.y + 85));
      expect(l.dotsY, where).toBeGreaterThan(lowest);
      expect(l.dotsY, where).toBeLessThan(strip.y0);
      // The heading and count above the cards.
      expect(Math.min(...l.cards.map((c) => c.y - 85)), where).toBeGreaterThanOrEqual(115);
    }
  });

  it('keeps the wide area at two rows of four, and lays the upright area out in four rows of two', () => {
    expect(new Set(journalLayout(computeView(1024, 768)).cards.map((c) => c.y)).size).toBe(2);
    expect(new Set(journalLayout(UPRIGHT_VIEWS.phone).cards.map((c) => c.y)).size).toBe(4);
  });
});

describe('the sticker book on every view, upright included', () => {
  it('fits Home, the page arrows, a full tray and its arrows apart, with the page between the heading and the tray', () => {
    for (const v of VIEWS) {
      const l = stickerBookLayout(v);
      const where = `${Math.round(v.w)}×${Math.round(v.h)}`;
      const tray = Array.from({ length: l.trayCount }, (_, i) =>
        rect(`tray sticker ${i}`, l.traySpot(i, l.trayCount), 110),
      );
      const targets = [
        rect('home', l.home, 100),
        rect('previous page', l.previous, 100),
        rect('next page', l.next, 100),
        rect('tray previous', l.trayPrevious, 100),
        rect('tray next', l.trayNext, 100),
        ...tray,
      ];
      expect(problems(v, targets), where).toEqual([]);
      expect(l.area.x, where).toBeGreaterThanOrEqual(0);
      expect(l.area.x + l.area.w, where).toBeLessThanOrEqual(v.w);
      expect(l.area.y, where).toBeGreaterThanOrEqual(64 + 50);
      expect(l.area.y + l.area.h, where).toBeLessThanOrEqual(v.h - 135);
    }
  });

  it('shows five in the tray on the wide area and four on the upright area', () => {
    expect(stickerBookLayout(computeView(1024, 768)).trayCount).toBe(5);
    expect(stickerBookLayout(UPRIGHT_VIEWS.phone).trayCount).toBe(4);
  });
});
