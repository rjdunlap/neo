import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { SCRIPT } from '../../content/voice-script';
import { AMOUNT_WORDS, amountOf, AUTHORED_COMPARE, AUTHORED_LOOK, AUTHORED_SAME, CardRound, compareAnswer, compareBoards, CORNER, differsEnough, inside, later, lit, LOOK_PRESSES, lookStart, lookViews, MIN_DIFFERENCE, moonPlan, moonShape, overlaps, petCorner, PLANS, polygonArea, sameBoards, shownBoxes, STOPS, viewLine, windowLayout, type Board } from './logic';

const seeds = Array.from({ length: 500 }, (_, i) => new Rng(i + 1));
const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const mirror = (k: number) => (STOPS - k) % STOPS;

describe('the model', () => {
  it('lights (1 − cos theta) / 2 of the Moon at every stop, symmetric, dark only at 0 and full only at 4', () => {
    for (let k = 0; k < STOPS; k++) {
      expect(lit(k)).toBeCloseTo((1 - Math.cos((k * Math.PI) / 4)) / 2, 10);
      expect(lit(k)).toBeCloseTo(lit(mirror(k)), 10);
      expect(lit(k) < 1e-9).toBe(k === 0);
      expect(lit(k) > 1 - 1e-9).toBe(k === 4);
    }
    expect(lit(1)).toBeCloseTo(0.146, 2);
    expect(lit(2)).toBeCloseTo(0.5, 10);
    expect(lit(3)).toBeCloseTo(0.854, 2);
  });

  it('moves only forward and wraps around', () => {
    for (let k = 0; k < STOPS; k++) expect(later(k)).toBe((k + 1) % STOPS);
    expect(later(7)).toBe(0);
  });

  it('names five fixed amounts and never a phase, night or reason', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(amountOf)).toEqual(['none', 'slice', 'half', 'most', 'full', 'most', 'half', 'slice']);
    expect(Object.values(AMOUNT_WORDS)).toEqual(['no light', 'a little light', 'half', 'most', 'all']);
    const lines = Object.entries(SCRIPT).filter(([id]) => id.startsWith('moonwindow.') || id === 'game.moon-window').flatMap(([, v]) => v as string[]);
    expect(lines.length).toBeGreaterThan(10);
    for (const line of lines) expect(line, line).not.toMatch(/phase|waxing|waning|crescent|gibbous|night|tonight|tomorrow|because|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);
    for (let k = 0; k < STOPS; k++) expect(SCRIPT[viewLine(k)]).toBeDefined();
  });
});

describe('drawing a stop', () => {
  const r = 90;
  const disk = Math.PI * r * r;

  it('lights exactly half the disk at k 2 and 6, all of it at 4 and none at 0', () => {
    expect(moonShape(0, r)).toEqual([]);
    expect(polygonArea(moonShape(4, r, 200)) / disk).toBeCloseTo(1, 2);
    for (const k of [2, 6]) expect(polygonArea(moonShape(k, r, 200)) / disk).toBeCloseTo(0.5, 2);
  });

  it('lights the lit fraction of the disk at every stop, with an ellipse terminator rather than a wedge', () => {
    for (let k = 0; k < STOPS; k++) {
      const area = polygonArea(moonShape(k, r, 400)) / disk;
      expect(Math.abs(area - lit(k)), `k ${k}`).toBeLessThan(0.02);
    }
    // A pie wedge of the same lit fraction would put the terminator at the center; the crescent's bulges toward its lit side.
    const crescent = moonShape(1, r);
    expect(crescent.every((p) => p.x >= -1e-9)).toBe(true);
    expect(crescent.some((p) => p.x > 5 && Math.abs(p.y) < r * 0.5 && p.x < r * 0.9)).toBe(true);
  });

  it('lights the right side as the Moon fills and the left as it empties, one fixed convention', () => {
    const centroidX = (k: number) => moonShape(k, r).reduce((s, p) => s + p.x, 0) / moonShape(k, r).length;
    for (const k of [1, 2, 3]) expect(centroidX(k), `k ${k}`).toBeGreaterThan(5);
    for (const k of [5, 6, 7]) expect(centroidX(k), `k ${k}`).toBeLessThan(-5);
    // The outer edge of the lit part is the Moon's own edge on the lit side; a mostly lit Moon's terminator reaches into the other side.
    expect(moonShape(3, r).some((p) => p.x < -5)).toBe(true);
    expect(moonShape(1, r).some((p) => p.x < -1e-9)).toBe(false);
  });
});

describe('level 1, Look again', () => {
  it('shows four views in model order with a lit view among the first two, over 500 seeds', () => {
    for (const rng of seeds) {
      const views = lookViews(lookStart(rng, false));
      expect(views).toHaveLength(LOOK_PRESSES + 1);
      for (let i = 1; i < views.length; i++) expect(views[i]).toBe(later(views[i - 1]));
      expect(lit(views[0]) > 0 || lit(views[1]) > 0).toBe(true);
    }
  });

  it('opens its authored round on a thin slice, then half, most and full', () => {
    expect(lookViews(lookStart(new Rng(3), true))).toEqual([1, 2, 3, 4]);
    expect(AUTHORED_LOOK).toBe(1);
  });

  it('has nothing to get wrong: the plan has no cards', () => {
    expect(moonPlan(1).mode).toBe('look');
    expect(PLANS.map((p) => p.mode)).toEqual(['look', 'same', 'compare']);
    expect(moonPlan(0).level).toBe(1);
    expect(moonPlan(9).level).toBe(3);
  });
});

const checkPair = (cards: [number, number]) => {
  for (const k of cards) expect(k).toBeGreaterThanOrEqual(1);
  expect(cards[0]).not.toBe(cards[1]);
  expect(Math.abs(lit(cards[0]) - lit(cards[1]))).toBeGreaterThanOrEqual(MIN_DIFFERENCE - 1e-9);
  expect(cards[1]).not.toBe(mirror(cards[0]));
};

describe('level 2, Same view', () => {
  it('lays two boards with different targets, one matching card and one that differs enough in lit amount, over 500 seeds', () => {
    for (const rng of seeds) {
      const boards = sameBoards(rng, false);
      expect(boards).toHaveLength(2);
      expect(boards[0].target).not.toBe(boards[1].target);
      for (const b of boards) {
        expect(b.cards[b.answer]).toBe(b.target);
        expect(b.cards.filter((k) => k === b.target)).toHaveLength(1);
        checkPair(b.cards);
      }
    }
  });

  it('never pairs mostly lit with full, mirrored twins, or shows the new Moon', () => {
    expect(differsEnough(3, 4)).toBe(false);
    expect(differsEnough(1, 7)).toBe(false);
    expect(differsEnough(2, 6)).toBe(false);
    expect(differsEnough(3, 5)).toBe(false);
    expect(differsEnough(1, 2)).toBe(true);
    expect(differsEnough(2, 4)).toBe(true);
    for (const rng of seeds) for (const b of sameBoards(rng, false)) expect(b.cards.includes(0)).toBe(false);
  });

  it('opens its authored round on a half Moon against a thin slice, then a full Moon against a slice', () => {
    expect(sameBoards(new Rng(5), true)).toEqual(AUTHORED_SAME);
    expect(AUTHORED_SAME).toEqual([{ cards: [1, 2], answer: 1, target: 2 }, { cards: [4, 1], answer: 0, target: 4 }]);
    for (const b of AUTHORED_SAME) checkPair(b.cards);
  });
});

describe('level 3, More light', () => {
  it('asks three comparisons with both requests, a unique answer, and the answer not always on one side, over 500 seeds', () => {
    for (const rng of seeds) {
      const boards = compareBoards(rng, false);
      expect(boards).toHaveLength(3);
      expect(new Set(boards.map((b) => b.ask)).size).toBe(2);
      expect(new Set(boards.map((b) => b.answer)).size).toBe(2);
      for (const b of boards) {
        checkPair(b.cards);
        expect(b.answer).toBe(compareAnswer(b.cards, b.ask!));
        const want = b.ask === 'more' ? Math.max(lit(b.cards[0]), lit(b.cards[1])) : Math.min(lit(b.cards[0]), lit(b.cards[1]));
        expect(lit(b.cards[b.answer])).toBe(want);
        // Mirroring either Moon never changes the answer: the lit amount alone decides.
        const mirrored: [number, number] = [mirror(b.cards[0]), b.cards[1]];
        expect(compareAnswer(mirrored, b.ask!)).toBe(b.answer);
        expect(compareAnswer([b.cards[0], mirror(b.cards[1])], b.ask!)).toBe(b.answer);
      }
    }
  });

  it('opens its authored round on full against a slice (more), then most against half (less)', () => {
    const boards = compareBoards(new Rng(7), true);
    expect(boards.slice(0, 2)).toEqual(AUTHORED_COMPARE);
    expect(AUTHORED_COMPARE).toEqual([{ cards: [4, 1], answer: 0, ask: 'more' }, { cards: [3, 2], answer: 1, ask: 'less' }]);
    checkPair(boards[2].cards);
  });
});

describe('accounting', () => {
  const boards = (): Board[] => [{ cards: [1, 2], answer: 1, target: 2 }, { cards: [4, 1], answer: 0, target: 4 }];

  it('counts one miss per board and no hint when the glow follows a miss', () => {
    const r = new CardRound(boards());
    expect(r.tap(0)).toBe('wrong');
    expect(r.glowing).toBe(true);
    expect(r.tap(0)).toBe('ignore');
    r.ask();
    expect([r.misses, r.hints]).toEqual([1, 0]);
    expect(r.tap(1)).toBe('right');
    expect(r.index).toBe(1);
    expect(r.glowing).toBe(false);
    expect(r.tap(0)).toBe('right');
    expect(r.finished).toBe(true);
    expect(r.tap(0)).toBe('ignore');
    expect([r.misses, r.hints]).toEqual([1, 0]);
  });

  it('counts Show a hint once per board before any tap, and nothing more on that board', () => {
    const r = new CardRound(boards());
    r.ask();
    r.ask();
    expect([r.misses, r.hints]).toEqual([0, 1]);
    expect(r.hintFor()).toBe(1);
    expect(r.glowing).toBe(true);
    expect(r.tap(1)).toBe('right');
    r.ask();
    expect([r.misses, r.hints]).toEqual([0, 2]);
  });

  it('starts again from the first board and keeps the counts', () => {
    const r = new CardRound(boards());
    r.tap(0);
    r.tap(1);
    r.restart();
    expect(r.index).toBe(0);
    expect(r.glowing).toBe(false);
    expect([r.misses, r.hints]).toEqual([1, 0]);
  });
});

describe('the layout', () => {
  it('fits every control at size, without overlaps, clear of the corners and inside the view, at every level and view', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      for (const level of [1, 2, 3]) {
        const L = windowLayout(view, level);
        expect(L, `${name} level ${level}`).not.toBeNull();
        if (!L) continue;
        expect(Math.min(L.window.w, L.window.h)).toBeGreaterThanOrEqual(300);
        expect(Math.min(L.later.w, L.later.h)).toBeGreaterThanOrEqual(140);
        for (const c of L.cards) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(170);
        for (const s of L.ribbon) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(110);
        expect(L.ribbon).toHaveLength(LOOK_PRESSES + 1);
        const boxes = shownBoxes(L, level);
        for (const b of boxes) {
          expect(inside(b, view), `${name} level ${level} ${JSON.stringify(b)}`).toBe(true);
          expect(overlaps(b, petCorner(view)), `${name} level ${level} pet`).toBe(false);
          expect(overlaps(b, { x: 0, y: 0, w: CORNER, h: CORNER }), 'top-left buttons').toBe(false);
          expect(overlaps(b, { x: view.w - CORNER, y: 0, w: CORNER, h: CORNER }), 'top-right button').toBe(false);
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j]), `${name} level ${level} boxes ${i},${j}`).toBe(false);
        // Both Moons at level 3 are drawn at one radius, the window's; level 2's cards are a little smaller.
        if (level === 3) expect(L.cardMoonR).toBe(L.moonR);
        else expect(L.cardMoonR).toBeLessThan(L.moonR);
        expect(L.cardMoonR * 2 + 20).toBeLessThanOrEqual(L.cards[0].w);
      }
    }
  });

  it('refuses rather than shrinks when a view cannot fit', () => {
    expect(windowLayout({ w: 700, h: 500, scale: 1 }, 1)).toBeNull();
  });
});
