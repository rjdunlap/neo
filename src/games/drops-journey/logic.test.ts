import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CANT, HEIGHT, LEVEL1_PLACES, MOVES, PAIRS, PLACES, canFinish, distance, here, hintFor, isLawful, journeyLayout, lawful, makeRound,
  moves, offer, step, type Box, type Choice, type Journey, type Place, type Round,
} from './logic';

const go = (j: Journey, c: Choice): Journey => {
  const r = step(j, c);
  if (!('journey' in r)) throw new Error('not lawful');
  return r.journey;
};
const toCard = (from: Place, to: Place): Choice => ({ kind: 'move', ...MOVES[from].find((m) => m.to === to)! });

describe('the table', () => {
  it('every place has a move and a stay, and every move goes somewhere else', () => {
    for (const p of PLACES) {
      expect(MOVES[p].length).toBeGreaterThan(0);
      expect(lawful(3, p).some((c) => c.kind === 'stay')).toBe(true);
      for (const m of MOVES[p]) expect(m.to).not.toBe(p);
    }
    for (const p of LEVEL1_PLACES) {
      const cs = lawful(1, p);
      expect(cs.length).toBeGreaterThanOrEqual(2);
      for (const c of cs) if (c.kind === 'move') expect(LEVEL1_PLACES).toContain(c.to);
    }
  });

  it('drivers agree with heights', () => {
    for (const p of PLACES) for (const m of MOVES[p]) {
      if (m.driver === 'down') expect(HEIGHT[m.to]).toBeLessThan(HEIGHT[p]);
      if (HEIGHT[m.to] > HEIGHT[p]) { expect(m.driver).toBe('warm'); expect(m.to).toBe('cloud'); }
      if (m.process === 'melt') { expect(m.driver).toBe('warm'); expect(HEIGHT[m.to]).toBeLessThan(HEIGHT[p]); }
      if (m.driver === 'cold') expect([p, m.to]).toEqual(['cloud', 'snow']);
    }
  });

  it("can't-go places are uphill, never cloud, and never lawful", () => {
    for (const p of PLACES) for (const to of CANT[p]) {
      expect(MOVES[p].some((m) => m.to === to)).toBe(false);
      expect(HEIGHT[to]).toBeGreaterThan(HEIGHT[p]);
      expect(to).not.toBe('cloud');
    }
  });
});

describe('offered cards', () => {
  const pairOk = (from: Place, c: Choice) => c.kind === 'stay' || (c.kind === 'move' ? MOVES[from].some((m) => m.to === c.to) : CANT[from].includes(c.to));
  for (const level of [1, 2, 3]) {
    it(`level ${level}: only table pairs over 300 seeds, at least two lawful, can't-go only at level 3`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const round = makeRound(level, rng, false);
        let j: Journey = { start: round.start, stops: [] };
        for (let s = 0; s < 8; s++) {
          const from = here(j);
          const cards = offer(level, from, rng);
          for (const c of cards) expect(pairOk(from, c)).toBe(true);
          expect(cards.filter(isLawful).length).toBeGreaterThanOrEqual(2);
          const cants = cards.filter((c) => c.kind === 'cant').length;
          if (level === 3) {
            expect(cards.length).toBe(3);
            expect(cants).toBe(CANT[from].length ? 1 : 0);
          } else expect(cants).toBe(0);
          if (level === 1) for (const c of cards) if (c.kind === 'move') expect(LEVEL1_PLACES).toContain(c.to);
          j = go(j, rng.pick(cards.filter(isLawful)));
        }
      }
    });
  }

  it("level 3's authored first stop is cloud, river (can't go), stay", () => {
    expect(offer(3, 'sea', new Rng(1), true)).toEqual([toCard('sea', 'cloud'), { kind: 'cant', to: 'river', reason: 'uphill' }, { kind: 'stay' }]);
  });
});

describe('one drop', () => {
  it('is always in exactly one place, and a can\'t-go step changes nothing', () => {
    const rng = new Rng(7);
    let j: Journey = { start: 'sea', stops: [] };
    for (let i = 0; i < 40; i++) {
      const cards = offer(3, here(j), rng);
      const cant = cards.find((c) => c.kind === 'cant');
      if (cant) expect(step(j, cant)).toEqual({ wrong: 'uphill' });
      const before = here(j);
      const c = rng.pick(cards.filter(isLawful));
      j = go(j, c);
      expect(PLACES).toContain(here(j));
      if (c.kind === 'stay') expect(here(j)).toBe(before);
      else if (c.kind === 'move') expect(here(j)).toBe(c.to);
    }
  });
});

describe('finishing', () => {
  it('level 1 after three stops (stays count), never needing the start again', () => {
    const r: Round = { level: 1, start: 'sea', goal: null };
    let j: Journey = { start: 'sea', stops: [] };
    j = go(j, toCard('sea', 'cloud')); expect(canFinish(r, j)).toBe(false);
    j = go(j, { kind: 'stay' }); expect(canFinish(r, j)).toBe(false);
    j = go(j, toCard('cloud', 'river')); expect(canFinish(r, j)).toBe(true);
    expect(here(j)).not.toBe(j.start);
  });

  it('level 3 after four moves, stays not counted', () => {
    const r: Round = { level: 3, start: 'sea', goal: null };
    let j: Journey = { start: 'sea', stops: [] };
    for (const [f, t] of [['sea', 'cloud'], ['cloud', 'snow'], ['snow', 'river']] as const) j = go(j, toCard(f, t));
    j = go(j, { kind: 'stay' });
    expect(moves(j)).toBe(3);
    expect(canFinish(r, j)).toBe(false);
    j = go(j, toCard('river', 'cloud'));
    expect(canFinish(r, j)).toBe(true);
  });

  it('level 3: four moves are reachable from every start without returning to it first', () => {
    for (const start of PLACES) {
      // Greedy: always move somewhere other than the start when possible.
      let j: Journey = { start, stops: [] };
      for (let i = 0; i < 4; i++) {
        const ms = lawful(3, here(j)).filter((c) => c.kind === 'move') as Extract<Choice, { kind: 'move' }>[];
        j = go(j, ms.find((m) => m.to !== start) ?? ms[0]);
      }
      expect(canFinish({ level: 3, start, goal: null }, j)).toBe(true);
    }
  });

  it('level 2 on reaching the goal, by any route', () => {
    const r: Round = { level: 2, start: 'sea', goal: 'snow' };
    let j: Journey = { start: 'sea', stops: [] };
    for (const [f, t] of [['sea', 'cloud'], ['cloud', 'river'], ['river', 'sea'], ['sea', 'cloud']] as const) { j = go(j, toCard(f, t)); expect(canFinish(r, j)).toBe(false); }
    j = go(j, toCard('cloud', 'snow'));
    expect(canFinish(r, j)).toBe(true);
  });
});

describe('level 2 postcards and the hint', () => {
  it('the pairs are fixed, each two or three moves', () => {
    expect(PAIRS.map((p) => p.join('>'))).toEqual(['sea>snow', 'snow>ground', 'ground>snow', 'sea>ground', 'river>snow']);
    for (const [a, b] of PAIRS) expect([2, 3]).toContain(distance(a, b));
  });

  it('every goal is reachable from every place, and following the hint takes the shortest route', () => {
    for (const goal of PLACES) for (const from of PLACES) {
      if (from === goal) continue;
      expect(distance(from, goal)).toBeLessThan(Infinity);
      const r: Round = { level: 2, start: from, goal };
      let j: Journey = { start: from, stops: [] };
      let n = 0;
      while (here(j) !== goal && n < 10) {
        const cards = offer(2, here(j), new Rng(1));
        j = go(j, cards[hintFor(r, here(j), cards)]);
        n++;
      }
      expect(n).toBe(distance(from, goal));
      expect(canFinish(r, j)).toBe(true);
    }
  });

  it("level 3's hint never points at a can't-go card", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const p of PLACES) {
        const cards = offer(3, p, rng);
        expect(isLawful(cards[hintFor({ level: 3, start: p, goal: null }, p, cards)])).toBe(true);
      }
    }
  });
});

describe('rounds', () => {
  it('the authored first rounds, and seeded variations from their lists', () => {
    const rng = new Rng(3);
    expect(makeRound(1, rng, true)).toEqual({ level: 1, start: 'sea', goal: null });
    expect(makeRound(2, rng, true)).toEqual({ level: 2, start: 'sea', goal: 'snow' });
    expect(makeRound(3, rng, true)).toEqual({ level: 3, start: 'sea', goal: null });
    for (let s = 1; s <= 100; s++) {
      const r = new Rng(s);
      expect(['sea', 'river']).toContain(makeRound(1, r, false).start);
      const two = makeRound(2, r, false);
      expect(PAIRS.some(([a, b]) => a === two.start && b === two.goal)).toBe(true);
      expect(['sea', 'river', 'ground']).toContain(makeRound(3, r, false).start);
    }
  });
});

describe('layout', () => {
  const VIEWS = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), phone: computeView(844, 390), notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }) };
  const overlap = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) => b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) => b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const count of [2, 3, 4, 5]) {
      it(`${name}, ${count} cards: big targets, inside, apart, corners clear`, () => {
        const l = journeyLayout(v, count)!;
        expect(l).not.toBeNull();
        expect(l.cards.length).toBe(count);
        const targets = [...l.cards, l.book, l.leaf];
        for (const b of targets) {
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          expect(inside(b, v)).toBe(true);
          expect(corner(b, 0, 0, 120, 215)).toBe(false);
          expect(corner(b, 0, v.h - 170, 170, v.h)).toBe(false);
        }
        for (const c of l.cards) { expect(c.w).toBeGreaterThanOrEqual(150); expect(c.h).toBeGreaterThanOrEqual(130); }
        for (let i = 0; i < targets.length; i++) for (let k = i + 1; k < targets.length; k++) expect(overlap(targets[i], targets[k])).toBe(false);
        expect(l.leaf.w).toBeGreaterThanOrEqual(120);
        expect(l.book.w).toBeGreaterThanOrEqual(110);
        for (const p of PLACES) {
          const ring = l.places[p];
          expect(ring.w).toBeGreaterThanOrEqual(100);
          expect(inside(ring, v)).toBe(true);
          for (const c of [...l.cards, l.book, l.leaf]) expect(overlap(ring, c)).toBe(false);
          for (const q of PLACES) if (q !== p) expect(overlap(ring, l.places[q])).toBe(false);
        }
      });
    }
  }
});
