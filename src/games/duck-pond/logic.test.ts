import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { HIDING_SLOTS, hidingRevealSlots, numberSentence, stickerDucks, bankSize, duckMove, hidingPuzzle, padValues, PLANS, SLOTS, story } from './logic';
import { tenStarts } from './logic';

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
          for (const [xx, yy] of all.slice(i + 1)) expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(100);
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

  it('has room for every duck asked about, and a spare on the bank so stopping is a choice', () => {
    for (const plan of PLANS) {
      expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
      if (plan.mode === 'make') expect(bankSize(plan)).toBeGreaterThan(plan.max);
    }
  });

  it('make-ten rounds start with 3 to 9 ducks, so 1 to 7 more always fit the pond\'s ten places', () => {
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
      expect(duckMove(plan, 0, puzzle.total, 0, pads, puzzle.hidden)).toEqual({ pad: pads.indexOf(puzzle.hidden) });
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
});
