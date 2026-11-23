import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CLUES, clueLine, fault, faultLine, fresh, hint, hintLine, makeBoard, toggled } from './logic';
import { VOICE } from './voice';

const has = (key: string) => key in VOICE;

describe('Jar Clues voice', () => {
  it('has the closed list: one line per clue, the fault, hint and stage lines, and no slots', () => {
    const keys = Object.keys(VOICE);
    expect(keys.filter((k) => k.startsWith('jarclues.clue.')).length).toBe(CLUES.length);
    for (const k of [
      'game.jar-clues',
      'jarclues.start',
      'jarclues.guess',
      'jarclues.fault.standing',
      'jarclues.fault.crossed',
      'jarclues.hint.holds',
      'jarclues.last',
      'jarclues.holds',
      'jarclues.close',
    ])
      expect(has(k), k).toBe(true);
    expect(
      Object.values(VOICE)
        .flat()
        .filter((t) => t.includes('{')),
    ).toEqual([]);
  });

  it('has a line for every clue, fault and hint a board can produce', () => {
    const used = new Set<string>([hintLine(null)]);
    const rng = new Rng(5);
    for (const level of [1, 2])
      for (let s = 0; s < 120; s++) {
        const b = makeBoard(level, new Rng(600 + s));
        for (const c of b.clues) used.add(clueLine(c));
        for (let k = 1; k <= b.clues.length; k++) {
          let m = fresh();
          for (let j = 0; j < 8; j++) m = toggled(m, rng.int(1, 60));
          const f = fault(b, k, m);
          if (f) used.add(faultLine(f));
          used.add(hintLine(hint(b, k, m)));
        }
      }
    expect([...used].filter((k) => !has(k))).toEqual([]);
    expect([...used].filter((k) => k.startsWith('jarclues.hint.')).length).toBe(5);
  });
});
