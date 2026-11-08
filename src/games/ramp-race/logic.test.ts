import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  changed,
  CLAIMS,
  claimRight,
  claimWhy,
  CONFOUNDED,
  CONTROLLED,
  makeTell,
  tellConclusion,
  tellLayout,
  tellRepair,
  TILE_H,
  TILE_W,
  type Claim,
  type TellCase,
  classifyFair,
  CONTROL,
  makeChange,
  distance,
  EXPLORE_HEIGHTS,
  fairLine,
  fairRepair,
  farther,
  FLOORS,
  HEIGHTS,
  judgeFair,
  makeQuestions,
  makeShelf,
  makeStars,
  onStar,
  planFor,
  PLANS,
  rampTouch,
  recordOf,
  shelfLayout,
  sideOf,
  tally,
  waysTo,
  type FairKind,
  type FairQuestion,
  type RampEvent,
  type Setup,
  type TrialRecord,
} from './logic';

describe('Ramp Race', () => {
  it('higher ramps and slipperier floors always go farther', () => {
    for (const f of FLOORS)
      for (let i = 1; i < HEIGHTS.length; i++)
        expect(distance(HEIGHTS[i], f)).toBeGreaterThan(distance(HEIGHTS[i - 1], f));
    for (const h of HEIGHTS)
      (expect(distance(h, 'carpet')).toBeLessThan(distance(h, 'wood')),
        expect(distance(h, 'wood')).toBeLessThan(distance(h, 'ice')));
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
    expect(judgeFair({ compare: 'floor' }, { height: 3, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe(
      'fair',
    );
    expect(judgeFair({ compare: 'floor' }, { height: 4, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe(
      'unfair',
    );
    expect(judgeFair({ compare: 'height' }, { height: 4, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe(
      'fair',
    );
    expect(judgeFair({ compare: 'height' }, { height: 2, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe(
      'same',
    );
    for (let seed = 1; seed <= 50; seed++) {
      const qs = makeQuestions(new Rng(seed), 3);
      expect(qs.map((q) => q.compare)).toContain('floor');
      expect(qs.map((q) => q.compare)).toContain('height');
    }
  });
  it('the ghost finger plays every level through without a wrong move, never taps the floor where it cannot change, and never presses go on a miss', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'shelf' && p.mode !== 'change')) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const stars = plan.mode === 'height' || plan.mode === 'both' ? makeStars(plan, rng) : [];
        const questions = plan.mode === 'fair' ? makeQuestions(rng, plan.rounds) : [];
        const fresh = (): Setup[] =>
          plan.mode === 'fair'
            ? [
                { height: 3, floor: 'wood' },
                { height: 3, floor: 'wood' },
              ]
            : [{ height: plan.mode === 'height' ? 2 : 3, floor: 'wood' }];
        let lanes = fresh();
        let index = 0;
        let rolls = 0;
        let touches = 0;
        const heights: number[] = [];
        const total =
          plan.mode === 'explore' ? plan.rounds : plan.mode === 'fair' ? questions.length : stars.length;
        while ((plan.mode === 'explore' ? rolls : index) < total) {
          expect(++touches, `${plan.mode} seed ${seed}: finishes`).toBeLessThan(40);
          const move = rampTouch(plan, lanes, { star: stars[index], question: questions[index], rolls });
          expect(move, `${plan.mode} seed ${seed}: a touch to make`).not.toBeNull();
          if (move === 'go') {
            if (plan.mode === 'explore') {
              heights.push(lanes[0].height);
              rolls++;
              continue;
            }
            if (plan.mode === 'fair') {
              expect(judgeFair(questions[index], lanes[0], lanes[1]), 'a fair test').toBe('fair');
              lanes = fresh();
            } else {
              // The setup stays as the child left it for the next star; only a fair test starts over.
              expect(
                onStar(distance(lanes[0].height, lanes[0].floor), stars[index]),
                'the roll reaches the star',
              ).toBe(true);
            }
            index++;
            continue;
          }
          if (!move || !('lane' in move)) throw new Error('a lane touch');
          const lane = lanes[move.lane];
          if (move.change === 'ramp')
            lane.height = HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length];
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
  change === 'ramp'
    ? { ...lane, height: HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length] }
    : { ...lane, floor: FLOORS[(FLOORS.indexOf(lane.floor) + 1) % FLOORS.length] };

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
        if (q.compare === 'floor')
          expect(FLOORS.indexOf(winner.floor)).toBeGreaterThan(FLOORS.indexOf(loser.floor));
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
          if (!move || !('lane' in move)) throw new Error('a lane touch');
          expect(move.lane).toBe(1);
          expect(fairRepair(q, a, b)).toBe(move.change);
          b = tap(b, move.change);
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
    expect(
      fairLine(
        { compare: 'floor' },
        classifyFair({ compare: 'floor' }, { height: 2, floor: 'wood' }, { height: 4, floor: 'wood' }),
      ),
    ).toBe('ramp.wrong.floor');
  });
});

const wood = (height: number): Setup => ({ height, floor: 'wood' });

describe('Ramp Race Trial Shelf', () => {
  it('keeps levels 1–4 and appends the shelf as level 5', () => {
    expect(PLANS.map((p) => [p.mode, p.rounds])).toEqual([
      ['explore', 4],
      ['height', 3],
      ['both', 3],
      ['fair', 3],
      ['shelf', 2],
      ['change', 2],
      ['tell', 2],
    ]);
    expect(planFor(7).mode).toBe('tell');
    expect(planFor(5).mode).toBe('shelf');
    expect(planFor(6).mode).toBe('change');
    expect(planFor(9).mode).toBe('tell');
  });

  it('starts the pairs at 2 and 4, and every legal second roll makes the right card the top one in one pair and the bottom in the other', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const starts = makeShelf(new Rng(seed));
      expect([...starts].sort()).toEqual([2, 4]);
      const answers = starts.map((first) => {
        const seconds = HEIGHTS.filter((h) => h !== first);
        const sides = seconds.map((h) => {
          const [a, b] = [recordOf(wood(first)), recordOf(wood(h))];
          expect(a.stop).not.toBe(b.stop);
          return farther(a, b);
        });
        expect(new Set(sides).size, `start ${first}: every second height agrees`).toBe(1);
        return sides[0];
      });
      expect(answers[0]).not.toBe(answers[1]);
    }
  });

  it('records agree with distance, in whole and half marks, and the past side is exactly the farther second card', () => {
    for (const x of HEIGHTS)
      for (const y of HEIGHTS) {
        if (x === y) continue;
        const [a, b] = [recordOf(wood(x)), recordOf(wood(y), 'past')];
        expect(a.stop).toBe(distance(x, 'wood'));
        expect(Number.isInteger(a.stop * 2)).toBe(true);
        expect(farther(a, b)).toBe(distance(y, 'wood') > distance(x, 'wood') ? 1 : 0);
        expect(sideOf(b.stop, a.stop) === 'past').toBe(farther(a, b) === 1);
        expect(b.guess).toBe('past');
        expect(recordOf(wood(x)).guess).toBeUndefined();
      }
  });

  it('counts only wrong cards and unfair Checks, with help once per kind', () => {
    const t = (...e: RampEvent[]) => tally(e);
    expect(t('free', 'free', 'free')).toEqual({ misses: 0, hints: 0 });
    for (let n = 0; n <= 4; n++) {
      expect(tally(Array(n).fill('unfair-check'))).toEqual({
        misses: n,
        hints: Math.min(1, Math.max(0, n - 1)),
      });
      expect(tally(Array(n).fill('wrong-card'))).toEqual({
        misses: n,
        hints: Math.min(1, Math.max(0, n - 1)),
      });
    }
    expect(
      t('unfair-check', 'wrong-card', 'unfair-check', 'free', 'wrong-card', 'wrong-card', 'unfair-check'),
    ).toEqual({ misses: 6, hints: 2 });
  });

  it('the ghost finger plays both pairs with a different height, a guess by the stated rule and the farther card, never a counted event', () => {
    const plan = planFor(5);
    for (let seed = 1; seed <= 50; seed++) {
      const starts = makeShelf(new Rng(seed));
      for (const first of starts) {
        let lane = wood(first);
        const records: TrialRecord[] = [];
        let guess: 'before' | 'past' | undefined;
        const events: RampEvent[] = [];
        let touches = 0;
        let ramp = 0;
        for (;;) {
          expect(++touches, `seed ${seed}: finishes`).toBeLessThan(10);
          const move = rampTouch(plan, [lane], { rolls: 0, records, guess });
          expect(move, 'never stalls').not.toBeNull();
          if (move === 'go') {
            if (records.length === 1)
              expect(lane.height, 'never rolls the same height twice').not.toBe(records[0].setup.height);
            records.push(recordOf(lane, records.length === 1 ? guess : undefined));
            continue;
          }
          if ('card' in move!) {
            expect(records).toHaveLength(2);
            events.push(move.card === farther(records[0], records[1]) ? 'free' : 'wrong-card');
            break;
          }
          if ('guess' in move!) {
            guess = move.guess;
            continue;
          }
          if (!('lane' in move!)) throw new Error('unexpected claim');
          expect(move.lane).toBe(0);
          expect(move.change).toBe('ramp');
          expect(records, 'the ramp is locked until the first card').toHaveLength(1);
          ramp++;
          lane = {
            ...lane,
            height: HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length],
          };
        }
        expect(ramp).toBe(1);
        // The stated rule is right on wood, so the bot's guess always matches.
        expect(sideOf(records[1].stop, records[0].stop)).toBe(records[1].guess);
        expect(tally(events)).toEqual({ misses: 0, hints: 0 });
      }
    }
  });

  it('lays the cards and guess sides out large and clear of home, ?, the pet, go and the ramp', () => {
    const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) =>
      x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    const overlap = (
      p: { x: number; y: number; w: number; h: number },
      q: { x: number; y: number; w: number; h: number },
    ) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
    for (const view of [
      { w: 1024, h: 768 },
      { w: 1024, h: 1365 },
      { w: 1664, h: 768 },
    ]) {
      for (const first of [2, 4])
        for (const second of HEIGHTS.filter((h) => h !== first)) {
          void second;
          const L = shelfLayout(view, distance(first, 'wood'));
          const floorY = view.h * 0.66;
          const go = { x: view.w - 140, y: view.h - 140, w: 120, h: 120 };
          const pet = { x: 0, y: view.h - 160, w: 200, h: 160 };
          const corner = { x: 0, y: 0, w: 112, h: 210 };
          const ramp = { x: 130, y: floorY - 214, w: 200, h: 224 };
          const pieces = [...L.cards, L.guess.before, L.guess.past];
          for (const b of pieces) {
            expect(Math.min(b.w, b.h), JSON.stringify([view, first, b])).toBeGreaterThanOrEqual(100);
            for (const o of [go, pet, corner])
              expect(overlap(b, o), JSON.stringify([view, b, o])).toBe(false);
          }
          for (const b of [...L.cards, L.badge]) expect(overlap(b, ramp)).toBe(false);
          expect(overlap(L.cards[0], L.cards[1])).toBe(false);
          expect(L.cards[0].x).toBe(L.cards[1].x);
          expect(overlap(L.badge, L.cards[0]) || overlap(L.badge, L.cards[1])).toBe(false);
          // The guess zone starts right of the ramp's touch pad, and the cards sit above the rolling car.
          expect(L.guess.before.x).toBeGreaterThan(ramp.x + ramp.w);
          expect(L.cards[1].y + L.cards[1].h).toBeLessThan(floorY - 60);
          expect(inside(L.guess.past, L.guess.past.x + 1, floorY)).toBe(true);
        }
    }
  });
});

describe('One Change', () => {
  it('seeds one question of each kind with distinct confounded starts', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const changes = makeChange(new Rng(seed));
      expect(changes).toEqual(makeChange(new Rng(seed)));
      expect(changes.map((c) => c.question.compare).sort()).toEqual(['floor', 'height']);
      expect(changes[0].start).not.toEqual(changes[1].start);
      for (const { question, start } of changes) {
        expect(classifyFair(question, CONTROL, start)).toBe('both-changed');
        seen.add(JSON.stringify(start));
      }
    }
    expect(seen.size).toBe(4);
  });

  it('accepts exactly two repairs per question, both with different stops from the control, and repair reaches either side', () => {
    for (const q of QUESTIONS) {
      const fair = SETUPS.filter((s) => classifyFair(q, CONTROL, s) === 'fair');
      expect(fair).toHaveLength(2);
      expect(fair.map((s) => farther(recordOf(CONTROL), recordOf(s))).sort()).toEqual([0, 1]);
      for (const initial of SETUPS) {
        let b = { ...initial };
        let taps = 0;
        while (classifyFair(q, CONTROL, b) !== 'fair') {
          const fix = fairRepair(q, CONTROL, b);
          expect(fix).not.toBeNull();
          b = tap(b, fix!);
          expect(++taps).toBeLessThanOrEqual(3);
        }
        if (initial.height !== CONTROL.height && initial.floor !== CONTROL.floor)
          expect(taps).toBeLessThanOrEqual(2);
        expect(distance(b.height, b.floor)).not.toBe(distance(CONTROL.height, CONTROL.floor));
      }
    }
  });

  it('the bot repairs and reads both questions, never touching blue or missing, for 50 seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const { question, start } of makeChange(new Rng(seed))) {
        const lanes = [{ ...CONTROL }, { ...start }];
        let records: TrialRecord[] = [];
        const events: RampEvent[] = [];
        let touches = 0;
        for (;;) {
          expect(++touches).toBeLessThan(7);
          const move = rampTouch(planFor(6), lanes, { question, rolls: 0, records });
          expect(move).not.toBeNull();
          if (move === 'go') {
            expect(classifyFair(question, lanes[0], lanes[1])).toBe('fair');
            records = lanes.map((s) => recordOf(s));
          } else if (move && 'lane' in move) {
            expect(move.lane).toBe(1);
            lanes[1] = tap(lanes[1], move.change);
          } else if (move && 'card' in move) {
            expect(records).toHaveLength(2);
            events.push(move.card === farther(records[0], records[1]) ? 'free' : 'wrong-card');
            break;
          } else throw new Error('One Change never guesses');
        }
        expect(lanes[0]).toEqual(CONTROL);
        expect(tally(events)).toEqual({ misses: 0, hints: 0 });
      }
    }
  });

  it('keeps the two-lane cards clear of ramp pads and the top car band in each view', () => {
    for (const view of [
      { w: 1024, h: 768 },
      { w: 1024, h: 1365 },
      { w: 1664, h: 768 },
    ]) {
      const { cards } = shelfLayout(view, 4.5);
      for (const c of cards) {
        expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(100);
        expect(c.x).toBeGreaterThan(330);
        expect(c.y + c.h).toBeLessThan(view.h * 0.42 - 50);
      }
    }
  });
});

describe('What can we tell?', () => {
  const stop = (s: Setup) => distance(s.height, s.floor);
  const ordered = SETUPS.flatMap((a) => SETUPS.filter((b) => b !== a).map((b) => [a, b] as const));
  const rec = (c: TellCase): [TrialRecord, TrialRecord] => [recordOf(c.a), recordOf(c.b)];
  const overlap = (
    p: { x: number; y: number; w: number; h: number },
    q: { x: number; y: number; w: number; h: number },
  ) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;

  it('has the confounded and controlled pools, all with distinct stops', () => {
    expect(CONFOUNDED).toHaveLength(17);
    expect(CONTROLLED).toHaveLength(18);
    for (const { a, b } of CONFOUNDED) {
      expect(changed(a, b)).toBe('both');
      expect(stop(a)).not.toBe(stop(b));
    }
    const shorterFarther = CONFOUNDED.filter(({ a, b }) => a.height < b.height === stop(a) > stop(b));
    expect(shorterFarther).toHaveLength(6);
    expect(CONTROLLED.filter(({ a, b }) => changed(a, b) === 'floor')).toHaveLength(9);
    expect(CONTROLLED.filter(({ a, b }) => changed(a, b) === 'height')).toHaveLength(9);
    for (const { a, b } of CONTROLLED) expect(stop(a)).not.toBe(stop(b));
  });

  it('makes one confounded and one controlled case per round, in both orders and both card orders, deterministically', () => {
    const firstKinds = new Set<string>();
    const cardOrders = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const round = makeTell(new Rng(seed));
      expect(round).toEqual(makeTell(new Rng(seed)));
      expect(round.map((c) => changed(c.a, c.b)).sort()).toHaveLength(2);
      const kinds = round.map((c) => (changed(c.a, c.b) === 'both' ? 'both' : 'one'));
      expect([...kinds].sort()).toEqual(['both', 'one']);
      firstKinds.add(kinds[0]);
      for (const c of round) {
        expect(stop(c.a)).not.toBe(stop(c.b));
        cardOrders.add(`${kinds[round.indexOf(c)]}:${stop(c.a) < stop(c.b)}`);
      }
    }
    expect(firstKinds.size).toBe(2);
    expect(cardOrders.size).toBe(4);
  });

  it('has exactly one right claim for each of the 72 ordered pairs, and it equals changed', () => {
    expect(ordered).toHaveLength(72);
    for (const [a, b] of ordered) {
      const right = CLAIMS.filter((c) => claimRight(c, a, b));
      expect(right).toEqual([changed(a, b)]);
    }
  });

  it('gives every wrong claim a why-line naming a part that really is the same or different', () => {
    for (const [a, b] of ordered) {
      const actual = changed(a, b) as Claim;
      for (const claim of CLAIMS) {
        const why = claimWhy(claim, actual);
        if (claim === actual) {
          expect(why).toBeNull();
          continue;
        }
        expect(why).not.toBeNull();
        if (why === 'floorsame') expect(a.floor).toBe(b.floor);
        else if (why === 'rampsame') expect(a.height).toBe(b.height);
        else if (why === 'rampsdiffer') expect(a.height).not.toBe(b.height);
        else expect(a.floor).not.toBe(b.floor);
      }
    }
  });

  it('repairs a confounded pair to one difference in at most 2 taps, from either card order, and an identical pair in 1', () => {
    for (const { a: x, b: y } of CONFOUNDED) {
      for (const [a, b0] of [
        [x, y],
        [y, x],
      ]) {
        let b = { ...b0 };
        let taps = 0;
        while (tellRepair(a, b)) {
          b = tap(b, tellRepair(a, b)!);
          expect(++taps).toBeLessThanOrEqual(2);
        }
        expect(['floor', 'height']).toContain(changed(a, b));
      }
    }
    for (const a of SETUPS) {
      const fix = tellRepair(a, { ...a });
      expect(fix).not.toBeNull();
      expect(['floor', 'height']).toContain(changed(a, tap({ ...a }, fix!)));
    }
    for (const a of SETUPS) {
      const fair = SETUPS.filter((b) => ['floor', 'height'].includes(changed(a, b)));
      expect(fair).toHaveLength(4);
      for (const b of fair) {
        expect(tellRepair(a, b)).toBeNull();
        expect(stop(b)).not.toBe(stop(a));
      }
    }
  });

  it('draws the right conclusion for every controlled pair in both orders', () => {
    for (const { a: x, b: y } of CONTROLLED) {
      for (const [a, b] of [
        [x, y],
        [y, x],
      ]) {
        const far = stop(a) > stop(b) ? a : b;
        const near = far === a ? b : a;
        const c = tellConclusion(a, b)!;
        if (changed(a, b) === 'floor') expect(c).toEqual({ line: 'floor', floor: far.floor });
        else expect(c).toEqual({ line: 'height', what: far.height > near.height ? 'taller' : 'shorter' });
      }
    }
    for (const { a, b } of CONFOUNDED) expect(tellConclusion(a, b)).toBeNull();
  });

  it('is finished by the bot with no counted events, never touching lane 0, for 50 seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const c of makeTell(new Rng(seed))) {
        const records = rec(c);
        const events: RampEvent[] = [];
        let claim: Claim | null = null;
        let step: 'claim' | 'repair' = 'claim';
        let lanes: Setup[] = [];
        let touches = 0;
        let done = false;
        let cur = records;
        while (!done) {
          expect(++touches).toBeLessThan(12);
          const move = rampTouch(planFor(7), lanes, { rolls: 0, records: cur, step, claim });
          expect(move, `seed ${seed}`).not.toBeNull();
          if (move === 'go') {
            if (step === 'claim') {
              expect(claim).not.toBeNull();
              const ok = claimRight(claim!, cur[0].setup, cur[1].setup);
              expect(ok).toBe(true);
              if (claim === 'both') {
                step = 'repair';
                lanes = [{ ...cur[0].setup }, { ...cur[1].setup }];
                claim = null;
              } else done = true;
            } else {
              expect(changed(lanes[0], lanes[1])).not.toBe('both');
              expect(changed(lanes[0], lanes[1])).not.toBe('none');
              cur = [recordOf(lanes[0]), recordOf(lanes[1])];
              step = 'claim';
              claim = null;
            }
          } else if (move && 'claim' in move) {
            expect(step).toBe('claim');
            claim = move.claim;
          } else if (move && 'lane' in move) {
            expect(step).toBe('repair');
            expect(move.lane).toBe(1);
            lanes[1] = tap(lanes[1], move.change);
          } else throw new Error('unexpected touch');
        }
        expect(tally(events)).toEqual({ misses: 0, hints: 0 });
      }
    }
  });

  it('counts each step on its own: n wrong claims or repairs are n misses and at most one hint', () => {
    for (const kind of ['wrong-claim', 'tell-unfair'] as const) {
      for (let n = 0; n <= 6; n++) {
        expect(tally(Array(n).fill(kind))).toEqual({ misses: n, hints: Math.min(1, Math.max(0, n - 1)) });
      }
    }
    expect(tally(['wrong-claim', 'free', 'free'])).toEqual({ misses: 1, hints: 0 });
    // A round is at most three steps in the confounded case (claim, repair, claim) plus one for the controlled case.
    const worst = [3, 3, 3, 3].map((n, i) => tally(Array(n).fill(i % 2 ? 'tell-unfair' : 'wrong-claim')));
    expect(worst.reduce((h, t) => h + t.hints, 0)).toBeLessThanOrEqual(4);
    expect(tally(Array(9).fill('wrong-claim')).hints).toBe(1);
  });

  it('lays the tiles out large and clear of the cards, home, ?, the pet and go in each view', () => {
    for (const view of [
      { w: 1024, h: 768 },
      { w: 1024, h: 1365 },
      { w: 1664, h: 768 },
    ]) {
      const L = tellLayout(view);
      const go = { x: view.w - 140, y: view.h - 140, w: 120, h: 120 };
      const pet = { x: 0, y: view.h - 160, w: 200, h: 160 };
      const corner = { x: 0, y: 0, w: 112, h: 210 };
      expect(L.tiles[0].w).toBe(TILE_W);
      expect(L.tiles[0].h).toBe(TILE_H);
      L.tiles.forEach((t, i) => {
        expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w).toBeLessThanOrEqual(view.w);
        for (const o of [...L.cards, go, pet, corner, ...L.tiles.slice(i + 1)])
          expect(overlap(t, o), JSON.stringify([view, t, o])).toBe(false);
      });
      expect(overlap(L.cards[0], L.cards[1])).toBe(false);
    }
  });
});
