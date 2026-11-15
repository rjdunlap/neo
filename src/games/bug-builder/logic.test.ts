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
  fitsKind,
  foldAcross,
  foldBoard,
  sameBug,
  kindBoard,
  kindWords,
  lookAlikes,
  mendBoard,
  mendDiffers,
  mendDrop,
  mendMove,
  mendPlaceAt,
  mendRight,
  mendTap,
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
      expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([4, 5, 8, 9, 6, 7, 10, 11]);
      expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(8);
      expect(levelsInOrder(rangeFor(LEVELS, 'toddler'))).not.toContain(8);
    });
  });
  describe('level 9, Count a kind', () => {
    const plan = BUG_PLANS[8];
    const fresh = (seed: number) => kindBoard(plan, new Rng(seed));

    it('asks for 2 to 4 of one color or one shape, with two stamps of that kind and two of others in the tray', () => {
      expect(plan.mode).toBe('kind');
      const wants = new Set<number>(),
        attrs = new Set<string>();
      for (let seed = 1; seed <= 120; seed++) {
        const { state, tokens } = fresh(seed);
        expect(state.places).toHaveLength(6);
        expect(state.want).toBeGreaterThanOrEqual(2);
        expect(state.want).toBeLessThanOrEqual(4);
        expect(new Set(tokens).size).toBe(4);
        // Every sign has stamps in the tray that satisfy it, and stamps that do not, so the kind is a real choice.
        expect(tokens.filter((t) => fitsKind(state, t))).toHaveLength(2);
        expect(tokens.filter((t) => !fitsKind(state, t))).toHaveLength(2);
        wants.add(state.want);
        attrs.add(state.kind!.attr);
      }
      expect([...wants].sort()).toEqual([2, 3, 4]);
      expect([...attrs].sort()).toEqual(['color', 'shape']);
    });

    it('uses the same six places as the matching levels', () => {
      const { state } = fresh(3);
      expect(state.places).toEqual(board(BUG_PLANS[3], 3).map(({ x, y }) => ({ x, y })));
    });

    it('a stamp of the wrong kind is a miss that never lands, and a finished bug holds exactly the number, all of the kind', () => {
      for (let seed = 1; seed <= 60; seed++) {
        const { state, tokens } = fresh(seed);
        const good = tokens.filter((t) => fitsKind(state, t)),
          bad = tokens.filter((t) => !fitsKind(state, t));
        expect(countStamp(state, 0, bad[0])).toEqual({ kind: 'wrongKind', token: bad[0], hint: false });
        expect(state.placed[0]).toBeNull();
        expect(countStamp(state, 0, bad[1])).toEqual({ kind: 'wrongKind', token: bad[1], hint: true });
        // Either stamp of the kind counts, in any place.
        for (let i = 0; i < state.want; i++) expect(countStamp(state, 5 - i, good[i % 2]).kind).toBe('stamp');
        expect(countCheck(state)).toEqual({ kind: 'done' });
        const on = state.placed.filter((t): t is number => t !== null);
        expect(on).toHaveLength(state.want);
        expect(on.every((t) => fitsKind(state, t))).toBe(true);
      }
    });

    it('keeps one hint per round across wrong kinds, over-counts and wrong checks', () => {
      const { state, tokens } = fresh(7);
      const good = tokens.find((t) => fitsKind(state, t))!,
        bad = tokens.find((t) => !fitsKind(state, t))!;
      countStamp(state, 0, bad);
      expect(countCheck(state)).toMatchObject({ kind: 'wrong', hint: false });
      expect(countStamp(state, 0, bad)).toMatchObject({ hint: true });
      expect(countCheck(state)).toMatchObject({ kind: 'wrong', hint: false });
      for (let p = 0; p < 6; p++) countStamp(state, p, good);
      expect(state.overs).toBe(6 - state.want);
      expect(countMove(state)).toEqual({ lift: 5 });
    });

    it('the ghost finger stamps only the kind, exactly the number, then taps the check', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const { state, tokens } = fresh(seed);
        const stamp = tokens.find((t) => fitsKind(state, t))!;
        let moves = 0;
        for (let m = countMove(state); m && moves < 20; m = countMove(state), moves++) {
          if ('stamp' in m) expect(countStamp(state, m.stamp, stamp).kind).toBe('stamp');
          else if ('check' in m) expect(countCheck(state).kind).toBe('done');
          else throw new Error('the bot never over-counts');
        }
        expect(moves).toBe(state.want + 1);
        expect(state.wrongKinds + state.overs + state.wrongChecks).toBe(0);
      }
    });

    it('says the kind in words for the sign and for one stamp', () => {
      expect(kindWords({ attr: 'color', value: 'blue' })).toEqual({ many: 'blue spots', one: 'blue' });
      expect(kindWords({ attr: 'shape', value: 'heart' })).toEqual({ many: 'hearts', one: 'a heart' });
      for (let seed = 1; seed <= 60; seed++)
        expect(kindWords(fresh(seed).state.kind!).many).not.toMatch(/undefined/);
    });

    it('sits only in pre-K, right after Count the spots', () => {
      for (const band of ['toddler', 'preschool', 'school'] as const)
        expect(levelsInOrder(rangeFor(LEVELS, band))).not.toContain(9);
      // Level 8's boards stay what they were: a count board has no kind.
      expect(countBoard(BUG_PLANS[7], new Rng(1)).state.kind).toBeNull();
      expect(BUG_TOKENS.length).toBe(12);
    });
  });

  describe('level 10, Fold a friend', () => {
    const plan = BUG_PLANS[9];
    const fresh = (seed: number) => foldBoard(plan, new Rng(seed));
    const right = (spots: readonly BugSpot[]) => spots.filter((s) => s.x > 0);

    it('is the fold level: three spots on the left wing, each a different stamp in a different place', () => {
      expect(plan.mode).toBe('fold');
      for (let seed = 1; seed <= 200; seed++) {
        const { left } = fresh(seed);
        expect(left).toHaveLength(3);
        expect(left.every((s) => s.x < 0)).toBe(true);
        expect(new Set(left.map((s) => s.token)).size).toBe(3);
        expect(new Set(left.map((s) => `${s.x},${s.y}`)).size).toBe(3);
      }
    });

    it('has exactly one choice that is the true fold, and each choice keeps the left wing as it is', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const b = fresh(seed);
        expect(b.choices.map((c) => c.kind).sort()).toEqual(['mirror', 'slide', 'swap']);
        expect(b.choices[b.answer].kind).toBe('mirror');
        for (const c of b.choices)
          expect(
            sameBug(
              c.spots.filter((s) => s.x < 0),
              b.left,
            ),
          ).toBe(true);
        const fold = foldAcross(b.left);
        expect(b.choices.filter((c) => sameBug(right(c.spots), fold))).toHaveLength(1);
      }
    });

    it('makes every true fold an exact reflection: each spot just as far from the middle line, on the same row', () => {
      for (let seed = 1; seed <= 100; seed++) {
        const b = fresh(seed);
        for (const s of b.left)
          expect(right(b.choices[b.answer].spots)).toContainEqual({ x: -s.x, y: s.y, token: s.token });
      }
    });

    it('makes the two other choices plausible but different: one slid across, one with two stamps swapped', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const b = fresh(seed);
        const fold = right(b.choices[b.answer].spots);
        const slide = right(b.choices.find((c) => c.kind === 'slide')!.spots);
        const swap = right(b.choices.find((c) => c.kind === 'swap')!.spots);
        // Every choice has the same three stamps on the right wing, so the stamps alone never give it away.
        for (const r of [slide, swap])
          expect(r.map((s) => s.token).sort()).toEqual(fold.map((s) => s.token).sort());
        // The slid wing keeps each stamp on its row and moves it to the other column; the true fold never does.
        for (const s of slide) {
          const twin = fold.find((t) => t.token === s.token)!;
          expect(s.y).toBe(twin.y);
          expect(s.x).not.toBe(twin.x);
        }
        // The swapped one has the true fold's places, with exactly two stamps changed.
        expect(swap.map((s) => `${s.x},${s.y}`).sort()).toEqual(fold.map((s) => `${s.x},${s.y}`).sort());
        expect(
          swap.filter((s) => !fold.some((t) => t.x === s.x && t.y === s.y && t.token === s.token)),
        ).toHaveLength(2);
        expect(sameBug(slide, swap)).toBe(false);
      }
    });

    it('puts the true fold in each of the three places across seeds, not always the same one', () => {
      const where = new Set<number>();
      for (let seed = 1; seed <= 60; seed++) where.add(fresh(seed).answer);
      expect([...where].sort()).toEqual([0, 1, 2]);
    });

    it('is the same board for the same seed', () => {
      expect(fresh(7)).toEqual(fresh(7));
    });

    it('comes after the mirror levels in pre-K and school, and never in preschool or toddler', () => {
      expect(levelsInOrder(rangeFor(LEVELS, 'school'))).toEqual([6, 7, 10, 11]);
      expect(levelsInOrder(rangeFor(LEVELS, 'prek')).at(-2)).toBe(10);
      for (const band of ['toddler', 'preschool'] as const)
        expect(levelsInOrder(rangeFor(LEVELS, band))).not.toContain(10);
    });
  });

  describe('level 11, Mend the wing', () => {
    const plan = BUG_PLANS[10];
    const fresh = (seed: number) => mendBoard(plan, new Rng(seed));
    const seeds = Array.from({ length: 120 }, (_, i) => i + 1);

    it('is the mend level, with three spots on the left wing and six places on the right', () => {
      expect(plan.mode).toBe('mend');
      for (const seed of seeds) {
        const s = fresh(seed);
        expect(s.left).toHaveLength(3);
        expect(new Set(s.left.map((l) => l.token)).size).toBe(3);
        expect(s.places).toHaveLength(6);
        for (const l of s.left) expect(l.x).toBeLessThan(0);
      }
    });

    it('has exactly one place that differs from its twin, and it differs in just the way named', () => {
      for (const seed of seeds) {
        const s = fresh(seed);
        expect(mendDiffers(s)).toEqual([s.wrong]);
        const now = s.right[s.wrong];
        if (s.flaw === 'missing') expect(now).toBeNull();
        else {
          const [a, b] = [BUG_TOKENS[now!], BUG_TOKENS[s.want]];
          expect(a.shape === b.shape).toBe(s.flaw === 'color');
          expect(a.color === b.color).toBe(s.flaw === 'shape');
        }
        // Everywhere else the right wing is the fold of the left.
        const at = s.places[s.wrong];
        const rest = (b: BugSpot[]) => b.filter((f) => f.x !== at.x || f.y !== at.y);
        expect(sameBug(rest(mendRight(s)), rest(foldAcross(s.left)))).toBe(true);
      }
    });

    it('brings every kind of flaw, in several places, across seeds', () => {
      const flaws = new Set<string>(),
        where = new Set<number>();
      for (const seed of seeds) {
        const s = fresh(seed);
        flaws.add(s.flaw);
        where.add(s.wrong);
      }
      expect([...flaws].sort()).toEqual(['color', 'missing', 'shape']);
      expect(where.size).toBeGreaterThanOrEqual(4);
    });

    it('puts the twin stamp in a tray of four different stamps, with a look-alike beside it', () => {
      for (const seed of seeds) {
        const s = fresh(seed);
        expect(s.tokens).toHaveLength(4);
        expect(new Set(s.tokens).size).toBe(4);
        expect(s.tokens).toContain(s.want);
        if (s.flaw !== 'missing') expect(s.tokens).toContain(s.right[s.wrong]);
      }
    });

    it('a look-alike differs in exactly one way', () => {
      for (let t = 0; t < BUG_TOKENS.length; t++)
        for (const flaw of ['color', 'shape'] as const)
          for (const u of lookAlikes(t, flaw)) {
            expect(BUG_TOKENS[u].shape === BUG_TOKENS[t].shape).toBe(flaw === 'color');
            expect(BUG_TOKENS[u].color === BUG_TOKENS[t].color).toBe(flaw === 'shape');
          }
    });

    it('the bot taps the place that differs, then mends it, and the wings then match exactly', () => {
      for (const seed of seeds) {
        const s = fresh(seed);
        let moves = 0;
        for (let m = mendMove(s); m; m = mendMove(s), moves++) {
          if ('tap' in m) expect(mendTap(s, m.tap).kind).toBe('found');
          else {
            expect(s.tokens).toContain(m.stamp);
            const p = s.places[m.place];
            expect(mendPlaceAt(s, p.x, p.y)).toBe(m.place);
            expect(mendDrop(s, m.place, m.stamp).kind).toBe('mended');
          }
        }
        expect(moves).toBe(2);
        expect(s.done).toBe(true);
        expect(sameBug(mendRight(s), foldAcross(s.left))).toBe(true);
        expect(mendDiffers(s)).toEqual([]);
      }
    });

    it('a tap on a matching place is a miss, the second miss brings the one hint, and it points at the true error', () => {
      for (const seed of seeds.slice(0, 40)) {
        const s = fresh(seed);
        const other = s.places.findIndex((_, i) => i !== s.wrong);
        const first = mendTap(s, other);
        expect(first).toEqual({ kind: 'twin', place: other, hint: false });
        const wrongStamp = s.tokens.find((t) => t !== s.want)!;
        // Before the tap, a wrong stamp on the place that differs is a miss too; a stamp let go elsewhere is not.
        expect(mendDrop(s, other, wrongStamp).kind).toBe('ignored');
        expect(mendDrop(s, s.wrong, wrongStamp)).toEqual({
          kind: 'wrongStamp',
          token: wrongStamp,
          hint: true,
        });
        expect(s.misses).toBe(2);
        expect(mendMove(s)).toEqual({ tap: s.wrong });
        // Only one hint a round.
        expect(mendTap(s, other)).toEqual({ kind: 'twin', place: other, hint: false });
        expect(mendTap(s, s.wrong).kind).toBe('found');
        expect(mendTap(s, s.wrong).kind).toBe('ignored');
        expect(mendMove(s)).toEqual({ stamp: s.want, place: s.wrong });
        expect(mendDrop(s, s.wrong, s.want).kind).toBe('mended');
        expect(mendTap(s, other).kind).toBe('ignored');
      }
    });

    it('lets the twin stamp mend the place even before it is tapped', () => {
      const s = fresh(5);
      expect(mendDrop(s, s.wrong, s.want).kind).toBe('mended');
      expect(s.misses).toBe(0);
      expect(sameBug(mendRight(s), foldAcross(s.left))).toBe(true);
    });

    it('is the same board for the same seed', () => {
      expect(fresh(9)).toEqual(fresh(9));
    });

    it('comes last in pre-K and school, and never in preschool or toddler', () => {
      expect(levelsInOrder(rangeFor(LEVELS, 'prek')).at(-1)).toBe(11);
      expect(levelsInOrder(rangeFor(LEVELS, 'school')).at(-1)).toBe(11);
      for (const band of ['toddler', 'preschool'] as const)
        expect(levelsInOrder(rangeFor(LEVELS, band))).not.toContain(11);
    });
  });
});
