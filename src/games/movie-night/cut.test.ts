import { describe, expect, it } from 'vitest';
import {
  acceptedStrips,
  cutAccepted,
  CutRound,
  cutPlan,
  distance,
  GARDEN,
  nextRepair,
  PARCEL,
  unmetRequirement,
  type CutStrip,
} from './cut';

const ids = (s: CutStrip) => s.join(' ');
function* strips(level: number, prefix: string[] = []): Generator<string[]> {
  const p = cutPlan(level);
  if (prefix.length === p.slots) return yield prefix;
  for (const c of p.cards) if (!prefix.includes(c.id)) yield* strips(level, [...prefix, c.id]);
}
function premiere(r: CutRound) {
  expect(r.begin('premiere')).toBe(true);
  return r.complete();
}

describe('Movie Night levels 4–5: the authored footage and the exact accepted strips', () => {
  it('keeps each shot’s facts and cue', () => {
    expect(GARDEN.map((c) => [c.id, c.facts.length, c.cue])).toEqual([
      ['G0', 3, 0.8],
      ['G1', 4, 0.8],
      ['G2', 3, 0.8],
      ['G3', 2, 0.8],
    ]);
    expect(PARCEL.map((c) => c.id)).toEqual(['B0', 'B1', 'B2', 'B3', 'B4']);
    expect(PARCEL[2].facts).toEqual(expect.arrayContaining(['thing:box', 'thing:kite', 'event:opens']));
  });

  it('level 4 accepts exactly 6 of the 24 full strips, in the definition’s order', () => {
    expect([...strips(4)]).toHaveLength(24);
    expect(acceptedStrips(4).map(ids)).toEqual([
      'G0 G1 G2',
      'G1 G0 G2',
      'G1 G2 G0',
      'G1 G2 G3',
      'G1 G3 G2',
      'G3 G1 G2',
    ]);
  });

  it('level 5 accepts exactly 30 of the 120 full strips: 6 omit B4, 16 omit B3, 4 omit B0, 4 omit B1', () => {
    expect([...strips(5)]).toHaveLength(120);
    const ok = acceptedStrips(5);
    expect(ok).toHaveLength(30);
    const omitted = (id: string) => ok.filter((s) => !s.includes(id)).length;
    expect([omitted('B4'), omitted('B3'), omitted('B0'), omitted('B1')]).toEqual([6, 16, 4, 4]);
    for (const s of ok) {
      expect(s).toContain('B2');
      expect(s.indexOf('B0') >= 0 || s.indexOf('B1') >= 0).toBe(true);
    }
    // Those four-card strips are exactly the ones the rules say, whatever their route.
    for (const s of strips(5))
      expect(cutAccepted(5, s)).toBe(
        s.includes('B2') &&
          [s.indexOf('B0'), s.indexOf('B1')].some((i) => i >= 0 && i < s.indexOf('B2')) &&
          (!s.includes('B3') || s.indexOf('B3') > s.indexOf('B2')),
      );
  });

  it('passes the Story Steps overlap test: several answers, and some differ by shot set, not only order', () => {
    const inTime: Record<number, string> = { 4: 'G0 G1 G2', 5: 'B0 B1 B2 B3' };
    for (const level of [4, 5]) {
      const ok = acceptedStrips(level);
      expect(ok.length).toBeGreaterThan(1);
      expect(ok.map(ids)).toContain(inTime[level]);
      const timeSet = new Set(inTime[level].split(' '));
      expect(ok.some((s) => s.some((c) => c !== null && !timeSet.has(c)))).toBe(true);
    }
  });

  it('never accepts a partial strip, a repeated card or a card from the other footage', () => {
    expect(cutAccepted(4, ['G1', 'G2', null])).toBe(false);
    expect(cutAccepted(4, ['G1', 'G1', 'G2'])).toBe(false);
    expect(cutAccepted(4, ['G1', 'G2', 'B4'])).toBe(false);
    expect(cutAccepted(5, ['B0', 'B2', 'B3', null])).toBe(false);
  });
});

describe('Movie Night levels 4–5: which request is asked about first', () => {
  const first = (level: number, s: CutStrip) => {
    const r = unmetRequirement(level, s);
    return r && [r.line, r.point];
  };
  it('level 4 asks for the find, then the smile, then the smile after the find', () => {
    expect(first(4, ['G0', 'G2', 'G3'])).toEqual(['mn.findRequest', 'G1']);
    expect(first(4, ['G0', 'G1', 'G3'])).toEqual(['mn.smileRequest', 'G2']);
    expect(first(4, ['G2', 'G1', 'G0'])).toEqual(['mn.smileAfterRequest', 'G2']);
  });
  it('level 5 asks for the opening, the box before it, then no kite before it', () => {
    expect(first(5, ['B0', 'B1', 'B3', 'B4'])).toEqual(['mn.openRequest', 'B2']);
    expect(first(5, ['B4', 'B3', 'B2', null])).toEqual(['mn.boxRequest', 'B0']);
    expect(first(5, ['B0', 'B3', 'B2', 'B1'])).toEqual(['mn.kiteRequest', 'B3']);
    expect(first(5, ['B1', 'B2', 'B3', 'B4'])).toBeUndefined();
  });
  it('every pointed card shows the fact asked about', () => {
    for (const level of [4, 5]) {
      const p = cutPlan(level);
      for (const r of p.requirements) expect(p.cards.some((c) => c.id === r.point)).toBe(true);
    }
  });
});

describe('Movie Night levels 4–5: the repair rule', () => {
  it('lowers the distance by exactly one each time and reaches an accepted strip within the slot count', () => {
    for (const level of [4, 5]) {
      const p = cutPlan(level);
      const states: CutStrip[] = [];
      const walk = (prefix: (string | null)[]) => {
        if (prefix.length === p.slots) return void states.push(prefix);
        for (const c of [null, ...p.cards.map((c) => c.id)])
          if (c === null || !prefix.includes(c)) walk([...prefix, c]);
      };
      walk([]);
      for (const start of states) {
        const strip = [...start];
        let steps = 0;
        const dist = (s: CutStrip) => Math.min(...acceptedStrips(level).map((t) => distance(s, t)));
        while (!cutAccepted(level, strip)) {
          const before = dist(strip);
          const r = nextRepair(level, strip)!;
          expect(r).toBeDefined();
          const target = acceptedStrips(level)
            .filter((t) => distance(strip, t) === before)
            .find((t) => t[strip.findIndex((s, i) => s !== t[i])] === r.card)!;
          const from = strip.indexOf(r.card);
          if (from >= 0) strip[from] = null;
          // Never removes a card that the chosen target also holds in that slot.
          if (strip[r.slot] !== null) expect(target[r.slot]).not.toBe(strip[r.slot]);
          strip[r.slot] = r.card;
          expect(dist(strip)).toBe(before - 1);
          expect(++steps).toBeLessThanOrEqual(p.slots);
        }
      }
    }
  });
  it('has distance 0 for every accepted strip and no repair for it', () => {
    for (const level of [4, 5])
      for (const t of acceptedStrips(level)) {
        expect(distance(t, t)).toBe(0);
        expect(nextRepair(level, t)).toBeUndefined();
      }
  });
  it('keeps her own choices where a target allows', () => {
    expect(nextRepair(4, ['G0', null, null])).toEqual({ card: 'G1', slot: 1 });
    expect(nextRepair(5, ['B1', null, null, null])).toEqual({ card: 'B0', slot: 1 });
  });
});

describe('Movie Night levels 4–5: placing, Watch, Premiere and accounting', () => {
  it('keeps cards scarce: a tray card swaps its occupant out, a slot card swaps places', () => {
    const r = new CutRound(4);
    expect(r.place('G0', 0)).toBe(true);
    expect(r.place('G1', 1)).toBe(true);
    expect(r.place('G0', 1)).toBe(true);
    expect(r.strip).toEqual([G1(), 'G0', null]);
    expect(r.place('G0', 1)).toBe(false);
    expect(r.remove(2)).toBe(false);
    expect(r.remove(0)).toBe(true);
    expect(r.strip).toEqual([null, 'G0', null]);
    expect(new Set(r.strip.filter(Boolean)).size).toBe(r.strip.filter(Boolean).length);
  });
  function G1() {
    return 'G1';
  }
  it('offers Watch for any nonempty strip and Premiere only for a full one, neither costing a miss', () => {
    const r = new CutRound(5);
    expect(r.begin('watch')).toBe(false);
    r.place('B0', 0);
    expect(r.begin('premiere')).toBe(false);
    expect(r.begin('watch')).toBe(true);
    r.complete();
    expect([r.misses, r.hints, r.failures]).toEqual([0, 0, 0]);
  });
  it('counts a wrong Premiere 0/0, then 1 miss and 1 hint, then 1 more miss (level 4)', () => {
    const r = new CutRound(4);
    ['G0', 'G3', 'G2'].forEach((c, i) => r.place(c, i));
    premiere(r);
    expect([r.misses, r.hints]).toEqual([0, 0]);
    premiere(r);
    expect([r.misses, r.hints, r.automaticHint]).toEqual([1, 1, true]);
    premiere(r);
    expect([r.misses, r.hints]).toEqual([2, 1]);
  });
  it('counts a wrong Premiere the same way at level 5 and finishes once after a good one', () => {
    const r = new CutRound(5);
    ['B0', 'B1', 'B3', 'B4'].forEach((c, i) => r.place(c, i));
    premiere(r);
    premiere(r);
    expect([r.misses, r.hints]).toEqual([1, 1]);
    r.place('B2', 2);
    expect(r.qualified).toBe(false);
    expect(premiere(r)!.ok).toBe(true);
    expect(r.bow()).toEqual({ misses: 1, hints: 1 });
    expect(r.bow()).toBeNull();
  });
  it('Help costs one hint per repairing step, nothing on an accepted strip, and never judges', () => {
    const r = new CutRound(4);
    const steps: string[] = [];
    for (let i = 0; i < 4; i++) {
      const h = r.help();
      if (h) steps.push(h.card);
    }
    expect(steps).toEqual(['G0', 'G1', 'G2']);
    expect(cutAccepted(4, r.strip)).toBe(true);
    expect([r.hints, r.misses, r.failures, r.qualified]).toEqual([3, 0, 0, false]);
    expect(r.help()).toBeUndefined();
    expect(r.hints).toBe(3);
  });
  it('an edit invalidates a good Premiere, Undo never qualifies, and nothing edits mid-run or after Bow', () => {
    const r = new CutRound(4);
    ['G1', 'G2', 'G3'].forEach((c, i) => r.place(c, i));
    expect(premiere(r)!.ok).toBe(true);
    r.place('G0', 2);
    expect(r.qualified).toBe(false);
    expect(r.bow()).toBeNull();
    r.undo();
    expect(r.qualified).toBe(false);
    expect(premiere(r)!.ok).toBe(true);
    r.begin('watch');
    expect(r.place('G0', 0)).toBe(false);
    expect(r.undo()).toBe(false);
    r.stop();
    expect(r.bow()).not.toBeNull();
    expect(r.place('G0', 0)).toBe(false);
  });
  it('a stopped Premiere is not judged, and a destroyed round ignores everything', () => {
    const r = new CutRound(4);
    ['G1', 'G2', 'G3'].forEach((c, i) => r.place(c, i));
    r.begin('premiere');
    r.stop();
    expect(r.complete()).toBeNull();
    expect([r.failures, r.qualified]).toEqual([0, false]);
    r.destroy();
    expect(r.begin('watch')).toBe(false);
  });
});
