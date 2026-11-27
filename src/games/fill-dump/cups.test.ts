import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { fillDump } from './index';
import {
  BOWL_HEIGHT,
  BOWL_HIT,
  BOWL_WIDTH,
  CUPS_PAIRS,
  CUPS_RANGE,
  TALLY_CARD,
  TUB_HIT,
  bowlHeight,
  cupsBowl,
  cupsLayout,
  cupsMore,
  cupsNext,
  cupsPair,
  cupsPairs,
  cupsTub,
  describeFill,
  kindFor,
  startCups,
  type CupsState,
} from './logic';

/** Fill both bowls of the current pair by scoop-and-pour, the way the ghost finger does. */
function fillPair(s: CupsState) {
  let taps = 0;
  while (s.phase === 'fill' && taps < 40) {
    const next = cupsNext(s)!;
    if (next === 'tub') cupsTub(s);
    else cupsBowl(s, next);
    taps++;
  }
  return taps;
}

describe('How many cups (level 9)', () => {
  it('seeds two pairs of whole, different counts from 2 to 6, with the bigger on each side once', () => {
    const counts = new Set<number>();
    for (let seed = 0; seed < 300; seed++) {
      const pairs = cupsPairs(new Rng(seed));
      expect(pairs).toEqual(cupsPairs(new Rng(seed)));
      expect(pairs).toHaveLength(CUPS_PAIRS);
      expect(new Set(pairs.map(cupsMore))).toEqual(new Set([0, 1]));
      for (const p of pairs) {
        expect(p[0].cups).not.toBe(p[1].cups);
        for (const b of p) {
          expect(Number.isInteger(b.cups)).toBe(true);
          expect(b.cups).toBeGreaterThanOrEqual(CUPS_RANGE[0]);
          expect(b.cups).toBeLessThanOrEqual(CUPS_RANGE[1]);
          expect(b.width).toBeGreaterThanOrEqual(BOWL_WIDTH[0]);
          expect(b.width).toBeLessThanOrEqual(BOWL_WIDTH[1]);
          expect(bowlHeight(b)).toBeGreaterThanOrEqual(BOWL_HEIGHT[0] - 1);
          expect(bowlHeight(b)).toBeLessThanOrEqual(BOWL_HEIGHT[1] + 1);
          counts.add(b.cups);
        }
      }
    }
    expect([...counts].sort()).toEqual([2, 3, 4, 5, 6]);
  });

  it('makes the tallies match the pours: one stroke per cupful, never past a full bowl', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = startCups(new Rng(seed));
      const p = cupsPair(s);
      // An empty cup and a full cup scooped again change nothing.
      expect(cupsBowl(s, 0).kind).toBe('empty');
      expect(cupsTub(s).kind).toBe('scoop');
      expect(cupsTub(s).kind).toBe('held');
      let pours = 0;
      // Pour everything into bowl 0 first, past its brim: the extra pour is refused and the cup stays full.
      for (let i = 0; i < p[0].cups; i++) {
        if (i > 0) cupsTub(s);
        const ev = cupsBowl(s, 0);
        expect(ev).toMatchObject({ kind: 'pour', side: 0, n: i + 1, full: i + 1 === p[0].cups });
        pours++;
      }
      cupsTub(s);
      expect(cupsBowl(s, 0)).toEqual({ kind: 'brim', side: 0 });
      expect(s.scooped).toBe(true);
      for (let i = 0; i < p[1].cups; i++) {
        if (i > 0) cupsTub(s);
        const ev = cupsBowl(s, 1);
        if (ev.kind !== 'pour') throw new Error('pour');
        expect(ev.ask).toBe(i + 1 === p[1].cups);
        pours++;
      }
      expect(s.poured).toEqual([p[0].cups, p[1].cups]);
      expect(pours).toBe(p[0].cups + p[1].cups);
      expect(s.phase).toBe('answer');
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
  });

  it('judges only the answer: a wrong pick is one miss, the glow comes once per pair after two', () => {
    const s = startCups(new Rng(7));
    fillPair(s);
    const more = cupsMore(cupsPair(s));
    const fewer = more === 0 ? 1 : 0;
    expect(cupsBowl(s, fewer)).toEqual({ kind: 'wrong', hint: false });
    expect(cupsBowl(s, fewer)).toEqual({ kind: 'wrong', hint: true });
    expect(cupsBowl(s, fewer)).toEqual({ kind: 'wrong', hint: false });
    expect([s.misses, s.hints]).toEqual([3, 1]);
    // The scoop is put away while the question stands.
    expect(cupsTub(s).kind).toBe('ignored');
    const p = cupsPair(s);
    expect(cupsBowl(s, more)).toEqual({
      kind: 'right',
      side: more,
      more: p[more].cups,
      fewer: p[fewer].cups,
      done: false,
    });
    expect(s.phase).toBe('fill');
    expect(s.poured).toEqual([0, 0]);
    // The second pair starts fresh: its own two misses bring its own hint.
    fillPair(s);
    const wrong = cupsMore(cupsPair(s)) === 0 ? 1 : 0;
    cupsBowl(s, wrong);
    expect(cupsBowl(s, wrong)).toEqual({ kind: 'wrong', hint: true });
    expect(cupsBowl(s, cupsMore(cupsPair(s)))).toMatchObject({ kind: 'right', done: true });
    expect(s.done).toBe(true);
    expect([s.misses, s.hints]).toEqual([5, 2]);
    expect(cupsBowl(s, 0).kind).toBe('ignored');
  });

  it('lets the ghost finger finish every seed with no miss or hint', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = startCups(new Rng(seed));
      let steps = 0;
      for (let next = cupsNext(s); next !== null && steps < 100; next = cupsNext(s), steps++) {
        if (next === 'tub') cupsTub(s);
        else cupsBowl(s, next);
      }
      expect(s.done).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 0]);
      expect(steps).toBe(s.pairs.reduce((n, p) => n + 2 * (p[0].cups + p[1].cups) + 1, 0));
    }
  });

  it('keeps the tub, both bowls and their tallies apart, in view and clear of the pet in four views', () => {
    for (const [w, h] of [
      [1024, 768],
      [1024, 1365],
      [1365, 768],
      [1663, 768],
    ]) {
      const l = cupsLayout(w, h);
      const boxes = [
        { x: l.tub.x + TUB_HIT.x, y: l.tub.y + TUB_HIT.y, w: TUB_HIT.w, h: TUB_HIT.h },
        ...l.bowls.map((b) => ({ x: b.x + BOWL_HIT.x, y: b.y + BOWL_HIT.y, w: BOWL_HIT.w, h: BOWL_HIT.h })),
      ];
      const cards = l.bowls.map((b) => ({
        x: b.x - TALLY_CARD.w / 2,
        y: l.tally - TALLY_CARD.h / 2,
        w: TALLY_CARD.w,
        h: TALLY_CARD.h,
      }));
      for (const b of boxes) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      for (const b of [...boxes, cards[0], cards[1]]) {
        expect(b.x).toBeGreaterThan(150);
        expect(b.y).toBeGreaterThan(150);
        expect(b.x + b.w).toBeLessThan(w);
        expect(b.y + b.h).toBeLessThan(h - 20);
      }
      const all = [...boxes, ...cards];
      for (let a = 0; a < all.length; a++)
        for (let b = a + 1; b < all.length; b++) {
          const x = all[a],
            y = all[b];
          expect(x.x + x.w <= y.x || y.x + y.w <= x.x || x.y + x.h <= y.y || y.y + y.h <= x.y).toBe(true);
        }
      // The tallest, widest bowl fits its touch box.
      expect(BOWL_HEIGHT[1] + 7).toBeLessThanOrEqual(-BOWL_HIT.y);
      expect(BOWL_WIDTH[1] + 14).toBeLessThanOrEqual(BOWL_HIT.w);
    }
  });

  it('opens at the top of pre-K, routes to the cups game and has every line', () => {
    expect(kindFor(9)).toBe('cups');
    expect(fillDump.levels('prek')).toEqual({ min: 5, max: 9, order: [5, 7, 8, 9] });
    expect(fillDump.levels('preschool').order).not.toContain(9);
    expect(describeFill(9)).toMatch(/How many cups/);
    for (const line of [
      'start',
      'scoopfirst',
      'brim',
      'full',
      'ask',
      'this',
      'that',
      'hint',
      'right',
      'done',
    ])
      expect(SCRIPT).toHaveProperty(`fill.cups.${line}`);
  });
});
