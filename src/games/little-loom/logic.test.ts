import { describe, it, expect } from 'vitest';
import { Round, PEDALS, rejection, drawdown } from './logic';
const bits = (s: string) => [...s].map((c) => c === '1');
describe('island loom holding rules', () => {
  it('exhausts all first-row masks against independent run specification', () => {
    for (let n = 0; n < 64; n++) {
      const s = n.toString(2).padStart(6, '0');
      const want = n === 0 || n === 63 ? 'all-together' : /0000|1111/.test(s) ? 'long-float' : null;
      expect(rejection([], bits(s))).toBe(want);
    }
    for (const bad of [null, [], [1, 0, 1, 0, 1, 0], [true, false, true, false, true], new Array(6)])
      expect(rejection([], bad)).toBe('malformed');
  });
  it('checks committed vertical runs without wrapping and repeat precedence', () => {
    expect(rejection([], bits('111000'))).toBeNull();
    const h = ['101010', '100101', '101001'].map(bits);
    expect(rejection(h.slice(0, 2), h[2])).toBeNull();
    expect(rejection(h, bits('100110'))).toBe('long-float');
    expect(rejection([PEDALS[0]], PEDALS[0])).toBe('repeat');
    for (const a of [0, 1])
      for (const b of [0, 1]) expect(rejection([PEDALS[a]], PEDALS[b])).toBe(a === b ? 'repeat' : null);
  });
  it('all 256 pedal plans yield exactly two complete unassisted plans', () => {
    let complete = 0;
    for (let n = 0; n < 256; n++) {
      const r = new Round(3);
      let valid = true;
      for (let i = 0; i < 8; i++) {
        r.select(((n >> i) & 1) as 0 | 1);
        if (r.begin() !== 'throw') valid = false;
        r.settle();
      }
      if (valid) {
        complete++;
        expect(r.finished).toBe(true);
        expect(r.creation()?.cells).toHaveLength(48);
      }
    }
    expect(complete).toBe(2);
  });
  it('every 3^8 free yarn schedule finishes with unchanged structural validity', () => {
    for (let n = 0; n < 6561; n++) {
      const r = new Round(2);
      let x = n;
      for (let i = 0; i < 8; i++) {
        r.choose(x % 3);
        x = Math.floor(x / 3);
        expect(r.begin()).toBe('throw');
        expect(r.settle()).toBe('commit');
      }
      expect(r.finished).toBe(true);
      expect(r.misses + r.hints).toBe(0);
    }
  });
  it('drawdown retains left-to-right indices, including equal yarns', () => {
    expect(drawdown([3, 3, 3, 3, 3, 3], 0, PEDALS[0])).toEqual([3, 0, 3, 0, 3, 0]);
    expect(drawdown([3, 3, 3, 3, 3, 3], 0, PEDALS[1])).toEqual([0, 3, 0, 3, 0, 3]);
    expect(drawdown([3, 3, 3, 3, 3, 3], 3, PEDALS[0])).toEqual([3, 3, 3, 3, 3, 3]);
  });
  it('transactions snapshot, reject repeated submissions without altering history and cap help by row', () => {
    const r = new Round(3);
    expect(r.begin()).toBe('choose');
    expect(r.misses + r.hints).toBe(0);
    r.select(0);
    r.begin();
    r.select(1);
    expect(r.begin()).toBe('ignored');
    r.settle();
    expect(r.rows).toBe(1);
    const before = JSON.stringify([r.lifts, r.yarns]);
    for (let i = 0; i < 2; i++) {
      r.select(0);
      r.begin();
      r.settle();
      expect(JSON.stringify([r.lifts, r.yarns])).toBe(before);
    }
    expect(r.misses).toBe(2);
    expect(r.hints).toBe(1);
    r.help();
    r.select(0);
    r.help();
    expect(r.hints).toBe(1);
    expect(r.next).toBe(1);
    r.select(1);
    r.begin();
    r.settle();
    expect(r.rows).toBe(2);
    r.help();
    r.help();
    expect(r.hints).toBe(2);
  });
  it('settles exactly once, never settles after destruction, offers no partial creation', () => {
    const r = new Round(1);
    r.begin();
    expect(r.creation()).toBeNull();
    r.settle();
    expect(r.settle()).toBeNull();
    expect(r.rows).toBe(1);
    r.begin();
    r.destroy();
    expect(r.settle()).toBeNull();
    expect(r.rows).toBe(1);
    expect(r.begin()).toBe('ignored');
  });
});

import { SAMPLES, samplesFor, sampleRows, pedalTable, PEDALS5, LIGHT, DARK, YARN4 } from './logic';
const str = (rows: number[][]) => rows.map((r) => r.map((c) => (c === LIGHT ? 'L' : 'D')).join(''));
describe('levels 4–5 samples', () => {
  it('reproduce the authored cloth rows', () => {
    const rep = (a: string[]) => [...a, ...a];
    expect(str(sampleRows(SAMPLES[0]))).toEqual(rep(['LLDLLL', 'LLLDLL', 'LDDDLD', 'DLDDDL']));
    expect(str(sampleRows(SAMPLES[1]))).toEqual(rep(['LLLLLL', 'LDLDLD', 'LDLDLD', 'DDDDDD']));
    expect(str(sampleRows(SAMPLES[2]))).toEqual(rep(['LLLDLL', 'LLDLLL', 'DLDDDL', 'LDDDLD']));
    expect(str(sampleRows(SAMPLES[3]))).toEqual([
      'DLLDLL',
      'LDLLDL',
      'LLDLLD',
      'DLLDLL',
      'LDLLDL',
      'LLDLLD',
      'DLLDLL',
      'LDLLDL',
    ]);
    expect(str(sampleRows(SAMPLES[5]))).toEqual([
      'DLLDLL',
      'LDLLDL',
      'LLDLLD',
      'LDLLDL',
      'DLLDLL',
      'LDLLDL',
      'LLDLLD',
      'LDLLDL',
    ]);
  });
  it('each sample has exactly one accepted plan under the island rule', () => {
    for (const s of SAMPLES) {
      const t = pedalTable(s.level),
        want = sampleRows(s),
        yarns = s.level === 4 ? [LIGHT, DARK] : [LIGHT];
      let count = 0;
      const go = (hist: boolean[][], i: number) => {
        if (i === 8) {
          count++;
          return;
        }
        for (let p = 0; p < t.length; p++)
          if (!rejection(hist, t[p]))
            for (const y of yarns)
              if (drawdown(s.warp, y, t[p]).every((c, k) => c === want[i][k]))
                go([...hist, [...t[p]]], i + 1);
      };
      go([], 0);
      expect(count, s.id).toBe(1);
    }
  });
  it('no weft column equals a level 4 sample weft (not a color-sequence copy)', () => {
    for (const s of samplesFor(4)) {
      const rows = sampleRows(s);
      for (let c = 0; c < 6; c++) expect(rows.map((r) => r[c])).not.toEqual(s.weft);
    }
  });
  it('level 5 pedals each leave a thread down and lift every third thread', () => {
    for (const p of PEDALS5) {
      expect(p.filter(Boolean)).toHaveLength(2);
      expect(p[0] === p[3] && p[1] === p[4] && p[2] === p[5]).toBe(true);
    }
  });
  it('yarn pair keeps light and dark apart', () => {
    expect(YARN4).toEqual([LIGHT, DARK]);
  });
});
describe('levels 4–5 rounds', () => {
  const play = (r: Round, pedal: number, yarn?: number) => {
    r.select(pedal);
    if (yarn !== undefined) r.choose(yarn);
    r.begin();
    return r.settle();
  };
  const clean = (r: Round) => {
    const s = r.sample!;
    for (let i = 0; i < 8; i++)
      expect(play(r, s.pedals[i], r.level === 4 ? YARN4.indexOf(s.weft[i] as 0 | 3) : undefined)).toBe(
        'commit',
      );
  };
  it('every sample finishes clean with a 48-cell creation and no misses', () => {
    for (let lv = 4; lv <= 5; lv++)
      for (let i = 0; i < samplesFor(lv).length; i++) {
        const r = new Round(lv, i);
        clean(r);
        expect(r.finished).toBe(true);
        expect(r.misses + r.hints).toBe(0);
        expect(r.creation()?.cells).toEqual(sampleRows(r.sample!).flat());
      }
  });
  it('a woven wrong row stays, costs one miss, and Undo restores pedal, yarn and is free', () => {
    const r = new Round(4, 0);
    expect(play(r, 1, 1)).toBe('differs');
    expect(r.rows).toBe(1);
    expect(r.misses).toBe(1);
    expect(r.firstDiff).toBe(0);
    expect(r.undo()).toBe(true);
    expect([r.rows, r.selected, r.yarn, r.misses, r.hints]).toEqual([0, 1, 1, 1, 0]);
    expect(r.undo()).toBe(false);
  });
  it('two slips at one row index earn exactly one hint; a repeated pedal glows the other', () => {
    const r = new Round(4, 0);
    play(r, 0, 0);
    expect(play(r, 0, 0)).toBe('slip');
    expect(r.hints).toBe(0);
    expect(play(r, 0, 0)).toBe('slip');
    expect([r.misses, r.hints, r.glow]).toEqual([2, 1, 'pedal']);
    expect(play(r, 0, 0)).toBe('slip');
    expect([r.misses, r.hints]).toEqual([3, 1]);
    r.help();
    expect(r.hints).toBe(1);
    expect(play(r, 1, 0)).toBe('commit');
    expect(r.glow).toBeNull();
  });
  it('help over a standing mismatch pulses Undo and counts no hint', () => {
    const r = new Round(4, 0);
    play(r, 1, 1);
    r.help();
    expect([r.glow, r.hints]).toEqual(['undo', 0]);
  });
  it('the float rule slips P1 P2 P1 P2 at level 5 and the row is not woven', () => {
    const r = new Round(5, 0);
    for (const p of [0, 1, 0]) expect(play(r, p)).not.toBe('slip');
    expect(play(r, 1)).toBe('slip');
    expect(r.rows).toBe(3);
  });
  it('eight rows over a mismatch do not finish; undo and repair finishes', () => {
    const r = new Round(5, 0);
    play(r, 2);
    for (let i = 1; i < 8; i++) play(r, r.sample!.pedals[i]);
    expect(r.full).toBe(true);
    expect(r.finished).toBe(false);
    expect(r.creation()).toBeNull();
    expect(r.firstDiff).toBe(0);
    while (r.rows) r.undo();
    clean(r);
    expect(r.finished).toBe(true);
  });
});
