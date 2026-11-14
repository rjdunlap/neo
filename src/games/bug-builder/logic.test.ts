import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor, levelsInOrder } from '../../progress/difficulty';
import {
  BUG_PLANS,
  BUG_TOKENS,
  LEVELS,
  bugPuzzle,
  countBoard,
  countCheck,
  countLift,
  countMove,
  countPlaceAt,
  countStamp,
  nextStamp,
  slotAt,
  SLOT_REACH,
  type BugSpot,
  type CountState,
} from './logic';

type Spot = BugSpot & { filled: boolean };
const board = (plan: (typeof BUG_PLANS)[number], seed: number): Spot[] =>
  bugPuzzle(plan, new Rng(seed)).targets.map((s) => ({ ...s, filled: false }));

describe('Bug Builder', () => {
  it('keeps every spot clear of its neighbours, so a stamp let go on one cannot land in another', () => {
    for (const plan of BUG_PLANS) {
      const spots = board(plan, 3);
      for (const a of spots)
        for (const b of spots)
          if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * SLOT_REACH - 1);
    }
  });

  it('finds the empty spot a stamp is let go on, and ignores a filled spot or open ground', () => {
    const spots = board(BUG_PLANS[0], 1);
    expect(slotAt(spots, spots[0].x + 10, spots[0].y - 10)).toBe(spots[0]);
    expect(slotAt(spots, 0, 400)).toBeUndefined();
    spots[0].filled = true;
    expect(slotAt(spots, spots[0].x, spots[0].y)).toBeUndefined();
  });

  it('the ghost finger fills every spot of every matching level with the right color and never a wrong one', () => {
    for (const plan of BUG_PLANS.filter((p) => p.mode !== 'count')) {
      for (let seed = 1; seed <= 50; seed++) {
        const spots = board(plan, seed);
        let stamps = 0;
        for (let next = nextStamp(spots); next; next = nextStamp(spots)) {
          // The tray has a stamp for this color, and letting it go on the spot's middle lands on that spot and no other.
          expect(bugPuzzle(plan, new Rng(seed)).tokens).toContain(next.token);
          expect(slotAt(spots, next.x, next.y)).toBe(next);
          next.filled = true;
          stamps++;
        }
        expect(stamps).toBe(spots.length);
        expect(spots.every((s) => s.filled)).toBe(true);
      }
    }
  });

  it('has a pool big enough for every plan, with no two tokens alike', () => {
    expect(BUG_TOKENS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(BUG_TOKENS.map((t) => `${t.shape}/${t.color}`)).size).toBe(BUG_TOKENS.length);
    for (const plan of BUG_PLANS) expect(plan.colors).toBeLessThanOrEqual(BUG_TOKENS.length);
  });

  it('draws different tokens by seed, never repeating one, and keeps small plans easy to tell apart', () => {
    const seen = new Set<number>();
    for (const plan of BUG_PLANS)
      for (let seed = 1; seed <= 60; seed++) {
        const { tokens, targets } = bugPuzzle(plan, new Rng(seed));
        tokens.forEach((t) => seen.add(t));
        expect(tokens).toHaveLength(plan.colors);
        expect(new Set(tokens).size).toBe(plan.colors);
        expect(targets.every((s) => tokens.includes(s.token))).toBe(true); // a spare stamp in the tray is fine
        if (plan.colors <= 4) {
          expect(new Set(tokens.map((t) => BUG_TOKENS[t].shape)).size).toBe(plan.colors);
          expect(new Set(tokens.map((t) => BUG_TOKENS[t].color)).size).toBe(plan.colors);
        }
      }
    expect(seen.size).toBe(BUG_TOKENS.length);
  });

  it('a copy board is never symmetric by accident, and a mirror board is an exact reflection', () => {
    for (let seed = 1; seed <= 60; seed++)
      for (const plan of BUG_PLANS) {
        const { model, targets } = bugPuzzle(plan, new Rng(seed));
        const at = (spots: BugSpot[], x: number, y: number) =>
          spots.find((s) => s.x === x && s.y === y)?.token;
        if (plan.mode === 'copy') {
          expect(targets).toEqual(model);
          expect(model.some((s) => at(model, -s.x, s.y) !== s.token)).toBe(true);
        }
        if (plan.mode === 'mirror') for (const s of model) expect(at(targets, -s.x, s.y)).toBe(s.token);
      }
  });

  describe('level 8, Count the spots', () => {
    const plan = BUG_PLANS[7];
    const fresh = (seed: number) => countBoard(plan, new Rng(seed));
    /** Play the ghost finger's moves to the end, and say how many moves it took. */
    const follow = (s: CountState, tokens: number[]) => {
      let moves = 0;
      for (let m = countMove(s); m && moves < 20; m = countMove(s), moves++) {
        if ('stamp' in m) {
          const p = s.places[m.stamp];
          expect(countPlaceAt(s, p.x, p.y)).toBe(m.stamp);
          expect(countStamp(s, m.stamp, tokens[moves % tokens.length]).kind).toBe('stamp');
        } else if ('lift' in m) expect(countLift(s, m.lift).kind).toBe('lift');
        else expect(countCheck(s).kind).toBe('done');
      }
      return moves;
    };

    it('is a bare bug of six open places asking for 2 to 5, so one too many always fits', () => {
      expect(plan.mode).toBe('count');
      const wants = new Set<number>();
      for (let seed = 1; seed <= 80; seed++) {
        const { state, tokens } = fresh(seed);
        expect(state.places).toHaveLength(6);
        expect(state.placed.every((t) => t === null)).toBe(true);
        expect(state.want).toBeGreaterThanOrEqual(2);
        expect(state.want).toBeLessThan(state.places.length);
        expect(tokens).toHaveLength(plan.colors);
        wants.add(state.want);
      }
      expect([...wants].sort()).toEqual([2, 3, 4, 5]);
    });

    it("finishes for any arrangement of exactly the sign's number, whatever the stamps and wherever they go", () => {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed * 7);
        const { state, tokens } = fresh(seed);
        const places = rng.shuffle(state.places.map((_, i) => i)).slice(0, state.want);
        for (const p of places) countStamp(state, p, rng.pick(tokens));
        expect(countCheck(state)).toEqual({ kind: 'done' });
        expect(state.wrongChecks).toBe(0);
      }
    });

    it('counts aloud as stamps land; one too many is not a miss, and lifting it off counts back down', () => {
      const { state, tokens } = fresh(3);
      for (let i = 0; i < state.want; i++)
        expect(countStamp(state, i, tokens[0])).toMatchObject({ n: i + 1, over: false });
      expect(countStamp(state, state.want, tokens[1])).toEqual({
        kind: 'stamp',
        n: state.want + 1,
        over: true,
        hint: false,
      });
      expect(state.wrongChecks).toBe(0);
      expect(countStamp(state, state.want, tokens[1]).kind).toBe('ignored'); // a stamped place takes no second stamp
      expect(countLift(state, state.want)).toEqual({ kind: 'lift', n: state.want });
      expect(countLift(state, state.want).kind).toBe('ignored');
      expect(countCheck(state).kind).toBe('done');
      expect(countStamp(state, 5, tokens[0]).kind).toBe('ignored');
    });

    it('a check with the wrong number is a miss that says what the bug has, and the round has one hint at most', () => {
      const { state, tokens } = fresh(5);
      countStamp(state, 0, tokens[0]);
      expect(countCheck(state)).toEqual({ kind: 'wrong', have: 1, hint: false });
      expect(countCheck(state)).toEqual({ kind: 'wrong', have: 1, hint: true });
      expect(countCheck(state)).toEqual({ kind: 'wrong', have: 1, hint: false });
      for (let p = 1; p < 6; p++) countStamp(state, p, tokens[1]);
      expect(state.overs).toBeGreaterThanOrEqual(2);
      expect(state.hinted).toBe(true);
    });

    it('the second over-count brings the hint, and the hinted move leads to the finish', () => {
      for (let seed = 1; seed <= 30; seed++) {
        const { state, tokens } = fresh(seed);
        for (let p = 0; p < 6; p++) countStamp(state, p, tokens[p % tokens.length]);
        expect(state.overs).toBe(6 - state.want);
        expect(state.hinted).toBe(state.overs >= 2);
        expect(countMove(state)).toEqual({ lift: 5 }); // the latest extra stamp
        follow(state, tokens);
        expect(state.done).toBe(true);
        expect(state.wrongChecks).toBe(0);
      }
    });

    it('the ghost finger stamps exactly the number, never too many, then taps the check', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const { state, tokens } = fresh(seed);
        expect(follow(state, tokens)).toBe(state.want + 1);
        expect(state.overs).toBe(0);
        expect(state.done).toBe(true);
      }
    });

    it('sits in preschool and pre-K, after the first mirror level, and never brings the later mirrors into preschool', () => {
      expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([2, 3, 4, 5, 8]);
      expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([4, 5, 8, 6, 7]);
      expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(8);
      expect(levelsInOrder(rangeFor(LEVELS, 'toddler'))).not.toContain(8);
    });
  });
});
