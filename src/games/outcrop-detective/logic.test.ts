import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ABXC,
  LEVEL1_OBS,
  LEVELS,
  LOOKS,
  RIBBONS,
  SAND_OBS,
  answer,
  check,
  fits,
  fitting,
  hint,
  hintStep,
  hintsToFit,
  informative,
  key,
  look,
  makeRound,
  openingSet,
  predict,
  restart,
  sandOffObs,
  start,
  swap,
  whyNot,
  type Card,
  type Obs,
  type Ribbon,
  type State,
} from './logic';

const r = (s: string): Card[] => s.split('') as Card[];
const STATES: [string, Obs][] = [
  ['level 1', LEVEL1_OBS],
  ['sand', SAND_OBS],
  ['sand off, cut', sandOffObs('cut')],
  ['sand off, covers', sandOffObs('covers')],
];
const histogram = (obs: Obs): number[] => {
  const h = [0, 0, 0, 0];
  for (const rb of RIBBONS) h[hintsToFit(rb, obs)]++;
  return h;
};

describe('the preview rule', () => {
  it('covers all 24 distinct ribbons', () => {
    expect(new Set(RIBBONS.map(key)).size).toBe(24);
    expect(key(RIBBONS[0])).toBe('ABXC');
  });
  it('stacks deposits in ribbon order and marks each contact by whether it came before X', () => {
    for (const rb of RIBBONS) {
      const p = predict(rb);
      expect(p.stack).toEqual(rb.filter((c) => c !== 'X'));
      for (const d of ['A', 'B', 'C'] as const) {
        expect(p.contact[d]).toBe(rb.indexOf(d) < rb.indexOf('X') ? 'cut' : 'covers');
      }
    }
  });
  it('handles X first (cuts nothing) and X last (cuts all three)', () => {
    expect(predict(r('XABC'))).toEqual({
      stack: ['A', 'B', 'C'],
      contact: { A: 'covers', B: 'covers', C: 'covers' },
      cuts: 0,
    });
    expect(predict(r('CBAX'))).toEqual({
      stack: ['C', 'B', 'A'],
      contact: { A: 'cut', B: 'cut', C: 'cut' },
      cuts: 3,
    });
  });
});

describe('every accepted history', () => {
  it('matches the definition table exactly', () => {
    expect(fitting(LEVEL1_OBS).map(key)).toEqual(['ABXC']);
    expect(fitting(SAND_OBS).map(key).sort()).toEqual(['ABXC', 'AXBC']);
    expect(fitting(sandOffObs('cut')).map(key)).toEqual(['ABXC']);
    expect(fitting(sandOffObs('covers')).map(key)).toEqual(['AXBC']);
  });
});

describe('whyNot', () => {
  it('gives a reason for every wrong ribbon in every state and none for a fitting one', () => {
    for (const [, obs] of STATES) {
      for (const rb of RIBBONS) expect(whyNot(rb, obs) === null).toBe(fits(rb, obs));
    }
    expect(RIBBONS.filter((rb) => whyNot(rb, LEVEL1_OBS)).length).toBe(23);
    expect(RIBBONS.filter((rb) => whyNot(rb, SAND_OBS)).length).toBe(22);
  });
  it('names the first broken rule in the fixed order', () => {
    expect(whyNot(r('AXCB'), LEVEL1_OBS)).toEqual({ rule: 'stack', lower: 'B', upper: 'C' });
    expect(whyNot(r('BAXC'), LEVEL1_OBS)).toEqual({ rule: 'stack', lower: 'A', upper: 'B' });
    expect(whyNot(r('AXBC'), LEVEL1_OBS)).toMatchObject({ rule: 'cut', layer: 'B' });
    expect(whyNot(r('XABC'), LEVEL1_OBS)).toMatchObject({ rule: 'cut', layer: 'A', first: true });
    expect(whyNot(r('ABCX'), LEVEL1_OBS)).toMatchObject({ rule: 'cover', layer: 'C', last: true });
    // A hidden contact is never checked.
    expect(whyNot(r('AXBC'), SAND_OBS)).toBeNull();
  });
});

describe('looks', () => {
  it('only the sand look is informative, and each sand-off outcome leaves one fitting ribbon', () => {
    expect(LOOKS.filter((l) => informative(SAND_OBS, l))).toEqual(['look-sand']);
    expect(fitting(sandOffObs('cut'))).toHaveLength(1);
    expect(fitting(sandOffObs('covers'))).toHaveLength(1);
  });
});

describe('the hint walk', () => {
  it('closes from every ribbon in at most three hints, with the counts in the definition', () => {
    expect(histogram(LEVEL1_OBS)).toEqual([1, 6, 11, 6]);
    expect(histogram(SAND_OBS)).toEqual([2, 9, 10, 3]);
    expect(histogram(sandOffObs('cut'))).toEqual([1, 6, 11, 6]);
    expect(histogram(sandOffObs('covers'))).toEqual([1, 6, 11, 6]);
  });
  it('moves one card into the first differing slot, toward the nearer fitting story', () => {
    const step = hintStep(r('AXCB'), LEVEL1_OBS)!;
    expect(step.slot).toBe(1);
    expect(step.card).toBe('B');
    expect(key(step.ribbon)).toBe('ABCX');
    // With sand, the target is the fitting story sharing the longest opening run (AX… → AXBC).
    expect(key(hintStep(r('AXCB'), SAND_OBS)!.target)).toBe('AXBC');
    expect(key(hintStep(r('CBAX'), SAND_OBS)!.target)).toBe('ABXC');
  });
});

describe('the seeded round', () => {
  it('opens on a ribbon that needs exactly two hints, never solved', () => {
    expect(openingSet(1)).toHaveLength(11);
    expect(openingSet(2)).toHaveLength(10);
    for (let seed = 1; seed <= 60; seed++) {
      for (const lv of [1, 2] as const) {
        const round = makeRound(lv, new Rng(seed));
        expect(hintsToFit(round.opening, lv === 1 ? LEVEL1_OBS : SAND_OBS)).toBe(2);
        expect(new Set(Object.values(round.pattern)).size).toBe(3);
        expect(new Set(Object.values(round.colour)).size).toBe(3);
        expect([...round.looks].sort()).toEqual([...LOOKS].sort());
      }
    }
  });
  it('varies patterns, side, opening and hidden truth across seeds', () => {
    const rounds = Array.from({ length: 60 }, (_, i) => makeRound(2, new Rng(i + 1)));
    expect(new Set(rounds.map((x) => x.truth))).toEqual(new Set(['cut', 'covers']));
    expect(new Set(rounds.map((x) => x.side)).size).toBe(2);
    expect(new Set(rounds.map((x) => key(x.opening))).size).toBeGreaterThan(4);
    expect(new Set(rounds.map((x) => x.pattern.A)).size).toBeGreaterThan(2);
  });
  it('has both bands at levels 1 to 2', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 2 }, grownup: { min: 1, max: 2 } });
  });
});

const at = (level: 1 | 2, opening: string, truth: 'cut' | 'covers' = 'covers'): State => {
  const round = makeRound(level, new Rng(7));
  return start({ ...round, opening: r(opening), truth });
};
const setRibbon = (s: State, target: Ribbon): State => {
  let cur = s;
  for (let i = 0; i < 4; i++) {
    const j = cur.ribbon.indexOf(target[i]);
    cur = swap(cur, i, j);
  }
  return cur;
};

describe('accounting', () => {
  it('plays the level 1 first round from the definition: two misses, one glow hint', () => {
    let s = at(1, 'AXCB');
    s = check(s).state;
    expect(s.misses).toBe(1);
    s = check(s).state; // re-check is free
    expect(s.misses).toBe(1);
    s = swap(s, 2, 3); // AXBC
    const second = check(s);
    expect(second.events.some((e) => e.kind === 'glow')).toBe(true);
    s = second.state;
    expect([s.misses, s.hints]).toEqual([2, 1]);
    s = setRibbon(s, ABXC);
    s = check(s).state;
    expect(s.step).toBe('sure');
    s = answer(s, 'yes').state;
    expect(s.step).toBe('done');
    expect([s.misses, s.hints]).toEqual([2, 1]);
  });

  it('counts a level 1 Not enough to tell once and waits for Yes', () => {
    let s = check(setRibbon(at(1, 'AXCB'), ABXC)).state;
    s = answer(s, 'unsure').state;
    s = answer(s, 'unsure').state;
    expect([s.misses, s.step]).toEqual([1, 'sure']);
    expect(answer(s, 'yes').state.step).toBe('done');
  });

  it('plays the level 2 first round from the definition: one miss, no hints', () => {
    let s = at(2, 'ACBX', 'covers');
    s = setRibbon(s, r('AXBC'));
    s = check(s).state;
    expect([s.step, s.misses]).toEqual(['sure', 0]);
    const yes = answer(s, 'yes');
    s = yes.state;
    expect(key(s.ribbon)).toBe('ABXC'); // swapped to the other fitting story
    expect(s.misses).toBe(1);
    s = answer(s, 'unsure').state;
    expect(s.step).toBe('look');
    const sand = look(s, 'look-sand');
    expect(sand.events[0]).toMatchObject({ kind: 'look-sand', truth: 'covers', stillFits: false });
    s = sand.state;
    expect([s.step, s.record]).toEqual(['again', 'sand-off']);
    s = check(s).state; // ABXC now wrong, counted in the sand-off state
    expect(s.misses).toBe(2);
    s = setRibbon(s, r('AXBC'));
    s = check(s).state;
    expect(s.step).toBe('done');
  });

  it('keys wrong ribbons per record state, and counts each wrong look once', () => {
    let s = at(2, 'ACBX', 'cut');
    s = check(s).state;
    expect(s.misses).toBe(1);
    s = check(setRibbon(s, ABXC)).state;
    s = answer(s, 'unsure').state;
    s = look(s, 'look-low').state;
    s = look(s, 'look-low').state;
    expect(s.misses).toBe(2);
    s = look(s, 'look-top').state; // second miss on this step: glow
    expect([s.misses, s.hints, s.glowed]).toEqual([3, 1, true]);
    s = look(s, 'look-sand').state;
    // ABXC still fits when the dark rock cuts B: one Check closes it.
    s = check(s).state;
    expect(s.step).toBe('done');
  });

  it('counts one hint per press that changes something', () => {
    let s = at(1, 'AXCB');
    s = hint(s).state;
    s = hint(s).state;
    expect(fits(s.ribbon, LEVEL1_OBS)).toBe(true);
    expect(s.hints).toBe(2);
    expect(hint(s).state.hints).toBe(2); // nothing left to change
    s = check(s).state;
    s = hint(s).state; // the right button glows
    expect(s.hints).toBe(3);
    expect(hint(s).state.hints).toBe(3);
    expect(s.misses).toBe(0);
  });

  it('never counts swaps or ignored actions, and Start again keeps the counts', () => {
    let s = at(1, 'AXCB');
    for (let i = 0; i < 6; i++) s = swap(s, i % 4, (i + 1) % 4);
    expect(answer(s, 'yes').events[0].kind).toBe('ignored');
    expect(look(s, 'look-sand').events[0].kind).toBe('ignored');
    s = check(s).state;
    const again = restart(s);
    expect(again.misses).toBe(s.misses);
    expect(key(again.ribbon)).toBe('AXCB');
  });
});
