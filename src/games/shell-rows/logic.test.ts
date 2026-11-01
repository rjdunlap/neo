import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { HOW_TO } from '../../content/howto';
import {
  AUTHORED, LEVELS, LINES, POSITIONS, SYMMETRIES, Score, canonical, decidingLine, empties, fits, herTurn, key, layout, makeRound,
  other, petReply, place, planFor, pool, replyKind, rightSquare, stickerBoard, transform, value, winsFor, wonLine,
  type Board, type Box, type Side,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
const LEVEL_IDS = [1, 2, 3];

/** Plain search, no memo: the check on `value`. */
function plain(b: Board, toMove: Side): number {
  if (wonLine(b, 'shell')) return 1;
  if (wonLine(b, 'pebble')) return -1;
  const free = empties(b);
  if (!free.length) return 0;
  const vals = free.map((i) => plain(place(b, i, toMove), other(toMove)));
  return toMove === 'shell' ? Math.max(...vals) : Math.min(...vals);
}

/** Every position with her to move, from the empty board. */
const ALL: Board[] = (() => {
  const out: Board[] = [];
  for (let n = 0; n < 3 ** 9; n++) {
    const b: Board = Array.from({ length: 9 }, (_, i) => { const d = Math.floor(n / 3 ** i) % 3; return d === 0 ? null : d === 1 ? 'shell' : 'pebble'; });
    if (herTurn(b)) out.push(b);
  }
  return out;
})();

describe('plans', () => {
  it('level ranges and names', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 2 }, school: { min: 1, max: 3 } });
    expect(LEVEL_IDS.map((l) => planFor(l).id)).toEqual(['finish', 'stop', 'first']);
    for (const l of LEVEL_IDS) expect(planFor(l).name.length).toBeGreaterThan(0);
  });
});

describe('board and lines', () => {
  it('eight distinct lines of three', () => {
    expect(LINES).toHaveLength(8);
    expect(new Set(LINES.map((l) => [...l].sort().join())).size).toBe(8);
  });
  it('winsFor agrees with brute force on every position', () => {
    for (const b of ALL) for (const s of ['shell', 'pebble'] as const) {
      const brute = empties(b).filter((i) => wonLine(place(b, i, s), s) !== null);
      expect(winsFor(b, s)).toEqual(brute);
    }
  });
});

describe('minimax', () => {
  it('the empty board is a draw', () => {
    expect(value(Array(9).fill(null), 'shell')).toBe(0);
  });
  it('matches a plain search on a sample', () => {
    const rng = new Rng(7);
    for (let k = 0; k < 120; k++) {
      const b = rng.pick(ALL.filter((x) => empties(x).length <= 6));
      expect(value(b, 'shell')).toBe(plain(b, 'shell'));
    }
  });
});

describe('symmetry', () => {
  it('eight distinct maps, each a permutation', () => {
    expect(new Set(SYMMETRIES.map((m) => m.join())).size).toBe(8);
    for (const m of SYMMETRIES) expect([...m].sort().join()).toBe('0,1,2,3,4,5,6,7,8');
  });
  it('maps lines to lines, rows and columns to rows and columns', () => {
    const straight = LINES.slice(0, 6).map((l) => [...l].sort().join());
    const all = LINES.map((l) => [...l].sort().join());
    for (const m of SYMMETRIES) for (const [i, l] of LINES.entries()) {
      const moved = l.map((s) => m.indexOf(s)).sort().join();
      expect(all).toContain(moved);
      if (i < 6) expect(straight).toContain(moved);
    }
  });
});

describe('pools', () => {
  it('reachable, filtered, at least 20 classes, authored openings inside', () => {
    const counts: number[] = [];
    for (const l of LEVEL_IDS) {
      const p = pool(l);
      counts.push(p.length);
      expect(p.length).toBeGreaterThanOrEqual(20);
      for (const b of p) { expect(herTurn(b)).toBe(true); expect(fits(l, b)).toBe(true); expect(canonical(b)).toBe(key(b)); }
      const a = AUTHORED[planFor(l).id];
      expect(fits(l, a)).toBe(true);
      expect(p.map(key)).toContain(canonical(a));
    }
    // Recounted by the enumeration; the definition counted the same by hand.
    expect(counts).toEqual([39, 69, 81]);
  });
  it('authored openings threaten in a straight row, never a diagonal', () => {
    for (const l of LEVEL_IDS) {
      const a = AUTHORED[planFor(l).id];
      for (const s of ['shell', 'pebble'] as const) for (const sq of winsFor(a, s)) {
        const line = LINES.findIndex((ln) => ln.includes(sq) && ln.filter((i) => a[i] === s).length === 2);
        expect(line).toBeLessThan(6);
      }
    }
  });
});

describe('exactly one right square', () => {
  for (const l of LEVEL_IDS) it(`level ${l}`, () => {
    for (const b of pool(l)) {
      const right = rightSquare(l, b);
      expect(b[right]).toBe(null);
      // The level accepts one square: the only one that is her win (1, 3) or the pet's (2).
      const accepted = empties(b).filter((i) => (l === 2 ? winsFor(b, 'pebble') : winsFor(b, 'shell')).includes(i));
      expect(accepted).toEqual([right]);
      if (l === 3) expect(right).not.toBe(winsFor(b, 'pebble')[0]);
      if (l === 2) expect(value(place(b, right, 'shell'), 'pebble')).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('honest replies', () => {
  for (const l of LEVEL_IDS) it(`level ${l}`, () => {
    for (const b of pool(l)) {
      const right = rightSquare(l, b);
      const block = winsFor(b, 'pebble')[0];
      for (const wrong of empties(b).filter((i) => i !== right)) {
        const after = place(b, wrong, 'shell');
        const reply = petReply(after, right);
        expect(after[reply]).toBe(null);
        const best = Math.min(...empties(after).map((i) => value(place(after, i, 'pebble'), 'shell')));
        expect(value(place(after, reply, 'pebble'), 'shell')).toBe(best);
        const done = place(after, reply, 'pebble');
        if (l === 1) { expect(reply).toBe(right); expect(replyKind(l, b, wrong)).toBe('took-spot'); }
        if (l === 2 || (l === 3 && wrong !== block)) { expect(wonLine(done, 'pebble')).not.toBe(null); expect(replyKind(l, b, wrong)).toBe('got-three'); }
        if (l === 3 && wrong === block) { expect(reply).toBe(right); expect(replyKind(l, b, wrong)).toBe('could-have'); }
        const line = decidingLine(b, wrong, reply);
        expect(line).toContain(reply);
      }
    }
  });
});

describe('rounds', () => {
  for (const l of LEVEL_IDS) it(`level ${l} over 300 seeds`, () => {
    const authored = canonical(AUTHORED[planFor(l).id]);
    for (const seed of SEEDS) {
      const r = makeRound(l, new Rng(seed));
      expect(makeRound(l, new Rng(seed))).toEqual(r);
      expect(r.positions).toHaveLength(POSITIONS);
      const classes = r.positions.map((p) => canonical(p.board));
      expect(new Set(classes).size).toBe(POSITIONS);
      expect(classes[0]).toBe(authored);
      for (const p of r.positions) {
        expect(fits(l, p.board)).toBe(true);
        expect(p.right).toBe(rightSquare(l, p.board));
        expect(key(transform(p.board, SYMMETRIES[0]))).toBe(key(p.board));
      }
      // The opening's threat stays a straight row after its symmetry.
      const a = r.positions[0].board;
      for (const s of ['shell', 'pebble'] as const) for (const sq of winsFor(a, s)) {
        expect(LINES.findIndex((ln) => ln.includes(sq) && ln.filter((i) => a[i] === s).length === 2)).toBeLessThan(6);
      }
      expect(r.colors[0]).not.toBe(r.colors[1]);
    }
  });
});

describe('accounting', () => {
  it('each wrong is a miss; a second lights the glow, one hint', () => {
    const s = new Score();
    expect(s.answer(false)).toBe('miss');
    expect(s.answer(false)).toBe('glow');
    expect(s.answer(false)).toBe('miss');
    expect(s.misses).toBe(3);
    expect(s.hints).toBe(1);
    expect(s.answer(true)).toBe('right');
    expect(s.misses).toBe(3);
  });
  it('Show me then the ghost counts one hint; never more than one per position', () => {
    const s = new Score();
    expect(s.showMe()).toBe(true);
    expect(s.showMe()).toBe(false);
    s.answer(false); s.answer(false);
    expect(s.hints).toBe(1);
    s.newPosition();
    s.answer(false); s.answer(false);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(2);
  });
  it('following the glow ends the position', () => {
    for (const l of LEVEL_IDS) for (const b of pool(l)) {
      const done = place(b, rightSquare(l, b), 'shell');
      if (l === 2) expect(winsFor(done, 'pebble')).toEqual([]);
      else expect(wonLine(done, 'shell')).not.toBe(null);
    }
  });
});

describe('sticker', () => {
  it('a row of three shells on every seed', () => {
    for (const seed of SEEDS) {
      const { board, line } = stickerBoard(seed);
      expect(wonLine(board, 'shell')).not.toBe(null);
      expect(line.every((i) => board[i] === 'shell')).toBe(true);
    }
  });
});

const VIEWS = [{ w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 1024, h: 700 }, { w: 700, h: 1024 }];
const rect = (b: Box) => ({ l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 });
const overlap = (a: Box, b: Box) => { const p = rect(a), q = rect(b); return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b; };
const hits = (b: Box, x0: number, y0: number, x1: number, y1: number) => { const p = rect(b); return p.l < x1 && x0 < p.r && p.t < y1 && y0 < p.b; };

describe('layout', () => {
  for (const view of VIEWS) it(`${view.w}x${view.h}`, () => {
    const L = layout(view)!;
    expect(L).not.toBe(null);
    expect(L.portrait).toBe(view.h > view.w);
    if (view.w >= 768 && view.h >= 768) expect(L.cell).toBe(150);
    for (const b of [...L.squares, L.board, L.shellPile, L.pebblePile]) {
      const r = rect(b);
      expect(r.l).toBeGreaterThanOrEqual(0); expect(r.t).toBeGreaterThanOrEqual(0);
      expect(r.r).toBeLessThanOrEqual(view.w); expect(r.b).toBeLessThanOrEqual(view.h);
      expect(hits(b, 0, view.h - 170, 170, view.h)).toBe(false);
      expect(hits(b, 0, 0, 120, 120)).toBe(false);
      expect(hits(b, view.w - 120, 0, view.w, 120)).toBe(false);
    }
    for (const s of L.squares) { expect(s.w).toBeGreaterThanOrEqual(100); expect(s.h).toBeGreaterThanOrEqual(100); }
    for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) expect(overlap(L.squares[i], L.squares[j])).toBe(false);
    for (const s of L.squares) for (const p of [L.shellPile, L.pebblePile]) expect(overlap(s, p)).toBe(false);
  });
  it('null rather than squares under 100', () => {
    expect(layout({ w: 500, h: 380 })).toBe(null);
  });
});

describe('wording', () => {
  it('voice lines and the how-to card exist', () => {
    for (const k of ['sr.intro', 'sr.instruct.1', 'sr.instruct.2', 'sr.instruct.3', 'sr.took-spot', 'sr.got-three', 'sr.could-have', 'sr.saw-it', 'sr.three-in-a-row', 'sr.full', 'sr.look-again', 'sr.done']) {
      expect(SCRIPT[k as keyof typeof SCRIPT], k).toBeDefined();
    }
    expect(HOW_TO['shell-rows']).toBeDefined();
  });
});
