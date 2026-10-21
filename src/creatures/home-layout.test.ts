import { describe, expect, it } from 'vitest';
import { computeView } from '../engine/view';
import { BOARD, PLAQUE } from '../ui/creation-art';
import { BACK } from './friends-layout';
import { ACTION_RADIUS, BALL_RADIUS, BASKET, CORNER_RADIUS, EXPLORE_CARD, EXPLORE_MAX, exploreGridLayout, exploreLayout, PAGE_ARROW_RADIUS, GUIDE_CORNER, HOME_BUTTON, homeLayout, LINK_CORNER, NEWCOMER_REACH, playLayout, PROJECT_CARD, PROJECT_PLAY_RADIUS, projectLayout, type Floor } from './home-layout';

/** An iPad sideways and upright, a phone sideways, one with a notch, and a wide laptop. */
const VIEWS = [
  computeView(1024, 768),
  computeView(768, 1024),
  computeView(844, 390),
  computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  computeView(1366, 768),
];

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  what: string;
}
const disc = (p: { x: number; y: number }, r: number, what: string): Box => ({ x0: p.x - r, y0: p.y - r, x1: p.x + r, y1: p.y + r, what });
const rect = (p: { x: number; y: number }, w: number, h: number, what: string): Box => ({ x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2, what });
/** The companion at its stage scale, wearing a sun hat or holding an umbrella (as the dressing test measures it). */
const body = (s: { x: number; y: number; scale: number }): Box => ({ x0: s.x - 150 * s.scale, y0: s.y - 280 * s.scale, x1: s.x + 150 * s.scale, y1: s.y + 10, what: 'companion' });
/** Every spot the ball can rest on, as a box. */
const floorBox = (f: Floor): Box => ({ x0: f.x0 - BALL_RADIUS, y0: f.y0 - BALL_RADIUS, x1: f.x1 + BALL_RADIUS, y1: f.y1 + BALL_RADIUS, what: 'floor' });
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function check(v: { w: number; h: number }, targets: Box[], extra: Box[], where: string) {
  const corner: Box = { x0: 0, y0: v.h - GUIDE_CORNER.h, x1: GUIDE_CORNER.w, y1: v.h, what: 'guide corner' };
  for (const b of [...targets, ...extra]) {
    expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
    expect(b.y0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
    expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
    expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
    expect(overlap(b, corner), `${b.what} in the guide corner, ${where}`).toBe(false);
  }
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) expect(overlap(targets[i], targets[j]), `${targets[i].what} and ${targets[j].what}, ${where}`).toBe(false);
  }
}

describe('the root Home layout', () => {
  it('fits every exit for each band layout, clear of the guide and link corners, the ball landing clear of them', () => {
    expect(ACTION_RADIUS * 2).toBeGreaterThanOrEqual(120);
    expect(CORNER_RADIUS * 2).toBeGreaterThanOrEqual(100);
    for (const v of VIEWS) {
      for (const [young, project] of [[true, false], [true, true], [false, false], [false, true]]) {
        const l = homeLayout(v, young, project);
        const where = `${v.w}×${v.h}, ${young ? 'lap/toddler' : 'preschool+'}${project ? ', welcome open' : ''}`;
        expect(l.play === null, where).toBe(young);
        expect(l.continue !== null, where).toBe(!young && project);
        expect(l.ball === null, where).toBe(!young);
        const buttons = [disc(l.who, CORNER_RADIUS, 'who'), disc(l.explore, ACTION_RADIUS, 'explore'), ...(l.play ? [disc(l.play, ACTION_RADIUS, 'play')] : []), ...(l.continue ? [disc(l.continue, ACTION_RADIUS, 'continue')] : [])];
        const targets = [...buttons, body(l.stage), ...(l.ball ? [disc(l.ball, BALL_RADIUS, 'ball')] : [])];
        check(v, targets, [floorBox(l.floor)], where);
        const link: Box = { x0: v.w - LINK_CORNER.w, y0: 0, x1: v.w, y1: LINK_CORNER.h, what: 'link corner' };
        for (const t of targets) expect(overlap(t, link), `${t.what} under the link, ${where}`).toBe(false);
        for (const b of buttons) expect(overlap(b, floorBox(l.floor)), `the ball can land on ${b.what}, ${where}`).toBe(false);
        expect(l.floor.x1, where).toBeGreaterThan(l.floor.x0 + 200);
        expect(l.floor.y1, where).toBeGreaterThanOrEqual(l.floor.y0);
        // The companion and the ball stand on the grass.
        expect(l.stage.y, where).toBeGreaterThan(l.backdrop.floorTop);
        expect(l.floor.y0, where).toBeGreaterThan(l.backdrop.floorTop);
      }
    }
  });

  it('covers the view with the backdrop', () => {
    for (const v of VIEWS) {
      const { backdrop: b } = homeLayout(v, false);
      expect(1536 * b.scale).toBeGreaterThanOrEqual(v.w - 0.01);
      expect(1024 * b.scale).toBeGreaterThanOrEqual(v.h - 0.01);
    }
  });
});

describe('the creature play layout', () => {
  it('fits Back, Home, the ball, the picture, the tune and the basket apart, with Back and Home at least 120 apart', () => {
    expect(HOME_BUTTON.x - BACK.x).toBeGreaterThanOrEqual(120);
    for (const v of VIEWS) {
      const l = playLayout(v);
      const where = `${v.w}×${v.h}`;
      const buttons = [disc(l.back, CORNER_RADIUS, 'back'), disc(l.home, CORNER_RADIUS, 'home'), rect(l.board, BOARD.w, BOARD.h, 'board'), rect(l.plaque, PLAQUE.w, PLAQUE.h, 'plaque'), rect(l.basket, BASKET.w, BASKET.h, 'basket')];
      check(v, [...buttons, body(l.stage), disc(l.ball, BALL_RADIUS, 'ball')], [floorBox(l.floor)], where);
      for (const b of buttons) expect(overlap(b, floorBox(l.floor)), `the ball can land on ${b.what}, ${where}`).toBe(false);
      expect(l.floor.x1, where).toBeGreaterThan(l.floor.x0 + 200);
      expect(l.stage.y, where).toBeGreaterThan(l.backdrop.floorTop);
      expect(l.floor.y0, where).toBeGreaterThan(l.backdrop.floorTop);
    }
  });
});

describe('the Explore picker layout', () => {
  it('fits one to eleven 150-unit cards and Back apart, clear of the guide and link corners', () => {
    expect(EXPLORE_CARD).toBeGreaterThanOrEqual(150);
    // A card's name sits under it, inside this much.
    const NAME = 50;
    for (const v of VIEWS) {
      for (let n = 1; n <= EXPLORE_MAX; n++) {
        const l = exploreLayout(v, n);
        const where = `${v.w}×${v.h}, ${n} cards`;
        const cards = l.cards.map((c, i) => ({ ...rect(c, EXPLORE_CARD, EXPLORE_CARD, `card ${i}`), y1: c.y + EXPLORE_CARD / 2 + NAME }));
        check(v, [disc(l.back, CORNER_RADIUS, 'back'), ...cards], [], where);
        const link: Box = { x0: v.w - LINK_CORNER.w, y0: 0, x1: v.w, y1: LINK_CORNER.h, what: 'link corner' };
        for (const c of cards) expect(overlap(c, link), `${c.what} under the link, ${where}`).toBe(false);
      }
    }
    expect(() => exploreLayout(VIEWS[0], EXPLORE_MAX + 1)).toThrow();
  });
});

describe('the Explore entries and pages layout (RW08)', () => {
  it('fits one to four 150-unit cards with their names, Back, Home and both page arrows apart, clear of the corners', () => {
    expect(PAGE_ARROW_RADIUS * 2).toBeGreaterThanOrEqual(120);
    const NAME = 50;
    for (const v of VIEWS) {
      for (let n = 1; n <= 4; n++) {
        const l = exploreGridLayout(v, n);
        const where = `${v.w}×${v.h}, ${n} cards`;
        const cards = l.cards.map((c, i) => ({ ...rect(c, EXPLORE_CARD, EXPLORE_CARD, `card ${i}`), y1: c.y + EXPLORE_CARD / 2 + NAME }));
        check(v, [disc(l.back, CORNER_RADIUS, 'back'), disc(l.home, CORNER_RADIUS, 'home'), ...cards, disc(l.prev, PAGE_ARROW_RADIUS, 'prev'), disc(l.next, PAGE_ARROW_RADIUS, 'next')], [], where);
        const link: Box = { x0: v.w - LINK_CORNER.w, y0: 0, x1: v.w, y1: LINK_CORNER.h, what: 'link corner' };
        for (const c of cards) expect(overlap(c, link), `${c.what} under the link, ${where}`).toBe(false);
        if (n === 4) expect(new Set(l.cards.map((c) => c.y)).size, where).toBe(v.h > v.w ? 2 : 1);
      }
    }
    expect(() => exploreGridLayout(VIEWS[0], 5)).toThrow();
  });
});

describe('the welcome project page layout', () => {
  it('fits Back, Home, the newcomer and every step card with its Play arrow apart, clear of the corners', () => {
    expect(PROJECT_CARD).toBeGreaterThanOrEqual(150);
    expect(PROJECT_PLAY_RADIUS * 2).toBeGreaterThanOrEqual(120);
    for (const v of VIEWS) {
      for (const n of [2, 3]) {
        const l = projectLayout(v, n);
        const where = `${v.w}×${v.h}, ${n} cards`;
        const targets = [
          disc(l.back, CORNER_RADIUS, 'back'),
          disc(l.home, CORNER_RADIUS, 'home'),
          disc(l.basket, NEWCOMER_REACH, 'newcomer'),
          ...l.cards.map((c, i) => rect(c, PROJECT_CARD, PROJECT_CARD, `card ${i}`)),
          ...l.plays.map((p, i) => disc(p, PROJECT_PLAY_RADIUS, `play ${i}`)),
        ];
        check(v, targets, [], where);
        const link: Box = { x0: v.w - LINK_CORNER.w, y0: 0, x1: v.w, y1: LINK_CORNER.h, what: 'link corner' };
        for (const t of targets.slice(2)) expect(overlap(t, link), `${t.what} under the link, ${where}`).toBe(false);
      }
    }
  });
});
