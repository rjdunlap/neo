import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { GROUPS, NAME_LETTERS, PHRASES, WORDS, Typist, describeTypingLevel, nameToType, roundBubbles } from './logic';

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 3);
const chars = (b: readonly string[]) => b.join('').split('');

describe('level 1', () => {
  it('every group is four consecutive alphabet letters', () => {
    for (const g of GROUPS) {
      expect(g).toHaveLength(4);
      for (let i = 1; i < 4; i++) expect(g.charCodeAt(i)).toBe(g.charCodeAt(i - 1) + 1);
    }
  });
  it('a round is 8 single-letter bubbles from one group, each twice, no repeats in a row', () => {
    for (const s of seeds) {
      const b = roundBubbles(1, new Rng(s), 'Ana');
      expect(b).toHaveLength(8);
      const group = GROUPS.find((g) => [...g.toLowerCase()].every((c) => b.includes(c)))!;
      expect(group).toBeTruthy();
      for (const c of b) expect(c).toHaveLength(1);
      for (const c of group.toLowerCase()) expect(b.filter((x) => x === c)).toHaveLength(2);
      expect([...b].sort().join('')).toBe([...group.toLowerCase(), ...group.toLowerCase()].sort().join(''));
      for (let i = 1; i < 8; i++) expect(b[i]).not.toBe(b[i - 1]);
    }
  });
  it('the same seed gives the same round', () => {
    expect(roundBubbles(1, new Rng(5), 'x')).toEqual(roundBubbles(1, new Rng(5), 'x'));
  });
});

describe('level 2', () => {
  it('normalizes accents and non A-Z, falls back to PIP, caps length', () => {
    expect(nameToType('Zoë')).toBe('ZOE');
    expect(nameToType('José-María 3')).toBe('JOSEMARIA');
    expect(nameToType('')).toBe('PIP');
    expect(nameToType('123 !!')).toBe('PIP');
    expect(nameToType('日本')).toBe('PIP');
    for (const f of ['friend', 'Friend', 'FRIEND', ' friend ']) expect(nameToType(f)).toBe('PIP');
    const long = nameToType('Abcdefghijklmnopqrstuvwxyz');
    expect(long).toHaveLength(NAME_LETTERS);
    expect(long).toBe('ABCDEFGHIJKL');
  });
  it('bubbles are the name letters in order, one per bubble', () => {
    for (const s of seeds.slice(0, 20)) {
      expect(roundBubbles(2, new Rng(s), 'Mía')).toEqual(['m', 'i', 'a']);
      expect(roundBubbles(2, new Rng(s), 'friend')).toEqual(['p', 'i', 'p']);
      expect(roundBubbles(2, new Rng(s), '???')).toEqual(['p', 'i', 'p']);
      expect(roundBubbles(2, new Rng(s), 'Bartholomew-Jones')).toEqual('bartholomewj'.slice(0, NAME_LETTERS).split(''));
    }
  });
});

describe('level 3', () => {
  it('3 distinct words then 2 distinct phrases, all from the pools; space only in phrases', () => {
    for (const s of seeds) {
      const b = roundBubbles(3, new Rng(s), 'Ana');
      expect(b).toHaveLength(5);
      const w = b.slice(0, 3), p = b.slice(3);
      expect(new Set(w).size).toBe(3);
      expect(new Set(p).size).toBe(2);
      for (const x of w) { expect(WORDS as readonly string[]).toContain(x); expect(x).not.toContain(' '); }
      for (const x of p) { expect(PHRASES as readonly string[]).toContain(x); expect(x).toContain(' '); }
    }
  });
  it('pool entries are lower-case a-z and spaces', () => {
    for (const x of [...WORDS, ...PHRASES]) expect(x).toMatch(/^[a-z ]+$/);
  });
});

describe('Typist', () => {
  it('typing each wanted completes any round at levels 1-3', () => {
    for (const level of [1, 2, 3]) for (const s of seeds) {
      const t = new Typist(roundBubbles(level, new Rng(s), 'Ana'));
      let n = 0, last: ReturnType<Typist['press']> | undefined;
      const total = chars(t.bubbles).length;
      while (!t.done) { last = t.press(t.wanted); n++; expect(n).toBeLessThanOrEqual(total); }
      expect(n).toBe(total);
      expect(last).toMatchObject({ kind: 'right', roundDone: true, bubbleDone: true });
      expect(t.misses).toBe(0);
      expect(t.hints).toBe(0);
      expect(t.firstTry).toBe(total);
      expect(t.presses).toBe(total);
      expect(t.wanted).toBe('');
    }
  });
  it('upper case is accepted too', () => {
    const t = new Typist(['ab']);
    expect(t.press('A').kind).toBe('right');
    expect(t.press('B')).toMatchObject({ kind: 'right', roundDone: true });
  });
  it('first wrong key is free, later ones count; second glows once; hint at most 1', () => {
    const t = new Typist(['a', 'b']);
    expect(t.press('z')).toMatchObject({ kind: 'wrong', counted: false, glow: false, why: 'letter', wanted: 'a' });
    expect(t.misses).toBe(0);
    expect(t.hints).toBe(0);
    expect(t.press('y')).toMatchObject({ counted: true, glow: true });
    expect(t.misses).toBe(1);
    expect(t.hints).toBe(1);
    expect(t.glowing).toBe(true);
    expect(t.press('x')).toMatchObject({ counted: true, glow: false });
    expect(t.misses).toBe(2);
    t.showHint(); t.showHint();
    expect(t.hints).toBe(1);
    expect(t.press('a').kind).toBe('right');
    expect(t.glowing).toBe(false);
    // next character: free miss again, a second glow does not raise hints
    expect(t.press('z')).toMatchObject({ counted: false });
    expect(t.press('z')).toMatchObject({ counted: true, glow: true });
    expect(t.hints).toBe(1);
    expect(t.misses).toBe(3);
  });
  it('showHint alone counts one hint, however often', () => {
    const t = new Typist(['ab']);
    t.showHint(); t.showHint();
    expect(t.hints).toBe(1);
  });
  it('out-of-order correct letter at level 2 is wrong', () => {
    const t = new Typist(['m', 'i', 'a']);
    expect(t.press('i')).toMatchObject({ kind: 'wrong', wanted: 'm', why: 'letter', counted: false });
    expect(t.at).toBe(0);
    expect(t.bubble).toBe(0);
  });
  it('space and wantSpace reasons', () => {
    const t = new Typist(['a b']);
    expect(t.press(' ')).toMatchObject({ kind: 'wrong', why: 'space' });
    t.press('a');
    expect(t.press('b')).toMatchObject({ kind: 'wrong', why: 'wantSpace', wanted: ' ' });
    expect(t.press(' ').kind).toBe('right');
    expect(t.press('b')).toMatchObject({ kind: 'right', roundDone: true });
  });
  it('multi-character keys are ignored and count nothing', () => {
    const t = new Typist(['ab']);
    for (const k of ['Shift', 'Enter', 'Backspace', '']) expect(t.press(k)).toEqual({ kind: 'ignored' });
    expect(t.presses).toBe(0);
    expect(t.misses).toBe(0);
    expect(t.hints).toBe(0);
    expect(t.at).toBe(0);
  });
  it('firstTry counts only characters typed with no wrong key before; presses counts every one-char key', () => {
    const t = new Typist(['abc']);
    t.press('a');          // first try
    t.press('z');          // wrong
    t.press('b');          // not first try
    t.press('Shift');      // ignored
    t.press('c');          // first try
    expect(t.firstTry).toBe(2);
    expect(t.presses).toBe(4);
    expect(t.done).toBe(true);
    expect(t.press('a')).toEqual({ kind: 'ignored' });
  });
});

describe('describeTypingLevel', () => {
  it('names no grade or speed', () => {
    for (let l = 1; l <= 3; l++) {
      const d = describeTypingLevel(l);
      expect(d.length).toBeGreaterThan(0);
      expect(d.toLowerCase()).not.toMatch(/grade|speed|fast|wpm|minute/);
    }
  });
});
