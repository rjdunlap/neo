import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { UPRIGHT_VIEWS } from '../upright-check';
import {
  LEVELS,
  SENTENCES,
  SIGNS,
  SOUND_SIGNS,
  THING_SIGNS,
  askRebus,
  briefFor,
  corners,
  liftSlot,
  overlaps,
  placeSign,
  planFor,
  readRebus,
  rebusHint,
  rebusTally,
  sentenceFor,
  startRebus,
  tabletLayout,
  trayLeft,
  type RebusBrief,
  type RebusCase,
  type RebusState,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i);
const briefs = SEEDS.map((s) => briefFor(7, new Rng(s)) as RebusBrief);

describe('level 7 plan', () => {
  it('is the rebus, and school plays it with level 7 as the top', () => {
    expect(planFor(7).id).toBe('rebus');
    expect(LEVELS.school).toEqual({ min: 3, max: 7 });
    expect(LEVELS.preschool?.max).toBe(2);
    expect(LEVELS.prek?.max).toBe(3);
  });
});

describe('level 7 sentences', () => {
  it('has 9 sound signs and 8 plain things, all different', () => {
    expect(SOUND_SIGNS).toHaveLength(9);
    expect(THING_SIGNS).toHaveLength(8);
    expect(new Set(SIGNS).size).toBe(17);
  });
  it('writes each sentence with three different sound signs', () => {
    expect(SENTENCES).toHaveLength(6);
    for (const s of SENTENCES) {
      expect(new Set(s.solution).size).toBe(3);
      for (const x of s.solution) expect(SOUND_SIGNS).toContain(x);
    }
  });
  it('never offers a distractor that sounds like a word: only plain things, none in the solution', () => {
    for (const s of SENTENCES) {
      expect(s.distractors.length).toBeGreaterThanOrEqual(3);
      for (const d of s.distractors) {
        expect(THING_SIGNS).toContain(d);
        expect(s.solution).not.toContain(d);
      }
    }
  });
  it('has a unique solution: the tray holds each sign once, so no other three signs fit its order', () => {
    for (const b of briefs)
      for (const c of b.cases) {
        expect(new Set(c.tray).size).toBe(6);
        for (const x of c.solution) expect(c.tray).toContain(x);
      }
  });
});

describe('level 7 briefs', () => {
  it('draws two different sentences with a six-sign tray of three solution signs and three plain things', () => {
    for (const b of briefs) {
      expect(b.id).toBe('rebus');
      const [a, c] = b.cases;
      expect(a.id).not.toBe(c.id);
      for (const x of b.cases) {
        expect(x.solution).toEqual(sentenceFor(x.id).solution);
        expect(x.tray).toHaveLength(6);
        expect(x.tray.filter((t) => THING_SIGNS.includes(t))).toHaveLength(3);
      }
    }
  });
  it('is deterministic by seed and uses every sentence somewhere', () => {
    expect(briefFor(7, new Rng(5))).toEqual(briefFor(7, new Rng(5)));
    const seen = new Set(briefs.flatMap((b) => b.cases.map((c) => c.id)));
    expect(seen.size).toBe(6);
  });
});

const solved = (c: RebusCase): RebusState => {
  let s = startRebus(c);
  for (const x of c.solution) s = placeSign(s, x).state;
  return s;
};
const caseOf = (i = 0) => briefs[i].cases[0];

describe('level 7 placing and lifting', () => {
  it('places each sign in the leftmost empty cell and takes it off the tray', () => {
    const c = caseOf();
    let s = startRebus(c);
    expect(trayLeft(s)).toHaveLength(6);
    const r = placeSign(s, c.tray[0]);
    expect(r.result).toBe('placed');
    expect(r.state.slots[0]).toBe(c.tray[0]);
    expect(trayLeft(r.state)).toHaveLength(5);
    s = r.state;
    expect(placeSign(s, c.tray[0]).result).toBe('none');
  });
  it('wobbles when full and never counts it', () => {
    const c = caseOf();
    let s = startRebus(c);
    for (const t of c.tray.slice(0, 3)) s = placeSign(s, t).state;
    const r = placeSign(s, c.tray[3]);
    expect(r.result).toBe('full');
    expect(r.state).toEqual(s);
    expect(r.state.misses).toBe(0);
  });
  it('lifts a sign back, free, and lifting an empty cell does nothing', () => {
    const c = caseOf();
    let s = startRebus(c);
    s = placeSign(s, c.tray[0]).state;
    const l = liftSlot(s, 0);
    expect(l.slots[0]).toBeNull();
    expect(trayLeft(l)).toHaveLength(6);
    expect(l.misses).toBe(0);
    expect(liftSlot(l, 1)).toBe(l);
    expect(placeSign(l, c.tray[0]).state.slots[0]).toBe(c.tray[0]);
  });
});

describe('level 7 reading', () => {
  it('only wobbles with fewer than three signs, and counts nothing', () => {
    const c = caseOf();
    const s = placeSign(startRebus(c), c.tray[0]).state;
    const r = readRebus(s);
    expect(r.result).toBe('fill');
    expect(r.state).toEqual(s);
  });
  it('finishes on the exact signs in order', () => {
    for (const b of briefs.slice(0, 40))
      for (const c of b.cases) {
        const r = readRebus(solved(c));
        expect(r.result).toBe('right');
        expect(r.state.done).toBe(true);
        expect(r.state.misses).toBe(0);
        expect(readRebus(r.state).result).toBe('none');
      }
  });
  it('counts one miss for a wrong reading, keeps the signs, and glows with one hint after the second', () => {
    const c = caseOf();
    // The right signs in the wrong order.
    let s = startRebus(c);
    for (const x of [c.solution[1], c.solution[0], c.solution[2]]) s = placeSign(s, x).state;
    const one = readRebus(s);
    expect(one.result).toBe('wrong');
    expect(one.state.misses).toBe(1);
    expect(one.state.slots).toEqual(s.slots);
    expect(one.state.glowing).toBe(false);
    expect(one.state.hinted).toBe(false);
    const two = readRebus(one.state);
    expect(two.state.misses).toBe(2);
    expect(two.state.glowing).toBe(true);
    expect(two.state.hinted).toBe(true);
    const three = readRebus(two.state);
    expect(rebusTally([three.state])).toEqual({ misses: 3, hints: 1 });
  });
  it('help is one hint per sentence however often it is asked', () => {
    const s = askRebus(askRebus(startRebus(caseOf())));
    expect(rebusTally([s])).toEqual({ misses: 0, hints: 1 });
  });
});

/** Apply one hint to a state the way a tap would. */
const follow = (s: RebusState): RebusState => {
  const h = rebusHint(s);
  if (h.action === 'lift') return liftSlot(s, h.slot);
  if (h.action === 'place') return placeSign(s, h.sign).state;
  return readRebus(s).state;
};

describe('level 7 hint', () => {
  it('reaches the sentence from every partial or full filling of the tray, in a few steps', () => {
    for (const x of SENTENCES) {
      const c: RebusCase = {
        id: x.id,
        solution: x.solution,
        tray: [...x.solution, ...x.distractors.slice(0, 3)],
      };
      // Every way to fill the three cells from the tray (including empty cells), up to 7 × 6 × 5 = 210 fillings.
      const opts: (number | null)[] = [null, 0, 1, 2, 3, 4, 5];
      for (const a of opts)
        for (const b of opts)
          for (const d of opts) {
            const picks = [a, b, d];
            const used = picks.filter((p): p is number => p !== null);
            if (new Set(used).size !== used.length) continue;
            let s: RebusState = {
              ...startRebus(c),
              slots: picks.map((p) => (p === null ? null : c.tray[p])),
            };
            let steps = 0;
            while (!s.done && steps < 12) {
              s = follow(s);
              steps++;
            }
            expect(s.done, `${x.id} ${picks.join()}`).toBe(true);
            expect(steps).toBeLessThanOrEqual(8);
          }
    }
  });
  it('points at Read once all three are right, and never at a wrong sign', () => {
    const c = caseOf();
    expect(rebusHint(solved(c))).toEqual({ action: 'read' });
    const h = rebusHint(startRebus(c));
    expect(h).toEqual({ action: 'place', sign: c.solution[0] });
  });
});

describe('level 7 layout', () => {
  const views = [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    ...Object.values(UPRIGHT_VIEWS),
    computeView(768, 1024, NO_INSETS, true),
  ];
  it('fits every view with full-size targets, clear of the corners and of each other', () => {
    for (const v of views) {
      const l = tabletLayout(7, v);
      expect(l, `${v.w}x${v.h}`).not.toBeNull();
      if (!l) continue;
      expect(l.slots).toHaveLength(3);
      expect(l.signs).toHaveLength(6);
      expect(l.inputs).toHaveLength(10);
      for (const p of l.inputs) {
        expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(100);
        for (const q of corners(v)) expect(overlaps(p, q)).toBe(false);
        expect(overlaps(p, l.lane)).toBe(false);
      }
      expect(l.lane.h).toBeGreaterThanOrEqual(110);
      l.inputs.forEach((p, i) =>
        l.inputs.forEach((q, j) => {
          if (i < j) expect(overlaps(p, q)).toBe(false);
        }),
      );
    }
  });
  it('puts the cells above the signs, and Read beside them in landscape or below them in portrait', () => {
    for (const v of views) {
      const l = tabletLayout(7, v)!;
      const cellBottom = Math.max(...l.slots!.map((c) => c.y + c.h));
      for (const s of l.signs!) expect(s.y).toBeGreaterThanOrEqual(cellBottom);
      const trayBottom = Math.max(...l.signs!.map((s) => s.y + s.h));
      if (v.w < v.h) expect(l.handIn!.y).toBeGreaterThanOrEqual(trayBottom);
      else expect(l.handIn!.x).toBeGreaterThanOrEqual(Math.max(...l.signs!.map((s) => s.x + s.w)));
    }
  });
});
