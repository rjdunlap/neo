import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { HOW_TO } from './howto';
import { VOICE } from './voice';
import {
  ANSWER_SIZE,
  ART_R,
  BAR_MAX,
  BAR_MIN,
  BAR_VALUES,
  barAt,
  barsAlong,
  FILE_SAMPLES,
  FITS_WHOLE,
  GREEN_BALL_R,
  helpFor,
  judgeSize,
  lengthKey,
  lengthLabel,
  lensLayout,
  LensTally,
  LEVELS,
  MEASURED,
  MEASURED_IDS,
  measureRoundFor,
  measuringStop,
  planFor,
  SIZE_SLOTS,
  sizeChoices,
  STOP4_ZOOM,
  STOPS,
  SWIMMER_ART_LEN,
  unitsPerMicron,
  type SizeSlot,
} from './logic';

const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phoneLandscape: computeView(844, 390),
  phonePortrait: computeView(390, 844),
};

describe('level 10 table', () => {
  it('each measured sample is a file sample, drawn only where it shows evidence, and its length lies in its sourced range', () => {
    for (const id of MEASURED_IDS) {
      const m = MEASURED[id];
      expect(FILE_SAMPLES[id]).toBeDefined();
      expect(m.microns).toBeGreaterThanOrEqual(m.range[0]);
      expect(m.microns).toBeLessThanOrEqual(m.range[1]);
      for (const stop of STOPS)
        expect(m.drawn[stop - 1] > 0, `${id} at ${stop}`).toBe(
          FILE_SAMPLES[id].evidence[stop - 1].length > 0,
        );
    }
  });
  it('the drawn lengths are the built drawings’ lengths', () => {
    expect(MEASURED.swimmer.drawn[2]).toBe(SWIMMER_ART_LEN);
    expect(MEASURED.swimmer.drawn[3]).toBeCloseTo(SWIMMER_ART_LEN * STOP4_ZOOM);
    expect(MEASURED['green-ball'].drawn[3]).toBe(GREEN_BALL_R * 2);
    expect(SWIMMER_ART_LEN).toBe(130);
  });
  it('the drawn length over units-per-micron is the table length wherever something is drawn', () => {
    for (const id of MEASURED_IDS)
      for (const stop of STOPS) {
        const k = unitsPerMicron(id, stop);
        if (k) expect(MEASURED[id].drawn[stop - 1] / k).toBeCloseTo(MEASURED[id].microns);
        else expect(barAt(id, stop)).toBeNull();
      }
  });
});

describe('level 10 scale bar', () => {
  it('every view that draws the sample has a bar: one of the four values, 60 to 240 units long, and the largest that fits', () => {
    for (const id of MEASURED_IDS)
      for (const stop of STOPS) {
        if (!MEASURED[id].drawn[stop - 1]) continue;
        const bar = barAt(id, stop);
        expect(bar, `${id} at ${stop}`).not.toBeNull();
        if (!bar) continue;
        expect(BAR_VALUES).toContain(bar.value);
        expect(bar.units).toBeGreaterThanOrEqual(BAR_MIN);
        expect(bar.units).toBeLessThanOrEqual(BAR_MAX);
        expect(bar.units).toBeCloseTo(bar.value * unitsPerMicron(id, stop));
        for (const bigger of BAR_VALUES.filter((v) => v > bar.value))
          expect(bigger * unitsPerMicron(id, stop)).toBeGreaterThan(BAR_MAX);
      }
  });
  it('the bar fits across the view where it is drawn', () => {
    expect(BAR_MAX).toBeLessThan(ART_R * 2 * 0.7);
  });
  it('the measuring stop is the lowest that shows the thing whole: 3 for the swimmer and the sand grain, 4 for the green ball', () => {
    expect(measuringStop('swimmer')).toBe(3);
    expect(measuringStop('sand-grain')).toBe(3);
    expect(measuringStop('green-ball')).toBe(4);
    for (const id of MEASURED_IDS) {
      const at = MEASURED[id].drawn[measuringStop(id) - 1];
      expect(at).toBeGreaterThan(0);
      expect(at).toBeLessThanOrEqual(FITS_WHOLE);
    }
  });
  it('the count of bars is the same at every stop that shows a bar, and is the count its closing line says', () => {
    const said: Record<string, [RegExp, RegExp]> = {
      swimmer: [/two bars/, /hundred micrometres: two hundred micrometres/],
      'green-ball': [/One bar/, /ten micrometres: ten micrometres/],
      'sand-grain': [/three bars/, /hundred micrometres: three hundred micrometres/],
    };
    const count: Record<string, number> = { swimmer: 2, 'green-ball': 1, 'sand-grain': 3 };
    for (const id of MEASURED_IDS) {
      for (const stop of STOPS)
        if (barAt(id, stop)) expect(barsAlong(id, stop), `${id} at ${stop}`).toBe(count[id]);
      const line = VOICE[`lens.file.yes.size.${id}`][0];
      for (const re of said[id]) expect(line).toMatch(re);
    }
  });
});

describe('level 10 choices and verdicts', () => {
  it('three lengths ten times apart in rising order, the true one at its slot, inside the sourced range, the others outside it', () => {
    for (const id of MEASURED_IDS)
      for (const slot of SIZE_SLOTS) {
        const c = sizeChoices(id, slot);
        const [lo, hi] = MEASURED[id].range;
        expect(c[slot]).toBe(MEASURED[id].microns);
        expect(c[1] / c[0]).toBeCloseTo(10);
        expect(c[2] / c[1]).toBeCloseTo(10);
        c.forEach((v, i) => expect(v >= lo && v <= hi, `${id} ${v}`).toBe(i === slot));
      }
  });
  it('every length a button can show has a label and a spoken line', () => {
    const labels = new Set<string>();
    for (const id of MEASURED_IDS)
      for (const slot of SIZE_SLOTS)
        for (const v of sizeChoices(id, slot)) {
          expect(VOICE).toHaveProperty([`lens.file.len.${lengthKey(v)}`]);
          expect(lengthLabel(v)).toMatch(/^[\d.]+ (µm|mm)$/);
          labels.add(lengthLabel(v));
        }
    expect(labels.size).toBe(15);
    expect(lengthLabel(200)).toBe('200 µm');
    expect(lengthLabel(2000)).toBe('2 mm');
    expect(lengthLabel(0.1)).toBe('0.1 µm');
    expect(sizeChoices('swimmer', 1).map(lengthLabel)).toEqual(['20 µm', '200 µm', '2 mm']);
  });
  it('every bar value has a spoken name and a count-the-bars line', () => {
    for (const v of BAR_VALUES) {
      expect(VOICE).toHaveProperty([`lens.file.bar.${v}`]);
      expect(VOICE).toHaveProperty([`lens.file.see.bars.${v}`]);
    }
  });
  it('below the measuring stop every length is free with the same line', () => {
    for (const id of MEASURED_IDS)
      for (const slot of SIZE_SLOTS)
        for (const stop of STOPS.filter((s) => s < measuringStop(id)))
          for (const choice of SIZE_SLOTS)
            expect(judgeSize(id, slot, stop, choice)).toEqual({
              result: 'free',
              line: 'lens.file.need-ends',
            });
  });
  it('at or above it the true length is right and a wrong one is a miss that names the bar, never the answer', () => {
    for (const id of MEASURED_IDS)
      for (const slot of SIZE_SLOTS)
        for (const stop of STOPS.filter((s) => s >= measuringStop(id)))
          for (const choice of SIZE_SLOTS) {
            const v = judgeSize(id, slot, stop, choice);
            if (choice === slot) expect(v).toEqual({ result: 'right', line: `lens.file.yes.size.${id}` });
            else {
              expect(v.result).toBe('miss');
              expect(v.line).toBe(`lens.file.see.bars.${barAt(id, stop)!.value}`);
              // The line says the bar's own value and no other length.
              const line = VOICE[v.line as keyof typeof VOICE][0];
              expect(line).not.toMatch(/two hundred|three hundred/);
            }
          }
  });
  it('no line says a microbe, a germ, a species, a magnification or where a slide came from', () => {
    for (const [id, lines] of Object.entries(VOICE))
      if (/^lens\.file\.(len|bar|see\.bars|yes\.size|need-ends|instruct\.size)/.test(id))
        for (const l of lines)
          expect(l).not.toMatch(/microbe|bacteri|germ|dirty|clean|times|paramecium|chlorella/i);
  });
});

describe('level 10 rounds', () => {
  it('the authored round is the swimmer (20 µm, 200 µm, 2 mm), the green ball, then the sand grain', () => {
    const r = measureRoundFor(new Rng(1), true);
    expect(r.map((f) => f.sample)).toEqual(['swimmer', 'green-ball', 'sand-grain']);
    expect(r[0].slot).toBe(1);
  });
  it('across 500 seeds: one of each sample, the true length not in the same place on all three, and the swimmer stays in view', () => {
    const first = new Set<string>();
    const slots = new Set<SizeSlot>();
    for (let seed = 1; seed <= 500; seed++)
      for (const authored of [false, true]) {
        const r = measureRoundFor(new Rng(seed), authored);
        expect(r.length).toBe(3);
        expect(new Set(r.map((f) => f.sample)).size).toBe(3);
        expect(new Set(r.map((f) => f.slot)).size).toBeGreaterThan(1);
        if (!authored) first.add(r[0].sample);
        for (const f of r) {
          slots.add(f.slot);
          const still = FILE_SAMPLES[f.sample].motion === 'still';
          expect(f.path.ax === 0 && f.path.ay === 0).toBe(still);
        }
      }
    expect(first.size).toBe(3);
    expect(slots.size).toBe(3);
  });
});

describe('level 10 help, tally and ladder', () => {
  it('Show a hint turns to each sample’s measuring stop', () => {
    for (const id of MEASURED_IDS)
      expect(helpFor(10, { measure: id })).toEqual({ do: 'turn', stop: measuringStop(id) });
    expect(helpFor(10, {})).toBeNull();
  });
  it('a scripted file (free early length, wrong length, hint, hint again, right length) counts one miss and one hint', () => {
    const tally = new LensTally();
    expect(judgeSize('swimmer', 1, 2, 2).result).toBe('free');
    if (judgeSize('swimmer', 1, 3, 0).result === 'miss') tally.miss();
    tally.hint();
    tally.hint();
    expect(judgeSize('swimmer', 1, 3, 1).result).toBe('right');
    expect([tally.misses, tally.hints, tally.glow]).toEqual([1, 1, false]);
  });
  it('a grown-up’s range starts at 9 and holds level 10, and no other band’s range moved', () => {
    expect(rangeFor(LEVELS, 'grownup').min).toBe(9);
    expect(rangeFor(LEVELS, 'grownup').max).toBeGreaterThanOrEqual(10);
    expect(LEVELS.school).toEqual({ min: 4, max: 8 });
    expect(planFor(10).level).toBe(10);
    expect(planFor(10).name).toMatch(/^Measure it/);
    for (const part of [HOW_TO.steps, HOW_TO.finish]) {
      const lines = typeof part === 'string' ? [] : part;
      expect(lines.some((s) => typeof s !== 'string' && (s.from ?? 1) <= 10 && (s.to ?? 99) >= 10)).toBe(
        true,
      );
    }
  });
  it('level 10 keeps the three full-size answers and a lens no smaller than level 8’s in every view', () => {
    for (const [name, v] of Object.entries(views)) {
      const l = lensLayout(v, 10);
      expect(l, name).not.toBeNull();
      if (!l) continue;
      expect(l.choices.length).toBe(3);
      for (const c of l.choices) expect(Math.min(c.w, c.h)).toBe(ANSWER_SIZE);
      expect(l.stops.length).toBe(4);
      expect(l).toEqual(lensLayout(v, 8));
    }
  });
});
