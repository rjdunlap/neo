import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { GROUPS, NAME_LETTERS, PHRASES, WORDS, LINES, LineTypist, muddle, typingLayout, Typist, describeTypingLevel, nameToType, roundBubbles } from './logic';

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

describe('capitals, lines and repairs', () => {
  it('uses five distinct reviewed lines and one capital at the start', () => {
    for (const seed of seeds) for (const level of [4, 5, 6]) {
      const b = roundBubbles(level, new Rng(seed), 'Zoë');
      expect(new Set(b).size).toBe(5);
      for (const text of b) {
        expect(text).toMatch(/^[A-Z][a-z .]+$/);
        if (level >= 5) expect(LINES).toContain(text);
      }
    }
  });
  it('sticky Shift applies to one letter; held/caps capitals work; lowercase capital is free then helped', () => {
    const t = new Typist(['Ab'], 4);
    expect(t.press('a')).toMatchObject({ kind: 'wrong', why: 'capital', counted: false });
    expect(t.press('a')).toMatchObject({ glow: true, counted: true });
    t.press('Shift'); t.press('a');
    expect(t.shift).toBe(false);
    expect(t.press('b')).toMatchObject({ roundDone: true });
    const held = new Typist(['Ab'], 4); held.press('A'); held.press('b'); expect(held.done).toBe(true);
    expect(t.presses).toBe(4); expect(t.misses).toBe(1); expect(t.hints).toBe(1);
  });
  it('wrong letters stay until removed; edits are free and exact line required', () => {
    const t = new LineTypist(['Pip has a hat.'], 5, ['']);
    t.press('Shift'); t.press('p'); t.press('q');
    expect(t.buffer).toBe('Pq'); expect(t.done).toBe(false); expect(t.misses).toBe(0);
    const tries = t.presses;
    t.press('ArrowLeft'); t.press('ArrowRight'); t.press('Backspace');
    expect(t.buffer).toBe('P'); expect(t.presses).toBe(tries); expect(t.misses).toBe(0);
    for (const ch of 'ip has a hat') t.press(ch);
    expect(t.done).toBe(false);
    expect(t.press('.')).toMatchObject({ roundDone: true });
    expect(t.firstTry).toBe(13); // i had a wrong key first
  });
  it('accepts insertion followed by deleting the old letter as an alternative mend', () => {
    const model = 'Pip has a hat.';
    const t = new LineTypist([model], 6, ['Pip has a hqt.']);
    const q = t.buffer.indexOf('q');
    while (t.caret > q) t.press('ArrowLeft');
    t.press('a'); t.press('ArrowRight');
    expect(t.press('Backspace')).toMatchObject({ kind: 'right', roundDone: true });
    expect(t.done).toBe(true); expect(t.presses).toBe(1); expect(t.misses).toBe(0);
  });
  it('two wrong removals show help without misses, and all caret positions stay bounded', () => {
    const t = new LineTypist(['Pip has a hat.'], 6, ['Pip has a hqt.']);
    t.press('Backspace'); t.press('Backspace');
    expect(t.hints).toBe(1); expect(t.misses).toBe(0); expect(t.presses).toBe(0);
    for (let i = 0; i < 80; i++) t.press('ArrowLeft');
    expect(t.caret).toBe(0); t.press('Backspace');
    for (let i = 0; i < 80; i++) t.press('ArrowRight');
    expect(t.caret).toBe(t.buffer.length);
  });
  it('seeded one-letter damage is internal; bot repairs every line and extra edits', () => {
    for (const seed of seeds) for (const text of LINES) {
      const start = muddle(text, new Rng(seed));
      const diffs = [...text].flatMap((ch, i) => ch !== start[i] ? [i] : []);
      expect(diffs).toHaveLength(1); expect(diffs[0]).toBeGreaterThan(0);
      expect(text[diffs[0]]).toMatch(/[a-z]/);
      const t = new LineTypist([text], 6, [start]);
      if (seed % 2) { t.press('Backspace'); t.press('Backspace'); t.press('x'); }
      for (let i = 0; i < 100 && !t.done; i++) t.press(t.nextAction);
      expect(t.done).toBe(true);
      if (!(seed % 2)) { expect(t.presses).toBe(1); expect(t.misses).toBe(0); expect(t.hints).toBe(0); }
    }
  });
  it('typing bot copies all five lines with one-shot Shift through the same press channel', () => {
    for (const seed of seeds.slice(0, 20)) {
      const b = roundBubbles(5, new Rng(seed), 'Pip');
      const t = new LineTypist(b, 5, b.map(() => ''));
      for (let i = 0; i < 200 && !t.done; i++) {
        const action = t.nextAction;
        if (/[A-Z]/.test(action) && action.length === 1) { t.press('Shift'); t.press(action.toLowerCase()); }
        else t.press(action);
      }
      expect(t.done).toBe(true); expect(t.firstTry).toBe(b.join('').length);
    }
  });
  it('layout bounds stay separate from each other, HUD and bottom-left pet in both views', () => {
    for (const [w, h] of [[1024,768], [1024,1365], [1365,768], [1024,1820]]) {
      const l = typingLayout(w, h);
      const boxes = Object.values(l);
      const overlap = (a: typeof l.bubble, b: typeof l.bubble) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
      for (const a of boxes) {
        expect(a.x).toBeGreaterThanOrEqual(0); expect(a.y).toBeGreaterThanOrEqual(80);
        expect(a.x+a.w).toBeLessThanOrEqual(w); expect(a.y+a.h).toBeLessThanOrEqual(h);
        expect(overlap(a, { x:0, y:h-220, w:170, h:220 })).toBe(false);
      }
      for (let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) expect(overlap(boxes[i],boxes[j])).toBe(false);
    }
  });
});
