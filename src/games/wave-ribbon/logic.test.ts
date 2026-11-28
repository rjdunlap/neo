import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  AMPLITUDES,
  ARRIVAL_STEP,
  CARDS,
  CLAIMS,
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
  arrivalTime,
  checkCard,
  checkClaim,
  crestX,
  displacementAt,
  doneReady,
  emptySeen,
  frameAt,
  isInformativePair,
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
  type ClaimId,
  type Preset,
  type PulseSize,
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
    expect(arrivalTime('small')).toBe(T_ARRIVE);
    expect(arrivalTime('tall')).toBe(T_ARRIVE);
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
  it('has school 1–3 and grownup 3, each named', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 3 }, grownup: { min: 3, max: 3 } });
    expect(PLANS.map((p) => p.name)).toEqual([
      'Watch the pulse',
      'Tall and small',
      'Same speed, bigger wave',
    ]);
    expect(planFor(9).level).toBe(3);
  });

  it('seeds colours, the asked height and the card order without changing the physics', () => {
    const seen = new Set<string>();
    const claimsSeen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const r = makeRound(PLANS[1], new Rng(seed));
      expect([...r.cards].sort()).toEqual([...CARDS].sort());
      expect(['small', 'tall']).toContain(r.target);
      seen.add(`${r.target}:${r.cards.join()}`);
      const r3 = makeRound(PLANS[2], new Rng(seed));
      expect(r3.ribbon).not.toBe(r3.ribbonB);
      expect(r3.bead).not.toBe(r3.beadB);
      expect([...r3.claims].sort()).toEqual([...CLAIMS].sort());
      claimsSeen.add(r3.claims.join());
    }
    expect(seen.size).toBeGreaterThan(4);
    expect(claimsSeen.size).toBe(2);
    // Level 1 keeps the cards in their natural order (it shows none).
    expect(makeRound(PLANS[0], new Rng(3)).cards).toEqual([...CARDS]);
  });

  it('has three distinguishable cards and distinguishes informative lane pairs at level 3', () => {
    expect(new Set(CARDS).size).toBe(3);
    expect(rightCard('small')).toBe('small');
    expect(rightCard('tall')).toBe('tall');
    expect(markerTrace(AMPLITUDES.small)).not.toEqual(markerTrace(AMPLITUDES.tall));
    expect(isInformativePair('small', 'small')).toBe(false);
    expect(isInformativePair('tall', 'tall')).toBe(false);
    expect(isInformativePair('small', 'tall')).toBe(true);
    expect(isInformativePair('tall', 'small')).toBe(true);
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

  it('level 3 waits on a contrasting run and checks the hypothesis claim', () => {
    const plan = PLANS[2];
    expect(doneReady(plan, emptySeen(), true)).toBe(false);
    expect(checkClaim(plan, emptySeen(), 'same-time').kind).toBe('need-both');
    const seen = emptySeen();
    for (let k = 0; k <= STEP_COUNT; k++) noteTime(seen, 'contrast', k * DT_STEP);
    expect(doneReady(plan, seen, false)).toBe(false);
    expect(checkClaim(plan, seen, null).kind).toBe('pick-card');
    expect(checkClaim(plan, seen, 'tall-sooner')).toEqual({ kind: 'wrong', card: 'tall-sooner' });
    expect(checkClaim(plan, seen, 'same-time').kind).toBe('right');
    expect(doneReady(plan, seen, true)).toBe(true);
  });
});

describe('help and the ghost finger', () => {
  it('names each help once and leads somewhere', () => {
    expect(nextHelp(PLANS[0], emptySeen())).toBe('send-pulse');
    const s = emptySeen();
    for (let k = 0; k <= STEP_COUNT; k++) noteTime(s, 'medium', k * DT_STEP);
    expect(nextHelp(PLANS[0], s)).toBeNull();
    expect(nextHelp(PLANS[1], emptySeen())).toBe('run-both');
    expect(nextHelp(PLANS[2], emptySeen())).toBe('run-contrast');
    const c = emptySeen();
    for (let k = 0; k <= STEP_COUNT; k++) noteTime(c, 'contrast', k * DT_STEP);
    expect(nextHelp(PLANS[2], c)).toBe('pick-claim');
    const tally = new HelpTally();
    tally.give('run-both');
    tally.give('run-both');
    tally.give('pick-trace');
    expect(tally.count).toBe(2);
  });

  it('a capable player finishes all three levels with no misses', () => {
    for (const plan of PLANS) {
      const round = makeRound(plan, new Rng(11));
      const seen = emptySeen();
      let preset: Preset = plan.presets[0],
        laneA: PulseSize = 'small',
        laneB: PulseSize = 'small',
        picked = null as ReturnType<typeof rightCard> | null,
        pickedClaim = null as ClaimId | null,
        checked = false;
      for (let guard = 0; guard < 20; guard++) {
        const m = nextMove(plan, seen, round, picked, checked, preset, false, laneA, laneB, pickedClaim);
        if (!m) throw new Error('stuck');
        if ('done' in m) break;
        if ('preset' in m) preset = m.preset;
        else if ('lane' in m) {
          if (m.lane === 'A') laneA = laneA === 'small' ? 'tall' : 'small';
          else laneB = laneB === 'small' ? 'tall' : 'small';
        } else if ('send' in m) {
          if (plan.twoLane) {
            if (isInformativePair(laneA, laneB))
              for (let k = 0; k <= STEP_COUNT; k++) noteTime(seen, 'contrast', k * DT_STEP);
          } else {
            for (let k = 0; k <= STEP_COUNT; k++) noteTime(seen, preset, k * DT_STEP);
          }
        } else if ('card' in m) picked = m.card;
        else if ('claim' in m) pickedClaim = m.claim;
        else if ('check' in m) {
          if (plan.twoLane) expect(checkClaim(plan, seen, pickedClaim).kind).toBe('right');
          else expect(checkCard(plan, seen, round, picked).kind).toBe('right');
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
