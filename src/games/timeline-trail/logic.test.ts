import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { SCRIPT } from '../../content/voice-script';
import {
  CARD, GAP_H, GAP_W, gapCount, lineLayout, nextCard, overlaps, PLACE_IDS, PLACES, PlaceBag, place, planFor, roundFor, Tally, validGaps,
  type Rect, type Round,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('the places', () => {
  it('have four stages each, every neighbour differing in a named element, with no number, date or time word', () => {
    for (const id of PLACE_IDS) {
      const p = PLACES[id];
      expect(p.stages.length).toBe(4);
      p.stages.forEach((s, i) => {
        expect(s.id).toBe(`${id}-${i}`);
        expect(s.changes.length).toBeGreaterThan(0);
        if (i > 0) expect(s.changes).not.toBe(p.stages[i - 1].changes);
        for (const text of [s.caption, s.changes]) {
          expect(text).not.toMatch(/\d/);
          expect(text).not.toMatch(/\b(year|month|week|day|hour|minute|ago|century)s?\b/i);
        }
        expect(SCRIPT[`trail.card.${s.id}` as keyof typeof SCRIPT]).toBeDefined();
      });
    }
  });

  it('come from a bag that gives all three before any repeats, which rounds share across a session', () => {
    const bag = new PlaceBag(new Rng(7));
    for (let round = 0; round < 5; round++) {
      const seen = new Set([bag.next(), bag.next(), bag.next()]);
      expect(seen.size).toBe(3);
    }
    const places = Array.from({ length: 9 }, (_, i) => roundFor(1 + (i % 3), new Rng(i)).place);
    for (let i = 0; i < 9; i += 3) expect(new Set(places.slice(i, i + 3)).size).toBe(3);
  });
});

describe('rounds', () => {
  it('level 1 shows two loose cards at least one stage apart and nothing hung', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(1, new Rng(seed));
      expect(r.cards.length).toBe(2);
      expect(r.cards[1] - r.cards[0]).toBeGreaterThanOrEqual(2);
      expect(r.hung).toEqual([]);
      expect([...r.loose].sort()).toEqual([...r.cards].sort());
    }
  });

  it('level 2 hangs two of three stages and leaves one loose, which can be any of the three', () => {
    const loosePositions = new Set<number>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(2, new Rng(seed));
      expect(r.cards.length).toBe(3);
      expect(r.hung.length).toBe(2);
      expect(r.loose.length).toBe(1);
      expect([...r.hung, ...r.loose].sort()).toEqual(r.cards);
      loosePositions.add(r.cards.indexOf(r.loose[0]));
    }
    expect([...loosePositions].sort()).toEqual([0, 1, 2]);
  });

  it('level 3 uses every stage, hangs the first and shuffles the other three', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(3, new Rng(seed));
      expect(r.cards).toEqual([0, 1, 2, 3]);
      expect(r.hung).toEqual([0]);
      expect([...r.loose].sort()).toEqual([1, 2, 3]);
      orders.add(r.loose.join(''));
    }
    expect(orders.size).toBe(6);
  });

  it('is the same round for the same seed', () => {
    for (const level of [1, 2, 3]) expect(roundFor(level, new Rng(42), 'tree')).toEqual(roundFor(level, new Rng(42), 'tree'));
  });

  it('clamps levels to the plans', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(9).level).toBe(3);
    expect(planFor(2).name).toBe('Hang it between');
  });
});

/** Every legal build order of a round's loose cards. */
function orders(loose: number[]): number[][] {
  if (loose.length <= 1) return [loose];
  return loose.flatMap((s) => orders(loose.filter((o) => o !== s)).map((rest) => [s, ...rest]));
}

describe('valid gaps and placement', () => {
  it('give every card exactly one valid gap at levels 1–3, and the hung line stays stage-ordered', () => {
    for (const level of [1, 2, 3]) {
      for (let seed = 0; seed < 200; seed++) {
        const r = roundFor(level, new Rng(seed));
        for (const order of orders(r.loose)) {
          let line: number[] = [...r.hung];
          for (const stage of order) {
            const valid = validGaps(r, line, stage);
            expect(valid.length).toBe(1);
            expect(valid[0]).toBeLessThan(gapCount(r, line));
            const res = place(r, line, stage, valid[0]);
            expect(res.ok).toBe(true);
            if (res.ok) line = res.line;
            expect(line).toEqual([...line].sort((a, b) => a - b));
          }
          expect(line).toEqual(r.cards);
        }
      }
    }
  });

  it('answers any other gap with a reason built from the pictures and never changes the line', () => {
    for (const level of [2, 3]) {
      for (let seed = 0; seed < 200; seed++) {
        const r = roundFor(level, new Rng(seed));
        const line = [...r.hung];
        for (const stage of r.loose) {
          const [valid] = validGaps(r, line, stage);
          for (let gap = 0; gap < gapCount(r, line); gap++) {
            if (gap === valid) continue;
            const res = place(r, line, stage, gap);
            expect(res.ok).toBe(false);
            if (res.ok) continue;
            expect(res.line).toEqual(line);
            const stages = PLACES[r.place].stages;
            if (gap < valid) {
              // Too early: it already has what the hung card after the gap lacks.
              expect(res.reason).toContain(`already has the ${stages[stage].changes}`);
              expect(res.reason).toContain(stages[line[gap]].caption);
            } else {
              expect(res.reason).toContain(`has no ${stages[line[gap - 1]].changes} yet`);
              expect(res.reason).toContain(stages[line[gap - 1]].caption);
            }
          }
        }
      }
    }
  });

  it("at level 1 the older card belongs on the left post and the newer called 'long ago' is the only miss", () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = roundFor(1, new Rng(seed));
      const [older, newer] = r.cards;
      expect(gapCount(r, [])).toBe(2);
      expect(validGaps(r, [], older)).toEqual([0]);
      expect(validGaps(r, [], newer)).toEqual([1]);
      const wrong = place(r, [], newer, 0);
      expect(wrong.ok).toBe(false);
      if (!wrong.ok) expect(wrong.reason).toContain(`already has the ${PLACES[r.place].stages[newer].changes}`);
      const right = place(r, [], older, 0);
      expect(right.ok && right.line).toEqual([older]);
      // The other card then belongs on the other post.
      expect(validGaps(r, [older], newer)).toEqual([1]);
      expect(place(r, [older], newer, 1).ok).toBe(true);
    }
  });

  it('the ghost finger takes the oldest loose card, so its build is always legal', () => {
    for (let seed = 0; seed < 100; seed++) {
      const r = roundFor(3, new Rng(seed));
      let line = [...r.hung];
      let loose = [...r.loose];
      while (loose.length) {
        const stage = nextCard(r, loose)!;
        expect(stage).toBe(Math.min(...loose));
        const res = place(r, line, stage, validGaps(r, line, stage)[0]);
        expect(res.ok).toBe(true);
        if (res.ok) line = res.line;
        loose = loose.filter((s) => s !== stage);
      }
      expect(nextCard(r, loose)).toBeNull();
      const r1 = roundFor(1, new Rng(seed));
      expect(nextCard(r1, r1.loose)).toBe(r1.cards[0]);
    }
  });
});

describe('misses and hints', () => {
  it('count one miss per distinct wrong drop and at most one hint per card, from the glow or Show a hint', () => {
    const t = new Tally();
    expect(t.missed(2, 0)).toEqual({ counted: true, lit: false });
    expect(t.missed(2, 0)).toEqual({ counted: false, lit: false });
    expect([t.misses, t.hints, t.glowing]).toEqual([1, 0, null]);
    expect(t.missed(2, 3)).toEqual({ counted: true, lit: true });
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, 2]);
    expect(t.help(2)).toBe(false);
    expect(t.help(2)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    expect(t.missed(2, 1)).toEqual({ counted: true, lit: false });
    expect([t.misses, t.hints]).toEqual([3, 1]);
    t.hung(2);
    expect(t.glowing).toBeNull();
    // Another card: Show a hint first, then its misses add nothing to hints.
    expect(t.help(3)).toBe(true);
    expect(t.missed(3, 0)).toEqual({ counted: true, lit: false });
    expect(t.missed(3, 1)).toEqual({ counted: true, lit: false });
    expect([t.misses, t.hints, t.glowing]).toEqual([5, 2, 3]);
  });

  it('lets the same card and gap count again after another card was hung', () => {
    const t = new Tally();
    t.missed(1, 0);
    t.hung(2);
    expect(t.missed(1, 0).counted).toBe(true);
    expect(t.misses).toBe(2);
  });
});

describe('layout', () => {
  const inside = (r: Rect, w: number, h: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h;

  it('keeps full-size posts, gaps, cards and tray apart and on screen on the iPad, in every line state of every level', () => {
    for (const level of [1, 2, 3]) {
      for (let seed = 0; seed < 20; seed++) {
        const r = roundFor(level, new Rng(seed));
        let line: number[] = [...r.hung];
        let loose = [...r.loose];
        for (;;) {
          for (const [name, v] of Object.entries({ landscape: VIEWS.landscape, portrait: VIEWS.portrait })) {
            const where = `level ${level} seed ${seed} ${name} hung ${line.length}`;
            const l = lineLayout(r, line, loose.length, v);
            expect(l, where).not.toBeNull();
            if (!l) continue;
            expect(l.gaps.length, where).toBe(gapCount(r, line));
            expect(l.cards.length, where).toBe(line.length);
            expect(l.tray.length, where).toBe(loose.length);
            for (const g of l.gaps) { expect(g.w, where).toBeGreaterThanOrEqual(GAP_W); expect(g.h, where).toBeGreaterThanOrEqual(GAP_H); }
            for (const c of [...l.cards, ...l.tray]) expect([c.w, c.h], where).toEqual([CARD, CARD]);
            const all: Rect[] = level === 1 ? [...l.tray, ...l.gaps] : [...l.cards, ...l.gaps, ...l.tray, l.posts.left, l.posts.right];
            for (const a of all) expect(inside(a, v.w, v.h), where).toBe(true);
            for (const a of all) for (const b of all) if (a !== b) expect(overlaps(a, b), where).toBe(false);
            // The pet's corner (bottom-left 150 square) and the home button (top-left 120 square) stay clear of touch targets.
            const pet = { x: 0, y: v.h - 150, w: 150, h: 150 };
            const home = { x: 0, y: 0, w: 120, h: 120 };
            for (const a of [...l.gaps, ...l.tray]) { expect(overlaps(a, pet), where).toBe(false); expect(overlaps(a, home), where).toBe(false); }
            expect(l.rows.length, where).toBeLessThanOrEqual(2);
          }
          if (!loose.length) break;
          const stage = nextCard(r, loose)!;
          line = (place(r, line, stage, validGaps(r, line, stage)[0]) as { line: number[] }).line;
          loose = loose.filter((s) => s !== stage);
          if (level === 1) { line = [...r.cards]; loose = []; }
        }
      }
    }
  });

  it('wraps a level-3 line of three hung cards into two rows in portrait and keeps a level-2 line on one row in landscape', () => {
    const r3: Round = { level: 3, place: 'nest', cards: [0, 1, 2, 3], hung: [0], loose: [1, 2, 3] };
    expect(lineLayout(r3, [0, 1, 2], 1, VIEWS.portrait)!.rows.length).toBe(2);
    expect(lineLayout(r3, [0, 1, 2], 1, VIEWS.landscape)!.rows.length).toBe(2);
    const r2: Round = { level: 2, place: 'tree', cards: [0, 1, 3], hung: [0, 3], loose: [1] };
    expect(lineLayout(r2, [0, 3], 1, VIEWS.landscape)!.rows.length).toBe(1);
  });

  it('returns null rather than shrink on a phone', () => {
    const r3: Round = { level: 3, place: 'shore', cards: [0, 1, 2, 3], hung: [0], loose: [1, 2, 3] };
    for (const v of [VIEWS.phone, VIEWS.notch]) {
      const l = lineLayout(r3, [0], 3, v);
      if (!l) continue;
      for (const c of [...l.cards, ...l.tray]) expect([c.w, c.h]).toEqual([CARD, CARD]);
    }
  });
});
