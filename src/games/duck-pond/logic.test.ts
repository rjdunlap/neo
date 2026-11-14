import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder } from '../../progress/difficulty';
import { duckPond } from './index';
import {
  BIG_DUCK_SPOT,
  FRIEND_SLOTS,
  LEVELS,
  planFor,
  HIDING_SLOTS,
  hidingRevealSlots,
  numberSentence,
  stickerDucks,
  bankSize,
  duckMove,
  hidingPuzzle,
  padValues,
  PLANS,
  SLOTS,
  story,
} from './logic';
import {
  tenStarts,
  layoutFor,
  howManyAnswers,
  countingOrder,
  dotRows,
  DUCK_GAP,
  PAD_DOT_GAP,
  PAD_DOT_R,
  PAD_DOT_Y,
  PAD_R,
} from './logic';

describe('Duck Pond', () => {
  it('preserves the historical duck count for sticker seeds 0–99', () => {
    expect(Array.from({ length: 100 }, (_, seed) => stickerDucks(new Rng(seed)))).toMatchSnapshot();
  });

  it('reveals exactly the hidden part into distinct seats inside the pond, clear of visible ducks', () => {
    for (let total = 5; total <= 10; total++) {
      for (let hidden = 1; hidden <= Math.min(5, total - 1); hidden++) {
        const visible = total - hidden;
        const slots = hidingRevealSlots({ total, visible, hidden });
        expect(slots).toHaveLength(hidden);
        const all = [...HIDING_SLOTS.slice(0, visible), ...slots];
        expect(new Set(all.map(([x, y]) => `${x},${y}`)).size).toBe(total);
        for (const [i, [x, y]] of all.entries()) {
          expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
          for (const [xx, yy] of all.slice(i + 1))
            expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  it('writes the right operation and answer for every story and whole-part question', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'add')) {
      for (let seed = 1; seed <= 400; seed++) {
        const { a, b, away, answer } = story(new Rng(seed), plan);
        expect(numberSentence(a, b, away)).toBe(`${a} ${away ? '−' : '+'} ${b} = ${answer}`);
      }
    }
    for (let a = 3; a <= 9; a++) expect(numberSentence(a, 10 - a)).toBe(`${a} + ${10 - a} = 10`);
    for (let seed = 1; seed <= 400; seed++) {
      const { visible, hidden, total } = hidingPuzzle(new Rng(seed), PLANS[10]);
      expect(numberSentence(visible, hidden)).toBe(`${visible} + ${hidden} = ${total}`);
    }
  });

  it('offers three different nearby numbers including the answer', () => {
    for (let answer = 1; answer <= 10; answer++) {
      for (let seed = 1; seed <= 50; seed++) {
        const pads = padValues(new Rng(seed), answer);
        expect(pads).toHaveLength(3);
        expect(new Set(pads).size).toBe(3);
        expect(pads).toContain(answer);
        for (const v of pads) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(10);
          expect(Math.abs(v - answer)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('tells adding and taking-away stories with room on the pond and at least one duck left', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'add')) {
      let away = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const s = story(new Rng(seed), plan);
        expect(s.b).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeLessThanOrEqual(plan.max);
        // Every duck that is ever on the water has its own place.
        expect(s.away ? s.a : s.a + s.b).toBeLessThanOrEqual(SLOTS.length);
        if (s.away) {
          away++;
          expect(s.answer).toBe(s.a - s.b);
        } else expect(s.answer).toBe(s.a + s.b);
      }
      expect(away > 0).toBe(!!plan.subtract);
    }
  });

  it('Bye-bye ducks is one song of five ducks, placed first for lap and toddler', () => {
    const plan = PLANS[11];
    expect(plan.mode).toBe('bye');
    expect(plan.rounds).toBe(1);
    expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
    // Seats for five are at least 106 apart, so each duck's 106-unit target stays its own.
    const seats = SLOTS.slice(0, plan.max);
    for (const [i, a] of seats.entries())
      for (const b of seats.slice(i + 1))
        expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThanOrEqual(106);
  });

  it('has room for every duck asked about, and a spare on the bank so stopping is a choice', () => {
    for (const plan of PLANS) {
      expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
      if (plan.mode === 'make') expect(bankSize(plan)).toBeGreaterThan(plan.max);
    }
  });

  it("make-ten rounds start with 3 to 9 ducks, so 1 to 7 more always fit the pond's ten places", () => {
    const plan = PLANS.find((p) => p.mode === 'ten')!;
    for (let seed = 1; seed <= 200; seed++) {
      const starts = tenStarts(new Rng(seed), plan);
      expect(starts).toHaveLength(plan.rounds);
      starts.forEach((a, i) => {
        expect(a).toBeGreaterThanOrEqual(3);
        expect(a).toBeLessThanOrEqual(9);
        expect(SLOTS.length).toBe(10);
        if (i > 0) expect(a).not.toBe(starts[i - 1]);
      });
    }
  });

  it('hiding rounds use totals from 5 to 10, with visible and hidden parts that add to the whole', () => {
    const plan = PLANS.find((p) => p.mode === 'hide')!;
    for (let seed = 1; seed <= 1000; seed++) {
      const puzzle = hidingPuzzle(new Rng(seed), plan);
      expect(puzzle.total).toBeGreaterThanOrEqual(5);
      expect(puzzle.total).toBeLessThanOrEqual(10);
      expect(puzzle.hidden).toBeGreaterThanOrEqual(1);
      expect(puzzle.hidden).toBeLessThanOrEqual(5);
      expect(puzzle.visible).toBeGreaterThanOrEqual(1);
      expect(puzzle.visible + puzzle.hidden).toBe(puzzle.total);
      const pads = padValues(new Rng(seed + 9000), puzzle.hidden);
      expect(duckMove(plan, 0, puzzle.total, 0, pads, puzzle.hidden)).toEqual({
        pad: pads.indexOf(puzzle.hidden),
      });
    }
  });

  it("gives the ghost finger's bot only right moves: every duck when counting along, exactly as many as the sign says, or the pad with the answer", () => {
    for (const plan of PLANS) {
      for (let want = plan.min; want <= plan.max; want++) {
        if (plan.mode === 'along') {
          let bank = plan.max;
          let swimming = 0;
          while (duckMove(plan, bank, swimming, 0, [], 0) === 'duck') (bank--, swimming++);
          expect(swimming).toBe(plan.max);
        } else if (plan.mode === 'friends') {
          let swimming = 0;
          while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming++;
          expect(swimming).toBe(plan.max);
        } else if (plan.mode === 'bye') {
          let swimming = plan.max;
          while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming--;
          expect(swimming).toBe(0);
        } else if (plan.mode === 'make') {
          let bank = bankSize(plan);
          let swimming = 0;
          while (duckMove(plan, bank, swimming, want, [], 0) === 'duck') (bank--, swimming++);
          expect(swimming, `${plan.mode} ${want}`).toBe(want);
          expect(bank).toBeGreaterThan(0);
        } else {
          for (let seed = 1; seed <= 20; seed++) {
            const pads = padValues(new Rng(seed), want);
            const move = duckMove(plan, 0, want, 0, pads, want);
            expect(move).toEqual({ pad: pads.indexOf(want) });
            expect(duckMove(plan, 0, want, 0, [], want)).toBeNull();
          }
        }
      }
    }
  });

  it('level 13, one big duck, is appended to the ladder so levels 1–12 keep their plans', () => {
    expect(PLANS).toHaveLength(13);
    expect(PLANS.slice(0, 12).map((p) => p.mode)).toEqual([
      'along',
      'along',
      'make',
      'make',
      'make',
      'howmany',
      'howmany',
      'add',
      'add',
      'ten',
      'hide',
      'bye',
    ]);
    expect(planFor(13)).toMatchObject({ mode: 'friends', rounds: 1, max: 5 });
  });

  it('level 13 is lap’s first level, ahead of bye-bye ducks; no other band lists it', () => {
    expect(levelsInOrder(LEVELS.lap!).slice(0, 4)).toEqual([13, 12, 1, 2]);
    expect(firstLevel(LEVELS.lap!)).toBe(13);
    expect(levelsInOrder(LEVELS.toddler!).slice(0, 2)).toEqual([12, 1]);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(13);
  });

  it('carried past a birthday, level 13 starts toddler at its easiest level, not its hardest', () => {
    expect(duckPond.entryLevels).toContain(13);
    expect(landing(13, LEVELS.toddler!, duckPond.entryLevels)).toBe(levelsInOrder(LEVELS.toddler!)[0]);
  });

  it('level 13 has a place on the pond for each of five friends, clear of each other and of the big duck', () => {
    const plan = planFor(13);
    expect(FRIEND_SLOTS).toHaveLength(plan.max);
    for (const [i, [x, y]] of FRIEND_SLOTS.entries()) {
      expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
      // The big duck's ripple is an ellipse 158 by 62 units around its spot, and a friend's is 66 by 26: they never overlap.
      const [dx, dy] = [x - BIG_DUCK_SPOT[0], y - BIG_DUCK_SPOT[1]];
      expect((dx / (158 + 66)) ** 2 + (dy / (62 + 26)) ** 2).toBeGreaterThanOrEqual(1);
      for (const [xx, yy] of FRIEND_SLOTS.slice(i + 1))
        expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(100);
    }
  });

  it('level 13: every touch brings a friend until there are five, and then the ghost finger rests', () => {
    const plan = planFor(13);
    let swimming = 0;
    while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming++;
    expect(swimming).toBe(5);
  });
});

describe('Duck Pond arrangements, zero and dotted pads (levels 6–7)', () => {
  const six = planFor(6);
  const seven = planFor(7);

  it('deals every number a layout of exactly that many distinct places inside the pond, a duck apart', () => {
    for (const plan of [six, seven])
      for (let n = 0; n <= plan.max; n++)
        for (let seed = 0; seed < 150; seed++) {
          const { kind, slots } = layoutFor(new Rng(seed * 31 + n), plan, n);
          expect(slots).toHaveLength(n);
          if (n === 0) expect(kind).toBe('none');
          else expect(plan.layouts).toContain(kind);
          if (kind === 'dice') expect(n).toBeLessThanOrEqual(6);
          for (const [i, [x, y]] of slots.entries()) {
            expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
            for (const [xx, yy] of slots.slice(i + 1))
              expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(DUCK_GAP);
          }
        }
  });

  it('uses dice and rows at level 6 and adds a real scatter at level 7, for every number up to 8', () => {
    const kinds = (plan: typeof six, n: number) =>
      new Set(Array.from({ length: 60 }, (_, s) => layoutFor(new Rng(s), plan, n).kind));
    for (let n = 1; n <= 5; n++) expect([...kinds(six, n)].sort()).toEqual(['dice', 'rows']);
    for (let n = 2; n <= 8; n++) expect(kinds(seven, n).has('scatter')).toBe(true);
    expect(kinds(seven, 8).has('dice')).toBe(false);
  });

  it('counts in the layout’s own order: back row first, left to right, each duck once', () => {
    for (let n = 1; n <= 8; n++)
      for (let seed = 0; seed < 60; seed++) {
        const { slots } = layoutFor(new Rng(seed), seven, n);
        expect(countingOrder(slots)).toEqual(slots);
        expect(new Set(slots.map(([x, y]) => `${x},${y}`)).size).toBe(n);
      }
    // Five and five fills the top row first.
    const rows = layoutFor(new Rng(1), { ...six, layouts: ['rows'] }, 7).slots;
    expect(rows.slice(0, 5).every(([, y]) => y === rows[0][1])).toBe(true);
    expect(rows[5][1]).toBeGreaterThan(rows[0][1]);
  });

  it('has at most one empty pond in a level, never first, never two numbers alike running', () => {
    let zeros = 0;
    for (const plan of [six, seven])
      for (let seed = 0; seed < 300; seed++) {
        const a = howManyAnswers(new Rng(seed), plan);
        expect(a).toHaveLength(plan.rounds);
        expect(a[0]).not.toBe(0);
        expect(a.filter((n) => n === 0).length).toBeLessThanOrEqual(1);
        for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
        for (const n of a)
          if (n) (expect(n).toBeGreaterThanOrEqual(plan.min), expect(n).toBeLessThanOrEqual(plan.max));
        if (a.includes(0)) zeros++;
      }
    expect(zeros).toBeGreaterThan(200);
    // A level without zero rounds never deals one.
    for (let seed = 0; seed < 50; seed++)
      expect(howManyAnswers(new Rng(seed), planFor(1)).includes(0)).toBe(false);
  });

  it('puts 0 on the pads only where a level has zero rounds, and 0 with 1 and 2 for an empty pond', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect([...padValues(new Rng(seed), 0, 0)].sort()).toEqual([0, 1, 2]);
      for (let answer = 1; answer <= 10; answer++) {
        const zeroLevel = padValues(new Rng(seed), answer, 0);
        expect(zeroLevel).toContain(answer);
        expect(new Set(zeroLevel).size).toBe(3);
        expect(Math.min(...zeroLevel)).toBeGreaterThanOrEqual(0);
        expect(Math.min(...padValues(new Rng(seed), answer))).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('gives each dotted pad exactly its number of dots, in fives, inside a pad over 100 across', () => {
    expect(six.padDots && seven.padDots).toBe(true);
    expect(planFor(8).padDots).toBeFalsy();
    for (let n = 0; n <= 10; n++) {
      const dots = dotRows(n, PAD_DOT_GAP);
      expect(dots).toHaveLength(n);
      expect(dots.filter(([, y]) => y === 0)).toHaveLength(Math.min(5, n));
      for (const [x, y] of dots) expect(Math.hypot(x, PAD_DOT_Y + y) + PAD_DOT_R).toBeLessThanOrEqual(PAD_R);
    }
    expect(2 * PAD_R).toBeGreaterThanOrEqual(100);
  });

  it('a capable child still touches the pad with the answer, zero included', () => {
    expect(duckMove(six, 0, 0, 0, [2, 0, 1], 0)).toEqual({ pad: 1 });
  });
});
