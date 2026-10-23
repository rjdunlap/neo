import { describe, expect, it } from 'vitest';
import { computeView } from '../engine/view';
import { ARCADE_CARD, ARCADE_CELL_H, ARCADE_PLAY_RADIUS, arcadeLayout, TOPIC_TILE, TOPICS, topicsLayout } from './arcade-layout';
import { CORNER_RADIUS, GUIDE_CORNER, PAGE_ARROW_RADIUS } from './home-layout';

const VIEWS = [
  computeView(1024, 768),
  computeView(768, 1024),
  computeView(1180, 820),
  computeView(820, 1180),
  computeView(844, 390),
  computeView(390, 844),
  computeView(1366, 768),
];

interface Box { x0: number; y0: number; x1: number; y1: number; what: string }
const disc = (p: { x: number; y: number }, r: number, what: string): Box => ({ x0: p.x - r, y0: p.y - r, x1: p.x + r, y1: p.y + r, what });
const rect = (p: { x: number; y: number }, w: number, h: number, what: string): Box => ({ x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2, what });
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('the Arcade layout', () => {
  it('keeps every target at least 100 units', () => {
    expect(ARCADE_CARD).toBeGreaterThanOrEqual(100);
    expect(TOPICS.h).toBeGreaterThanOrEqual(100);
    expect(ARCADE_PLAY_RADIUS * 2).toBeGreaterThanOrEqual(100);
    expect(PAGE_ARROW_RADIUS * 2).toBeGreaterThanOrEqual(100);
  });

  it('fits the window, buttons and a page of at least four cards on screen, apart and clear of the guide corner', () => {
    for (const v of VIEWS) {
      const where = `${Math.round(v.w)}×${Math.round(v.h)}`;
      const l = arcadeLayout(v);
      expect(l.cards.length, where).toBeGreaterThanOrEqual(4);
      expect(l.cards.length, where).toBe(l.cols * l.rows);
      const winH = (l.window.w * 3) / 4;
      expect(l.window.w, where).toBeGreaterThanOrEqual(400);
      // A card with its name and tag line under it.
      const cells = l.cards.map((c, i): Box => ({ x0: c.x - ARCADE_CARD / 2, y0: c.y - ARCADE_CARD / 2, x1: c.x + ARCADE_CARD / 2, y1: c.y - ARCADE_CARD / 2 + ARCADE_CELL_H - 8, what: `card ${i}` }));
      const targets: Box[] = [
        disc(l.back, CORNER_RADIUS, 'back'),
        disc(l.home, CORNER_RADIUS, 'home'),
        rect(l.topics, TOPICS.w, TOPICS.h, 'topics'),
        disc(l.play, ARCADE_PLAY_RADIUS, 'play'),
        disc(l.prev, PAGE_ARROW_RADIUS, 'prev'),
        disc(l.next, PAGE_ARROW_RADIUS, 'next'),
        ...cells,
      ];
      const window: Box = { x0: l.window.x, y0: l.window.y, x1: l.window.x + l.window.w, y1: l.window.y + winH, what: 'window' };
      const caption: Box = { x0: l.caption.x, y0: l.caption.y, x1: l.caption.x + l.caption.w, y1: l.caption.y + 84, what: 'caption' };
      const corner: Box = { x0: 0, y0: v.h - GUIDE_CORNER.h, x1: GUIDE_CORNER.w, y1: v.h, what: 'guide corner' };
      for (const b of [...targets, window, caption]) {
        expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
        expect(b.y0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
        expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
        expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
        expect(overlap(b, corner), `${b.what} in the guide corner, ${where}`).toBe(false);
      }
      const all = [...targets, window, caption];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          // The caption sits beside Play by design; everything else is apart.
          if (new Set([all[i].what, all[j].what]).size === 2 && [all[i].what, all[j].what].includes('caption') && [all[i].what, all[j].what].includes('play')) continue;
          expect(overlap(all[i], all[j]), `${all[i].what} and ${all[j].what}, ${where}`).toBe(false);
        }
      }
    }
  });

  it('fits the Topics sheet twelve tiles with their names on screen, apart and clear of the guide corner and the top bar', () => {
    for (const v of VIEWS) {
      const where = `${Math.round(v.w)}×${Math.round(v.h)}`;
      const tiles = topicsLayout(v, 12).map((t, i): Box => ({ x0: t.x - TOPIC_TILE / 2, y0: t.y - TOPIC_TILE / 2, x1: t.x + TOPIC_TILE / 2, y1: t.y + TOPIC_TILE / 2 + 44, what: `tile ${i}` }));
      const corner: Box = { x0: 0, y0: v.h - GUIDE_CORNER.h, x1: GUIDE_CORNER.w, y1: v.h, what: 'guide corner' };
      const l = arcadeLayout(v);
      const bar = [disc(l.back, CORNER_RADIUS, 'back'), disc(l.home, CORNER_RADIUS, 'home'), rect(l.topics, TOPICS.w, TOPICS.h, 'topics')];
      for (const b of tiles) {
        expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
        expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
        expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
        expect(overlap(b, corner), `${b.what} in the guide corner, ${where}`).toBe(false);
        for (const t of bar) expect(overlap(b, t), `${b.what} under ${t.what}, ${where}`).toBe(false);
      }
      for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) expect(overlap(tiles[i], tiles[j]), `${i} and ${j}, ${where}`).toBe(false);
    }
  });
});
