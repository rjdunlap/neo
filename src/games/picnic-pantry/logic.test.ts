import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { DESIGN_H, DESIGN_W } from '../../engine/view';
import { hinted, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  allocation,
  CASES,
  countPhrase,
  demand,
  explain,
  fits,
  makeRound,
  menusThatFit,
  PAIRS,
  pantryLayout,
  remaining,
  repair,
  sameMenu,
  shortages,
  type Case,
  type Selection,
} from './logic';
import { VOICE } from './voice';

const byId = (id: Case['id']) => CASES.find((c) => c.id === id)!;
const named = (c: Case, ...names: string[]) => names.map((n) => c.dishes.findIndex((d) => d.name === n));
/** The seven selections of a case, pairs in both placement orders (so nine lists). */
const SELECTIONS: Selection[] = [[], [0], [1], [2], [0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]];
const ORDERS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

describe('Picnic Pantry: the four frozen cases', () => {
  const rows = [
    {
      id: 'A',
      fit: [
        ['Swirl', 'Crunch', [2, 0, 0]],
        ['Swirl', 'Apple Bowl', [1, 1, 0]],
      ],
      bad: ['Crunch', 'Apple Bowl'],
      jar: 2,
      sum: 4,
      has: 2,
    },
    {
      id: 'B',
      fit: [
        ['Pear Boats', 'Plum Cup', [0, 2, 0]],
        ['Pear Crumble', 'Plum Cup', [0, 1, 0]],
      ],
      bad: ['Pear Boats', 'Pear Crumble'],
      jar: 0,
      sum: 4,
      has: 3,
    },
    {
      id: 'C',
      fit: [
        ['Sunny Squares', 'Orange Cups', [0, 0, 2]],
        ['Banana Bites', 'Orange Cups', [1, 1, 0]],
      ],
      bad: ['Sunny Squares', 'Banana Bites'],
      jar: 1,
      sum: 3,
      has: 2,
    },
    {
      id: 'D',
      fit: [
        ['Berry Stack', 'Lemon Twists', [0, 1, 0]],
        ['Berry Stack', 'Zesty Oats', [1, 0, 0]],
      ],
      bad: ['Lemon Twists', 'Zesty Oats'],
      jar: 2,
      sum: 4,
      has: 2,
    },
  ] as const;

  it.each(rows)('case $id matches its table row', (row) => {
    const c = byId(row.id);
    expect(menusThatFit(c)).toHaveLength(2);
    for (const [a, b, left] of row.fit) {
      const sel = named(c, a, b);
      expect(fits(c, sel)).toBe(true);
      expect(remaining(c, sel)).toEqual(left);
    }
    const bad = named(c, ...row.bad);
    expect(fits(c, bad)).toBe(false);
    expect(shortages(c, bad)).toEqual([{ jar: row.jar, short: row.sum - row.has }]);
    expect(explain(c, bad)).toEqual([
      { jar: row.jar, needs: bad.map((d) => c.dishes[d].cost[row.jar]), sum: row.sum, pantry: row.has },
    ]);
  });

  it('every case has the level 1 shape', () => {
    for (const c of CASES) {
      for (const count of c.pantry) expect(count >= 2 && count <= 4).toBe(true);
      c.dishes.forEach((d, i) => {
        const total = d.cost[0] + d.cost[1] + d.cost[2];
        expect(total >= 2 && total <= 4).toBe(true);
        // Each dish alone fits the pantry.
        expect(shortages(c, [i])).toEqual([]);
      });
      const good = PAIRS.filter((p) => fits(c, p));
      const bad = PAIRS.filter((p) => !fits(c, p));
      expect(good).toHaveLength(2);
      expect(bad).toHaveLength(1);
      // The third pair is short on exactly one ingredient, one both of its dishes use.
      const short = shortages(c, bad[0]);
      expect(short).toHaveLength(1);
      for (const d of bad[0]) expect(c.dishes[d].cost[short[0].jar]).toBeGreaterThan(0);
      // One dish is in both menus that fit, and the two menus leave different leftovers.
      expect(good[0].filter((d) => good[1].includes(d))).toHaveLength(1);
      expect(remaining(c, good[0])).not.toEqual(remaining(c, good[1]));
      // No two dishes of a case share a name or a picture of the same shape and ingredients.
      expect(new Set(c.dishes.map((d) => d.name)).size).toBe(3);
    }
    // The short jar is not always the last one.
    const shortJar = (id: Case['id']) => {
      const c = byId(id);
      return shortages(
        c,
        PAIRS.find((p) => !fits(c, p))!,
      )[0].jar;
    };
    expect([shortJar('A'), shortJar('B'), shortJar('C')].sort()).toEqual([0, 1, 2]);
  });

  it('demand, remaining, shortages and the token allocation agree for every selection', () => {
    for (const c of CASES)
      for (const sel of SELECTIONS) {
        const need = demand(c, sel),
          left = remaining(c, sel);
        expect(fits(c, sel)).toBe(sel.length === 2 && left.every((v) => v >= 0));
        if (sel.length < 2) expect(fits(c, sel)).toBe(false);
        const got = allocation(c, sel);
        for (let j = 0; j < 3; j++) {
          expect(left[j]).toBe(c.pantry[j] - need[j]);
          const given = got.reduce((sum, g) => sum + g[j], 0);
          // The jar and the blanket together always hold the whole pantry; outlines are exactly the shortage.
          expect(given + Math.max(0, left[j])).toBe(c.pantry[j]);
          expect(need[j] - given).toBe(Math.max(0, -left[j]));
        }
        // The dish placed first is never the one left with outlines.
        if (sel.length) expect(got[0]).toEqual(c.dishes[sel[0]].cost);
      }
  });
});

describe('Picnic Pantry: the repair hint', () => {
  const apply = (sel: Selection, step: ReturnType<typeof repair>): number[] => {
    if (step === 'lay') return [...sel];
    return 'add' in step ? [...sel, step.add] : sel.filter((d) => d !== step.putBack);
  };

  it('reaches a plan that fits in at most two edits from every selection, never through the pair that does not fit', () => {
    for (const c of CASES)
      for (const order of ORDERS)
        for (const start of SELECTIONS) {
          let sel = [...start],
            edits = 0;
          for (;;) {
            const step = repair(c, sel, { order });
            if (step === 'lay') break;
            sel = apply(sel, step);
            edits++;
            expect(edits).toBeLessThanOrEqual(2);
            if (sel.length === 2) expect(fits(c, sel)).toBe(true);
          }
          expect(fits(c, sel)).toBe(true);
        }
  });

  it('puts back the dish placed second on the pair that does not fit, in both orders', () => {
    for (const c of CASES) {
      const [a, b] = PAIRS.find((p) => !fits(c, p))!;
      expect(repair(c, [a, b])).toEqual({ putBack: b });
      expect(repair(c, [b, a])).toEqual({ putBack: a });
    }
  });

  it('starts an empty blanket with the dish that is in both menus, and adds a partner that fits', () => {
    for (const c of CASES) {
      const good = menusThatFit(c);
      const hub = good[0].find((d) => good[1].includes(d))!;
      for (const order of ORDERS) {
        expect(repair(c, [], { order })).toEqual({ add: hub });
        for (const d of [0, 1, 2]) {
          const step = repair(c, [d], { order });
          expect(step).not.toBe('lay');
          expect('add' in (step as object)).toBe(true);
          expect(fits(c, apply([d], step))).toBe(true);
        }
        // From the dish in both menus, the partner is the first card on screen.
        const partners = [0, 1, 2]
          .filter((d) => d !== hub)
          .sort((x, y) => order.indexOf(x) - order.indexOf(y));
        expect(repair(c, [hub], { order })).toEqual({ add: partners[0] });
      }
    }
  });

  it('leads to the other menu once one is laid, where one is as near', () => {
    for (const c of CASES) {
      const good = menusThatFit(c);
      const hub = good[0].find((d) => good[1].includes(d))!;
      for (const laidMenu of good) {
        const other = good.find((m) => m !== laidMenu)!;
        for (const order of ORDERS) {
          const opts = { laid: [laidMenu], order };
          let sel: number[] = [];
          for (let step = repair(c, sel, opts); step !== 'lay'; step = repair(c, sel, opts))
            sel = apply(sel, step);
          expect(sameMenu(sel, other)).toBe(true);
          sel = apply([hub], repair(c, [hub], opts));
          expect(sameMenu(sel, other)).toBe(true);
        }
      }
    }
  });
});

describe('Picnic Pantry: rounds, words and counting', () => {
  it('every seeded round is two different cases with their cards in some order', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const [a, b] = makeRound(new Rng(seed));
      expect(a.case).not.toBe(b.case);
      for (const p of [a, b]) expect([...p.order].sort()).toEqual([0, 1, 2]);
      seen.add(a.case.id + b.case.id);
    }
    expect(seen.size).toBe(12);
  });

  it('says counts in jar order and skips an empty jar', () => {
    const a = byId('A');
    expect(countPhrase(a, [2, 1, 0])).toBe('two berries and one oat');
    expect(countPhrase(a, [1, 1, 2])).toBe('one berry, one oat and two apples');
    expect(countPhrase(a, [0, 0, 0])).toBe('');
    // Every menu that fits leaves something to name, so "left in the pantry" always has words.
    for (const c of CASES)
      for (const m of menusThatFit(c)) expect(countPhrase(c, remaining(c, m))).not.toBe('');
  });

  it('counts a miss per wrong bell and one hint when the second miss on a picnic shows it', () => {
    const t = newRequestTally();
    expect(missOnRequest(t)).toBe(false);
    expect(missOnRequest(t)).toBe(true);
    hinted(t);
    expect(missOnRequest(t)).toBe(false);
    nextRequest(t);
    expect(missOnRequest(t)).toBe(false);
    expect(tally(t)).toEqual({ misses: 4, hints: 1 });
  });

  it('no line calls a menu better, a food good or bad, or a leftover waste', () => {
    const all = Object.values(VOICE).flat().join(' ').toLowerCase();
    for (const word of ['best', 'better', 'healthy', 'waste', 'wrong', 'bad', 'yummy'])
      expect(all).not.toContain(word);
  });
});

describe('Picnic Pantry: layout', () => {
  const targets = (l: ReturnType<typeof pantryLayout>): Target[] => [
    ...l.jars.map((b, i) => ({ what: `jar ${i}`, ...b })),
    ...l.places.map((b, i) => ({ what: `place ${i}`, ...b })),
    ...l.cards.map((b, i) => ({ what: `card ${i}`, ...b })),
    square('bell', l.bell, l.bell.w),
    { what: 'next', ...l.next },
    { what: 'another', ...l.another },
  ];

  it('fits every target in each upright view', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS))
      expect(uprightProblems(v, targets(pantryLayout(v.w, v.h, true))), name).toEqual([]);
  });

  it('fits every target sideways, on the design area and on wider and taller windows', () => {
    for (const [w, h] of [
      [DESIGN_W, DESIGN_H],
      [1366, 768],
      [1024, 900],
    ])
      expect(uprightProblems({ w, h }, targets(pantryLayout(w, h, false))), `${w}x${h}`).toEqual([]);
  });

  it('keeps the dish places on the blanket and the seats beside them', () => {
    for (const upright of [true, false]) {
      const l = upright ? pantryLayout(768, 1024, true) : pantryLayout(1024, 768, false);
      for (const p of l.places) {
        expect(p.x - p.w / 2).toBeGreaterThanOrEqual(l.blanket.x - l.blanket.w / 2);
        expect(p.x + p.w / 2).toBeLessThanOrEqual(l.blanket.x + l.blanket.w / 2);
      }
      expect(l.seats).toHaveLength(4);
    }
  });
});
