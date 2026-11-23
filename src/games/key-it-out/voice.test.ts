import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  NAMES,
  PARTS,
  VALUES,
  done,
  fault,
  cellLine,
  faultLine,
  give,
  hint,
  makeBoard,
  newPage,
  noteLine,
  stamp,
  type Page,
} from './logic';
import { VOICE } from './voice';

const has = (key: string) => key in VOICE;

describe('Key It Out voice', () => {
  it('has the closed list: 12 questions, 12 names, 9 table cells, 9 notes, 36 key and 18 table faults, and the hint lines', () => {
    const keys = Object.keys(VOICE);
    expect(keys.filter((k) => k.startsWith('key.q.')).length).toBe(12);
    expect(keys.filter((k) => k.startsWith('key.name.')).length).toBe(12);
    expect(keys.filter((k) => k.startsWith('key.cell.')).length).toBe(9);
    expect(keys.filter((k) => k.startsWith('key.note.')).length).toBe(9);
    expect(keys.filter((k) => k.startsWith('key.fault.')).length).toBe(36 + 18);
    for (const k of [
      'key.start',
      'key.stamped',
      'key.locked',
      'key.done',
      'key.hint.one-name',
      'key.hint.one-sketch',
      'key.hint.note',
    ])
      expect(has(k)).toBe(true);
    // No line has a slot, so every one renders as a clip.
    expect(
      Object.values(VOICE)
        .flat()
        .filter((t) => t.includes('{')),
    ).toEqual([]);
  });

  it('has a line for every question, name, fault and hint a board can produce', () => {
    const used = new Set<string>();
    for (const level of [1, 2, 3, 4])
      for (let s = 0; s < 80; s++) {
        const rng = new Rng(300 + s);
        const b = makeBoard(level, rng);
        for (const q of b.key) used.add(`key.q.${PARTS[q.part]}.${VALUES[PARTS[q.part]][q.value]}`);
        for (const c of b.guide) {
          used.add(`key.name.${NAMES[c.name].toLowerCase()}`);
          c.habits?.forEach((v, h) => used.add(cellLine(h, v)));
        }
        for (const sk of b.sketches) {
          const own = b.table?.get(sk.name);
          for (const h of sk.notes) used.add(noteLine(h, own![h]));
        }
        // Full wrong pages: every shuffle of the names.
        for (let t = 0; t < 8; t++) {
          const names = rng.shuffle(b.sketches.map((x) => x.name));
          const p: Page = { names, stamped: names.map(() => false) };
          const f = fault(b, p);
          if (f) used.add(faultLine(f));
        }
        let p = newPage(b);
        while (!done(p)) {
          const h = hint(b, p)!;
          used.add(`key.hint.${h.line}`);
          p = stamp(b, give(p, h.sketch, h.name)!).page;
        }
      }
    expect([...used].filter((k) => !has(k))).toEqual([]);
    expect([...used].filter((k) => k.startsWith('key.fault.')).length).toBeGreaterThan(40);
    // Table faults and the note hint do occur.
    expect([...used].filter((k) => /^key\.fault\.(call|time|food)\./.test(k)).length).toBeGreaterThan(9);
    expect(used.has('key.hint.note')).toBe(true);
  });
});
