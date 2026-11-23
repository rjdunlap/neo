import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { HOW_TO } from '../../content/howto';
import {
  AUTHORED,
  LEVELS,
  LINES,
  POSITIONS,
  SYMMETRIES,
  PREFERENCE,
  Score,
  accepts,
  boardAfter,
  canonical,
  decidingLine,
  empties,
  fits,
  forkFollow,
  forkSquares,
  herTurn,
  key,
  GrownUpSeat,
  layout,
  matchEnd,
  makeRound,
  other,
  petMove,
  petReply,
  place,
  planFor,
  pool,
  replyKind,
  rightSquare,
  showMeSquare,
  stickerBoard,
  transform,
  turningPoint,
  value,
  winsFor,
  wonLine,
  type Board,
  type Box,
  type Side,
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
    const b: Board = Array.from({ length: 9 }, (_, i) => {
      const d = Math.floor(n / 3 ** i) % 3;
      return d === 0 ? null : d === 1 ? 'shell' : 'pebble';
    });
    if (herTurn(b)) out.push(b);
  }
  return out;
})();

describe('plans', () => {
  it('level ranges and names', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 2 }, school: { min: 1, max: 5 } });
    expect([1, 2, 3, 4, 5].map((l) => planFor(l).id)).toEqual(['finish', 'stop', 'first', 'fork', 'match']);
    for (const l of [1, 2, 3, 4, 5]) expect(planFor(l).name.length).toBeGreaterThan(0);
  });
});

describe('board and lines', () => {
  it('eight distinct lines of three', () => {
    expect(LINES).toHaveLength(8);
    expect(new Set(LINES.map((l) => [...l].sort().join())).size).toBe(8);
  });
  it('winsFor agrees with brute force on every position', () => {
    for (const b of ALL)
      for (const s of ['shell', 'pebble'] as const) {
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
    for (const m of SYMMETRIES)
      for (const [i, l] of LINES.entries()) {
        const moved = l
          .map((s) => m.indexOf(s))
          .sort()
          .join();
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
      for (const b of p) {
        expect(herTurn(b)).toBe(true);
        expect(fits(l, b)).toBe(true);
        expect(canonical(b)).toBe(key(b));
      }
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
      for (const s of ['shell', 'pebble'] as const)
        for (const sq of winsFor(a, s)) {
          const line = LINES.findIndex((ln) => ln.includes(sq) && ln.filter((i) => a[i] === s).length === 2);
          expect(line).toBeLessThan(6);
        }
    }
  });
});

describe('exactly one right square', () => {
  for (const l of LEVEL_IDS)
    it(`level ${l}`, () => {
      for (const b of pool(l)) {
        const right = rightSquare(l, b);
        expect(b[right]).toBe(null);
        // The level accepts one square: the only one that is her win (1, 3) or the pet's (2).
        const accepted = empties(b).filter((i) =>
          (l === 2 ? winsFor(b, 'pebble') : winsFor(b, 'shell')).includes(i),
        );
        expect(accepted).toEqual([right]);
        if (l === 3) expect(right).not.toBe(winsFor(b, 'pebble')[0]);
        if (l === 2) expect(value(place(b, right, 'shell'), 'pebble')).toBeGreaterThanOrEqual(0);
      }
    });
});

describe('honest replies', () => {
  for (const l of LEVEL_IDS)
    it(`level ${l}`, () => {
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
          if (l === 1) {
            expect(reply).toBe(right);
            expect(replyKind(l, b, wrong)).toBe('took-spot');
          }
          if (l === 2 || (l === 3 && wrong !== block)) {
            expect(wonLine(done, 'pebble')).not.toBe(null);
            expect(replyKind(l, b, wrong)).toBe('got-three');
          }
          if (l === 3 && wrong === block) {
            expect(reply).toBe(right);
            expect(replyKind(l, b, wrong)).toBe('could-have');
          }
          const line = decidingLine(b, wrong, reply);
          expect(line).not.toBe(null);
          expect(line).toContain(reply);
          expect(accepts(l, b, wrong)).toBe(false);
        }
      }
    });
});

describe('rounds', () => {
  for (const l of [...LEVEL_IDS, 4])
    it(`level ${l} over 300 seeds`, () => {
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
        for (const s of ['shell', 'pebble'] as const)
          for (const sq of winsFor(a, s)) {
            expect(
              LINES.findIndex((ln) => ln.includes(sq) && ln.filter((i) => a[i] === s).length === 2),
            ).toBeLessThan(6);
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
    s.answer(false);
    s.answer(false);
    expect(s.hints).toBe(1);
    s.newPosition();
    s.answer(false);
    s.answer(false);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(2);
  });
  it('following the glow ends the position', () => {
    for (const l of LEVEL_IDS)
      for (const b of pool(l)) {
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

const VIEWS = [
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 1024, h: 700 },
  { w: 700, h: 1024 },
];
const rect = (b: Box) => ({ l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 });
const overlap = (a: Box, b: Box) => {
  const p = rect(a),
    q = rect(b);
  return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
};
const hits = (b: Box, x0: number, y0: number, x1: number, y1: number) => {
  const p = rect(b);
  return p.l < x1 && x0 < p.r && p.t < y1 && y0 < p.b;
};

describe('layout', () => {
  for (const view of VIEWS)
    it(`${view.w}x${view.h}`, () => {
      const L = layout(view)!;
      expect(L).not.toBe(null);
      expect(L.portrait).toBe(view.h > view.w);
      if (view.w >= 768 && view.h >= 768) expect(L.cell).toBe(150);
      for (const b of [...L.squares, L.board, L.shellPile, L.pebblePile]) {
        const r = rect(b);
        expect(r.l).toBeGreaterThanOrEqual(0);
        expect(r.t).toBeGreaterThanOrEqual(0);
        expect(r.r).toBeLessThanOrEqual(view.w);
        expect(r.b).toBeLessThanOrEqual(view.h);
        expect(hits(b, 0, view.h - 170, 170, view.h)).toBe(false);
        expect(hits(b, 0, 0, 120, 120)).toBe(false);
        expect(hits(b, view.w - 120, 0, view.w, 120)).toBe(false);
      }
      for (const s of L.squares) {
        expect(s.w).toBeGreaterThanOrEqual(100);
        expect(s.h).toBeGreaterThanOrEqual(100);
      }
      for (let i = 0; i < 9; i++)
        for (let j = i + 1; j < 9; j++) expect(overlap(L.squares[i], L.squares[j])).toBe(false);
      for (const s of L.squares)
        for (const p of [L.shellPile, L.pebblePile]) expect(overlap(s, p)).toBe(false);
      // Level 5's grown-up toggle: a full 100-unit target in view, off every square, both piles and the corners.
      const r = rect(L.seat);
      expect(Math.min(L.seat.w, L.seat.h)).toBeGreaterThanOrEqual(100);
      expect(r.l).toBeGreaterThanOrEqual(0);
      expect(r.t).toBeGreaterThanOrEqual(0);
      expect(r.r).toBeLessThanOrEqual(view.w);
      expect(r.b).toBeLessThanOrEqual(view.h);
      expect(hits(L.seat, 0, view.h - 170, 170, view.h)).toBe(false);
      expect(hits(L.seat, 0, 0, 120, 120)).toBe(false);
      expect(hits(L.seat, view.w - 120, 0, view.w, 120)).toBe(false);
      for (const o of [...L.squares, L.shellPile, L.pebblePile]) expect(overlap(L.seat, o)).toBe(false);
    });
  it('null rather than squares under 100', () => {
    expect(layout({ w: 500, h: 380 })).toBe(null);
  });
});

describe('wording', () => {
  it('voice lines and the how-to card exist', () => {
    for (const k of [
      'sr.intro',
      'sr.instruct.1',
      'sr.instruct.2',
      'sr.instruct.3',
      'sr.took-spot',
      'sr.got-three',
      'sr.could-have',
      'sr.saw-it',
      'sr.three-in-a-row',
      'sr.full',
      'sr.look-again',
      'sr.done',
    ]) {
      expect(SCRIPT[k as keyof typeof SCRIPT], k).toBeDefined();
    }
    expect(HOW_TO['shell-rows']).toBeDefined();
  });
});

// ---- levels 4–5 (SG2, docs/definitions/shell-rows-4-5.md) ----

/** Every position with the pet to move: her shells one ahead (she went first) or level (the pet did), nobody's three. */
const PET_TURN: Board[] = (() => {
  const out: Board[] = [];
  for (let n = 0; n < 3 ** 9; n++) {
    const b: Board = Array.from({ length: 9 }, (_, i) => {
      const d = Math.floor(n / 3 ** i) % 3;
      return d === 0 ? null : d === 1 ? 'shell' : 'pebble';
    });
    const sh = b.filter((c) => c === 'shell').length,
      pe = b.filter((c) => c === 'pebble').length;
    if (!(sh === pe + 1 || sh === pe)) continue;
    if (wonLine(b, 'shell') || wonLine(b, 'pebble') || !empties(b).length) continue;
    out.push(b);
  }
  return out;
})();

describe('level 4, Two ways to win', () => {
  it('the pool: reachable, nobody can win, a fork, every forced win a fork; 24 classes (17 with one fork)', () => {
    const p = pool(4);
    expect(p.length).toBeGreaterThanOrEqual(20);
    expect(p).toHaveLength(24);
    expect(p.filter((b) => forkSquares(b).length === 1)).toHaveLength(17);
    for (const b of p) {
      expect(herTurn(b)).toBe(true);
      expect(winsFor(b, 'shell')).toEqual([]);
      expect(winsFor(b, 'pebble')).toEqual([]);
      const forks = forkSquares(b);
      expect(forks.length).toBeGreaterThan(0);
      for (const i of empties(b))
        expect(value(place(b, i, 'shell'), 'pebble') === 1, `square ${i} of ${key(b)}`).toBe(
          forks.includes(i),
        );
    }
  });
  it('the authored opening is in the pool, top-right its only fork square, rows and columns only', () => {
    const a = AUTHORED.fork;
    expect(fits(4, a)).toBe(true);
    expect(forkSquares(a)).toEqual([2]);
    expect(rightSquare(4, a)).toBe(2);
    const rows = LINES.filter(
      (l) => l.includes(2) && winsFor(place(a, 2, 'shell'), 'shell').some((g) => l.includes(g)),
    );
    for (const r of rows) expect(LINES.indexOf(r)).toBeLessThan(6);
  });
  it('accepts every fork square and nothing else; the glow is one of them and following it wins', () => {
    for (const b of pool(4)) {
      const forks = forkSquares(b);
      for (const i of empties(b)) expect(accepts(4, b, i)).toBe(forks.includes(i));
      expect(forks).toContain(rightSquare(4, b));
      for (const f of forks) {
        const { block, finish } = forkFollow(b, f);
        const after = place(place(b, f, 'shell'), block, 'pebble');
        expect(wonLine(after, 'pebble')).toBe(null);
        expect(wonLine(place(after, finish, 'shell'), 'shell')).not.toBe(null);
      }
    }
  });
  it("honest replies: legal, minimax-best, never the pet's three; the kinds split 48, 19 and 9", () => {
    const kinds: Record<string, number> = {};
    for (const b of pool(4)) {
      const right = rightSquare(4, b);
      for (const wrong of empties(b).filter((i) => !accepts(4, b, i))) {
        const after = place(b, wrong, 'shell');
        const reply = petReply(after, right);
        expect(after[reply]).toBe(null);
        const best = Math.min(...empties(after).map((i) => value(place(after, i, 'pebble'), 'shell')));
        expect(value(place(after, reply, 'pebble'), 'shell')).toBe(best);
        const done = place(after, reply, 'pebble');
        expect(wonLine(done, 'pebble')).toBe(null);
        const kind = replyKind(4, b, wrong);
        kinds[kind] = (kinds[kind] ?? 0) + 1;
        const line = decidingLine(b, wrong, reply);
        if (kind === 'stopped-one') {
          expect(reply).toBe(winsFor(after, 'shell')[0]);
          expect(line).toHaveLength(3);
          expect(line).toContain(reply);
        } else if (kind === 'took-best') {
          expect(forkSquares(after)).toContain(reply);
          expect(line!.length).toBeGreaterThanOrEqual(5);
          expect(line).toContain(reply);
        } else {
          expect(kind).toBe('look-two');
          expect(line).toBe(null);
          // A fork square was not among the pet's best, or the reply would have taken it.
          const forks = forkSquares(after);
          for (const f of forks) expect(value(place(after, f, 'pebble'), 'shell')).toBeGreaterThan(best);
        }
      }
    }
    expect(kinds).toEqual({ 'stopped-one': 48, 'took-best': 19, 'look-two': 9 });
  });
});

/** A level-5 match from the empty board: `her` picks her square; the pet plays `petMove` with `seed`. */
function playMatch(her: (b: Board) => number, seed: number) {
  const moves: number[] = [];
  for (;;) {
    const b = boardAfter(moves);
    moves.push(her(b));
    let a = boardAfter(moves);
    if (wonLine(a, 'shell')) return { moves, result: 'win' as const };
    if (!empties(a).length) return { moves, result: 'tie' as const };
    moves.push(petMove(a, seed));
    a = boardAfter(moves);
    if (wonLine(a, 'pebble')) return { moves, result: 'loss' as const };
  }
}

/** A player who always takes a win and always blocks, otherwise a seeded random empty square. */
const ruleFollower = (rng: Rng) => (b: Board) => {
  const w = winsFor(b, 'shell'),
    p = winsFor(b, 'pebble');
  if (w.length) return w[0];
  if (p.length) return p[0];
  return rng.pick(empties(b));
};

type Rates = [win: number, tie: number, loss: number];

/** Exact rates against the level-5 pet with its quiet moves uniform: `her` lists her equally likely squares. */
function rates(her: (b: Board) => number[]): Rates {
  const memo = new Map<string, Rates>();
  const herTurnRates = (b: Board): Rates => {
    if (wonLine(b, 'pebble')) return [0, 0, 1];
    const k = key(b);
    const hit = memo.get(k);
    if (hit) return hit;
    const out: Rates = [0, 0, 0];
    const choices = her(b);
    for (const c of choices) {
      const r = afterHers(place(b, c, 'shell'));
      for (let j = 0; j < 3; j++) out[j] += r[j] / choices.length;
    }
    memo.set(k, out);
    return out;
  };
  const afterHers = (a: Board): Rates => {
    if (wonLine(a, 'shell')) return [1, 0, 0];
    if (!empties(a).length) return [0, 1, 0];
    const pw = winsFor(a, 'pebble'),
      hw = winsFor(a, 'shell');
    const first = (xs: number[]) => [PREFERENCE.find((i) => xs.includes(i))!];
    const pets = pw.length ? first(pw) : hw.length ? first(hw) : empties(a);
    const out: Rates = [0, 0, 0];
    for (const c of pets) {
      const r = herTurnRates(place(a, c, 'pebble'));
      for (let j = 0; j < 3; j++) out[j] += r[j] / pets.length;
    }
    return out;
  };
  return herTurnRates(Array<null>(9).fill(null));
}

describe('level 5, Play it out', () => {
  it('petMove takes a win, else blocks, on every position with the pet to move; deterministic per board and seed', () => {
    for (const b of PET_TURN) {
      const m = petMove(b, 17);
      expect(b[m]).toBe(null);
      expect(petMove(b, 17)).toBe(m);
      const pw = winsFor(b, 'pebble'),
        hw = winsFor(b, 'shell');
      if (pw.length) expect(pw).toContain(m);
      else if (hw.length) expect(hw).toContain(m);
    }
  });
  it('its quiet moves cover every empty square over many seeds', () => {
    const b = place(Array<null>(9).fill(null), 4, 'shell');
    const seen = new Set(SEEDS.map((seed) => petMove(b, seed)));
    expect([...seen].sort()).toEqual(empties(b));
  });
  it('a lost match always has a turning point; its glowed square never loses by force', () => {
    let losses = 0;
    for (const seed of SEEDS) {
      const { moves, result } = playMatch(ruleFollower(new Rng(seed)), seed);
      // A slip the pet did not punish is exploration: only a lost match rewinds.
      if (result !== 'loss') continue;
      losses++;
      const k = turningPoint(moves)!;
      expect(k).not.toBe(null);
      expect(k % 2).toBe(0);
      const before = boardAfter(moves, k);
      expect(value(before, 'shell')).toBeGreaterThanOrEqual(0);
      expect(value(place(before, moves[k], 'shell'), 'pebble')).toBe(-1);
      const glow = showMeSquare(before);
      expect(value(place(before, glow, 'shell'), 'pebble')).toBeGreaterThanOrEqual(0);
      // Her later moves all kept or already lacked a safe square: none after k is another turning point.
      for (let j = k + 2; j < moves.length; j += 2) expect(value(boardAfter(moves, j), 'shell')).toBe(-1);
    }
    expect(losses).toBeGreaterThan(20);
  });
  it('the ghost (Show me every turn) never lets the pet win, over 300 seeds', () => {
    for (const seed of SEEDS) expect(playMatch(showMeSquare, seed).result).not.toBe('loss');
  });
  it('Show me: her win, else the block, else a minimax-best square (a fork first)', () => {
    for (const b of ALL) {
      const sq = showMeSquare(b);
      expect(b[sq]).toBe(null);
      const hw = winsFor(b, 'shell'),
        pw = winsFor(b, 'pebble');
      if (hw.length) expect(hw).toContain(sq);
      else if (pw.length) expect(pw).toContain(sq);
      else {
        expect(value(place(b, sq, 'shell'), 'pebble')).toBe(value(b, 'shell'));
        const forks = forkSquares(b);
        if (forks.length) expect(forks).toContain(sq);
      }
    }
  });
  it('rates against this pet: the ghost wins 58% and never loses; a win-seeking player 92.7%; a rule-follower 31/52/17', () => {
    const ghost = rates((b) => [showMeSquare(b)]);
    expect(ghost[2]).toBe(0);
    expect(ghost[0]).toBeCloseTo(0.583, 2);
    // Best play against this pet: among squares that cannot lose, the one with the best chance of three.
    const best = (() => {
      const memo = new Map<string, Rates>();
      const herT = (b: Board): Rates => {
        if (wonLine(b, 'pebble')) return [0, 0, 1];
        const k = key(b);
        const hit = memo.get(k);
        if (hit) return hit;
        const opts = empties(b).map((c) => after(place(b, c, 'shell')));
        const safe = opts.filter((r) => r[2] < 1e-12);
        const pick = (safe.length ? safe : opts).reduce((x, y) => (y[0] > x[0] + 1e-12 ? y : x));
        memo.set(k, pick);
        return pick;
      };
      const after = (a: Board): Rates => {
        if (wonLine(a, 'shell')) return [1, 0, 0];
        if (!empties(a).length) return [0, 1, 0];
        const pw = winsFor(a, 'pebble'),
          hw = winsFor(a, 'shell');
        const first = (xs: number[]) => [PREFERENCE.find((i) => xs.includes(i))!];
        const pets = pw.length ? first(pw) : hw.length ? first(hw) : empties(a);
        const out: Rates = [0, 0, 0];
        for (const c of pets) {
          const r = herT(place(a, c, 'pebble'));
          for (let j = 0; j < 3; j++) out[j] += r[j] / pets.length;
        }
        return out;
      };
      return herT(Array<null>(9).fill(null));
    })();
    expect(best[2]).toBe(0);
    expect(Math.abs(best[0] - 0.927)).toBeLessThan(0.01);
    const rule = rates((b) => {
      const w = winsFor(b, 'shell'),
        p = winsFor(b, 'pebble');
      return w.length ? [w[0]] : p.length ? [p[0]] : empties(b);
    });
    expect(Math.abs(rule[0] - 0.31)).toBeLessThan(0.01);
    expect(Math.abs(rule[1] - 0.52)).toBeLessThan(0.01);
    expect(Math.abs(rule[2] - 0.17)).toBeLessThan(0.01);
  });
  it('a round is the empty board with a seed', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const r = makeRound(5, new Rng(seed));
      expect(makeRound(5, new Rng(seed))).toEqual(r);
      expect(r.positions).toHaveLength(1);
      expect(empties(r.positions[0].board)).toHaveLength(9);
      expect(typeof r.seed).toBe('number');
    }
  });
  it('accounting: a pet three is a miss; Show me one hint a turn; the second loss glows once a match', () => {
    const s = new Score();
    expect(s.showMe()).toBe(true);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(1);
    s.newTurn();
    expect(s.glowing).toBe(false);
    expect(s.petWon()).toBe(false);
    expect([s.misses, s.hints]).toEqual([1, 1]);
    s.newTurn();
    expect(s.petWon()).toBe(true);
    s.newTurn();
    s.lightTurningPoint();
    expect([s.misses, s.hints, s.glowing]).toEqual([2, 2, true]);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(2);
    s.newTurn();
    expect(s.petWon()).toBe(false);
    expect([s.misses, s.hints]).toEqual([3, 2]);
  });
});

// ---- level 5, the grown-up seat (batch `shell-rows 3`, docs/definitions/shell-rows-4-5.md#build-batches) ----

describe('level 5, the grown-up seat', () => {
  it('starts with the pet on the pebbles and flips only before the first shell', () => {
    const seat = new GrownUpSeat();
    expect([seat.on, seat.open]).toEqual([false, true]);
    expect(seat.toggle()).toBe(true);
    expect(seat.on).toBe(true);
    expect(seat.toggle()).toBe(true);
    expect(seat.on).toBe(false);
    seat.toggle();
    seat.close();
    expect(seat.toggle()).toBe(false);
    expect([seat.on, seat.open]).toEqual([true, false]);
  });

  it('matchEnd names her three, the pebbles three, a tie, or a game still going', () => {
    expect(matchEnd(boardAfter([]))).toBe(null);
    expect(matchEnd(boardAfter([0, 3, 1, 4, 2]))).toBe('win');
    expect(matchEnd(boardAfter([0, 3, 1, 4, 8, 5]))).toBe('pebble');
    expect(matchEnd(boardAfter([0, 1, 2, 4, 3, 5, 7, 6, 8]))).toBe('tie');
    expect(matchEnd(boardAfter([0, 1, 2, 4]))).toBe(null);
  });

  it('every two-sided game of free taps ends in exactly one of the three endings, the last move deciding it', () => {
    // Any legal sequence a child and a grown-up could tap: the round always completes, and never before an ending.
    let games = 0;
    const seen = new Set<string>();
    const walk = (moves: number[]) => {
      const b = boardAfter(moves);
      const end = matchEnd(b);
      if (end) {
        games++;
        seen.add(end);
        // The side that just moved is the only one that can have three; a tie needs all nine.
        if (end === 'win') expect(moves.length % 2).toBe(1);
        if (end === 'pebble') expect(moves.length % 2).toBe(0);
        if (end === 'tie') expect(moves.length).toBe(9);
        return;
      }
      for (const i of empties(b)) walk([...moves, i]);
    };
    walk([]);
    expect(games).toBe(255168);
    expect([...seen].sort()).toEqual(['pebble', 'tie', 'win']);
  });

  it('the new lines exist', () => {
    for (const k of ['sr.seat-on', 'sr.seat-off', 'sr.pebble-turn', 'sr.pebbles-win'])
      expect(SCRIPT[k as keyof typeof SCRIPT], k).toBeDefined();
  });
});
