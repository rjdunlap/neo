import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { classifyFair, distance, EXPLORE_HEIGHTS, fairLine, fairRepair, FLOORS, HEIGHTS, judgeFair, makeQuestions, makeStars, onStar, PLANS, rampTouch, waysTo, type FairKind, type FairQuestion, type Setup } from './logic';

describe('Ramp Race', () => {
  it('higher ramps and slipperier floors always go farther', () => {
    for (const f of FLOORS) for (let i = 1; i < HEIGHTS.length; i++) expect(distance(HEIGHTS[i], f)).toBeGreaterThan(distance(HEIGHTS[i - 1], f));
    for (const h of HEIGHTS) expect(distance(h, 'carpet')).toBeLessThan(distance(h, 'wood')), expect(distance(h, 'wood')).toBeLessThan(distance(h, 'ice'));
  });

  it('every star can be reached, and on the height level by exactly one height on wood', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'height' || p.mode === 'both')) {
      for (let seed = 1; seed <= 200; seed++) {
        const stars = makeStars(plan, new Rng(seed));
        expect(new Set(stars).size).toBe(plan.rounds);
        for (const s of stars) {
          const ways = waysTo(s, plan.mode === 'height' ? ['wood'] : FLOORS);
          expect(ways.length).toBeGreaterThanOrEqual(1);
          if (plan.mode === 'height') expect(ways).toHaveLength(1);
          for (const w of ways) expect(onStar(distance(w.height, w.floor), s)).toBe(true);
        }
      }
    }
  });

  it('a fair test changes only the thing being compared', () => {
    expect(judgeFair({ compare: 'floor' }, { height: 3, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe('fair');
    expect(judgeFair({ compare: 'floor' }, { height: 4, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe('unfair');
    expect(judgeFair({ compare: 'height' }, { height: 4, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe('fair');
    expect(judgeFair({ compare: 'height' }, { height: 2, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe('same');
    for (let seed = 1; seed <= 50; seed++) {
      const qs = makeQuestions(new Rng(seed), 3);
      expect(qs.map((q) => q.compare)).toContain('floor');
      expect(qs.map((q) => q.compare)).toContain('height');
    }
  });
  it("the ghost finger plays every level through without a wrong move, never taps the floor where it cannot change, and never presses go on a miss", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const stars = plan.mode === 'height' || plan.mode === 'both' ? makeStars(plan, rng) : [];
        const questions = plan.mode === 'fair' ? makeQuestions(rng, plan.rounds) : [];
        const fresh = (): Setup[] => (plan.mode === 'fair' ? [{ height: 3, floor: 'wood' }, { height: 3, floor: 'wood' }] : [{ height: plan.mode === 'height' ? 2 : 3, floor: 'wood' }]);
        let lanes = fresh();
        let index = 0;
        let rolls = 0;
        let touches = 0;
        const heights: number[] = [];
        const total = plan.mode === 'explore' ? plan.rounds : plan.mode === 'fair' ? questions.length : stars.length;
        while ((plan.mode === 'explore' ? rolls : index) < total) {
          expect(++touches, `${plan.mode} seed ${seed}: finishes`).toBeLessThan(40);
          const move = rampTouch(plan, lanes, { star: stars[index], question: questions[index], rolls });
          expect(move, `${plan.mode} seed ${seed}: a touch to make`).not.toBeNull();
          if (move === 'go') {
            if (plan.mode === 'explore') { heights.push(lanes[0].height); rolls++; continue; }
            if (plan.mode === 'fair') {
              expect(judgeFair(questions[index], lanes[0], lanes[1]), 'a fair test').toBe('fair');
              lanes = fresh();
            } else {
              // The setup stays as the child left it for the next star; only a fair test starts over.
              expect(onStar(distance(lanes[0].height, lanes[0].floor), stars[index]), 'the roll reaches the star').toBe(true);
            }
            index++;
            continue;
          }
          const lane = lanes[move!.lane];
          if (move!.change === 'ramp') lane.height = HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length];
          else {
            expect(['both', 'fair']).toContain(plan.mode);
            lane.floor = FLOORS[(FLOORS.indexOf(lane.floor) + 1) % FLOORS.length];
          }
        }
        // Explore: each roll beside the last is a different height, so higher goes farther is visible.
        if (plan.mode === 'explore') expect(heights).toEqual([...EXPLORE_HEIGHTS].slice(0, plan.rounds));
      }
    }
  });
});

const QUESTIONS: FairQuestion[] = [{ compare: 'floor' }, { compare: 'height' }];
const SETUPS: Setup[] = HEIGHTS.flatMap((height) => FLOORS.map((floor) => ({ height, floor })));
/** All 81 ordered pairs of blue lane A and orange lane B. */
const PAIRS = SETUPS.flatMap((a) => SETUPS.map((b) => [a, b] as const));
const tap = (lane: Setup, change: 'ramp' | 'floor'): Setup =>
  change === 'ramp' ? { ...lane, height: HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length] } : { ...lane, floor: FLOORS[(FLOORS.indexOf(lane.floor) + 1) % FLOORS.length] };

describe('Ramp Race fair-test support', () => {
  it('sorts the 81 pairs into 9 same, 18 fair, 18 wrong-only and 36 both-changed for each question, agreeing with judgeFair', () => {
    for (const q of QUESTIONS) {
      const counts: Record<FairKind, number> = { same: 0, fair: 0, 'wrong-only': 0, 'both-changed': 0 };
      for (const [a, b] of PAIRS) {
        const kind = classifyFair(q, a, b);
        counts[kind]++;
        expect(judgeFair(q, a, b)).toBe(kind === 'wrong-only' || kind === 'both-changed' ? 'unfair' : kind);
      }
      expect(counts).toEqual({ same: 9, fair: 18, 'wrong-only': 18, 'both-changed': 36 });
    }
  });

  it('every fair pair has two different distances, and the slipperier floor or taller ramp goes farther', () => {
    for (const q of QUESTIONS) {
      for (const [a, b] of PAIRS) {
        if (classifyFair(q, a, b) !== 'fair') continue;
        const [da, db] = [distance(a.height, a.floor), distance(b.height, b.floor)];
        expect(da).not.toBe(db);
        const winner = da > db ? a : b;
        const loser = da > db ? b : a;
        if (q.compare === 'floor') expect(FLOORS.indexOf(winner.floor)).toBeGreaterThan(FLOORS.indexOf(loser.floor));
        else expect(winner.height).toBeGreaterThan(loser.height);
      }
    }
  });

  it('the ghost finger repairs every non-fair pair on the orange lane within three taps and never presses go early', () => {
    const plan = PLANS[3];
    let starts = 0;
    for (const q of QUESTIONS) {
      for (const [a, b0] of PAIRS) {
        if (classifyFair(q, a, b0) === 'fair') continue;
        starts++;
        let b = b0;
        let taps = 0;
        for (;;) {
          const move = rampTouch(plan, [a, b], { question: q, rolls: 0 });
          expect(move, `${q.compare} from ${JSON.stringify([a, b0])}`).not.toBeNull();
          if (move === 'go') {
            expect(classifyFair(q, a, b)).toBe('fair');
            break;
          }
          expect(move!.lane).toBe(1);
          expect(fairRepair(q, a, b)).toBe(move!.change);
          b = tap(b, move!.change);
          expect(++taps, `${q.compare} from ${JSON.stringify([a, b0])}`).toBeLessThanOrEqual(3);
        }
        expect(fairRepair(q, a, b)).toBeNull();
      }
    }
    expect(starts).toBe(126);
  });

  it('maps each non-fair kind to the line that names what actually changed', () => {
    expect(fairLine({ compare: 'floor' }, 'wrong-only')).toBe('ramp.wrong.floor');
    expect(fairLine({ compare: 'height' }, 'wrong-only')).toBe('ramp.wrong.height');
    expect(fairLine({ compare: 'floor' }, 'both-changed')).toBe('ramp.unfair.floor');
    expect(fairLine({ compare: 'height' }, 'both-changed')).toBe('ramp.unfair.height');
    expect(fairLine({ compare: 'floor' }, 'same')).toBe('ramp.same.floor');
    expect(fairLine({ compare: 'height' }, 'same')).toBe('ramp.same.height');
    expect(fairLine({ compare: 'floor' }, 'fair')).toBeNull();
    // A pair where only the wrong thing differs is told so, not that the named thing differs "too".
    expect(fairLine({ compare: 'floor' }, classifyFair({ compare: 'floor' }, { height: 2, floor: 'wood' }, { height: 4, floor: 'wood' }))).toBe('ramp.wrong.floor');
  });
});
