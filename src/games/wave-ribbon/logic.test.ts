import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  AMPLITUDES,
  ARRIVAL_STEP,
  CARDS,
  DT_STEP,
  HelpTally,
  LEVELS,
  PEAK_STEP,
  PLANS,
  STEP_COUNT,
  T_ARRIVE,
  T_PEAK,
  T_RUN,
  V_WAVE,
  W_PULSE,
  X_FLAG,
  X_MARKER,
  checkCard,
  crestX,
  displacementAt,
  doneReady,
  emptySeen,
  frameAt,
  makeRound,
  markerState,
  markerTrace,
  nextHelp,
  nextMove,
  noteTime,
  planFor,
  rightCard,
  sampleRibbon,
  watched,
  type Preset,
} from './logic';

const presets: Preset[] = ['small', 'medium', 'tall'];

describe('the pulse model', () => {
  it('is finite, deterministic and never NaN', () => {
    for (const p of presets)
      for (let k = 0; k <= STEP_COUNT; k++) {
        const a = sampleRibbon(k * DT_STEP, AMPLITUDES[p]),
          b = sampleRibbon(k * DT_STEP, AMPLITUDES[p]);
        expect(a).toEqual(b);
        for (const pt of a) expect(Number.isFinite(pt.dy)).toBe(true);
      }
    expect(markerTrace(AMPLITUDES.tall)).toHaveLength(STEP_COUNT + 1);
  });

  it('lifts the ribbon only where the pulse is, and is flat before and after', () => {
    const amp = AMPLITUDES.tall;
    expect(displacementAt(X_MARKER, 0, amp)).toBe(0);
    expect(displacementAt(X_MARKER, T_RUN, amp)).toBe(0);
    for (const x of [0, 100, 240, 480, 560]) {
      expect(displacementAt(x, x / V_WAVE - 0.01, amp)).toBe(0);
      expect(displacementAt(x, x / V_WAVE + W_PULSE + 0.01, amp)).toBe(0);
    }
    expect(sampleRibbon(0, amp).every((p) => p.dy === 0)).toBe(true);
  });

  it('puts the bead at its highest at the peak frame and back at rest two frames after', () => {
    for (const p of presets) {
      const amp = AMPLITUDES[p];
      expect(markerState(T_PEAK, amp).dy).toBeCloseTo(amp, 9);
      expect(markerState(2, amp).dy).toBeCloseTo(0, 9);
      const trace = markerTrace(amp);
      expect(Math.max(...trace)).toBeCloseTo(amp, 9);
      expect(trace.indexOf(Math.max(...trace))).toBe(PEAK_STEP);
    }
  });

  it('never moves the bead sideways', () => {
    for (const p of presets)
      for (let t = 0; t <= T_RUN; t += 0.05) expect(markerState(t, AMPLITUDES[p]).x).toBe(X_MARKER);
  });

  it('reaches the flag at the same moment whatever the height', () => {
    expect(ARRIVAL_STEP).toBe(10);
    expect(crestX(T_ARRIVE)).toBeCloseTo(X_FLAG, 9);
    for (const p of presets) {
      const amp = AMPLITUDES[p];
      // The flag's own bead-height peaks exactly when the crest arrives.
      let best = 0,
        bestT = 0;
      for (let t = 0; t <= T_RUN; t += 0.01) {
        const d = displacementAt(X_FLAG, t, amp);
        if (d > best) {
          best = d;
          bestT = t;
        }
      }
      expect(bestT).toBeCloseTo(T_ARRIVE, 1);
    }
  });

  it('makes tall unmistakably taller than small', () => {
    expect(AMPLITUDES.tall / AMPLITUDES.small).toBeGreaterThan(2.5);
    expect(AMPLITUDES.small).toBeLessThan(AMPLITUDES.medium);
    expect(AMPLITUDES.medium).toBeLessThan(AMPLITUDES.tall);
  });

  it('puts a time into its frame', () => {
    expect(frameAt(0)).toBe(0);
    expect(frameAt(T_PEAK)).toBe(PEAK_STEP);
    expect(frameAt(T_ARRIVE)).toBe(ARRIVAL_STEP);
    expect(frameAt(99)).toBe(STEP_COUNT);
  });
});

describe('levels and rounds', () => {
  it('has a school ladder of two levels, each named', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 2 } });
    expect(PLANS.map((p) => p.name)).toEqual(['Watch the pulse', 'Tall and small']);
    expect(planFor(9).level).toBe(2);
  });

  it('seeds colours, the asked height and the card order without changing the physics', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const r = makeRound(PLANS[1], new Rng(seed));
      expect([...r.cards].sort()).toEqual([...CARDS].sort());
      expect(['small', 'tall']).toContain(r.target);
      seen.add(`${r.target}:${r.cards.join()}`);
    }
    expect(seen.size).toBeGreaterThan(4);
    // Level 1 keeps the cards in their natural order (it shows none).
    expect(makeRound(PLANS[0], new Rng(3)).cards).toEqual([...CARDS]);
  });

  it('has three distinguishable cards and exactly one right one for each asked height', () => {
    expect(new Set(CARDS).size).toBe(3);
    expect(rightCard('small')).toBe('small');
    expect(rightCard('tall')).toBe('tall');
    expect(markerTrace(AMPLITUDES.small)).not.toEqual(markerTrace(AMPLITUDES.tall));
  });
});

describe('watching and finishing', () => {
  const watch = (seen = emptySeen(), p: Preset) => {
    for (let k = 0; k <= STEP_COUNT; k++) noteTime(seen, p, k * DT_STEP);
    return seen;
  };

  it('counts a pulse as watched only once the bead peaked and the crest reached the flag', () => {
    const s = emptySeen();
    noteTime(s, 'medium', T_PEAK);
    expect(watched(s, 'medium')).toBe(false);
    noteTime(s, 'medium', T_ARRIVE);
    expect(watched(s, 'medium')).toBe(true);
    expect(watched(s, 'tall')).toBe(false);
  });

  it('level 1 finishes after one watched pulse and never before', () => {
    expect(doneReady(PLANS[0], emptySeen(), false)).toBe(false);
    expect(doneReady(PLANS[0], watch(emptySeen(), 'medium'), false)).toBe(true);
  });

  it('level 2 needs both heights watched and a correct Check', () => {
    const plan = PLANS[1];
    expect(doneReady(plan, watch(emptySeen(), 'small'), true)).toBe(false);
    const both = watch(watch(emptySeen(), 'small'), 'tall');
    expect(doneReady(plan, both, false)).toBe(false);
    expect(doneReady(plan, both, true)).toBe(true);
  });

  it('a Check waits for both runs and a picked card (no miss), and only a wrong picture is a miss', () => {
    const plan = PLANS[1];
    const round = makeRound(plan, new Rng(5));
    expect(checkCard(plan, emptySeen(), round, 'tall').kind).toBe('need-both');
    const both = watch(watch(emptySeen(), 'small'), 'tall');
    expect(checkCard(plan, both, round, null).kind).toBe('pick-card');
    const right = rightCard(round.target);
    expect(checkCard(plan, both, round, right).kind).toBe('right');
    for (const c of CARDS.filter((c) => c !== right))
      expect(checkCard(plan, both, round, c)).toEqual({ kind: 'wrong', card: c });
  });
});

describe('help and the ghost finger', () => {
  it('names each help once and leads somewhere', () => {
    expect(nextHelp(PLANS[0], emptySeen())).toBe('send-pulse');
    const s = emptySeen();
    for (let k = 0; k <= STEP_COUNT; k++) noteTime(s, 'medium', k * DT_STEP);
    expect(nextHelp(PLANS[0], s)).toBeNull();
    expect(nextHelp(PLANS[1], emptySeen())).toBe('run-both');
    const tally = new HelpTally();
    tally.give('run-both');
    tally.give('run-both');
    tally.give('pick-trace');
    expect(tally.count).toBe(2);
  });

  it('a capable player finishes both levels with no misses', () => {
    for (const plan of PLANS) {
      const round = makeRound(plan, new Rng(11));
      const seen = emptySeen();
      let preset: Preset = plan.presets[0],
        picked = null as ReturnType<typeof rightCard> | null,
        checked = false;
      for (let guard = 0; guard < 20; guard++) {
        const m = nextMove(plan, seen, round, picked, checked, preset, false);
        if (!m) throw new Error('stuck');
        if ('done' in m) break;
        if ('preset' in m) preset = m.preset;
        else if ('send' in m) for (let k = 0; k <= STEP_COUNT; k++) noteTime(seen, preset, k * DT_STEP);
        else if ('card' in m) picked = m.card;
        else if ('check' in m) {
          expect(checkCard(plan, seen, round, picked).kind).toBe('right');
          checked = true;
        }
      }
      expect(doneReady(plan, seen, checked)).toBe(true);
    }
  });

  it('waits while a run plays', () => {
    expect(
      nextMove(PLANS[0], emptySeen(), makeRound(PLANS[0], new Rng(1)), null, false, 'medium', true),
    ).toBeNull();
  });
});
