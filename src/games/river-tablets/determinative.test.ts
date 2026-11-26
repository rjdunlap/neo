import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { UPRIGHT_VIEWS } from '../upright-check';
import {
  DET_PAIRS,
  DET_SIGNS,
  DET_SOUNDS,
  LEVELS,
  MAX_LEVEL,
  SIGNS,
  askDeterminative,
  briefFor,
  corners,
  detPairFor,
  determinativeHint,
  determinativeTally,
  overlaps,
  pickDeterminative,
  planFor,
  startDeterminative,
  tabletLayout,
  type DeterminativeBrief,
  type DetId,
} from './logic';

const briefs = Array.from({ length: 300 }, (_, i) => briefFor(8, new Rng(i)) as DeterminativeBrief);

describe('level 8 plan', () => {
  it('is the determinative level, the top of school', () => {
    expect(planFor(8).id).toBe('determinative');
    expect(MAX_LEVEL).toBe(8);
    expect(LEVELS.school).toEqual({ min: 3, max: 8 });
    expect(LEVELS.preschool?.max).toBe(2);
    expect(LEVELS.prek?.max).toBe(3);
  });
});

describe('level 8 pairs', () => {
  it('has four pairs, each with a sound-sign that has a picture and two meanings that need different signs', () => {
    expect(DET_PAIRS).toHaveLength(4);
    expect(DET_SIGNS).toHaveLength(4);
    for (const p of DET_PAIRS) {
      expect(DET_SOUNDS).toContain(p.sound);
      expect(SIGNS.includes(p.sound) || p.sound === 'ant' || p.sound === 'fir').toBe(true);
      expect(p.meanings[0].answer).not.toBe(p.meanings[1].answer);
      expect(p.meanings[0].text).not.toBe(p.meanings[1].text);
      for (const m of p.meanings) expect(DET_SIGNS).toContain(m.answer);
    }
    expect(new Set(DET_PAIRS.map((p) => p.sound)).size).toBe(4);
  });
});

describe('level 8 briefs', () => {
  it('plays both meanings of one pair, in a seeded order', () => {
    const orders = new Set<string>();
    const pairs = new Set<string>();
    for (const b of briefs) {
      const [a, c] = b.cases;
      expect(a.pair).toBe(c.pair);
      expect(a.sound).toBe(c.sound);
      expect(new Set([a.meaning, c.meaning])).toEqual(new Set([0, 1]));
      expect(a.answer).not.toBe(c.answer);
      const p = detPairFor(a.pair);
      for (const x of b.cases)
        expect(p.meanings[x.meaning]).toMatchObject({ text: x.text, answer: x.answer });
      orders.add(`${a.pair}:${a.meaning}`);
      pairs.add(a.pair);
    }
    expect(pairs.size).toBe(4);
    expect(orders.size).toBe(8);
  });
  it('is the same for the same seed', () => {
    expect(briefFor(8, new Rng(5))).toEqual(briefFor(8, new Rng(5)));
  });
});

describe('level 8 rules', () => {
  const state = () => startDeterminative(briefs[0].cases[0]);
  const wrongOf = (answer: DetId): DetId => DET_SIGNS.find((d) => d !== answer)!;

  it('stamps the right sign and finishes the sentence with no miss', () => {
    const s = state();
    const r = pickDeterminative(s, s.answer);
    expect(r.result).toBe('right');
    expect(r.state).toMatchObject({ done: true, stamped: s.answer, misses: 0, hinted: false });
  });
  it('counts a wrong sign as one miss and never changes what is stamped', () => {
    const s = state();
    const r = pickDeterminative(s, wrongOf(s.answer));
    expect(r.result).toBe('wrong');
    expect(r.state).toMatchObject({ done: false, stamped: null, misses: 1, glowing: false, hinted: false });
  });
  it('glows (one hint) after the second miss, and the hint is the answer', () => {
    let s = state();
    for (const d of DET_SIGNS.filter((x) => x !== s.answer).slice(0, 2)) s = pickDeterminative(s, d).state;
    expect(s).toMatchObject({ misses: 2, glowing: true, hinted: true });
    expect(determinativeHint(s)).toBe(s.answer);
    expect(pickDeterminative(s, s.answer).state.hinted).toBe(true);
  });
  it('asked-for help glows once and counts one hint; a finished sentence ignores picks and help', () => {
    const s = askDeterminative(state());
    expect(s).toMatchObject({ glowing: true, hinted: true, misses: 0 });
    const done = pickDeterminative(s, s.answer).state;
    expect(pickDeterminative(done, wrongOf(done.answer)).result).toBe('none');
    expect(askDeterminative(done)).toBe(done);
  });
  it('totals misses and one hint per helped sentence', () => {
    const [a, b] = briefs[0].cases.map(startDeterminative);
    const a2 = pickDeterminative(pickDeterminative(a, wrongOf(a.answer)).state, wrongOf(a.answer)).state;
    expect(determinativeTally([a2, askDeterminative(b)])).toEqual({ misses: 2, hints: 2 });
    expect(determinativeTally([a, b])).toEqual({ misses: 0, hints: 0 });
  });
});

describe('level 8 layout', () => {
  const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
  const landscape = [
    computeView(1024, 768, NO_INSETS),
    computeView(1366, 1024, NO_INSETS),
    computeView(844, 390, NO_INSETS),
  ];
  it.each([...Object.values(views), ...landscape])(
    'lays out four big meaning-signs clear of the corners',
    (v) => {
      const l = tabletLayout(8, v);
      expect(l).not.toBeNull();
      if (!l) return;
      expect(l.dets).toHaveLength(4);
      for (const r of [l.soundCell!, ...l.dets!]) {
        expect(r.w).toBeGreaterThanOrEqual(100);
        expect(r.h).toBeGreaterThanOrEqual(100);
        for (const q of corners(v)) expect(overlaps(r, q)).toBe(false);
      }
      expect(l.detCell!.w).toBeGreaterThanOrEqual(100);
    },
  );
});
